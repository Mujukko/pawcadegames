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

export function ensureCatTextures(scene: Phaser.Scene): void {
  // If already created, don't recreate unless forced
  if (scene.textures.exists('cat-yard-cell') && scene.textures.exists('cat_hero_h2')) {
    return;
  }

  const TILE = 80;
  const PADDING = 6;

  // 1. Grid cell texture (80x80) - Cozy warm cream/mint parquet tile with subtle cat paw
  if (!scene.textures.exists('cat-yard-cell')) {
    const c = scene.textures.createCanvas('cat-yard-cell', TILE, TILE);
    if (c) {
      const ctx = c.getContext();
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, TILE, TILE);

      // Subtle warm border
      ctx.strokeStyle = '#e8e2d9';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, TILE - 2, TILE - 2);

      // Center subtle cat paw print
      ctx.fillStyle = '#e2dacd';
      const cx = TILE / 2;
      const cy = TILE / 2 + 1;
      // Main pad
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // 3 toe dots
      ctx.beginPath();
      ctx.arc(cx - 3.5, cy - 4.5, 1.4, 0, Math.PI * 2);
      ctx.arc(cx, cy - 6, 1.4, 0, Math.PI * 2);
      ctx.arc(cx + 3.5, cy - 4.5, 1.4, 0, Math.PI * 2);
      ctx.fill();

      c.refresh();
    }
  }

  // 2. Cozy Cat Flap Exit Gate (44x80) - warm pastel wood with fish treat icon and runway
  if (!scene.textures.exists('cat-exit-gate')) {
    const c = scene.textures.createCanvas('cat-exit-gate', 44, TILE);
    if (c) {
      const ctx = c.getContext();

      // Warm wood background
      const woodGrad = ctx.createLinearGradient(0, 0, 44, 0);
      woodGrad.addColorStop(0, '#f59e0b');
      woodGrad.addColorStop(0.5, '#d97706');
      woodGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(0, 0, 44, TILE);

      // Soft purple/pink trim (matching Luna's collar)
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(0, 0, 6, TILE);
      ctx.fillRect(38, 0, 6, TILE);

      // Inner glowing exit portal
      const portalGrad = ctx.createLinearGradient(6, 0, 38, 0);
      portalGrad.addColorStop(0, '#10b981');
      portalGrad.addColorStop(1, '#059669');
      ctx.fillStyle = portalGrad;
      ctx.fillRect(6, 4, 32, TILE - 8);

      // Fish bone / fish snack icon at top
      ctx.fillStyle = '#fef08a';
      // Fish head
      ctx.beginPath();
      ctx.moveTo(14, 18);
      ctx.lineTo(26, 13);
      ctx.lineTo(26, 23);
      ctx.closePath();
      ctx.fill();
      // Fish tail
      ctx.beginPath();
      ctx.moveTo(26, 18);
      ctx.lineTo(32, 13);
      ctx.lineTo(32, 23);
      ctx.closePath();
      ctx.fill();

      // Bright white runway chevrons ➔
      ctx.fillStyle = '#ffffff';
      for (let y = 38; y <= TILE - 14; y += 18) {
        ctx.beginPath();
        ctx.moveTo(12, y);
        ctx.lineTo(22, y + 6);
        ctx.lineTo(12, y + 12);
        ctx.lineTo(17, y + 6);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(22, y);
        ctx.lineTo(32, y + 6);
        ctx.lineTo(22, y + 12);
        ctx.lineTo(27, y + 6);
        ctx.closePath();
        ctx.fill();
      }

      c.refresh();
    }
  }

  // 3. Cat Breeds Palette & Styling
  interface CatStyle {
    key: string;
    bodyColor: string;
    bellyColor: string;
    earColor: string;
    innerEarColor: string;
    eyeColor: string;
    eyeType?: 'round' | 'almond';
    stripes?: string;
    spots?: string;
    hasMask?: boolean;
    maskColor?: string;
    collarColor?: string;
    isHero?: boolean;
    fluffy?: boolean;
  }

  const BREEDS: CatStyle[] = [
    {
      key: 'hero',
      bodyColor: '#ffffff',
      bellyColor: '#fef3c7',
      earColor: '#f97316',
      innerEarColor: '#f472b6',
      eyeColor: '#10b981', // Jewel green
      eyeType: 'almond',
      spots: '#f97316', // Calico orange patches
      collarColor: '#ec4899',
      isHero: true,
    },
    {
      key: 'calico',
      bodyColor: '#ffffff',
      bellyColor: '#fef3c7',
      earColor: '#ea580c',
      innerEarColor: '#fbcfe8',
      eyeColor: '#059669',
      eyeType: 'round',
      spots: '#475569',
      collarColor: '#8b5cf6',
    },
    {
      key: 'tabby',
      bodyColor: '#f97316', // Marmalade orange
      bellyColor: '#fed7aa',
      earColor: '#ea580c',
      innerEarColor: '#fbcfe8',
      eyeColor: '#ca8a04',
      eyeType: 'round',
      stripes: '#c2410c',
      collarColor: '#3b82f6',
    },
    {
      key: 'siamese',
      bodyColor: '#fdf4e7', // Cream
      bellyColor: '#fffbeb',
      earColor: '#3d261a', // Seal point brown
      innerEarColor: '#d6b8a8',
      eyeColor: '#0284c7', // Brilliant sapphire blue
      eyeType: 'almond',
      hasMask: true,
      maskColor: '#452b1e',
      collarColor: '#ef4444',
    },
    {
      key: 'black',
      bodyColor: '#1e293b', // Midnight black/tuxedo
      bellyColor: '#f8fafc', // White chest
      earColor: '#0f172a',
      innerEarColor: '#f472b6',
      eyeColor: '#eab308', // Glowing gold
      eyeType: 'round',
      collarColor: '#10b981',
    },
    {
      key: 'russian_blue',
      bodyColor: '#64748b', // Slate silver-blue
      bellyColor: '#94a3b8',
      earColor: '#475569',
      innerEarColor: '#cbd5e1',
      eyeColor: '#10b981', // Emerald green
      eyeType: 'almond',
      collarColor: '#f59e0b',
    },
    {
      key: 'persian',
      bodyColor: '#ffffff', // Cloud white
      bellyColor: '#f8fafc',
      earColor: '#ffffff',
      innerEarColor: '#fbcfe8',
      eyeColor: '#38bdf8',
      eyeType: 'round',
      fluffy: true,
      collarColor: '#a855f7',
    },
    {
      key: 'maine_coon',
      bodyColor: '#78350f', // Warm brown tabby
      bellyColor: '#fde68a',
      earColor: '#451a03',
      innerEarColor: '#fbcfe8',
      eyeColor: '#eab308',
      eyeType: 'almond',
      stripes: '#3a1603',
      fluffy: true,
      collarColor: '#14b8a6',
    },
    {
      key: 'bengal',
      bodyColor: '#d97706', // Golden amber leopard
      bellyColor: '#fef3c7',
      earColor: '#b45309',
      innerEarColor: '#fcd34d',
      eyeColor: '#16a34a',
      eyeType: 'almond',
      spots: '#78350f',
      collarColor: '#ef4444',
    },
  ];

  // Helper function to draw a stylized cat sprite
  const drawCatSprite = (
    breed: CatStyle,
    length: number,
    orientation: 'horizontal' | 'vertical'
  ) => {
    const isHoriz = orientation === 'horizontal';
    const w = isHoriz ? length * TILE - PADDING * 2 : TILE - PADDING * 2;
    const h = isHoriz ? TILE - PADDING * 2 : length * TILE - PADDING * 2;
    const textureKey = `cat_${breed.key}_${isHoriz ? 'h' : 'v'}${length}`;

    if (scene.textures.exists(textureKey)) return;

    const c = scene.textures.createCanvas(textureKey, w, h);
    if (!c) return;
    const ctx = c.getContext();

    // 1. Soft Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    drawRoundRect(ctx, 3, 4, w - 6, h - 5, 20);
    ctx.fill();

    // 2. Main Fur Body with Subtle Gradient
    const bodyGrad = isHoriz
      ? ctx.createLinearGradient(0, 0, 0, h)
      : ctx.createLinearGradient(0, 0, w, 0);
    bodyGrad.addColorStop(0, breed.bodyColor);
    bodyGrad.addColorStop(1, breed.bodyColor);
    ctx.fillStyle = bodyGrad;
    drawRoundRect(ctx, 0, 0, w, h - 3, 20);
    ctx.fill();

    // Subtle outline
    ctx.strokeStyle = breed.bodyColor === '#ffffff' ? '#e2e8f0' : 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 3. Markings: Calico spots / Tabby stripes / Siamese Mask
    if (breed.spots) {
      ctx.fillStyle = breed.spots;
      if (isHoriz) {
        // Organic patches
        ctx.beginPath();
        ctx.ellipse(w * 0.45, h * 0.35, 12, 16, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#334155'; // Darker secondary patch for tricolor calico
        ctx.beginPath();
        ctx.ellipse(w * 0.75, h * 0.6, 14, 10, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(w * 0.4, h * 0.45, 16, 12, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(w * 0.65, h * 0.75, 10, 14, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (breed.stripes) {
      ctx.fillStyle = breed.stripes;
      if (isHoriz) {
        for (let sx = 30; sx <= w - 25; sx += 24) {
          ctx.beginPath();
          ctx.moveTo(sx, 4);
          ctx.lineTo(sx + 4, h * 0.35);
          ctx.lineTo(sx - 4, h * 0.35);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(sx, h - 7);
          ctx.lineTo(sx + 4, h * 0.65);
          ctx.lineTo(sx - 4, h * 0.65);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        for (let sy = 30; sy <= h - 25; sy += 24) {
          ctx.beginPath();
          ctx.moveTo(4, sy);
          ctx.lineTo(w * 0.35, sy + 4);
          ctx.lineTo(w * 0.35, sy - 4);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(w - 4, sy);
          ctx.lineTo(w * 0.65, sy + 4);
          ctx.lineTo(w * 0.65, sy - 4);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // 4. Head and Facial Features
    // Determine head position:
    // For horizontal: head is at the right edge
    // For vertical: head is at the top edge
    const hx = isHoriz ? w - 24 : w / 2;
    const hy = isHoriz ? h / 2 : 24;

    // Pointed Triangular Cat Ears
    ctx.fillStyle = breed.earColor;
    if (isHoriz) {
      // Top ear
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy - 20);
      ctx.lineTo(hx - 14, hy - 32);
      ctx.lineTo(hx + 2, hy - 22);
      ctx.closePath();
      ctx.fill();
      // Inner top ear
      ctx.fillStyle = breed.innerEarColor;
      ctx.beginPath();
      ctx.moveTo(hx - 7, hy - 21);
      ctx.lineTo(hx - 12, hy - 28);
      ctx.lineTo(hx - 1, hy - 22);
      ctx.closePath();
      ctx.fill();

      // Bottom ear
      ctx.fillStyle = breed.earColor;
      ctx.beginPath();
      ctx.moveTo(hx - 8, hy + 20);
      ctx.lineTo(hx - 14, hy + 32);
      ctx.lineTo(hx + 2, hy + 22);
      ctx.closePath();
      ctx.fill();
      // Inner bottom ear
      ctx.fillStyle = breed.innerEarColor;
      ctx.beginPath();
      ctx.moveTo(hx - 7, hy + 21);
      ctx.lineTo(hx - 12, hy + 28);
      ctx.lineTo(hx - 1, hy + 22);
      ctx.closePath();
      ctx.fill();
    } else {
      // Left ear
      ctx.beginPath();
      ctx.moveTo(hx - 20, hy - 6);
      ctx.lineTo(hx - 30, hy - 18);
      ctx.lineTo(hx - 10, hy - 14);
      ctx.closePath();
      ctx.fill();
      // Inner left ear
      ctx.fillStyle = breed.innerEarColor;
      ctx.beginPath();
      ctx.moveTo(hx - 18, hy - 8);
      ctx.lineTo(hx - 26, hy - 16);
      ctx.lineTo(hx - 12, hy - 13);
      ctx.closePath();
      ctx.fill();

      // Right ear
      ctx.fillStyle = breed.earColor;
      ctx.beginPath();
      ctx.moveTo(hx + 20, hy - 6);
      ctx.lineTo(hx + 30, hy - 18);
      ctx.lineTo(hx + 10, hy - 14);
      ctx.closePath();
      ctx.fill();
      // Inner right ear
      ctx.fillStyle = breed.innerEarColor;
      ctx.beginPath();
      ctx.moveTo(hx + 18, hy - 8);
      ctx.lineTo(hx + 26, hy - 16);
      ctx.lineTo(hx + 12, hy - 13);
      ctx.closePath();
      ctx.fill();
    }

    // Siamese Face Mask if applicable
    if (breed.hasMask && breed.maskColor) {
      ctx.fillStyle = breed.maskColor;
      ctx.beginPath();
      ctx.ellipse(hx, hy, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyes
    const eyeSpacing = isHoriz ? 12 : 13;
    const eyeOffset = isHoriz ? 6 : 4;
    const e1x = isHoriz ? hx + eyeOffset : hx - eyeSpacing;
    const e1y = isHoriz ? hy - eyeSpacing : hy - eyeOffset;
    const e2x = isHoriz ? hx + eyeOffset : hx + eyeSpacing;
    const e2y = isHoriz ? hy + eyeSpacing : hy - eyeOffset;

    // Glowing Iris
    ctx.fillStyle = breed.eyeColor;
    ctx.beginPath();
    ctx.arc(e1x, e1y, 4.5, 0, Math.PI * 2);
    ctx.arc(e2x, e2y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Cat Slit Pupil
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(e1x, e1y, 1.6, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(e2x, e2y, 1.6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye catchlight / sparkle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(e1x - 1.2, e1y - 1.5, 1.3, 0, Math.PI * 2);
    ctx.arc(e2x - 1.2, e2y - 1.5, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Pink Button Nose
    const nx = isHoriz ? hx + 12 : hx;
    const ny = isHoriz ? hy : hy + 6;
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(nx - 2.5, ny - 2);
    ctx.lineTo(nx + 2.5, ny - 2);
    ctx.lineTo(nx, ny + 1.5);
    ctx.closePath();
    ctx.fill();

    // Whiskers (3 subtle thin lines on each side)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    if (isHoriz) {
      // Top whiskers
      ctx.beginPath();
      ctx.moveTo(nx, ny - 3);
      ctx.lineTo(nx + 10, ny - 10);
      ctx.moveTo(nx, ny - 1);
      ctx.lineTo(nx + 12, ny - 4);
      ctx.stroke();

      // Bottom whiskers
      ctx.beginPath();
      ctx.moveTo(nx, ny + 1);
      ctx.lineTo(nx + 12, ny + 4);
      ctx.moveTo(nx, ny + 3);
      ctx.lineTo(nx + 10, ny + 10);
      ctx.stroke();
    } else {
      // Left whiskers
      ctx.beginPath();
      ctx.moveTo(nx - 3, ny);
      ctx.lineTo(nx - 14, ny - 4);
      ctx.moveTo(nx - 3, ny + 1);
      ctx.lineTo(nx - 14, ny + 3);
      ctx.stroke();

      // Right whiskers
      ctx.beginPath();
      ctx.moveTo(nx + 3, ny);
      ctx.lineTo(nx + 14, ny - 4);
      ctx.moveTo(nx + 3, ny + 1);
      ctx.lineTo(nx + 14, ny + 3);
      ctx.stroke();
    }

    // Collar & Hero Star Medallion
    const colX = isHoriz ? hx - 14 : hx;
    const colY = isHoriz ? hy : hy + 18;

    if (breed.collarColor) {
      ctx.fillStyle = breed.collarColor;
      if (isHoriz) {
        ctx.fillRect(colX - 3, colY - 18, 6, 36);
      } else {
        ctx.fillRect(colX - 18, colY - 3, 36, 6);
      }

      // Golden Bell or Hero Star
      if (breed.isHero) {
        // Enriched golden star medallion for Luna
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(colX, colY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 5-point star inside
        ctx.fillStyle = '#ffffff';
        const spikes = 5;
        const outerR = 6;
        const innerR = 2.8;
        let rot = (Math.PI / 2) * 3;
        let step = Math.PI / spikes;
        ctx.beginPath();
        ctx.moveTo(colX, colY - outerR);
        for (let i = 0; i < spikes; i++) {
          let x = colX + Math.cos(rot) * outerR;
          let y = colY + Math.sin(rot) * outerR;
          ctx.lineTo(x, y);
          rot += step;
          x = colX + Math.cos(rot) * innerR;
          y = colY + Math.sin(rot) * innerR;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(colX, colY - outerR);
        ctx.closePath();
        ctx.fill();
      } else {
        // Cute brass bell
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(colX, colY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Tail on back end
    const tx = isHoriz ? 12 : w / 2;
    const ty = isHoriz ? h / 2 : h - 14;
    ctx.strokeStyle = breed.earColor || breed.bodyColor;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (isHoriz) {
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx - 12, ty - 8, tx - 10, ty - 18);
    } else {
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + 12, ty + 12, tx + 18, ty + 6);
    }
    ctx.stroke();

    c.refresh();
  };

  // Generate for all breeds and orientations
  for (const b of BREEDS) {
    drawCatSprite(b, 2, 'horizontal');
    drawCatSprite(b, 2, 'vertical');
    drawCatSprite(b, 3, 'horizontal');
    drawCatSprite(b, 3, 'vertical');
  }

  // 4. Obstacles
  // Yarn Ball
  if (!scene.textures.exists('obstacle_yarn')) {
    const c = scene.textures.createCanvas('obstacle_yarn', TILE - PADDING * 2, TILE - PADDING * 2);
    if (c) {
      const ctx = c.getContext();
      const cx = (TILE - PADDING * 2) / 2;
      const cy = cx;

      // Pink/magenta yarn sphere
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();

      // Yarn texture lines
      ctx.strokeStyle = '#db2777';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0.4, 2.8);
      ctx.arc(cx, cy, 12, 1.8, 4.2);
      ctx.stroke();

      // Loose playful thread
      ctx.beginPath();
      ctx.moveTo(cx + 18, cy + 18);
      ctx.quadraticCurveTo(cx + 30, cy + 26, cx + 32, cy + 32);
      ctx.stroke();

      c.refresh();
    }
  }

  // Cardboard Box
  if (!scene.textures.exists('obstacle_box')) {
    const c = scene.textures.createCanvas('obstacle_box', TILE - PADDING * 2, TILE - PADDING * 2);
    if (c) {
      const ctx = c.getContext();
      const size = TILE - PADDING * 2;

      // Cardboard kraft brown
      ctx.fillStyle = '#d97706';
      drawRoundRect(ctx, 4, 4, size - 8, size - 8, 8);
      ctx.fill();

      // Box flaps seam
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size / 2, 6);
      ctx.lineTo(size / 2, size - 6);
      ctx.stroke();

      // Packaging tape
      ctx.fillStyle = 'rgba(254, 243, 199, 0.6)';
      ctx.fillRect(size / 2 - 6, 4, 12, size - 8);

      c.refresh();
    }
  }

  // Scratching Post
  if (!scene.textures.exists('obstacle_scratching_post')) {
    const c = scene.textures.createCanvas('obstacle_scratching_post', TILE - PADDING * 2, TILE - PADDING * 2);
    if (c) {
      const ctx = c.getContext();
      const size = TILE - PADDING * 2;
      const cx = size / 2;

      // Wooden base
      ctx.fillStyle = '#78350f';
      drawRoundRect(ctx, 6, size - 16, size - 12, 12, 4);
      ctx.fill();

      // Sisal rope post
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(cx - 10, 10, 20, size - 26);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      for (let y = 14; y < size - 26; y += 5) {
        ctx.beginPath();
        ctx.moveTo(cx - 10, y);
        ctx.lineTo(cx + 10, y + 2);
        ctx.stroke();
      }

      c.refresh();
    }
  }
}
