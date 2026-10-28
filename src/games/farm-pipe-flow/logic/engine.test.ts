import { describe, it, expect } from 'bun:test';
import {
  rotatePortsClockwise,
  getOppositeDirection,
  getBasePortsForType,
  evaluateWaterFlow,
  createInitialState,
  rotateTile,
  undoRotate,
  PIPE_CAMPAIGN_LEVELS,
} from './engine';
import {
  DIR_NORTH,
  DIR_EAST,
  DIR_SOUTH,
  DIR_WEST,
} from './types';

describe('Farm Pipe Flow Logic Engine', () => {
  it('correctly calculates bitwise port rotations', () => {
    // Straight North-South (1 | 4 = 5)
    const straight = DIR_NORTH | DIR_SOUTH;
    // Rotate 90 deg -> East-West (2 | 8 = 10)
    expect(rotatePortsClockwise(straight, 1)).toBe(DIR_EAST | DIR_WEST);
    // Rotate 180 deg -> North-South (5)
    expect(rotatePortsClockwise(straight, 2)).toBe(DIR_NORTH | DIR_SOUTH);

    // Elbow North-East (1 | 2 = 3)
    const elbow = DIR_NORTH | DIR_EAST;
    // Rotate 90 deg -> East-South (2 | 4 = 6)
    expect(rotatePortsClockwise(elbow, 1)).toBe(DIR_EAST | DIR_SOUTH);
    // Rotate 180 deg -> South-West (4 | 8 = 12)
    expect(rotatePortsClockwise(elbow, 2)).toBe(DIR_SOUTH | DIR_WEST);
    // Rotate 270 deg -> West-North (8 | 1 = 9)
    expect(rotatePortsClockwise(elbow, 3)).toBe(DIR_WEST | DIR_NORTH);
  });

  it('correctly maps opposite directions', () => {
    expect(getOppositeDirection(DIR_NORTH)).toBe(DIR_SOUTH);
    expect(getOppositeDirection(DIR_SOUTH)).toBe(DIR_NORTH);
    expect(getOppositeDirection(DIR_EAST)).toBe(DIR_WEST);
    expect(getOppositeDirection(DIR_WEST)).toBe(DIR_EAST);
  });

  it('initializes Level 1 with 3x3 grid, source and target', () => {
    const state = createInitialState(0, 500, false);
    expect(state.level).toBe(1);
    expect(state.rows).toBe(3);
    expect(state.cols).toBe(3);
    expect(state.grid[0]![0]!.type).toBe('source');
    expect(state.grid[0]![0]!.isFixed).toBe(true);
    expect(state.grid[2]![2]!.type).toBe('target');
    expect(state.grid[2]![2]!.isFixed).toBe(true);
    expect(state.highScore).toBe(500);
  });

  it('prevents rotating fixed source and target tiles', () => {
    const state = createInitialState(0, 0, false);
    const sourceRes = rotateTile(state, 0, 0);
    expect(sourceRes.success).toBe(false);

    const targetRes = rotateTile(state, 2, 2);
    expect(targetRes.success).toBe(false);
  });

  it('rotates normal pipe tile and increments move counter', () => {
    const state = createInitialState(0, 0, false);
    const tile = state.grid[0]![1]!;
    const initialRot = tile.rotation;
    const initialPorts = tile.ports;

    const res = rotateTile(state, 0, 1);
    expect(res.success).toBe(true);
    expect(tile.rotation).toBe((initialRot + 90) % 360);
    expect(tile.ports).toBe(rotatePortsClockwise(initialPorts, 1));
    expect(state.moves).toBe(1);
  });

  it('propagates water flow only when pipe ports align', () => {
    const state = createInitialState(0, 0, false);
    // Source is at (0, 0), pumps East
    // Tile (0, 1) is straight pipe with rotation 90 (East-West = 10)
    // Both align, so (0, 1) has water!
    const flow = evaluateWaterFlow(state.grid);
    expect(state.grid[0]![0]!.hasWater).toBe(true);
    expect(state.grid[0]![1]!.hasWater).toBe(true);

    // Now rotate (0, 1) by 90 deg -> North-South (5)
    rotateTile(state, 0, 1);
    // Now (0, 1) does not have West port to receive water from (0, 0)
    expect(state.grid[0]![1]!.hasWater).toBe(false);
  });

  it('detects victory when all targets are reached by water flow', () => {
    // Level 1 solution:
    // (0,0) Source pumps East
    // (0,1) Straight East-West
    // (0,2) Elbow East-South
    // (1,2) Straight North-South
    // (2,2) Target receiving from North
    const state = createInitialState(0, 0, false);
    // Set up path directly:
    state.grid[0]![0]!.ports = DIR_EAST;
    state.grid[0]![1]!.ports = DIR_EAST | DIR_WEST;
    state.grid[0]![2]!.ports = DIR_WEST | DIR_SOUTH;
    state.grid[1]![2]!.ports = DIR_NORTH | DIR_SOUTH;
    state.grid[2]![2]!.ports = DIR_NORTH;

    const flow = evaluateWaterFlow(state.grid);
    expect(flow.isWon).toBe(true);
    expect(flow.connectedTargets).toBe(1);
    expect(flow.totalTargets).toBe(1);
    expect(flow.flowPercent).toBe(100);
  });

  it('allows undoing rotation and restores previous ports and flow', () => {
    const state = createInitialState(0, 0, false);
    const tile = state.grid[0]![1]!;
    const initialPorts = tile.ports;
    const initialRot = tile.rotation;

    rotateTile(state, 0, 1);
    expect(state.moves).toBe(1);
    expect(tile.rotation).not.toBe(initialRot);

    const undone = undoRotate(state);
    expect(undone).toBe(true);
    expect(state.moves).toBe(0);
    expect(tile.rotation).toBe(initialRot);
    expect(tile.ports).toBe(initialPorts);
  });

  it('verifies all 4 campaign levels contain valid source and targets', () => {
    PIPE_CAMPAIGN_LEVELS.forEach(level => {
      const state = createInitialState(level.id - 1, 0, false);
      expect(state.rows).toBe(level.rows);
      expect(state.cols).toBe(level.cols);

      // Must have at least 1 source
      const sources = state.grid.flat().filter(t => t.type === 'source');
      expect(sources.length).toBe(1);

      // Must have at least 1 target
      const targets = state.grid.flat().filter(t => t.type === 'target');
      expect(targets.length).toBeGreaterThanOrEqual(1);
    });
  });
});
