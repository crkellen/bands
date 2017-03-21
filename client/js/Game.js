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
    this.x = initPack.x;
    this.y = initPack.y;
    this.HP = initPack.HP;
    this.maxHP = initPack.maxHP;
    this.score = initPack.score;
  } //cPlayer.constructor

  drawSelf(cGame) {
    let x = this.x - cGame.cPlayers[this.ID] + cGame.ctx.canvas.width/2;
    let y = this.y - cGame.cPlayers[this.ID] + cGame.ctx.canvas.height/2;
    let HPWidth = 30 * this.HP / this.maxHP;

    cGame.ctx.fillStyle = 'red';
    cGame.ctx.fillRect(x - HPWidth/2, y - 40, HPWidth, 4);

    let width = Imgs.player.width*2;
    let height = Imgs.player.height*2;

    cGame.ctx.drawImage(Imgs.player, 0, 0, Imgs.player.width, Imgs.player.height, x - width/2, y - height/2, width, height);
  } //cPlayer.drawSelf()
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
    let x = this.x - cGame.cPlayers[this.ID] + cGame.ctx.canvas.width/2;
    let y = this.y - cGame.cPlayers[this.ID] + cGame.ctx.canvas.height/2;

    cGame.ctx.drawImage(Imgs.bullet, 0, 0, Imgs.bullet.width, Imgs.bullet.height, x - width/2, y - height/2, width, height);
  } //cBullet.drawSelf()
} //class cBullet

//##############################################################################

