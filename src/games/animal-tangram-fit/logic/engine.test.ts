import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  createStageState,
  selectPiece,
  rotatePiece,
  canPlacePiece,
  placePiece,
  removePieceToTray,
  nextStage,
  resetStage,
  restartGame,
  rotateMatrix,
  STAGE_CONFIGS,
} from './engine';

describe('Animal Tangram: Wooden Block Fit Logic Engine', () => {
  it('initializes Stage 1 with proper defaults and 16 target silhouette cells', () => {
    const state = createInitialState(1500);
    expect(state.status).toBe('ready');
    expect(state.stage).toBe(1);
    expect(state.totalStages).toBe(4);
    expect(state.totalTargetCells).toBe(16);
    expect(state.filledTargetCells).toBe(0);
    expect(state.pieces.length).toBe(4);
    expect(state.selectedPieceId).toBeNull();
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(1500);
    expect(state.boardGrid.length).toBe(6);
    expect(state.boardGrid[0].length).toBe(6);
  });

  it('selects and deselects pieces cleanly', () => {
    const initial = createInitialState();
    const { state: selected, event } = selectPiece(initial, 'r-head-t');
    expect(selected.selectedPieceId).toBe('r-head-t');
    expect(event?.type).toBe('piece_selected');

    // Clicking same piece deselects it
    const { state: deselected } = selectPiece(selected, 'r-head-t');
    expect(deselected.selectedPieceId).toBeNull();
  });

  it('rotates matrix 90 degrees clockwise', () => {
    const shape = [
      [1, 1, 1],
      [0, 1, 0],
    ]; // 2 rows, 3 cols
    const rotated = rotateMatrix(shape);
    expect(rotated.length).toBe(3);
    expect(rotated[0].length).toBe(2);
    expect(rotated).toEqual([
      [0, 1],
      [1, 1],
      [0, 1],
    ]);
  });

  it('rotates piece in tray when requested', () => {
    const state = createInitialState();
    const { state: rotated, event } = rotatePiece(state, 'r-head-t');
    const piece = rotated.pieces.find((p) => p.id === 'r-head-t');
    expect(piece?.shape.length).toBe(3);
    expect(event?.type).toBe('piece_rotated');
  });

  it('rejects placement outside the animal target silhouette', () => {
    const state = createInitialState();
    // (0, 0) is not in target silhouette mask for stage 1
    const piece = state.pieces[0]; // r-head-t
    const canPlace = canPlacePiece(state.boardGrid, state.targetMask, piece.shape, 0, 0);
    expect(canPlace).toBe(false);

    const { state: rejected, events } = placePiece(state, 'r-head-t', 0, 0);
    expect(rejected.filledTargetCells).toBe(0);
    expect(events.length).toBe(0);
  });

  it('allows valid placement within silhouette and updates board', () => {
    const state = createInitialState();
    // 'r-head-t' fits at (0, 1) covering (0,1),(0,2),(0,3),(1,2)
    const { state: placed, events } = placePiece(state, 'r-head-t', 0, 1);
    expect(placed.filledTargetCells).toBe(4);
    expect(placed.score).toBe(50);
    expect(placed.boardGrid[0][1]).toBe('r-head-t');
    expect(placed.boardGrid[0][2]).toBe('r-head-t');
    expect(placed.boardGrid[0][3]).toBe('r-head-t');
    expect(placed.boardGrid[1][2]).toBe('r-head-t');
    expect(events.some((e) => e.type === 'piece_placed')).toBe(true);
  });

  it('rejects overlapping placement on occupied cells', () => {
    const state = createInitialState();
    const { state: placed1 } = placePiece(state, 'r-head-t', 0, 1);

    // Try placing another piece that overlaps (1, 2)
    const piece2 = placed1.pieces[1];
    const canPlace = canPlacePiece(placed1.boardGrid, placed1.targetMask, piece2.shape, 0, 2);
    expect(canPlace).toBe(false);
  });

  it('removes a placed piece back to tray', () => {
    const state = createInitialState();
    const { state: placed } = placePiece(state, 'r-head-t', 0, 1);
    expect(placed.filledTargetCells).toBe(4);

    const { state: removed, event } = removePieceToTray(placed, 'r-head-t');
    expect(removed.filledTargetCells).toBe(0);
    expect(removed.boardGrid[0][1]).toBeNull();
    expect(event?.type).toBe('piece_removed');
  });

  it('completely solves Stage 1 and triggers stage_clear', () => {
    let state = createInitialState();

    // Place all 4 pieces according to Stage 1 design
    const p1 = placePiece(state, 'r-head-t', 0, 1);
    state = p1.state;

    const p2 = placePiece(state, 'r-neck-l', 1, 0);
    state = p2.state;

    const p3 = placePiece(state, 'r-body-sq', 2, 2);
    state = p3.state;

    const p4 = placePiece(state, 'r-feet-t', 4, 1);
    state = p4.state;

    expect(state.filledTargetCells).toBe(16);
    expect(state.status).toBe('stage_cleared');
    expect(state.score).toBe(4 * 50 + 500); // 700 pts
    expect(p4.events.some((e) => e.type === 'stage_clear')).toBe(true);
  });

  it('completely solves Stage 4 and triggers victory', () => {
    let state = createStageState(4, 3000, 3000);

    // Stage 4 solution placements
    state = placePiece(state, 'c-horn-l', 0, 1).state;
    state = placePiece(state, 'c-horn-r', 0, 3).state;
    state = placePiece(state, 'c-spine', 2, 0).state;
    state = placePiece(state, 'c-tail-rump', 2, 4).state;
    state = placePiece(state, 'c-belly', 3, 0).state;
    state = placePiece(state, 'c-front-legs', 4, 1).state;
    const finalStep = placePiece(state, 'c-rear-legs', 4, 4);
    state = finalStep.state;

    expect(state.filledTargetCells).toBe(28);
    expect(state.status).toBe('victory');
    expect(finalStep.events.some((e) => e.type === 'victory')).toBe(true);
  });

  it('advances stages and resets correctly', () => {
    const s1 = createInitialState(800);
    const s2 = nextStage(s1);
    expect(s2.stage).toBe(2);
    expect(s2.totalTargetCells).toBe(20);

    const restarted = restartGame(s2);
    expect(restarted.stage).toBe(1);
    expect(restarted.score).toBe(0);
    expect(restarted.highScore).toBe(800);
  });
});
