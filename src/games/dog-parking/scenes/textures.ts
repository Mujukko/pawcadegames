import Phaser from 'phaser';

export function drawRoundRect(
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

export function ensureDogTextures(scene: Phaser.Scene): void {
  // Check if already created
  if (scene.textures.exists('yard-cell') && scene.textures.exists('dog_hero_h2')) {
    return;
  }

  const TILE = 80;
  const PADDING = 6;

  // 1. Grid cell texture (80x80)
  if (!scene.textures.exists('yard-cell')) {
    const c = scene.textures.createCanvas('yard-cell', TILE, TILE);
    if (c) {
      const ctx = c.getContext();
      // Pavement background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, TILE, TILE);

      // Subtle tile border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, TILE - 2, TILE - 2);

      // Dashed lane guideline
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(TILE / 2, TILE / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      c.refresh();
    }
  }

  // 2. Exit Gate Banner (40x80)
  if (!scene.textures.exists('exit-gate')) {
    const c = scene.textures.createCanvas('exit-gate', 40, TILE);
    if (c) {
      const ctx = c.getContext();
      // Glowing green exit strip
      const grad = ctx.createLinearGradient(0, 0, 40, 0);
      grad.addColorStop(0, '#22c55e');
      grad.addColorStop(1, '#15803d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 40, TILE);

      // Border
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 40, TILE);

      // Chevrons pointing outward
      ctx.fillStyle = '#ffffff';
      for (let y = 16; y <= TILE - 16; y += 24) {
        ctx.beginPath();
        ctx.moveTo(10, y - 8);
        ctx.lineTo(28, y);
        ctx.lineTo(10, y + 8);
        ctx.lineTo(18, y);
        ctx.closePath();
        ctx.fill();
      }

      c.refresh();
    }
  }

  // 3. Hydrant Obstacle (80x80)
  if (!scene.textures.exists('obstacle-hydrant')) {
    const c = scene.textures.createCanvas('obstacle-hydrant', TILE, TILE);
    if (c) {
      const ctx = c.getContext();
      const cx = TILE / 2;
      const cy = TILE / 2;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 22, 22, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hydrant Body
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      drawRoundRect(ctx, cx - 18, cy - 20, 36, 40, 8);
      ctx.fill();

      // Dome Top
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, cy - 18, 16, Math.PI, 0);
      ctx.fill();

      // Top Nut
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - 5, cy - 26, 10, 7);

      // Side caps
      ctx.beginPath();
      ctx.arc(cx - 19, cy - 2, 6, 0, Math.PI * 2);
      ctx.arc(cx + 19, cy - 2, 6, 0, Math.PI * 2);
      ctx.fill();

      c.refresh();
    }
  }

  // 4. Particles
  if (!scene.textures.exists('particle-paw')) {
    const c = scene.textures.createCanvas('particle-paw', 32, 32);
    if (c) {
      const ctx = c.getContext();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(16, 20, 8, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      [[8, 11, 2.8], [13, 8, 3.2], [19, 8, 3.2], [24, 11, 2.8]].forEach(([tx, ty, tr]) => {
        ctx.beginPath();
        ctx.arc(tx!, ty!, tr!, 0, Math.PI * 2);
        ctx.fill();
      });
      c.refresh();
    }
  }

  if (!scene.textures.exists('particle-star')) {
    const c = scene.textures.createCanvas('particle-star', 24, 24);
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

  // 5. Dog Sprites (8 Breeds × 2 Orientations × 2 Lengths)
  const breeds = [
    { key: 'hero', bodyColor: '#f59e0b', accentColor: '#fbbf24', earColor: '#d97706', eyeColor: '#1e293b' },
    { key: 'corgi', bodyColor: '#ea580c', accentColor: '#fed7aa', earColor: '#c2410c', eyeColor: '#1e293b' },
    { key: 'pug', bodyColor: '#d6d3d1', accentColor: '#44403c', earColor: '#292524', eyeColor: '#0f172a' },
    { key: 'shiba', bodyColor: '#d97706', accentColor: '#fef3c7', earColor: '#b45309', eyeColor: '#1e293b' },
    { key: 'dachshund', bodyColor: '#78350f', accentColor: '#92400e', earColor: '#451a03', eyeColor: '#1e293b' },
    { key: 'retriever', bodyColor: '#fbbf24', accentColor: '#fef08a', earColor: '#f59e0b', eyeColor: '#1e293b' },
    { key: 'dalmatian', bodyColor: '#f8fafc', accentColor: '#cbd5e1', earColor: '#1e293b', eyeColor: '#0f172a', hasSpots: true },
    { key: 'poodle', bodyColor: '#fed7aa', accentColor: '#ffedd5', earColor: '#fdba74', eyeColor: '#1e293b' },
  ];

  breeds.forEach(b => {
    drawSingleDog(scene, `dog_${b.key}_h2`, 2 * TILE, TILE, 'h', b, PADDING);
    drawSingleDog(scene, `dog_${b.key}_h3`, 3 * TILE, TILE, 'h', b, PADDING);
    drawSingleDog(scene, `dog_${b.key}_v2`, TILE, 2 * TILE, 'v', b, PADDING);
    drawSingleDog(scene, `dog_${b.key}_v3`, TILE, 3 * TILE, 'v', b, PADDING);
  });
}

function drawSingleDog(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  dir: 'h' | 'v',
  breed: {
    key: string;
    bodyColor: string;
    accentColor: string;
    earColor: string;
    eyeColor: string;
    hasSpots?: boolean;
  },
  pad: number
) {
  if (scene.textures.exists(key)) return;

  const canvas = scene.textures.createCanvas(key, w, h);
  if (!canvas) return;
  const ctx = canvas.getContext();

  const rx = pad;
  const ry = pad;
  const rw = w - pad * 2;
  const rh = h - pad * 2;
  const radius = 22;

  // Drop shadow
  ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  // Main rounded body
  ctx.fillStyle = breed.bodyColor;
  ctx.beginPath();
  drawRoundRect(ctx, rx, ry, rw, rh, radius);
  ctx.fill();

  ctx.shadowColor = 'transparent';

  // Inner highlight
  const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  drawRoundRect(ctx, rx, ry, rw, rh, radius);
  ctx.fill();

  // Outline
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = breed.key === 'hero' ? '#b45309' : 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  drawRoundRect(ctx, rx, ry, rw, rh, radius);
  ctx.stroke();

  // Dalmatian spots
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

  if (dir === 'h') {
    // Horizontal: Head on right
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

    // Tail on left
    ctx.fillStyle = breed.earColor;
    ctx.beginPath();
    ctx.ellipse(rx + 8, headY, 7, 12, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Hero Golden Star Medal
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
    // Vertical: Head facing bottom
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

    // Tail on top
    ctx.fillStyle = breed.earColor;
    ctx.beginPath();
    ctx.ellipse(headX, ry + 8, 12, 7, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
  }

  canvas.refresh();
}
