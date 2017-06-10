import { GLOBALS } from './Globals';

export class Map {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    //Map Texture
    this.image = null;
  } //Map.constructor()

  generate() {
    this.image = new Image();
    this.image.src = GLOBALS.Imgs.grid.src;

    //#FIXME: ISSUE #48 FIXME: OPTIMIZE WORLD SIZE
    /*
    let ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = this.width;
    ctx.canvas.height = this.height;

    const rows = this.width / 1600; //Width of grid image
    const cols = this.height / 960; //Height of grid image

    const gridImage = new Image();
    gridImage.src = Imgs.grid.src;
    //Layer the image four times larger
    ctx.save();
    for( let x = 0, i = 0; i < rows; x += 1600, i++ ) {
      for( let y = 0, j = 0; j < cols; y += 960, j++ ) {
        ctx.drawImage(gridImage, x, y);
      }
    }
    ctx.restore();

    this.image = new Image();
    this.image.src = ctx.canvas.toDataURL('image/webp', 0.0);

    ctx = null;
    */
  } //Map.generate()

  draw(ctx, xView, yView) {
    //Offset point to crop the image
    const sx = xView;
    const sy = yView;

    //Dimensions of the cropped image
    let sWidth = ctx.canvas.width;
    let sHeight = ctx.canvas.height;

    //If cropped image is smaller than canvas we need to change the source dimensions
    if( this.image.width - sx < sWidth ) {
      sWidth = this.image.width - sx;
    }
    if( this.image.height - sy < sHeight ) {
      sHeight = this.image.height - sy;
    }

    //Location on canvas to draw the cropped image
    const dx = 0;
    const dy = 0;

    //Match destination with source to not scale the image
    const dWidth = sWidth;
    const dHeight = sHeight;

    ctx.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  } //Map.draw()
} //class Map
