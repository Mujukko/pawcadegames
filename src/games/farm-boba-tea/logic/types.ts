export type BobaTeaBase = 'farm_milk' | 'matcha' | 'strawberry' | 'thai_tea';

export type BobaTopping = 'tapioca' | 'strawberry_jelly' | 'mango_boba' | 'honeycomb';

export type IceLevel = 'none' | 'normal' | 'extra';

export type SweetnessLevel = 'half' | 'full';

export interface BobaCup {
  toppings: BobaTopping[];
  teaBase: BobaTeaBase | null;
  iceLevel: IceLevel;
  sweetness: SweetnessLevel | null;
  isSealed: boolean;
  hasStraw: boolean;
}

export type CustomerId = 'daisy_calf' | 'corgi_sunny' | 'whiskers_cat' | 'woolly_lamb';

export interface CustomerOrder {
  id: string;
  customerId: CustomerId;
  customerName: string;
  mascot: string;
  avatarColor: string;
  requestedTea: BobaTeaBase;
  requestedTopping: BobaTopping;
  requestedIce: IceLevel;
  requestedSweetness: SweetnessLevel;
  patience: number; // 0 to 100
  maxPatience: number;
}

export type BobaEvent =
  | { type: 'add_topping'; topping: BobaTopping }
  | { type: 'pour_tea'; teaBase: BobaTeaBase }
  | { type: 'add_ice'; iceLevel: IceLevel }
  | { type: 'add_sweetness'; sweetness: SweetnessLevel }
  | { type: 'seal_cup' }
  | { type: 'poke_straw' }
  | { type: 'trash_cup' }
  | { type: 'order_served'; accuracy: number; coins: number; tip: number }
  | { type: 'order_failed'; reason: 'timeout' | 'wrong_order' }
  | { type: 'shift_clear'; shift: number; score: number }
  | { type: 'game_over'; finalScore: number }
  | { type: 'game_complete'; finalScore: number };

export interface ShiftConfig {
  shift: number;
  name: string;
  targetCustomers: number;
  patienceDuration: number; // seconds
}

export interface FarmBobaState {
  currentCup: BobaCup;
  currentCustomer: CustomerOrder | null;
  customersServed: number;
  targetCustomers: number;
  shift: number;
  totalShifts: number;
  coins: number;
  score: number;
  combo: number;
  lives: number;
  highScore: number;
  shiftComplete: boolean;
  gameComplete: boolean;
  gameOver: boolean;
  events: BobaEvent[];
}

export const MAX_LIVES = 3;
export const MAX_TOPPINGS = 2;
