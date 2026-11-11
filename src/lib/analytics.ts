export type AnalyticsEventName =
  | 'game_loaded'
  | 'game_started'
  | 'gameplay_ping'
  | 'level_started'
  | 'level_completed'
  | 'level_failed'
  | 'game_over'
  | 'game_won'
  | 'game_restarted'
  | 'score_milestone'
  | 'session_ended';

export interface AnalyticsEventPayload {
  gameId: string;
  levelId?: number;
  moves?: number;
  stars?: number;
  durationMs?: number;
  [key: string]: unknown;
}

export type TrafficChannel = 'ai_search' | 'organic_search' | 'social' | 'direct' | 'referral';

export function detectTrafficChannel(): { channel: TrafficChannel; source: string } {
  if (typeof document === 'undefined') return { channel: 'direct', source: 'direct' };
  const ref = document.referrer.toLowerCase();
  if (!ref) return { channel: 'direct', source: 'direct' };

  if (ref.includes('chatgpt.com') || ref.includes('openai.com')) {
    return { channel: 'ai_search', source: 'chatgpt' };
  }
  if (ref.includes('perplexity.ai')) {
    return { channel: 'ai_search', source: 'perplexity' };
  }
  if (ref.includes('copilot.microsoft.com') || ref.includes('bing.com/chat')) {
    return { channel: 'ai_search', source: 'copilot' };
  }
  if (ref.includes('claude.ai') || ref.includes('anthropic.com')) {
    return { channel: 'ai_search', source: 'claude' };
  }
  if (ref.includes('google.') || ref.includes('bing.') || ref.includes('yahoo.') || ref.includes('duckduckgo.')) {
    return { channel: 'organic_search', source: ref.includes('google') ? 'google' : 'other_search' };
  }
  if (ref.includes('t.co') || ref.includes('twitter.com') || ref.includes('x.com') || ref.includes('reddit.') || ref.includes('facebook.')) {
    return { channel: 'social', source: 'social' };
  }
  return { channel: 'referral', source: 'referral' };
}

export const ANALYTICS_EXCLUDE_KEY = 'pawcade_exclude_analytics';
export const GA_MEASUREMENT_ID = 'G-6QENGPZ73F';

