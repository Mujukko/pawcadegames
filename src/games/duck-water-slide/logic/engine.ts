import {
  DuckRacer,
  DuckWaterSlideEvent,
  DuckWaterSlideState,
  SlideCourseConfig,
  SlideItem,
  SlideItemType,
} from './types';

export const FLUME_HALF_WIDTH = 125;
export const BASE_RACER_SPEED = 45; // meters per second

export const COURSES: SlideCourseConfig[] = [
  {
    id: 1,
    name: 'Meadow Creek Flume',
    theme: 'Gentle water slide through sunny pasture pastures',
    totalDistance: 320,
    waterHue: '#38bdf8',
  },
  {
    id: 2,
    name: 'Orchard Rapids',
    theme: 'Fast winding flume through apple trees with water ramps',
    totalDistance: 460,
    waterHue: '#0ea5e9',
  },
  {
    id: 3,
    name: 'Windmill Corkscrew',
    theme: 'High speed spirals with beach ball obstacles',
    totalDistance: 620,
    waterHue: '#06b6d4',
  },
  {
    id: 4,
    name: 'Grand Splashdown Canyon',
    theme: 'Extreme canyon drops and the grand farm pool plunge!',
    totalDistance: 800,
    waterHue: '#0284c7',
  },
];

export function generateItemsForCourse(course: SlideCourseConfig): SlideItem[] {
  const items: SlideItem[] = [];
  let id = 1;

  // Space items along the distance (every 14-22 meters)
  let d = 25;
  while (d < course.totalDistance - 30) {
    const x = Math.round((Math.random() * 2 - 1) * (FLUME_HALF_WIDTH - 25));

    // Distribution of items
    const roll = Math.random();
    let type: SlideItemType;

    if (roll < 0.35) {
      type = 'rubber_duck'; // 50 pts
    } else if (roll < 0.55) {
      type = 'watermelon'; // 100 pts
    } else if (roll < 0.70) {
      type = 'speed_boost'; // 3.5s turbo
    } else if (roll < 0.82) {
      type = 'water_ramp'; // stunt jump
    } else if (roll < 0.92) {
      type = 'soap_bar'; // slippery spin
    } else {
      type = 'beach_ball'; // hazard bounce
    }

    items.push({
      id: id++,
      trackX: x,
      worldDistance: d,
      type,
      collected: false,
    });

    d += 16 + Math.random() * 12;
  }

  return items;
}

export function createInitialState(courseIndex = 0): DuckWaterSlideState {
  const safeIndex = Math.max(0, Math.min(courseIndex, COURSES.length - 1));
  const course = COURSES[safeIndex]!;
  const items = generateItemsForCourse(course);

  const duck: DuckRacer = {
    x: 0,
    vx: 0,
    speed: BASE_RACER_SPEED,
    baseSpeed: BASE_RACER_SPEED,
    inAir: false,
    airTimer: 0,
    spinTimer: 0,
    boostTimer: 0,
  };

  let highScore = 0;
  if (typeof localStorage !== 'undefined') {
    try {
      highScore = parseInt(localStorage.getItem('pawcade_duck_slide_highscore') || '0', 10) || 0;
    } catch {
      highScore = 0;
    }
  }

  return {
    currentCourseIndex: safeIndex,
    distanceCovered: 0,
    duck,
    score: 0,
    highScore,
    lives: 3,
    combo: 0,
    items,
    courseComplete: false,
    gameOver: false,
    gameComplete: false,
    lastEvents: [],
  };
}

