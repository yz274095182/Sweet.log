import { deleteGlucoseRecord, getThresholdRules, listGlucoseRecords, updateGlucoseRecord } from "../../utils/cloud";
import { GLUCOSE_TAGS, getTagLabel } from "../../utils/tags";
import { getStatusText, getThresholdForTag, judgeGlucoseStatus } from "../../utils/thresholds";
import { GlucoseRecord, GlucoseStatus, ThresholdRule } from "../../types/index";

interface DisplayRecord extends GlucoseRecord {
  valueText: string;
  tagLabel: string;
  statusText: string;
  dayText: string;
  timeText: string;
  thresholdText: string;
}

interface TrendPoint {
  id: string;
  valueText: string;
  label: string;
  status: GlucoseStatus;
  left: number;
  top: number;
}

const viewOptions = [
  { key: "table", label: "表格", active: true },
  { key: "list", label: "列表", active: false },
  { key: "trend", label: "趋势", active: false },
  { key: "stats", label: "统计", active: false }
];

const statusOptions = [
  { key: "all", label: "全部", active: true },
  { key: "normal", label: "正常", active: false },
  { key: "high", label: "偏高", active: false },
  { key: "low", label: "偏低", active: false },
  { key: "unknown", label: "未判定", active: false }
];

Page({
  data: {
    allRecords: [] as DisplayRecord[],
    records: [] as DisplayRecord[],
    thresholds: [] as ThresholdRule[],
    loading: false,
    deletingId: "",
    editingRecordId: "",
    editForm: getEmptyEditForm(),
    editTagOptions: GLUCOSE_TAGS,
    editTagIndex: 0,
    savingEdit: false,
    viewOptions,
    statusOptions,
    tagOptions: [] as Array<{ key: string; label: string; active: boolean }>,
    selectedView: "table",
    showTable: true,
    showList: false,
    showTrend: false,
    showStats: false,
    startDate: formatDateInput(getDaysAgo(6)),
    endDate: formatDateInput(new Date()),
    selectedTag: "all",
    selectedStatus: "all",
    tableRows: [] as ReturnType<typeof getTableRows>,
    tableFooterText: "没有更多了",
    trendLine: getEmptyTrendLine(),
    stats: {
      count: 0,
      avg: "--",
      max: "--",
      min: "--",
      highCount: 0,
      normalRate: "--"
    }
  },

  onLoad() {
    this.setData({
      tagOptions: getTagOptions("all")
    });
  },

  onShow() {
    wx.showTabBar({
      animation: false,
      fail() {}
    });
    this.loadRecords();
  },

  async loadRecords() {
    if (this.data.loading) return;

    this.setData({ loading: true });
    wx.showLoading({ title: "读取中" });

    try {
      const [records, thresholds] = await Promise.all([
        listGlucoseRecords(300),
        getThresholdRules()
      ]);
      const displayRecords = records.map((record) => toDisplayRecord(record, thresholds));

      this.setData({
        allRecords: displayRecords,
        thresholds
      });
      this.applyFilters();
    } catch (error) {
      wx.showToast({
        title: "读取失败，请检查云开发",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
      this.setData({ loading: false });
    }
  },

  onSelectView(event: WechatMiniprogram.TouchEvent) {
    const selectedView = event.currentTarget.dataset.key as string;

    this.setData({
      ...getViewState(selectedView),
      viewOptions: viewOptions.map((item) => ({
        ...item,
        active: item.key === selectedView
      }))
    });
  },

  onStartDateChange(event: WechatMiniprogram.PickerChange) {
    let startDate = String(event.detail.value);
    let endDate = this.data.endDate;

    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      endDate = startDate;
    }

    this.setData({ startDate, endDate });
    this.applyFilters();
  },

  onEndDateChange(event: WechatMiniprogram.PickerChange) {
    let endDate = String(event.detail.value);
    let startDate = this.data.startDate;

    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      startDate = endDate;
    }

    this.setData({ startDate, endDate });
    this.applyFilters();
  },

  onSelectTag(event: WechatMiniprogram.TouchEvent) {
    const selectedTag = event.currentTarget.dataset.key as string;

    this.setData({
      selectedTag,
      tagOptions: getTagOptions(selectedTag)
    });
    this.applyFilters();
  },

  onSelectStatus(event: WechatMiniprogram.TouchEvent) {
    const selectedStatus = event.currentTarget.dataset.key as string;

    this.setData({
      selectedStatus,
      statusOptions: statusOptions.map((item) => ({
        ...item,
        active: item.key === selectedStatus
      }))
    });
    this.applyFilters();
  },

  applyFilters() {
    const { allRecords, startDate, endDate, selectedTag, selectedStatus } = this.data;
    const rangeStart = buildStartDate(startDate);
    const rangeEnd = buildEndDate(endDate);

    const records = allRecords.filter((record) => {
      const time = new Date(record.measuredAt).getTime();
      const rangeMatched = time >= rangeStart.getTime() && time <= rangeEnd.getTime();
      const tagMatched = selectedTag === "all" || record.tag === selectedTag;
      const statusMatched = selectedStatus === "all" || record.status === selectedStatus;

      return rangeMatched && tagMatched && statusMatched;
    });

    const tableRows = getTableRows(allRecords, startDate, endDate);

    this.setData({
      records,
      tableRows,
      tableFooterText: hasTableRecord(tableRows) ? "没有更多了" : "该日期范围暂无记录",
      stats: getStats(records),
      trendLine: getTrendLine(records)
    });
  },

  goRecord() {
    wx.switchTab({
      url: "/pages/record/record"
    });
  },

  async onDeleteRecord(event: WechatMiniprogram.TouchEvent) {
    const recordId = event.currentTarget.dataset.id as string;
    if (!recordId || this.data.deletingId) return;

    const confirmed = await confirmDeleteRecord();
    if (!confirmed) return;

    this.setData({ deletingId: recordId });

    try {
      await deleteGlucoseRecord(recordId);
      const allRecords = this.data.allRecords.filter((record) => record._id !== recordId);

      this.setData({ allRecords });
      this.applyFilters();

      wx.showToast({
        title: "已删除",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: "删除失败，请检查云开发",
        icon: "none"
      });
    } finally {
      this.setData({ deletingId: "" });
    }
  },

  onEditRecord(event: WechatMiniprogram.TouchEvent) {
    const recordId = event.currentTarget.dataset.id as string;
    const record = this.data.allRecords.find((item) => item._id === recordId);
    if (!record) return;

    const measuredAt = new Date(record.measuredAt);
    const tagIndex = Math.max(
      GLUCOSE_TAGS.findIndex((tag) => tag.key === record.tag),
      0
    );

    this.setData({
      editingRecordId: recordId,
      editTagIndex: tagIndex,
      editForm: {
        id: recordId,
        value: Number(record.value).toFixed(1),
        tag: record.tag,
        date: formatDateInput(measuredAt),
        time: formatTime(measuredAt),
        note: record.note || ""
      }
    });
  },

  onCancelEdit() {
    if (this.data.savingEdit) return;

    this.setData({
      editingRecordId: "",
      editForm: getEmptyEditForm(),
      editTagIndex: 0
    });
  },

  onEditSheetTap() {},

  onEditValueInput(event: WechatMiniprogram.Input) {
    this.setData({
      "editForm.value": normalizeInputValue(String(event.detail.value || ""))
    });
  },

  onEditTagChange(event: WechatMiniprogram.PickerChange) {
    const index = Number(event.detail.value) || 0;
    const tag = GLUCOSE_TAGS[index] || GLUCOSE_TAGS[0];

    this.setData({
      editTagIndex: index,
      "editForm.tag": tag.key
    });
  },

  onEditDateChange(event: WechatMiniprogram.PickerChange) {
    this.setData({
      "editForm.date": String(event.detail.value)
    });
  },

  onEditTimeChange(event: WechatMiniprogram.PickerChange) {
    this.setData({
      "editForm.time": String(event.detail.value)
    });
  },

  onEditNoteInput(event: WechatMiniprogram.Input) {
    this.setData({
      "editForm.note": String(event.detail.value || "").slice(0, 200)
    });
  },

  async onSaveEdit() {
    if (this.data.savingEdit) return;

    const form = this.data.editForm;
    const value = Number(form.value);

    if (!form.id) return;

    if (!value || value < 1 || value > 30) {
      wx.showToast({
        title: "请输入有效血糖值",
        icon: "none"
      });
      return;
    }

    const measuredAt = new Date(`${form.date}T${form.time}:00`);

    if (Number.isNaN(measuredAt.getTime())) {
      wx.showToast({
        title: "请选择有效时间",
        icon: "none"
      });
      return;
    }

    const rule = getThresholdForTag(this.data.thresholds, form.tag);
    const status = judgeGlucoseStatus(value, rule);

    this.setData({ savingEdit: true });

    try {
      await updateGlucoseRecord(form.id, {
        measuredAt: measuredAt.toISOString(),
        tag: form.tag,
        value: Number(value.toFixed(1)),
        unit: "mmol/L",
        status,
        note: form.note.trim(),
        contextTags: [],
        thresholdMin: rule.enabled ? rule.min : null,
        thresholdMax: rule.enabled ? rule.max : null
      });

      this.setData({
        editingRecordId: "",
        editForm: getEmptyEditForm(),
        editTagIndex: 0
      });

      await this.loadRecords();

      wx.showToast({
        title: "已修改",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: "修改失败，请检查云开发",
        icon: "none"
      });
    } finally {
      this.setData({ savingEdit: false });
    }
  }
});

