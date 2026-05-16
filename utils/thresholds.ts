import { GlucoseStatus, GlucoseTagKey, ThresholdRule } from "../types/index";

const mealBeforeTags: GlucoseTagKey[] = [
  "breakfast_before",
  "lunch_before",
  "dinner_before"
];

const mealAfterTags: GlucoseTagKey[] = [
  "breakfast_after_2h",
  "lunch_after_2h",
  "dinner_after_2h"
];

export function getPregnancyThresholds(): ThresholdRule[] {
  return [
    ...mealBeforeTags.map((tag) => ({
      tag,
      min: null,
      max: 5.3,
      enabled: true
    })),
    ...mealAfterTags.map((tag) => ({
      tag,
      min: null,
      max: 6.4,
      enabled: true
    })),
    {
      tag: "bedtime",
      min: null,
      max: null,
      enabled: false
    },
    {
      tag: "random",
      min: null,
      max: null,
      enabled: false
    }
  ];
}

export function getNonPregnancyThresholds(): ThresholdRule[] {
  return [
    ...mealBeforeTags.map((tag) => ({
      tag,
      min: null,
      max: null,
      enabled: false
    })),
    ...mealAfterTags.map((tag) => ({
      tag,
      min: null,
      max: null,
      enabled: false
    })),
    {
      tag: "bedtime",
      min: null,
      max: null,
      enabled: false
    },
    {
      tag: "random",
      min: null,
      max: null,
      enabled: false
    }
  ];
}

export function getThresholdForTag(
  rules: ThresholdRule[],
  tag: GlucoseTagKey
): ThresholdRule {
  return (
    rules.find((rule) => rule.tag === tag) || {
      tag,
      min: null,
      max: null,
      enabled: false
    }
  );
}

export function judgeGlucoseStatus(
  value: number,
  rule: ThresholdRule
): GlucoseStatus {
  if (!rule.enabled || (rule.min === null && rule.max === null)) {
    return "unknown";
  }

  if (rule.min !== null && value < rule.min) return "low";
  if (rule.max !== null && value > rule.max) return "high";

  return "normal";
}

export function getStatusText(status: GlucoseStatus): string {
  const map = {
    normal: "正常",
    high: "偏高",
    low: "偏低",
    unknown: "未判定"
  };

  return map[status];
}
