"use strict";
const common_vendor = require("../../common/vendor.js");
const store_room = require("../../store/room.js");
const store_game_avalon = require("../../store/game/avalon.js");
const api_network = require("../../api/network.js");
if (!Math) {
  ShareRoomModal();
}
const ShareRoomModal = () => "../../components/ShareRoomModal.js";
const _sfc_main = {
  __name: "avalon-room",
  setup(__props) {
    const roomStore = store_room.useRoomStore();
    const game = new store_game_avalon.AvalonGame();
    const roomIdInput = common_vendor.ref("");
    const playerName = common_vendor.ref("");
    const showRoleCard = common_vendor.ref(false);
    const cardFlipped = common_vendor.ref(false);
    const currentRole = common_vendor.ref(null);
    const currentPlayerNumber = common_vendor.ref(0);
    const hasViewedRole = common_vendor.ref(false);
    const showShareModal = common_vendor.ref(false);
    const playerCount = common_vendor.ref(5);
    const showInviteModal = common_vendor.ref(false);
    const shareLink = common_vendor.ref("");
    const qrCodeUrl = common_vendor.ref("");
    const selectedTeam = common_vendor.ref([]);
    const selectedAssassinationTarget = common_vendor.ref(null);
    const wifiInfo = common_vendor.ref({
      isWiFi: false,
      localIP: null,
      serverUrl: ""
    });
    const networkStatus = common_vendor.computed(() => roomStore.networkStatus);
    const connectionStatusText = common_vendor.computed(() => {
      if (networkStatus.value === "connected") {
        return "已连接";
      } else if (networkStatus.value === "connecting") {
        return "连接中...";
      } else {
        return "未连接";
      }
    });
    const isHost = common_vendor.computed(() => roomStore.isHost);
    const isInRoom = common_vendor.computed(() => roomStore.isInRoom);
    const currentRoom = common_vendor.computed(() => roomStore.currentRoom);
    const gameState = common_vendor.computed(() => game.getGameState());
    const gameStatusText = common_vendor.computed(() => {
      if (gameState.value === "idle")
        return "准备中";
      if (gameState.value === "dealing")
        return "发牌中";
      if (gameState.value === "team_building")
        return "组队阶段";
      if (gameState.value === "voting")
        return "投票阶段";
      if (gameState.value === "questing")
        return "任务阶段";
      if (gameState.value === "assassination")
        return "刺杀阶段";
      if (gameState.value === "game_over")
        return "游戏结束";
      return "准备中";
    });
    const currentPhaseText = common_vendor.computed(() => {
      if (gameState.value === "dealing")
        return "发牌阶段";
      if (gameState.value === "team_building")
        return "组队阶段";
      if (gameState.value === "voting")
        return "投票阶段";
      if (gameState.value === "questing")
        return "任务阶段";
      if (gameState.value === "assassination")
        return "刺杀阶段";
      if (gameState.value === "game_over")
        return "游戏结束";
      return "准备中";
    });
    const currentLeaderIndex = common_vendor.computed(() => {
      var _a, _b;
      return ((_b = (_a = currentRoom.value) == null ? void 0 : _a.avalonData) == null ? void 0 : _b.leaderIndex) || 0;
    });
    const currentTeam = common_vendor.computed(() => {
      var _a, _b;
      return ((_b = (_a = currentRoom.value) == null ? void 0 : _a.avalonData) == null ? void 0 : _b.team) || [];
    });
    const isInCurrentTeam = common_vendor.computed(() => {
      if (!currentTeam.value || gameState.value !== "questing")
        return false;
      const player = currentRoom.value.players.find((p) => p.name === playerName.value);
      return player && currentTeam.value.includes(player.id);
    });
    const isAssassin = common_vendor.computed(() => {
      var _a;
      if (gameState.value !== "assassination")
        return false;
      const player = currentRoom.value.players.find((p) => p.name === playerName.value);
      return player && ((_a = player.avalonData) == null ? void 0 : _a.role) === "assassin";
    });
    const gameResultText = common_vendor.computed(() => {
      var _a, _b;
      const result = (_b = (_a = currentRoom.value) == null ? void 0 : _a.avalonData) == null ? void 0 : _b.gameResult;
      if (result === "good_win")
        return "🎉 好人阵营获胜！";
      if (result === "evil_win")
        return "🎉 坏人阵营获胜！";
      return "游戏结束";
    });
    const gameResultReason = common_vendor.computed(() => {
      var _a, _b;
      const reason = (_b = (_a = currentRoom.value) == null ? void 0 : _a.avalonData) == null ? void 0 : _b.gameResultReason;
      return reason || "";
    });
    const avalonRoles = [
      { id: "merlin", name: "梅林", camp: "good", icon: "🧙‍♂️", skill: "可以看到所有坏人（除了莫德雷德）", tips: "你的提示是好人获胜的关键，但切记不要表现得太明显，否则刺客会找到你。" },
      { id: "percival", name: "派西维尔", camp: "good", icon: "🧝", skill: "可以看到梅林和莫甘娜（但不知道具体谁是梅林）", tips: "你是梅林的盾牌，要保护好真正的梅林，迷惑刺客的判断。" },
      { id: "loyal_servant", name: "忠臣", camp: "good", icon: "🤴", skill: "无特殊技能", tips: "通过发言和投票，帮助好人阵营找出坏人。" },
      { id: "assassin", name: "刺客", camp: "evil", icon: "🗡️", skill: "游戏结束时，可以刺杀一名玩家，若刺中梅林则坏人翻盘", tips: "整局游戏观察谁的发言在暗中引导好人，那个人很可能就是梅林。" },
      { id: "morgana", name: "莫甘娜", camp: "evil", icon: "🧟‍♀️", skill: "在派西维尔眼中显示为梅林（混淆派西维尔）", tips: "你要假装自己是梅林，欺骗派西维尔保护你，从而暴露给刺客。" },
      { id: "mordred", name: "莫德雷德", camp: "evil", icon: "🦹", skill: "梅林看不到你（隐藏最深的坏人）", tips: "你是梅林的盲区，大胆发言，梅林查不到你，这是你的优势。" },
      { id: "oberon", name: "奥伯伦", camp: "evil", icon: "👺", skill: "不知道队友是谁，队友也不知道他（孤狼）", tips: "作为孤狼，你要独自判断形势，在不暴露队友的情况下破坏任务。" },
      { id: "minion", name: "爪牙", camp: "evil", icon: "👺", skill: "开局可以看到所有队友（除了奥伯伦）", tips: "配合队友行动，在关键投票中投反对票破坏任务。" }
    ];
    const getPlayerAvatar = (player) => {
      const avatars = ["🐱", "🐶", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯"];
      const index = currentRoom.value.players.indexOf(player) % avatars.length;
      return avatars[index];
    };
    const isPlayerHost = (player) => {
      return currentRoom.value.players[0] === player;
    };
    const getPlayerName = (index) => {
      if (!currentRoom.value || index >= currentRoom.value.players.length)
        return "未知";
      return currentRoom.value.players[index].name;
    };
    const getPlayerNameById = (playerId) => {
      const player = currentRoom.value.players.find((p) => p.id === playerId);
      return player ? player.name : "未知";
    };
    const getRoleName = (roleId) => {
      const role = avalonRoles.find((r) => r.id === roleId);
      return role ? role.name : "";
    };
    const getRoleColor = (role) => {
      if (!role)
        return "#666666";
      return role.camp === "good" ? "#4caf50" : "#f44336";
    };
    const getCampIcon = (camp) => {
      return camp === "good" ? "🌟" : "💀";
    };
    const getRoleCount = (roleId) => {
      const config = getRoleConfigByPlayerCount(playerCount.value);
      return config[roleId] || 0;
    };
    const getRoleConfigByPlayerCount = (count) => {
      switch (count) {
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
    };
    const getQuestPlayerCount = () => {
      var _a, _b;
      const round = ((_b = (_a = currentRoom.value) == null ? void 0 : _a.avalonData) == null ? void 0 : _b.round) || 1;
      const count = currentRoom.value.players.length;
      if (count <= 6) {
        const counts = [2, 3, 3, 3, 3];
        return counts[round - 1] || 3;
      } else if (count <= 8) {
        const counts = [2, 3, 3, 4, 4];
        return counts[round - 1] || 4;
      } else {
        const counts = [3, 4, 4, 5, 5];
        return counts[round - 1] || 5;
      }
    };
    common_vendor.onMounted(async () => {
      const savedRoom = roomStore.loadCurrentRoom();
      if (savedRoom) {
        if (savedRoom.players && savedRoom.players.length > 0) {
          playerName.value = savedRoom.players[0].name;
        }
      }
      try {
        const info = await api_network.networkManager.detectWiFiAndSetServer();
        wifiInfo.value = info;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/boardgame/avalon-room.vue:598", "检测WiFi失败:", e);
      }
      registerNetworkEvents();
    });
    common_vendor.onUnmounted(() => {
      api_network.networkManager.disconnect();
    });
    const registerNetworkEvents = () => {
      roomStore.registerNetworkEvent("room_updated", (data) => {
        common_vendor.index.__f__("log", "at pages/boardgame/avalon-room.vue:614", "房间更新:", data);
      });
      roomStore.registerNetworkEvent("player_joined", (data) => {
        common_vendor.index.__f__("log", "at pages/boardgame/avalon-room.vue:620", "玩家加入:", data);
      });
      roomStore.registerNetworkEvent("player_left", (data) => {
        common_vendor.index.__f__("log", "at pages/boardgame/avalon-room.vue:626", "玩家离开:", data);
      });
      roomStore.registerNetworkEvent("game_started", (data) => {
        common_vendor.index.__f__("log", "at pages/boardgame/avalon-room.vue:632", "游戏开始:", data);
      });
      roomStore.registerNetworkEvent("reconnect_failed", () => {
        common_vendor.index.__f__("log", "at pages/boardgame/avalon-room.vue:638", "重连失败");
        common_vendor.index.showToast({ title: "网络连接失败，请重新加入房间", icon: "none" });
      });
    };
    const createRoom = async () => {
      if (!playerName.value) {
        common_vendor.index.showToast({ title: "请输入昵称", icon: "none" });
        return;
      }
      try {
        await roomStore.createRoom("阿瓦隆房间", "slaughter_side", {
          hostName: playerName.value,
          roomId: roomIdInput.value || void 0
        });
        common_vendor.index.showToast({ title: "房间创建成功", icon: "success" });
      } catch (e) {
        common_vendor.index.showToast({ title: e.message || "创建失败", icon: "none" });
      }
    };
    const joinRoom = async () => {
      if (!roomIdInput.value || !playerName.value) {
        common_vendor.index.showToast({ title: "请输入房间号和昵称", icon: "none" });
        return;
      }
      const result = await roomStore.joinRoom(roomIdInput.value, playerName.value);
      if (result.success) {
        common_vendor.index.showToast({ title: "加入房间成功", icon: "success" });
      } else {
        common_vendor.index.showToast({ title: result.message, icon: "none" });
      }
    };
    const leaveRoom = async () => {
      await roomStore.leaveRoom();
      resetGameState();
      common_vendor.index.showToast({ title: "已退出房间", icon: "success" });
    };
    const startGame = async () => {
      if (currentRoom.value.players.length < 5 || currentRoom.value.players.length > 10) {
        common_vendor.index.showToast({ title: "玩家人数必须在5-10人之间", icon: "none" });
        return;
      }
      if (!currentRoom.value.avalonData) {
        currentRoom.value.avalonData = {
          round: 1,
          leaderIndex: 0,
          team: [],
          votes: {},
          questResults: [],
          gameResult: null,
          gameResultReason: ""
        };
      }
      currentRoom.value.players.forEach((player) => {
        player.avalonData = player.avalonData || {
          role: null,
          seenPlayers: []
        };
      });
      await roomStore.updateRoom(currentRoom.value);
      game.setPlayerCount(currentRoom.value.players.length);
      game.dealCards();
      const dealtCards = game.dealtCards;
      currentRoom.value.players.forEach((player, index) => {
        if (index < dealtCards.length) {
          player.avalonData.role = dealtCards[index].role;
          player.avalonData.seenPlayers = dealtCards[index].seenPlayers;
        }
      });
      await roomStore.updateRoom(currentRoom.value);
      game.setGameState("team_building");
      common_vendor.index.showToast({ title: "发牌完成", icon: "success" });
    };
    const resetGame = async () => {
      game.resetGame();
      if (currentRoom.value) {
        currentRoom.value.avalonData = {
          round: 1,
          leaderIndex: 0,
          team: [],
          votes: {},
          questResults: [],
          gameResult: null,
          gameResultReason: ""
        };
        currentRoom.value.players.forEach((player) => {
          player.avalonData = {
            role: null,
            seenPlayers: []
          };
        });
        await roomStore.updateRoom(currentRoom.value);
      }
      resetGameState();
      common_vendor.index.showToast({ title: "游戏已结束", icon: "success" });
    };
    const viewMyRole = () => {
      var _a;
      if (gameState.value === "idle") {
        common_vendor.index.showToast({ title: "游戏尚未开始", icon: "none" });
        return;
      }
      if (hasViewedRole.value) {
        common_vendor.index.showToast({ title: "你已经查看过身份", icon: "none" });
        return;
      }
      const player = currentRoom.value.players.find((p) => p.name === playerName.value);
      if (!player || !((_a = player.avalonData) == null ? void 0 : _a.role)) {
        common_vendor.index.showToast({ title: "未找到你的身份", icon: "none" });
        return;
      }
      const role = avalonRoles.find((r) => r.id === player.avalonData.role);
      if (!role) {
        common_vendor.index.showToast({ title: "角色不存在", icon: "none" });
        return;
      }
      currentRole.value = {
        ...role,
        seenPlayers: player.avalonData.seenPlayers
      };
      currentPlayerNumber.value = currentRoom.value.players.indexOf(player) + 1;
      showRoleCard.value = true;
      setTimeout(() => {
        cardFlipped.value = true;
      }, 100);
    };
    const confirmRole = () => {
      cardFlipped.value = false;
      showRoleCard.value = false;
      hasViewedRole.value = true;
    };
    const closeRoleCard = () => {
      if (cardFlipped.value) {
        cardFlipped.value = false;
        setTimeout(() => {
          showRoleCard.value = false;
        }, 300);
      } else {
        showRoleCard.value = false;
      }
    };
    const decreasePlayers = () => {
      if (playerCount.value > 5) {
        playerCount.value--;
      }
    };
    const increasePlayers = () => {
      if (playerCount.value < 10) {
        playerCount.value++;
      }
    };
    const toggleTeamMember = (playerId, index) => {
      if (index === currentLeaderIndex)
        return;
      const indexInTeam = selectedTeam.value.indexOf(playerId);
      if (indexInTeam === -1) {
        if (selectedTeam.value.length < getQuestPlayerCount() - 1) {
          selectedTeam.value.push(playerId);
        }
      } else {
        selectedTeam.value.splice(indexInTeam, 1);
      }
    };
    const confirmTeam = async () => {
      if (selectedTeam.value.length !== getQuestPlayerCount() - 1) {
        common_vendor.index.showToast({ title: "请选择正确数量的队员", icon: "none" });
        return;
      }
      const leaderId = currentRoom.value.players[currentLeaderIndex].id;
      const team = [leaderId, ...selectedTeam.value];
      currentRoom.value.avalonData.team = team;
      currentRoom.value.avalonData.votes = {};
      await roomStore.updateRoom(currentRoom.value);
      game.setGameState("voting");
      selectedTeam.value = [];
    };
    const castVote = async (approve) => {
      const player = currentRoom.value.players.find((p) => p.name === playerName.value);
      if (!player)
        return;
      currentRoom.value.avalonData.votes[player.id] = approve;
      await roomStore.updateRoom(currentRoom.value);
      const allVoted = currentRoom.value.players.every((p) => currentRoom.value.avalonData.votes[p.id] !== void 0);
      if (allVoted) {
        const voteCount = Object.values(currentRoom.value.avalonData.votes);
        const approveCount = voteCount.filter((v) => v).length;
        const rejectCount = voteCount.length - approveCount;
        if (approveCount > rejectCount) {
          game.setGameState("questing");
        } else {
          currentRoom.value.avalonData.leaderIndex = (currentRoom.value.avalonData.leaderIndex + 1) % currentRoom.value.players.length;
          currentRoom.value.avalonData.team = [];
          currentRoom.value.avalonData.votes = {};
          await roomStore.updateRoom(currentRoom.value);
          game.setGameState("team_building");
        }
      }
    };
    const submitQuestResult = async (success) => {
      const player = currentRoom.value.players.find((p) => p.name === playerName.value);
      if (!player)
        return;
      const isEvil = player.avalonData.role && avalonRoles.find((r) => r.id === player.avalonData.role).camp === "evil";
      const actualResult = isEvil ? !success : success;
      currentRoom.value.avalonData.questResults.push(actualResult ? "success" : "fail");
      const failCount = currentRoom.value.avalonData.questResults.filter((r) => r === "fail").length;
      const successCount = currentRoom.value.avalonData.questResults.filter((r) => r === "success").length;
      if (failCount >= 3) {
        currentRoom.value.avalonData.gameResult = "evil_win";
        currentRoom.value.avalonData.gameResultReason = "坏人阵营成功完成3次任务失败";
        game.setGameState("game_over");
      } else if (successCount >= 3) {
        currentRoom.value.avalonData.gameResult = "good_win";
        currentRoom.value.avalonData.gameResultReason = "好人阵营成功完成3次任务";
        game.setGameState("assassination");
      } else {
        currentRoom.value.avalonData.round++;
        currentRoom.value.avalonData.leaderIndex = (currentRoom.value.avalonData.leaderIndex + 1) % currentRoom.value.players.length;
        currentRoom.value.avalonData.team = [];
        currentRoom.value.avalonData.votes = {};
        game.setGameState("team_building");
      }
      await roomStore.updateRoom(currentRoom.value);
    };
    const selectAssassinationTarget = (playerId) => {
      selectedAssassinationTarget.value = playerId;
    };
    const confirmAssassination = async () => {
      if (!selectedAssassinationTarget.value)
        return;
      const targetPlayer = currentRoom.value.players.find((p) => p.id === selectedAssassinationTarget.value);
      if (targetPlayer && targetPlayer.avalonData.role === "merlin") {
        currentRoom.value.avalonData.gameResult = "evil_win";
        currentRoom.value.avalonData.gameResultReason = "刺客成功刺杀梅林，坏人阵营翻盘";
      }
      game.setGameState("game_over");
      await roomStore.updateRoom(currentRoom.value);
      selectedAssassinationTarget.value = null;
    };
    const resetGameState = () => {
      game.resetGame();
      showRoleCard.value = false;
      cardFlipped.value = false;
      currentRole.value = null;
      currentPlayerNumber.value = 0;
      hasViewedRole.value = false;
      selectedTeam.value = [];
      selectedAssassinationTarget.value = null;
    };
    const openInviteModal = () => {
      shareLink.value = roomStore.generateShareLink();
      qrCodeUrl.value = roomStore.generateQRCode();
      showInviteModal.value = true;
    };
    const closeInviteModal = () => {
      showInviteModal.value = false;
    };
    const copyShareLink = () => {
      common_vendor.index.setClipboardData({
        data: shareLink.value,
        success: () => {
          common_vendor.index.showToast({ title: "链接已复制", icon: "success" });
        }
      });
    };
    const copyServerUrl = () => {
      common_vendor.index.setClipboardData({
        data: wifiInfo.value.serverUrl,
        success: () => {
          common_vendor.index.showToast({ title: "服务器地址已复制", icon: "success" });
        }
      });
    };
    const shareToFriends = () => {
      common_vendor.index.showToast({ title: "分享功能已触发", icon: "success" });
    };
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
      return common_vendor.e({
        a: !isInRoom.value
      }, !isInRoom.value ? {
        b: roomIdInput.value,
        c: common_vendor.o(($event) => roomIdInput.value = $event.detail.value),
        d: playerName.value,
        e: common_vendor.o(($event) => playerName.value = $event.detail.value),
        f: common_vendor.o(createRoom),
        g: !playerName.value,
        h: common_vendor.o(joinRoom),
        i: !roomIdInput.value || !playerName.value
      } : common_vendor.e({
        j: common_vendor.t(currentRoom.value.roomId),
        k: isHost.value
      }, isHost.value ? {
        l: common_vendor.o(($event) => showShareModal.value = true)
      } : {}, {
        m: common_vendor.t(currentRoom.value.players.length),
        n: common_vendor.t(connectionStatusText.value),
        o: common_vendor.n(networkStatus.value),
        p: wifiInfo.value.isWiFi
      }, wifiInfo.value.isWiFi ? {} : {}, {
        q: common_vendor.t(gameStatusText.value),
        r: gameState.value !== "idle" ? 1 : "",
        s: isHost.value && wifiInfo.value.serverUrl
      }, isHost.value && wifiInfo.value.serverUrl ? {
        t: common_vendor.t(wifiInfo.value.serverUrl),
        v: common_vendor.o(copyServerUrl)
      } : {}, {
        w: common_vendor.f(currentRoom.value.players, (player, index, i0) => {
          var _a2, _b2;
          return common_vendor.e({
            a: common_vendor.t(getPlayerAvatar(player)),
            b: isPlayerHost(player)
          }, isPlayerHost(player) ? {} : {}, {
            c: index === currentLeaderIndex.value
          }, index === currentLeaderIndex.value ? {} : {}, {
            d: common_vendor.t(player.name),
            e: (_a2 = player.avalonData) == null ? void 0 : _a2.role
          }, ((_b2 = player.avalonData) == null ? void 0 : _b2.role) ? {
            f: common_vendor.t(getRoleName(player.avalonData.role))
          } : {}, {
            g: player.id,
            h: common_vendor.n({
              "host": isPlayerHost(player),
              "leader": index === currentLeaderIndex.value
            })
          });
        }),
        x: isHost.value && gameState.value === "idle"
      }, isHost.value && gameState.value === "idle" ? {
        y: common_vendor.o(decreasePlayers),
        z: common_vendor.t(playerCount.value),
        A: common_vendor.o(increasePlayers),
        B: common_vendor.f(avalonRoles, (role, k0, i0) => {
          return {
            a: common_vendor.t(role.icon),
            b: common_vendor.t(role.name),
            c: common_vendor.t(getRoleCount(role.id)),
            d: role.id
          };
        })
      } : {}, {
        C: gameState.value !== "idle"
      }, gameState.value !== "idle" ? common_vendor.e({
        D: common_vendor.t(currentPhaseText.value),
        E: gameState.value === "team_building"
      }, gameState.value === "team_building" ? {
        F: common_vendor.t(getPlayerName(currentLeaderIndex.value)),
        G: common_vendor.t(getQuestPlayerCount()),
        H: common_vendor.f(currentRoom.value.players, (player, index, i0) => {
          return {
            a: common_vendor.t(getPlayerAvatar(player)),
            b: common_vendor.t(player.name),
            c: player.id,
            d: common_vendor.n({
              "selected": selectedTeam.value.includes(player.id),
              "disabled": index === currentLeaderIndex.value
            }),
            e: common_vendor.o(($event) => toggleTeamMember(player.id, index), player.id)
          };
        }),
        I: common_vendor.o(confirmTeam),
        J: selectedTeam.value.length !== getQuestPlayerCount() - 1
      } : {}, {
        K: gameState.value === "voting"
      }, gameState.value === "voting" ? {
        L: common_vendor.f(currentTeam.value, (playerId, k0, i0) => {
          return {
            a: common_vendor.t(getPlayerNameById(playerId)),
            b: playerId
          };
        }),
        M: common_vendor.o(($event) => castVote(true)),
        N: common_vendor.o(($event) => castVote(false))
      } : {}, {
        O: gameState.value === "questing"
      }, gameState.value === "questing" ? common_vendor.e({
        P: common_vendor.f(currentTeam.value, (playerId, k0, i0) => {
          return {
            a: common_vendor.t(getPlayerNameById(playerId)),
            b: playerId
          };
        }),
        Q: isInCurrentTeam.value
      }, isInCurrentTeam.value ? {
        R: common_vendor.o(($event) => submitQuestResult(true)),
        S: common_vendor.o(($event) => submitQuestResult(false))
      } : {}) : {}, {
        T: gameState.value === "assassination"
      }, gameState.value === "assassination" ? common_vendor.e({
        U: isAssassin.value
      }, isAssassin.value ? {
        V: common_vendor.f(currentRoom.value.players, (player, index, i0) => {
          return {
            a: common_vendor.t(getPlayerAvatar(player)),
            b: common_vendor.t(player.name),
            c: player.id,
            d: common_vendor.n({
              "selected": selectedAssassinationTarget.value === player.id
            }),
            e: common_vendor.o(($event) => selectAssassinationTarget(player.id), player.id)
          };
        }),
        W: common_vendor.o(confirmAssassination),
        X: !selectedAssassinationTarget.value
      } : {}) : {}, {
        Y: gameState.value === "game_over"
      }, gameState.value === "game_over" ? {
        Z: common_vendor.t(gameResultText.value),
        aa: common_vendor.t(gameResultReason.value),
        ab: common_vendor.o(resetGame)
      } : {}) : {}, {
        ac: isHost.value
      }, isHost.value ? {
        ad: common_vendor.o(startGame),
        ae: gameState.value !== "idle" || currentRoom.value.players.length < 5 || currentRoom.value.players.length > 10
      } : {}, {
        af: isHost.value && gameState.value === "idle"
      }, isHost.value && gameState.value === "idle" ? {
        ag: common_vendor.o(openInviteModal)
      } : {
        ah: common_vendor.o(viewMyRole),
        ai: gameState.value === "idle" || hasViewedRole.value
      }, {
        aj: isHost.value && gameState.value !== "idle"
      }, isHost.value && gameState.value !== "idle" ? {
        ak: common_vendor.o(resetGame)
      } : {}, {
        al: common_vendor.o(leaveRoom),
        am: showInviteModal.value
      }, showInviteModal.value ? {
        an: common_vendor.t(currentRoom.value.roomId),
        ao: common_vendor.t(qrCodeUrl.value),
        ap: common_vendor.t(shareLink.value),
        aq: common_vendor.o(copyShareLink),
        ar: common_vendor.o(closeInviteModal),
        as: common_vendor.o(shareToFriends),
        at: common_vendor.o(() => {
        }),
        av: common_vendor.o(closeInviteModal)
      } : {}, {
        aw: showRoleCard.value
      }, showRoleCard.value ? common_vendor.e({
        ax: common_vendor.t(currentPlayerNumber.value),
        ay: common_vendor.t(getCampIcon((_a = currentRole.value) == null ? void 0 : _a.camp)),
        az: common_vendor.t(((_b = currentRole.value) == null ? void 0 : _b.camp) === "good" ? "好人阵营" : "坏人阵营"),
        aA: common_vendor.t((_c = currentRole.value) == null ? void 0 : _c.icon),
        aB: common_vendor.t((_d = currentRole.value) == null ? void 0 : _d.name),
        aC: common_vendor.t((_e = currentRole.value) == null ? void 0 : _e.skill),
        aD: common_vendor.t((_f = currentRole.value) == null ? void 0 : _f.tips),
        aE: ((_g = currentRole.value) == null ? void 0 : _g.seenPlayers) && currentRole.value.seenPlayers.length > 0
      }, ((_h = currentRole.value) == null ? void 0 : _h.seenPlayers) && currentRole.value.seenPlayers.length > 0 ? {} : {}, {
        aF: ((_i = currentRole.value) == null ? void 0 : _i.seenPlayers) && currentRole.value.seenPlayers.length > 0
      }, ((_j = currentRole.value) == null ? void 0 : _j.seenPlayers) && currentRole.value.seenPlayers.length > 0 ? {
        aG: common_vendor.f(currentRole.value.seenPlayers, (playerId, k0, i0) => {
          return {
            a: common_vendor.t(getPlayerNameById(playerId)),
            b: playerId
          };
        })
      } : {}, {
        aH: common_vendor.n({
          "flipped": cardFlipped.value
        }),
        aI: getRoleColor(currentRole.value),
        aJ: common_vendor.o(confirmRole),
        aK: common_vendor.o(() => {
        }),
        aL: common_vendor.o(closeRoleCard)
      }) : {}, {
        aM: common_vendor.o(($event) => showShareModal.value = false),
        aN: common_vendor.p({
          visible: showShareModal.value,
          roomId: ((_k = currentRoom.value) == null ? void 0 : _k.roomId) || "",
          roomType: "avalon",
          serverUrl: wifiInfo.value.serverUrl
        })
      }));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-caed1a3f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/boardgame/avalon-room.js.map
