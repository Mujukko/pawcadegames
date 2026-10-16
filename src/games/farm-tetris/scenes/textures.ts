import Phaser from 'phaser';

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
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

export function ensureTetrisTextures(scene: Phaser.Scene) {
  const BLOCK_SIZE = 28;

  // 1. Block O - Golden Hay Bale (Yellow/Gold with twine ropes)
  if (!scene.textures.exists('block_O')) {
    const c = scene.textures.createCanvas('block_O', BLOCK_SIZE, BLOCK_SIZE);
    if (c) {
      const ctx = c.getContext();
      // Base hay gradient
      const grad = ctx.createLinearGradient(0, 0, BLOCK_SIZE, BLOCK_SIZE);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(1, '#eab308');
      ctx.fillStyle = grad;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.fill();

      // Straw texture streaks
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(4, 9);
      ctx.lineTo(24, 9);
      ctx.moveTo(4, 19);
      ctx.lineTo(24, 19);
      ctx.stroke();

      // Twine cross tie
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(14, 2);
      ctx.lineTo(14, 26);
      ctx.stroke();

      // Golden border
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.stroke();

      c.refresh();
    }
  }

  // 2. Block I - Barn Timber Planks (Cyan / Weathered Oak)
  if (!scene.textures.exists('block_I')) {
    const c = scene.textures.createCanvas('block_I', BLOCK_SIZE, BLOCK_SIZE);
    if (c) {
      const ctx = c.getContext();
      const grad = ctx.createLinearGradient(0, 0, 0, BLOCK_SIZE);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.fill();

      // Inner wood grain highlight
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(4, 3, BLOCK_SIZE - 8, 3);

      // Steel bolts on corners
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(5, 5, 1.5, 0, Math.PI * 2);
      ctx.arc(BLOCK_SIZE - 5, 5, 1.5, 0, Math.PI * 2);
      ctx.arc(5, BLOCK_SIZE - 5, 1.5, 0, Math.PI * 2);
      ctx.arc(BLOCK_SIZE - 5, BLOCK_SIZE - 5, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.stroke();

      c.refresh();
    }
  }

  // 3. Block T - Crisp Red Apple Crate
  if (!scene.textures.exists('block_T')) {
    const c = scene.textures.createCanvas('block_T', BLOCK_SIZE, BLOCK_SIZE);
    if (c) {
      const ctx = c.getContext();
      const grad = ctx.createLinearGradient(0, 0, BLOCK_SIZE, BLOCK_SIZE);
      grad.addColorStop(0, '#f87171');
      grad.addColorStop(1, '#dc2626');
      ctx.fillStyle = grad;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.fill();

      // Apple circle stamp
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(14, 15, 7, 0, Math.PI * 2);
      ctx.fill();

      // Green apple leaf
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(15, 8, 3, 1.5, 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.stroke();

      c.refresh();
    }
  }

  // 4. Block S - Farm Lettuce / Cabbage (Emerald Green)
  if (!scene.textures.exists('block_S')) {
    const c = scene.textures.createCanvas('block_S', BLOCK_SIZE, BLOCK_SIZE);
    if (c) {
      const ctx = c.getContext();
      const grad = ctx.createLinearGradient(0, 0, BLOCK_SIZE, BLOCK_SIZE);
      grad.addColorStop(0, '#4ade80');
      grad.addColorStop(1, '#16a34a');
      ctx.fillStyle = grad;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.fill();

      // Leaf veins
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(14, 6);
      ctx.lineTo(14, 22);
      ctx.moveTo(14, 14);
      ctx.lineTo(8, 10);
      ctx.moveTo(14, 16);
      ctx.lineTo(20, 12);
      ctx.stroke();

      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.stroke();

      c.refresh();
    }
  }

  // 5. Block Z - Harvest Pumpkin (Rich Orange)
  if (!scene.textures.exists('block_Z')) {
    const c = scene.textures.createCanvas('block_Z', BLOCK_SIZE, BLOCK_SIZE);
    if (c) {
      const ctx = c.getContext();
      const grad = ctx.createLinearGradient(0, 0, BLOCK_SIZE, BLOCK_SIZE);
      grad.addColorStop(0, '#fb923c');
      grad.addColorStop(1, '#ea580c');
      ctx.fillStyle = grad;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.fill();

      // Pumpkin ribs
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(14, 15, 4.5, 7, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Stem
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(12, 4, 4, 3);

      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.stroke();

      c.refresh();
    }
  }

  // 6. Block J - Blueberry Crate (Indigo / Blue)
  if (!scene.textures.exists('block_J')) {
    const c = scene.textures.createCanvas('block_J', BLOCK_SIZE, BLOCK_SIZE);
    if (c) {
      const ctx = c.getContext();
      const grad = ctx.createLinearGradient(0, 0, BLOCK_SIZE, BLOCK_SIZE);
      grad.addColorStop(0, '#818cf8');
      grad.addColorStop(1, '#4f46e5');
      ctx.fillStyle = grad;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.fill();

      // 3 little blueberries
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.arc(10, 15, 4, 0, Math.PI * 2);
      ctx.arc(18, 15, 4, 0, Math.PI * 2);
      ctx.arc(14, 10, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#3730a3';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.stroke();

      c.refresh();
    }
  }

  // 7. Block L - Golden Sweetcorn (Amber Orange-Yellow)
  if (!scene.textures.exists('block_L')) {
    const c = scene.textures.createCanvas('block_L', BLOCK_SIZE, BLOCK_SIZE);
    if (c) {
      const ctx = c.getContext();
      const grad = ctx.createLinearGradient(0, 0, BLOCK_SIZE, BLOCK_SIZE);
      grad.addColorStop(0, '#fcd34d');
      grad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = grad;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.fill();

      // Corn cob kernels grid
      ctx.fillStyle = '#b45309';
      for (let r = 8; r <= 18; r += 5) {
        for (let x = 8; x <= 20; x += 5) {
          ctx.beginPath();
          ctx.arc(x, r, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, 1.5, 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3, 4);
      ctx.stroke();

      c.refresh();
    }
  }

  // 8. Ghost Block (Translucent guideline shadow)
  if (!scene.textures.exists('block_ghost')) {
    const c = scene.textures.createCanvas('block_ghost', BLOCK_SIZE, BLOCK_SIZE);
    if (c) {
      const ctx = c.getContext();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      drawRoundRect(ctx, 2, 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4, 4);
      ctx.stroke();
      c.refresh();
    }
  }

  // 9. Golden Straw Particle
  if (!scene.textures.exists('particle_hay')) {
    const c = scene.textures.createCanvas('particle_hay', 10, 5);
    if (c) {
      const ctx = c.getContext();
      ctx.fillStyle = '#fde047';
      drawRoundRect(ctx, 0, 0, 10, 4, 1.5);
      ctx.fill();
      c.refresh();
    }
  }

  // 10. Cute Farmer Character - Idle Pose (Resting on Silo)
  if (!scene.textures.exists('farmer_idle')) {
    const c = scene.textures.createCanvas('farmer_idle', 76, 76);
    if (c) {
      const ctx = c.getContext();
      drawFarmer(ctx, 'idle');
      c.refresh();
    }
  }

  // 11. Cute Farmer Character - Cheering / Thumbs-Up / Waving Pose
  if (!scene.textures.exists('farmer_cheer')) {
    const c = scene.textures.createCanvas('farmer_cheer', 76, 76);
    if (c) {
      const ctx = c.getContext();
      drawFarmer(ctx, 'cheer');
      c.refresh();
    }
  }

  // 12. Silo Roof Dome (Width 120, Height 46)
  if (!scene.textures.exists('silo_dome')) {
    const c = scene.textures.createCanvas('silo_dome', 120, 46);
    if (c) {
      const ctx = c.getContext();
      // Metallic zinc roof gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 46);
      grad.addColorStop(0, '#94a3b8');
      grad.addColorStop(0.5, '#cbd5e1');
      grad.addColorStop(1, '#64748b');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.arc(60, 46, 54, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Top antenna / vent cap
      ctx.fillStyle = '#dc2626';
      drawRoundRect(ctx, 55, 2, 10, 8, 2);
      ctx.fill();

      c.refresh();
    }
  }

  // 13. Silo Golden Hay Layer (Texture for filling up the silo window)
  if (!scene.textures.exists('silo_hay_fill')) {
    const c = scene.textures.createCanvas('silo_hay_fill', 90, 40);
    if (c) {
      const ctx = c.getContext();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, 0, 90, 40);

      // Straw streaks
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.2;
      for (let y = 4; y < 40; y += 7) {
        ctx.beginPath();
        ctx.moveTo(2, y);
        ctx.lineTo(88, y);
        ctx.stroke();
      }

      // Twine ties
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(30, 40);
      ctx.moveTo(60, 0);
      ctx.lineTo(60, 40);
      ctx.stroke();

      c.refresh();
    }
  }

  // 14. Farm Background Scenery (580 x 580) - Picturesque semi-transparent countryside
  if (!scene.textures.exists('farm_background_scenery')) {
    const c = scene.textures.createCanvas('farm_background_scenery', 580, 580);
    if (c) {
      const ctx = c.getContext();
      drawFarmBackground(ctx, 580, 580);
      c.refresh();
    }
  }

  // 15. Farm Windmill Rotating Blades (72 x 72)
  if (!scene.textures.exists('farm_windmill_blades')) {
    const c = scene.textures.createCanvas('farm_windmill_blades', 72, 72);
    if (c) {
      const ctx = c.getContext();
      drawWindmillBlades(ctx, 72);
      c.refresh();
    }
  }

  // 16. Farm Drifting Clouds (80 x 36 and 90 x 36)
  if (!scene.textures.exists('farm_cloud_1')) {
    const c = scene.textures.createCanvas('farm_cloud_1', 80, 36);
    if (c) {
      const ctx = c.getContext();
      drawCloud(ctx, 80, 36, 1);
      c.refresh();
    }
  }

  if (!scene.textures.exists('farm_cloud_2')) {
    const c = scene.textures.createCanvas('farm_cloud_2', 90, 36);
    if (c) {
      const ctx = c.getContext();
      drawCloud(ctx, 90, 36, 2);
      c.refresh();
    }
  }
}

function drawFarmer(ctx: CanvasRenderingContext2D, pose: 'idle' | 'cheer') {
  const cx = 38;
  const cy = 38;

  // Legs hanging over silo edge
  ctx.fillStyle = '#1e3a8a'; // Denim dungarees blue
  drawRoundRect(ctx, cx - 12, cy + 18, 9, 14, 3);
  drawRoundRect(ctx, cx + 3, cy + 18, 9, 14, 3);
  ctx.fill();

  // Brown work boots
  ctx.fillStyle = '#78350f';
  drawRoundRect(ctx, cx - 14, cy + 28, 12, 6, 2.5);
  drawRoundRect(ctx, cx + 2, cy + 28, 12, 6, 2.5);
  ctx.fill();

  // Torso (Denim Dungarees with yellow flannel shirt)
  ctx.fillStyle = '#facc15'; // Yellow shirt
  drawRoundRect(ctx, cx - 14, cy - 2, 28, 22, 6);
  ctx.fill();

  ctx.fillStyle = '#1e3a8a'; // Blue overalls bib
  drawRoundRect(ctx, cx - 11, cy + 2, 22, 18, 4);
  ctx.fill();

  // Overall brass straps
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(cx - 9, cy, 4, 18);
  ctx.fillRect(cx + 5, cy, 4, 18);

  // Big front patch pocket
  ctx.fillStyle = '#172554';
  drawRoundRect(ctx, cx - 6, cy + 10, 12, 8, 2);
  ctx.fill();

  // Neckerchief (Red bandana)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 2);
  ctx.lineTo(cx + 6, cy - 2);
  ctx.lineTo(cx, cy + 4);
  ctx.closePath();
  ctx.fill();

  // Arms & Hands
  ctx.fillStyle = '#facc15'; // Shirt sleeve
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1;

  if (pose === 'idle') {
    // Hands resting on knees
    drawRoundRect(ctx, cx - 19, cy + 4, 7, 14, 3.5);
    drawRoundRect(ctx, cx + 12, cy + 4, 7, 14, 3.5);
    ctx.fill();

    // Work gloves (white/cream)
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(cx - 15, cy + 17, 4.5, 0, Math.PI * 2);
    ctx.arc(cx + 15, cy + 17, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Cheering arms raised high in the air!
    // Left arm
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 2);
    ctx.lineTo(cx - 24, cy - 14);
    ctx.lineTo(cx - 18, cy - 18);
    ctx.lineTo(cx - 8, cy - 2);
    ctx.fill();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(cx + 12, cy + 2);
    ctx.lineTo(cx + 24, cy - 14);
    ctx.lineTo(cx + 18, cy - 18);
    ctx.lineTo(cx + 8, cy - 2);
    ctx.fill();

    // Cheering waving gloved hands with thumbs up
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(cx - 21, cy - 17, 5.5, 0, Math.PI * 2);
    ctx.arc(cx + 21, cy - 17, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle star above hand
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx - 26, cy - 24, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 26, cy - 24, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head (Cute friendly round face)
  ctx.fillStyle = '#ffedd5'; // Peach skin
  ctx.beginPath();
  ctx.arc(cx, cy - 8, 12, 0, Math.PI * 2);
  ctx.fill();

  // Rosy blushing cheeks
  ctx.fillStyle = '#fca5a5';
  ctx.beginPath();
  ctx.arc(cx - 8, cy - 5, 3, 0, Math.PI * 2);
  ctx.arc(cx + 8, cy - 5, 3, 0, Math.PI * 2);
  ctx.fill();

  // Smiling Eyes (Happy arcs)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 9, 2.5, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 5, cy - 9, 2.5, Math.PI, 0);
  ctx.stroke();

  // Big Happy Smile
  ctx.beginPath();
  if (pose === 'cheer') {
    // Open happy mouth!
    ctx.fillStyle = '#be123c';
    ctx.arc(cx, cy - 4, 4, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  } else {
    // Friendly warm smile
    ctx.arc(cx, cy - 5, 3.5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  // Straw Hat (Wide brim + tall crown)
  ctx.fillStyle = '#d97706'; // Golden straw
  // Brim
  ctx.beginPath();
  ctx.ellipse(cx, cy - 16, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Hat crown
  ctx.fillStyle = '#f59e0b';
  drawRoundRect(ctx, cx - 11, cy - 29, 22, 14, 4);
  ctx.fill();
  ctx.stroke();

  // Red Hat Band
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(cx - 11, cy - 19, 22, 4);

  // Straw wheat stalk tucked in hat band
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy - 18);
  ctx.quadraticCurveTo(cx + 14, cy - 25, cx + 18, cy - 24);
  ctx.stroke();
}

function drawHayBale(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#eab308';
  drawRoundRect(ctx, x, y, w, h, h * 0.4);
  ctx.fill();
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Straw texture lines
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 0.8;
  for (let ly = y + 4; ly < y + h - 2; ly += 4) {
    ctx.beginPath();
    ctx.moveTo(x + 5, ly);
    ctx.lineTo(x + w - 5, ly);
    ctx.stroke();
  }

  // Twine ropes
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.35, y);
  ctx.lineTo(x + w * 0.35, y + h);
  ctx.moveTo(x + w * 0.65, y);
  ctx.lineTo(x + w * 0.65, y + h);
  ctx.stroke();

  // Spiral swirl on round end
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x + 4, y + h / 2, 3, h * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFarmTree(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  // Trunk
  ctx.fillStyle = '#5c3317';
  ctx.fillRect(x - r * 0.16, y, r * 0.32, r * 0.9);

  // Foliage clusters (overlapping leafy circles)
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(x, y - r * 0.4, r * 0.65, 0, Math.PI * 2);
  ctx.arc(x - r * 0.45, y - r * 0.15, r * 0.5, 0, Math.PI * 2);
  ctx.arc(x + r * 0.45, y - r * 0.15, r * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Highlight crest
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(x - r * 0.15, y - r * 0.5, r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Tiny red apples
  ctx.fillStyle = '#ef4444';
  const apples = [
    { ox: -r * 0.25, oy: -r * 0.2 },
    { ox: r * 0.22, oy: -r * 0.3 },
    { ox: 0, oy: -r * 0.05 },
    { ox: r * 0.35, oy: -r * 0.08 },
    { ox: -r * 0.35, oy: -r * 0.4 },
  ];
  for (const ap of apples) {
    ctx.beginPath();
    ctx.arc(x + ap.ox, y + ap.oy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFarmhouse(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  // Cottage walls
  ctx.fillStyle = '#f8fafc'; // White weatherboard
  ctx.fillRect(x, y, 42, 28);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, 42, 28);

  // Pitched gable roof
  ctx.fillStyle = '#854d0e'; // Timber shingle
  ctx.beginPath();
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x + 21, y - 18);
  ctx.lineTo(x + 47, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5c3317';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Red brick chimney with soft smoke puff
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(x + 30, y - 22, 6, 12);
  // Smoke puff
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(x + 33, y - 26, 3, 0, Math.PI * 2);
  ctx.arc(x + 35, y - 32, 4.5, 0, Math.PI * 2);
  ctx.arc(x + 38, y - 39, 6, 0, Math.PI * 2);
  ctx.fill();

  // Cozy glowing amber windows
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x + 6, y + 6, 8, 8);
  ctx.fillRect(x + 28, y + 6, 8, 8);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 6, y + 6, 8, 8);
  ctx.strokeRect(x + 28, y + 6, 8, 8);

  // Cottage front door
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(x + 17, y + 10, 8, 18);
  ctx.restore();
}

function drawWindmillBlades(ctx: CanvasRenderingContext2D, size: number) {
  const center = size / 2;
  const bladeLen = size * 0.44;
  const bladeW = size * 0.08;

  ctx.save();
  ctx.translate(center, center);

  // 4 lattice sail blades
  for (let i = 0; i < 4; i++) {
    ctx.rotate((Math.PI / 2) * i);

    // Blade timber spar
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -bladeLen);
    ctx.stroke();

    // Canvas sail cloth (cream/white)
    ctx.fillStyle = 'rgba(254, 249, 195, 0.9)';
    ctx.fillRect(2, -bladeLen + 4, bladeW, bladeLen - 8);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, -bladeLen + 4, bladeW, bladeLen - 8);

    // Lattice cross ribs
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 0.8;
    for (let r = -bladeLen + 8; r < -4; r += 6) {
      ctx.beginPath();
      ctx.moveTo(2, r);
      ctx.lineTo(2 + bladeW, r);
      ctx.stroke();
    }
  }

  // Central hub
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCloud(ctx: CanvasRenderingContext2D, w: number, h: number, style: 1 | 2) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';

  if (style === 1) {
    ctx.beginPath();
    ctx.arc(22, 22, 14, 0, Math.PI * 2);
    ctx.arc(38, 16, 17, 0, Math.PI * 2);
    ctx.arc(56, 20, 13, 0, Math.PI * 2);
    ctx.arc(42, 26, 11, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(24, 20, 13, 0, Math.PI * 2);
    ctx.arc(42, 14, 16, 0, Math.PI * 2);
    ctx.arc(60, 18, 15, 0, Math.PI * 2);
    ctx.arc(72, 22, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFarmBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // 1. Sky Gradient: Twilight Amber to Golden Sunset Glow
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
  skyGrad.addColorStop(0, '#1c1917'); // Dark slate/warm night sky at top
  skyGrad.addColorStop(0.35, '#291e28'); // Twilight plum
  skyGrad.addColorStop(0.65, '#78350f'); // Warm amber glow
  skyGrad.addColorStop(0.9, '#d97706'); // Golden horizon
  skyGrad.addColorStop(1, '#fde68a'); // Bright sunset rim
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Soft Glowing Golden Sun Disc
  const sunX = 330;
  const sunY = 240;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 110);
  sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
  sunGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.45)');
  sunGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 110, 0, Math.PI * 2);
  ctx.fill();

  // Sun core
  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 24, 0, Math.PI * 2);
  ctx.fill();

  // 3. Distant Mountain / Forest Ridge (Layer 1 - deep purple/brown silhouette)
  ctx.fillStyle = '#261b2e';
  ctx.beginPath();
  ctx.moveTo(0, 280);
  ctx.bezierCurveTo(90, 240, 180, 270, 260, 250);
  ctx.bezierCurveTo(340, 230, 420, 260, 500, 245);
  ctx.bezierCurveTo(540, 240, 560, 250, 580, 255);
  ctx.lineTo(580, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Distant pine tree silhouettes along the ridge
  ctx.fillStyle = '#1c1322';
  for (let px = 20; px < 560; px += 28) {
    const py = 250 + Math.sin(px * 0.05) * 12;
    ctx.beginPath();
    ctx.moveTo(px, py - 14);
    ctx.lineTo(px + 6, py);
    ctx.lineTo(px - 6, py);
    ctx.closePath();
    ctx.fill();
  }

  // 4. Midground Rolling Golden Wheat Hill (Layer 2)
  const midHillGrad = ctx.createLinearGradient(0, 270, 0, 450);
  midHillGrad.addColorStop(0, '#92400e'); // Deep amber
  midHillGrad.addColorStop(0.5, '#713f12');
  midHillGrad.addColorStop(1, '#3f2510');
  ctx.fillStyle = midHillGrad;
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.bezierCurveTo(120, 300, 250, 370, 410, 310);
  ctx.bezierCurveTo(480, 290, 530, 320, 580, 315);
  ctx.lineTo(580, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // 5. Classic Red Barn on the Meadow Slope (Center-Left: x: 195, y: 320)
  const barnX = 215;
  const barnY = 325;
  // Barn main body
  ctx.fillStyle = '#991b1b'; // Barn Red
  ctx.fillRect(barnX, barnY, 75, 52);
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 2;
  ctx.strokeRect(barnX, barnY, 75, 52);

  // Barn Gambrel/Pitched Roof
  ctx.fillStyle = '#475569'; // Slate roof
  ctx.beginPath();
  ctx.moveTo(barnX - 6, barnY);
  ctx.lineTo(barnX + 18, barnY - 22);
  ctx.lineTo(barnX + 37.5, barnY - 30);
  ctx.lineTo(barnX + 57, barnY - 22);
  ctx.lineTo(barnX + 81, barnY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f8fafc'; // White roof trim
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cupola on barn roof with weather vane
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(barnX + 32, barnY - 38, 11, 8);
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.moveTo(barnX + 30, barnY - 38);
  ctx.lineTo(barnX + 37.5, barnY - 45);
  ctx.lineTo(barnX + 45, barnY - 38);
  ctx.closePath();
  ctx.fill();
  // Weather vane rooster line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(barnX + 37.5, barnY - 45);
  ctx.lineTo(barnX + 37.5, barnY - 52);
  ctx.moveTo(barnX + 33, barnY - 48);
  ctx.lineTo(barnX + 42, barnY - 48);
  ctx.stroke();

  // White Barn Trim & X-Braced Sliding Doors
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(barnX + 22, barnY + 16, 31, 36);
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(barnX + 24, barnY + 18, 27, 34);

  // White X cross braces
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(barnX + 24, barnY + 18);
  ctx.lineTo(barnX + 37, barnY + 35);
  ctx.lineTo(barnX + 24, barnY + 52);
  ctx.moveTo(barnX + 37, barnY + 18);
  ctx.lineTo(barnX + 24, barnY + 35);
  ctx.lineTo(barnX + 37, barnY + 52);

  ctx.moveTo(barnX + 38, barnY + 18);
  ctx.lineTo(barnX + 51, barnY + 35);
  ctx.lineTo(barnX + 38, barnY + 52);
  ctx.moveTo(barnX + 51, barnY + 18);
  ctx.lineTo(barnX + 38, barnY + 35);
  ctx.lineTo(barnX + 51, barnY + 52);
  ctx.stroke();

  // Barn Hayloft window
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(barnX + 31, barnY + 3, 13, 10);
  ctx.fillStyle = '#fef08a'; // Warm glowing lantern inside
  ctx.fillRect(barnX + 33, barnY + 5, 9, 6);

  // Silo next to the barn
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(barnX + 78, barnY - 14, 18, 66);
  ctx.beginPath();
  ctx.arc(barnX + 87, barnY - 14, 9, Math.PI, 0);
  ctx.fillStyle = '#94a3b8';
  ctx.fill();

  // 6. Farm Windmill Tower on the Left Meadow (x: 82, y: 440)
  const wmX = 82;
  const wmY = 440;
  // Windmill stone base
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(wmX - 16, wmY + 45);
  ctx.lineTo(wmX - 10, wmY - 15);
  ctx.lineTo(wmX + 10, wmY - 15);
  ctx.lineTo(wmX + 16, wmY + 45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Windmill cap
  ctx.fillStyle = '#854d0e';
  ctx.beginPath();
  ctx.arc(wmX, wmY - 15, 11, Math.PI, 0);
  ctx.fill();
  // Hub
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(wmX, wmY - 15, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 7. Foreground Rolling Pasture Hill (Layer 3 - Rich lush meadow green & gold)
  const fgGrad = ctx.createLinearGradient(0, 390, 0, height);
  fgGrad.addColorStop(0, '#15803d'); // Rich field green
  fgGrad.addColorStop(0.4, '#166534');
  fgGrad.addColorStop(1, '#14532d');
  ctx.fillStyle = fgGrad;
  ctx.beginPath();
  ctx.moveTo(0, 470);
  ctx.bezierCurveTo(150, 430, 290, 485, 430, 420);
  ctx.bezierCurveTo(490, 400, 540, 435, 580, 425);
  ctx.lineTo(580, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // 8. Rustic Post-and-Rail Wooden Fences across the Meadow
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 2;
  // Fence rails
  ctx.beginPath();
  ctx.moveTo(330, 450);
  ctx.quadraticCurveTo(420, 440, 560, 480);
  ctx.moveTo(330, 458);
  ctx.quadraticCurveTo(420, 448, 560, 488);
  ctx.stroke();

  // Fence posts
  for (let fx = 345; fx < 560; fx += 35) {
    const fy = 450 + (fx - 330) * 0.12;
    ctx.beginPath();
    ctx.moveTo(fx, fy - 6);
    ctx.lineTo(fx, fy + 16);
    ctx.stroke();
  }

  // 9. Round Hay Bales in the Meadow
  drawHayBale(ctx, 380, 470, 24, 18);
  drawHayBale(ctx, 475, 495, 28, 20);
  drawHayBale(ctx, 120, 505, 26, 19);

  // 10. Apple & Oak Trees
  drawFarmTree(ctx, 335, 395, 28);
  drawFarmTree(ctx, 145, 415, 24);
  drawFarmTree(ctx, 520, 410, 32);

  // 11. Cozy Farmhouse Cottage (x: 430, y: 395)
  drawFarmhouse(ctx, 430, 395);
}
