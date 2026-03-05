"use strict";
const common_vendor = require("../common/vendor.js");
const utils_storage = require("../utils/storage.js");
const api_network = require("../api/network.js");
require("../api/config.js");
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
      totalScore: (player.scores || []).reduce((sum, s) => sum + (s.score || 0), 0)
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
  const applyRoomUpdate = (payload) => {
    if (!payload || !payload.data)
      return;
    const data = payload.data;
    if (!currentRoom.value || currentRoom.value.roomId !== data.roomId)
      return;
    if (data.updateTime && currentRoom.value.updateTime && data.updateTime < currentRoom.value.updateTime)
      return;
    currentRoom.value = { ...currentRoom.value, ...data };
    saveCurrentRoom();
  };
  const createRoom = async (roomName, winCondition = "slaughter_side", options = {}) => {
    const { hostName, roomId: customRoomId } = options;
    {
      const roomIdToUse = customRoomId || generateRoomId();
      const newPlayerId = generatePlayerId();
      const newToken = generateToken();
      const newRoom = {
        roomId: roomIdToUse,
        name: roomName,
        players: hostName ? [{
          id: newPlayerId,
          name: hostName,
          avatar: "",
          scores: [],
          isAlive: true,
          deathType: null,
          deathRound: null,
          createTime: Date.now()
        }] : [],
        winCondition,
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
      networkStatus.value = "connected";
      return newRoom;
    }
  };
  const getRoom = async (roomId) => {
    {
      return allRooms.value.find((r) => r.roomId === roomId) || null;
    }
  };
  const joinRoom = async (roomId, playerName) => {
    {
      const room = await getRoom(roomId);
      if (!room) {
        return { success: false, message: "房间不存在或已过期" };
      }
      const existingPlayer = room.players.find((p) => p.name === playerName);
      if (existingPlayer) {
        return { success: false, message: "该房间已存在同名玩家" };
      }
      const newPlayerId = generatePlayerId();
      const newToken = generateToken();
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
      return { success: true, data: room };
    }
  };
  const leaveRoom = async () => {
    if (!currentRoom.value)
      return;
    const rid = currentRoom.value.roomId;
    playerId.value;
    token.value;
    api_network.networkManager.disconnect();
    networkStatus.value = "disconnected";
    {
      const room = allRooms.value.find((r) => r.roomId === rid);
      if (room) {
        room.updateTime = Date.now();
        saveAllRooms();
      }
    }
    currentRoom.value = null;
    isHost.value = false;
    playerId.value = null;
    token.value = null;
    utils_storage.removeStorage(CURRENT_ROOM_KEY);
    return { success: true };
  };
  const addScore = async (targetPlayerId, scoreData) => {
    if (!currentRoom.value)
      return { success: false, message: "未加入房间" };
    {
      const player = currentRoom.value.players.find((p) => p.id === targetPlayerId);
      if (!player)
        return { success: false, message: "玩家不存在" };
      player.scores = player.scores || [];
      player.scores.push({ ...scoreData, time: Date.now() });
      currentRoom.value.updateTime = Date.now();
      saveAllRooms();
      saveCurrentRoom();
      if (isHost.value)
        api_network.networkManager.broadcast("room_updated", { roomId: currentRoom.value.roomId, updateTime: currentRoom.value.updateTime, data: currentRoom.value });
      return { success: true };
    }
  };
  const getRankList = async () => {
    if (!currentRoom.value)
      return { success: false, message: "未加入房间" };
    return { success: true, data: rankList.value };
  };
  const addPlayer = async (playerName) => {
    if (!currentRoom.value)
      return { success: false, message: "未加入房间" };
    {
      const existingPlayer = currentRoom.value.players.find((p) => p.name === playerName);
      if (existingPlayer)
        return { success: false, message: "该房间已存在同名玩家" };
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
    }
  };
  const removePlayer = async (targetPlayerId) => {
    if (!currentRoom.value)
      return { success: false, message: "未加入房间" };
    {
      const index = currentRoom.value.players.findIndex((p) => p.id === targetPlayerId);
      if (index === -1)
        return { success: false, message: "玩家不存在" };
      currentRoom.value.players.splice(index, 1);
      currentRoom.value.updateTime = Date.now();
      saveAllRooms();
      saveCurrentRoom();
      return { success: true };
    }
  };
  const updateRoom = async (data) => {
    if (!currentRoom.value)
      return { success: false, message: "未加入房间" };
    {
      Object.assign(currentRoom.value, data);
      currentRoom.value.updateTime = Date.now();
      saveAllRooms();
      saveCurrentRoom();
      if (isHost.value) {
        api_network.networkManager.broadcast("room_updated", {
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
        });
      }
      return { success: true };
    }
  };
  const deleteRoom = async (roomId) => {
    var _a;
    const index = allRooms.value.findIndex((r) => r.roomId === roomId);
    if (index === -1)
      return { success: false, message: "房间不存在" };
    if (((_a = currentRoom.value) == null ? void 0 : _a.roomId) === roomId) {
      api_network.networkManager.disconnect();
      networkStatus.value = "disconnected";
      isHost.value = false;
      playerId.value = null;
      token.value = null;
      currentRoom.value = null;
      utils_storage.removeStorage(CURRENT_ROOM_KEY);
    }
    allRooms.value.splice(index, 1);
    saveAllRooms();
    return { success: true };
  };
  const getAllRooms = () => {
    return [...allRooms.value].sort((a, b) => (b.updateTime || 0) - (a.updateTime || 0));
  };
  const saveAllRooms = () => {
    utils_storage.setStorage(ROOMS_STORAGE_KEY, allRooms.value);
  };
  const saveCurrentRoom = () => {
    if (currentRoom.value) {
      utils_storage.setStorage(CURRENT_ROOM_KEY, {
        room: currentRoom.value,
        isHost: isHost.value,
        playerId: playerId.value,
        token: token.value
      });
    }
  };
  const loadCurrentRoom = async () => {
    const roomData = utils_storage.getStorage(CURRENT_ROOM_KEY);
    if (!roomData || !roomData.room)
      return null;
    roomData.room;
    currentRoom.value = roomData.room;
    isHost.value = roomData.isHost || false;
    playerId.value = roomData.playerId || null;
    token.value = roomData.token || null;
    {
      networkStatus.value = "connected";
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
    if (!currentRoom.value)
      return null;
    return api_network.networkManager.generateShareLink();
  };
  const generateQRCode = () => {
    if (!currentRoom.value)
      return null;
    return api_network.networkManager.generateQRCode();
  };
  const getNetworkStatus = () => networkStatus.value;
  const registerNetworkEvent = (event, callback) => {
    api_network.networkManager.on(event, callback);
  };
  api_network.networkManager.on("room_updated", (payload) => {
    applyRoomUpdate(payload);
  });
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
