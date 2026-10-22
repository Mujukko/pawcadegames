export type FarmElementId =
  | 'barn'
  | 'silo'
  | 'windmill'
  | 'mini-mart'
  | 'duck-pond'
  | 'dog-kennel'
  | 'cat-castle'
  | 'dairy-pasture'
  | 'sweet-mill';

export interface LevelTrackItem {
  levelNumber: number;
  unlocked: boolean;
  completed: boolean;
  stars: number; // 0, 1, 2, 3
  bestScore?: number;
}

export interface FarmBuildingRenovation {
  id: FarmElementId;
  name: string;
  gameTitle: string;
  gameId: string;
  gameRoute: string;
  mascot: string;
  repairStage: number; // 0 = Harap/Kırık, 1 = Onarılmış (1-10), 2 = Geliştirilmiş (11-20), 3 = Efsanevi (21-30)
  maxStage: number; // 3
  brokenVisual: {
    emoji: string;
    label: string;
    description: string;
    flaw: string;
  };
  stages: {
    stage: number;
    name: string;
    emoji: string;
    description: string;
    requiredBracket: string; // e.g. "Seviye 1-10"
    requiredStars: number; // e.g. 24
  }[];
  levels: LevelTrackItem[];
}

export interface FarmRenovationState {
  buildings: Record<FarmElementId, FarmBuildingRenovation>;
  totalStars: number;
  completedRenovations: number;
  lastUpdated: number;
}

const STORAGE_KEY = 'pawcade_farm_renovations_v1';

export const INITIAL_BUILDING_CONFIGS: Record<
  FarmElementId,
  {
    name: string;
    gameTitle: string;
    gameId: string;
    gameRoute: string;
    mascot: string;
    brokenVisual: {
      emoji: string;
      label: string;
      description: string;
      flaw: string;
    };
    stages: {
      stage: number;
      name: string;
      emoji: string;
      description: string;
      requiredBracket: string;
      requiredStars: number;
    }[];
  }
