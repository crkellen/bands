import { GLOBALS, LocalPlayerAnimationController } from './Globals';

//const AnimController = new AnimationController();

export class cPlayer {
  constructor(initPack) {
    this.ID = initPack.ID;
    this.name = initPack.name;
    this.gridX = initPack.gridX;
    this.gridY = initPack.gridY;
    this.x = initPack.x;
    this.y = initPack.y;
    this.HP = initPack.HP;
    this.mX = initPack.mX;
    this.mY = initPack.mY;
    this.maxHP = initPack.maxHP;
    this.score = initPack.score;
    this.ammo = initPack.ammo;
    this.clipSize = initPack.clipSize;
    this.clips = initPack.clips;
    this.maxClips = initPack.clips;
    this.heldAmmo = initPack.heldAmmo;
    this.mustReloadClip = initPack.mustReloadClip;
    this.mustReload = initPack.mustReload;
    this.isReloading = initPack.isReloading;
    this.invincible = initPack.invincible;
    this.mode = initPack.mode;
    this.blocks = initPack.blocks;
    this.maxBlocks = initPack.maxBlocks;

    this.bulletTheta = 0;
  } //cPlayer.constructor

  drawSelf(ctx, xView, yView, isLocalPlayer) {
    const x = this.x - xView;
    const y = this.y - yView;

    //Health bar
    const HPWidth = 30 * this.HP / this.maxHP;
    ctx.fillStyle = 'red';
    ctx.fillRect(x - HPWidth/1.4, y + 22, HPWidth*1.4, 4);

    //Player
    //User feedback for respawn invincibility
    if( this.invincible === true ) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    } else {
      ctx.strokeStyle = 'black'; //#TODO: This will change to team color later
      ctx.fillStyle = 'black';
    }

    /*
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    */
    ctx.drawImage(GLOBALS.Imgs.player, x-20, y-20, 40, 40);

    if( this.mode === 0 ) { //If player is in weapon mode
      //Gun
      let targetX = this.mX - ctx.canvas.width*0.5;
      let targetY = this.mY - ctx.canvas.height*0.5;

      //Check if within the deadzones
      if( isLocalPlayer === true && xView === 0 ) {     //LEFT
        //Local player is inside of left deadzone
        targetX = this.mX - this.x;
      }
      if( isLocalPlayer !== true && this.x < ctx.canvas.width*0.5 ) {
        //Other player is inside of left deadzone
        targetX = this.mX - this.x;
      }

      if( isLocalPlayer === true && xView === (GLOBALS.WORLD_WIDTH - ctx.canvas.width) ) {  //RIGHT
        //Local player is inside of right deadzone
        targetX = this.mX - x;
      }
      if( isLocalPlayer !== true && this.x > (GLOBALS.WORLD_WIDTH - ctx.canvas.width*0.5) ) {
        //Other player is inside of right deadzone
        targetX = this.mX - (this.x - (GLOBALS.WORLD_WIDTH - ctx.canvas.width));
      } 

      if( isLocalPlayer === true && yView === 0 ) {     //TOP
        //Local player is inside of top deadzone
        targetY = this.mY - this.y;
      }
      if( isLocalPlayer !== true && this.y < ctx.canvas.height*0.5 ) {
        //Other player is inside of top deadzone
        targetY = this.mY - this.y;
      }

      if( isLocalPlayer === true && yView === (GLOBALS.WORLD_HEIGHT - ctx.canvas.height) ) {  //BOTTOM
        //Local player is inside of bottom deadzone
        targetY = this.mY - y;
      }
      if( isLocalPlayer !== true && this.y > (GLOBALS.WORLD_HEIGHT - ctx.canvas.height*0.5) ) {
        //Other player is inside of bottom deadzone
        targetY = this.mY - (this.y - (GLOBALS.WORLD_HEIGHT - ctx.canvas.height));
      }

      const theta = Math.atan2(targetY, targetX);
      this.bulletTheta = theta;
      const scaleByAmmo = 20 * (6 - this.ammo);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(theta);
      ctx.translate(0, -8); //Move the gun to the outside of the player
      /*
      if( this.invincible === true ) {
        ctx.fillStyle = 'rgba(15, 135, 255, 0.5)';
      } else {
        ctx.fillStyle = `rgba(${15 + scaleByAmmo * 2}, ${135 + scaleByAmmo}, 255, 1)`;
      }
      ctx.fillRect(19/2 * -1, 8/2 * -1, 19, 8);
      */
      ctx.rotate(0);
      ctx.drawImage(GLOBALS.Imgs.gun, 0, 0, 80, 18);
      ctx.restore();

      if( isLocalPlayer === true ) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(theta);
        ctx.translate(80, -1);
        //ctx.drawImage(this.aimingImg, 0, this.aimingFrame*5, 200, 3, 0, 0, 200, 3);
        ctx.drawImage(GLOBALS.Imgs.aimingGuide, 0, LocalPlayerAnimationController.aimingGuideFrame*5, 200, 3, 0, 0, 200, 3);
        ctx.restore();
        LocalPlayerAnimationController.aimingGuideAnimationUpdate();
      }

      //PARTY HAT (A joke, but also a test for future implementations)
      /*
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(theta);
      ctx.translate(-28, 0);
      ctx.fillStyle = 'rgba(200, 200, 0, 1)';
      ctx.fillRect(4, -8, 4, 19);
      ctx.fillStyle = 'rgba(0, 200, 0, 1)';
      ctx.fillRect(0, -6, 4, 14);
      ctx.fillStyle = 'rgba(0, 0, 200, 1)';
      ctx.fillRect(-4, -4, 4, 9);
      ctx.fillStyle = 'rgba(200, 0, 0, 1)';
      ctx.fillRect(-8, -2, 4, 4);
      ctx.restore();
      */
    }
  } //cPlayer.drawSelf()

  drawName(ctx, xView, yView) {
    const x = this.x - xView;
    const y = this.y - yView;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(this.name, x - this.name.length * 2.5, y);
  } //cPlayer.drawName()

  drawAmmo(ctx, xView, yView) {
    const x = this.x - xView;
    const y = this.y - yView;

    const ammoString = `${this.ammo}/${this.clipSize}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(ammoString, x - 8, y + 16);
  } //cPlayer.drawAmmo()
} //class cPlayer
