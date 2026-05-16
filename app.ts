App<IAppOption>({
  globalData: {
    cloudReady: false
  },

  onLaunch() {
    if (!wx.cloud) {
      wx.showToast({
        title: "基础库过低",
        icon: "none"
      });
      return;
    }

    wx.cloud.init({
      env: "cloud1-3g76fc5qda8c96af",
      traceUser: true
    });

    this.globalData.cloudReady = true;
  }
});

