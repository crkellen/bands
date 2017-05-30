export class cBlock {
  constructor(initPack) {
    this.ID = initPack.ID;
    this.gridX = initPack.gridX;
    this.gridY = initPack.gridY;
    this.x = initPack.x;
    this.y = initPack.y;
    this.HP = initPack.HP;
    this.isActive = initPack.isActive;
  } //cBlock.constructor()

  drawSelf(ctx, xView, yView) {
    //If the block is not active, do not draw
    if( this.isActive === false ) {
      return;
    }

    const x = this.x - xView;
    const y = this.y - yView;

    //Change the appearance based on it's health, darker = less health
    switch( this.HP ) {
      case 1:
        ctx.fillStyle = 'rgba(200, 75, 75, 0.4)';
        break;
      case 2:
        ctx.fillStyle = 'rgba(200, 130, 130, 0.4)';
        break;
      case 3:
        ctx.fillStyle = 'rgba(200, 170, 170, 0.4)';
        break;
    }

    ctx.fillRect(x, y, 80, 80);
  } //cBlock.drawSelf()

  drawSelection(ctx, xView, yView, canPlace, canBuild) {
    const x = this.x - xView;
    const y = this.y - yView;

    if( canPlace === true && canBuild === true ) {
      ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
    } else if( canPlace === true && canBuild === false ) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
    } else {
      ctx.fillStyle = 'rgba(200, 0, 0, 0.8)';
    }

    ctx.fillRect(x, y, 80, 80);
  } //cBlock.drawSelection()
} //class cBlock
