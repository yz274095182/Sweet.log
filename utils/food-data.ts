export type FoodCategoryKey = "all" | "staple" | "protein" | "vegetable" | "fruit" | "drink" | "snack";
export type FoodFriendliness = "推荐" | "适量" | "谨慎";
export type GiLevel = "low" | "medium" | "high" | "unknown";
export type MealTypeKey = "all" | "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodItem {
  id: string;
  name: string;
  category: Exclude<FoodCategoryKey, "all">;
  friendliness: FoodFriendliness;
  giLevel: GiLevel;
  portion: string;
  description: string;
  tips: string;
}

export interface RecipeItem {
  id: string;
  mealType: Exclude<MealTypeKey, "all">;
  title: string;
  foods: string[];
  portion: string;
  steps: string;
  tips: string;
}

export const FOOD_CATEGORIES: Array<{ key: FoodCategoryKey; label: string }> = [
  { key: "all", label: "全部" },
  { key: "staple", label: "主食" },
  { key: "protein", label: "蛋白质" },
  { key: "vegetable", label: "蔬菜" },
  { key: "fruit", label: "水果" },
  { key: "drink", label: "饮品" },
  { key: "snack", label: "加餐" }
];

export const MEAL_TYPES: Array<{ key: MealTypeKey; label: string }> = [
  { key: "all", label: "不限" },
  { key: "breakfast", label: "早餐" },
  { key: "lunch", label: "午餐" },
  { key: "dinner", label: "晚餐" },
  { key: "snack", label: "加餐" }
];

export const FOODS: FoodItem[] = [
  { id: "oatmeal", name: "燕麦片", category: "staple", friendliness: "推荐", giLevel: "medium", portion: "干重 30-40g", description: "膳食纤维较多，适合作为早餐主食的一部分。", tips: "选择原味燕麦，避免即食甜味款。" },
  { id: "brown-rice", name: "糙米饭", category: "staple", friendliness: "适量", giLevel: "medium", portion: "熟重半碗左右", description: "比精白米饭更有饱腹感，但仍属于主食。", tips: "可和杂豆、蔬菜、蛋白质搭配。" },
  { id: "sweet-potato", name: "红薯", category: "staple", friendliness: "适量", giLevel: "medium", portion: "小个半根到 1 根", description: "可替代部分米饭，不建议主食叠加过多。", tips: "蒸煮优先，少做拔丝、油炸。" },
  { id: "white-rice", name: "白米饭", category: "staple", friendliness: "谨慎", giLevel: "high", portion: "少量，按个人目标调整", description: "升糖相对较快，适合减少份量并搭配蛋白质和蔬菜。", tips: "不要和粥、面点等主食大量叠加。" },
  { id: "egg", name: "鸡蛋", category: "protein", friendliness: "推荐", giLevel: "low", portion: "1 个", description: "优质蛋白来源，适合早餐或加餐搭配。", tips: "水煮、蒸蛋更清爽。" },
  { id: "chicken-breast", name: "鸡胸肉", category: "protein", friendliness: "推荐", giLevel: "low", portion: "掌心大小 1 份", description: "脂肪较低，适合搭配蔬菜和少量主食。", tips: "少用糖醋、蜜汁等做法。" },
  { id: "tofu", name: "豆腐", category: "protein", friendliness: "推荐", giLevel: "low", portion: "半盒到 1 盒", description: "植物蛋白来源，口感温和，适合日常搭配。", tips: "注意少油烹调。" },
  { id: "fish", name: "清蒸鱼", category: "protein", friendliness: "推荐", giLevel: "low", portion: "掌心大小 1 份", description: "蛋白质丰富，适合午餐或晚餐。", tips: "少用重油重盐酱汁。" },
  { id: "broccoli", name: "西兰花", category: "vegetable", friendliness: "推荐", giLevel: "low", portion: "1-2 拳", description: "膳食纤维丰富，适合与主食、蛋白质搭配。", tips: "清炒、焯拌都可以，少勾芡。" },
  { id: "cucumber", name: "黄瓜", category: "vegetable", friendliness: "推荐", giLevel: "low", portion: "1 根左右", description: "清爽低负担，适合作为配菜。", tips: "凉拌时少糖少油。" },
  { id: "spinach", name: "菠菜", category: "vegetable", friendliness: "推荐", giLevel: "low", portion: "1-2 拳", description: "绿叶菜适合增加餐盘体积和饱腹感。", tips: "焯水后再烹调口感更好。" },
  { id: "corn", name: "玉米", category: "vegetable", friendliness: "适量", giLevel: "medium", portion: "小半根到半根", description: "更接近主食，需要计入碳水。", tips: "吃玉米时可减少米饭或面食。" },
  { id: "apple", name: "苹果", category: "fruit", friendliness: "适量", giLevel: "medium", portion: "半个到 1 个小苹果", description: "适合放在两餐之间少量吃。", tips: "优先吃完整水果，不榨汁。" },
  { id: "blueberry", name: "蓝莓", category: "fruit", friendliness: "适量", giLevel: "low", portion: "一小把", description: "可作为加餐水果选择。", tips: "不额外加糖或蜂蜜。" },
  { id: "banana", name: "香蕉", category: "fruit", friendliness: "谨慎", giLevel: "medium", portion: "半根左右", description: "熟透香蕉升糖可能更快，建议少量尝试并观察。", tips: "不要和甜饮、点心一起吃。" },
  { id: "water", name: "白水", category: "drink", friendliness: "推荐", giLevel: "low", portion: "按需饮用", description: "日常首选饮品。", tips: "口渴时优先选择无糖饮品。" },
  { id: "soy-milk", name: "无糖豆浆", category: "drink", friendliness: "推荐", giLevel: "low", portion: "一杯 200-250ml", description: "适合早餐搭配，但要确认无额外加糖。", tips: "购买时看配料表和营养成分。" },
  { id: "milk-tea", name: "奶茶", category: "drink", friendliness: "谨慎", giLevel: "high", portion: "尽量少量或选择无糖替代", description: "含糖饮品可能带来较快血糖波动。", tips: "即使标注少糖，也要留意配料和小料。" },
  { id: "nuts", name: "原味坚果", category: "snack", friendliness: "适量", giLevel: "low", portion: "一小把 10-15g", description: "适合作为加餐，但热量较高。", tips: "选择原味，避免糖衣或盐焗过量。" },
  { id: "yogurt", name: "无糖酸奶", category: "snack", friendliness: "适量", giLevel: "low", portion: "一小杯", description: "适合作为加餐或搭配少量水果。", tips: "选择无糖或低糖款。" },
  { id: "biscuit", name: "甜饼干", category: "snack", friendliness: "谨慎", giLevel: "high", portion: "少量尝试", description: "精制碳水和糖较常见，控糖时需要谨慎。", tips: "优先用坚果、酸奶等替代。" }
];

