export class Game {
  constructor(config = {}) {
    this.gameState = 'idle' // idle, dealing, playing, game_over
  }

  setGameState(state) {
    this.gameState = state
  }

  getGameState() {
    return this.gameState
  }

  reset() {
    this.gameState = 'idle'
  }
}
