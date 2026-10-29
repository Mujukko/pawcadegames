import type React from 'react';

/**
 * Click handler for real <a href> links inside the SPA.
 * Keeps crawlable hrefs for search engines while routing client-side for normal clicks.
 * Modifier / middle clicks fall through to the browser (open in new tab, etc.).
 */
export const handleNavClick = (e: React.MouseEvent, go: () => void) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  go();
};
