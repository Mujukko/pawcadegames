---
name: web-seo-analytics
description: Grow a static web product with search traffic and measurement. Use when working on SEO, Google Search Console analysis, GA4 event instrumentation, content/landing page strategy, keyword clusters, hreflang/multilingual URLs, Core Web Vitals, AdSense or ad-wrapper integration on a website. Türkçe: web sitesi SEO, arama trafiği, Search Console analizi, GA4 ölçüm, içerik sayfası stratejisi, çoklu dil, sayfa hızı.
---

# Web SEO + ölçüm

upheadsgame.com'da Temmuz–Ekim 2026 arasında 84 commit boyunca ölçülen derslerin damıtılmışı.
Site: tek dosyalık statik tarayıcı oyunu, Vercel. 28 günde 25.869 klik / 206.659 gösterim.

**Buradaki her kural ölçümden geliyor, iyi uygulamalardan değil.** Rakamlar korunmuş;
bir kuralı değiştirmek istersen önce onu üreten ölçümü çürüt.

## 0. Önce altın kural

**Sıralama değil, niyet eşleşmesi klik getirir.** Aynı siteden ölçülmüş kanıt:

| Sayfa | Pozisyon | CTR | Klik |
|---|---|---|---|
| `/about/` | **1,7** | %0,5 | 6 |
| `/contact/` | **1,7** | %0,0 | 0 |
| `/guides/` | **1,9** | %0,6 | 1 |
| `/who-am-i-game/` | 9,6 | %6,2 | 29 |

2. sırada olmak hiçbir şey ifade etmiyor. 1. sayfada olup niyeti karşılamayan sayfa
sıfır çeker; 10. sırada olup niyeti tam karşılayan sayfa çeker. Bir sayfa önermeden
önce sorulacak soru "sıralanır mı" değil, **"bu sorguyu arayan kişi tam olarak ne
yapmak istiyor ve sayfa onu yapmasına izin veriyor mu"**.

## 1. Sayfa arketipleri: oynanabilir/kullanılabilir mi, makale mi

Aynı sitede ikisi yan yana ölçüldü:

- **Ürünün kendisi olan sayfalar kazanıyor.** `/who-am-i-game/` makale olarak
  başladı, 9 Ağustos'ta oynanabilir sayfaya çevrildi. Rakipler de makale değil
  oynanabilir sayfaydı. Ana sayfayı "heads up online"da 1. sıraya taşıyan şey de
  içerik değil, tıklandığı an oynanabilir olmasıydı.
- **Makaleler ölüyor.** 30 Temmuz'da 6 içerik sayfası yayınlandı. 82 gün sonra:
  `/charades-words/` (5.441 kelime içerik!) 2 klik poz 14,2 ·
  `/party-games-for-large-groups/` 1 klik poz 62 · `/road-trip-games/` 1 klik ·
  `/family-game-night-games/` 0 klik · `/how-to-play-charades/` 0 klik poz 20,5.

**Kural:** "X nasıl yapılır / X listesi" sorgusuna makale yazmak yerine, X'i
**yapan** bir sayfa yayınla ve kuralları o sayfanın içine koy. Niyet "şimdi
yapmak istiyorum" ise ürün sayfası, "okumak istiyorum" ise makale — ve ikincisi
bu tür ürünlerde nadiren gerçek.

Tek istisna ölçüldü: `/games-like-heads-up/` 154 klik %3,9 CTR. Makale ama niyeti
karşılıyor ("X gibi oyun arıyorum" → liste doğru cevap). Yani makale yasak değil,
**niyeti yanlış okumak** yasak.

## 2. Aynı ürünü çok sayfadan satmak: varyant deseni

Bir hedef küme için ayrı sayfa üretirken ürünü kopyalama, **kabuğu** kopyala:
tek kaynak dosyadan (index.html) üretilen varyant, aynı ürün + tamamen farklı
metin. Üretici fonksiyon yaz, elle çoğaltma.

