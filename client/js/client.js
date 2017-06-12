import { GLOBALS } from './Globals';
import { Game } from './Game';
import { cPlayer } from './cPlayer.js';
import { cBullet } from './cBullet.js';
import { cBlock } from './cBlock.js';
import { Camera } from './Camera.js';
import { Map } from './Map.js';

const io = require('socket.io-client');
const socket = io();

const cGame = new Game(GLOBALS.CTX, GLOBALS.CTX_UI);
let playerName = '';
let playerTeam = 0; //0, 1 - Green, Blue

const GameMap = new Map(GLOBALS.WORLD_WIDTH, GLOBALS.WORLD_HEIGHT);
GameMap.generate(cGame.ctx);

const cam = {
  xView: 0,
  yView: 0,
  canvasWidth: cGame.ctx.canvas.width,
  canvasHeight: cGame.ctx.canvas.height,
  worldWidth: GLOBALS.WORLD_WIDTH,
  worldHeight: GLOBALS.WORLD_HEIGHT
};
const GameCamera = new Camera(cam);

$(document).ready( () => {
//PRE-GAME LISTENERS
  $('#play').click( () => {
    playerName = $('#player-name').val();
    joinGame(playerName, socket);
  }); //#play.click()

  $('#player-name').keyup( (e) => {
    playerName = $('#player-name').val();
    const k = e.keyCode || e.which;
    if( k == 13 ) {
      joinGame(playerName, socket);
    }
  }); //#player-name.keyup()

  $('#greenTeam').click( () => {
    playerTeam = 0;
    document.getElementById('greenTeam').className = 'btn btn-primary';
    document.getElementById('blueTeam').className = 'btn btn-secondary';
  }); //#greenTeam.click()

  $('#blueTeam').click( () => {
    playerTeam = 1;
    document.getElementById('greenTeam').className = 'btn btn-secondary';
    document.getElementById('blueTeam').className = 'btn btn-primary';
  }); //#blueTeam.click()
//END PRE-GAME LISTENERS
  //canvas-ui is above canvas-game so check that for movement
  $('#canvas-ui').mousemove( (e) => {
    //If there is a significant lag, localPlayer will be null
    if( cGame.gameStarted !== true || cGame.localPlayer === null || cGame.localPlayer.HP <= 0 ) {
      return;
    }

    //Update mouse position
    const mousePos = getMousePos(cGame.ctx, e);
    const camera = { xView: GameCamera.xView, yView: GameCamera.yView };
    socket.emit('keyPress', {inputID: 'mousePos', mousePos: mousePos, camera: camera});
  });

  $(document).contextmenu( (e) => {
    e.preventDefault();
  }); //$(document).contextmenu()

  $(document).keydown( (e) => {
    if( cGame.gameStarted !== true || cGame.localPlayer.HP <= 0 ) {
      return;
    }
    const k = e.keyCode || e.which;
    switch(k) {
      case 87: //W
        socket.emit('keyPress', {inputID: 'up', state: true});
        break;
      case 65: //A
        socket.emit('keyPress', {inputID: 'left', state: true});
        break;
      case 83: //S
        socket.emit('keyPress', {inputID: 'down', state: true});
        break;
      case 68: //D
        socket.emit('keyPress', {inputID: 'right', state: true});
        break;
      default: break;
    }
  }).keyup( (e) => {
    if( cGame.gameStarted !== true || cGame.localPlayer.HP <= 0 ) {
      return;
    }
    const k = e.keyCode || e.which;
    switch(k) {
      case 87: //W
        socket.emit('keyPress', {inputID: 'up', state: false});
        break;
      case 65: //A
        socket.emit('keyPress', {inputID: 'left', state: false});
        break;
      case 83: //S
        socket.emit('keyPress', {inputID: 'down', state: false});
        break;
      case 68: //D
        socket.emit('keyPress', {inputID: 'right', state: false});
        break;
      case 82: //R
        if( cGame.localPlayer.ammo < 6 && cGame.localPlayer.heldAmmo > 0 && cGame.localPlayer.mode === 0) {
          socket.emit('keyPress', {inputID: 'reload'});
        }
        break;
      default: break;
    }
  }).click( (e) => {
    if( cGame.gameStarted !== true || cGame.localPlayer === null || cGame.localPlayer.HP <= 0  ) {
      return;
    }

    //Check for left or right mouse button
    switch( e.which ) {
      case 1: //Left mouse button
        if( cGame.localPlayer.mode === 0 ) {         //Weapon mode
          //Calculate the angle from player to mouse
          const mouse = getMousePos(cGame.ctx, e);
          let x = -cGame.ctx.canvas.clientWidth/2 + e.clientX;
          let y = -cGame.ctx.canvas.clientHeight/2 + e.clientY;

          //Check if within the deadzones
          if( cGame.selfID !== null ) {
            //Offset the calculation if in a deadzone
            const xOffset = cGame.localPlayer.x;
            const yOffset = cGame.localPlayer.y;

            if( GameCamera.xView === 0 ) {      //LEFT
              x = mouse.x - xOffset;
            }
            if( GameCamera.xView === (GLOBALS.WORLD_WIDTH - cGame.ctx.canvas.width) ) {   //RIGHT
              x = mouse.x - xOffset + GameCamera.xView;
            }
            if( GameCamera.yView === 0 ) {      //TOP
              y = mouse.y - yOffset;
            }
            if( GameCamera.yView === (GLOBALS.WORLD_HEIGHT - cGame.ctx.canvas.height) ) {   //BOTTOM
              y = mouse.y - yOffset + GameCamera.yView;
            }
          }
          //Update mouse angle
          const angle = Math.atan2(y, x) / Math.PI * 180;
          socket.emit('keyPress', {inputID: 'mouseAngle', state: angle});

          //Shoot
          if( cGame.canShoot === true && cGame.localPlayer.ammo > 0 ) {
            cGame.canShoot = false;
            socket.emit('keyPress', {inputID: 'attack', state: true});
            setTimeout( () => {
              cGame.canShoot = true;
            }, 500);
          }

        } else if( cGame.localPlayer.mode === 1 ) {  //Building mode
          //Place block
          if(cGame.canBuild === true && cGame.localPlayer.blocks > 0 && cGame.isValidSelection === true ) {
            cGame.canBuild = false;
            //cGame.isValidSelection = false; //This will be set to false by the server, but locally we can assume false
            socket.emit('keyPress', {inputID: 'attack', state: true});
            setTimeout( () => {
              cGame.canBuild = true;
            }, 1000);
          }
        } else if( cGame.localPlayer.mode === 2 ) {  //Shovel mode
          //Remove block
          if(cGame.canShovel === true && cGame.isValidSelection === true ) {
            cGame.canShovel = false;
            //cGame.isValidSelection = false; //This will be set to false by the server, but locally we can assume false
            socket.emit('keyPress', {inputID: 'attack', state: true});
            setTimeout( () => {
              cGame.canShovel = true;
            }, 1000);
          }
        }
        break;
    } //switch( e.which )
  }).mousedown( (e) => {
    //This exists to fix issue #42 (RMB does not work outside of firefox)
    if( cGame.gameStarted !== true ) {
      return;
    }

    switch( e.which ) {
      case 3: { //Right mouse button
        //Mode will switch, so update the camera/mousePos for validateSelection
        const mousePos = getMousePos(cGame.ctx, e);
        const camera = { xView: GameCamera.xView, yView: GameCamera.yView };
        socket.emit('keyPress', {inputID: 'mousePos', mousePos: mousePos, camera: camera});
        socket.emit('keyPress', {inputID: 'switchMode'});
        if( cGame.localPlayer.mode === 0 ) {        //Gun to Build
          cGame.canBuild = false;
          setTimeout( () => {
            cGame.canBuild = true;
          }, 1000);
        } else if( cGame.localPlayer.mode === 1 ) { //Build to Shovel
          cGame.canShovel = false;
          setTimeout( () => {
            cGame.canShovel = true;
          }, 1000);
        }
        break;
      }
    } //switch( e.which )
  }); //$(document).keydown().keyup().mousemove().click().onmousedown()

  //Draw the map once before the game starts
  GameMap.draw(cGame.ctx, GameCamera.xView, GameCamera.yView);
  //Start the renderLoop
  requestAnimationFrame(renderLoop);
}); //$(document).ready()

