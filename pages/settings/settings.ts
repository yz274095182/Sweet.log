import { getProfile, getThresholdRules, replaceThresholdRules, saveProfile } from "../../utils/cloud";
import { GLUCOSE_TAGS, getTagLabel } from "../../utils/tags";
import { getNonPregnancyThresholds, getPregnancyThresholds } from "../../utils/thresholds";
import { Profile, ThresholdRule } from "../../types/index";

interface DisplayRule extends ThresholdRule {
  label: string;
  minText: string;
  maxText: string;
}

const defaultProfile: Profile = {
  nickname: "Sweet.log",
  avatarUrl: "",
  isPregnant: true,
  dueDate: "",
  thresholdPreset: "pregnancy"
};

Page({
  data: {
    profile: defaultProfile,
    rules: [] as DisplayRule[],
    saving: false
  },

  async onLoad() {
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
        rules: toDisplayRules(rules)
      });
    } catch (error) {
      this.setData({
        profile: defaultProfile,
        rules: toDisplayRules(getPregnancyThresholds())
      });
      wx.showToast({
        title: "云开发未配置，显示默认值",
        icon: "none"
      });
    }
  },

  onPregnancyChange(event: WechatMiniprogram.SwitchChange) {
    const isPregnant = event.detail.value;
    const profile = {
      ...this.data.profile,
      isPregnant,
      thresholdPreset: isPregnant ? "pregnancy" : "non_pregnancy"
    } as Profile;

    this.setData({
      profile,
      rules: toDisplayRules(isPregnant ? getPregnancyThresholds() : getNonPregnancyThresholds())
    });
  },

  onNicknameInput(event: WechatMiniprogram.Input) {
    this.setData({
      profile: {
        ...this.data.profile,
        nickname: event.detail.value
      }
    });
  },

  onDueDateChange(event: WechatMiniprogram.PickerChange) {
    this.setData({
      profile: {
        ...this.data.profile,
        dueDate: event.detail.value as string
      }
    });
  },

  onRuleInput(event: WechatMiniprogram.Input) {
    const index = Number(event.currentTarget.dataset.index);
    const field = event.currentTarget.dataset.field as "min" | "max";
    const rules = [...this.data.rules];
    const value = event.detail.value;

    rules[index] = {
      ...rules[index],
      [field]: value === "" ? null : Number(value),
      [`${field}Text`]: value
    };

    this.setData({ rules });
  },

  onRuleEnabledChange(event: WechatMiniprogram.SwitchChange) {
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
    if (this.data.saving) return;

    try {
      this.setData({ saving: true });
      const rules = this.data.rules.map(({ label, minText, maxText, ...rule }) => rule);
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
  }
});

function toDisplayRules(rules: ThresholdRule[]): DisplayRule[] {
  const ordered = GLUCOSE_TAGS.map((tag) => {
    const rule = rules.find((item) => item.tag === tag.key) || {
      tag: tag.key,
      min: null,
      max: null,
      enabled: false
    };

    return {
      ...rule,
      label: getTagLabel(rule.tag),
      minText: rule.min === null ? "" : `${rule.min}`,
      maxText: rule.max === null ? "" : `${rule.max}`
    };
  });

  return ordered;
}