export function setAnalyticsExcluded(excluded: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const w = window as unknown as Record<string, unknown>;
    if (excluded) {
      localStorage.setItem(ANALYTICS_EXCLUDE_KEY, 'true');
      document.cookie = `${ANALYTICS_EXCLUDE_KEY}=true; max-age=315360000; path=/; SameSite=Lax`;
      w[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      w.__PAWCADE_ANALYTICS_EXCLUDED__ = true;
    } else {
      localStorage.removeItem(ANALYTICS_EXCLUDE_KEY);
      document.cookie = `${ANALYTICS_EXCLUDE_KEY}=; max-age=0; path=/; SameSite=Lax`;
      w[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
      w.__PAWCADE_ANALYTICS_EXCLUDED__ = false;
    }
  } catch {}
}

export function isAnalyticsExcluded(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const w = window as unknown as Record<string, unknown>;
    if (w.__PAWCADE_ANALYTICS_EXCLUDED__ === true || w[`ga-disable-${GA_MEASUREMENT_ID}`] === true) {
      return true;
    }
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || navigator.webdriver) {
      w[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      return true;
    }
    if (
      localStorage.getItem(ANALYTICS_EXCLUDE_KEY) === 'true' ||
      (typeof document !== 'undefined' && document.cookie.includes(`${ANALYTICS_EXCLUDE_KEY}=true`))
    ) {
      w[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      return true;
    }
  } catch {}
  return false;
}

class AnalyticsService {
  private sessionId: string;
  private sessionStartTime: number;

  constructor() {
    this.sessionId = Math.random().toString(36).substring(2, 9);
    this.sessionStartTime = Date.now();
  }

  public track(event: AnalyticsEventName, payload?: Partial<AnalyticsEventPayload>): void {
    if (isAnalyticsExcluded()) {
      return;
    }

    // GA4 treats `source`, `medium`, `campaign`, `term` and `content` event parameters as
    // traffic-source overrides. Sending `source: 'intro_modal'` hijacked session attribution
    // (it showed up as "intro_modal / (not set)"), so these keys are namespaced here.
    const safePayload: Record<string, unknown> = { ...payload };
    for (const reserved of ['source', 'medium', 'campaign', 'term', 'content']) {
      if (reserved in safePayload) {
        safePayload[`event_${reserved}`] = safePayload[reserved];
        delete safePayload[reserved];
      }
    }

    const data = {
      event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      sessionElapsedSeconds: Math.floor((Date.now() - this.sessionStartTime) / 1000),
      ...safePayload,
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

  public gameStarted(gameId: string, extra?: Record<string, unknown>): void {
    this.track('game_started', { gameId, ...extra });
  }

  public levelCompleted(gameId: string, payload?: Partial<AnalyticsEventPayload>): void {
    this.track('level_completed', { gameId, ...payload });
  }

  public levelFailed(gameId: string, payload?: Partial<AnalyticsEventPayload>): void {
    this.track('level_failed', { gameId, ...payload });
  }

  public gameRestarted(gameId: string, payload?: Partial<AnalyticsEventPayload>): void {
    this.track('game_restarted', { gameId, ...payload });
  }

  public scoreMilestone(gameId: string, score: number, milestone?: string): void {
    this.track('score_milestone', { gameId, score, milestone });
  }

  public trackPageView(path: string, title?: string): void {
    if (isAnalyticsExcluded()) {
      return;
    }

    const pageTitle = title || (typeof document !== 'undefined' ? document.title : '');
    const pageLocation = typeof window !== 'undefined' ? window.location.href : '';
    const trafficInfo = detectTrafficChannel();

    if (import.meta.env.DEV) {
      console.log(`[Analytics PageView]`, { path, title: pageTitle, location: pageLocation, trafficInfo });
    }

    if (typeof window !== 'undefined') {
      const w = window as unknown as { gtag?: Function; dataLayer?: unknown[] };
      if (typeof w.gtag === 'function') {
        try {
          // 1. Update ambient configuration so subsequent events inherit active path & AI traffic channel
          w.gtag('set', {
            page_path: path,
            page_title: pageTitle,
            page_location: pageLocation,
            traffic_channel: trafficInfo.channel,
            traffic_source_engine: trafficInfo.source,
          });

          // 2. Explicitly dispatch GA4 'page_view' event
          w.gtag('event', 'page_view', {
            page_path: path,
            page_title: pageTitle,
            page_location: pageLocation,
            traffic_channel: trafficInfo.channel,
            traffic_source_engine: trafficInfo.source,
          });
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn('[Analytics Error]', e);
          }
        }
      } else if (Array.isArray(w.dataLayer)) {
        w.dataLayer.push(['set', { page_path: path, page_title: pageTitle, page_location: pageLocation, traffic_channel: trafficInfo.channel }]);
        w.dataLayer.push(['event', 'page_view', { page_path: path, page_title: pageTitle, page_location: pageLocation, traffic_channel: trafficInfo.channel }]);
      }
    }
  }

  public async requestInterstitialAd(placement: string): Promise<boolean> {
    if (import.meta.env.DEV) {
      console.log(`[Ad Hook] Requesting interstitial ad at placement: ${placement}`);
    }
    return Promise.resolve(true);
  }

  public async requestRewardedAd(rewardItem: string): Promise<boolean> {
    if (import.meta.env.DEV) {
      console.log(`[Ad Hook] Requesting rewarded ad for: ${rewardItem}`);
    }
    return Promise.resolve(true);
  }
}

export const analytics = new AnalyticsService();
