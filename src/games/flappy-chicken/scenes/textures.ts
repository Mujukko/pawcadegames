import Phaser from 'phaser';

/**
 * Procedurally generates all graphics, textures, and sprites for Flappy Chicken
 */
export function generateFlappyTextures(scene: Phaser.Scene): void {
  // 1. Clucky the Chicken Sprites (3 wing animation frames)
  (['mid', 'up', 'down'] as const).forEach((wingPos) => {
    const key = `chicken_${wingPos}`;
    if (scene.textures.exists(key)) return;

    const g = scene.make.graphics({ x: 0, y: 0 });

    // Feet (Yellow chicken feet tucked behind)
    g.fillStyle(0xf59e0b, 1);
    g.fillRoundedRect(4, 28, 8, 4, 2);
    g.fillRoundedRect(10, 30, 8, 4, 2);

    // Body (Plump round white chicken body with soft cream shading)
    g.fillStyle(0xf1f5f9, 1);
    g.fillEllipse(24, 22, 34, 30);
    g.fillStyle(0xe2e8f0, 1);
    g.fillEllipse(20, 24, 28, 24);

    // Fluffy tail feathers
    g.fillStyle(0xf8fafc, 1);
    g.fillTriangle(6, 16, 2, 8, 14, 18);
    g.fillTriangle(4, 22, 0, 16, 12, 22);

    // Red Crown / Comb on Head (3 rounded crests)
    g.fillStyle(0xef4444, 1);
    g.fillCircle(24, 7, 5);
    g.fillCircle(29, 5, 6);
    g.fillCircle(34, 7, 5);

    // Red Wattle under beak
    g.fillStyle(0xdc2626, 1);
    g.fillCircle(38, 25, 4);

    // Orange Beak
    g.fillStyle(0xf97316, 1);
    g.fillTriangle(37, 16, 47, 21, 37, 26);
    g.fillStyle(0xea580c, 1);
    g.fillTriangle(37, 21, 46, 21, 37, 26);

    // Big expressive cartoon eye
    g.fillStyle(0xffffff, 1);
    g.fillCircle(30, 15, 6);
    g.fillStyle(0x1e293b, 1);
    g.fillCircle(32, 15, 3.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(33, 13.5, 1.2); // pupil glint

    // Wing based on position
    g.fillStyle(0xffffff, 1);
    g.lineStyle(1.5, 0xcbd5e1, 1);

    if (wingPos === 'mid') {
      g.fillRoundedRect(12, 18, 18, 11, 5);
      g.strokeRoundedRect(12, 18, 18, 11, 5);
    } else if (wingPos === 'up') {
      g.fillRoundedRect(11, 10, 18, 12, 5);
      g.strokeRoundedRect(11, 10, 18, 12, 5);
    } else {
      g.fillRoundedRect(13, 24, 18, 12, 5);
      g.strokeRoundedRect(13, 24, 18, 12, 5);
    }

    g.generateTexture(key, 48, 42);
    g.destroy();
  });

  // 2. Feather Particle Texture
  if (!scene.textures.exists('feather')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 0.9);
    g.fillEllipse(5, 5, 8, 4);
    g.lineStyle(1, 0xe2e8f0, 0.8);
    g.lineBetween(1, 5, 9, 5);
    g.generateTexture('feather', 10, 10);
    g.destroy();
  }

  // 3. Golden Wheat Grain Pickup
  if (!scene.textures.exists('wheat_grain')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Golden glow aura
    g.fillStyle(0xfef08a, 0.4);
    g.fillCircle(12, 12, 11);
    // Golden seed body
    g.fillStyle(0xf59e0b, 1);
    g.fillEllipse(12, 12, 14, 8);
    // Highlight
    g.fillStyle(0xfef08a, 1);
    g.fillEllipse(10, 10, 8, 4);
    // Kernel spine
    g.lineStyle(1, 0xb45309, 0.8);
    g.lineBetween(6, 12, 18, 12);
    g.generateTexture('wheat_grain', 24, 24);
    g.destroy();
  }

  // 4. Rustic Wooden Fence / Farm Barn Column (Upper & Lower Pipe)
  if (!scene.textures.exists('farm_pipe_shaft')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const width = 68;
    const height = 480;

    // Rich wooden planks with grain lines
    g.fillStyle(0x78350f, 1); // Dark amber wood base
    g.fillRect(0, 0, width, height);

    // Lighter wood slats
    g.fillStyle(0x92400e, 1);
    g.fillRect(4, 0, 28, height);
    g.fillStyle(0xb45309, 1);
    g.fillRect(36, 0, 28, height);

    // Vertical plank separator groove
    g.fillStyle(0x451a03, 1);
    g.fillRect(32, 0, 4, height);

    // Subtle horizontal wood grain rings
    g.fillStyle(0x451a03, 0.3);
    for (let y = 20; y < height; y += 45) {
      g.fillRoundedRect(4, y, width - 8, 2, 1);
      g.fillCircle(18, y + 15, 3); // knot
    }

    // Outer border shadows
    g.fillStyle(0x000000, 0.35);
    g.fillRect(0, 0, 4, height);
    g.fillRect(width - 4, 0, 4, height);

    g.generateTexture('farm_pipe_shaft', width, height);
    g.destroy();
  }

  // Pipe End Cap (Wood lintel with rivets & barn trim)
  if (!scene.textures.exists('farm_pipe_cap')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const width = 76;
    const height = 30;

    // Heavy wooden lintel cap
    g.fillStyle(0x78350f, 1);
    g.fillRoundedRect(0, 0, width, height, 5);

    g.fillStyle(0xb45309, 1);
    g.fillRoundedRect(3, 3, width - 6, height - 6, 4);

    // Iron rivets
    g.fillStyle(0x1e293b, 1);
    g.fillCircle(8, 15, 3);
    g.fillCircle(width - 8, 15, 3);
    g.fillStyle(0x94a3b8, 1);
    g.fillCircle(7, 14, 1);
    g.fillCircle(width - 9, 14, 1);

    // Green ivy leaves hanging on cap
    g.fillStyle(0x15803d, 1);
    g.fillEllipse(18, 24, 8, 5);
    g.fillEllipse(25, 26, 6, 4);
    g.fillEllipse(48, 25, 7, 4);

    g.generateTexture('farm_pipe_cap', width, height);
    g.destroy();
  }

  // 5. Grand Golden Wheat Field & Granary Wagon (Goal Arrival!)
  if (!scene.textures.exists('wheat_wagon_goal')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const w = 180;
    const h = 260;

    // Radiant golden light aura behind the wheat
    g.fillStyle(0xfef08a, 0.35);
    g.fillCircle(w / 2, 90, 75);
    g.fillStyle(0xfef08a, 0.6);
    g.fillCircle(w / 2, 90, 50);

    // Golden sheaves of wheat spreading out
    g.fillStyle(0xd97706, 1);
    g.fillEllipse(w / 2 - 35, 80, 45, 90);
    g.fillEllipse(w / 2 + 35, 80, 45, 90);
    g.fillStyle(0xf59e0b, 1);
    g.fillEllipse(w / 2, 70, 55, 110);

    // Wheat ear seed grains (lots of golden dots)
    g.fillStyle(0xfef08a, 1);
    for (let i = 0; i < 28; i++) {
      const rx = w / 2 - 40 + Math.random() * 80;
      const ry = 30 + Math.random() * 90;
      g.fillEllipse(rx, ry, 6, 10);
    }

    // Red celebration bow around wheat bundle
    g.fillStyle(0xef4444, 1);
    g.fillRoundedRect(w / 2 - 35, 120, 70, 14, 4);
    g.fillCircle(w / 2, 127, 10);

    // Wooden Harvest Wagon Base
    g.fillStyle(0x78350f, 1);
    g.fillRoundedRect(15, 140, 150, 75, 6);
    g.fillStyle(0x92400e, 1);
    g.fillRoundedRect(20, 145, 140, 65, 4);

    // Wagon Wheels
    g.fillStyle(0x451a03, 1);
    g.fillCircle(45, 220, 24);
    g.fillCircle(135, 220, 24);
    g.fillStyle(0xb45309, 1);
    g.fillCircle(45, 220, 16);
    g.fillCircle(135, 220, 16);
    g.fillStyle(0x1e293b, 1);
    g.fillCircle(45, 220, 6);
    g.fillCircle(135, 220, 6);

    // Wooden Goal Signboard: "🌾 GOLDEN WHEAT 🌾"
    g.fillStyle(0xfef3c7, 1);
    g.fillRoundedRect(22, 160, 136, 34, 5);
    g.lineStyle(2, 0xd97706, 1);
    g.strokeRoundedRect(22, 160, 136, 34, 5);

    g.generateTexture('wheat_wagon_goal', w, h);
    g.destroy();
  }

  // 6. Ground Pasture Texture (Repeating strip at bottom)
  if (!scene.textures.exists('farm_ground')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const width = 480;
    const height = 80;

    // Grass top layer
    g.fillStyle(0x16a34a, 1); // Rich Meadow Green
    g.fillRect(0, 0, width, 18);

    // Grass blades pattern
    g.fillStyle(0x22c55e, 1);
    for (let x = 0; x < width; x += 12) {
      g.fillTriangle(x, 18, x + 6, 0, x + 12, 18);
    }

    // Dirt soil strata
    g.fillStyle(0x78350f, 1);
    g.fillRect(0, 18, width, height - 18);

    g.fillStyle(0x92400e, 1);
    g.fillRect(0, 24, width, height - 24);

    // Soil pebbles
    g.fillStyle(0x573010, 1);
    for (let x = 10; x < width; x += 35) {
      g.fillCircle(x, 40 + (x % 15), 3);
      g.fillCircle(x + 18, 60, 2);
    }

    g.generateTexture('farm_ground', width, height);
    g.destroy();
  }

  // 7. Scenic Farm Countryside Sky Background
  if (!scene.textures.exists('farm_sky_bg')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const width = 480;
    const height = 560;

    // Blue Sunny Sky
    g.fillGradientStyle(0x38bdf8, 0x38bdf8, 0xbae6fd, 0xbae6fd, 1);
    g.fillRect(0, 0, width, height);

    // Bright morning sun with warm rays
    g.fillStyle(0xfef08a, 0.45);
    g.fillCircle(380, 90, 48);
    g.fillStyle(0xfef08a, 0.85);
    g.fillCircle(380, 90, 28);

    // Fluffy cartoon clouds
    const drawCloud = (cx: number, cy: number, scale: number) => {
      g.fillStyle(0xffffff, 0.88);
      g.fillCircle(cx, cy, 22 * scale);
      g.fillCircle(cx + 20 * scale, cy - 6 * scale, 28 * scale);
      g.fillCircle(cx + 45 * scale, cy, 22 * scale);
      g.fillCircle(cx + 22 * scale, cy + 8 * scale, 18 * scale);
    };

    drawCloud(60, 90, 1.0);
    drawCloud(220, 140, 0.8);

    // Distant Rolling Mountain Hills
    g.fillStyle(0x86efac, 0.7);
    g.fillCircle(100, 520, 240);
    g.fillCircle(380, 540, 260);

    // Distant classic Red Barn & Windmill silhouette
    g.fillStyle(0xb91c1c, 0.9);
    g.fillRect(290, 430, 55, 35);
    g.fillTriangle(285, 430, 317, 405, 350, 430); // roof
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(310, 442, 15, 23); // barn door

    // Windmill tower
    g.fillStyle(0x475569, 0.85);
    g.fillRect(70, 415, 14, 50);
    g.lineStyle(2, 0x334155, 0.85);
    g.lineBetween(60, 415, 94, 415);
    g.lineBetween(77, 398, 77, 432);

    g.generateTexture('farm_sky_bg', width, height);
    g.destroy();
  }
}
