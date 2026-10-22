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

    // Provider hook (e.g. Google Analytics / Plausible / custom endpoint)
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
      try {
        (window as unknown as { gtag: Function }).gtag('event', event, data);
      } catch {}
    }
  }

  public trackPageView(path: string, title?: string): void {
    if (import.meta.env.DEV) {
      console.log(`[Analytics PageView]`, { path, title });
    }
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
      try {
        (window as unknown as { gtag: Function }).gtag('config', 'G-6QENGPZ73F', {
          page_path: path,
          page_title: title || (typeof document !== 'undefined' ? document.title : ''),
        });
      } catch {}
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
