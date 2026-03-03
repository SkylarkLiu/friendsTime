"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const gameList = common_vendor.ref([
      {
        id: 1,
        name: "狼人杀",
        desc: "随机发牌、角色分配、法官视角",
        icon: "🐺",
        path: "/pages/boardgame/werewolf-room",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      },
      {
        id: 2,
        name: "阿瓦隆",
        desc: "组队投票、任务执行、阵营对抗",
        icon: "⚔️",
        path: "/pages/boardgame/avalon-room",
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
      }
    ]);
    const comingGames = common_vendor.ref([
      { id: 3, name: "剧本杀", icon: "📜" },
      { id: 4, name: "谁是卧底", icon: "🎭" },
      { id: 5, name: "你画我猜", icon: "🎨" }
    ]);
    const navigateTo = (path) => {
      common_vendor.index.navigateTo({
        url: path
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(gameList.value, (game, k0, i0) => {
          return {
            a: common_vendor.t(game.icon),
            b: game.gradient,
            c: common_vendor.t(game.name),
            d: common_vendor.t(game.desc),
            e: game.id,
            f: common_vendor.o(($event) => navigateTo(game.path), game.id)
          };
        }),
        b: common_vendor.f(comingGames.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.icon),
            b: common_vendor.t(item.name),
            c: item.id
          };
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3e6a170a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/boardgame/index.js.map
