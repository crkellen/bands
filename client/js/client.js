const ctx = document.getElementById('canvas-game').getContext('2d');
ctx.translate(0.5, 0.5);
const ctxUI = document.getElementById('canvas-ui').getContext('2d');

import { Game, cPlayer, cBullet, cBlock, Camera, Map } from './Game';
var io = require('socket.io-client');
//Replace with hosting IP (144.13.22.62) 'http://localhost'
var socket = io();
var cGame = new Game(ctx, ctxUI);
var playerName = '';

var GameMap = new Map(5000, 3000);
GameMap.generate(cGame.ctx);

let cam = {
  xView: 0,
  yView: 0,
  canvasWidth: cGame.ctx.canvas.width,
  canvasHeight: cGame.ctx.canvas.height,
  worldWidth: 5000,
  worldHeight: 3000
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
      let x = localPlayer.x - GameCamera.xView;
      let y = localPlayer.y - GameCamera.yView;
      let gridLocX = localPlayer.mX - x;
      let gridLocY = localPlayer.mY - y;

      cGame.selectedGrid = findSelectedGrid(gridLocX, gridLocY);
    }

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
        let x = -cGame.ctx.canvas.clientWidth/2 + e.clientX;
        let y = -cGame.ctx.canvas.clientHeight/2 + e.clientY;
        //Check if within the deadzones
        let mouse = getMousePos(cGame.ctx, e);
        if( cGame.selfID !== null ) {
          if( GameCamera.xView === 0 ) {
            x = mouse.x - cGame.cPlayers[cGame.selfID].x - GameCamera.xView;
          }
          if( GameCamera.yView === 0 ) {
            y = mouse.y - cGame.cPlayers[cGame.selfID].y - GameCamera.yView;
          }
        }
        //Update mouse angle
        let angle = Math.atan2(y, x) / Math.PI * 180;
        socket.emit('keyPress', {inputID: 'mouseAngle', state: angle});

        //Shoot
        if(cGame.canShoot === true) {
          cGame.canShoot = false;
          socket.emit('keyPress', {inputID: 'attack', state: true});
          setTimeout( () => {
            cGame.canShoot = true;
          }, 500);
        }
      } else if( currentMode === 1 ) {  //Building mode
        //Place block
        if(cGame.canBuild === true) {
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

function findSelectedGrid(gX, gY) {
  let gridSelected = -1; //Grid selected follows the numpad layout
  if( (gX > -140 && gX < -40) && (gY > -140 && gY < -40) ) {      //Top Left
    gridSelected = 7;
  } else if( (gX > -40 && gX < 40) && (gY > -140 && gY < -40) ) { //Top Middle
    gridSelected = 8;
  } else if( (gX > 40 && gX < 140) && (gY > -140 && gY < -40) ) { //Top Right
    gridSelected = 9;
  } else if( (gX > -140 && gX < -40) && (gY > -40 && gY < 40) ) { //Middle Left
    gridSelected = 4;
  } else if( (gX > -40 && gX < 40) && (gY > -40 && gY < 40) ) {   //Middle Middle
    gridSelected = -1; //Cannot place block where you are
  } else if( (gX > 40 && gX < 140) && (gY > -40 && gY < 40) ) {   //Middle Right
    gridSelected = 6;
  } else if( (gX > -140 && gX < -40) && (gY > 40 && gY < 140) ) { //Bottom Left
    gridSelected = 1;
  } else if( (gX > -40 && gX < 40) && (gY > 40 && gY < 140) ) { //Bottom Middle
    gridSelected = 2;
  } else if( (gX > 40 && gX < 140) && (gY > 40 && gY < 140) ) { //Bottom Right
    gridSelected = 3;
  } else {
    gridSelected = -1; //Out of bounds
  }
  return gridSelected;
} //findSelectedGrid()

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
      if( bl.gridX !== undefined ) {
        bl.gridX = pack.gridX;
      }
      if( bl.gridY !== undefined ) {
        bl.gridY = pack.gridY;
      }
      if( bl.HP !== undefined ) {
        bl.HP = pack.HP;
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
    cGame.cPlayers[p].drawSelf(cGame.ctx, GameCamera.xView, GameCamera.yView);
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

  //If player is in build mode (check has already happened)
  //And player is above a grid which is not invalid for placement
  if( cGame.selectedGrid !== -1 ) {
    //Show where the block will be placed
    cGame.ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    //#TODO: Replace these hardcoded values with actual grid spaces
    switch( cGame.selectedGrid ) {
    case 1: //Bottom Left
      cGame.ctx.fillRect(0, 160, 80, 80);
      break;
    case 2: //Bottom Middle
      cGame.ctx.fillRect(80, 160, 80, 80);
      break;
    case 3: //Bottom Right
      cGame.ctx.fillRect(160, 160, 80, 80);
      break;
    case 4: //Middle Left
      cGame.ctx.fillRect(0, 80, 80, 80);
      break;
    case 6: //Middle Right
      cGame.ctx.fillRect(160, 80, 80, 80);
      break;
    case 7: //Top Left
      cGame.ctx.fillRect(0, 0, 80, 80);
      break;
    case 8: //Top Middle
      cGame.ctx.fillRect(80, 0, 80, 80);
      break;
    case 9: //Top Right
      cGame.ctx.fillRect(160, 0, 80, 80);
      break;
    }
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
  }
};
