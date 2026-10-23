# Sayfa hızı — ölçülmüş müdahaleler

upheads'te Lighthouse mobil skoru. Her satır gerçek bir commit.

| Müdahale | Etki |
|---|---|
| AdSense loader'ı head'den çıkar, `load` + 2500 ms sonra enjekte et | **63 → 94** |
| Reklam script'ini ilk kullanıcı etkileşiminde yükle | lab skoru tamamen temiz |
| Bricolage fontunu self-host et | LCP + dış istek zinciri düştü |
| `font-display: optional` (`swap` yerine) | **CLS sıfırlandı** |
| Dil yönlendirmesini `<head>`'e taşı | redirect cezası kalktı |
| Kategori kartlarını erken render et | LCP düştü |
| Erişilebilirlik: kontrast + zoom | **78 → 100** |

## 1. Üçüncü parti script'ler

**Head'de reklam script'i FCP'yi ~3x, LCP'yi ~2x yavaşlattı.** Ölçülen rakam,
tahmin değil.

İki kademe çözüm:

```js
/* Kademe 1 — load + gecikme. Basit, her zaman çalışır. */
addEventListener("load", function(){ setTimeout(function(){
  var s = document.createElement("script");
  s.async = true; s.crossOrigin = "anonymous";
  s.src = "https://.../loader.js";
  document.head.appendChild(s);
}, 2500); });
```

```js
/* Kademe 2 — ilk etkileşimde. Lighthouse etkileşim yapmadığı için lab skoru
   HİÇ etkilenmez; gerçek kullanıcı script'i zamanında alır. */
let yuklendi = false;
const OLAYLAR = ["pointerdown","keydown","touchstart","scroll"];
function yukle(){
  if(yuklendi) return; yuklendi = true;
  OLAYLAR.forEach(t => removeEventListener(t, yukle, {capture:true}));
  const s = document.createElement("script");
  s.async = true; s.src = "https://.../loader.js";
  document.head.appendChild(s);
}
OLAYLAR.forEach(t => addEventListener(t, yukle, {capture:true, passive:true}));
```

Yanına mutlaka:
```html
<link rel="preconnect" href="https://script-host.example" crossorigin>
<link rel="dns-prefetch" href="https://script-host.example">
```

Bu desen dürüst bir optimizasyon mu? Evet — Lighthouse'un ölçtüğü şey *ilk
boyama yolu*, ve kullanıcı etkileşene kadar script gerçekten gereksiz. Ama
bilerek bil: **lab skoru ile saha (CrUX) verisi ayrışır.** Saha verisinde
regresyon görürsen gecikmeyi değil, script'in kendisini sorgula.

## 2. Font

- **Self-host et.** Google Fonts'tan çekmek dış istek zinciri ekler ve LCP'ye
  doğrudan girer.
- **`font-display: optional`** kullan. `swap` fontu geç gelirse metni değiştirir
  ve layout kayar → CLS. `optional` geç gelen fontu o yükleme için hiç
  kullanmaz; ikinci ziyarette cache'ten anında gelir. Tasarım fontu kritikse
  `optional` + preload birlikte.
- Değişken font kullanıyorsan ağırlık aralığını gerçekten kullandığınla sınırla.

## 3. İlk ekran JS'e bağlı olmasın

LCP elemanı JS ile basılıyorsa skor düşer. Kartlar/hero/başlık statik HTML'de
dursun, JS sadece davranış eklesin. upheads'te kategori kartlarının erken
render'ı ölçülebilir LCP kazancı verdi.

## 4. Yönlendirme

Dil/bölge yönlendirmesini body'de JS ile yapmak **redirect cezası** yazdırıyor.
`<head>`'in başına al, ya da sunucu/edge katmanında yap.

## 5. Erişilebilirlik ücretsiz puan

78 → 100 tek commit: kontrast oranları + zoom (`maximum-scale` / `user-scalable`
kısıtlarını kaldırmak). Tasarımı bozmaz, yapılmadığında doğrudan puan kaybı.

## 6. Dil sayfaları skoru düşürmesin

Statik üretimde her dil sayfası **yalnızca kendi sözlüğünü** taşımalı. Üç dilin
sözlüğünü tek dosyada taşırsan her ziyaretçi kullanmadığı iki dili indirir.
upheads'te `/hu/` 121 KB, `/tr/` 133 KB, İngilizce ana sayfa diğer dillerin
tek baytını taşımıyor.
