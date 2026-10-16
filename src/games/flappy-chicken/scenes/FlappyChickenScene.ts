import Phaser from 'phaser';
import {
  createInitialState,
  DEFAULT_WHEAT_GOAL,
  flap,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_Y,
  updateGame,
} from '../logic/engine';
import { FlappyGameState, GameEvent, ObstaclePipe } from '../logic/types';
import { flappySoundManager } from '../systems/sound';
import { generateFlappyTextures } from './textures';

interface SceneCallbacks {
  onStateUpdate?: (state: FlappyGameState) => void;
  onGameOver?: (score: number, best: number, grains: number) => void;
  onVictory?: (score: number, grains: number) => void;
}

interface PipeRenderNode {
  id: number;
  upperShaft: Phaser.GameObjects.Image;
  upperCap: Phaser.GameObjects.Image;
  lowerShaft: Phaser.GameObjects.Image;
  lowerCap: Phaser.GameObjects.Image;
  grainSprite?: Phaser.GameObjects.Image;
}

export class FlappyChickenScene extends Phaser.Scene {
  private gameState: FlappyGameState;
  private callbacks: SceneCallbacks = {};

  // Visual Display Objects
  private skyTile!: Phaser.GameObjects.TileSprite;
  private groundTile!: Phaser.GameObjects.TileSprite;
  private chickenSprite!: Phaser.GameObjects.Sprite;
  private featherEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private wheatWagonGoal!: Phaser.GameObjects.Container;
  private wheatGoalSignText!: Phaser.GameObjects.Text;
  private readyInstructionText!: Phaser.GameObjects.Text;

  // Active Pipes Pool
  private pipeRenderNodes: Map<number, PipeRenderNode> = new Map();

  // State flags
  private isPaused: boolean = false;

  constructor() {
    super({ key: 'FlappyChickenScene' });
    this.gameState = createInitialState(0, DEFAULT_WHEAT_GOAL);
  }

  public setCallbacks(cbs: SceneCallbacks): void {
    this.callbacks = cbs;
  }

  public preload(): void {
    // Everything is procedurally generated
  }