$(window).on('beforeunload', () => {
  socket.emit('disconnect');
}); //$(window).on('beforeunload')

$(window).blur( () => {
  //When the player has lost focus of the window, reset all inputs
  socket.emit('keyPress', {inputID: 'focusLost'});
});

//SOCKET FUNCTIONS ##############################################################

socket.on('init', (data) => {
  let makeCamera = false;
  if( cGame.selfID === null && data.selfID !== undefined ) {
    cGame.selfID = data.selfID;
    makeCamera = true;
  }

  //Players
  for( let i = 0; i < data.player.length; i++ ) {
    cGame.cPlayers[data.player[i].ID] = new cPlayer(data.player[i]);
  }
  if( makeCamera ) {
    cGame.localPlayer = cGame.cPlayers[cGame.selfID];
    GameCamera.follow(cGame.localPlayer, cGame.ctx.canvas.width/2, cGame.ctx.canvas.height/2);
  }

  //Bullets
  for( let j = 0; j < data.bullet.length; j++ ) {
    cGame.cBullets[data.bullet[j].ID] = new cBullet(data.bullet[j]);
  }

  //Blocks
  for( let k = 0; k < data.block.length; k++ ) {
    cGame.cBlocks[data.block[k].ID] = new cBlock(data.block[k]);
  }
}); //'init'

