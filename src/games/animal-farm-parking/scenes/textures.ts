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

export function ensureFarmTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('bessie_cow')) {
    return;
  }

  // 1. Bessie the Cow (Length: 60, Width: 36) - Facing right (rotation 0)
  if (!scene.textures.exists('bessie_cow')) {
    const c = scene.textures.createCanvas('bessie_cow', 66, 42);
    if (c) {
      const ctx = c.getContext();
      const cx = 30; // Body center
      const cy = 21;

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      drawRoundRect(ctx, 4, 6, 56, 32, 14);
      ctx.fill();

      // Main white cow body
      ctx.fillStyle = '#ffffff';
      drawRoundRect(ctx, 4, 3, 52, 34, 15);
      ctx.fill();

      // Subtle contour stroke
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Holstein black cow patches
      ctx.fillStyle = '#0f172a';
      // Patch 1 (mid body)
      ctx.beginPath();
      ctx.ellipse(cx - 4, cy - 6, 11, 7, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Patch 2 (rear)
      ctx.beginPath();
      ctx.ellipse(cx - 16, cy + 5, 8, 9, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Patch 3 (side)
      ctx.beginPath();
      ctx.ellipse(cx + 8, cy + 7, 7, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Hooves (4 dark hooves at sides)
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx - 14, 2, 7, 4);
      ctx.fillRect(cx + 4, 2, 7, 4);
      ctx.fillRect(cx - 14, 34, 7, 4);
      ctx.fillRect(cx + 4, 34, 7, 4);

      // Tail with black fluff tuft
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy);
      ctx.quadraticCurveTo(cx - 28, cy + 3, cx - 29, cy - 2);
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx - 29, cy - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Cow Head (attached to front, right side)
      const hx = cx + 22;
      const hy = cy;

      // Ears (top and bottom)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(hx - 4, hy - 13, 7, 4, -0.4, 0, Math.PI * 2);
      ctx.ellipse(hx - 4, hy + 13, 7, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6'; // Pink inner ear
      ctx.beginPath();
      ctx.ellipse(hx - 4, hy - 13, 4, 2, -0.4, 0, Math.PI * 2);
      ctx.ellipse(hx - 4, hy + 13, 4, 2, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Horns
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx - 2, hy - 8);
      ctx.lineTo(hx + 3, hy - 14);
      ctx.lineTo(hx + 2, hy - 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(hx - 2, hy + 8);
      ctx.lineTo(hx + 3, hy + 14);
      ctx.lineTo(hx + 2, hy + 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Head oval
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(hx, hy, 9, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(hx + 1, hy - 6, 2.2, 0, Math.PI * 2);
      ctx.arc(hx + 1, hy + 6, 2.2, 0, Math.PI * 2);
      ctx.fill();
      // Catchlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx + 1.5, hy - 6.5, 0.8, 0, Math.PI * 2);
      ctx.arc(hx + 1.5, hy + 5.5, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Big pink cow snout
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.ellipse(hx + 7, hy, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f472b6';
      ctx.stroke();

      // Nostrils
      ctx.fillStyle = '#db2777';
      ctx.beginPath();
      ctx.arc(hx + 8, hy - 3, 1.3, 0, Math.PI * 2);
      ctx.arc(hx + 8, hy + 3, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Red collar with brass cowbell
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(hx - 7, hy - 10, 3, 20);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(hx - 7, hy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      ctx.stroke();

      c.refresh();
    }
  }

  // 2. Meadow Farm Tile (64x64)
  if (!scene.textures.exists('farm_grass_tile')) {
    const c = scene.textures.createCanvas('farm_grass_tile', 64, 64);
    if (c) {
      const ctx = c.getContext();
      ctx.fillStyle = '#84cc16'; // Lush spring meadow green
      ctx.fillRect(0, 0, 64, 64);

      // Subtle grass texture lines
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(12, 18, 4, 2);
      ctx.fillRect(44, 10, 4, 2);
      ctx.fillRect(28, 46, 4, 2);
      ctx.fillRect(52, 42, 4, 2);

      // Tiny white daisy flower
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(22, 28, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(22 + Math.cos(ang) * 2.8, 28 + Math.sin(ang) * 2.8, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      c.refresh();
    }
  }

  // 3. Hay Bale Obstacle (Round golden bale)
  if (!scene.textures.exists('obstacle_hay_bale')) {
    const c = scene.textures.createCanvas('obstacle_hay_bale', 48, 48);
    if (c) {
      const ctx = c.getContext();
      const cx = 24;
      const cy = 24;

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(cx + 2, cy + 2, 21, 0, Math.PI * 2);
      ctx.fill();

      // Outer golden bale
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy, 21, 0, Math.PI * 2);
      ctx.fill();

      // Concentric straw rings
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Straw bundle tie ropes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 19, cy);
      ctx.lineTo(cx + 19, cy);
      ctx.moveTo(cx, cy - 19);
      ctx.lineTo(cx, cy + 19);
      ctx.stroke();

      c.refresh();
    }
  }

  // 4. Farm Tractor Obstacle (Top-down green tractor)
  if (!scene.textures.exists('obstacle_tractor')) {
    const c = scene.textures.createCanvas('obstacle_tractor', 110, 65);
    if (c) {
      const ctx = c.getContext();

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      drawRoundRect(ctx, 4, 6, 102, 54, 8);
      ctx.fill();

      // Big Rear Mud Tires (Black with tread)
      ctx.fillStyle = '#1e293b';
      drawRoundRect(ctx, 8, 2, 32, 14, 4); // Rear left
      ctx.fill();
      drawRoundRect(ctx, 8, 48, 32, 14, 4); // Rear right
      ctx.fill();

      // Front Wheels
      drawRoundRect(ctx, 76, 6, 22, 10, 3);
      ctx.fill();
      drawRoundRect(ctx, 76, 48, 22, 10, 3);
      ctx.fill();

      // Main Tractor Chassis (John Deere Farm Green)
      ctx.fillStyle = '#15803d';
      drawRoundRect(ctx, 24, 14, 76, 36, 6);
      ctx.fill();

      // Yellow hood trim stripe
      ctx.fillStyle = '#facc15';
      ctx.fillRect(80, 14, 8, 36);

      // Driver Cab / Seat (Dark tint)
      ctx.fillStyle = '#334155';
      drawRoundRect(ctx, 30, 20, 26, 24, 4);
      ctx.fill();

      // Black vertical exhaust pipe
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(72, 22, 3.5, 0, Math.PI * 2);
      ctx.fill();

      c.refresh();
    }
  }

  // 5. Water Trough Obstacle
  if (!scene.textures.exists('obstacle_water_trough')) {
    const c = scene.textures.createCanvas('obstacle_water_trough', 80, 36);
    if (c) {
      const ctx = c.getContext();

      // Metal trough rim
      ctx.fillStyle = '#64748b';
      drawRoundRect(ctx, 2, 2, 76, 32, 8);
      ctx.fill();

      // Glistening fresh water
      const waterGrad = ctx.createLinearGradient(0, 0, 80, 0);
      waterGrad.addColorStop(0, '#38bdf8');
      waterGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = waterGrad;
      drawRoundRect(ctx, 6, 6, 68, 24, 6);
      ctx.fill();

      // Water highlights
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(12, 9, 24, 3);
      ctx.fillRect(48, 14, 18, 3);

      c.refresh();
    }
  }

  // 6. Fluffy Sheep Obstacle
  if (!scene.textures.exists('obstacle_sheep')) {
    const c = scene.textures.createCanvas('obstacle_sheep', 44, 32);
    if (c) {
      const ctx = c.getContext();

      // Fluffy wool body (White clouds)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(20, 16, 12, 0, Math.PI * 2);
      ctx.arc(14, 13, 8, 0, Math.PI * 2);
      ctx.arc(14, 19, 8, 0, Math.PI * 2);
      ctx.arc(26, 13, 8, 0, Math.PI * 2);
      ctx.arc(26, 19, 8, 0, Math.PI * 2);
      ctx.fill();

      // Black sheep head
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(33, 16, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Little ears
      ctx.beginPath();
      ctx.ellipse(30, 9, 3, 2, -0.4, 0, Math.PI * 2);
      ctx.ellipse(30, 23, 3, 2, 0.4, 0, Math.PI * 2);
      ctx.fill();

      c.refresh();
    }
  }

  // 7. Parking Stall Cow & Milk Emblem (Emblem painted on target parking bay)
  if (!scene.textures.exists('parking_cow_emblem')) {
    const c = scene.textures.createCanvas('parking_cow_emblem', 80, 52);
    if (c) {
      const ctx = c.getContext();

      // Subtle stencil floor mark (cow face + milk bottle) without competing outer border
      // --- Left: Cute Cow Face Logo ---
      const cowX = 26;
      const cowY = 26;

      // Golden Horns
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(cowX - 8, cowY - 10);
      ctx.quadraticCurveTo(cowX - 12, cowY - 17, cowX - 16, cowY - 15);
      ctx.quadraticCurveTo(cowX - 10, cowY - 8, cowX - 6, cowY - 8);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cowX + 8, cowY - 10);
      ctx.quadraticCurveTo(cowX + 12, cowY - 17, cowX + 16, cowY - 15);
      ctx.quadraticCurveTo(cowX + 10, cowY - 8, cowX + 6, cowY - 8);
      ctx.fill();

      // White Ears
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cowX - 13, cowY - 4, 6, 4, -0.3, 0, Math.PI * 2);
      ctx.ellipse(cowX + 13, cowY - 4, 6, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Pink Inner Ears
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.ellipse(cowX - 13, cowY - 4, 3.5, 2, -0.3, 0, Math.PI * 2);
      ctx.ellipse(cowX + 13, cowY - 4, 3.5, 2, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Cow Face Base (White)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cowX, cowY - 3, 11, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Black Holstein patch over right eye
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(cowX + 4, cowY - 8, 4.5, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cowX - 4.5, cowY - 4, 2, 0, Math.PI * 2);
      ctx.arc(cowX + 4.5, cowY - 4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Eye Catchlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cowX - 5.2, cowY - 4.8, 0.8, 0, Math.PI * 2);
      ctx.arc(cowX + 3.8, cowY - 4.8, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Pink Snout / Muzzle
      ctx.fillStyle = '#fbcfe8';
      drawRoundRect(ctx, cowX - 8, cowY + 1, 16, 9, 4.5);
      ctx.fill();
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Nostrils
      ctx.fillStyle = '#9d174d';
      ctx.beginPath();
      ctx.arc(cowX - 3.5, cowY + 5.5, 1.2, 0, Math.PI * 2);
      ctx.arc(cowX + 3.5, cowY + 5.5, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // --- Right: Fresh Milk Bottle Emblem ---
      const milkX = 57;
      const milkY = 26;

      // Bottle Body (White Milk)
      ctx.fillStyle = '#ffffff';
      drawRoundRect(ctx, milkX - 7, milkY - 4, 14, 18, 3);
      ctx.fill();

      // Bottle Neck
      ctx.fillStyle = '#ffffff';
      drawRoundRect(ctx, milkX - 4, milkY - 11, 8, 8, 2);
      ctx.fill();

      // Blue Cap
      ctx.fillStyle = '#0284c7';
      drawRoundRect(ctx, milkX - 5.5, milkY - 14, 11, 4, 2);
      ctx.fill();

      // Sky Blue Outline
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      drawRoundRect(ctx, milkX - 7, milkY - 4, 14, 18, 3);
      ctx.stroke();

      // Milk Label Badge with Text
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MILK', milkX, milkY + 7);

      c.refresh();
    }
  }

  // 10. Collectible Pasture Milk Bottle (32x40)
  if (!scene.textures.exists('milk_bottle_pickup')) {
    const c = scene.textures.createCanvas('milk_bottle_pickup', 32, 40);
    if (c) {
      const ctx = c.getContext();
      const cx = 16;
      const cy = 20;

      // Golden ambient halo / aura
      const grad = ctx.createRadialGradient(cx, cy, 3, cx, cy, 15);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.5)');
      grad.addColorStop(0.7, 'rgba(253, 224, 71, 0.2)');
      grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();

      // Shadow under bottle
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(cx, 36, 9, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glass Bottle Body (White Fresh Milk)
      ctx.fillStyle = '#ffffff';
      drawRoundRect(ctx, cx - 8, cy - 6, 16, 20, 4);
      ctx.fill();

      // Glass shine highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(cx - 6, cy - 4, 3, 16);

      // Bottle Shoulder / Neck
      ctx.fillStyle = '#ffffff';
      drawRoundRect(ctx, cx - 4, cy - 14, 8, 9, 2);
      ctx.fill();

      // Blue Bottle Cap
      ctx.fillStyle = '#0284c7';
      drawRoundRect(ctx, cx - 6, cy - 18, 12, 5, 2);
      ctx.fill();

      // Bottle Contour Stroke
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      drawRoundRect(ctx, cx - 8, cy - 6, 16, 20, 4);
      ctx.stroke();

      // Heart / droplet emblem on label
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(cx, cy + 3, 3, 0, Math.PI * 2);
      ctx.fill();

      c.refresh();
    }
  }
}