function getTagOptions(activeKey: string) {
  return [
    { key: "all", label: "全部", active: activeKey === "all" },
    ...GLUCOSE_TAGS.map((tag) => ({
      key: tag.key,
      label: tag.label,
      active: tag.key === activeKey
    }))
  ];
}

function getViewState(selectedView: string) {
  return {
    selectedView,
    showTable: selectedView === "table",
    showList: selectedView === "list",
    showTrend: selectedView === "trend",
    showStats: selectedView === "stats"
  };
}

function getEmptyEditForm() {
  return {
    id: "",
    value: "",
    tag: "breakfast_before" as const,
    date: formatDateInput(new Date()),
    time: formatTime(new Date()),
    note: ""
  };
}

function toDisplayRecord(record: GlucoseRecord, thresholds: ThresholdRule[]): DisplayRecord {
  const date = new Date(record.measuredAt);
  const threshold = getThresholdForTag(thresholds, record.tag);
  const status = judgeGlucoseStatus(Number(record.value), threshold);

  return {
    ...record,
    status,
    valueText: Number(record.value).toFixed(1),
    tagLabel: getTagLabel(record.tag),
    statusText: getStatusText(status),
    dayText: formatDayLabel(date),
    timeText: formatTime(date),
    thresholdText: formatThreshold(threshold)
  };
}

