"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_storage = require("../../utils/storage.js");
const api_config = require("../../api/config.js");
const MESSAGES_STORAGE_KEY = "anonymous_messages";
const CURRENT_ROOM_KEY = "anonymous_current_room";
const _sfc_main = {
  __name: "anonymous",
  setup(__props) {
    const roomIdInput = common_vendor.ref("");
    const serverAddress = common_vendor.ref(api_config.getApiBaseUrl());
    const currentRoomId = common_vendor.ref("");
    const isInRoom = common_vendor.ref(false);
    const inputContent = common_vendor.ref("");
    const replyContent = common_vendor.ref("");
    const replyingTo = common_vendor.ref(null);
    const replyInputFocus = common_vendor.ref(false);
    const scrollTop = common_vendor.ref(0);
    const allMessages = common_vendor.ref([]);
    const avatarIcons = ["🎭", "🐱", "🐶", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦅", "🐴", "🦄"];
    const messageList = common_vendor.computed(() => {
      if (!currentRoomId.value)
        return [];
      return allMessages.value.filter((msg) => msg.roomId === currentRoomId.value).sort((a, b) => b.createTime - a.createTime);
    });
    const getAvatarIcon = (index) => {
      return avatarIcons[index % avatarIcons.length];
    };
    const generateRoomId = () => {
      return Math.floor(1e5 + Math.random() * 9e5).toString();
    };
    const generateNickname = () => {
      const adjectives = ["神秘的", "路过的", "匿名的", "隐藏的", "悄悄的", "偷偷的", "隐身的", "神秘的"];
      const nouns = ["小可爱", "大侠", "侠客", "路人", "过客", "游客", "访客", "神秘人"];
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const num = Math.floor(Math.random() * 100);
      return `${adj}${noun}${num}`;
    };
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = /* @__PURE__ */ new Date();
      const diff = now - date;
      if (diff < 6e4) {
        return "刚刚";
      } else if (diff < 36e5) {
        return `${Math.floor(diff / 6e4)}分钟前`;
      } else if (diff < 864e5) {
        return `${Math.floor(diff / 36e5)}小时前`;
      } else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours().toString().padStart(2, "0");
        const minute = date.getMinutes().toString().padStart(2, "0");
        return `${month}/${day} ${hour}:${minute}`;
      }
    };
    const loadMessages = () => {
      const messages = utils_storage.getStorage(MESSAGES_STORAGE_KEY) || [];
      allMessages.value = messages;
    };
    const saveMessages = () => {
      utils_storage.setStorage(MESSAGES_STORAGE_KEY, allMessages.value);
    };
    const loadCurrentRoom = () => {
      const roomData = utils_storage.getStorage(CURRENT_ROOM_KEY);
      if (roomData && roomData.roomId) {
        currentRoomId.value = roomData.roomId;
        isInRoom.value = true;
      }
    };
    const saveCurrentRoom = () => {
      utils_storage.setStorage(CURRENT_ROOM_KEY, { roomId: currentRoomId.value });
    };
    const createRoom = () => {
      if (serverAddress.value) {
        try {
          api_config.setApiBaseUrl(serverAddress.value);
        } catch (e) {
          common_vendor.index.showToast({ title: e.message || "服务器地址无效", icon: "none" });
          return;
        }
      }
      const roomId = roomIdInput.value || generateRoomId();
      currentRoomId.value = roomId;
      isInRoom.value = true;
      saveCurrentRoom();
      common_vendor.index.showToast({ title: "房间创建成功", icon: "success" });
    };
    const joinRoom = () => {
      if (!roomIdInput.value) {
        common_vendor.index.showToast({ title: "请输入房间号", icon: "none" });
        return;
      }
      if (serverAddress.value) {
        try {
          api_config.setApiBaseUrl(serverAddress.value);
        } catch (e) {
          common_vendor.index.showToast({ title: e.message || "服务器地址无效", icon: "none" });
          return;
        }
      }
      currentRoomId.value = roomIdInput.value;
      isInRoom.value = true;
      saveCurrentRoom();
      common_vendor.index.showToast({ title: "加入房间成功", icon: "success" });
    };
    const leaveRoom = () => {
      currentRoomId.value = "";
      isInRoom.value = false;
      utils_storage.setStorage(CURRENT_ROOM_KEY, null);
    };
    const sendMessage = () => {
      if (!inputContent.value.trim())
        return;
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId: currentRoomId.value,
        content: inputContent.value.trim(),
        nickname: generateNickname(),
        avatarIndex: Math.floor(Math.random() * avatarIcons.length),
        likes: 0,
        dislikes: 0,
        replies: [],
        createTime: Date.now()
      };
      allMessages.value.push(message);
      saveMessages();
      inputContent.value = "";
      common_vendor.index.showToast({ title: "吐槽成功", icon: "success" });
    };
    const likeMessage = (msgId) => {
      const msg = allMessages.value.find((m) => m.id === msgId);
      if (msg) {
        msg.likes++;
        saveMessages();
      }
    };
    const dislikeMessage = (msgId) => {
      const msg = allMessages.value.find((m) => m.id === msgId);
      if (msg) {
        msg.dislikes++;
        saveMessages();
      }
    };
    const showReplyInput = (msgId) => {
      replyingTo.value = msgId;
      replyContent.value = "";
      replyInputFocus.value = true;
    };
    const hideReplyInput = () => {
      setTimeout(() => {
        replyingTo.value = null;
        replyContent.value = "";
        replyInputFocus.value = false;
      }, 200);
    };
    const submitReply = () => {
      if (!replyContent.value.trim() || !replyingTo.value)
        return;
      const msg = allMessages.value.find((m) => m.id === replyingTo.value);
      if (msg) {
        if (!msg.replies) {
          msg.replies = [];
        }
        msg.replies.push({
          id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: replyContent.value.trim(),
          nickname: generateNickname(),
          avatarIndex: Math.floor(Math.random() * avatarIcons.length),
          createTime: Date.now()
        });
        saveMessages();
        common_vendor.index.showToast({ title: "回复成功", icon: "success" });
      }
      replyingTo.value = null;
      replyContent.value = "";
      replyInputFocus.value = false;
    };
    const loadMoreMessages = () => {
      common_vendor.index.showToast({ title: "没有更多了", icon: "none" });
    };
    loadMessages();
    loadCurrentRoom();
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isInRoom.value
      }, !isInRoom.value ? {
        b: roomIdInput.value,
        c: common_vendor.o(($event) => roomIdInput.value = $event.detail.value),
        d: serverAddress.value,
        e: common_vendor.o(($event) => serverAddress.value = $event.detail.value),
        f: common_vendor.o(createRoom),
        g: common_vendor.o(joinRoom),
        h: !roomIdInput.value
      } : common_vendor.e({
        i: common_vendor.t(currentRoomId.value),
        j: common_vendor.o(leaveRoom),
        k: common_vendor.f(messageList.value, (msg, k0, i0) => {
          var _a;
          return common_vendor.e({
            a: common_vendor.t(getAvatarIcon(msg.avatarIndex)),
            b: common_vendor.t(msg.nickname),
            c: common_vendor.t(formatTime(msg.createTime)),
            d: common_vendor.t(msg.content),
            e: common_vendor.t(msg.likes),
            f: common_vendor.o(($event) => likeMessage(msg.id), msg.id),
            g: common_vendor.t(msg.dislikes),
            h: common_vendor.o(($event) => dislikeMessage(msg.id), msg.id),
            i: common_vendor.t(((_a = msg.replies) == null ? void 0 : _a.length) || 0),
            j: common_vendor.o(($event) => showReplyInput(msg.id), msg.id),
            k: msg.replies && msg.replies.length > 0
          }, msg.replies && msg.replies.length > 0 ? {
            l: common_vendor.f(msg.replies, (reply, k1, i1) => {
              return {
                a: common_vendor.t(getAvatarIcon(reply.avatarIndex)),
                b: common_vendor.t(reply.nickname),
                c: common_vendor.t(formatTime(reply.createTime)),
                d: common_vendor.t(reply.content),
                e: reply.id
              };
            })
          } : {}, {
            m: msg.id
          });
        }),
        l: messageList.value.length === 0
      }, messageList.value.length === 0 ? {} : {}, {
        m: scrollTop.value,
        n: common_vendor.o(loadMoreMessages),
        o: replyingTo.value
      }, replyingTo.value ? {
        p: replyInputFocus.value,
        q: common_vendor.o(hideReplyInput),
        r: common_vendor.o(submitReply),
        s: replyContent.value,
        t: common_vendor.o(($event) => replyContent.value = $event.detail.value),
        v: common_vendor.o(submitReply)
      } : {
        w: inputContent.value,
        x: common_vendor.o(($event) => inputContent.value = $event.detail.value),
        y: common_vendor.o(sendMessage),
        z: !inputContent.value.trim()
      }));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-77a3a169"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/chat/anonymous.js.map
