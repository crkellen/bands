//########## BEGIN INIT SERVER
import { GameServer } from './GameServer';
var ServerGame = new GameServer;
//APP: Make an express server instance
import express from 'express';
var app = express();
app.set('views', './client/views');
app.set('view engine', 'ejs');
var server = require('http').Server(app);

app.use( express.static(__dirname + '/../client') );

app.get('/', (req, res) => {
  res.render('index');
});

//Setup socket.io
var io = require('socket.io')(server);

server.listen(2000, () => {
  console.info('Server Initialized on port 2000.');
});
//########## END INIT SERVER

//A list of every connected Socket
var SOCKET_LIST = {};

//Returns 'true' if Username is valid
var isValidUsername = (data, cb) => {
  return cb(true);
};

//This function is called whenever a socket connects
//This currently happens the moment they successfully connect to the webpage
io.on('connection', (socket) => {
  //#TODO: Usage of Math.random() in place of a database USER ID
  socket.ID = Math.random();
  //Add the connected socket to the list of sockets
  //CHeck for exists before adding
  SOCKET_LIST[socket.ID] = socket;
  console.info('Player Connection: ' + socket.ID);

  //PlayerData is currently only playerName
  socket.on('joinGame', (playerData) => {
    isValidUsername(playerData, (res) => {
      if( res === true ) {
        ServerGame.addPlayer(socket, playerData.name, getRandomInt(0, 1), getRandomInt(0, 1));
      } else {
        //Username was Invalid
      }
    }); //isValidUsername()
  }); //'joinGame'

  //This function is called whenever a socket disconnects
  //This is currently whenever the client leaves the webpage
  //Removes the socket from the list of connected sockets
  socket.on('disconnect', () => {
    console.info(`${socket.ID} has left the game.`);
    delete SOCKET_LIST[socket.ID];
    ServerGame.removePack.player.push(socket.ID);
    delete ServerGame.players[socket.ID];
  }); //'disconnect'
}); //'connection'

//SERVER GAME LOOP
setInterval( () => {
  //Gather all of the server's instance data packs
  let packs = ServerGame.getFrameUpdateData();
  //For every connected socket, emit the data packs
  for( let s in SOCKET_LIST ) {
    let socket = SOCKET_LIST[s];
    socket.emit('init', packs.initPack);
    socket.emit('remove', packs.removePack);
    socket.emit('update', packs.updatePack);
  }
}, 1000/25); //END SERVER GAME LOOP

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
