"use strict";
const common_vendor = require("../common/vendor.js");
const utils_storage = require("../utils/storage.js");
const api_network = require("../api/network.js");
const ROOMS_STORAGE_KEY = "rooms_data";
const CURRENT_ROOM_KEY = "current_room";
const useRoomStore = common_vendor.defineStore("room", () => {
  const currentRoom = common_vendor.ref(null);
  const allRooms = common_vendor.ref(utils_storage.getStorage(ROOMS_STORAGE_KEY) || []);
  const networkStatus = common_vendor.ref("disconnected");
  const isHost = common_vendor.ref(false);
  const playerId = common_vendor.ref(null);
  const token = common_vendor.ref(null);
  const isInRoom = common_vendor.computed(() => !!currentRoom.value);
  const currentRoomId = common_vendor.computed(() => {
    var _a;
    return ((_a = currentRoom.value) == null ? void 0 : _a.roomId) || "";
  });
  const currentPlayers = common_vendor.computed(() => {
    var _a;
    return ((_a = currentRoom.value) == null ? void 0 : _a.players) || [];
  });
  const playerCount = common_vendor.computed(() => currentPlayers.value.length);
  const connectionStatus = common_vendor.computed(() => networkStatus.value);
  const rankList = common_vendor.computed(() => {
    if (!currentRoom.value)
      return [];
    return [...currentRoom.value.players].map((player) => ({
      ...player,
      totalScore: player.scores.reduce((sum, s) => sum + s.score, 0)
    })).sort((a, b) => b.totalScore - a.totalScore);
  });
  const generateRoomId = () => {
    return Math.floor(1e5 + Math.random() * 9e5).toString();
  };
  const generatePlayerId = () => {
    return `player_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;
  };
  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };
  const createRoom = async (roomName, winCondition = "slaughter_side", roomId = null) => {
    const roomIdToUse = roomId || generateRoomId();
    const newPlayerId = generatePlayerId();
    const newToken = generateToken();
    const newRoom = {
      roomId: roomIdToUse,
      name: roomName,
      players: [],
      winCondition,
      // 'slaughter_side' | 'slaughter_all'
      createTime: Date.now(),
      updateTime: Date.now()
    };
    allRooms.value.push(newRoom);
    saveAllRooms();
    currentRoom.value = newRoom;
    saveCurrentRoom();
    isHost.value = true;
    playerId.value = newPlayerId;
    token.value = newToken;
    networkStatus.value = "connecting";
    const networkResult = await api_network.networkManager.init(true, roomIdToUse, newPlayerId, newToken);
    if (networkResult.success) {
      networkStatus.value = "connected";
      common_vendor.index.__f__("log", "at store/room.js:75", "房间创建成功，网络连接已建立");
    } else {
      networkStatus.value = "disconnected";
      common_vendor.index.__f__("error", "at store/room.js:78", "网络连接失败:", networkResult.message);
    }
    return newRoom;
  };
  const getRoom = async (roomId) => {
    const room = allRooms.value.find((r) => r.roomId === roomId);
    if (!room) {
      return null;
    }
    return room;
  };
  const joinRoom = async (roomId, playerName) => {
    const newPlayerId = generatePlayerId();
    const newToken = generateToken();
    networkStatus.value = "connecting";
    const networkResult = await api_network.networkManager.init(false, roomId, newPlayerId, newToken);
    if (!networkResult.success) {
      networkStatus.value = "disconnected";
      return {
        success: false,
        message: "网络连接失败: " + networkResult.message
      };
    }
    const room = await getRoom(roomId);
    if (!room) {
      api_network.networkManager.disconnect();
      networkStatus.value = "disconnected";
      return {
        success: false,
        message: "房间不存在或已过期"
      };
    }
    const existingPlayer = room.players.find((p) => p.name === playerName);
    if (existingPlayer) {
      api_network.networkManager.disconnect();
      networkStatus.value = "disconnected";
      return {
        success: false,
        message: "该房间已存在同名玩家"
      };
    }
    const newPlayer = {
      id: newPlayerId,
      name: playerName,
      avatar: "",
      scores: [],
      isAlive: true,
      deathType: null,
      deathRound: null,
      createTime: Date.now()
    };
    room.players.push(newPlayer);
    room.updateTime = Date.now();
    saveAllRooms();
    currentRoom.value = room;
    saveCurrentRoom();
    isHost.value = false;
    playerId.value = newPlayerId;
    token.value = newToken;
    networkStatus.value = "connected";
    common_vendor.index.__f__("log", "at store/room.js:154", "加入房间成功，网络连接已建立");
    return {
      success: true,
      data: room
    };
  };
  const leaveRoom = async () => {
    if (!currentRoom.value)
      return;
    api_network.networkManager.disconnect();
    networkStatus.value = "disconnected";
    const roomId = currentRoom.value.roomId;
    const room = allRooms.value.find((r) => r.roomId === roomId);
    if (room) {
      room.updateTime = Date.now();
      saveAllRooms();
    }
    currentRoom.value = null;
    isHost.value = false;
    playerId.value = null;
    token.value = null;
    utils_storage.removeStorage(CURRENT_ROOM_KEY);
    return { success: true };
  };
  const addScore = async (playerId2, scoreData) => {
    if (!currentRoom.value) {
      return { success: false, message: "未加入房间" };
    }
    const player = currentRoom.value.players.find((p) => p.id === playerId2);
    if (!player) {
      return { success: false, message: "玩家不存在" };
    }
    player.scores.push({
      ...scoreData,
      time: Date.now()
    });
    currentRoom.value.updateTime = Date.now();
    saveAllRooms();
    saveCurrentRoom();
    return { success: true };
  };
  const getRankList = async () => {
    if (!currentRoom.value) {
      return { success: false, message: "未加入房间" };
    }
    return {
      success: true,
      data: rankList.value
    };
  };
  const addPlayer = async (playerName) => {
    if (!currentRoom.value) {
      return { success: false, message: "未加入房间" };
    }
    const existingPlayer = currentRoom.value.players.find((p) => p.name === playerName);
    if (existingPlayer) {
      return { success: false, message: "该房间已存在同名玩家" };
    }
    const newPlayer = {
      id: `player_${Date.now()}`,
      name: playerName,
      avatar: "",
      scores: [],
      isAlive: true,
      deathType: null,
      deathRound: null,
      createTime: Date.now()
    };
    currentRoom.value.players.push(newPlayer);
    currentRoom.value.updateTime = Date.now();
    saveAllRooms();
    saveCurrentRoom();
    return { success: true, data: newPlayer };
  };
  const removePlayer = async (playerId2) => {
    if (!currentRoom.value) {
      return { success: false, message: "未加入房间" };
    }
    const index = currentRoom.value.players.findIndex((p) => p.id === playerId2);
    if (index === -1) {
      return { success: false, message: "玩家不存在" };
    }
    currentRoom.value.players.splice(index, 1);
    currentRoom.value.updateTime = Date.now();
    saveAllRooms();
    saveCurrentRoom();
    return { success: true };
  };
  const updateRoom = async (data) => {
    if (!currentRoom.value) {
      return { success: false, message: "未加入房间" };
    }
    Object.assign(currentRoom.value, data);
    currentRoom.value.updateTime = Date.now();
    saveAllRooms();
    saveCurrentRoom();
    if (isHost.value) {
      const broadcastData = {
        roomId: currentRoom.value.roomId,
        updateTime: currentRoom.value.updateTime,
        data: {
          roomId: currentRoom.value.roomId,
          name: currentRoom.value.name,
          players: currentRoom.value.players,
          winCondition: currentRoom.value.winCondition,
          roles: currentRoom.value.roles,
          preset: currentRoom.value.preset,
          createTime: currentRoom.value.createTime,
          updateTime: currentRoom.value.updateTime
        }
      };
      api_network.networkManager.broadcast("room_updated", broadcastData);
    }
    return { success: true };
  };
  const deleteRoom = async (roomId) => {
    var _a;
    const index = allRooms.value.findIndex((r) => r.roomId === roomId);
    if (index === -1) {
      return { success: false, message: "房间不存在" };
    }
    if (((_a = currentRoom.value) == null ? void 0 : _a.roomId) === roomId) {
      api_network.networkManager.disconnect();
      networkStatus.value = "disconnected";
      isHost.value = false;
      playerId.value = null;
      token.value = null;
      currentRoom.value = null;
      utils_storage.removeStorage(CURRENT_ROOM_KEY);
    }
    if (isHost.value) {
      api_network.networkManager.broadcast("room_deleted", {
        roomId
      });
    }
    allRooms.value.splice(index, 1);
    saveAllRooms();
    return { success: true };
  };
  const getAllRooms = () => {
    return allRooms.value.sort((a, b) => b.updateTime - a.updateTime);
  };
  const saveAllRooms = () => {
    utils_storage.setStorage(ROOMS_STORAGE_KEY, allRooms.value);
  };
  const saveCurrentRoom = () => {
    if (currentRoom.value) {
      const roomData = {
        room: currentRoom.value,
        isHost: isHost.value,
        playerId: playerId.value,
        token: token.value
      };
      utils_storage.setStorage(CURRENT_ROOM_KEY, roomData);
    }
  };
  const loadCurrentRoom = () => {
    const roomData = utils_storage.getStorage(CURRENT_ROOM_KEY);
    if (roomData && roomData.room) {
      currentRoom.value = roomData.room;
      isHost.value = roomData.isHost || false;
      playerId.value = roomData.playerId || null;
      token.value = roomData.token || null;
    }
    return currentRoom.value;
  };
  const clearAllData = () => {
    api_network.networkManager.disconnect();
    currentRoom.value = null;
    allRooms.value = [];
    networkStatus.value = "disconnected";
    isHost.value = false;
    playerId.value = null;
    token.value = null;
    utils_storage.removeStorage(ROOMS_STORAGE_KEY);
    utils_storage.removeStorage(CURRENT_ROOM_KEY);
  };
  const generateShareLink = () => {
    if (!currentRoom.value) {
      return null;
    }
    return api_network.networkManager.generateShareLink();
  };
  const generateQRCode = () => {
    if (!currentRoom.value) {
      return null;
    }
    return api_network.networkManager.generateQRCode();
  };
  const getNetworkStatus = () => {
    return networkStatus.value;
  };
  const registerNetworkEvent = (event, callback) => {
    api_network.networkManager.on(event, callback);
  };
  return {
    currentRoom,
    allRooms,
    isInRoom,
    currentRoomId,
    currentPlayers,
    playerCount,
    rankList,
    networkStatus,
    connectionStatus,
    isHost,
    playerId,
    token,
    createRoom,
    getRoom,
    joinRoom,
    leaveRoom,
    addScore,
    getRankList,
    addPlayer,
    removePlayer,
    updateRoom,
    deleteRoom,
    getAllRooms,
    loadCurrentRoom,
    clearAllData,
    generateShareLink,
    generateQRCode,
    getNetworkStatus,
    registerNetworkEvent
  };
});
exports.useRoomStore = useRoomStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/room.js.map
