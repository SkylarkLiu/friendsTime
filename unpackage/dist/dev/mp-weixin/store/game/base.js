"use strict";
class Game {
  constructor(config = {}) {
    this.gameState = "idle";
  }
  setGameState(state) {
    this.gameState = state;
  }
  getGameState() {
    return this.gameState;
  }
  reset() {
    this.gameState = "idle";
  }
}
exports.Game = Game;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/store/game/base.js.map
