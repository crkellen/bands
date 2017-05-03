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
Imgs.grid.src = './../img/smallgrid.png';

export class Game {
  constructor(ctx, ctxUI) {
    this.ctx = ctx;
    this.ctx.font = '12px Callibri';
    this.ctxUI = ctxUI;
    //#TODO: Only need to update this once, unless I decide to change font
    this.ctxUI.font = '20px Callibri';
    this.UIUpdate = true; //Flag to update low-changing UI

    //Game is started after player enters name
    this.gameStarted = false;

    this.cPlayers = {};
    this.cBullets = {};
    this.cBlocks = {};
    this.selfID = null;

    //UI Updaters
    this.prevScore = 0;
    this.prevClipCount = 0;
    this.prevBlockCount = 0;
    this.selGridX = -1;
    this.selGridY = -1;
    this.selectedGrid = -1;

    //Mouseclick flags
    this.canShoot = true;
    this.canBuild = true;
  } //Game.constructor()
} //class Game

export class cPlayer {
  constructor(initPack) {
    this.ID = initPack.ID;
    this.name = initPack.name;
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
    this.maxAmmo = initPack.maxAmmo;
    this.clips = initPack.clips;
    this.maxClips = initPack.clips;
    this.invincible = initPack.invincible;
    this.mode = initPack.mode;
    this.blocks = initPack.blocks;
    this.maxBlocks = initPack.maxBlocks;
  } //cPlayer.constructor

  drawSelf(ctx, xView, yView) {
    //let x = this.x - cGame.cPlayers[cGame.selfID].x + cGame.ctx.canvas.width/2;
    //let y = this.y - cGame.cPlayers[cGame.selfID].y + cGame.ctx.canvas.height/2;
    let x = this.x - xView;
    let y = this.y - yView;

    //Health bar
    let HPWidth = 30 * this.HP / this.maxHP;
    ctx.fillStyle = 'red';
    ctx.fillRect(x - HPWidth/2, y + 25, HPWidth, 4);

    //Player
    //let width = Imgs.player.width;
    //let height = Imgs.player.height;

    //User feedback for respawn invincibility
    if( this.invincible === true ) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    } else {
      ctx.strokeStyle = 'black'; //#TODO: This will change to team color later
      ctx.fillStyle = 'black';
    }

    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    //ctx.drawImage(Imgs.player, 0, 0, Imgs.player.width, Imgs.player.height, x - width/2, y - height/2, width, height);
    //ctx.fillStyle = '#008BCC';
    //ctx.fillRect(this.x, this.y, width, height);

