import { GLOBALS } from './Globals.js';

export class Block {
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
    this.width = GLOBALS.TILE_WIDTH;
    this.height = GLOBALS.TILE_HEIGHT;

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
      this.parent.updateOccupying(GLOBALS.TILE_EMPTY);
    }
  }
//END BLOCK GETTERS AND SETTERS
} //class Block