Her varyantta **zorunlu** olarak farklı olacaklar:
`<title>`, `<meta description>`, `keywords`, canonical (kendine), og/twitter
üçlüsü, JSON-LD (WebPage + BreadcrumbList + HowTo + FAQPage), H1, hero alt metni,
SEO bölümünün tamamı, SSS, ve ürünün iç sıralaması (hangi içerik üstte).

Aynı kalacaklar: ürünün kendisi, CSS, JS.

Doorway cezası riskini şöyle düşür: her sayfa **farklı bir sorgu kümesini kendi
diliyle** karşılasın, 800+ kelime özgün metin taşısın, ve ürünün görünen kısmı
(ilk ekran) gerçekten farklı sıralansın. Beş kabuk sınırda; daha fazlasına
çıkmadan önce ilk partinin GSC'de klik aldığını gör.

Varyant üreticisinde **desen bulunamazsa build patlat** (`process.exit(1)`).
Sessiz başarısızlık en pahalı hata: kaynak dosya değişince varyantlar sessizce
eski metni taşır.

## 3. GSC verisini okuma yöntemi

Tam tarif + çalıştırılabilir kod: **`references/gsc-analysis.md`**

Özet sıra:
1. **Toplamı ve dağılımı çıkar.** Kliklerin yüzde kaçı tek sayfadan geliyor?
   (upheads: %99,2 ana sayfa. Bu, içerik stratejisinin çalışmadığının tek
   satırlık kanıtıydı.)
2. **Pozisyon kovalarına böl.** Fırsat burada görünür. upheads: gösterimlerin
   **%55'i poz 6–11'de %3,3 CTR** ile yanıyordu. Sitenin tüm potansiyeli tek
   bantta toplanmıştı.
3. **Sorguları niyete göre sınıflandır**, hacme göre değil. Regex'e güvenme:
   ilk denemede "word/list" içeren 62 sorgu "liste niyeti" sanıldı, oysa hepsi
   *"alnındaki kelimeyi tahmin et"* diye **ürünü tarif eden** sorgulardı. Gerçek
   liste niyeti 13 sorgu / 155 gösterimdi. **Sorguyu okumadan sınıflandırma.**
4. **Küme büyüklüğünü ölç**, tek sorguya bakma. 192 ayrı uzun kuyruk sorgusu
   tek başına önemsiz, toplamı 5.748 gösterim ve ortalama poz 5,7 — sitenin
   en kazanılabilir fırsatıydı.
5. **GSC talebin yokluğunu kanıtlamaz.** Sadece zaten göründüğün sorguları
   gösterir. Sıralamadığın yerde veri olmaz. "Bu kelimede 0 gösterim var"
   ≠ "talep yok". Yeni bir dikey için dış hacim verisi gerekir (Ahrefs/Semrush);
   GSC yalnızca **mevcut** yüzeyi ölçer.

## 4. Avlanacak sorgu kümeleri (genel desen)

Öncelik sırası, upheads'te ölçülen değerlerle:

1. **"Adını bilmiyorum" tarif kümesi** — en kazanılabilir. Kullanıcı ürünün adını
   bilmiyor, onu tarif ediyor: *"game where you put a word on your forehead"*.
   192 sorgu, 5.748 gösterim, poz 5,7, rakip yok çünkü kimse bu ifadeyi
   hedeflemiyor. Sayfa **önce ürünü adlandırmalı** (aradıkları cevap bu), sonra
   kullandırmalı.
2. **Eşanlamlı/komşu kategori kümesi** — "charades" 90 sorgu, 2.508 gösterim.
   Kazanan alt-niyeti seç: "free charades **game**" (oynanabilir) kazanıyor,
   "charades **words**" (liste) kazanmıyor.
3. **Mevsimsel-evergreen** — "christmas charades", "halloween charades". Niyet
   oyun, terim ölmüyor, her yıl tekrarlıyor. **Trend konulardan tek farkı bu ve
   fark her şey.** Zamanlama: Google'ın indeksleyip sıralaması için pikten
   **6–8 hafta önce** yayınla. Aralık pikine Ekim'de, Ekim pikine Ağustos'ta gir.
