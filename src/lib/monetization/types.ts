export type AdProviderType = 'mock' | 'poki' | 'crazygames' | 'google-h5';

export type RewardedPlacement =
  | 'renovation_fast_track'
  | 'level_star_booster'
  | 'gameplay_lifeline'
  | 'cosmetic_unlock'
  | 'daily_gacha_spin';

export type InterstitialPlacement =
  | 'level_advance'
  | 'exit_to_farm_map'
  | 'retry_fatigue';

export interface AdResult {
  shown: boolean;
  rewardEarned: boolean;
  error?: string;
  provider: AdProviderType;
}

export interface IAdProvider {
  id: AdProviderType;
  initialize(): Promise<boolean>;
  showInterstitial(placement: InterstitialPlacement): Promise<AdResult>;
  showRewarded(placement: RewardedPlacement): Promise<AdResult>;
  displayBanner(containerId: string): void;
  destroyBanner(containerId: string): void;
}
