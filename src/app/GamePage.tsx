import React, { useState, useEffect, Suspense } from 'react';
import { ChevronRight, HelpCircle, Lightbulb, Monitor, Smartphone } from 'lucide-react';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';
import { GameCard } from '../components/GameCard';
import { GameIntroModal, GAME_INTROS } from '../components/GameIntroModal';
import { analytics } from '../lib/analytics';
import { CATEGORY_LABELS, buildGameFaqs, getRelatedGames, shortTitle, stripEmoji } from '../lib/gameSeo';
import { handleNavClick } from '../lib/navClick';
import { GAME_COMPONENTS } from './gameComponents';

const GameLoadingFallback: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex flex-col items-center justify-center min-h-[460px] sm:min-h-[580px] w-full text-center text-white/90">
    <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-brand animate-spin mb-4" />
    <p className="font-display text-lg font-semibold">Loading {name}…</p>
  </div>
);

const SectionCard: React.FC<{ title: string; children: React.ReactNode; id: string }> = ({ title, children, id }) => (
  <section aria-labelledby={id} className="bg-card rounded-[22px] shadow-card p-5 sm:p-6">
    <h2 id={id} className="font-display text-xl font-semibold text-ink mb-4">
      {title}
    </h2>
    {children}
  </section>
);

interface GamePageProps {
  navigate: (path: string) => void;
  gameId?: string;
}

export const GamePage: React.FC<GamePageProps> = ({ navigate, gameId = 'dog-parking' }) => {
  const game = GAMES_REGISTRY.find((g) => g.id === gameId) || GAMES_REGISTRY[0]!;
  const GameComponent = GAME_COMPONENTS[game.id] ?? GAME_COMPONENTS['dog-parking']!;
  const intro = GAME_INTROS[game.id];
  const name = shortTitle(game);
  const relatedGames = getRelatedGames(game, GAMES_REGISTRY, 8);
  const sidebarGames = relatedGames.slice(0, 6);
  const faqs = buildGameFaqs(game, intro, relatedGames);
  const categoryHref = `/category/${game.category}/`;

  // How-to-play dialog opens on first visit to each game until the player opts out
  const [isIntroOpen, setIsIntroOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`pawcade_intro_seen_${gameId}`) !== 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      setIsIntroOpen(localStorage.getItem(`pawcade_intro_seen_${gameId}`) !== 'true');
    } catch {
      setIsIntroOpen(true);
    }
  }, [gameId]);

  useEffect(() => {
    window.scrollTo(0, 0);
    analytics.track('game_loaded', { gameId });

    // On short viewports, bring the game frame into view so it is not hidden below the title
    if (typeof window !== 'undefined' && window.innerHeight <= 760) {
      setTimeout(() => {
        document.getElementById('playable-game-frame')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }, [gameId]);

  return (
    <div className="max-w-7xl mx-auto w-full px-2 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-safe">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="px-1 mb-2 sm:mb-3 flex items-center gap-1 text-xs sm:text-sm text-ink-soft short-screen-compact">
        <a href="/" onClick={(e) => handleNavClick(e, () => navigate('/'))} className="hover:text-ink">
          Home
        </a>
        <ChevronRight className="w-3.5 h-3.5 text-ink-faint" />
        <a href={categoryHref} onClick={(e) => handleNavClick(e, () => navigate(categoryHref))} className="hover:text-ink">
          {CATEGORY_LABELS[game.category]}
        </a>
        <ChevronRight className="w-3.5 h-3.5 text-ink-faint" />
        <span className="text-ink font-semibold truncate">{name}</span>
      </nav>

      {/* Title row */}
      <div className="px-1 mb-3 sm:mb-5 flex items-start justify-between gap-3 short-screen-condense-title">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-4xl font-semibold text-ink tracking-tight leading-tight">
            {stripEmoji(game.title)}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-ink-soft max-w-2xl line-clamp-2 sm:line-clamp-none">{game.tagline}</p>
        </div>
        <button
          onClick={() => setIsIntroOpen(true)}
          aria-label="How to play"
          className="shrink-0 inline-flex items-center gap-2 h-11 px-4 rounded-2xl bg-white text-ink font-display font-semibold shadow-[0_4px_0_rgb(27_60_110/0.16)] active:translate-y-1 active:shadow-none cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">How to play</span>
        </button>
      </div>

      {/* Game stage + sidebar */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-6 mb-8 sm:mb-10">
        <div
          id="playable-game-frame"
          className="bg-stage rounded-[22px] sm:rounded-[28px] ring-4 ring-white shadow-tile p-1 sm:p-5 flex justify-center overflow-hidden short-screen-game-frame"
        >
          <Suspense fallback={<GameLoadingFallback name={name} />}>
            <GameComponent />
          </Suspense>
        </div>

        <aside aria-labelledby="sidebar-heading" className="hidden lg:block">
          <h2 id="sidebar-heading" className="font-display text-lg font-semibold text-ink mb-3">
            More like this
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {sidebarGames.map((g) => (
              <GameCard key={g.id} game={g} onClick={() => navigate(g.route)} />
            ))}
          </div>
        </aside>
      </div>

      <div className="px-1 space-y-5">
        {/* How to play + controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionCard title={`How to play ${name}`} id="how-to-play-heading">
            {intro ? (
              <>
                <p className="text-sm text-ink leading-relaxed mb-4">
                  <span className="font-bold">Goal: </span>
                  {intro.goal}
                </p>
                <ol className="space-y-3">
                  {intro.steps.map((step, idx) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-brand-tint text-brand-deep font-display font-semibold text-sm flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-relaxed">
                        <span className="block font-bold text-ink">{step.title.replace(/^\d+\.\s*/, '')}</span>
                        <span className="text-ink-soft">{step.desc}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="text-sm text-ink-soft leading-relaxed">{game.description}</p>
            )}
          </SectionCard>

          <SectionCard title="Controls" id="controls-heading">
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-ink mb-1.5">
                  <Monitor className="w-4 h-4 text-ink-soft" /> Computer
                </h3>
                <ul className="space-y-1 text-ink-soft list-disc pl-5">
                  {game.controls.desktop.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-bold text-ink mb-1.5">
                  <Smartphone className="w-4 h-4 text-ink-soft" /> Phone & tablet
                </h3>
                <ul className="space-y-1 text-ink-soft list-disc pl-5">
                  {game.controls.mobile.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              {intro?.proTip && (
                <p className="flex gap-2 p-3 rounded-xl bg-paper text-ink leading-relaxed">
                  <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-brand" />
                  <span>{intro.proTip}</span>
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard title={`About ${name}`} id="about-heading">
          <p className="text-sm text-ink-soft leading-relaxed mb-4 max-w-3xl">{game.description}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-ink-soft list-disc pl-5">
            {game.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </SectionCard>

        {faqs.length > 0 && (
          <SectionCard title="Questions players ask" id="faq-heading">
            <div className="divide-y divide-line">
              {faqs.map((f) => (
                <div key={f.question} className="py-3 first:pt-0 last:pb-0">
                  <h3 className="font-bold text-ink text-sm mb-1">{f.question}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {relatedGames.length > 0 && (
          <section aria-labelledby="related-games-heading" className="pt-4">
            <h2 id="related-games-heading" className="font-display text-2xl font-semibold text-ink mb-4">
              More games you'll like
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
              {relatedGames.map((g) => (
                <GameCard key={g.id} game={g} onClick={() => navigate(g.route)} />
              ))}
            </div>
          </section>
        )}
      </div>

      <GameIntroModal gameId={game.id} isOpen={isIntroOpen} onClose={() => setIsIntroOpen(false)} />
    </div>
  );
};
