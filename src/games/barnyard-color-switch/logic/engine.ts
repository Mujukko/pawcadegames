import {
  ColorSwitchState,
  ColorObstacle,
  ColorSwitcherOrb,
  ColorStar,
  SwitchColor,
  SWITCH_COLORS,
} from './types';

export const GRAVITY = 1100;
export const JUMP_IMPULSE = 420;
export const OBSTACLE_SPACING = 240;

export function normalizeAngle(rad: number): number {
  let a = rad % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a;
}

export function createColorSwitchGame(highScore = 0): ColorSwitchState {
  const initialObstacles: ColorObstacle[] = [];
  const initialSwitchers: ColorSwitcherOrb[] = [];
  const initialStars: ColorStar[] = [];

  let nextY = 320;
  for (let i = 0; i < 8; i++) {
    const rotSpeed = (0.9 + Math.random() * 0.7) * (i % 2 === 0 ? 1 : -1);
    initialObstacles.push({
      id: `obs_${i}`,
      y: nextY,
      type: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'cross' : 'circle',
      radius: 72,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed,
      passed: false,
    });

    initialStars.push({
      id: `star_${i}`,
      y: nextY,
      collected: false,
    });

    initialSwitchers.push({
      id: `switch_${i}`,
      y: nextY + OBSTACLE_SPACING * 0.5,
      collected: false,
    });

    nextY += OBSTACLE_SPACING;
  }

  const initialColor = SWITCH_COLORS[Math.floor(Math.random() * SWITCH_COLORS.length)];

  return {
    status: 'ready',
    score: 0,
    highScore,
    player: {
      y: 120,
      vy: 0,
      color: initialColor,
    },
    cameraY: 0,
    obstacles: initialObstacles,
    switchers: initialSwitchers,
    stars: initialStars,
    events: [],
  };
}

export function jumpColorPlayer(state: ColorSwitchState): ColorSwitchState {
  if (state.status === 'game_over') return state;

  return {
    ...state,
    status: 'playing',
    player: {
      ...state.player,
      vy: JUMP_IMPULSE,
    },
    events: [...state.events, { type: 'jump' }],
  };
}

export function updateColorSwitchGame(state: ColorSwitchState, rawDt: number): ColorSwitchState {
  if (state.status !== 'playing') return state;

  const dt = Math.min(rawDt, 0.05);
  const events: ColorSwitchState['events'] = [];
  let status: ColorSwitchState['status'] = state.status;
  let score = state.score;
  let highScore = state.highScore;

  const player = { ...state.player };

  // Gravity
  player.vy -= GRAVITY * dt;
  const nextY = player.y + player.vy * dt;

  // Update Obstacles Rotation
  const obstacles = state.obstacles.map((obs) => ({
    ...obs,
    rotation: obs.rotation + obs.rotSpeed * dt,
  }));

  // Obstacle Collision Checks
  for (const obs of obstacles) {
    if (obs.type === 'circle') {
      const topY = obs.y + obs.radius;
      const botY = obs.y - obs.radius;
      const thickness = 14;

      // Check bottom ring intersection
      const crossedBottom =
        (player.y <= botY && nextY >= botY) ||
        (player.y >= botY && nextY <= botY) ||
        Math.abs(nextY - botY) < thickness * 0.5;

      // Check top ring intersection
      const crossedTop =
        (player.y <= topY && nextY >= topY) ||
        (player.y >= topY && nextY <= topY) ||
        Math.abs(nextY - topY) < thickness * 0.5;

      if (crossedBottom || crossedTop) {
        // Bottom crossing point is at angle -pi/2 (or 3pi/2)
        // Top crossing point is at angle pi/2
        const checkAngle = crossedBottom ? (3 * Math.PI) / 2 : Math.PI / 2;
        const relAngle = normalizeAngle(checkAngle - obs.rotation);
        const segmentIdx = Math.floor(relAngle / (Math.PI / 2)) % 4;
        const segmentColor = SWITCH_COLORS[segmentIdx];

        if (segmentColor !== player.color) {
          status = 'game_over';
          events.push({ type: 'crash' });
          break;
        }
      }
    } else if (obs.type === 'cross') {
      // 4 rotating arms of length obs.radius
      const distToCenter = Math.abs(nextY - obs.y);
      if (distToCenter < obs.radius) {
        for (let a = 0; a < 4; a++) {
          const armAngle = normalizeAngle(obs.rotation + (a * Math.PI) / 2);
          // Arm intersects vertical center axis (x = 0) when cos(armAngle) ~ 0
          // which is at angle pi/2 (pointing up) or 3pi/2 (pointing down)
          const armColor = SWITCH_COLORS[a];
          if (armColor !== player.color) {
            // Check vertical proximity to arm tip
            const armTipY = obs.y + Math.sin(armAngle) * obs.radius;
            const armTipX = Math.cos(armAngle) * obs.radius;
            if (Math.abs(armTipX) < 18 && Math.abs(nextY - armTipY) < 14) {
              status = 'game_over';
              events.push({ type: 'crash' });
              break;
            }
          }
        }
      }
    }
  }

  if (status === 'game_over') {
    return {
      ...state,
      status,
      player: { ...player, y: nextY },
      events,
    };
  }

  // Check Stars Pickup
  const stars = state.stars.map((star) => {
    if (!star.collected && Math.abs(nextY - star.y) < 22) {
      score += 1;
      events.push({ type: 'star' });
      return { ...star, collected: true };
    }
    return star;
  });

  // Check Color Switcher Pickup
  const switchers = state.switchers.map((sw) => {
    if (!sw.collected && Math.abs(nextY - sw.y) < 22) {
      events.push({ type: 'switch' });
      // Pick a different color
      const remaining = SWITCH_COLORS.filter((c) => c !== player.color);
      player.color = remaining[Math.floor(Math.random() * remaining.length)];
      return { ...sw, collected: true };
    }
    return sw;
  });

  player.y = nextY;
  if (score > highScore) highScore = score;

  // Camera smoothly tracks player
  let cameraY = state.cameraY;
  if (player.y - 220 > cameraY) {
    cameraY = player.y - 220;
  }

  // Fall below screen check
  if (player.y < cameraY - 140) {
    status = 'game_over';
    events.push({ type: 'crash' });
  }

  // Infinite Generation
  const lastObsY = obstacles[obstacles.length - 1].y;
  if (lastObsY < cameraY + 700) {
    const nextIdx = obstacles.length;
    const rotSpeed = (0.9 + Math.random() * 0.7) * (nextIdx % 2 === 0 ? 1 : -1);
    const newY = lastObsY + OBSTACLE_SPACING;

    obstacles.push({
      id: `obs_${nextIdx}`,
      y: newY,
      type: nextIdx % 2 === 0 ? 'circle' : 'cross',
      radius: 72,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed,
      passed: false,
    });

    stars.push({
      id: `star_${nextIdx}`,
      y: newY,
      collected: false,
    });

    switchers.push({
      id: `switch_${nextIdx}`,
      y: newY + OBSTACLE_SPACING * 0.5,
      collected: false,
    });
  }

  return {
    ...state,
    status,
    score,
    highScore,
    player,
    cameraY,
    obstacles,
    switchers,
    stars,
    events,
  };
}
