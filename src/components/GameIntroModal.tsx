import React, { useState, useEffect } from 'react';
import { X, Play, Sparkles, HelpCircle, Smartphone, Monitor } from 'lucide-react';

export interface GameIntroContent {
  title: string;
  subtitle: string;
  mascot: string;
  themeColor: string;
  goal: string;
  steps: {
    icon: string;
    title: string;
    desc: string;
  }[];
  controls: {
    desktop: string[];
    mobile: string[];
  };
  proTip: string;
}

export const GAME_INTROS: Record<string, GameIntroContent> = {
  'duck-hunt-classic': {
    title: 'Duck Hunt Classic: Barnyard Shoot',
    subtitle: 'NES & Atari Retro Arcade Shooter',
    mascot: '🦆🎯',
    themeColor: 'from-sky-500 via-emerald-600 to-amber-700',
    goal: 'Track flying mallards across the marsh, take quick aim, and blast targets before they escape into the sky!',
    steps: [
      {
        icon: '👀',
        title: '1. Watch Buster Flush Ducks',
        desc: 'Buster the hound sniffs the grass and leaps into the reeds to flush wild mallards into the air.',
      },
      {
        icon: '🎯',
        title: '2. Aim & Fire Quickly',
        desc: 'Tap on your phone screen or click with your mouse crosshair to shoot. You have 3 shells per flush!',
      },
      {
        icon: '🏆',
        title: '3. Meet the Round Quota',
        desc: 'Hit at least 6 out of 10 ducks in early rounds to advance. Faster golden ducks appear in later rounds!',
      },
    ],
    controls: {
      desktop: [
        'Mouse Aim & Left Click: Fire shotgun blast at flying ducks',
        'Spacebar / R: Quick reload shells or restart round',
        'M Key: Toggle retro audio and dog barks',
      ],
      mobile: [
        'Tap Flying Duck: Direct tap fires instantly with zero delay',
        'Shell Counter: 3 shots per flush before ducks fly away',
        'HUD Tracker: Follow your 10 round shots at the bottom',
      ],
    },
    proTip: 'Ducks change direction when they bounce off screen edges. Anticipate their bounce path for an easy direct hit!',
  },
  'sheep-stampede': {
    title: 'Sheep Stampede: Pasture Rush',
    subtitle: 'Mob Multiplier & Meadow Runner',
    mascot: '🐕🐑',
    themeColor: 'from-emerald-500 via-teal-600 to-indigo-900',
    goal: 'Steer Buster the Sheepdog and your herd through math multiplier gates, dodge hazards, and stampede into the big red barn corral!',
    steps: [
      {
        icon: '↔️',
        title: '1. Steer Across the Track',
        desc: 'Drag your finger or press Arrow Keys / A & D to steer Buster and the flock left and right across the lush pasture.',
      },
      {
        icon: '✖️',
        title: '2. Hit Blue Math Gates',
        desc: 'Pass through glowing blue multiplier gates (x2, x3, +10, +20) to rapidly grow your flock into an unstoppable herd!',
      },
      {
        icon: '🏡',
        title: '3. Stampede into the Barn',
        desc: 'Dodge mud pits and shearing blades. Reach the finish line corral with as many sheep as possible for huge score bonuses!',
      },
    ],
    controls: {
      desktop: [
        'Arrow Keys / A & D: Steer flock left and right',
        'Spacebar / Enter: Start stampede / Next level',
        'R Key: Quick restart level',
        'M Key: Toggle sheep vocals and sound effects',
      ],
      mobile: [
        'Touch & Drag: Swipe horizontally across track to steer',
        'Tap Buttons: Use on-screen Steer Left and Right controls',
        'Multiply Flock: Pass through blue gates to grow your herd',
      ],
    },
    proTip: 'Look ahead down the track! Sometimes taking a small subtraction gate (-5) puts you in perfect position to hit a massive multiplier (x3) right behind it!',
  },
  'horseshoe-twist': {
    title: 'Horseshoe Twist: Barn Unlock',
    subtitle: 'Concentric Ring Unlock Puzzle',
    mascot: '🐴🔓',
    themeColor: 'from-amber-500 via-yellow-600 to-amber-900',
    goal: 'Rotate concentric wooden and iron rings to align all open notches with the green exit path, releasing the Lucky Golden Horseshoe!',
    steps: [
      {
        icon: '🔄',
        title: '1. Rotate Concentric Rings',
        desc: 'Drag around any ring dial or use CW / CCW buttons to spin the circular tumblers clockwise or counter-clockwise.',
      },
      {
        icon: '⚙️',
        title: '2. Master Geared Linkages',
        desc: 'In higher levels, turning one gear wheel rotates linked rings! Plan your moves to line up all notches together.',
      },
      {
        icon: '🧲',
        title: '3. Pop the Lucky Horseshoe',
        desc: 'When all ring notches line up with the green laser guide, the locking pins slide free and pop the vault open!',
      },
    ],
    controls: {
      desktop: [
        'Mouse Drag: Drag around rings to rotate dial angle',
        'Arrow Keys / A & D: Rotate selected ring CW / CCW',
        '1-4 Keys: Select concentric Ring 1, 2, 3, or 4',
        'R Key: Quick restart level',
        'M Key: Toggle mechanical ratchet audio',
      ],
      mobile: [
        'Touch Drag: Rotate concentric rings directly around the vault dial',
        'Step Buttons: Tap Rotate CCW (-30°) or Rotate CW (+30°)',
        'Ring Tabs: Tap Ring 1, 2, 3, 4 to switch active tumbler',
      ],
    },
    proTip: 'Work from the geared linked rings first! Once the linked rings are aligned in harmony, adjust the independent free rings to finish the lock.',
  },
  'egg-buster': {
    title: 'Egg Buster: Barnyard Smash',
    subtitle: 'Slingshot Demolition & Physics Puzzle',
    mascot: '🐥🥚',
    themeColor: 'from-amber-500 via-orange-600 to-red-900',
    goal: 'Help Pippin the Chick fire bouncy farm eggs from the slingshot to shatter wooden barricades and eliminate all invading foxes!',
    steps: [
      {
        icon: '🏹',
        title: '1. Pull Back & Aim',
        desc: 'Drag back on the slingshot pouch to adjust launch angle and firing speed. Follow the real-time dotted trajectory arc to target obstacles.',
      },
      {
        icon: '💥',
        title: '2. Smash Wooden Barricades',
        desc: 'Release to fling the egg! Smash through fragile wooden crates and bounce off elastic metal milk churns to reach hidden targets.',
      },
      {
        icon: '🦊',
        title: '3. Eliminate All Foxes',
        desc: 'Knock every sneaky fox off their perches before your egg supply runs out to clear the stage and unlock the next challenge!',
      },
    ],
    controls: {
      desktop: [
        'Mouse Drag: Pull back slingshot pouch to aim',
        'Release: Launch bouncy egg projectile',
        'R Key: Quick restart level',
        'M Key: Toggle physics sound effects',
      ],
      mobile: [
        'Touch Drag: Pull back on slingshot with dotted trajectory',
        'Release: Launch projectile',
        'Eliminate Foxes: Clear all targets to complete level',
      ],
    },
    proTip: 'Target the foundation crates at the bottom of tall towers! Toppling the structure from below causes massive chain-reaction crush damage!',
  },
  'critter-tap-away': {
    title: 'Critter Tap Away: Barn Escape',
    subtitle: '3D Animal Cube Untangle & Escape',
    mascot: '🐮🐷🐰',
    themeColor: 'from-emerald-500 via-teal-600 to-indigo-900',
    goal: 'Untangle the crowded barnyard pen by tapping farm animal cubes whose outward paths are clear to set them free!',
    steps: [
      {
        icon: '👀',
        title: '1. Check Direction Arrows',
        desc: 'Each animal cube faces in a specific direction (Up, Down, Left, or Right). Look for animals with glowing green arrows pointing toward an open exit.',
      },
      {
        icon: '👆',
        title: '2. Tap Clear Animals',
        desc: 'Tap any animal whose path is clear to launch them into the meadow! If blocked by another animal, they will bonk and stay in place.',
      },
      {
        icon: '🚪',
        title: '3. Unlock the Pen',
        desc: 'Freeing perimeter animals opens up paths for the inner animals trapped deeper in the maze. Clear all critters to win!',
      },
    ],
    controls: {
      desktop: [
        'Click Critter: Tap an animal to attempt escape',
        'R Key: Quick restart level',
        'M Key: Toggle animal sound effects',
      ],
      mobile: [
        'Tap Critter: Tap any animal on the board',
        'Watch Glowing Arrows: Indicates clear exit paths',
        'Clear Pen: Free all animals to finish the level',
      ],
    },
    proTip: 'Work from the outer edges inward! Clearing perimeter critters creates open escape corridors for the trapped animals in the center.',
  },
  'farm-pantry-sort': {
    title: 'Farm Pantry Sort: Triple Pick',
    subtitle: 'Triple Goods Match & Pantry Organizing',
    mascot: '🐿️🍯',
    themeColor: 'from-amber-500 via-yellow-600 to-amber-900',
    goal: 'Help Sammy the Squirrel organize Grandma\'s pantry shelves by grouping 3 identical farm goods together to clear the cupboard!',
    steps: [
      {
        icon: '🍯',
        title: '1. Pick & Move Goods',
        desc: 'Tap any jar, bottle, or pie on the shelves to select it, then tap an open slot on another shelf to transfer it.',
      },
      {
        icon: '✨',
        title: '2. Triple Match Clear',
        desc: 'Group 3 matching goods (e.g. 3 Honey Jars or 3 Milk Bottles) on the same shelf to trigger an explosive triple-clear!',
      },
      {
        icon: '📦',
        title: '3. Reveal Hidden Reserves',
        desc: 'Clearing front slots pulls forward reserve items stocked behind the shelf. Clear all items before time expires to win!',
      },
    ],
    controls: {
      desktop: [
        'Click Item: Select jar or basket from shelf',
        'Click Open Shelf: Move item to open slot',
        'R Key: Quick restart level',
        'M Key: Toggle pantry sound effects',
      ],
      mobile: [
        'Tap to Select: Lift an item from its shelf',
        'Tap Target Slot: Place into any open slot',
        'Triple Match: Group 3 of the same goods to clear',
      ],
    },
    proTip: 'Use empty shelves as temporary staging zones to group matching goods together before committing your final matches!',
  },
  'farm-block-blast': {
    title: 'Farm Block Blast: Barnyard Grid',
    subtitle: 'Classic 8x8 Wooden Polyomino Blast',
    mascot: '🐶🧩',
    themeColor: 'from-amber-500 via-orange-600 to-indigo-800',
    goal: 'Fit wooden crop polyominoes onto the 8x8 farm grid, blast full rows and columns, and build massive Combo Streaks!',
    steps: [
      {
        icon: '🧩',
        title: '1. Place Wooden Shapes',
        desc: 'Pick from 3 polyomino crop pieces in the barn tray and fit them into any empty space on the 8x8 board.',
      },
      {
        icon: '💥',
        title: '2. Blast Rows & Columns',
        desc: 'Fill any 8 horizontal or vertical cells to blast them clean with vibrant laser flashes and earn bonus points.',
      },
      {
        icon: '⚡',
        title: '3. Keep Combo Streaks Alive',
        desc: 'Clear at least one line on consecutive moves to build high-voltage Combo Streaks (2x, 3x, 4x+) for exponential score leaps!',
      },
    ],
    controls: {
      desktop: [
        'Click & Place: Click any piece in tray, then click target grid cell',
        'Mouse Drag: Drag any piece directly onto the board',
        'Spacebar / R: Quick restart game',
        'M Key: Toggle banjo sound effects',
      ],
      mobile: [
        'Tap to Select & Tap to Place: Tap a piece below, then tap cell on board',
        'Touch Drag: Drag piece directly onto grid with live translucent ghost preview',
        'Reset: Tap Restart button on game over or in header',
      ],
    },
    proTip: 'Always leave open 3x3 square or 5-long line spaces in the center so giant pieces won\'t trap you into an early Game Over!',
  },
  'sheep-cart-jam': {
    title: 'Sheep Cart Jam: Meadow Escape',
    subtitle: 'Bus Jam & Car Jam Farm Puzzle',
    mascot: '🐑🚜',
    themeColor: 'from-pink-500 via-sky-600 to-emerald-700',
    goal: 'Unblock tractor carts from the maze, dock matching colors, and board waiting sheep to escape to the meadow!',
    steps: [
      {
        icon: '🚜',
        title: '1. Tap Unblocked Carts',
        desc: 'Find carts with a clear directional path along their orientation to exit the farmyard maze into the dock.',
      },
      {
        icon: '🐑',
        title: '2. Board Matching Sheep',
        desc: 'Fluffy sheep at the front of the queue automatically hop into any docked cart that shares their wool color.',
      },
      {
        icon: '🚀',
        title: '3. Full Carts Depart (3/3)',
        desc: 'When a cart holds 3 sheep, it zooms off to the meadow, opening its dock bay for the next cart.',
      },
    ],
    controls: {
      desktop: [
        'Click Cart: Drive cart to loading bay',
        'R Key: Quick restart level',
        'M Key: Toggle sound effects',
      ],
      mobile: [
        'Tap Cart: Drive cart to dock bay',
        'Level Buttons: Switch between challenge levels L1-L3',
        'Restart: Tap restart icon to try again',
      ],
    },
    proTip: 'Watch the front of the sheep queue closely! Don\'t send carts to the dock if their color is trapped deep at the back of the queue, or your 3 bays will jam!',
  },
  'grain-sand-fall': {
    title: 'Grain Sand Fall: Farm Physics',
    subtitle: 'Sand Blocks & Sand Tetris Silo',
    mascot: '⏳🌾',
    themeColor: 'from-amber-500 via-yellow-600 to-stone-900',
    goal: 'Steer falling crop blocks that dissolve into flowing sand dunes and connect colors wall-to-wall!',
    steps: [
      {
        icon: '🧱',
        title: '1. Steer & Rotate Blocks',
        desc: 'Move falling tetromino shapes left, right, or rotate them to position over the best landing spot.',
      },
      {
        icon: '⏳',
        title: '2. Watch Sand Melt & Slide',
        desc: 'The instant a shape hits bottom, it dissolves into thousands of sand grains that slide down slopes naturally.',
      },
      {
        icon: '⚡',
        title: '3. Connect Wall-to-Wall',
        desc: 'Create an unbroken path of the same grain color from the left wall to the right wall to dissolve it for big points!',
      },
    ],
    controls: {
      desktop: [
        'Arrow Keys / A-D: Move left and right',
        'Arrow Up / W: Rotate block',
        'Arrow Down / S: Soft drop downward',
        'Spacebar: Instant hard drop',
        'R Key: Quick restart',
        'M Key: Toggle sound effects',
      ],
      mobile: [
        'Left / Right Arrows: Steer block across silo',
        'Rotate Button: Turn falling shape',
        'Down Arrow: Instant hard drop to sand floor',
      ],
    },
    proTip: 'Stack the same crop colors on one side so when they slide down slopes, they automatically bridge across to the other wall and clear entire dunes!',
  },
  'farm-mini-mart': {
    title: 'Farm Mini Mart: Animal Market',
    subtitle: 'Idle Countryside Tycoon',
    mascot: '🏪',
    themeColor: 'from-emerald-500 via-teal-600 to-amber-600',
    goal: 'Harvest sweet crops, stock market shelves, and cash out adorable animal customers to expand your farm mart!',
    steps: [
      {
        icon: '🍅',
        title: '1. Harvest Fresh Crops',
        desc: 'Walk near tomatoes, corn, eggs, and milk plots; fresh items automatically stack up in your hands.',
      },
      {
        icon: '📦',
        title: '2. Restock Store Shelves',
        desc: 'Walk up to empty shelves to instantly unload produce and display it for hungry customers.',
      },
      {
        icon: '💰',
        title: '3. Cash Out & Expand',
        desc: 'Stand at the Cash Register to checkout animals, collect shiny gold coins, and unlock new stations!',
      },
    ],
    controls: {
      desktop: ['WASD or Arrow Keys: Walk & steer around the mart', 'U Key: Open Shop Upgrades menu', 'M Key: Toggle sound mute'],
      mobile: ['Touch anywhere and drag to steer with 360° virtual joystick', 'Tap UPGRADES button to boost speed & capacity'],
    },
    proTip: 'Hire Barnaby the helper dog and the Cashier worker early to automate harvesting and checkout for 3x passive earnings!',
  },
  'duck-runner': {
    title: 'Duck Runner: Vampire Quack',
    subtitle: 'Halloween Endless Runner',
    mascot: '🦆',
    themeColor: 'from-orange-500 via-amber-600 to-purple-800',
    goal: 'Leap over carved Jack-o\'-Lanterns and slide under midnight vampire bats to set a new high score!',
    steps: [
      {
        icon: '🎃',
        title: '1. Jump Over Hurdles',
        desc: 'Leap over glowing carved pumpkins and wooden fence posts to keep Quacky running forward.',
      },
      {
        icon: '🦇',
        title: '2. Duck Under Flying Bats',
        desc: 'When vampire bats swoop overhead, crouch low (DUCK) and slide flat under them.',
      },
      {
        icon: '⚡',
        title: '3. Day-to-Night Progression',
        desc: 'Every 600 points, the sky shifts into starry moonlit twilight and the running pace quickens!',
      },
    ],
    controls: {
      desktop: ['Space / Up Arrow / W: Jump', 'Down Arrow / S: Duck / Fast fall mid-air', 'R Key: Quick restart'],
      mobile: ['Right Thumb (JUMP ⬆️): Jump over hurdles', 'Left Thumb (DUCK ⬇️): Hold to slide flat under bats'],
    },
    proTip: 'Press DUCK while mid-air to trigger a quick slam fall back to the ground—essential for dodging back-to-back obstacles!',
  },
  'pet-candy-crush': {
    title: 'Farm Animal Match: Barnyard Blast',
    subtitle: 'Match-3 Puzzle & Explosive Bombs',
    mascot: '🍬',
    themeColor: 'from-pink-500 via-rose-600 to-purple-700',
    goal: 'Match cute farm animals, craft explosive boosters, and collect level targets before your moves run out!',
    steps: [
      {
        icon: '🐮',
        title: '1. Match 3 Animals in a Row',
        desc: 'Swap adjacent friendly animals to make horizontal or vertical matches of 3 or more.',
      },
      {
        icon: '🧨',
        title: '2. Craft 2x2 Square Dynamite',
        desc: 'Match 4 animals in a 2×2 square to forge a high-power Dynamite Bomb that blasts a 3×3 zone!',
      },
      {
        icon: '💥',
        title: '3. Combine Boosters for Mega Blasts',
        desc: 'Swap two adjacent bombs together to trigger a giant 5×5 crater explosion that clears the board.',
      },
    ],
    controls: {
      desktop: ['Mouse Click & Drag: Swap adjacent animals', 'Double Click: Detonate any bomb instantly in-place'],
      mobile: ['Touch & Swipe: Drag finger between adjacent tiles', 'Double Tap: Detonate bomb immediately'],
    },
    proTip: 'Double-tap any bomb on the board to detonate it immediately without needing to swap it with another tile!',
  },
  'flappy-chicken': {
    title: 'Flappy Chicken: Golden Wheat',
    subtitle: 'Charming Farm Flight Arcade',
    mascot: '🐔',
    themeColor: 'from-yellow-500 via-amber-600 to-orange-600',
    goal: 'Guide Clucky the chubby chicken through 15 wooden fence gates to feast on the legendary Golden Wheat!',
    steps: [
      {
        icon: '🪽',
        title: '1. Flap to Gain Altitude',
        desc: 'Tap the screen or press Spacebar to flap Clucky\'s wings and rise gracefully into the air.',
      },
      {
        icon: '🚪',
        title: '2. Squeeze Through Rustic Gates',
        desc: 'Time your flaps carefully to glide through the openings between tall wooden fence pillars.',
      },
      {
        icon: '🌾',
        title: '3. Reach the Golden Wheat',
        desc: 'Collect floating golden grains; when the distance gauge reaches 100%, enjoy the harvest celebration!',
      },
    ],
    controls: {
      desktop: ['Spacebar / W / Left Click: Flap wings & cluck', 'P Key: Pause flight', 'R Key: Quick restart'],
      mobile: ['Tap anywhere on screen to flap', 'Big bottom "TAP TO FLAP" button for comfortable one-thumb play'],
    },
    proTip: 'Gentle, rhythmic taps keep Clucky at a steady hover, making tight gate transitions much easier!',
  },
  'animal-2048': {
    title: 'Animal 2048: Spooky Evolution',
    subtitle: 'Creature Merge & Logic Puzzle',
    mascot: '🐘',
    themeColor: 'from-indigo-500 via-purple-600 to-violet-800',
    goal: 'Slide the 4x4 grid to merge matching animals and evolve from a tiny Mouse all the way to the 2048 Elephant!',
    steps: [
      {
        icon: '➡️',
        title: '1. Slide All 4 Directions',
        desc: 'Swipe up, down, left, or right to slide all animal tiles across the board simultaneously.',
      },
      {
        icon: '🐭',
        title: '2. Collide Matching Animals',
        desc: 'When two identical creatures touch, they merge into the next evolution tier (Mouse ➔ Hamster ➔ Bunny...).',
      },
      {
        icon: '👑',
        title: '3. Reach the Crowned Elephant',
        desc: 'Climb through 11 animal evolution tiers without getting gridlocked to crown the majestic 2048 Elephant!',
      },
    ],
    controls: {
      desktop: ['Arrow Keys or W/A/S/D: Slide in 4 directions', 'Ctrl + Z / Undo Button: Revert last move'],
      mobile: ['Touch Swipe across grid in 4 directions', 'Virtual 4-way D-Pad arrow buttons below board'],
    },
    proTip: 'Lock your highest-tier animal into a single corner (like bottom-right) and build your merge chain toward it!',
  },
  'farm-tetris': {
    title: 'Farm Tetris: Haunted Harvest',
    subtitle: 'Falling Blocks & Silo Fill',
    mascot: '🧱',
    themeColor: 'from-orange-600 via-red-600 to-amber-700',
    goal: 'Rotate and drop falling crop crates, clear full horizontal lines, and fill the rustic golden silo!',
    steps: [
      {
        icon: '🔄',
        title: '1. Steer & Rotate Blocks',
        desc: 'Move falling harvest pieces left and right, and rotate them 90° clockwise to fit into gaps.',
      },
      {
        icon: '⚡',
        title: '2. Clear Full Lines',
        desc: 'Complete horizontal rows to pop them with golden straw particles and feed hay into the silo.',
      },
      {
        icon: '🌾',
        title: '3. Score 4-Line Tetris',
        desc: 'Clear 4 rows simultaneously for 800+ points and a joyful cheering reaction from the farmer!',
      },
    ],
    controls: {
      desktop: ['A / D: Move left & right', 'W / Up Arrow: Rotate 90°', 'Spacebar: Hard drop / slam', 'C / Shift: Hold piece'],
      mobile: ['Touch Left/Right/Down arrows', 'ROTATE button', 'SLAM hard drop button', 'HOLD queue button'],
    },
    proTip: 'Save the straight I-bar piece in your HOLD queue (C key) until you can drop it for an instant 4-line Tetris!',
  },
  'dog-parking': {
    title: 'Dog Parking: Yard Escape',
    subtitle: 'Traffic Jam & Dog Unblock Puzzle',
    mascot: '🐕‍🦺',
    themeColor: 'from-amber-500 via-orange-600 to-yellow-600',
    goal: 'Untangle the crowded puppy yard and guide Sunny the Star Corgi straight through the open exit gate!',
    steps: [
      {
        icon: '🐕',
        title: '1. Follow Natural Lanes',
        desc: 'Horizontal dogs only slide left/right, and vertical dogs only slide up/down along their lanes.',
      },
      {
        icon: '↔️',
        title: '2. Clear the Exit Runway',
        desc: 'Slide Pugs, Shibas, and Dachshunds back and forth to open a direct pathway to the exit gate.',
      },
      {
        icon: '🏁',
        title: '3. Sunny Reaches the Exit',
        desc: 'Once the lane is open, slide Sunny the hero Corgi through the wooden gate to earn 3 stars!',
      },
    ],
    controls: {
      desktop: ['Click and drag any dog along its natural lane', 'Z Key: Undo previous move', 'R Key: Restart level'],
      mobile: ['Touch and drag dogs with your finger', 'Undo and Restart buttons at the top of the board'],
    },
    proTip: 'Work backwards from the exit gate: see which dog directly blocks the gate, then find out who blocks that dog!',
  },
  'cat-parking': {
    title: 'Cat Parking: Witch Cat Mystery',
    subtitle: 'Cozy Sleeping Kitties Slide Puzzle',
    mascot: '🐈‍⬛',
    themeColor: 'from-purple-600 via-indigo-700 to-slate-800',
    goal: 'Slide sleepy kittens across cozy rugs and lead Luna the Witch Cat safely through the illuminated doorway!',
    steps: [
      {
        icon: '🐾',
        title: '1. Slide Across Cozy Rugs',
        desc: 'Click and drag sleeping Persian, Calico, and Tabby cats along their carpet lanes forward and back.',
      },
      {
        icon: '🛋️',
        title: '2. Maneuver Long Kitties',
        desc: '3-tile long cats need more room to turn; slide them into corner spaces to free up room.',
      },
      {
        icon: '🌙',
        title: '3. Guide Luna to the Door',
        desc: 'When the pathway to the moonlit door is open, slide Luna through the exit to complete the room!',
      },
    ],
    controls: {
      desktop: ['Mouse click and drag forward/back', 'Z Key: Undo move', 'R Key: Restart level'],
      mobile: ['Touch swipe cats along their natural orientation', 'Undo and Restart on-screen buttons'],
    },
    proTip: 'Never hesitate to use the Undo button—there is zero score penalty for taking a move back!',
  },
  'animal-farm-parking': {
    title: 'Animal Farm Parking: Barn Drive',
    subtitle: 'Precision Tractor Driving & Parking',
    mascot: '🐮',
    themeColor: 'from-teal-600 via-emerald-700 to-green-800',
    goal: 'Steer Bessie the Cow in her green tractor into yellow checkered parking bays without crashing into obstacles!',
    steps: [
      {
        icon: '🚜',
        title: '1. Steer & Drive Smoothly',
        desc: 'Use forward, reverse, and steering controls to navigate around fences, tractors, and hay bales.',
      },
      {
        icon: '🛑',
        title: '2. Brake Before Obstacles',
        desc: 'Press the handbrake early before tight turns; collisions drain your tractor\'s health gauge!',
      },
      {
        icon: '🅿️',
        title: '3. Park with High Precision',
        desc: 'Align your tractor neatly inside the yellow checkered stall to score >= 80% accuracy for 3 stars!',
      },
    ],
    controls: {
      desktop: ['WASD or Arrow Keys: Drive & steer', 'Spacebar: Handbrake / emergency stop', 'R Key: Quick restart'],
      mobile: ['4-Way Touch D-Pad arrows (Up, Down, Left, Right)', 'Center red STOP handbrake button'],
    },
    proTip: 'Take turns wide and brake early! Maintaining 100% health and parking accuracy earns the highest star ranking.',
  },
  'chef-rat-rush': {
    title: 'Chef Rat Rush: Ratatouille Bistro',
    subtitle: 'Bistro Cooking & Culinary Rush',
    mascot: '🐭',
    themeColor: 'from-amber-600 via-rose-600 to-slate-900',
    goal: 'Chop fresh ingredients, simmer gourmet dishes on the stove, and ring the brass Service Bell before customer patience expires!',
    steps: [
      {
        icon: '🪵',
        title: '1. Chop Pantry Ingredients',
        desc: 'Tap pantry produce (keys 1-8) to chop ingredients onto your wooden prep cutting board.',
      },
      {
        icon: '🍳',
        title: '2. Simmer on Copper Stove',
        desc: 'Dishes like Gourmet Ratatouille and Berry Crepes must cook on the stove—ring the bell before they burn!',
      },
      {
        icon: '🛎️',
        title: '3. Ring Service Bell',
        desc: 'Hit the big brass Service Bell (Spacebar) to deliver orders, earn big speed tips, and build combos!',
      },
    ],
    controls: {
      desktop: [
        '1 - 8 Number Keys: Add ingredients to board',
        'Spacebar: Ring Service Bell to serve dish',
        'C Key: Cook / simmer on stove',
        'X Key: Clear cutting board',
      ],
      mobile: [
        'Tap 1-8 Ingredient buttons to prepare dish',
        'Tap "Simmer on Stove" when recipe is ready to cook',
        'Tap "SERVE DISH" brass bell to deliver orders',
      ],
    },
    proTip: 'Cold dishes like Cheese Baguettes and Bistro Salads don\'t need cooking—serve them instantly to keep your combo alive while hot stews simmer on the stove!',
  },
};

