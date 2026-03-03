"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  __name: "timer-tool",
  setup(__props) {
    common_vendor.useCssVars((_ctx) => ({
      "5dbc9644": progressPercent.value
    }));
    const timerMode = common_vendor.ref("countup");
    const isRunning = common_vendor.ref(false);
    const isFinished = common_vendor.ref(false);
    const currentTime = common_vendor.ref(0);
    const setMinutes = common_vendor.ref(5);
    const setSeconds = common_vendor.ref(0);
    const totalTime = common_vendor.ref(0);
    let timer = null;
    const formattedTime = common_vendor.computed(() => {
      const totalSeconds = timerMode.value === "countdown" ? currentTime.value : currentTime.value;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    });
    const progressPercent = common_vendor.computed(() => {
      if (totalTime.value === 0)
        return 0;
      return Math.round(currentTime.value / totalTime.value * 100);
    });
    const isWarning = common_vendor.computed(() => {
      return timerMode.value === "countdown" && currentTime.value <= 10 && currentTime.value > 0;
    });
    const switchMode = (mode) => {
      if (isRunning.value)
        return;
      timerMode.value = mode;
      resetTimer();
    };
    const adjustTime = (unit, delta) => {
      if (isRunning.value)
        return;
      if (unit === "minutes") {
        setMinutes.value = Math.max(0, Math.min(99, setMinutes.value + delta));
      } else {
        setSeconds.value = Math.max(0, Math.min(59, setSeconds.value + delta));
      }
    };
    const toggleTimer = () => {
      if (isRunning.value) {
        pauseTimer();
      } else {
        startTimer();
      }
    };
    const startTimer = () => {
      if (timerMode.value === "countdown") {
        if (currentTime.value === 0) {
          totalTime.value = setMinutes.value * 60 + setSeconds.value;
          currentTime.value = totalTime.value;
        }
        if (currentTime.value === 0) {
          common_vendor.index.showToast({
            title: "请设置时间",
            icon: "none"
          });
          return;
        }
      }
      isRunning.value = true;
      isFinished.value = false;
      timer = setInterval(() => {
        if (timerMode.value === "countup") {
          currentTime.value++;
        } else {
          currentTime.value--;
          if (currentTime.value <= 10 && currentTime.value > 0) {
            common_vendor.index.vibrateShort({
              type: "light"
            });
          }
          if (currentTime.value <= 0) {
            finishTimer();
          }
        }
      }, 1e3);
    };
    const pauseTimer = () => {
      isRunning.value = false;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const finishTimer = () => {
      pauseTimer();
      isFinished.value = true;
      common_vendor.index.vibrateLong();
      common_vendor.index.showModal({
        title: "时间到！",
        content: "计时结束",
        showCancel: false,
        confirmText: "确定"
      });
    };
    const resetTimer = () => {
      pauseTimer();
      currentTime.value = 0;
      totalTime.value = 0;
      isFinished.value = false;
    };
    common_vendor.onUnmounted(() => {
      if (timer) {
        clearInterval(timer);
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: timerMode.value === "countup" ? 1 : "",
        b: common_vendor.o(($event) => switchMode("countup")),
        c: timerMode.value === "countdown" ? 1 : "",
        d: common_vendor.o(($event) => switchMode("countdown")),
        e: common_vendor.t(formattedTime.value),
        f: isWarning.value ? 1 : "",
        g: timerMode.value === "countdown" && !isRunning.value
      }, timerMode.value === "countdown" && !isRunning.value ? {
        h: common_vendor.o(($event) => adjustTime("minutes", 1)),
        i: common_vendor.t(setMinutes.value),
        j: common_vendor.o(($event) => adjustTime("minutes", -1)),
        k: common_vendor.o(($event) => adjustTime("seconds", 10)),
        l: common_vendor.t(setSeconds.value),
        m: common_vendor.o(($event) => adjustTime("seconds", -10))
      } : {}, {
        n: timerMode.value === "countdown" && isRunning.value
      }, timerMode.value === "countdown" && isRunning.value ? {
        o: common_vendor.t(progressPercent.value)
      } : {}, {
        p: !isFinished.value
      }, !isFinished.value ? {
        q: common_vendor.t(isRunning.value ? "暂停" : "开始"),
        r: common_vendor.o(toggleTimer)
      } : {
        s: common_vendor.o(resetTimer)
      }, {
        t: common_vendor.o(resetTimer),
        v: common_vendor.s(_ctx.__cssVars())
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-44d6a300"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/tools/components/timer-tool.js.map
