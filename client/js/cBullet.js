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

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
  } //cBullet.drawSelf()
} //class cBullet