socket.on('update', (data) => {
  //For all players, if there is data, update it
  for( let i = 0; i < data.player.length; i++ ) {
    const pack = data.player[i];
    //If there is no data to update, don't update at all
    if( Object.keys(pack).length === 1 ) {
      continue;
    }
    const p = cGame.cPlayers[pack.ID];

    if( p !== undefined ) {
      if( pack.gridX !== undefined ) {
        p.gridX = pack.gridX;
      }
      if( pack.gridY !== undefined ) {
        p.gridY = pack.gridY;
      }
      if( pack.x !== undefined ) {
        p.x = pack.x;
        if( p.ID === cGame.selfID ) {
          GameCamera.followed.x = pack.x;
        }
      }
      if( pack.y !== undefined ) {
        p.y = pack.y;
        if( p.ID === cGame.selfID ) {
          GameCamera.followed.y = pack.y;
        }
      }
      if( pack.HP !== undefined ) {
        p.HP = pack.HP;
      }
      if( pack.mX !== undefined ) {
        p.mX = pack.mX;
      }
      if( pack.mY !== undefined ) {
        p.mY = pack.mY;
      }
      if( pack.score !== undefined ) {
        p.score = pack.score;
      }
      if( pack.ammo !== undefined ) {
        p.ammo = pack.ammo;
      }
      if( pack.clips !== undefined ) {
        p.clips = pack.clips;
      }
      if( pack.heldAmmo !== undefined ) {
        p.heldAmmo = pack.heldAmmo;
        if( cGame.localPlayer.ID === p.ID ) {
          if( cGame.localPlayer.isReloading === true ) {
            cGame.reloadTimeLeft = GLOBALS.RIFLE_RELOAD_TIME;
          }
        }
      }
      //TODO: mustReloadClip/mustReload/isReloading only needed for localplayer
      if( pack.mustReloadClip !== undefined ) {
        if( cGame.localPlayer.ID === p.ID ) {
          if( pack.mustReloadClip === true) {
            //Local player is now reloading
            cGame.ctxUI.canvas.style.cursor = 'none';
            cGame.reloadTimeLeft = GLOBALS.RIFLE_CLIP_RELOAD_TIME;
          } else {
            cGame.ctxUI.canvas.style.cursor = 'crosshair';
            cGame.UIUpdate = true;
          }
        }
        p.mustReloadClip = pack.mustReloadClip;
      }
      if( pack.mustReload !== undefined ) {
        if( cGame.localPlayer.ID === p.ID ) {
          if( pack.mustReload === true) {
            //Local player is now reloading
            cGame.ctxUI.canvas.style.cursor = 'none';
            cGame.reloadTimeLeft = GLOBALS.RIFLE_RELOAD_TIME;
          } else {
            cGame.ctxUI.canvas.style.cursor = 'crosshair';
            cGame.UIUpdate = true;
          }
        }
        p.mustReload = pack.mustReload;
      }
      if( pack.isReloading !== undefined ) {
        p.isReloading = pack.isReloading;
      }
      if( pack.invincible !== undefined ) {
        p.invincible = pack.invincible;
      }
      if( pack.mode !== undefined ) {
        p.mode = pack.mode;
      }
      if( pack.blocks !== undefined ) {
        p.blocks = pack.blocks;
      }
    }
  } //for( i in data.player.length)

  //For all bullets, if there is data, update it
  for( let j = 0; j < data.bullet.length; j++ ) {
    const pack = data.bullet[j];
    //If there is no data to update, don't update at all
    if( Object.keys(pack).length === 1 ) {
      continue;
    }
    const b = cGame.cBullets[data.bullet[j].ID];
    
    if( b !== undefined ) {
      if( pack.x !== undefined ) {
        b.x = pack.x;
      }
      if( pack.y !== undefined ) {
        b.y = pack.y;
      }
    }
  } //for( j in data.bullet.length)

  //For all blocks, if there is data, update it
  for( let k = 0; k < data.block.length; k++ ) {
    const pack = data.block[k];
    //If there is no data to update, don't update at all
    if( Object.keys(pack).length === 1 ) {
      continue;
    }
    const bl = cGame.cBlocks[data.block[k].ID];

    if( bl !== undefined ) {
      if( pack.HP !== undefined ) {
        bl.HP = pack.HP;
      }
      if( pack.isActive !== undefined ) {
        bl.isActive = pack.isActive;
      }
    }
  } //for( k in data.block.length)
}); //'update'

