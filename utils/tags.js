const GLUCOSE_TAGS = [
  { key: "breakfast_before", label: "早餐前", shortLabel: "早前", group: "breakfast", iconPath: "/assets/lucide/png/sunrise-green.png", activeIconPath: "/assets/lucide/png/sunrise-white.png" },
  { key: "breakfast_after_2h", label: "早餐后", shortLabel: "早后", group: "breakfast", iconPath: "/assets/lucide/png/soup-green.png", activeIconPath: "/assets/lucide/png/soup-white.png" },
  { key: "lunch_before", label: "午餐前", shortLabel: "午前", group: "lunch", iconPath: "/assets/lucide/png/sun-green.png", activeIconPath: "/assets/lucide/png/sun-white.png" },
  { key: "lunch_after_2h", label: "午餐后", shortLabel: "午后", group: "lunch", iconPath: "/assets/lucide/png/utensils-green.png", activeIconPath: "/assets/lucide/png/utensils-white.png" },
  { key: "dinner_before", label: "晚餐前", shortLabel: "晚前", group: "dinner", iconPath: "/assets/lucide/png/sunset-green.png", activeIconPath: "/assets/lucide/png/sunset-white.png" },
  { key: "dinner_after_2h", label: "晚餐后", shortLabel: "晚后", group: "dinner", iconPath: "/assets/lucide/png/moon-green.png", activeIconPath: "/assets/lucide/png/moon-white.png" },
  { key: "bedtime", label: "睡前", shortLabel: "睡前", group: "other", iconPath: "/assets/lucide/png/bed-green.png", activeIconPath: "/assets/lucide/png/bed-white.png" },
  { key: "random", label: "随机", shortLabel: "随机", group: "other", iconPath: "/assets/lucide/png/dice-5-green.png", activeIconPath: "/assets/lucide/png/dice-5-white.png" }
];

const LEGACY_TAG_LABELS = {
  night: "凌晨"
};

function getTagLabel(key) {
  const tag = GLUCOSE_TAGS.find((item) => item.key === key);
  return tag ? tag.label : LEGACY_TAG_LABELS[key] || key;
}

function getTagIconPath(key, active = false) {
  const tag = GLUCOSE_TAGS.find((item) => item.key === key);
  if (!tag) return active ? "/assets/lucide/png/dice-5-white.png" : "/assets/lucide/png/dice-5-green.png";
  return active ? tag.activeIconPath : tag.iconPath;
}

function inferTagByTime(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 9) return "breakfast_before";
  if (hour >= 9 && hour < 11) return "breakfast_after_2h";
  if (hour >= 11 && hour < 13) return "lunch_before";
  if (hour >= 13 && hour < 16) return "lunch_after_2h";
  if (hour >= 17 && hour < 19) return "dinner_before";
  if (hour >= 19 && hour < 22) return "dinner_after_2h";
  if (hour >= 22) return "bedtime";
  if (hour < 5) return "bedtime";

  return "random";
}

module.exports = {
  GLUCOSE_TAGS,
  getTagIconPath,
  getTagLabel,
  inferTagByTime
};
