import Phaser from 'phaser';
import { GameState, LevelConfig, Cat, ExitGate, Obstacle } from '../logic/types';
import { createGameState, getCatMoveRange, applyMove, checkWinCondition } from '../logic/engine';
import { LEVELS } from '../levels/levelsData';
import { catSoundManager } from '../systems/sound';
import { ensureCatTextures } from './textures';

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
  private catsContainer!: Phaser.GameObjects.Container;
  private obstaclesContainer!: Phaser.GameObjects.Container;
  private tutorialContainer!: Phaser.GameObjects.Container;
  private guideGraphics!: Phaser.GameObjects.Graphics;
  private exitGateSprite!: Phaser.GameObjects.Sprite;
  private exitPulseTween?: Phaser.Tweens.Tween;

  // Active cat sprites mapped by cat.id
  private catSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();

  // Drag interaction state
  private activeDragCatId: string | null = null;
  private dragStartPixel: number = 0;
  private catInitialCoord: number = 0;
  private allowedRange: { min: number; max: number; canExit: boolean } = { min: 0, max: 0, canExit: false };
  private isAnimating = false;
  public static initialLevel?: LevelConfig;

  constructor() {
    super('CatGameScene');
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
    ensureCatTextures(this);

    if (!this.currentLevel) {
      this.currentLevel = GameScene.initialLevel || LEVELS[0]!;
    }

    // 2. Clean state
    this.gameState = createGameState(this.currentLevel);
    this.isAnimating = false;

    // 3. Create scene layout & containers
    this.createBoardLayout();
    this.createObstacles();
    this.createCats();
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
    this.activeDragCatId = null;
    this.hideDragGuide();

    // Reset game state to clean level config
    this.gameState = createGameState(this.currentLevel);

    // If cats already exist on the board, smoothly slide them back to start
    if (this.catSprites.size === this.gameState.cats.length) {
      for (const cat of this.gameState.cats) {
        const sprite = this.catSprites.get(cat.id);
        if (sprite) {
          this.tweens.add({
            targets: sprite,
            x: cat.x * this.TILE,
            y: cat.y * this.TILE,
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
      catSoundManager.playTap();
      if (this.eventsCallback.onMove) {
        this.eventsCallback.onMove(0);
      }
      if (this.eventsCallback.onStateUpdate) {
        this.eventsCallback.onStateUpdate(this.gameState);
      }
    } else {
      this.loadLevel(this.currentLevel);
      catSoundManager.playTap();
    }
  }

  public loadLevel(level: LevelConfig) {
    this.tweens.killAll();
    this.isAnimating = false;
    this.activeDragCatId = null;
    this.hideDragGuide();
    this.currentLevel = level;
    this.gameState = createGameState(level);
    this.createBoardLayout();
    this.createObstacles();
    this.createCats();
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

    const cat = this.gameState.cats.find(c => c.id === lastMove.catId);
    if (!cat) return;

    cat.x = lastMove.fromX;
    cat.y = lastMove.fromY;
    this.gameState.movesCount = Math.max(0, this.gameState.movesCount - 1);
    this.gameState.isCompleted = false;

    this.renderCatsFromState();
    this.checkExitGateStatus();
    this.setupIntroTutorial();

    if (this.eventsCallback.onMove) {
      this.eventsCallback.onMove(this.gameState.movesCount);
    }
    if (this.eventsCallback.onStateUpdate) {
      this.eventsCallback.onStateUpdate(this.gameState);
    }
    catSoundManager.playSlide();
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
        const cell = this.add.image(col * this.TILE, row * this.TILE, 'cat-yard-cell');
        cell.setOrigin(0, 0);
        this.boardContainer.add(cell);
      }
    }

    // Outer warm border frame
    const frameGraphics = this.add.graphics();
    frameGraphics.lineStyle(6, 0x475569, 1);
    frameGraphics.strokeRoundedRect(-3, -3, w * this.TILE + 6, h * this.TILE + 6, 12);
    this.boardContainer.add(frameGraphics);

    // Guide graphics for drag tracks
    if (this.guideGraphics) {
      this.guideGraphics.destroy();
    }
    this.guideGraphics = this.add.graphics();
    this.boardContainer.add(this.guideGraphics);

    // Cozy Cat Flap Exit Gate
    if (this.exitGateSprite) {
      this.exitGateSprite.destroy();
    }
    const exitY = this.gameState.exit.coordinate * this.TILE;
    const exitX = w * this.TILE + 2;

    this.exitGateSprite = this.add.sprite(
      this.boardOffsetX + exitX,
      this.boardOffsetY + exitY,
      'cat-exit-gate'
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
      const texKey = obs.type === 'yarn' 
        ? 'obstacle_yarn' 
        : obs.type === 'box' 
        ? 'obstacle_box' 
        : 'obstacle_scratching_post';

      const obstacleSprite = this.add.image(
        obs.x * this.TILE + this.TILE / 2,
        obs.y * this.TILE + this.TILE / 2,
        texKey
      );
      obstacleSprite.setOrigin(0.5, 0.5);
      this.obstaclesContainer.add(obstacleSprite);
    }
  }

  private createCats() {
    if (this.catsContainer) {
      this.catsContainer.destroy();
    }
    this.catsContainer = this.add.container(this.boardOffsetX, this.boardOffsetY);
    this.catSprites.clear();

    for (const cat of this.gameState.cats) {
      const texKey = `cat_${cat.breed}_${cat.orientation === 'horizontal' ? 'h' : 'v'}${cat.length}`;
      const sprite = this.add.sprite(
        cat.x * this.TILE,
        cat.y * this.TILE,
        texKey
      );
      sprite.setOrigin(0, 0);
      sprite.setInteractive({ useHandCursor: true });
      sprite.setData('catId', cat.id);

      this.input.setDraggable(sprite);
      this.catsContainer.add(sprite);
      this.catSprites.set(cat.id, sprite);

      this.setupCatInteractions(sprite, cat);
    }
  }

  private createTutorialLayer() {
    if (this.tutorialContainer) {
      this.tutorialContainer.destroy();
    }
    this.tutorialContainer = this.add.container(this.boardOffsetX, this.boardOffsetY);
  }

  /**
   * INTRO TUTORIAL: Pulsing highlight and bouncing arrow on the cat to move!
   */
  private setupIntroTutorial() {
    if (!this.tutorialContainer) return;
    this.tutorialContainer.removeAll(true);

    // Only active on Level 1 when not yet completed
    if (this.currentLevel.id !== 1 || this.gameState.isCompleted) return;

    const milo = this.gameState.cats.find(c => c.id === 'tabby1');
    const hero = this.gameState.cats.find(c => c.isHero);

    if (milo && milo.y <= 1) {
      // Step 1: Milo is blocking! Highlight Milo with a pulsing ring & arrow
      const px = milo.x * this.TILE;
      const py = milo.y * this.TILE;
      const pw = this.TILE;
      const ph = milo.length * this.TILE;

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

      // Bouncing tutorial arrow pointing DOWN
      const arrowGraphics = this.add.graphics();
      arrowGraphics.fillStyle(0x38bdf8, 1);
      // Down arrow polygon
      arrowGraphics.beginPath();
      arrowGraphics.moveTo(-10, -10);
      arrowGraphics.lineTo(10, -10);
      arrowGraphics.lineTo(10, 2);
      arrowGraphics.lineTo(18, 2);
      arrowGraphics.lineTo(0, 16);
      arrowGraphics.lineTo(-18, 2);
      arrowGraphics.lineTo(-10, 2);
      arrowGraphics.closePath();
      arrowGraphics.fill();

      arrowGraphics.x = px + pw / 2;
      arrowGraphics.y = py + ph + 24;
      this.tutorialContainer.add(arrowGraphics);

      this.tweens.add({
        targets: arrowGraphics,
        y: py + ph + 34,
        yoyo: true,
        repeat: -1,
        duration: 400,
        ease: 'Quad.easeInOut',
      });

      // Floating text prompt: "⬇️ SLIDE DOWN"
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
      // Step 2: Milo moved down! Highlight Luna and the exit runway!
      const hx = hero.x * this.TILE;
      const hy = hero.y * this.TILE;
      const hw = hero.length * this.TILE;
      const hh = this.TILE;

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

      const heroLabel = this.add.text(
        hx + hw / 2,
        hy - 16,
        '⭐ 2. SLIDE TO EXIT ➔',
        {
          fontFamily: 'Fredoka, Nunito, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#0f172a',
          backgroundColor: '#f59e0b',
          padding: { left: 8, right: 8, top: 4, bottom: 4 },
        }
      );
      heroLabel.setOrigin(0.5, 1);
      this.tutorialContainer.add(heroLabel);
    }
  }

  private setupCatInteractions(sprite: Phaser.GameObjects.Sprite, cat: Cat) {
    sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isAnimating || this.gameState.isCompleted) return;

      this.activeDragCatId = cat.id;
      const currentCoord = cat.orientation === 'horizontal' ? cat.x : cat.y;
      this.catInitialCoord = currentCoord;
      this.dragStartPixel = cat.orientation === 'horizontal' ? pointer.x : pointer.y;

      // Calculate legal sliding range in real time
      this.allowedRange = getCatMoveRange(this.gameState, cat.id);

      // Bring to top
      this.catsContainer.bringToTop(sprite);

      // Gentle squish animation & meow
      this.tweens.add({
        targets: sprite,
        scaleX: cat.orientation === 'horizontal' ? 1.03 : 0.97,
        scaleY: cat.orientation === 'horizontal' ? 0.97 : 1.03,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeInOut',
      });

      catSoundManager.playTap();
      if (Math.random() < 0.35) {
        catSoundManager.playMeow('soft');
      }

      this.drawDragGuide(cat, this.allowedRange);
    });

    sprite.on('drag', (pointer: Phaser.Input.Pointer) => {
      if (this.activeDragCatId !== cat.id || this.isAnimating || this.gameState.isCompleted) return;

      const isHoriz = cat.orientation === 'horizontal';
      const pointerPixel = isHoriz ? pointer.x : pointer.y;
      const pixelDelta = pointerPixel - this.dragStartPixel;
      const currentPixel = this.catInitialCoord * this.TILE + pixelDelta;

      const minPixel = this.allowedRange.min * this.TILE;
      const maxAllowedCoord = this.allowedRange.canExit 
        ? this.allowedRange.max + 1 
        : this.allowedRange.max;
      const maxPixel = maxAllowedCoord * this.TILE;

      // Dampen dragging beyond allowed bounds
      let clampedPixel = currentPixel;
      if (clampedPixel < minPixel) {
        clampedPixel = minPixel - Math.sqrt(Math.abs(minPixel - clampedPixel)) * 2;
      } else if (clampedPixel > maxPixel) {
        clampedPixel = maxPixel + Math.sqrt(Math.abs(clampedPixel - maxPixel)) * 2;
      }

      if (isHoriz) {
        sprite.x = clampedPixel;
      } else {
        sprite.y = clampedPixel;
      }
    });

    sprite.on('dragend', () => {
      if (this.activeDragCatId !== cat.id || this.isAnimating) return;

      this.hideDragGuide();
      this.activeDragCatId = null;

      const isHoriz = cat.orientation === 'horizontal';
      const currentPixel = isHoriz ? sprite.x : sprite.y;

      // Snap to nearest grid coordinate
      let targetCoord = Math.round(currentPixel / this.TILE);
      const minCoord = this.allowedRange.min;
      const maxCoord = this.allowedRange.max;

      // Check exit threshold
      let willExit = false;
      if (cat.isHero && this.allowedRange.canExit) {
        if (targetCoord >= maxCoord + 1 || (currentPixel / this.TILE) > maxCoord + 0.3) {
          willExit = true;
          targetCoord = maxCoord + 1;
        }
      }

      if (!willExit) {
        targetCoord = Math.max(minCoord, Math.min(maxCoord, targetCoord));
      }

      // Check if coordinate actually changed
      const originalCoord = isHoriz ? cat.x : cat.y;
      if (targetCoord !== originalCoord) {
        const { newState, result } = applyMove(this.gameState, cat.id, targetCoord);

        if (result.valid) {
          this.gameState = newState;
          catSoundManager.playSlide();

          if (this.eventsCallback.onMove) {
            this.eventsCallback.onMove(this.gameState.movesCount);
          }
          if (this.eventsCallback.onStateUpdate) {
            this.eventsCallback.onStateUpdate(this.gameState);
          }

          if (result.exited) {
            this.animateCatExit(sprite, cat);
            return;
          }
        }
      }

      // Smooth snap back
      this.isAnimating = true;
      this.tweens.add({
        targets: sprite,
        x: (isHoriz ? targetCoord : cat.x) * this.TILE,
        y: (isHoriz ? cat.y : targetCoord) * this.TILE,
        duration: 120,
        ease: 'Back.easeOut',
        easeParams: [1.2],
        onComplete: () => {
          this.isAnimating = false;
          this.checkExitGateStatus();
          this.setupIntroTutorial();
        },
      });
    });
  }

  private drawDragGuide(cat: Cat, range: { min: number; max: number; canExit: boolean }) {
    this.guideGraphics.clear();
    const isHoriz = cat.orientation === 'horizontal';

    this.guideGraphics.fillStyle(0x38bdf8, 0.15);
    this.guideGraphics.lineStyle(2, 0x38bdf8, 0.4);

    if (isHoriz) {
      const gx = range.min * this.TILE;
      const gy = cat.y * this.TILE;
      const gw = (range.max - range.min + cat.length) * this.TILE;
      const gh = this.TILE;
      this.guideGraphics.fillRoundedRect(gx + 2, gy + 2, gw - 4, gh - 4, 12);
      this.guideGraphics.strokeRoundedRect(gx + 2, gy + 2, gw - 4, gh - 4, 12);
    } else {
      const gx = cat.x * this.TILE;
      const gy = range.min * this.TILE;
      const gw = this.TILE;
      const gh = (range.max - range.min + cat.length) * this.TILE;
      this.guideGraphics.fillRoundedRect(gx + 2, gy + 2, gw - 4, gh - 4, 12);
      this.guideGraphics.strokeRoundedRect(gx + 2, gy + 2, gw - 4, gh - 4, 12);
    }
  }

  private hideDragGuide() {
    if (this.guideGraphics) {
      this.guideGraphics.clear();
    }
  }

  private checkExitGateStatus() {
    const hero = this.gameState.cats.find(c => c.isHero);
    if (!hero || !this.exitGateSprite) return;

    const range = getCatMoveRange(this.gameState, hero.id);
    if (range.canExit) {
      // Glow brightly when path is clear!
      this.exitGateSprite.setAlpha(1);
      if (!this.exitPulseTween) {
        this.exitPulseTween = this.tweens.add({
          targets: this.exitGateSprite,
          scaleX: 1.08,
          scaleY: 1.08,
          yoyo: true,
          repeat: -1,
          duration: 350,
          ease: 'Sine.easeInOut',
        });
      }
    } else {
      this.exitGateSprite.setAlpha(0.8);
      if (this.exitPulseTween) {
        this.exitPulseTween.stop();
        this.exitPulseTween = undefined;
        this.exitGateSprite.setScale(1);
      }
    }
  }

  private animateCatExit(sprite: Phaser.GameObjects.Sprite, cat: Cat) {
    this.isAnimating = true;
    catSoundManager.playGateWhoosh();

    const exitTargetX = (this.gameState.width + 1.5) * this.TILE;

    this.tweens.add({
      targets: sprite,
      x: exitTargetX,
      alpha: 0,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 380,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.triggerVictoryCelebration();
      },
    });
  }

  private triggerVictoryCelebration() {
    catSoundManager.playVictory();

    // Heart and star particles
    for (let i = 0; i < 28; i++) {
      const px = this.boardOffsetX + (this.gameState.width - 0.5) * this.TILE + (Math.random() * 40 - 20);
      const py = this.boardOffsetY + (this.gameState.exit.coordinate + 0.5) * this.TILE + (Math.random() * 40 - 20);

      const particle = this.add.text(px, py, Math.random() > 0.5 ? '⭐' : '🐾', {
        fontSize: `${16 + Math.floor(Math.random() * 12)}px`,
      });
      particle.setOrigin(0.5, 0.5);

      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 90;

      this.tweens.add({
        targets: particle,
        x: px + Math.cos(angle) * dist,
        y: py + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 700 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }

    this.time.delayedCall(450, () => {
      this.isAnimating = false;
      if (this.eventsCallback.onLevelComplete) {
        this.eventsCallback.onLevelComplete(
          this.currentLevel.id,
          this.gameState.movesCount,
          this.currentLevel.optimalMoves || 5
        );
      }
    });
  }

  private renderCatsFromState() {
    for (const cat of this.gameState.cats) {
      const sprite = this.catSprites.get(cat.id);
      if (sprite) {
        this.tweens.add({
          targets: sprite,
          x: cat.x * this.TILE,
          y: cat.y * this.TILE,
          duration: 120,
          ease: 'Cubic.easeOut',
        });
      }
    }
  }
}