socket.on('remove', (data) => {
  //Players
  for( let i = 0; i < data.player.length; i++ ) {
    delete cGame.cPlayers[data.player[i]];
  }
  //Bullets
  for( let j = 0; j < data.bullet.length; j++ ) {
    delete cGame.cBullets[data.bullet[j]];
  }
}); //'remove'

socket.on('buildSelection', (data) => {
  cGame.isValidSelection = data.isValid;
  cGame.selBlockID = data.selBlockID;
  cGame.selGridX = data.selGridX;
  cGame.selGridY = data.selGridY;
});

socket.on('shovelSelection', (data) => {
  cGame.isValidSelection = data.isValid;
  cGame.selBlockID = data.selBlockID;
  cGame.selGridX = data.selGridX;
  cGame.selGridY = data.selGridY;
});

//END SOCKET FUNCTIONS ##########################################################

//GAME LOGIC FUNCTIONS ##########################################################

const joinGame = (playerName, socket) => {
  if( playerName !== '' && playerName.length < 10 ) {
    $('#prompt').hide();
    $('#errorMessage').hide();
    socket.emit('joinGame', {name: playerName, team: playerTeam});
    cGame.gameStarted = true;
  } else {
    $('#errorMessage').show();
  }
}; //joingame()

const getMousePos = (ctx, e) => {
  const rect = ctx.canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  return {
    x: mouseX,
    y: mouseY
  };
}; //getMousePos()

//END GAME LOGIC FUNCTIONS ######################################################

//RENDER FUNCTIONS ##############################################################

const renderLoop = () => {
  if( cGame.selfID === null ) {
    requestAnimationFrame(renderLoop);
    return;
  }

  //Clear the main game canvas
  cGame.ctx.clearRect(0, 0, cGame.ctx.canvas.width, cGame.ctx.canvas.height);
  GameCamera.update();
  GameMap.draw(cGame.ctx, GameCamera.xView, GameCamera.yView);
  drawEntities(); //Draws only the Entities
  drawUI();       //Draws only the UI when it updates
  cGame.localPlayer = cGame.cPlayers[cGame.selfID];
  requestAnimationFrame(renderLoop);
}; //renderLoop()

const drawEntities = () => {
  //Each player object draws itself
  for( let p in cGame.cPlayers ) {
    if( cGame.cPlayers[p].HP <= 0 ) {
      continue;
    }
    let isLocalPlayer = false;
    if( cGame.localPlayer.ID === cGame.cPlayers[p].ID ) {
      isLocalPlayer = true;
    }
    cGame.cPlayers[p].drawSelf(cGame.ctx, GameCamera.xView, GameCamera.yView, isLocalPlayer);
  }

  cGame.ctx.fillStyle = 'black';
  //Each bullet object draws itself
  for( let b in cGame.cBullets ) {
    cGame.cBullets[b].drawSelf(cGame.ctx, GameCamera.xView, GameCamera.yView);
  }
  //Each block object draws itself
  for( let bl in cGame.cBlocks ) {
    cGame.cBlocks[bl].drawSelf(cGame.ctx, GameCamera.xView, GameCamera.yView);
  }
}; //drawEntities()