4. **"X gibi/alternatifi" kümesi** — ölçüldü, çalışıyor (154 klik).
5. **Çıplak baş terim** — en büyük ödül, en zor. upheads'te "heads up" tek başına
   79.892 gösterim (%39'u), ama poz 8,24 ve %3,7 CTR. Karşıda marka sahibi
   (Warner Bros) + sözlük sonuçları var. **Bu içerik savaşı değil otorite
   savaşı**; backlink olmadan kazanılmıyor. Modifier'lı halleri ("X online",
   "X free") aynı sitede 1. sırada — yani kolay olanı zaten alıyorsundur.

## 5. Tuzaklar (hepsi yaşandı)

- **Yüksek sıralama + sıfır CTR.** Bkz. §0. Bir sayfa 2. sıradaysa ve klik
  gelmiyorsa sayfa kötü değil, **hedef sorgu yanlış**.
- **Trend içerikten SEO trafiği.** Çalışmıyor: SERP günlük yayın yapan haber/
  fandom sitelerinin elinde, terim haftalar içinde ölüyor (her sayfa değer
  kaybeden varlık), ve niyet uyuşmuyor — trend konuyu arayan haber istiyor,
  ürün istemiyor. Trend içerik **retention/paylaşım** özelliğidir, kanalı
  Google değil TikTok/Reels.
- **Ürün içi içerik çeşitliliği = trafik sanmak.** Oyun içi kelimeler JS
  dizisinde yaşar; Google'ın eşleyeceği sorgu yoktur. Çeşitlilik retention'a
  yarar, aramaya yaramaz. (Deney yapıldı: 5.441 kelimelik liste sayfası, 82 gün,
  2 klik.)
- **Marka kelimesi tuzağı.** Yüksek hacimli kelime başkasının pazarlamasıysa o
  hacim senin değil. Marka elendikten sonra altındaki **kategori kelimesine** bak.
- **Kelime niyeti tuzağı.** Popülerlik niyeti söylemez. Başlık/metin yazmadan
  önce o sorgunun **ilk 10 sonucuna** bak: ne tür sayfalar sıralanıyor? Makale mi
  ürün mü? Google o sorgu için neyi ödüllendirdiğini orada söylüyor.
- **Mega sayfa vs özel sayfa.** 30 destelik dev liste sayfası uzun kuyrukta
  sıralanmıyor; aynı içeriğin kendi başlığına sahip özel sayfası sıralanabilir.
  Uzun kuyruk **spesifiklik** ister.
- **İç kopya.** Varyant sayfaları aynı listeyi tekrar dökmesin. Mevsimsel
  sayfalarda kelimeleri **tema gruplarına** böl — hem daha iyi içerik hem kopya
  değil. Grupların desteyi tam kapsadığını build'de doğrula.

## 6. Ölçüm (GA4)

Tam tarif: **`references/analytics-ga4.md`**

En kritik üç şey:
1. **`track()` sarmalayıcısı kullan**, `gtag` çağrısını koda saçma. Tek yerde
   `try/catch` + ortak parametreler (dil, sürüm) + gtag yoksa sessiz geç.
2. **GA4'te parametre kırılımı görmek için Custom Dimension tanımlamak
   zorunludur.** Event'i gönderip parametreyi arayüzde aramak işe yaramaz;
   Admin → Custom definitions'ta kaydetmeden `deck`/`mode` kırılımı görünmez,
   ve kayıttan **önceki** veriye geriye dönük uygulanmaz. Event tasarlarken
   dimension'ı aynı gün tanımla.
3. **Hunideki her adımı ayrı event'le**, tek "oynadı" event'i değil:
   `game_open{source}` → `deck_selected{deck,hard}` → `mode_selected{mode,teams}`
   → `round_start{deck,duration}` → `round_end{deck,score,played}` →
   `deck_finished{deck,size}`. Bu kırılım 2 Ağustos'ta deste sıralamasını
   ölçüme göre yeniden dizmeyi mümkün kıldı — tahminle değil.
