export class GameServer {
  constructor() {
    this.players = {};
    this.bullets = {};
    this.blocks = {};
    this.initPack = {player: [], bullet: [], block: []};
    this.removePack = {player: [], bullet: [], block: []};
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

  blockUpdate() {
    var pack = [];
    for( let bl in this.blocks ) {
      let block = this.blocks[bl];
      block.update(this);
      if( block.toRemove === true ) {
        delete this.blocks[bl];
        this.removePack.block.push(block.ID);
      } else {
        pack.push(block.getUpdatePack());
      }
    }
    return pack;
  } //GameServer.blockUpdate()

  getFrameUpdateData() {
    let pack = {
      initPack: {
        player: this.initPack.player,
        bullet: this.initPack.bullet,
        block: this.initPack.block
      },
      removePack: {
        player: this.removePack.player,
        bullet: this.removePack.bullet,
        block: this.removePack.block
      },
      updatePack: {
        player: this.playerUpdate(),
        bullet: this.bulletUpdate(),
        block: this.blockUpdate()
      }
    };

    this.initPack.player = [];
    this.initPack.bullet = [];
    this.initPack.block = [];
    this.removePack.player = [];
    this.removePack.bullet = [];
    this.removePack.block = [];
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

  getAllInitPacksForBlock() {
    let blocks = [];
    for( let bl in this.blocks ) {
      blocks.push(this.blocks[bl].getInitPack());
    }
    return blocks;
  } //GameServer.getAllInitPacksForPlayer()

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
      bullet: this.getAllInitPacksForBullet(),
      block: this.getAllInitPacksForBlock()
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
    this.invincible = false;
    this.mode = 0; //0 for weapon, 1 for block
    this.blocks = 10; //# of blocks held
    this.maxBlocks = 10;
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


    //If player is in Weapon Mode
    if( this.mode === 0 ) {
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
      } //Shoot
    } else if( this.mode === 1 ) {
      //Place block
      if( this.pressingAttack === true && this.blocks > 0 ) {
        this.pressingAttack = false;
        this.placeBlock(server);
        this.blocks--;
        if( this.blocks <= 0 ) {
          this.blocks = 0;
        }
      } //Place block
    } //if( this.mode )
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
    let bulletID = Math.random(); //#TODO replace with a real ID system
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

  placeBlock(server) {
    let block = new Block({
      x: this.x + 50,
      y: this.y + 50
    });
    let blockID = Math.random(); //#TODO replace with a real ID system
    server.blocks[blockID] = block;
    server.initPack.block.push(server.blocks[blockID].getInitPack());
  } //Player.placeBlock

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
      maxClips: this.maxClips,
      invincible: this.invincible,
      mode: this.mode,
      blocks: this.blocks,
      maxBlocks: this.maxBlocks
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
      clips: this.clips,
      invincible: this.invincible,
      mode: this.mode,
      blocks: this.blocks
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
      case 'switchMode':
        //Swap mode from 0 to 1 or 1 to 0 (this.mode ^= 1;)
        this.mode = 1 - this.mode;
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
    this.ID = Math.random(); //#TODO replace with real ID system
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

    //COLLISION CHECK - Players
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
    } //for(var i in Player list) --- Collision check

    //COLLISION CHECK - Blocks
    for( var j in server.blocks ) {
      var bl = server.blocks[j];
      if( this.getDistance(bl) < 24 ) {
        bl.HP -= 1;
        this.toRemove = true;
      }
    } //for(var j in Block list) --- Collision check
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

class Block {
  constructor(params) {
    this.x = params.x;
    this.y = params.y;
    this.ID = Math.random(); //#TODO replace with real ID system
    this.HP = 3;
    this.width = 80;
    this.height = 80;
    this.toRemove = false;
  } //Block.constructor()

  update(server) {
    if( this.HP <= 0 ) {
      this.toRemove = true;
    }

    //COLLISION CHECK - Players
    for( var i in server.players ) {
      var p = server.players[i];
      let other = {
        x: p.x - 20, //x - player width
        y: p.y - 20, //y - player height
        width: 40,
        height: 40
      };

      let result = this.isColliding(other);
      if( result.outcome === true ) {
        console.info(result.direction);
        switch( result.direction ) {
        case 0: //Collided with left side
          p.x = this.x - 20;
          break;
        case 1: //Collided with right side
          p.x = this.x + 100;
          break;
        case 2: //Collided with top side
          p.y = this.y - 20;
          break;
        case 3: //Collided with bottom side
          p.y = this.y + 100;
          break;
        }
      }
    } //for(var i in Player.list) --- Collision check
  } //Block.update()

  isColliding(other) {
    let result = {
      outcome: false,
      direction: -1
    };

    //If there is an actual collision, figure out which side it came from
    if( this.AABBCheck(other) ) {
      if( !other.x + other.width < this.x ) {
        result.outcome = true;
        result.direction = 0;
      } else if( !this.x + this.width < other.x ) {
        result.outcome = true;
        result.direction = 1;
      } else if( !other.y + other.height < this.y ) {
        result.outcome = true;
        result.direction = 2;
      } else if( !this.y + this.height < other.y ) {
        result.outcome = true;
        result.direction = 3;
      }
    }

    return result;
  } //Block.isColliding()

  AABBCheck(other) {
    return !( other.x + other.width < this.x || this.x + this.width < other.x || other.y + other.height < this.y || this.y + this.height < other.y );
  } //Block.AABBCheck()

  getDistance(pt) {
    return Math.sqrt(Math.pow(this.x - pt.x, 2) + Math.pow(this.y - pt.y, 2));
  } //Block.getDistance()

  getInitPack() {
    return {
      ID: this.ID,
      x: this.x,
      y: this.y,
      HP: this.HP
    };
  } //Block.getInitPack()

  getUpdatePack() {
    return {
      ID: this.ID,
      HP: this.HP
    };
  } //Block.getUpdatePack()
} //class Block
