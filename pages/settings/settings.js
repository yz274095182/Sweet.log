const {
  getProfile,
  getThresholdRules,
  listGlucoseRecords,
  replaceThresholdRules,
  saveProfile
} = require("../../utils/cloud");
const { GLUCOSE_TAGS, getTagLabel } = require("../../utils/tags");
const { getNonPregnancyThresholds, getPregnancyThresholds, getStatusText } = require("../../utils/thresholds");

const defaultProfile = {
  nickname: "Sweet.log",
  avatarUrl: "",
  isPregnant: true,
  dueDate: "",
  thresholdPreset: "pregnancy"
};

Page({
  data: {
    profile: defaultProfile,
    dueDateText: "暂不设置",
    rules: [],
    saving: false,
    exporting: false,
    exportText: "导出"
  },

  async onLoad() {
    await this.loadSettings();
  },

  async onShow() {
    wx.showTabBar({
      animation: false,
      fail() {}
    });
    await this.loadSettings();
  },

  async loadSettings() {
    try {
      const profile = (await getProfile()) || defaultProfile;
      let rules = await getThresholdRules();

      if (!rules.length) {
        rules = profile.isPregnant ? getPregnancyThresholds() : getNonPregnancyThresholds();
      }

      this.setData({
        profile,
        dueDateText: profile.dueDate || "暂不设置",
        rules: toDisplayRules(rules)
      });
    } catch (error) {
      this.setData({
        profile: defaultProfile,
        dueDateText: "暂不设置",
        rules: toDisplayRules(getPregnancyThresholds())
      });
      wx.showToast({
        title: "云开发未配置，显示默认值",
        icon: "none"
      });
    }
  },

  onPregnancyChange(event) {
    const isPregnant = event.detail.value;
    const profile = {
      ...this.data.profile,
      isPregnant,
      thresholdPreset: isPregnant ? "pregnancy" : "non_pregnancy"
    };

    this.setData({
      profile,
      rules: toDisplayRules(isPregnant ? getPregnancyThresholds() : getNonPregnancyThresholds())
    });
  },

  onNicknameInput(event) {
    this.setData({
      profile: {
        ...this.data.profile,
        nickname: event.detail.value
      }
    });
  },

  onDueDateChange(event) {
    this.setData({
      profile: {
        ...this.data.profile,
        dueDate: event.detail.value
      },
      dueDateText: event.detail.value || "暂不设置"
    });
  },

  onRuleInput(event) {
    const index = Number(event.currentTarget.dataset.index);
    const field = event.currentTarget.dataset.field;
    const rules = [...this.data.rules];
    const value = event.detail.value;

    rules[index] = {
      ...rules[index],
      [field]: value === "" ? null : Number(value),
      [`${field}Text`]: value
    };

    this.setData({ rules });
  },

  onRuleEnabledChange(event) {
    const index = Number(event.currentTarget.dataset.index);
    const rules = [...this.data.rules];

    rules[index] = {
      ...rules[index],
      enabled: event.detail.value
    };

    this.setData({ rules });
  },

  onResetDefaults() {
    const rules = this.data.profile.isPregnant
      ? getPregnancyThresholds()
      : getNonPregnancyThresholds();

    this.setData({
      rules: toDisplayRules(rules)
    });
  },

  async onSave() {
    if (this.data.saving || this.data.exporting) return;

    try {
      this.setData({ saving: true });
      const rules = this.data.rules.map(({ label, minText, maxText, summary, ...rule }) => rule);
      await saveProfile(this.data.profile);
      await replaceThresholdRules(rules);

      wx.showToast({
        title: "已保存",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: "保存失败，请检查云开发",
        icon: "none"
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  async onExportCsv() {
    if (this.data.exporting || this.data.saving) return;

    this.setData({
      exporting: true,
      exportText: "导出中"
    });
    wx.showLoading({ title: "导出中" });

    try {
      const records = await listGlucoseRecords(1000);

      if (!records.length) {
        wx.showToast({
          title: "暂无记录可导出",
          icon: "none"
        });
        return;
      }

      const csv = buildCsv(records, this.data.profile);
      const filePath = `${wx.env.USER_DATA_PATH}/sweet-log-${formatFileDate(new Date())}.csv`;

      wx.getFileSystemManager().writeFileSync(filePath, csv, "utf8");

      if (wx.shareFileMessage) {
        wx.shareFileMessage({
          filePath,
          fileName: `sweet-log-${formatFileDate(new Date())}.csv`,
          fail() {
            wx.showToast({
              title: "导出文件已生成",
              icon: "none"
            });
          }
        });
      } else {
        wx.showToast({
          title: "导出文件已生成",
          icon: "success"
        });
      }
    } catch (error) {
      wx.showToast({
        title: "导出失败，请稍后再试",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
      this.setData({
        exporting: false,
        exportText: "导出"
      });
    }
  }
});

function toDisplayRules(rules) {
  return GLUCOSE_TAGS.map((tag) => {
    const rule =
      rules.find((item) => item.tag === tag.key) || {
        tag: tag.key,
        min: null,
        max: null,
        enabled: false
      };

    return {
      ...rule,
      label: getTagLabel(rule.tag),
      minText: rule.min === null ? "" : `${rule.min}`,
      maxText: rule.max === null ? "" : `${rule.max}`,
      summary: getRuleSummary(rule)
    };
  });
}

function getRuleSummary(rule) {
  if (!rule.enabled) return "未启用";
  if (rule.min !== null && rule.max !== null) return `${rule.min}-${rule.max}`;
  if (rule.max !== null) return `≤ ${rule.max}`;
  if (rule.min !== null) return `≥ ${rule.min}`;
  return "未设置";
}

function buildCsv(records, profile) {
  const header = [
    "测量时间",
    "标签",
    "血糖值",
    "单位",
    "状态",
    "备注",
    "孕期模式",
    "阈值下限",
    "阈值上限"
  ];

  const rows = records.map((record) => [
    formatCsvDate(new Date(record.measuredAt)),
    getTagLabel(record.tag),
    Number(record.value).toFixed(1),
    "mmol/L",
    getStatusText(record.status),
    record.note || "",
    profile.isPregnant ? "是" : "否",
    record.thresholdMin === null || record.thresholdMin === undefined ? "" : record.thresholdMin,
    record.thresholdMax === null || record.thresholdMax === undefined ? "" : record.thresholdMax
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
}

function escapeCsvCell(value) {
  const text = String(value === null || value === undefined ? "" : value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatCsvDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function formatFileDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}
