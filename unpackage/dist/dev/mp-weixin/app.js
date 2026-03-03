"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/splash/index.js";
  "./pages/home/index.js";
  "./pages/boardgame/index.js";
  "./pages/boardgame/werewolf-room.js";
  "./pages/boardgame/avalon-room.js";
  "./pages/tools/index.js";
  "./pages/rank/room.js";
  "./pages/chat/anonymous.js";
}
const _sfc_main = {
  onLaunch() {
    common_vendor.index.__f__("log", "at App.vue:4", "App Launch");
  },
  onShow() {
    common_vendor.index.__f__("log", "at App.vue:7", "App Show");
  },
  onHide() {
    common_vendor.index.__f__("log", "at App.vue:10", "App Hide");
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  const pinia = common_vendor.createPinia();
  app.use(pinia);
  return {
    app,
    pinia
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
