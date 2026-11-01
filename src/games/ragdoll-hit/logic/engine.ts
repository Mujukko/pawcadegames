import {
  FighterInput,
  RagdollFighter,
  RagdollHitState,
  WeaponType,
} from './types';

export const ARENA_WIDTH = 800;
export const ARENA_FLOOR_Y = 400;
export const GRAVITY = 1000;
export const TOTAL_ROUNDS = 3;

export function getRoundOpponentConfig(round: number): {
  name: string;
  weapon: WeaponType;
  health: number;
  speedMultiplier: number;
} {
  switch (round) {
    case 1:
      return {
        name: 'Sneaky Fox',
        weapon: 'fists',
        health: 80,
        speedMultiplier: 0.8,
      };
    case 2:
      return {
        name: 'Grumpy Badger',
        weapon: 'broom',
        health: 100,
        speedMultiplier: 1.0,
      };
    case 3:
    default:
      return {
        name: 'Wild Rooster',
        weapon: 'pitchfork',
        health: 120,
        speedMultiplier: 1.2,
      };
  }
}

export function initRagdollHitGame(round: number = 1): RagdollHitState {
  const opponent = getRoundOpponentConfig(round);

  const player: RagdollFighter = {
    id: 'player',
    name: 'Buster Hound',
    x: 240,
    y: ARENA_FLOOR_Y - 40,
    vx: 0,
    vy: 0,
    armAngle: 0,
    armAngularVelocity: 0,
    weapon: round === 1 ? 'fists' : round === 2 ? 'broom' : 'pitchfork',
    health: 100,
    isGrounded: true,
    facing: 1,
    isAttacking: false,
    knockedOut: false,
  };

  const enemy: RagdollFighter = {
    id: 'enemy',
    name: opponent.name,
    x: 560,
    y: ARENA_FLOOR_Y - 40,
    vx: 0,
    vy: 0,
    armAngle: 0,
    armAngularVelocity: 0,
    weapon: opponent.weapon,
    health: opponent.health,
    isGrounded: true,
    facing: -1,
    isAttacking: false,
    knockedOut: false,
  };

  return {
    round,
    maxRounds: TOTAL_ROUNDS,
    player,
    enemy,
    status: 'fighting',
    arenaWidth: ARENA_WIDTH,
    arenaFloorY: ARENA_FLOOR_Y,
  };
}

export function updateFighterPhysics(
  fighter: RagdollFighter,
  input: FighterInput,
  arenaFloorY: number,
  dt: number
): RagdollFighter {
  if (fighter.knockedOut) return fighter;

  const next = { ...fighter };

  // Facing
  if (input.moveX !== 0) {
    next.facing = input.moveX > 0 ? 1 : -1;
  }

  // Horizontal motion
  next.vx += input.moveX * 650 * dt;
  next.vx *= 0.88; // Friction

  // Jump
  if (input.jump && next.isGrounded) {
    next.vy = -440;
    next.isGrounded = false;
  }

  // Gravity
  next.vy += GRAVITY * dt;

  // Move
  next.x += next.vx * dt;
  next.y += next.vy * dt;

  // Ground collision
  if (next.y >= arenaFloorY - 30) {
    next.y = arenaFloorY - 30;
    next.vy = 0;
    next.isGrounded = true;
  } else {
    next.isGrounded = false;
  }

  // Ring boundary limits (keep on arena mat)
  next.x = Math.max(120, Math.min(680, next.x));

  // Attack & Arm swinging physics
  if (input.attack && !next.isAttacking) {
    next.isAttacking = true;
    next.armAngularVelocity = 28 * next.facing;
  }

  // Arm oscillation / return to rest
  next.armAngle += next.armAngularVelocity * dt;
  next.armAngularVelocity -= next.armAngle * 35 * dt; // Spring back
  next.armAngularVelocity *= 0.85; // Damping

  if (Math.abs(next.armAngle) < 0.1 && Math.abs(next.armAngularVelocity) < 1) {
    next.isAttacking = false;
    next.armAngle = 0;
  }

  return next;
}

