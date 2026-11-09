import { CellPos, CritterAgent, Direction, PaperEvent, PaperGameState } from './types';

export const GRID_SIZE = 32;
export const STEP_DURATION = 0.125; // 8 cells/sec — brisk, responsive Paper.io feel

const DIR_DELTA: Record<Direction, CellPos> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const ALL_DIRS: Direction[] = ['up', 'right', 'down', 'left'];

const BOT_PROFILES = [
  { id: 1, name: 'Rusty', emoji: '🦊', color: '#f97316', trailColor: '#fdba74' },
  { id: 2, name: 'Porky', emoji: '🐷', color: '#ec4899', trailColor: '#f9a8d4' },
  { id: 3, name: 'Clucky', emoji: '🐣', color: '#eab308', trailColor: '#fde047' },
  { id: 4, name: 'Bessie', emoji: '🐮', color: '#3b82f6', trailColor: '#93c5fd' },
];

export function idxOf(x: number, y: number, size = GRID_SIZE): number {
  return y * size + x;
}

export function inBounds(x: number, y: number, size = GRID_SIZE): boolean {
  return x >= 0 && x < size && y >= 0 && y < size;
}

function stampHomeBase(grid: number[], size: number, ownerId: number, cx: number, cy: number, radius = 1): void {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const gx = cx + dx;
      const gy = cy + dy;
      if (inBounds(gx, gy, size)) {
        grid[idxOf(gx, gy, size)] = ownerId;
      }
    }
  }
}

export function computeOwnerPercent(grid: number[], ownerId: number): number {
  let count = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === ownerId) count++;
  }
  return Math.round((count / grid.length) * 1000) / 10;
}

/**
 * Flood-fills any interior cells enclosed by `ownerId`'s territory + newly closed trail.
 * Returns total number of newly claimed cells (trail + enclosed interior).
 */
export function claimTerritoryLoop(grid: number[], size: number, ownerId: number, trail: CellPos[]): number {
  let gained = 0;
  for (const c of trail) {
    const idx = idxOf(c.x, c.y, size);
    if (grid[idx] !== ownerId) {
      grid[idx] = ownerId;
      gained++;
    }
  }

  // BFS from outside border on a padded (size + 2) x (size + 2) grid
  const pad = size + 2;
  const outside = new Uint8Array(pad * pad);
  const queue = new Int32Array(pad * pad);
  let head = 0;
  let tail = 0;

  outside[0] = 1;
  queue[tail++] = 0;

  while (head < tail) {
    const cur = queue[head++]!;
    const px = cur % pad;
    const py = (cur / pad) | 0;

    const neighbors = [
      px > 0 ? cur - 1 : -1,
      px + 1 < pad ? cur + 1 : -1,
      py > 0 ? cur - pad : -1,
      py + 1 < pad ? cur + pad : -1,
    ];

    for (const n of neighbors) {
      if (n < 0 || outside[n]) continue;
      const nx = (n % pad) - 1;
      const ny = ((n / pad) | 0) - 1;
      if (inBounds(nx, ny, size) && grid[idxOf(nx, ny, size)] === ownerId) {
        continue; // Blocked by ownerId's closed wall/turf
      }
      outside[n] = 1;
      queue[tail++] = n;
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const pIdx = (y + 1) * pad + (x + 1);
      if (!outside[pIdx]) {
        const gIdx = idxOf(x, y, size);
        if (grid[gIdx] !== ownerId) {
          grid[gIdx] = ownerId;
          gained++;
        }
      }
    }
  }

  return gained;
}

function wipeAgentTerritory(grid: number[], ownerId: number): void {
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === ownerId) grid[i] = -1;
  }
}

function findSafeSpawn(grid: number[], size: number, agents: CritterAgent[]): CellPos {
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = 3 + Math.floor(Math.random() * (size - 6));
    const y = 3 + Math.floor(Math.random() * (size - 6));
    const tooClose = agents.some((a) => a.alive && Math.abs(a.x - x) + Math.abs(a.y - y) < 7);
    if (!tooClose && grid[idxOf(x, y, size)] !== 0) {
      return { x, y };
    }
  }
  return { x: 4, y: 4 };
}

