import { GLOBALS } from './Globals.js';
import { Entity } from './Entity.js';
import { Bullet } from './Bullet.js';

export class Player extends Entity {
  constructor(params) {
    super(params);
    this.socket = params.socket;
    this.name = params.name;

    //Grid variables
    this._gridX = -1;
    this._gridY = -1;
    this.isOverlapping = {
      left: false,
      right: false,
      top: false,
      bottom: false,
      topLeft: false,
      topRight: false,
      bottomLeft: false,
      bottomRight: false,
      center: false
    };

    //The build selection variables
    this.selGridX = -1;
    this.selGridY = -1;
    this.mustCheckBuildSelection = false;
    this.camera = null;

    //Input checks
    this.pressingLeft = false;
    this.pressingRight = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.pressingAttack = false;
    this.mouseAngle = 0;
    this._mX = 0;
    this._mY = 0;

    //Player variables
    this.maxSpd = 5;
    this._HP = 10;
    this.maxHP = 10;
    this._score = 0;
    this._ammo = 6;
    this.maxAmmo = 6;
    this._clips = 99; //FIXME: temp for SGX
    this.maxClips = 99; //FIXME: temp for SGX
    this.reloading = false;
    this._invincible = false;
    this._mode = 0; //0 for weapon, 1 for block
    this._blocks = 20; //# of blocks held //FIXME: temp for SGX
    this.maxBlocks = 20; //FIXME: temp for SGX

    //Collision checks
    this.width = 15;
    this.height = 15;
    this.respawnTries = 0;
  } //Player.constructor()

  update(server) {
    if( this.mustCheckBuildSelection === true ) {
      //this.mustCheckBuildSelection = false;
      this.checkBuildSelection(server, this.camera);
    }

    this.updateSpd();
    this.checkCollisions(server);
    super.update();

    //Boundries check
    if( this.x < 20 ) {
      this.x = 20;
    }
    if( this.y < 20 ) {
      this.y = 20;
    }
    if( this.x > (GLOBALS.WORLD_WIDTH - 20) ) {
      this.x = GLOBALS.WORLD_WIDTH - 20;
    }
    if( this.y > (GLOBALS.WORLD_HEIGHT - 60) ) {
      this.y = GLOBALS.WORLD_HEIGHT - 60;
    }

    if( this.mode === 0 ) {           //If player is in Weapon Mode
      //Shoot
      if( this.pressingAttack === true && this.ammo > 0 ) {
        this.pressingAttack = false;
        this.shoot(server);
        this.ammo--;
        if( this.ammo <= 0 ) {
          this.ammo = 0;
          if( this.clips > 0 ) {
            this.reload();
          }
        }
      } //Shoot
    } else if( this.mode === 1 ) {    //If player is in Build Mode
      //Place block
      if( this.pressingAttack === true && this.blocks > 0 ) {
        this.pressingAttack = false;
        this.placeBlock(server);
        if( this.blocks <= 0 ) {
          this.blocks = 0;
        }
      } //Place block
    } //if( this.mode )
  } //Player.update()

