"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const menuList = common_vendor.ref([
      {
        id: 1,
        title: "桌游助手",
        desc: "狼人杀/阿瓦隆/剧本杀",
        icon: "🎲",
        path: "/pages/boardgame/index",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      },
      {
        id: 2,
        title: "派对工具箱",
        desc: "聚会小游戏",
        icon: "🎉",
        path: "/pages/tools/index",
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
      },
      {
        id: 3,
        title: "好友排名",
        desc: "记录游戏战绩",
        icon: "🏆",
        path: "/pages/rank/room",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
      },
      {
        id: 4,
        title: "匿名吐槽",
        desc: "匿名聊天室",
        icon: "💬",
        path: "/pages/chat/anonymous",
        gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
      }
    ]);
    const navigateTo = (path) => {
      common_vendor.index.navigateTo({
        url: path
      });
    };
    const copyEmail = () => {
      common_vendor.index.setClipboardData({
        data: "864764135@qq.com",
        success: () => {
          common_vendor.index.showToast({ title: "邮箱已复制", icon: "success" });
        }
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(menuList.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.icon),
            b: item.gradient,
            c: common_vendor.t(item.title),
            d: common_vendor.t(item.desc),
            e: item.id,
            f: common_vendor.o(($event) => navigateTo(item.path), item.id)
          };
        }),
        b: common_vendor.o(copyEmail)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4978fed5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/index.js.map
