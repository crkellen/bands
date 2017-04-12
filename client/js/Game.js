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
      console.info(`xView ${this.xView}, xDeadZone ${this.xDeadZone}, wView ${this.wView}`);
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
    let ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = this.width;
    ctx.canvas.height = this.height;

    let rows = ~~(this.width/44) + 1;
    let cols = ~~(this.height/44) + 1;

    let color = 'red';
    ctx.save();
    ctx.fillStyle = 'red';
    for( let x = 0, i = 0; i < rows; x += 44, i++ ) {
      ctx.beginPath();
      for( let y = 0, j = 0; j < cols; y += 44, j++ ) {
        ctx.rect(x, y, 40, 40);
      }
      color = (color === 'red' ? 'blue' : 'red');
      ctx.fillStyle = color;
      ctx.fill();
      ctx.closePath();
    }
    ctx.restore();

    this.image = new Image();
    this.image.src = ctx.canvas.toDataURL('image/png');

    ctx = null;
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
    //console.info('sx ' + sx + 'sy ' + sy + 'sWidth ' + sWidth + 'sHeight ' + sHeight + 'dWidth ' + dWidth + 'dHeight ' + dHeight);
    console.info(`sx ${sx}, sy ${sy}, sWidth ${sWidth}, sHeight ${sHeight}, dWidth ${dWidth}, dHeight ${dHeight}`);
    ctx.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  } //Map.draw()
} //class Map
