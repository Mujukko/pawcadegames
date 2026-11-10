import React from 'react';
import { handleNavClick } from '../lib/navClick';
import { INFO_PAGES } from '../lib/sitePages';
import { Logo } from './Logo';

interface FooterProps {
  navigate: (path: string) => void;
}

const COLUMNS: Array<{ heading: string; links: Array<{ href: string; label: string }> }> = [
  {
    heading: 'Popular games',
    links: [
      { href: '/games/dog-parking/', label: 'Dog Parking' },
      { href: '/games/farm-mini-mart/', label: 'Farm Mini Mart' },
      { href: '/games/farm-block-blast/', label: 'Farm Block Blast' },
      { href: '/games/cluster-rush/', label: 'Cluster Rush' },
      { href: '/games/duck-hunt-classic/', label: 'Duck Hunt Classic' },
      { href: '/games/animal-2048/', label: 'Animal 2048' },
    ],
  },
  {
    heading: 'Categories',
    links: [
      { href: '/popular/', label: 'Popular games' },
      { href: '/category/puzzle/', label: 'Puzzle games' },
      { href: '/category/farm/', label: 'Farm games' },
      { href: '/category/arcade/', label: 'Arcade games' },
      { href: '/category/pets/', label: 'Cat & dog games' },
      { href: '/category/dog-games/', label: 'Dog games' },
      { href: '/category/cat-games/', label: 'Cat games' },
      { href: '/category/duck-games/', label: 'Duck games' },
    ],
  },
  {
    heading: 'Game topics',
    links: [
      { href: '/category/io-games/', label: '.io games' },
      { href: '/category/merge-games/', label: 'Merge & 2048 games' },
      { href: '/category/runner-games/', label: 'Runner & jump games' },
      { href: '/category/parking-games/', label: 'Parking & driving' },
      { href: '/category/idle-games/', label: 'Idle & tycoon games' },
      { href: '/category/solitaire-games/', label: 'Solitaire & mahjong' },
      { href: '/category/word-games/', label: 'Word & brain games' },
      { href: '/category/physics-games/', label: 'Physics & skill' },
    ],
  },
  {
    heading: 'Pawcade',
    links: INFO_PAGES.map((p) => ({ href: p.route, label: p.navLabel })),
  },
];

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="mt-16 bg-paper-deep border-t border-line text-ink-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <a href="/" onClick={(e) => handleNavClick(e, () => navigate('/'))} aria-label="Pawcade Games home">
              <Logo />
            </a>
            <p className="text-sm leading-relaxed max-w-xs">
              Free animal and farm games that play right in your browser. No downloads, no accounts.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h2 className="font-display text-base font-semibold text-ink mb-3">{col.heading}</h2>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      onClick={(e) => handleNavClick(e, () => navigate(l.href))}
                      className="hover:text-ink hover:underline underline-offset-4"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 pt-6 border-t border-line text-xs text-ink-faint">
          © {new Date().getFullYear()} Pawcade Games. Made by an independent studio.
        </p>
      </div>
    </footer>
  );
};
