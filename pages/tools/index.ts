Page({
  onShow() {
    wx.showTabBar({
      animation: false,
      fail() {}
    });
  },

  goFood() {
    wx.navigateTo({
      url: "/pages/tools/food/index"
    });
  }
});
