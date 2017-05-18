import { GLOBALS } from './Globals.js';
import { Block } from './Block.js';

export class GridTile {
  constructor(params) {
    this.gridX = params.gridX;
    this.gridY = params.gridY;
    this.x = params.gridX * GLOBALS.TILE_WIDTH;
    this.y = params.gridY * GLOBALS.TILE_HEIGHT;

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