function getStats(records: DisplayRecord[]) {
  if (!records.length) {
    return {
      count: 0,
      avg: "--",
      max: "--",
      min: "--",
      highCount: 0,
      normalRate: "--"
    };
  }

  const values = records.map((record) => Number(record.value));
  const total = values.reduce((sum, value) => sum + value, 0);
  const normalCount = records.filter((record) => record.status === "normal").length;

  return {
    count: records.length,
    avg: (total / records.length).toFixed(1),
    max: Math.max(...values).toFixed(1),
    min: Math.min(...values).toFixed(1),
    highCount: records.filter((record) => record.status === "high").length,
    normalRate: `${Math.round((normalCount / records.length) * 100)}%`
  };
}

function getTableRows(records: DisplayRecord[], startDate: string, endDate: string) {
  const start = buildStartDate(startDate);
  const end = buildStartDate(endDate);
  const recordMap = records.reduce<Record<string, DisplayRecord[]>>((map, record) => {
    const key = formatDateInput(new Date(record.measuredAt));
    if (!map[key]) map[key] = [];
    map[key].push(record);
    return map;
  }, {});

  const rows = [];
  const cursor = new Date(end);
  while (cursor.getTime() >= start.getTime()) {
    const dateKey = formatDateInput(cursor);
    const dayRecords = recordMap[dateKey] || [];

    rows.push({
      dateKey,
      dateLabel: `${cursor.getMonth() + 1}-${pad2(cursor.getDate())}`,
      weekday: getWeekdayLabel(cursor),
      breakfastBefore: getTableCell(dayRecords, "breakfast_before"),
      breakfastAfter: getTableCell(dayRecords, "breakfast_after_2h"),
      lunchBefore: getTableCell(dayRecords, "lunch_before"),
      lunchAfter: getTableCell(dayRecords, "lunch_after_2h"),
      dinnerBefore: getTableCell(dayRecords, "dinner_before"),
      dinnerAfter: getTableCell(dayRecords, "dinner_after_2h"),
      bedtime: getTableCell(dayRecords, "bedtime"),
      random: getTableCell(dayRecords, "random")
    });

    cursor.setDate(cursor.getDate() - 1);
  }

  return rows;
}

