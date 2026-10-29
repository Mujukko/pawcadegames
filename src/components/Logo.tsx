import React from 'react';

/** Paw-pad gamepad mark + wordmark. Renders on light backgrounds. */
export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-9 w-9 shrink-0">
      <rect x="0" y="4" width="48" height="40" rx="14" fill="#f0641e" />
      <rect x="3.5" y="7.5" width="41" height="33" rx="10.5" fill="#1b2a4b" />
      <ellipse cx="24" cy="27" rx="8" ry="6.5" fill="#f0641e" />
      <circle cx="14" cy="16.5" r="3.2" fill="#ffb547" />
      <circle cx="21" cy="13.5" r="3.4" fill="#ffb547" />
      <circle cx="27" cy="13.5" r="3.4" fill="#ffb547" />
      <circle cx="34" cy="16.5" r="3.2" fill="#ffb547" />
    </svg>
    <span className="font-display text-[1.45rem] font-semibold leading-none tracking-tight text-ink">
      pawcade
    </span>
  </span>
);
