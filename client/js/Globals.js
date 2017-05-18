const WORLD_WIDTH  = 3200;
const WORLD_HEIGHT = 1800;

const CTX    = document.getElementById('canvas-game').getContext('2d');
const CTX_UI = document.getElementById('canvas-ui').getContext('2d');

var Imgs = {};
//Imgs.player = new Image();
//Imgs.player.src = './../img/player.png';
//Imgs.bullet = new Image();
//Imgs.bullet.src = './../img/bullet.png';
//Imgs.gun = new Image();
//Imgs.gun.src = './../img/gun.png';
//Imgs.background = new Image();
//Imgs.background.src = '/client/img/background.png';
Imgs.grid = new Image();
Imgs.grid.src = './../img/grid2x.png';

export class GLOBALS {
  static get WORLD_WIDTH() {
    return WORLD_WIDTH;
  }

  static get WORLD_HEIGHT() {
    return WORLD_HEIGHT;
  }

  static get CTX() {
    return CTX;
  }

  static get CTX_UI() {
    return CTX_UI;
  }

  static get Imgs() {
    return Imgs;
  }
} //class Globals