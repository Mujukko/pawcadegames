import Phaser from 'phaser';
import { GameState, LevelConfig, PlayerInput } from '../logic/types';
import { createInitialState, updateGamePhysics, normalizeAngle } from '../logic/engine';
import { LEVELS, FARM_WIDTH, FARM_HEIGHT } from '../levels/levelsData';
import { farmSoundManager } from '../systems/sound';
import { ensureFarmTextures } from './textures';

export interface FarmGameSceneEvents {
  onStateUpdate?: (state: GameState) => void;
  onLevelComplete?: (levelId: number, stars: number, accuracy: number, health: number) => void;
  onGameOver?: (levelId: number) => void;
}

export class FarmGameScene extends Phaser.Scene {
  private currentLevel!: LevelConfig;
  private gameState!: GameState;
  private eventsCallback: FarmGameSceneEvents = {};

  private cowSprite!: Phaser.GameObjects.Sprite;
  private parkingGraphics!: Phaser.GameObjects.Graphics;
  private parkingEmblem!: Phaser.GameObjects.Image;
  private parkingMilkBadge!: Phaser.GameObjects.Text;
  private obstaclesContainer!: Phaser.GameObjects.Container;
  private particleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private milkSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private milkBaseY: Map<string, number> = new Map();

  // Input states
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  };

  private virtualInput: PlayerInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    forward: false,
    reverse: false,
    turnLeft: false,
    turnRight: false,
    brake: false,
  };

  private lastDamageSoundTime = 0;
  private lastTrotSoundTime = 0;
  private lastSheepBaaTime = 0;
  private obstacleSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  public static initialLevel?: LevelConfig;

  constructor() {
    super('FarmGameScene');
  }

  public init(data?: { level?: LevelConfig; callbacks?: FarmGameSceneEvents }) {
    if (data?.level) {
      this.currentLevel = data.level;
    } else if (FarmGameScene.initialLevel) {
      this.currentLevel = FarmGameScene.initialLevel;
    } else {
      this.currentLevel = LEVELS[0]!;
    }

    if (data?.callbacks) {
      this.eventsCallback = data.callbacks;
    }
  }

  create() {
    // 1. Ensure procedural textures
    ensureFarmTextures(this);

    if (!this.currentLevel) {
      this.currentLevel = FarmGameScene.initialLevel || LEVELS[0]!;
    }

    this.gameState = createInitialState(this.currentLevel);

    // 2. Background tile
    this.add.tileSprite(
      FARM_WIDTH / 2,
      FARM_HEIGHT / 2,
      FARM_WIDTH,
      FARM_HEIGHT,
      'farm_grass_tile'
    );

    // 3. Perimeter Wooden Fence Border
    const fenceGraphics = this.add.graphics();
    fenceGraphics.lineStyle(12, 0x78350f, 1); // Wooden brown post
    fenceGraphics.strokeRoundedRect(6, 6, FARM_WIDTH - 12, FARM_HEIGHT - 12, 16);
    fenceGraphics.lineStyle(4, 0xd97706, 1); // Amber wire/rail
    fenceGraphics.strokeRoundedRect(10, 10, FARM_WIDTH - 20, FARM_HEIGHT - 20, 14);

    // 4. Parking Stall Visuals & Cow/Milk Emblem
    this.parkingGraphics = this.add.graphics();
    const slot = this.currentLevel.parkingSlot;
    this.parkingEmblem = this.add.image(slot.x, slot.y, 'parking_cow_emblem');
    this.parkingEmblem.setOrigin(0.5, 0.5);
    this.parkingEmblem.setRotation(slot.rotation);
    this.parkingEmblem.setDepth(1);

    // 4b. Transparent Milk Counter Badge right under the parking spot (e.g. "🥛 0/4")
    this.createParkingMilkBadge();

    // 5. Obstacles
    this.createObstacles();

    // 6. Collectible Milk Bottles
    this.createMilkBottles();

    // 7. Cow Sprite
    this.cowSprite = this.add.sprite(
      this.gameState.cow.x,
      this.gameState.cow.y,
      'bessie_cow'
    );
    this.cowSprite.setOrigin(0.5, 0.5);
    this.cowSprite.setRotation(this.gameState.cow.rotation);
    this.cowSprite.setDepth(2);

    // 8. Keyboard Inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      };
    }

    farmSoundManager.playMoo('alert');
  }

  public setCallbacks(callbacks: FarmGameSceneEvents) {
    this.eventsCallback = callbacks;
  }

  public setVirtualInput(input: Partial<PlayerInput>) {
    this.virtualInput = { ...this.virtualInput, ...input };
  }

  public restartLevel() {
    this.tweens.killAll();
    this.gameState = createInitialState(this.currentLevel);
    this.createObstacles();
    this.createMilkBottles();
    this.cowSprite.setPosition(this.gameState.cow.x, this.gameState.cow.y);
    this.cowSprite.setRotation(this.gameState.cow.rotation);
    this.cowSprite.setAlpha(1);
    this.cowSprite.setScale(1);
    if (this.parkingEmblem) {
      this.parkingEmblem.clearTint();
    }
    this.createParkingMilkBadge();
    farmSoundManager.playMoo('alert');
  }

  public loadLevel(level: LevelConfig) {
    this.tweens.killAll();
    this.currentLevel = level;
    this.gameState = createInitialState(level);
    this.createObstacles();
    this.createMilkBottles();
    this.cowSprite.setPosition(this.gameState.cow.x, this.gameState.cow.y);
    this.cowSprite.setRotation(this.gameState.cow.rotation);
    this.cowSprite.setAlpha(1);
    this.cowSprite.setScale(1);
    if (this.parkingEmblem) {
      this.parkingEmblem.setPosition(level.parkingSlot.x, level.parkingSlot.y);
      this.parkingEmblem.setRotation(level.parkingSlot.rotation);
      this.parkingEmblem.clearTint();
    }
    this.createParkingMilkBadge();
    farmSoundManager.playMoo('alert');
  }

  private createMilkBottles() {
    this.milkSprites.forEach((sprite) => sprite.destroy());
    this.milkSprites.clear();
    this.milkBaseY.clear();

    const bottles = this.gameState.milkBottles || [];
    bottles.forEach((bottle) => {
      if (bottle.collected) return;
      const sprite = this.add.sprite(bottle.x, bottle.y, 'milk_bottle_pickup');
      sprite.setOrigin(0.5, 0.5);
      sprite.setDepth(1.5);
      this.milkSprites.set(bottle.id, sprite);
      this.milkBaseY.set(bottle.id, bottle.y);
    });
  }

  private createObstacles() {
    this.obstacleSprites.clear();
    if (this.obstaclesContainer) {
      this.obstaclesContainer.destroy();
    }
    this.obstaclesContainer = this.add.container(0, 0);

    for (const obs of this.currentLevel.obstacles) {
      if (obs.type === 'fence' || obs.type === 'barn_wall') {
        const g = this.add.graphics();
        if (obs.type === 'fence') {
          // Wooden fence
          g.fillStyle(0x78350f, 1);
          g.fillRoundedRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height, 4);
          g.lineStyle(2, 0xd97706, 1);
          g.strokeRoundedRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height, 4);
        } else {
          // Red Barn Wall
          g.fillStyle(0xb91c1c, 1); // Barn red
          g.fillRoundedRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height, 4);
          g.lineStyle(2, 0xfef2f2, 0.9); // White crossbeams
          g.strokeRoundedRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height, 4);
        }
        this.obstaclesContainer.add(g);
      } else {
        const texKey = `obstacle_${obs.type}`;
        if (this.textures.exists(texKey)) {
          const sprite = this.add.image(obs.x, obs.y, texKey);
          sprite.setOrigin(0.5, 0.5);
          if (obs.rotation) {
            sprite.setRotation(obs.rotation);
          }
          this.obstaclesContainer.add(sprite);
          this.obstacleSprites.set(obs.id, sprite);
        }
      }
    }
  }

  update(time: number, delta: number) {
    if (this.gameState.isCompleted || this.gameState.isGameOver) {
      return;
    }

    const dt = Math.min(delta / 1000, 0.05);

    // Aggregate Keyboard + Virtual Mobile Inputs (4-directional: W=Up, S=Down, A=Left, D=Right)
    const isUp = this.wasdKeys?.W.isDown || this.cursors?.up.isDown || this.virtualInput.up || this.virtualInput.forward;
    const isDown = this.wasdKeys?.S.isDown || this.cursors?.down.isDown || this.virtualInput.down || this.virtualInput.reverse;
    const isLeft = this.wasdKeys?.A.isDown || this.cursors?.left.isDown || this.virtualInput.left || this.virtualInput.turnLeft;
    const isRight = this.wasdKeys?.D.isDown || this.cursors?.right.isDown || this.virtualInput.right || this.virtualInput.turnRight;
    const isBrake = this.wasdKeys?.SPACE.isDown || this.virtualInput.brake;

    const input: PlayerInput = {
      up: !!isUp,
      down: !!isDown,
      left: !!isLeft,
      right: !!isRight,
      brake: !!isBrake,
    };

    // Update simulation
    const prevColliding = this.gameState.isColliding;
    this.gameState = updateGamePhysics(this.gameState, input, dt, this.currentLevel);

    // Sound feedback
    const nowMs = performance.now();
    if (this.gameState.isColliding) {
      if (!prevColliding || nowMs - this.lastDamageSoundTime > 380) {
        farmSoundManager.playBump();
        farmSoundManager.playMoo('hurt');
        this.lastDamageSoundTime = nowMs;

        // If Bessie bumps into a sheep, trigger cute farm sheep bleat
        const hitSheep = this.gameState.collidingWithIds.some((id) =>
          id.toLowerCase().includes('sheep')
        );
        if (hitSheep && nowMs - this.lastSheepBaaTime > 750) {
          farmSoundManager.playSheepBaa();
          this.lastSheepBaaTime = nowMs;
        }

        // Red flash damage effect
        this.cowSprite.setTint(0xef4444);
        this.time.delayedCall(120, () => {
          if (this.cowSprite.active) this.cowSprite.clearTint();
        });
      }
    } else if (Math.abs(this.gameState.cow.speed) > 12) {
      farmSoundManager.playHoofTrot();
    }

    // Float animate milk bottles
    this.milkSprites.forEach((sprite, id) => {
      const baseY = this.milkBaseY.get(id) ?? sprite.y;
      sprite.y = baseY + Math.sin(time * 0.005 + (baseY % 10)) * 2.5;
    });

    // Sync dynamic obstacle sprites (such as patrolling sheep)
    if (this.gameState.obstacles) {
      for (const obs of this.gameState.obstacles) {
        if (obs.patrol) {
          const sprite = this.obstacleSprites.get(obs.id);
          if (sprite) {
            sprite.setPosition(obs.x, obs.y);
            if (obs.patrol.axis === 'x') {
              const isMovingLeft = Math.abs(normalizeAngle(obs.rotation ?? 0)) > Math.PI / 2;
              sprite.setFlipX(isMovingLeft);
              sprite.setRotation(0);
            } else {
              sprite.setFlipX(false);
              sprite.setRotation(obs.rotation ?? 0);
            }
          }
        }
      }
    }

    // Milk bottle pickup event effect
    if (this.gameState.justCollectedMilkId) {
      const milkId = this.gameState.justCollectedMilkId;
      farmSoundManager.playMilkCollect();

      const sprite = this.milkSprites.get(milkId);
      if (sprite) {
        const popText = this.add.text(sprite.x, sprite.y - 12, '+1 🥛', {
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#38bdf8',
          stroke: '#ffffff',
          strokeThickness: 3,
        });
        popText.setOrigin(0.5, 0.5);
        popText.setDepth(4);

        this.tweens.add({
          targets: popText,
          y: sprite.y - 45,
          alpha: 0,
          scale: 1.3,
          duration: 700,
          ease: 'Cubic.easeOut',
          onComplete: () => popText.destroy(),
        });

        this.tweens.add({
          targets: sprite,
          scale: 1.5,
          alpha: 0,
          duration: 250,
          ease: 'Back.easeIn',
          onComplete: () => {
            sprite.destroy();
            this.milkSprites.delete(milkId);
          },
        });
      }
    }

    // Sync Sprite with Physics
    this.cowSprite.setPosition(this.gameState.cow.x, this.gameState.cow.y);
    this.cowSprite.setRotation(this.gameState.cow.rotation);

    // Draw Dynamic Parking Stall
    this.renderParkingStall();

    // Check Win/Loss transitions
    if (this.gameState.isCompleted) {
      this.handleVictory();
    } else if (this.gameState.isGameOver) {
      this.handleGameOver();
    }

    // Notify React UI
    if (this.eventsCallback.onStateUpdate) {
      this.eventsCallback.onStateUpdate(this.gameState);
    }
  }

  private renderParkingStall() {
    this.parkingGraphics.clear();
    const slot = this.currentLevel.parkingSlot;
    const acc = this.gameState.parkingAccuracy;
    const isTargetMet = acc >= this.currentLevel.targetAccuracy;
    const totalMilk = this.gameState.totalMilk || 0;
    const milkCollected = this.gameState.milkCollected || 0;
    const hasAllMilk = totalMilk === 0 || milkCollected >= totalMilk;
    const isReadyToComplete = isTargetMet && hasAllMilk;

    const hw = slot.width / 2;
    const hh = slot.height / 2;

    this.parkingGraphics.save();
    this.parkingGraphics.translateCanvas(slot.x, slot.y);
    this.parkingGraphics.rotateCanvas(slot.rotation);

    // 1. Stall Interior Glow & Cow/Milk Emblem Tint
    if (isReadyToComplete) {
      // Vibrant glowing emerald green when parked accurately AND all milk collected
      this.parkingGraphics.fillStyle(0x10b981, 0.35);
      this.parkingGraphics.fillRoundedRect(-hw, -hh, slot.width, slot.height, 8);
      this.parkingGraphics.lineStyle(4, 0x10b981, 1);
      this.parkingGraphics.strokeRoundedRect(-hw, -hh, slot.width, slot.height, 8);
      if (this.parkingEmblem) {
        this.parkingEmblem.setTint(0x34d399); // Glowing emerald
      }
    } else if (isTargetMet && !hasAllMilk) {
      // In stall with great accuracy, but milk bottles missing! Noticeable cyan/blue alert
      this.parkingGraphics.fillStyle(0x0284c7, 0.28);
      this.parkingGraphics.fillRoundedRect(-hw, -hh, slot.width, slot.height, 8);
      this.parkingGraphics.lineStyle(3, 0x38bdf8, 1);
      this.parkingGraphics.strokeRoundedRect(-hw, -hh, slot.width, slot.height, 8);
      if (this.parkingEmblem) {
        this.parkingEmblem.setTint(0x38bdf8);
      }
    } else if (acc > 30) {
      // Warm amber guide as player gets closer
      this.parkingGraphics.fillStyle(0xf59e0b, 0.18);
      this.parkingGraphics.fillRoundedRect(-hw, -hh, slot.width, slot.height, 8);
      this.parkingGraphics.lineStyle(3, 0xf59e0b, 0.85);
      this.parkingGraphics.strokeRoundedRect(-hw, -hh, slot.width, slot.height, 8);
      if (this.parkingEmblem) {
        this.parkingEmblem.setTint(0xfde047); // Golden guide
      }
    } else {
      // White/yellow marked parking bay lines
      this.parkingGraphics.fillStyle(0xffffff, 0.12);
      this.parkingGraphics.fillRoundedRect(-hw, -hh, slot.width, slot.height, 8);
      this.parkingGraphics.lineStyle(3, 0xffffff, 0.7);
      this.parkingGraphics.strokeRoundedRect(-hw, -hh, slot.width, slot.height, 8);
      if (this.parkingEmblem) {
        this.parkingEmblem.clearTint();
      }
    }

    // 2. Checkered Hazard Boundary stripes along stall perimeter
    const stripeColor = isReadyToComplete
      ? 0x059669
      : isTargetMet && !hasAllMilk
      ? 0x0284c7
      : 0xfacc15;

    const stripeW = 8;
    for (let x = -hw; x < hw; x += stripeW * 2) {
      this.parkingGraphics.fillStyle(stripeColor, 0.9);
      this.parkingGraphics.fillRect(x, -hh, stripeW, 4);
      this.parkingGraphics.fillRect(x, hh - 4, stripeW, 4);
    }
    for (let y = -hh; y < hh; y += stripeW * 2) {
      this.parkingGraphics.fillStyle(stripeColor, 0.9);
      this.parkingGraphics.fillRect(-hw, y, 4, stripeW);
      this.parkingGraphics.fillRect(hw - 4, y, 4, stripeW);
    }

    // 3. Corner guide brackets
    const bracketColor = isReadyToComplete
      ? 0x34d399
      : isTargetMet && !hasAllMilk
      ? 0x38bdf8
      : 0xf59e0b;

    this.parkingGraphics.lineStyle(2.5, bracketColor, 0.85);
    // Top-left
    this.parkingGraphics.beginPath();
    this.parkingGraphics.moveTo(-hw + 10, -hh + 3);
    this.parkingGraphics.lineTo(-hw + 3, -hh + 3);
    this.parkingGraphics.lineTo(-hw + 3, -hh + 10);
    this.parkingGraphics.stroke();
    // Top-right
    this.parkingGraphics.beginPath();
    this.parkingGraphics.moveTo(hw - 10, -hh + 3);
    this.parkingGraphics.lineTo(hw - 3, -hh + 3);
    this.parkingGraphics.lineTo(hw - 3, -hh + 10);
    this.parkingGraphics.stroke();
    // Bottom-left
    this.parkingGraphics.beginPath();
    this.parkingGraphics.moveTo(-hw + 10, hh - 3);
    this.parkingGraphics.lineTo(-hw + 3, hh - 3);
    this.parkingGraphics.lineTo(-hw + 3, hh - 10);
    this.parkingGraphics.stroke();
    // Bottom-right
    this.parkingGraphics.beginPath();
    this.parkingGraphics.moveTo(hw - 10, hh - 3);
    this.parkingGraphics.lineTo(hw - 3, hh - 3);
    this.parkingGraphics.lineTo(hw - 3, hh - 10);
    this.parkingGraphics.stroke();

    this.parkingGraphics.restore();

    // 4. Update the transparent milk bottle counter badge right under the parking spot
    this.updateParkingMilkBadge();
  }

  private createParkingMilkBadge() {
    if (this.parkingMilkBadge) {
      this.parkingMilkBadge.destroy();
    }
    const slot = this.currentLevel.parkingSlot;
    const stallVisualHeight =
      Math.abs(Math.cos(slot.rotation) * (slot.height / 2)) +
      Math.abs(Math.sin(slot.rotation) * (slot.width / 2));

    let badgeY = slot.y + stallVisualHeight + 14;
    // If placing below would cross outer fence, place directly above the stall
    if (badgeY > FARM_HEIGHT - 24) {
      badgeY = slot.y - stallVisualHeight - 14;
    }

    const collected = this.gameState?.milkCollected || 0;
    const total = this.gameState?.totalMilk || this.currentLevel.milkBottles.length;

    this.parkingMilkBadge = this.add.text(
      slot.x,
      badgeY,
      `🥛 ${collected}/${total}`,
      {
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: 'rgba(15, 23, 42, 0.52)', // Clean semi-transparent backdrop
        padding: { left: 9, right: 9, top: 3.5, bottom: 3.5 },
      }
    );
    this.parkingMilkBadge.setOrigin(0.5, 0.5);
    this.parkingMilkBadge.setDepth(2);
  }

  private updateParkingMilkBadge() {
    if (!this.parkingMilkBadge || !this.parkingMilkBadge.active) return;
    const collected = this.gameState?.milkCollected || 0;
    const total = this.gameState?.totalMilk || this.currentLevel.milkBottles.length;
    const isAllCollected = total > 0 && collected >= total;

    const targetText = isAllCollected ? `🥛 ${collected}/${total} ✓` : `🥛 ${collected}/${total}`;
    if (this.parkingMilkBadge.text !== targetText) {
      this.parkingMilkBadge.setText(targetText);

      if (isAllCollected) {
        this.parkingMilkBadge.setColor('#a7f3d0');
        this.parkingMilkBadge.setBackgroundColor('rgba(5, 150, 105, 0.65)'); // Glowing semi-transparent emerald
      } else {
        this.parkingMilkBadge.setColor('#ffffff');
        this.parkingMilkBadge.setBackgroundColor('rgba(15, 23, 42, 0.52)');
      }

      this.tweens.add({
        targets: this.parkingMilkBadge,
        scale: 1.25,
        duration: 130,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }
  }

  private handleVictory() {
    farmSoundManager.playParkSuccess();

    // Star celebration particles around the stall
    const slot = this.currentLevel.parkingSlot;
    for (let i = 0; i < 28; i++) {
      const p = this.add.text(
        slot.x + (Math.random() * 60 - 30),
        slot.y + (Math.random() * 40 - 20),
        Math.random() > 0.4 ? '⭐' : '🐮',
        { fontSize: `${16 + Math.floor(Math.random() * 12)}px` }
      );
      p.setOrigin(0.5, 0.5);

      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 100;

      this.tweens.add({
        targets: p,
        x: slot.x + Math.cos(angle) * dist,
        y: slot.y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 700 + Math.random() * 500,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy(),
      });
    }

    // Calculate stars
    const acc = this.gameState.parkingAccuracy;
    const hp = this.gameState.cow.health;
    let stars = 1;
    if (acc >= 90 && hp >= 80) {
      stars = 3;
    } else if (acc >= 80 && hp >= 50) {
      stars = 2;
    }

    this.time.delayedCall(500, () => {
      if (this.eventsCallback.onLevelComplete) {
        this.eventsCallback.onLevelComplete(this.currentLevel.id, stars, acc, hp);
      }
    });
  }

  private handleGameOver() {
    farmSoundManager.playMoo('hurt');

    // Spin dizzy cow
    this.tweens.add({
      targets: this.cowSprite,
      angle: this.cowSprite.angle + 360,
      alpha: 0.75,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // Floating stars 💫
    const dizzy = this.add.text(
      this.cowSprite.x,
      this.cowSprite.y - 25,
      '💫 DIZZY!',
      {
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#f43f5e',
        backgroundColor: '#ffffff',
        padding: { left: 6, right: 6, top: 2, bottom: 2 },
      }
    );
    dizzy.setOrigin(0.5, 0.5);

    this.time.delayedCall(450, () => {
      if (this.eventsCallback.onGameOver) {
        this.eventsCallback.onGameOver(this.currentLevel.id);
      }
    });
  }
}
