import React from 'react';
import { TownBuilding } from '../../lib/townMap/types';
import { X, Play, Trophy, Sparkles, CheckCircle2, ChevronRight, Star } from 'lucide-react';

interface TownMapCardProps {
  building: TownBuilding | null;
  onClose: () => void;
  navigate: (path: string) => void;
}

export const TownMapCard: React.FC<TownMapCardProps> = ({ building, onClose, navigate }) => {
  if (!building) return null;

  const currentStageDef = building.stages[building.currentStage] || building.stages[0]!;
  const isMaxStage = building.currentStage >= building.maxStage;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="town-building-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-orange-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-orange-950/50 text-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close building inspector"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Building Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-purple-600 p-0.5 shadow-lg shadow-orange-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-3xl sm:text-4xl select-none">
                {currentStageDef.visualEmoji}
              </div>
            </div>
            <span className="absolute -bottom-2 -right-1 text-xl select-none animate-bounce">
              {building.mascot}
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                {building.category}
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isMaxStage
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-sm'
                    : building.currentStage === 2
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : building.currentStage === 1
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {currentStageDef.badge}
              </span>
            </div>

            <h2 id="town-building-title" className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {building.name}
            </h2>
            <p className="text-orange-300/90 text-xs sm:text-sm font-semibold mt-0.5">
              Powered by <span className="text-white font-bold">{building.gameTitle}</span>
            </p>
          </div>
        </div>

        {/* Current Stage Description & Perk Banner */}
        <div className="bg-slate-900/90 border border-orange-500/25 rounded-2xl p-4 mb-5 shadow-inner">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Stage {building.currentStage}: {currentStageDef.name}
            </span>
            <div className="flex items-center text-amber-400 text-xs font-bold gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < building.currentStage
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-600 fill-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed mb-3">
            {currentStageDef.description}
          </p>

          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Active Perk: {currentStageDef.perk}</span>
          </div>
        </div>

        {/* Progression Progress Bar & Milestone Target */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-slate-300">
              {building.metricLabel}:{' '}
              <span className="text-white font-mono text-sm">{building.currentMetric}</span>
            </span>
            <span className="text-orange-400 font-mono font-black text-sm">
              {building.progressRatio}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5 mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isMaxStage
                  ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300'
                  : 'bg-gradient-to-r from-orange-500 to-amber-400'
              }`}
              style={{ width: `${building.progressPercent}%` }}
            />
          </div>

          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            {isMaxStage ? (
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                Grand Landmark fully completed! Maximum town prosperity earned!
              </span>
            ) : (
              <>
                <span>Next upgrade at: <strong className="text-white">{building.nextStageRequirement} {building.metricLabel.toLowerCase()}</strong></span>
                <span className="text-orange-300 font-bold">({building.metricRemaining} more needed)</span>
              </>
            )}
          </div>
        </div>

        {/* 4 Stages Timeline Evolution Path */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-orange-400" />
            <span>Evolution Roadmap (0/1 ➔ 1/3 ➔ 2/3 ➔ 3/3 MAX)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {building.stages.map((stg) => {
              const isAchieved = building.currentStage >= stg.stage;
              const isCurrent = building.currentStage === stg.stage;

              return (
                <div
                  key={stg.stage}
                  className={`rounded-2xl p-2.5 flex flex-col items-center text-center border transition-all ${
                    isCurrent
                      ? 'bg-orange-500/20 border-orange-400 text-white shadow-md'
                      : isAchieved
                      ? 'bg-slate-900 border-emerald-500/40 text-slate-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-1 select-none">{stg.visualEmoji}</div>
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {stg.badge}
                  </span>
                  <span className="text-[10px] font-bold line-clamp-1 mt-0.5">
                    {stg.name}
                  </span>
                  {isAchieved ? (
                    <span className="mt-1 text-[9px] font-black text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Done
                    </span>
                  ) : (
                    <span className="mt-1 text-[9px] font-bold text-slate-400">
                      Req: {building.stageRequirements[stg.stage - 1] ?? 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button: Jump Directly to Game */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onClose();
              navigate(building.gameRoute);
            }}
            className="flex-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 hover:from-orange-400 hover:to-amber-300 text-slate-950 font-black py-3 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-102 cursor-pointer text-sm"
          >
            <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>PLAY {building.gameTitle.toUpperCase()} & UPGRADE ➔</span>
          </button>
        </div>
      </div>
    </div>
  );
};
