export class GameServer {
  constructor() {
    this.players = {};
    this.bullets = {};
    this.blocks = {};
    this.initPack = {player: [], bullet: [], block: []};
    this.removePack = {player: [], bullet: [], block: []};
    this.grid = []; //0, 1, 2 --- Empty, Player, Wall
    this.worldWidth = 480; //#TODO: temp values
    this.worldHeight = 480;
    this.mapWidth = this.worldWidth / 80; //TEMP: 6
    this.mapHeight = this.worldHeight / 80; //TEMP: 6

    this.initializeGrid();
  } //GameServer.constructor()

  initializeGrid() {
    //Create as many rows as the map's height
    for( let i = 0; i < this.mapHeight; i++ ) {
      this.grid.push([]);
      //Inside each row, create as many empty grid tiles as map's width
      for( let j = 0; j < this.mapWidth; j++ ) {
        this.grid[i].push(0);
      }
    }
    /*Example of what it looks like after init:
    [
			[0,0,0,0,0,0,...0],
			[0,0,0,0,0,0,...0],
			...,
			[0,0,0,0,0,0,...0]
		]
    */
  } //GameServer.initializeGrid()

  playerUpdate() {
    var pack = [];
    for( let p in this.players ) {
      let player = this.players[p];
      player.update(this);
      player.gridX = Math.floor((player.x / this.worldWidth) * 6);
      player.gridY = Math.floor((player.y / this.worldHeight) * 6);
      this.grid[player.gridY][player.gridX] = 1;

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
      block.update();
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

    this.gridX = -1;
    this.gridY = -1;

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

    //Collision checks
    this.width = 15;
    this.height = 15;
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

    //COLLISION CHECK - Blocks
    for( var i in server.blocks ) {
      var bl = server.blocks[i];
      let other = {
        x: bl.x,
        y: bl.y,
        width: 95,
        height: 95
      };

      if( this.isColliding(other) ) {
        if( this.pressingRight === true ) {
          this.x -= this.spdX;
        }
        if( this.pressingLeft === true ) {
          this.x -= this.spdX;
        }
        if( this.pressingDown === true ) {
          this.y -= this.spdY;
        }
        if( this.pressingUp === true ) {
          this.y -= this.spdY;
        }
      }
    } //for(var i in Player.list) --- Collision check


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

  isColliding(other) {
    return !( other.x + other.width < this.x
      || this.x + this.width < other.x
      || other.y + other.height < this.y
      || this.y + this.height < other.y );
  } //Player.isColliding()

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
    this.blocks = this.maxBlocks;
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
      gridX: this.gridX,
      gridY: this.gridY,
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
      gridX: this.gridX,
      gridY: this.gridY,
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

    //Collision checks
    this.width = 5;
    this.height = 5;
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
      let other = {
        x: bl.x,
        y: bl.y,
        width: bl.width,
        height: bl.height
      };
      if( this.isColliding(other) ) {
        bl.HP -= 1;
        this.toRemove = true;
      }
    } //for(var j in Block list) --- Collision check
  } //Bullet.update()

  getDistance(pt) {
    return Math.sqrt(Math.pow(this.x - pt.x, 2) + Math.pow(this.y - pt.y, 2));
  } //Bullet.getDistance()

  isColliding(other) {
    return !( other.x + other.width < this.x
      || this.x + this.width < other.x
      || other.y + other.height < this.y
      || this.y + this.height < other.y );
  } //Bullet.isColliding()

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
    this.ID = Math.random(); //#TODO replace with real ID system
    this.gridX = -1;
    this.gridY = -1;

    this.x = params.x;
    this.y = params.y;
    this.HP = 3;
    this.toRemove = false;

    //Collision checks
    this.width = 80;
    this.height = 80;
  } //Block.constructor()

  update() {
    if( this.HP <= 0 ) {
      this.toRemove = true;
    }
  } //Block.update()

  getInitPack() {
    return {
      ID: this.ID,
      gridX: this.gridX,
      gridY: this.gridY,
      x: this.x,
      y: this.y,
      HP: this.HP
    };
  } //Block.getInitPack()

  getUpdatePack() {
    return {
      ID: this.ID,
      gridX: this.gridX,
      gridY: this.gridY,
      HP: this.HP
    };
  } //Block.getUpdatePack()
} //class Block
