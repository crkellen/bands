import { GLOBALS, getTimestamp } from './Globals.js';
import { GridTile } from './GridTile.js';
import { Player } from './Player.js';

export class GameServer {
  constructor() {
    this.players = {};
    this.bullets = {};
    this.blocks = {};
    this.initPack = {player: [], bullet: [], block: []};
    this.removePack = {player: [], bullet: []};

    //Map variables
    this.grid = []; //0, 1, 2 --- Empty, Player, Wall
    this.worldWidth = GLOBALS.WORLD_WIDTH;
    this.worldHeight = GLOBALS.WORLD_HEIGHT;
    this.mapWidth = GLOBALS.WORLD_WIDTH_IN_TILES;
    this.mapHeight = GLOBALS.WORLD_HEIGHT_IN_TILES;
    this.mustUpdateGrid = false;

    this.initializeGrid();
  } //GameServer.constructor()

  initializeGrid() {
    //Create as many rows as the map's height
    for( let i = 0; i < this.mapHeight; i++ ) {
      this.grid.push([]);
      //Inside each row, create as many empty grid tiles as map's width
      for( let j = 0; j < this.mapWidth; j++ ) {
        const gt = new GridTile({
          gridX: j,
          gridY: i,
          server: this
        });
        this.grid[i].push(gt);
      }
    }

    //Manually add bases TODO: Add a function to load premade maps
    //Green Base
    this.grid[0][0] = 3;
    this.grid[0][1] = 3;
    this.grid[0][2] = 3;
    this.grid[1][0] = 3;
    this.grid[1][1] = 3;
    this.grid[1][2] = 3;
    this.grid[2][0] = 3;
    this.grid[2][1] = 3;
    this.grid[2][2] = 3;

    //Blue Base
    this.grid[this.mapHeight][this.mapWidth] = 4;
    this.grid[this.mapHeight][this.mapWidth - 1] = 4;
    this.grid[this.mapHeight][this.mapWidth - 2] = 4;
    this.grid[this.mapHeight - 1][this.mapWidth] = 4;
    this.grid[this.mapHeight - 1][this.mapWidth - 1] = 4;
    this.grid[this.mapHeight - 1][this.mapWidth - 2] = 4;
    this.grid[this.mapHeight - 2][this.mapWidth] = 4;
    this.grid[this.mapHeight - 2][this.mapWidth - 1] = 4;
    this.grid[this.mapHeight - 2][this.mapWidth - 2] = 4;

    /*Example of what it looks like after init:
    [
			[3,3,3,0,0,0,...0],
			[3,3,3,0,0,0,...0],
			...,
			[0,0,0,0,0,0,...4]
		]
    */
  } //GameServer.initializeGrid()

