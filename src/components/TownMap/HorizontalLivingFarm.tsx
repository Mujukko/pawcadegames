import React, { useState, useEffect, useRef } from 'react';
import {
  FarmBuildingRenovation,
  FarmElementId,
  FarmRenovationState,
  checkUpgradeEligibility,
  getFarmRenovationState,
  getStarsInBracket,
} from '../../lib/townMap/farmRenovationEngine';
import { BuildingLevelTrackModal } from './BuildingLevelTrackModal';
import { BuildingRenovationModal } from './BuildingRenovationModal';
import { getSharedAudioContext } from '../../lib/audio/webAudioUnlocker';
import {
  Hammer,
  Star,
  Sparkles,
  Volume2,
  VolumeX,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Play,
  ShieldCheck,
  Video,
} from 'lucide-react';

interface HorizontalLivingFarmProps {
  navigate: (path: string) => void;
  onSwitchToGrid?: () => void;
}

/**
 * Play a light click/tap chime when touching a building
 */
function playPlotTapTone() {
  const ctx = getSharedAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch {}
}

export const HorizontalLivingFarm: React.FC<HorizontalLivingFarmProps> = ({
  navigate,
  onSwitchToGrid,
}) => {
  const [farmState, setFarmState] = useState<FarmRenovationState>(getFarmRenovationState());
  const [selectedTrackBuilding, setSelectedTrackBuilding] = useState<FarmBuildingRenovation | null>(
    null
  );
  const [selectedRenovationBuilding, setSelectedRenovationBuilding] =
    useState<FarmBuildingRenovation | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync state from storage
  const reloadState = () => {
    const updated = getFarmRenovationState();
    setFarmState(updated);
    if (selectedTrackBuilding) {
      setSelectedTrackBuilding(updated.buildings[selectedTrackBuilding.id]);
    }
    if (selectedRenovationBuilding) {
      setSelectedRenovationBuilding(updated.buildings[selectedRenovationBuilding.id]);
    }
  };

  useEffect(() => {
    reloadState();
  }, []);

  // Horizontal pan controls
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const amount = direction === 'left' ? -420 : 420;
    scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Buildings array ordered in farm sequence
  const buildingKeys: FarmElementId[] = [
    'barn',
    'silo',
    'windmill',
    'mini-mart',
    'duck-pond',
    'dog-kennel',
    'cat-castle',
    'dairy-pasture',
    'sweet-mill',
  ];

  const buildings = buildingKeys.map((id) => farmState.buildings[id]);

  // Overall farm prosperity calculation
  const totalRepairs = buildings.reduce((acc, b) => acc + b.repairStage, 0);
  const maxRepairs = buildings.length * 3; // 27
  const farmPercent = Math.min(100, Math.floor((totalRepairs / maxRepairs) * 100));

  const getFarmRank = () => {
    if (totalRepairs >= 24) return { title: 'Legendary Farm Kingdom 🌟🏰', emoji: '🏰' };
    if (totalRepairs >= 16) return { title: 'Modern Farm Haven 🚜🌾', emoji: '🚜' };
    if (totalRepairs >= 9) return { title: 'Charming Country Village 🏡✨', emoji: '🏡' };
    if (totalRepairs >= 1) return { title: 'Restored Homestead 🪵🔨', emoji: '🪵' };
    return { title: 'Rustic Broken Farm (Awaiting Repairs) ⚠️🏚️', emoji: '🏚️' };
  };

  const farmRank = getFarmRank();

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* TOP HUD BAR */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/30 px-3 sm:px-6 py-2.5 shadow-lg shadow-slate-950/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Title & Rank */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-emerald-600 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-xl sm:text-2xl">
                {farmRank.emoji}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-amber-400 tracking-wide">
                  Pawcade Living Farm
                </h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Panorama
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{farmRank.title}</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-300 font-bold">{farmPercent}% Progress</span>
              </p>
            </div>
          </div>

          {/* Stats & Quick Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Total Stars Counter */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-inner">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
              <div className="text-xs">
                <span className="text-slate-400 font-semibold hidden sm:inline">Stars: </span>
                <strong className="text-amber-300 font-black">{farmState.totalStars}</strong>
              </div>
            </div>

            {/* Repaired Buildings Counter */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-inner">
              <Hammer className="w-4 h-4 text-emerald-400" />
              <div className="text-xs">
                <span className="text-slate-400 font-semibold hidden sm:inline">Repairs: </span>
                <strong className="text-emerald-300 font-black">
                  {buildings.filter((b) => b.repairStage > 0).length} / {buildings.length}
                </strong>
              </div>
            </div>

            {/* Sound Toggle (>= 44x44px touch target) */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Switch to Grid View Toggle */}
            {onSwitchToGrid && (
              <button
                onClick={onSwitchToGrid}
                className="flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                title="Switch to Arcade Game Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Game Grid</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PANORAMIC FARM HORIZONTAL SCROLL CONTAINER */}
      <div className="relative flex-1 flex flex-col justify-center overflow-hidden">
        {/* Left / Right Scroll Navigation Arrows */}
        <button
          onClick={() => handleScroll('left')}
          aria-label="Scroll Left"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-amber-500/40 shadow-xl backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => handleScroll('right')}
          aria-label="Scroll Right"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-amber-500/40 shadow-xl backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Scrollable Viewport with touch-pan-x */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto overflow-y-hidden scroll-smooth py-4 sm:py-6 px-12 sm:px-20 scrollbar-none touch-pan-x overscroll-x-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Panorama Track (Width: 3200px) */}
          <div className="relative w-[3200px] h-[520px] rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-900/60 bg-gradient-to-b from-sky-900 via-emerald-950 to-amber-950">
            {/* SKY BACKGROUND & AMBIENT CLOUDS */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-900/70 via-amber-900/20 to-transparent pointer-events-none" />

            {/* Floating Clouds */}
            <div className="absolute top-6 left-16 text-5xl opacity-40 animate-pulse select-none">
              ☁️
            </div>
            <div className="absolute top-12 left-[800px] text-6xl opacity-35 select-none">☁️</div>
            <div className="absolute top-4 left-[1600px] text-5xl opacity-40 select-none">☁️</div>
            <div className="absolute top-10 left-[2400px] text-6xl opacity-30 select-none">☁️</div>

            {/* Distant Hills / Tree line */}
            <div className="absolute top-28 inset-x-0 h-32 flex justify-between px-12 opacity-30 pointer-events-none select-none text-4xl">
              <span>🌲🌲🌳</span>
              <span>🌾🌾</span>
              <span>🌲🌳🌲</span>
              <span>🌻🌻🌻</span>
              <span>🌳🌲</span>
              <span>🌾🌾🌾</span>
              <span>🌲🌲</span>
            </div>

            {/* GREEN ROLLING PASTURE BASE */}
            <div className="absolute bottom-0 inset-x-0 h-[380px] bg-gradient-to-b from-emerald-800 via-emerald-900 to-amber-950/90 rounded-b-3xl">
              {/* Winding Dirt Path SVG traversing the whole farm */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 3200 380"
                fill="none"
                preserveAspectRatio="none"
              >
                {/* Cobblestone / Dirt Road */}
                <path
                  d="M 50,220 Q 350,160 650,230 T 1250,200 T 1850,240 T 2450,190 T 3150,220"
                  stroke="#78350f"
                  strokeWidth="60"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                <path
                  d="M 50,220 Q 350,160 650,230 T 1250,200 T 1850,240 T 2450,190 T 3150,220"
                  stroke="#d97706"
                  strokeWidth="48"
                  strokeLinecap="round"
                  strokeDasharray="8 12"
                  opacity="0.4"
                />
              </svg>

              {/* Decorative Grass / Flower Tufts along path */}
              <div className="absolute bottom-6 inset-x-0 flex justify-between px-8 text-2xl select-none opacity-60 pointer-events-none">
                <span>🌾🥕</span>
                <span>🌻🌼</span>
                <span>🪵🌾</span>
                <span>🥕🥦</span>
                <span>🌼🌻</span>
                <span>🌾🪵</span>
                <span>🌻🌼</span>
                <span>🥕🌾</span>
              </div>
            </div>

            {/* 9 INTERACTIVE FARM BUILDINGS PLACED ALONG HORIZONTAL TRACK */}
            <div className="absolute inset-0 flex items-center justify-between px-16 z-10">
              {buildings.map((b, index) => {
                const isBroken = b.repairStage === 0;
                const nextStage = Math.min(3, b.repairStage + 1) as 1 | 2 | 3;
                const eligibility = checkUpgradeEligibility(b, nextStage);
                const bracketStars = getStarsInBracket(
                  b.levels,
                  nextStage === 1 ? 1 : nextStage === 2 ? 11 : 21,
                  nextStage === 1 ? 10 : nextStage === 2 ? 20 : 30
                );

                // Alternating slight vertical offset for dynamic organic farm layout
                const yOffset = index % 2 === 0 ? '-translate-y-4' : 'translate-y-6';

                return (
                  <div
                    key={b.id}
                    className={`relative flex flex-col items-center group transition-transform ${yOffset}`}
                    style={{ width: '280px' }}
                  >
                    {/* Bouncing Upgrade Indicator if Milestone is Ready */}
                    {eligibility.eligible && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRenovationBuilding(b);
                        }}
                        className="absolute -top-12 z-30 px-3 py-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 text-slate-950 font-black text-xs rounded-full shadow-xl shadow-yellow-500/40 border border-yellow-200 animate-bounce flex items-center gap-1.5 cursor-pointer hover:scale-105"
                      >
                        <Hammer className="w-3.5 h-3.5 fill-slate-950" />
                        <span>ONARIMA HAZIR! 🔨</span>
                      </button>
                    )}

                    {/* Main Building Interactive Card */}
                    <div
                      onClick={() => {
                        if (soundEnabled) playPlotTapTone();
                        setSelectedTrackBuilding(b);
                      }}
                      className={`relative w-64 bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 transition-all duration-300 cursor-pointer shadow-xl border-2 ${
                        isBroken
                          ? 'border-rose-500/50 hover:border-rose-400 hover:shadow-rose-950/60 bg-gradient-to-b from-slate-900/95 to-slate-950'
                          : 'border-amber-400/60 hover:border-amber-300 hover:shadow-amber-950/60 bg-gradient-to-b from-slate-900/90 to-emerald-950/80 hover:scale-105'
                      }`}
                    >
                      {/* Broken Visual Distressing Overlay */}
                      {isBroken && (
                        <div className="absolute top-2 right-2 bg-rose-500/20 text-rose-300 border border-rose-500/50 text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                          ⚠️ DAMAGED
                        </div>
                      )}

                      {!isBroken && (
                        <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Stage {b.repairStage}/3</span>
                        </div>
                      )}

                      {/* Mascot & Graphic Zone */}
                      <div className="relative flex flex-col items-center justify-center my-2">
                        <div
                          className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl sm:text-6xl select-none transition-transform group-hover:scale-110 ${
                            isBroken
                              ? 'grayscale contrast-125 opacity-85'
                              : 'filter drop-shadow-lg'
                          }`}
                        >
                          {isBroken
                            ? b.brokenVisual.emoji
                            : b.stages[b.repairStage - 1]?.emoji || '🏠'}
                        </div>

                        {/* Pet Mascot Peeking */}
                        <div className="absolute -bottom-2 -right-1 text-2xl select-none animate-bounce">
                          {b.mascot}
                        </div>
                      </div>

                      {/* Building Name & Game */}
                      <div className="text-center mt-2">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          {b.gameTitle}
                        </span>
                        <h3 className="text-sm font-black text-slate-100 truncate mt-0.5">
                          {isBroken ? b.brokenVisual.label : b.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {isBroken ? b.brokenVisual.flaw : b.stages[b.repairStage - 1]?.description}
                        </p>
                      </div>

                      {/* Progress Bar (Stars / Bracket) */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-400 font-medium">Levels 1-10:</span>
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>
                              {bracketStars.earned} / {bracketStars.max} ⭐
                            </span>
                          </span>
                        </div>

                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              eligibility.eligible
                                ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                                : 'bg-amber-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((bracketStars.earned / bracketStars.max) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Tap to View 1-30 Track CTA */}
                      <div className="mt-3 flex items-center justify-center gap-1.5 py-1.5 bg-slate-800/80 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-300 rounded-xl text-xs font-black transition-colors">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Open Levels 1-30</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STICKY AD SAFE ZONE (Poki / CrazyGames / Google H5 Safe Banner Area) */}
      <div className="sticky bottom-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-4 flex items-center justify-center">
        <div className="w-full max-w-[728px] h-[54px] sm:h-[60px] bg-slate-900/90 border border-amber-500/20 rounded-xl flex items-center justify-between px-4 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">📢</span>
            <span className="text-slate-400 text-[11px] sm:text-xs">
              <strong className="text-slate-200">Sponsored:</strong> Seamless arcade experience with zero intrusive popups.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] text-slate-500 uppercase font-mono">
              728x90 Safe Zone
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
              H5 Compliant
            </span>
          </div>
        </div>
      </div>

      {/* 30-LEVEL PROGRESSION TRACK MODAL */}
      {selectedTrackBuilding && (
        <BuildingLevelTrackModal
          building={selectedTrackBuilding}
          onClose={() => setSelectedTrackBuilding(null)}
          onOpenRenovation={(buildingId) => {
            const b = farmState.buildings[buildingId as FarmElementId];
            if (b) setSelectedRenovationBuilding(b);
          }}
          navigate={navigate}
          onStateChange={reloadState}
        />
      )}

      {/* CELEBRATORY RENOVATION / UPGRADE MODAL */}
      {selectedRenovationBuilding && (
        <BuildingRenovationModal
          building={selectedRenovationBuilding}
          onClose={() => setSelectedRenovationBuilding(null)}
          onUpgraded={reloadState}
          onOpenTrack={() => {
            setSelectedTrackBuilding(selectedRenovationBuilding);
          }}
        />
      )}
    </div>
  );
};
