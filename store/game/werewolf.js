import { Game } from './base'
import { roleConfig, getRolePoolByPlayerCount } from '@/utils/werewolfConfig'

export class WerewolfGame extends Game {
  constructor(config = {}) {
    super(config)
    this.gameType = 'werewolf'
    this.preset = config.preset || null
    this.customRoles = config.customRoles || []
    this.currentPlayerIndex = 0
  }

  generateRolePool() {
    if (this.customRoles.length > 0) {
      return this.generateCustomRoles()
    }
    
    const preset = this.preset || getPresetByPlayerCount(this.playerCount)
    if (!preset) {
      return this.generateDefaultRoles()
    }
    
    const pool = []
    preset.roles.forEach(role => {
      for (let i = 0; i < role.count; i++) {
        pool.push({
          id: role.id,
          name: role.name,
          icon: role.icon
        })
      }
    })
    
    return pool
  }

  generateDefaultRoles() {
    const rolePool = getRolePoolByPlayerCount(this.playerCount)
    const pool = []
    
    rolePool.forEach(roleId => {
      const roleInfo = roleConfig[roleId]
      if (roleInfo) {
        pool.push({
          id: roleId,
          name: roleInfo.name,
          icon: roleInfo.icon,
          camp: roleInfo.camp,
          campName: roleInfo.campName,
          color: roleInfo.color,
          skills: roleInfo.skills,
          strategy: roleInfo.strategy
        })
      }
    })
    
    return pool
  }

  generateCustomRoles() {
    const pool = []
    this.customRoles.forEach(role => {
      for (let i = 0; i < role.count; i++) {
        pool.push({
          id: role.id,
          name: role.name,
          icon: role.icon
        })
      }
    })
    return pool
  }

  dealCards() {
    const rolePool = this.generateRolePool()
    const shuffledRoles = this.shuffle(rolePool)
    
    this.dealtCards = shuffledRoles.map((role, index) => ({
      playerNumber: index + 1,
      role: role,
      revealed: false,
      confirmed: false
    }))
    
    this.setGameState('dealing')
    this.currentPlayerIndex = 0
    return this.dealtCards
  }

  confirmCurrentPlayer() {
    if (this.currentPlayerIndex < this.dealtCards.length) {
      this.confirmCard(this.currentPlayerIndex)
      this.currentPlayerIndex++
      
      if (this.currentPlayerIndex >= this.dealtCards.length) {
        this.setGameState('all_confirmed')
      }
      return true
    }
    return false
  }

  getCurrentPlayer() {
    if (this.currentPlayerIndex < this.dealtCards.length) {
      return this.dealtCards[this.currentPlayerIndex]
    }
    return null
  }

  getCurrentPlayerNumber() {
    return this.currentPlayerIndex + 1
  }

  setPreset(preset) {
    this.preset = preset
    this.playerCount = preset.playerCount
    this.customRoles = []
  }

  setCustomRoles(roles) {
    this.customRoles = roles
    this.playerCount = roles.reduce((sum, role) => sum + role.count, 0)
    this.preset = null
  }

  getRoleDistribution() {
    const distribution = {}
    this.dealtCards.forEach(card => {
      const roleName = card.role.name
      distribution[roleName] = (distribution[roleName] || 0) + 1
    })
    return distribution
  }

  getWerewolfCount() {
    return this.dealtCards.filter(card => card.role.id === 'werewolf' || card.role.id === 'wolf_beauty' || card.role.id === 'white_wolf' || card.role.id === 'blood_moon').length
  }

  getGodCount() {
    const godIds = ['seer', 'witch', 'hunter', 'guard', 'knight', 'idiot', 'dreamer']
    return this.dealtCards.filter(card => godIds.includes(card.role.id)).length
  }

  getVillagerCount() {
    return this.dealtCards.filter(card => card.role.id === 'villager').length
  }

  revealAll() {
    this.dealtCards.forEach(card => {
      card.revealed = true
    })
    this.setGameState('judge_view')
  }

  hideAll() {
    this.dealtCards.forEach(card => {
      card.revealed = false
    })
  }

  resetGame() {
    super.reset()
    this.currentPlayerIndex = 0
  }
}
