export type DishType = 'fish_sundae' | 'clam_pie' | 'kelp_shake' | 'ice_cake';
export type CustomerSpecies = 'penguin' | 'polar_bear' | 'seal';

export type CustomerLifecycle =
  | 'at_door'
  | 'seated'
  | 'ordering'
  | 'waiting_food'
  | 'eating'
  | 'leaving';

export interface CustomerState {
  id: string;
  species: CustomerSpecies;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: CustomerLifecycle;
  patience: number; // 0 to 100
  order?: DishType;
  tableId?: string;
  eatTimer: number; // seconds left eating
}

export interface TableState {
  id: string;
  number: number;
  x: number;
  y: number;
  status: 'empty' | 'dirty' | 'occupied';
  customerId?: string;
  servedDish?: DishType;
  tipAmount: number;
}

export interface FoodOrder {
  id: string;
  dish: DishType;
  tableId: string;
  prepTimeLeft: number;
  ready: boolean;
}

export interface WaitressEntity {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  carriedDish?: DishType;
  skatesLevel: number;
}

export interface ShopUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  icon: string;
}

export type DinerGameStatus = 'ready' | 'shift_active' | 'shift_summary' | 'game_over' | 'victory';

export type DinerEvent =
  | { type: 'seat_customer'; tableId: string; customerId: string }
  | { type: 'take_order'; tableId: string; dish: DishType }
  | { type: 'dish_ready'; dish: DishType }
  | { type: 'pickup_dish'; dish: DishType }
  | { type: 'serve_dish'; tableId: string; dish: DishType }
  | { type: 'table_dirty'; tableId: string; tip: number }
  | { type: 'clear_table'; tableId: string; coinsEarned: number }
  | { type: 'customer_left'; customerId: string; reason: 'patience_lost' }
  | { type: 'shift_complete'; day: number; earned: number; target: number }
  | { type: 'victory'; totalBank: number };

export interface DinerGameState {
  status: DinerGameStatus;
  day: number;
  shiftTimer: number; // seconds left
  maxShiftTime: number;
  money: number; // earned today
  totalBank: number;
  targetMoney: number;
  tables: TableState[];
  customers: CustomerState[];
  kitchenOrders: FoodOrder[];
  waitress: WaitressEntity;
  upgrades: ShopUpgrade[];
  customerSpawnTimer: number;
  events: DinerEvent[];
  boardWidth: number;
  boardHeight: number;
}