interface GameIntroModalProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GameIntroModal: React.FC<GameIntroModalProps> = ({ gameId, isOpen, onClose }) => {
  const intro = GAME_INTROS[gameId] || GAME_INTROS['dog-parking']!;
  const [activeTab, setActiveTab] = useState<'guide' | 'controls'>('guide');
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`pawcade_intro_seen_${gameId}`) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') handleStartGame();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleStartGame = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem(`pawcade_intro_seen_${gameId}`, 'true');
      } else {
        localStorage.removeItem(`pawcade_intro_seen_${gameId}`);
      }
    } catch {
      // Ignore local storage write errors
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-amber-400/50 rounded-3xl shadow-2xl shadow-black/80 flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* TOP GLOWING BANNER HEADER */}
        <div className={`p-4 sm:p-5 bg-gradient-to-r ${intro.themeColor} text-white flex items-center justify-between relative`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black/30 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shadow-inner select-none shrink-0">
              {intro.mascot}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 text-amber-300 border border-amber-300/40">
                  How to Play • Game Guide
                </span>
              </div>
              <h2 id="intro-modal-title" className="text-lg sm:text-2xl font-black tracking-tight leading-tight mt-0.5">
                {intro.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION SUB-TABS */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gameplay Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={`pb-2 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'controls'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Controls & Tips</span>
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-200">
          {/* WIN GOAL BANNER */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-start gap-3">
            <span className="text-2xl select-none shrink-0">🎯</span>
            <div>
              <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider block">
                Level Objective
              </span>
              <p className="text-xs sm:text-sm font-bold text-white mt-0.5 leading-snug">
                {intro.goal}
              </p>
            </div>
          </div>

          {activeTab === 'guide' ? (
            /* 3-STEP VISUAL HOW TO PLAY */
            <div className="space-y-3">
              {intro.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3.5 hover:border-amber-400/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0 select-none shadow">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-amber-300">
                      {step.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* CONTROLS & PRO TIPS */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Desktop Controls */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                    <Monitor className="w-4 h-4" />
                    <span>Desktop (Keyboard & Mouse)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {intro.controls.desktop.map((ctrl, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{ctrl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mobile Controls */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile (Touch Screen)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {intro.controls.mobile.map((ctrl, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{ctrl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pro Tip Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 flex items-start gap-3">
                <span className="text-xl select-none shrink-0">💡</span>
                <div>
                  <span className="text-[11px] font-black uppercase text-purple-300 tracking-wider block">
                    Pro Gamer Tip
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium mt-0.5 leading-relaxed">
                    {intro.proTip}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/95 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-amber-400 focus:ring-amber-400 bg-slate-800"
            />
            <span>Don't show again on start</span>
          </label>

          <button
            onClick={handleStartGame}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transform hover:scale-103 active:scale-98 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>LET'S PLAY!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
