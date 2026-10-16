import React from 'react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-orange-500/30 mt-16 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl animate-spooky-float">🎃</span>
              <span className="font-black text-xl text-white tracking-tight">PAWCADE SPOOKTACULAR</span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                HALLOWEEN 🦇
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-4">
              Pawcade is celebrating Halloween with 100% free spooky browser games! Trick or treat with Quacky the Vampire Duck, Luna the Witch Cat, Ghost Clucky, and our haunted petting zoo! No downloads, no microtransactions, instant festive fun.
            </p>
            <div className="flex items-center gap-2 text-xs text-orange-400/90">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>🎃 Spooky Halloween Event Active • HTML5 & WebGL Engine</span>
            </div>
          </div>

          {/* Featured Spooky Games */}
          <div>
            <h4 className="text-orange-400 font-bold text-sm uppercase tracking-wider mb-3">
              Spooky Games
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/games/duck-runner/')}
                  className="hover:text-orange-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>🦆 Vampire Duck Quack</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/games/pet-candy-crush/')}
                  className="hover:text-orange-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>🍬 Farm Animal Match (Trick-or-Treat)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/games/flappy-chicken/')}
                  className="hover:text-orange-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>👻 Flappy Chicken (Night Flight)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/games/cat-parking/')}
                  className="hover:text-orange-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>🐈‍⬛ Cat Parking (Witch Cat)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/games/dog-parking/')}
                  className="hover:text-orange-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>🦴 Dog Parking (Ghost Pups)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links & Legal */}
          <div>
            <h4 className="text-orange-400 font-bold text-sm uppercase tracking-wider mb-3">
              Halloween Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-orange-300 transition-colors cursor-pointer"
                >
                  🎃 All Spooky Games
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

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Pawcade Spooktacular. Happy Halloween! 🎃👻🦇 Original artwork and gameplay.</p>
          <div className="flex items-center gap-4">
            <span className="text-orange-400/80">Trick or Treat 🍬</span>
            <span>•</span>
            <span>Zero Tracking Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
