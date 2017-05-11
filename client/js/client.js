const ctx = document.getElementById('canvas-game').getContext('2d');
ctx.translate(0.5, 0.5);
const ctxUI = document.getElementById('canvas-ui').getContext('2d');

//World constants
const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 1800;

import { Game, cPlayer, cBullet, cBlock, Camera, Map } from './Game';
var io = require('socket.io-client');
//Replace with hosting IP (144.13.22.62) 'http://localhost'
var socket = io();
var cGame = new Game(ctx, ctxUI);
var playerName = '';

var GameMap = new Map(WORLD_WIDTH, WORLD_HEIGHT);
GameMap.generate(cGame.ctx);

let cam = {
  xView: 0,
  yView: 0,
  canvasWidth: cGame.ctx.canvas.width,
  canvasHeight: cGame.ctx.canvas.height,
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT
};
var GameCamera = new Camera(cam);



$(document).ready( () => {
  $('#play').click( () => {
    playerName = $('#player-name').val();
    joinGame(playerName, socket);
  }); //#play.click()

  $('#player-name').keyup( (e) => {
    playerName = $('#player-name').val();
    let k = e.keyCode || e.which;
    if( k == 13 ) {
      joinGame(playerName, socket);
    }
  }); //#player-name.keyup()

  //canvas-ui is above canvas-game so check that for movement
  $('#canvas-ui').mousemove( (event) => {
    if( cGame.gameStarted !== true ) {
      return;
    }

    //If there is a significant lag, this can be undefined
    if( cGame.cPlayers[cGame.selfID] === undefined ) {
      return;
    }

    //If player is in build mode
    if( cGame.cPlayers[cGame.selfID].mode === 1 ) {
      //Calculate grid square
      let localPlayer = cGame.cPlayers[cGame.selfID];
      let selGridX = -1;
      let selGridY = -1;

      //If we are outside of a deadzone, need to offset the tile calculation
      if( GameCamera.xView > 0 ) {
        let xOffset = GameCamera.xView;
        selGridX = ~~((localPlayer.mX + xOffset) / 80);
      } else {
        selGridX = ~~(localPlayer.mX / 80);
      }
      if( GameCamera.yView > 0 ) {
        let yOffset = GameCamera.yView;
        selGridY = ~~((localPlayer.mY + yOffset) / 80);
      } else {
        selGridY = ~~(localPlayer.mY / 80);
      }

      //Check to see if selection is on top of player
      if( selGridX === localPlayer.gridX && selGridY === localPlayer.gridY ) {
        selGridX = -1;
        selGridY = -1;
      }

      //Check to see if selection is out of range (grid pos + 1)
      if( selGridX > localPlayer.gridX + 1  ) { //Out of range on LEFT
        selGridX = -1;
      }
      if( selGridX < localPlayer.gridX - 1  ) { //Out of range on RIGHT
        selGridX = -1;
      }
      if( selGridY < localPlayer.gridY - 1  ) { //Out of range on TOP
        selGridY = -1;
      }
      if( selGridY > localPlayer.gridY + 1  ) { //Out of range on BOTTOM
        selGridY = -1;
      }
      //Corners don't need to be checked, are handled already by the above checks

      cGame.selGridX = selGridX;
      cGame.selGridY = selGridY;

      //Update the server with which tile is selected
      socket.emit('keyPress', {
        inputID: 'selGrid',
        selGridX: selGridX,
        selGridY: selGridY
      });
    } //if( Player is in build mode )

    //Update mouse position
    let mousePos = getMousePos(cGame.ctx, event);
    socket.emit('keyPress', {inputID: 'mousePos', mousePos: mousePos});
  });

  $(document).contextmenu( (e) => {
    e.preventDefault();
  }); //$(document).contextmenu()

  $(document).keydown( (e) => {
    if( cGame.gameStarted !== true ) {
      return;
    }
    let k = e.keyCode || e.which;

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
    if( cGame.gameStarted !== true ) {
      return;
    }
    let k = e.keyCode || e.which;
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
    default: break;
    }
  }).click( (e) => {
    if( cGame.gameStarted !== true ) {
      return;
    }

    //If there is a significant lag, this can be undefined
    if( cGame.cPlayers[cGame.selfID] === undefined ) {
      return;
    }

    let currentMode = cGame.cPlayers[cGame.selfID].mode;
    //Check for left or right mouse button
    switch( e.which ) {
    case 1: //Left mouse button
      if( currentMode === 0 ) {         //Weapon mode
        //Calculate the angle from player to mouse
        let mouse = getMousePos(cGame.ctx, e);
        let x = -cGame.ctx.canvas.clientWidth/2 + e.clientX;
        let y = -cGame.ctx.canvas.clientHeight/2 + e.clientY;
        //TODO: DEBUG FOR #52
        // console.info(`X: ${x}, Y: ${y}
        // cW: ${-cGame.ctx.canvas.clientWidth/2}, cH: ${-cGame.ctx.canvas.clientHeight/2}
        // eX: ${e.clientX}, eY: ${e.clientY}`);
        //Check if within the deadzones
        if( cGame.selfID !== null ) {
          //Offset the calculation if in a deadzone
          let xOffset = cGame.cPlayers[cGame.selfID].x;// - GameCamera.xView;
          let yOffset = cGame.cPlayers[cGame.selfID].y;// - GameCamera.yView;
          if( GameCamera.xView === 0 ) {      //LEFT
            x = mouse.x - xOffset;
          }
          if( GameCamera.xView === 1600 ) {   //RIGHT 4800
            x = mouse.x - xOffset;
          }
          if( GameCamera.yView === 0 ) {      //TOP
            y = mouse.y - yOffset;
          }
          if( GameCamera.yView === 1000 ) {   //BOTTOM 3040
            y = mouse.y - yOffset;
          }
        }
        //Update mouse angle
        let angle = Math.atan2(y, x) / Math.PI * 180;
        socket.emit('keyPress', {inputID: 'mouseAngle', state: angle});

        //Shoot
        if( cGame.canShoot === true && cGame.cPlayers[cGame.selfID].ammo > 0 ) {
          cGame.canShoot = false;
          socket.emit('keyPress', {inputID: 'attack', state: true});
          setTimeout( () => {
            cGame.canShoot = true;
          }, 500);
        }
      } else if( currentMode === 1 ) {  //Building mode
        //Place block
        if(cGame.canBuild === true && cGame.cPlayers[cGame.selfID].blocks > 0 ) {
          cGame.canBuild = false;
          socket.emit('keyPress', {inputID: 'attack', state: true});
          setTimeout( () => {
            cGame.canBuild = true;
          }, 300);
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
    case 3: //Right mouse button
      socket.emit('keyPress', {inputID: 'switchMode'});
      break;
    } //switch( e.which )
  }); //$(document).keydown().keyup().mousemove().click().onmousedown()
}); //$(document).ready()

$(window).on('beforeunload', () => {
  socket.emit('disconnect');
}); //$(window).on('beforeunload')

function joinGame(playerName, socket) {
  if( playerName !== '' ) {
    $('#prompt').hide();
    socket.emit('joinGame', {name: playerName});
    cGame.gameStarted = true;
  }
} //joingame()

function getMousePos(ctx, e) {
  let rect = ctx.canvas.getBoundingClientRect();
  let mouseX = e.clientX - rect.left;
  let mouseY = e.clientY - rect.top;
  return {
    x: mouseX,
    y: mouseY
  };
} //getMousePos()

//##############################################################

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
    GameCamera.follow(cGame.cPlayers[cGame.selfID], cGame.ctx.canvas.width/2, cGame.ctx.canvas.height/2);
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
    let pack = data.player[i];
    let p = cGame.cPlayers[pack.ID];
    //#FIXME: THIS MAY BE REDUNDANT CHECKS all the p.x !== undefined etc.
    //#TODO: REMOVE IF REDUDANT
    if( p !== undefined ) {
      if( p.gridX !== undefined ) {
        p.gridX = pack.gridX;
      }
      if( p.gridY !== undefined ) {
        p.gridY = pack.gridY;
      }
      if( p.x !== undefined ) {
        p.x = pack.x;
        if( p.ID === cGame.selfID ) {
          GameCamera.followed.x = pack.x;
        }
      }
      if( p.y !== undefined ) {
        p.y = pack.y;
        if( p.ID === cGame.selfID ) {
          GameCamera.followed.y = pack.y;
        }
      }
      if( p.HP !== undefined ) {
        p.HP = pack.HP;
      }
      if( p.mX !== undefined ) {
        p.mX = pack.mX;
      }
      if( p.mY !== undefined ) {
        p.mY = pack.mY;
      }
      if( p.score !== undefined ) {
        p.score = pack.score;
      }
      if( p.ammo !== undefined ) {
        p.ammo = pack.ammo;
      }
      if( p.clips !== undefined ) {
        p.clips = pack.clips;
      }
      if( p.invincible !== undefined ) {
        p.invincible = pack.invincible;
      }
      if( p.mode !== undefined ) {
        p.mode = pack.mode;
      }
      if( p.blocks !== undefined ) {
        p.blocks = pack.blocks;
      }
    }
  } //for( i in data.player.length)

  //For all bullets, if there is data, update it
  for( let j = 0; j < data.bullet.length; j++ ) {
    let pack = data.bullet[j];
    let b = cGame.cBullets[data.bullet[j].ID];
    if( b !== undefined ) {
      if( b.x !== undefined ) {
        b.x = pack.x;
      }
      if( b.y !== undefined ) {
        b.y = pack.y;
      }
    }
  } //for( j in data.bullet.length)

  //For all blocks, if there is data, update it
  for( let k = 0; k < data.block.length; k++ ) {
    let pack = data.block[k];
    let bl = cGame.cBlocks[data.block[k].ID];
    if( bl !== undefined ) {
      if( bl.HP !== undefined ) {
        bl.HP = pack.HP;
      }
      if( bl.isActive !== undefined ) {
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
  //Blocks
  for( let k = 0; k < data.block.length; k++ ) {
    delete cGame.cBlocks[data.block[k]];
  }
}); //'remove'

socket.on('selGridResponse', (data) => {
  //Update the ID of the selected grid
  cGame.selectedGrid = data.selBlockID;
});

//CLIENT GAME LOOP
setInterval( () => {
  if( !cGame.selfID ) {
    return;
  }
  cGame.ctx.clearRect(0, 0, cGame.ctx.canvas.width, cGame.ctx.canvas.height);
  GameCamera.update();
  GameMap.draw(cGame.ctx, GameCamera.xView, GameCamera.yView);
  drawEntities(); //Draws only the Entities
  drawUI();       //Draws only the UI when it updates
}, 40);

var drawEntities = () => {
  //Each player object draws itself
  for( let p in cGame.cPlayers ) {
    let isLocalPlayer = false;
    if( cGame.cPlayers[cGame.selfID] === cGame.cPlayers[p] ) {
      isLocalPlayer = true;
    }
    cGame.cPlayers[p].drawSelf(cGame.ctx, GameCamera.xView, GameCamera.yView, isLocalPlayer);
  }
  //Each bullet object draws itself
  for( let b in cGame.cBullets ) {
    cGame.cBullets[b].drawSelf(cGame.ctx, GameCamera.xView, GameCamera.yView);
  }
  //Each block object draws itself
  for( let bl in cGame.cBlocks ) {
    cGame.cBlocks[bl].drawSelf(cGame.ctx, GameCamera.xView, GameCamera.yView);
  }
};

var drawUI = () => {
  //All players names and ammo
  //Note: To prevent excessive drawing for unchanged values, name and ammo
  //are drawn on the main canvas, and the UI canvas only updates when needed
  for( let p in cGame.cPlayers ) {
    cGame.cPlayers[p].drawName(cGame.ctx, GameCamera.xView, GameCamera.yView);
    cGame.cPlayers[p].drawAmmo(cGame.ctx, GameCamera.xView, GameCamera.yView);
  }

  //#TODO TEMPORARY USER FEEDBACK ON RELOADING
  if( cGame.cPlayers[cGame.selfID].ammo <= 0 && cGame.reloading === false ) {
    cGame.reloading = true;
    cGame.ctxUI.canvas.style.cursor = 'wait';
  }
  if( cGame.reloading === true && cGame.cPlayers[cGame.selfID].ammo > 0 ) {
    cGame.reloading = false;
    cGame.ctxUI.canvas.style.cursor = 'crosshair';
  }

  //If player is in build mode (check has already happened)
  //And player is above a grid which is not invalid for placement
  let selectionOutOfBounds = false;
  if( cGame.selGridX === -1 || cGame.selGridY === -1 ||
    cGame.cPlayers[cGame.selfID].mode === 0 ) {
    selectionOutOfBounds = true;
    cGame.UIUpdate = true;
  }
  if( selectionOutOfBounds !== true ) {
    //Update the UI
    cGame.UIUpdate = true;
  }

  //Low-changing Values
  //Player Score
  if( cGame.prevScore !== cGame.cPlayers[cGame.selfID].score ) {
    cGame.UIUpdate = true;
  }

  //Player Clips
  if( cGame.prevClipCount !== cGame.cPlayers[cGame.selfID].clips ) {
    cGame.UIUpdate = true;
  }

  //Player Clips
  if( cGame.prevBlockCount !== cGame.cPlayers[cGame.selfID].blocks ) {
    cGame.UIUpdate = true;
  }

  if( cGame.UIUpdate === true ) {
    cGame.UIUpdate = false;

    //Clear the screen
    cGame.ctxUI.clearRect(0, 0, cGame.ctxUI.canvas.width, cGame.ctxUI.canvas.height);

    //Background
    cGame.ctxUI.fillStyle = 'rgba(200, 200, 200, 0.3)';
    cGame.ctxUI.fillRect(0, 0, 330, 40);

    cGame.ctxUI.fillStyle = 'rgba(255, 255, 255, 0.5)';

    //Player Score
    cGame.prevScore = cGame.cPlayers[cGame.selfID].score;
    let scoreString = `Score: ${cGame.prevScore}`;
    cGame.ctxUI.fillText(scoreString, 15, 30);

    //Player Clips
    cGame.prevClipCount = cGame.cPlayers[cGame.selfID].clips;
    let clipString = `Clips: ${cGame.prevClipCount}/${cGame.cPlayers[cGame.selfID].maxClips}`;
    cGame.ctxUI.fillText(clipString, 100, 30);

    //Player Blocks
    cGame.prevBlockCount = cGame.cPlayers[cGame.selfID].blocks;
    let blockString = `Blocks: ${cGame.prevBlockCount}/${cGame.cPlayers[cGame.selfID].maxBlocks}`;
    cGame.ctxUI.fillText(blockString, 200, 30);

    //Show where the block would be placed on the selected grid
    //Show where the block will be placed
    if( selectionOutOfBounds !== true && cGame.selectedGrid !== -1 ) {
      if( cGame.cBlocks[cGame.selectedGrid].isActive === true ) {
        cGame.cBlocks[cGame.selectedGrid].drawSelection(cGame.ctxUI, GameCamera.xView, GameCamera.yView, false);
      } else {
        cGame.cBlocks[cGame.selectedGrid].drawSelection(cGame.ctxUI, GameCamera.xView, GameCamera.yView, true);
      }
    }
  }
};
