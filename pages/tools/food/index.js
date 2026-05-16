const { FOOD_CATEGORIES, FOODS, MEAL_TYPES, RECIPES } = require("../../../utils/food-data");

Page({
  data: {
    selectedCategory: "all",
    selectedMealType: "all",
    categories: buildCategories("all"),
    mealTypes: buildMealTypes("all"),
    filteredFoods: buildFoodCards(FOODS),
    selectedRecipe: null
  },

  onSelectCategory(event) {
    const selectedCategory = event.currentTarget.dataset.key || "all";
    const filteredFoods = selectedCategory === "all"
      ? FOODS
      : FOODS.filter((food) => food.category === selectedCategory);

    this.setData({
      selectedCategory,
      categories: buildCategories(selectedCategory),
      filteredFoods: buildFoodCards(filteredFoods)
    });
  },

  onSelectMealType(event) {
    const selectedMealType = event.currentTarget.dataset.key || "all";

    this.setData({
      selectedMealType,
      mealTypes: buildMealTypes(selectedMealType),
      selectedRecipe: null
    });
  },

  onRandomRecipe() {
    const recipes = this.data.selectedMealType === "all"
      ? RECIPES
      : RECIPES.filter((recipe) => recipe.mealType === this.data.selectedMealType);

    if (!recipes.length) {
      wx.showToast({
        title: "暂无该餐次食谱",
        icon: "none"
      });
      return;
    }

    const currentId = this.data.selectedRecipe && this.data.selectedRecipe.id;
    const candidates = recipes.length > 1
      ? recipes.filter((recipe) => recipe.id !== currentId)
      : recipes;
    const recipe = candidates[Math.floor(Math.random() * candidates.length)];

    this.setData({
      selectedRecipe: buildRecipeCard(recipe)
    });
  }
});

function buildCategories(activeKey) {
  return FOOD_CATEGORIES.map((item) => ({
    ...item,
    active: item.key === activeKey
  }));
}

function buildMealTypes(activeKey) {
  return MEAL_TYPES.map((item) => ({
    ...item,
    active: item.key === activeKey
  }));
}

function buildFoodCards(foods) {
  return foods.map((food) => ({
    ...food,
    categoryLabel: getCategoryLabel(food.category),
    friendlinessKey: getFriendlinessKey(food.friendliness),
    giText: getGiText(food.giLevel)
  }));
}

function buildRecipeCard(recipe) {
  return {
    ...recipe,
    mealLabel: getMealLabel(recipe.mealType)
  };
}

function getCategoryLabel(key) {
  const category = FOOD_CATEGORIES.find((item) => item.key === key);
  return category ? category.label : key;
}

function getMealLabel(key) {
  const mealType = MEAL_TYPES.find((item) => item.key === key);
  return mealType ? mealType.label : key;
}

function getFriendlinessKey(value) {
  if (value === "推荐") return "recommend";
  if (value === "适量") return "moderate";
  return "caution";
}

function getGiText(value) {
  const map = {
    low: "升糖较慢",
    medium: "注意份量",
    high: "升糖较快",
    unknown: "待观察"
  };

  return map[value] || map.unknown;
}
