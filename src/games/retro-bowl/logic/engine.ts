import {
  FootballBall,
  FootballDefender,
  FootballReceiver,
  ReceiverMoveInput,
  RetroBowlAimInput,
  RetroBowlState,
} from './types';

export const FIELD_LENGTH = 100;
export const FIELD_WIDTH = 160;
export const RUNNER_SPEED = 16; // Yards per second
export const DEFENDER_SPEED = 14;

export function initRetroBowlPlay(
  yardLine: number = 20,
  down: number = 1,
  yardsToGo: number = 10,
  score: number = 0,
  opponentScore: number = 0,
  quarter: number = 1
): RetroBowlState {
  const safeYardLine = Math.min(95, Math.max(5, yardLine));

  const qb = {
    x: safeYardLine - 4,
    y: 80,
  };

  const receivers: FootballReceiver[] = [
    {
      id: 'wr-top',
      name: 'Pip Chick',
      x: safeYardLine,
      y: 40,
      vx: 12,
      vy: 1.5,
      route: 'slant_down',
      caught: false,
      tackled: false,
    },
    {
      id: 'wr-bottom',
      name: 'Daisy Pig',
      x: safeYardLine,
      y: 120,
      vx: 13,
      vy: -1.5,
      route: 'slant_up',
      caught: false,
      tackled: false,
    },
  ];

  const defenders: FootballDefender[] = [
    {
      id: 'def-top',
      x: safeYardLine + 8,
      y: 45,
      vx: 0,
      vy: 0,
      speed: DEFENDER_SPEED,
    },
    {
      id: 'def-bottom',
      x: safeYardLine + 9,
      y: 115,
      vx: 0,
      vy: 0,
      speed: DEFENDER_SPEED,
    },
  ];

  const ball: FootballBall = {
    x: qb.x,
    y: qb.y,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    inFlight: false,
    targetX: qb.x,
    targetY: qb.y,
  };

  return {
    yardLine: safeYardLine,
    down,
    yardsToGo,
    score,
    opponentScore,
    quarter,
    playClock: 25,
    phase: 'aiming',
    qb,
    receivers,
    defenders,
    ball,
    controlledReceiverIndex: null,
  };
}

export function executeThrow(
  state: RetroBowlState,
  targetX: number,
  targetY: number
): RetroBowlState {
  const dx = targetX - state.qb.x;
  const dy = targetY - state.qb.y;
  const distance = Math.hypot(dx, dy);
  const flightDuration = Math.max(0.6, distance / 28); // Approx 0.8s to 1.5s

  const ball: FootballBall = {
    x: state.qb.x,
    y: state.qb.y,
    z: 0,
    vx: dx / flightDuration,
    vy: dy / flightDuration,
    vz: 12, // Initial upward velocity
    inFlight: true,
    targetX,
    targetY,
  };

  return {
    ...state,
    ball,
    phase: 'ball_in_air',
  };
}

