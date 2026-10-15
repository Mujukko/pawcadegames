import Phaser from 'phaser';
import { GameState, LevelConfig, Dog, ExitGate, Obstacle } from '../logic/types';
import { createGameState, getDogMoveRange, moveDog, isWinningState } from '../logic/engine';
import { LEVELS } from '../levels/levelsData';
import { soundManager } from '../systems/sound';

export interface GameSceneEvents {
  onMove?: (movesCount: number) => void;
  onLevelComplete?: (levelId: number, movesCount: number, optimalMoves: number) => void;
  onStateUpdate?: (state: GameState) => void;
}

export class GameScene extends Phaser.Scene {
  private currentLevel!: LevelConfig;
  private gameState!: GameState;
  private eventsCallback: GameSceneEvents = {};

  // Display metrics
  private readonly TILE = 80;
  private boardOffsetX = 25;
  private boardOffsetY = 25;

  // Visual containers
  private boardContainer!: Phaser.GameObjects.Container;
  private dogsContainer!: Phaser.GameObjects.Container;
  private obstaclesContainer!: Phaser.GameObjects.Container;
  private exitGateSprite!: Phaser.GameObjects.Sprite;
  private exitPulseTween?: Phaser.Tweens.Tween;

  // Active dog sprites mapped by dog.id
  private dogSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();

  // Drag interaction state
  private activeDragDogId: string | null = null;
  private dragStartPixel: number = 0;
  private dogInitialCoord: number = 0;
  private allowedRange: { min: number; max: number; canExit: boolean } = { min: 0, max: 0, canExit: false };
  private isAnimating = false;

  constructor() {
    super('GameScene');
  }

  public init(data?: { level?: LevelConfig; callbacks?: GameSceneEvents }) {
    if (data?.level) {
      this.currentLevel = data.level;
    } else if (!this.currentLevel) {
      this.currentLevel = LEVELS[0]!;
    }

    if (data?.callbacks) {
      this.eventsCallback = data.callbacks;
    }
  }

  create() {
    if (!this.currentLevel) {
      this.currentLevel = LEVELS[0]!;
    }

    // Clean state
    this.gameState = createGameState(this.currentLevel);
    this.isAnimating = false;

    // Create scene layout
    this.createBoardLayout();
    this.createObstacles();
    this.createDogs();
    this.checkExitGateStatus();

    // Notify React
    if (this.eventsCallback.onStateUpdate) {
      this.eventsCallback.onStateUpdate(this.gameState);
    }
  }

  public setCallbacks(callbacks: GameSceneEvents) {
    this.eventsCallback = callbacks;
  }

  public restartLevel() {
    if (this.isAnimating) return;
    this.gameState = createGameState(this.currentLevel);
    this.renderDogsFromState();
    this.checkExitGateStatus();
    if (this.eventsCallback.onMove) {
      this.eventsCallback.onMove(0);
    }
    if (this.eventsCallback.onStateUpdate) {
      this.eventsCallback.onStateUpdate(this.gameState);
    }
    soundManager.playTap();
  }

  public loadLevel(level: LevelConfig) {
    this.currentLevel = level;
    this.gameState = createGameState(level);
    this.isAnimating = false;
    this.createBoardLayout();
    this.createObstacles();
    this.createDogs();
    this.checkExitGateStatus();
    if (this.eventsCallback.onMove) {
      this.eventsCallback.onMove(0);
    }
    if (this.eventsCallback.onStateUpdate) {
      this.eventsCallback.onStateUpdate(this.gameState);
    }
  }

  public undoMove() {
    if (this.isAnimating || this.gameState.history.length === 0) return;
    const lastMove = this.gameState.history.pop();
    if (!lastMove) return;

    const dog = this.gameState.dogs.find(d => d.id === lastMove.dogId);
    if (!dog) return;

    dog.x = lastMove.fromX;
    dog.y = lastMove.fromY;
    this.gameState.movesCount = Math.max(0, this.gameState.movesCount - 1);
    this.gameState.isCompleted = false;

    this.renderDogsFromState();
    this.checkExitGateStatus();
    if (this.eventsCallback.onMove) {
      this.eventsCallback.onMove(this.gameState.movesCount);
    }
    if (this.eventsCallback.onStateUpdate) {
      this.eventsCallback.onStateUpdate(this.gameState);
    }
    soundManager.playSlide();
  }

