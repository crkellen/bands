//World constants
const WORLD_WIDTH   = 3200;
const WORLD_HEIGHT  = 1800;

//Tile constants
const TILE_WIDTH   = 80;
const TILE_HEIGHT  = 80;
const TILE_EMPTY   = 0;
const TILE_PLAYER  = 1;
const TILE_BLOCK   = 2;

export class GameServer {
  constructor() {
    this.players = {};
    this.bullets = {};
    this.blocks = {};
    this.initPack = {player: [], bullet: [], block: []};
    this.removePack = {player: [], bullet: []};

    //Map variables
    this.grid = []; //0, 1, 2 --- Empty, Player, Wall
    this.worldWidth = WORLD_WIDTH;
    this.worldHeight = WORLD_HEIGHT;
    this.mapWidth = this.worldWidth / TILE_WIDTH;
    this.mapHeight = this.worldHeight / TILE_HEIGHT;
    this.mustUpdateGrid = false;

    this.initializeGrid();
  } //GameServer.constructor()

  initializeGrid() {
    //Create as many rows as the map's height
    for( let i = 0; i < this.mapHeight; i++ ) {
      this.grid.push([]);
      //Inside each row, create as many empty grid tiles as map's width
      for( let j = 0; j < this.mapWidth; j++ ) {
        let gt = new GridTile({
          gridX: j,
          gridY: i,
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
    //At least one player has a new position on the grid, update the grid

    //Empty the grid of all instances of Players (1) leave blocks alone (2)
    for( let i = 0; i < this.mapHeight; i++ ) {
      for( let j = 0; j < this.mapWidth; j++ ) {
        if( this.grid[i][j].occupying === 1 ) {
          this.grid[i][j].updateOccupying(TILE_EMPTY);
        }
      }
    }

    //Loop through every player, update their current grid position to have a 1
    //If they are overlapping, update the overlap to have a 1 as well
    for( let p in this.players ) {
      let player = this.players[p];

      //Update current grid position to be a 1
      if( this.grid[player.gridY][player.gridX].occupying !== 1 ) {
        this.grid[player.gridY][player.gridX].updateOccupying(TILE_PLAYER);
      }

      //Check every overlap case, if there is an overlap, update that grid tile
      if( player.isOverlapping.left === true ) {        //OVERLAP ON LEFT
        if( this.grid[player.gridY][player.gridX-1].occupying !== 1 ) {
          this.grid[player.gridY][player.gridX-1].updateOccupying(TILE_PLAYER);
        }
      }
      if( player.isOverlapping.right === true ) {       //OVERLAP ON RIGHT
        if( this.grid[player.gridY][player.gridX+1].occupying !== 1 ) {
          this.grid[player.gridY][player.gridX+1].updateOccupying(TILE_PLAYER);
        }
      }
      if( player.isOverlapping.top === true ) {         //OVERLAP ON TOP
        if( this.grid[player.gridY-1][player.gridX].occupying !== 1 ) {
          this.grid[player.gridY-1][player.gridX].updateOccupying(TILE_PLAYER);
        }
      }
      if( player.isOverlapping.bottom === true ) {      //OVERLAP ON BOTTOM
        if( this.grid[player.gridY+1][player.gridX].occupying !== 1 ) {
          this.grid[player.gridY+1][player.gridX].updateOccupying(TILE_PLAYER);
        }
      }
      if( player.isOverlapping.topLeft === true ) {     //OVERLAP ON TOPLEFT
        if( this.grid[player.gridY-1][player.gridX-1].occupying !== 1 ) {
          this.grid[player.gridY-1][player.gridX-1].updateOccupying(TILE_PLAYER);
        }
      }
      if( player.isOverlapping.topRight === true ) {    //OVERLAP ON TOPRIGHT
        if( this.grid[player.gridY-1][player.gridX+1].occupying !== 1 ) {
          this.grid[player.gridY-1][player.gridX+1].updateOccupying(TILE_PLAYER);
        }
      }
      if( player.isOverlapping.bottomLeft === true ) {  //OVERLAP ON BOTTOMLEFT
        if( this.grid[player.gridY+1][player.gridX-1].occupying !== 1 ) {
          this.grid[player.gridY+1][player.gridX-1].updateOccupying(TILE_PLAYER);
        }
      }
      if( player.isOverlapping.bottomRight === true ) { //OVERLAP ON BOTTOMRIGHT
        if( this.grid[player.gridY+1][player.gridX+1].occupying !== 1 ) {
          this.grid[player.gridY+1][player.gridX+1].updateOccupying(TILE_PLAYER);
        }
      }
    } //for( every player in this.players )

    //Now that we have updated the grid, reset the flag
    this.mustUpdateGrid = false;
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
    //Get the (possibly) updated player gridX and gridY (~~ = Math.floor())
    let newGridX = ~~(player.x / TILE_WIDTH);
    let newGridY = ~~(player.y / TILE_HEIGHT);

    //If the player has just been spawned his values have not been set
    if( player.gridX === -1 ) { //#TODO: replace this check with a variable (player.isInitialized)
      player.gridX = newGridX;
      player.gridY = newGridY;
      this.mustUpdateGrid = true;
      //Fresh spawns will always be exactly inside a grid tile, no need to check overlaps
      return;
    }

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
      //If there was no overlap, and now there is, we must update the grid
      if( player.isOverlapping.left === false ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.left = true;
    } else {
      //If there was an overlap, and now there isn't, we must update the grid
      if( player.isOverlapping.left === true ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.left = false;
    } //if( overlap on LEFT )

    if( innerGridX > 60 ) {            //PLAYER OVERLAP RIGHT OF CURRENT TILE
      //If there was no overlap, and now there is, we must update the grid
      if( player.isOverlapping.right === false ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.right = true;
    } else {
      //If there was an overlap, and now there isn't, we must update the grid
      if( player.isOverlapping.right === true ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.right = false;
    } //if( overlap on RIGHT )

    if( innerGridY < 20 ) {            //PLAYER OVERLAP TOP OF CURRENT TILE
      //If there was no overlap, and now there is, we must update the grid
      if( player.isOverlapping.top === false ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.top = true;
    } else {
      //If there was an overlap, and now there isn't, we must update the grid
      if( player.isOverlapping.top === true ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.top = false;
    } //if( overlap on TOP )

    if( innerGridY > 60 ) {            //PLAYER OVERLAP BOTTOM OF CURRENT TILE
      //If there was no overlap, and now there is, we must update the grid
      if( player.isOverlapping.bottom === false ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.bottom = true;
    } else {
      //If there was an overlap, and now there isn't, we must update the grid
      if( player.isOverlapping.bottom === true ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.bottom = false;
    } //if( overlap on BOTTOM )

    //If the player is at a corner, they can overlap 4 spaces at once
    //So these checks grab the fourth tile (corner tile)
    //TOPLEFT, TOPRIGHT, BOTTOMLEFT, BOTTOMRIGHT
    if( innerGridX < 15 && innerGridY < 15 ) { //PLAYER OVERLAP TOPLEFT OF CURRENT TILE
      //If there was no overlap, and now there is, we must update the grid
      if( player.isOverlapping.topLeft === false ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.topLeft = true;
    } else {
      //If there was an overlap, and now there isn't, we must update the grid
      if( player.isOverlapping.topLeft === true ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.topLeft = false;
    } //if( overlap on TOPLEFT )

    if( innerGridX > 65 && innerGridY < 15 ) { //PLAYER OVERLAP TOPRIGHT OF CURRENT TILE
      //If there was no overlap, and now there is, we must update the grid
      if( player.isOverlapping.topRight === false ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.topRight = true;
    } else {
      //If there was an overlap, and now there isn't, we must update the grid
      if( player.isOverlapping.topRight === true ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.topRight = false;
    } //if( overlap on TOPRIGHT )

    if( innerGridX < 15 && innerGridY > 65 ) { //PLAYER OVERLAP BOTTOMLEFT OF CURRENT TILE
      //If there was no overlap, and now there is, we must update the grid
      if( player.isOverlapping.bottomLeft === false ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.bottomLeft = true;
    } else {
      //If there was an overlap, and now there isn't, we must update the grid
      if( player.isOverlapping.bottomLeft === true ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.bottomLeft = false;
    } //if( overlap on BOTTOMLEFT )

    if( innerGridX > 65 && innerGridY > 65 ) { //PLAYER OVERLAP BOTTOMRIGHT OF CURRENT TILE
      //If there was no overlap, and now there is, we must update the grid
      if( player.isOverlapping.bottomRight === false ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.bottomRight = true;
    } else {
      //If there was an overlap, and now there isn't, we must update the grid
      if( player.isOverlapping.bottomRight === true ) {
        this.mustUpdateGrid = true;
      }
      player.isOverlapping.bottomRight = false;
    } //if( overlap on BOTTOMRIGHT )

    //Now we know the current position of the player, along with whether or not
    //The player is overlapping in any of the cases. If the player is overlapping
    //Or if the player is in a new grid tile. We will have to rebuild the entire
    //Grid. If multiple players trigger the mustUpdateGrid flag, the grid will
    //still only be updated a single time, after every player has set all their
    //overlaps and updated their position.
  } //GameServer.checkPlayerGridPos()

  playerUpdate() {
    var pack = [];
    for( let p in this.players ) {
      let player = this.players[p];
      player.update(this);
      this.checkPlayerGridPos(player);
      pack.push(player.getUpdatePack());
      player.updatePack = {
        ID: player.ID
      };
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
        bullet.updatePack = {
          ID: bullet.ID
        };
      }
    }
    return pack;
  } //GameServer.bulletUpdate()

  blockUpdate() {
    var pack = [];
    for( let bl in this.blocks ) {
      let block = this.blocks[bl];
      pack.push(block.getUpdatePack());
      block.updatePack = {
        ID: block.ID
      };
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
      socket: socket, //#TODO: I DONT LIKE THIS RESPONSE THING IM DOING
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

class GridTile {
  constructor(params) {
    this.gridX = params.gridX;
    this.gridY = params.gridY;
    this.x = params.gridX * TILE_WIDTH;
    this.y = params.gridY * TILE_HEIGHT;

    this.server = params.server; //Reference to the game server

    this.occupying = 0; //0, 1, 2 --- Empty, Player, Block
    this.block = new Block({
      parent: this,
      gridX: this.gridX,
      gridY: this.gridY,
      x: this.x,
      y: this.y
    });
    //To fully instantiate the block, must update the initPack
    this.server.blocks[this.block.ID] = this.block;
    this.server.initPack.block.push(this.server.blocks[this.block.ID].getInitPack());
  } //GridTile.constructor()

  updateOccupying(newOccupant) {
    //ALL COLLISION CHECKS ARE DONE PRIOR TO updateOccupying()
    //IT IS ASSUMED THERE IS NO POSSIBLE COLLISIONS AT THIS POINT
    switch( newOccupant ) {
    case 0: //New occupant is nothing
      if( this.occupying === 2 ) {
        //Block has been removed from this tile
        //Block is turned off when the block HP is modified Block.set HP()
        //Reset it's HP
        this.block.HP = 3;
      }
      this.occupying = 0;
      break;
    case 1: //New occupant is a player
      if( this.occupying === 2 ) {
        //Player has moved inside of a block
        //This should never happen unless all respawn positions are blocked
        console.error(`WARNING: Player has entered a block at Grid[${this.gridY}][${this.gridX}]`);
        //#TODO: Temporarily fix this by remove the block, is there a better solution?
        this.occupying = 0;
        this.block.HP = 3;
        this.block.isActive = false;
      } else {
        //Do not update the grid if the player is inside a block
        this.occupying = 1;
      }
      break;
    case 2: //New occupant is a block
      if( this.occupying === 0 ) {
        //Block has been placed at empty tile
        //Turn the block for this grid tile on
        this.block.isActive = true;
      }
      this.occupying = 2;
      break;
    } //switch( newOccupant )
  } //GridTile.updateOccupying()
} //class GridTile

class Block {
  constructor(params) {
    this.parent = params.parent;
    this.ID = Math.random(); //#TODO: replace with real ID system
    this.gridX = params.gridX;
    this.gridY = params.gridY;

    this.x = params.x;
    this.y = params.y;
    this._HP = 3;
    this._isActive = false;

    //Collision checks
    this.width = TILE_WIDTH;
    this.height = TILE_HEIGHT;

    this.updatePack = {
      ID: this.ID
    };
  } //Block.constructor()

  getInitPack() {
    return {
      ID: this.ID,
      gridX: this.gridX,
      gridY: this.gridY,
      x: this.x,
      y: this.y,
      HP: this.HP,
      isActive: this.isActive
    };
  } //Block.getInitPack()

  getUpdatePack() {
    return this.updatePack;
  } //Block.getUpdatePack()

//BLOCK GETTERS AND SETTERS
  get HP() {
    return this._HP;
  }

  set HP(newHP) {
    if( this._HP !== newHP ) {
      this._HP = newHP;
      this.updatePack.HP = this._HP;
    }
    if( this._HP <= 0 ) {
      this.isActive = false;
    }
  }

  get isActive() {
    return this._isActive;
  }

  set isActive(newIsActive) {
    if( this._isActive !== newIsActive ) {
      this._isActive = newIsActive;
      this.updatePack.isActive = this._isActive;
    }
    if( this._isActive === true ) {
      //Do nothing as this was already handled in GridTile.updateOccupying()
    } else {
      this.parent.updateOccupying(TILE_EMPTY);
    }
  }
//END BLOCK GETTERS AND SETTERS
} //class Block

class Entity {
  constructor(params) {
    this.ID = params.ID;
    this._x = params.x;
    this._y = params.y;
    this.spdX = 0;
    this.spdY = 0;

    this.updatePack = {
      ID: this.ID
    };
  } //Entity.constructor()

  update() {
    this.updatePosition();
  } //Entity.update()

  updatePosition() {
    this.x += this.spdX;
    this.y += this.spdY;
  } //Entity.updatePosition()

//ENTITY GETTERS AND SETTERS
  get x() {
    return this._x;
  }

  set x(newX) {
    if( this._x !== newX ) {
      this._x = newX;
      this.updatePack.x = this._x;
    }
  }

  get y() {
    return this._y;
  }

  set y(newY) {
    if( this._y !== newY ) {
      this._y = newY;
      this.updatePack.y = this._y;
    }
  }
//END ENTITY GETTERS AND SETTERS
} //class Entity

class Player extends Entity {
  constructor(params) {
    super(params);
    this.socket = params.socket;
    this.name = params.name;

    //Grid variables
    this._gridX = -1;
    this._gridY = -1;
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
    //The currently selected grid tile
    this.selGridX = -1;
    this.selGridY = -1;
    this.selGridResponse = false;

    //Input checks
    this.pressingLeft = false;
    this.pressingRight = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.pressingAttack = false;
    this.mouseAngle = 0;
    this._mX = 0;
    this._mY = 0;

    //Player variables
    this.maxSpd = 5;
    this._HP = 10;
    this.maxHP = 10;
    this._score = 0;
    this._ammo = 6;
    this.maxAmmo = 6;
    this._clips = 99; //FIXME: temp for SGX
    this.maxClips = 99; //FIXME: temp for SGX
    this.reloading = false;
    this._invincible = false;
    this._mode = 0; //0 for weapon, 1 for block
    this._blocks = 20; //# of blocks held //FIXME: temp for SGX
    this.maxBlocks = 20; //FIXME: temp for SGX

    //Collision checks
    this.width = 15;
    this.height = 15;
    this.respawnTries = 0;
  } //Player.constructor()

  update(server) {
    //If we updated selection, send the response
    if( this.selGridResponse === true ) {
      this.socket.emit('selGridResponse', {
        selBlockID: server.grid[this.selGridY][this.selGridX].block.ID
      });
      this.selGridResponse = false;
    }

    this.updateSpd();
    super.update();

    //Boundries check
    if( this.x < 20 ) {
      this.x = 20;
    }
    if( this.y < 20 ) {
      this.y = 20;
    }
    if( this.x > (WORLD_WIDTH - 20) ) {
      this.x = WORLD_WIDTH - 20;
    }
    if( this.y > (WORLD_HEIGHT - 20) ) {
      this.y = WORLD_HEIGHT - 20;
    }

    if( this.mode === 0 ) {           //If player is in Weapon Mode
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
    } else if( this.mode === 1 ) {    //If player is in Build Mode
      //Place block
      if( this.pressingAttack === true && this.blocks > 0 ) {
        this.pressingAttack = false;
        this.placeBlock(server);
        if( this.blocks <= 0 ) {
          this.blocks = 0;
        }
      } //Place block
    } //if( this.mode )

    //COLLISION CHECK - Blocks
    //#TODO: Optimize this because if there is a player, there can't be a block
    if( this.gridX === -1 ) {
      //Player is not initialized, return
      return;
    }
    //The 9 blocks surrounding the player
    let surrBlocks = {};
    surrBlocks[5] = server.grid[this.gridY][this.gridX].block;     //CENTER
    if( this.gridX !== 0 ) {
      surrBlocks[4] = server.grid[this.gridY][this.gridX-1].block;   //LEFT
    }
    if( this.gridX !== server.mapWidth-1 ) {
      surrBlocks[6] = server.grid[this.gridY][this.gridX+1].block;   //RIGHT
    }
    if( this.gridY !== 0 ) {
      surrBlocks[8] = server.grid[this.gridY-1][this.gridX].block;   //TOP
    }
    if( this.gridY !== server.mapHeight-1 ) {
      surrBlocks[2] = server.grid[this.gridY+1][this.gridX].block;   //BOTTOM
    }
    if( this.gridX !== 0 && this.gridY !== 0 ) {
      surrBlocks[7] = server.grid[this.gridY-1][this.gridX-1].block; //TOPLEFT
    }
    if( this.gridX !== server.mapWidth-1 && this.gridY !== 0 ) {
      surrBlocks[9] = server.grid[this.gridY-1][this.gridX+1].block; //TOPRIGHT
    }
    if( this.gridX !== 0 && this.gridY !== server.mapHeight-1 ) {
      surrBlocks[1] = server.grid[this.gridY+1][this.gridX-1].block; //BOTTOMLEFT
    }
    if( this.gridX !== server.mapWidth-1 && this.gridY !== server.mapHeight-1 ) {
      surrBlocks[3] = server.grid[this.gridY+1][this.gridX+1].block; //BOTTOMRIGHT
    }

    for( var i in surrBlocks ) {
      var bl = surrBlocks[i];

      //If the block is turned off, skip collision detection
      if( bl.isActive === false ) {
        continue;
      }

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
    } //for( var i in surrBlocks ) --- Block Collision Check
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

  respawn(server) {
    //#TODO: Make it so they respawn after a short time, and at their team base
    this.x = (getRandomInt(1, 39) * 40);
    this.y = (getRandomInt(1, 20) * 40);
    if( this.x % 80 === 0 ) {
      this.x += 40;
    }
    if( this.y % 80 === 0 ) {
      this.y += 40;
    }
    if( this.respawnTries >= 10 ) {
      this.respawnTries = 0;
      console.error('WARNING: All available player respawn positions are blocks.');
    } else {
      if( this.respawnPositionOccupied(server) === true ) {
        //The function call in the if statement will call respawn() again if true
        //Return to pop this function call off the stack
        return;
      }
    }

    this.HP = this.maxHP;
    this.ammo = this.maxAmmo;
    this.clips = this.maxClips;
    this.blocks = this.maxBlocks;
    this.invincible = true;
    setTimeout(() => {
      this.invincible = false;
    }, 3000);
  } //Player.respawn()

  respawnPositionOccupied(server) {
    let newGridX = ~~(this.x / TILE_WIDTH);
    let newGridY = ~~(this.y / TILE_HEIGHT);
    if( server.grid[newGridY][newGridX].occupying === 2 ) {
      this.respawnTries++;
      this.respawn(server);
      return true;
    } else {
      //No collision, player can spawn here
      return false;
    }
  } //Player.respawnPositionOccupied()

  placeBlock(server) {
    //If the player selection is out of bounds, ignore the request
    if( this.selGridX === -1 || this.selGridY === -1 ) {
      return;
    }

    //If the location is empty space
    if( server.grid[this.selGridY][this.selGridX].occupying === 0 ) {
      server.grid[this.selGridY][this.selGridX].updateOccupying(TILE_BLOCK);
      this.blocks--;
    }
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
    return this.updatePack;
    // return {
    //   ID: this.ID,
    //   gridX: this.gridX,
    //   gridY: this.gridY,
    //   x: this.x,
    //   y: this.y,
    //   HP: this.HP,
    //   mX: this.mouseX,
    //   mY: this.mouseY,
    //   score: this.score,
    //   ammo: this.ammo,
    //   clips: this.clips,
    //   invincible: this.invincible,
    //   mode: this.mode,
    //   blocks: this.blocks
    // };
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
        this.mX = data.mousePos.x;
        this.mY = data.mousePos.y;
        break;
      case 'selGrid':
        if( this.selGridX !== data.selGridX ) {
          this.selGridX = data.selGridX;
        }
        if( this.selGridY !== data.selGridY ) {
          this.selGridY = data.selGridY;
        }
        if( this.selGridX === -1 || this.selGridY === -1 ) {
          //If it's invalid do nothing, otherwise respond
          this.selGridResponse = false;
        } else  {
          this.selGridResponse = true;
        }
        break;
      default: break;
      }
    }); //'keyPress'
  } //Player.onConnect()

//PLAYER GETTERS AND SETTERS
  get gridX() {
    return this._gridX;
  }

  set gridX(newGridX) {
    if( this._gridX !== newGridX ) {
      this._gridX = newGridX;
      this.updatePack.gridX = this._gridX;
    }
  }

  get gridY() {
    return this._gridY;
  }

  set gridY(newGridY) {
    if( this._gridY !== newGridY ) {
      this._gridY = newGridY;
      this.updatePack.gridY = this._gridY;
    }
  }

  get HP() {
    return this._HP;
  }

  set HP(newHP) {
    if( this._HP !== newHP ) {
      this._HP = newHP;
      this.updatePack.HP = this._HP;
    }
  }

  get mX() {
    return this._mX;
  }

  set mX(newMX) {
    if( this._mX !== newMX ) {
      this._mX = newMX;
      this.updatePack.mX = this._mX;
    }
  }

  get mY() {
    return this._mY;
  }

  set mY(newMY) {
    if( this._mY !== newMY ) {
      this._mY = newMY;
      this.updatePack.mY = this._mY;
    }
  }

  get score() {
    return this._score;
  }

  set score(newScore) {
    if( this._score !== newScore ) {
      this._score = newScore;
      this.updatePack.score = this._score;
    }
  }

  get ammo() {
    return this._ammo;
  }

  set ammo(newAmmo) {
    if( this._ammo !== newAmmo ) {
      this._ammo = newAmmo;
      this.updatePack.ammo = this._ammo;
    }
  }

  get clips() {
    return this._clips;
  }

  set clips(newClips) {
    if( this._clips !== newClips ) {
      this._clips = newClips;
      this.updatePack.clips = this._clips;
    }
  }

  get invincible() {
    return this._invincible;
  }

  set invincible(newInvincible) {
    if( this._invincible !== newInvincible ) {
      this._invincible = newInvincible;
      this.updatePack.invincible = this._invincible;
    }
  }

  get mode() {
    return this._mode;
  }

  set mode(newMode) {
    if( this._mode !== newMode ) {
      this._mode = newMode;
      this.updatePack.mode = this._mode;
    }
  }

  get blocks() {
    return this._blocks;
  }

  set blocks(newBlocks) {
    if( this._blocks !== newBlocks ) {
      this._blocks = newBlocks;
      this.updatePack.blocks = this._blocks;
    }
  }
//END PLAYER GETTERS AND SETTERS
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

    this.updatePack.ID = this.ID;
  } //Bullet.constructor()

  update(server) {
    if( ++this.timer > 38 ) {
      this.toRemove = true;
      //If the bullet needs to be removed, return
      return;
    }
    super.update();

    //Boundries check
    if( this.x < 5 ) {
      this.toRemove = true;
      //If the bullet needs to be removed, return
      return;
    }
    if( this.y < 5 ) {
      this.toRemove = true;
      //If the bullet needs to be removed, return
      return;
    }
    if( this.x > WORLD_WIDTH - 5 ) {
      this.toRemove = true;
      //If the bullet needs to be removed, return
      return;
    }
    if( this.y > WORLD_HEIGHT - 5 ) {
      this.toRemove = true;
      //If the bullet needs to be removed, return
      return;
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
          p.respawn(server);
        }
        this.toRemove = true;
        //If the bullet needs to be removed, return
        return;
      }
    } //for(var i in Player list) --- Collision check

    //COLLISION CHECK - Blocks
    for( var j in server.blocks ) {
      var bl = server.blocks[j];
      if( bl.isActive === false ) {
        continue;
      }
      let other = {
        x: bl.x,
        y: bl.y,
        width: bl.width,
        height: bl.height
      };
      if( this.isColliding(other) ) {
        bl.HP -= 1;
        this.toRemove = true;
        //If the bullet needs to be removed, return
        return;
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
    return this.updatePack;
  } //Bullet.getUpdatePack()
} //class Bullet

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