  checkCollisions(server) {
    //COLLISION CHECK - Blocks
    //#TODO: Optimize this because if there is a player, there can't be a block
    if( this.gridX === -1 ) {
      //Player is not initialized, return
      return;
    }
    //The 9 blocks surrounding the player
    const surrBlocks = {};
    //surrBlocks[5] = server.grid[this.gridY][this.gridX].block;     //CENTER
    if( this.gridX !== 0 ) {
      surrBlocks[4] = server.grid[this.gridY][this.gridX-1].block;   //LEFT
    }
    if( this.gridX !== server.mapWidth-1 ) {
      surrBlocks[6] = server.grid[this.gridY][this.gridX+1].block;   //RIGHT
    }
    if( this.gridY !== 0 ) {
      surrBlocks[8] = server.grid[this.gridY-1][this.gridX].block;   //TOP
    }
    if( this.gridY !== server.mapHeight-1 ) {
      surrBlocks[2] = server.grid[this.gridY+1][this.gridX].block;   //BOTTOM
    }
    if( this.gridX !== 0 && this.gridY !== 0 ) {
      surrBlocks[7] = server.grid[this.gridY-1][this.gridX-1].block; //TOPLEFT
    }
    if( this.gridX !== server.mapWidth-1 && this.gridY !== 0 ) {
      surrBlocks[9] = server.grid[this.gridY-1][this.gridX+1].block; //TOPRIGHT
    }
    if( this.gridX !== 0 && this.gridY !== server.mapHeight-1 ) {
      surrBlocks[1] = server.grid[this.gridY+1][this.gridX-1].block; //BOTTOMLEFT
    }
    if( this.gridX !== server.mapWidth-1 && this.gridY !== server.mapHeight-1 ) {
      surrBlocks[3] = server.grid[this.gridY+1][this.gridX+1].block; //BOTTOMRIGHT
    }

    for( let i in surrBlocks ) {
      const bl = surrBlocks[i];

      //If the block is turned off, skip collision detection
      if( bl.isActive === false ) {
        continue;
      }

      const other = {
        x: bl.x,
        y: bl.y,
        width: 95,
        height: 95
      };

      //Offset for the direction prevents 'sticky walls'
      if( this.pressingLeft && this.isColliding(other, -this.spdX, 0) ) {
        this.spdX = 0;
      }
      if( this.pressingRight && this.isColliding(other, -this.spdX, 0) ) {
        this.spdX = 0;
      }
      if( this.pressingUp && this.isColliding(other, 0, -this.spdY) ) {
        this.spdY = 0;
      }
      if( this.pressingDown && this.isColliding(other, 0, -this.spdY) ) {
        this.spdY = 0;
      }
    } //for( let i in surrBlocks ) --- Block Collision Check
  } //Player.checkCollisions()

  updateSpd() {
    if( this.pressingLeft === true ) {
      this.spdX = -this.maxSpd;
    } else if( this.pressingRight === true ) {
      this.spdX = this.maxSpd;
    } else {
      this.spdX = 0;
    }

    if( this.pressingUp === true ) {
      this.spdY = -this.maxSpd;
    } else if( this.pressingDown === true ) {
      this.spdY = this.maxSpd;
    } else {
      this.spdY = 0;
    }
  } //Player.updateSpd()

  isColliding(other, dirOffsetX, dirOffsetY) {
    return !( other.x + dirOffsetX + other.width < this.x
      || this.x + this.width < other.x + dirOffsetX
      || other.y + dirOffsetY + other.height < this.y
      || this.y + this.height < other.y + dirOffsetY );
  } //Player.isColliding()

  shoot(server) {
    const b = new Bullet({
      parent: this.ID,
      angle: this.mouseAngle,
      x: this.x,
      y: this.y
    });
    const bulletID = Math.random(); //#TODO replace with a real ID system
    server.bullets[bulletID] = b;
    server.initPack.bullet.push(server.bullets[bulletID].getInitPack());
  } //Player.shoot()

  reload() {
    setTimeout(() => {
      this.ammo = this.maxAmmo;
      this.clips--;
      this.reloading = false;
    }, 3000);
  } //Player.reload()

  respawn(server) {
    //#TODO: Make it so they respawn after a short time, and at their team base
    this.x = (getRandomInt(1, 39) * 40);
    this.y = (getRandomInt(1, 20) * 40);
    if( this.x % 80 === 0 ) {
      this.x += 40;
    }
    if( this.y % 80 === 0 ) {
      this.y += 40;
    }
    if( this.respawnTries >= 10 ) {
      this.respawnTries = 0;
      console.error('WARNING: All available player respawn positions are blocks.');
    } else {
      if( this.respawnPositionOccupied(server) === true ) {
        //The function call in the if statement will call respawn() again if true
        //Return to pop this function call off the stack
        return;
      }
    }

    this.HP = this.maxHP;
    this.ammo = this.maxAmmo;
    this.clips = this.maxClips;
    this.blocks = this.maxBlocks;
    this.invincible = true;
    setTimeout(() => {
      this.invincible = false;
    }, 3000);
  } //Player.respawn()

