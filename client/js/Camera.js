import { Rectangle } from './Rectangle.js';

export class Camera {
  constructor(params) {
    //Viewport (Camera) location, top left corner
    this.xView = params.xView;
    this.yView = params.yView;

    //Viewport Dimensions
    this.wView = params.canvasWidth;
    this.hView = params.canvasHeight;

    //Distance from followed object to border, before camera starts to move
    this.xDeadZone = 0;
    this.yDeadZone = 0;

    //Object to be followed (player)
    this.followed = null;

    let viewport = {
      left: this.xView,
      top: this.yView,
      width: this.wView,
      height: this.hView
    };

    this.viewportRect = new Rectangle(viewport);

    let world = {
      left: 0,
      top: 0,
      width: params.worldWidth,
      height: params.worldHeight
    };
    this.worldRect = new Rectangle(world);
  } //Camera.constructor()

  follow(gameObject, xDeadZone, yDeadZone) {
    this.followed = gameObject;
    this.xDeadZone = xDeadZone;
    this.yDeadZone = yDeadZone;
  } //Camera.follow()

  update() {
    if( this.followed != null ) {
      //Move Camera Horizontally
      if( this.followed.x - this.xView + this.xDeadZone > this.wView ) {
        this.xView = this.followed.x - (this.wView - this.xDeadZone);
      } else if( this.followed.x - this.xDeadZone < this.xView ) {
        this.xView = this.followed.x - this.xDeadZone;
      }

      //Move Camera Vertically
      if( this.followed.y - this.yView + this.yDeadZone > this.hView ) {
        this.yView = this.followed.y - (this.hView - this.yDeadZone);
      } else if( this.followed.y - this.yDeadZone < this.yView ) {
        this.yView = this.followed.y - this.yDeadZone;
      }
    }
    //Update Viewport Rect
    let updateViewport = {
      left: this.xView,
      top: this.yView
    };
    this.viewportRect.set(updateViewport);

    //Don't let camera leave world boundry
    if( !this.viewportRect.within(this.worldRect) ) {
      if( this.viewportRect.left < this.worldRect.left ) {
        this.xView = this.worldRect.left;
      }
      if( this.viewportRect.top < this.worldRect.top ) {
        this.yView = this.worldRect.top;
      }
      if( this.viewportRect.right > this.worldRect.right ) {
        this.xView = this.worldRect.right - this.wView;
      }
      if( this.viewportRect.bottom > this.worldRect.bottom ) {
        this.yView = this.worldRect.bottom - this.hView;
      }
    }
    //alert('STOP');
  } //Camera.update()
} //class Camera