4. **İçerik → ürün dönüşümünü ölç.** Her içerik sayfasına delege edilmiş tek
   dinleyici koy, ürün bağlantılarına tıklamayı `cta_click{location,target}`
   olarak gönder. Hangi sayfanın gerçekten kullanıcı getirdiğini ancak bu söyler;
   GSC sadece kliki söyler, dönüşümü söylemez.

**Ölçüp ürünü değiştir.** Ölçümün amacı rapor değil karar: deste sıralaması
ölçülen oynanma verisine göre yeniden dizildi, kazananlar büyütüldü,
performansı düşük desteler baştan yazıldı.

## 7. Sayfa hızı bir SEO girdisidir — ölçülmüş rakamlar

Tam liste: **`references/performance.md`**

En pahalı dört ders:
- **Reklam/3. parti script `<head>`'de = katliam.** AdSense loader head'de
  FCP'yi ~3x, LCP'yi ~2x yavaşlattı. `load` + 2,5 sn gecikmeyle enjekte edilince
  Lighthouse **63 → 94**. Onay ve sunum etkilenmedi.
  Daha iyisi: **ilk kullanıcı etkileşiminde** yükle (`pointerdown`/`keydown`/
  `touchstart`/`scroll`, `once` mantığıyla). Lighthouse etkileşim yapmadığı için
  lab skoru tamamen temiz kalır, gerçek kullanıcı reklamı zamanında görür.
  Yanına `<link rel="preconnect">` koy.
- **`font-display: optional`** CLS'i sıfırladı. `swap` layout kaymasına yol
  açıyordu. Fontu ayrıca **self-host** et — dış istek zinciri LCP'ye giriyor.
- **Dil yönlendirmesini `<head>`'e al.** JS ile body'de yapılan yönlendirme
  redirect cezası yazıyordu.
- **İlk ekranı erken render et.** Kartlar/hero JS beklemeden basılmalı; LCP
  elemanı JS'e bağlıysa skor düşer.

## 8. Çoklu dil

- **Her dil kendi URL'inde** (`/tr/`, `/hu/`), tek sayfada runtime çeviri değil.
- `hreflang` tüm diller + **`x-default`** şart; her sayfa kendine canonical.
- Statik üretimde her dil sayfası **sadece kendi sözlüğünü** taşısın. Dil eklemek
  ana sayfaya tek bayt bindirmemeli — yoksa performans skoru dil başına düşer.
- Dile özel içeriği `lang` alanıyla işaretle; üretici o içeriği diğer dillere
  **hiç yazmasın** (upheads: US spor + mevsimsel desteler EN-only, `/tr/` ve
  `/hu/` o kelimelerin tek baytını almıyor).
- **Ne zaman lokalize etmemeli:** ölçülen talep eşiğin altındaysa. Türkçe sürüm
  kaldırıldı çünkü üç ayda 54 gösterimin altındaydı ve ziyaretçilerin ~%94'ü
  İngilizce pazarlardan geliyordu. Sonra gerçek kullanıcı talebiyle (bir
  kullanıcının ailesi için Macarca) geri geldi — **kullanıcı talebi hacim
  verisini yener**, ama ikisi de yoksa yapma.

## 9. Teknik hijyen

- **Tek kaynak doğrusu.** Sayfa üreticisi içerik verisini ürünün kendisinden
  okusun (upheads: `pages.js`, `index.html`'deki `CATEGORIES`'ten okur). İçerik
  iki yerde durursa biri bayatlar.
- **`trailingSlash: true` kullanıyorsan yönlendirme desenlerini buna göre yaz.**
  `/a/b/` kaynağı eşleşmez; `/a/b/(.*)` deseni gerekir. Bu tuzak canlıda 404
  ürettirdi.
