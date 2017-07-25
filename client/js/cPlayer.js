import * as Pixi from 'pixi.js';
import { GLOBALS } from './Globals';
var Sprite = Pixi.Sprite;
var Text = Pixi.Text;
var Graphics = Pixi.Graphics;
var Container = Pixi.Container;

export class cPlayer {
  constructor(initPack) {
    this.ID = initPack.ID;
    this.name = initPack.name;
    this.team = initPack.team;
    this.gridX = initPack.gridX;
    this.gridY = initPack.gridY;
    this.x = initPack.x;
    this.y = initPack.y;
    this.HP = initPack.HP;
    this.mX = initPack.mX;
    this.mY = initPack.mY;
    this.maxHP = initPack.maxHP;
    this.score = initPack.score;
    this.ammo = initPack.ammo;
    this.clipSize = initPack.clipSize;
    this.clips = initPack.clips;
    this.maxClips = initPack.clips;
    this.heldAmmo = initPack.heldAmmo;
    this.mustReloadClip = initPack.mustReloadClip;
    this.mustReload = initPack.mustReload;
    this.isReloading = initPack.isReloading;
    this.invincible = initPack.invincible;
    this.mode = initPack.mode;
    this.blocks = initPack.blocks;
    this.maxBlocks = initPack.maxBlocks;

    //Setup the sprites for the player
    this.gunSprite = null;
    this.buildSprite = null;
    this.shovelSprite = null;
    this.initializeSprites();

    //Setup the text for the player
    this.nameText = null;
    this.ammoText = null;
    this.initializeText();

    //Setup the primitives for the player
    this.HPBar = null;
    this.initializePrimitives();

    //Setup the Container for the player
    this.sprite = null;
    this.UI = null;
    this.playerGraphics = null;
    this.initializeContainer();

    //Bullet rotation to match player rotation
    this.bulletTheta = 0;

    this.showPlayerName = true; //Only exists on client
    this.activePlayerNameRequests = []; //A collection of identifiers to showPlayerName setTimeouts
  } //cPlayer.constructor

  initializeSprites() {
    //Gun Sprite
    this.gunSprite = this.team ? new Sprite(GLOBALS.Imgs.IDs['bluePlayer.png']) : new Sprite(GLOBALS.Imgs.IDs['greenPlayer.png']);
    this.gunSprite.anchor.x = 0.3;
    this.gunSprite.anchor.y = 0.5;

    //Build Sprite
    this.buildSprite = this.team ? new Sprite(GLOBALS.Imgs.IDs['bluePlayerBuild.png']) : new Sprite(GLOBALS.Imgs.IDs['greenPlayerBuild.png']);
    this.buildSprite.visible = false;
    this.buildSprite.anchor.x = 0.49;
    this.buildSprite.anchor.y = 0.5;

    //Shovel Sprite
    this.shovelSprite = this.team ? new Sprite(GLOBALS.Imgs.IDs['bluePlayerShovel.png']) : new Sprite(GLOBALS.Imgs.IDs['greenPlayerShovel.png']);
    this.shovelSprite.visible = false;
    this.shovelSprite.anchor.x = 0.45;
    this.shovelSprite.anchor.y = 0.64;
  } //cPlayer.initializeSprites()

  initializeText() {
    //Name Text
    this.nameText = new Text(this.name, GLOBALS.PLAYER_TEXT_STYLE_OPTIONS);
    //Ammo Text
    this.ammoText = new Text(`${this.ammo}/${this.clipSize}`, GLOBALS.PLAYER_TEXT_STYLE_OPTIONS);

    this.nameText.position.set(-(this.name.length * 3), -40);
    this.ammoText.position.set(-10, 30);
  } //cPlayer.initializeText()

  initializePrimitives() {
    const HPBarWidth = (30 * this.HP / this.maxHP) * 1.4;
    const HPXOffset = (this.maxHP * 2);

    //HP Bar
    this.HPBar = new Graphics();
    this.HPBar.beginFill(0xFF0000);
    this.HPBar.lineStyle(1, 0x000000, 1);
    this.HPBar.drawRect(0, 0, HPBarWidth, 5);
    this.HPBar.endFill();
    this.HPBar.position.set(HPXOffset - 40, 25);
  } //cPlayer.initializePrimitives()

