import React, { useState, useEffect } from 'react';
import { X, Play, Sparkles, HelpCircle, Smartphone, Monitor } from 'lucide-react';
import { analytics } from '../lib/analytics';

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
  'duck-training-champion': {
    title: 'Duck Life: Barnyard Champion',
    subtitle: 'Athletic Duckling Training & Olympic Racing',
    mascot: '🦆🏅',
    themeColor: 'from-amber-500 via-sky-500 to-emerald-600',
    goal: 'Train your farm duckling in running, flying, and swimming to become the Olympic champion!',
    steps: [
      {
        icon: '🏃',
        title: '1. Train Running Hurdles',
        desc: 'Jump over rocks and fences to increase sprint speed and build athletic stamina.',
      },
      {
        icon: '🪽',
        title: '2. Train Flying and Swimming',
        desc: 'Flap wings to soar between winds and dive underwater to dodge floating logs.',
      },
      {
        icon: '🏆',
        title: '3. Win Olympic Races',
        desc: 'Enter championship races against farm rivals to take first place, win gold medals, and earn coins.',
      },
    ],
    controls: {
      desktop: [
        'Spacebar or Up Arrow: Jump hurdles, flap wings, and dive underwater',
        'Spacebar during Races: Trigger energy speed burst',
        'Top Buttons: Open Boutique to buy hats and energy seeds',
        'M Key: Toggle quack vocalizations and athletic sounds',
      ],
      mobile: [
        'Large Action Button: Tap to jump, flap, dive, or boost',
        'Training Cards: Tap Running, Flying, or Swimming to start session',
        'Boutique: Spend race coins on cool athletic headbands and caps',
      ],
    },
    proTip: 'Collect floating corn seeds during every training session. Each seed gives extra bonus XP to level up your duckling faster!',
  },
  'barnyard-connect-four': {
    title: 'Barnyard Four in a Row',
    subtitle: 'Classic Vertical Disc Drop Strategy Game',
    mascot: '🟡🔴',
    themeColor: 'from-blue-600 via-indigo-600 to-amber-500',
    goal: 'Connect four of your farm tokens in a horizontal, vertical, or diagonal line before your opponent does!',
    steps: [
      {
        icon: '👇',
        title: '1. Drop Tokens into Columns',
        desc: 'Tap any of the 7 column arrows to slide a token down to the lowest open slot on the board.',
      },
      {
        icon: '🛡️',
        title: '2. Block Opponent Three-in-a-Row',
        desc: 'Keep an eye on enemy lines. If your opponent gets three discs lined up, drop your disc to block them.',
      },
      {
        icon: '🏆',
        title: '3. Connect Four to Win',
        desc: 'Create open-ended lines with multiple winning paths to force a four-in-a-row victory!',
      },
    ],
    controls: {
      desktop: [
        'Mouse Click or 1-7 Number Keys: Select column to drop token',
        'Top Tabs: Switch between solo AI matches and local 2-player pass and play',
        'R Key: Reset and start a fresh match',
        'M Key: Toggle wooden clack sound effects',
      ],
      mobile: [
        'Tap Column Arrow: Drop your disc into any open vertical slot',
        'Pass & Play: Hand phone or tablet to friend for local 2-player fun',
        'Difficulty Pills: Select Easy Calf, Medium Fox, or Master Owl',
      ],
    },
    proTip: 'Control the middle column first! The center column connects to the highest number of winning horizontal, vertical, and diagonal lines.',
  },
  'barnyard-egg-cart': {
    title: 'Barnyard Egg Cart: Pasture Hill',
    subtitle: 'Fragile Egg Balance Physics Hill Racer',
    mascot: '🥚🚜',
    themeColor: 'from-amber-500 via-emerald-500 to-sky-600',
    goal: 'Drive your farm cart across bumpy pasture hills without cracking or losing the fragile egg!',
    steps: [
      {
        icon: '⚡',
        title: '1. Feather the Gas Pedal',
        desc: 'Hold Gas to climb steep grassy hills. Ease off the throttle before ridge crests so the egg stays in the basket.',
      },
      {
        icon: '🛑',
        title: '2. Tap the Brakes on Slopes',
        desc: 'Tap Brake on downhill slopes to level the truck and prevent the egg from rolling over the front rim.',
      },
      {
        icon: '🛡️',
        title: '3. Collect Coins and Shields',
        desc: 'Grab Blue Shields to survive hard ground impacts, Yellow Magnets to collect coins, and visit the Garage for upgrades.',
      },
    ],
    controls: {
      desktop: [
        'D, Right Arrow, or Space: Gas and tilt cart backward',
        'A, Left Arrow, or S: Brake and tilt cart forward',
        'R Key: Quick restart run',
        'M Key: Toggle motor rumble sound effects',
      ],
      mobile: [
        'Right Pedal (GAS): Hold to accelerate and climb pasture hills',
        'Left Pedal (BRAKE): Hold to slow down and tilt down on slopes',
        'GARAGE Button: Open truck upgrades with collected gold coins',
      ],
    },
    proTip: 'Upgrade the Hay Cushion and Deep Basket first in the Garage. They absorb bumpy shocks and prevent the egg from bouncing out!',
  },
  'farm-animal-clicker': {
    title: 'Farm Animal Idle Clicker',
    subtitle: 'Cozy Idle Pet & Farm Clicker Game',
    mascot: '🐾🌾',
    themeColor: 'from-amber-500 via-orange-500 to-emerald-600',
    goal: 'Tap your farm animals to harvest coins, build automated barns, catch golden butterflies, and dress pets in cute hats!',
    steps: [
      {
        icon: '👆',
        title: '1. Tap Your Pet Animal',
        desc: 'Click or tap your pet to earn coins. Tap faster to build up big coin stacks quickly.',
      },
      {
        icon: '🚜',
        title: '2. Buy Farm Buildings',
        desc: 'Unlock Auto Cluckers, Piggy Banks, Milk Silos, and Windmills to earn coins every second on auto-pilot.',
      },
      {
        icon: '🦋',
        title: '3. Catch Golden Butterflies',
        desc: 'Tap the rare golden butterfly when it flutters across the screen for an instant 7x coin frenzy!',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Tap animal to earn coins and purchase upgrades',
        'Top Tabs: Switch between Buildings, Upgrades, and Hats',
        'Spacebar: Tap active pet with your keyboard',
        'M Key: Toggle clicker sounds and animal voices',
      ],
      mobile: [
        'Tap Screen: Tap pet to produce coins and pop floating rewards',
        'Tabs: Tap Buildings, Upgrades, or Hats at the bottom of the screen',
        'Animal Switcher: Tap pet icons at the top to change active animals',
      ],
    },
    proTip: 'Upgrade your Click Power first to boost manual income, then invest heavily in automated Windmills to rake in big idle earnings while you sleep!',
  },
  'wood-nuts-farm': {
    title: 'Wood Nuts & Bolts: Barnyard Jam',
    subtitle: 'Tactile Wood Screw Physics Puzzle',
    mascot: '🔩🚜',
    themeColor: 'from-amber-600 via-orange-600 to-yellow-600',
    goal: 'Unscrew metallic bolts and move them to open holes to let all wooden planks fall off the board!',
    steps: [
      {
        icon: '🔩',
        title: '1. Select a Fastened Bolt',
        desc: 'Tap any bolt holding a wooden plank. A glowing yellow ring shows the bolt is selected.',
      },
      {
        icon: '🕳️',
        title: '2. Move into Empty Holes',
        desc: 'Tap an open peg hole to screw the bolt in. Planks with no bolts fall with gravity!',
      },
      {
        icon: '🏆',
        title: '3. Drop Every Wooden Plank',
        desc: 'Clear every wooden rail and beam off the workshop board to clear the level with high score!',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Tap screws to loosen and empty holes to fasten',
        'R Key: Restart current level if you run out of moves',
        'M Key: Toggle ratchet and wood clatter sound effects',
      ],
      mobile: [
        'Tap Screw: Loosen and pick up a bolt with your finger',
        'Tap Empty Hole: Fasten the bolt into any open slot',
        'Restart Button: Reset the board to try a new sequence',
      ],
    },
    proTip: 'Look for planks pinned by only a single bolt. Freeing those first opens up empty holes for longer multi-bolt planks!',
  },
  'capybara-spa-rush': {
    title: 'Capybara Spa: Hot Springs',
    subtitle: 'Cozy Japanese Onsen Simulator',
    mascot: '🍊🛁',
    themeColor: 'from-amber-500 via-orange-600 to-emerald-600',
    goal: 'Serve visiting capybaras and animal friends with yuzu citrus, sponges, and warm tea until they reach full bliss!',
    steps: [
      {
        icon: '🦫',
        title: '1. Seat Waiting Animals',
        desc: 'Tap a waiting animal on the bench, then tap an open wooden tub to seat them in warm water.',
      },
      {
        icon: '🍊',
        title: '2. Fulfill Special Requests',
        desc: 'Watch thought bubbles! Add yellow yuzu citrus, scrub with bamboo sponges, or pour hot herbal tea.',
      },
      {
        icon: '💰',
        title: '3. Collect Coins & Expand',
        desc: 'When an animal reaches 100% bliss, tap the golden coin button. Reinvest profits to unlock tubs 3 and 4!',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Tap waiting animals, open tubs, and service buttons',
        'U Key: Open Onsen Spa Upgrades menu',
        'M Key: Toggle soothing hot spring sound effects',
      ],
      mobile: [
        'Tap Animal: Select guest from arrival bench',
        'Tap Open Tub: Seat guest into warm cedar bath',
        'Tap Service Buttons: Add yuzu, scrub sponges, or serve tea',
        'Tap COLLECT COINS: Cash in on full bliss rewards',
      ],
    },
    proTip: 'Add floating yuzu citrus early to tubs. Each yuzu boosts bliss accumulation and increases your final coin payout!',
  },
  'save-the-sheep': {
    title: 'Save the Sheep: Hive Defense',
    subtitle: 'Draw & Protect Physics Puzzle',
    mascot: '🐝🐑',
    themeColor: 'from-amber-500 via-emerald-600 to-sky-600',
    goal: 'Draw protective barrier fences with ink to shield Barnaby the sheep from buzzing bee swarms for 5 seconds!',
    steps: [
      {
        icon: '✏️',
        title: '1. Draw Protective Barriers',
        desc: 'Drag your finger or mouse to draw continuous wooden fence lines surrounding Barnaby.',
      },
      {
        icon: '🐝',
        title: '2. Deflect the Bee Swarm',
        desc: 'Release your finger to lock the fence and release bees that bounce off with elastic physics.',
      },
      {
        icon: '⭐',
        title: '3. Conserve Ink for 3 Stars',
        desc: 'Survive the 5-second countdown. Use minimal ink to earn a 3-star rating and unlock the next stage!',
      },
    ],
    controls: {
      desktop: [
        'Click & Drag: Draw protective wooden fences around Barnaby',
        'Release Click: Lock fence and begin 5-second swarm test',
        'R Key: Clear ink and restart current level',
        'M Key: Toggle sound effects',
      ],
      mobile: [
        'Touch & Drag: Draw wooden fence lines with your finger',
        'Lift Finger: Lock fence and release the bee swarm',
        'Reset Button: Tap to erase lines and redraw with full ink',
      ],
    },
    proTip: 'Draw closed loop shapes (like a dome or box) around Barnaby so bees cannot slip through gaps from above or below!',
  },
  'animal-suika-drop': {
    title: 'Animal Drop: Watermelon Merge',
    subtitle: 'Juicy Physics Evolution Puzzle',
    mascot: '🍉🐾',
    themeColor: 'from-emerald-500 via-green-600 to-amber-600',
    goal: 'Drop and merge cute farm animals to grow the giant Watermelon Elephant without overflowing the danger line!',
    steps: [
      {
        icon: '🎯',
        title: '1. Aim & Drop Animals',
        desc: 'Drag left and right across the top bar to choose where your cute animal drops into the wooden basket.',
      },
      {
        icon: '✨',
        title: '2. Merge Matching Pairs',
        desc: 'When two identical animals bump into each other, they merge into the next bigger tier with bonus score.',
      },
      {
        icon: '🍉',
        title: '3. Watch the Danger Line',
        desc: 'Keep animal stacks below the red danger line. Merge chains rapidly to create the giant Watermelon Elephant!',
      },
    ],
    controls: {
      desktop: [
        'Mouse Move / Drag: Aim active animal along the top bar',
        'Click / Release: Drop animal into the basket',
        'R Key: Quick restart game',
        'M Key: Toggle sound effects',
      ],
      mobile: [
        'Touch & Drag: Slide finger left and right to aim',
        'Release Finger: Drop animal into the box',
        'Restart Button: Reset game for a new run',
      ],
    },
    proTip: 'Drop small animals (chicks and ducklings) along the sides so they roll down toward their matching twins instead of blocking big animals in the center!',
  },
  'farm-tile-triple': {
    title: 'Barnyard Tile Match: Triple Pick',
    subtitle: 'Cozy Triple Tile Match Puzzle',
    mascot: '🧺🍎',
    themeColor: 'from-amber-500 via-orange-600 to-emerald-600',
    goal: 'Pick matching crop tiles into your 7-slot tray and clear the entire board in triplets!',
    steps: [
      {
        icon: '👆',
        title: '1. Pick Unblocked Tiles',
        desc: 'Tap any unblocked tile with a clear border to send it into your 7-slot bottom tray.',
      },
      {
        icon: '✨',
        title: '2. Match Three to Clear',
        desc: 'When you collect three matching crops in your tray, they clear with golden starbursts and +300 points.',
      },
      {
        icon: '⚠️',
        title: '3. Prevent Tray Jam',
        desc: 'Do not let your tray fill with 7 mismatched tiles! Use Undo or Shuffle if you get stuck.',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Pick an unblocked tile into the tray',
        'U Key: Undo previous tile pick',
        'S Key: Shuffle unpicked board tiles',
        'R Key: Quick restart stage',
        'M Key: Toggle sound effects',
      ],
      mobile: [
        'Tap Tile: Send top unblocked tile to your tray',
        'Undo Button: Take back a misstep easily',
        'Shuffle Button: Reorder remaining board tiles',
        'Restart Button: Reset current stage',
      ],
    },
    proTip: 'Focus on clearing tiles that uncover multiple covered tiles below them. Never pick random single tiles unless you have a path to their matching triplet!',
  },
  'farm-pipe-flow': {
    title: 'Farm Pipe Flow: Barnyard Plumber',
    subtitle: 'Rotate Pipes & Water Thirsty Crops',
    mascot: '🚜💧',
    themeColor: 'from-sky-500 via-blue-600 to-emerald-600',
    goal: 'Rotate water pipes to direct water from the pump tank to every thirsty crop and animal trough!',
    steps: [
      {
        icon: '🚰',
        title: '1. Trace from Pump Source',
        desc: 'Look at the red water pump outlet direction to see where your pipeline must begin.',
      },
      {
        icon: '↻',
        title: '2. Tap to Rotate Pipes',
        desc: 'Tap any loose pipe segment to rotate it 90 degrees clockwise until the ports click together.',
      },
      {
        icon: '🌊',
        title: '3. Watch Water Flow',
        desc: 'Connected pipes light up with glowing blue water. Connect all target plots to complete the stage!',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Rotate pipe section 90 degrees',
        'U Key: Undo previous turn',
        'R Key: Restart current irrigation stage',
        'M Key: Toggle audio effects',
      ],
      mobile: [
        'Tap Pipe: Turn pipe section with your finger',
        'Undo Button: Rewind previous turn',
        'Restart Button: Reset stage to try again',
      ],
    },
    proTip: 'Work backwards from the thirsty crop targets as well as forward from the water pump to see where the pipe path must meet in the middle!',
  },
  'koi-pond-zen': {
    title: 'Koi Pond: Zen Water Garden',
    subtitle: 'Serene Water Garden & Fish Feeding',
    mascot: '🎏🌸',
    themeColor: 'from-teal-600 via-emerald-600 to-cyan-800',
    goal: 'Feed graceful Japanese koi fish, bloom pink lotus flowers, and create gentle water ripples in your serene pond sanctuary!',
    steps: [
      {
        icon: '🟤',
        title: '1. Drop Food Pellets',
        desc: 'Tap or click the pond surface to drop food pellets. Nearby koi smell the food and swim over to nibble.',
      },
      {
        icon: '🪷',
        title: '2. Bloom Lotus Lilies',
        desc: 'Feeding fish nourishes the pond water, opening closed flower buds into gorgeous blooming pink lotus flowers.',
      },
      {
        icon: '🔔',
        title: '3. Ring the Singing Bowl',
        desc: 'Tap Chime to ring the Tibetan singing bowl, summoning all koi fish to the pond center with a golden wave!',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Drop food pellet and create water ripple',
        'Spacebar / B Key: Ring singing bowl',
        'S Key: Trigger falling sakura petal shower',
        'M Key: Toggle soothing water audio',
        'R Key: Restart zen sanctuary',
      ],
      mobile: [
        'Tap Water: Drop food pellets and create ripples',
        'Food / Gold Toggle: Switch between standard and golden food',
        'Chime Button: Ring singing bowl to call all fish',
        'Sakura Button: Trigger sakura shower for 2x points',
      ],
    },
    proTip: 'Group multiple food pellets in the center before ringing the singing bowl. All five koi will rush together and create a huge burst of zen points!',
  },
  'barnyard-pin-pull': {
    title: 'Barnyard Pin Pull: Rescue & Loot',
    subtitle: 'Pull Pins to Quench Lava & Feed Pets',
    mascot: '🚜📌',
    themeColor: 'from-amber-600 via-orange-600 to-red-800',
    goal: 'Pull golden pins in the correct order to extinguish burning lava with water, defeat sneaky foxes, and rescue Barnaby!',
    steps: [
      {
        icon: '📌',
        title: '1. Inspect Pin Sequence',
        desc: 'Study the chamber layout carefully. See which pins hold water, lava, carrots, or enemies before pulling.',
      },
      {
        icon: '💧',
        title: '2. Quench Dangerous Lava',
        desc: 'Drop water onto lava to solidify it into harmless cool stone. Never drop raw lava on Barnaby!',
      },
      {
        icon: '🥕',
        title: '3. Fill the Puppy Bowl',
        desc: 'Once the path is safe and clear of traps, pull the bottom gate pin to slide golden carrots into the bowl.',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Click pin pull ring to slide out',
        'R Key: Quick restart level',
        'M Key: Toggle sound effects',
      ],
      mobile: [
        'Tap Pin Ring: Pull pin smoothly with your thumb',
        'Restart Button: Reset level anytime',
      ],
    },
    proTip: 'Always neutralize hazards first! Drop water onto lava or drop lava onto the fox before unlocking the food chamber, or your treats will get stolen or burned!',
  },
  'hamster-cookie-stack': {
    title: 'Hamster Cookie Stack: Sweet Bakery',
    subtitle: 'Wobbly Dessert Stacking & Balancing Arcade',
    mascot: '🐹🍪',
    themeColor: 'from-amber-500 via-rose-500 to-amber-700',
    goal: 'Help Mochi the baker hamster catch falling cookies, macarons, and donuts to build a giant wobbly dessert tower!',
    steps: [
      {
        icon: '🍽️',
        title: '1. Position Pastry Plate',
        desc: 'Slide left and right to place your golden plate beneath sweet treats dropping from overhead conveyor belts.',
      },
      {
        icon: '⚖️',
        title: '2. Balance Center-of-Mass',
        desc: 'Catch treats near the center to minimize wobble. Off-center catches make your tower tilt and lean precariously!',
      },
      {
        icon: '👑',
        title: '3. Complete Bakery Quota',
        desc: 'Stack the required number of delicious desserts without dropping three sweets to clear the stage and advance.',
      },
    ],
    controls: {
      desktop: [
        'Left & Right Arrow Keys / A & D: Slide pastry plate smoothly',
        'R Key: Quick restart bakery stage',
        'M Key: Toggle dessert chime sounds',
      ],
      mobile: [
        'Touch & Slide Anywhere: Steer plate under dropping treats',
        'Left & Right On-Screen Buttons: Tap to nudge plate',
        'Restart Button: Reset stage anytime',
      ],
    },
    proTip: 'Aim for centered catches! Perfect centered catches stabilize the tower spring wobble and trigger massive 2x to 5x combo multipliers!',
  },
  'barnyard-fruit-slicer': {
    title: 'Barnyard Fruit Slicer: Farm Juice',
    subtitle: 'Tactile Airborne Fruit Slicing & Juice Arcade',
    mascot: '🍉⚔️',
    themeColor: 'from-emerald-600 via-teal-600 to-amber-600',
    goal: 'Swipe your blade across flying apples, watermelons, and golden corn in mid-air to make fresh juice while dodging prickly thistle bombs!',
    steps: [
      {
        icon: '⚔️',
        title: '1. Swipe Through Flying Fruit',
        desc: 'Drag your finger or mouse across the screen to slice airborne fruits cleanly in half before they drop.',
      },
      {
        icon: '💣',
        title: '2. Dodge Thistle Bombs',
        desc: 'Never slice prickly dark bombs! Slicing a thistle bomb explodes and deducts one of your three hearts.',
      },
      {
        icon: '⭐',
        title: '3. Build Combo Streaks',
        desc: 'Slice 3 or more fruits in a single swift sweep to score massive bonus combo points and floating badges!',
      },
    ],
    controls: {
      desktop: [
        'Mouse Drag / Swipe: Cut through flying fruits in mid-air',
        'R Key: Quick restart orchard level',
        'M Key: Toggle slicing and whoosh sounds',
      ],
      mobile: [
        'Touch & Swipe Anywhere: Cut cleanly through fruits with your finger',
        'Multi-Slice: Hit 3+ fruits in one stroke for bonus combos',
        'Restart Button: Reset level anytime',
      ],
    },
    proTip: 'Wait for fruits to cluster near the peak of their flight! Slicing right as they pause in mid-air lets you grab easy 3x and 4x combos without touching bombs!',
  },
  'barnyard-peg-pop': {
    title: 'Barnyard Peg Pop: Acorn Bounce',
    subtitle: 'Tactile Acorn Cannon & Peg Bouncing Arcade',
    mascot: '🌰🎯',
    themeColor: 'from-amber-600 via-orange-600 to-indigo-900',
    goal: 'Aim your acorn cannon to bounce off colorful pegs, eliminate every orange target, and catch extra shots in the farm cart!',
    steps: [
      {
        icon: '🎯',
        title: '1. Aim & Fire Cannon',
        desc: 'Drag to adjust the dotted aim guide. Release or tap FIRE to launch a bouncy acorn nut down across the pegboard.',
      },
      {
        icon: '🟠',
        title: '2. Clear Orange Target Pegs',
        desc: 'Hit every orange target peg on the board to clear the stage and activate the festive Extreme Fever celebration.',
      },
      {
        icon: '🛒',
        title: '3. Catch in Moving Hay Cart',
        desc: 'Time your shot so the falling acorn drops straight into the sliding bottom cart to earn a free extra ball!',
      },
    ],
    controls: {
      desktop: [
        'Mouse Move / Pointer: Aim cannon angle smoothly',
        'Left Click / Spacebar: Fire bouncy acorn nut',
        'Arrow Keys Left / Right: Fine-tune cannon aim',
        'R Key: Quick restart current pegboard',
        'M Key: Toggle melodic chime sounds',
      ],
      mobile: [
        'Touch & Drag: Aim cannon angle anywhere on screen',
        'FIRE Button: Launch acorn toward pegs',
        'Restart Button: Reset level anytime',
      ],
    },
    proTip: 'Aim for the green magic pegs early! Green pegs trigger an explosive upward rebound boost, allowing one ball to clear dozens of pegs on its return descent!',
  },
  'duck-archery-range': {
    title: 'Duck Archery: Target Master',
    subtitle: 'Prairie Bowstring & Bullseye Arcade',
    mascot: '🎯🦆',
    themeColor: 'from-amber-500 via-emerald-600 to-sky-700',
    goal: 'Pull back the bowstring, gauge wind gusts, and shoot bullseyes with Quacky the Robin Duck!',
    steps: [
      {
        icon: '🏹',
        title: '1. Pull & Aim Bow',
        desc: 'Drag backward from the bow to aim your shot. Pull further back to charge higher arrow velocity.',
      },
      {
        icon: '💨',
        title: '2. Watch Wind Gusts',
        desc: 'Check the top wind gauge before releasing. Crosswinds push your arrow sideways during its flight.',
      },
      {
        icon: '🎯',
        title: '3. Hit Bullseyes & Apples',
        desc: 'Hit golden center rings for 100 points, pop apples for 150 points, and strike bells for extra arrows.',
      },
    ],
    controls: {
      desktop: [
        'Mouse Drag & Release: Pull back bowstring to aim and shoot',
        'R Key: Quick restart archery range',
        'M Key: Toggle bow and chime sounds',
      ],
      mobile: [
        'Touch & Drag: Pull back on bow to aim angle and power',
        'Release Finger: Fire arrow toward targets',
        'Restart Button: Reset stage anytime',
      ],
    },
    proTip: 'Aim high when crosswinds push against your shot! The dotted arc preview reveals your initial trajectory, but wind will carry your arrow further sideways.',
  },
  'corgi-mini-golf': {
    title: 'Corgi Mini Golf: Pasture Putt',
    subtitle: 'Countryside Mini Golf & Bank Shots',
    mascot: '🐶⛳',
    themeColor: 'from-emerald-600 via-teal-600 to-amber-700',
    goal: 'Aim your putter, bank off wooden rails, dodge hazards, and sink putts with Sunny the Corgi!',
    steps: [
      {
        icon: '🏌️',
        title: '1. Pull to Aim Putter',
        desc: 'Drag backward from the golf ball to adjust power and aim. Watch the dashed line to preview your shot.',
      },
      {
        icon: '🧱',
        title: '2. Bank Off Wooden Rails',
        desc: 'Bounce balls off side rails to navigate sharp dogleg corners. Hit blue bumpers for extra speed bursts.',
      },
      {
        icon: '⛳',
        title: '3. Sink Into the Cup',
        desc: 'Roll smoothly into the cup to complete each hole. Sink putts under par to earn Birdie and Eagle trophies.',
      },
    ],
    controls: {
      desktop: [
        'Mouse Drag & Release: Pull back to set putt power and angle',
        'R Key: Quick restart current hole',
        'M Key: Toggle putter clink and cup sounds',
      ],
      mobile: [
        'Touch & Drag: Pull back from ball to adjust power',
        'Release Finger: Putt the ball forward',
        'Restart Button: Reset hole anytime',
      ],
    },
    proTip: 'Avoid sand traps and mud puddles at all costs! Rough hazards drain ball momentum instantly and cost extra strokes.',
  },
  'caterpillar-fruit-trail': {
    title: 'Caterpillar Garden: Fruit Trail Snake',
    subtitle: 'Classic Fruit Crawling & Garden Maze',
    mascot: '🐛🍎',
    themeColor: 'from-lime-500 via-emerald-600 to-amber-600',
    goal: 'Crawl through garden plots, eat sweet berries, dodge thorny hedges, and grow your fuzzy trail!',
    steps: [
      {
        icon: '🍎',
        title: '1. Eat Ripe Garden Fruits',
        desc: 'Munch cherries, strawberries, and apples to grow longer body segments and score points.',
      },
      {
        icon: '🧱',
        title: '2. Dodge Rocks & Thorns',
        desc: 'Never hit garden boundary walls, stone boulders, or prickly brambles. Watch your turning room!',
      },
      {
        icon: '🦋',
        title: '3. Reach Stage Fruit Quotas',
        desc: 'Eat the target count of fruits to complete each stage and turn Sammy into a garden butterfly.',
      },
    ],
    controls: {
      desktop: [
        'Arrow Keys / WASD: Steer caterpillar in four directions',
        'R Key: Quick restart garden stage',
        'M Key: Toggle crunch and crawl sounds',
      ],
      mobile: [
        'Swipe Screen: Slide your finger up, down, left, or right',
        'Virtual D-Pad: Tap direction arrows below the garden',
        'Restart Button: Reset stage anytime',
      ],
    },
    proTip: 'Grab the green speed boost leaf whenever it spawns! Turbo crawl mode lets you sweep across the garden twice as fast without risk of tail tangles.',
  },
  'carrot-target-throw': {
    title: 'Carrot Target Throw: Barnyard Spin',
    subtitle: 'Spinning Target Timing & Precision',
    mascot: '🎯🥕',
    themeColor: 'from-orange-500 via-amber-600 to-amber-700',
    goal: 'Flick crunchy carrots into spinning farm targets, slice bonus fruit, and dodge obstacles!',
    steps: [
      {
        icon: '🎯',
        title: '1. Time Your Throw',
        desc: 'Tap to launch a crisp carrot upward toward the rotating wooden stump.',
      },
      {
        icon: '🚫',
        title: '2. Avoid Existing Pegs',
        desc: 'Never hit pre-stuck wooden obstacles or your own carrots; collisions cause a clash!',
      },
      {
        icon: '🍎',
        title: '3. Slice Bonus Fruit',
        desc: 'Hit orbiting apples and golden acorns for huge bonus points and clear all 4 stages!',
      },
    ],
    controls: {
      desktop: [
        'Spacebar / Left Click: Flick carrot toward target',
        'R Key: Quick restart stage',
        'M Key: Toggle crisp throw and stick sound effects',
      ],
      mobile: [
        'Tap Screen / Throw Button: Instant carrot throw with zero delay',
        'Restart Button: Reset stage anytime',
      ],
    },
    proTip: 'Study the stump rotation pattern! When speed decelerates or hesitates, that is your golden window to flick your carrots safely into open gaps.',
  },
  'animal-tangram-fit': {
    title: 'Animal Tangram: Wooden Block Fit',
    subtitle: 'Cozy Wooden Silhouette Puzzle',
    mascot: '🧩🐾',
    themeColor: 'from-amber-600 via-amber-700 to-yellow-800',
    goal: 'Fit polished wooden blocks into cute animal silhouettes without overlapping!',
    steps: [
      {
        icon: '🪵',
        title: '1. Pick Tray Pieces',
        desc: 'Tap a wooden polyomino piece from the bottom tray to select it.',
      },
      {
        icon: '🔄',
        title: '2. Rotate & Place',
        desc: 'Use the Rotate button to turn shapes 90 degrees, then tap the board to place them.',
      },
      {
        icon: '🏆',
        title: '3. Assemble All Animals',
        desc: 'Cover every silhouette cell without overlap to unlock roosters, pups, lambs, and cows!',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Select shape & place on board',
        'Rotate Button / R Key: Turn piece 90 degrees',
        'M Key: Toggle soothing wood clack sounds',
      ],
      mobile: [
        'Tap Tray Piece: Select wooden shape',
        'Tap Board: Place into matching outline',
        'Tap Placed Piece: Return piece to tray',
      ],
    },
    proTip: 'Start with the largest and corner pieces first! Placing bulky squares and long bars reveals the exact slots left for smaller pieces.',
  },
  'piggy-coin-pusher': {
    title: 'Piggy Coin Pusher: Barnyard Dozer',
    subtitle: 'Classic Arcade Coin Dozer & Quake',
    mascot: '🐷🪙',
    themeColor: 'from-amber-500 via-yellow-600 to-amber-700',
    goal: 'Drop shiny coins onto the moving blade, cascade piles forward, and push prize items over the front ledge!',
    steps: [
      {
        icon: '🪙',
        title: '1. Drop Golden Coins',
        desc: 'Tap anywhere across the top drop chute to release coins onto the sliding upper bed.',
      },
      {
        icon: '🚜',
        title: '2. Push Over Front Ledge',
        desc: 'Time your drops so the moving rake pushes stacked coins and prizes directly over the front edge.',
      },
      {
        icon: '⚡',
        title: '3. Barn Quake & Coin Walls',
        desc: 'Tap Barn Quake to shake the table or activate Coin Walls to block side gutters from swallowing your coins!',
      },
    ],
    controls: {
      desktop: [
        'Left Click Anywhere: Drop coin at cursor position',
        'Spacebar / Drop Button: Drop coin down center chute',
        'Quake Button: Trigger table tremor when meter is full',
        'Walls Button: Raise protective side barriers',
      ],
      mobile: [
        'Tap Anywhere: Drop coin at tapped screen position',
        'DROP COIN Button: Large touch button to drop coin',
        'BARN QUAKE Button: Shake table to push coins over edge',
        'COIN WALLS Button: Shield side gutters from coin loss',
      ],
    },
    proTip: 'Drop coins when the chrome pusher begins sliding backward! This lands your coin flat on the shelf so the forward stroke gives maximum pushing force.',
  },
  'milk-bottle-plinko': {
    title: 'Milk Bottle Plinko: Carnival Drop',
    subtitle: 'Classic Carnival Peg Drop & 100x Jackpot',
    mascot: '🥛🎪',
    themeColor: 'from-blue-600 via-indigo-700 to-amber-600',
    goal: 'Drop farm milk bottles through bouncy wooden pegs into the 100x jackpot bucket!',
    steps: [
      {
        icon: '🥛',
        title: '1. Drop From Moving Hopper',
        desc: 'Tap anywhere across the board to drop bottles from Bessie\'s moving dispenser cart.',
      },
      {
        icon: '⚡',
        title: '2. Bounce Off Bumpers & Pegs',
        desc: 'Watch bottles bounce down through 10 peg rows and hit red bumper rings to charge your meter.',
      },
      {
        icon: '⭐',
        title: '3. Hit the 100x Jackpot',
        desc: 'Land bottles in the golden center corral for a huge 100x score boost and trigger Golden Frenzy!',
      },
    ],
    controls: {
      desktop: [
        'Left Click Anywhere: Drop milk bottle from hopper',
        'Spacebar / Drop Button: Drop bottle immediately',
        'Frenzy Button: Activate Golden Frenzy when meter is full',
        'M Key: Toggle sound effects',
      ],
      mobile: [
        'Tap Anywhere: Drop bottle at tapped X position',
        'DROP MILK BOTTLE Button: Large bottom button to drop bottle',
        'GOLDEN FRENZY Button: Tap to start 5x bottle stream',
        'Mute & Reset: Compact buttons on top HUD',
      ],
    },
    proTip: 'Drop bottles when the hopper aligns just slightly off-center! Deflecting inward off the outer pegs creates the cleanest angle into the 100x center jackpot.',
  },
  'farm-tripeaks-solitaire': {
    title: 'Farm TriPeaks Solitaire: Harvest Peak',
    subtitle: 'Classic Countryside Card Solitaire',
    mascot: '🌾🃏',
    themeColor: 'from-emerald-600 via-green-700 to-amber-700',
    goal: 'Clear 3 card pyramids, build harvest streak multipliers, and conquer farm peaks!',
    steps: [
      {
        icon: '🃏',
        title: '1. Match Next Card (+/- 1)',
        desc: 'Tap any face-up card on the peaks that is one rank higher or lower than your active waste card.',
      },
      {
        icon: '🔥',
        title: '2. Build Streak Combos',
        desc: 'Clear cards consecutively without drawing from your stock deck to multiply your score by up to 10x!',
      },
      {
        icon: '🍀',
        title: '3. Use Wildcards & Undo',
        desc: 'Stuck on a tricky rank? Tap the lucky Wildcard Clover to remove any card, or use Undo to step back.',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Tap matching card (+/- 1 rank)',
        'Click Stock Pile: Flip next card to waste pile',
        'Wildcard Button: Clear any card using lucky clover',
        'Undo Button: Revert previous card move',
      ],
      mobile: [
        'Tap Card: Instant play card to waste pile',
        'DRAW CARD: Tap bottom button to flip new card',
        'WILD: Tap lucky clover to remove any selected card',
        'Undo & Restart: Header controls for quick retries',
      ],
    },
    proTip: 'Look ahead before clearing cards! Choosing lines that uncover hidden face-down cards keeps your streak going without needing to draw.',
  },
  'sheep-sorter-gate': {
    title: 'Barnyard Sheep Sorter: Pasture Gate',
    subtitle: 'Fast Reflex Color Sorting Arcade',
    mascot: '🐑🚪',
    themeColor: 'from-emerald-600 via-amber-600 to-green-700',
    goal: 'Flip the pasture gate left or right to sort fluffy sheep into their meadows before time runs out!',
    steps: [
      {
        icon: '🐑',
        title: '1. Watch Incoming Sheep',
        desc: 'White and Pink sheep belong to the Left pasture. Black and Golden sheep belong to the Right paddock.',
      },
      {
        icon: '🚪',
        title: '2. Flip the Pasture Gate',
        desc: 'Tap Left or Right to swing the gate paddle so the sheep bounces straight into its matching pen.',
      },
      {
        icon: '⭐',
        title: '3. Trigger Golden Fever',
        desc: 'Sort 15 sheep consecutively to ignite 5 seconds of Golden Fever for double points!',
      },
    ],
    controls: {
      desktop: [
        'Left / Right Arrows or A / D Keys: Flip gate left or right',
        'Spacebar: Quick flip gate direction',
        'M Key: Toggle sound effects',
      ],
      mobile: [
        'Tap Left Half / LEFT Button: Direct sheep to Left pen',
        'Tap Right Half / RIGHT Button: Direct sheep to Right paddock',
      ],
    },
    proTip: 'Keep your eyes at the top of the runway rather than right at the gate! Anticipating 2 sheep in advance makes reaching 20+ combos easy.',
  },
  'barnyard-pinball': {
    title: 'Barnyard Pinball: Flipper Farm',
    subtitle: 'Classic Retro Arcade Pinball',
    mascot: '🕹️🌾',
    themeColor: 'from-amber-600 via-orange-600 to-green-700',
    goal: 'Launch chrome pinballs, hit glowing farm bumpers, and keep the ball in play with dual flippers!',
    steps: [
      {
        icon: '🚀',
        title: '1. Pull & Launch Plunger',
        desc: 'Hold the launch button or pull the plunger spring to blast the ball through the curved top arch.',
      },
      {
        icon: '🕹️',
        title: '2. Work the Dual Flippers',
        desc: 'Time your flips as the steel ball rolls down the inlanes to shoot it back toward high-value bumpers.',
      },
      {
        icon: '⭐',
        title: '3. Spell F-A-R-M & Multiball',
        desc: 'Roll through all 4 rollover lanes to boost your multiplier, and hit the barn 3 times for Multiball!',
      },
    ],
    controls: {
      desktop: [
        'Left / Right Arrows, A / D, or Z / /: Engage flippers',
        'Down Arrow / Spacebar: Pull and release plunger',
        'M Key: Toggle sound effects',
      ],
      mobile: [
        'LEFT / RIGHT FLIPPER Buttons or screen halves: Flip blades',
        'LAUNCH Button: Hold to charge spring and release to fire',
      ],
    },
    proTip: 'Do not double-flip randomly! Cradle the ball on a raised flipper blade to pause, line up your shot toward the bumper triangle, and fire with precision.',
  },
  'crop-mower-harvest': {
    title: 'Crop Mower: Harvest Rush',
    subtitle: 'Satisfying Field Mowing Arcade',
    mascot: '🚜🌾',
    themeColor: 'from-amber-600 via-lime-600 to-green-700',
    goal: 'Drive a nimble red tractor to mow neat rows of tall golden wheat, fill your harvest basket, and clear 100% of the field!',
    steps: [
      {
        icon: '🚜',
        title: '1. Steer the Red Mower',
        desc: 'Use swipe gestures or the bottom D-pad buttons to steer your tractor across neat field rows.',
      },
      {
        icon: '🧺',
        title: '2. Fill Basket & Empty Silo',
        desc: 'Cut crops to fill your trailer basket, then drive over the red silo chute to bank bonus points!',
      },
      {
        icon: '🌾',
        title: '3. Harvest 100% of the Field',
        desc: 'Clear every patch of golden crops without leaving stray stalks behind to unlock the next stage.',
      },
    ],
    controls: {
      desktop: [
        'Arrow Keys or WASD: Drive tractor in any direction',
        'Release Keys: Pause and stop mower',
        'M Key: Toggle tractor sound effects',
      ],
      mobile: [
        'Swipe on Field or D-Pad Arrows: Guide tractor smoothly',
        'Top Silo: Drive over red silo chute to empty full basket',
      ],
    },
    proTip: 'Mow in long continuous serpentines from one end of the paddock to the other! This prevents leaving isolated single tiles and maximizes your combo bonus.',
  },
  'hamster-maze-runner': {
    title: 'Hamster Maze: Nut Escape',
    subtitle: 'Timber Labyrinth & Acorn Hunt',
    mascot: '🐹🌰',
    themeColor: 'from-amber-600 via-orange-600 to-yellow-700',
    goal: 'Guide Pip the hungry hamster through timber mazes, gather golden acorns, find the brass key, and unlock the exit door!',
    steps: [
      {
        icon: '🐹',
        title: '1. Steer Pip Through Mazes',
        desc: 'Swipe on the maze or use the bottom D-Pad arrows to guide Pip through twists, turns, and wooden corridors.',
      },
      {
        icon: '🌰',
        title: '2. Gather Acorns & Key',
        desc: 'Munch all golden acorns for high score points, and seek out the shiny brass key hidden in the maze.',
      },
      {
        icon: '🚪',
        title: '3. Unlock Gate & Exit',
        desc: 'With the key in your paws, bump the locked red gate to unlatch it, then reach the glowing green exit door!',
      },
    ],
    controls: {
      desktop: [
        'Arrow Keys or WASD: Steer Pip through maze corridors',
        'Spacebar / Enter: Advance to next stage or restart',
        'R Key: Restart current maze stage',
        'M Key: Toggle squeak and crunch audio sounds',
      ],
      mobile: [
        'Swipe Gestures: Swipe anywhere on maze to steer Pip',
        'Tactile D-Pad: Tap bottom direction buttons (Up, Down, Left, Right)',
        'Next Stage Button: Advance after reaching the exit gate',
      ],
    },
    proTip: 'Always scout the maze layout first! Locate the shiny brass key before rushing to the locked gate, and scoop up every acorn along your path for maximum bonus stars.',
  },
  'chicken-egg-catcher': {
    title: 'Chicken Egg Catcher: Barnyard Rush',
    subtitle: 'Classic Reflex Egg Catch Arcade',
    mascot: '🐔🥚',
    themeColor: 'from-amber-500 via-orange-600 to-yellow-600',
    goal: 'Slide your straw basket across the barn floor to catch falling eggs, dodge rotten eggs, and activate fever mode!',
    steps: [
      {
        icon: '🧺',
        title: '1. Slide Basket Left & Right',
        desc: 'Drag your finger across the canvas or use Arrow Keys / A-D to position your basket under falling eggs.',
      },
      {
        icon: '🥚',
        title: '2. Catch White & Speckled Eggs',
        desc: 'Catch eggs before they hit the ground! Regular eggs award 10 pts, speckled eggs award 25 pts, and combos increase score.',
      },
      {
        icon: '🌟',
        title: '3. Golden Eggs & Rotten Traps',
        desc: 'Catch golden star eggs for 100 pts + 6 seconds of 2x Golden Fever! Dodge green rotten eggs—catching one loses a heart!',
      },
    ],
    controls: {
      desktop: [
        'Left / Right Arrows or A / D: Slide basket',
        'Spacebar / Enter: Restart on game over',
        'R Key: Quick restart run',
        'M Key: Toggle catch audio effects',
      ],
      mobile: [
        'Touch & Drag: Slide thumb anywhere on canvas for instant basket follow',
        'Slide Left / Right Buttons: Tap large bottom directional buttons',
      ],
    },
    proTip: 'Watch for green spoiled eggs and deliberately let them drop! Rotten eggs splat harmlessly on the floor, saving your 3 precious hearts.',
  },
  'piggy-mud-wash': {
    title: 'Piggy Mud Wash: County Fair Spa',
    subtitle: 'Satisfying Farm Pet Wash Arcade',
    mascot: '🐷🧼',
    themeColor: 'from-pink-500 via-rose-500 to-amber-500',
    goal: 'Scrub muddy farm pets with soap, rinse away grime with the hose, towel dry, and win County Fair ribbons!',
    steps: [
      {
        icon: '🧽',
        title: '1. Soap Up With Sponge',
        desc: 'Select Tool 1 and drag over dark brown mud patches to lather them up with thick soap bubbles.',
      },
      {
        icon: '🚿',
        title: '2. Rinse Clean With Hose',
        desc: 'Select Tool 2 and spray water over the soapy lather to wash away all loosened mud and bubbles.',
      },
      {
        icon: '🧖',
        title: '3. Towel Dry & Polish',
        desc: 'Select Tool 3 and wipe the wet coat with a fluffy towel until bright golden sparkles appear!',
      },
    ],
    controls: {
      desktop: [
        'Mouse Drag: Scrub, rinse, and dry across the animal',
        '1, 2, 3 Keys: Instant tool selection (Sponge, Hose, Towel)',
        'Spacebar: Advance after winning ribbon',
        'R Key: Reset current animal',
      ],
      mobile: [
        'Touch & Drag: Slide finger across animal body to clean',
        'Tool Dock: Tap bottom Sponge, Hose, and Towel buttons',
      ],
    },
    proTip: 'Work in systematic passes! Lather all mud with the sponge first, blast everything with the water hose second, then finish with a quick towel dry to hit 100% in record time.',
  },
  'barnyard-brick-breaker': {
    title: 'Barnyard Brick Breaker: Apple Bounce',
    subtitle: 'Classic Retro Arcade Brick Breaker',
    mascot: '🍎🧱',
    themeColor: 'from-red-500 via-amber-600 to-yellow-500',
    goal: 'Deflect bouncing apples with your harvester cart, break fruit crates, and grab golden honey drops!',
    steps: [
      {
        icon: '🚜',
        title: '1. Steer Harvester Cart',
        desc: 'Drag your finger across the canvas or use Arrow Keys / A-D to guide your harvester paddle under falling apples.',
      },
      {
        icon: '🍎',
        title: '2. Smash Fruit Crates & Stone',
        desc: 'Bounce apples into wooden crates (1 hit) and stone foundations (2 hits) to clear the farm stage.',
      },
      {
        icon: '🍯',
        title: '3. Catch Honey Power-Ups',
        desc: 'Catch falling capsules to trigger Triple Apple Multi-Ball, Wide Paddle, or blazing Fireballs!',
      },
    ],
    controls: {
      desktop: [
        'Left / Right Arrows or A / D: Steer cart',
        'Spacebar or Click: Launch apple / Restart',
        'R Key: Reset current stage',
        'M Key: Toggle audio effects',
      ],
      mobile: [
        'Touch & Drag: Slide thumb anywhere on canvas for instant cart follow',
        'Left / Right / Launch: Bottom directional buttons',
      ],
    },
    proTip: 'Angle your paddle shots! Hitting the apple near the left or right edge of your cart sends it slicing at sharp angles into hard-to-reach top corners.',
  },
  'duck-water-slide': {
    title: 'Duck Water Slide: Splash Rush',
    subtitle: 'Fast Water Flume Racing Arcade',
    mascot: '🦆🌊',
    themeColor: 'from-cyan-600 via-sky-500 to-amber-500',
    goal: 'Steer Quacky down twisting water flumes, dodge beach balls and soap, leap ramps, and splash into the pool!',
    steps: [
      {
        icon: '🌊',
        title: '1. Steer Flume Turns',
        desc: 'Steer left and right along the flume water current to follow the flow and pick up juicy watermelon slices.',
      },
      {
        icon: '⚡',
        title: '2. Hit Turbo Boosts & Ramps',
        desc: 'Ride glowing water speed pads for instant turbo speed, and launch off ramps to perform stunt jumps.',
      },
      {
        icon: '🧼',
        title: '3. Avoid Beach Balls & Soap',
        desc: 'Steer clear of slippery soap bars and floating beach balls that slow your inner tube or cause spinouts.',
      },
    ],
    controls: {
      desktop: [
        'Left / Right Arrows or A / D: Steer duck left or right',
        'Spacebar: Quick center or restart',
        'M Key: Toggle splash sound effects and duck squeaks',
      ],
      mobile: [
        'Touch & Drag / Left-Right Touch: Steer Quacky across the water slide',
        'Bottom Arrow Buttons: Left and Right flume steering',
      ],
    },
    proTip: 'Hit every water ramp you can! Stunt jumps award 200 bonus points each and keep your speed high while sailing safely over tricky soap hazards.',
  },
  'bunny-hop-cross': {
    title: 'Bunny Hop: Road & River Cross',
    subtitle: 'Classic Arcade Animal Hopper',
    mascot: '🐰🥕',
    themeColor: 'from-emerald-600 via-green-600 to-amber-500',
    goal: 'Hop Barnaby Bunny across busy country roads, floating river logs, and train tracks to reach the farm finish gate!',
    steps: [
      {
        icon: '🚜',
        title: '1. Cross Country Roads',
        desc: 'Time your hops to pass safely between moving farm tractors, grain trucks, and red pickups.',
      },
      {
        icon: '🪵',
        title: '2. Ride Floating Logs',
        desc: 'Leap onto moving river logs and water lily pads. Stay on the timber to keep from splashing into deep creek water.',
      },
      {
        icon: '🥕',
        title: '3. Grab Carrots & Keep Moving',
        desc: 'Collect orange and golden carrots for bonus points. Keep hopping forward so the farm hawk cannot catch you!',
      },
    ],
    controls: {
      desktop: [
        'Arrow Keys or W/A/S/D: Hop forward, backward, left, or right',
        'Spacebar: Quick forward hop',
        'M Key: Toggle hop chimes and sound effects',
      ],
      mobile: [
        'Touch Swipe: Swipe in any direction for instant hopping',
        'Tap Screen: Tap top half to hop up, bottom half to hop down',
        'Bottom D-Pad: On-screen tactile arrow buttons',
      ],
    },
    proTip: 'Never idle in one spot for too long! The circling hawk strikes after seven seconds of standing still. Keep hopping steadily forward.',
  },
  'farm-boba-tea': {
    title: 'Farm Boba Tea: Animal Cafe',
    subtitle: 'Cozy Bubble Tea Time Management',
    mascot: '🧋🐮',
    themeColor: 'from-amber-600 via-pink-600 to-purple-700',
    goal: 'Mix sweet farm boba teas, scoop chewy tapioca pearls, seal cups, and serve thirsty animal customers!',
    steps: [
      {
        icon: '🧋',
        title: '1. Check Customer Order',
        desc: 'Review the customer bubble for requested tea base, boba topping, ice level, and sweetness.',
      },
      {
        icon: '🍓',
        title: '2. Layer Teas & Toppings',
        desc: 'Pour fresh farm milk, scoop tapioca or fruit jellies, adjust ice cubes, and pump golden honey.',
      },
      {
        icon: '✨',
        title: '3. Seal, Straw & Serve',
        desc: 'Tap Seal & Straw to cap the cup, then tap Serve Order to collect coins, tips, and build combos!',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Select teas, toppings, and ice settings',
        'S Key: Seal cup and punch straw',
        'Spacebar or Enter: Serve finished boba order',
        'T Key: Trash mistake cup to start fresh',
        'M Key: Toggle cafe audio effects',
      ],
      mobile: [
        'Tap Buttons: Quick ingredient and scoop selections',
        'Seal & Straw: Cap drink and punch colorful straw',
        'Serve Order: Deliver drink to waiting animal customer',
      ],
    },
    proTip: 'Serve while the customer patience meter is high! Fast service awards big extra coin tips and keeps your combo multiplier climbing.',
  },
  'barnyard-ice-cream': {
    title: 'Barnyard Ice Cream: Scoop & Stack',
    subtitle: 'Waffle Cone Ice Cream Stacking Arcade',
    mascot: '🍦🍨',
    themeColor: 'from-amber-500 via-pink-500 to-rose-600',
    goal: 'Stack giant ice cream scoops on waffle cones, drizzle hot syrups, scatter sprinkles, and serve cute farm animals!',
    steps: [
      {
        icon: '🍦',
        title: '1. Choose Base & Scoops',
        desc: 'Select a crispy waffle cone or sundae bowl, then stack the customer requested ice cream flavors.',
      },
      {
        icon: '🍫',
        title: '2. Drizzle Syrup & Sprinkles',
        desc: 'Add hot fudge or strawberry glaze, scatter rainbow sprinkles, and pipe a fluffy whipped cream swirl.',
      },
      {
        icon: '🍒',
        title: '3. Cherry on Top & Serve',
        desc: 'Crown the sweet creation with a glazed red cherry and tap Serve Order before customer patience melts away!',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Select cones, scoops, syrups, and toppings',
        'W Key: Pipe whipped cream swirl',
        'C Key: Add bright red cherry on top',
        'Spacebar or Enter: Serve finished ice cream',
        'T Key: Trash mistake cone to start fresh',
        'M Key: Toggle ice cream cart sounds',
      ],
      mobile: [
        'Tap Buttons: Quick flavor and topping additions',
        'Base Switch: Toggle waffle cone or sundae bowl',
        'Serve Button: Deliver ice cream to waiting pets',
      ],
    },
    proTip: 'Match flavors in the exact order shown in the customer bubble to earn maximum style points and high combo multipliers!',
  },
  'barnyard-kart-drift': {
    title: 'Barnyard Kart: Tractor Grand Prix',
    subtitle: 'High-Speed Tractor Drift Arcade',
    mascot: '🚜🏁',
    themeColor: 'from-amber-500 via-orange-600 to-red-700',
    goal: 'Steer your tractor around countryside tracks, slide through dirt drifts, and cross the finish line in first place!',
    steps: [
      {
        icon: '🏎️',
        title: '1. Steer & Accelerate',
        desc: 'Steer with arrows or touch buttons. Hold Gas to gain speed along straight country paths.',
      },
      {
        icon: '🔥',
        title: '2. Drift Curves for Turbo',
        desc: 'Hold Drift while turning into bends. Charging drift power triggers a mini-turbo boost on release!',
      },
      {
        icon: '🌽',
        title: '3. Dodge Hazards & Grab Corn',
        desc: 'Avoid deep mud puddles and slick patches. Drive through golden corn to trigger sudden nitro speed!',
      },
    ],
    controls: {
      desktop: [
        'A / D or Left / Right: Steer tractor left and right',
        'W / Up Arrow: Accelerate gas pedal',
        'S / Down Arrow: Brake and reverse',
        'Spacebar or Shift: Hold to drift around curves',
        'R Key: Quick restart current race',
        'M Key: Toggle engine and tire sounds',
      ],
      mobile: [
        'Left & Right Arrows: Smooth responsive steering',
        'GAS Button: Hold to accelerate full throttle',
        'DRIFT Button: Hold into corners for sliding turns and turbo boosts',
        'Circuit Pills: Switch between 4 grand prix tracks anytime',
      ],
    },
    proTip: 'Release your drift right as you exit the curve to slingshot your tractor down the straightaway at top speed!',
  },
  'piggy-cannon-blast': {
    title: 'Piggy Cannon Blast: Barnyard Launch',
    subtitle: 'High-Altitude Distance Flight Arcade',
    mascot: '🚀🐷',
    themeColor: 'from-pink-500 via-rose-600 to-amber-600',
    goal: 'Launch Penny the piglet high into the sky, bounce off sheep trampolines, and glide across countryside horizons!',
    steps: [
      {
        icon: '💥',
        title: '1. Aim & Fire Cannon',
        desc: 'Lock the swinging angle needle and time the gunpowder meter to blast Penny from the circus barrel.',
      },
      {
        icon: '🚀',
        title: '2. Steer & Rocket Boost',
        desc: 'Tilt nose up to glide on air thermals. Tap Nitro Boost to fire rocket soda thrusters for extra height.',
      },
      {
        icon: '🐑',
        title: '3. Bounce & Upgrade',
        desc: 'Bounce off woolly sheep and pop star balloons. Spend collected coins on bigger gunpowder and bouncy shoes.',
      },
    ],
    controls: {
      desktop: [
        'Spacebar / Click: Lock angle, blast cannon, and fire rocket nitro',
        'W / Up Arrow: Tilt nose up for air glide lift',
        'S / Down Arrow: Tilt nose down for diving speed',
        'U Key: Open flight upgrades shop',
        'R Key: Quick restart flight',
        'M Key: Toggle cannon boom and thruster audio',
      ],
      mobile: [
        'Main Action Button: Tap to lock angle, fire cannon, and trigger rocket nitro',
        'GLIDE Button: Pull up nose to catch gentle air thermals',
        'DIVE Button: Point nose down to build forward momentum',
        'Shop Button: Open flight gear upgrades menu',
      ],
    },
    proTip: 'Save your rocket nitro thrusters for when you begin losing altitude! Firing nitro at the peak of a bounce gives maximum glide distance.',
  },
  'barnyard-rope-cut': {
    title: 'Barnyard Rope Cut: Feed the Piggy',
    subtitle: 'Physics Pendulum Rope Slicing Puzzle',
    mascot: '🍎🐷',
    themeColor: 'from-amber-600 via-rose-600 to-red-700',
    goal: 'Cut swinging ropes to guide ripe apples through golden stars directly into Penny\'s hungry mouth!',
    steps: [
      {
        icon: '✂️',
        title: '1. Swipe to Cut Ropes',
        desc: 'Drag your finger or cursor blade across ropes to sever them and release the swinging apple.',
      },
      {
        icon: '⭐',
        title: '2. Collect 3 Golden Stars',
        desc: 'Time your cuts so pendulum momentum carries the apple through all three floating stars.',
      },
      {
        icon: '🫧',
        title: '3. Pop Bubbles & Bounce',
        desc: 'Tap milk bubbles to pop them when the apple reaches the ideal drop height above trampolines.',
      },
    ],
    controls: {
      desktop: [
        'Click & Drag: Slice blade across ropes',
        'Left Click Bubble: Tap bubble to pop and release fruit',
        'R Key: Quick restart current level',
        'M Key: Toggle rope slice and bubble sounds',
      ],
      mobile: [
        'Finger Swipe: Slice smoothly through ropes',
        'Tap Bubble: Pop floating bubble to drop apple',
        'Level Pills: Jump between 4 stages anytime',
      ],
    },
    proTip: 'Look at the arc of the swing! Cutting one rope while another is stretched transfers immense swing speed across the puzzle.',
  },
  'barnyard-popcorn-popper': {
    title: 'Barnyard Popcorn Popper: Kernel Burst',
    subtitle: 'Hold to Pour Corn & Burst Kettle Popcorn',
    mascot: '🍿🌽',
    themeColor: 'from-amber-600 via-orange-600 to-amber-700',
    goal: 'Hold down to pour golden corn into the kettle and fill the bucket right to the target line without spilling past the brim!',
    steps: [
      {
        icon: '🌽',
        title: '1. Hold to Pour Corn',
        desc: 'Press and hold the screen or bottom button to stream golden corn kernels from the silo hopper.',
      },
      {
        icon: '🍿',
        title: '2. Pop and Expand',
        desc: 'When kernels hit the heated kettle, they burst into fluffy butter popcorn with triple the volume!',
      },
      {
        icon: '🎯',
        title: '3. Reach the Target Line',
        desc: 'Fill past the dashed green target line without letting popped corn spill over the red brim.',
      },
    ],
    controls: {
      desktop: [
        'Click & Hold / Space: Hold to pour golden corn kernels',
        'Release: Stop pouring to let kernels heat and pop',
        'R Key: Quick restart current kettle stage',
        'M Key: Toggle sound effects and popping snaps',
      ],
      mobile: [
        'Touch & Hold: Press screen or big bottom button to pour corn',
        'Release Touch: Stop pouring to start popping phase',
        'Stage Buttons: Tap top pills to switch stages anytime',
      ],
    },
    proTip: 'Stop pouring slightly before the target line! When kernels pop, their volume expands rapidly and lifts the top popcorn upward.',
  },
  'barnyard-word-connect': {
    title: 'Barnyard Word Connect: Corgi Cross',
    subtitle: 'Circular Dial Word Connection Puzzle',
    mascot: '🐶📖',
    themeColor: 'from-sky-600 via-indigo-600 to-blue-700',
    goal: 'Swipe across wooden letter tiles to find farm words and solve crossword puzzles with Sunny Corgi!',
    steps: [
      {
        icon: '🔤',
        title: '1. Swipe to Connect',
        desc: 'Drag across circular letter tiles on the dial to spell valid English farm words.',
      },
      {
        icon: '📖',
        title: '2. Fill the Crossword',
        desc: 'Matching words fly into empty grid slots to reveal letters for intersecting words.',
      },
      {
        icon: '🦴',
        title: '3. Find Bonus Words',
        desc: 'Spell valid bonus words not on the grid to fill Sunny Corgi\'s treat jar for extra points!',
      },
    ],
    controls: {
      desktop: [
        'Click & Drag: Swipe across letter tiles on the circular dial',
        'Release: Submit your word guess to the crossword grid',
        'Shuffle (🔀): Re-arrange letter tiles for a new view',
        'Hint (💡): Reveal a hidden letter in the grid',
      ],
      mobile: [
        'Touch & Swipe: Drag your finger across letter tiles to connect them',
        'Release: Submit your word guess into the crossword',
        'Level Buttons: Tap top pills to switch levels anytime',
      ],
    },
    proTip: 'Look for short 3-letter words first! Finding the root word often opens up longer 4-letter and 5-letter crossword answers.',
  },
  'crossy-chicken': {
    title: 'Crossy Chicken: Farm Highway Run',
    subtitle: 'Infinite Road & River Arcade Hopper',
    mascot: '🐔🛣️',
    themeColor: 'from-amber-500 via-orange-600 to-red-600',
    goal: 'Hop Clucky across speeding farm highways, rushing river logs, and railroad tracks as far as possible!',
    steps: [
      {
        icon: '▲',
        title: '1. Hop Across Lanes',
        desc: 'Tap the screen or press Up / Space to hop Clucky forward across traffic and train tracks.',
      },
      {
        icon: '🪵',
        title: '2. Ride Floating Logs',
        desc: 'Leap onto moving river logs to cross rushing waters without falling in.',
      },
      {
        icon: '🦅',
        title: '3. Keep Moving',
        desc: 'Do not stand still too long! A circling hawk will swoop down if you hesitate.',
      },
    ],
    controls: {
      desktop: [
        'Arrow Keys or WASD: Hop forward, left, right, or back',
        'Spacebar: Quick forward hop',
        'R Key: Restart run immediately',
        'M Key: Toggle sound effects and clucks',
      ],
      mobile: [
        'Tap Screen: Hop forward immediately',
        'Swipe: Hop in swipe direction',
        'Bottom Buttons: Dedicated touch D-Pad controls',
      ],
    },
    proTip: 'Look ahead two lanes before hopping! Timing your leap onto a river log is easier if you watch the current direction early.',
  },
  'tractor-hill-climb': {
    title: 'Tractor Hill Climb: Barnyard Ridge',
    subtitle: '2D Physics Ridge Racer & Air Stunt Arcade',
    mascot: '🚜⛰️',
    themeColor: 'from-emerald-500 via-amber-500 to-red-600',
    goal: 'Drive Farmer Barnaby’s bouncy red tractor across steep hills, land mid-air flips, and reach the finish flag without rolling over!',
    steps: [
      {
        icon: '⛽',
        title: '1. Throttle & Climb',
        desc: 'Hold Gas to surge up steep pasture crests, hay ramps, and wooden bridges.',
      },
      {
        icon: '🔄',
        title: '2. Balance Air Flips',
        desc: 'In mid-air, use Gas to tilt backward and Brake to tilt forward for 360-degree flip combos.',
      },
      {
        icon: '🛑',
        title: '3. Watch Fuel & Head',
        desc: 'Collect red diesel cans to keep moving and avoid tipping upside down.',
      },
    ],
    controls: {
      desktop: [
        'Right Arrow / D / Space: Gas (Accelerate & Tilt Back)',
        'Left Arrow / A / S: Brake (Slow down & Tilt Forward)',
        'R Key: Quick restart run',
        'M Key: Toggle tractor sound effects',
      ],
      mobile: [
        'Right Pedal (GAS): Hold to accelerate and tilt backward',
        'Left Pedal (BRAKE): Hold to slow down and tilt forward',
        'Top Pills: Select stages and track distance progress',
      ],
    },
    proTip: 'Ease off the gas right as you crest high hill peaks! Keeping your tractor level ensures a smooth two-wheel landing with zero rollover risk.',
  },
  'cat-cafe-rush': {
    title: 'Cat Cafe Rush: Cozy Bakery',
    subtitle: 'Cozy Time-Management Bakery',
    mascot: '🐱🍰',
    themeColor: 'from-rose-500 via-pink-600 to-amber-600',
    goal: 'Bake warm fish waffles, froth matcha lattes, and serve visiting customer cats before their patience runs out!',
    steps: [
      {
        icon: '🧇',
        title: '1. Bake & Prep Pastries',
        desc: 'Tap the waffle iron to pour batter and bake taiyaki, steam matcha lattes, or layer fresh strawberry cakes.',
      },
      {
        icon: '🍽️',
        title: '2. Platter to Hold Orders',
        desc: 'Cooked items move to your 4-slot serving platter. Keep a balanced supply ready for incoming orders.',
      },
      {
        icon: '🐾',
        title: '3. Serve Waiting Cats',
        desc: 'Tap SERVE on any customer seat whose order matches an item on your platter to collect coins and build combos!',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Tap kitchen stations to bake, froth, and layer pastries',
        'Click SERVE: Deliver prepared pastry to waiting customer cat',
        'M Key: Toggle soothing cafe sounds and purrs',
      ],
      mobile: [
        'Tap Stations: Quick touch to start baking or collecting items',
        'Tap SERVE: Deliver order to matching customer seat',
        'Tap Platter Item: Discard an item if you need an empty slot',
      ],
    },
    proTip: 'Serve cats when their patience gauge is green (>60%) to earn a +50% Speed Tip and build high combo multipliers!',
  },
  'hamster-ball-dash': {
    title: 'Hamster Ball Dash: Tube Roll',
    subtitle: 'High-Speed Stunt Ball Arcade',
    mascot: '🐹⚡',
    themeColor: 'from-amber-500 via-orange-600 to-yellow-600',
    goal: 'Roll Pip inside the transparent stunt sphere, grab sunflower seeds, and reach the finish line before time runs out!',
    steps: [
      {
        icon: '🐹',
        title: '1. Steer Across Stunt Tubes',
        desc: 'Drag your finger or press Arrow Keys / A & D to steer Pip along boardwalks and through clear silo tubes.',
      },
      {
        icon: '⚡',
        title: '2. Hit Boost Pads & Ramps',
        desc: 'Drive over neon chevron boost pads for supersonic speed and launch off ramps into soaring jumps!',
      },
      {
        icon: '🌻',
        title: '3. Collect Seeds & Stay on Track',
        desc: 'Collect golden sunflower seeds and purple magnet power-ups. Watch out for open bridges and don\'t tumble off!',
      },
    ],
    controls: {
      desktop: [
        'Arrow Keys / A & D: Steer Pip left and right across the track',
        'Up Arrow / W: Accelerate forward into high-speed roll',
        'Down Arrow / S: Brake for sharp corners and tight ledges',
        'M Key: Toggle sound effects',
      ],
      mobile: [
        'Touch & Drag on Screen: Steer Pip smoothly with instant response',
        'On-Screen Steer Buttons: Tap Left or Right at the bottom of the screen',
      ],
    },
    proTip: 'Brake briefly before entering open narrow bridges without rails to keep your momentum centered and avoid falling off!',
  },
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
  'farm-mahjong': {
    title: 'Farm Mahjong Solitaire',
    subtitle: 'Barnyard Tile Matching Puzzle',
    mascot: '🀄🌾',
    themeColor: 'from-emerald-600 via-green-700 to-amber-900',
    goal: 'Clear all 3D layered farm tiles from the board by finding and matching unblocked pairs before time expires!',
    steps: [
      {
        icon: '👀',
        title: '1. Spot Free Tiles',
        desc: 'A tile is free if its top face is uncovered and either its left or right side has no adjacent tile.',
      },
      {
        icon: '🀄',
        title: '2. Tap Matching Pairs',
        desc: 'Tap two identical tiles (like two sweet corn or two red apples) to match them and clear them from the board.',
      },
      {
        icon: '⚡',
        title: '3. Use Smart Boosters',
        desc: 'Need help? Tap Hint to reveal a match, Undo to step back, or Shuffle to rearrange remaining tiles.',
      },
    ],
    controls: {
      desktop: [
        'Click Tile: Select and match valid unblocked tiles',
        'H Key: Reveal a valid matching pair',
        'U Key: Undo your last move',
        'S Key: Shuffle remaining tiles on the board',
      ],
      mobile: [
        'Tap Tile: Select unblocked tiles with ease',
        'Golden Highlight: Shows currently selected tile',
        'Booster Buttons: Tap Hint, Undo, or Shuffle at any time',
      ],
    },
    proTip: 'Focus on clearing high stacks and outer wings first. This opens up the widest number of hidden tiles beneath!',
  },
  'pet-memory-match': {
    title: 'Pet Memory Match',
    subtitle: 'Barnyard Animal Card Concentration',
    mascot: '🃏🐾',
    themeColor: 'from-indigo-600 via-purple-700 to-pink-900',
    goal: 'Flip cards, memorize cute pet faces, and match all identical animal pairs before the timer runs out!',
    steps: [
      {
        icon: '🃏',
        title: '1. Flip & Memorize',
        desc: 'Tap any rustic wooden card to reveal the pet portrait hidden underneath.',
      },
      {
        icon: '🐾',
        title: '2. Find Its Pair',
        desc: 'Tap a second card. If they match, they stay open and reward bonus combo points!',
      },
      {
        icon: '⏱️',
        title: '3. Use Smart Boosters',
        desc: 'Use Peek to briefly reveal all cards, or Time Freeze to stop the countdown clock for 5 crucial seconds.',
      },
    ],
    controls: {
      desktop: [
        'Click Card: Flip and reveal pet faces',
        'P Key: X-Ray Peek booster',
        'F Key: Freeze time booster',
        'R Key: Quick restart',
      ],
      mobile: [
        'Tap Card: Instant smooth 3D flip animation',
        'Peek Button: Reveal all cards for 1.8 seconds',
        'Freeze Button: Pause timer for 5 seconds',
      ],
    },
    proTip: 'Match pairs quickly in succession to activate Combo Streaks and multiply your score by up to 4x!',
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
    title: 'Animal 2048: Safari Merge',
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
    title: 'Farm Block Drop: Haunted Harvest',
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
        title: '3. Score a 4-Line Clear',
        desc: 'Clear 4 rows simultaneously for 800+ points and a joyful cheering reaction from the farmer!',
      },
    ],
    controls: {
      desktop: ['A / D: Move left & right', 'W / Up Arrow: Rotate 90°', 'Spacebar: Hard drop / slam', 'C / Shift: Hold piece'],
      mobile: ['Touch Left/Right/Down arrows', 'ROTATE button', 'SLAM hard drop button', 'HOLD queue button'],
    },
    proTip: 'Save the straight I-bar piece in your HOLD queue (C key) until you can drop it for an instant 4-line clear!',
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
  'barnyard-tower': {
    title: 'Barnyard Tower: Animal Stack',
    subtitle: 'Casual Physics Stacking Arcade',
    mascot: '🐮🏗️',
    themeColor: 'from-sky-500 via-amber-500 to-emerald-600',
    goal: 'Drop farm animals from the swinging crane to build the tallest wobbling tower without toppling over!',
    steps: [
      {
        icon: '🏗️',
        title: '1. Time the Swinging Crane',
        desc: 'Watch the crane swing smoothly across the barnyard. Align the animal directly above the center of the stack.',
      },
      {
        icon: '✨',
        title: '2. Drop for Perfect Combos',
        desc: 'Press Space or tap the screen to drop. Centered drops trigger Perfect Stack star combos and stabilize the tower.',
      },
      {
        icon: '⚠️',
        title: '3. Balance Center of Mass',
        desc: 'Off-center drops tilt the tower. If the tilt gets too steep or an animal falls into the grass, you lose a heart!',
      },
    ],
    controls: {
      desktop: [
        'Spacebar / Down Arrow / Left Click: Drop animal from crane',
        'M Key: Toggle sound effects',
        'R Key: Restart round when tower collapses',
      ],
      mobile: [
        'Tap Anywhere on Screen: Instant drop release',
        'Audio Button: Toggle sound on/off',
      ],
    },
    proTip: 'Look at the wobbling meter! Perfect drops gently correct the lean of the tower back towards the stable center.',
  },
  'gopher-garden': {
    title: 'Gopher Garden: Whack & Harvest',
    subtitle: 'Fast Garden Reflex Arcade',
    mascot: '🥕🐾',
    themeColor: 'from-amber-600 via-yellow-500 to-emerald-700',
    goal: 'Protect Farmer Giles\' vegetable patch by whacking cheeky gophers before they steal your prize harvest!',
    steps: [
      {
        icon: '🐾',
        title: '1. Whack Popping Gophers',
        desc: 'Tap cheeky gophers the moment they emerge from soil mounds to earn 100 points and build your streak.',
      },
      {
        icon: '👑',
        title: '2. Catch the Golden King',
        desc: 'Whack the rare Golden King Gopher for 300 points and trigger Harvest Frenzy: 2x points and rapid spawns!',
      },
      {
        icon: '🚫',
        title: '3. Avoid Spiky Thistles',
        desc: 'Do not hit the spiky purple thistles (🦔)! Hitting them deducts 150 points and resets your combo multiplier.',
      },
    ],
    controls: {
      desktop: [
        'Mouse Click: Tap any gopher or mound',
        'Keys 1-9: Quick keypad tap for each of the 9 garden mounds',
        'M Key: Toggle sound effects',
        'R Key: Restart 60-second time trial',
      ],
      mobile: [
        'Direct Finger Tap: Hit emerging gophers anywhere on the 3x3 grid',
        'Large Touch Targets: Zero-lag tactile response',
      ],
    },
    proTip: 'Keep your eye on the Golden King Gopher. Triggering Harvest Frenzy during high combo streaks can skyrocket your score above 5,000 points!',
  },
  'farm-fruit-bubble': {
    title: 'Farm Fruit Bubble: Orchard Pop',
    subtitle: 'Classic Barnyard Bubble Match & Harvest',
    mascot: '🍎🎈',
    themeColor: 'from-amber-600 via-rose-600 to-emerald-700',
    goal: 'Aim and shoot orchard fruit bubbles to match clusters of 3 or more and clear the orchard ceiling!',
    steps: [
      {
        icon: '🎯',
        title: '1. Aim Slingshot Trajectory',
        desc: 'Drag your finger or move your mouse to aim the dotted trajectory line. Bounce shots off wooden walls for tricky angles.',
      },
      {
        icon: '💥',
        title: '2. Match 3+ Orchard Fruits',
        desc: 'Connect 3 or more matching fruits (apples, pears, plums, lemons, berries) to trigger satisfying fruit pops.',
      },
      {
        icon: '🧺',
        title: '3. Drop Orphan Clusters',
        desc: 'Popping anchor fruits causes unattached bubbles to tumble into harvest baskets at the bottom for bonus points!',
      },
    ],
    controls: {
      desktop: [
        'Mouse Drag & Left Click: Aim trajectory and shoot fruit bubble',
        'Arrow Keys Left / Right: Fine-tune aiming angle',
        'Spacebar: Quick shoot current fruit',
        'M Key: Toggle sound effects',
      ],
      mobile: [
        'Touch & Drag: Adjust aim trajectory anywhere on screen',
        'Release Finger: Shoot fruit bubble instantly with zero delay',
      ],
    },
    proTip: 'Look for thin branches near the top of the board. Popping a small cluster that supports many bubbles will drop the entire group into your harvest baskets!',
  },
  'pasture-sheep-jump': {
    title: 'Pasture Sheep Jump: Cloud Leap',
    subtitle: 'Endless Vertical Bouncing Platformer',
    mascot: '🐑☁️',
    themeColor: 'from-sky-500 via-indigo-600 to-amber-600',
    goal: 'Bounce Barnaby the fluffy sheep across floating platforms and climb as high as possible into the sky!',
    steps: [
      {
        icon: '🐑',
        title: '1. Automatic Bouncing Jump',
        desc: 'Barnaby bounces automatically whenever his hooves touch down on a platform from above.',
      },
      {
        icon: '🌾',
        title: '2. Spring Bales & Moving Clouds',
        desc: 'Land on golden spring bales for massive super leaps! Watch out for moving cloud platforms and brittle twigs.',
      },
      {
        icon: '🔔',
        title: '3. Collect Golden Wool Bells',
        desc: 'Grab floating golden bells along your ascent for 200 bonus points each and climb past altitude milestones!',
      },
    ],
    controls: {
      desktop: [
        'Arrow Keys or A/D: Steer Barnaby left and right in mid-air',
        'Screen Wraparound: Jump off the left edge to reappear on the right',
        'M Key: Toggle sound effects',
        'R Key: Quick restart after a fall',
      ],
      mobile: [
        'Touch & Drag: Slide finger left or right to steer sheep smoothly',
        'Tilt / Swipe: Instant zero-latency response on all mobile screens',
      ],
    },
    proTip: 'Use screen wraparound to your advantage! If a platform is far on the left edge, hopping off the right side of the screen can land you right on top of it.',
  },
  'hungry-piggy': {
    title: 'Hungry Piggy: Farmyard Chomper',
    subtitle: '60-Second Timed Arena Growth Rush',
    mascot: '🐷🍎',
    themeColor: 'from-pink-500 via-rose-600 to-amber-600',
    goal: 'Steer Barnaby around the farmyard, eat treats smaller than you to grow bigger, and reach the Boss tier before time expires!',
    steps: [
      {
        icon: '🍎',
        title: '1. Start with Small Treats',
        desc: 'Chomp small acorns, red apples, and carrots to earn points and kickstart your growth bar.',
      },
      {
        icon: '📦',
        title: '2. Grow into Bigger Tiers',
        desc: 'Advance through Little Piglet, Chubby Porker, Big Hog, and Mega Boss to swallow crates, hay bales, and giant tractors!',
      },
      {
        icon: '⚡',
        title: '3. Build Rapid Combo Streaks',
        desc: 'Eat items rapidly within 2 seconds to unlock up to 4X point multipliers and smash high score records.',
      },
    ],
    controls: {
      desktop: [
        'W/A/S/D or Arrow Keys: Steer Barnaby across the pasture',
        'Mouse Pointer: Guide piggy smoothly in any direction',
        'M Key: Toggle crunch & oink sound effects',
        'Spacebar: Tap to restart after game over',
      ],
      mobile: [
        'Touch & Drag: Slide finger anywhere on screen to steer',
        'Zero-Delay Touch Response with live analog direction arrow',
      ],
    },
    proTip: 'Target tight clusters of small fruit early on to level up quickly. Once you reach Tier 3 and 4, rush toward tractors and silos for huge 200+ point bonuses!',
  },
  'duck-pond-sort': {
    title: 'Duck Pond Sort: Water Lily Float',
    subtitle: 'Calm Color Sorting Puzzle',
    mascot: '🦆🌸',
    themeColor: 'from-teal-600 via-sky-600 to-emerald-700',
    goal: 'Sort cute colored rubber ducks into matching farm pond docks until all colors are separated!',
    steps: [
      {
        icon: '👆',
        title: '1. Tap Source Dock',
        desc: 'Click or tap any pond dock with ducks to lift the top matching duckies into a swimming hover.',
      },
      {
        icon: '🌊',
        title: '2. Tap Target Dock',
        desc: 'Tap an empty dock bay or a dock whose top duck matches your lifted color to move them over.',
      },
      {
        icon: '🎉',
        title: '3. Clear All Color Groups',
        desc: 'Group four ducks of the same color into their own dock to complete the stage and advance.',
      },
    ],
    controls: {
      desktop: [
        'Left Click: Select source dock then target dock',
        'U Key: Undo previous duck move',
        'R Key: Restart current pond level',
        'M Key: Toggle soothing pond sounds and quacks',
      ],
      mobile: [
        'Tap Docks: Instant touch selection and move',
        'Undo Button: Rewind any missteps cleanly',
      ],
    },
    proTip: 'Keep at least one empty buffer dock open as long as possible. It serves as your temporary parking spot while untangling mixed duck columns!',
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
    analytics.gameStarted(gameId, { source: 'intro_modal' });
    onClose();
  };

  if (!isOpen) return null;

  const tabClass = (tab: 'guide' | 'controls') =>
    `h-9 px-4 rounded-full text-sm font-bold transition-colors cursor-pointer ${
      activeTab === tab ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
    }`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-modal-title"
      className="fixed inset-0 z-50 bg-ink/55 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div className="relative w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl shadow-lift flex flex-col max-h-[92vh] overflow-hidden text-ink">
        <div className="p-5 sm:p-6 pb-3 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-tint flex items-center justify-center text-3xl select-none shrink-0" aria-hidden="true">
            {intro.mascot}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-brand-deep">How to play</p>
            <h2 id="intro-modal-title" className="font-display text-xl sm:text-2xl font-semibold leading-tight">
              {intro.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 -mr-1 -mt-1 rounded-full text-ink-soft hover:text-ink hover:bg-paper flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-6 flex gap-1" role="tablist">
          <button role="tab" aria-selected={activeTab === 'guide'} onClick={() => setActiveTab('guide')} className={tabClass('guide')}>
            Steps
          </button>
          <button role="tab" aria-selected={activeTab === 'controls'} onClick={() => setActiveTab('controls')} className={tabClass('controls')}>
            Controls & tips
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <p className="text-sm leading-relaxed p-3.5 rounded-2xl bg-paper">
            <span className="font-bold">Goal: </span>
            {intro.goal}
          </p>

          {activeTab === 'guide' ? (
            <ol className="space-y-3">
              {intro.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-brand-tint text-brand-deep font-display font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm leading-relaxed">
                    <span className="block font-bold">{step.title.replace(/^\d+\.\s*/, '')}</span>
                    <span className="text-ink-soft">{step.desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="flex items-center gap-2 font-bold mb-1.5">
                  <Monitor className="w-4 h-4 text-ink-soft" /> Computer
                </h3>
                <ul className="space-y-1 text-ink-soft list-disc pl-5">
                  {intro.controls.desktop.map((ctrl, i) => (
                    <li key={i}>{ctrl}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-bold mb-1.5">
                  <Smartphone className="w-4 h-4 text-ink-soft" /> Phone & tablet
                </h3>
                <ul className="space-y-1 text-ink-soft list-disc pl-5">
                  {intro.controls.mobile.map((ctrl, i) => (
                    <li key={i}>{ctrl}</li>
                  ))}
                </ul>
              </div>
              <p className="flex gap-2 p-3 rounded-xl bg-paper leading-relaxed">
                <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-brand" />
                <span>{intro.proTip}</span>
              </p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 border-t border-line flex items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs text-ink-soft cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded accent-brand"
            />
            <span>Don't show again</span>
          </label>
          <button
            onClick={handleStartGame}
            className="h-12 px-7 rounded-full bg-brand hover:bg-brand-deep text-white font-display font-semibold text-lg flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Play</span>
          </button>
        </div>
      </div>
    </div>
  );
};
