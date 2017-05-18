export class Entity {
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