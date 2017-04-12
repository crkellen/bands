export var Imgs = {};
Imgs.player = new Image();
Imgs.player.src = './../img/player.png';
Imgs.bullet = new Image();
Imgs.bullet.src = './../img/bullet.png';
Imgs.gun = new Image();
Imgs.gun.src = './../img/gun.png';
//Imgs.background = new Image();
//Imgs.background.src = '/client/img/background.png';
Imgs.grid = new Image();
Imgs.grid.src = './../img/grid.png';

export class Game {
  constructor(ctx, ctxUI) {
    this.ctx = ctx;
    this.ctxUI = ctxUI;

    this.cPlayers = {};
    this.cBullets = {};
    this.selfID = null;
    this.prevScore = 0;
  } //Game.constructor()
} //class Game

export class cPlayer {
  constructor(initPack) {
    this.ID = initPack.ID;
    this.name = initPack.name;
    this.x = initPack.x;
    this.y = initPack.y;
    this.HP = initPack.HP;
    this.mX = initPack.mX;
    this.mY = initPack.mY;
    this.maxHP = initPack.maxHP;
    this.score = initPack.score;
  } //cPlayer.constructor

  drawSelf(cGame) {
    let x = this.x - cGame.cPlayers[cGame.selfID].x + cGame.ctx.canvas.width/2;
    let y = this.y - cGame.cPlayers[cGame.selfID].y + cGame.ctx.canvas.height/2;

    //Health bar
    let HPWidth = 30 * this.HP / this.maxHP;
    cGame.ctx.fillStyle = 'red';
    cGame.ctx.fillRect(x - HPWidth/2, y + 25, HPWidth, 4);

    //Player
    //let width = Imgs.player.width;
    //let height = Imgs.player.height;
    cGame.ctx.beginPath();
    cGame.ctx.arc(x, y, 20, 0, 2*Math.PI);
    cGame.ctx.stroke();
    //cGame.ctx.drawImage(Imgs.player, 0, 0, Imgs.player.width, Imgs.player.height, x - width/2, y - height/2, width, height);
    //cGame.ctx.fillStyle = '#008BCC';
    //cGame.ctx.fillRect(this.x, this.y, width, height);
    //Gun
    let targetX = this.mX - cGame.ctx.canvas.width/2;
    let targetY = this.mY - cGame.ctx.canvas.height/2;
    let theta = Math.atan2(targetY, targetX);

    cGame.ctx.save();
    cGame.ctx.translate(x, y);
    cGame.ctx.rotate(theta);
    cGame.ctx.fillStyle = '#008BCC';
    //cGame.ctx.drawImage(Imgs.gun, 0, 0);
    cGame.ctx.fillRect(19/2 * -1, 8/2 * -1, 19, 8);
    cGame.ctx.restore();

  } //cPlayer.drawSelf()

  drawName(cGame) {
    let x = this.x - cGame.cPlayers[cGame.selfID].x + cGame.ctx.canvas.width/2;
    let y = this.y - cGame.cPlayers[cGame.selfID].y + cGame.ctx.canvas.height/2;

    cGame.ctx.fillText(this.name, x - this.name.length*2.5, y - 25);
    //cGame.ctx.fillText(this.name, x - Imgs.player.width/2, y - 20);
  } //cPlayer.drawName()
} //class cPlayer

export class cBullet {
  constructor(initPack) {
    this.ID = initPack.ID;
    this.x = initPack.x;
    this.y = initPack.y;
  } //cBullet.constructor()

  drawSelf(cGame) {
    //let width = Imgs.bullet.width/2;
    //let height = Imgs.bullet.height/2;
    let x = this.x - cGame.cPlayers[cGame.selfID].x + cGame.ctx.canvas.width/2;
    let y = this.y - cGame.cPlayers[cGame.selfID].y + cGame.ctx.canvas.height/2;

    cGame.ctx.beginPath();
    cGame.ctx.arc(x, y, 5, 0, 2*Math.PI);
    cGame.ctx.stroke();
    //cGame.ctx.drawImage(Imgs.bullet, 0, 0, Imgs.bullet.width, Imgs.bullet.height, x - width/2, y - height/2, width, height);
  } //cBullet.drawSelf()
} //class cBullet

export class Rectangle {
  constructor(params) {
    this.left = params.left;
    this.top = params.top;
    this.width = params.width;
    this.height = params.height;
    this.right = this.left + this.width;
    this.bottom = this.top + this.height;
  } //Rectangle.constructor()

  set(params) {
    this.left = params.left;
    this.top = params.top;
    if( params.width !== undefined ) {
      this.width = params.width;
    }
    if( params.height !== undefined ) {
      this.height = params.height;
    }
    this.right = this.left + this.width;
    this.bottom = this.top + this.height;
  } //Rectangle.set()

  within(rect) {
    return (rect.left <= this.left &&
      rect.right >= this.right &&
      rect.top <= this.top &&
      rect.bottom >= this.bottom);
  } //Rectangle.within()

  overlaps(rect) {
    return (this.left < rect.right &&
      rect.left < this.right &&
      this.top < rect.bottom &&
      rect.top < this.bottom);
  } //Rectangle.overlaps()
} //class Rectangle

export class Camera {
  constructor(params) {
    //Viewport (Camera) location, top left corner
    this.xView = params.xView;
    this.yView = params.yView;

    //Viewport Dimensions
    this.wView = params.canvasWidth;
    this.hView = params.canvasHeight;

    //Distance from followed object to border, before camera starts to move
    this.xDeadZone = 0;
    this.yDeadZone = 0;

    //Object to be followed (player)
    this.followed = null;

    let viewport = {
      left: this.xView,
      top: this.yView,
      width: this.wView,
      height: this.hView
    };
    this.viewportRect = new Rectangle(viewport);

    let world = {
      left: 0,
      top: 0,
      width: params.worldWidth,
      height: params.worldHeight
    };
    this.worldRect = new Rectangle(world);
  } //Camera.constructor()

  follow(gameObject, xDeadZone, yDeadZone) {
    this.followed = gameObject;
    this.xDeadZone = xDeadZone;
    this.yDeadZone = yDeadZone;
  } //Camera.follow()

  update() {
    if( this.followed === null ) {
      return;
    }

    //Move Camera Horizontally
    if( this.followed.x - this.xView + this.xDeadZone > this.wView ) {
      this.xView = this.followed.x - (this.wView - this.xDeadZone);
    } else if( this.followed.x - this.xDeadZone < this.wView ) {
      this.xView = this.followed.x - this.xDeadZone;
    }

    //Move Camera Vertically
    if( this.followed.y - this.yView + this.yDeadZone > this.hView ) {
      this.yView = this.followed.y - (this.hView - this.yDeadZone);
    } else if( this.followed.y - this.yDeadZone < this.hView ) {
      this.yView = this.followed.y - this.yDeadZone;
    }

    //Update Viewport Rect
    let updateViewport = {
      left: this.xView,
      top: this.yView
    };
    this.viewportRect.set(updateViewport);

    //Don't let camera leave world boundry
    if( !this.viewportRect.within(this.worldRect) ) {
      if( this.viewPortRect.left < this.worldRect.left ) {
        this.xView = this.worldRect.left;
      }
      if( this.viewPortRect.top < this.worldRect.right ) {
        this.yView = this.worldRect.right;
      }
      if( this.viewPortRect.right < this.worldRect.right ) {
        this.xView = this.worldRect.right;
      }
      if( this.viewPortRect.bottom < this.worldRect.bottom ) {
        this.yView = this.worldRect.bottom;
      }
    }
  } //Camera.update()
} //class Camera
