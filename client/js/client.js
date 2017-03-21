const ctx = document.getElementById('canvas-game').getContext('2d');
const ctxUI = document.getElementById('canvas-ui').getContext('2d');

import { Game, Imgs, cPlayer, cBullet } from './Game';
var io = require('socket.io-client');
//Replace with hosting IP (144.13.22.62) 'http://localhost'
var socket = io();
var cGame = new Game(ctx, ctxUI);
var playerName = '';

/*
socket.on('addPlayer', (player) => {
  game.addPlayer(player.ID, player.name, player.isLocal, player.x, player.y);
}); //'addPlayer'

socket.on('sync', (serverData) => {
  game.receiveData(serverData);
}); //'sync'

socket.on('killPlayer', (playerData) => {
  game.killPlayer(playerData);
}); //'killPlayer'

socket.on('removePlayer', (playerID) => {
  game.removePlayer(playerID);
}); //'removePlayer'
*/

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

  $(document).contextmenu( (e) => {
    e.preventDefault();
  }); //$(document).contextmenu()

  $(document).keydown( (e) => {
    let k = e.keyCode || e.which;
    switch(k) {
    case 87: //W
      socket.emit('keyPress', {inputId: 'up', state: true});
      break;
    case 65: //A
      socket.emit('keyPress', {inputId: 'left', state: true});
      break;
    case 83: //S
      socket.emit('keyPress', {inputId: 'down', state: true});
      break;
    case 68: //D
      socket.emit('keyPress', {inputId: 'right', state: true});
      break;
    default: break;
    }
  }).keyup( (e) => {
    let k = e.keyCode || e.which;
    switch(k) {
    case 87: //W
      socket.emit('keyPress', {inputId: 'up', state: false});
      break;
    case 65: //A
      socket.emit('keyPress', {inputId: 'left', state: false});
      break;
    case 83: //S
      socket.emit('keyPress', {inputId: 'down', state: false});
      break;
    case 68: //D
      socket.emit('keyPress', {inputId: 'right', state: false});
      break;
    default: break;
    }
  }).mousemove( (e) => {
    let x = -250 + e.clientX - 8;
    let y = -250 + e.clientY - 8;
    let angle = Math.atan2(y, x) / Math.PI * 180;
    socket.emit('keyPress', {inputId: 'mouseAngle', state: angle});
  }).mousedown( () => {
    socket.emit('keyPress', {inputId: 'attack', state: true});
  }).mouseup( () => {
    socket.emit('keyPress', {inputId: 'attack', state: false});
  }); //$(document).keydown().keyup().mousemove().mousedown().mouseup()
}); //$(document).ready()

$(window).on('beforeunload', () => {
  socket.emit('disconnect');
}); //$(window).on('beforeunload')

function joinGame(playerName, socket) {
  if( playerName !== '' ) {
    $('#prompt').hide();
    socket.emit('joinGame', {name: playerName});
  }
} //joingame()

//##############################################################

socket.on('init', (data) => {
  if( data.selfID !== undefined ) {
    cGame.selfID = data.selfID;
  }
  for( let i = 0; i < data.player.length; i++ ) {
    console.info(cGame.cPlayers);
    cGame.cPlayers[data.player[i].ID] = new cPlayer(data.player[i]);
    console.info(cGame.cPlayers);
  }
  for( let j = 0; j < data.bullet.length; j++ ) {
    cGame.cBullets[data.bullet[j].ID] = new cBullet(data.bullet[j]);
  }
}); //'init'

socket.on('update', (data) => {
  //For all players, if there is data, update it
  for( let i = 0; i < data.player.length; i++ ) {
    let pack = data.player[i];
    let p = cGame.cPlayers[pack.ID];
    if( p !== undefined ) {
      if( p.x !== undefined ) {
        p.x = pack.x;
      }
      if( p.y !== undefined ) {
        p.y = pack.y;
      }
      if( p.HP !== undefined ) {
        p.HP = pack.HP;
      }
      if( p.score !== undefined ) {
        p.score = pack.score;
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
}); //'update'

socket.on('remove', (data) => {
  for( let i = 0; i < data.player.length; i++ ) {
    delete cGame.cPlayers[data.player[i]];
  }
  for( let j = 0; j < data.bullet.length; j++ ) {
    delete cGame.cBullet[data.bullet[j]];
  }
}); //'remove'

//CLIENT GAME LOOP
setInterval( () => {
  if( !cGame.selfID ) {
    return;
  }

  drawGrid();     //Draws only the grid when it updates
  drawEntities(); //Draws only the Entities
  drawUI();       //Draws only the UI when it updates
}, 40);

var drawGrid = () => {
  //console.info(cGame.cPlayers[cGame.selfID]);
  let player = cGame.cPlayers[cGame.selfID]; //#FIXME: player is undefined
  let x = cGame.ctx.canvas.width/2 - player.x;
  let y = cGame.ctx.canvas.height/2 - player.y;
  cGame.ctx.drawImage(Imgs.grid, x, y);
};

var drawEntities = () => {
  //Each player object draws itself
  for( let p in cGame.cPlayers ) {
    //console.info(cGame.cPlayers[p]);
    cGame.cPlayers[p].drawSelf(cGame);
  }
  //Each bullet object draws itself
  for( let b in cGame.cBullets ) {
    cGame.cBullets[b].drawSelf(cGame);
  }
};

var drawUI = () => {
  console.info(cGame.cPlayers[cGame.selfID].x);
/*
  if( cGame.prevScore === cGame.cPlayers[cGame.selfID].score ) { //#FIXME: cGame.cPlayers[cGame.selfID] undef
    return;
  }

  cGame.prevScore = cGame.cPlayers[cGame.selfID].score;
  cGame.ctxUI.fillStyle = 'white';
  cGame.ctxUI.fillText(cGame.cPlayers[cGame.selfID].score, 0, 30);
*/
};



/*
this.ctx.canvas.width = this.ctx.canvas.clientWidth;
this.ctx.canvas.height = this.ctx.canvas.clientHeight;
this.ctx.fillStyle = 'black';
this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
*/
