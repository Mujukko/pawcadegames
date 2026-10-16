import React, { useEffect } from 'react';
import { PetCandyCrushContainer } from '../games/pet-candy-crush/PetCandyCrushContainer';
import { FlappyChickenContainer } from '../games/flappy-chicken/FlappyChickenContainer';
import { Animal2048Container } from '../games/animal-2048/Animal2048Container';
import { DogParkingContainer } from '../games/dog-parking/DogParkingContainer';
import { CatParkingContainer } from '../games/cat-parking/CatParkingContainer';
import { AnimalFarmParkingContainer } from '../games/animal-farm-parking/AnimalFarmParkingContainer';
import { FarmTetrisContainer } from '../games/farm-tetris/FarmTetrisContainer';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';
import { ChevronRight, Star, Sparkles, Keyboard, Smartphone, CheckCircle2, Shield, Heart } from 'lucide-react';

interface GamePageProps {
  navigate: (path: string) => void;
  gameId?: string;
}

export const GamePage: React.FC<GamePageProps> = ({ navigate, gameId = 'dog-parking' }) => {
  const isPetCrush = gameId === 'pet-candy-crush';
  const isFlappy = gameId === 'flappy-chicken';
  const is2048 = gameId === 'animal-2048';
  const isFarmTetris = gameId === 'farm-tetris';
  const isCat = gameId === 'cat-parking';
  const isFarm = gameId === 'animal-farm-parking';
  const game = GAMES_REGISTRY.find(g => g.id === gameId) || GAMES_REGISTRY[0]!;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [gameId]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/60 pb-16 pb-safe">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200/80 py-2 sm:py-3 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center text-xs font-semibold text-slate-500 gap-1.5 overflow-x-auto scrollbar-none">
          <button onClick={() => navigate('/')} className="hover:text-slate-900 transition-colors cursor-pointer shrink-0">
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <button onClick={() => navigate('/')} className="hover:text-slate-900 transition-colors cursor-pointer shrink-0">
            {isPetCrush ? 'Match-3 Mania' : isFlappy ? 'Farm Flight' : is2048 ? 'Animal Puzzle' : isFarmTetris ? 'Harvest Puzzle' : isFarm ? 'Casual Driving' : 'Puzzle Games'}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-bold truncate">{game.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-3 sm:pt-8 w-full">
        {/* Game Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-6 px-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isPetCrush
                  ? 'bg-amber-100 text-amber-900'
                  : isFlappy
                  ? 'bg-amber-100 text-amber-900'
                  : is2048
                  ? 'bg-purple-100 text-purple-900'
                  : isFarmTetris
                  ? 'bg-amber-100 text-amber-900'
                  : isFarm
                  ? 'bg-emerald-100 text-emerald-800'
                  : isCat
                  ? 'bg-pink-100 text-pink-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {isPetCrush ? '🌾 Farm Match-3 Crush' : isFlappy ? '🐔 New Flappy Chicken' : is2048 ? '🐘 New Animal 2048' : isFarmTetris ? '🌾 New Harvest Tetris' : isFarm ? '🐮 New Farm Driving' : isCat ? '🐱 New Feline Puzzle' : '🐶 Featured Puzzle'}
              </span>
              <div className="flex items-center text-amber-500 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                <span>{game.rating} / 5.0 (Instant Play)</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {game.title}
            </h1>
            <p className="text-slate-600 text-xs sm:text-base mt-0.5 sm:mt-1 max-w-2xl line-clamp-2 sm:line-clamp-none">
              {game.tagline}
            </p>
          </div>
        </div>

        {/* The Playable Game Frame */}
        <div className="bg-slate-900/5 rounded-2xl sm:rounded-3xl p-1 sm:p-6 border border-slate-200/80 mb-8 sm:mb-12 shadow-inner flex justify-center overflow-hidden">
          {isPetCrush ? (
            <PetCandyCrushContainer />
          ) : isFlappy ? (
            <FlappyChickenContainer />
          ) : is2048 ? (
            <Animal2048Container />
          ) : isFarmTetris ? (
            <FarmTetrisContainer />
          ) : isFarm ? (
            <AnimalFarmParkingContainer />
          ) : isCat ? (
            <CatParkingContainer />
          ) : (
            <DogParkingContainer />
          )}
        </div>

        {/* Instructions & Controls Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Controls */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Keyboard className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Controls & Shortcuts</h2>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              {isPetCrush ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 min-w-24">Desktop:</span>
                    <span>Click on any animal to select it, then click an adjacent neighbor to swap them (or click and drag in any direction). Match 3 or more identical farm animals to clear them!</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 min-w-24">Mobile:</span>
                    <span>Tap a farm animal and tap its neighbor, or swipe your thumb across the grid to swap animals instantly.</span>
                  </div>
                </>
              ) : isFlappy ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 min-w-24">Desktop:</span>
                    <span>Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">Spacebar</kbd>, <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">↑</kbd>, or <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">W</kbd> to flap Clucky's wings and cluck. You can also click your mouse anywhere on the game screen. Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">P</kbd> to pause and <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">R</kbd> to restart.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 min-w-24">Mobile:</span>
                    <span>Tap anywhere directly on the flight canvas, or use the large yellow <strong>TAP TO FLAP</strong> button at the bottom for easy thumb control.</span>
                  </div>
                </>
              ) : is2048 ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 min-w-24">Desktop:</span>
                    <span>Use <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">Arrow Keys</kbd> or <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">W</kbd><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">A</kbd><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">S</kbd><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">D</kbd> to slide tiles across the 4x4 grid. Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">Ctrl + Z</kbd> or click the <strong>Undo</strong> button to step back one move.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 min-w-24">Mobile:</span>
                    <span>Swipe in any of the 4 directions (Up, Down, Left, Right) anywhere across the board, or use the on-screen touch D-Pad buttons at the bottom.</span>
                  </div>
                </>
              ) : isFarmTetris ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 min-w-24">Desktop:</span>
                    <span>Use <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">A</kbd><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">D</kbd> or <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">←</kbd><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">→</kbd> to move pieces left/right. Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">W</kbd> / <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">↑</kbd> to rotate, <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">S</kbd> / <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">↓</kbd> for soft drop, <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">Space</kbd> for Hard Drop slam, <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">C</kbd> / <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">Shift</kbd> to hold, and <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">R</kbd> to restart.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 min-w-24">Mobile:</span>
                    <span>Use the bottom touch D-Pad to steer, tap the Rotate button to turn crops, tap SLAM to instantly drop, and tap HOLD to reserve pieces.</span>
                  </div>
                </>
              ) : isFarm ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 min-w-24">Desktop:</span>
                    <span>Use <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">W</kbd><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">A</kbd><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">S</kbd><kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">D</kbd> or <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">Arrow Keys</kbd> to move freely in all 4 directions (Up, Down, Left, Right). Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">Space</kbd> to brake and <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">R</kbd> to restart.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 min-w-24">Mobile:</span>
                    <span>Use the on-screen 4-way D-Pad (Up, Down, Left, Right) and center STOP button for smooth touch steering.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 min-w-24">Desktop:</span>
                    <span>Click and drag {isCat ? 'cats' : 'dogs'} along their natural lane (horizontal or vertical). Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">R</kbd> to restart or <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">Z</kbd> to undo.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-900 min-w-24">Mobile:</span>
                    <span>Swipe with your finger along the animal's axis. Large touch-friendly control buttons at the top of the board.</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Game Rules */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black text-slate-900">How to Win</h2>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-600">
              {isPetCrush ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Match 3 identical farm animals (🐮, 🐷, 🐑, 🐔, 🦆, 🐴) horizontally or vertically to gather them and score points!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Match a <strong>2×2 Square</strong> to craft a <strong>Dynamite Bomb (🧨)</strong> that blasts a 3×3 + Cross (+) area and fires 2 homing strikes!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Match <strong>4 in a line</strong> for a <strong>Striped Line Rocket (⚡)</strong>, <strong>L or T shape</strong> for a <strong>3×3 Barrel Bomb (💣)</strong>, or <strong>5 in a row</strong> for a <strong>Golden Barn Star (🌟)</strong>!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Double-tap any bomb to detonate it in-place, or swap 2 bombs together for a <strong>Mega 5×5 Crater Explosion</strong>!</span>
                  </li>
                </>
              ) : isFlappy ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Flap your wings to stay airborne and steer through the openings between rustic fence pillars.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Watch your live <strong>Flight to Golden Wheat Progress Meter</strong> at the top fill from 0% to 100%!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Collect floating golden grain kernels in the middle of fence openings for bonus harvest points!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Clear <strong>15 farm gates</strong> to reach the grand <strong>Golden Wheat Field & Granary (🌾)</strong> and feast on the harvest!</span>
                  </li>
                </>
              ) : is2048 ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Slide the grid in 4 directions to merge identical animal tiles (e.g. <strong>🐭 Mouse + 🐭 Mouse = 🐹 Hamster</strong>).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Follow the 12-animal ladder: 🐭 Mouse ➔ 🐹 Hamster ➔ 🐰 Bunny ➔ 🐱 Cat ➔ 🐶 Dog ➔ 🦊 Fox ➔ 🦌 Deer ➔ 🐗 Wild Boar ➔ 🐻 Grizzly Bear ➔ 🦏 Rhino ➔ <strong>🐘 Elephant (2048)</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Reaching the mighty <strong>🐘 Elephant</strong> unlocks the royal trumpet fanfare celebration and enters Endless Mode!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Push beyond 2048 to unlock the supreme titan: <strong>🐋 Blue Whale (4096)</strong>!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Use the <strong>1-step Undo button</strong> if you get stuck or make an accidental slide.</span>
                  </li>
                </>
              ) : isFarmTetris ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Stack falling harvest crops to complete horizontal lines and clear rows.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Watch golden hay burst into the <strong>Hay Silo</strong> on the right! Every line adds <strong>10% silo capacity</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Cheer with the <strong>cute farmer</strong> sitting on top of the silo as he waves and yells <strong>"WOW!"</strong> when lines pop!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Fill the silo to 100% to complete silos, advance your level, and build your high score!</span>
                  </li>
                </>
              ) : isFarm ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Maneuver Bessie into the designated stall marked with the <strong>🐮 Cow Logo & 🥛 Milk Emblem</strong> with at least <strong>80% accuracy</strong> and come to a complete stop.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Avoid collisions with fences, tractors, hay bales, and sheep — contact <strong>drains your health % continuously</strong>!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Park cleanly with high health and accuracy to earn up to 3 stars across all 8 farm levels!</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>{isCat ? 'Luna the Star Cat' : 'Sunny the Star Corgi'}</strong> must reach the green <strong>EXIT ➔</strong> gate on the right.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Pets cannot turn corners or jump over each other.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Earn up to 3 stars by completing each puzzle in the minimum possible moves!</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
