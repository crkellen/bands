//const DEBUG = true;
const INTERVAL = 50;
//const ROTATION_SPEED = 5;
const ARENA_MARGIN = 30;

export class Game {
  constructor(w, h, socket) {
    this.players = []; //Players other than local player
    this.bullets = [];
    this.width = w;
    this.height = h;
    this.socket = socket;

    let g = this;
    setInterval( () => {
      g.mainLoop();
    }, INTERVAL);
  } //Game.constructor()

  addPlayer(ID, isLocal, x, y, HP) {
    let p = new Player(ID, this, isLocal, x, y, HP);
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
    }
    if( this.localPlayer !== undefined ) {
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
    serverData.players.forEach( (serverPlayer) => {
      //Update local player status
      if( this.localPlayer !== undefined && serverPlayer.ID === this.localPlayer.ID ) {
        this.localPlayer.HP = serverPlayer.HP;
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
  constructor(ID, game, isLocal, x, y, HP) {
    this.ID = ID;
    this.game = game;
    this.isLocal = isLocal;
    this.x = x;
    this.y = y;
    this.HP = HP;
    this.w = 60;
    this.h = 80;
    this.gunAngle = 0;
    this.speed = 5;
    this.dir = [0, 0, 0, 0];
    this.dead = false;

    this.materialize();
  } //Player.constructor()

  materialize() {
    //Draw Player
    if( this.isLocal === true ) {
      this.setControls();
    }
  } //Player.materialize()

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

/*
function debug(msg) {
  if( DEBUG === true ) {
    console.info(msg);
  }
} //debug()

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
} //getRandomInt()
*/