export function updateEngine(
  state: DuckWaterSlideState,
  dt: number,
  steerInput: number // -1.0 (full left) to +1.0 (full right)
): DuckWaterSlideState {
  if (state.gameOver || state.courseComplete || state.gameComplete) {
    return { ...state, lastEvents: [] };
  }

  const events: DuckWaterSlideEvent[] = [];
  const clampedDt = Math.min(0.04, Math.max(0.001, dt));
  const currentCourse = COURSES[state.currentCourseIndex]!;

  // 1. Update Duck Timers
  let nextBoostTimer = Math.max(0, state.duck.boostTimer - clampedDt);
  let nextSpinTimer = Math.max(0, state.duck.spinTimer - clampedDt);
  let nextAirTimer = Math.max(0, state.duck.airTimer - clampedDt);
  let nextInAir = nextAirTimer > 0;

  // Stunt landing event
  if (state.duck.inAir && !nextInAir) {
    events.push({ type: 'stunt_landing', x: state.duck.x });
  }

  // 2. Compute Duck Speed & Lateral Movement
  let targetSpeed = state.duck.baseSpeed;
  if (nextBoostTimer > 0) {
    targetSpeed = state.duck.baseSpeed * 1.6; // 60% turbo rush
  } else if (nextSpinTimer > 0) {
    targetSpeed = state.duck.baseSpeed * 0.55; // slowed by soap spinout
  }

  // Steer duck left/right (unless spinning in spinout)
  let nextDuckX = state.duck.x;
  if (nextSpinTimer <= 0) {
    const steerSpeed = 260; // px/s
    nextDuckX += steerInput * steerSpeed * clampedDt;
    nextDuckX = Math.max(-FLUME_HALF_WIDTH + 18, Math.min(FLUME_HALF_WIDTH - 18, nextDuckX));
  } else {
    // Slight involuntary spin wobble
    nextDuckX += Math.sin(Date.now() * 0.02) * 60 * clampedDt;
    nextDuckX = Math.max(-FLUME_HALF_WIDTH + 18, Math.min(FLUME_HALF_WIDTH - 18, nextDuckX));
  }

  // 3. Advance Distance Down Flume
  const nextDistance = state.distanceCovered + targetSpeed * clampedDt;

  // 4. Collision Detection with Track Items
  let nextScore = state.score;
  let nextLives = state.lives;
  let nextCombo = state.combo;

  const nextItems = state.items.map((item) => {
    if (item.collected) return item;

    // Check distance proximity (within 3 meters of duck)
    const distDiff = Math.abs(item.worldDistance - nextDistance);
    if (distDiff <= 2.8) {
      // Check lateral overlap (within 28px)
      const latDiff = Math.abs(item.trackX - nextDuckX);
      if (latDiff <= 28) {
        // Collision!
        if (item.type === 'rubber_duck') {
          nextScore += 50 + nextCombo * 10;
          nextCombo++;
          events.push({ type: 'collect_duck', itemType: item.type, x: item.trackX });
          return { ...item, collected: true };
        } else if (item.type === 'watermelon') {
          nextScore += 100 + nextCombo * 20;
          nextCombo++;
          events.push({ type: 'collect_melon', itemType: item.type, x: item.trackX });
          return { ...item, collected: true };
        } else if (item.type === 'speed_boost') {
          nextBoostTimer = 3.5;
          events.push({ type: 'hit_boost', itemType: item.type, x: item.trackX });
          return { ...item, collected: true };
        } else if (item.type === 'water_ramp') {
          nextAirTimer = 1.6;
          nextInAir = true;
          nextScore += 200; // stunt launch bonus
          events.push({ type: 'hit_ramp', itemType: item.type, x: item.trackX });
          return { ...item, collected: true };
        } else if (item.type === 'soap_bar') {
          // If in air, sail right over hazards safely!
          if (!nextInAir) {
            nextSpinTimer = 1.1;
            nextCombo = 0;
            events.push({ type: 'hit_soap', itemType: item.type, x: item.trackX });
            return { ...item, collected: true };
          }
        } else if (item.type === 'beach_ball') {
          // If in air, jump over!
          if (!nextInAir) {
            nextLives = Math.max(0, nextLives - 1);
            nextCombo = 0;
            events.push({ type: 'hit_hazard', itemType: item.type, x: item.trackX });
            return { ...item, collected: true };
          }
        }
      }
    }

    return item;
  });

  // 5. Check Game Over / Lives
  let nextGameOver: boolean = state.gameOver;
  if (nextLives <= 0) {
    nextGameOver = true;
    events.push({ type: 'game_over' });
  }

  // 6. Check Course Finish Splashdown
  let nextCourseComplete: boolean = state.courseComplete;
  if (nextDistance >= currentCourse.totalDistance && !nextGameOver) {
    nextCourseComplete = true;
    nextScore += 500; // Course clear bonus
    events.push({ type: 'course_finish' });
  }

  // High score tracking
  const nextHighScore = Math.max(state.highScore, nextScore);
  if (nextScore > state.highScore && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('pawcade_duck_slide_highscore', String(nextHighScore));
    } catch {
      // Ignore storage errors
    }
  }

  if (nextBoostTimer > 0) {
    targetSpeed = state.duck.baseSpeed * 1.6;
  } else if (nextSpinTimer > 0) {
    targetSpeed = state.duck.baseSpeed * 0.55;
  }

  const nextDuck: DuckRacer = {
    ...state.duck,
    x: nextDuckX,
    speed: targetSpeed,
    inAir: nextInAir,
    airTimer: nextAirTimer,
    spinTimer: nextSpinTimer,
    boostTimer: nextBoostTimer,
  };

  return {
    ...state,
    distanceCovered: Math.min(currentCourse.totalDistance, nextDistance),
    duck: nextDuck,
    score: nextScore,
    highScore: nextHighScore,
    lives: nextLives,
    combo: nextCombo,
    items: nextItems,
    courseComplete: nextCourseComplete,
    gameOver: nextGameOver,
    lastEvents: events,
  };
}

export function nextCourse(state: DuckWaterSlideState): DuckWaterSlideState {
  const nextIdx = state.currentCourseIndex + 1;
  if (nextIdx >= COURSES.length) {
    return {
      ...state,
      gameComplete: true,
      courseComplete: true,
    };
  }

  const nextCourseConfig = COURSES[nextIdx]!;
  const nextItems = generateItemsForCourse(nextCourseConfig);

  const duck: DuckRacer = {
    x: 0,
    vx: 0,
    speed: BASE_RACER_SPEED,
    baseSpeed: BASE_RACER_SPEED,
    inAir: false,
    airTimer: 0,
    spinTimer: 0,
    boostTimer: 0,
  };

  return {
    ...state,
    currentCourseIndex: nextIdx,
    distanceCovered: 0,
    duck,
    items: nextItems,
    courseComplete: false,
    combo: 0,
    lastEvents: [],
  };
}

export function restartCourse(state: DuckWaterSlideState): DuckWaterSlideState {
  const currentCourse = COURSES[state.currentCourseIndex]!;
  const nextItems = generateItemsForCourse(currentCourse);

  const duck: DuckRacer = {
    x: 0,
    vx: 0,
    speed: BASE_RACER_SPEED,
    baseSpeed: BASE_RACER_SPEED,
    inAir: false,
    airTimer: 0,
    spinTimer: 0,
    boostTimer: 0,
  };

  return {
    ...state,
    distanceCovered: 0,
    duck,
    lives: 3,
    combo: 0,
    items: nextItems,
    courseComplete: false,
    gameOver: false,
    lastEvents: [],
  };
}
