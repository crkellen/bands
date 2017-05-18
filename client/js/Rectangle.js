export class Rectangle {
  constructor(params) {
    this.left = params.left;
    this.top = params.top;
    this.width = params.width;
    this.height = params.height;
    this.right = this.left + this.width;
    this.bottom = this.top + this.height;
  } //Rectangle.constructor()

  set(params) {
    this.left = params.left;
    this.top = params.top;
    if( params.width !== undefined ) {
      this.width = params.width;
    }
    if( params.height !== undefined ) {
      this.height = params.height;
    }
    this.right = this.left + this.width;
    this.bottom = this.top + this.height;
  } //Rectangle.set()

  within(rect) {
    return (rect.left <= this.left &&
      rect.right >= this.right &&
      rect.top <= this.top &&
      rect.bottom >= this.bottom);
  } //Rectangle.within()

  overlaps(rect) {
    return (this.left < rect.right &&
      rect.left < this.right &&
      this.top < rect.bottom &&
      rect.top < this.bottom);
  } //Rectangle.overlaps()
} //class Rectangle
