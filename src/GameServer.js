export class GameServer {
  constructor() {
    this.players = [];
    this.bullets = [];
    this.initPack = {player: [], bullet: []};
    this.removePack = {player: [], bullet: []};
  } //GameServer constructor()

  playerUpdate() {
    var pack = [];
    for( let p in this.players ) {
      let player = this.players[p];
      player.update();
      pack.push(player.getUpdatePack());
    }
    return pack;
  } //GameServer.playerUpdate()

  bulletUpdate() {
    var pack = [];
    for( let b in this.bullets ) {
      let bullet = this.bullets[b];
      bullet.update();
      if( bullet.toRemove === true ) {
        delete this.bullets[b];
        this.removePack.bullet.push(bullet.ID);
      } else {
        pack.push(bullet.getUpdatePack());
      }
    }
    return pack;
  } //GameServer.bulletUpdate()

  getFrameUpdateData() {
    let pack = {
      initPack: {
        player: this.initPack.player,
        bullet: this.initPack.bullet
      },
      removePack: {
        player: this.removePack.player,
        bullet: this.removePack.bullet
      },
      updatePack: {
        player: this.playerUpdate(),
        bullet: this.bulletUpdate()
      }
    };

    this.initPack.player = [];
    this.initPack.bullet = [];
    this.removePack.player = [];
    this.removePack.bullet = [];
    return pack;
  } //GameServer.getFrameUpdateData()

  getAllInitPacksForPlayer() {
    let players = [];
    for( let p in this.players ) {
      players.push(this.players[p].getInitPack());
    }
    return players;
  } //GameServer.getAllInitPacksForPlayer()

  getAllInitPacksForBullet() {
    let bullets = [];
    for( let b in this.bullets ) {
      bullets.push(this.bullets[b].getInitPack());
    }
    return bullets;
  } //GameServer.getAllInitPacksForBullet()

  addPlayer(socket, playerName, x, y) {
    let player = new Player({
      ID: socket.ID,
      name: playerName,
      x: x,
      y: y
    });
    this.players[socket.ID] = player;
    player.onConnect(socket);
    socket.emit('init', {
      selfID: socket.ID,
      player: this.getAllInitPacksForPlayer(),
      bullet: this.getAllInitPacksForPlayer()
    });
  } //GameServer.addPlayer()
/*
  addBullet(bullet) {
    this.bullets.push(bullet);
  } //GameServer.addBullet()

  removePlayer(playerID) {
    this.players = this.players.filter( (p) => { return p.ID != playerID; } );
  } //GameServer.removePlayer()

  syncPlayers(newPlayerData) {
    this.players.forEach( (player) => {
      player.x = newPlayerData.x;
      player.y = newPlayerData.y;
      player.gunAngle = newPlayerData.gunAngle;
    }); //forEach
  } //GameServer.syncPlayers()

  syncBullets() {
    this.bullets.forEach( (bullet) => {
      this.detectCollision(bullet);

      if( bullet.x < 0 || bullet.x > WIDTH
        || bullet.y < 0 || bullet.y > HEIGHT ) {
        bullet.dead = true;
      } else  {
        bullet.move();
      }
    }); //forEach
  } //GameServer.syncBullets()

  detectCollision(bullet) {
    this.players.forEach( (player) => {
      if( player.ID != bullet.ownerID
        && Math.abs(player.x - bullet.x) < 10
        && Math.abs(player.y - bullet.y) < 10 ) {
        //Player was Hit
        this.hurtPlayer(player);
        bullet.dead = true;
      }
    }); //forEach
  } //GameServer.detectCollision()

  hurtPlayer(player) {
    player.HP -= 1;
  } //GameServer.hurtPlayer()

  getData() {
    let gameData = {};
    gameData.players = this.players;
    gameData.bullets = this.bullets;

    return gameData;
  } //GameServer.getData()

  removeDeadPlayers() {
    this.players = this.players.filter( (p) => {
      return p.HP > 0;
    });
  } //GameServer.removeDeadPlayers()

  removeDeadBullets() {
    this.bullets = this.bullets.filter( (bullet) => {
      return !bullet.dead;
    });
  } //GameServer.removeDeadPlayers()

  increaseLastBulletID() {
    this.lastBulletID++;
    if( this.lastBulletID > 1000 ) {
      this.lastBulletID = 0;
    }
  } //GameServer.increaseLastBulletID()
*/
} //class GameServer

