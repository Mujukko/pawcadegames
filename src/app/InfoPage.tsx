import React, { useEffect } from 'react';
import { INFO_PAGES, InfoPage as InfoPageData } from '../lib/sitePages';
import { handleNavClick } from '../lib/navClick';

interface InfoPageProps {
  page: InfoPageData;
  navigate: (path: string) => void;
}

export const InfoPage: React.FC<InfoPageProps> = ({ page, navigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page.id]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-xs font-semibold text-ink-soft mb-4 flex items-center gap-2">
        <a href="/" onClick={(e) => handleNavClick(e, () => navigate('/'))} className="hover:text-ink">
          Home
        </a>
        <span>&gt;</span>
        <span className="text-brand-deep">{page.navLabel}</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-semibold font-display text-ink mb-4">{page.h1}</h1>
      <p className="text-ink-soft text-base leading-relaxed mb-8">{page.intro}</p>

      {page.sections.map((sec) => (
        <section key={sec.heading} className="mb-6">
          <h2 className="text-xl font-bold text-ink mb-2">{sec.heading}</h2>
          {sec.paragraphs.map((para) => (
            <p key={para} className="text-sm text-ink-soft leading-relaxed mb-3">
              {para}
            </p>
          ))}
        </section>
      ))}

      <nav aria-label="Site information" className="mt-10 pt-6 border-t border-line flex flex-wrap gap-4 text-xs">
        <a href="/" onClick={(e) => handleNavClick(e, () => navigate('/'))} className="text-brand-deep hover:underline font-bold">
          ← All games
        </a>
        {INFO_PAGES.map((p) => (
          <a
            key={p.id}
            href={p.route}
            onClick={(e) => handleNavClick(e, () => navigate(p.route))}
            className="text-ink-soft hover:text-ink"
          >
            {p.navLabel}
          </a>
        ))}
      </nav>
    </div>
  );
};
