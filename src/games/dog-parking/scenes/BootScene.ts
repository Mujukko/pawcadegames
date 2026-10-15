import Phaser from 'phaser';
import { LevelConfig } from '../logic/types';
import { LEVELS } from '../levels/levelsData';
import { GameSceneEvents } from './GameScene';

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    // Safe fallback for browsers without native ctx.roundRect
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export class BootScene extends Phaser.Scene {
  private initialLevel: LevelConfig = LEVELS[0]!;
  private callbacks?: GameSceneEvents;

  constructor() {
    super('BootScene');
  }

  init(data?: { level?: LevelConfig; callbacks?: GameSceneEvents }) {
    if (data?.level) {
      this.initialLevel = data.level;
    }
    if (data?.callbacks) {
      this.callbacks = data.callbacks;
    }
  }

  preload() {
    // Generate all procedural game textures
    this.createDogTextures();
    this.createEnvironmentTextures();
    this.createEffectTextures();
  }

  create() {
    this.scene.start('GameScene', {
      level: this.initialLevel,
      callbacks: this.callbacks,
    });
  }

  private createDogTextures() {
    const breeds: {
      key: string;
      bodyColor: string;
      accentColor: string;
      earColor: string;
      eyeColor: string;
      hasSpots?: boolean;
      hasPuffs?: boolean;
    }[] = [
      { key: 'hero', bodyColor: '#f59e0b', accentColor: '#fbbf24', earColor: '#d97706', eyeColor: '#1e293b' },
      { key: 'corgi', bodyColor: '#ea580c', accentColor: '#fed7aa', earColor: '#c2410c', eyeColor: '#1e293b' },
      { key: 'pug', bodyColor: '#d6d3d1', accentColor: '#44403c', earColor: '#292524', eyeColor: '#0f172a' },
      { key: 'shiba', bodyColor: '#d97706', accentColor: '#fef3c7', earColor: '#b45309', eyeColor: '#1e293b' },
      { key: 'dachshund', bodyColor: '#78350f', accentColor: '#92400e', earColor: '#451a03', eyeColor: '#1e293b' },
      { key: 'retriever', bodyColor: '#fbbf24', accentColor: '#fef08a', earColor: '#f59e0b', eyeColor: '#1e293b' },
      { key: 'dalmatian', bodyColor: '#f8fafc', accentColor: '#cbd5e1', earColor: '#1e293b', eyeColor: '#0f172a', hasSpots: true },
      { key: 'poodle', bodyColor: '#fed7aa', accentColor: '#ffedd5', earColor: '#fdba74', eyeColor: '#1e293b', hasPuffs: true },
    ];

    const TILE = 80;
    const PADDING = 6;

    breeds.forEach(b => {
      this.drawDogSprite(`dog_${b.key}_h2`, 2 * TILE, TILE, 'h', 2, b, PADDING);
      this.drawDogSprite(`dog_${b.key}_h3`, 3 * TILE, TILE, 'h', 3, b, PADDING);
      this.drawDogSprite(`dog_${b.key}_v2`, TILE, 2 * TILE, 'v', 2, b, PADDING);
      this.drawDogSprite(`dog_${b.key}_v3`, TILE, 3 * TILE, 'v', 3, b, PADDING);
    });
  }

  private drawDogSprite(
    key: string,
    w: number,
    h: number,
    dir: 'h' | 'v',
    len: number,
    breed: {
      key: string;
      bodyColor: string;
      accentColor: string;
      earColor: string;
      eyeColor: string;
      hasSpots?: boolean;
      hasPuffs?: boolean;
    },
    pad: number
  ) {
    if (this.textures.exists(key)) return;

    const canvas = this.textures.createCanvas(key, w, h);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const rx = pad;
    const ry = pad;
    const rw = w - pad * 2;
    const rh = h - pad * 2;
    const radius = 22;

    // Drop shadow
    ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    // Main rounded body
    ctx.fillStyle = breed.bodyColor;
    ctx.beginPath();
    drawRoundRect(ctx, rx, ry, rw, rh, radius);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Inner subtle gradient/highlight
    const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    drawRoundRect(ctx, rx, ry, rw, rh, radius);
    ctx.fill();

    // Border outline
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = breed.key === 'hero' ? '#b45309' : 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    drawRoundRect(ctx, rx, ry, rw, rh, radius);
    ctx.stroke();

    // Spots if Dalmatian
    if (breed.hasSpots) {
      ctx.fillStyle = '#0f172a';
      const spotCoords = dir === 'h' 
        ? [[w * 0.35, h * 0.3], [w * 0.65, h * 0.7], [w * 0.5, h * 0.5], [w * 0.2, h * 0.68]]
        : [[w * 0.3, h * 0.35], [w * 0.7, h * 0.65], [w * 0.5, h * 0.5], [w * 0.68, h * 0.2]];
      spotCoords.forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.arc(sx!, sy!, 5.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Directional features
    if (dir === 'h') {
      const headX = w - pad - 26;
      const headY = h / 2;

      // Ears
      ctx.fillStyle = breed.earColor;
      ctx.beginPath();
      ctx.ellipse(headX - 10, headY - 22, 9, 15, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(headX - 10, headY + 22, 9, 15, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Muzzle
      ctx.fillStyle = breed.accentColor;
      ctx.beginPath();
      ctx.ellipse(headX + 8, headY, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(headX + 16, headY, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = breed.eyeColor;
      ctx.beginPath();
      ctx.arc(headX - 2, headY - 11, 4.5, 0, Math.PI * 2);
      ctx.arc(headX - 2, headY + 11, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Catchlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headX - 3.5, headY - 12.5, 1.8, 0, Math.PI * 2);
      ctx.arc(headX - 3.5, headY + 9.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Tail
      ctx.fillStyle = breed.earColor;
      ctx.beginPath();
      ctx.ellipse(rx + 8, headY, 7, 12, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Star Corgi Collar
      if (breed.key === 'hero') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(headX - 18, headY - 24, 7, 48);

        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(headX - 15, headY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#854d0e';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', headX - 15, headY);
      }
    } else {
      const headX = w / 2;
      const headY = h - pad - 26;

      // Ears
      ctx.fillStyle = breed.earColor;
      ctx.beginPath();
      ctx.ellipse(headX - 22, headY - 10, 15, 9, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(headX + 22, headY - 10, 15, 9, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Muzzle
      ctx.fillStyle = breed.accentColor;
      ctx.beginPath();
      ctx.ellipse(headX, headY + 8, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(headX, headY + 16, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = breed.eyeColor;
      ctx.beginPath();
      ctx.arc(headX - 11, headY - 2, 4.5, 0, Math.PI * 2);
      ctx.arc(headX + 11, headY - 2, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Catchlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headX - 12.5, headY - 3.5, 1.8, 0, Math.PI * 2);
      ctx.arc(headX + 9.5, headY - 3.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Tail
      ctx.fillStyle = breed.earColor;
      ctx.beginPath();
      ctx.ellipse(headX, ry + 8, 12, 7, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
    }

    canvas.refresh();
  }

  private createEnvironmentTextures() {
    const TILE = 80;

    if (!this.textures.exists('yard-cell')) {
      const c = this.textures.createCanvas('yard-cell', TILE, TILE);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, TILE, TILE);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, TILE - 2, TILE - 2);

        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(TILE / 2, TILE / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        c.refresh();
      }
    }

    if (!this.textures.exists('yard-border')) {
      const c = this.textures.createCanvas('yard-border', 16, 16);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#475569';
        ctx.fillRect(2, 2, 12, 12);
        c.refresh();
      }
    }

    if (!this.textures.exists('exit-gate')) {
      const c = this.textures.createCanvas('exit-gate', 36, TILE);
      if (c) {
        const ctx = c.getContext();
        const grad = ctx.createLinearGradient(0, 0, 36, 0);
        grad.addColorStop(0, '#22c55e');
        grad.addColorStop(1, '#15803d');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 36, TILE);

        ctx.fillStyle = '#ffffff';
        for (let y = 16; y <= TILE - 16; y += 24) {
          ctx.beginPath();
          ctx.moveTo(8, y - 8);
          ctx.lineTo(24, y);
          ctx.lineTo(8, y + 8);
          ctx.lineTo(14, y);
          ctx.closePath();
          ctx.fill();
        }

        c.refresh();
      }
    }

    if (!this.textures.exists('obstacle-hydrant')) {
      const c = this.textures.createCanvas('obstacle-hydrant', TILE, TILE);
      if (c) {
        const ctx = c.getContext();
        const cx = TILE / 2;
        const cy = TILE / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 22, 22, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        drawRoundRect(ctx, cx - 18, cy - 20, 36, 40, 8);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy - 18, 16, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(cx - 5, cy - 26, 10, 7);

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(cx - 19, cy - 2, 6, 0, Math.PI * 2);
        ctx.arc(cx + 19, cy - 2, 6, 0, Math.PI * 2);
        ctx.fill();

        c.refresh();
      }
    }
  }

  private createEffectTextures() {
    if (!this.textures.exists('particle-paw')) {
      const c = this.textures.createCanvas('particle-paw', 32, 32);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#f59e0b';

        ctx.beginPath();
        ctx.ellipse(16, 20, 8, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        const toes = [
          [8, 11, 2.8],
          [13, 8, 3.2],
          [19, 8, 3.2],
          [24, 11, 2.8],
        ];
        toes.forEach(([tx, ty, tr]) => {
          ctx.beginPath();
          ctx.arc(tx!, ty!, tr!, 0, Math.PI * 2);
          ctx.fill();
        });

        c.refresh();
      }
    }

    if (!this.textures.exists('particle-star')) {
      const c = this.textures.createCanvas('particle-star', 24, 24);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#fbbf24';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 12, 12);
        c.refresh();
      }
    }
  }
}
