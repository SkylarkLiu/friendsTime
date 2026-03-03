export const TOOLS_CONFIG = [
  {
    id: 'dice',
    name: '摇骰子',
    icon: '🎲',
    description: '随机决定命运',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    component: 'dice-tool'
  },
  {
    id: 'timer',
    name: '计时器',
    icon: '⏱️',
    description: '正计时/倒计时',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    component: 'timer-tool'
  },
  {
    id: 'truth_dare',
    name: '真心话大冒险',
    icon: '💬',
    description: '聚会必备游戏',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    component: 'truth-dare-tool'
  }
]

export const getToolById = (id) => {
  return TOOLS_CONFIG.find(tool => tool.id === id)
}

export const getAllTools = () => {
  return TOOLS_CONFIG
}

export const registerTool = (tool) => {
  const exists = TOOLS_CONFIG.find(t => t.id === tool.id)
  if (!exists) {
    TOOLS_CONFIG.push(tool)
    return true
  }
  return false
}
