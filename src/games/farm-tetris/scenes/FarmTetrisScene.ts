import Phaser from 'phaser';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  createInitialState,
  hardDrop,
  holdPieceAction,
  movePiece,
  rotatePiece,
  softDrop,
} from '../logic/engine';
import { TetrisGameState, TetrominoType } from '../logic/types';
import { tetrisSoundManager } from '../systems/sound';
import { ensureTetrisTextures } from './textures';

export interface FarmTetrisSceneEvents {
  onStateUpdate?: (state: TetrisGameState) => void;
  onGameOver?: (score: number, lines: number, silos: number) => void;
}

export class FarmTetrisScene extends Phaser.Scene {
  private gameState!: TetrisGameState;
  private eventsCallback: FarmTetrisSceneEvents = {};

  // Timing / Tick
  private lastDropTime: number = 0;
  private isAutoDropping: boolean = true;

  // Visual Display Objects
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private siloGraphics!: Phaser.GameObjects.Graphics;
  private farmerSprite!: Phaser.GameObjects.Image;
  private farmerSpeechContainer!: Phaser.GameObjects.Container;
  private farmerSpeechText!: Phaser.GameObjects.Text;
  private farmerSpeechBg!: Phaser.GameObjects.Graphics;
  private hayParticleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private backgroundScenery?: Phaser.GameObjects.Image;
  private windmillBlades?: Phaser.GameObjects.Image;
  private backgroundClouds: Phaser.GameObjects.Image[] = [];

  // Silo Visual Progress
  private visualSiloPercent: number = 0;

  // Farmer Animation State
  private farmerReactionTimer?: Phaser.Time.TimerEvent;

  // Grid Layout Constants
  private readonly BLOCK_SIZE = 28;
  private readonly BOARD_X = 135;
  private readonly BOARD_Y = 12;

  // Silo Layout Constants
  private readonly SILO_X = 435;
  private readonly SILO_Y = 100;
  private readonly SILO_W = 120;
  private readonly SILO_H = 460;

  // Key Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyC!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private keyR!: Phaser.Input.Keyboard.Key;

  // Key repeat timers
  private lastLeftRepeat = 0;
  private lastRightRepeat = 0;
  private lastDownRepeat = 0;

  constructor() {
    super('FarmTetrisScene');
  }

  public init(data?: { callbacks?: FarmTetrisSceneEvents }) {
    if (data?.callbacks) {
      this.eventsCallback = data.callbacks;
    }
  }

  create() {
    // 1. Procedural textures
    ensureTetrisTextures(this);

    // 2. Initialize Game Logic State
    let savedHighScore = 0;
    try {
      const saved = localStorage.getItem('pawcade_farm_tetris_highscore');
      if (saved) savedHighScore = parseInt(saved, 10) || 0;
    } catch {}

    this.gameState = createInitialState(savedHighScore);
    this.visualSiloPercent = this.gameState.siloProgress;

    // 3. Rustic Barn Wood Background
    this.createBarnBackground();

    // 4. Graphics layers
    this.boardGraphics = this.add.graphics();
    this.boardGraphics.setDepth(2);
    this.siloGraphics = this.add.graphics();
    this.siloGraphics.setDepth(3);

    // 5. Silo Dome Roof & Cute Farmer on Top
    this.createSiloAndFarmer();

    // 6. Flying Hay Particle Emitter
    if (this.textures.exists('particle_hay')) {
      this.hayParticleEmitter = this.add.particles(0, 0, 'particle_hay', {
        lifespan: { min: 450, max: 750 },
        speed: { min: 140, max: 280 },
        scale: { start: 1.2, end: 0.4 },
        rotate: { min: 0, max: 360 },
        alpha: { start: 1, end: 0 },
        gravityY: 120,
        emitting: false,
      });
      this.hayParticleEmitter.setDepth(15);
    }

    // 7. Keyboard Input setup
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
      this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

      // Single-press Actions
      this.cursors.up.on('down', () => this.handleRotate(1));
      this.keyW.on('down', () => this.handleRotate(1));

      this.keySpace.on('down', () => this.handleHardDrop());
      this.keyC.on('down', () => this.handleHold());
      this.keyShift.on('down', () => this.handleHold());
      this.keyR.on('down', () => this.restartGame());
    }

