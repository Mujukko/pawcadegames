import React, { useState, useEffect, useRef } from 'react';
import { TownBuilding, TownMapState } from '../../lib/townMap/types';
import { getTownMapState } from '../../lib/townMap/townEngine';
import { TownMapCard } from './TownMapCard';
import { soundManager } from '../../games/dog-parking/systems/sound';
import {
  Trophy,
  Star,
  Sparkles,
  Info,
  Play,
  Volume2,
  VolumeX,
  LayoutGrid,
  ChevronUp,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface FarmWindingMapProps {
  navigate: (path: string) => void;
  onSwitchToGrid?: () => void;
}

interface MapNodeConfig {
  id: string;
  number: number;
  x: number; // in 600px canvas space
  y: number; // in 2200px canvas space
  landmarkSide: 'left' | 'right' | 'top';
  landmarkType:
    | 'kennel'
    | 'cat-manor'
    | 'duck-pond'
    | 'dairy-barn'
    | 'sweet-mill'
    | 'mini-mart'
    | 'windmill'
    | 'safari'
    | 'silo';
  zoneLabel?: string;
}

// Ordered from bottom to top (Entrance -> Silo Summit)
const MAP_NODES: MapNodeConfig[] = [
  {
    id: 'dog-kennel',
    number: 1,
    x: 210,
    y: 2020,
    landmarkSide: 'left',
    landmarkType: 'kennel',
    zoneLabel: '🐶 Puppy Meadow',
  },
  {
    id: 'cat-castle',
    number: 2,
    x: 390,
    y: 1810,
    landmarkSide: 'right',
    landmarkType: 'cat-manor',
  },
  {
    id: 'duck-pond',
    number: 3,
    x: 210,
    y: 1590,
    landmarkSide: 'left',
    landmarkType: 'duck-pond',
    zoneLabel: '🦆 Wetland Springs',
  },
  {
    id: 'dairy-barn',
    number: 4,
    x: 390,
    y: 1370,
    landmarkSide: 'right',
    landmarkType: 'dairy-barn',
    zoneLabel: "🐮 Bessie's Pasture",
  },
  {
    id: 'sugar-mill',
    number: 5,
    x: 210,
    y: 1150,
    landmarkSide: 'left',
    landmarkType: 'sweet-mill',
  },
  {
    id: 'farm-supermarket',
    number: 6,
    x: 390,
    y: 930,
    landmarkSide: 'right',
    landmarkType: 'mini-mart',
    zoneLabel: '🏪 Town Market Square',
  },
  {
    id: 'windmill-flight',
    number: 7,
    x: 210,
    y: 710,
    landmarkSide: 'left',
    landmarkType: 'windmill',
  },
  {
    id: 'safari-sanctuary',
    number: 8,
    x: 390,
    y: 490,
    landmarkSide: 'right',
    landmarkType: 'safari',
    zoneLabel: '🌲 Wildlife Reserve',
  },
  {
    id: 'hay-silo',
    number: 9,
    x: 300,
    y: 260,
    landmarkSide: 'top',
    landmarkType: 'silo',
    zoneLabel: '🌾 Grand Harvest Silo Summit',
  },
];

export const FarmWindingMap: React.FC<FarmWindingMapProps> = ({
  navigate,
  onSwitchToGrid,
}) => {
  const [mapState, setMapState] = useState<TownMapState>(() => getTownMapState());
  const [selectedBuilding, setSelectedBuilding] = useState<TownBuilding | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted());
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Auto-refresh when returning to tab
  useEffect(() => {
    const handleRefresh = () => {
      setMapState(getTownMapState());
    };
    window.addEventListener('focus', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  const handleSelectBuilding = (building: TownBuilding) => {
    soundManager.playTap();
    setSelectedBuilding(building);
  };

  const toggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  const { prosperity, buildings } = mapState;

  // Build SVG path curve connecting nodes from bottom to top
  // Path starts at (300, 2180), winds through nodes, and terminates at (300, 70)
  const pathD = `
    M 300 2190
    C 280 2140, 210 2090, 210 2020
    C 210 1920, 390 1910, 390 1810
    C 390 1710, 210 1690, 210 1590
    C 210 1490, 390 1470, 390 1370
    C 390 1270, 210 1250, 210 1150
    C 210 1050, 390 1030, 390 930
    C 390 830, 210 810, 210 710
    C 210 610, 390 590, 390 490
    C 390 380, 300 350, 300 260
    C 300 180, 300 110, 300 60
  `;

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-sky-900 via-indigo-950 to-slate-950 text-white selection:bg-orange-500 selection:text-slate-950">
      {/* STICKY TOP PROSPERITY HUD */}
      <div className="sticky top-16 z-30 bg-slate-950/92 backdrop-blur-md border-b border-orange-500/25 px-3 sm:px-6 py-2.5 shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Prosperity Badge & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-300 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-lg font-black text-amber-400">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                  Farm Level {prosperity.townLevel}:
                </span>
                <span className="text-xs font-black text-amber-300 truncate max-w-[130px] sm:max-w-xs">
                  {prosperity.townTitle}
                </span>
              </div>

              {/* Mini Stars & Progress Bar */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-24 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${prosperity.percent}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-black text-amber-400">
                  {prosperity.totalStars}/{prosperity.maxStars} ⭐
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowGuideModal(true)}
              title="Map Guide"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            {onSwitchToGrid && (
              <button
                onClick={onSwitchToGrid}
                title="Switch to Arcade Grid"
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">Games</span>
              </button>
            )}

            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="p-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-orange-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CANDY CRUSH / FARM HEROES STYLE WINDING MAP CONTAINER */}
      <div
        ref={mapContainerRef}
        className="relative mx-auto w-full max-w-[620px] overflow-hidden select-none pb-24"
        style={{ minHeight: '2300px' }}
      >
        {/* LUSH COUNTRYSIDE BACKGROUND DECORATIONS */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Subtle rolling hills and pastel textures */}
          <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-900/60 via-purple-900/40 to-transparent" />
          <div className="absolute top-[600px] left-0 w-full h-[800px] bg-gradient-to-b from-purple-900/30 via-emerald-950/40 to-transparent" />
          <div className="absolute top-[1400px] left-0 w-full h-[900px] bg-gradient-to-b from-emerald-950/40 to-slate-950/80" />

          {/* Ambient clouds & stars */}
          <div className="absolute top-12 left-10 text-4xl opacity-40 animate-pulse">☁️</div>
          <div className="absolute top-32 right-12 text-3xl opacity-30 animate-pulse" style={{ animationDelay: '1.5s' }}>☁️</div>
          <div className="absolute top-64 left-1/3 text-xs text-amber-200/50">✨</div>
          <div className="absolute top-96 right-1/4 text-xs text-amber-200/60">✨</div>

          {/* Scenery trees & flowers along the sides */}
          <div className="absolute top-[380px] left-4 text-3xl opacity-75">🌲</div>
          <div className="absolute top-[440px] left-10 text-2xl opacity-60">🍄</div>
          <div className="absolute top-[620px] right-6 text-3xl opacity-75">🌻</div>
          <div className="absolute top-[780px] right-8 text-2xl opacity-70">🎃</div>
          <div className="absolute top-[1030px] left-8 text-3xl opacity-80">🌳</div>
          <div className="absolute top-[1250px] right-10 text-3xl opacity-80">🌾</div>
          <div className="absolute top-[1480px] left-6 text-2xl opacity-75">🌻</div>
          <div className="absolute top-[1720px] right-8 text-3xl opacity-80">🏡</div>
          <div className="absolute top-[1930px] left-8 text-3xl opacity-80">🐶</div>
          <div className="absolute top-[2100px] right-12 text-3xl opacity-70">🪵</div>
        </div>

        {/* WINDING ROAD SVG LAYER */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 600 2200"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Road drop shadow */}
            <filter id="roadShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#020617" floodOpacity="0.7" />
            </filter>

            {/* Candy-striped road pattern */}
            <pattern id="candyStripes" width="24" height="24" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="12" height="24" fill="#a855f7" />
              <rect x="12" y="0" width="12" height="24" fill="#f8fafc" />
            </pattern>

            {/* Golden cobblestone farm pattern */}
            <linearGradient id="roadBaseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c2d12" />
              <stop offset="50%" stopColor="#9a3412" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>

            <linearGradient id="roadInnerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Outer Road Dirt Base (Wider Border) */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#roadBaseGrad)"
            strokeWidth="38"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#roadShadow)"
          />

          {/* Striped Track Edges (Candy Crush Style) */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#candyStripes)"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Inner Golden Cobblestone Lane */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#roadInnerGrad)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Center Dashed Trail Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeDasharray="8 8"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Future expansion trail continuing above the Silo */}
          <path
            d="M 300 120 C 300 80, 300 40, 300 10"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="4"
            strokeDasharray="6 8"
            opacity="0.6"
          />
        </svg>

        {/* INTERACTIVE 3D LEVEL NODES & FARM LANDMARKS */}
        <div className="relative w-full h-[2200px]">
          {MAP_NODES.map((nodeConfig) => {
            const building = buildings.find((b) => b.id === nodeConfig.id);
            if (!building) return null;

            const isMaxStage = building.currentStage >= building.maxStage;
            const currentStageDef =
              building.stages[building.currentStage] || building.stages[0]!;

            // Landmark positions (Left or Right of the road)
            const isLeft = nodeConfig.landmarkSide === 'left';
            const isSiloSummit = nodeConfig.landmarkType === 'silo';

            return (
              <React.Fragment key={nodeConfig.id}>
                {/* ZONE BANNER RIBBON (Every few nodes, like "Fantastic Forest" in reference photo) */}
                {nodeConfig.zoneLabel && !isSiloSummit && (
                  <div
                    className="absolute z-10 -translate-x-1/2 flex items-center justify-center pointer-events-none"
                    style={{
                      left: '50%',
                      top: `${nodeConfig.y - 75}px`,
                    }}
                  >
                    <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 text-white font-black text-[11px] sm:text-xs px-4 py-1 rounded-full shadow-lg border border-pink-300/40 tracking-wider uppercase animate-fade-in flex items-center gap-1.5">
                      <span>✨</span>
                      <span>{nodeConfig.zoneLabel}</span>
                      <span>✨</span>
                    </div>
                  </div>
                )}

                {/* BESIDE-THE-ROAD 3D LANDMARK GRAPHIC */}
                {!isSiloSummit && (
                  <div
                    onClick={() => handleSelectBuilding(building)}
                    className={`absolute z-15 cursor-pointer group transition-all duration-300 hover:scale-105 flex flex-col items-center ${
                      isLeft ? 'items-end' : 'items-start'
                    }`}
                    style={{
                      left: isLeft ? `${nodeConfig.x - 170}px` : `${nodeConfig.x + 55}px`,
                      top: `${nodeConfig.y - 48}px`,
                      width: '120px',
                    }}
                  >
                    {/* Landmark 3D Card / Diorama */}
                    <div
                      className={`relative rounded-2xl p-2.5 shadow-xl border-2 transition-all flex flex-col items-center text-center ${
                        isMaxStage
                          ? 'bg-gradient-to-b from-amber-950/90 to-slate-900 border-amber-400 shadow-amber-500/20'
                          : building.currentStage > 0
                          ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-purple-500/50 hover:border-purple-400'
                          : 'bg-slate-950/85 border-slate-800 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {/* Visual Graphic */}
                      <div className="relative text-3xl sm:text-4xl mb-1 filter drop-shadow-md select-none group-hover:scale-110 transition-transform">
                        {nodeConfig.landmarkType === 'dairy-barn' ? (
                          <span>🐮🏚️</span>
                        ) : nodeConfig.landmarkType === 'mini-mart' ? (
                          <span>🏪🍅</span>
                        ) : nodeConfig.landmarkType === 'windmill' ? (
                          <span>🐔💨</span>
                        ) : nodeConfig.landmarkType === 'duck-pond' ? (
                          <span>🦆🪷</span>
                        ) : nodeConfig.landmarkType === 'cat-manor' ? (
                          <span>🐱🏰</span>
                        ) : nodeConfig.landmarkType === 'kennel' ? (
                          <span>🐶🏡</span>
                        ) : nodeConfig.landmarkType === 'sweet-mill' ? (
                          <span>🍬🎡</span>
                        ) : (
                          <span>🐘🌲</span>
                        )}
                      </div>

                      <span className="text-[10px] font-black text-white leading-tight line-clamp-1">
                        {building.name}
                      </span>
                      <span className="text-[9px] font-bold text-orange-300 line-clamp-1 mt-0.5">
                        {currentStageDef.name}
                      </span>

                      {/* Mini Stage Pill */}
                      <span
                        className={`mt-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isMaxStage
                            ? 'bg-amber-400 text-slate-950 font-extrabold animate-pulse'
                            : building.currentStage > 0
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {building.progressRatio}
                      </span>
                    </div>
                  </div>
                )}

                {/* THE GRAND HARVEST SILO SUMMIT LANDMARK (Node 9) */}
                {isSiloSummit && (
                  <div
                    onClick={() => handleSelectBuilding(building)}
                    className="absolute z-20 -translate-x-1/2 flex flex-col items-center cursor-pointer group"
                    style={{
                      left: `${nodeConfig.x}px`,
                      top: `${nodeConfig.y - 180}px`,
                    }}
                  >
                    {/* Waving Farmer with "SUPER HARVEST!" Speech Bubble */}
                    <div className="mb-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs px-3 py-1 rounded-2xl shadow-lg border-2 border-white animate-bounce flex items-center gap-1">
                      <span>👨‍🌾</span>
                      <span>"HARVEST SILO SUMMIT!"</span>
                    </div>

                    {/* Massive 3D Silo Illustration */}
                    <div className="relative rounded-3xl p-4 bg-gradient-to-b from-amber-950/90 via-slate-900 to-slate-950 border-3 border-amber-400 shadow-2xl shadow-orange-500/40 flex flex-col items-center text-center group-hover:scale-105 transition-transform duration-300">
                      <div className="text-6xl sm:text-7xl filter drop-shadow-2xl select-none mb-1">
                        🌾🏛️✨
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                        {building.name}
                      </h3>
                      <p className="text-[11px] font-bold text-amber-300">
                        {currentStageDef.name} • {building.gameTitle}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-full border border-amber-400/40">
                        <span className="text-xs font-mono font-black text-amber-300">
                          {building.progressRatio}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300">
                          (Harvest Score: {building.currentMetric})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3D CIRCULAR CANDY CRUSH LEVEL BUTTON DISC (Right on the Road) */}
                <div
                  onClick={() => handleSelectBuilding(building)}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{
                    left: `${nodeConfig.x}px`,
                    top: `${nodeConfig.y}px`,
                  }}
                >
                  {/* Floating Mascot Emoji on active / high stages */}
                  <div className="absolute -top-6 -right-2 text-2xl select-none animate-bounce z-30 filter drop-shadow-md">
                    {building.mascot}
                  </div>

                  {/* 3D Circular Button Disc */}
                  <div
                    className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex flex-col items-center justify-center transition-transform group-hover:scale-115 group-active:scale-95 shadow-2xl ${
                      isMaxStage
                        ? 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 ring-4 ring-amber-300 shadow-amber-500/60'
                        : building.currentStage === 2
                        ? 'bg-gradient-to-b from-purple-400 via-purple-600 to-purple-800 ring-4 ring-purple-300 shadow-purple-600/50'
                        : building.currentStage === 1
                        ? 'bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-800 ring-4 ring-emerald-300 shadow-emerald-600/50'
                        : 'bg-gradient-to-b from-sky-400 via-blue-600 to-blue-800 ring-4 ring-blue-300 shadow-blue-600/40'
                    }`}
                  >
                    {/* Glossy top bevel reflection */}
                    <div className="absolute top-1 left-2 right-2 h-4 rounded-full bg-white/40 blur-[1px] pointer-events-none" />

                    {/* Node Number & Stage Ratio */}
                    <span className="text-white font-black text-sm sm:text-base drop-shadow-md leading-none font-mono">
                      {nodeConfig.number}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black text-amber-200 uppercase tracking-tighter drop-shadow-sm mt-0.5">
                      {isMaxStage ? 'MAX' : building.progressRatio}
                    </span>
                  </div>

                  {/* 3 STARS DIRECTLY BENEATH THE NODE (Exact match to reference photo!) */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 z-30 filter drop-shadow-md">
                    {Array.from({ length: 3 }).map((_, starIndex) => {
                      const isStarEarned = building.currentStage > starIndex;
                      return (
                        <div
                          key={starIndex}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center transition-all ${
                            isStarEarned
                              ? 'text-amber-400 fill-amber-400 scale-110'
                              : 'text-slate-600 fill-slate-800 opacity-60'
                          }`}
                        >
                          <Star
                            className={`w-full h-full ${
                              isStarEarned
                                ? 'fill-amber-400 text-amber-300 drop-shadow-[0_1px_2px_rgba(251,191,36,0.8)]'
                                : 'fill-slate-800 text-slate-600'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* BOTTOM ROAD ENTRANCE WELCOME BANNER */}
        <div className="relative z-20 text-center pt-8 pb-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 text-slate-950 px-5 py-2 rounded-2xl font-black text-xs sm:text-sm shadow-xl border-2 border-orange-300">
            <span>🏁 FARM TRAIL ENTRANCE</span>
            <span>➔</span>
            <span>HARVEST SILO SUMMIT 🌾</span>
          </div>
        </div>
      </div>

      {/* BUILDING INSPECTOR POPUP DIALOG */}
      {selectedBuilding && (
        <TownMapCard
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
          navigate={navigate}
        />
      )}

      {/* MAP GUIDE INFO MODAL */}
      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border-2 border-orange-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🗺️</span>
                <h3 className="text-xl font-black text-white">
                  Farm Map Guide
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-slate-300 leading-relaxed">
              <p>
                <strong>The Pawcade Farm Trail</strong> links every browser game into an interconnected countryside trail! Journey across 9 unique estate landmarks leading to the grand <strong>Harvest Silo Summit</strong>.
              </p>

              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono">1</span>
                  <span><strong>0/1 Lot:</strong> Unrestored plot awaiting level clears.</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono">⭐</span>
                  <span><strong>1/3 Starter:</strong> First milestone achieved with 1 star!</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-mono">⭐⭐</span>
                  <span><strong>2/3 Facility:</strong> Upgraded facility with 2 stars unlocked!</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-mono">⭐⭐⭐</span>
                  <span><strong>3/3 MAX Landmark:</strong> Legendary golden monument with all 3 stars!</span>
                </div>
              </div>

              <p className="text-xs text-orange-200">
                💡 Tap any node on the trail to view building status, or jump straight in with <strong>"PLAY"</strong> to beat level goals.
              </p>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black py-3 rounded-xl transition-transform hover:scale-102 cursor-pointer shadow-lg text-sm"
            >
              Back to Farm Trail! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
