import {
  addGlucoseRecord,
  getGlucoseRecordByTagBetween,
  getLatestGlucoseRecord,
  getLatestGlucoseRecordByTag,
  getProfile,
  getThresholdRules,
  listGlucoseRecordsByTagSince,
  replaceThresholdRules,
  updateGlucoseRecord
} from "../../utils/cloud";
import { formatDateTime } from "../../utils/date";
import { GLUCOSE_TAGS, getTagIconPath, getTagLabel, inferTagByTime } from "../../utils/tags";
import {
  getNonPregnancyThresholds,
  getPregnancyThresholds,
  getStatusText,
  getThresholdForTag,
  judgeGlucoseStatus
} from "../../utils/thresholds";
import { GlucoseRecord, GlucoseStatus, GlucoseTag, GlucoseTagKey, ThresholdRule } from "../../types/index";

Page({
  data: {
    value: "",
    note: "",
    selectedTag: inferTagByTime(),
    selectedTagLabel: getTagLabel(inferTagByTime()),
    selectedTagIconPath: getTagIconPath(inferTagByTime()),
    visibleTags: [] as GlucoseTag[],
    showAllTags: false,
    showTagPicker: false,
    measuredAt: Date.now(),
    dateText: formatDisplayTime(new Date()),
    ...buildDatetimeState(new Date()),
    status: "unknown" as GlucoseStatus,
    statusText: "未判定",
    saveButtonText: "保存记录",
    thresholdText: "读取阈值中...",
    valueHint: "输入本次测量值",
    quickValueText: "常用 --",
    previousRecordText: "暂无上一条记录",
    isPregnant: true,
    heroImagePath: "/assets/hero-family-transparent.png",
    thresholds: [] as ThresholdRule[],
    userEditedValue: false,
    userSelectedTag: false,
    saving: false
  },

  async onLoad() {
    this.refreshVisibleTags();
    await this.loadThresholds();
    await this.loadRecordHints();
    this.updateJudgement();
  },

  async onShow() {
    wx.showTabBar({
      animation: false,
      fail() {}
    });

    const selectedTag = this.data.userSelectedTag
      ? (this.data.selectedTag as GlucoseTagKey)
      : inferTagByTime();

    this.setData({
      selectedTag,
      selectedTagLabel: getTagLabel(selectedTag),
      selectedTagIconPath: getTagIconPath(selectedTag),
      measuredAt: Date.now(),
      dateText: formatDisplayTime(new Date()),
      ...buildDatetimeState(new Date())
    });

    this.refreshVisibleTags();
    await this.loadThresholds();
    await this.loadRecordHints();
    this.updateJudgement();
  },

  onValueInput(event: WechatMiniprogram.Input) {
    const rawValue = String(event.detail.value || "");
    const nextValue = normalizeInputValue(rawValue);

    this.setData({
      value: nextValue,
      userEditedValue: true
    });
    this.updateJudgement();
  },

  onNoteInput(event: WechatMiniprogram.Input) {
    this.setData({
      note: event.detail.value
    });
  },

  async onSelectTag(event: WechatMiniprogram.TouchEvent) {
    const selectedTag = event.currentTarget.dataset.key as GlucoseTagKey;

    this.setData({
      selectedTag,
      selectedTagLabel: getTagLabel(selectedTag),
      selectedTagIconPath: getTagIconPath(selectedTag),
      userEditedValue: false,
      userSelectedTag: true,
      showTagPicker: false
    });

    this.refreshVisibleTags();
    await this.loadRecordHints();
    this.updateJudgement();
  },

  onToggleTags() {
    this.setData({
      showAllTags: !this.data.showAllTags
    });
    this.refreshVisibleTags();
  },

  onToggleTagPicker() {
    this.setData({
      showTagPicker: !this.data.showTagPicker
    });
    this.refreshVisibleTags();
  },

  onTagPickerTap() {},

  onPageTap() {
    if (!this.data.showTagPicker) return;

    this.setData({
      showTagPicker: false
    });
  },

  onDatetimeColumnChange(event: WechatMiniprogram.PickerColumnChange) {
    const column = Number(event.detail.column);
    const value = Number(event.detail.value);
    const datetimeValue = [...this.data.datetimeValue];
    datetimeValue[column] = value;

    const state = buildDatetimeStateFromValue(this.data.datetimeColumns, datetimeValue);
    this.setData(state);
  },

  async onDatetimeChange(event: WechatMiniprogram.PickerChange) {
    const datetimeValue = (event.detail.value as number[]).map(Number);
    const state = buildDatetimeStateFromValue(this.data.datetimeColumns, datetimeValue);
    const measuredAtDate = getDateFromDatetimeState(state.datetimeColumns, state.datetimeValue);

    const inferredTag = this.data.userSelectedTag
      ? (this.data.selectedTag as GlucoseTagKey)
      : inferTagByTime(measuredAtDate);

    this.setData({
      measuredAt: measuredAtDate.getTime(),
      dateText: formatDisplayTime(measuredAtDate),
      ...state,
      selectedTag: inferredTag,
      selectedTagLabel: getTagLabel(inferredTag),
      selectedTagIconPath: getTagIconPath(inferredTag)
    });

    this.refreshVisibleTags();
    await this.loadRecordHints();
    this.updateJudgement();
  },

  onAdjustValue(event: WechatMiniprogram.TouchEvent) {
    const delta = Number(event.currentTarget.dataset.delta);
    const current = Number(this.data.value || 0);
    const next = clampGlucoseValue(current + delta);

    this.setData({
      value: next.toFixed(1),
      userEditedValue: true
    });
    this.updateJudgement();
  },

  onUseQuickValue() {
    const quick = parseFloat(this.data.quickValueText.replace(/[^\d.]/g, ""));

    if (!quick) return;

    this.setData({
      value: quick.toFixed(1),
      userEditedValue: true
    });
    this.updateJudgement();
  },

  async loadThresholds() {
    try {
      const profile = await getProfile();
      let thresholds = await getThresholdRules();

      if (!thresholds.length) {
        thresholds = profile?.isPregnant ? getPregnancyThresholds() : getNonPregnancyThresholds();
        await replaceThresholdRules(thresholds);
      }

      const isPregnant = profile ? !!profile.isPregnant : true;

      this.setData({
        thresholds,
        isPregnant,
        heroImagePath: getHeroImagePath(isPregnant)
      });
    } catch (error) {
      this.setData({
        isPregnant: true,
        heroImagePath: getHeroImagePath(true),
        thresholds: getPregnancyThresholds(),
        thresholdText: "云开发未配置时会使用本地孕期预设"
      });
    }
  },

  async loadRecordHints() {
    const tag = this.data.selectedTag as GlucoseTagKey;

    try {
      const [latestSameTag, recentSameTagRecords, latestRecord] = await Promise.all([
        getLatestGlucoseRecordByTag(tag),
        listGlucoseRecordsByTagSince(tag, getSevenDaysAgo()),
        getLatestGlucoseRecord()
      ]);

      const defaultValue = getDefaultValue(latestSameTag, recentSameTagRecords);
      const valueHint = getValueHint(latestSameTag, recentSameTagRecords);
      const nextValue = this.data.userEditedValue ? this.data.value : defaultValue;

      this.setData({
        value: nextValue,
        valueHint,
        quickValueText: defaultValue ? `常用 ${defaultValue}` : "常用 --",
        previousRecordText: formatPreviousRecordText(latestRecord)
      });
    } catch (error) {
      this.setData({
        valueHint: "建议值读取失败，可手动输入",
        quickValueText: "常用 --"
      });
    }
  },

  updateJudgement() {
    const value = Number(this.data.value);
    const tag = this.data.selectedTag as GlucoseTagKey;
    const rule = getThresholdForTag(this.data.thresholds, tag);
    const status = value > 0 ? judgeGlucoseStatus(value, rule) : "unknown";
    const statusText = getStatusText(status);
    const thresholdText = formatThresholdText(tag, rule);

    this.setData({
      status,
      statusText,
      thresholdText,
      saveButtonText: value > 0 ? `保存记录，当前${statusText}` : "保存记录"
    });
  },

  async onSave() {
    if (this.data.saving) return;

    const value = Number(this.data.value);

    if (!value || value < 1 || value > 30) {
      wx.showToast({
        title: "请输入有效血糖值",
        icon: "none"
      });
      return;
    }

    const tag = this.data.selectedTag as GlucoseTagKey;
    const rule = getThresholdForTag(this.data.thresholds, tag);
    const status = judgeGlucoseStatus(value, rule);
    const measuredAt = new Date(this.data.measuredAt);
    const recordPayload: GlucoseRecord = {
      measuredAt: measuredAt.toISOString(),
      tag,
      value: Number(value.toFixed(1)),
      unit: "mmol/L",
      status,
      note: this.data.note.trim(),
      contextTags: [],
      thresholdMin: rule.enabled ? rule.min : null,
      thresholdMax: rule.enabled ? rule.max : null
    };

    try {
      this.setData({ saving: true });
      const dayRange = getDayRange(measuredAt);
      const existingRecord = await getGlucoseRecordByTagBetween(tag, dayRange.start, dayRange.end);
      let toastTitle = "已保存";

      if (existingRecord?._id) {
        const confirmed = await confirmOverwriteRecord(existingRecord);
        if (!confirmed) return;

        await updateGlucoseRecord(existingRecord._id, recordPayload);
        toastTitle = "已覆盖";
      } else {
        await addGlucoseRecord(recordPayload);
      }

      wx.showToast({
        title: toastTitle,
        icon: "success"
      });

      this.setData({
        note: "",
        userEditedValue: false,
        userSelectedTag: false,
        measuredAt: Date.now(),
        dateText: formatDisplayTime(new Date()),
        ...buildDatetimeState(new Date())
      });

      await this.loadRecordHints();
      this.updateJudgement();
    } catch (error) {
      wx.showToast({
        title: "保存失败，请检查云开发",
        icon: "none"
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  goHistory() {
    wx.switchTab({
      url: "/pages/history/history"
    });
  },

  refreshVisibleTags() {
    const selectedTag = this.data.selectedTag as GlucoseTagKey;
    const visibleTags = this.data.showAllTags
      ? GLUCOSE_TAGS
      : getRecommendedTags(selectedTag);

    this.setData({
      visibleTags: visibleTags.map((tag) => ({
        ...tag,
        active: tag.key === selectedTag,
        displayIconPath: getTagIconPath(tag.key, tag.key === selectedTag)
      }))
    });
  }
});

function getRecommendedTags(selectedTag: GlucoseTagKey): GlucoseTag[] {
  const index = GLUCOSE_TAGS.findIndex((tag) => tag.key === selectedTag);
  const safeIndex = index >= 0 ? index : 0;
  const start = Math.max(0, Math.min(safeIndex - 1, GLUCOSE_TAGS.length - 3));

  return GLUCOSE_TAGS.slice(start, start + 3);
}

function getDefaultValue(
  latestSameTag: GlucoseRecord | null,
  recentSameTagRecords: GlucoseRecord[]
): string {
  if (latestSameTag?.value) {
    return Number(latestSameTag.value).toFixed(1);
  }

  if (recentSameTagRecords.length) {
    const total = recentSameTagRecords.reduce((sum, record) => sum + Number(record.value), 0);
    return (total / recentSameTagRecords.length).toFixed(1);
  }

  return "5.8";
}

function getValueHint(
  latestSameTag: GlucoseRecord | null,
  recentSameTagRecords: GlucoseRecord[]
): string {
  if (latestSameTag?.value) return "来自上一次同标签记录，可直接修改";
  if (recentSameTagRecords.length) return "来自近 7 天平均值，可直接修改";
  return "建议值，可直接修改";
}

function formatPreviousRecordText(record: GlucoseRecord | null): string {
  if (!record) return "暂无上一条记录";

  const time = new Date(record.measuredAt);
  const hour = `${time.getHours()}`.padStart(2, "0");
  const minute = `${time.getMinutes()}`.padStart(2, "0");

  return `上一条：${getTagLabel(record.tag)} ${Number(record.value).toFixed(1)} · ${hour}:${minute}`;
}

function formatDisplayTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");

  if (isToday) return `今天 ${hour}:${minute}`;
  return formatDateTime(date);
}

function getSevenDaysAgo(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date;
}

function getHeroImagePath(isPregnant: boolean): string {
  return isPregnant ? "/assets/hero-family-transparent.png" : "/assets/hero-cat.png";
}

function getDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function confirmOverwriteRecord(record: GlucoseRecord): Promise<boolean> {
  return new Promise((resolve) => {
    wx.showModal({
      title: "覆盖已有记录？",
      content: `${formatDisplayTime(record.measuredAt)} 已有${getTagLabel(record.tag)} ${Number(record.value).toFixed(1)} mmol/L，是否覆盖？`,
      confirmText: "覆盖",
      cancelText: "取消",
      success: (result) => resolve(!!result.confirm),
      fail: () => resolve(false)
    });
  });
}

function clampGlucoseValue(value: number): number {
  if (Number.isNaN(value) || value < 1) return 1;
  if (value > 30) return 30;
  return Math.round(value * 10) / 10;
}

function normalizeInputValue(value: string): string {
  const normalized = value.replace(/[^\d.]/g, "");
  const parts = normalized.split(".");

  if (parts.length <= 1) return normalized.slice(0, 2);

  return `${parts[0].slice(0, 2)}.${parts[1].slice(0, 1)}`;
}

function formatThresholdText(tag: GlucoseTagKey, rule: ThresholdRule): string {
  if (!rule.enabled || (rule.min === null && rule.max === null)) {
    return `${getTagLabel(tag)}暂未设置警戒线`;
  }

  if (rule.min !== null && rule.max !== null) {
    return `${getTagLabel(tag)}目标：${rule.min}-${rule.max} mmol/L`;
  }

  if (rule.max !== null) {
    return `${getTagLabel(tag)}目标：不高于 ${rule.max} mmol/L`;
  }

  return `${getTagLabel(tag)}目标：不低于 ${rule.min} mmol/L`;
}

function buildDatetimeState(date: Date) {
  const columns = buildDatetimeColumns(date.getFullYear(), date.getMonth() + 1);
  const value = [
    columns[0].indexOf(`${date.getFullYear()}年`),
    date.getMonth(),
    date.getDate() - 1,
    date.getHours(),
    date.getMinutes()
  ].map((item) => Math.max(item, 0));

  return buildDatetimeStateFromValue(columns, value);
}

function buildDatetimeStateFromValue(columns: string[][], value: number[]) {
  const year = parseInt(columns[0][value[0]], 10);
  const month = parseInt(columns[1][value[1]], 10);
  const nextColumns = buildDatetimeColumns(year, month);
  const nextValue = [...value];
  nextValue[2] = Math.min(nextValue[2], nextColumns[2].length - 1);

  const date = getDateFromDatetimeState(nextColumns, nextValue);

  return {
    datetimeColumns: nextColumns,
    datetimeValue: nextValue,
    datetimeText: formatDatetimeText(date)
  };
}

function getDateFromDatetimeState(columns: string[][], value: number[]): Date {
  const year = parseInt(columns[0][value[0]], 10);
  const month = parseInt(columns[1][value[1]], 10);
  const day = parseInt(columns[2][value[2]], 10);
  const hour = parseInt(columns[3][value[3]], 10);
  const minute = parseInt(columns[4][value[4]], 10);

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function buildDatetimeColumns(year: number, month: number): string[][] {
  const now = new Date();
  const years = [];
  for (let item = now.getFullYear() - 2; item <= now.getFullYear() + 1; item += 1) {
    years.push(`${item}年`);
  }

  return [
    years,
    range(1, 12).map((item) => `${pad2(item)}月`),
    range(1, getMonthDayCount(year, month)).map((item) => `${pad2(item)}日`),
    range(0, 23).map((item) => `${pad2(item)}时`),
    range(0, 59).map((item) => `${pad2(item)}分`)
  ];
}

function getMonthDayCount(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function range(start: number, end: number): number[] {
  const result = [];
  for (let item = start; item <= end; item += 1) result.push(item);
  return result;
}

function pad2(value: number): string {
  return `${value}`.padStart(2, "0");
}

function formatDatetimeText(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
