export var Imgs = {};
Imgs.player = new Image();
Imgs.player.src = './../img/player.png';
Imgs.bullet = new Image();
Imgs.bullet.src = './../img/bullet.png';
//Imgs.background = new Image();
//Imgs.background.src = '/client/img/map1.png';
Imgs.grid = new Image();
Imgs.grid.src = './../img/map1.png';

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
    this.maxHP = initPack.maxHP;
    this.score = initPack.score;
  } //cPlayer.constructor

  drawSelf(cGame) {
    let x = this.x - cGame.cPlayers[cGame.selfID].x + cGame.ctx.canvas.width/2;
    let y = this.y - cGame.cPlayers[cGame.selfID].y + cGame.ctx.canvas.height/2;

    let HPWidth = 30 * this.HP / this.maxHP;
    cGame.ctx.fillStyle = 'red';
    cGame.ctx.fillRect(x - HPWidth/2, y + 20, HPWidth, 4);

    let width = Imgs.player.width;
    let height = Imgs.player.height;

    cGame.ctx.drawImage(Imgs.player, 0, 0, Imgs.player.width, Imgs.player.height, x - width/2, y - height/2, width, height);
  } //cPlayer.drawSelf()

  drawName(cGame) {
    let x = this.x - cGame.cPlayers[cGame.selfID].x + cGame.ctx.canvas.width/2;
    let y = this.y - cGame.cPlayers[cGame.selfID].y + cGame.ctx.canvas.height/2;

    cGame.ctx.fillText(this.name, x - Imgs.player.width/2, y - 20);
  } //cPlayer.drawName()
} //class cPlayer

export class cBullet {
  constructor(initPack) {
    this.ID = initPack.ID;
    this.x = initPack.x;
    this.y = initPack.y;
  } //cBullet.constructor()

  drawSelf(cGame) {
    let width = Imgs.bullet.width/2;
    let height = Imgs.bullet.height/2;
    let x = this.x - cGame.cPlayers[cGame.selfID].x + cGame.ctx.canvas.width/2;
    let y = this.y - cGame.cPlayers[cGame.selfID].y + cGame.ctx.canvas.height/2;

    cGame.ctx.drawImage(Imgs.bullet, 0, 0, Imgs.bullet.width, Imgs.bullet.height, x - width/2, y - height/2, width, height);
  } //cBullet.drawSelf()
} //class cBullet