  public create(): void {
    generateFlappyTextures(this);

    // Load saved best score
    let savedBest = 0;
    try {
      const val = localStorage.getItem('pawcade_flappy_chicken_best');
      if (val) savedBest = parseInt(val, 10) || 0;
    } catch {}

    this.gameState = createInitialState(savedBest, DEFAULT_WHEAT_GOAL);

    // 1. Scenic Parallax Sky Background
    this.skyTile = this.add.tileSprite(0, 0, GAME_WIDTH, 560, 'farm_sky_bg');
    this.skyTile.setOrigin(0, 0);

    // 2. Feather Emitter behind chicken
    this.featherEmitter = this.add.particles(0, 0, 'feather', {
      speed: { min: 20, max: 80 },
      angle: { min: 140, max: 220 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 600,
      gravityY: 120,
      emitting: false,
    });
    this.featherEmitter.setDepth(5);

    // 3. Clucky the Chicken Sprite
    this.chickenSprite = this.add.sprite(
      this.gameState.chicken.x,
      this.gameState.chicken.y,
      'chicken_mid'
    );
    this.chickenSprite.setOrigin(0.5, 0.5);
    this.chickenSprite.setDepth(10);

    // 4. Grand Golden Wheat Wagon Goal Container
    this.wheatWagonGoal = this.add.container(9999, GROUND_Y - 260);
    this.wheatWagonGoal.setDepth(8);

    const wagonImg = this.add.image(0, 0, 'wheat_wagon_goal');
    wagonImg.setOrigin(0, 0);
    this.wheatWagonGoal.add(wagonImg);

    this.wheatGoalSignText = this.add.text(90, 177, '🌾 WHEAT FIELD 🌾', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#78350f',
    });
    this.wheatGoalSignText.setOrigin(0.5, 0.5);
    this.wheatWagonGoal.add(this.wheatGoalSignText);

    // 5. Ground Pasture Foreground Tile
    this.groundTile = this.add.tileSprite(0, GROUND_Y, GAME_WIDTH, 80, 'farm_ground');
    this.groundTile.setOrigin(0, 0);
    this.groundTile.setDepth(15);

    // 6. Ready Prompt Message
    this.readyInstructionText = this.add.text(
      GAME_WIDTH / 2,
      GROUND_Y - 90,
      'TAP or SPACE to FLAP!\nReach the Golden Wheat 🌾',
      {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#451a03',
        strokeThickness: 4,
        align: 'center',
      }
    );
    this.readyInstructionText.setOrigin(0.5, 0.5);
    this.readyInstructionText.setDepth(20);

    // Gentle pulsing animation on start text
    this.tweens.add({
      targets: this.readyInstructionText,
      scale: 1.06,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 7. Input Event Listeners
    this.input.on('pointerdown', () => {
      this.handlePlayerFlap();
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', (e: KeyboardEvent) => {
        e.preventDefault();
        this.handlePlayerFlap();
      });
      this.input.keyboard.on('keydown-UP', (e: KeyboardEvent) => {
        e.preventDefault();
        this.handlePlayerFlap();
      });
      this.input.keyboard.on('keydown-W', () => {
        this.handlePlayerFlap();
      });
      this.input.keyboard.on('keydown-R', () => {
        this.restartGame();
      });
      this.input.keyboard.on('keydown-P', () => {
        this.togglePause();
      });
    }

    this.notifyState();
  }

  public handlePlayerFlap(): void {
    if (this.isPaused || this.gameState.isGameOver || this.gameState.hasWon) {
      return;
    }

    const { state, event } = flap(this.gameState);
    this.gameState = state;

    if (event && event.type === 'cluck') {
      flappySoundManager.playCluck();

      // Emit feather puff behind chicken
      this.featherEmitter.emitParticleAt(
        this.gameState.chicken.x - 12,
        this.gameState.chicken.y + 4,
        2
      );

      // Hide ready text once flight begins
      if (this.readyInstructionText.visible) {
        this.readyInstructionText.setVisible(false);
      }
    }

    this.notifyState();
  }

  public override update(_time: number, delta: number): void {
    if (this.isPaused) return;

    const dt = delta / 1000;
    const prevStatus = this.gameState.status;

    // Advance logic engine simulation
    const { state, events } = updateGame(this.gameState, dt);
    this.gameState = state;

    // Handle dispatched audio & visual events
    for (const evt of events) {
      if (evt.type === 'cluck') {
        flappySoundManager.playCluck();
      } else if (evt.type === 'point') {
        flappySoundManager.playPoint();
      } else if (evt.type === 'grain') {
        flappySoundManager.playGrainPickup();
      } else if (evt.type === 'hit_pipe' || evt.type === 'hit_ground') {
        flappySoundManager.playHit();
        // Shake screen on impact
        this.cameras.main.shake(200, 0.015);
        if (this.callbacks.onGameOver) {
          this.callbacks.onGameOver(state.score, state.bestScore, state.grains);
        }
      } else if (evt.type === 'wheat_victory') {
        flappySoundManager.playWheatVictory();
        if (this.callbacks.onVictory) {
          this.callbacks.onVictory(state.score, state.grains);
        }
      }
    }

    // Scroll Background & Ground while alive
    if (this.gameState.status === 'playing') {
      this.skyTile.tilePositionX += 16 * dt; // slow parallax sky
      this.groundTile.tilePositionX += 165 * dt; // matches PIPE_SPEED
    }

    // Update Chicken Visual Sprite
    this.chickenSprite.setPosition(this.gameState.chicken.x, this.gameState.chicken.y);
    this.chickenSprite.setRotation(this.gameState.chicken.rotation);

    const textureKey = `chicken_${this.gameState.chicken.wingState}`;
    if (this.chickenSprite.texture.key !== textureKey) {
      this.chickenSprite.setTexture(textureKey);
    }

    // Update Obstacle Pipe Visuals
    this.syncPipesWithRenderer();

    // Update Golden Wheat Wagon Goal Position
    if (this.gameState.wheatFieldSpawned) {
      this.wheatWagonGoal.setVisible(true);
      this.wheatWagonGoal.setPosition(this.gameState.wheatFieldX, GROUND_Y - 260);
    } else {
      this.wheatWagonGoal.setVisible(false);
    }

    // Save best score on increase
    if (this.gameState.score > this.gameState.bestScore) {
      try {
        localStorage.setItem(
          'pawcade_flappy_chicken_best',
          String(this.gameState.score)
        );
      } catch {}
    }

    if (prevStatus !== this.gameState.status || events.length > 0) {
      this.notifyState();
    }
  }

  private syncPipesWithRenderer(): void {
    const activePipeIds = new Set<number>();

    for (const pipe of this.gameState.pipes) {
      activePipeIds.add(pipe.id);
      let renderNode = this.pipeRenderNodes.get(pipe.id);

      const upperHeight = Math.max(10, pipe.gapY - pipe.gapHeight / 2);
      const lowerY = pipe.gapY + pipe.gapHeight / 2;
      const lowerHeight = Math.max(10, GROUND_Y - lowerY);

      if (!renderNode) {
        // Create new pipe render node
        // Upper Pipe (inverted shaft + cap at bottom)
        const upperShaft = this.add.image(pipe.x, 0, 'farm_pipe_shaft');
        upperShaft.setOrigin(0, 0);
        upperShaft.setDisplaySize(pipe.width, upperHeight);
        upperShaft.setDepth(6);

        const upperCap = this.add.image(pipe.x - 4, upperHeight - 28, 'farm_pipe_cap');
        upperCap.setOrigin(0, 0);
        upperCap.setDisplaySize(pipe.width + 8, 30);
        upperCap.setDepth(7);

        // Lower Pipe (shaft + cap at top)
        const lowerCap = this.add.image(pipe.x - 4, lowerY, 'farm_pipe_cap');
        lowerCap.setOrigin(0, 0);
        lowerCap.setDisplaySize(pipe.width + 8, 30);
        lowerCap.setDepth(7);

        const lowerShaft = this.add.image(pipe.x, lowerY + 28, 'farm_pipe_shaft');
        lowerShaft.setOrigin(0, 0);
        lowerShaft.setDisplaySize(pipe.width, lowerHeight);
        lowerShaft.setDepth(6);

        // Floating Grain Pickup in Gap
        let grainSprite: Phaser.GameObjects.Image | undefined;
        if (pipe.hasGrain && !pipe.grainCollected) {
          grainSprite = this.add.image(pipe.x + pipe.width / 2, pipe.grainY, 'wheat_grain');
          grainSprite.setOrigin(0.5, 0.5);
          grainSprite.setDepth(8);
        }

        renderNode = {
          id: pipe.id,
          upperShaft,
          upperCap,
          lowerShaft,
          lowerCap,
          grainSprite,
        };
        this.pipeRenderNodes.set(pipe.id, renderNode);
      } else {
        // Update positions
        renderNode.upperShaft.setPosition(pipe.x, 0);
        renderNode.upperShaft.setDisplaySize(pipe.width, upperHeight);
        renderNode.upperCap.setPosition(pipe.x - 4, upperHeight - 28);

        renderNode.lowerCap.setPosition(pipe.x - 4, lowerY);
        renderNode.lowerShaft.setPosition(pipe.x, lowerY + 28);
        renderNode.lowerShaft.setDisplaySize(pipe.width, lowerHeight);

        if (renderNode.grainSprite) {
          if (pipe.grainCollected) {
            renderNode.grainSprite.destroy();
            renderNode.grainSprite = undefined;
          } else {
            renderNode.grainSprite.setPosition(pipe.x + pipe.width / 2, pipe.grainY);
          }
        }
      }
    }

    // Cleanup despawned pipes
    for (const [id, node] of this.pipeRenderNodes.entries()) {
      if (!activePipeIds.has(id)) {
        node.upperShaft.destroy();
        node.upperCap.destroy();
        node.lowerShaft.destroy();
        node.lowerCap.destroy();
        if (node.grainSprite) node.grainSprite.destroy();
        this.pipeRenderNodes.delete(id);
      }
    }
  }

  public restartGame(): void {
    // Clean all existing pipe visuals
    for (const [, node] of this.pipeRenderNodes.entries()) {
      node.upperShaft.destroy();
      node.upperCap.destroy();
      node.lowerShaft.destroy();
      node.lowerCap.destroy();
      if (node.grainSprite) node.grainSprite.destroy();
    }
    this.pipeRenderNodes.clear();

    const savedBest = Math.max(this.gameState.score, this.gameState.bestScore);
    this.gameState = createInitialState(savedBest, DEFAULT_WHEAT_GOAL);
    this.isPaused = false;

    this.chickenSprite.setPosition(this.gameState.chicken.x, this.gameState.chicken.y);
    this.chickenSprite.setRotation(0);
    this.chickenSprite.setTexture('chicken_mid');

    this.wheatWagonGoal.setVisible(false);
    this.readyInstructionText.setVisible(true);

    this.notifyState();
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    this.notifyState();
    return this.isPaused;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  private notifyState(): void {
    if (this.callbacks.onStateUpdate) {
      this.callbacks.onStateUpdate({ ...this.gameState });
    }
  }
}