    // Initial render
    this.renderAll();
  }

  public setCallbacks(callbacks: FarmTetrisSceneEvents) {
    this.eventsCallback = callbacks;
  }

  private createBarnBackground() {
    // 1. Dark rustic barn wall base gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a120c, 0x1a120c, 0x100b07, 0x100b07, 1);
    bg.fillRect(0, 0, 580, 580);

    // Subtle wooden plank seams
    bg.lineStyle(1.2, 0x2e1e14, 0.35);
    for (let x = 0; x < 580; x += 40) {
      bg.beginPath();
      bg.moveTo(x, 0);
      bg.lineTo(x, 580);
      bg.stroke();
    }
    bg.setDepth(0);

    // Picturesque semi-transparent countryside scenery overlay
    if (this.textures.exists('farm_background_scenery')) {
      this.backgroundScenery = this.add.image(290, 290, 'farm_background_scenery');
      this.backgroundScenery.setOrigin(0.5, 0.5);
      this.backgroundScenery.setAlpha(0.60); // Atmospheric semi-transparent overlay
      this.backgroundScenery.setDepth(1);
    }

    // 3. Rotating Windmill Blades on the Meadow (x: 82, y: 425 - below Next Box)
    if (this.textures.exists('farm_windmill_blades')) {
      this.windmillBlades = this.add.image(82, 425, 'farm_windmill_blades');
      this.windmillBlades.setOrigin(0.5, 0.5);
      this.windmillBlades.setAlpha(0.72);
      this.windmillBlades.setDepth(1);
      this.tweens.add({
        targets: this.windmillBlades,
        angle: 360,
        duration: 18000,
        repeat: -1,
        ease: 'Linear',
      });
    }

    // 4. Soft Drifting Farm Clouds
    if (this.textures.exists('farm_cloud_1')) {
      const cloud1 = this.add.image(90, 48, 'farm_cloud_1');
      cloud1.setOrigin(0.5, 0.5);
      cloud1.setAlpha(0.52);
      cloud1.setDepth(1);
      this.backgroundClouds.push(cloud1);
      this.tweens.add({
        targets: cloud1,
        x: 520,
        duration: 36000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    if (this.textures.exists('farm_cloud_2')) {
      const cloud2 = this.add.image(380, 85, 'farm_cloud_2');
      cloud2.setOrigin(0.5, 0.5);
      cloud2.setAlpha(0.45);
      cloud2.setDepth(1);
      this.backgroundClouds.push(cloud2);
      this.tweens.add({
        targets: cloud2,
        x: 120,
        duration: 44000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createSiloAndFarmer() {
    // Silo Dome Top Cap
    const dome = this.add.image(this.SILO_X + this.SILO_W / 2, this.SILO_Y + 12, 'silo_dome');
    dome.setOrigin(0.5, 1);
    dome.setDepth(4);

    // Cute Farmer Sitting on the Silo Dome
    this.farmerSprite = this.add.image(this.SILO_X + this.SILO_W / 2, this.SILO_Y - 14, 'farmer_idle');
    this.farmerSprite.setOrigin(0.5, 1);
    this.farmerSprite.setDepth(5);

    // Farmer Speech Bubble Container (Initially Hidden)
    this.farmerSpeechContainer = this.add.container(this.SILO_X + this.SILO_W / 2, this.SILO_Y - 95);
    this.farmerSpeechContainer.setDepth(20);
    this.farmerSpeechContainer.setAlpha(0);

    this.farmerSpeechBg = this.add.graphics();
    this.farmerSpeechContainer.add(this.farmerSpeechBg);

    this.farmerSpeechText = this.add.text(0, -2, 'WOW! 🌾', {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#b45309',
      align: 'center',
    });
    this.farmerSpeechText.setOrigin(0.5, 0.5);
    this.farmerSpeechContainer.add(this.farmerSpeechText);
  }

  update(time: number, delta: number) {
    if (this.gameState.isGameOver || this.gameState.isPaused) {
      return;
    }

    // 1. Continuous DAS (Delayed Auto Shift) Movement
    const now = performance.now();
    const isLeft = this.cursors?.left.isDown || this.keyA?.isDown;
    const isRight = this.cursors?.right.isDown || this.keyD?.isDown;
    const isDown = this.cursors?.down.isDown || this.keyS?.isDown;

    if (isLeft && now - this.lastLeftRepeat > 115) {
      this.handleMove(-1, 0);
      this.lastLeftRepeat = now;
    } else if (isRight && now - this.lastRightRepeat > 115) {
      this.handleMove(1, 0);
      this.lastRightRepeat = now;
    }

    if (isDown && now - this.lastDownRepeat > 65) {
      this.handleSoftDrop();
      this.lastDownRepeat = now;
    }

    // 2. Automatic Gravity Drop
    if (this.isAutoDropping && time - this.lastDropTime > this.gameState.dropInterval) {
      this.lastDropTime = time;
      this.handleGravityTick();
    }

    // 3. Smooth Silo Fill Tweening
    if (Math.abs(this.visualSiloPercent - this.gameState.siloProgress) > 0.3) {
      this.visualSiloPercent = Phaser.Math.Linear(
        this.visualSiloPercent,
        this.gameState.siloProgress,
        0.14
      );
      this.renderSilo();
    }
  }

  // Action Handlers
  public handleMove(dx: number, dy: number) {
    if (this.gameState.isGameOver || this.gameState.isPaused) return;
    const res = movePiece(this.gameState, dx, dy);
    if (res.moved) {
      this.gameState = res.state;
      tetrisSoundManager.playMove();
      this.renderBoard();
      this.notifyReact();
    }
  }

  public handleRotate(dir: 1 | -1 = 1) {
    if (this.gameState.isGameOver || this.gameState.isPaused) return;
    const res = rotatePiece(this.gameState, dir);
    if (res.rotated) {
      this.gameState = res.state;
      tetrisSoundManager.playRotate();
      this.renderBoard();
      this.notifyReact();
    }
  }

  public handleSoftDrop() {
    if (this.gameState.isGameOver || this.gameState.isPaused) return;
    const res = softDrop(this.gameState, true);
    this.gameState = res.state;
    if (res.locked) {
      this.onPieceLocked();
    }
    this.renderAll();
    this.notifyReact();
  }

  public handleHardDrop() {
    if (this.gameState.isGameOver || this.gameState.isPaused) return;
    tetrisSoundManager.playHardDrop();
    this.gameState = hardDrop(this.gameState);
    this.onPieceLocked();
    this.renderAll();
    this.notifyReact();
  }

  public handleHold() {
    if (this.gameState.isGameOver || this.gameState.isPaused) return;
    const prevHold = this.gameState.holdPiece;
    this.gameState = holdPieceAction(this.gameState);
    if (this.gameState.holdPiece !== prevHold) {
      tetrisSoundManager.playHold();
      this.renderAll();
      this.notifyReact();
    }
  }

  private handleGravityTick() {
    const res = softDrop(this.gameState, false);
    this.gameState = res.state;
    if (res.locked) {
      this.onPieceLocked();
    }
    this.renderAll();
    this.notifyReact();
  }

  private onPieceLocked() {
    // Check if lines cleared
    if (this.gameState.lastLineClear) {
      const clearEvent = this.gameState.lastLineClear;

      // Consume the event immediately so it cannot re-trigger on subsequent ticks
      this.gameState = {
        ...this.gameState,
        lastLineClear: null,
      };

      // 1. Play Farmer "WOW!" voice + line clear sounds
      tetrisSoundManager.playLineClear(clearEvent.linesCount);
      const wowVariant =
        clearEvent.linesCount >= 4
          ? 'super'
          : clearEvent.linesCount === 3
          ? 'triple'
          : clearEvent.linesCount === 2
          ? 'double'
          : 'single';

      this.time.delayedCall(120, () => {
        tetrisSoundManager.playWow(wowVariant);
      });

      tetrisSoundManager.playSiloFill();

      if (clearEvent.siloCompleted) {
        this.time.delayedCall(450, () => {
          tetrisSoundManager.playSiloComplete();
        });
      }

      // 2. Trigger Cute Farmer Celebration Animation & Speech Bubble
      this.triggerFarmerReaction(clearEvent.farmerReaction.text, clearEvent.linesCount >= 4);

      // 3. Emit Flying Hay particles from cleared rows into the silo
      for (const rowIdx of clearEvent.rows) {
        const rowY = this.BOARD_Y + rowIdx * this.BLOCK_SIZE + this.BLOCK_SIZE / 2;
        this.emitHayBurst(this.BOARD_X + (BOARD_WIDTH * this.BLOCK_SIZE) / 2, rowY);
      }
    }

    // Check Game Over
    if (this.gameState.isGameOver) {
      this.dismissFarmerReaction();
      tetrisSoundManager.playGameOver();
      if (this.eventsCallback.onGameOver) {
        this.eventsCallback.onGameOver(
          this.gameState.score,
          this.gameState.linesCleared,
          this.gameState.silosFilled
        );
      }
    }
  }

  private dismissFarmerReaction() {
    if (this.farmerReactionTimer) {
      this.farmerReactionTimer.remove();
      this.farmerReactionTimer = undefined;
    }
    this.tweens.killTweensOf(this.farmerSprite);
    this.farmerSprite.setTexture('farmer_idle');
    this.farmerSprite.y = this.SILO_Y - 14;
    this.farmerSprite.setScale(1);

    this.tweens.killTweensOf(this.farmerSpeechContainer);
    this.farmerSpeechContainer.setAlpha(0);
    this.farmerSpeechContainer.setScale(0.8);
  }

  private triggerFarmerReaction(speechText: string, isSuper: boolean = false) {
    if (this.farmerReactionTimer) {
      this.farmerReactionTimer.remove();
      this.farmerReactionTimer = undefined;
    }

    // Switch to cheerful waving pose
    this.farmerSprite.setTexture('farmer_cheer');
    this.farmerSprite.y = this.SILO_Y - 14;
    this.farmerSprite.setScale(1);

    // Cheerful bounce tween
    this.tweens.killTweensOf(this.farmerSprite);
    this.tweens.add({
      targets: this.farmerSprite,
      y: this.SILO_Y - 24,
      scaleY: 1.15,
      duration: 160,
      yoyo: true,
      repeat: isSuper ? 3 : 1,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.farmerSprite.y = this.SILO_Y - 14;
        this.farmerSprite.setScale(1);
      },
    });

    // Speech Bubble Animation
    this.farmerSpeechText.setText(speechText);
    const bubbleW = Math.max(105, this.farmerSpeechText.width + 24);
    const bubbleH = 34;

    this.farmerSpeechBg.clear();
    // Bubble shadow
    this.farmerSpeechBg.fillStyle(0x000000, 0.22);
    this.farmerSpeechBg.fillRoundedRect(-bubbleW / 2 + 2, -bubbleH / 2 + 2, bubbleW, bubbleH, 10);
    // Bubble body
    this.farmerSpeechBg.fillStyle(0xfef3c7, 1);
    this.farmerSpeechBg.fillRoundedRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 10);
    this.farmerSpeechBg.lineStyle(2, 0xd97706, 1);
    this.farmerSpeechBg.strokeRoundedRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 10);

    // Pointer tail to farmer head
    this.farmerSpeechBg.fillStyle(0xfef3c7, 1);
    this.farmerSpeechBg.beginPath();
    this.farmerSpeechBg.moveTo(-6, bubbleH / 2 - 1);
    this.farmerSpeechBg.lineTo(6, bubbleH / 2 - 1);
    this.farmerSpeechBg.lineTo(0, bubbleH / 2 + 8);
    this.farmerSpeechBg.closePath();
    this.farmerSpeechBg.fill();

    this.tweens.killTweensOf(this.farmerSpeechContainer);
    this.farmerSpeechContainer.setScale(0.6);
    this.farmerSpeechContainer.setAlpha(1);

    this.tweens.add({
      targets: this.farmerSpeechContainer,
      scale: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });

    // Revert back to idle after 1100ms
    this.farmerReactionTimer = this.time.delayedCall(1100, () => {
      this.farmerSprite.setTexture('farmer_idle');
      this.farmerSprite.y = this.SILO_Y - 14;
      this.farmerSprite.setScale(1);
      this.tweens.add({
        targets: this.farmerSpeechContainer,
        alpha: 0,
        scale: 0.8,
        duration: 220,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          this.farmerSpeechContainer.setAlpha(0);
        },
      });
    });
  }

  private emitHayBurst(fromX: number, fromY: number) {
    if (!this.hayParticleEmitter) return;
    this.hayParticleEmitter.setPosition(fromX, fromY);
    // Explode straw particles flying towards silo window
    this.hayParticleEmitter.explode(18);

    // Also draw a flight stream arc into the silo
    const hayWisp = this.add.circle(fromX, fromY, 6, 0xfde047, 0.85);
    hayWisp.setDepth(16);
    this.tweens.add({
      targets: hayWisp,
      x: this.SILO_X + this.SILO_W / 2,
      y: this.SILO_Y + this.SILO_H * 0.55,
      scale: 0.2,
      alpha: 0.2,
      duration: 480,
      ease: 'Quad.easeIn',
      onComplete: () => hayWisp.destroy(),
    });
  }

  // Rendering
  public renderAll() {
    this.renderBoard();
    this.renderSilo();
  }

  private renderBoard() {
    this.boardGraphics.clear();

    const bx = this.BOARD_X;
    const by = this.BOARD_Y;
    const bw = BOARD_WIDTH * this.BLOCK_SIZE;
    const bh = BOARD_HEIGHT * this.BLOCK_SIZE;

    // 1. Board Interior Frame
    this.boardGraphics.fillStyle(0x0f172a, 0.72);
    this.boardGraphics.fillRoundedRect(bx - 3, by - 3, bw + 6, bh + 6, 8);
    this.boardGraphics.lineStyle(3, 0x475569, 0.9);
    this.boardGraphics.strokeRoundedRect(bx - 3, by - 3, bw + 6, bh + 6, 8);

    // Subtle Grid checker lines
    this.boardGraphics.lineStyle(1, 0x334155, 0.35);
    for (let c = 1; c < BOARD_WIDTH; c++) {
      this.boardGraphics.beginPath();
      this.boardGraphics.moveTo(bx + c * this.BLOCK_SIZE, by);
      this.boardGraphics.lineTo(bx + c * this.BLOCK_SIZE, by + bh);
      this.boardGraphics.stroke();
    }
    for (let r = 1; r < BOARD_HEIGHT; r++) {
      this.boardGraphics.beginPath();
      this.boardGraphics.moveTo(bx, by + r * this.BLOCK_SIZE);
      this.boardGraphics.lineTo(bx + bw, by + r * this.BLOCK_SIZE);
      this.boardGraphics.stroke();
    }

    // 2. Render Placed Blocks
    for (let r = 0; r < BOARD_HEIGHT; r++) {
      for (let c = 0; c < BOARD_WIDTH; c++) {
        const val = this.gameState.board[r]![c];
        if (val) {
          const texKey = `block_${val}`;
          if (this.textures.exists(texKey)) {
            // Draw block image via board graphics / stamp
            this.boardGraphics.fillStyle(this.getBlockColor(val), 1);
            this.boardGraphics.fillRoundedRect(
              bx + c * this.BLOCK_SIZE + 1,
              by + r * this.BLOCK_SIZE + 1,
              this.BLOCK_SIZE - 2,
              this.BLOCK_SIZE - 2,
              4
            );
            // Highlight shine
            this.boardGraphics.fillStyle(0xffffff, 0.35);
            this.boardGraphics.fillRect(
              bx + c * this.BLOCK_SIZE + 3,
              by + r * this.BLOCK_SIZE + 3,
              this.BLOCK_SIZE - 6,
              2.5
            );
          }
        }
      }
    }

    // 3. Render Ghost Piece Projection
    const piece = this.gameState.currentPiece;
    if (piece && !this.gameState.isGameOver) {
      const ghostY = this.gameState.ghostY;
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r]!.length; c++) {
          if (piece.shape[r]![c] !== 0) {
            const py = ghostY + r;
            const px = piece.x + c;
            if (py >= 0 && py < BOARD_HEIGHT && px >= 0 && px < BOARD_WIDTH) {
              this.boardGraphics.lineStyle(2, 0xffffff, 0.4);
              this.boardGraphics.strokeRoundedRect(
                bx + px * this.BLOCK_SIZE + 2,
                by + py * this.BLOCK_SIZE + 2,
                this.BLOCK_SIZE - 4,
                this.BLOCK_SIZE - 4,
                4
              );
            }
          }
        }
      }

      // 4. Render Active Current Piece
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r]!.length; c++) {
          if (piece.shape[r]![c] !== 0) {
            const py = piece.y + r;
            const px = piece.x + c;
            if (py >= 0 && py < BOARD_HEIGHT && px >= 0 && px < BOARD_WIDTH) {
              this.boardGraphics.fillStyle(this.getBlockColor(piece.type), 1);
              this.boardGraphics.fillRoundedRect(
                bx + px * this.BLOCK_SIZE + 1,
                by + py * this.BLOCK_SIZE + 1,
                this.BLOCK_SIZE - 2,
                this.BLOCK_SIZE - 2,
                4
              );
              this.boardGraphics.lineStyle(1.8, 0xffffff, 0.8);
              this.boardGraphics.strokeRoundedRect(
                bx + px * this.BLOCK_SIZE + 1,
                by + py * this.BLOCK_SIZE + 1,
                this.BLOCK_SIZE - 2,
                this.BLOCK_SIZE - 2,
                4
              );
              // Top sheen
              this.boardGraphics.fillStyle(0xffffff, 0.4);
              this.boardGraphics.fillRect(
                bx + px * this.BLOCK_SIZE + 3,
                by + py * this.BLOCK_SIZE + 3,
                this.BLOCK_SIZE - 6,
                3
              );
            }
          }
        }
      }
    }

    // 5. Left Panel: Hold & Next displays
    this.renderLeftPanel();
  }

  private renderLeftPanel() {
    const lx = 14;
    const ly = 12;

    // HOLD Box
    this.boardGraphics.fillStyle(0x0f172a, 0.65);
    this.boardGraphics.fillRoundedRect(lx, ly, 105, 95, 8);
    this.boardGraphics.lineStyle(2, 0x475569, 0.8);
    this.boardGraphics.strokeRoundedRect(lx, ly, 105, 95, 8);

    // Draw Hold Piece if exists
    if (this.gameState.holdPiece) {
      this.drawMiniPiece(this.gameState.holdPiece, lx + 52, ly + 52, this.gameState.canHold ? 1 : 0.4);
    }

    // NEXT Box
    const nextY = ly + 115;
    this.boardGraphics.fillStyle(0x0f172a, 0.65);
    this.boardGraphics.fillRoundedRect(lx, nextY, 105, 230, 8);
    this.boardGraphics.lineStyle(2, 0x475569, 0.8);
    this.boardGraphics.strokeRoundedRect(lx, nextY, 105, 230, 8);

    // Draw Next Pieces (top 3)
    const queue = this.gameState.nextQueue.slice(0, 3);
    queue.forEach((type, idx) => {
      this.drawMiniPiece(type, lx + 52, nextY + 45 + idx * 65, 1);
    });
  }

  private drawMiniPiece(type: TetrominoType, centerX: number, centerY: number, alpha: number) {
    const miniSize = 16;
    const shape = this.getTetrominoShape(type);
    const rows = shape.length;
    const cols = shape[0]!.length;
    const startX = centerX - (cols * miniSize) / 2;
    const startY = centerY - (rows * miniSize) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r]![c] !== 0) {
          this.boardGraphics.fillStyle(this.getBlockColor(type), alpha);
          this.boardGraphics.fillRoundedRect(
            startX + c * miniSize + 1,
            startY + r * miniSize + 1,
            miniSize - 2,
            miniSize - 2,
            2.5
          );
        }
      }
    }
  }

  private renderSilo() {
    this.siloGraphics.clear();

    const sx = this.SILO_X;
    const sy = this.SILO_Y + 12;
    const sw = this.SILO_W;
    const sh = this.SILO_H - 12;

    // 1. Silo Outer Shell (Red Barn Wood with Galvanized Metal Trim)
    this.siloGraphics.fillStyle(0x7f1d1d, 1); // Barn red base
    this.siloGraphics.fillRoundedRect(sx, sy, sw, sh, 12);
    this.siloGraphics.lineStyle(3, 0x94a3b8, 1); // Steel bands
    this.siloGraphics.strokeRoundedRect(sx, sy, sw, sh, 12);

    // Steel Reinforcement Hoops
    this.siloGraphics.lineStyle(2, 0x64748b, 0.9);
    for (let y = sy + 40; y < sy + sh - 20; y += 55) {
      this.siloGraphics.beginPath();
      this.siloGraphics.moveTo(sx + 2, y);
      this.siloGraphics.lineTo(sx + sw - 2, y);
      this.siloGraphics.stroke();
    }

    // 2. Large Central Glass / Mesh Observation Gauge
    const gw = sw - 32;
    const gh = sh - 70;
    const gx = sx + 16;
    const gy = sy + 30;

    // Gauge dark backdrop
    this.siloGraphics.fillStyle(0x0f172a, 0.85);
    this.siloGraphics.fillRoundedRect(gx, gy, gw, gh, 8);

    // 3. Golden Hay Fill Level (Progressively Rising as lines are cleared!)
    const fillPercent = Math.max(0, Math.min(100, this.visualSiloPercent));
    const fillHeight = (fillPercent / 100) * (gh - 4);

    if (fillHeight > 2) {
      const fy = gy + gh - 2 - fillHeight;
      // Vibrant golden hay fill
      this.siloGraphics.fillStyle(0xfacc15, 1);
      this.siloGraphics.fillRoundedRect(gx + 2, fy, gw - 4, fillHeight, 6);

      // Hay texture lines inside fill
      this.siloGraphics.lineStyle(1.5, 0xca8a04, 0.7);
      for (let y = fy + 6; y < gy + gh - 4; y += 8) {
        this.siloGraphics.beginPath();
        this.siloGraphics.moveTo(gx + 5, y);
        this.siloGraphics.lineTo(gx + gw - 5, y);
        this.siloGraphics.stroke();
      }

      // Top golden fluffy edge
      this.siloGraphics.fillStyle(0xfef08a, 1);
      this.siloGraphics.fillRect(gx + 2, fy, gw - 4, 3);
    }

    // Gauge Glass frame & reflection highlights
    this.siloGraphics.lineStyle(2.5, 0xe2e8f0, 0.9);
    this.siloGraphics.strokeRoundedRect(gx, gy, gw, gh, 8);

    // Glass shine streak
    this.siloGraphics.fillStyle(0xffffff, 0.15);
    this.siloGraphics.fillRect(gx + 4, gy + 4, 10, gh - 8);

    // 4. Capacity Measurement Ticks on Silo Wall (25%, 50%, 75%, 100%)
    this.siloGraphics.lineStyle(2, 0xffffff, 0.8);
    for (let p = 25; p <= 100; p += 25) {
      const tickY = gy + gh - (p / 100) * gh;
      this.siloGraphics.beginPath();
      this.siloGraphics.moveTo(gx - 6, tickY);
      this.siloGraphics.lineTo(gx + 2, tickY);
      this.siloGraphics.stroke();
    }

    // 5. Silo Ladder on Right Side
    const lx = sx + sw - 10;
    this.siloGraphics.lineStyle(2, 0x475569, 0.85);
    this.siloGraphics.beginPath();
    this.siloGraphics.moveTo(lx, sy + 20);
    this.siloGraphics.lineTo(lx, sy + sh - 10);
    this.siloGraphics.moveTo(lx + 6, sy + 20);
    this.siloGraphics.lineTo(lx + 6, sy + sh - 10);
    this.siloGraphics.stroke();

    for (let y = sy + 30; y < sy + sh - 15; y += 22) {
      this.siloGraphics.beginPath();
      this.siloGraphics.moveTo(lx, y);
      this.siloGraphics.lineTo(lx + 6, y);
      this.siloGraphics.stroke();
    }
  }

  private getBlockColor(type: TetrominoType): number {
    switch (type) {
      case 'O':
        return 0xeab308; // Golden Hay Bale Yellow
      case 'I':
        return 0x0284c7; // Barn Timber Cyan/Blue
      case 'T':
        return 0xdc2626; // Apple Red
      case 'S':
        return 0x16a34a; // Garden Cabbage Green
      case 'Z':
        return 0xea580c; // Harvest Pumpkin Orange
      case 'J':
        return 0x4f46e5; // Blueberry Indigo
      case 'L':
        return 0xf59e0b; // Sweetcorn Amber
      default:
        return 0xffffff;
    }
  }

  private getTetrominoShape(type: TetrominoType): number[][] {
    switch (type) {
      case 'O':
        return [
          [1, 1],
          [1, 1],
        ];
      case 'I':
        return [[1, 1, 1, 1]];
      case 'T':
        return [
          [0, 1, 0],
          [1, 1, 1],
        ];
      case 'S':
        return [
          [0, 1, 1],
          [1, 1, 0],
        ];
      case 'Z':
        return [
          [1, 1, 0],
          [0, 1, 1],
        ];
      case 'J':
        return [
          [1, 0, 0],
          [1, 1, 1],
        ];
      case 'L':
        return [
          [0, 0, 1],
          [1, 1, 1],
        ];
    }
  }

  public restartGame() {
    this.tweens.killAll();
    this.dismissFarmerReaction();
    let savedHighScore = this.gameState.highScore;
    this.gameState = createInitialState(savedHighScore);
    this.visualSiloPercent = 0;
    this.renderAll();
    this.notifyReact();
  }

  public togglePause(): boolean {
    this.gameState.isPaused = !this.gameState.isPaused;
    this.notifyReact();
    return this.gameState.isPaused;
  }

  private notifyReact() {
    if (this.eventsCallback.onStateUpdate) {
      this.eventsCallback.onStateUpdate(this.gameState);
    }
  }
}
