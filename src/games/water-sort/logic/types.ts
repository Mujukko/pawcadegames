export type DrinkColor =
  | 'strawberry' // Red #f43f5e
  | 'blueberry'  // Blue #3b82f6
  | 'honey'      // Amber #f59e0b
  | 'matcha'     // Green #10b981
  | 'grape'      // Purple #8b5cf6
  | 'cream';     // Light Yellow #fef08a

export interface Bottle {
  id: number;
  slots: DrinkColor[]; // bottom (index 0) to top (max length 4)
  completed: boolean;
}

export interface WaterSortState {
  levelIndex: number;
  bottles: Bottle[];
  selectedBottleId: number | null;
  moves: number;
  history: Bottle[][];
  status: 'playing' | 'level_cleared' | 'victory';
  totalLevels: number;
}
