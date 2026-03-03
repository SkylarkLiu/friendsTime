"use strict";
const roleConfig = {
  // ==================== 狼人阵营 ====================
  werewolf: {
    name: "狼人",
    camp: "wolf",
    campName: "狼人阵营",
    icon: "🐺",
    color: "#8B0000",
    // 深红色
    skills: [
      "每晚可以睁眼与同伴交流",
      "共同选择一名玩家进行杀害"
    ],
    strategy: "隐藏身份，混淆视听，找出神职并优先刀掉。注意不要暴露给预言家。"
  },
  whiteWolfKing: {
    name: "白狼王",
    camp: "wolf",
    campName: "狼人阵营",
    icon: "👑",
    color: "#8B0000",
    skills: [
      "拥有普通狼人的所有技能",
      "可以在白天发言阶段自爆",
      "自爆时可带走一名玩家"
    ],
    strategy: "当你被预言家查杀或即将被放逐时，果断自爆带走关键神职（如女巫、预言家）。"
  },
  wolfBeauty: {
    name: "狼美人",
    camp: "wolf",
    campName: "狼人阵营",
    icon: "💃",
    color: "#8B0000",
    skills: [
      "拥有普通狼人的所有技能",
      "每晚可以魅惑一名玩家",
      "死亡时，被魅惑的玩家会一同出局"
    ],
    strategy: '魅惑预言家或女巫等强力神职，形成"连体婴"，让好人投鼠忌器。'
  },
  // ==================== 神职阵营 ====================
  seer: {
    name: "预言家",
    camp: "god",
    campName: "神职阵营",
    icon: "🔮",
    color: "#4169E1",
    // 皇家蓝
    skills: [
      "每晚可以查验一名玩家的身份",
      '法官会告知你是"好人"还是"狼人"',
      "是好人阵营的信息核心"
    ],
    strategy: "拿到牌后要尽快在警长竞选中起跳，报出验人信息，带领好人放逐狼人。注意隐蔽，防止被狼人首刀。"
  },
  witch: {
    name: "女巫",
    camp: "god",
    campName: "神职阵营",
    icon: "🧪",
    color: "#4169E1",
    skills: [
      "拥有一瓶解药和一瓶毒药",
      "解药：可以救活当晚被狼人杀害的玩家",
      "毒药：可以在晚上毒杀任意一名玩家",
      "每种药物整局游戏只能使用一次"
    ],
    strategy: "首夜通常选择自救（视规则而定）。解药是神职生命的保障，毒药用于清除嫌疑最大的狼人或关键时刻抢轮次。"
  },
  hunter: {
    name: "猎人",
    camp: "god",
    campName: "神职阵营",
    icon: "🏹",
    color: "#4169E1",
    skills: [
      "当你被狼人杀害或被放逐出局时",
      "可以选择开枪带走另一名玩家",
      "如果是被女巫毒死，则不能开枪"
    ],
    strategy: "身份隐蔽性强。被狼刀或被投出局时，尽量带走铁狼。如果不确定，可以选择不开枪。"
  },
  guard: {
    name: "守卫",
    camp: "god",
    campName: "神职阵营",
    icon: "🛡️",
    color: "#4169E1",
    skills: [
      "每晚可以守护一名玩家",
      "被守护的玩家当晚免疫狼人袭击",
      "不能连续两晚守护同一名玩家"
    ],
    strategy: '保护好预言家，尽量在预言家起跳后进行"空守"或"自守"来迷惑狼人。注意守卫的规则限制，避免"奶穿"（守护了被女巫救的人）。'
  },
  idiot: {
    name: "白痴",
    camp: "god",
    campName: "神职阵营",
    icon: "🤪",
    color: "#4169E1",
    skills: [
      "如果白天被投票放逐出局",
      "可以翻牌亮出身份免除死亡",
      "翻牌后失去投票权，但可以发言"
    ],
    strategy: "通过作死发言吸引狼人刀你，浪费狼人一回合。或者混淆视听，让狼人误以为你是民，从而挡刀。"
  },
  knight: {
    name: "骑士",
    camp: "god",
    campName: "神职阵营",
    icon: "⚔️",
    color: "#4169E1",
    skills: [
      "在白天放逐投票前",
      "可以翻牌发起决斗挑战任意一名玩家",
      "若对方是狼人则对方直接死亡",
      "若对方是好人则你自己死亡"
    ],
    strategy: "当你确信某人是狼人时发动决斗。注意，决斗失败会直接导致好人减员，需谨慎使用。"
  },
  // ==================== 平民阵营 ====================
  villager: {
    name: "平民",
    camp: "villager",
    campName: "平民阵营",
    icon: "👨‍🌾",
    color: "#228B22",
    // 森林绿
    skills: [
      "没有任何特殊技能",
      "依靠逻辑推理和观察判断",
      "在白天投票放逐狼人"
    ],
    strategy: "不要乱穿神职衣服，挡住真正的预言家。学会表水（清晰表达自己的逻辑），跟随真预言家投票。"
  }
};
function getRolePoolByPlayerCount(playerCount) {
  let adjustedCount = playerCount;
  if (adjustedCount > 12)
    adjustedCount = 12;
  if (adjustedCount < 6)
    adjustedCount = 6;
  if (adjustedCount === 7)
    adjustedCount = 6;
  if (adjustedCount === 11)
    adjustedCount = 10;
  switch (adjustedCount) {
    case 6:
      return [
        "werewolf",
        "werewolf",
        // 2狼人
        "seer",
        "witch",
        // 2神职
        "villager",
        "villager"
        // 2平民
      ];
    case 8:
      return [
        "werewolf",
        "werewolf",
        // 2狼人
        "seer",
        "witch",
        "hunter",
        // 3神职
        "villager",
        "villager",
        "villager"
        // 3平民
      ];
    case 9:
      return [
        "werewolf",
        "werewolf",
        "werewolf",
        // 3狼人
        "seer",
        "witch",
        "hunter",
        // 3神职
        "villager",
        "villager",
        "villager"
        // 3平民
      ];
    case 10:
      return [
        "werewolf",
        "werewolf",
        "werewolf",
        // 3狼人
        "seer",
        "witch",
        "hunter",
        "guard",
        // 4神职
        "villager",
        "villager",
        "villager"
        // 3平民
      ];
    case 12:
      return [
        "whiteWolfKing",
        "wolfBeauty",
        "werewolf",
        // 3狼人（含白狼王和狼美人）
        "seer",
        "witch",
        "hunter",
        "guard",
        // 4神职
        "villager",
        "villager",
        "villager",
        "villager"
        // 4平民
      ];
    default:
      return [];
  }
}
function getCampIcon(camp) {
  switch (camp) {
    case "wolf":
      return "🐺";
    case "god":
      return "👼";
    case "villager":
      return "👨‍🌾";
    default:
      return "❓";
  }
}
exports.getCampIcon = getCampIcon;
exports.getRolePoolByPlayerCount = getRolePoolByPlayerCount;
exports.roleConfig = roleConfig;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/werewolfConfig.js.map
