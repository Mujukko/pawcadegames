import React from 'react';
import { Home, Play } from 'lucide-react';

interface NotFoundPageProps {
  navigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-24 h-24 rounded-3xl bg-amber-100 flex items-center justify-center text-5xl mb-6 shadow-inner animate-pulse">
        🐶
      </div>

      <span className="text-xs font-black tracking-widest uppercase bg-rose-100 text-rose-700 px-3 py-1 rounded-full mb-3">
        Error 404
      </span>

      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
        Paws Up! This Page Wandered Off
      </h1>

      <p className="text-slate-600 max-w-md text-sm sm:text-base mb-8 leading-relaxed">
        We sniffed everywhere, but couldn't find the page you were looking for. It may have been moved, renamed, or buried in the yard!
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Back to Pawcade Home</span>
        </button>

        <button
          onClick={() => navigate('/games/dog-parking/')}
          className="w-full sm:w-auto px-6 py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>Play Dog Parking Instead</span>
        </button>
      </div>
    </div>
  );
};
