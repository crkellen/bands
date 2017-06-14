import { GLOBALS } from './Globals';

export class cBullet {
  constructor(initPack) {
    this.ID = initPack.ID;
    this.x = initPack.x;
    this.y = initPack.y;
    this.angle = initPack.angle;
  } //cBullet.constructor()

  drawSelf(ctx, xView, yView) {
    const x = this.x - xView;
    const y = this.y - yView;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((this.angle * Math.PI)/180);
    ctx.translate(0, -2);
    ctx.drawImage(GLOBALS.Imgs.bullet, 0, 0, 17, 7);
    ctx.restore();
  } //cBullet.drawSelf()
} //class cBullet