export function createPaperGame(bestPercent = 0): PaperGameState {
  const grid = new Array<number>(GRID_SIZE * GRID_SIZE).fill(-1);

  const pStart = { x: 16, y: 16 };
  stampHomeBase(grid, GRID_SIZE, 0, pStart.x, pStart.y, 1);

  const botSpawns: CellPos[] = [
    { x: 6, y: 6 },
    { x: 25, y: 6 },
    { x: 6, y: 25 },
    { x: 25, y: 25 },
  ];

  const agents: CritterAgent[] = [
    {
      id: 0,
      name: 'Woolly',
      emoji: '🐑',
      color: '#22c55e',
      trailColor: '#86efac',
      x: pStart.x,
      y: pStart.y,
      prevX: pStart.x,
      prevY: pStart.y,
      dir: 'right',
      nextDir: 'right',
      alive: true,
      respawnTimer: 0,
      trail: [],
      kills: 0,
      aiStepsOut: 0,
    },
  ];

  BOT_PROFILES.forEach((p, idx) => {
    const sp = botSpawns[idx]!;
    stampHomeBase(grid, GRID_SIZE, p.id, sp.x, sp.y, 1);
    const startDir = ALL_DIRS[idx % 4]!;
    agents.push({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      color: p.color,
      trailColor: p.trailColor,
      x: sp.x,
      y: sp.y,
      prevX: sp.x,
      prevY: sp.y,
      dir: startDir,
      nextDir: startDir,
      alive: true,
      respawnTimer: 0,
      trail: [],
      kills: 0,
      aiStepsOut: 0,
    });
  });

  const startPct = computeOwnerPercent(grid, 0);
  return {
    gridSize: GRID_SIZE,
    grid,
    agents,
    tickProgress: 0,
    status: 'ready',
    score: 0,
    bestPercent: Math.max(bestPercent, startPct),
    playerPercent: startPct,
    events: [],
  };
}

export function steerPaperPlayer(state: PaperGameState, dir: Direction): PaperGameState {
  if (state.status === 'game_over' || state.status === 'victory') return state;
  const player = state.agents[0];
  if (!player || !player.alive) return state;

  // Prevent 180-degree self-reversal when playing (unless still ready)
  if (state.status === 'playing' && OPPOSITE[player.dir] === dir) {
    return state;
  }

  const nextAgents = state.agents.slice();
  nextAgents[0] = {
    ...player,
    dir: state.status === 'ready' ? dir : player.dir,
    nextDir: dir,
  };

  return {
    ...state,
    status: state.status === 'ready' ? 'playing' : state.status,
    agents: nextAgents,
  };
}

function chooseBotDirection(bot: CritterAgent, grid: number[], size: number): Direction {
  const candidates = ALL_DIRS.filter((d) => d !== OPPOSITE[bot.dir]);
  const safe = candidates.filter((d) => {
    const nx = bot.x + DIR_DELTA[d].x;
    const ny = bot.y + DIR_DELTA[d].y;
    if (!inBounds(nx, ny, size)) return false;
    if (bot.trail.some((t) => t.x === nx && t.y === ny)) return false;
    return true;
  });

  if (safe.length === 0) return candidates[0] || bot.dir;

  // If bot has wandered >= 4 steps outside its turf, steer back toward owned turf
  if (bot.trail.length >= 4) {
    let bestDir = safe[0]!;
    let bestDist = Infinity;
    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        if (grid[idxOf(x, y, size)] === bot.id) {
          for (const d of safe) {
            const nx = bot.x + DIR_DELTA[d].x;
            const ny = bot.y + DIR_DELTA[d].y;
            const dist = Math.abs(nx - x) + Math.abs(ny - y);
            if (dist < bestDist) {
              bestDist = dist;
              bestDir = d;
            }
          }
        }
      }
    }
    return bestDir;
  }

  // Prefer keeping straight 65% of the time, else turn to make a neat rectangle
  if (safe.includes(bot.dir) && Math.random() < 0.65) {
    return bot.dir;
  }
  return safe[Math.floor(Math.random() * safe.length)]!;
}

