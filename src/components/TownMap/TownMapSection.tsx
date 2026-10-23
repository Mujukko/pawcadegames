import React, { useState, useEffect } from 'react';
import { getTownMapState } from '../../lib/townMap/townEngine';
import { TownBuilding, TownMapState } from '../../lib/townMap/types';
import { TownMapCard } from './TownMapCard';
import { soundManager } from '../../games/dog-parking/systems/sound';
import {
  Trophy,
  Sparkles,
  Play,
  Info,
  ChevronRight,
  Star,
  MapPin,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface TownMapSectionProps {
  navigate: (path: string) => void;
}

export const TownMapSection: React.FC<TownMapSectionProps> = ({ navigate }) => {
  const [mapState, setMapState] = useState<TownMapState>(() => getTownMapState());
  const [selectedBuilding, setSelectedBuilding] = useState<TownBuilding | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [viewFilter, setViewFilter] = useState<'all' | 'pets' | 'farm' | 'arcade'>('all');

  // Refresh progress when user returns to tab or window
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

  const filteredBuildings = mapState.buildings.filter((b) => {
    if (viewFilter === 'all') return true;
    return b.category === viewFilter;
  });

  const { prosperity } = mapState;

  return (
    <section className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* TOWN PROSPERITY & META PROGRESSION BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 rounded-3xl p-4 sm:p-7 border-2 border-orange-500/40 shadow-2xl shadow-orange-950/40 mb-6 text-white">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1 uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Town Level {prosperity.townLevel}</span>
              </span>
              <span className="bg-black/40 text-amber-300 border border-amber-500/30 text-xs font-bold px-2.5 py-1 rounded-xl">
                {prosperity.townTitle}
              </span>
              <button
                onClick={() => setShowGuideModal(true)}
                className="text-orange-300 hover:text-white bg-slate-900/80 hover:bg-slate-850 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-orange-500/30 transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Map Guide</span>
              </button>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              Pawcade Farm & Town Map 🗺️🌾
            </h2>
            <p className="text-orange-100 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
              Every game is tied to an estate building! Progress through levels and break high scores to upgrade buildings from <strong>0/1 Lot</strong> to <strong>3/3 MAX Legendary Landmark</strong>.
            </p>
          </div>

          {/* Prosperity Score Counter & Gauge */}
          <div className="shrink-0 bg-slate-900/90 border border-orange-500/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-center min-w-[240px] shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Town Prosperity:</span>
              </span>
              <span className="text-lg font-black font-mono text-amber-300">
                {prosperity.totalStars} / {prosperity.maxStars} ⭐
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5 mb-1.5">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${prosperity.percent}%` }}
              />
            </div>

            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              {prosperity.nextLevelStars ? (
                <span>
                  Next Level: <strong className="text-white">{prosperity.nextLevelStars} Stars</strong> ({prosperity.nextLevelStars - prosperity.totalStars} needed)
                </span>
              ) : (
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Maximum Rank (Utopia)!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BUTTONS & VIEW CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Districts:
          </span>
          {[
            { id: 'all', label: 'All Buildings (9)', icon: '🏛️' },
            { id: 'pets', label: 'Pets (3)', icon: '🐾' },
            { id: 'farm', label: 'Farm & Crops (4)', icon: '🌾' },
            { id: 'arcade', label: 'Air & Pond (2)', icon: '🦆' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundManager.playTap();
                setViewFilter(cat.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                viewFilter === cat.id
                  ? 'bg-orange-500 text-slate-950 shadow-md font-extrabold scale-102'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="text-xs text-orange-300 font-semibold flex items-center gap-1">
          <span>Tip: Tap any building to inspect upgrades and launch game!</span>
        </div>
      </div>

      {/* INTERACTIVE SANCTUARY MAP GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 mb-8">
        {filteredBuildings.map((building) => {
          const currentStageDef = building.stages[building.currentStage] || building.stages[0]!;
          const isMaxStage = building.currentStage >= building.maxStage;

          return (
            <div
              key={building.id}
              onClick={() => handleSelectBuilding(building)}
              className={`group relative rounded-3xl p-4 sm:p-5 border-2 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[220px] shadow-lg hover:shadow-2xl hover:-translate-y-1 ${
                isMaxStage
                  ? 'bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-950 border-amber-400/60 hover:border-amber-400'
                  : building.currentStage === 2
                  ? 'bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-950 border-purple-500/40 hover:border-purple-400'
                  : building.currentStage === 1
                  ? 'bg-gradient-to-br from-teal-950/70 via-slate-900 to-slate-950 border-teal-500/40 hover:border-teal-400'
                  : 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border-slate-800 hover:border-orange-500/40'
              }`}
            >
              {/* Background Mascot Silhouette */}
              <div className="absolute -bottom-4 -right-4 text-7xl sm:text-8xl opacity-10 select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform">
                {building.mascot}
              </div>

              {/* Card Top: Stage Badge & Category */}
              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm ${
                      isMaxStage
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold animate-pulse'
                        : building.currentStage === 2
                        ? 'bg-purple-500 text-white border-purple-400 font-extrabold'
                        : building.currentStage === 1
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-extrabold'
                        : 'bg-slate-800 text-orange-300 border-slate-700'
                    }`}
                  >
                    {currentStageDef.badge}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                    {building.category}
                  </span>
                </div>

                {/* Stars awarded */}
                <div className="flex items-center text-amber-400 text-xs font-black gap-0.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < building.currentStage
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-700 fill-slate-850'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Card Center: Mascot & Building Stage Visual */}
              <div className="relative z-10 flex items-center gap-3.5 my-2">
                <div className="relative shrink-0">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-0.5 shadow-md flex items-center justify-center transition-transform group-hover:scale-105 ${
                      isMaxStage
                        ? 'bg-gradient-to-tr from-amber-400 to-orange-500'
                        : 'bg-gradient-to-tr from-slate-700 to-slate-800 border border-white/15'
                    }`}
                  >
                    <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center text-3xl sm:text-4xl select-none">
                      {currentStageDef.visualEmoji}
                    </div>
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 text-base select-none">
                    {building.mascot}
                  </span>
                </div>

                <div className="overflow-hidden">
                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-orange-300 transition-colors truncate">
                    {building.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 truncate mt-0.5">
                    {currentStageDef.name}
                  </p>
                  <p className="text-[11px] font-semibold text-orange-400/90 truncate">
                    {building.gameTitle}
                  </p>
                </div>
              </div>

              {/* Card Bottom: Progress Meter & Action */}
              <div className="relative z-10 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
                  <span className="text-[11px] text-slate-400">
                    {building.metricLabel}: <strong className="text-white font-mono">{building.currentMetric}</strong>
                  </span>
                  <span className="font-mono text-orange-400 font-black text-xs">
                    {building.progressRatio}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5 mb-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isMaxStage
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                        : 'bg-gradient-to-r from-orange-500 to-amber-400'
                    }`}
                    style={{ width: `${building.progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-400 truncate">
                    {isMaxStage ? (
                      <span className="text-amber-300 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-amber-400" /> MAX Stage
                      </span>
                    ) : (
                      <span>Goal: {building.nextStageRequirement} {building.metricLabel}</span>
                    )}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(building.gameRoute);
                    }}
                    className="shrink-0 bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-black px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1 transition-transform group-hover:scale-105 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-slate-950 text-slate-950" />
                    <span>PLAY</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Building Inspector Modal */}
      {selectedBuilding && (
        <TownMapCard
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
          navigate={navigate}
        />
      )}

      {/* Guide Info Modal */}
      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border-2 border-orange-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🗺️</span>
                <h3 className="text-xl font-black text-white">Town Map Guide</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <p>
                <strong>The Pawcade Map</strong> unites all 9 browser games into a single living countryside estate!
              </p>
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">0/1 Lot</span>
                  <span>Unplayed game or preliminary tier.</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                  <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-mono">1/3 Stage</span>
                  <span>First score goal reached, foundation laid!</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">2/3 Facility</span>
                  <span>Mid-tier goal achieved, facility expanded and decorated!</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-mono">3/3 MAX</span>
                  <span>Maximum score mastered! Legendary golden monument unlocked!</span>
                </div>
              </div>
              <p className="text-xs text-orange-200">
                ⭐ Each stage completed awards 1 star to your town. Collect all 27 stars to ascend your estate to the <strong>Golden Animal Utopia</strong> rank!
              </p>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full bg-orange-500 hover:bg-orange-400 text-slate-950 font-black py-2.5 rounded-xl transition-colors"
            >
              Explore Town Map! 🚀
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
