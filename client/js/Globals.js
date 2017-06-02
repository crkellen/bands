const WORLD_WIDTH  = 3200;
const WORLD_HEIGHT = 1800;

const CTX    = document.getElementById('canvas-game').getContext('2d');
const CTX_UI = document.getElementById('canvas-ui').getContext('2d');

const RIFLE_RELOAD_TIME = 1000;
const RIFLE_CLIP_RELOAD_TIME = 3000;

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
Imgs.aimingGuide = new Image();
Imgs.aimingGuide.src = './../img/aimingGuide.png';

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

  static get RIFLE_RELOAD_TIME() {
    return RIFLE_RELOAD_TIME;
  }

  static get RIFLE_CLIP_RELOAD_TIME() {
    return RIFLE_CLIP_RELOAD_TIME;
  }

  static get Imgs() {
    return Imgs;
  }
} //class Globals

//LocalPlayerAnimationController Static Variables
//Aiming Guide Animation Variables
var _aimingGuideFrame = 0;
var _aimingGuideFrameTick = 0;
var _aimingGuideAnimSpeed = 5;

//The animation controller for only the local player. All accessed variables and functionality is static.
export class LocalPlayerAnimationController {
//AIMING GUIDE ANIMATION FUNCTIONS
  static aimingGuideAnimationUpdate() {
    if( _aimingGuideFrameTick === _aimingGuideAnimSpeed ) {
      _aimingGuideFrame = (_aimingGuideFrame+1) % 6;
    }
    _aimingGuideFrameTick++;
    _aimingGuideFrameTick %= (_aimingGuideAnimSpeed + 1);
  } //GLOBALS.aimingGuideAnimationUpdate()

  static get aimingGuideFrame() {
    return _aimingGuideFrame;
  }
//END AIMING GUIDE ANIMATION

} //class LocalPlayerAnimationController

//The animation controller for any player, including the local player, but not the local only animations.
export class PlayerAnimationController {

} //class PlayerAnimationController 