"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  __name: "dice-tool",
  setup(__props) {
    const diceCount = common_vendor.ref(1);
    const diceValues = common_vendor.ref([1]);
    const isRolling = common_vendor.ref(false);
    const showResult = common_vendor.ref(false);
    const totalValue = common_vendor.computed(() => {
      return diceValues.value.reduce((sum, val) => sum + val, 0);
    });
    const rollDice = () => {
      if (isRolling.value)
        return;
      isRolling.value = true;
      showResult.value = false;
      let rollCount = 0;
      const maxRolls = 15;
      const rollInterval = setInterval(() => {
        diceValues.value = Array.from(
          { length: diceCount.value },
          () => Math.floor(Math.random() * 6) + 1
        );
        rollCount++;
        if (rollCount >= maxRolls) {
          clearInterval(rollInterval);
          isRolling.value = false;
          showResult.value = true;
          common_vendor.index.vibrateShort({
            type: "medium"
          });
        }
      }, 80);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: diceCount.value === 1 ? 1 : "",
        b: common_vendor.o(($event) => diceCount.value = 1),
        c: diceCount.value === 2 ? 1 : "",
        d: common_vendor.o(($event) => diceCount.value = 2),
        e: diceCount.value === 3 ? 1 : "",
        f: common_vendor.o(($event) => diceCount.value = 3),
        g: common_vendor.f(diceValues.value, (value, index, i0) => {
          return {
            a: common_vendor.f(value, (dot, k1, i1) => {
              return {
                a: dot,
                b: common_vendor.n("dot-" + dot)
              };
            }),
            b: index
          };
        }),
        h: isRolling.value ? 1 : "",
        i: showResult.value
      }, showResult.value ? {
        j: common_vendor.t(totalValue.value)
      } : {}, {
        k: common_vendor.t(isRolling.value ? "摇动中..." : "摇骰子"),
        l: common_vendor.o(rollDice),
        m: isRolling.value
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a0fb6855"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/tools/components/dice-tool.js.map