  respawnPositionOccupied(server) {
    const newGridX = ~~(this.x / GLOBALS.TILE_WIDTH);
    const newGridY = ~~(this.y / GLOBALS.TILE_HEIGHT);
    if( server.grid[newGridY][newGridX].occupying === 2 ) {
      this.respawnTries++;
      this.respawn(server);
      return true;
    } else {
      //No collision, player can spawn here
      return false;
    }
  } //Player.respawnPositionOccupied()

  placeBlock(server) {
    //If the player selection is out of bounds, ignore the request
    if( this.selGridX === -1 || this.selGridY === -1 ) {
      return;
    }

    //If the location is empty space
    if( server.grid[this.selGridY][this.selGridX].occupying === 0 ) {
      server.grid[this.selGridY][this.selGridX].updateOccupying(GLOBALS.TILE_BLOCK);
      this.blocks--;
    }
  } //Player.placeBlock

  getInitPack() {
    return {
      ID: this.ID,
      name: this.name,
      gridX: this.gridX,
      gridY: this.gridY,
      x: this.x,
      y: this.y,
      HP: this.HP,
      mX: this.mouseX,
      mY: this.mouseY,
      maxHP: this.maxHP,
      score: this.score,
      ammo: this.ammo,
      maxAmmo: this.maxAmmo,
      clips: this.clips,
      maxClips: this.maxClips,
      invincible: this.invincible,
      mode: this.mode,
      blocks: this.blocks,
      maxBlocks: this.maxBlocks
    };
  } //Player.getInitPack()

  getUpdatePack() {
    return this.updatePack;
    // return {
    //   ID: this.ID,
    //   gridX: this.gridX,
    //   gridY: this.gridY,
    //   x: this.x,
    //   y: this.y,
    //   HP: this.HP,
    //   mX: this.mouseX,
    //   mY: this.mouseY,
    //   score: this.score,
    //   ammo: this.ammo,
    //   clips: this.clips,
    //   invincible: this.invincible,
    //   mode: this.mode,
    //   blocks: this.blocks
    // };
  } //Player.getUpdatePack()

  checkBuildSelection(server, camera) {
    let selGridX = -1;
    let selGridY = -1;

    //If we are outside of left deadzone, need to offset the tile calculation
    if( camera.xView > 0 ) {
      const xOffset = camera.xView;
      selGridX = ~~((this._mX + xOffset) / 80);
    } else {
      selGridX = ~~(this._mX / 80);
    }
    //If we are outside of top deadzone, need to offset the tile calculation
    if( camera.yView > 0 ) {
      const yOffset = camera.yView;
      selGridY = ~~((this._mY + yOffset) / 80);
    } else {
      selGridY = ~~(this._mY / 80);
    }

    //Check to see if selection is on top of player
    if( selGridX === this._gridX && selGridY === this._gridY ) {
      //selGridX = -1;
      //selGridY = -1;
    }

    //Check to see if selection is out of range (grid pos + 1)
    if( selGridX > this._gridX + 1  ) { //Out of range on LEFT
      selGridX = -1;
    }
    if( selGridX < this._gridX - 1  ) { //Out of range on RIGHT
      selGridX = -1;
    }
    if( selGridY < this._gridY - 1  ) { //Out of range on TOP
      selGridY = -1;
    }
    if( selGridY > this._gridY + 1  ) { //Out of range on BOTTOM
      selGridY = -1;
    }
    //Corners don't need to be checked, are handled already by the above checks
    //Bottom and Right deadzones don't need to be check, they are handled with > 0 check
    if( (selGridX !== -1 && selGridY !== -1) &&
        server.grid[selGridY][selGridX].occupying === 0 ) {
      //Tell client selection is valid
      this.socket.emit('buildSelection', {
        isValid:  true,
        selBlockID: server.grid[selGridY][selGridX].block.ID,
        selGridX: selGridX,
        selGridY: selGridY
      });
      this.selGridX = selGridX;
      this.selGridY = selGridY;
    } else {
      //Tell client selection is invalid
      if( selGridX !== -1 && selGridY !== -1 ) {
        this.socket.emit('buildSelection', {
          isValid:  false,
          selBlockID: server.grid[selGridY][selGridX].block.ID,
          selGridX: selGridX,
          selGridY: selGridY
        });
      } else {
        this.socket.emit('buildSelection', {
          isValid:  false,
          selBlockID: -1,
          selGridX: selGridX,
          selGridY: selGridY
        });
      }
      this.selGridX = selGridX;
      this.selGridY = selGridY;
    }
  } //Player.checkBuildSelection()

