"use strict";
const common_vendor = require("../../common/vendor.js");
const store_room = require("../../store/room.js");
const store_game_werewolf = require("../../store/game/werewolf.js");
const store_game_presets = require("../../store/game/presets.js");
const utils_werewolfConfig = require("../../utils/werewolfConfig.js");
const api_network = require("../../api/network.js");
if (!Math) {
  ShareRoomModal();
}
const ShareRoomModal = () => "../../components/ShareRoomModal.js";
const _sfc_main = {
  __name: "werewolf-room",
  setup(__props) {
    const roomStore = store_room.useRoomStore();
    const game = new store_game_werewolf.WerewolfGame();
    const roomIdInput = common_vendor.ref("");
    const playerName = common_vendor.ref("");
    const showRoleCard = common_vendor.ref(false);
    const cardFlipped = common_vendor.ref(false);
    const currentRole = common_vendor.ref(null);
    const currentPlayerNumber = common_vendor.ref(0);
    const hasViewedRole = common_vendor.ref(false);
    const showShareModal = common_vendor.ref(false);
    const configMode = common_vendor.ref("preset");
    const playerCount = common_vendor.ref(9);
    const selectedPreset = common_vendor.ref(null);
    const winCondition = common_vendor.ref("slaughter_side");
    const showInviteModal = common_vendor.ref(false);
    const shareLink = common_vendor.ref("");
    const qrCodeUrl = common_vendor.ref("");
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
    common_vendor.computed(() => {
      if (!roomStore.currentRoom)
        return "0/8";
      return `${roomStore.currentRoom.players.length}/8`;
    });
    const roleConfig = common_vendor.ref([
      { id: "werewolf", name: "狼人", icon: "🐺", count: 3 },
      { id: "whiteWolfKing", name: "白狼王", icon: "👑", count: 0 },
      { id: "wolfBeauty", name: "狼美人", icon: "💃", count: 0 },
      { id: "seer", name: "预言家", icon: "🔮", count: 1 },
      { id: "witch", name: "女巫", icon: "🧪", count: 1 },
      { id: "hunter", name: "猎人", icon: "🏹", count: 1 },
      { id: "guard", name: "守卫", icon: "🛡️", count: 1 },
      { id: "idiot", name: "白痴", icon: "🤪", count: 0 },
      { id: "knight", name: "骑士", icon: "⚔️", count: 0 },
      { id: "villager", name: "村民", icon: "👤", count: 2 }
    ]);
    const isInRoom = common_vendor.computed(() => roomStore.isInRoom);
    const currentRoom = common_vendor.computed(() => roomStore.currentRoom);
    const gameState = common_vendor.computed(() => game.getGameState());
    const gameStatusText = common_vendor.computed(() => {
      if (gameState.value === "idle")
        return "准备中";
      if (gameState.value === "dealing")
        return "发牌中";
      if (gameState.value === "all_confirmed")
        return "所有玩家已确认";
      if (gameState.value === "judge_view")
        return "法官视角";
      return "准备中";
    });
    const availablePresets = common_vendor.computed(() => {
      return store_game_presets.getAllPresets().filter((p) => p.playerCount === playerCount.value);
    });
    const totalRoles = common_vendor.computed(() => {
      return roleConfig.value.reduce((sum, role) => sum + role.count, 0);
    });
    const getPlayerAvatar = (player) => {
      const avatars = ["🐱", "🐶", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦"];
      const index = currentRoom.value.players.indexOf(player) % avatars.length;
      return avatars[index];
    };
    common_vendor.onMounted(async () => {
      const savedRoom = roomStore.loadCurrentRoom();
      if (savedRoom) {
        if (savedRoom.players && savedRoom.players.length > 0) {
          playerName.value = savedRoom.players[0].name;
        }
        if (savedRoom.winCondition) {
          winCondition.value = savedRoom.winCondition;
        }
        if (savedRoom.preset) {
          const preset = savedRoom.preset;
          selectedPreset.value = preset;
          playerCount.value = preset.playerCount;
          game.setPreset(preset);
        }
      }
      const defaultPreset = store_game_presets.getPresetByPlayerCount(9);
      if (defaultPreset && !selectedPreset.value) {
        selectPreset(defaultPreset);
      }
      try {
        const info = await api_network.networkManager.detectWiFiAndSetServer();
        wifiInfo.value = info;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/boardgame/werewolf-room.vue:548", "检测WiFi失败:", e);
      }
      registerNetworkEvents();
    });
    common_vendor.onUnmounted(() => {
      api_network.networkManager.disconnect();
    });
    const registerNetworkEvents = () => {
      roomStore.registerNetworkEvent("room_updated", (data) => {
        common_vendor.index.__f__("log", "at pages/boardgame/werewolf-room.vue:564", "房间更新:", data);
      });
      roomStore.registerNetworkEvent("player_joined", (data) => {
        common_vendor.index.__f__("log", "at pages/boardgame/werewolf-room.vue:570", "玩家加入:", data);
      });
      roomStore.registerNetworkEvent("player_left", (data) => {
        common_vendor.index.__f__("log", "at pages/boardgame/werewolf-room.vue:576", "玩家离开:", data);
      });
      roomStore.registerNetworkEvent("game_started", (data) => {
        common_vendor.index.__f__("log", "at pages/boardgame/werewolf-room.vue:582", "游戏开始:", data);
      });
      roomStore.registerNetworkEvent("reconnect_failed", () => {
        common_vendor.index.__f__("log", "at pages/boardgame/werewolf-room.vue:588", "重连失败");
        common_vendor.index.showToast({ title: "网络连接失败，请重新加入房间", icon: "none" });
      });
    };
    const createRoom = async () => {
      if (!playerName.value) {
        common_vendor.index.showToast({ title: "请输入昵称", icon: "none" });
        return;
      }
      try {
        await roomStore.createRoom("狼人杀房间", winCondition.value, {
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
      if (currentRoom.value.players.length < 6) {
        common_vendor.index.showToast({ title: "玩家人数不足6人", icon: "none" });
        return;
      }
      if (currentRoom.value.players.length !== playerCount.value) {
        common_vendor.index.showToast({ title: "玩家人数与房间设置不一致", icon: "none" });
        return;
      }
      if (configMode.value === "custom" && totalRoles.value !== playerCount.value) {
        common_vendor.index.showToast({ title: "角色数量不匹配", icon: "none" });
        return;
      }
      currentRoom.value.players.forEach((player) => {
        player.hasViewedRole = false;
      });
      await roomStore.updateRoom(currentRoom.value);
      if (configMode.value === "custom") {
        game.setCustomRoles(roleConfig.value);
      }
      game.dealCards();
      common_vendor.index.showToast({ title: "发牌完成", icon: "success" });
    };
    const resetGame = async () => {
      game.resetGame();
      currentRoom.value.players.forEach((player) => {
        player.hasViewedRole = false;
      });
      await roomStore.updateRoom(currentRoom.value);
      resetGameState();
      common_vendor.index.showToast({ title: "游戏已结束", icon: "success" });
    };
    const viewMyRole = () => {
      if (gameState.value === "idle") {
        common_vendor.index.showToast({ title: "游戏尚未开始", icon: "none" });
        return;
      }
      if (hasViewedRole.value) {
        common_vendor.index.showToast({ title: "你已经查看过身份", icon: "none" });
        return;
      }
      const playerIndex = currentRoom.value.players.findIndex((p) => p.name === playerName.value);
      if (playerIndex === -1) {
        common_vendor.index.showToast({ title: "玩家不在房间中", icon: "none" });
        return;
      }
      const card = game.dealtCards[playerIndex];
      if (!card) {
        common_vendor.index.showToast({ title: "未找到你的身份卡", icon: "none" });
        return;
      }
      currentRole.value = card.role;
      currentPlayerNumber.value = playerIndex + 1;
      showRoleCard.value = true;
      setTimeout(() => {
        cardFlipped.value = true;
      }, 100);
    };
    const confirmRole = async () => {
      cardFlipped.value = false;
      showRoleCard.value = false;
      hasViewedRole.value = true;
      const playerIndex = currentRoom.value.players.findIndex((p) => p.name === playerName.value);
      if (playerIndex !== -1) {
        currentRoom.value.players[playerIndex].hasViewedRole = true;
        await roomStore.updateRoom(currentRoom.value);
      }
      const allViewed = currentRoom.value.players.every((p) => p.hasViewedRole);
      if (allViewed) {
        game.setGameState("all_confirmed");
      }
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
      if (playerCount.value > 6) {
        playerCount.value--;
        const preset = store_game_presets.getPresetByPlayerCount(playerCount.value);
        if (preset) {
          selectPreset(preset);
        }
      }
    };
    const increasePlayers = () => {
      if (playerCount.value < 18) {
        playerCount.value++;
        const preset = store_game_presets.getPresetByPlayerCount(playerCount.value);
        if (preset) {
          selectPreset(preset);
        }
      }
    };
    const selectPreset = (preset) => {
      selectedPreset.value = preset;
      playerCount.value = preset.playerCount;
      game.setPreset(preset);
      if (currentRoom.value) {
        currentRoom.value.preset = preset;
        currentRoom.value.roles = preset.roles;
        roomStore.updateRoom(currentRoom.value);
      }
    };
    const decreaseRole = (id) => {
      const role = roleConfig.value.find((r) => r.id === id);
      if (role && role.count > 0) {
        role.count--;
        if (currentRoom.value) {
          currentRoom.value.preset = null;
          currentRoom.value.roles = roleConfig.value;
          roomStore.updateRoom(currentRoom.value);
        }
      }
    };
    const increaseRole = (id) => {
      const role = roleConfig.value.find((r) => r.id === id);
      if (role) {
        role.count++;
        if (currentRoom.value) {
          currentRoom.value.preset = null;
          currentRoom.value.roles = roleConfig.value;
          roomStore.updateRoom(currentRoom.value);
        }
      }
    };
    const gameRound = common_vendor.ref(1);
    const gameResult = common_vendor.ref(null);
    const showResultModal = common_vendor.ref(false);
    const handleKillPlayer = (player) => {
      common_vendor.index.showModal({
        title: "确认击杀",
        content: `确认让玩家 ${player.name} 击杀出局吗？`,
        success: async (res) => {
          if (res.confirm) {
            await markPlayerDead(player, "killed");
          }
        }
      });
    };
    const handleVotePlayer = (player) => {
      common_vendor.index.showModal({
        title: "确认投票",
        content: `确认让玩家 ${player.name} 投票出局吗？`,
        success: async (res) => {
          if (res.confirm) {
            await markPlayerDead(player, "voted");
          }
        }
      });
    };
    const handleRevivePlayer = (player) => {
      common_vendor.index.showModal({
        title: "确认复活",
        content: `确认复活玩家 ${player.name} 吗？`,
        success: async (res) => {
          if (res.confirm) {
            player.isAlive = true;
            player.deathType = null;
            player.deathRound = null;
            await roomStore.updateRoom(currentRoom.value);
            common_vendor.index.showToast({ title: "复活成功", icon: "success" });
          }
        }
      });
    };
    const markPlayerDead = async (player, deathType) => {
      if (player.role && player.role.id === "idiot" && deathType === "voted") {
        endGame("idiot_win", player);
        return;
      }
      player.isAlive = false;
      player.deathType = deathType;
      player.deathRound = gameRound.value;
      await roomStore.updateRoom(currentRoom.value);
      checkGameResult();
    };
    const checkGameResult = () => {
      const players = currentRoom.value.players;
      const alivePlayers = players.filter((p) => p.isAlive);
      const aliveWolves = alivePlayers.filter((p) => p.role && p.role.camp === "wolf");
      const aliveGods = alivePlayers.filter((p) => p.role && p.role.camp === "god");
      const aliveVillagers = alivePlayers.filter((p) => p.role && p.role.camp === "villager");
      if (aliveWolves.length === 0) {
        endGame("good_win");
        return;
      }
      const winCondition2 = currentRoom.value.winCondition || "slaughter_side";
      if (winCondition2 === "slaughter_side") {
        if (aliveGods.length === 0 || aliveVillagers.length === 0) {
          endGame("wolf_win");
          return;
        }
      } else if (winCondition2 === "slaughter_all") {
        if (aliveGods.length === 0 && aliveVillagers.length === 0) {
          endGame("wolf_win");
          return;
        }
      }
    };
    const endGame = (result, idiotPlayer = null) => {
      gameResult.value = result;
      showResultModal.value = true;
      if (result === "idiot_win") {
        common_vendor.index.showToast({
          title: `${idiotPlayer.name} (白痴) 获得胜利！`,
          icon: "none",
          duration: 2e3
        });
      }
    };
    const playAgain = () => {
      resetGameState();
      showResultModal.value = false;
      gameResult.value = null;
      gameRound.value = 1;
      currentRoom.value.players.forEach((player) => {
        player.isAlive = true;
        player.deathType = null;
        player.deathRound = null;
      });
      roomStore.updateRoom(currentRoom.value);
    };
    const backToRoom = () => {
      showResultModal.value = false;
      gameResult.value = null;
    };
    const resetGameState = () => {
      game.resetGame();
      showRoleCard.value = false;
      cardFlipped.value = false;
      currentRole.value = null;
      currentPlayerNumber.value = 0;
      hasViewedRole.value = false;
    };
    const isPlayerHost = (player) => {
      return currentRoom.value.players[0] === player;
    };
    const handleWinConditionChange = (condition) => {
      winCondition.value = condition;
      if (currentRoom.value) {
        currentRoom.value.winCondition = condition;
        roomStore.updateRoom(currentRoom.value);
      }
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
      var _a, _b, _c, _d, _e, _f, _g, _h;
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
        r: gameState.value === "dealing" || gameState.value === "all_confirmed" || gameState.value === "judge_view" ? 1 : "",
        s: isHost.value && wifiInfo.value.serverUrl
      }, isHost.value && wifiInfo.value.serverUrl ? {
        t: common_vendor.t(wifiInfo.value.serverUrl),
        v: common_vendor.o(copyServerUrl)
      } : {}, {
        w: common_vendor.f(currentRoom.value.players, (player, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(getPlayerAvatar(player)),
            b: isPlayerHost(player)
          }, isPlayerHost(player) ? {} : {}, {
            c: !player.isAlive
          }, !player.isAlive ? {
            d: common_vendor.t(player.deathType === "killed" ? "💀" : "🗳️"),
            e: common_vendor.n(player.deathType === "killed" ? "killed" : "voted")
          } : {}, {
            f: common_vendor.t(player.name),
            g: player.hasViewedRole
          }, player.hasViewedRole ? {} : {}, isHost.value && gameState.value !== "idle" ? common_vendor.e({
            h: player.isAlive
          }, player.isAlive ? {
            i: common_vendor.o(($event) => handleKillPlayer(player), player.id)
          } : {}, {
            j: player.isAlive
          }, player.isAlive ? {
            k: common_vendor.o(($event) => handleVotePlayer(player), player.id)
          } : {
            l: common_vendor.o(($event) => handleRevivePlayer(player), player.id)
          }) : {}, {
            m: player.id,
            n: common_vendor.n({
              "host": isPlayerHost(player),
              "viewed": player.hasViewedRole,
              "dead": !player.isAlive
            })
          });
        }),
        x: isHost.value && gameState.value !== "idle",
        y: isHost.value && gameState.value === "idle"
      }, isHost.value && gameState.value === "idle" ? common_vendor.e({
        z: common_vendor.n(winCondition.value === "slaughter_side" ? "active" : ""),
        A: common_vendor.o(($event) => handleWinConditionChange("slaughter_side")),
        B: common_vendor.n(winCondition.value === "slaughter_all" ? "active" : ""),
        C: common_vendor.o(($event) => handleWinConditionChange("slaughter_all")),
        D: common_vendor.n(configMode.value === "preset" ? "active" : ""),
        E: common_vendor.o(($event) => configMode.value = "preset"),
        F: common_vendor.n(configMode.value === "custom" ? "active" : ""),
        G: common_vendor.o(($event) => configMode.value = "custom"),
        H: configMode.value === "preset"
      }, configMode.value === "preset" ? {
        I: common_vendor.o(decreasePlayers),
        J: common_vendor.t(playerCount.value),
        K: common_vendor.o(increasePlayers),
        L: common_vendor.f(availablePresets.value, (preset, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(preset.name),
            b: common_vendor.t(preset.description),
            c: common_vendor.f(preset.roles.slice(0, 4), (role, k1, i1) => {
              return {
                a: common_vendor.t(role.icon),
                b: common_vendor.t(role.count),
                c: role.id
              };
            }),
            d: preset.roles.length > 4
          }, preset.roles.length > 4 ? {} : {}, {
            e: common_vendor.n(selectedPreset.value && selectedPreset.value.id === preset.id ? "active" : ""),
            f: preset.id,
            g: common_vendor.o(($event) => selectPreset(preset), preset.id)
          });
        })
      } : {}, {
        M: configMode.value === "custom"
      }, configMode.value === "custom" ? common_vendor.e({
        N: common_vendor.t(totalRoles.value),
        O: common_vendor.t(playerCount.value),
        P: common_vendor.f(roleConfig.value, (role, k0, i0) => {
          return {
            a: common_vendor.t(role.icon),
            b: common_vendor.t(role.name),
            c: common_vendor.o(($event) => decreaseRole(role.id), role.id),
            d: common_vendor.t(role.count),
            e: common_vendor.o(($event) => increaseRole(role.id), role.id),
            f: role.id
          };
        }),
        Q: common_vendor.t(totalRoles.value),
        R: common_vendor.t(playerCount.value),
        S: totalRoles.value !== playerCount.value
      }, totalRoles.value !== playerCount.value ? {} : {}) : {}) : {}, {
        T: showRoleCard.value
      }, showRoleCard.value ? {
        U: common_vendor.t(currentPlayerNumber.value),
        V: common_vendor.t(common_vendor.unref(utils_werewolfConfig.getCampIcon)((_a = currentRole.value) == null ? void 0 : _a.camp)),
        W: common_vendor.t((_b = currentRole.value) == null ? void 0 : _b.campName),
        X: common_vendor.t((_c = currentRole.value) == null ? void 0 : _c.icon),
        Y: common_vendor.t((_d = currentRole.value) == null ? void 0 : _d.name),
        Z: common_vendor.f((_e = currentRole.value) == null ? void 0 : _e.skills, (skill, index, i0) => {
          return {
            a: common_vendor.t(skill),
            b: index
          };
        }),
        aa: common_vendor.t((_f = currentRole.value) == null ? void 0 : _f.strategy),
        ab: common_vendor.n({
          "flipped": cardFlipped.value
        }),
        ac: ((_g = currentRole.value) == null ? void 0 : _g.color) || "#666666",
        ad: common_vendor.o(confirmRole),
        ae: common_vendor.o(() => {
        }),
        af: common_vendor.o(closeRoleCard)
      } : {}, {
        ag: showResultModal.value
      }, showResultModal.value ? common_vendor.e({
        ah: gameResult.value === "wolf_win"
      }, gameResult.value === "wolf_win" ? {} : gameResult.value === "good_win" ? {} : gameResult.value === "idiot_win" ? {} : {}, {
        ai: gameResult.value === "good_win",
        aj: gameResult.value === "idiot_win",
        ak: gameResult.value === "wolf_win"
      }, gameResult.value === "wolf_win" ? {
        al: common_vendor.t(currentRoom.value.winCondition === "slaughter_side" ? '成功达成"屠边"条件' : '成功达成"屠城"条件')
      } : gameResult.value === "good_win" ? {} : gameResult.value === "idiot_win" ? {} : {}, {
        am: gameResult.value === "good_win",
        an: gameResult.value === "idiot_win",
        ao: common_vendor.f(currentRoom.value.players, (player, k0, i0) => {
          var _a2;
          return common_vendor.e({
            a: common_vendor.t(player.name),
            b: common_vendor.t(((_a2 = player.role) == null ? void 0 : _a2.name) || "未知"),
            c: player.isAlive
          }, player.isAlive ? {} : {
            d: common_vendor.t(player.deathRound),
            e: common_vendor.t(player.deathType === "killed" ? "被击杀" : "被投票"),
            f: common_vendor.t(player.deathType === "killed" ? "💀" : "🗳️")
          }, {
            g: player.id
          });
        }),
        ap: common_vendor.o(backToRoom),
        aq: common_vendor.o(playAgain),
        ar: common_vendor.o(() => {
        }),
        as: common_vendor.o(backToRoom)
      }) : {}, {
        at: isHost.value
      }, isHost.value ? {
        av: common_vendor.o(startGame),
        aw: gameState.value !== "idle" || currentRoom.value.players.length < 6 || configMode.value === "custom" && totalRoles.value !== playerCount.value
      } : {}, {
        ax: isHost.value && gameState.value === "idle"
      }, isHost.value && gameState.value === "idle" ? {
        ay: common_vendor.o(openInviteModal)
      } : {
        az: common_vendor.o(viewMyRole),
        aA: gameState.value === "idle" || hasViewedRole.value
      }, {
        aB: isHost.value && (gameState.value === "dealing" || gameState.value === "all_confirmed" || gameState.value === "judge_view")
      }, isHost.value && (gameState.value === "dealing" || gameState.value === "all_confirmed" || gameState.value === "judge_view") ? {
        aC: common_vendor.o(resetGame)
      } : {}, {
        aD: common_vendor.o(leaveRoom),
        aE: showInviteModal.value
      }, showInviteModal.value ? {
        aF: common_vendor.t(currentRoom.value.roomId),
        aG: common_vendor.t(qrCodeUrl.value),
        aH: common_vendor.t(shareLink.value),
        aI: common_vendor.o(copyShareLink),
        aJ: common_vendor.o(closeInviteModal),
        aK: common_vendor.o(shareToFriends),
        aL: common_vendor.o(() => {
        }),
        aM: common_vendor.o(closeInviteModal)
      } : {}, {
        aN: common_vendor.o(($event) => showShareModal.value = false),
        aO: common_vendor.p({
          visible: showShareModal.value,
          roomId: ((_h = currentRoom.value) == null ? void 0 : _h.roomId) || "",
          roomType: "werewolf",
          serverUrl: wifiInfo.value.serverUrl
        })
      }));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d5bfb40b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/boardgame/werewolf-room.js.map