/*
export class Game {
  constructor(socket, ctx) {
    this.players = []; //Players other than local player
    this.bullets = [];
    this.socket = socket;
    this.ctx = ctx;

    setInterval( () => {
      this.mainLoop();
    }, INTERVAL);
  } //Game.constructor()

  addPlayer(ID, name, isLocal, x, y, HP, img) {
    let p = new Player(ID, this, name, isLocal, x, y, HP, img);
    if( isLocal === true ) {
      this.localPlayer = p;
    } else {
      this.players.push(p);
    }
  } //Game.addPlayer()

  removePlayer(playerID) {
    //Remove Player object
    this.players = this.players.filter( (p) => {return p.ID !== playerID;});
  } //Game.removePlayer()

  killPlayer(player) {
    player.dead = true;
    this.removePlayer(player.ID);
  } // Game.killPlayer()

  addBullet(bullet) {
    this.bullets.push(bullet);
  } //Game.addBullet()

  mainLoop() {
    if( this.localPlayer !== undefined ) {
      this.sendData(); //Send local data
      this.localPlayer.move(); //Move local player
    }
  } //Game.mainLoop()

  sendData() {
    let gameData = {};
    //Send local player Data
    let p = {
      ID: this.localPlayer.ID,
      x: this.localPlayer.x,
      y: this.localPlayer.y,
      gunAngle: this.localPlayer.gunAngle
    };
    gameData.player = p;

    //Client game does not send any info about bullets
    this.socket.emit('sync', gameData);
  } //Game.sendData()

  receiveData(serverData) {
    this.ctx.canvas.width = this.ctx.canvas.clientWidth;
    this.ctx.canvas.height = this.ctx.canvas.clientHeight;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    serverData.players.forEach( (serverPlayer) => {
      //Update local player status
      if( this.localPlayer !== undefined && serverPlayer.ID === this.localPlayer.ID ) {
        this.localPlayer.HP = serverPlayer.HP;
        this.localPlayer.drawSelf();
        if( this.localPlayer.HP <= 0 ) {
          this.killPlayer(this.localPlayer);
        }
      }

      //Update other clients
      let found = false;
      this.players.forEach( (clientPlayer) => {
        if( clientPlayer.ID === serverPlayer.ID ) {
          clientPlayer.x = serverPlayer.x;
          clientPlayer.y = serverPlayer.y;
          clientPlayer.gunAngle = serverPlayer.gunAngle;
          clientPlayer.HP = serverPlayer.HP;
          clientPlayer.drawSelf();
          if( clientPlayer.HP <= 0 ) {
            this.killPlayer(clientPlayer);
          }
          found = true;
        }
      }); //forEach(clientPlayer)

      //If the clientPlayer was not found
      if( !found && (this.localPlayer === undefined || serverPlayer.ID != this.localPlayer.ID) ) {
        //Create the clientPlayer
        this.addPlayer(serverPlayer.ID, false, serverPlayer.x, serverPlayer.y, serverPlayer.HP);
      }
    }); //forEach(serverPlayer)

    //Draw bullets
    serverData.bullets.forEach( (serverBullet) => {
      let b = new Bullet(serverBullet.ID, serverBullet.ownerID, serverBullet.x, serverBullet.y);
      b.materialize(); //#TODO Temporary usage to make b not an error. Will replace
    }); //forEach(serverBullet)
  } //Game.receiveData()
} //class Game

class Bullet {
  constructor(ID, ownerID, x, y) {
    this.ID = ID;
    this.ownerID = ownerID;
    this.x = x;
    this.y = y;

    this.materialize();
  } //Bullet.constructor()

  materialize() {
    //Draw the Bullet
  } //Bullet.materialize()
} //class Bullet

class Player {
  constructor(ID, game, name, isLocal, x, y, HP, img) {
    this.ID = ID;
    this.game = game;
    this.name = name;
    this.isLocal = isLocal;
    this.x = x;
    this.y = y;
    this.HP = HP;
    this.img = img;
    this.w = 60;
    this.h = 80;
    this.gunAngle = 0;
    this.speed = 5;
    this.dir = [0, 0, 0, 0];
    this.dead = false;

    this.drawSelf();
  } //Player.constructor()

  drawSelf() {
    //Draw Player
    this.game.ctx.fillStyle = 'white';
    this.game.ctx.font = '30px Arial';
    this.game.ctx.fillText(this.name, this.x, this.y);

    if( this.isLocal === true ) {
      this.setControls();
    }
  } //Player.drawSelf()

  isMoving() {
    if( this.dir[0] != 0 || this.dir[1] != 0 ) {
      return true;
    } else {
      return false;
    }
  } //Player.isMoving()

  setControls() {
    $(document).keypress( (e) => {
      let k = e.keyCode || e.which;
      switch(k) {
      case 119: //W
        this.dir[1] = -1;
        break;
      case 97: //A
        this.dir[0] = -1;
        break;
      case 115: //S
        this.dir[1] = 1;
        break;
      case 100: //D
        this.dir[0] = 1;
        break;
      default: break;
      }
    }).keyup( (e) => {
      let k = e.keyCode || e.which;
      switch(k){
      case 87: //W
        this.dir[1] = 0;
        break;
      case 65: //A
        this.dir[0] = 0;
        break;
      case 83: //S
        this.dir[1] = 0;
        break;
      case 68: //D
        this.dir[0] = 0;
        break;
      default: break;
      }
    }).mousemove( (e) => {
      let mx = e.pageX; //#TODO Fix this later
      let my = e.pageY; //#TODO Fix this later
      this.setGunAngle(mx, my);
    }).click( () => {
      this.shoot();
    }); //$(document).keypress().keyup().mousemove().click()
  } //Player.setControls()

  move() {
    if( this.dead === true ) {
      return;
    }

    let moveX = this.speed * this.dir[0];
    let moveY = this.speed * this.dir[1];
    //#TODO: The 1100, 580 is actually the width and height, respectively, of canvas
    if( this.x + moveX > (0 + ARENA_MARGIN) && (this.x + moveX) < (1100 - ARENA_MARGIN) ) {
      this.x += moveX;
    }
    if( this.y + moveY > (0 + ARENA_MARGIN) && (this.y + moveY) < 580 - ARENA_MARGIN ) {
      this.y += moveY;
    }
  } //Player.move()

  setGunAngle(mx, my) {
    let player = { x: this.x, y: this.y };
    let mouse = { x: mx, y: my };
    let deltaX = mouse.x - player.x;
    let deltaY = mouse.y - player.y;
    this.gunAngle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    this.gunAngle += 90;
  } //Player.setGunAngle()

  shoot() {
    if( this.dead === true ) {
      return;
    }

    //Emit bullet to server
    let serverBullet = {};
    //Just for local bullets who have owner
    serverBullet.alpha = this.gunAngle * Math.PI /180; //Angle of shot in radians

    //set init position
    let gunLength = 60;
    let deltaX = gunLength * Math.sin(serverBullet.alpha);
    let deltaY = gunLength * Math.cos(serverBullet.alpha);

    serverBullet.ownerID = this.ID;
    serverBullet.x = this.x + deltaX - 5;
    serverBullet.y = this.y + deltaY - 5;

    this.game.socket.emit('shoot', serverBullet);
  } //Player.shoot()
} //class Player


function debug(msg) {
  if( DEBUG === true ) {
    console.info(msg);
  }
} //debug()

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
} //getRandomInt()
*/