class Entity {
  constructor(params) {
    this.ID = params.ID;
    this.x = params.x;
    this.y = params.y;
    this.spdX = params.spdX;
    this.spdY = params.spdY;
  } //Entity.constructor()

  update() {
    this.updatePosition();
  } //Entity.update()

  updatePosition() {
    this.x += this.spdX;
    this.y += this.spdY;
  } //Entity.updatePosition()

  getDistance(pt) {
    return Math.sqrt(Math.pow(this.x - pt.x, 2) + Math.pow(this.y - pt.y));
  } //Entity.getDistance()
} //class Entity

class Player extends Entity {
  constructor(params) {
    super(params);
    this.name = params.name;

    this.pressingLeft = false;
    this.pressingRight = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.pressingAttack = false;
    this.mouseAngle = 0;
    this.maxSpd = 10;
    this.HP = 10;
    this.maxHP = 10;
    this.score = 0;
  } //Player.constructor()

  update() {
    this.updateSpd();
    super.update();

    if( this.presingAttack === true ) {
      this.shoot();
    }
  } //Player.update()

  updateSpd() {
    if( this.pressingLeft === true ) {
      this.spdX = -this.maxSpd;
    } else if( this.pressingRight === true ) {
      this.spdX = this.maxSpd;
    } else {
      this.spdX = 0;
    }

    if( this.pressingUp === true ) {
      this.spdY = -this.maxSpd;
    } else if( this.pressingDown === true ) {
      this.spdY = this.maxSpd;
    } else {
      this.spdY = 0;
    }
  } //Player.updateSpd()

  shoot() {
    let b = Bullet({
      parent: this.ID,
      angle: this.angle,
      x: this.x,
      y: this.y
    });
    //Game.addBullet(b);
  } //Player.shoot()

  getInitPack() {
    return {
      ID: this.ID,
      x: this.x,
      y: this.y,
      HP: this.HP,
      maxHP: this.maxHP,
      score: this.score
    };
  } //Player.getInitPack()

  getUpdatePack() {
    return {
      ID: this.ID,
      x: this.x,
      y: this.y,
      HP: this.HP,
      score: this.score
    };
  } //Player.getUpdatePack()

  onConnect(socket) {
    socket.on('keyPress', (data) => {
      switch( data.inputID ) {
      case 'left':
        this.pressingLeft = data.state;
        break;
      case 'right':
        this.pressingRight = data.state;
        break;
      case 'up':
        this.pressingUp = data.state;
        break;
      case 'down':
        this.pressingDown = data.state;
        break;
      case 'attack':
        this.pressingAttack = data.state;
        break;
      case 'mouseAngle':
        this.mouseAngle = data.state;
        break;
      default: console.info('ERROR: keyPress event - Invalid input'); break;
      }
    }); //'keyPress'
  } //Player.onConnect()
} //class Player

class Bullet extends Entity {
  constructor(params) {
    super(params);
    this.parent = params.parent;
    this.angle = params.angle;

    this.spdX = Math.cos(params.angle/180*Math.PI) * 10;
    this.spdY = Math.sin(params.angle/180*Math.PI) * 10;
    this.ID = Math.random();
    this.timer = 0;
    this.toRemove = false;
  } //Bullet.constructor()

  update() {
    if( ++this.timer > 100 ) {
      self.toRemove = true;
    }
    super.update();

    //#TODO COLLISION CHECK

  } //Bullet.update()

  getInitPack() {
    return {
      ID: this.ID,
      x: this.x,
      y: this.y
    };
  } //Bullet.getInitPack()

  getUpdatePack() {
    return {
      ID: this.ID,
      x: this.x,
      y: this.y
    };
  } //Bullet.getUpdatePack()
} //class Bullet
