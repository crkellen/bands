//#TODO: Replace all instances of ID with an actual ID rather than their name
//#TODO: Setup the gameloop/draw images to the canvas
//#TODO: Setup fullscreen canvas, make camera follow player in center

const PLAYER_INIT_HP = 100;
const BULLET_SPEED = 10;

//########## BEGIN INIT SERVER
import { GameServer } from './GameServer';
var Game = new GameServer;
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
  //#TEMP: Usage of Math.random() in place of a database USER ID
  socket.ID = Math.random();
  //Add the connected socket to the list of sockets
  SOCKET_LIST[socket.ID] = socket;
  console.info('Player Connection: ' + socket.ID);

  socket.on('joinGame', (playerData) => {
    isValidUsername(playerData, (res) => {
      if( res === true ) {
        console.info(`${playerData.ID} joined the game.`);
        let initX = getRandomInt(40, 900);
        let initY = getRandomInt(40, 500);
        socket.emit('addPlayer', {
          ID: playerData.ID,
          isLocal: true,
          x: initX,
          y: initY,
          HP: PLAYER_INIT_HP
        });
        socket.broadcast.emit('addPlayer', {
          ID: playerData.ID,
          isLocal: false,
          x: initX,
          y: initY,
          HP: PLAYER_INIT_HP
        });
        Game.addPlayer({
          ID: playerData.ID,
          HP: PLAYER_INIT_HP
        });
      } else {
        //Username is invalid
      }
    }); //isValidUsername()
  }); //'joinGame'

  socket.on('sync', (data) => {
    //Recieve Data from Clients
    if( data.player !== undefined ) {
      Game.syncPlayers(data.player);
    }

    //Update Bullets
    Game.syncBullets();

    //Broadcast new data to Clients
    socket.emit('sync', Game.getData());
    socket.broadcast.emit('sync', Game.getData());

    //Cleanup
    Game.removeDeadPlayers();
    Game.removeDeadBullets();
  }); //'sync'

  socket.on('shoot', (data) => {
    let bullet = new Bullet(data.ownerID, data.alpha, data.x, data.y);
    Game.addBullet(bullet);
  }); //'shoot'

  //This function is called whenever a socket disconnects
  //This is currently whenever the client leaves the webpage
  //Removes the socket from the list of connected sockets
  socket.on('disconnect', (playerID) => {
    console.info(`${playerID} has left the game.`);
    Game.removePlayer(playerID);
    socket.broadcast.emit('removePlayer', playerID);
    delete SOCKET_LIST[socket.ID];
  }); //'disconnect'
}); //'connection'

class Bullet {
  constructor(ownerID, alpha, x, y) {
    this.ID = Game.lastBulletID;
    Game.increaseLastBulletID();
    this.ownerID = ownerID;
    this.alpha = alpha;
    this.x = x;
    this.y = y;
    this.dead = false;
  } //Bullet.constructor()

  move() {
    let speedX = BULLET_SPEED * Math.sin(this.alpha);
    let speedY = -BULLET_SPEED * Math.cos(this.alpha);
    this.x += speedX;
    this.y += speedY;
  } //Bullet.move()
} //class Bullet

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

//export default app;
