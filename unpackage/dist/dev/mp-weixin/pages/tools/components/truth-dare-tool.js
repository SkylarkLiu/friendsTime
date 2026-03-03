"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  __name: "truth-dare-tool",
  setup(__props) {
    const currentMode = common_vendor.ref("truth");
    const currentQuestion = common_vendor.ref("");
    const showQuestion = common_vendor.ref(false);
    const showHistory = common_vendor.ref(false);
    const questions = common_vendor.ref({ truth: [], dare: [] });
    const usedQuestions = common_vendor.ref({ truth: /* @__PURE__ */ new Set(), dare: /* @__PURE__ */ new Set() });
    const history = common_vendor.ref([]);
    const usedCount = common_vendor.computed(() => usedQuestions.value[currentMode.value].size);
    const remainingCount = common_vendor.computed(() => {
      var _a;
      const total = ((_a = questions.value[currentMode.value]) == null ? void 0 : _a.length) || 0;
      return total - usedCount.value;
    });
    const loadQuestions = async () => {
      try {
        const res = await new Promise((resolve, reject) => {
          common_vendor.index.request({
            url: "/static/data/questions.json",
            success: (response) => resolve(response.data),
            fail: reject
          });
        });
        questions.value = res;
      } catch (e) {
        questions.value = {
          truth: [
            "你最尴尬的经历是什么？",
            "你有什么不为人知的秘密？",
            "你最近一次哭是什么时候？"
          ],
          dare: [
            "模仿一个动物叫三声",
            "做十个俯卧撑",
            "大声唱一首歌"
          ]
        };
      }
    };
    const switchMode = (mode) => {
      currentMode.value = mode;
      showQuestion.value = false;
      currentQuestion.value = "";
    };
    const drawQuestion = () => {
      const modeQuestions = questions.value[currentMode.value];
      const used = usedQuestions.value[currentMode.value];
      const availableQuestions = modeQuestions.filter((_, index) => !used.has(index));
      if (availableQuestions.length === 0) {
        common_vendor.index.showToast({
          title: "题库已用完，请重置",
          icon: "none"
        });
        return;
      }
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const selectedQuestion = availableQuestions[randomIndex];
      const originalIndex = modeQuestions.indexOf(selectedQuestion);
      used.add(originalIndex);
      currentQuestion.value = selectedQuestion;
      showQuestion.value = true;
      history.value.unshift({
        mode: currentMode.value,
        question: selectedQuestion
      });
      if (history.value.length > 20) {
        history.value.pop();
      }
      common_vendor.index.vibrateShort({
        type: "light"
      });
    };
    const resetQuestions = () => {
      usedQuestions.value = { truth: /* @__PURE__ */ new Set(), dare: /* @__PURE__ */ new Set() };
      history.value = [];
      showQuestion.value = false;
      currentQuestion.value = "";
      common_vendor.index.showToast({
        title: "题库已重置",
        icon: "success"
      });
    };
    common_vendor.onMounted(() => {
      loadQuestions();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: currentMode.value === "truth" ? 1 : "",
        b: common_vendor.o(($event) => switchMode("truth")),
        c: currentMode.value === "dare" ? 1 : "",
        d: common_vendor.o(($event) => switchMode("dare")),
        e: common_vendor.t(currentMode.value === "truth" ? "🤔" : "🎯"),
        f: common_vendor.t(currentQuestion.value),
        g: showQuestion.value ? 1 : "",
        h: common_vendor.t(usedCount.value),
        i: common_vendor.t(remainingCount.value),
        j: common_vendor.t(showQuestion.value ? "换一个" : "随机抽取"),
        k: common_vendor.o(drawQuestion),
        l: common_vendor.o(resetQuestions),
        m: history.value.length > 0
      }, history.value.length > 0 ? common_vendor.e({
        n: common_vendor.t(showHistory.value ? "收起" : "展开"),
        o: common_vendor.o(($event) => showHistory.value = !showHistory.value),
        p: showHistory.value
      }, showHistory.value ? {
        q: common_vendor.f(history.value, (item, index, i0) => {
          return {
            a: common_vendor.t(item.mode === "truth" ? "真心话" : "大冒险"),
            b: common_vendor.t(item.question),
            c: index
          };
        })
      } : {}) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f82a324c"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/tools/components/truth-dare-tool.js.map
