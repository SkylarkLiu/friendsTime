export const WEREWOLF_PRESETS = [
  {
    id: 'standard_9',
    name: '标准9人局',
    description: '预女猎白',
    playerCount: 9,
    roles: [
      { id: 'werewolf', name: '狼人', icon: '🐺', count: 3 },
      { id: 'seer', name: '预言家', icon: '🔮', count: 1 },
      { id: 'witch', name: '女巫', icon: '🧪', count: 1 },
      { id: 'hunter', name: '猎人', icon: '🏹', count: 1 },
      { id: 'guard', name: '守卫', icon: '🛡️', count: 1 },
      { id: 'villager', name: '村民', icon: '👤', count: 2 }
    ]
  },
  {
    id: 'standard_12',
    name: '标准12人局',
    description: '预女猎白+4狼',
    playerCount: 12,
    roles: [
      { id: 'werewolf', name: '狼人', icon: '🐺', count: 4 },
      { id: 'seer', name: '预言家', icon: '🔮', count: 1 },
      { id: 'witch', name: '女巫', icon: '🧪', count: 1 },
      { id: 'hunter', name: '猎人', icon: '🏹', count: 1 },
      { id: 'guard', name: '守卫', icon: '🛡️', count: 1 },
      { id: 'villager', name: '村民', icon: '👤', count: 4 }
    ]
  },
  {
    id: 'wolf_beauty',
    name: '狼美人板子',
    description: '狼美人+骑士',
    playerCount: 12,
    roles: [
      { id: 'werewolf', name: '狼人', icon: '🐺', count: 3 },
      { id: 'wolf_beauty', name: '狼美人', icon: '💃', count: 1 },
      { id: 'seer', name: '预言家', icon: '🔮', count: 1 },
      { id: 'witch', name: '女巫', icon: '🧪', count: 1 },
      { id: 'knight', name: '骑士', icon: '⚔️', count: 1 },
      { id: 'villager', name: '村民', icon: '👤', count: 5 }
    ]
  },
  {
    id: 'white_wolf',
    name: '白狼王板子',
    description: '白狼王+守卫',
    playerCount: 12,
    roles: [
      { id: 'werewolf', name: '狼人', icon: '🐺', count: 3 },
      { id: 'white_wolf', name: '白狼王', icon: '👑', count: 1 },
      { id: 'seer', name: '预言家', icon: '🔮', count: 1 },
      { id: 'witch', name: '女巫', icon: '🧪', count: 1 },
      { id: 'guard', name: '守卫', icon: '🛡️', count: 1 },
      { id: 'villager', name: '村民', icon: '👤', count: 5 }
    ]
  },
  {
    id: 'blood_moon',
    name: '血月板子',
    description: '血月使+摄梦人',
    playerCount: 12,
    roles: [
      { id: 'werewolf', name: '狼人', icon: '🐺', count: 3 },
      { id: 'blood_moon', name: '血月使', icon: '🌙', count: 1 },
      { id: 'seer', name: '预言家', icon: '🔮', count: 1 },
      { id: 'witch', name: '女巫', icon: '🧪', count: 1 },
      { id: 'dreamer', name: '摄梦人', icon: '💭', count: 1 },
      { id: 'villager', name: '村民', icon: '👤', count: 5 }
    ]
  },
  {
    id: 'quick_6',
    name: '6人快局',
    description: '适合新手',
    playerCount: 6,
    roles: [
      { id: 'werewolf', name: '狼人', icon: '🐺', count: 2 },
      { id: 'seer', name: '预言家', icon: '🔮', count: 1 },
      { id: 'witch', name: '女巫', icon: '🧪', count: 1 },
      { id: 'villager', name: '村民', icon: '👤', count: 2 }
    ]
  },
  {
    id: 'standard_8',
    name: '8人局',
    description: '预女猎+3民',
    playerCount: 8,
    roles: [
      { id: 'werewolf', name: '狼人', icon: '🐺', count: 2 },
      { id: 'seer', name: '预言家', icon: '🔮', count: 1 },
      { id: 'witch', name: '女巫', icon: '🧪', count: 1 },
      { id: 'hunter', name: '猎人', icon: '🏹', count: 1 },
      { id: 'villager', name: '村民', icon: '👤', count: 3 }
    ]
  },
  {
    id: 'standard_10',
    name: '10人局',
    description: '预女猎白+3狼',
    playerCount: 10,
    roles: [
      { id: 'werewolf', name: '狼人', icon: '🐺', count: 3 },
      { id: 'seer', name: '预言家', icon: '🔮', count: 1 },
      { id: 'witch', name: '女巫', icon: '🧪', count: 1 },
      { id: 'hunter', name: '猎人', icon: '🏹', count: 1 },
      { id: 'guard', name: '守卫', icon: '🛡️', count: 1 },
      { id: 'villager', name: '村民', icon: '👤', count: 3 }
    ]
  },
  {
    id: 'large_15',
    name: '15人局',
    description: '预女猎白+5狼',
    playerCount: 15,
    roles: [
      { id: 'werewolf', name: '狼人', icon: '🐺', count: 5 },
      { id: 'seer', name: '预言家', icon: '🔮', count: 1 },
      { id: 'witch', name: '女巫', icon: '🧪', count: 1 },
      { id: 'hunter', name: '猎人', icon: '🏹', count: 1 },
      { id: 'guard', name: '守卫', icon: '🛡️', count: 1 },
      { id: 'idiot', name: '白痴', icon: '🤪', count: 1 },
      { id: 'villager', name: '村民', icon: '👤', count: 6 }
    ]
  },
  {
    id: 'large_18',
    name: '18人局',
    description: '预女猎白+6狼',
    playerCount: 18,
    roles: [
      { id: 'werewolf', name: '狼人', icon: '🐺', count: 6 },
      { id: 'seer', name: '预言家', icon: '🔮', count: 1 },
      { id: 'witch', name: '女巫', icon: '🧪', count: 1 },
      { id: 'hunter', name: '猎人', icon: '🏹', count: 1 },
      { id: 'guard', name: '守卫', icon: '🛡️', count: 1 },
      { id: 'idiot', name: '白痴', icon: '🤪', count: 1 },
      { id: 'villager', name: '村民', icon: '👤', count: 7 }
    ]
  }
]

export const getPresetByPlayerCount = (count) => {
  return WEREWOLF_PRESETS.find(preset => preset.playerCount === count)
}

export const getPresetById = (id) => {
  return WEREWOLF_PRESETS.find(preset => preset.id === id)
}

export const getAllPresets = () => {
  return WEREWOLF_PRESETS
}

export const getAvailablePlayerCounts = () => {
  return [...new Set(WEREWOLF_PRESETS.map(p => p.playerCount))].sort((a, b) => a - b)
}
