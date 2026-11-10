import type { GameMetadata } from './gamesRegistry';

export interface TagHubConfig {
  slug: string;
  name: string;
  shortLabel: string;
  emoji: string;
  route: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  description: string;
  directAnswer: string;
  filter: (game: GameMetadata) => boolean;
  faqs: Array<{ question: string; answer: string }>;
}

const hasAny = (game: GameMetadata, terms: string[]): boolean => {
  const hay = [
    game.id,
    game.slug,
    game.title,
    game.tagline,
    game.description,
    ...(game.tags || []),
  ]
    .join(' ')
    .toLowerCase();
  return terms.some((t) => hay.includes(t.toLowerCase()));
};

export const TAG_HUBS: TagHubConfig[] = [
  {
    slug: 'dog-games',
    name: 'Dog & Puppy Games',
    shortLabel: 'Dog Games',
    emoji: '🐶',
    route: '/category/dog-games/',
    metaTitle: 'Free Online Dog Games — Corgi & Puppy Games | No Download',
    metaDescription:
      'Play free online dog games in your browser! Slide corgis in Dog Parking, care for puppies in Virtual Pet, herd sheep, and solve dog puzzles with no download.',
    h1: 'Free Online Dog & Puppy Games 🐶',
    description:
      'Play with corgis, border collies, pugs, and golden puppies right in your browser. Slide dogs out of traffic jams, care for a virtual puppy, or herd sheep across the pasture.',
    directAnswer:
      'Free online dog games on Pawcade star corgis, puppies, and sheepdogs in instant browser puzzles and pet sims. Top dog titles include Dog Parking, Virtual Puppy Pet, Corgi Mini Golf, Sheep Stampede, and Barnyard Word Connect—all playable on phone and computer with no download.',
    filter: (g) =>
      hasAny(g, ['dog', 'corgi', 'puppy', 'buster', 'hound', 'pug', 'dalmatian', 'collie']) ||
      ['dog-parking', 'virtual-puppy-pet', 'corgi-mini-golf', 'sheep-stampede', 'barnyard-word-connect', 'duck-hunt-classic'].includes(g.id),
    faqs: [
      {
        question: 'What are the best free online dog games on Pawcade?',
        answer:
          'Start with Dog Parking for sliding block puzzles, Virtual Puppy Pet to feed and wash a puppy, Corgi Mini Golf for 9 holes of pasture golf, and Sheep Stampede to herd flocks.',
      },
      {
        question: 'Can I play these dog games on a phone or Chromebook without downloading?',
        answer:
          'Yes. Every dog game runs in your browser with touch and mouse controls, so there is nothing to install.',
      },
      {
        question: 'Are Pawcade dog games safe for kids?',
        answer:
          'Yes. There are no accounts, no chat, and no in-app purchases, and your progress saves locally in your browser.',
      },
    ],
  },
  {
    slug: 'cat-games',
    name: 'Cat & Kitten Games',
    shortLabel: 'Cat Games',
    emoji: '🐱',
    route: '/category/cat-games/',
    metaTitle: 'Free Online Cat Games — Cute Kitten Puzzles | No Download',
    metaDescription:
      'Play free cat games and kitten puzzles online! Untangle felines in Cat Parking, run a cozy Cat Cafe, drop bouncy kitties in Sushi Cat, and more—no download.',
    h1: 'Free Online Cat & Kitten Games 🐱',
    description:
      'Cozy puzzles and arcade games starring sleepy tabbies, café kittens, and bouncy sushi cats. Every cat game loads straight in your browser on mobile and desktop.',
    directAnswer:
      'Pawcade cat games let you slide sleepy kittens in Cat Parking, serve pastries in Cat Cafe Rush, bounce chubby felines in Sushi Cat Pachinko, and match kittens in Pet Memory Match. Every game is free and plays in your browser with no download.',
    filter: (g) =>
      hasAny(g, ['cat ', 'cats', 'kitten', 'kitty', 'feline', 'meow', 'tabby', 'sushi-cat', 'cat-parking', 'cat-cafe']) ||
      ['cat-parking', 'cat-cafe-rush', 'sushi-kitty-pachinko', 'pet-memory-match', 'farm-block-blast', 'pet-candy-crush', 'virtual-puppy-pet'].includes(g.id),
    faqs: [
      {
        question: 'What is Cat Parking (CatParking)?',
        answer:
          'Cat Parking is a sliding puzzle game where you move sleepy horizontal and vertical cats on a 6x6 meadow grid so Luna the Star Cat can reach the exit gate.',
      },
      {
        question: 'Which cat game is like a restaurant or cafe simulator?',
        answer:
          'Cat Cafe Rush lets you seat tabby and calico guests, serve warm drinks, and upgrade a sunny kitty tearoom.',
      },
      {
        question: 'Do I need an account to save my cat game levels?',
        answer:
          'No. Completed levels and high scores are saved automatically in your browser storage.',
      },
    ],
  },
  {
    slug: 'duck-games',
    name: 'Duck & Pond Games',
    shortLabel: 'Duck Games',
    emoji: '🦆',
    route: '/category/duck-games/',
    metaTitle: 'Free Online Duck Games — Duck Hunt & Ducklings | No Download',
    metaDescription:
      'Play free duck games online! Aim in Duck Hunt Classic, rescue lost chicks in Ducklings.io, train racers in Duck Life, and jump in Duck Runner—no download.',
    h1: 'Free Online Duck & Pond Games 🦆',
    description:
      'Swim across reed marshes, rescue yellow ducklings, train champion racers, and test your aim in classic duck games built for instant browser play.',
    directAnswer:
      'Pawcade duck games cover retro shooting in Duck Hunt Classic, pond collection in Ducklings.io, pet training in Duck Life, endless jumping in Duck Runner, and sorting puzzles in Duck Pond Sort. All play free with no install.',
    filter: (g) =>
      hasAny(g, ['duck', 'duckling', 'mallard', 'quack']) ||
      [
        'duck-hunt-classic',
        'duckling-pond-rescue',
        'duck-training-champion',
        'duck-runner',
        'duck-pond-sort',
        'duck-water-slide',
        'duck-archery-range',
        'frozen-pasture-dash',
      ].includes(g.id),
    faqs: [
      {
        question: 'Can I play a free Duck Hunt game online without a console?',
        answer:
          'Yes. Duck Hunt Classic recreates the retro marsh shooter in your browser—tap or click flying mallards before they escape across 10 fast rounds.',
      },
      {
        question: 'How does Ducklings.io work on Pawcade?',
        answer:
          'You steer a mama duck across a busy lake, rescue stray ducklings in a trailing line, dodge motorboats, and lead your flock home to upgrade your nest and unlock hats.',
      },
      {
        question: 'What is Duck Life (Duck Training Champion)?',
        answer:
          'Duck Life is a training and racing game where you raise a duckling in running, flying, and swimming mini-games before entering the barnyard championship.',
      },
    ],
  },
  {
    slug: 'io-games',
    name: '.io & Arena Games',
    shortLabel: '.io Games',
    emoji: '🌐',
    route: '/category/io-games/',
    metaTitle: 'Free .io Games Online — Paper.io & Slither.io | No Download',
    metaDescription:
      'Play free .io games online with no download! Claim turf in Paper.io, grow giant worms in Slither.io, swallow barns in Hole.io, and rescue in Ducklings.io.',
    h1: 'Free .io & Arena Browser Games 🌐',
    description:
      'Capture pasture territory, grow the longest worm in the meadow, swallow whole barns, and outsmart AI rivals in fast-loading .io arena games.',
    directAnswer:
      'Pawcade .io games let you jump straight into arena action with smart AI bots and zero lag. Play Pasture Paper.io, Barnyard Slither.io, Pasture Hole.io, Ducklings.io, Barnyard Snake, and Sheep Stampede free in your browser.',
    filter: (g) =>
      hasAny(g, ['.io', 'io game', 'slither', 'paper.io', 'hole.io', 'ducklings.io', 'snake', 'arena']) ||
      [
        'pasture-paper-io',
        'slither-pasture-io',
        'pasture-hole-io',
        'duckling-pond-rescue',
        'barnyard-snake',
        'sheep-stampede',
        'barnyard-roof-duel',
        'basket-random',
        'bad-ice-cream',
        'ragdoll-hit',
      ].includes(g.id),
    faqs: [
      {
        question: 'Which .io games can I play free on Pawcade?',
        answer:
          'You can play Pasture Paper.io (turf capture), Barnyard Slither.io (worm arena), Pasture Hole.io (black hole city eater), and Ducklings.io (pond rescue).',
      },
      {
        question: 'Do Pawcade .io games work on school Chromebooks and mobile phones?',
        answer:
          'Yes. They run locally in HTML5 Canvas against responsive AI rivals, so they load in under a second with zero lag.',
      },
      {
        question: 'How do you claim territory in Paper.io?',
        answer:
          'Leave your home turf to draw a trail across the meadow, then loop back into your territory to fill the enclosed area—without letting a rival cross your open tail.',
      },
    ],
  },
  {
    slug: 'merge-games',
    name: 'Merge & 2048 Games',
    shortLabel: 'Merge & 2048',
    emoji: '🔢',
    route: '/category/merge-games/',
    metaTitle: 'Free Merge & 2048 Games Online — Animal 2048 | No Download',
    metaDescription:
      'Play free 2048 animals and fruit merge games online! Slide tiles in Animal 2048, drop critters in Suika Drop, and combine farm crops with no download needed.',
    h1: 'Free Merge & 2048 Browser Games 🔢',
    description:
      'Slide matching animals to reach the 2048 crown, drop bouncing critters in Suika physics jars, and evolve farm crops tier by tier.',
    directAnswer:
      'Pawcade merge and 2048 games combine number strategy with animal evolution. Top titles include Animal 2048 (2048 Animals), Animal Suika Drop, Farm Crop Evolution, and Farm Tile Triple—all free with no download.',
    filter: (g) =>
      hasAny(g, ['2048', 'merge', 'suika', 'evolution', 'combine', 'triple']) ||
      [
        'animal-2048',
        'animal-suika-drop',
        'farm-crop-evolution',
        'farm-tile-triple',
        'farm-block-blast',
        'pet-candy-crush',
        'grain-sand-fall',
        'farm-block-drop',
        'farm-tetris',
      ].includes(g.id),
    faqs: [
      {
        question: 'How do you win in Animal 2048 (2048 Animals)?',
        answer:
          'Swipe or press Arrow keys to slide all animal tiles across the 4x4 grid. Matching pairs merge into the next animal tier—from Mouse (2) all the way up to Elephant (2048).',
      },
      {
        question: 'What is Animal Suika Drop?',
        answer:
          'Animal Suika Drop is a Watermelon Game style physics puzzler where you drop round critters into a jar and merge identical pairs into bigger animals without overflowing the top line.',
      },
      {
        question: 'Can I undo a mistake in Animal 2048?',
        answer:
          'Yes. Animal 2048 includes a built-in Undo button and an evolution ladder guide so you can plan your merges.',
      },
    ],
  },
  {
    slug: 'idle-games',
    name: 'Idle, Clicker & Tycoon Games',
    shortLabel: 'Idle & Tycoon',
    emoji: '🪙',
    route: '/category/idle-games/',
    metaTitle: 'Free Idle & Clicker Games — Capybara & Farm | No Download',
    metaDescription:
      'Play free idle clicker and tycoon games online! Tap capybaras in Capybara Clicker, run stalls in Farm Mini Mart, and automate harvests in Farm Animal Clicker.',
    h1: 'Free Idle, Clicker & Tycoon Games 🪙',
    description:
      'Tap to harvest, hire helper dogs, unlock automated barns, and grow bustling country markets with saved browser progress.',
    directAnswer:
      'Pawcade idle and tycoon games let you build thriving farms and shops at your own pace. Play Capybara Clicker, Farm Animal Clicker, Farm Mini Mart, Cat Cafe Rush, Penguin Diner, and Capybara Spa Rush free in your browser.',
    filter: (g) =>
      hasAny(g, ['idle', 'clicker', 'tycoon', 'mini mart', 'cafe', 'diner', 'spa', 'shop', 'coin pusher']) ||
      [
        'capybara-clicker',
        'farm-animal-clicker',
        'farm-mini-mart',
        'cat-cafe-rush',
        'penguin-pasture-diner',
        'capybara-spa-rush',
        'piggy-coin-pusher',
        'gold-miner',
        'chef-rat-rush',
        'farm-boba-tea',
        'barnyard-ice-cream',
      ].includes(g.id),
    faqs: [
      {
        question: 'What is the difference between Capybara Clicker and Farm Animal Clicker?',
        answer:
          'Capybara Clicker focuses on tapping a chill capybara to unlock outfits and yuzu baths, while Farm Animal Clicker lets you switch between 9 barnyard animals and build automated silos.',
      },
      {
        question: 'Does my idle tycoon money stay saved when I close the tab?',
        answer:
          'Yes. Coins, unlocked buildings, and helper upgrades are saved in your browser localStorage.',
      },
      {
        question: 'How do you hire helpers in Farm Mini Mart?',
        answer:
          'Stand on the glowing coin pads on the market floor to invest your checkout earnings into unlocking the Farmhand Dog and automated Cashier.',
      },
    ],
  },
  {
    slug: 'parking-games',
    name: 'Parking Jam & Driving Games',
    shortLabel: 'Parking & Driving',
    emoji: '🚜',
    route: '/category/parking-games/',
    metaTitle: 'Free Parking & Driving Games — Cars & Tractors | No Download',
    metaDescription:
      'Play free parking jam and driving games online! Slide corgis in Dog Parking, balance eggs in Eggy Car, race stunts in Moto X3M, and clear Sheep Cart Jam.',
    h1: 'Free Parking Jam & Driving Games 🚜',
    description:
      'Unblock gridlocked pastures, steer tractors over bumpy hills, balance fragile eggs in carts, and drift karts around barnyard tracks.',
    directAnswer:
      'Pawcade parking and driving games mix sliding traffic puzzles with physics stunt driving. Top picks include Dog Parking, Cat Parking, Sheep Cart Jam, Eggy Car, Tractor Hill Climb, Moto X3M Tractor Trials, and Barnyard Kart Drift.',
    filter: (g) =>
      hasAny(g, ['parking', 'tractor', 'car ', 'cart', 'kart', 'drift', 'driving', 'moto', 'truck', 'hill climb', 'tap away']) ||
      [
        'dog-parking',
        'cat-parking',
        'animal-farm-parking',
        'sheep-cart-jam',
        'critter-tap-away',
        'barnyard-egg-cart',
        'tractor-hill-climb',
        'tractor-stunt-trials',
        'barnyard-kart-drift',
        'barnyard-truck-jumper',
        'crop-mower-harvest',
      ].includes(g.id),
    faqs: [
      {
        question: 'Which game is like Parking Jam or Bus Jam?',
        answer:
          'Sheep Cart Jam is a Bus Jam style puzzle where you tap unblocked sheep out of a crowded pen so they board matching 3-seat farm trailers.',
      },
      {
        question: 'How do you keep the egg from cracking in Eggy Car?',
        answer:
          'Feather the gas and brake pedals gently on steep hills instead of holding full throttle, and grab Freeze power-ups to lock the egg in place over big bumps.',
      },
      {
        question: 'Can I play Dog Parking and Cat Parking on touchscreens?',
        answer:
          'Yes. Drag any animal directly along its lane with your finger to open the path to the exit gate.',
      },
    ],
  },
  {
    slug: 'runner-games',
    name: 'Endless Runner & Jump Games',
    shortLabel: 'Runner & Jump',
    emoji: '🏃',
    route: '/category/runner-games/',
    metaTitle: 'Free Endless Runner & Jump Games Online | No Download',
    metaDescription:
      'Play free endless runner and platformer games online! Leap across trucks in Cluster Rush, dash in Geometry Dash, sprint in Subway Run, and hop in Crossy Road.',
    h1: 'Free Endless Runner & Platformer Games 🏃',
    description:
      'Sprint down 3-lane farm tracks, leap from moving truck roofs, vault over geometric spikes, and climb towering barns with instant one-tap controls.',
    directAnswer:
      'Pawcade runner and jump games deliver 60 FPS reflex platforming in your browser. Play Cluster Rush (Truck Jumper), Barnyard Dash (Geometry Dash), Pasture Subway Run, Run 3 Tunnel Runner, Crossy Chicken, Vex 5, Ice Dodo, and Slope free online.',
    filter: (g) =>
      hasAny(g, ['runner', 'endless', 'platformer', 'parkour', 'jump', 'dash', 'crossy', 'subway', 'slope', 'tunnel']) ||
      [
        'barnyard-truck-jumper',
        'barnyard-geometry-dash',
        'pasture-subway-run',
        'barnyard-tunnel-runner',
        'crossy-chicken',
        'duck-runner',
        'flappy-chicken',
        'barnyard-ninja-chick',
        'frozen-pasture-dash',
        'tiny-pig-big-tower',
        'barnyard-doodle-jump',
        'slope',
        'level-devil',
        'barnyard-frog-hop',
        'bunny-hop-cross',
        'sheep-hurdle-sprint',
      ].includes(g.id),
    faqs: [
      {
        question: 'What is the truck jumping game on Pawcade?',
        answer:
          'Cluster Rush: Truck Jumper lets you leap across a convoy of speeding farm trucks, double-jump over gaps, and duck under highway signs.',
      },
      {
        question: 'Which runner game is similar to Subway Surfers or Run 3?',
        answer:
          'Pasture Subway Run is a 3-lane endless runner where you dodge hay trains and grab magnets, while Barnyard Tunnel Runner lets you rotate gravity around a 3D space tunnel.',
      },
      {
        question: 'Can I play Geometry Dash and Crossy Chicken with one key?',
        answer:
          'Yes. Barnyard Dash uses Space, Up Arrow, or tap to jump and fly, and Crossy Chicken uses Arrow keys or taps to hop across roads and rivers.',
      },
    ],
  },
  {
    slug: 'solitaire-games',
    name: 'Solitaire, Mahjong & Board Games',
    shortLabel: 'Solitaire & Board',
    emoji: '🃏',
    route: '/category/solitaire-games/',
    metaTitle: 'Free Solitaire, Mahjong & Card Games Online | No Download',
    metaDescription:
      'Play free solitaire, mahjong, and board games online! Clear cards in TriPeaks and Pyramid Solitaire, match tiles in Farm Mahjong, or drop discs in Connect 4.',
    h1: 'Free Solitaire, Mahjong & Classic Board Games 🃏',
    description:
      'Relax with TriPeaks and Pyramid Solitaire, pair layered tiles in Farm Mahjong, or challenge smart AI in Connect 4 and Checkers.',
    directAnswer:
      'Pawcade card, tile, and board games include Farm TriPeaks Solitaire, Pyramid Solitaire Harvest, Farm Mahjong Solitaire, Mahjong Connect, Connect 4, Barnyard Checkers, Sudoku, Nonogram, and Minesweeper—all free with undo and hint buttons.',
    filter: (g) =>
      hasAny(g, ['solitaire', 'mahjong', 'card', 'connect 4', 'checkers', 'board', 'sudoku', 'nonogram', 'minesweeper']) ||
      [
        'farm-tripeaks-solitaire',
        'pyramid-solitaire-harvest',
        'farm-mahjong',
        'farm-mahjong-connect',
        'barnyard-connect-four',
        'barnyard-checkers',
        'pet-memory-match',
        'farm-sudoku-grid',
        'pasture-nonogram',
        'pasture-minesweeper',
        'farm-tile-triple',
      ].includes(g.id),
    faqs: [
      {
        question: 'How do you play Pyramid Solitaire vs TriPeaks Solitaire?',
        answer:
          'In Pyramid Solitaire you pair two uncovered cards that add up to 13 (Kings clear alone). In TriPeaks Solitaire you tap cards that are one rank higher or lower than your active waste card.',
      },
      {
        question: 'Are all Farm Mahjong boards solvable?',
        answer:
          'Yes, and you have built-in Hint, Undo, and Shuffle buttons if you ever want to rearrange remaining tiles.',
      },
      {
        question: 'Does Connect 4 have both 1-player AI and 2-player modes?',
        answer:
          'Yes. You can play against three AI difficulty levels or pass-and-play locally with a friend on the same screen.',
      },
    ],
  },
  {
    slug: 'word-games',
    name: 'Word, Trivia & Brain Games',
    shortLabel: 'Word & Brain',
    emoji: '🔤',
    route: '/category/word-games/',
    metaTitle: 'Free Online Word Games — Word Guess & Connect | No Download',
    metaDescription:
      'Play free word games and brain teasers online! Solve 5-letter puzzles in Barnyard Word Guess, swipe letters in Word Connect, and hunt words in Word Search.',
    h1: 'Free Online Word & Brain Puzzle Games 🔤',
    description:
      'Deduce 5-letter mystery words with green and yellow tiles, connect letter wheels into crosswords, and sharpen your memory with quick daily brain games.',
    directAnswer:
      'Pawcade word and brain games feature Barnyard Word Guess (5-letter Wordle style), Barnyard Word Connect (crossword wheel), Barnyard Word Search, Spot the Difference, Farm Sudoku, Pasture Nonogram, and Animal Tangram Fit.',
    filter: (g) =>
      hasAny(g, ['word', 'crossword', 'letter', 'sudoku', 'nonogram', 'tangram', 'spot the difference', 'memory', 'simon']) ||
      [
        'barnyard-word-guess',
        'barnyard-word-connect',
        'barnyard-word-search',
        'barnyard-spot-difference',
        'farm-sudoku-grid',
        'pasture-nonogram',
        'animal-tangram-fit',
        'pet-memory-match',
        'barnyard-simon-sound',
        'farm-pipe-flow',
        'koi-pond-zen',
      ].includes(g.id),
    faqs: [
      {
        question: 'Can I play unlimited rounds in Barnyard Word Guess?',
        answer:
          'Yes. Unlike once-a-day word puzzles, Barnyard Word Guess lets you play unlimited 5-letter rounds back-to-back to build your win streak.',
      },
      {
        question: 'How does the letter wheel work in Barnyard Word Connect?',
        answer:
          'Drag your finger or mouse across the letters on the wooden wheel to spell words that fill the crossword grid above, plus earn bonus treats for extra valid words.',
      },
      {
        question: 'Do word games work with a physical keyboard on desktop?',
        answer:
          'Yes. In Barnyard Word Guess you can type letters directly on your keyboard and press Enter to submit or Backspace to edit.',
      },
    ],
  },
  {
    slug: 'physics-games',
    name: 'Physics & Skill Games',
    shortLabel: 'Physics & Skill',
    emoji: '🎯',
    route: '/category/physics-games/',
    metaTitle: 'Free Physics & Skill Games Online — No Download | Pawcade',
    metaDescription:
      'Play free physics games online! Swing in Stickman Hook, flip bottles in Bottle Flip 3D, pour milk in Happy Glass, launch slingshots in Egg Buster, and more.',
    h1: 'Free Physics, Slingshot & Skill Games 🎯',
    description:
      'Grapple past barn rafters, flip milk bottles onto shelves, draw lines to guide flowing milk, cut ropes to feed hungry piglets, and demolish fox towers.',
    directAnswer:
      'Pawcade physics games run real-time gravity, pendulum, and fluid simulations in HTML5 Canvas. Fan favorites include Stickman Hook, Milk Bottle Flip 3D, Happy Milk Pail, Egg Buster, Hungry Piggy Rope Cut, Ragdoll Hit, and Helix Silo Drop.',
    filter: (g) =>
      hasAny(g, ['physics', 'ragdoll', 'hook', 'flip', 'slingshot', 'cannon', 'plinko', 'pachinko', 'pinball', 'rope', 'stack', 'helix', 'archery', 'golf']) ||
      [
        'stickman-hook',
        'milk-bottle-flip',
        'happy-milk-pail',
        'egg-buster',
        'barnyard-rope-cut',
        'piggy-cannon-blast',
        'ragdoll-hit',
        'helix-silo-drop',
        'barnyard-hay-stack',
        'barnyard-tower',
        'milk-bottle-plinko',
        'sushi-kitty-pachinko',
        'barnyard-pinball',
        'duck-archery-range',
        'corgi-mini-golf',
        'grain-sand-fall',
        'barnyard-pin-pull',
      ].includes(g.id),
    faqs: [
      {
        question: 'Which physics game is like Cut the Rope or Happy Glass?',
        answer:
          'Barnyard Rope Cut lets you slice swinging ropes so golden apples drop into a hungry piglet’s mouth, while Happy Milk Pail lets you draw pencil lines to guide milk into a glass.',
      },
      {
        question: 'How do you get a double flip in Milk Bottle Flip 3D?',
        answer:
          'Swipe higher and faster to launch the milk bottle with extra spin so it rotates twice before landing flat on the next shelf.',
      },
      {
        question: 'What is Grain Sand Fall?',
        answer:
          'Grain Sand Fall is a Sand Tetris physics game where falling blocks dissolve into thousands of flowing sand grains that clear whenever a color connects from the left wall to the right wall.',
      },
    ],
  },
  {
    slug: 'cooking-games',
    name: 'Cooking, Cafe & Food Games',
    shortLabel: 'Cooking & Cafe',
    emoji: '🍳',
    route: '/category/cooking-games/',
    metaTitle: 'Free Cooking & Restaurant Games Online | No Download',
    metaDescription:
      'Play free cooking, diner, and cafe games online! Chop and sizzle in Chef Rat Rush, serve skaters in Penguin Diner, brew Boba Tea, and scoop Barnyard Ice Cream.',
    h1: 'Free Cooking, Cafe & Food Games 🍳',
    description:
      'Chop fresh veggies, sizzle skillets before they burn, serve roller-skating penguins, blend fruit boba tea, and scoop towering ice cream cones.',
    directAnswer:
      'Pawcade cooking and food games include Chef Rat Rush, Penguin Diner, Cat Cafe Rush, Farm Boba Tea Shop, Barnyard Ice Cream Scoop, Barnyard Popcorn Popper, Barnyard Fruit Slicer, and Hungry Piggy Feast.',
    filter: (g) =>
      hasAny(g, ['cooking', 'chef', 'diner', 'cafe', 'boba', 'ice cream', 'popcorn', 'fruit', 'sushi', 'kitchen', 'feast']) ||
      [
        'chef-rat-rush',
        'penguin-pasture-diner',
        'cat-cafe-rush',
        'farm-boba-tea',
        'barnyard-ice-cream',
        'barnyard-popcorn-popper',
        'barnyard-fruit-slicer',
        'hungry-piggy-feast',
        'sushi-kitty-pachinko',
        'farm-mini-mart',
        'farm-pantry-sort',
      ].includes(g.id),
    faqs: [
      {
        question: 'How do you stop pans from burning in Chef Rat Rush?',
        answer:
          'Watch the green cooking bar above each copper skillet and tap the pan as soon as it finishes sizzling to plate the dish and ring the service bell for a speed tip.',
      },
      {
        question: 'What is Hungry Piggy Feast (Hungry Pig Game)?',
        answer:
          'Hungry Piggy Feast is a fast food-catching arcade game where you slide a hungry piglet left and right to gobble falling apples, corn, and truffles while dodging rotten cores.',
      },
      {
        question: 'Can I play Penguin Diner and Boba Tea Shop on a tablet?',
        answer:
          'Yes. All cooking and cafe stations are designed for single-tap touch service on phones, tablets, and computers.',
      },
    ],
  },
  {
    slug: 'bubble-shooter',
    name: 'Bubble Shooter, Sort & Match-3 Games',
    shortLabel: 'Bubble & Match-3',
    emoji: '🫧',
    route: '/category/bubble-shooter/',
    metaTitle: 'Free Bubble Shooter & Match-3 Games Online | No Download',
    metaDescription:
      'Play free bubble shooter, Zuma marble pop, and match-3 games online! Pop fruit in Farm Fruit Bubble, swap critters in Farm Animal Match, and sort colors.',
    h1: 'Free Bubble Shooter, Sort & Match-3 Games 🫧',
    description:
      'Aim and pop fruit bubbles, swap farm animals to trigger dynamite combos, pour colorful water tubes, and clear 8x8 block boards.',
    directAnswer:
      'Pawcade bubble, sorting, and match-3 games include Farm Fruit Bubble (Farm Fruit Pop), Pasture Marble Pop (Zuma style), Farm Animal Match, Farm Block Blast, Water Sort, Farm Pantry Sort, and Duck Pond Sort.',
    filter: (g) =>
      hasAny(g, ['bubble', 'match-3', 'match 3', 'marble', 'zuma', 'sort', 'block blast', 'tetris', 'block drop', 'color switch']) ||
      [
        'farm-fruit-bubble',
        'pasture-marble-pop',
        'pet-candy-crush',
        'farm-block-blast',
        'farm-tetris',
        'water-sort',
        'farm-pantry-sort',
        'duck-pond-sort',
        'sheep-sorter-gate',
        'horseshoe-twist',
        'barnyard-color-switch',
      ].includes(g.id),
    faqs: [
      {
        question: 'How do you create special bombs in Farm Animal Match?',
        answer:
          'Match 4 animals in a line for a Row/Column Rocket, match a 2x2 square for a TNT Crate, match 5 in an L or T shape for a 3x3 Barrel Bomb, or match 5 in a row for a Rainbow Star.',
      },
      {
        question: 'What is Farm Fruit Pop (Farm Fruit Bubble)?',
        answer:
          'Farm Fruit Bubble is an orchard bubble shooter where you aim a cannon with dotted trajectory lines to pop clusters of 3 or more matching apples, berries, and oranges.',
      },
      {
        question: 'Which sorting games are available on Pawcade?',
        answer:
          'Try Water Sort for liquid tube pouring, Farm Pantry Sort for organizing grocery shelves, Duck Pond Sort for grouping colored ducks, and Sheep Sorter Gate for reflex pen sorting.',
      },
    ],
  },
  {
    slug: 'retro-arcade',
    name: 'Classic Retro Arcade Games',
    shortLabel: 'Retro Arcade',
    emoji: '👾',
    route: '/category/retro-arcade/',
    metaTitle: 'Free Retro Arcade Games Online — Classic Hits | No Download',
    metaDescription:
      'Play free retro arcade games online! Enjoy Duck Hunt Classic, Pac Chick maze chase, Whack-a-Mole Gopher Garden, Brick Breaker, Pinball, and Snake in browser.',
    h1: 'Free Retro Arcade Classics Online 👾',
    description:
      'Timeless arcade action reimagined with barnyard charm: light-gun duck hunting, maze chomping, whack-a-mole reflexes, pinball flippers, and brick breaking.',
    directAnswer:
      'Pawcade retro arcade games bring classic cabinet hits into your browser with zero installs: Duck Hunt Classic, Barnyard Pac Chick, Gopher Garden (Whack-a-Mole), Barnyard Snake, Barnyard Brick Breaker, Barnyard Pinball, and Crossy Chicken.',
    filter: (g) =>
      hasAny(g, ['retro', 'classic', 'arcade', 'whack', 'pinball', 'brick breaker', 'pac', 'snake', 'frogger', 'basketball', 'football']) ||
      [
        'duck-hunt-classic',
        'barnyard-pac-chick',
        'gopher-garden',
        'barnyard-snake',
        'barnyard-brick-breaker',
        'barnyard-pinball',
        'crossy-chicken',
        'barnyard-frog-hop',
        'bad-ice-cream',
        'retro-bowl',
        'basket-random',
        'barnyard-basketball',
        'chicken-egg-catcher',
      ].includes(g.id),
    faqs: [
      {
        question: 'What retro games can I play free in my browser on Pawcade?',
        answer:
          'You can play Duck Hunt Classic, Barnyard Pac Chick (Pac-Man style maze), Gopher Garden (Whack-a-Mole), Barnyard Snake, Brick Breaker, Pinball, and Retro Bowl.',
      },
      {
        question: 'How do you play Gopher Garden (Whack-a-Mole)?',
        answer:
          'Tap or click sneaky gophers as they pop out of garden holes to protect your carrots, chain combo multipliers, and avoid hitting friendly bunnies.',
      },
      {
        question: 'Do retro arcade games have sound effects?',
        answer:
          'Yes. Every game uses a built-in Web Audio synthesizer for crisp chiptune fanfares, pops, and arcade sound effects—with a mute toggle in the header.',
      },
    ],
  },
];

export const TAG_HUB_BY_SLUG: Record<string, TagHubConfig> = Object.fromEntries(
  TAG_HUBS.map((h) => [h.slug, h])
);

export const getHubsForGame = (game: GameMetadata): TagHubConfig[] =>
  TAG_HUBS.filter((h) => h.filter(game));

const RECENT_STORAGE_KEY = 'pawcade_recent_games';

export const getRecentGameIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export const recordRecentGame = (gameId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const prev = getRecentGameIds().filter((id) => id !== gameId);
    const next = [gameId, ...prev].slice(0, 8);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota or private browsing restrictions
  }
};
