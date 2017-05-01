const TILE_WIDTH = 80;
const TILE_HEIGHT = 80;

export class GameServer {
  constructor() {
    this.players = {};
    this.bullets = {};
    this.blocks = {};
    this.initPack = {player: [], bullet: [], block: []};
    this.removePack = {player: [], bullet: [], block: []};

    //Map variables
    this.grid = []; //0, 1, 2 --- Empty, Player, Wall
    this.detectPoints = [];
    this.worldWidth = 480; //#TODO: temp values
    this.worldHeight = 480;
    this.mapWidth = this.worldWidth / TILE_WIDTH; //TEMP: 6
    this.mapHeight = this.worldHeight / TILE_HEIGHT; //TEMP: 6
    this.mustUpdateGrid = false;

    this.initializeGrid();
  } //GameServer.constructor()

  initializeGrid() {
    //DETECTION POINTS
    //Create as many rows as the map's height + 1
    for( let i = 0; i < this.mapHeight + 1; i++ ) {
      this.detectPoints.push([]);
      //Inside each row, create as many empty grid tiles as map's width + 1
      for( let j = 0; j < this.mapWidth + 1; j++ ) {
        let dp = new DetectionPoint({arrX: j, arrY: i});
        this.detectPoints[i].push(dp);
      }
    }
    //GRID
    //Create as many rows as the map's height
    for( let i = 0; i < this.mapHeight; i++ ) {
      this.grid.push([]);
      //Inside each row, create as many empty grid tiles as map's width
      for( let j = 0; j < this.mapWidth; j++ ) {
        let d1 = {x: j, y: i};
        let d2 = {x: j + 1, y: i};
        let d3 = {x: j, y: i + 1};
        let d4 = {x: j + 1, y: i + 1};
        let gt = new GridTile({
          gridX: j,
          gridY: i,
          d1: d1,
          d2: d2,
          d3: d3,
          d4: d4,
          server: this
        });
        this.grid[i].push(gt);
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

  updateGrid() {


    console.info(`
      [${this.grid[0][0].occupying}][${this.grid[0][1].occupying}]
      [${this.grid[1][0].occupying}][${this.grid[1][1].occupying}]`);

  } //GameServer.updateGrid()

  checkPlayerGridPos(player) {
    //Checks to see if the player has changed his grid position or overlaps.
    //If the player has, this.mustUpdateGrid is set to true to rebuild the grid.
    //This means that if ANY player has updated, the grid will be updated.
    //However, the grid is only updated after all players are checked, so it is
    //only ever updated once per server loop.

    //Player world position (player.x, player.y) has been updated to current values already

    //Player's current gridX and gridY
    let oldGridX = player.gridX;
    let oldGridY = player.gridY;
    //Get the (possibly) updated player gridX and gridY
    let newGridX = Math.floor((player.x / TILE_WIDTH));
    let newGridY = Math.floor((player.y / TILE_HEIGHT));

    //If the player has just been spawned his values have not been set
    if( player.gridX === -1 ) { //#TODO: replace this check with a variable (player.isInitialized)
      player.gridX = newGridX;
      player.gridY = newGridY;
      this.mustUpdateGrid = true;
      //Fresh spawns will always be exactly inside a grid tile, no need to check overlaps
      return;
    }

    //#TODO this could be possibly optimized to only check for overlaps.
    //#TODO however, this covers respawning.
    //If the player has moved to a new grid tile (whole new tile)
    //THIS UPDATES THE PLAYER'S CURRENT GRID POSITION
    if( newGridX !== oldGridX ) {
      //Update player's current gridX to newGridX
      player.gridX = newGridX;
      //Player is in a new position, must update the grid
      this.mustUpdateGrid = true;
    }
    if( newGridY !== oldGridY ) {
      //Update player's current gridY to newGridY
      player.gridY = newGridY;
      //Player is in a new position, must update the grid
      this.mustUpdateGrid = true;
    }

    //Calculate any overlaps the player is currently on
    //THIS IS STORED FOR UPDATING THE GRID, BUT DOES NOT AFFECT HIS GRID POSITION

    //Get the player's position inside the grid tile he is in
    //Center of tile is 40,40. Top left is 0,0. Bottom left is 80,80.
    let innerGridX = player.x - player.gridX * TILE_WIDTH;
    let innerGridY = player.y - player.gridY * TILE_HEIGHT;


    //If the player's position inside of the tile is overlapping with another tile
    //These values are currently hardcoded.
    //They are based off the player radius (20) and speed (5)

    //LEFT, RIGHT, TOP, BOTTOM
    if( innerGridX < 20 ) {            //PLAYER OVERLAP LEFT OF CURRENT TILE
      player.isOverlapping.left = true;
    }
    if( innerGridX > 60 ) {            //PLAYER OVERLAP RIGHT OF CURRENT TILE
      player.isOverlapping.right = true;
    }
    if( innerGridY < 20 ) {            //PLAYER OVERLAP TOP OF CURRENT TILE
      player.isOverlapping.top = true;
    }
    if( innerGridY > 60 ) {            //PLAYER OVERLAP BOTTOM OF CURRENT TILE
      player.isOverlapping.bottom = true;
    }

    //If the player is at a corner, they can overlap 4 spaces at once
    //So these checks grab the fourth tile (corner tile)
    //TOPLEFT, TOPRIGHT, BOTTOMLEFT, BOTTOMRIGHT
    if( innerGridX < 15 && innerGridY < 15 ) { //PLAYER OVERLAP TOPLEFT OF CURRENT TILE
      player.isOverlapping.topLeft = true;
    }
    if( innerGridX > 65 && innerGridY < 15 ) { //PLAYER OVERLAP TOPRIGHT OF CURRENT TILE
      player.isOverlapping.topRight = true;
    }
    if( innerGridX < 15 && innerGridY > 65 ) { //PLAYER OVERLAP BOTTOMLEFT OF CURRENT TILE
      player.isOverlapping.bottomLeft = true;
    }
    if( innerGridX > 65 && innerGridY > 65 ) { //PLAYER OVERLAP BOTTOMRIGHT OF CURRENT TILE
      player.isOverlapping.bottomRight = true;
    }


  } //GameServer.checkPlayerGridPos()

  playerUpdate() {
    var pack = [];
    for( let p in this.players ) {
      let player = this.players[p];
      player.update(this);
      this.checkPlayerGridPos(player);
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

class DetectionPoint {
  constructor(params) {
    this.arrX = params.arrX;
    this.arrY = params.arrY;
    this.x = params.arrX * TILE_WIDTH;
    this.y = params.arrY * TILE_HEIGHT;
    this.radius = 40; //Equal to player diameter
  } //DetectionPoint.constructor()

  getDistance(pt) {
    return Math.sqrt(Math.pow(this.x - pt.x, 2) + Math.pow(this.y - pt.y, 2));
  } //DetectionPoint.getDistance()
} //class DetectionPoint

class GridTile {
  constructor(params) {
    this.gridX = params.gridX;
    this.gridY = params.gridY;
    this.x = params.gridX * TILE_WIDTH;
    this.y = params.gridY * TILE_HEIGHT;
    this.dPoints = [
      {x: params.d1.x, y: params.d1.y},
      {x: params.d2.x, y: params.d2.y},
      {x: params.d3.x, y: params.d3.y},
      {x: params.d4.x, y: params.d4.y}
    ];
    this.occupying = 0; //0, 1, 2 --- Empty, Player, Block
    this.block = new Block({
      gridX: this.gridX,
      gridY: this.gridY,
      x: this.x,
      y: this.y
    });
  } //GridTile.constructor()



  updateOccupying(server, newOccupant) {
    //ALL COLLISION CHECKS ARE DONE PRIOR TO updateOccupying()
    //IT IS ASSUMED THERE IS NO POSSIBLE COLLISIONS AT THIS POINT
    switch( newOccupant ) {
    case 0: //New occupant is nothing
    //#TODO: ONLY NEED TO CHECK IF BLOCK WAS HERE
      if( this.occupying === 1 ) {
        //Player has moved out of this tile
        //Nothing needs to be done
      } else if( this.occupying === 2 ) {
        //Block has been removed from this tile
        //Set the block to be removed
        this.block.toRemove = true;
      }
      this.occupying = 0;
      break;
    case 1: //New occupant is a player
    //#TODO: NOTHING NEEDS TO BE DONE
      if( this.occupying === 0 ) {
        //Player has moved into this empty tile
        //Nothing needs to be done
      } else if( this.occupying === 1 ) {
        //Player has moved into a tile with a player in it
        //Nothing needs to be done
      } else if( this.occupying === 2 ) {
        //Player has moved inside of a block
        //This should never happen
        console.error(`ERROR: Player has entered a block at Grid[${this.gridY}][${this.gridX}]`);
      }
      this.occupying = 1;
      break;
    case 2: //New occupant is a block
    //#TODO: ONLY NEED TO CHECK IF EMPTY
      if( this.occupying === 0 ) {
        //Block has been placed at empty tile
        server.blocks[this.block.ID] = this.block;
        server.initPack.block.push(server.blocks[this.block.ID].getInitPack());
      }
      this.occupying = 2;
      break;
    } //switch( newOccupant )
  } //GridTile.updateOccupying()
} //class GridTile

class Block {
  constructor(params) {
    this.ID = Math.random(); //#TODO replace with real ID system
    this.gridX = params.gridX;
    this.gridY = params.gridY;

    this.x = params.x;
    this.y = params.y;
    this.HP = 3;
    this.toRemove = false;

    //Collision checks
    this.width = TILE_WIDTH;
    this.height = TILE_HEIGHT;
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
      HP: this.HP
    };
  } //Block.getUpdatePack()
} //class Block







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
    this.prevPos = {}; //Can be more than one grid position (corners, sides)

    this.isOverlapping = {
      left: false,
      right: false,
      top: false,
      bottom: false,
      topLeft: false,
      topRight: false,
      bottomLeft: false,
      bottomRight: false,
      center: false
    };

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


//GRID UPDATE
/* #TODO TRYING NEW THINGS 5-1-2017
//The player has already been updated, now update the grid
let mustUpdateGrid = false;

let oldGridX = player.gridX;
let oldGridY = player.gridY;
//Get the updated player gridX and gridY
let newGridX = Math.floor((player.x / TILE_WIDTH));
let newGridY = Math.floor((player.y / TILE_HEIGHT));

//Must recheck overlap status every time we update
//If it's still false after all overlap checks and player.isOverlapping
//Is true for the same overlap, then we need to update the grid
let overlaps = {
  left: false,
  right: false,
  top: false,
  bottom: false,
  topLeft: false,
  topRight: false,
  bottomLeft: false,
  bottomRight: false,
  center: true
};

//If the player has just been spawned his values have not been set
if( player.gridX === -1 ) { //#TODO: replace this check with a variable (player.isInitialized)
  player.gridX = newGridX;
  player.gridY = newGridY;
  //Set previous position to our current position for default values
  player.prevPos.center = {x: player.gridX, y: player.gridY};
  mustUpdateGrid = true;
}

//If the player has moved to a new grid tile
if( newGridX !== player.gridX ) {
  //Replace the old position with empty space
  this.grid[player.gridY][oldGridX].updateOccupying(this, 0);
  player.gridX = newGridX;
  mustUpdateGrid = true;
}
if( newGridY !== player.gridY ) {
  //Replace the old position with empty space
  this.grid[oldGridY][player.gridX].updateOccupying(this, 0);
  player.gridY = newGridY;
  mustUpdateGrid = true;
}

//If Player has moved to a new grid tile, update the grid to show that
if( mustUpdateGrid === true ) {
  this.grid[player.gridY][player.gridX].updateOccupying(this, 2);
  //Also update the previous position flag if not first pass
  if( oldGridX !== -1 ) {
    player.isOverlapping.center = true;
  }
}

//Get the player's position inside the grid tile he is in
let innerGridX = player.x - player.gridX * TILE_WIDTH;
let innerGridY = player.y - player.gridY * TILE_HEIGHT;

//If the player's position inside of the tile is overlapping with another tile
//These values are currently hardcoded. They are based off the player radius
if( innerGridX < 20 ) {
  //Player overlapping with left tile neighbor
  overlaps.center = false; //True here means player is not overlapping at all
  overlaps.left = true;
  this.grid[player.gridY][player.gridX-1].updateOccupying(this, 2);
  //If we updated the grid, update our previous position
  if( player.isOverlapping.left !== true ) {
    player.isOverlapping.left = true;
    player.prevPos.left = {x: player.gridX-1, y: player.gridY};
  }
}
if( innerGridX > 60 ) {
  //Player overlapping with right tile neighbor
  overlaps.center = false; //True here means player is not overlapping at all
  overlaps.right = true;
  this.grid[player.gridY][player.gridX+1].updateOccupying(this, 2);
  //If we updated the grid, update our previous position
  if( player.isOverlapping.right !== true ) {
    player.isOverlapping.right = true;
    player.prevPos.right = {x: player.gridX+1, y: player.gridY};
  }
}
if( innerGridY < 20 ) {
  //Player overlapping with top tile neighbor
  overlaps.center = false; //True here means player is not overlapping at all
  overlaps.top = true;
  this.grid[player.gridY-1][player.gridX].updateOccupying(this, 2);
  //If we updated the grid, update our previous position
  if( player.isOverlapping.top !== true ) {
    player.isOverlapping.top = true;
    player.prevPos.top = {x: player.gridX, y: player.gridY-1};
  }
}
if( innerGridY > 60 ) {
  //Player overlapping with bottom tile neighbor
  overlaps.center = false; //True here means player is not overlapping at all
  overlaps.bottom = true;
  this.grid[player.gridY+1][player.gridX].updateOccupying(this, 2);
  //If we updated the grid, update our previous position
  if( player.isOverlapping.bottom !== true ) {
    player.isOverlapping.bottom = true;
    player.prevPos.bottom = {x: player.gridX, y: player.gridY+1};
  }
}

//If the player is at a corner, they can overlap 4 spaces at once
//These numbers are based off both player radius and speed
if( innerGridX < 15 && innerGridY < 15 ) {
  //Player is overlapping with top left corner
  overlaps.center = false; //True here means player is not overlapping at all
  overlaps.topLeft = true;
  this.grid[player.gridY-1][player.gridX-1].updateOccupying(this, 2);
  //If we updated the grid, update our previous position
  if( player.isOverlapping.topLeft !== true ) {
    player.isOverlapping.topLeft = true;
    player.prevPos.topLeft = {x: player.gridX-1, y: player.gridY-1};
  }
}
if( innerGridX > 65 && innerGridY < 15 ) {
  //Player is overlapping with top right corner
  overlaps.center = false; //True here means player is not overlapping at all
  overlaps.topRight = true;
  this.grid[player.gridY-1][player.gridX+1].updateOccupying(this, 2);
  //If we updated the grid, update our previous position
  if( player.isOverlapping.topRight !== true ) {
    player.isOverlapping.topRight = true;
    player.prevPos.topRight = {x: player.gridX+1, y: player.gridY-1};
  }
}
if( innerGridX < 15 && innerGridY > 65 ) {
  //Player is overlapping with bottom left corner
  overlaps.center = false; //True here means player is not overlapping at all
  overlaps.bottomLeft = true;
  this.grid[player.gridY+1][player.gridX-1].updateOccupying(this, 2);
  //If we updated the grid, update our previous position
  if( player.isOverlapping.bottomLeft !== true ) {
    player.isOverlapping.bottomLeft = true;
    player.prevPos.bottomLeft = {x: player.gridX-1, y: player.gridY+1};
  }
}
if( innerGridX > 65 && innerGridY > 65 ) {
  //Player is overlapping with bottom right corner
  overlaps.center = false; //True here means player is not overlapping at all
  overlaps.bottomRight = true;
  this.grid[player.gridY+1][player.gridX+1].updateOccupying(this, 2);
  //If we updated the grid, update our previous position
  if( player.isOverlapping.bottomRight !== true ) {
    player.isOverlapping.bottomRight = true;
    player.prevPos.bottomRight ={x: player.gridX+1, y: player.gridY+1};
  }
}

//Check to see if any the overlap status has changed, if so update the grid
//If an 'overlaps.X' is still false, AND 'player.isOverlapping.X' is true, then
//We need to update the grid, because we are no longer overlapping there
if( overlaps.left === false && player.isOverlapping.left === true ) {
  this.grid[player.prevPos.left.x][player.prevPos.left.y].updateOccupying(this, 0);
  player.isOverlapping.left = false;
}
if( overlaps.right === false && player.isOverlapping.right === true ) {
  this.grid[player.prevPos.right.x][player.prevPos.right.y].updateOccupying(this, 0);
  player.isOverlapping.right = false;
}
if( overlaps.top === false && player.isOverlapping.top === true ) {
  this.grid[player.prevPos.top.x][player.prevPos.top.y].updateOccupying(this, 0);
  player.isOverlapping.top = false;
}
if( overlaps.bottom === false && player.isOverlapping.bottom === true ) {
  this.grid[player.prevPos.bottom.x][player.prevPos.bottom.y].updateOccupying(this, 0);
  player.isOverlapping.bottom = false;
}
if( overlaps.topLeft === false && player.isOverlapping.topLeft === true ) {
  this.grid[player.prevPos.topLeft.x][player.prevPos.topLeft.y].updateOccupying(this, 0);
  player.isOverlapping.topLeft = false;
}
if( overlaps.topRight === false && player.isOverlapping.topRight === true ) {
  this.grid[player.prevPos.topRight.x][player.prevPos.topRight.y].updateOccupying(this, 0);
  player.isOverlapping.topRight = false;
}
if( overlaps.bottomLeft === false && player.isOverlapping.bottomLeft === true ) {
  this.grid[player.prevPos.bottomLeft.x][player.prevPos.bottomLeft.y].updateOccupying(this, 0);
  player.isOverlapping.bottomLeft = false;
}
if( overlaps.bottomRight === false && player.isOverlapping.bottomRight === true ) {
  this.grid[player.prevPos.bottomRight.x][player.prevPos.bottomRight.y].updateOccupying(this, 0);
  player.isOverlapping.bottomRight = false;
}

//If there are no overlaps at all and we have moved to a new tile, and not init step
if( overlaps.center === true && player.isOverlapping.center === true && oldGridX !== -1 ) {
  console.info(`prevPos: ${player.prevPos.center.x}, ${player.prevPos.center.y}
    [${this.grid[0][0].occupying}][${this.grid[0][1].occupying}]
    [${this.grid[1][0].occupying}][${this.grid[1][1].occupying}]`);
  //Then replace previous tile with empty space
  this.grid[player.prevPos.center.y][player.prevPos.center.x].updateOccupying(this, 0);
  //Update player.prevPos to current pos
  player.prevPos.center = {x: player.gridX, y: player.gridY};
  player.isOverlapping.center = false;
}

// //If we aren't overlapping at all, update previous grid position
// if( overlaps.center === true && player.isOverlapping.center !== true ) {
//   console.info('JKASLJFLKASJFKLASJFKLAJSKLFKLASJKLJFASLFAJSFKLJALKFJKLASFJ');
//   this.grid[player.prevPos.center.x][player.prevPos.center.y].updateOccupying(this, 0);
//   player.isOverlapping.center = false;
// }

//CURRENTLY ONLY CHECKS ONE HALF OF THE CASES :KFASJFKLJASFKLJA
if( player.prevPos.center !== undefined ) {
  console.info(`${innerGridX}, ${innerGridY}
    O: ${overlaps.center}, P: ${player.isOverlapping.center}, X: ${player.prevPos.center.x}
    [${this.grid[0][0].occupying}][${this.grid[0][1].occupying}]
    [${this.grid[1][0].occupying}][${this.grid[1][1].occupying}]`);
}
*/ //END 5-1-2017 TEST

/* #TODO: KJASLDKJASLKDJKLASJDKLASJLDKJASLJDLAS
//After the player grid position has been updated, check detection points
//Can't check out of bounds
let canCheckX = false;
let canCheckY = false;
if( player.gridX > 0 ) {
  if( player.gridX < this.mapWidth ) {
    canCheckX = true;
  }
}
if( player.gridY > 0 ) {
  if( player.gridY < this.mapHeight ) {
    canCheckY = true;
  }
}

//Build the list of surrounding detection points
let surrounding = [];
surrounding.push(this.grid[player.gridY][player.gridX]); //Middle Middle
if( canCheckX === true ) {
  if( player.pressingLeft === true ) {
    surrounding.push(this.grid[player.gridY][player.gridX-1]); //Middle Left
  }
  if( player.pressingRight === true ) {
    surrounding.push(this.grid[player.gridY][player.gridX+1]); //Middle Right
  }
}
if( canCheckY === true ) {
  if( player.pressingUp === true ) {
    surrounding.push(this.grid[player.gridY-1][player.gridX]); //Top Middle
  }
  if( player.pressingDown === true ) {
    surrounding.push(this.grid[player.gridY+1][player.gridX]); //Bottom Middle
  }
}
if( canCheckX === true && canCheckY === true ) {
  if( player.pressingUp === true && player.pressingLeft ) {
    surrounding.push(this.grid[player.gridY-1][player.gridX-1]); //Top Left
  }
  if( player.pressingDown === true && player.pressingLeft ) {
    surrounding.push(this.grid[player.gridY+1][player.gridX-1]); //Bottom Left
  }
  if( player.pressingUp === true && player.pressingRight ) {
    surrounding.push(this.grid[player.gridY-1][player.gridX+1]); //Top Right
  }
  if( player.pressingDown === true && player.pressingRight ) {
    surrounding.push(this.grid[player.gridY+1][player.gridX+1]); //Bottom Right
  }
}

//Now that we know which detection points to check, check them for collision
for( let i = 0; i < surrounding.length; i++ ) {
  //Check each of the tile's detection points
  for( let j = 0; j < 4; j++ ) {
    let curPoint = this.detectPoints[surrounding[i].dPoints[j].y][surrounding[i].dPoints[j].x];
    if( curPoint.getDistance(player) < curPoint.radius ) {
      //A detection point has collided with the player
      surrounding[i].updateOccupying(this, 2);
      //No need to keep checking this tile's detection points
    } //if (collision)
  } //for (j)
} //for (i)

if( mustUpdateGrid === true ) {
  this.grid[oldGridY][oldGridX].updateOccupying(this, 0);
}
//console.info(`
//  [${this.grid[1][1].occupying}][${this.grid[1][2].occupying}]
//  [${this.grid[2][1].occupying}][${this.grid[2][2].occupying}]`);
*/
