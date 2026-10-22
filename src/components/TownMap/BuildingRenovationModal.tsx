import React, { useState } from 'react';
import {
  FarmBuildingRenovation,
  applyBuildingUpgrade,
  checkUpgradeEligibility,
  getStarsInBracket,
} from '../../lib/townMap/farmRenovationEngine';
import { webAdManager } from '../../lib/monetization/WebAdManager';
import { getSharedAudioContext } from '../../lib/audio/webAudioUnlocker';
import {
  X,
  Hammer,
  Sparkles,
  Star,
  CheckCircle2,
  Video,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface BuildingRenovationModalProps {
  building: FarmBuildingRenovation | null;
  onClose: () => void;
  onUpgraded: () => void;
  onOpenTrack: () => void;
}

/**
 * Play a joyful victory synth chime using Web Audio API
 */
function playRenovationFanfare() {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.001, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.45);
  });
}

export const BuildingRenovationModal: React.FC<BuildingRenovationModalProps> = ({
  building,
  onClose,
  onUpgraded,
  onOpenTrack,
}) => {
  if (!building) return null;

  const [isAdLoading, setIsAdLoading] = useState(false);
  const [adFeedback, setAdFeedback] = useState<string | null>(null);
  const [justRepaired, setJustRepaired] = useState(false);

  const nextStage = Math.min(building.maxStage, building.repairStage + 1) as 1 | 2 | 3;
  const stageTargetConfig = building.stages[nextStage - 1] || building.stages[0]!;

  const eligibility = checkUpgradeEligibility(building, nextStage);
  const startLevel = nextStage === 1 ? 1 : nextStage === 2 ? 11 : 21;
  const endLevel = nextStage === 1 ? 10 : nextStage === 2 ? 20 : 30;
  const bracket = getStarsInBracket(building.levels, startLevel, endLevel);

  const handleApplyRepair = () => {
    playRenovationFanfare();
    applyBuildingUpgrade(building.id, nextStage);
    setJustRepaired(true);
    onUpgraded();
    setTimeout(() => {
      onClose();
    }, 2400);
  };

  // Monetization: Fast-track renovation via Rewarded Video
  const handleWatchAdToRepair = async () => {
    setIsAdLoading(true);
    setAdFeedback('Sponsorlu video hazırlanıyor...');

    const result = await webAdManager.showRewardedVideo(
      'renovation_fast_track',
      `${building.name} onarım malzemeleri helikopteri`
    );

    setIsAdLoading(false);

    if (result.success) {
      playRenovationFanfare();
      applyBuildingUpgrade(building.id, nextStage);
      setJustRepaired(true);
      setAdFeedback('🚁 Malzemeler teslim edildi! Onarım tamamlandı!');
      onUpgraded();
      setTimeout(() => {
        onClose();
      }, 2400);
    } else {
      setAdFeedback('Video izlenmedi veya iptal edildi.');
      setTimeout(() => setAdFeedback(null), 3000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="renovation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-amber-950/60 text-slate-100 overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebratory Badge */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs font-black text-amber-300 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Çiftlik Onarım & Yenileme</span>
          </div>

          <h3
            id="renovation-modal-title"
            className="text-xl sm:text-2xl font-black text-amber-400 tracking-wide"
          >
            {building.name} Geliştirmesi
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Seviye {startLevel}-{endLevel} başarılarınla çiftliğini canlandır!
          </p>
        </div>

        {/* Before vs After Card Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* BEFORE (Broken or Previous Stage) */}
          <div className="bg-slate-950/60 border border-rose-500/30 rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden">
            <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full mb-2">
              Önce (Şimdiki)
            </span>
            <div className="text-4xl sm:text-5xl my-2 select-none filter drop-shadow">
              {building.repairStage === 0
                ? building.brokenVisual.emoji
                : building.stages[building.repairStage - 1]?.emoji}
            </div>
            <div className="text-xs font-black text-slate-300 line-clamp-1">
              {building.repairStage === 0
                ? building.brokenVisual.label
                : building.stages[building.repairStage - 1]?.name}
            </div>
            <p className="text-[10px] text-rose-300/80 mt-1">
              {building.repairStage === 0
                ? building.brokenVisual.flaw
                : 'Mevcut Onarım'}
            </p>
          </div>

          {/* AFTER (Repaired / Modernized) */}
          <div className="bg-gradient-to-b from-amber-500/15 to-emerald-500/10 border-2 border-amber-400/60 rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden shadow-lg shadow-amber-500/10">
            <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full mb-2 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>Sonra (Aşama {nextStage})</span>
            </span>
            <div className="text-4xl sm:text-5xl my-2 select-none filter drop-shadow animate-pulse">
              {stageTargetConfig.emoji}
            </div>
            <div className="text-xs font-black text-amber-300 line-clamp-1">
              {stageTargetConfig.name}
            </div>
            <p className="text-[10px] text-emerald-300 mt-1">
              ✨ Yenilenmiş & Canlı!
            </p>
          </div>
        </div>

        {/* Description & Perks */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 mb-5">
          <h4 className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Onarım Kazanımları:</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed mb-2">
            {stageTargetConfig.description}
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
            <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 text-amber-300 font-bold">
              +100 Refah Puanı 🌾
            </span>
            <span className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 text-emerald-300 font-bold">
              Yatay Çiftlik Görseli Yenilenir 🚜
            </span>
          </div>
        </div>

        {/* Milestone Star Tracker */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-3 mb-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-bold">
              Seviye {startLevel}-{endLevel} Yıldızları:
            </span>
            <span className="text-amber-400 font-black flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>
                {bracket.earned} / {stageTargetConfig.requiredStars} ⭐ (Maksimum 30)
              </span>
            </span>
          </div>

          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                eligibility.eligible
                  ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                  : 'bg-amber-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.round((bracket.earned / stageTargetConfig.requiredStars) * 100)
                )}%`,
              }}
            />
          </div>

          {eligibility.eligible ? (
            <p className="text-[11px] text-emerald-300 font-bold mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gereken yıldız hedefi tamamlandı! Hemen onarabilirsin.</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-2">
              Onarım için {stageTargetConfig.requiredStars - bracket.earned} yıldız daha gerekiyor
              veya sponsorlu malzeme helikopteri çağırabilirsin!
            </p>
          )}
        </div>

        {/* Just Repaired State Animation */}
        {justRepaired ? (
          <div className="bg-emerald-600/20 border-2 border-emerald-400 rounded-2xl p-4 text-center animate-bounce">
            <div className="text-3xl mb-1">🎉 🔨 ✨</div>
            <h4 className="text-base font-black text-emerald-300">
              {building.name} Başarıyla Onarıldı!
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Çiftlik haritanda yenilenmiş hali ışıldıyor!
            </p>
          </div>
        ) : (
          /* Action Buttons */
          <div className="flex flex-col gap-2.5">
            {eligibility.eligible ? (
              <button
                onClick={handleApplyRepair}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Hammer className="w-5 h-5 fill-slate-950" />
                <span>ŞİMDİ ONAR! 🔨</span>
              </button>
            ) : (
              <>
                {/* Monetization: Fast-track Helikopter */}
                <button
                  onClick={handleWatchAdToRepair}
                  disabled={isAdLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-60"
                >
                  <Video className="w-4 h-4 text-purple-200" />
                  <span>🚁 Malzeme Helikopteri Çağır (Kısa Video İzle)</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenTrack();
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Bölümlere Git & Yıldız Kazan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}

        {adFeedback && (
          <div className="mt-3 text-center text-xs font-bold text-amber-300 animate-fade-in bg-amber-500/10 border border-amber-500/20 py-1.5 rounded-xl">
            {adFeedback}
          </div>
        )}
      </div>
    </div>
  );
};
