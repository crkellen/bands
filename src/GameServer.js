export class GameServer {
  constructor() {
    this.players = {};
    this.bullets = {};
    this.initPack = {player: [], bullet: []};
    this.removePack = {player: [], bullet: []};
  } //GameServer constructor()

  playerUpdate() {
    var pack = [];
    for( let p in this.players ) {
      let player = this.players[p];
      player.update(this);
      pack.push(player.getUpdatePack());
    }
    return pack;
  } //GameServer.playerUpdate()

  bulletUpdate() {
    var pack = [];
    for( let b in this.bullets ) {
      let bullet = this.bullets[b];
      bullet.update(this);
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
      y: y,
    });
    this.players[socket.ID] = player;
    this.initPack.player.push(player.getInitPack());
    this.players[socket.ID].onConnect(socket);
    socket.emit('init', {
      selfID: socket.ID,
      player: this.getAllInitPacksForPlayer(),
      bullet: this.getAllInitPacksForBullet()
    });
    console.info(`${player.name} has joined the game.`);
  } //GameServer.addPlayer()
} //class GameServer

class Entity {
  constructor(params) {
    this.ID = params.ID;
    this.x = params.x;
    this.y = params.y;
    this.spdX = 0;
    this.spdY = 0;
  } //Entity.constructor()

  update() {
    this.updatePosition();
  } //Entity.update()

  updatePosition() {
    this.x += this.spdX;
    this.y += this.spdY;
  } //Entity.updatePosition()
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
    this.mouseX = 0;
    this.mouseY = 0;
    this.maxSpd = 5;
    this.HP = 10;
    this.maxHP = 10;
    this.score = 0;
    this.ammo = 6;
    this.maxAmmo = 6;
    this.clips = 3;
    this.maxClips = 3;
  } //Player.constructor()

  update(server) {
    this.updateSpd();
    super.update();

    //Boundries check
    if( this.x < 20 ) {
      this.x = 20;
    }
    if( this.y < 60 ) {
      this.y = 60;
    }
    if( this.x > 5000 ) {
      this.x = 5000;
    }
    if( this.y > 3000 ) {
      this.y = 3000;
    }

    //Shoot
    if( this.pressingAttack === true && this.ammo > 0 ) {
      this.pressingAttack = false;
      this.shoot(server);
      this.ammo--;
      if( this.ammo <= 0 ) {
        this.ammo = 0;
        if( this.clips > 0 ) {
          this.reload();
        }
      }
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

  shoot(server) {
    let b = new Bullet({
      parent: this.ID,
      angle: this.mouseAngle,
      x: this.x,
      y: this.y
    });
    let bulletID = Math.random();
    server.bullets[bulletID] = b;
    server.initPack.bullet.push(server.bullets[bulletID].getInitPack());
  } //Player.shoot()

  reload() {
    setTimeout(() => {
      this.ammo = this.maxAmmo;
      this.clips--;
      this.reloading = false;
    }, 3000);
  } //Player.reload()

  respawn() {
    //#TODO: Make it so they respawn after a short time, and at their team base
    this.HP = this.maxHP;
    this.x = Math.random() * 500;
    this.y = Math.random() * 500;
    this.ammo = this.maxAmmo;
    this.clips = this.maxClips;
    this.invincible = true;
    setTimeout(() => {
      this.invincible = false;
    }, 3000);
  } //Player.respawn()

  getInitPack() {
    return {
      ID: this.ID,
      name: this.name,
      x: this.x,
      y: this.y,
      HP: this.HP,
      mX: this.mouseX,
      mY: this.mouseY,
      maxHP: this.maxHP,
      score: this.score,
      ammo: this.ammo,
      maxAmmo: this.maxAmmo,
      clips: this.clips,
      maxClips: this.maxClips
    };
  } //Player.getInitPack()

  getUpdatePack() {
    return {
      ID: this.ID,
      x: this.x,
      y: this.y,
      HP: this.HP,
      mX: this.mouseX,
      mY: this.mouseY,
      score: this.score,
      ammo: this.ammo,
      clips: this.clips
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
      case 'mousePos':
        this.mouseX = data.mousePos.x;
        this.mouseY = data.mousePos.y;
        break;
      default: break;
      }
    }); //'keyPress'
  } //Player.onConnect()
} //class Player

class Bullet extends Entity {
  constructor(params) {
    super(params);
    this.parent = params.parent;
    this.angle = params.angle;

    this.spdX = Math.cos(params.angle/180*Math.PI) * 40;
    this.spdY = Math.sin(params.angle/180*Math.PI) * 40;
    this.ID = Math.random();
    this.timer = 0;
    this.toRemove = false;
  } //Bullet.constructor()

  update(server) {
    if( ++this.timer > 38 ) {
      this.toRemove = true;
    }
    super.update();

    //Boundries check
    if( this.x < 5 ) {
      this.toRemove = true;
    }
    if( this.y < 5 ) {
      this.toRemove = true;
    }
    if( this.x > 5000 ) {
      this.toRemove = true;
    }
    if( this.y > 3000 ) {
      this.toRemove = true;
    }

    //COLLISION CHECK
    for( var i in server.players ) {
      var p = server.players[i];
      if( this.getDistance(p) < 24 && this.parent !== p.ID && p.invincible !== true ) {
        p.HP -= 5;
        if( p.HP <= 0 ) {
          var shooter = server.players[this.parent];
          if( shooter ) {
            shooter.score += 1;
          }
          //Respawn the dead player
          p.respawn();
        }
        this.toRemove = true;
      }
    } //for(var i in Player.list) --- Collision check
  } //Bullet.update()

  getDistance(pt) {
    return Math.sqrt(Math.pow(this.x - pt.x, 2) + Math.pow(this.y - pt.y, 2));
  } //Bullet.getDistance()

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
