import Phaser from 'phaser';
import { GameState, LevelConfig, Dog, ExitGate, Obstacle } from '../logic/types';
import { createGameState, getDogMoveRange, moveDog, isWinningState } from '../logic/engine';
import { LEVELS } from '../levels/levelsData';
import { soundManager } from '../systems/sound';
import { ensureDogTextures } from './textures';

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
  private boardOffsetX = 14;
  private boardOffsetY = 30;

  // Visual containers
  private boardContainer!: Phaser.GameObjects.Container;
  private dogsContainer!: Phaser.GameObjects.Container;
  private obstaclesContainer!: Phaser.GameObjects.Container;
  private tutorialContainer!: Phaser.GameObjects.Container;
  private guideGraphics!: Phaser.GameObjects.Graphics;
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
  public static initialLevel?: LevelConfig;

  constructor() {
    super('GameScene');
  }

  public init(data?: { level?: LevelConfig; callbacks?: GameSceneEvents }) {
    if (data?.level) {
      this.currentLevel = data.level;
    } else if (GameScene.initialLevel) {
      this.currentLevel = GameScene.initialLevel;
    } else if (!this.currentLevel) {
      this.currentLevel = LEVELS[0]!;
    }

    if (data?.callbacks) {
      this.eventsCallback = data.callbacks;
    }
  }

  public getCurrentLevel(): LevelConfig {
    return this.currentLevel;
  }

  create() {
    // 1. Ensure all procedural canvas textures exist
    ensureDogTextures(this);

    if (!this.currentLevel) {
      this.currentLevel = GameScene.initialLevel || LEVELS[0]!;
    }

    // 2. Clean state
    this.gameState = createGameState(this.currentLevel);
    this.isAnimating = false;

    // 3. Create scene layout & containers
    this.createBoardLayout();
    this.createObstacles();
    this.createDogs();
    this.createTutorialLayer();
    this.checkExitGateStatus();

    // 4. Setup Intro Tutorial if on Level 1
    this.setupIntroTutorial();

    // 5. Notify React
    if (this.eventsCallback.onStateUpdate) {
      this.eventsCallback.onStateUpdate(this.gameState);
    }
  }

  public setCallbacks(callbacks: GameSceneEvents) {
    this.eventsCallback = callbacks;
  }

  public restartLevel() {
    this.tweens.killAll();
    this.isAnimating = false;
    this.activeDragDogId = null;
    this.hideDragGuide();

    // Reset game state to clean level config
    this.gameState = createGameState(this.currentLevel);

    // If dogs already exist on the board, smoothly slide them back to start
    if (this.dogSprites.size === this.gameState.dogs.length) {
      for (const dog of this.gameState.dogs) {
        const sprite = this.dogSprites.get(dog.id);
        if (sprite) {
          this.tweens.add({
            targets: sprite,
            x: dog.x * this.TILE,
            y: dog.y * this.TILE,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 180,
            ease: 'Cubic.easeOut',
          });
        }
      }
      this.checkExitGateStatus();
      this.setupIntroTutorial();
      soundManager.playTap();
      if (this.eventsCallback.onMove) {
        this.eventsCallback.onMove(0);
      }
      if (this.eventsCallback.onStateUpdate) {
        this.eventsCallback.onStateUpdate(this.gameState);
      }
    } else {
      this.loadLevel(this.currentLevel);
      soundManager.playTap();
    }
  }

  public loadLevel(level: LevelConfig) {
    this.tweens.killAll();
    this.isAnimating = false;
    this.activeDragDogId = null;
    this.hideDragGuide();
    this.currentLevel = level;
    this.gameState = createGameState(level);
    this.createBoardLayout();
    this.createObstacles();
    this.createDogs();
    this.createTutorialLayer();
    this.checkExitGateStatus();
    this.setupIntroTutorial();
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
    this.setupIntroTutorial();

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

    // Outer fence border frame
    const frameGraphics = this.add.graphics();
    frameGraphics.lineStyle(6, 0x334155, 1);
    frameGraphics.strokeRoundedRect(-3, -3, w * this.TILE + 6, h * this.TILE + 6, 12);
    this.boardContainer.add(frameGraphics);

    // Guide graphics for drag tracks
    if (this.guideGraphics) {
      this.guideGraphics.destroy();
    }
    this.guideGraphics = this.add.graphics();
    this.boardContainer.add(this.guideGraphics);

    // Golden Kennel Exit Gate
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
    this.exitGateSprite.setAlpha(0.85);
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
      sprite.setData('dogId', dog.id);

      this.input.setDraggable(sprite);
      this.dogsContainer.add(sprite);
      this.dogSprites.set(dog.id, sprite);

      this.setupDogInteractions(sprite, dog);
    }
  }

  private createTutorialLayer() {
    if (this.tutorialContainer) {
      this.tutorialContainer.destroy();
    }
    this.tutorialContainer = this.add.container(this.boardOffsetX, this.boardOffsetY);
  }

  /**
   * INTRO TUTORIAL: Pulsing highlight and bouncing arrow on the dog to move!
   */
  private setupIntroTutorial() {
    if (!this.tutorialContainer) return;
    this.tutorialContainer.removeAll(true);

    // Only active on Level 1 when not yet completed
    if (this.currentLevel.id !== 1 || this.gameState.isCompleted) return;

    const barnaby = this.gameState.dogs.find(d => d.id === 'pug1');
    const hero = this.gameState.dogs.find(d => d.isHero);

    if (barnaby && barnaby.y <= 1) {
      // Step 1: Barnaby is blocking! Highlight Barnaby with a pulsing ring & arrow
      const px = barnaby.x * this.TILE;
      const py = barnaby.y * this.TILE;
      const pw = this.TILE;
      const ph = barnaby.length * this.TILE;

      // 1. Pulsing highlight rectangle around Barnaby
      const pulseRect = this.add.graphics();
      pulseRect.lineStyle(4, 0x38bdf8, 1);
      pulseRect.fillStyle(0x38bdf8, 0.2);
      pulseRect.fillRoundedRect(px - 4, py - 4, pw + 8, ph + 8, 16);
      pulseRect.strokeRoundedRect(px - 4, py - 4, pw + 8, ph + 8, 16);
      this.tutorialContainer.add(pulseRect);

      this.tweens.add({
        targets: pulseRect,
        alpha: { from: 0.35, to: 1.0 },
        scaleX: { from: 1.0, to: 1.04 },
        scaleY: { from: 1.0, to: 1.04 },
        yoyo: true,
        repeat: -1,
        duration: 500,
        ease: 'Sine.easeInOut',
      });

      // 2. Bouncing tutorial arrow pointing DOWN
      const arrow = this.add.image(px + pw / 2, py + ph + 24, 'tutorial-arrow');
      arrow.setOrigin(0.5, 0.5);
      this.tutorialContainer.add(arrow);

      this.tweens.add({
        targets: arrow,
        y: py + ph + 34,
        yoyo: true,
        repeat: -1,
        duration: 400,
        ease: 'Quad.easeInOut',
      });

      // 3. Floating text prompt: "1. AŞAĞI KAYDIR / SLIDE DOWN"
      const textLabel = this.add.text(
        px + pw / 2,
        py - 16,
        '⬇️ SLIDE DOWN',
        {
          fontFamily: 'Fredoka, Nunito, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#ffffff',
          backgroundColor: '#0284c7',
          padding: { left: 8, right: 8, top: 4, bottom: 4 },
        }
      );
      textLabel.setOrigin(0.5, 1);
      this.tutorialContainer.add(textLabel);
    } else if (hero && !this.gameState.isCompleted) {
      // Step 2: Barnaby was moved down! Highlight Sunny and the exit runway!
      const hx = hero.x * this.TILE;
      const hy = hero.y * this.TILE;
      const hw = hero.length * this.TILE;
      const hh = this.TILE;

      // Golden pulsing aura around Sunny
      const heroPulse = this.add.graphics();
      heroPulse.lineStyle(4, 0xf59e0b, 1);
      heroPulse.fillStyle(0xf59e0b, 0.25);
      heroPulse.fillRoundedRect(hx - 4, hy - 4, hw + 8, hh + 8, 16);
      heroPulse.strokeRoundedRect(hx - 4, hy - 4, hw + 8, hh + 8, 16);
      this.tutorialContainer.add(heroPulse);

      this.tweens.add({
        targets: heroPulse,
        alpha: { from: 0.4, to: 1.0 },
        yoyo: true,
        repeat: -1,
        duration: 450,
        ease: 'Sine.easeInOut',
      });

      // Floating text prompt on Sunny: "⭐ TO THE EXIT ➔"
      const heroLabel = this.add.text(
        hx + hw / 2,
        hy - 16,
        '⭐ 2. SLIDE TO EXIT ➔',
        {
          fontFamily: 'Fredoka, Nunito, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#ffffff',
          backgroundColor: '#ea580c',
          padding: { left: 8, right: 8, top: 4, bottom: 4 },
        }
      );
      heroLabel.setOrigin(0.5, 1);
      this.tutorialContainer.add(heroLabel);
    }
  }

  private showDragGuide(dog: Dog, range: { min: number; max: number; canExit: boolean }) {
    if (!this.guideGraphics) return;
    this.guideGraphics.clear();

    const color = dog.isHero ? 0xf59e0b : 0x6366f1;
    this.guideGraphics.fillStyle(color, 0.15);
    this.guideGraphics.lineStyle(2.5, color, 0.6);

    if (dog.orientation === 'horizontal') {
      const minX = range.min * this.TILE;
      let maxX = (range.max + dog.length) * this.TILE;
      if (dog.isHero && range.canExit) {
        maxX = (this.gameState.width + 1) * this.TILE;
      }
      const y = dog.y * this.TILE + 4;
      const h = this.TILE - 8;

      this.guideGraphics.fillRoundedRect(minX + 4, y, maxX - minX - 8, h, 12);
      this.guideGraphics.strokeRoundedRect(minX + 4, y, maxX - minX - 8, h, 12);
    } else {
      const minY = range.min * this.TILE;
      const maxY = (range.max + dog.length) * this.TILE;
      const x = dog.x * this.TILE + 4;
      const w = this.TILE - 8;

      this.guideGraphics.fillRoundedRect(x, minY + 4, w, maxY - minY - 8, 12);
      this.guideGraphics.strokeRoundedRect(x, minY + 4, w, maxY - minY - 8, 12);
    }
  }

  private hideDragGuide() {
    if (this.guideGraphics) {
      this.guideGraphics.clear();
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

      // Show allowed slide track guide
      this.showDragGuide(dog, this.allowedRange);

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
      this.hideDragGuide();

      const currentLiveDog = this.gameState.dogs.find(d => d.id === dog.id)!;

      if (currentLiveDog.orientation === 'horizontal') {
        const currentPixelX = sprite.x;
        const snappedCoord = Math.round(currentPixelX / this.TILE);

        // Check if Hero completed exit
        if (currentLiveDog.isHero && this.allowedRange.canExit && snappedCoord >= this.gameState.width - currentLiveDog.length) {
          if (this.tutorialContainer) this.tutorialContainer.removeAll(true);
          this.executeHeroExit(sprite, currentLiveDog);
          return;
        }

        // Clamp to board bounds
        const legalCoord = Phaser.Math.Clamp(snappedCoord, this.allowedRange.min, this.allowedRange.max);

        if (legalCoord !== this.dogInitialCoord) {
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
            this.setupIntroTutorial();
          } else {
            this.animateBumpBack(sprite, this.dogInitialCoord * this.TILE, sprite.y);
          }
        } else {
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
            this.setupIntroTutorial();
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
      if (!this.exitPulseTween) {
        this.exitPulseTween = this.tweens.add({
          targets: this.exitGateSprite,
          alpha: { from: 0.6, to: 1.0 },
          scaleX: { from: 1.0, to: 1.12 },
          yoyo: true,
          repeat: -1,
          duration: 350,
          ease: 'Sine.easeInOut',
        });
      }
    } else {
      if (this.exitPulseTween) {
        this.exitPulseTween.stop();
        this.exitPulseTween = undefined;
        this.exitGateSprite.setAlpha(0.85);
        this.exitGateSprite.setScale(1.0);
      }
    }
  }

  private executeHeroExit(heroSprite: Phaser.GameObjects.Sprite, heroDog: Dog) {
    this.isAnimating = true;
    this.gameState.movesCount += 1;
    this.gameState.isCompleted = true;

    // Slide out through gate with happy celebratory hops
    const exitPixelX = (this.gameState.width + 1) * this.TILE;
    this.tweens.add({
      targets: heroSprite,
      x: exitPixelX,
      duration: 550,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.isAnimating = false;
        this.triggerVictoryCelebration();
      },
    });

    // Joyful hopping bounce
    this.tweens.add({
      targets: heroSprite,
      y: heroSprite.y - 12,
      duration: 130,
      yoyo: true,
      repeat: 2,
      ease: 'Quad.easeInOut',
    });

    // Gate sparkle burst
    const gateX = this.boardOffsetX + (this.gameState.width * this.TILE);
    const gateY = this.boardOffsetY + (this.gameState.exit.coordinate * this.TILE) + this.TILE / 2;

    for (let i = 0; i < 20; i++) {
      const tex = i % 2 === 0 ? 'particle-star' : 'particle-paw';
      const p = this.add.image(gateX, gateY, tex);
      p.setScale(Phaser.Math.FloatBetween(0.7, 1.4));

      const angle = Phaser.Math.FloatBetween(-Math.PI * 0.4, Math.PI * 0.4);
      const speed = Phaser.Math.FloatBetween(100, 280);
      const destX = gateX + Math.cos(angle) * speed;
      const destY = gateY + Math.sin(angle) * speed;

      this.tweens.add({
        targets: p,
        x: destX,
        y: destY,
        alpha: { from: 1, to: 0 },
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(450, 850),
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }

    soundManager.playWin();
  }

  private triggerVictoryCelebration() {
    // Spawn celebratory particles across the yard
    const centerX = this.boardOffsetX + (this.gameState.width * this.TILE) / 2;
    const centerY = this.boardOffsetY + (this.gameState.height * this.TILE) / 2;

    for (let i = 0; i < 48; i++) {
      const tex = i % 2 === 0 ? 'particle-star' : 'particle-paw';
      const p = this.add.image(centerX, centerY, tex);
      p.setScale(Phaser.Math.FloatBetween(0.8, 1.6));

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(120, 380);
      const destX = centerX + Math.cos(angle) * speed;
      const destY = centerY + Math.sin(angle) * speed;

      this.tweens.add({
        targets: p,
        x: destX,
        y: destY,
        alpha: { from: 1, to: 0 },
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(600, 1200),
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }

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