export const RECIPES: RecipeItem[] = [
  { id: "breakfast-oat-egg", mealType: "breakfast", title: "燕麦鸡蛋早餐", foods: ["原味燕麦", "水煮蛋", "无糖豆浆", "黄瓜"], portion: "燕麦干重 30g + 鸡蛋 1 个", steps: "燕麦煮软，搭配鸡蛋和无糖豆浆，黄瓜作配菜。", tips: "如果餐后血糖偏高，下次可减少燕麦份量。" },
  { id: "breakfast-yogurt-blueberry", mealType: "breakfast", title: "酸奶蓝莓轻早餐", foods: ["无糖酸奶", "蓝莓", "原味坚果", "鸡蛋"], portion: "酸奶 1 小杯 + 蓝莓一小把", steps: "酸奶中加入少量蓝莓和坚果，搭配 1 个鸡蛋。", tips: "确认酸奶无额外加糖。" },
  { id: "lunch-chicken-rice", mealType: "lunch", title: "鸡胸糙米午餐", foods: ["鸡胸肉", "糙米饭", "西兰花", "菠菜"], portion: "糙米饭半碗 + 鸡胸肉掌心大小", steps: "鸡胸肉少油煎或水煮，配两种蔬菜和少量糙米饭。", tips: "先吃蔬菜和蛋白质，再吃主食，可能更稳。" },
  { id: "lunch-fish-tofu", mealType: "lunch", title: "清蒸鱼豆腐餐", foods: ["清蒸鱼", "豆腐", "绿叶菜", "少量米饭"], portion: "鱼 1 份 + 豆腐半盒 + 米饭少量", steps: "清蒸鱼搭配豆腐和绿叶菜，主食控制在小份。", tips: "少用甜口酱汁。" },
  { id: "dinner-tofu-veg", mealType: "dinner", title: "豆腐蔬菜晚餐", foods: ["豆腐", "西兰花", "黄瓜", "红薯"], portion: "豆腐 1 份 + 红薯小半根", steps: "豆腐少油烹调，搭配足量蔬菜和少量红薯。", tips: "晚餐主食不宜和玉米、红薯、米饭大量叠加。" },
  { id: "dinner-fish-broccoli", mealType: "dinner", title: "鱼肉西兰花晚餐", foods: ["清蒸鱼", "西兰花", "菠菜", "糙米饭"], portion: "鱼 1 份 + 糙米饭小半碗", steps: "鱼肉清蒸，西兰花焯拌，搭配小份主食。", tips: "如果睡前偏饿，可记录后再评估加餐。" },
  { id: "snack-nuts-yogurt", mealType: "snack", title: "坚果酸奶加餐", foods: ["无糖酸奶", "原味坚果"], portion: "酸奶 1 小杯 + 坚果 10g", steps: "两餐之间食用，避免和正餐挤得太近。", tips: "坚果热量高，抓一小把即可。" },
  { id: "snack-egg-cucumber", mealType: "snack", title: "鸡蛋黄瓜加餐", foods: ["鸡蛋", "黄瓜", "白水"], portion: "鸡蛋 1 个 + 黄瓜半根", steps: "水煮蛋配黄瓜，适合想要更强饱腹感时。", tips: "若医生有特殊饮食要求，以医生建议为准。" }
];
