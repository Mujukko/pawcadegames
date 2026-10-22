import React, { useState } from 'react';
import {
  FarmBuildingRenovation,
  LevelTrackItem,
  getStarsInBracket,
  checkUpgradeEligibility,
  recordLevelResult,
} from '../../lib/townMap/farmRenovationEngine';
import { webAdManager } from '../../lib/monetization/WebAdManager';
import {
  X,
  Play,
  Star,
  Lock,
  CheckCircle2,
  Hammer,
  Video,
  Sparkles,
  Trophy,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface BuildingLevelTrackModalProps {
  building: FarmBuildingRenovation | null;
  onClose: () => void;
  onOpenRenovation: (buildingId: string) => void;
  navigate: (path: string) => void;
  onStateChange: () => void;
}

export const BuildingLevelTrackModal: React.FC<BuildingLevelTrackModalProps> = ({
  building,
  onClose,
  onOpenRenovation,
  navigate,
  onStateChange,
}) => {
  if (!building) return null;

  const [activeTier, setActiveTier] = useState<1 | 2 | 3>(
    building.repairStage >= 2 ? 3 : building.repairStage >= 1 ? 2 : 1
  );
  const [selectedLevel, setSelectedLevel] = useState<LevelTrackItem>(
    building.levels.find((l) => l.unlocked && !l.completed) || building.levels[0]
  );
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [adMessage, setAdMessage] = useState<string | null>(null);

  const tierStart = activeTier === 1 ? 1 : activeTier === 2 ? 11 : 21;
  const tierEnd = activeTier === 1 ? 10 : activeTier === 2 ? 20 : 30;
  const tierLevels = building.levels.slice(tierStart - 1, tierEnd);
  const bracketStars = getStarsInBracket(building.levels, tierStart, tierEnd);
  const tierEligible = checkUpgradeEligibility(building, activeTier);

  const isBroken = building.repairStage === 0;

  // Handle Play Level
  const handlePlayLevel = (level: LevelTrackItem) => {
    if (!level.unlocked) return;
    onClose();
    // Navigate with level parameter
    const url = `${building.gameRoute}${building.gameRoute.includes('?') ? '&' : '?'}level=${level.levelNumber}`;
    navigate(url);
  };

  // Rewarded Video: Boost to 3 Stars
  const handleWatchAdFor3Stars = async (levelNumber: number) => {
    setIsAdLoading(true);
    setAdMessage('Sponsorlu video yükleniyor...');

    const result = await webAdManager.showRewardedVideo(
      'level_star_booster',
      `Seviye ${levelNumber} için 3. yıldız bonusu`
    );

    setIsAdLoading(false);

    if (result.success) {
      recordLevelResult(building.id, levelNumber, 3, selectedLevel.bestScore || 1000);
      onStateChange();
      setAdMessage('⭐ Tebrikler! 3 Yıldız başarıyla eklendi!');
      setTimeout(() => setAdMessage(null), 3500);
    } else {
      setAdMessage('Video tamamlanamadı veya kapatıldı.');
      setTimeout(() => setAdMessage(null), 3000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="building-track-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-amber-950/50 text-slate-100 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Building Info & State */}
        <div className="flex items-start gap-3 sm:gap-4 mb-4 pb-4 border-b border-slate-800 shrink-0">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-500 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-3xl sm:text-4xl select-none">
                {isBroken
                  ? building.brokenVisual.emoji
                  : building.stages[building.repairStage - 1]?.emoji || '🏠'}
              </div>
            </div>
            <span className="absolute -bottom-2 -right-1 text-2xl select-none animate-bounce">
              {building.mascot}
            </span>
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                {building.gameTitle}
              </span>
              <span
                className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isBroken
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isBroken ? '⚠️ Onarım Gerekli' : `Aşama ${building.repairStage} / 3 Onarıldı`}
              </span>
            </div>

            <h2
              id="building-track-title"
              className="text-lg sm:text-2xl font-black text-amber-400 truncate tracking-wide"
            >
              {building.name}
            </h2>

            <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
              {isBroken ? building.brokenVisual.description : '30 bölümlük çiftlik ilerleme rotası!'}
            </p>
          </div>
        </div>

        {/* Milestone Renovation Banner / Callout */}
        <div className="mb-4 shrink-0">
          {tierEligible.eligible ? (
            <div className="bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-emerald-600/30 border-2 border-amber-400/60 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center text-xl shrink-0 animate-bounce">
                  🔨
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-amber-300">
                    {building.name} Onarıma Hazır!
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-300">
                    Seviye {tierStart}-{tierEnd} başarıyla tamamlandı ({bracketStars.earned}/30 ⭐).
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenRenovation(building.id);
                }}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 shrink-0 flex items-center gap-1.5"
              >
                <Hammer className="w-4 h-4" />
                <span>Onar & Yükselt</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">🎯</span>
                <span className="text-[11px] sm:text-xs text-slate-300">
                  <strong className="text-amber-400">Aşama {activeTier} Onarımı:</strong> Seviye{' '}
                  {tierStart}-{tierEnd} arasını 3 yıldızla tamamla!
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700 text-xs font-bold text-amber-400 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>
                  {bracketStars.earned} / {bracketStars.max} ⭐
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tier Tabs (1-10, 11-20, 21-30) */}
        <div className="flex gap-2 mb-3 shrink-0">
          {(
            [
              { tier: 1, label: 'Bölüm 1 - 10', milestone: '🔨 Aşama 1: Temel Onarım' },
              { tier: 2, label: 'Bölüm 11 - 20', milestone: '🚜 Aşama 2: Geliştirme' },
              { tier: 3, label: 'Bölüm 21 - 30', milestone: '🏰 Aşama 3: Efsanevi' },
            ] as const
          ).map((t) => {
            const isActive = activeTier === t.tier;
            const bracket = getStarsInBracket(
              building.levels,
              t.tier === 1 ? 1 : t.tier === 2 ? 11 : 21,
              t.tier === 1 ? 10 : t.tier === 2 ? 20 : 30
            );
            return (
              <button
                key={t.tier}
                onClick={() => {
                  setActiveTier(t.tier);
                  const firstOfTier =
                    building.levels[t.tier === 1 ? 0 : t.tier === 2 ? 10 : 20] ||
                    building.levels[0];
                  setSelectedLevel(firstOfTier);
                }}
                className={`flex-1 py-2 px-2 rounded-xl text-center transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-black shadow-md'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <div className="text-xs sm:text-sm">{t.label}</div>
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>{bracket.earned}/30</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Level Track Grid / Path */}
        <div className="flex-1 overflow-y-auto pr-1 mb-3 min-h-[160px]">
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3 py-2">
            {tierLevels.map((lvl) => {
              const isSelected = selectedLevel.levelNumber === lvl.levelNumber;
              const isCurrentUncompleted = lvl.unlocked && !lvl.completed;

              return (
                <button
                  key={lvl.levelNumber}
                  onClick={() => setSelectedLevel(lvl)}
                  disabled={!lvl.unlocked}
                  className={`relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-300 text-slate-950 scale-105 shadow-lg shadow-amber-500/40 font-black ring-2 ring-amber-300'
                      : !lvl.unlocked
                        ? 'bg-slate-800/30 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                        : lvl.completed
                          ? 'bg-slate-800/80 border-amber-500/40 text-slate-100 hover:bg-slate-700 hover:border-amber-400'
                          : 'bg-slate-800 border-amber-400/80 text-amber-400 animate-pulse hover:bg-slate-700'
                  }`}
                >
                  {/* Status Indicator */}
                  {!lvl.unlocked ? (
                    <Lock className="w-4 h-4 mb-1 text-slate-500" />
                  ) : lvl.completed ? (
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= lvl.stars
                              ? isSelected
                                ? 'fill-slate-950 text-slate-950'
                                : 'fill-amber-400 text-amber-400'
                              : isSelected
                                ? 'text-slate-700'
                                : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <Play className="w-4 h-4 mb-1 fill-amber-400 text-amber-400" />
                  )}

                  <span
                    className={`text-sm sm:text-base font-black ${
                      isSelected ? 'text-slate-950' : 'text-slate-200'
                    }`}
                  >
                    {lvl.levelNumber}
                  </span>

                  {/* Completed Checkmark Tag */}
                  {lvl.completed && (
                    <CheckCircle2
                      className={`w-3 h-3 absolute top-1 right-1 ${
                        isSelected ? 'text-slate-950' : 'text-emerald-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Level Action Footer */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 sm:p-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-base shrink-0">
                {selectedLevel.levelNumber}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-slate-200 flex items-center gap-2">
                  <span>Seviye {selectedLevel.levelNumber}</span>
                  {selectedLevel.completed && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      Tamamlandı
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= selectedLevel.stars
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  {selectedLevel.bestScore ? (
                    <span>• Skor: {selectedLevel.bestScore.toLocaleString('tr-TR')}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Rewarded Video Ad: Boost to 3 Stars if won with < 3 stars */}
              {selectedLevel.completed && selectedLevel.stars < 3 && (
                <button
                  onClick={() => handleWatchAdFor3Stars(selectedLevel.levelNumber)}
                  disabled={isAdLoading}
                  className="px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  title="Kısa sponsorlu video izleyerek 3. yıldızı hemen kazan"
                >
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span>3. Yıldızı Al 🎥</span>
                </button>
              )}

              {/* Play Level Button */}
              <button
                onClick={() => handlePlayLevel(selectedLevel)}
                disabled={!selectedLevel.unlocked}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{selectedLevel.completed ? 'Tekrar Oyna' : 'Bölümü Başlat'}</span>
              </button>
            </div>
          </div>

          {adMessage && (
            <div className="mt-2 text-center text-xs font-bold text-amber-300 animate-fade-in bg-amber-500/10 border border-amber-500/20 py-1 rounded-lg">
              {adMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
