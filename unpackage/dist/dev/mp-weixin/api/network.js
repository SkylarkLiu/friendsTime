"use strict";
const common_vendor = require("../common/vendor.js");
const api_config = require("./config.js");
class NetworkManager {
  constructor() {
    this.socketTask = null;
    this.isHost = false;
    this.playerId = null;
    this.token = null;
    this.roomId = null;
    this.wsUrl = null;
    this.callbacks = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelays = [3e3, 5e3, 8e3, 1e4, 15e3, 2e4, 25e3, 3e4, 35e3, 4e4];
    this.reconnectTimer = null;
    this.pingTimer = null;
    this._connecting = false;
    this.localIP = null;
    this.networkType = "unknown";
  }
  /**
   * 获取当前网络类型
   */
  async getNetworkType() {
    return new Promise((resolve) => {
      common_vendor.index.getNetworkType({
        success: (res) => {
          this.networkType = res.networkType;
          resolve(res.networkType);
        },
        fail: () => {
          this.networkType = "unknown";
          resolve("unknown");
        }
      });
    });
  }
  /**
   * 获取本地 IP 地址
   * 注意：微信小程序需要在 app.json 中配置权限
   */
  async getLocalIPAddress() {
    return new Promise((resolve) => {
      if (typeof common_vendor.index.getLocalIPAddress === "function") {
        common_vendor.index.getLocalIPAddress({
          success: (res) => {
            this.localIP = res.localip || res.ip;
            resolve(this.localIP);
          },
          fail: () => {
            resolve(null);
          }
        });
      } else {
        this._getLocalIPViaWebRTC().then((ip) => {
          this.localIP = ip;
          resolve(ip);
        }).catch(() => {
          resolve(null);
        });
      }
    });
  }
  /**
   * 通过 WebRTC 获取本地 IP（H5 环境）
   */
  _getLocalIPViaWebRTC() {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.RTCPeerConnection) {
        reject(new Error("WebRTC not supported"));
        return;
      }
      const pc = new RTCPeerConnection({
        iceServers: []
      });
      pc.createDataChannel("");
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          pc.close();
          reject(new Error("No candidate"));
          return;
        }
        const candidate = e.candidate.candidate;
        const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch) {
          const ip = ipMatch[1];
          if (this._isPrivateIP(ip)) {
            pc.close();
            resolve(ip);
          }
        }
      };
      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(reject);
    });
  }
  /**
   * 判断是否为局域网 IP
   */
  _isPrivateIP(ip) {
    const parts = ip.split(".").map(Number);
    if (parts[0] === 10)
      return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      return true;
    if (parts[0] === 192 && parts[1] === 168)
      return true;
    return false;
  }
  /**
   * 检测 WiFi 并自动设置服务器地址
   * @returns {Promise<{isWiFi: boolean, localIP: string|null, serverUrl: string}>}
   */
  async detectWiFiAndSetServer() {
    const networkType = await this.getNetworkType();
    const isWiFi = networkType === "wifi";
    let localIP = null;
    let serverUrl = api_config.getApiBaseUrl();
    if (isWiFi) {
      localIP = await this.getLocalIPAddress();
      if (localIP) {
        serverUrl = `http://${localIP}:3000`;
        try {
          api_config.setApiBaseUrl(serverUrl);
          common_vendor.index.__f__("log", "at api/network.js:150", "已自动设置服务器地址:", serverUrl);
        } catch (e) {
          common_vendor.index.__f__("error", "at api/network.js:152", "设置服务器地址失败:", e);
        }
      }
    }
    return {
      isWiFi,
      localIP,
      serverUrl
    };
  }
  /**
   * 获取当前服务器信息
   */
  getServerInfo() {
    return {
      networkType: this.networkType,
      localIP: this.localIP,
      serverUrl: api_config.getApiBaseUrl()
    };
  }
  getWsUrl() {
    if (this.wsUrl)
      return this.wsUrl;
    const base = api_config.getApiBaseUrl().replace(/^http/i, "ws").replace(/\/$/, "");
    return `${base}/v1/ws`;
  }
  buildWsUrl() {
    const wsBaseUrl = this.getWsUrl();
    const params = `roomId=${encodeURIComponent(this.roomId)}&playerId=${encodeURIComponent(this.playerId)}&token=${encodeURIComponent(this.token)}`;
    return `${wsBaseUrl}?${params}`;
  }
  async init(isHost, roomId, playerId, token, wsUrl = null) {
    this.isHost = isHost;
    this.roomId = roomId;
    this.playerId = playerId;
    this.token = token;
    if (wsUrl)
      this.wsUrl = wsUrl;
    this.reconnectAttempts = 0;
    if (isHost) {
      await this.detectWiFiAndSetServer();
    }
    return this._connect();
  }
  _connect() {
    if (this._connecting) {
      return Promise.resolve({ success: false, message: "正在连接中" });
    }
    this._connecting = true;
    return new Promise((resolve) => {
      const url = this.buildWsUrl();
      try {
        this.socketTask = common_vendor.index.connectSocket({
          url,
          fail: (err) => {
            this._connecting = false;
            common_vendor.index.__f__("error", "at api/network.js:216", "WebSocket 连接失败:", err);
            this._scheduleReconnect();
            resolve({ success: false, message: err.errMsg || "连接失败" });
          }
        });
        this.socketTask.onOpen(() => {
          this._connecting = false;
          this.reconnectAttempts = 0;
          this._startPing();
          resolve({ success: true });
        });
        this.socketTask.onMessage((res) => {
          this._handleMessage(res.data);
        });
        this.socketTask.onClose((res) => {
          this._stopPing();
          if (!res || res.code !== 1e3) {
            this._scheduleReconnect();
          }
          if (this.callbacks["disconnect"]) {
            this.callbacks["disconnect"](res);
          }
        });
        this.socketTask.onError((err) => {
          this._connecting = false;
          common_vendor.index.__f__("error", "at api/network.js:245", "WebSocket 错误:", err);
          if (this.callbacks["error"]) {
            this.callbacks["error"](err);
          }
        });
      } catch (e) {
        this._connecting = false;
        resolve({ success: false, message: e.message || "连接异常" });
      }
    });
  }
  _handleMessage(raw) {
    try {
      const msg = JSON.parse(raw);
      const { type, payload } = msg;
      if (type === "pong") {
        return;
      }
      if (type === "error") {
        common_vendor.index.__f__("error", "at api/network.js:266", "服务端错误:", payload);
        if (this.callbacks["error"]) {
          this.callbacks["error"](payload);
        }
        return;
      }
      if (this.callbacks[type]) {
        this.callbacks[type](payload);
      }
    } catch (e) {
      common_vendor.index.__f__("error", "at api/network.js:276", "解析消息失败:", raw, e);
    }
  }
  _startPing() {
    this._stopPing();
    this.pingTimer = setInterval(() => {
      this.send("ping", {});
    }, 25e3);
  }
  _stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      common_vendor.index.__f__("log", "at api/network.js:296", "重连次数已用尽");
      if (this.callbacks["reconnect_failed"]) {
        this.callbacks["reconnect_failed"]();
      }
      return;
    }
    const delay = this.reconnectDelays[this.reconnectAttempts] || 4e4;
    this.reconnectAttempts++;
    common_vendor.index.__f__("log", "at api/network.js:304", `将在 ${delay / 1e3}s 后重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    if (this.reconnectTimer)
      clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this._connect().then((res) => {
        if (res.success && this.callbacks["reconnected"]) {
          this.callbacks["reconnected"]();
        }
      });
    }, delay);
  }
  send(type, payload) {
    if (!this.socketTask)
      return false;
    try {
      const msg = JSON.stringify({ type, payload });
      this.socketTask.send({ data: msg });
      return true;
    } catch (e) {
      common_vendor.index.__f__("error", "at api/network.js:324", "发送失败:", e);
      return false;
    }
  }
  broadcast(type, payload) {
    return true;
  }
  sendToPlayer(playerId, type, payload) {
    return this.send("send_to_player", { playerId, type, payload });
  }
  on(event, callback) {
    this.callbacks[event] = callback;
  }
  disconnect() {
    this._stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.socketTask) {
      try {
        this.socketTask.close({ code: 1e3 });
      } catch (_) {
      }
      this.socketTask = null;
    }
  }
  generateShareLink() {
    if (!this.roomId)
      return "";
    const serverUrl = api_config.getApiBaseUrl();
    const baseUrl = serverUrl.replace("/api", "");
    return `${baseUrl}/join?roomId=${encodeURIComponent(this.roomId)}`;
  }
  generateQRCode() {
    return this.generateShareLink();
  }
}
const networkManager = new NetworkManager();
exports.networkManager = networkManager;
//# sourceMappingURL=../../.sourcemap/mp-weixin/api/network.js.map
