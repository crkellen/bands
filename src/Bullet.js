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
    this.width = 10;
    this.height = 10;

    this.updatePack.ID = this.ID;
  } //Bullet.constructor()

  update(server) {
    if( ++this.timer > 38 ) {
      this.toRemove = true;
      //If the bullet needs to be removed, return
      return;
    }

    this.checkCollisions(server);
    if( this.toRemove === true ) {
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
  } //Bullet.update()

  checkCollisions(server) {
    const newX = this.x + this.spdX;
    const newY = this.y + this.spdY;

    //COLLISION CHECK - Players
    for( let i in server.players ) {
      const p = server.players[i];

      //TODO: Fix this so it uses proper width/height variables
      //p.pos - 20 to center the collider at the top left, not the middle
      const other = {
        x: p.x - 20,
        y: p.y - 20,
        width: 40,
        height: 40
      };

      for( let u = 0.25; u < 1.1; u += 0.25 ) {
        //this.pos - 5 to center the collider at the top left, not the middle
        const point = {
          x: (this.x-5) + (u * (newX - this.x)),
          y: (this.y-5) + (u * (newY - this.y))
        };

        if( this.parent !== p.ID && p.invincible !== true && this.isCollidingPoint(other, point) ) {
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
      } //for(let u = 0.0)
    } //for(let i in Player list) --- Collision check

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

      //Sample distances on the line from currentPos to newPos and if there is a collision, return
      for( let u = 0.25; u < 1.1; u += 0.25 ) {
        //this.pos - 5 to center the collider at the top left, not the middle
        const point = {
          x: (this.x-5) + (u * (newX - this.x)),
          y: (this.y-5) + (u * (newY - this.y))
        };

        if( this.isCollidingPoint(other, point) ) {
          bl.HP -= 1;
          this.toRemove = true;
          //If the bullet needs to be removed, return
          return;
        }
      } //for(let u = 0.0)
    } //for(let j in Block list) --- Collision check
  } //Bullet.checkCollisions()

  isCollidingPoint(other, point) {
    return !( other.x + other.width < point.x
      || point.x + this.width < other.x
      || other.y + other.height < point.y
      || point.y + this.height < other.y );
  } //Bullet.isCollidingPoint()

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