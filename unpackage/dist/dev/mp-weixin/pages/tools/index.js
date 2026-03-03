"use strict";
const common_vendor = require("../../common/vendor.js");
const pages_tools_config = require("./config.js");
if (!Math) {
  (DiceTool + TimerTool + TruthDareTool)();
}
const DiceTool = () => "./components/dice-tool.js";
const TimerTool = () => "./components/timer-tool.js";
const TruthDareTool = () => "./components/truth-dare-tool.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const toolsList = common_vendor.ref(pages_tools_config.getAllTools());
    const currentTool = common_vendor.ref(null);
    const openTool = (tool) => {
      currentTool.value = tool;
    };
    const closeTool = () => {
      currentTool.value = null;
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(toolsList.value, (tool, k0, i0) => {
          return {
            a: common_vendor.t(tool.icon),
            b: tool.gradient,
            c: common_vendor.t(tool.name),
            d: common_vendor.t(tool.description),
            e: tool.id,
            f: common_vendor.o(($event) => openTool(tool), tool.id)
          };
        }),
        b: currentTool.value
      }, currentTool.value ? common_vendor.e({
        c: common_vendor.t(currentTool.value.name),
        d: common_vendor.o(closeTool),
        e: currentTool.value.id === "dice"
      }, currentTool.value.id === "dice" ? {} : {}, {
        f: currentTool.value.id === "timer"
      }, currentTool.value.id === "timer" ? {} : {}, {
        g: currentTool.value.id === "truth_dare"
      }, currentTool.value.id === "truth_dare" ? {} : {}, {
        h: common_vendor.o(() => {
        }),
        i: common_vendor.o(closeTool)
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-bf705dbd"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/tools/index.js.map
