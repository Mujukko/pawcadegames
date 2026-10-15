import { LevelConfig } from '../logic/types';

export const LEVELS: LevelConfig[] = [
  // Level 1: First Pounce (Gentle Tutorial - 2 moves)
  {
    id: 1,
    name: 'First Pounce',
    difficulty: 'Easy',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    cats: [
      { id: 'hero', breed: 'hero', name: 'Luna (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'tabby1', breed: 'tabby', name: 'Milo', x: 4, y: 1, length: 2, orientation: 'vertical' },
      { id: 'siamese1', breed: 'siamese', name: 'Cleo', x: 2, y: 4, length: 2, orientation: 'horizontal' },
    ],
    hint: 'Slide Milo downward to clear the path for Luna!',
    optimalMoves: 2,
  },

  // Level 2: Kitten Cuddle (3 moves)
  {
    id: 2,
    name: 'Kitten Cuddle',
    difficulty: 'Easy',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    cats: [
      { id: 'hero', breed: 'hero', name: 'Luna (Hero)', x: 0, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'black1', breed: 'black', name: 'Shadow', x: 2, y: 1, length: 2, orientation: 'vertical' },
      { id: 'siamese1', breed: 'siamese', name: 'Cleo', x: 4, y: 2, length: 2, orientation: 'vertical' },
      { id: 'tabby1', breed: 'tabby', name: 'Milo', x: 2, y: 4, length: 2, orientation: 'horizontal' },
    ],
    hint: 'Move Shadow up and Cleo down to open Luna’s lane!',
    optimalMoves: 3,
  },

  // Level 3: Siamese Stroll (3 moves)
  {
    id: 3,
    name: 'Siamese Stroll',
    difficulty: 'Easy',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    cats: [
      { id: 'hero', breed: 'hero', name: 'Luna (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'tabby1', breed: 'tabby', name: 'Milo', x: 2, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'russian1', breed: 'russian_blue', name: 'Smokey', x: 3, y: 2, length: 2, orientation: 'vertical' },
      { id: 'persian1', breed: 'persian', name: 'Bella', x: 4, y: 1, length: 2, orientation: 'vertical' },
      { id: 'black1', breed: 'black', name: 'Shadow', x: 0, y: 3, length: 2, orientation: 'vertical' },
      { id: 'bengal1', breed: 'bengal', name: 'Leo', x: 1, y: 4, length: 3, orientation: 'horizontal' },
    ],
    hint: 'Shift Bella down, then Smokey down to release Luna!',
    optimalMoves: 4,
  },

  // Level 4: Yarn Ball Alley (4 moves)
  {
    id: 4,
    name: 'Yarn Ball Alley',
    difficulty: 'Medium',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    cats: [
      { id: 'hero', breed: 'hero', name: 'Luna (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'tabby1', breed: 'tabby', name: 'Milo', x: 3, y: 1, length: 2, orientation: 'vertical' },
      { id: 'persian1', breed: 'persian', name: 'Bella', x: 4, y: 2, length: 2, orientation: 'vertical' },
      { id: 'siamese1', breed: 'siamese', name: 'Cleo', x: 3, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'russian1', breed: 'russian_blue', name: 'Smokey', x: 1, y: 4, length: 2, orientation: 'horizontal' },
      { id: 'black1', breed: 'black', name: 'Shadow', x: 4, y: 4, length: 2, orientation: 'horizontal' },
    ],
    obstacles: [
      { id: 'yarn1', type: 'yarn', x: 0, y: 0 },
    ],
    hint: 'Yarn balls stay put. Clear the top corridor first!',
    optimalMoves: 4,
  },

  // Level 5: Maine Coon Crossing (4 moves)
  {
    id: 5,
    name: 'Maine Coon Crossing',
    difficulty: 'Medium',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    cats: [
      { id: 'hero', breed: 'hero', name: 'Luna (Hero)', x: 0, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'mainecoon1', breed: 'maine_coon', name: 'Oliver', x: 3, y: 1, length: 3, orientation: 'vertical' },
      { id: 'siamese1', breed: 'siamese', name: 'Cleo', x: 1, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'persian1', breed: 'persian', name: 'Bella', x: 4, y: 2, length: 2, orientation: 'vertical' },
      { id: 'tabby1', breed: 'tabby', name: 'Milo', x: 1, y: 4, length: 2, orientation: 'horizontal' },
      { id: 'bengal1', breed: 'bengal', name: 'Leo', x: 3, y: 5, length: 3, orientation: 'horizontal' },
    ],
    hint: 'Oliver is a long fluffy cat! Slide him all the way down once row 4 clears.',
    optimalMoves: 4,
  },

  // Level 6: The Cardboard Box (4 moves)
  {
    id: 6,
    name: 'The Cardboard Box',
    difficulty: 'Medium',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    cats: [
      { id: 'hero', breed: 'hero', name: 'Luna (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'black1', breed: 'black', name: 'Shadow', x: 3, y: 1, length: 2, orientation: 'vertical' },
      { id: 'tabby1', breed: 'tabby', name: 'Milo', x: 4, y: 2, length: 2, orientation: 'vertical' },
      { id: 'siamese1', breed: 'siamese', name: 'Cleo', x: 0, y: 1, length: 2, orientation: 'vertical' },
      { id: 'russian1', breed: 'russian_blue', name: 'Smokey', x: 2, y: 4, length: 2, orientation: 'horizontal' },
      { id: 'persian1', breed: 'persian', name: 'Bella', x: 4, y: 4, length: 2, orientation: 'horizontal' },
    ],
    obstacles: [
      { id: 'box1', type: 'box', x: 3, y: 0 },
    ],
    hint: 'A cardboard box blocks Shadow from moving up. Push him down instead!',
    optimalMoves: 4,
  },

  // Level 7: Double Cat Flap (4 moves)
  {
    id: 7,
    name: 'Double Cat Flap',
    difficulty: 'Medium',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    cats: [
      { id: 'hero', breed: 'hero', name: 'Luna (Hero)', x: 0, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'persian1', breed: 'persian', name: 'Bella', x: 2, y: 1, length: 2, orientation: 'vertical' },
      { id: 'black1', breed: 'black', name: 'Shadow', x: 3, y: 2, length: 2, orientation: 'vertical' },
      { id: 'mainecoon1', breed: 'maine_coon', name: 'Oliver', x: 4, y: 0, length: 3, orientation: 'vertical' },
      { id: 'tabby1', breed: 'tabby', name: 'Milo', x: 0, y: 4, length: 2, orientation: 'horizontal' },
      { id: 'siamese1', breed: 'siamese', name: 'Cleo', x: 2, y: 4, length: 2, orientation: 'horizontal' },
    ],
    hint: 'Clear Bella to the top and Shadow to the bottom.',
    optimalMoves: 4,
  },

  // Level 8: Midnight Zoomies (6 moves)
  {
    id: 8,
    name: 'Midnight Zoomies',
    difficulty: 'Hard',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    cats: [
      { id: 'hero', breed: 'hero', name: 'Luna (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'black1', breed: 'black', name: 'Shadow', x: 0, y: 0, length: 2, orientation: 'vertical' },
      { id: 'siamese1', breed: 'siamese', name: 'Cleo', x: 1, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'persian1', breed: 'persian', name: 'Bella', x: 3, y: 0, length: 2, orientation: 'vertical' },
      { id: 'russian1', breed: 'russian_blue', name: 'Smokey', x: 4, y: 1, length: 2, orientation: 'vertical' },
      { id: 'tabby1', breed: 'tabby', name: 'Milo', x: 3, y: 2, length: 2, orientation: 'vertical' },
      { id: 'bengal1', breed: 'bengal', name: 'Leo', x: 1, y: 4, length: 3, orientation: 'horizontal' },
      { id: 'mainecoon1', breed: 'maine_coon', name: 'Oliver', x: 4, y: 3, length: 3, orientation: 'vertical' },
    ],
    hint: 'Zoom through the upper hall to unlock the lower corner.',
    optimalMoves: 4,
  },

  // Level 9: Scratching Post Jam (9 moves)
  {
    id: 9,
    name: 'Scratching Post Jam',
    difficulty: 'Hard',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    cats: [
      { id: 'hero', breed: 'hero', name: 'Luna (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'c1', breed: 'siamese', name: 'Cleo', x: 0, y: 0, length: 2, orientation: 'vertical' },
      { id: 'c2', breed: 'tabby', name: 'Milo', x: 1, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'c3', breed: 'black', name: 'Shadow', x: 3, y: 0, length: 2, orientation: 'vertical' },
      { id: 't1', breed: 'maine_coon', name: 'Oliver', x: 4, y: 0, length: 3, orientation: 'vertical' },
      { id: 'c4', breed: 'persian', name: 'Bella', x: 2, y: 3, length: 2, orientation: 'vertical' },
      { id: 'c5', breed: 'russian_blue', name: 'Smokey', x: 3, y: 3, length: 2, orientation: 'horizontal' },
      { id: 'c6', breed: 'calico', name: 'Daisy', x: 4, y: 4, length: 2, orientation: 'horizontal' },
      { id: 'c7', breed: 'tabby', name: 'Simba', x: 0, y: 4, length: 2, orientation: 'vertical' },
    ],
    hint: 'Step backward first to unlock the bottom cats!',
    optimalMoves: 9,
  },

  // Level 10: The Great Catnap (6 moves)
  {
    id: 10,
    name: 'The Great Catnap',
    difficulty: 'Hard',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    cats: [
      { id: 'hero', breed: 'hero', name: 'Luna (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'c1', breed: 'black', name: 'Shadow', x: 0, y: 0, length: 2, orientation: 'vertical' },
      { id: 'c2', breed: 'tabby', name: 'Milo', x: 1, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'c3', breed: 'siamese', name: 'Cleo', x: 3, y: 0, length: 2, orientation: 'vertical' },
      { id: 't1', breed: 'bengal', name: 'Leo', x: 4, y: 0, length: 3, orientation: 'vertical' },
      { id: 't2', breed: 'maine_coon', name: 'Oliver', x: 5, y: 1, length: 3, orientation: 'vertical' },
      { id: 'c4', breed: 'persian', name: 'Bella', x: 2, y: 3, length: 2, orientation: 'vertical' },
      { id: 'c5', breed: 'russian_blue', name: 'Smokey', x: 3, y: 3, length: 2, orientation: 'horizontal' },
      { id: 'c6', breed: 'calico', name: 'Daisy', x: 0, y: 4, length: 2, orientation: 'horizontal' },
      { id: 'c7', breed: 'tabby', name: 'Simba', x: 3, y: 5, length: 2, orientation: 'horizontal' },
    ],
    hint: 'Both tall cats on the right must be synchronized.',
    optimalMoves: 6,
  },

  // Level 11: Nine Lives Maze (Expert - 5 moves)
  {
    id: 11,
    name: 'Nine Lives Maze',
    difficulty: 'Expert',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    cats: [
      { id: 'hero', breed: 'hero', name: 'Luna (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'black1', breed: 'black', name: 'Shadow', x: 3, y: 0, length: 2, orientation: 'vertical' },
      { id: 'russian1', breed: 'russian_blue', name: 'Smokey', x: 4, y: 0, length: 2, orientation: 'vertical' },
      { id: 'siamese1', breed: 'siamese', name: 'Cleo', x: 3, y: 2, length: 2, orientation: 'vertical' },
      { id: 'persian1', breed: 'persian', name: 'Bella', x: 4, y: 2, length: 2, orientation: 'vertical' },
      { id: 'mainecoon1', breed: 'maine_coon', name: 'Oliver', x: 1, y: 4, length: 3, orientation: 'horizontal' },
      { id: 'bengal1', breed: 'bengal', name: 'Leo', x: 0, y: 5, length: 3, orientation: 'horizontal' },
      { id: 'tabby1', breed: 'tabby', name: 'Milo', x: 5, y: 2, length: 2, orientation: 'vertical' },
    ],
    obstacles: [
      { id: 'box1', type: 'box', x: 0, y: 0 },
    ],
    hint: 'A tightly packed maze with dual vertical columns. Move bottom coon first.',
    optimalMoves: 5,
  },

  // Level 12: Grand Feline Master (Expert - 10 moves)
  {
    id: 12,
    name: 'Grand Feline Master',
    difficulty: 'Expert',
    width: 6,
    height: 6,
    exit: { side: 'right', coordinate: 2 },
    cats: [
      { id: 'hero', breed: 'hero', name: 'Luna (Hero)', x: 1, y: 2, length: 2, orientation: 'horizontal', isHero: true },
      { id: 'c1', breed: 'siamese', name: 'Cleo', x: 0, y: 0, length: 2, orientation: 'vertical' },
      { id: 'c2', breed: 'tabby', name: 'Milo', x: 1, y: 0, length: 2, orientation: 'horizontal' },
      { id: 'c3', breed: 'black', name: 'Shadow', x: 3, y: 0, length: 2, orientation: 'vertical' },
      { id: 't1', breed: 'maine_coon', name: 'Oliver', x: 4, y: 0, length: 3, orientation: 'vertical' },
      { id: 't2', breed: 'bengal', name: 'Leo', x: 5, y: 1, length: 3, orientation: 'vertical' },
      { id: 'c4', breed: 'persian', name: 'Bella', x: 2, y: 3, length: 2, orientation: 'vertical' },
      { id: 'c5', breed: 'russian_blue', name: 'Smokey', x: 3, y: 3, length: 2, orientation: 'horizontal' },
      { id: 'c6', breed: 'calico', name: 'Daisy', x: 4, y: 4, length: 2, orientation: 'horizontal' },
      { id: 'c7', breed: 'tabby', name: 'Felix', x: 0, y: 4, length: 2, orientation: 'vertical' },
    ],
    hint: 'The ultimate spatial master puzzle. Every single piece must dance in rhythm!',
    optimalMoves: 10,
  },
];