export function stepRetroBowlPlay(
  state: RetroBowlState,
  aimInput: RetroBowlAimInput,
  runnerInput: ReceiverMoveInput,
  dt: number
): {
  state: RetroBowlState;
  event?: 'throw' | 'catch' | 'tackle' | 'touchdown' | 'incomplete' | 'first_down' | 'turnover';
} {
  const safeDt = Math.min(dt, 0.05);
  let event: 'throw' | 'catch' | 'tackle' | 'touchdown' | 'incomplete' | 'first_down' | 'turnover' | undefined;

  // 1. AIMING PHASE (Pre-throw)
  if (state.phase === 'aiming') {
    // Receivers run their routes forward
    const receivers = state.receivers.map((wr) => {
      let vx = wr.vx;
      let vy = wr.vy;
      let nx = wr.x + vx * safeDt;
      let ny = wr.y + vy * safeDt;

      // Keep inside bounds
      ny = Math.max(15, Math.min(145, ny));
      return { ...wr, x: nx, y: ny };
    });

    // Defenders shadow receivers
    const defenders = state.defenders.map((def, idx) => {
      const targetWR = receivers[idx % receivers.length];
      const dx = targetWR.x - def.x;
      const dy = targetWR.y - def.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        return {
          ...def,
          x: def.x + (dx / dist) * def.speed * safeDt,
          y: def.y + (dy / dist) * def.speed * safeDt,
        };
      }
      return def;
    });

    if (aimInput.releaseThrow && aimInput.aimPower > 0.1) {
      // Throw ball towards aim direction
      const throwDist = 12 + aimInput.aimPower * 35; // 12 to 47 yards
      const targetX = state.qb.x + Math.cos(aimInput.aimAngle) * throwDist;
      const targetY = state.qb.y + Math.sin(aimInput.aimAngle) * throwDist;

      const next = executeThrow(state, targetX, targetY);
      return {
        state: { ...next, receivers, defenders },
        event: 'throw',
      };
    }

    return {
      state: {
        ...state,
        receivers,
        defenders,
      },
    };
  }

  // 2. BALL IN AIR PHASE
  if (state.phase === 'ball_in_air') {
    const ball: FootballBall = { ...state.ball };
    ball.x += ball.vx * safeDt;
    ball.y += ball.vy * safeDt;

    // Receivers adjust towards ball target
    const receivers = state.receivers.map((wr) => {
      const dx = ball.targetX - wr.x;
      const dy = ball.targetY - wr.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        return {
          ...wr,
          x: wr.x + (dx / dist) * RUNNER_SPEED * 1.1 * safeDt,
          y: wr.y + (dy / dist) * RUNNER_SPEED * 1.1 * safeDt,
        };
      }
      return wr;
    });

    // Defenders pursue ball target
    const defenders = state.defenders.map((def) => {
      const dx = ball.targetX - def.x;
      const dy = ball.targetY - def.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        return {
          ...def,
          x: def.x + (dx / dist) * def.speed * safeDt,
          y: def.y + (dy / dist) * def.speed * safeDt,
        };
      }
      return def;
    });

    // Check if ball reached target
    const distToTarget = Math.hypot(ball.x - ball.targetX, ball.y - ball.targetY);
    if (distToTarget < 2.5) {
      ball.inFlight = false;

      // Check which receiver caught it
      let caughtIndex = -1;
      let minWRDist = 999;
      receivers.forEach((wr, i) => {
        const d = Math.hypot(wr.x - ball.targetX, wr.y - ball.targetY);
        if (d < 7 && d < minWRDist) {
          minWRDist = d;
          caughtIndex = i;
        }
      });

      // Check if defender intercepted
      let defenderDist = 999;
      defenders.forEach((def) => {
        const d = Math.hypot(def.x - ball.targetX, def.y - ball.targetY);
        if (d < defenderDist) defenderDist = d;
      });

      if (defenderDist < 4.0 && defenderDist < minWRDist) {
        // Interception / turnover!
        return {
          state: {
            ...state,
            ball,
            receivers,
            defenders,
            phase: 'turnover',
          },
          event: 'turnover',
        };
      }

      if (caughtIndex !== -1) {
        // Complete Pass!
        receivers[caughtIndex].caught = true;
        return {
          state: {
            ...state,
            ball,
            receivers,
            defenders,
            phase: 'receiver_running',
            controlledReceiverIndex: caughtIndex,
          },
          event: 'catch',
        };
      } else {
        // Incomplete Pass
        const nextDown = state.down + 1;
        if (nextDown > 4) {
          return {
            state: { ...state, ball, receivers, defenders, phase: 'turnover' },
            event: 'turnover',
          };
        }
        return {
          state: {
            ...state,
            ball,
            receivers,
            defenders,
            down: nextDown,
            phase: 'play_ended',
          },
          event: 'incomplete',
        };
      }
    }

    return {
      state: {
        ...state,
        ball,
        receivers,
        defenders,
      },
    };
  }

  // 3. RECEIVER RUNNING PHASE
  if (state.phase === 'receiver_running' && state.controlledReceiverIndex !== null) {
    const wrIndex = state.controlledReceiverIndex;
    const wr = { ...state.receivers[wrIndex] };

    // Runner steers up/down with runnerInput, runs forward automatically
    const lateralSpeed = runnerInput.turbo ? 12 : 9;
    wr.x += RUNNER_SPEED * (runnerInput.turbo ? 1.25 : 1.0) * safeDt;
    wr.y += runnerInput.moveY * lateralSpeed * safeDt;
    wr.y = Math.max(12, Math.min(148, wr.y));

    // Defenders swarm the runner
    const defenders = state.defenders.map((def) => {
      const dx = wr.x - def.x;
      const dy = wr.y - def.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.5) {
        return {
          ...def,
          x: def.x + (dx / dist) * (def.speed * 1.1) * safeDt,
          y: def.y + (dy / dist) * (def.speed * 1.1) * safeDt,
        };
      }
      return def;
    });

    // Check Touchdown
    if (wr.x >= 100) {
      return {
        state: {
          ...state,
          score: state.score + 7,
          phase: 'touchdown',
          receivers: state.receivers.map((r, i) => (i === wrIndex ? wr : r)),
          defenders,
        },
        event: 'touchdown',
      };
    }

    // Check Tackle by Defender
    let tackled = false;
    for (const def of defenders) {
      if (Math.hypot(def.x - wr.x, def.y - wr.y) < 3.8) {
        tackled = true;
        break;
      }
    }

    if (tackled) {
      const gained = Math.round(wr.x - state.yardLine);
      const newYardLine = Math.min(99, Math.round(wr.x));
      const remainingToGo = state.yardsToGo - gained;

      if (remainingToGo <= 0) {
        // First Down!
        return {
          state: {
            ...state,
            yardLine: newYardLine,
            down: 1,
            yardsToGo: 10,
            phase: 'play_ended',
            receivers: state.receivers.map((r, i) => (i === wrIndex ? wr : r)),
            defenders,
          },
          event: 'first_down',
        };
      } else {
        const nextDown = state.down + 1;
        if (nextDown > 4) {
          return {
            state: {
              ...state,
              yardLine: newYardLine,
              phase: 'turnover',
              receivers: state.receivers.map((r, i) => (i === wrIndex ? wr : r)),
              defenders,
            },
            event: 'turnover',
          };
        }

        return {
          state: {
            ...state,
            yardLine: newYardLine,
            down: nextDown,
            yardsToGo: remainingToGo,
            phase: 'play_ended',
            receivers: state.receivers.map((r, i) => (i === wrIndex ? wr : r)),
            defenders,
          },
          event: 'tackle',
        };
      }
    }

    return {
      state: {
        ...state,
        receivers: state.receivers.map((r, i) => (i === wrIndex ? wr : r)),
        defenders,
      },
    };
  }

  return { state };
}
