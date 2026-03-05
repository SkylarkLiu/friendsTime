"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  __name: "dice-tool",
  setup(__props) {
    const diceCount = common_vendor.ref(1);
    const isRolling = common_vendor.ref(false);
    const showResult = common_vendor.ref(false);
    const diceList = common_vendor.ref([
      { value: 1, isRolling: false },
      { value: 1, isRolling: false },
      { value: 1, isRolling: false },
      { value: 1, isRolling: false },
      { value: 1, isRolling: false },
      { value: 1, isRolling: false }
    ]);
    const visibleDiceList = common_vendor.computed(() => {
      return diceList.value.slice(0, diceCount.value);
    });
    const totalValue = common_vendor.computed(() => {
      let total = 0;
      for (let i = 0; i < diceCount.value; i++) {
        total += diceList.value[i].value;
      }
      return total;
    });
    const dotPatterns = {
      1: [5],
      2: [1, 9],
      3: [1, 5, 9],
      4: [1, 3, 7, 9],
      5: [1, 3, 5, 7, 9],
      6: [1, 3, 4, 6, 7, 9]
    };
    const isDotVisible = (value, position) => {
      return dotPatterns[value] && dotPatterns[value].includes(position);
    };
    const rollDice = () => {
      if (isRolling.value)
        return;
      isRolling.value = true;
      showResult.value = false;
      for (let i = 0; i < diceCount.value; i++) {
        diceList.value[i].isRolling = true;
      }
      const rollDurations = [];
      for (let i = 0; i < diceCount.value; i++) {
        rollDurations.push(800 + Math.random() * 600 + i * 150);
      }
      const intervals = [];
      for (let i = 0; i < diceCount.value; i++) {
        const interval = setInterval(() => {
          diceList.value[i].value = Math.floor(Math.random() * 6) + 1;
        }, 50);
        intervals.push(interval);
      }
      for (let i = 0; i < diceCount.value; i++) {
        setTimeout(() => {
          clearInterval(intervals[i]);
          diceList.value[i].isRolling = false;
          diceList.value[i].value = Math.floor(Math.random() * 6) + 1;
          common_vendor.index.vibrateShort({
            type: "medium"
          });
          if (i === diceCount.value - 1) {
            isRolling.value = false;
            showResult.value = true;
          }
        }, rollDurations[i]);
      }
    };
    common_vendor.watch(diceCount, () => {
      showResult.value = false;
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(6, (i, k0, i0) => {
          return {
            a: common_vendor.t(i),
            b: diceCount.value === i ? 1 : "",
            c: i,
            d: common_vendor.o(($event) => diceCount.value = i, i)
          };
        }),
        b: common_vendor.f(visibleDiceList.value, (dice, index, i0) => {
          return {
            a: common_vendor.f(9, (dotPos, k1, i1) => {
              return {
                a: dotPos,
                b: isDotVisible(dice.value, dotPos) ? 1 : ""
              };
            }),
            b: index,
            c: dice.isRolling ? 1 : "",
            d: `${index * 0.05}s`
          };
        }),
        c: showResult.value && !isRolling.value
      }, showResult.value && !isRolling.value ? {
        d: common_vendor.t(totalValue.value),
        e: common_vendor.f(visibleDiceList.value, (dice, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: common_vendor.t(dice.value),
            c: index
          };
        })
      } : {}, {
        f: common_vendor.t(isRolling.value ? "摇动中..." : "🎲 摇骰子"),
        g: common_vendor.o(rollDice),
        h: isRolling.value
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a0fb6855"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/tools/components/dice-tool.js.map
