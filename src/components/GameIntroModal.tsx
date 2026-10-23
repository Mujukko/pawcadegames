import React, { useState, useEffect } from 'react';
import { X, Play, Sparkles, HelpCircle, Check, Smartphone, Monitor } from 'lucide-react';

export interface GameIntroContent {
  title: string;
  subtitle: string;
  mascot: string;
  themeColor: string;
  goal: string;
  steps: {
    icon: string;
    title: string;
    desc: string;
  }[];
  controls: {
    desktop: string[];
    mobile: string[];
  };
  proTip: string;
}

export const GAME_INTROS: Record<string, GameIntroContent> = {
  'farm-mini-mart': {
    title: 'Farm Mini Mart: Animal Market',
    subtitle: 'Çiftlik Mini Market & Idle Tycoon',
    mascot: '🏪',
    themeColor: 'from-emerald-500 via-teal-600 to-amber-600',
    goal: 'Taze mahsulleri hasat et, reyonları doldur ve sevimli hayvan müşterilerine satış yaparak marketini büyüt!',
    steps: [
      {
        icon: '🍅',
        title: '1. Mahsulleri Hasat Et',
        desc: 'Domates, mısır, taze yumurta ve süt çiftliklerinin yanına yaklaş; ürünler otomatik olarak ellerine yığılır.',
      },
      {
        icon: '📦',
        title: '2. Reyonları Doldur',
        desc: 'Boş pazar reyonlarının yanına git; taşıdığın ürünler anında raflara boşalır ve müşterilerin beğenisine sunulur.',
      },
      {
        icon: '💰',
        title: '3. Kasada Paraları Topla',
        desc: 'Kasa tezgahına yaklaşarak kuyruktaki hayvanları ağırla, altın paraları topla ve yeni reyonların kilitlerini aç!',
      },
    ],
    controls: {
      desktop: ['WASD / Yön Tuşları: Çiftçiyi yönlendir', 'U Tuşu: Yükseltme menüsünü aç', 'M Tuşu: Sesi aç/kapat'],
      mobile: ['Ekranın herhangi bir yerine dokunup parmağını kaydırarak 360° joystick ile yönlendir', 'Geliştirmeler butonuna dokun'],
    },
    proTip: 'Erken aşamada Yardımcı Köpek Barnaby ve Otomatik Kasiyer işe alarak pasif gelirini 3 katına çıkarabilirsin!',
  },
  'duck-runner': {
    title: 'Duck Runner: Vampire Quack',
    subtitle: 'Cadılar Bayramı Sonsuz Koşu',
    mascot: '🦆',
    themeColor: 'from-orange-500 via-amber-600 to-purple-800',
    goal: 'Balkabaklarının üzerinden zıpla, gece yarasalarının altından kayarak rekor puana ulaş!',
    steps: [
      {
        icon: '🎃',
        title: '1. Engellerin Üzerinden Zıpla',
        desc: 'Yerdeki oymalı balkabakları ve ahşap çitlerin üzerinden zıplayarak koşmaya devam et.',
      },
      {
        icon: '🦇',
        title: '2. Yarasaların Altından Kay',
        desc: 'Yukarıdan hızla uçan vampir yarasalar yaklaştığında eğil (DUCK) ve altlarından düz kayarak geç.',
      },
      {
        icon: '⚡',
        title: '3. Gece & Gündüz Döngüsü',
        desc: 'Her 600 puanda bir gökyüzü dolunaylı büyüleyici geceye dönüşür ve koşu hızı artar.',
      },
    ],
    controls: {
      desktop: ['Space / Yukarı Ok / W: Zıpla', 'Aşağı Ok / S: Eğil / Yere hızlı iniş', 'R: Yeniden Başlat'],
      mobile: ['Sağ Başparmak (JUMP ⬆️): Zıpla', 'Sol Başparmak (DUCK ⬇️): Basılı tutarak kay'],
    },
    proTip: 'Havadayken Eğil (DUCK) tuşuna basarsan ördek anında yere sert iniş yapar; bu teknik peş peşe gelen engellerde hayat kurtarır!',
  },
  'pet-candy-crush': {
    title: 'Farm Animal Match: Barnyard Blast',
    subtitle: 'Çiftlik 3’lü Eşleştirme & Bomba Patlatma',
    mascot: '🍬',
    themeColor: 'from-pink-500 via-rose-600 to-purple-700',
    goal: 'Sevimli çiftlik hayvanlarını eşleştir, dinamitler üret ve hamlelerin bitmeden 3 yıldızı kap!',
    steps: [
      {
        icon: '🐮',
        title: '1. Yan Yana 3 Hayvanı Eşleştir',
        desc: 'Komşu iki hayvanı birbiriyle takas ederek yatay veya dikey en az 3’lü gruplar oluştur.',
      },
      {
        icon: '🧨',
        title: '2. 2x2 Kare ile Dinamit Üret',
        desc: '4 aynı hayvanı 2x2 kare şeklinde eşleştirerek devasa 3x3 patlama yapan Dinamit Bombası yarat!',
      },
      {
        icon: '💥',
        title: '3. Güçlendiricileri Birleştir',
        desc: 'İki bombayı yan yana getirip birleştirirsen tüm ekranda 5x5 dev krater patlaması gerçekleşir.',
      },
    ],
    controls: {
      desktop: ['Fare Tıklama & Sürükleme: Hayvanları takas et', 'Çift Tıklama: Bombayı olduğu yerde anında patlat'],
      mobile: ['Dokun & Kaydır: Parmağınla hayvanları takas et', 'Çift Dokunma: Bombayı yerinde patlat'],
    },
    proTip: 'Tahtadaki bombaları başka bir taşla takas etmeden, üzerine çift dokunarak anında patlatabilirsin!',
  },
  'flappy-chicken': {
    title: 'Flappy Chicken: Golden Wheat',
    subtitle: 'Komik Çiftlik Uçuş Macerası',
    mascot: '🐔',
    themeColor: 'from-yellow-500 via-amber-600 to-orange-600',
    goal: 'Tombul tavuk Clucky ile ahşap çit kapılarının arasından uçarak 15 kapıyı geç ve Altın Buğday’a ulaş!',
    steps: [
      {
        icon: '🪽',
        title: '1. Kanat Çırparak Yüksel',
        desc: 'Ekrana dokunarak veya Space tuşuna basarak Clucky’nin kanat çırpmasını ve yükselmesini sağla.',
      },
      {
        icon: '🚪',
        title: '2. Ahşap Çitlerden Sakın',
        desc: 'Her kapının açık aralığını dikkatle hesapla; çit direklerine çarpmadan dengeli süzül.',
      },
      {
        icon: '🌾',
        title: '3. Altın Buğday Hedefine Ulaş',
        desc: 'Havada süzülen altın tanelerini topla; mesafe göstergesi %100 olduğunda büyük hasat kutlaması başlar!',
      },
    ],
    controls: {
      desktop: ['Spacebar / W / Sol Tık: Kanat çırp', 'P: Duraklat', 'R: Hızlı yeniden başlat'],
      mobile: ['Ekranda herhangi bir yere dokun: Kanat çırp', 'Alttaki büyük KANAT ÇIRP butonunu kullan'],
    },
    proTip: 'Peş peşe hızlı basmak yerine ritmik ve hafif dokunuşlar Clucky’nin havada sabit yükseklikte süzülmesini kolaylaştırır!',
  },
  'animal-2048': {
    title: 'Animal 2048: Spooky Evolution',
    subtitle: 'Hayvan Birleştirme & Zeka Bulmacası',
    mascot: '🐘',
    themeColor: 'from-indigo-500 via-purple-600 to-violet-800',
    goal: 'Izgarayı kaydırıp eşleşen hayvanları birleştirerek minik fareden görkemli File evril!',
    steps: [
      {
        icon: '➡️',
        title: '1. Dört Yöne Kaydır',
        desc: 'Tahtayı yukarı, aşağı, sola veya sağa kaydırarak tüm hayvan taşlarını aynı anda hareket ettir.',
      },
      {
        icon: '🐭',
        title: '2. Eşit Hayvanları Birleştir',
        desc: 'İki aynı hayvan çarpıştığında bir üst basamağa evrilir (Fare ➔ Hamster ➔ Tavşan ➔ Kedi ... ➔ Fil).',
      },
      {
        icon: '👑',
        title: '3. 2048 Fil Hedefi',
        desc: 'Tahtanın dolup kilitlenmesini engelle; 11 evrim basamağını tırmanarak 2048 taçlı fili yarat!',
      },
    ],
    controls: {
      desktop: ['Ok Tuşları veya W/A/S/D: Dört yöne kaydır', 'Ctrl + Z / Geri Al Butonu: Son hamleyi geri al'],
      mobile: ['Parmağınla ekranda kaydır (Swipe)', 'Alttaki 4 yönlü D-Pad oklarına dokun'],
    },
    proTip: 'En güçlü hayvanını her zaman tek bir köşede (örneğin sağ altta) tut ve o köşeye doğru biriktirme yap!',
  },
  'farm-tetris': {
    title: 'Farm Tetris: Haunted Harvest',
    subtitle: 'Hasat Blokları & Silo Doldurma',
    mascot: '🧱',
    themeColor: 'from-orange-600 via-red-600 to-amber-700',
    goal: 'Hasat bloklarını döndürüp yerleştir, tam sıraları patlat ve altın siloyu doldur!',
    steps: [
      {
        icon: '🔄',
        title: '1. Blokları Yönlendir & Döndür',
        desc: 'Düşen ahşap kasa ve balkabağı bloklarını sola-sağa kaydır ve boşluklara tam oturacak şekilde çevir.',
      },
      {
        icon: '⚡',
        title: '2. Sıraları Temizle',
        desc: 'Yatay bir sırayı tamamen doldurduğunda sıra altın saman parçacıklarıyla patlar ve siloyu besler.',
      },
      {
        icon: '🌾',
        title: '3. 4 Sıralı Tetris Yap',
        desc: 'Aynı anda 4 sırayı birden patlatarak Çiftçi’den 800+ puan ve "SÜPER HASAT!" coşkusu kazan!',
      },
    ],
    controls: {
      desktop: ['A / D: Sola / Sağa git', 'W / Yukarı Ok: 90° Döndür', 'Space: Anında aşağı kilitle', 'C / Shift: Parçayı yedekte tut'],
      mobile: ['Sol / Sağ / Aşağı Dokunma Okları', 'DÖNDÜR Butonu', 'KİLİTLE (Slam) Butonu', 'YEDEKLE (Hold) Butonu'],
    },
    proTip: 'Zor gelen parçaları sol üstteki YEDEK (Hold) alanına atarak uzun I çubuğunu 4’lü Tetris için saklayabilirsin!',
  },
  'dog-parking': {
    title: 'Dog Parking: Yard Escape',
    subtitle: 'Köpek Park Etme & Çıkış Bulmacası',
    mascot: '🐕‍🦺',
    themeColor: 'from-amber-500 via-orange-600 to-yellow-600',
    goal: 'Kalabalık bahçedeki köpekleri kaydırarak Sunny Corgi’nin çıkış kapısına ulaşmasını sağla!',
    steps: [
      {
        icon: '🐕',
        title: '1. Doğal Yönleri Gör',
        desc: 'Köpekler sadece durdukları şerit boyunca ileri ve geri hareket edebilir (yanlara dönemezler).',
      },
      {
        icon: '↔️',
        title: '2. Yolu Temizle',
        desc: 'Pug, Shiba ve Dachshund’ları ileri-geri kaydırarak Sunny’nin çıkış kapısına giden koridoru boşalt.',
      },
      {
        icon: '🏁',
        title: '3. Sunny ile Kapıdan Çık',
        desc: 'Önü açılan kahraman Sunny Corgi’yi doğrudan açık ahşap kapıdan dışarı kaydır ve bölümü tamamla!',
      },
    ],
    controls: {
      desktop: ['Fare ile köpeğe tıkla ve şeridi boyunca sürükle', 'Z: Hamleyi geri al', 'R: Bölümü yeniden başlat'],
      mobile: ['Parmağınla köpeğe dokun ve ileri/geri kaydır', 'Alttaki Geri Al ve Yenile butonlarını kullan'],
    },
    proTip: 'Her zaman çıkış kapısından geriye doğru düşün: Kapıyı doğrudan kim kapatıyor, onun önünü kim tıkıyor?',
  },
  'cat-parking': {
    title: 'Cat Parking: Witch Cat Mystery',
    subtitle: 'Uykucu Kediler & Çıkış Labirenti',
    mascot: '🐈‍⬛',
    themeColor: 'from-purple-600 via-indigo-700 to-slate-800',
    goal: 'Uykucu kedileri halı üzerinde kaydırarak Cadı Kedi Luna’yı açık odaya ulaştır!',
    steps: [
      {
        icon: '🐾',
        title: '1. Halı Üzerinde Kaydır',
        desc: 'Minderlerde uyuyan sevimli İran, Calico ve Tekir kedilerini çizgileri boyunca ileri-geri kaydır.',
      },
      {
        icon: '🛋️',
        title: '2. Uzun Kedilere Alan Aç',
        desc: '3 karelik uzun kediler dar odalarda daha çok yer kaplar; onları dikkatle diğer köşelere kaydır.',
      },
      {
        icon: '🌙',
        title: '3. Luna’yı Kapıya Götür',
        desc: 'Ay ışığı vuran açık kapının önü açıldığında mor şapkalı Luna’yı dışarı kaydır ve 3 yıldızı al!',
      },
    ],
    controls: {
      desktop: ['Fareyle kediyi tut ve ileri/geri sürükle', 'Z: Geri al', 'R: Bölümü yeniden başlat'],
      mobile: ['Parmağınla kediyi doğal şeridinde kaydır', 'Ekran altındaki Geri Al / Yenile butonları'],
    },
    proTip: 'Tıkandığında tereddüt etmeden Geri Al butonuna bas; hamle geri almanın hiçbir puan cezası yoktur!',
  },
  'animal-farm-parking': {
    title: 'Animal Farm Parking: Midnight Drive',
    subtitle: 'Traktör Sürüşü & Hassas Park Etme',
    mascot: '🐮',
    themeColor: 'from-teal-600 via-emerald-700 to-green-800',
    goal: 'İnek Bessie ile traktörü ahşap çitlere ve koyunlara çarpmadan sarı damalı alana park et!',
    steps: [
      {
        icon: '🚜',
        title: '1. Traktörü Yönlendir',
        desc: 'İleri, geri, sağa ve sola yön tuşlarıyla traktörün gaz ve direksiyonunu kontrol et.',
      },
      {
        icon: '🛑',
        title: '2. Zamanında Fren Yap',
        desc: 'Dönemeçlerde ve engellere yaklaşırken frene bas; çarpışmalar traktörün canını azaltır!',
      },
      {
        icon: '🅿️',
        title: '3. Sarı Damalı Alana Yerleş',
        desc: 'Traktörü sarı damalı park çizgisinin içine düzgünce hizala; %80 ve üzeri doğrulukla parkı tamamla!',
      },
    ],
    controls: {
      desktop: ['WASD veya Yön Tuşları: Sürüş & Direksiyon', 'Spacebar: El Freni / Ani Duruş', 'R: Hızlı yeniden başlat'],
      mobile: ['Dokunmatik D-Pad Okları (İleri, Geri, Sol, Sağ)', 'Ortadaki kırmızı FREN / DUR butonu'],
    },
    proTip: 'Virajları geniş al ve hızlanmadan önce park yönünü önceden planla; ani gaz vermek savrulmaya sebep olabilir!',
  },
};

