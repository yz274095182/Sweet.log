export type GlucoseTagKey =
  | "breakfast_before"
  | "breakfast_after_2h"
  | "lunch_before"
  | "lunch_after_2h"
  | "dinner_before"
  | "dinner_after_2h"
  | "bedtime"
  | "night"
  | "random";

export type GlucoseStatus = "normal" | "high" | "low" | "unknown";

export interface GlucoseTag {
  key: GlucoseTagKey;
  label: string;
  shortLabel: string;
  group: "breakfast" | "lunch" | "dinner" | "other";
  iconPath: string;
  activeIconPath: string;
}

export interface ThresholdRule {
  _id?: string;
  tag: GlucoseTagKey;
  min: number | null;
  max: number | null;
  enabled: boolean;
}

export interface Profile {
  _id?: string;
  nickname: string;
  avatarUrl: string;
  isPregnant: boolean;
  dueDate: string;
  thresholdPreset: "pregnancy" | "custom" | "non_pregnancy";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GlucoseRecord {
  _id?: string;
  measuredAt: string;
  tag: GlucoseTagKey;
  value: number;
  unit: "mmol/L";
  status: GlucoseStatus;
  note: string;
  contextTags: string[];
  thresholdMin: number | null;
  thresholdMax: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}
