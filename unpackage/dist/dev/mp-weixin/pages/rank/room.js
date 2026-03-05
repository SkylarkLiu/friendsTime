"use strict";
const common_vendor = require("../../common/vendor.js");
const store_room = require("../../store/room.js");
const api_network = require("../../api/network.js");
const api_config = require("../../api/config.js");
if (!Math) {
  ShareRoomModal();
}
const ShareRoomModal = () => "../../components/ShareRoomModal.js";
const _sfc_main = {
  __name: "room",
  setup(__props) {
    const roomStore = store_room.useRoomStore();
    const showShareModal = common_vendor.ref(false);
    const wifiInfo = common_vendor.ref({
      isWiFi: false,
      localIP: null,
      serverUrl: ""
    });
    const isInRoom = common_vendor.computed(() => roomStore.isInRoom);
    const currentRoom = common_vendor.computed(() => roomStore.currentRoom);
    const playerCount = common_vendor.computed(() => roomStore.playerCount);
    const rankList = common_vendor.computed(() => roomStore.rankList);
    const recentRooms = common_vendor.computed(() => roomStore.getAllRooms().slice(0, 5));
    const gameHistory = common_vendor.computed(() => {
      if (!currentRoom.value)
        return [];
      const history = [];
      currentRoom.value.players.forEach((player) => {
        player.scores.forEach((score) => {
          history.push({
            playerName: player.name,
            game: score.game,
            score: score.score,
            role: score.role,
            time: score.time
          });
        });
      });
      return history.sort((a, b) => b.time - a.time).slice(0, 20);
    });
    const showJoinRoomModal = common_vendor.ref(false);
    const showCreateRoomModal = common_vendor.ref(false);
    const showAddPlayerModal = common_vendor.ref(false);
    const showScoreModal = common_vendor.ref(false);
    const showHistory = common_vendor.ref(false);
    const inputRoomId = common_vendor.ref("");
    const inputRoomName = common_vendor.ref("");
    const inputPlayerName = common_vendor.ref("");
    const inputNewPlayerName = common_vendor.ref("");
    const inputGameName = common_vendor.ref("");
    const inputScore = common_vendor.ref("");
    const inputRole = common_vendor.ref("");
    const selectedPlayer = common_vendor.ref(null);
    common_vendor.onMounted(async () => {
      roomStore.loadCurrentRoom();
      try {
        const info = await api_network.networkManager.detectWiFiAndSetServer();
        wifiInfo.value = info;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/rank/room.vue:320", "检测WiFi失败:", e);
      }
    });
    const showJoinModal = () => {
      inputRoomId.value = "";
      inputPlayerName.value = "";
      showJoinRoomModal.value = true;
    };
    const showCreateModal = () => {
      inputRoomName.value = "";
      inputPlayerName.value = "";
      showCreateRoomModal.value = true;
    };
    const showServerConfig = () => {
      const current = api_config.getApiBaseUrl();
      common_vendor.index.showModal({
        title: "服务器设置",
        editable: true,
        placeholderText: "例如：http://192.168.1.100:3000",
        content: current,
        confirmText: "保存",
        cancelText: "取消",
        success: (res) => {
          if (!res.confirm)
            return;
          const value = (res.content || "").trim();
          try {
            if (!value) {
              api_config.clearApiBaseUrl();
              common_vendor.index.showToast({ title: "已恢复默认地址", icon: "success" });
              return;
            }
            api_config.setApiBaseUrl(value);
            common_vendor.index.showToast({ title: "已保存", icon: "success" });
          } catch (e) {
            common_vendor.index.showToast({ title: e.message || "地址无效", icon: "none" });
          }
        }
      });
    };
    const handleCloseJoinModal = () => {
      showJoinRoomModal.value = false;
    };
    const handleCloseCreateModal = () => {
      showCreateRoomModal.value = false;
    };
    const handleCloseAddPlayerModal = () => {
      showAddPlayerModal.value = false;
    };
    const handleCloseScoreModal = () => {
      showScoreModal.value = false;
    };
    const handleJoinRoom = async () => {
      if (!inputRoomId.value || inputRoomId.value.length !== 6) {
        common_vendor.index.showToast({
          title: "请输入6位房间码",
          icon: "none"
        });
        return;
      }
      if (!inputPlayerName.value.trim()) {
        common_vendor.index.showToast({
          title: "请输入昵称",
          icon: "none"
        });
        return;
      }
      const result = await roomStore.joinRoom(inputRoomId.value, inputPlayerName.value.trim());
      if (result.success) {
        showJoinRoomModal.value = false;
        common_vendor.index.showToast({
          title: "加入成功",
          icon: "success"
        });
      } else {
        common_vendor.index.showModal({
          title: "提示",
          content: result.message + "，是否创建新房间？",
          success: (res) => {
            if (res.confirm) {
              showJoinRoomModal.value = false;
              inputRoomName.value = `房间${inputRoomId.value}`;
              showCreateRoomModal.value = true;
            }
          }
        });
      }
    };
    const handleCreateRoom = async () => {
      if (!inputRoomName.value.trim()) {
        common_vendor.index.showToast({
          title: "请输入房间名称",
          icon: "none"
        });
        return;
      }
      if (!inputPlayerName.value.trim()) {
        common_vendor.index.showToast({
          title: "请输入昵称",
          icon: "none"
        });
        return;
      }
      try {
        await roomStore.createRoom(inputRoomName.value.trim(), "slaughter_side", {
          hostName: inputPlayerName.value.trim()
        });
        showCreateRoomModal.value = false;
        common_vendor.index.showToast({
          title: "创建成功",
          icon: "success"
        });
      } catch (e) {
        common_vendor.index.showToast({
          title: e.message || "创建失败",
          icon: "none"
        });
      }
    };
    const quickJoinRoom = async (roomId) => {
      common_vendor.index.showModal({
        title: "加入房间",
        editable: true,
        placeholderText: "请输入你的昵称",
        success: async (res) => {
          if (res.confirm && res.content) {
            const result = await roomStore.joinRoom(roomId, res.content.trim());
            if (result.success) {
              common_vendor.index.showToast({
                title: "加入成功",
                icon: "success"
              });
            } else {
              common_vendor.index.showToast({
                title: result.message,
                icon: "none"
              });
            }
          }
        }
      });
    };
    const handleLeaveRoom = async () => {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出当前房间吗？",
        success: async (res) => {
          if (res.confirm) {
            await roomStore.leaveRoom();
            common_vendor.index.showToast({
              title: "已退出房间",
              icon: "success"
            });
          }
        }
      });
    };
    const handleAddPlayer = async () => {
      if (!inputNewPlayerName.value.trim()) {
        common_vendor.index.showToast({
          title: "请输入玩家昵称",
          icon: "none"
        });
        return;
      }
      const result = await roomStore.addPlayer(inputNewPlayerName.value.trim());
      if (result.success) {
        showAddPlayerModal.value = false;
        inputNewPlayerName.value = "";
        common_vendor.index.showToast({
          title: "添加成功",
          icon: "success"
        });
      } else {
        common_vendor.index.showToast({
          title: result.message,
          icon: "none"
        });
      }
    };
    const handleRemovePlayer = async (playerId) => {
      common_vendor.index.showModal({
        title: "确认移除",
        content: "确定要移除该玩家吗？",
        success: async (res) => {
          if (res.confirm) {
            await roomStore.removePlayer(playerId);
            common_vendor.index.showToast({
              title: "已移除",
              icon: "success"
            });
          }
        }
      });
    };
    const showAddScoreModal = (player) => {
      selectedPlayer.value = player;
      inputGameName.value = "狼人杀";
      inputScore.value = "";
      inputRole.value = "";
      showScoreModal.value = true;
    };
    const handleAddScore = async () => {
      if (!inputGameName.value.trim()) {
        common_vendor.index.showToast({
          title: "请输入游戏名称",
          icon: "none"
        });
        return;
      }
      if (!inputScore.value) {
        common_vendor.index.showToast({
          title: "请输入分数",
          icon: "none"
        });
        return;
      }
      const result = await roomStore.addScore(selectedPlayer.value.id, {
        game: inputGameName.value.trim(),
        score: parseInt(inputScore.value),
        role: inputRole.value.trim()
      });
      if (result.success) {
        showScoreModal.value = false;
        common_vendor.index.showToast({
          title: "录入成功",
          icon: "success"
        });
      }
    };
    const copyRoomId = () => {
      common_vendor.index.setClipboardData({
        data: currentRoom.value.roomId,
        success: () => {
          common_vendor.index.showToast({
            title: "房间码已复制",
            icon: "success"
          });
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
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: isInRoom.value === false
      }, isInRoom.value === false ? common_vendor.e({
        b: common_vendor.o(showJoinModal),
        c: common_vendor.o(showCreateModal),
        d: common_vendor.o(showServerConfig),
        e: recentRooms.value.length > 0
      }, recentRooms.value.length > 0 ? {
        f: common_vendor.f(recentRooms.value, (room, k0, i0) => {
          return {
            a: common_vendor.t(room.name),
            b: common_vendor.t(room.roomId),
            c: common_vendor.t(room.players ? room.players.length : 0),
            d: room.roomId,
            e: common_vendor.o(($event) => quickJoinRoom(room.roomId), room.roomId)
          };
        })
      } : {}) : {}, {
        g: isInRoom.value === true
      }, isInRoom.value === true ? common_vendor.e({
        h: common_vendor.t(currentRoom.value.name),
        i: common_vendor.t(currentRoom.value.roomId),
        j: _ctx.isHost
      }, _ctx.isHost ? {
        k: common_vendor.o(($event) => showShareModal.value = true)
      } : {}, {
        l: common_vendor.t(playerCount.value),
        m: wifiInfo.value.isWiFi
      }, wifiInfo.value.isWiFi ? {} : {}, {
        n: common_vendor.o(copyRoomId),
        o: common_vendor.o(handleLeaveRoom),
        p: _ctx.isHost && wifiInfo.value.serverUrl
      }, _ctx.isHost && wifiInfo.value.serverUrl ? {
        q: common_vendor.t(wifiInfo.value.serverUrl),
        r: common_vendor.o(copyServerUrl)
      } : {}, {
        s: common_vendor.o(($event) => showAddPlayerModal.value = true),
        t: rankList.value.length > 0
      }, rankList.value.length > 0 ? {
        v: common_vendor.f(rankList.value, (player, index, i0) => {
          return common_vendor.e({
            a: index < 3
          }, index < 3 ? {
            b: common_vendor.t(["🥇", "🥈", "🥉"][index])
          } : {
            c: common_vendor.t(index + 1)
          }, {
            d: index === 0 ? 1 : "",
            e: index === 1 ? 1 : "",
            f: index === 2 ? 1 : "",
            g: common_vendor.t(player.name.charAt(0)),
            h: common_vendor.t(player.name),
            i: common_vendor.t(player.scores.length),
            j: common_vendor.t(player.totalScore),
            k: common_vendor.o(($event) => showAddScoreModal(player), player.id),
            l: common_vendor.o(($event) => handleRemovePlayer(player.id), player.id),
            m: player.id
          });
        })
      } : {}, {
        w: currentRoom.value.players.some((p) => p.scores.length > 0)
      }, currentRoom.value.players.some((p) => p.scores.length > 0) ? common_vendor.e({
        x: common_vendor.t(showHistory.value ? "收起" : "展开"),
        y: common_vendor.o(($event) => showHistory.value = !showHistory.value),
        z: showHistory.value
      }, showHistory.value ? {
        A: common_vendor.f(gameHistory.value, (record, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(record.playerName),
            b: common_vendor.t(record.game),
            c: record.score > 0
          }, record.score > 0 ? {
            d: common_vendor.t(record.score)
          } : {
            e: common_vendor.t(record.score)
          }, {
            f: record.time
          });
        })
      } : {}) : {}) : {}, {
        B: showJoinRoomModal.value === true
      }, showJoinRoomModal.value === true ? {
        C: inputRoomId.value,
        D: common_vendor.o(($event) => inputRoomId.value = $event.detail.value),
        E: inputPlayerName.value,
        F: common_vendor.o(($event) => inputPlayerName.value = $event.detail.value),
        G: common_vendor.o(($event) => showJoinRoomModal.value = false),
        H: common_vendor.o(handleJoinRoom),
        I: common_vendor.o(() => {
        }),
        J: common_vendor.o(handleCloseJoinModal)
      } : {}, {
        K: showCreateRoomModal.value === true
      }, showCreateRoomModal.value === true ? {
        L: inputRoomName.value,
        M: common_vendor.o(($event) => inputRoomName.value = $event.detail.value),
        N: inputPlayerName.value,
        O: common_vendor.o(($event) => inputPlayerName.value = $event.detail.value),
        P: common_vendor.o(($event) => showCreateRoomModal.value = false),
        Q: common_vendor.o(handleCreateRoom),
        R: common_vendor.o(() => {
        }),
        S: common_vendor.o(handleCloseCreateModal)
      } : {}, {
        T: showAddPlayerModal.value === true
      }, showAddPlayerModal.value === true ? {
        U: inputNewPlayerName.value,
        V: common_vendor.o(($event) => inputNewPlayerName.value = $event.detail.value),
        W: common_vendor.o(($event) => showAddPlayerModal.value = false),
        X: common_vendor.o(handleAddPlayer),
        Y: common_vendor.o(() => {
        }),
        Z: common_vendor.o(handleCloseAddPlayerModal)
      } : {}, {
        aa: showScoreModal.value === true
      }, showScoreModal.value === true ? {
        ab: common_vendor.t(selectedPlayer.value && selectedPlayer.value.name),
        ac: inputGameName.value,
        ad: common_vendor.o(($event) => inputGameName.value = $event.detail.value),
        ae: inputScore.value,
        af: common_vendor.o(($event) => inputScore.value = $event.detail.value),
        ag: inputRole.value,
        ah: common_vendor.o(($event) => inputRole.value = $event.detail.value),
        ai: common_vendor.o(($event) => showScoreModal.value = false),
        aj: common_vendor.o(handleAddScore),
        ak: common_vendor.o(() => {
        }),
        al: common_vendor.o(handleCloseScoreModal)
      } : {}, {
        am: common_vendor.o(($event) => showShareModal.value = false),
        an: common_vendor.p({
          visible: showShareModal.value,
          roomId: ((_a = currentRoom.value) == null ? void 0 : _a.roomId) || "",
          roomType: "rank",
          serverUrl: wifiInfo.value.serverUrl
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-77aff15d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/rank/room.js.map
