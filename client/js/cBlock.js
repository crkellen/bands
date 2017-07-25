import * as Pixi from 'pixi.js';
var Graphics = Pixi.Graphics;
var Container = Pixi.Container;

export class cBlock {
  constructor(initPack) {
    this.ID = initPack.ID;
    this.gridX = initPack.gridX;
    this.gridY = initPack.gridY;
    this.x = initPack.x;
    this.y = initPack.y;
    this.HP = initPack.HP;
    this.isActive = initPack.isActive;

    //Graphics for the block health
    this.blockHPFull = null; //HP = 3
    this.blockHPHurt = null; //HP = 2
    this.blockHPWeak = null; //HP = 1

    //Graphics for the selections
    this.buildSelectionValid = null;
    this.shovelSelectionValid = null;
    this.selectionCannotAct = null;
    this.selectionInvalid = null;

    //Setup the block Graphics
    this.initializePrimitives();

    //Setup the Container for the block
    this.blockGraphics = null;
    this.initializeContainer();

  } //cBlock.constructor()

  initializePrimitives() {
    //The block graphics when at full health
    this.blockHPFull = new Graphics();
    this.blockHPFull.beginFill(0xC84B4B, 0.4);
    this.blockHPFull.lineStyle(1, 0x000000, 1);
    this.blockHPFull.drawRect(0, 0, 80, 80);
    this.blockHPFull.endFill();
    this.blockHPFull.visible = false;

    //The block graphics when hurt
    this.blockHPHurt = new Graphics();
    this.blockHPHurt.beginFill(0xC88282, 0.4);
    this.blockHPHurt.lineStyle(1, 0x000000, 1);
    this.blockHPHurt.drawRect(0, 0, 80, 80);
    this.blockHPHurt.endFill();
    this.blockHPHurt.visible = false;

    //The block graphics when nearly dead
    this.blockHPWeak = new Graphics();
    this.blockHPWeak.beginFill(0xC8AAAA, 0.4);
    this.blockHPWeak.lineStyle(1, 0x000000, 1);
    this.blockHPWeak.drawRect(0, 0, 80, 80);
    this.blockHPWeak.endFill();
    this.blockHPWeak.visible = false;

    //The block graphics when building selection is valid
    this.buildSelectionValid = new Graphics();
    this.buildSelectionValid.beginFill(0xC8C8C8, 0.2);
    this.buildSelectionValid.lineStyle(1, 0x000000, 1);
    this.buildSelectionValid.drawRect(0, 0, 80, 80);
    this.buildSelectionValid.endFill();
    this.buildSelectionValid.visible = false;

    //The block graphics when shovel selection is valid
    this.shovelSelectionValid = new Graphics();
    this.shovelSelectionValid.beginFill(0x00C800, 0.2);
    this.shovelSelectionValid.lineStyle(1, 0x000000, 1);
    this.shovelSelectionValid.drawRect(0, 0, 80, 80);
    this.shovelSelectionValid.endFill();
    this.shovelSelectionValid.visible = false;

    //The block graphics when selection valid, but cannot act
    this.selectionCannotAct = new Graphics();
    this.selectionCannotAct.beginFill(0xFFFF00, 0.2);
    this.selectionCannotAct.lineStyle(1, 0x000000, 1);
    this.selectionCannotAct.drawRect(0, 0, 80, 80);
    this.selectionCannotAct.endFill();
    this.selectionCannotAct.visible = false;
    
    //The block graphics when selection invalid
    this.selectionInvalid = new Graphics();
    this.selectionInvalid.beginFill(0xFF0000, 0.8);
    this.selectionInvalid.lineStyle(1, 0x000000, 1);
    this.selectionInvalid.drawRect(0, 0, 80, 80);
    this.selectionInvalid.endFill();
    this.selectionInvalid.visible = false;

  } //cBlock.initializePrimitives()

  initializeContainer() {
    this.blockGraphics = new Container();

    this.blockGraphics.addChild(this.blockHPFull);
    this.blockGraphics.addChild(this.blockHPHurt);
    this.blockGraphics.addChild(this.blockHPWeak);
    this.blockGraphics.addChild(this.buildSelectionValid);
    this.blockGraphics.addChild(this.shovelSelectionValid);
    this.blockGraphics.addChild(this.selectionCannotAct);
    this.blockGraphics.addChild(this.selectionInvalid);

    this.blockGraphics.position.set(this.x, this.y);
  } //cBlock.initializeContainer()

  drawSelf(xView, yView) {
    //If the block is not active, do not draw
    //TODO: Can move this out to before the draw call
    if( this.isActive === false ) {
      const x = this.x - xView;
      const y = this.y - yView;

      this.blockGraphics.position.set(x, y);
      return;
    }

    const x = this.x - xView;
    const y = this.y - yView;

    //Change the appearance based on it's health, darker = less health
    switch( this.HP ) {
      case 1:
        this.blockHPFull.visible = true;
        this.blockHPHurt.visible = false;
        this.blockHPWeak.visible = false;
        break;
      case 2:
        this.blockHPFull.visible = false;
        this.blockHPHurt.visible = true;
        this.blockHPWeak.visible = false;
        break;
      case 3:
        this.blockHPFull.visible = false;
        this.blockHPHurt.visible = false;
        this.blockHPWeak.visible = true;
        break;
    }

    this.blockGraphics.position.set(x, y);
  } //cBlock.drawSelf()

  drawSelection(xView, yView, isValidSelection, canAct, localPlayerMode) {
    if( localPlayerMode === 1 ) {
      if( isValidSelection === true && canAct === true ) {
        this.buildSelectionValid.visible = true;
        this.selectionCannotAct.visible = false;
        this.selectionInvalid.visible = false;
      } else if( isValidSelection === true && canAct === false ) {
        this.buildSelectionValid.visible = false;
        this.selectionCannotAct.visible = true;
        this.selectionInvalid.visible = false;
      } else {
        this.buildSelectionValid.visible = false;
        this.selectionCannotAct.visible = false;
        this.selectionInvalid.visible = true;
      }
    } else if( localPlayerMode === 2 ) {
      if( isValidSelection === true && canAct === true ) {
        this.shovelSelectionValid.visible = true;
      } else if( isValidSelection === true && canAct === false ) {
        this.selectionCannotAct.visible = true;
      } else {
        //No block to shovel, so it's the same as out of bounds
        return;
      }
    }
  } //cBlock.drawSelection()
} //class cBlock
