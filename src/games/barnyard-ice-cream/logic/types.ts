export type IceCreamFlavor = 'vanilla' | 'strawberry' | 'chocolate' | 'mint' | 'caramel';

export type IceCreamSyrup = 'fudge' | 'strawberry_glaze' | 'caramel_drizzle';

export type IceCreamTopping = 'rainbow_sprinkles' | 'crushed_nuts' | 'waffle_crunch';

export interface IceCreamCone {
  base: 'waffle_cone' | 'sundae_bowl';
  scoops: IceCreamFlavor[];
  syrups: IceCreamSyrup[];
  toppings: IceCreamTopping[];
  hasWhippedCream: boolean;
  hasCherry: boolean;
}

export type IceCreamCustomerId = 'penny_piglet' | 'barnaby_pup' | 'whiskers_cat' | 'bessie_cow';

export interface IceCreamCustomer {
  id: string;
  customerId: IceCreamCustomerId;
  name: string;
  mascot: string;
  avatarColor: string;
  requestedBase: 'waffle_cone' | 'sundae_bowl';
  requestedScoops: IceCreamFlavor[];
  requestedSyrup: IceCreamSyrup | null;
  requestedTopping: IceCreamTopping | null;
  wantsCherry: boolean;
  patience: number; // 0 to 100
  maxPatience: number;
}

export type IceCreamEvent =
  | { type: 'add_scoop'; flavor: IceCreamFlavor }
  | { type: 'add_syrup'; syrup: IceCreamSyrup }
  | { type: 'add_topping'; topping: IceCreamTopping }
  | { type: 'add_whipped_cream' }
  | { type: 'add_cherry' }
  | { type: 'trash_cone' }
  | { type: 'order_served'; accuracy: number; coins: number; tip: number }
  | { type: 'order_failed'; reason: 'timeout' | 'wrong_order' }
  | { type: 'shift_clear'; shift: number; score: number }
  | { type: 'game_over'; finalScore: number }
  | { type: 'game_complete'; finalScore: number };

export interface IceCreamShiftConfig {
  shift: number;
  name: string;
  targetCustomers: number;
  patienceDuration: number; // seconds
}

export interface BarnyardIceCreamState {
  currentCone: IceCreamCone;
  currentCustomer: IceCreamCustomer | null;
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
  events: IceCreamEvent[];
}

export const MAX_LIVES = 3;
export const MAX_SCOOPS = 4;