  initializeContainer() {
    //The ParticleContainer contains all of the sprites to be drawn
    this.sprite = new Container();
    this.UI = new Container();
    this.playerGraphics = new Container();

    //Sprites
    this.sprite.addChild(this.gunSprite);
    this.sprite.addChild(this.buildSprite);
    this.sprite.addChild(this.shovelSprite);

    //Text
    this.UI.addChild(this.nameText);
    this.UI.addChild(this.ammoText);
    this.UI.addChild(this.HPBar);

    //Final combined player graphics container
    this.playerGraphics.addChild(this.sprite);
    this.playerGraphics.addChild(this.UI);

    if( this.team === 0 ) {
      this.playerGraphics.position.set(this.x, this.y);
    } else {
      this.playerGraphics.position.set(this.x - 1600, this.y - 1000);
    }
  } //cPlayer.initializeContainer()

  drawSelf(renderer, xView, yView, isLocalPlayer) {
    let x = this.x - xView;
    let y = this.y - yView;

    //Calculate the rotation in radians while adjusting for deadzones
    const playerTheta = this.calculatePlayerTheta(renderer, xView, yView, isLocalPlayer);
    this.bulletTheta = playerTheta;
    this.sprite.rotation = playerTheta;

    //Update position
    this.playerGraphics.position.set(x, y);
  } //cPlayer.drawSelf()

  calculatePlayerTheta(renderer, xView, yView, isLocalPlayer) {
    const x = this.x - xView;
    const y = this.y - yView;

    let targetX = this.mX - renderer.width*0.5;
    let targetY = this.mY - renderer.height*0.5;

    //Check if within the deadzones
    if( isLocalPlayer === true && xView === 0 ) {     //LEFT
      //Local player is inside of left deadzone
      targetX = this.mX - this.x;
    }
    if( isLocalPlayer !== true && this.x < renderer.width*0.5 ) {
      //Other player is inside of left deadzone
      targetX = this.mX - this.x;
    }

    if( isLocalPlayer === true && xView === (GLOBALS.WORLD_WIDTH - renderer.width) ) {  //RIGHT
      //Local player is inside of right deadzone
      targetX = this.mX - x;
    }
    if( isLocalPlayer !== true && this.x > (GLOBALS.WORLD_WIDTH - renderer.width*0.5) ) {
      //Other player is inside of right deadzone
      targetX = this.mX - (this.x - (GLOBALS.WORLD_WIDTH - renderer.width));
    } 

    if( isLocalPlayer === true && yView === 0 ) {     //TOP
      //Local player is inside of top deadzone
      targetY = this.mY - this.y;
    }
    if( isLocalPlayer !== true && this.y < renderer.height*0.5 ) {
      //Other player is inside of top deadzone
      targetY = this.mY - this.y;
    }

    if( isLocalPlayer === true && yView === (GLOBALS.WORLD_HEIGHT - renderer.height) ) {  //BOTTOM
      //Local player is inside of bottom deadzone
      targetY = this.mY - y;
    }
    if( isLocalPlayer !== true && this.y > (GLOBALS.WORLD_HEIGHT - renderer.height*0.5) ) {
      //Other player is inside of bottom deadzone
      targetY = this.mY - (this.y - (GLOBALS.WORLD_HEIGHT - renderer.height));
    }

    const theta = Math.atan2(targetY, targetX);

    return theta;
  } //cPlayer.calculatePlayerTheta()

  updateHPBarGraphics() {
    //Delete the existing drawn Graphics, not the object
    this.HPBar.clear();

    //Redraw the Graphics
    const HPBarWidth = (30 * this.HP / this.maxHP) * 1.4;
    const HPXOffset = (this.maxHP * 2);

    this.HPBar.beginFill(0xFF0000);
    this.HPBar.lineStyle(1, 0x000000, 1);
    this.HPBar.drawRect(0, 0, HPBarWidth, 5);
    this.HPBar.endFill();
    this.HPBar.position.set(HPXOffset - 40, 25);
  } //cPlayer.updateHPBarGraphics()

  cancelActivePlayerNameRequests() {
    for( let id in this.activePlayerNameRequests ) {
      clearTimeout(this.activePlayerNameRequests.pop(id));
    }
  } //cPlayer.cancelActivePlayerNameRequests()
} //class cPlayer
