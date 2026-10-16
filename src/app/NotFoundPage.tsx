import React from 'react';
import { Home, Play } from 'lucide-react';

interface NotFoundPageProps {
  navigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-24 h-24 rounded-3xl bg-slate-900 border-2 border-orange-500/40 flex items-center justify-center text-5xl mb-6 shadow-xl shadow-orange-950/40 animate-spooky-float">
        👻
      </div>

      <span className="text-xs font-black tracking-widest uppercase bg-orange-500/20 text-orange-400 border border-orange-500/40 px-3 py-1 rounded-full mb-3">
        Spooky 404
      </span>

      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
        Boo! This Page Vanished into the Night 🎃
      </h1>

      <p className="text-slate-300 max-w-md text-sm sm:text-base mb-8 leading-relaxed">
        We searched the haunted pumpkin patch, but couldn't find the page you were looking for. A ghost might have whisked it away!
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="w-full sm:w-auto px-6 py-3.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm transition-transform hover:scale-105 cursor-pointer min-h-[44px]"
        >
          <Home className="w-4 h-4" />
          <span>Back to Spooky Home 🎃</span>
        </button>

        <button
          onClick={() => navigate('/games/duck-runner/')}
          className="w-full sm:w-auto px-6 py-3.5 bg-purple-700 hover:bg-purple-600 text-white font-black rounded-2xl shadow-lg border border-purple-400/40 flex items-center justify-center gap-2 text-sm transition-transform hover:scale-105 cursor-pointer min-h-[44px]"
        >
          <Play className="w-4 h-4 fill-white text-white" />
          <span>Play Vampire Duck Instead 🦆</span>
        </button>
      </div>
    </div>
  );
};
