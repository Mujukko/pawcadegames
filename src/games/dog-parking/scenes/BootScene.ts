import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Generate all procedural game textures
    this.createDogTextures();
    this.createEnvironmentTextures();
    this.createEffectTextures();
  }

  create() {
    this.scene.start('GameScene');
  }

  private createDogTextures() {
    // Breeds color themes and details
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

    // For both horizontal and vertical orientations and lengths 2 and 3
    const TILE = 80;
    const PADDING = 6;

    breeds.forEach(b => {
      // Horizontal length 2 (160x80)
      this.drawDogSprite(`dog_${b.key}_h2`, 2 * TILE, TILE, 'h', 2, b, PADDING);
      // Horizontal length 3 (240x80)
      this.drawDogSprite(`dog_${b.key}_h3`, 3 * TILE, TILE, 'h', 3, b, PADDING);
      // Vertical length 2 (80x160)
      this.drawDogSprite(`dog_${b.key}_v2`, TILE, 2 * TILE, 'v', 2, b, PADDING);
      // Vertical length 3 (80x240)
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
    ctx.roundRect(rx, ry, rw, rh, radius);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Inner subtle gradient/highlight
    const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, radius);
    ctx.fill();

    // Border outline
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = breed.key === 'hero' ? '#b45309' : 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, radius);
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

    // Directional features (Head, Eyes, Nose, Ears, Tail)
    if (dir === 'h') {
      // Facing right
      const headX = w - pad - 26;
      const headY = h / 2;

      // Ears
      ctx.fillStyle = breed.earColor;
      // Top ear
      ctx.beginPath();
      ctx.ellipse(headX - 10, headY - 22, 9, 15, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      // Bottom ear
      ctx.beginPath();
      ctx.ellipse(headX - 10, headY + 22, 9, 15, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Muzzle / Snout accent
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

      // Eye catchlights (sparkle)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headX - 3.5, headY - 12.5, 1.8, 0, Math.PI * 2);
      ctx.arc(headX - 3.5, headY + 9.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Tail on left
      ctx.fillStyle = breed.earColor;
      ctx.beginPath();
      ctx.ellipse(rx + 8, headY, 7, 12, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Hero Collar with Star Badge
      if (breed.key === 'hero') {
        // Red collar band
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(headX - 18, headY - 24, 7, 48);

        // Gold Star medal
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
      // Facing Downward
      const headX = w / 2;
      const headY = h - pad - 26;

      // Ears
      ctx.fillStyle = breed.earColor;
      // Left ear
      ctx.beginPath();
      ctx.ellipse(headX - 22, headY - 10, 15, 9, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      // Right ear
      ctx.beginPath();
      ctx.ellipse(headX + 22, headY - 10, 15, 9, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Muzzle / Snout accent
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

      // Eye catchlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headX - 12.5, headY - 3.5, 1.8, 0, Math.PI * 2);
      ctx.arc(headX + 9.5, headY - 3.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Tail on top
      ctx.fillStyle = breed.earColor;
      ctx.beginPath();
      ctx.ellipse(headX, ry + 8, 12, 7, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
    }

    canvas.refresh();
  }

  private createEnvironmentTextures() {
    const TILE = 80;

    // 1. Grid cell background
    if (!this.textures.exists('yard-cell')) {
      const c = this.textures.createCanvas('yard-cell', TILE, TILE);
      if (c) {
        const ctx = c.getContext();
        // Warm driveway/pavement tone
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, TILE, TILE);

        // Subtle inner border
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, TILE - 2, TILE - 2);

        // Center cute parking spot dot/mark
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(TILE / 2, TILE / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        c.refresh();
      }
    }

    // 2. Yard border / fence
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

    // 3. Exit Gate Banner
    if (!this.textures.exists('exit-gate')) {
      const c = this.textures.createCanvas('exit-gate', 36, TILE);
      if (c) {
        const ctx = c.getContext();
        // Glowing vibrant green exit strip
        const grad = ctx.createLinearGradient(0, 0, 36, 0);
        grad.addColorStop(0, '#22c55e');
        grad.addColorStop(1, '#15803d');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 36, TILE);

        // Chevrons pointing outward
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

    // 4. Hydrant Obstacle
    if (!this.textures.exists('obstacle-hydrant')) {
      const c = this.textures.createCanvas('obstacle-hydrant', TILE, TILE);
      if (c) {
        const ctx = c.getContext();
        const cx = TILE / 2;
        const cy = TILE / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 22, 22, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hydrant Red Base
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(cx - 18, cy - 20, 36, 40, 8);
        ctx.fill();

        // Hydrant Dome Top
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy - 18, 16, Math.PI, 0);
        ctx.fill();

        // Top Nut
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(cx - 5, cy - 26, 10, 7);

        // Side nozzle caps
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
    // 1. Paw print particle
    if (!this.textures.exists('particle-paw')) {
      const c = this.textures.createCanvas('particle-paw', 32, 32);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#f59e0b';

        // Main pad
        ctx.beginPath();
        ctx.ellipse(16, 20, 8, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4 toe beans
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

    // 2. Star particle
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
