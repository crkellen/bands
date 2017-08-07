import { GLOBALS } from './Globals';

export class Game {
  constructor() {
    //Pixi.js Variables
    //Main Renderer
    this.stage = null;
    this.renderer = null;

    //Text
    this.UIBackground = null;
    this.scoreText = null;
    this.heldAmmoText = null;
    this.clipText = null;
    this.blockText = null;
    this.respawnText = null;
    this.textContainer = null;

    //Primitives
    this.crosshairVert = null;
    this.crosshairHorz = null;
    this.reloadBar = null;
    this.reloadContainer = null;

    //this.ctx = ctx;
    //this.ctx.font = '12px Calibri';
    //this.ctxUI = ctxUI;
    //this.ctxUI.font = '20px Calibri';
    this.UIUpdate = true; //Flag to update low-changing UI

    //Game is started after player enters name
    this.gameStarted = false;

    this.cPlayers = {};
    this.cBullets = {};
    this.cBlocks = {};
    this.selfID = null;
    this.localPlayer = null;

    //UI Updaters
    //TODO: Possibly update this so it uses getters and setters instead of prevScore === curScore
    this.prevScore = 0;
    this.prevHeldAmmo = 0;    
    this.prevClipCount = 0;
    this.prevBlockCount = 0;
    this.respawnTimer = 0;

    this.isValidSelection = false;
    this.selBlockID = -1;
    this.selGridX = -1;
    this.selGridY = -1;

    this.reloadTimeLeft = GLOBALS.RIFLE_RELOAD_TIME;

    //Mouseclick flags
    this.canShoot = true;
    this.canBuild = false;
    this.canShovel = false;
  } //Game.constructor()

  updateReloadBar(reloadPosX, reloadPosY, reloadBarSize) {
    this.reloadBar.clear();

    this.reloadBar.beginFill(0xFFFFFF, 0.5);
    this.reloadBar.drawRect(reloadPosX, reloadPosY, reloadBarSize, 4);
    this.reloadBar.endFill();
  } //Game.updateReloadBar()
} //class Game
