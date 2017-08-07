import * as Pixi from 'pixi.js';
import { GLOBALS } from './Globals';
var Sprite = Pixi.Sprite;

export class cBullet {
  constructor(initPack) {
    this.ID = initPack.ID;
    this.x = initPack.x;
    this.y = initPack.y;
    this.angle = initPack.angle;

    //Pixi.js Sprite
    this.sprite = new Sprite(GLOBALS.Imgs.IDs['bullet.png']);
    this.sprite.anchor.y = 0.5;
  } //cBullet.constructor()

  drawSelf(xView, yView) {
    const x = this.x - xView;
    const y = this.y - yView;

    this.sprite.rotation = (this.angle * Math.PI)/180;
    this.sprite.position.set(x, y);
    /*
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((this.angle * Math.PI)/180);
    ctx.translate(0, -2);
    //ctx.drawImage(GLOBALS.Imgs.bullet, 0, 0, 10, 6);
    ctx.restore();
    */
  } //cBullet.drawSelf()
} //class cBullet
