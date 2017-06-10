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

    this.gunType = 0; //0, 1, 2 --- Rifle, SMG, Shotgun

    this._ammo = 6;
    this.clipSize = 6;
    this._clips = 99; //FIXME: temp for SGX
    this.maxClips = 99; //FIXME: temp for SGX
    this._heldAmmo = this._ammo * this._clips; //Total ammo in gun and clips
    this._mustReloadClip = false; //True if player has no ammo in gun
    this._mustReload = false; //True if player is attempting to manually reload
    this._isReloading = false; //True if player is currently loading a bullet
    this.activeReloadRequests = []; //A collection of identifiers to reload setTimeouts

    this._invincible = false;

    this._mode = 0; //0, 1, 2 --- Gun, Build, Shovel
    this._blocks = 20; //# of blocks held //FIXME: temp for SGX
    this.maxBlocks = 20; //FIXME: temp for SGX

    //Collision checks
    //TODO: Player is actually a 20radius circle, from top left corner he is 40 pixels wide/tall
    this.width = 15;
    this.height = 15;
    this.respawnTries = 0;
  } //Player.constructor()

  update(server) {
    if( this.mustCheckBuildSelection === true ) {
      this.validateSelection(server, this.camera);
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
          if( this.clips > 0 && this.heldAmmo >= this.clipSize ) {
            this.mustReloadClip = true;
            this.reloadClip();
          }
        }
      } //Shoot
    } else if( this.mode === 1 ) {    //If player is in Build Mode
      //Place block
      if( this.pressingAttack === true && this.blocks > 0 ) {
        this.pressingAttack = false;
        this.tryToPlaceBlock(server);
        if( this.blocks <= 0 ) {
          this.blocks = 0;
        }
      } //Place block
    } else if( this.mode === 2 ) {
      //Try to remove block with Shovel
      if( this.pressingAttack === true ) {
        this.pressingAttack = false;
        this.tryToRemoveBlock(server);
      }
    }//if( this.mode )

    //If player canceled clipReload, call it again
    if( this.mustReloadClip === true && this.isReloading === false && this.heldAmmo >= this.clipSize ) {
      this.reloadClip();
    }
    //If the player is manually reloading, call reload
    if( this.mustReload === true && this.isReloading === false && this.heldAmmo > 0 ) {
      this.reload();
    }
  } //Player.update()

  checkCollisions(server) {
    //COLLISION CHECK - Blocks
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

  reloadClip() {
    this.isReloading = true;
    this.mustReloadClip = true;
    const timeoutID = setTimeout(() => {
      this.isReloading = false;
      if( this.mustReloadClip === false ) {
        //Reloading has been cancelled, do not reload
        return;
      }
      this.mustReloadClip = false;
      this.ammo = this.clipSize;
      this.heldAmmo -= this.clipSize;
      this.updateClipCount();
    }, 3000);

    this.activeReloadRequests.push(timeoutID);
  } //Player.reloadClip()

  reload() {
    this.isReloading = true;
    const timeoutID = setTimeout(() => {
      if( this.mustReload === false ) {
        //Reloading has been cancelled, do not reload
        return;
      }
      this.isReloading = false;
      if( this._ammo < this.clipSize ) {
        this.ammo++;
        this.heldAmmo--;
        if( this.ammo === this.clipSize ) {
          this.mustReload = false;
        }
      } else {
        this.mustReload = false;
      }
      this.updateClipCount();
    }, 1000);

    this.activeReloadRequests.push(timeoutID);
  } //Player.reload()

  updateClipCount() {
    this.clips = ~~(this.heldAmmo / this.clipSize);
  } //Player.updateClipCount()

  cancelActiveReloadRequests() {
    for( let id in this.activeReloadRequests ) {
      clearTimeout(this.activeReloadRequests.pop(id));
    }
  } //Player.cancelActiveReloadRequests()

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
    this.ammo = this.clipSize;
    this.clips = this.maxClips;
    this.heldAmmo = this.ammo * this.clips;
    this.mustReloadClip = false;
    this.mustReload = false;
    this.isReloading = false;
    this.blocks = this.maxBlocks;
    this.invincible = true;
    setTimeout(() => {
      this.invincible = false;
    }, 3000);
    this.cancelActiveReloadRequests();
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

  tryToPlaceBlock(server) {
    //If the player selection is out of bounds, ignore the request
    if( this.selGridX === -1 || this.selGridY === -1 ) {
      return;
    }

    //If the location is empty space
    if( server.grid[this.selGridY][this.selGridX].occupying === 0 ) {
      server.grid[this.selGridY][this.selGridX].updateOccupying(GLOBALS.TILE_BLOCK);
      this.blocks--;
    }
  } //Player.tryToPlaceBlock

  tryToRemoveBlock(server) {
    //If the player selection is not a block, ignore the request
    if( this.selGridX === -1 || this.selGridY === -1 ) {
      return;
    }
    //If the location is a block
    if( server.grid[this.selGridY][this.selGridX].occupying === 2 ) {
      //HP setter handles isActive and updating the grid
      server.grid[this.selGridY][this.selGridX].block.HP = 0;
      if( this.blocks < this.maxBlocks ) {
        this.blocks++;
      }
    }
  } //Player.tryToRemoveBlock()

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
      gunType: this.gunType,
      ammo: this.ammo,
      clipSize: this.clipSize,
      clips: this.clips,
      maxClips: this.maxClips,
      heldAmmo: this.heldAmmo,
      mustReloadClip: this.mustReloadClip,
      mustReload: this.mustReload,
      isReloading: this.isReloading,
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

  validateSelection(server, camera) {
    if( this.mode === 1 ) {
      this.validateBuildSelection(server, camera);
    } else if( this.mode === 2 ) {
      this.validateShovelSelection(server, camera);
    }
  } //Player.validateSelection()

  validateBuildSelection(server, camera) {
    let selGridX = -1;
    let selGridY = -1;

    if( camera === null ) {
      return;
    }

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
  } //Player.validateBuildSelection()

  validateShovelSelection(server, camera) {
    let selGridX = -1;
    let selGridY = -1;

    if( camera === null ) {
      return;
    }

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
        server.grid[selGridY][selGridX].occupying === 2 ) {
      //Tell client selection is valid
      this.socket.emit('shovelSelection', {
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
        this.socket.emit('shovelSelection', {
          isValid:  false,
          selBlockID: server.grid[selGridY][selGridX].block.ID,
          selGridX: selGridX,
          selGridY: selGridY
        });
      } else {
        this.socket.emit('shovelSelection', {
          isValid:  false,
          selBlockID: -1,
          selGridX: selGridX,
          selGridY: selGridY
        });
      }
    }
    this.selGridX = selGridX;
    this.selGridY = selGridY;
  } //Player.validateShovelSelection()

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
          this.mustReload = false;
          this.isReloading = false;
          this.cancelActiveReloadRequests();
          break;
        case 'reload':
          if( this.ammo === 0 && this.mustReloadClip === false ) {
            this.mustReloadClip = true;
          } else if( this.heldAmmo > 0 && this.mustReloadClip === false ) {
            this.mustReload = true;
          }
          break;
        case 'switchMode':
          //Swap the mode, increasing by 1
          this.mode = (this.mode + 1) % 3;
          if( this._mode === 0 ) {        //Weapon
            this.mustCheckBuildSelection = false;
            this.socket.emit('buildSelection', {
              isValid:  false,
              selBlockID: -1,
              selGridX: -1,
              selGridY: -1
            });
            this.selGridX = -1;
            this.selGridY = -1;
          } else if( this._mode === 1 ) { //Build
            this.mustCheckBuildSelection = true;
            this.mustReloadClip = false;
            this.mustReload = false;
            this.isReloading = false;
            this.cancelActiveReloadRequests();
          } else {                        //Shovel

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

  get heldAmmo() {
    return this._heldAmmo;
  }

  set heldAmmo(newHeldAmmo) {
    if( this._heldAmmo !== newHeldAmmo ) {
      this._heldAmmo = newHeldAmmo;
      this.updatePack.heldAmmo = this._heldAmmo;
    }
  }

  get mustReloadClip() {
    return this._mustReloadClip;
  }

  set mustReloadClip(newMustReloadClip) {
    if( this._mustReloadClip !== newMustReloadClip ) {
      this._mustReloadClip = newMustReloadClip;
      this.updatePack.mustReloadClip = this._mustReloadClip;
    }
  }

  get mustReload() {
    return this._mustReload;
  }

  set mustReload(newMustReload) {
    if( this._mustReload !== newMustReload ) {
      this._mustReload = newMustReload;
      this.updatePack.mustReload = this._mustReload;
    }
  }

  get isReloading() {
    return this._isReloading;
  }

  set isReloading(newIsReloading) {
    if( this._isReloading !== newIsReloading ) {
      this._isReloading = newIsReloading;
      this.updatePack.isReloading = this._isReloading;
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