  updateGrid() {
    //At least one player has a new position on the grid, update the grid

    //Empty the grid of all instances of Players (1) leave everything else alone
    for( let i = 0; i < this.mapHeight; i++ ) {
      for( let j = 0; j < this.mapWidth; j++ ) {
        if( this.grid[i][j].occupying === 1 ) {
          this.grid[i][j].updateOccupying(GLOBALS.TILE_EMPTY);
        }
      }
    }

    //Loop through every player, update their current grid position to have a 1
    //If they are overlapping, update the overlap to have a 1 as well
    for( let p in this.players ) {
      const player = this.players[p];

      //Update current grid position to be a 1 if it is not already a 1, or a base
      if( this.grid[player.gridY][player.gridX].occupying !== 1 || this.grid[player.gridY][player.gridX].occupying !== 3
          || this.grid[player.gridY][player.gridX].occupying !== 4 ) {
        this.grid[player.gridY][player.gridX].updateOccupying(GLOBALS.TILE_PLAYER);
      }

      //Check every overlap case, if there is an overlap, update that grid tile
      if( player.isOverlapping.left === true ) {        //OVERLAP ON LEFT
        if( this.grid[player.gridY][player.gridX-1].occupying !== 1 || this.grid[player.gridY][player.gridX].occupying !== 3
            || this.grid[player.gridY][player.gridX].occupying !== 4 ) {
          this.grid[player.gridY][player.gridX-1].updateOccupying(GLOBALS.TILE_PLAYER);
        }
      }
      if( player.isOverlapping.right === true ) {       //OVERLAP ON RIGHT
        if( this.grid[player.gridY][player.gridX+1].occupying !== 1 || this.grid[player.gridY][player.gridX].occupying !== 3
            || this.grid[player.gridY][player.gridX].occupying !== 4 ) {
          this.grid[player.gridY][player.gridX+1].updateOccupying(GLOBALS.TILE_PLAYER);
        }
      }
      if( player.isOverlapping.top === true ) {         //OVERLAP ON TOP
        if( this.grid[player.gridY-1][player.gridX].occupying !== 1 || this.grid[player.gridY][player.gridX].occupying !== 3
            || this.grid[player.gridY][player.gridX].occupying !== 4 ) {
          this.grid[player.gridY-1][player.gridX].updateOccupying(GLOBALS.TILE_PLAYER);
        }
      }
      if( player.isOverlapping.bottom === true ) {      //OVERLAP ON BOTTOM
        if( this.grid[player.gridY+1][player.gridX].occupying !== 1 || this.grid[player.gridY][player.gridX].occupying !== 3
            || this.grid[player.gridY][player.gridX].occupying !== 4 ) {
          this.grid[player.gridY+1][player.gridX].updateOccupying(GLOBALS.TILE_PLAYER);
        }
      }
      if( player.isOverlapping.topLeft === true ) {     //OVERLAP ON TOPLEFT
        if( this.grid[player.gridY-1][player.gridX-1].occupying !== 1 || this.grid[player.gridY][player.gridX].occupying !== 3
            || this.grid[player.gridY][player.gridX].occupying !== 4 ) {
          this.grid[player.gridY-1][player.gridX-1].updateOccupying(GLOBALS.TILE_PLAYER);
        }
      }
      if( player.isOverlapping.topRight === true ) {    //OVERLAP ON TOPRIGHT
        if( this.grid[player.gridY-1][player.gridX+1].occupying !== 1 || this.grid[player.gridY][player.gridX].occupying !== 3
            || this.grid[player.gridY][player.gridX].occupying !== 4 ) {
          this.grid[player.gridY-1][player.gridX+1].updateOccupying(GLOBALS.TILE_PLAYER);
        }
      }
      if( player.isOverlapping.bottomLeft === true ) {  //OVERLAP ON BOTTOMLEFT
        if( this.grid[player.gridY+1][player.gridX-1].occupying !== 1 || this.grid[player.gridY][player.gridX].occupying !== 3
            || this.grid[player.gridY][player.gridX].occupying !== 4 ) {
          this.grid[player.gridY+1][player.gridX-1].updateOccupying(GLOBALS.TILE_PLAYER);
        }
      }
      if( player.isOverlapping.bottomRight === true ) { //OVERLAP ON BOTTOMRIGHT
        if( this.grid[player.gridY+1][player.gridX+1].occupying !== 1 || this.grid[player.gridY][player.gridX].occupying !== 3
            || this.grid[player.gridY][player.gridX].occupying !== 4 ) {
          this.grid[player.gridY+1][player.gridX+1].updateOccupying(GLOBALS.TILE_PLAYER);
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
    const oldGridX = player.gridX;
    const oldGridY = player.gridY;
    //Get the (possibly) updated player gridX and gridY (~~ = Math.floor())
    const newGridX = ~~(player.x / GLOBALS.TILE_WIDTH);
    const newGridY = ~~(player.y / GLOBALS.TILE_HEIGHT);

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
    const innerGridX = player.x - player.gridX * GLOBALS.TILE_WIDTH;
    const innerGridY = player.y - player.gridY * GLOBALS.TILE_HEIGHT;

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
    const pack = [];
    for( let p in this.players ) {
      const player = this.players[p];
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
    const pack = [];
    for( let b in this.bullets ) {
      const bullet = this.bullets[b];
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
    const pack = [];
    for( let bl in this.blocks ) {
      const block = this.blocks[bl];
      pack.push(block.getUpdatePack());
      block.updatePack = {
        ID: block.ID
      };
    }
    return pack;
  } //GameServer.blockUpdate()

  getFrameUpdateData() {
    const pack = {
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
    const players = [];
    for( let p in this.players ) {
      players.push(this.players[p].getInitPack());
    }
    return players;
  } //GameServer.getAllInitPacksForPlayer()

  getAllInitPacksForBullet() {
    const bullets = [];
    for( let b in this.bullets ) {
      bullets.push(this.bullets[b].getInitPack());
    }
    return bullets;
  } //GameServer.getAllInitPacksForBullet()

  getAllInitPacksForBlock() {
    const blocks = [];
    for( let bl in this.blocks ) {
      blocks.push(this.blocks[bl].getInitPack());
    }
    return blocks;
  } //GameServer.getAllInitPacksForPlayer()

  addPlayer(socket, playerName, playerTeam, x, y) {
    const player = new Player({
      socket: socket,
      ID: socket.ID,
      name: playerName,
      team: playerTeam,
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
    let playerTeamString = 'Green';
    if( playerTeam === 1 ) {
      playerTeamString = 'Blue';
    }
    console.info(`${getTimestamp()} - ${player.name} (${playerTeamString} team) has joined the game.`);
  } //GameServer.addPlayer()
} //class GameServer
