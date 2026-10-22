import { IAdProvider, AdResult, InterstitialPlacement, RewardedPlacement } from '../types';

export class MockAdProvider implements IAdProvider {
  public id = 'mock' as const;

  async initialize(): Promise<boolean> {
    return true;
  }

  async showInterstitial(placement: InterstitialPlacement): Promise<AdResult> {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        resolve({ shown: true, rewardEarned: false, provider: 'mock' });
        return;
      }

      const modal = this.createMockModal(
        '📺 Sponsor Reklam Molası',
        `Geçiş Reklamı Gösteriliyor (${placement})...`,
        () => {
          if (document.body.contains(modal)) document.body.removeChild(modal);
          resolve({ shown: true, rewardEarned: false, provider: 'mock' });
        },
        false
      );
      document.body.appendChild(modal);

      setTimeout(() => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
          resolve({ shown: true, rewardEarned: false, provider: 'mock' });
        }
      }, 2500);
    });
  }

  async showRewarded(placement: RewardedPlacement): Promise<AdResult> {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        resolve({ shown: true, rewardEarned: true, provider: 'mock' });
        return;
      }

      let desc = 'Kısa video izleniyor...';
      if (placement === 'renovation_fast_track') {
        desc = '🔨 Hızlı Onarım & Malzeme Desteği için sponsor videosu izleniyor!';
      } else if (placement === 'level_star_booster') {
        desc = '⭐ Bu bölümü 3 Yıldız yapmak için sponsor videosu izleniyor!';
      } else if (placement === 'gameplay_lifeline') {
        desc = '🎁 +3 Ek Hamle / Kurtarma Desteği için sponsor videosu izleniyor!';
      }

      const modal = this.createMockModal(
        '🎁 Ödüllü Sponsor Videosu (Rewarded Ad)',
        desc,
        () => {
          if (document.body.contains(modal)) document.body.removeChild(modal);
          resolve({ shown: true, rewardEarned: true, provider: 'mock' });
        },
        true
      );
      document.body.appendChild(modal);
    });
  }

  displayBanner(containerId: string): void {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(containerId);
    if (el) {
      el.innerHTML = `
        <div class="w-full max-w-2xl mx-auto py-2 px-4 bg-slate-900/90 border border-orange-500/30 rounded-xl flex items-center justify-between text-xs text-slate-300 shadow-md">
          <div class="flex items-center gap-2">
            <span class="bg-orange-500/20 text-orange-400 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase">Sponsor</span>
            <span class="font-semibold text-slate-200">Pawcade Çiftlik Dünyası — Ücretsiz Çevrimiçi Tarayıcı Oyunları</span>
          </div>
          <span class="text-orange-400 font-bold hidden sm:inline">Reklam Alanı 🏷️</span>
        </div>`;
    }
  }

  destroyBanner(containerId: string): void {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '';
  }

  private createMockModal(
    title: string,
    desc: string,
    onComplete: () => void,
    isRewarded = false
  ): HTMLElement {
    const div = document.createElement('div');
    div.className =
      'fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-white';
    div.innerHTML = `
      <div class="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-orange-500/50 rounded-3xl p-6 shadow-2xl text-center">
        <div class="text-4xl mb-2 animate-bounce">${isRewarded ? '🎁' : '📺'}</div>
        <h3 class="text-lg font-black text-white mb-1">${title}</h3>
        <p class="text-xs text-slate-300 mb-5 leading-relaxed">${desc}</p>
        <button id="mock-ad-action-btn" class="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl shadow-lg transition-transform hover:scale-102 cursor-pointer text-xs">
          ${isRewarded ? 'Ödülü Al (Videoyu Tamamla) ➔' : 'Geç (Devam Et) ➔'}
        </button>
      </div>`;

    div.querySelector('#mock-ad-action-btn')?.addEventListener('click', onComplete);
    return div;
  }
}
