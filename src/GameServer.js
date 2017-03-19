const WIDTH = 500;
const HEIGHT = 500;

export class GameServer {
  constructor() {
    this.players = [];
    this.bullets = [];
    this.lastBulletID = 0;
  } //GameServer constructor()

  addPlayer(player) {
    this.players.push(player);
  } //GameServer.addPlayer()

  addBullet(bullet) {
    this.bullets.push(bullet);
  } //GameServer.addBullet()

  removePlayer(playerID) {
    this.players = this.players.filter( (p) => { return p.ID != playerID; } );
  } //GameServer.removePlayer()

  syncPlayers(newPlayerData) {
    this.players.forEach( (player) => {
      player.x = newPlayerData.x;
      player.y = newPlayerData.y;
      player.gunAngle = newPlayerData.gunAngle;
    }); //forEach
  } //GameServer.syncPlayers()

  syncBullets() {
    this.bullets.forEach( (bullet) => {
      this.detectCollision(bullet);

      if( bullet.x < 0 || bullet.x > WIDTH
        || bullet.y < 0 || bullet.y > HEIGHT ) {
        bullet.dead = true;
      } else  {
        bullet.move();
      }
    }); //forEach
  } //GameServer.syncBullets()

  detectCollision(bullet) {
    this.players.forEach( (player) => {
      if( player.ID != bullet.ownerID
        && Math.abs(player.x - bullet.x) < 10
        && Math.abs(player.y - bullet.y) < 10 ) {
        //Player was Hit
        this.hurtPlayer(player);
        bullet.dead = true;
      }
    }); //forEach
  } //GameServer.detectCollision()

  hurtPlayer(player) {
    player.HP -= 1;
  } //GameServer.hurtPlayer()

  getData() {
    let gameData = {};
    gameData.players = this.players;
    gameData.bullets = this.bullets;

    return gameData;
  } //GameServer.getData()

  removeDeadPlayers() {
    this.players = this.players.filter( (p) => {
      return p.HP > 0;
    });
  } //GameServer.removeDeadPlayers()

  removeDeadBullets() {
    this.bullets = this.bullets.filter( (bullet) => {
      return !bullet.dead;
    });
  } //GameServer.removeDeadPlayers()

  increaseLastBulletID() {
    this.lastBulletID++;
    if( this.lastBulletID > 1000 ) {
      this.lastBulletID = 0;
    }
  } //GameServer.increaseLastBulletID()
} //class GameServer