const drawUI = () => {
  //All players names and ammo
  //Note: To prevent excessive drawing for unchanged values, name and ammo
  //are drawn on the main canvas, and the UI canvas only updates when needed
  for( let p in cGame.cPlayers ) {
    if( cGame.cPlayers[p].HP <= 0 ) {
      continue;
    }
    cGame.cPlayers[p].drawName(cGame.ctx, GameCamera.xView, GameCamera.yView);
    cGame.cPlayers[p].drawAmmo(cGame.ctx, GameCamera.xView, GameCamera.yView);
  }

  if( cGame.localPlayer.isReloading === true ) {
    cGame.reloadTimeLeft -= 17;
    cGame.UIUpdate = true;
  }

  //Low-changing Values
  //Player Score
  if( cGame.prevScore !== cGame.localPlayer.score ) {
    cGame.UIUpdate = true;
  }

  //Player HeldAmmoaa
  if( cGame.prevHeldAmmo !== cGame.localPlayer.heldAmmo ) {
    cGame.UIUpdate = true;
  }

  //Player Clips
  if( cGame.prevClipCount !== cGame.localPlayer.clips ) {
    cGame.UIUpdate = true;
  }

  //Player BlockCount
  if( cGame.prevBlockCount !== cGame.localPlayer.blocks ) {
    cGame.UIUpdate = true;
  }

  //Show where the block would be placed on the selected grid
  if( cGame.selGridX !== -1 && cGame.selGridY !== -1 ) {
    if( cGame.localPlayer.mode === 1 ) {
      if( cGame.isValidSelection === true ) {
        //Can place the block
        cGame.cBlocks[cGame.selBlockID].drawSelection(cGame.ctx, GameCamera.xView, GameCamera.yView, true, cGame.canBuild, 1);
      } else {
        //Cannot place the block
        cGame.cBlocks[cGame.selBlockID].drawSelection(cGame.ctx, GameCamera.xView, GameCamera.yView, false, cGame.canBuild, 1);
      }
    } else if( cGame.localPlayer.mode === 2 ) {
      if( cGame.isValidSelection === true ) {
        //Can remove the block
        cGame.cBlocks[cGame.selBlockID].drawSelection(cGame.ctx, GameCamera.xView, GameCamera.yView, true, cGame.canShovel, 2);
      } else {
        //Cannot remove the block
        cGame.cBlocks[cGame.selBlockID].drawSelection(cGame.ctx, GameCamera.xView, GameCamera.yView, false, cGame.canShovel, 2);
      }
    }
  }

  if( cGame.UIUpdate === true ) {
    cGame.UIUpdate = false;

    //Clear the screen
    cGame.ctxUI.clearRect(0, 0, cGame.ctxUI.canvas.width, cGame.ctxUI.canvas.height);

    //Background
    cGame.ctxUI.fillStyle = 'rgba(200, 200, 200, 0.3)';
    cGame.ctxUI.fillRect(0, 0, 500, 40);

    cGame.ctxUI.fillStyle = 'rgba(255, 255, 255, 0.5)';

    //Player Score
    cGame.prevScore = cGame.localPlayer.score;
    const scoreString = `Score: ${cGame.prevScore}`;
    cGame.ctxUI.fillText(scoreString, 15, 30);

    //Player HeldAmmo
    cGame.prevHeldAmmo = cGame.localPlayer.heldAmmo;
    const heldAmmoString = `Ammo: ${cGame.prevHeldAmmo}`;
    cGame.ctxUI.fillText(heldAmmoString, 120, 30);

    //Player Clips
    cGame.prevClipCount = cGame.localPlayer.clips;
    const clipString = `Clips: ${cGame.prevClipCount}/${cGame.localPlayer.maxClips}`;
    cGame.ctxUI.fillText(clipString, 240, 30);

    //Player Blocks
    cGame.prevBlockCount = cGame.localPlayer.blocks;
    const blockString = `Blocks: ${cGame.prevBlockCount}/${cGame.localPlayer.maxBlocks}`;
    cGame.ctxUI.fillText(blockString, 360, 30);

    if( cGame.localPlayer.isReloading === true ) {
      let reloadBar = 0;
      if( cGame.localPlayer.mustReloadClip === true ) {
        reloadBar = 30 * cGame.reloadTimeLeft / GLOBALS.RIFLE_CLIP_RELOAD_TIME;
      } else {
        reloadBar = 30 * cGame.reloadTimeLeft / GLOBALS.RIFLE_RELOAD_TIME;
      }

      const reloadPosX = cGame.localPlayer.mX - 15;
      const reloadPosY = cGame.localPlayer.mY + 15;
      cGame.ctxUI.fillRect(reloadPosX+2, reloadPosY-17, 24, 2); //crosshair horiz
      cGame.ctxUI.fillRect(reloadPosX+13, reloadPosY-28, 2, 24);//crosshair vert
      cGame.ctxUI.fillRect(reloadPosX, reloadPosY, 30, 4);
      cGame.ctxUI.fillStyle = 'black';
      cGame.ctxUI.fillRect(reloadPosX, reloadPosY, reloadBar, 4);
    }
  }
}; //drawUI()

//END RENDER FUNCTIONS ##########################################################