  private createBoardLayout() {
    if (this.boardContainer) {
      this.boardContainer.destroy();
    }
    this.boardContainer = this.add.container(this.boardOffsetX, this.boardOffsetY);

    const w = this.gameState.width;
    const h = this.gameState.height;

    // Grid cells
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const cell = this.add.image(col * this.TILE, row * this.TILE, 'yard-cell');
        cell.setOrigin(0, 0);
        this.boardContainer.add(cell);
      }
    }

    // Outer border frame
    const frameGraphics = this.add.graphics();
    frameGraphics.lineStyle(6, 0x334155, 1);
    frameGraphics.strokeRoundedRect(-3, -3, w * this.TILE + 6, h * this.TILE + 6, 12);
    this.boardContainer.add(frameGraphics);

    // Exit Gate
    if (this.exitGateSprite) {
      this.exitGateSprite.destroy();
    }
    const exitY = this.gameState.exit.coordinate * this.TILE;
    const exitX = w * this.TILE + 2;

    this.exitGateSprite = this.add.sprite(
      this.boardOffsetX + exitX,
      this.boardOffsetY + exitY,
      'exit-gate'
    );
    this.exitGateSprite.setOrigin(0, 0);
    this.exitGateSprite.setAlpha(0.65);
  }

  private createObstacles() {
    if (this.obstaclesContainer) {
      this.obstaclesContainer.destroy();
    }
    this.obstaclesContainer = this.add.container(this.boardOffsetX, this.boardOffsetY);

    for (const obs of this.gameState.obstacles) {
      const hydrant = this.add.image(
        obs.x * this.TILE + this.TILE / 2,
        obs.y * this.TILE + this.TILE / 2,
        'obstacle-hydrant'
      );
      hydrant.setOrigin(0.5, 0.5);
      this.obstaclesContainer.add(hydrant);
    }
  }

  private createDogs() {
    if (this.dogsContainer) {
      this.dogsContainer.destroy();
    }
    this.dogsContainer = this.add.container(this.boardOffsetX, this.boardOffsetY);
    this.dogSprites.clear();

    for (const dog of this.gameState.dogs) {
      const texKey = `dog_${dog.breed}_${dog.orientation === 'horizontal' ? 'h' : 'v'}${dog.length}`;
      const sprite = this.add.sprite(
        dog.x * this.TILE,
        dog.y * this.TILE,
        texKey
      );
      sprite.setOrigin(0, 0);
      sprite.setInteractive({ useHandCursor: true });

      // Attach dog model data
      sprite.setData('dogId', dog.id);

      this.input.setDraggable(sprite);
      this.dogsContainer.add(sprite);
      this.dogSprites.set(dog.id, sprite);

      // Setup drag events
      this.setupDogInteractions(sprite, dog);
    }
  }

  private setupDogInteractions(sprite: Phaser.GameObjects.Sprite, dog: Dog) {
    sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isAnimating || this.gameState.isCompleted) return;

      this.activeDragDogId = dog.id;
      this.allowedRange = getDogMoveRange(this.gameState, dog.id);
      this.dragStartPixel = dog.orientation === 'horizontal' ? pointer.x : pointer.y;
      this.dogInitialCoord = dog.orientation === 'horizontal' ? dog.x : dog.y;

      // Bring to front inside dogsContainer
      this.dogsContainer.bringToTop(sprite);

      // Micro bounce feedback
      this.tweens.add({
        targets: sprite,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeInOut',
      });

      soundManager.playTap();
    });

    sprite.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.isAnimating || this.gameState.isCompleted || this.activeDragDogId !== dog.id) return;

      const currentLiveDog = this.gameState.dogs.find(d => d.id === dog.id)!;
      if (currentLiveDog.orientation === 'horizontal') {
        const deltaX = pointer.x - this.dragStartPixel;
        const initialPixelX = this.dogInitialCoord * this.TILE;
        const targetPixelX = initialPixelX + deltaX;

        const minPixelX = this.allowedRange.min * this.TILE;
        let maxPixelX = this.allowedRange.max * this.TILE;
        if (currentLiveDog.isHero && this.allowedRange.canExit) {
          maxPixelX = this.gameState.width * this.TILE; // allow dragging out
        }

        const clampedPixelX = Phaser.Math.Clamp(targetPixelX, minPixelX, maxPixelX);
        sprite.x = clampedPixelX;
      } else {
        const deltaY = pointer.y - this.dragStartPixel;
        const initialPixelY = this.dogInitialCoord * this.TILE;
        const targetPixelY = initialPixelY + deltaY;

        const minPixelY = this.allowedRange.min * this.TILE;
        const maxPixelY = this.allowedRange.max * this.TILE;

        const clampedPixelY = Phaser.Math.Clamp(targetPixelY, minPixelY, maxPixelY);
        sprite.y = clampedPixelY;
      }
    });

    sprite.on('dragend', () => {
      if (this.isAnimating || this.gameState.isCompleted || this.activeDragDogId !== dog.id) return;
      this.activeDragDogId = null;

      const currentLiveDog = this.gameState.dogs.find(d => d.id === dog.id)!;

      if (currentLiveDog.orientation === 'horizontal') {
        const currentPixelX = sprite.x;
        const snappedCoord = Math.round(currentPixelX / this.TILE);

        // Check if Hero completed exit
        if (currentLiveDog.isHero && this.allowedRange.canExit && snappedCoord >= this.gameState.width - currentLiveDog.length) {
          this.executeHeroExit(sprite, currentLiveDog);
          return;
        }

        // Clamp to board bounds
        const legalCoord = Phaser.Math.Clamp(snappedCoord, this.allowedRange.min, this.allowedRange.max);

        if (legalCoord !== this.dogInitialCoord) {
          // Valid move
          const result = moveDog(this.gameState, dog.id, legalCoord);
          if (result.success) {
            this.gameState = result.state;
            this.animateSnap(sprite, legalCoord * this.TILE, sprite.y);
            soundManager.playSlide();

            if (this.eventsCallback.onMove) {
              this.eventsCallback.onMove(this.gameState.movesCount);
            }
            if (this.eventsCallback.onStateUpdate) {
              this.eventsCallback.onStateUpdate(this.gameState);
            }
            this.checkExitGateStatus();
          } else {
            this.animateBumpBack(sprite, this.dogInitialCoord * this.TILE, sprite.y);
          }
        } else {
          // Snapped back to same spot
          this.animateSnap(sprite, this.dogInitialCoord * this.TILE, sprite.y);
        }
      } else {
        // Vertical
        const currentPixelY = sprite.y;
        const snappedCoord = Math.round(currentPixelY / this.TILE);
        const legalCoord = Phaser.Math.Clamp(snappedCoord, this.allowedRange.min, this.allowedRange.max);

        if (legalCoord !== this.dogInitialCoord) {
          const result = moveDog(this.gameState, dog.id, legalCoord);
          if (result.success) {
            this.gameState = result.state;
            this.animateSnap(sprite, sprite.x, legalCoord * this.TILE);
            soundManager.playSlide();

            if (this.eventsCallback.onMove) {
              this.eventsCallback.onMove(this.gameState.movesCount);
            }
            if (this.eventsCallback.onStateUpdate) {
              this.eventsCallback.onStateUpdate(this.gameState);
            }
            this.checkExitGateStatus();
          } else {
            this.animateBumpBack(sprite, sprite.x, this.dogInitialCoord * this.TILE);
          }
        } else {
          this.animateSnap(sprite, sprite.x, this.dogInitialCoord * this.TILE);
        }
      }
    });
  }

  private animateSnap(sprite: Phaser.GameObjects.Sprite, targetX: number, targetY: number) {
    this.isAnimating = true;
    this.tweens.add({
      targets: sprite,
      x: targetX,
      y: targetY,
      duration: 120,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.isAnimating = false;
      },
    });
  }

  private animateBumpBack(sprite: Phaser.GameObjects.Sprite, originX: number, originY: number) {
    this.isAnimating = true;
    soundManager.playBump();
    this.tweens.add({
      targets: sprite,
      x: originX,
      y: originY,
      duration: 160,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.isAnimating = false;
      },
    });
  }

  private checkExitGateStatus() {
    const hero = this.gameState.dogs.find(d => d.isHero);
    if (!hero || !this.exitGateSprite) return;

    const range = getDogMoveRange(this.gameState, hero.id);
    if (range.canExit) {
      // Clear path to exit gate!
      if (!this.exitPulseTween) {
        this.exitPulseTween = this.tweens.add({
          targets: this.exitGateSprite,
          alpha: { from: 0.5, to: 1.0 },
          scaleX: { from: 1.0, to: 1.15 },
          yoyo: true,
          repeat: -1,
          duration: 400,
          ease: 'Sine.easeInOut',
        });
      }
    } else {
      if (this.exitPulseTween) {
        this.exitPulseTween.stop();
        this.exitPulseTween = undefined;
        this.exitGateSprite.setAlpha(0.65);
        this.exitGateSprite.setScale(1.0);
      }
    }
  }

  private executeHeroExit(heroSprite: Phaser.GameObjects.Sprite, heroDog: Dog) {
    this.isAnimating = true;
    this.gameState.movesCount += 1;
    this.gameState.isCompleted = true;

    // Slide out through gate
    const exitPixelX = (this.gameState.width + 1) * this.TILE;
    this.tweens.add({
      targets: heroSprite,
      x: exitPixelX,
      duration: 550,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.triggerVictoryCelebration();
      },
    });

    soundManager.playWin();
  }

  private triggerVictoryCelebration() {
    // Spawn celebratory particles (stars and paws)
    const centerX = this.boardOffsetX + (this.gameState.width * this.TILE) / 2;
    const centerY = this.boardOffsetY + (this.gameState.height * this.TILE) / 2;

    for (let i = 0; i < 28; i++) {
      const tex = i % 2 === 0 ? 'particle-star' : 'particle-paw';
      const p = this.add.image(centerX, centerY, tex);
      p.setScale(Phaser.Math.FloatBetween(0.8, 1.4));

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(120, 320);
      const destX = centerX + Math.cos(angle) * speed;
      const destY = centerY + Math.sin(angle) * speed;

      this.tweens.add({
        targets: p,
        x: destX,
        y: destY,
        alpha: { from: 1, to: 0 },
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(700, 1100),
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }

    // Notify React layer
    if (this.eventsCallback.onLevelComplete) {
      this.eventsCallback.onLevelComplete(
        this.currentLevel.id,
        this.gameState.movesCount,
        this.currentLevel.optimalMoves || this.gameState.movesCount
      );
    }
  }

  private renderDogsFromState() {
    for (const dog of this.gameState.dogs) {
      const sprite = this.dogSprites.get(dog.id);
      if (sprite) {
        sprite.setPosition(dog.x * this.TILE, dog.y * this.TILE);
      }
    }
  }
}