> = {
  barn: {
    name: 'Kırmızı Ahır',
    gameTitle: 'Barn Tetris',
    gameId: 'farm-tetris',
    gameRoute: '/games/farm-tetris/',
    mascot: '🐮',
    brokenVisual: {
      emoji: '🏚️',
      label: 'Harap Kırmızı Ahır',
      description: 'Çatısı çökmüş, tahtaları çatlamış ve kapısı düşmüş eski çiftlik ahırı.',
      flaw: '⚠️ Çatı delik & tahtalar kırık!',
    },
    stages: [
      {
        stage: 1,
        name: 'Onarılmış Sevimli Ahır',
        emoji: '🏠',
        description: 'Taze kırmızı boyalı, yeni kiremitli ve temiz samanlıklı ahır!',
        requiredBracket: 'Seviye 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Genişletilmiş Süt Tesisi',
        emoji: '🚜',
        description: 'Genişletilmiş bölmeler, süt güğümleri ve otomatik ahır lambaları!',
        requiredBracket: 'Seviye 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Büyük Kraliyet Çiftlik Sarayı',
        emoji: '🏰',
        description: 'Altın rüzgar gülü, çiçek saksıları ve efsanevi ahır anıtı!',
        requiredBracket: 'Seviye 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  silo: {
    name: 'Hasat Silosu',
    gameTitle: 'Farm Tetris',
    gameId: 'farm-tetris',
    gameRoute: '/games/farm-tetris/',
    mascot: '🌾',
    brokenVisual: {
      emoji: '📦',
      label: 'Paslı Kırık Silo',
      description: 'Metal sacları delinmiş, kubbesi eğrilmiş ve sarmaşık sarmış terkedilmiş silo.',
      flaw: '⚠️ Metal gövde çatlak & merdiven kırık!',
    },
    stages: [
      {
        stage: 1,
        name: 'Sağlam Çelik Silo',
        emoji: '🏗️',
        description: 'Parlak çelik saclı, sağlam merdivenli temiz tahıl kulesi.',
        requiredBracket: 'Seviye 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Çift Hazneli Hasat Kompleksi',
        emoji: '🎪',
        description: 'Tahıl konveyörü ve altın mısır deposu eklenmiş modern silo.',
        requiredBracket: 'Seviye 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Grand Mega Tarım Silosu',
        emoji: '🏛️',
        description: 'Gümüş kubbeli, hasat çanları çalan zirve silosu!',
        requiredBracket: 'Seviye 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  windmill: {
    name: 'Rüzgar Değirmeni',
    gameTitle: 'Flappy Chicken',
    gameId: 'flappy-chicken',
    gameRoute: '/games/flappy-chicken/',
    mascot: '🐔',
    brokenVisual: {
      emoji: '🪵',
      label: 'Kırık Kanatlı Değirmen',
      description: 'Kanatları kırılmış, çarkı durmuş ve çatısı dökülen eski değirmen.',
      flaw: '⚠️ Pervane kanatları kırık & dönmüyor!',
    },
    stages: [
      {
        stage: 1,
        name: 'Dönen Ahşap Değirmen',
        emoji: '💨',
        description: 'Yenilenmiş ahşap kanatlarıyla rüzgarda neşeyle dönen değirmen.',
        requiredBracket: 'Seviye 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Taş Gövdeli Un Fabrikası',
        emoji: '🪶',
        description: 'Taş mimarili, fenerlerle aydınlatılmış çiftlik değirmeni.',
        requiredBracket: 'Seviye 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Altın Zirve Yel Değirmeni',
        emoji: '✨',
        description: 'Rengarenk festival flamaları ve altın buğday heykelli ulu değirmen!',
        requiredBracket: 'Seviye 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  'mini-mart': {
    name: 'Çiftlik Marketi',
    gameTitle: 'Farm Mini Mart',
    gameId: 'farm-mini-mart',
    gameRoute: '/games/farm-mini-mart/',
    mascot: '🏪',
    brokenVisual: {
      emoji: '🧺',
      label: 'Kırık Tezgahlı Kulübe',
      description: 'Tentesi yırtılmış, kasaları parçalanmış ve camları tahtayla kapatılmış dükkan.',
      flaw: '⚠️ Tente yırtık & raflar kırık!',
    },
    stages: [
      {
        stage: 1,
        name: 'Şirin Köy Marketi',
        emoji: '🏪',
        description: 'Yeşil çizgili tentesi ve taze domates reyonlarıyla açılan bakkal!',
        requiredBracket: 'Seviye 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Çiftlik Süpermarketi',
        emoji: '🏬',
        description: 'Süt soğutucusu, otomatik kasa ve yardımcı köpek personeli!',
        requiredBracket: 'Seviye 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Büyük Tarım Emporiumu',
        emoji: '🏛️',
        description: 'Neon ışıklı, altın yazarkasalı ve gurme fırınlı lüks market sarayı!',
        requiredBracket: 'Seviye 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  'duck-pond': {
    name: 'Ördek Göleti',
    gameTitle: 'Duck Runner',
    gameId: 'duck-runner',
    gameRoute: '/games/duck-runner/',
    mascot: '🦆',
    brokenVisual: {
      emoji: '🌾',
      label: 'Bulanık Kuru Çamurluk',
      description: 'Suyu çekilmiş, sazlıkları kurumuş ve tahta iskelesi çökmüş çamur birikintisi.',
      flaw: '⚠️ Su bulanık & iskele kırık!',
    },
    stages: [
      {
        stage: 1,
        name: 'Pırıl Pırıl Nilüfer Göleti',
        emoji: '🦆',
        description: 'Berrak tatlı su, yeşil nilüfer yaprakları ve sevimli ördek iskelesi.',
        requiredBracket: 'Seviye 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Ahşap Köprülü Göl Parkuru',
        emoji: '🎃',
        description: 'Kemerli ahşap köprü, balıklar ve balkabağı fenerleriyle süslü gölet.',
        requiredBracket: 'Seviye 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Efsanevi Kuğu & Fıskiye Vahası',
        emoji: '✨',
        description: 'Işıklı mermer fıskiyeler, kuğu sandalları ve havai fişekli su sarayı!',
        requiredBracket: 'Seviye 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  'dog-kennel': {
    name: 'Köpek Kulübesi',
    gameTitle: 'Dog Parking',
    gameId: 'dog-parking',
    gameRoute: '/games/dog-parking/',
    mascot: '🐶',
    brokenVisual: {
      emoji: '🪵',
      label: 'Yıkık Köpek Kulübesi',
      description: 'Çatısı uçmuş, çitleri dağılmış ve su kabı devrilmiş terkedilmiş kulübe.',
      flaw: '⚠️ Çitler devrik & çatı dökülmüş!',
    },
    stages: [
      {
        stage: 1,
        name: 'Sıcak Ahşap Barınak',
        emoji: '🏡',
        description: 'Yumuşak battaniyeler, yeni çitler ve kemik ödüllü sevimli köpek evi.',
        requiredBracket: 'Seviye 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Köpek Çiftliği & Parkuru',
        emoji: '🐕‍🦺',
        description: 'Çift çitli koşu bahçesi, rampa oyuncakları ve altın yangın musluğu süsü.',
        requiredBracket: 'Seviye 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Büyük Köpek Malikanesi',
        emoji: '🏰',
        description: '5 yıldızlı havuzlu köpek oteli ve efsanevi Belediye Başkanı Köpek büstü!',
        requiredBracket: 'Seviye 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  'cat-castle': {
    name: 'Kedi Şatosu',
    gameTitle: 'Cat Parking',
    gameId: 'cat-parking',
    gameRoute: '/games/cat-parking/',
    mascot: '🐱',
    brokenVisual: {
      emoji: '📦',
      label: 'Yırtık Karton Kutu',
      description: 'Yağmurda ıslanmış, yırtık karton kutu ve dikenli çalılar.',
      flaw: '⚠️ Kutu parçalanmış & kapı yok!',
    },
    stages: [
      {
        stage: 1,
        name: 'Sıcak Kedi Evi',
        emoji: '☕',
        description: 'Tırmalama tahtaları, tüy minderler ve süt çanaklarıyla dolu şirin kedi evi.',
        requiredBracket: 'Seviye 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Viktorya Kedi Malikanesi',
        emoji: '🐈‍⬛',
        description: 'Kadife tırmanma kuleleri ve ay ışığı gözlem balkonu olan 2 katlı köşk!',
        requiredBracket: 'Seviye 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Kraliyet Kedi Hisarı',
        emoji: '👑',
        description: 'Altın kuleleri ve kadife tahtı olan büyüleyici kedi kalesi!',
        requiredBracket: 'Seviye 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  'dairy-pasture': {
    name: 'Süt Çiftliği',
    gameTitle: 'Animal Farm Parking',
    gameId: 'animal-farm-parking',
    gameRoute: '/games/animal-farm-parking/',
    mascot: '🐮',
    brokenVisual: {
      emoji: '🪵',
      label: 'Kırık Çitli Otlak',
      description: 'Çitleri yıkılmış, traktör yolu çamur olmuş ve süt tekneleri kırık mera.',
      flaw: '⚠️ Çitler yıkık & yol çamur içinde!',
    },
    stages: [
      {
        stage: 1,
        name: 'Temiz Çiftlik Ağılı',
        emoji: '🏠',
        description: 'Yeni ahşap çitler, temiz su tekneleri ve Bessie için park alanı.',
        requiredBracket: 'Seviye 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Otomasyonlu Süt Sağım Ağılı',
        emoji: '🚜',
        description: 'Asfalt yollar, süt tankerleri ve koyun devriyesi kontrol kulesi!',
        requiredBracket: 'Seviye 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Altın Tereyağı & Dondurma Çiftliği',
        emoji: '🥛',
        description: 'Ödüllü dondurma köşesi ve altın inek çanı anıtı!',
        requiredBracket: 'Seviye 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  'sweet-mill': {
    name: 'Tatlı Değirmeni',
    gameTitle: 'Farm Animal Match',
    gameId: 'pet-candy-crush',
    gameRoute: '/games/pet-candy-crush/',
    mascot: '🍬',
    brokenVisual: {
      emoji: '🪨',
      label: 'Kırık Taş Değirmen',
      description: 'Değirmen taşı çatlamış, şeker şerbeti boruları patlamış terkedilmiş pres.',
      flaw: '⚠️ Değirmen taşı çatlak & şerbet borusu kırık!',
    },
    stages: [
      {
        stage: 1,
        name: 'Meyve & Şeker Presi',
        emoji: '🍎',
        description: 'Taze elma sepetleri ve bal kovanlarıyla çalışan tatlı değirmeni.',
        requiredBracket: 'Seviye 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Su Çarklı Şeker Fabrikası',
        emoji: '🎡',
        description: 'Dönen ahşap su çarkı ve dinamit şeker fıçılarıyla dolu üretim tesisi!',
        requiredBracket: 'Seviye 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Gökkuşağı Şeker Sarayı',
        emoji: '🌟',
        description: 'Gökkuşağı şurup şelaleleri ve yıldız şeker anıtı olan rüya imalathane!',
        requiredBracket: 'Seviye 21 - 30',
        requiredStars: 24,
      },
    ],
  },
};

/**
 * Generates 30 levels for a building track (Level 1 unlocked by default)
 */
export function generateInitial30Levels(): LevelTrackItem[] {
  return Array.from({ length: 30 }, (_, index) => {
    const levelNumber = index + 1;
    return {
      levelNumber,
      unlocked: levelNumber === 1,
      completed: false,
      stars: 0,
      bestScore: 0,
    };
  });
}

/**
 * Reads state from LocalStorage or builds fresh state
 */
let memoryFarmState: FarmRenovationState | null = null;

export function resetFarmRenovationState(): FarmRenovationState {
  memoryFarmState = createDefaultFarmState();
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryFarmState));
    } catch {}
  }
  return memoryFarmState;
}

export function getFarmRenovationState(): FarmRenovationState {
  if (typeof window === 'undefined') {
    if (!memoryFarmState) {
      memoryFarmState = createDefaultFarmState();
    }
    return memoryFarmState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FarmRenovationState;
      if (parsed && parsed.buildings && parsed.buildings.barn) {
        memoryFarmState = parsed;
        return parsed;
      }
    }
  } catch {}

  const fresh = memoryFarmState || createDefaultFarmState();
  saveFarmRenovationState(fresh);
  return fresh;
}

export function saveFarmRenovationState(state: FarmRenovationState): void {
  state.lastUpdated = Date.now();
  memoryFarmState = state;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function createDefaultFarmState(): FarmRenovationState {
  const buildingIds = Object.keys(INITIAL_BUILDING_CONFIGS) as FarmElementId[];
  const buildings = {} as Record<FarmElementId, FarmBuildingRenovation>;

  for (const id of buildingIds) {
    const config = INITIAL_BUILDING_CONFIGS[id]!;
    buildings[id] = {
      id,
      name: config.name,
      gameTitle: config.gameTitle,
      gameId: config.gameId,
      gameRoute: config.gameRoute,
      mascot: config.mascot,
      repairStage: 0, // Starts broken!
      maxStage: 3,
      brokenVisual: config.brokenVisual,
      stages: config.stages,
      levels: generateInitial30Levels(),
    };
  }

  return {
    buildings,
    totalStars: 0,
    completedRenovations: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Calculates total stars earned in a given level bracket (e.g. 1-10)
 */
export function getStarsInBracket(
  levels: LevelTrackItem[],
  startLevel: number,
  endLevel: number
): { earned: number; max: number; completedCount: number } {
  let earned = 0;
  let completedCount = 0;
  const count = endLevel - startLevel + 1;

  for (let l = startLevel; l <= endLevel; l++) {
    const item = levels[l - 1];
    if (item && item.completed) {
      earned += item.stars;
      completedCount++;
    }
  }

  return {
    earned,
    max: count * 3,
    completedCount,
  };
}

/**
 * Evaluates whether an upgrade proposal should trigger for a building
 */
export function checkUpgradeEligibility(
  building: FarmBuildingRenovation,
  tier: 1 | 2 | 3
): {
  eligible: boolean;
  tier: 1 | 2 | 3;
  starsEarned: number;
  requiredStars: number;
  completedLevels: number;
  requiredLevels: number;
  nextStage: number;
} {
  const startLevel = tier === 1 ? 1 : tier === 2 ? 11 : 21;
  const endLevel = tier === 1 ? 10 : tier === 2 ? 20 : 30;
  const requiredStars = 24; // 24 stars out of 30 in this 10-level bracket (80% threshold)
  const requiredLevels = 10;

  const bracket = getStarsInBracket(building.levels, startLevel, endLevel);
  // Eligible if all 10 levels are completed OR stars threshold met
  const eligible =
    building.repairStage < tier &&
    (bracket.completedCount >= requiredLevels || bracket.earned >= requiredStars);

  return {
    eligible,
    tier,
    starsEarned: bracket.earned,
    requiredStars,
    completedLevels: bracket.completedCount,
    requiredLevels,
    nextStage: tier,
  };
}

/**
 * Records a level win, unlocks next level, and recalculates stars
 */
export function recordLevelResult(
  buildingId: FarmElementId,
  levelNumber: number,
  stars: number,
  score: number = 0
): {
  state: FarmRenovationState;
  unlockedNextLevel: boolean;
  triggeredUpgradeTier: (1 | 2 | 3) | null;
} {
  const state = getFarmRenovationState();
  const building = state.buildings[buildingId];
  if (!building) {
    return { state, unlockedNextLevel: false, triggeredUpgradeTier: null };
  }

  const levelIdx = levelNumber - 1;
  if (levelIdx >= 0 && levelIdx < building.levels.length) {
    const current = building.levels[levelIdx]!;
    current.completed = true;
    current.stars = Math.max(current.stars, Math.min(3, Math.max(1, stars)));
    current.bestScore = Math.max(current.bestScore || 0, score);

    // Unlock next level
    let unlockedNext = false;
    if (levelNumber < building.levels.length) {
      building.levels[levelNumber]!.unlocked = true;
      unlockedNext = true;
    }

    // Check if milestone upgrade triggers
    let triggeredUpgradeTier: (1 | 2 | 3) | null = null;
    if (levelNumber <= 10 && building.repairStage < 1) {
      const check = checkUpgradeEligibility(building, 1);
      if (check.eligible) triggeredUpgradeTier = 1;
    } else if (levelNumber <= 20 && building.repairStage < 2) {
      const check = checkUpgradeEligibility(building, 2);
      if (check.eligible) triggeredUpgradeTier = 2;
    } else if (levelNumber <= 30 && building.repairStage < 3) {
      const check = checkUpgradeEligibility(building, 3);
      if (check.eligible) triggeredUpgradeTier = 3;
    }

    // Recalculate global stars
    let totalStars = 0;
    let completedRenovations = 0;
    for (const b of Object.values(state.buildings)) {
      completedRenovations += b.repairStage;
      for (const l of b.levels) {
        totalStars += l.stars;
      }
    }
    state.totalStars = totalStars;
    state.completedRenovations = completedRenovations;

    saveFarmRenovationState(state);
    return { state, unlockedNextLevel: unlockedNext, triggeredUpgradeTier };
  }

  return { state, unlockedNextLevel: false, triggeredUpgradeTier: null };
}

/**
 * Applies a building renovation upgrade (e.g. Broken -> Tier 1)
 */
export function applyBuildingUpgrade(
  buildingId: FarmElementId,
  targetStage: number
): FarmRenovationState {
  const state = getFarmRenovationState();
  const building = state.buildings[buildingId];
  if (building && targetStage > building.repairStage) {
    building.repairStage = Math.min(3, targetStage);

    let completedRenovations = 0;
    for (const b of Object.values(state.buildings)) {
      completedRenovations += b.repairStage;
    }
    state.completedRenovations = completedRenovations;

    saveFarmRenovationState(state);
  }
  return state;
}