    if( this.mode === 0 ) { //If player is in weapon mode
      //Gun
      let targetX = this.mX - ctx.canvas.width/2;
      let targetY = this.mY - ctx.canvas.height/2;
      //Check if within the deadzones
      if( xView === 0 ) {     //LEFT
        targetX = this.mX - x;
      }
      if( xView === 4800 ) {  //RIGHT
        targetX = this.mX - x;
      }
      if( yView === 0 ) {     //TOP
        targetY = this.mY - y;
      }
      if( yView === 3040 ) {  //BOTTOM
        targetY = this.mY - y;
      }

      let theta = Math.atan2(targetY, targetX);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(theta);
      ctx.translate(30, 0); //Move the gun to the outside of the player
      if( this.invincible === true ) {
        ctx.fillStyle = 'rgba(65, 135, 255, 0.5)';
      } else {
        ctx.fillStyle = 'rgba(65, 135, 255, 1)';
      }
      //ctx.drawImage(Imgs.gun, 0, 0);
      ctx.fillRect(19/2 * -1, 8/2 * -1, 19, 8);
      ctx.restore();
    }
  } //cPlayer.drawSelf()

  drawName(ctx, xView, yView) {
    let x = this.x - xView;
    let y = this.y - yView;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(this.name, x - this.name.length * 2.5, y);
  } //cPlayer.drawName()

  drawAmmo(ctx, xView, yView) {
    let x = this.x - xView;
    let y = this.y - yView;

    let ammoString = `${this.ammo}/${this.maxAmmo}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(ammoString, x - 8, y + 16);
  } //cPlayer.drawAmmo()
} //class cPlayer

export class cBullet {
  constructor(initPack) {
    this.ID = initPack.ID;
    this.x = initPack.x;
    this.y = initPack.y;
  } //cBullet.constructor()

  drawSelf(ctx, xView, yView) {
    //let width = Imgs.bullet.width/2;
    //let height = Imgs.bullet.height/2;
    //let x = this.x - cGame.cPlayers[cGame.selfID].x + cGame.ctx.canvas.width/2;
    //let y = this.y - cGame.cPlayers[cGame.selfID].y + cGame.ctx.canvas.height/2;
    let x = this.x - xView;
    let y = this.y - yView;


    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2*Math.PI);
    ctx.stroke();
    //cGame.ctx.drawImage(Imgs.bullet, 0, 0, Imgs.bullet.width, Imgs.bullet.height, x - width/2, y - height/2, width, height);
  } //cBullet.drawSelf()
} //class cBullet

export class cBlock {
  constructor(initPack) {
    this.ID = initPack.ID;
    this.gridX = initPack.gridX;
    this.gridY = initPack.gridY;
    this.x = initPack.x;
    this.y = initPack.y;
    this.HP = initPack.HP;
    this.isActive = initPack.isActive;
  } //cBlock.constructor()

  drawSelf(ctx, xView, yView) {
    //If the block is not active, do not draw
    if( this.isActive === false ) {
      return;
    }

    let x = this.x - xView;
    let y = this.y - yView;

    ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
    ctx.fillRect(x, y, 80, 80);
  } //cBlock.drawSelf()

  drawSelection(ctx, xView, yView, canPlace) {
    let x = this.x - xView;
    let y = this.y - yView;

    if( canPlace === true ) {
      ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
    } else {
      ctx.fillStyle = 'rgba(200, 0, 0, 0.2)';
    }

    ctx.fillRect(x, y, 80, 80);
  } //cBlock.drawSelection()
} //class cBlock

class Rectangle {
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
    if( this.followed != null ) {
      //Move Camera Horizontally
      if( this.followed.x - this.xView + this.xDeadZone > this.wView ) {
        this.xView = this.followed.x - (this.wView - this.xDeadZone);
      } else if( this.followed.x - this.xDeadZone < this.xView ) {
        this.xView = this.followed.x - this.xDeadZone;
      }

      //Move Camera Vertically
      if( this.followed.y - this.yView + this.yDeadZone > this.hView ) {
        this.yView = this.followed.y - (this.hView - this.yDeadZone);
      } else if( this.followed.y - this.yDeadZone < this.yView ) {
        this.yView = this.followed.y - this.yDeadZone;
      }
    }
    //Update Viewport Rect
    let updateViewport = {
      left: this.xView,
      top: this.yView
    };
    this.viewportRect.set(updateViewport);

    //Don't let camera leave world boundry
    if( !this.viewportRect.within(this.worldRect) ) {
      if( this.viewportRect.left < this.worldRect.left ) {
        this.xView = this.worldRect.left;
      }
      if( this.viewportRect.top < this.worldRect.top ) {
        this.yView = this.worldRect.top;
      }
      if( this.viewportRect.right > this.worldRect.right ) {
        this.xView = this.worldRect.right - this.wView;
      }
      if( this.viewportRect.bottom > this.worldRect.bottom ) {
        this.yView = this.worldRect.bottom - this.hView;
      }
    }
    //alert('STOP');
  } //Camera.update()
} //class Camera

export class Map {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    //Map Texture
    this.image = null;
  } //Map.constructor()

  generate() {
    this.image = new Image();
    this.image.src = Imgs.grid.src;

    /*//#FIXME: ISSUE #48
    let ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = this.width;
    ctx.canvas.height = this.height;

    let rows = this.width / 1600; //Width of grid image
    let cols = this.height / 960; //Height of grid image

    let gridImage = new Image();
    gridImage.src = Imgs.grid.src;
    //Layer the image four times larger
    ctx.save();
    for( let x = 0, i = 0; i < rows; x += 1600, i++ ) {
      for( let y = 0, j = 0; j < cols; y += 960, j++ ) {
        ctx.drawImage(gridImage, x, y);
      }
    }
    ctx.restore();

    this.image = new Image();
    this.image.src = ctx.canvas.toDataURL('image/png');

    ctx = null;
    */
  } //Map.generate()

  draw(ctx, xView, yView) {
    let sx, sy, dx, dy;
    let sWidth, sHeight, dWidth, dHeight;

    //Offset point to crop the image
    sx = xView;
    sy = yView;

    //Dimensions of the cropped image
    sWidth = ctx.canvas.width;
    sHeight = ctx.canvas.height;

    //If cropped image is smaller than canvas we need to change the source dimensions
    if( this.image.width - sx < sWidth ) {
      sWidth = this.image.width - sx;
    }
    if( this.image.height - sy < sHeight ) {
      sHeight = this.image.height - sy;
    }

    //Location on canvas to draw the cropped image
    dx = 0;
    dy = 0;

    //Match destination with source to not scale the image
    dWidth = sWidth;
    dHeight = sHeight;
    ctx.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  } //Map.draw()
} //class Map
