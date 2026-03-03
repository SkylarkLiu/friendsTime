"use strict";
const common_vendor = require("../common/vendor.js");
class NetworkManager {
  constructor() {
    this.socket = null;
    this.isHost = false;
    this.playerId = null;
    this.token = null;
    this.roomId = null;
    this.callbacks = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  // 初始化网络连接
  async init(isHost, roomId, playerId, token) {
    this.isHost = isHost;
    this.roomId = roomId;
    this.playerId = playerId;
    this.token = token;
    try {
      common_vendor.index.__f__("log", "at api/network.js:24", "初始化网络连接", { isHost, roomId, playerId });
      this.socket = { connected: true };
      this.registerEventListeners();
      return { success: true };
    } catch (error) {
      common_vendor.index.__f__("error", "at api/network.js:34", "网络连接失败:", error);
      return { success: false, message: "网络连接失败" };
    }
  }
  // 注册事件监听器
  registerEventListeners() {
  }
  // 处理接收到的消息
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      const { type, payload } = message;
      if (this.callbacks[type]) {
        this.callbacks[type](payload);
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at api/network.js:57", "处理消息失败:", error);
    }
  }
  // 处理断开连接
  handleDisconnect() {
    common_vendor.index.__f__("log", "at api/network.js:63", "网络连接断开");
    this.attemptReconnect();
  }
  // 尝试重连
  async attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      common_vendor.index.__f__("log", "at api/network.js:71", `尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.init(this.isHost, this.roomId, this.playerId, this.token);
      }, 3e3);
    } else {
      common_vendor.index.__f__("log", "at api/network.js:78", "重连失败，已达到最大尝试次数");
      if (this.callbacks["reconnect_failed"]) {
        this.callbacks["reconnect_failed"]();
      }
    }
  }
  // 发送消息
  send(type, payload) {
    if (!this.socket || !this.socket.connected) {
      common_vendor.index.__f__("error", "at api/network.js:89", "网络未连接，无法发送消息");
      return false;
    }
    try {
      const message = JSON.stringify({ type, payload });
      common_vendor.index.__f__("log", "at api/network.js:96", "发送消息:", message);
      return true;
    } catch (error) {
      common_vendor.index.__f__("error", "at api/network.js:99", "发送消息失败:", error);
      return false;
    }
  }
  // 广播消息给所有玩家
  broadcast(type, payload) {
    if (!this.isHost) {
      common_vendor.index.__f__("error", "at api/network.js:107", "只有房主可以广播消息");
      return false;
    }
    return this.send("broadcast", { type, payload });
  }
  // 发送消息给特定玩家
  sendToPlayer(playerId, type, payload) {
    if (!this.isHost) {
      common_vendor.index.__f__("error", "at api/network.js:117", "只有房主可以发送消息给特定玩家");
      return false;
    }
    return this.send("send_to_player", { playerId, type, payload });
  }
  // 注册事件回调
  on(event, callback) {
    this.callbacks[event] = callback;
  }
  // 断开连接
  disconnect() {
    if (this.socket) {
      common_vendor.index.__f__("log", "at api/network.js:133", "断开网络连接");
      this.socket = null;
    }
  }
  // 生成分享链接
  generateShareLink() {
    const baseUrl = "https://friendsparty.example.com/join";
    const params = `roomId=${encodeURIComponent(this.roomId)}&token=${encodeURIComponent(this.token)}`;
    return `${baseUrl}?${params}`;
  }
  // 生成二维码
  generateQRCode() {
    const shareLink = this.generateShareLink();
    common_vendor.index.__f__("log", "at api/network.js:149", "生成二维码:", shareLink);
    return shareLink;
  }
}
const networkManager = new NetworkManager();
exports.networkManager = networkManager;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/network.js.map