interface GameIntroModalProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GameIntroModal: React.FC<GameIntroModalProps> = ({ gameId, isOpen, onClose }) => {
  const intro = GAME_INTROS[gameId] || GAME_INTROS['dog-parking']!;
  const [activeTab, setActiveTab] = useState<'guide' | 'controls'>('guide');
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`pawcade_intro_seen_${gameId}`) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') handleStartGame();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleStartGame = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem(`pawcade_intro_seen_${gameId}`, 'true');
      } else {
        localStorage.removeItem(`pawcade_intro_seen_${gameId}`);
      }
    } catch {
      // Ignore local storage write errors
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-amber-400/60 rounded-3xl shadow-2xl shadow-black/80 flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* TOP GLOWING BANNER HEADER */}
        <div className={`p-4 sm:p-5 bg-gradient-to-r ${intro.themeColor} text-white flex items-center justify-between relative`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black/30 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shadow-inner select-none shrink-0">
              {intro.mascot}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 text-amber-300 border border-amber-300/40">
                  Nasıl Oynanır? • How to Play
                </span>
              </div>
              <h2 id="intro-modal-title" className="text-lg sm:text-2xl font-black tracking-tight leading-tight mt-0.5">
                {intro.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Kapat"
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION SUB-TABS */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Oyun Rehberi & Adımlar</span>
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={`pb-2 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'controls'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Kontroller & İpuçları</span>
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-200">
          {/* WIN GOAL BANNER */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-start gap-3">
            <span className="text-2xl select-none shrink-0">🎯</span>
            <div>
              <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider block">
                Bölüm Hedefi
              </span>
              <p className="text-xs sm:text-sm font-bold text-white mt-0.5 leading-snug">
                {intro.goal}
              </p>
            </div>
          </div>

          {activeTab === 'guide' ? (
            /* 3-STEP VISUAL HOW TO PLAY */
            <div className="space-y-3">
              {intro.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 flex items-start gap-3.5 hover:border-amber-400/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0 select-none shadow">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-amber-300">
                      {step.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* CONTROLS & PRO TIPS */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Desktop Controls */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                    <Monitor className="w-4 h-4" />
                    <span>Masaüstü (Klavye / Fare)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {intro.controls.desktop.map((ctrl, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{ctrl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mobile Controls */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                    <Smartphone className="w-4 h-4" />
                    <span>Mobil (Dokunmatik Ekran)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {intro.controls.mobile.map((ctrl, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{ctrl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pro Tip Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 flex items-start gap-3">
                <span className="text-xl select-none shrink-0">💡</span>
                <div>
                  <span className="text-[11px] font-black uppercase text-purple-300 tracking-wider block">
                    Usta Oyuncu İpucu (Pro Tip)
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium mt-0.5 leading-relaxed">
                    {intro.proTip}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-amber-400 focus:ring-amber-400 bg-slate-800"
            />
            <span>Bu oyunda bir daha otomatik açma</span>
          </label>

          <button
            onClick={handleStartGame}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transform hover:scale-103 active:scale-98 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>HEMEN BAŞLA! • LET'S PLAY!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