  onConnect(socket) {
    socket.on('keyPress', (data) => {
      switch( data.inputID ) {
        case 'left':
          this.pressingLeft = data.state;
          break;
        case 'right':
          this.pressingRight = data.state;
          break;
        case 'up':
          this.pressingUp = data.state;
          break;
        case 'down':
          this.pressingDown = data.state;
          break;
        case 'attack':
          this.pressingAttack = data.state;
          break;
        case 'switchMode':
          //Swap mode from 0 to 1 or 1 to 0 (this.mode ^= 1;)
          this.mode = 1 - this._mode;
          if( this._mode === 0 ) {
            this.mustCheckBuildSelection = false;
            this.socket.emit('buildSelection', {
              isValid:  false,
              selBlockID: -1,
              selGridX: -1,
              selGridY: -1
            });
            this.selGridX = -1;
            this.selGridY = -1;
          } else {
            this.mustCheckBuildSelection = true;
          }
          break;
        case 'mouseAngle':
          this.mouseAngle = data.state;
          break;
        case 'mousePos':
          this.mX = data.mousePos.x;
          this.mY = data.mousePos.y;
          if( this._mode === 1 ) {
            this.camera = data.camera;
            this.mustCheckBuildSelection = true;
          }
          break;
        case 'focusLost':
          this.pressingLeft = false;
          this.pressingRight = false;
          this.pressingUp = false;
          this.pressingDown = false;
          this.pressingAttack = false;
          break;
        default: break;
      }
    }); //'keyPress'
  } //Player.onConnect()

//PLAYER GETTERS AND SETTERS
  get gridX() {
    return this._gridX;
  }

  set gridX(newGridX) {
    if( this._gridX !== newGridX ) {
      this._gridX = newGridX;
      this.updatePack.gridX = this._gridX;
    }
  }

  get gridY() {
    return this._gridY;
  }

  set gridY(newGridY) {
    if( this._gridY !== newGridY ) {
      this._gridY = newGridY;
      this.updatePack.gridY = this._gridY;
    }
  }

  get HP() {
    return this._HP;
  }

  set HP(newHP) {
    if( this._HP !== newHP ) {
      this._HP = newHP;
      this.updatePack.HP = this._HP;
    }
  }

  get mX() {
    return this._mX;
  }

  set mX(newMX) {
    if( this._mX !== newMX ) {
      this._mX = newMX;
      this.updatePack.mX = this._mX;
    }
  }

  get mY() {
    return this._mY;
  }

  set mY(newMY) {
    if( this._mY !== newMY ) {
      this._mY = newMY;
      this.updatePack.mY = this._mY;
    }
  }

  get score() {
    return this._score;
  }

  set score(newScore) {
    if( this._score !== newScore ) {
      this._score = newScore;
      this.updatePack.score = this._score;
    }
  }

  get ammo() {
    return this._ammo;
  }

  set ammo(newAmmo) {
    if( this._ammo !== newAmmo ) {
      this._ammo = newAmmo;
      this.updatePack.ammo = this._ammo;
    }
  }

  get clips() {
    return this._clips;
  }

  set clips(newClips) {
    if( this._clips !== newClips ) {
      this._clips = newClips;
      this.updatePack.clips = this._clips;
    }
  }

  get invincible() {
    return this._invincible;
  }

  set invincible(newInvincible) {
    if( this._invincible !== newInvincible ) {
      this._invincible = newInvincible;
      this.updatePack.invincible = this._invincible;
    }
  }

  get mode() {
    return this._mode;
  }

  set mode(newMode) {
    if( this._mode !== newMode ) {
      this._mode = newMode;
      this.updatePack.mode = this._mode;
    }
  }

  get blocks() {
    return this._blocks;
  }

  set blocks(newBlocks) {
    if( this._blocks !== newBlocks ) {
      this._blocks = newBlocks;
      this.updatePack.blocks = this._blocks;
    }
  }
//END PLAYER GETTERS AND SETTERS
} //class Player

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}