export function getWeaponStats(weapon: WeaponType): { range: number; damage: number } {
  switch (weapon) {
    case 'pitchfork':
      return { range: 50, damage: 22 };
    case 'broom':
      return { range: 42, damage: 16 };
    case 'fists':
    default:
      return { range: 28, damage: 12 };
  }
}

export function stepRagdollHitGame(
  state: RagdollHitState,
  playerInput: FighterInput,
  enemyInputOverride?: FighterInput,
  dt: number = 0.05
): {
  state: RagdollHitState;
  event?: 'hit' | 'swing' | 'ko' | 'round_won' | 'round_lost' | 'match_victory' | 'match_game_over';
} {
  if (state.status !== 'fighting') {
    return { state };
  }

  const safeDt = Math.min(dt, 0.05);
  let event: 'hit' | 'swing' | 'ko' | 'round_won' | 'round_lost' | 'match_victory' | 'match_game_over' | undefined;

  // 1. AI Input for Enemy if not overridden (Versus mode)
  let enemyInput: FighterInput = enemyInputOverride || { moveX: 0, jump: false, attack: false };
  if (!enemyInputOverride) {
    const dist = state.player.x - state.enemy.x;
    const absDist = Math.abs(dist);
    const opponentConfig = getRoundOpponentConfig(state.round);

    // AI movement towards player
    if (absDist > 55) {
      enemyInput.moveX = dist > 0 ? 1 : -1;
    } else {
      enemyInput.moveX = 0;
      // Close range: chance to attack or jump
      if (Math.random() < 0.35 * opponentConfig.speedMultiplier) {
        enemyInput.attack = true;
      }
      if (Math.random() < 0.1) {
        enemyInput.jump = true;
      }
    }
  }

  // 2. Physics Update
  const player = updateFighterPhysics(state.player, playerInput, state.arenaFloorY, safeDt);
  const enemy = updateFighterPhysics(state.enemy, enemyInput, state.arenaFloorY, safeDt);

  if (playerInput.attack && !state.player.isAttacking) event = 'swing';

  // 3. Combat Collision & Weapon Hits
  const playerWStats = getWeaponStats(player.weapon);
  const enemyWStats = getWeaponStats(enemy.weapon);

  // Player hits Enemy
  if (player.isAttacking) {
    const hitX = player.x + Math.sin(player.armAngle) * playerWStats.range;
    const hitY = player.y - 10 + Math.cos(player.armAngle) * 10;
    const distToEnemy = Math.hypot(hitX - enemy.x, hitY - enemy.y);

    if (distToEnemy < 32) {
      enemy.health = Math.max(0, enemy.health - playerWStats.damage);
      enemy.vx += player.facing * 340;
      enemy.vy = -180;
      player.isAttacking = false;
      event = 'hit';
    }
  }

  // Enemy hits Player
  if (enemy.isAttacking) {
    const hitX = enemy.x + Math.sin(enemy.armAngle) * enemyWStats.range;
    const hitY = enemy.y - 10 + Math.cos(enemy.armAngle) * 10;
    const distToPlayer = Math.hypot(hitX - player.x, hitY - player.y);

    if (distToPlayer < 32) {
      player.health = Math.max(0, player.health - enemyWStats.damage);
      player.vx += enemy.facing * 340;
      player.vy = -180;
      enemy.isAttacking = false;
      event = 'hit';
    }
  }

  // 4. Knockout & Victory conditions
  let status: RagdollHitState['status'] = state.status;

  if (enemy.health <= 0) {
    enemy.knockedOut = true;
    if (state.round >= state.maxRounds) {
      status = 'match_victory';
      event = 'match_victory';
    } else {
      status = 'round_won';
      event = 'round_won';
    }
  } else if (player.health <= 0) {
    player.knockedOut = true;
    status = 'match_game_over';
    event = 'match_game_over';
  }

  return {
    state: {
      ...state,
      player,
      enemy,
      status,
    },
    event,
  };
}
