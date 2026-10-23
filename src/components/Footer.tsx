import React from 'react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 sm:py-16 border-t border-slate-800 mt-16 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10">
          {/* Brand Col */}
          <div className="lg:col-span-1 space-y-3">
            <div
              onClick={() => navigate('/')}
              className="cursor-pointer inline-block"
            >
              <img
                src="/assets/branding/logo-pawcade.svg"
                alt="Pawcade Games"
                className="h-9 w-auto"
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Instant casual browser games for all ages. Handcrafted puzzle, arcade, tycoon, and pet adventures playable immediately with zero downloads and zero friction.
            </p>
            <div className="text-[11px] text-amber-400/90 font-medium">
              🇺🇸 Designed for the US Casual Gaming Community
            </div>
          </div>

          {/* Popular Casual Games */}
          <div>
            <h4 className="text-amber-400 font-extrabold text-xs uppercase tracking-wider mb-3.5">
              Popular Games
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => navigate('/games/dog-parking/')}
                  className="hover:text-amber-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>🐕‍🦺 Dog Parking (Traffic Jam)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/games/farm-mini-mart/')}
                  className="hover:text-amber-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>🏪 Farm Mini Mart (Idle Tycoon)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/games/duck-runner/')}
                  className="hover:text-amber-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>🦆 Duck Runner (Endless Jump)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/games/pet-candy-crush/')}
                  className="hover:text-amber-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>🍬 Farm Animal Match-3</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/games/chef-rat-rush/')}
                  className="hover:text-amber-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>🐭 Chef Rat Rush (Bistro Cooking)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/games/animal-2048/')}
                  className="hover:text-amber-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>🐘 Animal 2048 Evolution</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-amber-400 font-extrabold text-xs uppercase tracking-wider mb-3.5">
              Explore Genres
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-amber-300 transition-colors cursor-pointer text-left"
                >
                  🧩 Puzzles & Brain Teasers
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-amber-300 transition-colors cursor-pointer text-left"
                >
                  🌾 Farm & Simulation Tycoon
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-amber-300 transition-colors cursor-pointer text-left"
                >
                  ⚡ Reflex & Casual Arcade
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-amber-300 transition-colors cursor-pointer text-left"
                >
                  🐕‍🦺 Pets & Cozy Animal Games
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Quality Assurance */}
          <div>
            <h4 className="text-amber-400 font-extrabold text-xs uppercase tracking-wider mb-3.5">
              Platform Standards
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span>100% Free Online Games</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span>Zero Downloads / Zero Installs</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span>Chromebook & Mobile Touch Ready</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span>Family-Safe & Non-Violent</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Pawcade Games. All rights reserved. Independent browser game studio.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