- **`vercel.json`'da yinelenen anahtar sessizce veri yutar.** İki `redirects`
  bloğu olduğunda JSON son olanı tutar ve 11 yönlendirme sessizce kayboldu.
  Düzenlemeden önce `json.load` ile parse et, programatik ekle, tekrar yaz.
- **Mağaza kaydında yazan URL'i asla 301'lemeyin.** Bir uygulamanın store
  listesindeki gizlilik URL'i yönlendirilince kayıt bozulur. Doğru hamle:
  `noindex` + daha net bir takma adres ekle, eskisini yerinde bırak.
- **Yönetim panelini aramaya kapat** (`robots.txt` + `noindex`).
- **Sitemap'i üretici güncellesin**, elle tutma. Üretilen dizinleri
  "elle düzenlenmez" diye readme'ye yaz.
- **301 ölü sayfayı birleştirir.** Poz 20'de 0 klik alan makaleyi, onun niyetini
  devralan canlı sayfaya 301'le ve iç bağlantıları güncelle. Vercel
  `permanent:true` için **308** döner — SEO açısından 301'e eşdeğer.

## 10. Reklam/monetizasyon ile kesişim

- **AdSense "low value content" reddi genelde içerik azlığı değildir.** upheads
  reddedildiğinde ~13.000 kelime içerik vardı. Gerçek sebep: **header'da tek
  bağlantı yoktu ve About sayfası yoktu.** İnceleyici gezinemediği siteyi
  değersiz sayıyor. Çözüm: üst navigasyon + Hakkımızda + rehber merkezi.
- **Gizli slot'a reklam isteği atma.** Sarmalayıcılar görünürlüğü genelde saf
  geometriyle ölçer (`getBoundingClientRect().top` aralıkta mı). `display:none`
  bir eleman `top=0` döndürür → "görünür" sayılır; `visibility:hidden` eleman
  layout kutusunu korur → `IntersectionObserver` bile onu kesişiyor görür.
  Sonuç: kullanıcının görmediği impression'lar sunulur **ve** viewability
  yüksek ölçülür. Slot'u görünene kadar **DOM'da tutma**, görününce ekle ve
  sarmalayıcının yeniden tarama API'sini çağır.
- **Yenileme sayacı istek anında başlar**, kullanıcı reklamı gördüğünde değil.
  Gizliyken istek atıldıysa 20 sn'lik yenileme tur boyunca döner ve kullanıcı
  reklamı gördükten rastgele bir süre sonra üstüne biner.
- **Süre birimini doğrula.** Sarmalayıcı konfigleri süreyi doğrudan
  `setInterval`'a verebilir — yani **milisaniye**. `20` yazmak 20 saniye değil
  20 ms olur.
- **`ads.txt` dosyasını sağlayıcı verdiyse birebir koy**, satır düzenlemeyin.
  Aynı ID'ler farklı listelerde DIRECT vs RESELLER olabilir ve yanlışı gelir
  kaybettirir.

## 11. Çalışma düzeni

1. **Değiştirmeden önce ölç.** GSC export + GA4. Hipotezini rakamla kur.
2. **En büyük kovayı bul** (genelde poz 6–11), oradaki kümeleri boyutlandır.
3. **Kümeye niyeti eşleşen sayfa üret**, üretici fonksiyonla.
4. **Build'i doğrulat**: canonical kendine mi, title/H1 benzersiz mi, JSON-LD
   parse ediliyor mu, sitemap'te var mı, ölü URL'e iç bağlantı kalmış mı.
5. **Canlıda doğrula**: her yeni URL için raw + takip edilmiş HTTP kodu, 301
   hedefi, canlı `<title>` ve canonical.
6. **4–6 hafta bekle, GSC'de tekrar ölç.** Klik gelmiyorsa sayfayı kurtarmaya
   çalışma — **niyeti yanlış okudun**, kümeyi yeniden sınıflandır.

Yayın öncesi kontrol: `git fetch` + yerel/uzak karşılaştırması. Bir ortak varsa
pull etmeden deploy etmek üretimden commit siler.