export function stepPaperTick(state: PaperGameState): PaperGameState {
  if (state.status !== 'playing') return state;

  const size = state.gridSize;
  const grid = state.grid.slice();
  const agents = state.agents.map((a) => ({
    ...a,
    trail: a.trail.slice(),
  }));
  const events: PaperEvent[] = [];
  let score = state.score;
  let status: PaperGameState['status'] = state.status;
  let deathReason: PaperGameState['deathReason'];
  let killerName: string | undefined;

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i]!;

    if (!agent.alive) {
      if (agent.id !== 0) {
        agent.respawnTimer -= STEP_DURATION;
        if (agent.respawnTimer <= 0) {
          const sp = findSafeSpawn(grid, size, agents);
          stampHomeBase(grid, size, agent.id, sp.x, sp.y, 1);
          agent.x = sp.x;
          agent.y = sp.y;
          agent.prevX = sp.x;
          agent.prevY = sp.y;
          agent.trail = [];
          agent.alive = true;
          agent.dir = ALL_DIRS[Math.floor(Math.random() * 4)]!;
          agent.nextDir = agent.dir;
        }
      }
      continue;
    }

    if (agent.id === 0) {
      if (OPPOSITE[agent.dir] !== agent.nextDir) {
        agent.dir = agent.nextDir;
      }
    } else {
      agent.dir = chooseBotDirection(agent, grid, size);
      agent.nextDir = agent.dir;
    }

    // If standing outside own territory right now, ensure current cell is on trail
    if (grid[idxOf(agent.x, agent.y, size)] !== agent.id) {
      if (!agent.trail.some((t) => t.x === agent.x && t.y === agent.y)) {
        agent.trail.push({ x: agent.x, y: agent.y });
      }
    }

    agent.prevX = agent.x;
    agent.prevY = agent.y;
    const nx = agent.x + DIR_DELTA[agent.dir].x;
    const ny = agent.y + DIR_DELTA[agent.dir].y;

    // 1. Fence collision
    if (!inBounds(nx, ny, size)) {
      agent.alive = false;
      agent.trail = [];
      wipeAgentTerritory(grid, agent.id);
      if (agent.id === 0) {
        status = 'game_over';
        deathReason = 'fence';
        events.push({ type: 'die', reason: 'fence' });
        break;
      } else {
        agent.respawnTimer = 3.0;
        continue;
      }
    }

    agent.x = nx;
    agent.y = ny;

    // 2. Check trail cuts across all alive agents
    let agentDiedHere = false;
    for (let j = 0; j < agents.length; j++) {
      const target = agents[j]!;
      if (!target.alive) continue;
      const hitTrail = target.trail.some((t) => t.x === nx && t.y === ny);
      if (!hitTrail) continue;

      if (target.id === agent.id) {
        // Crossed own ribbon!
        agent.alive = false;
        agent.trail = [];
        wipeAgentTerritory(grid, agent.id);
        agentDiedHere = true;
        if (agent.id === 0) {
          status = 'game_over';
          deathReason = 'self';
          events.push({ type: 'die', reason: 'self' });
        } else {
          agent.respawnTimer = 3.0;
        }
        break;
      } else {
        // Cut a rival's ribbon!
        target.alive = false;
        target.trail = [];
        wipeAgentTerritory(grid, target.id);
        agent.kills += 1;
        if (agent.id === 0) {
          score += 250;
          events.push({ type: 'kill', victimName: target.name });
          target.respawnTimer = 3.5;
        } else if (target.id === 0) {
          status = 'game_over';
          deathReason = 'rival';
          killerName = agent.name;
          events.push({ type: 'die', reason: 'rival', killerName: agent.name });
        } else {
          target.respawnTimer = 3.0;
        }
      }
    }

    if (status === 'game_over') break;
    if (agentDiedHere) continue;

    // 3. Territory loop check vs extending trail
    const cellOwner = grid[idxOf(nx, ny, size)];
    if (cellOwner === agent.id) {
      if (agent.trail.length > 0) {
        const gained = claimTerritoryLoop(grid, size, agent.id, agent.trail);
        agent.trail = [];
        if (agent.id === 0 && gained > 0) {
          score += gained * 15;
          events.push({ type: 'claim', cellsGained: gained });
        }
      }
    } else {
      agent.trail.push({ x: nx, y: ny });
    }
  }

  const playerPercent = status === 'game_over' ? state.playerPercent : computeOwnerPercent(grid, 0);
  const bestPercent = Math.max(state.bestPercent, playerPercent);

  if (status === 'playing' && playerPercent >= 95) {
    status = 'victory';
    score += 1000;
    events.push({ type: 'victory' });
  }

  return {
    ...state,
    grid,
    agents,
    status,
    deathReason,
    killerName,
    score,
    playerPercent,
    bestPercent,
    events,
  };
}

export function updatePaperGame(state: PaperGameState, rawDt: number): PaperGameState {
  if (state.status !== 'playing') {
    return state.events.length ? { ...state, events: [] } : state;
  }

  const dt = Math.min(rawDt, 0.1);
  let acc = state.tickProgress * STEP_DURATION + dt;
  let cur: PaperGameState = { ...state, events: [] };
  const allEvents: PaperEvent[] = [];

  while (acc >= STEP_DURATION && cur.status === 'playing') {
    acc -= STEP_DURATION;
    cur = stepPaperTick(cur);
    allEvents.push(...cur.events);
  }

  return {
    ...cur,
    tickProgress: cur.status === 'playing' ? acc / STEP_DURATION : 1,
    events: allEvents,
  };
}
