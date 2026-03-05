"use strict";
const common_vendor = require("../../../common/vendor.js");
const _sfc_main = {
  __name: "truth-dare-tool",
  setup(__props) {
    const questionsData = {
      truth: [
        "你最后悔的一件事是什么？",
        "你做过最尴尬的事情是什么？",
        "你撒过最大的谎是什么？",
        "你偷偷哭过最伤心的一次是因为什么？",
        "你最想回到过去的哪个时刻？",
        "你曾经偷过什么东西吗？",
        "你最害怕失去什么？",
        "你做过最疯狂的决定是什么？",
        "你有什么不为人知的特长？",
        "你最后悔没做的事情是什么？",
        "你曾经背叛过朋友的信任吗？",
        "你最讨厌自己的哪个缺点？",
        "你收到过最难忘的礼物是什么？",
        "你曾经因为什么被老师/老板骂得最惨？",
        "你小时候做过最幼稚的事是什么？",
        "你最后悔说出口的一句话是什么？",
        "你曾经嫉妒过谁？为什么？",
        "你最想改变自己的哪个习惯？",
        "你做过最丢脸的事情是什么？",
        "你有什么不敢告诉家人的秘密？",
        "你现在的感情状态是什么？",
        "你理想中的另一半是什么样的？",
        "你曾经暗恋过谁？",
        "你谈过几次恋爱？",
        "你分手后最后悔的是什么？",
        "你相信一见钟情吗？",
        "你能为爱情放弃什么？",
        "你最不能接受伴侣的什么行为？",
        "你曾经当过第三者吗？",
        "你被甩过最惨的一次是怎样的？",
        "你会为了爱情去另一个城市吗？",
        "你觉得爱情和友情哪个更重要？",
        "你相信异地恋能成功吗？",
        "你最浪漫的约会经历是什么？",
        "你曾经同时喜欢过两个人吗？",
        "你会查伴侣的手机吗？",
        "你能接受开放式关系吗？",
        "你结婚后会和父母同住吗？",
        "你觉得彩礼/嫁妆重要吗？",
        "你愿意为了爱情改变自己吗？",
        "你最好的朋友是谁？为什么？",
        "你曾经和朋友闹翻过吗？因为什么？",
        "你能借给朋友多少钱？",
        "你相信异性之间有纯友谊吗？",
        "你会和朋友分享所有秘密吗？",
        "你曾经背后说过朋友坏话吗？",
        "朋友借钱不还是什么感受？",
        "你能接受朋友和你讨厌的人做朋友吗？",
        "你觉得友情能维持多久？",
        "你会为了朋友和家人吵架吗？",
        "你曾经抢过朋友的男/女朋友吗？",
        "朋友背叛你你会原谅吗？",
        "你觉得真正的朋友应该多久联系一次？",
        "你会和朋友一起创业吗？",
        "朋友结婚你会随多少份子钱？",
        "你觉得钱重要还是快乐重要？",
        "你相信人性本善还是本恶？",
        "如果可以，你会选择永生吗？",
        "你觉得成功最重要的因素是什么？",
        "你愿意为了成功不择手段吗？",
        "你觉得读书有用吗？",
        "你相信命运吗？",
        "如果可以重来，你会选择不同的人生吗？",
        "你觉得什么是幸福？",
        "你愿意为了正义牺牲自己吗？",
        "你觉得公平重要还是效率重要？",
        "你相信努力一定能成功吗？",
        "你觉得年龄是问题吗？",
        "你愿意过平凡但安稳的一生吗？",
        "你觉得人生的意义是什么？",
        "如果明天是世界末日，你今天会做什么？",
        "如果你能拥有一种超能力，你选什么？",
        "如果你能穿越时空，你去哪里？",
        "如果你中了1000万，你第一件事做什么？",
        "如果你能变成异性一天，你会做什么？",
        "如果你能读心，你最想知道谁的想法？",
        "如果你能隐身，你最想做什么？",
        "如果你能回到过去，你想改变什么？",
        "如果你只能再活一年，你会怎么过？",
        "如果你能交换人生，你想和谁换？",
        "如果你能删除一段记忆，你删什么？",
        "如果你能预知未来，你想知道什么？",
        "如果你能和动物对话，你想问什么？",
        "如果你能瞬间移动，你最想去哪里？",
        "如果你能复活一个人，你选谁？",
        "你手机里最不想让人看的照片是什么？",
        "你搜索过最尴尬的关键词是什么？",
        "你最后悔买的什么东西？",
        "你偷偷看过伴侣的手机吗？",
        "你曾经假装生病不去上班/上学吗？",
        "你说过最违心的话是什么？",
        "你曾经偷看过别人的日记/手机吗？",
        "你最想删掉的社交媒体动态是什么？",
        "你曾经抄袭/作弊过吗？",
        "你最后悔的关注/点赞是什么？",
        "你曾经为了面子撒过什么谎？",
        "你最不想让人知道的消费是什么？",
        "你曾经偷偷哭过吗？因为什么？",
        "你最害怕别人发现你的什么秘密？",
        "如果现在让你公开一个秘密，你选什么？"
      ],
      dare: [
        "用方言读一段话",
        "模仿一种动物的叫声",
        "唱一首儿歌",
        "做10个俯卧撑",
        "对着镜子说「我最帅/美」",
        "用屁股写自己的名字",
        "学猫叫三声",
        "单脚站立30秒",
        "模仿一个明星说话",
        "说一段绕口令",
        "用左手写字",
        "模仿婴儿哭",
        "做鬼脸保持10秒",
        "学机器人走路",
        "用夸张的语气读新闻",
        "模仿老师/老板说话",
        "唱一首歌的副歌部分",
        "学一种外语说「你好」",
        "模仿广告台词",
        "用慢动作走一圈",
        "学僵尸走路",
        "模仿天气预报员",
        "用rap的方式自我介绍",
        "学企鹅走路",
        "模仿电影经典台词",
        "给通讯录第一个人发「我想你了」",
        "在朋友圈发一张丑照",
        "给前任发「最近好吗」",
        "在群里发一个红包",
        "给父母发「我爱你」",
        "发一条语音说秘密",
        "在朋友圈表白（可打码）",
        "给老板/老师发感谢消息",
        "在群里讲一个笑话",
        "给陌生人发问候",
        "在朋友圈发童年照",
        "给好朋友发真心话",
        "在群里唱歌",
        "发一条仅某人可见的动态",
        "给暗恋的人点赞",
        "在群里承认一个秘密",
        "给最近联系的人发表情",
        "在朋友圈发今天的穿搭",
        "给家人打视频电话",
        "在群里分享一首歌",
        "给同事/同学发鼓励消息",
        "在朋友圈发美食照",
        "给老朋友发消息问候",
        "在群里分享一个故事",
        "给陌生人发祝福",
        "吃一口柠檬不皱眉",
        "喝一大杯水不换气",
        "闭眼摸人猜是谁",
        "用筷子夹豆子10颗",
        "单脚跳一圈",
        "倒着走10步",
        "用非惯用手吃饭",
        "蒙眼找东西",
        "做30秒平板支撑",
        "转10圈后走直线",
        "用嘴叼纸杯传水",
        "憋气30秒",
        "用额头夹纸保持10秒",
        "学螃蟹横着走",
        "做20个深蹲",
        "用鼻子顶东西",
        "学青蛙跳",
        "闭眼单脚站立",
        "用下巴夹笔写字",
        "学大象甩鼻子",
        "做10个波比跳",
        "用脚尖走路",
        "学蛇爬行",
        "做5个倒立（靠墙）",
        "用膝盖夹东西走",
        "即兴编一个故事",
        "现场画一幅画",
        "用身体摆一个字母",
        "创作一首诗",
        "模仿一个雕塑",
        "用物品摆一个造型",
        "即兴表演一个场景",
        "编一个广告语",
        "用声音模仿乐器",
        "创作一个舞蹈动作",
        "用废品做一个作品",
        "即兴说一段脱口秀",
        "模仿一个名画",
        "创作一个手势舞",
        "用身体写一个字",
        "在公共场所大喊「我是最棒的」",
        "穿反衣服出门",
        "在电梯里对每个人说「你好」",
        "在餐厅唱生日歌",
        "在街上找人合影",
        "对陌生人说「你今天真好看」",
        "在超市推购物车赛跑",
        "在公园里学鸟叫",
        "在商场里跳一段舞",
        "在人群中大声表白"
      ]
    };
    const currentMode = common_vendor.ref("truth");
    const currentQuestion = common_vendor.ref("");
    const showQuestion = common_vendor.ref(false);
    const showHistory = common_vendor.ref(false);
    const usedQuestions = common_vendor.ref({ truth: /* @__PURE__ */ new Set(), dare: /* @__PURE__ */ new Set() });
    const history = common_vendor.ref([]);
    const usedCount = common_vendor.computed(() => usedQuestions.value[currentMode.value].size);
    const remainingCount = common_vendor.computed(() => {
      var _a;
      const total = ((_a = questionsData[currentMode.value]) == null ? void 0 : _a.length) || 0;
      return total - usedCount.value;
    });
    const switchMode = (mode) => {
      currentMode.value = mode;
      showQuestion.value = false;
      currentQuestion.value = "";
    };
    const drawQuestion = () => {
      const modeQuestions = questionsData[currentMode.value];
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
