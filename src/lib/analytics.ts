export type AnalyticsEventName =
  | 'game_loaded'
  | 'game_started'
  | 'level_started'
  | 'level_completed'
  | 'level_failed'
  | 'game_restarted'
  | 'session_ended';

export interface AnalyticsEventPayload {
  gameId: string;
  levelId?: number;
  moves?: number;
  stars?: number;
  durationMs?: number;
  [key: string]: unknown;
}

class AnalyticsService {
  private sessionId: string;
  private sessionStartTime: number;

  constructor() {
    this.sessionId = Math.random().toString(36).substring(2, 9);
    this.sessionStartTime = Date.now();
  }

  public track(event: AnalyticsEventName, payload?: Partial<AnalyticsEventPayload>): void {
    const data = {
      event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      sessionElapsedSeconds: Math.floor((Date.now() - this.sessionStartTime) / 1000),
      ...payload,
    };

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Analytics Event]`, data);
    }

    // Provider hook (Google Analytics 4 / gtag)
    if (typeof window !== 'undefined') {
      const w = window as unknown as { gtag?: Function; dataLayer?: unknown[] };
      if (typeof w.gtag === 'function') {
        try {
          w.gtag('event', event, data);
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn('[Analytics Error]', e);
          }
        }
      } else if (Array.isArray(w.dataLayer)) {
        w.dataLayer.push(['event', event, data]);
      }
    }
  }

  public trackPageView(path: string, title?: string): void {
    const pageTitle = title || (typeof document !== 'undefined' ? document.title : '');
    const pageLocation = typeof window !== 'undefined' ? window.location.href : '';

    if (import.meta.env.DEV) {
      console.log(`[Analytics PageView]`, { path, title: pageTitle, location: pageLocation });
    }

    if (typeof window !== 'undefined') {
      const w = window as unknown as { gtag?: Function; dataLayer?: unknown[] };
      if (typeof w.gtag === 'function') {
        try {
          // 1. Update ambient configuration so subsequent events inherit the active page path
          w.gtag('set', {
            page_path: path,
            page_title: pageTitle,
            page_location: pageLocation,
          });

          // 2. Explicitly dispatch GA4 'page_view' event
          w.gtag('event', 'page_view', {
            page_path: path,
            page_title: pageTitle,
            page_location: pageLocation,
          });
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn('[Analytics Error]', e);
          }
        }
      } else if (Array.isArray(w.dataLayer)) {
        w.dataLayer.push(['set', { page_path: path, page_title: pageTitle, page_location: pageLocation }]);
        w.dataLayer.push(['event', 'page_view', { page_path: path, page_title: pageTitle, page_location: pageLocation }]);
      }
    }
  }

  /**
   * Future Ad Placement Hook: Interstitial Ad
   * Safe stub that resolves immediately in MVP.
   */
  public async requestInterstitialAd(placement: string): Promise<boolean> {
    if (import.meta.env.DEV) {
      console.log(`[Ad Hook] Requesting interstitial ad at placement: ${placement}`);
    }
    // Future ad SDK hook
    return Promise.resolve(true);
  }

  /**
   * Future Ad Placement Hook: Rewarded Ad (e.g. for hint)
   */
  public async requestRewardedAd(rewardItem: string): Promise<boolean> {
    if (import.meta.env.DEV) {
      console.log(`[Ad Hook] Requesting rewarded ad for: ${rewardItem}`);
    }
    return Promise.resolve(true);
  }
}

export const analytics = new AnalyticsService();
