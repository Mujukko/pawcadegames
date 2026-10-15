import React from 'react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-16 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🐶</span>
              <span className="font-black text-xl text-white tracking-tight">PAWCADE</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-4">
              Pawcade is an independent casual browser gaming platform dedicated to charming, high-quality, instant-play pet games. No installs, no app store friction, 100% free fun for players across the United States.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational • HTML5 WebGL Engine</span>
            </div>
          </div>

          {/* Featured Games */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
              Featured Games
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/games/dog-parking/')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  🐶 Dog Parking (Play Now)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/games/cat-parking/')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  🐱 Cat Parking (Play Now)
                </button>
              </li>
              <li>
                <span className="text-slate-500">Cat Cafe Rush (Coming Soon)</span>
              </li>
              <li>
                <span className="text-slate-500">Hamster Ball Dash (Coming Soon)</span>
              </li>
            </ul>
          </div>

          {/* Quick Links & Legal */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Home / Catalog
                </button>
              </li>
              <li>
                <span className="text-slate-500">Privacy Policy</span>
              </li>
              <li>
                <span className="text-slate-500">Terms of Service</span>
              </li>
              <li>
                <span className="text-slate-500">Contact & Support</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Pawcade. Original artwork and gameplay. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Built with React + Phaser 3</span>
            <span>•</span>
            <span>Zero Tracking Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
