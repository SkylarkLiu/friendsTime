"use strict";
const common_vendor = require("../../common/vendor.js");
const store_room = require("../../store/room.js");
const _sfc_main = {
  __name: "room",
  setup(__props) {
    const roomStore = store_room.useRoomStore();
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
    common_vendor.onMounted(() => {
      roomStore.loadCurrentRoom();
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
      const room = await roomStore.createRoom(inputRoomName.value.trim());
      await roomStore.joinRoom(room.roomId, inputPlayerName.value.trim());
      showCreateRoomModal.value = false;
      common_vendor.index.showToast({
        title: "创建成功",
        icon: "success"
      });
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
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: isInRoom.value === false
      }, isInRoom.value === false ? common_vendor.e({
        b: common_vendor.o(showJoinModal),
        c: common_vendor.o(showCreateModal),
        d: recentRooms.value.length > 0
      }, recentRooms.value.length > 0 ? {
        e: common_vendor.f(recentRooms.value, (room, k0, i0) => {
          return {
            a: common_vendor.t(room.name),
            b: common_vendor.t(room.roomId),
            c: common_vendor.t(room.players.length),
            d: room.roomId,
            e: common_vendor.o(($event) => quickJoinRoom(room.roomId), room.roomId)
          };
        })
      } : {}) : {}, {
        f: isInRoom.value === true
      }, isInRoom.value === true ? common_vendor.e({
        g: common_vendor.t(currentRoom.value.name),
        h: common_vendor.t(currentRoom.value.roomId),
        i: common_vendor.t(playerCount.value),
        j: common_vendor.o(copyRoomId),
        k: common_vendor.o(handleLeaveRoom),
        l: common_vendor.o(($event) => showAddPlayerModal.value = true),
        m: rankList.value.length > 0
      }, rankList.value.length > 0 ? {
        n: common_vendor.f(rankList.value, (player, index, i0) => {
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
        o: currentRoom.value.players.some((p) => p.scores.length > 0)
      }, currentRoom.value.players.some((p) => p.scores.length > 0) ? common_vendor.e({
        p: common_vendor.t(showHistory.value ? "收起" : "展开"),
        q: common_vendor.o(($event) => showHistory.value = !showHistory.value),
        r: showHistory.value
      }, showHistory.value ? {
        s: common_vendor.f(gameHistory.value, (record, k0, i0) => {
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
        t: showJoinRoomModal.value === true
      }, showJoinRoomModal.value === true ? {
        v: inputRoomId.value,
        w: common_vendor.o(($event) => inputRoomId.value = $event.detail.value),
        x: inputPlayerName.value,
        y: common_vendor.o(($event) => inputPlayerName.value = $event.detail.value),
        z: common_vendor.o(($event) => showJoinRoomModal.value = false),
        A: common_vendor.o(handleJoinRoom),
        B: common_vendor.o(() => {
        }),
        C: common_vendor.o(handleCloseJoinModal)
      } : {}, {
        D: showCreateRoomModal.value === true
      }, showCreateRoomModal.value === true ? {
        E: inputRoomName.value,
        F: common_vendor.o(($event) => inputRoomName.value = $event.detail.value),
        G: inputPlayerName.value,
        H: common_vendor.o(($event) => inputPlayerName.value = $event.detail.value),
        I: common_vendor.o(($event) => showCreateRoomModal.value = false),
        J: common_vendor.o(handleCreateRoom),
        K: common_vendor.o(() => {
        }),
        L: common_vendor.o(handleCloseCreateModal)
      } : {}, {
        M: showAddPlayerModal.value === true
      }, showAddPlayerModal.value === true ? {
        N: inputNewPlayerName.value,
        O: common_vendor.o(($event) => inputNewPlayerName.value = $event.detail.value),
        P: common_vendor.o(($event) => showAddPlayerModal.value = false),
        Q: common_vendor.o(handleAddPlayer),
        R: common_vendor.o(() => {
        }),
        S: common_vendor.o(handleCloseAddPlayerModal)
      } : {}, {
        T: showScoreModal.value === true
      }, showScoreModal.value === true ? {
        U: common_vendor.t(selectedPlayer.value && selectedPlayer.value.name),
        V: inputGameName.value,
        W: common_vendor.o(($event) => inputGameName.value = $event.detail.value),
        X: inputScore.value,
        Y: common_vendor.o(($event) => inputScore.value = $event.detail.value),
        Z: inputRole.value,
        aa: common_vendor.o(($event) => inputRole.value = $event.detail.value),
        ab: common_vendor.o(($event) => showScoreModal.value = false),
        ac: common_vendor.o(handleAddScore),
        ad: common_vendor.o(() => {
        }),
        ae: common_vendor.o(handleCloseScoreModal)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-77aff15d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/rank/room.js.map
