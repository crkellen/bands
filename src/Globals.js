const WORLD_WIDTH   = 3200;
const WORLD_HEIGHT  = 1800;

const TILE_WIDTH   = 80;
const TILE_HEIGHT  = 80;

const TILE_EMPTY   = 0;
const TILE_PLAYER  = 1;
const TILE_BLOCK   = 2;

export class GLOBALS {
  static get WORLD_WIDTH() {
    return WORLD_WIDTH;
  }

  static get WORLD_HEIGHT() {
    return WORLD_HEIGHT;
  }

  static get TILE_WIDTH() {
    return TILE_WIDTH;
  }

  static get TILE_HEIGHT() {
    return TILE_HEIGHT;
  }

  static get TILE_EMPTY() {
    return TILE_EMPTY;
  }

  static get TILE_PLAYER() {
    return TILE_PLAYER;
  }

  static get TILE_BLOCK() {
    return TILE_BLOCK;
  }
} //class Globals

//UTILITY FUNCTIONS

export const getTimestamp = () => {
  const date = new Date();
  const hours = date.getHours();
  const minutes = '0' + date.getMinutes();
  const seconds = '0' + date.getSeconds();
  return `${hours}:${minutes.substr(-2)}:${seconds.substr(-2)}`;
};