function getTableCell(records: DisplayRecord[], tag: string) {
  const matched = records
    .filter((record) => record.tag === tag)
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());

  if (!matched.length) return { text: "", status: "empty" };

  const latestRecord = matched[matched.length - 1];

  return {
    text: Number(latestRecord.value).toFixed(1),
    status: latestRecord.status
  };
}

function hasTableRecord(rows: ReturnType<typeof getTableRows>): boolean {
  return rows.some((row) =>
    [
      row.breakfastBefore,
      row.breakfastAfter,
      row.lunchBefore,
      row.lunchAfter,
      row.dinnerBefore,
      row.dinnerAfter,
      row.bedtime,
      row.random
    ].some((cell) => cell.text)
  );
}

function getEmptyTrendLine() {
  return {
    points: [] as TrendPoint[],
    segments: [] as Array<{ id: string; left: number; top: number; width: number; angle: number; status: GlucoseStatus }>,
    minLabel: "--",
    midLabel: "--",
    maxLabel: "--"
  };
}

function getTrendLine(records: DisplayRecord[]) {
  const recent = records.slice(0, 7).reverse();

  if (!recent.length) return getEmptyTrendLine();

  const values = recent.map((record) => Number(record.value));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = Math.max((maxValue - minValue) * 0.18, 0.4);
  const min = Math.max(0, minValue - padding);
  const max = maxValue + padding;
  const span = Math.max(max - min, 1);
  const chartWidth = 560;
  const chartHeight = 150;
  const step = recent.length > 1 ? chartWidth / (recent.length - 1) : 0;

  const points: TrendPoint[] = recent.map((record, index) => {
    const value = Number(record.value);
    const left = Math.round(recent.length === 1 ? chartWidth / 2 : index * step);
    const top = Math.round(((max - value) / span) * chartHeight);
    const date = new Date(record.measuredAt);

    return {
      id: record._id || `${record.measuredAt}-${record.tag}`,
      valueText: value.toFixed(1),
      label: formatTrendPointLabel(date),
      status: record.status,
      left,
      top
    };
  });

  const segments = points.slice(1).map((point, index) => {
    const prev = points[index];
    const dx = point.left - prev.left;
    const dy = point.top - prev.top;
    const width = Math.round(Math.sqrt(dx * dx + dy * dy));
    const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

    return {
      id: `${prev.id}-${point.id}`,
      left: prev.left,
      top: prev.top,
      width,
      angle,
      status: point.status
    };
  });

  return {
    points,
    segments,
    minLabel: min.toFixed(1),
    midLabel: ((min + max) / 2).toFixed(1),
    maxLabel: max.toFixed(1)
  };
}

function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildStartDate(value: string): Date {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? getDaysAgo(6) : date;
}

function buildEndDate(value: string): Date {
  const date = new Date(`${value}T23:59:59`);
  const fallback = new Date();
  fallback.setHours(23, 59, 59, 999);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function formatDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function getWeekdayLabel(date: Date): string {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
}

function pad2(value: number): string {
  return `${value}`.padStart(2, "0");
}

function formatDayLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((today - target) / 86400000);

  if (diff === 0) return "今天";
  if (diff === 1) return "昨天";

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${month}-${day}`;
}

function formatTime(date: Date): string {
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${hour}:${minute}`;
}

function formatTrendPointLabel(date: Date): string {
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${hour}:${minute}`;
}

function normalizeInputValue(value: string): string {
  const normalized = value.replace(/[^\d.]/g, "");
  const parts = normalized.split(".");

  if (parts.length <= 1) return normalized.slice(0, 2);

  return `${parts[0].slice(0, 2)}.${parts[1].slice(0, 1)}`;
}

function confirmDeleteRecord(): Promise<boolean> {
  return new Promise((resolve) => {
    wx.showModal({
      title: "删除这条记录？",
      content: "删除后无法恢复，确认删除吗？",
      confirmText: "删除",
      confirmColor: "#bc4b42",
      cancelText: "取消",
      success: (result) => resolve(!!result.confirm),
      fail: () => resolve(false)
    });
  });
}

function formatThreshold(rule: ThresholdRule): string {
  if (!rule.enabled || (rule.min === null && rule.max === null)) {
    return "未设置";
  }

  if (rule.min !== null && rule.min !== undefined && rule.max !== null && rule.max !== undefined) {
    return `${rule.min}-${rule.max}`;
  }

  if (rule.max !== null && rule.max !== undefined) {
    return `≤${rule.max}`;
  }

  if (rule.min !== null && rule.min !== undefined) {
    return `≥${rule.min}`;
  }

  return "未设置";
}
