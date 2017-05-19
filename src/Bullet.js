import { GLOBALS } from './Globals.js';
import { Entity } from './Entity.js';

export class Bullet extends Entity {
  constructor(params) {
    super(params);
    this.parent = params.parent;
    this.angle = params.angle;

    this.spdX = Math.cos(params.angle/180*Math.PI) * 40;
    this.spdY = Math.sin(params.angle/180*Math.PI) * 40;
    this.ID = Math.random(); //#TODO replace with real ID system
    this.timer = 0;
    this.toRemove = false;

    //Collision checks
    this.width = 5;
    this.height = 5;

    this.updatePack.ID = this.ID;
  } //Bullet.constructor()

  update(server) {
    if( ++this.timer > 38 ) {
      this.toRemove = true;
      //If the bullet needs to be removed, return
      return;
    }
    super.update();

    //Boundries check
    if( this.x < 5 ) {
      this.toRemove = true;
      //If the bullet needs to be removed, return
      return;
    }
    if( this.y < 5 ) {
      this.toRemove = true;
      //If the bullet needs to be removed, return
      return;
    }
    if( this.x > GLOBALS.WORLD_WIDTH - 5 ) {
      this.toRemove = true;
      //If the bullet needs to be removed, return
      return;
    }
    if( this.y > GLOBALS.WORLD_HEIGHT - 5 ) {
      this.toRemove = true;
      //If the bullet needs to be removed, return
      return;
    }

    //COLLISION CHECK - Players
    for( let i in server.players ) {
      const p = server.players[i];
      if( this.getDistance(p) < 24 && this.parent !== p.ID && p.invincible !== true ) {
        p.HP -= 5;
        if( p.HP <= 0 ) {
          const shooter = server.players[this.parent];
          if( shooter ) {
            shooter.score += 1;
          }
          //Respawn the dead player
          p.respawn(server);
        }
        this.toRemove = true;
        //If the bullet needs to be removed, return
        return;
      }
    } //for(var i in Player list) --- Collision check

    //COLLISION CHECK - Blocks
    for( let j in server.blocks ) {
      const bl = server.blocks[j];
      if( bl.isActive === false ) {
        continue;
      }
      const other = {
        x: bl.x,
        y: bl.y,
        width: bl.width,
        height: bl.height
      };
      if( this.isColliding(other) ) {
        bl.HP -= 1;
        this.toRemove = true;
        //If the bullet needs to be removed, return
        return;
      }
    } //for(var j in Block list) --- Collision check
  } //Bullet.update()

  getDistance(pt) {
    return Math.sqrt(Math.pow(this.x - pt.x, 2) + Math.pow(this.y - pt.y, 2));
  } //Bullet.getDistance()

  isColliding(other) {
    return !( other.x + other.width < this.x
      || this.x + this.width < other.x
      || other.y + other.height < this.y
      || this.y + this.height < other.y );
  } //Bullet.isColliding()

  getInitPack() {
    return {
      ID: this.ID,
      x: this.x,
      y: this.y
    };
  } //Bullet.getInitPack()

  getUpdatePack() {
    return this.updatePack;
  } //Bullet.getUpdatePack()
} //class Bullet