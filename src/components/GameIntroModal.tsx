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
