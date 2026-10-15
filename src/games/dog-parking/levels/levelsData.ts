import { LevelConfig } from '../logic/types';

export const LEVELS: LevelConfig[] = [
  // Level 1: First Walkies (Gentle Tutorial - 2 moves)
  {
    id: 1,
    name: 'First Walkies',
    difficulty: 'Easy',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    dogs: [
      { id: 'hero', breed: 'hero', name: 'Sunny (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'pug1', breed: 'pug', name: 'Barnaby', x: 4, y: 1, length: 2, orientation: 'vertical' },
      { id: 'corgi1', breed: 'corgi', name: 'Biscuit', x: 2, y: 4, length: 2, orientation: 'horizontal' },
    ],
    hint: 'Slide Barnaby downward to clear the path for Sunny!',
    optimalMoves: 2,
  },

  // Level 2: Two Friends (3 moves)
  {
    id: 2,
    name: 'Two Friends',
    difficulty: 'Easy',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    dogs: [
      { id: 'hero', breed: 'hero', name: 'Sunny (Hero)', x: 0, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'shiba1', breed: 'shiba', name: 'Kiko', x: 2, y: 1, length: 2, orientation: 'vertical' },
      { id: 'pug1', breed: 'pug', name: 'Otis', x: 4, y: 2, length: 2, orientation: 'vertical' },
      { id: 'corgi1', breed: 'corgi', name: 'Milo', x: 2, y: 4, length: 2, orientation: 'horizontal' },
    ],
    hint: 'Move Kiko up and Otis down to open Sunny’s lane!',
    optimalMoves: 3,
  },

  // Level 3: Dachshund Detour (3 moves)
  {
    id: 3,
    name: 'Dachshund Detour',
    difficulty: 'Easy',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    dogs: [
      { id: 'hero', breed: 'hero', name: 'Sunny (Hero)', x: 0, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'corgi1', breed: 'corgi', name: 'Biscuit', x: 0, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'pug1', breed: 'pug', name: 'Otis', x: 2, y: 0, length: 2, orientation: 'vertical' },
      { id: 'dachshund1', breed: 'dachshund', name: 'Slinky', x: 2, y: 2, length: 3, orientation: 'vertical' },
      { id: 'shiba1', breed: 'shiba', name: 'Kiko', x: 3, y: 1, length: 2, orientation: 'vertical' },
      { id: 'poodle1', breed: 'poodle', name: 'Bella', x: 0, y: 3, length: 2, orientation: 'vertical' },
      { id: 'corgi2', breed: 'corgi', name: 'Pippin', x: 3, y: 3, length: 2, orientation: 'horizontal' },
    ],
    hint: 'Long dogs like Slinky need clearance. Shift Pippin first!',
    optimalMoves: 3,
  },

  // Level 4: Poodle Crossing (4 moves)
  {
    id: 4,
    name: 'Poodle Crossing',
    difficulty: 'Medium',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    dogs: [
      { id: 'hero', breed: 'hero', name: 'Sunny (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'pug1', breed: 'pug', name: 'Barnaby', x: 3, y: 1, length: 2, orientation: 'vertical' },
      { id: 'poodle1', breed: 'poodle', name: 'Bella', x: 4, y: 2, length: 2, orientation: 'vertical' },
      { id: 'shiba1', breed: 'shiba', name: 'Mochi', x: 3, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'corgi1', breed: 'corgi', name: 'Waffles', x: 1, y: 4, length: 2, orientation: 'horizontal' },
      { id: 'dalmatian1', breed: 'dalmatian', name: 'Spot', x: 4, y: 4, length: 2, orientation: 'horizontal' },
    ],
    hint: 'Clear the lower corner before shifting Bella downward.',
    optimalMoves: 4,
  },

  // Level 5: Retriever Blockade (4 moves)
  {
    id: 5,
    name: 'Retriever Blockade',
    difficulty: 'Medium',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    dogs: [
      { id: 'hero', breed: 'hero', name: 'Sunny (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'shiba1', breed: 'shiba', name: 'Yuki', x: 0, y: 0, length: 2, orientation: 'vertical' },
      { id: 'retriever1', breed: 'retriever', name: 'Buddy', x: 3, y: 0, length: 3, orientation: 'vertical' },
      { id: 'pug1', breed: 'pug', name: 'Frank', x: 4, y: 1, length: 2, orientation: 'vertical' },
      { id: 'corgi1', breed: 'corgi', name: 'Copper', x: 1, y: 3, length: 2, orientation: 'horizontal' },
      { id: 'poodle1', breed: 'poodle', name: 'Chloe', x: 3, y: 3, length: 2, orientation: 'horizontal' },
      { id: 'dalmatian1', breed: 'dalmatian', name: 'Freckles', x: 4, y: 4, length: 2, orientation: 'horizontal' },
    ],
    hint: 'Chain reaction: move the bottom pups to give Buddy room.',
    optimalMoves: 4,
  },

  // Level 6: Yard Congestion (4 moves)
  {
    id: 6,
    name: 'Yard Congestion',
    difficulty: 'Medium',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    dogs: [
      { id: 'hero', breed: 'hero', name: 'Sunny (Hero)', x: 0, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'c1', breed: 'corgi', name: 'Teddy', x: 0, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'c2', breed: 'pug', name: 'Buster', x: 0, y: 3, length: 2, orientation: 'vertical' },
      { id: 't1', breed: 'retriever', name: 'Max', x: 2, y: 1, length: 3, orientation: 'vertical' },
      { id: 'c3', breed: 'shiba', name: 'Kira', x: 3, y: 2, length: 2, orientation: 'vertical' },
      { id: 'c4', breed: 'poodle', name: 'Lola', x: 4, y: 1, length: 2, orientation: 'vertical' },
      { id: 'c5', breed: 'dalmatian', name: 'Dot', x: 3, y: 4, length: 2, orientation: 'horizontal' },
    ],
    hint: 'Shuffle the column dogs to let Sunny advance.',
    optimalMoves: 4,
  },

  // Level 7: The Double Gate (4 moves)
  {
    id: 7,
    name: 'The Double Gate',
    difficulty: 'Hard',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    dogs: [
      { id: 'hero', breed: 'hero', name: 'Sunny (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'c1', breed: 'corgi', name: 'Biscuit', x: 0, y: 0, length: 2, orientation: 'vertical' },
      { id: 'c2', breed: 'pug', name: 'Otis', x: 1, y: 0, length: 2, orientation: 'horizontal' },
      { id: 't1', breed: 'retriever', name: 'Apollo', x: 3, y: 1, length: 3, orientation: 'vertical' },
      { id: 'c3', breed: 'shiba', name: 'Tora', x: 4, y: 1, length: 2, orientation: 'vertical' },
      { id: 'c4', breed: 'poodle', name: 'Bella', x: 4, y: 3, length: 2, orientation: 'vertical' },
      { id: 'c5', breed: 'dalmatian', name: 'Freckles', x: 1, y: 4, length: 2, orientation: 'horizontal' },
      { id: 't2', breed: 'dachshund', name: 'Rusty', x: 2, y: 5, length: 3, orientation: 'horizontal' },
    ],
    hint: 'Apollo needs clearance both above and below.',
    optimalMoves: 4,
  },

  // Level 8: Barking Gridlock (6 moves)
  {
    id: 8,
    name: 'Barking Gridlock',
    difficulty: 'Hard',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    dogs: [
      { id: 'hero', breed: 'hero', name: 'Sunny (Hero)', x: 0, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'c1', breed: 'pug', name: 'Gizmo', x: 2, y: 0, length: 2, orientation: 'vertical' },
      { id: 'c2', breed: 'corgi', name: 'Daisy', x: 0, y: 4, length: 2, orientation: 'vertical' },
      { id: 't1', breed: 'retriever', name: 'Sammy', x: 3, y: 1, length: 3, orientation: 'vertical' },
      { id: 'c3', breed: 'shiba', name: 'Kenji', x: 4, y: 1, length: 2, orientation: 'vertical' },
      { id: 'c4', breed: 'poodle', name: 'Lily', x: 1, y: 3, length: 2, orientation: 'horizontal' },
      { id: 'c5', breed: 'dalmatian', name: 'Domino', x: 3, y: 4, length: 2, orientation: 'horizontal' },
      { id: 't2', breed: 'dachshund', name: 'Archie', x: 2, y: 5, length: 3, orientation: 'horizontal' },
    ],
    hint: 'Chain moves clockwise to unlock Archie and Sammy.',
    optimalMoves: 6,
  },

  // Level 9: Puppy Traffic Jam (9 moves)
  {
    id: 9,
    name: 'Puppy Traffic Jam',
    difficulty: 'Hard',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    dogs: [
      { id: 'hero', breed: 'hero', name: 'Sunny (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'c1', breed: 'corgi', name: 'Biscuit', x: 0, y: 0, length: 2, orientation: 'vertical' },
      { id: 'c2', breed: 'shiba', name: 'Kiko', x: 1, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'c3', breed: 'pug', name: 'Barnaby', x: 3, y: 0, length: 2, orientation: 'vertical' },
      { id: 't1', breed: 'retriever', name: 'Apollo', x: 4, y: 0, length: 3, orientation: 'vertical' },
      { id: 'c4', breed: 'poodle', name: 'Bella', x: 2, y: 3, length: 2, orientation: 'vertical' },
      { id: 'c5', breed: 'dalmatian', name: 'Spot', x: 3, y: 3, length: 2, orientation: 'horizontal' },
      { id: 'c6', breed: 'corgi', name: 'Milo', x: 4, y: 4, length: 2, orientation: 'horizontal' },
      { id: 'c7', breed: 'pug', name: 'Frank', x: 0, y: 4, length: 2, orientation: 'vertical' },
    ],
    hint: 'Step backward first to unlock the bottom dogs!',
    optimalMoves: 9,
  },

  // Level 10: The Great Dogscape (6 moves)
  {
    id: 10,
    name: 'The Great Dogscape',
    difficulty: 'Expert',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    dogs: [
      { id: 'hero', breed: 'hero', name: 'Sunny (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'c1', breed: 'pug', name: 'Ziggy', x: 0, y: 0, length: 2, orientation: 'vertical' },
      { id: 'c2', breed: 'corgi', name: 'Chester', x: 1, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'c3', breed: 'shiba', name: 'Ren', x: 3, y: 0, length: 2, orientation: 'vertical' },
      { id: 't1', breed: 'retriever', name: 'Apollo', x: 4, y: 0, length: 3, orientation: 'vertical' },
      { id: 't2', breed: 'dachshund', name: 'Rusty', x: 5, y: 1, length: 3, orientation: 'vertical' },
      { id: 'c4', breed: 'poodle', name: 'Chloe', x: 2, y: 3, length: 2, orientation: 'vertical' },
      { id: 'c5', breed: 'dalmatian', name: 'Dot', x: 3, y: 3, length: 2, orientation: 'horizontal' },
      { id: 'c6', breed: 'corgi', name: 'Benny', x: 0, y: 4, length: 2, orientation: 'horizontal' },
      { id: 'c7', breed: 'pug', name: 'Pudge', x: 3, y: 5, length: 2, orientation: 'horizontal' },
    ],
    hint: 'Both tall hounds on the right must be synchronized.',
    optimalMoves: 6,
  },

  // Level 11: Hydrant Hazard (Obstacle level - 4 moves)
  {
    id: 11,
    name: 'Hydrant Hazard',
    difficulty: 'Hard',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    obstacles: [
      { id: 'h1', x: 1, y: 1, type: 'hydrant' },
      { id: 'h2', x: 4, y: 4, type: 'hydrant' },
    ],
    dogs: [
      { id: 'hero', breed: 'hero', name: 'Sunny (Hero)', x: 0, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'pug1', breed: 'pug', name: 'Gus', x: 2, y: 1, length: 2, orientation: 'vertical' },
      { id: 'corgi1', breed: 'corgi', name: 'Rusty', x: 3, y: 2, length: 2, orientation: 'vertical' },
      { id: 'shiba1', breed: 'shiba', name: 'Kira', x: 4, y: 1, length: 2, orientation: 'vertical' },
      { id: 'poodle1', breed: 'poodle', name: 'Stella', x: 1, y: 4, length: 2, orientation: 'horizontal' },
      { id: 'corgi2', breed: 'corgi', name: 'Biscuit', x: 2, y: 5, length: 2, orientation: 'horizontal' },
    ],
    hint: 'Hydrants cannot be moved. Guide dogs around them!',
    optimalMoves: 4,
  },

  // Level 12: Grand Master Finale (10 moves)
  {
    id: 12,
    name: 'Grand Master Finale',
    difficulty: 'Expert',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    dogs: [
      { id: 'hero', breed: 'hero', name: 'Sunny (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'c1', breed: 'corgi', name: 'Biscuit', x: 0, y: 0, length: 2, orientation: 'vertical' },
      { id: 'c2', breed: 'shiba', name: 'Kiko', x: 1, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'c3', breed: 'pug', name: 'Barnaby', x: 3, y: 0, length: 2, orientation: 'vertical' },
      { id: 't1', breed: 'retriever', name: 'Apollo', x: 4, y: 0, length: 3, orientation: 'vertical' },
      { id: 't2', breed: 'dachshund', name: 'Slinky', x: 5, y: 1, length: 3, orientation: 'vertical' },
      { id: 'c4', breed: 'poodle', name: 'Bella', x: 2, y: 3, length: 2, orientation: 'vertical' },
      { id: 'c5', breed: 'dalmatian', name: 'Spot', x: 3, y: 3, length: 2, orientation: 'horizontal' },
      { id: 'c6', breed: 'corgi', name: 'Milo', x: 4, y: 4, length: 2, orientation: 'horizontal' },
      { id: 'c7', breed: 'pug', name: 'Frank', x: 0, y: 4, length: 2, orientation: 'vertical' },
    ],
    hint: 'The ultimate yard puzzle! Coordinate the whole pack to guide Sunny to the gate.',
    optimalMoves: 10,
  },
];
