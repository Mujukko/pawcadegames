import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  AnimalSpecies,
  ANIMALS,
  ClickerState,
} from './logic/types';
import {
  buyBuilding,
  buyClickUpgrade,
  buyHat,
  calculateClickPower,
  calculateOfflineEarnings,
  calculatePps,
  clickGoldenEvent,
  createInitialState,
  equipHat,
  getBuildingCost,
  getUpgradeCost,
  handleClick,
  isAnimalUnlocked,
  selectAnimal,
  spawnGoldenEvent,
  tickState,
} from './logic/engine';
import { soundManager } from './systems/sound';
import { Volume2, VolumeX, Sparkles, Zap, Award, HelpCircle, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'pawcade_farm_animal_clicker_save_v1';

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export const FarmAnimalClickerContainer: React.FC = () => {
  // Load saved state or default
  const [state, setState] = useState<ClickerState>(() => {
    if (typeof window === 'undefined') return createInitialState();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return createInitialState(parsed);
      }
    } catch {}
    return createInitialState();
  });

  const [activeTab, setActiveTab] = useState<'buildings' | 'upgrades' | 'animals' | 'hats'>('buildings');
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isBouncing, setIsBouncing] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => soundManager.getMuted());
  const [offlineModal, setOfflineModal] = useState<{ earned: number; seconds: number } | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);

  const nextFloatingId = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Check offline earnings on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedStr = localStorage.getItem(STORAGE_KEY);
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (saved.lastTickTimestamp) {
          const offline = calculateOfflineEarnings(stateRef.current, saved.lastTickTimestamp, Date.now());
          if (offline.earned > 0) {
            setOfflineModal({ earned: offline.earned, seconds: offline.elapsedSeconds });
          }
        }
      }
    } catch {}
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // Main game tick loop (every 100ms for silky smooth PPS accumulation)
  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      setState((prev) => {
        let current = tickState(prev, delta, now);

        // Random golden event spawner (every ~45-75 seconds on average)
        if (!current.goldenEvent.active && !current.goldenEvent.frenzyActive) {
          // 0.25% chance per 100ms tick (~every 40 seconds)
          if (Math.random() < 0.0025) {
            current = spawnGoldenEvent(
              current,
              20 + Math.random() * 60,
              20 + Math.random() * 50
            );
          }
        }

        return current;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Floating text cleanup timer
  useEffect(() => {
    if (floatingTexts.length === 0) return;
    const timer = setTimeout(() => {
      setFloatingTexts((prev) => prev.slice(1));
    }, 800);
    return () => clearTimeout(timer);
  }, [floatingTexts]);

  // Handle hero animal click
  const handleAnimalClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Trigger sound
    soundManager.playTap(state.selectedAnimal);

    // Bounce animation
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 120);

    // Get click coordinates for floating text
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const { state: nextState, amountAdded } = handleClick(state);
    setState(nextState);

    // Add floating text
    const id = nextFloatingId.current++;
    const animalConfig = ANIMALS[state.selectedAnimal];
    const isFrenzy = state.goldenEvent.frenzyActive;

    setFloatingTexts((prev) => [
      ...prev.slice(-12),
      {
        id,
        text: `+${amountAdded.toLocaleString()} ${animalConfig.produceEmoji}`,
        x: clientX + (Math.random() - 0.5) * 40,
        y: clientY - 20,
        color: isFrenzy ? '#f59e0b' : '#ea580c',
      },
    ]);
  };

  // Handle clicking the golden butterfly event
  const onGoldenEventClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playGoldenFrenzy();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
    });

    const { state: nextState, bonusWon } = clickGoldenEvent(state);
    setState(nextState);

    const id = nextFloatingId.current++;
    setFloatingTexts((prev) => [
      ...prev,
      {
        id,
        text: `⚡ 7x FRENZY! +${bonusWon.toLocaleString()} BONUS!`,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2 - 40,
        color: '#f59e0b',
      },
    ]);
  };

  const onBuyUpgrade = (id: string) => {
    const next = buyClickUpgrade(state, id);
    if (next) {
      soundManager.playUpgrade();
      setState(next);
    }
  };

  const onBuyBuilding = (id: string) => {
    const next = buyBuilding(state, id);
    if (next) {
      soundManager.playBuildingUnlock();
      setState(next);
    }
  };

  const onBuyHat = (id: string) => {
    const next = buyHat(state, id);
    if (next) {
      soundManager.playHatEquip();
      setState(next);
    }
  };

  const onEquipHat = (id: string | null) => {
    soundManager.playHatEquip();
    setState(equipHat(state, id));
  };

  const onSelectAnimal = (species: AnimalSpecies) => {
    soundManager.playTap(species);
    setState(selectAnimal(state, species));
  };

  const onClaimOffline = () => {
    if (!offlineModal) return;
    soundManager.playUpgrade();
    setState((prev) => ({
      ...prev,
      produce: prev.produce + offlineModal.earned,
      lifetimeProduce: prev.lifetimeProduce + offlineModal.earned,
    }));
    setOfflineModal(null);
  };

  const toggleSound = () => {
    const next = soundManager.toggleMute();
    setMuted(next);
  };

  const currentAnimal = ANIMALS[state.selectedAnimal];
  const clickPower = calculateClickPower(state);
  const pps = calculatePps(state);
  const frenzyRemainingSeconds = Math.ceil(state.goldenEvent.frenzyRemainingMs / 1000);

  return (
    <div className="relative w-full max-w-5xl mx-auto min-h-[580px] bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-100 rounded-[28px] border-4 border-white shadow-tile overflow-hidden select-none font-display">
      {/* Top Status Header */}
      <header className="px-4 py-3 bg-white/90 backdrop-blur border-b border-line flex items-center justify-between gap-2 z-10 relative">
        <div className="flex items-center gap-3">
          <span className="text-3xl p-1 bg-amber-100 rounded-xl border border-amber-200">
            {currentAnimal.emoji}
          </span>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                {Math.floor(state.produce).toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm font-bold text-brand-deep">
                {currentAnimal.produceName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-ink-soft">
              <span className="text-farm-deep">
                +{pps.toLocaleString()} / sec
              </span>
              <span>&bull;</span>
              <span className="text-puzzle-deep">
                +{clickPower.toLocaleString()} / click
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {state.goldenEvent.frenzyActive && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-xs font-black animate-pulse shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>7x FRENZY ({frenzyRemainingSeconds}s)</span>
            </div>
          )}

          <button
            onClick={() => setShowHowTo(true)}
            aria-label="How to play"
            className="p-2 rounded-xl bg-white hover:bg-paper border border-line text-ink-soft hover:text-ink transition-transform active:scale-95"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={toggleSound}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            className="p-2 rounded-xl bg-white hover:bg-paper border border-line text-ink-soft hover:text-ink transition-transform active:scale-95"
          >
            {muted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
          </button>
        </div>
      </header>

      {/* Main Game Stage */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        {/* Left / Center Area: Hero Animal Arena */}
        <div className="md:col-span-7 p-4 flex flex-col items-center justify-between relative overflow-hidden">
          {/* Active Hat Badge */}
          {state.equippedHat && state.hats[state.equippedHat] && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-white/80 rounded-full border border-line text-xs font-bold text-ink flex items-center gap-1.5 shadow-sm">
              <span>{state.hats[state.equippedHat].emoji}</span>
              <span>{state.hats[state.equippedHat].name} (+{Math.round((state.hats[state.equippedHat].clickMultiplier - 1) * 100)}% Click)</span>
            </div>
          )}

          {/* Golden Event Floating Butterfly */}
          {state.goldenEvent.active && (
            <button
              onClick={onGoldenEventClick}
              style={{
                position: 'absolute',
                left: `${state.goldenEvent.x}%`,
                top: `${state.goldenEvent.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="z-30 p-3 bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full shadow-lg border-2 border-white animate-bounce hover:scale-125 transition-transform cursor-pointer"
              aria-label="Click golden frenzy event"
            >
              <span className="text-3xl filter drop-shadow">🦋</span>
              <span className="absolute -top-1 -right-1 text-xs">✨</span>
            </button>
          )}

          {/* Central Hero Click Target */}
          <div className="flex-1 flex flex-col items-center justify-center my-6 z-10">
            <div
              onClick={handleAnimalClick}
              onTouchStart={handleAnimalClick}
              className={`relative cursor-pointer select-none transition-transform duration-100 ease-out flex flex-col items-center ${
                isBouncing ? 'scale-90' : 'scale-100 hover:scale-105'
              }`}
            >
              {/* Floating Equipped Hat directly above the animal */}
              {state.equippedHat && state.hats[state.equippedHat] && (
                <div className="text-4xl sm:text-5xl -mb-4 z-20 animate-bounce filter drop-shadow">
                  {state.hats[state.equippedHat].emoji}
                </div>
              )}

              {/* Pulsing Radiant Ring */}
              <div
                className={`w-48 h-48 sm:w-60 sm:h-60 rounded-full flex items-center justify-center shadow-lift border-8 border-white ${
                  state.goldenEvent.frenzyActive ? 'ring-8 ring-amber-400 animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: currentAnimal.colorScheme.bg,
                }}
              >
                <span className="text-7xl sm:text-8xl select-none filter drop-shadow-md">
                  {currentAnimal.emoji}
                </span>
              </div>

              {/* Click Callout */}
              <span className="mt-4 px-4 py-1.5 rounded-full bg-white/90 border border-line text-xs sm:text-sm font-bold text-ink shadow-sm">
                Tap to harvest {currentAnimal.produceEmoji}!
              </span>
            </div>
          </div>

          {/* Animal Switcher Rack */}
          <div className="w-full bg-white/70 backdrop-blur rounded-2xl p-2.5 border border-line z-10">
            <div className="text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1.5 text-center">
              Choose Your Companion Critter
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.keys(ANIMALS) as AnimalSpecies[]).map((sp) => {
                const a = ANIMALS[sp];
                const unlocked = isAnimalUnlocked(state, sp);
                const isSelected = state.selectedAnimal === sp;

                return (
                  <button
                    key={sp}
                    disabled={!unlocked}
                    onClick={() => onSelectAnimal(sp)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-brand text-white shadow-sm ring-2 ring-brand-deep scale-105'
                        : unlocked
                        ? 'bg-white hover:bg-paper text-ink border border-line'
                        : 'bg-black/5 text-ink-faint opacity-50 cursor-not-allowed border border-dashed border-line'
                    }`}
                  >
                    <span className="text-2xl">{unlocked ? a.emoji : '🔒'}</span>
                    <span className="text-[10px] font-bold truncate max-w-full mt-0.5">
                      {a.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Area: Upgrades, Buildings & Hats Tabs */}
        <div className="md:col-span-5 bg-white/95 border-t md:border-t-0 md:border-l border-line flex flex-col h-full max-h-[560px]">
          {/* Tab Navigation */}
          <nav className="flex border-b border-line bg-paper/50">
            <button
              onClick={() => setActiveTab('buildings')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
                activeTab === 'buildings'
                  ? 'border-brand text-brand-deep bg-white'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              🌾 Farmhands
            </button>
            <button
              onClick={() => setActiveTab('upgrades')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
                activeTab === 'upgrades'
                  ? 'border-brand text-brand-deep bg-white'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              🧤 Click Power
            </button>
            <button
              onClick={() => setActiveTab('hats')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
                activeTab === 'hats'
                  ? 'border-brand text-brand-deep bg-white'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              👑 Hats
            </button>
          </nav>

          {/* Tab Content List */}
          <div className="p-3 overflow-y-auto flex-1 space-y-2">
            {/* Buildings Tab */}
            {activeTab === 'buildings' && (
              <>
                {Object.values(state.buildings).map((b) => {
                  const cost = getBuildingCost(b);
                  const canAfford = state.produce >= cost;

                  return (
                    <div
                      key={b.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        canAfford
                          ? 'bg-white border-line shadow-sm hover:border-farm'
                          : 'bg-paper/40 border-line/60 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-3xl p-1.5 bg-paper rounded-xl border border-line">
                          {b.emoji}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-ink truncate">
                            {b.name}
                          </div>
                          <div className="text-[11px] font-semibold text-farm-deep">
                            +{b.basePps.toLocaleString()} / sec each
                          </div>
                          <div className="text-[10px] text-ink-soft truncate">
                            Owned: <strong className="text-ink">{b.count}</strong>
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={!canAfford}
                        onClick={() => onBuyBuilding(b.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          canAfford
                            ? 'bg-farm text-white hover:bg-farm-deep active:scale-95 shadow-sm cursor-pointer'
                            : 'bg-line text-ink-faint cursor-not-allowed'
                        }`}
                      >
                        {cost.toLocaleString()} 🐾
                      </button>
                    </div>
                  );
                })}
              </>
            )}

            {/* Click Upgrades Tab */}
            {activeTab === 'upgrades' && (
              <>
                {Object.values(state.clickUpgrades).map((up) => {
                  const cost = getUpgradeCost(up);
                  const canAfford = state.produce >= cost;

                  return (
                    <div
                      key={up.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        canAfford
                          ? 'bg-white border-line shadow-sm hover:border-puzzle'
                          : 'bg-paper/40 border-line/60 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-3xl p-1.5 bg-paper rounded-xl border border-line">
                          {up.emoji}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-ink truncate">
                            {up.name}
                          </div>
                          <div className="text-[11px] font-semibold text-puzzle-deep">
                            {up.description}
                          </div>
                          <div className="text-[10px] text-ink-soft truncate">
                            Level: <strong className="text-ink">{up.level}</strong>
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={!canAfford}
                        onClick={() => onBuyUpgrade(up.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          canAfford
                            ? 'bg-puzzle text-white hover:bg-puzzle-deep active:scale-95 shadow-sm cursor-pointer'
                            : 'bg-line text-ink-faint cursor-not-allowed'
                        }`}
                      >
                        {cost.toLocaleString()} 🐾
                      </button>
                    </div>
                  );
                })}
              </>
            )}

            {/* Hats & Cosmetics Tab */}
            {activeTab === 'hats' && (
              <>
                <div className="text-xs text-ink-soft mb-2 font-medium">
                  Equip stylish hats to boost your click multiplier!
                </div>
                {Object.values(state.hats).map((h) => {
                  const isEquipped = state.equippedHat === h.id;
                  const canAfford = state.produce >= h.cost;

                  return (
                    <div
                      key={h.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isEquipped
                          ? 'bg-brand-tint border-brand shadow-sm'
                          : h.unlocked
                          ? 'bg-white border-line shadow-sm'
                          : canAfford
                          ? 'bg-white border-line'
                          : 'bg-paper/40 border-line/60 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-3xl p-1.5 bg-paper rounded-xl border border-line">
                          {h.emoji}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-ink truncate">
                            {h.name}
                          </div>
                          <div className="text-[11px] font-semibold text-brand-deep">
                            +{Math.round((h.clickMultiplier - 1) * 100)}% Click Power
                          </div>
                        </div>
                      </div>

                      {h.unlocked ? (
                        <button
                          onClick={() => onEquipHat(isEquipped ? null : h.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            isEquipped
                              ? 'bg-line text-ink-soft hover:bg-slate-200'
                              : 'bg-brand text-white hover:bg-brand-deep shadow-sm'
                          }`}
                        >
                          {isEquipped ? 'Unequip' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => onBuyHat(h.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            canAfford
                              ? 'bg-brand text-white hover:bg-brand-deep shadow-sm cursor-pointer'
                              : 'bg-line text-ink-faint cursor-not-allowed'
                          }`}
                        >
                          {h.cost.toLocaleString()} 🐾
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Click Numbers */}
      <div className="pointer-events-none fixed inset-0 z-50">
        {floatingTexts.map((f) => (
          <div
            key={f.id}
            style={{
              position: 'absolute',
              left: f.x,
              top: f.y,
              color: f.color,
              animation: 'floatUp 0.8s ease-out forwards',
            }}
            className="text-base sm:text-lg font-black filter drop-shadow"
          >
            {f.text}
          </div>
        ))}
      </div>

      {/* Offline Earnings Welcome Modal */}
      {offlineModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-lift border border-line">
            <span className="text-5xl mb-3 block">🌾🚜</span>
            <h3 className="text-2xl font-bold text-ink mb-1">Welcome Back!</h3>
            <p className="text-xs text-ink-soft mb-4">
              While you were resting, your diligent farmhands were hard at work harvesting treats!
            </p>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 mb-5">
              <div className="text-3xl font-extrabold text-brand-deep mb-1">
                +{offlineModal.earned.toLocaleString()} 🐾
              </div>
              <div className="text-[11px] font-semibold text-ink-soft">
                Collected across {Math.floor(offlineModal.seconds / 60)} minutes
              </div>
            </div>
            <button
              onClick={onClaimOffline}
              className="w-full py-3 bg-brand text-white hover:bg-brand-deep font-bold rounded-2xl text-sm shadow-sm transition-transform active:scale-95"
            >
              Collect Produce &amp; Play!
            </button>
          </div>
        </div>
      )}

      {/* How To Play Modal */}
      {showHowTo && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-lift border border-line">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-ink">How to Play</h3>
              <button
                onClick={() => setShowHowTo(false)}
                className="text-ink-soft hover:text-ink font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-ink-soft leading-relaxed mb-5">
              <p>
                <strong>1. Tap the Central Pet:</strong> Click your friendly farm animal to harvest produce and pats.
              </p>
              <p>
                <strong>2. Hire Farmhands:</strong> Spend pats on mechanical hands, puppies, and tractors to earn passive produce every second.
              </p>
              <p>
                <strong>3. Unlock Critters &amp; Hats:</strong> Gather lifetime produce to switch between Sunny Corgi, Capybara, Bessie Cow, and Penny Piglet!
              </p>
              <p>
                <strong>4. Catch Golden Butterflies:</strong> Tap random flying butterflies to trigger a 15-second 7x Golden Frenzy!
              </p>
            </div>
            <button
              onClick={() => setShowHowTo(false)}
              className="w-full py-2.5 bg-brand text-white hover:bg-brand-deep font-bold rounded-xl text-xs transition-transform active:scale-95"
            >
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* Keyframe animation for floating text */}
      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px) scale(1.15);
          }
        }
      `}</style>
    </div>
  );
};

export default FarmAnimalClickerContainer;
