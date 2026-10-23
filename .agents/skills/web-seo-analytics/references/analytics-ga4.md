# GA4 ölçüm deseni

## 1. Sarmalayıcı — gtag'i koda saçma

```js
/* Tek giriş noktası: ortak parametreler burada eklenir, gtag yoksa sessiz geçer,
   hata ölçüm yüzünden ürünü düşürmez. */
function track(name, params){
  try{
    if(window.gtag) gtag('event', name, Object.assign({ lang: LANG }, params || {}));
  }catch(_){}
}
```

Neden `try/catch`: reklam/izleme engelleyiciler `gtag`'i tanımlı bırakıp
içini bozabiliyor. Ölçüm çağrısı ürünü asla patlatmamalı.

Ortak parametre olarak koy: dil, sürüm/build, platform. Sonradan kırılım
gerektiğinde event'leri tek tek dolaşmak zorunda kalmazsın.

## 2. Huniyi adım adım işaretle

Tek "oynadı" event'i hiçbir şey öğretmez. upheads'in ölçüm seti:

```js
track('game_open',     { source })                               // hangi CTA getirdi
track('deck_selected', { deck, deck_name, hard })                // hangi icerik secildi
track('mode_selected', { mode, teams })                          // tek kisi / takim
track('round_start',   { deck, deck_name, duration, mode })      // gercekten basladi mi
track('round_end',     { deck, deck_name, score, played })       // ne kadar tamamlandi
track('deck_finished', { deck, deck_name, size })                // icerik tukendi mi
```

`deck` (anahtar) **ve** `deck_name` (okunur ad) birlikte gönderiliyor: anahtar
stabil kırılım için, ad raporu okunur kılmak için. Anahtar değişirse geçmiş veri
bozulmaz.

`deck_selected` ile `round_start` ayrı: seçip başlamayanlar seçim ekranındaki
sürtünmeyi gösterir. Tek event'le bu görünmez.

## 3. Custom Dimension olmadan parametre görünmez

**En pahalı GA4 tuzağı.** Event'i parametreyle göndermek yetmez:

1. Admin → **Custom definitions** → Create custom dimension
2. Scope: **Event**
3. Event parameter: tam olarak kodda gönderdiğin ad (`deck`, `mode`, `source`)

Kaydetmeden `deck` kırılımı hiçbir raporda çıkmaz. Daha kötüsü: **kayıttan
önceki veriye geriye dönük uygulanmaz.** Event'i yazdığın gün dimension'ı da
tanımla, yoksa ilk haftaların verisi kırılımsız kalır.

Sınır: mülk başına 50 event-scoped dimension. Parametre adlarını baştan planla.

## 4. Event'in geldiğini doğrulama

Realtime raporunda event adı yoksa sırayla kontrol et:
1. `gtag` tanımlı mı (konsol: `typeof gtag`)
2. Ölçüm ID'si doğru mu — **`G-XXXXXXXXXX` şablonunu değiştirmeyi unutma**
   (upheads'te bu gerçekten olmuş, 6 gün veri kaybı: `G-XXXXXXXXXX` canlıya
   çıkmış, "GA FIX" commit'iyle düzelmiş)
3. Event **Reports → Realtime**'da mı (Events sayfası 24s gecikebilir)
4. Engelleyici kapalı mı

Yeni event `Reports → Engagement → Events` listesine **24 saate kadar** gelmez.
"Events sayfasında yok" paniğe girmeden önce Realtime'a bak.

## 5. İçerik → ürün dönüşümü

Her içerik sayfasına delege edilmiş **tek** dinleyici, elden işaretleme yok:

```js
document.addEventListener("click", function(e){
  var a = e.target.closest && e.target.closest('a[href="/"], a[href^="/?deck="]');
  if(!a || !window.gtag) return;
  var href = a.getAttribute("href");
  gtag("event", "cta_click", {
    location: "<sayfa-slug>",            // hangi icerik sayfasi
    target:   href,
    deck:     (href.split("deck=")[1] || "")
  });
}, true);
```

`location` üretici tarafından sayfa slug'ı olarak basılır. Böylece "hangi içerik
sayfası gerçekten kullanıcı getiriyor" sorusu tek rapordan cevaplanır — GSC'nin
söylediği klik sayısı değil, ürüne giren kişi sayısı.

## 6. Ölçümü karara çevir

Rapor üretmek amaç değil. upheads'te ölçümün yaptığı somut değişiklikler:

- **İçerik sıralaması ölçüme göre dizildi.** `deck_selected` kırılımı en çok
  oynanan desteleri gösterdi; kart sırası ona göre değişti, kazananların kartı
  büyütüldü.
- **Düşük performanslı içerik baştan yazıldı**, silinmedi. "Viral" destesi
  ölçümde dipteydi → "Meme & Viral" olarak 60 kelimeyle yeniden yazıldı.
- **İçerik sayfaları yargılandı.** 22 view getiren URL vs 0 view getiren
  URL'ler; 82 gün sonra tamamı GSC'de de teyit edilince makale stratejisi
  terk edildi.

Kural: bir event eklerken **"bu veri hangi kararı değiştirecek"** sorusunu
cevaplayamıyorsan event'i ekleme.
