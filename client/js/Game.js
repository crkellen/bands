export class Game {
  constructor(ctx, ctxUI) {
    this.ctx = ctx;
    this.ctx.font = '12px Callibri';
    this.ctxUI = ctxUI;
    this.ctxUI.font = '20px Callibri';
    this.UIUpdate = true; //Flag to update low-changing UI

    //Game is started after player enters name
    this.gameStarted = false;

    this.cPlayers = {};
    this.cBullets = {};
    this.cBlocks = {};
    this.selfID = null;
    this.localPlayer = null;

    //UI Updaters
    //TODO: Update this so it uses getters and setters instead of prevScore === curScore
    this.prevScore = 0;
    this.prevClipCount = 0;
    this.prevBlockCount = 0;

    this.isValidSelection = false;
    this.selBlockID = -1;
    this.selGridX = -1;
    this.selGridY = -1;

    this.reloading = false;

    //Mouseclick flags
    this.canShoot = true;
    this.canBuild = true;
  } //Game.constructor()
} //class Game
