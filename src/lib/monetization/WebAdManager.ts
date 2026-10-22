import {
  IAdProvider,
  RewardedPlacement,
  InterstitialPlacement,
  AdResult,
} from './types';
import { MockAdProvider } from './providers/MockAdProvider';
import { soundManager } from '../../games/dog-parking/systems/sound';

export class WebAdManager {
  private static instance: WebAdManager;
  private provider: IAdProvider;
  private lastAdTimestamp: number = 0;
  private sessionStartTimestamp: number = Date.now();
  private rewardedImmunityUntil: number = 0;

  // Pacing policy constants
  private readonly INITIAL_GRACE_PERIOD_MS = 60_000; // 60s initial grace period
  private readonly INTERSTITIAL_COOLDOWN_MS = 90_000; // 90s cooldown
  private readonly REWARDED_IMMUNITY_MS = 120_000; // 120s immunity after rewarded ad

  private constructor(provider?: IAdProvider) {
    this.provider = provider || new MockAdProvider();
    this.provider.initialize().catch(() => {});
  }

  public static getInstance(): WebAdManager {
    if (!WebAdManager.instance) {
      WebAdManager.instance = new WebAdManager();
    }
    return WebAdManager.instance;
  }

  public setProvider(provider: IAdProvider): void {
    this.provider = provider;
  }

  public canShowInterstitial(): boolean {
    const now = Date.now();
    if (now - this.sessionStartTimestamp < this.INITIAL_GRACE_PERIOD_MS) {
      return false;
    }
    if (now < this.rewardedImmunityUntil) {
      return false;
    }
    if (now - this.lastAdTimestamp < this.INTERSTITIAL_COOLDOWN_MS) {
      return false;
    }
    return true;
  }

  public async triggerInterstitial(
    placement: InterstitialPlacement
  ): Promise<AdResult> {
    if (!this.canShowInterstitial()) {
      return { shown: false, rewardEarned: false, provider: this.provider.id };
    }

    try {
      this.muteAudio();
      const result = await this.provider.showInterstitial(placement);
      if (result.shown) {
        this.lastAdTimestamp = Date.now();
      }
      return result;
    } finally {
      this.unmuteAudio();
    }
  }

  public async triggerRewarded(placement: RewardedPlacement): Promise<AdResult> {
    try {
      this.muteAudio();
      const result = await this.provider.showRewarded(placement);
      if (result.rewardEarned) {
        this.rewardedImmunityUntil = Date.now() + this.REWARDED_IMMUNITY_MS;
        this.lastAdTimestamp = Date.now();
      }
      return result;
    } finally {
      this.unmuteAudio();
    }
  }

  public async showRewardedVideo(
    placement: RewardedPlacement,
    _description?: string
  ): Promise<{ success: boolean; result: AdResult }> {
    const result = await this.triggerRewarded(placement);
    return { success: result.rewardEarned, result };
  }

  public displayBanner(containerId: string): void {
    this.provider.displayBanner(containerId);
  }

  public destroyBanner(containerId: string): void {
    this.provider.destroyBanner(containerId);
  }

  private muteAudio(): void {
    try {
      soundManager.setMuted(true);
    } catch {}
  }

  private unmuteAudio(): void {
    try {
      soundManager.setMuted(false);
    } catch {}
  }
}

export const webAdManager = WebAdManager.getInstance();
