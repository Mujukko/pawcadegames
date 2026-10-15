export interface GameMetadata {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: 'puzzle' | 'casual' | 'arcade';
  route: string;
  status: 'playable' | 'coming-soon';
  rating: number;
  playCount: string;
  badge?: string;
  controls: {
    desktop: string[];
    mobile: string[];
  };
  features: string[];
  metaTitle: string;
  metaDescription: string;
}

export const GAMES_REGISTRY: GameMetadata[] = [
  {
    id: 'dog-parking',
    slug: 'dog-parking',
    title: 'Dog Parking',
    tagline: 'Slide cute pups through crowded yards to their kennels!',
    description: 'Dog Parking is a colorful, charming casual traffic puzzle game. Guide adorable breeds like Corgis, Pugs, Shibas, and Dachshunds through tight parking yards and clear the exit gate for Sunny the Star Dog. Features 12 handcrafted levels with increasing spatial difficulty!',
    category: 'puzzle',
    route: '/games/dog-parking/',
    status: 'playable',
    rating: 4.9,
    playCount: '12.4K',
    badge: 'Popular',
    controls: {
      desktop: [
        'Mouse Drag: Click and drag any dog forward/backward along its lane',
        'R Key: Quick restart current level',
        'Z Key: Undo previous move',
      ],
      mobile: [
        'Touch Swipe: Slide dogs with your thumb along their natural orientation',
        'Tap Buttons: Quick access to Restart, Undo, Mute, and Level Select',
      ],
    },
    features: [
      '12 Handcrafted & 100% Verified Solvable Levels',
      'Cute Original Dog Breeds (Corgi, Pug, Shiba, Dachshund, Retriever, Dalmatian, Poodle)',
      'Smooth 60FPS Physics & Sliding Tweens',
      'Procedural Web Audio Sound Effects (Barks, Slides, Win Fanfare)',
      'Star Rating System & Local Progress Save',
      'Zero Downloads or Accounts Required',
    ],
    metaTitle: 'Dog Parking — Free Online Casual Puzzle Game | Pawcade',
    metaDescription: 'Play Dog Parking free in your browser! Unblock the dogs and slide Sunny the Star Corgi to the exit gate. 100% free casual brain teaser game.',
  },
  {
    id: 'cat-parking',
    slug: 'cat-parking',
    title: 'Cat Parking',
    tagline: 'Slide adorable kitties and guide Luna the Star Cat to the cozy cat flap!',
    description: 'Cat Parking is a relaxing and purr-fect traffic puzzle game. Untangle sleepy kitties, fluffy Maine Coons, Siamese, and Calicos to open the exit path for Luna. Features 12 handcrafted levels, feline soundscapes, and intuitive touch controls!',
    category: 'puzzle',
    route: '/games/cat-parking/',
    status: 'playable',
    rating: 5.0,
    playCount: '9.8K',
    badge: 'New',
    controls: {
      desktop: [
        'Mouse Drag: Click and drag any cat forward/backward along its lane',
        'R Key: Quick restart current level',
        'Z Key: Undo previous move',
      ],
      mobile: [
        'Touch Swipe: Slide cats with your finger along their natural orientation',
        'Tap Buttons: Quick access to Restart, Undo, Mute, and Level Select',
      ],
    },
    features: [
      '12 Handcrafted & 100% Verified Solvable Levels',
      'Charming Cat Breeds (Calico, Siamese, Tabby, Black Cat, Persian, Russian Blue, Maine Coon, Bengal)',
      'Smooth 60FPS Physics & Sliding Tweens',
      'Procedural Feline Web Audio (Meows, Purrs, Bell Chimes, Fanfare)',
      'Star Rating System & Independent Local Progress Save',
      'Zero Downloads or Accounts Required',
    ],
    metaTitle: 'Cat Parking — Free Online Casual Cat Puzzle Game | Pawcade',
    metaDescription: 'Play Cat Parking free in your browser! Slide the sleepy cats and guide Luna the Star Cat to the cozy exit gate. 100% free casual puzzle game.',
  },
  {
    id: 'cat-cafe-rush',
    slug: 'cat-cafe-rush',
    title: 'Cat Cafe Rush',
    tagline: 'Serve treats and balance cute kitty orders before time runs out!',
    description: 'Manage a bustling feline bakery! Match delicious fish pastries and warm milk cups to keep your furry customers purring.',
    category: 'casual',
    route: '/games/cat-cafe-rush/',
    status: 'coming-soon',
    rating: 4.8,
    playCount: 'Coming Soon',
    badge: 'Next Up',
    controls: {
      desktop: ['Click and Drag ingredients to fulfill cat orders'],
      mobile: ['Tap to prepare and serve orders'],
    },
    features: ['Over 20 cat customer personalities', 'Upgradable cafe decor', 'Fast-paced casual frenzy'],
    metaTitle: 'Cat Cafe Rush — Coming Soon to Pawcade',
    metaDescription: 'Manage a cozy cat cafe in Cat Cafe Rush. Coming soon to Pawcade free games.',
  },
  {
    id: 'hamster-ball-dash',
    slug: 'hamster-ball-dash',
    title: 'Hamster Ball Dash',
    tagline: 'Roll through twisty obstacle courses and collect sunflower seeds!',
    description: 'Guide an adventurous hamster inside a translucent sphere across ramps, tunnels, and bouncy springboards.',
    category: 'arcade',
    route: '/games/hamster-ball-dash/',
    status: 'coming-soon',
    rating: 4.7,
    playCount: 'Coming Soon',
    controls: {
      desktop: ['Arrow Keys / A-D to steer and balance'],
      mobile: ['Tilt or on-screen joystick to steer'],
    },
    features: ['Physics-based rolling mechanics', 'Secret shortcut tunnels', 'Seed collection bonuses'],
    metaTitle: 'Hamster Ball Dash — Coming Soon to Pawcade',
    metaDescription: 'Physics puzzle rolling adventure with cute hamsters. Coming soon to Pawcade.',
  },
];
