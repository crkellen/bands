const WIDTH = 1100;
const HEIGHT = 580;

import { Game } from './player';
var io = require('socket.io-client');
//Replace with hosting IP (144.13.22.62) 'http://localhost'
var socket = io();
var game = new Game(WIDTH, HEIGHT, socket);
var playerName = '';

socket.on('addPlayer', (player) => {
  game.addPlayer(player.ID, player.isLocal, player.x, player.y);
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
}); //$(document).ready()

$(window).on('beforeunload', () => {
  socket.emit('disconnect', playerName);
}); //$(window).on('beforeunload')

function joinGame(playerName, socket) {
  if( playerName !== '' ) {
    $('#prompt').hide();
    socket.emit('joinGame', {ID: playerName});
  }
} //joingame()
