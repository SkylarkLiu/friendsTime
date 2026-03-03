"use strict";
const store_game_base = require("./base.js");
const avalonRoles = {
  merlin: { name: "梅林", camp: "good", icon: "🧙‍♂️", skill: "可以看到所有坏人（除了莫德雷德）", tips: "你的提示是好人获胜的关键，但切记不要表现得太明显，否则刺客会找到你。" },
  percival: { name: "派西维尔", camp: "good", icon: "🧝", skill: "可以看到梅林和莫甘娜（但不知道具体谁是梅林）", tips: "你是梅林的盾牌，要保护好真正的梅林，迷惑刺客的判断。" },
  loyal_servant: { name: "忠臣", camp: "good", icon: "🤴", skill: "无特殊技能", tips: "通过发言和投票，帮助好人阵营找出坏人。" },
  assassin: { name: "刺客", camp: "evil", icon: "🗡️", skill: "游戏结束时，可以刺杀一名玩家，若刺中梅林则坏人翻盘", tips: "整局游戏观察谁的发言在暗中引导好人，那个人很可能就是梅林。" },
  morgana: { name: "莫甘娜", camp: "evil", icon: "🧟‍♀️", skill: "在派西维尔眼中显示为梅林（混淆派西维尔）", tips: "你要假装自己是梅林，欺骗派西维尔保护你，从而暴露给刺客。" },
  mordred: { name: "莫德雷德", camp: "evil", icon: "🦹", skill: "梅林看不到你（隐藏最深的坏人）", tips: "你是梅林的盲区，大胆发言，梅林查不到你，这是你的优势。" },
  oberon: { name: "奥伯伦", camp: "evil", icon: "👺", skill: "不知道队友是谁，队友也不知道他（孤狼）", tips: "作为孤狼，你要独自判断形势，在不暴露队友的情况下破坏任务。" },
  minion: { name: "爪牙", camp: "evil", icon: "👺", skill: "开局可以看到所有队友（除了奥伯伦）", tips: "配合队友行动，在关键投票中投反对票破坏任务。" }
};
class AvalonGame extends store_game_base.Game {
  constructor(config = {}) {
    super(config);
    this.gameType = "avalon";
    this.playerCount = config.playerCount || 5;
    this.dealtCards = [];
  }
  setPlayerCount(count) {
    this.playerCount = count;
  }
  generateRolePool() {
    const pool = [];
    const roleConfig = this.getRoleConfig();
    Object.entries(roleConfig).forEach(([roleId, count]) => {
      for (let i = 0; i < count; i++) {
        pool.push(roleId);
      }
    });
    return pool;
  }
  getRoleConfig() {
    switch (this.playerCount) {
      case 5:
        return { merlin: 1, percival: 1, loyal_servant: 1, assassin: 1, morgana: 1 };
      case 6:
        return { merlin: 1, percival: 1, loyal_servant: 2, assassin: 1, morgana: 1 };
      case 7:
        return { merlin: 1, percival: 1, loyal_servant: 2, assassin: 1, morgana: 1, mordred: 1 };
      case 8:
        return { merlin: 1, percival: 1, loyal_servant: 3, assassin: 1, morgana: 1, mordred: 1 };
      case 9:
        return { merlin: 1, percival: 1, loyal_servant: 4, assassin: 1, morgana: 1, mordred: 1 };
      case 10:
        return { merlin: 1, percival: 1, loyal_servant: 4, assassin: 1, morgana: 1, mordred: 1, oberon: 1 };
      default:
        return { merlin: 1, percival: 1, loyal_servant: 1, assassin: 1, morgana: 1 };
    }
  }
  dealCards() {
    const rolePool = this.generateRolePool();
    const shuffledRoles = this.shuffle(rolePool);
    this.dealtCards = shuffledRoles.map((roleId, index) => {
      return {
        playerNumber: index + 1,
        role: roleId,
        seenPlayers: this.calculateSeenPlayers(roleId, shuffledRoles, index)
      };
    });
    this.setGameState("dealing");
    return this.dealtCards;
  }
  calculateSeenPlayers(roleId, allRoles, currentIndex) {
    const seenPlayers = [];
    if (roleId === "merlin") {
      allRoles.forEach((r, index) => {
        if (index !== currentIndex && r !== "mordred" && avalonRoles[r].camp === "evil") {
          seenPlayers.push(index);
        }
      });
    }
    if (roleId === "percival") {
      allRoles.forEach((r, index) => {
        if (index !== currentIndex && (r === "merlin" || r === "morgana")) {
          seenPlayers.push(index);
        }
      });
    }
    if (avalonRoles[roleId].camp === "evil" && roleId !== "oberon") {
      allRoles.forEach((r, index) => {
        if (index !== currentIndex && r !== "oberon" && avalonRoles[r].camp === "evil") {
          seenPlayers.push(index);
        }
      });
    }
    return seenPlayers;
  }
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  resetGame() {
    super.reset();
    this.dealtCards = [];
  }
}
exports.AvalonGame = AvalonGame;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/store/game/avalon.js.map
