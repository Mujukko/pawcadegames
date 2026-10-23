# GSC export'unu analiz etme tarifi

Search Console → Performance → Export → **Excel (.xlsx)**. Sheet'ler:
`Chart` (günlük), `Queries` (ilk 1000), `Pages`, `Countries`, `Devices`,
`Search appearance`, `Filters`.

**1000 sorgu sınırı**: `Queries` toplamı site toplamından küçüktür. upheads'te
20.731 / 25.869 klik — yani uzun kuyruğun %20'si export'ta yok. Yüzde hesabında
hangi tabanı kullandığını söyle.

## Çalıştırılabilir iskelet

```python
import openpyxl, re, collections
wb = openpyxl.load_workbook("export.xlsx")
q  = [r for r in wb['Queries'].iter_rows(min_row=2, values_only=True) if r[0]]
# r = (sorgu, klik, gosterim, ctr, pozisyon)

# --- 1. Taban: sayfa yogunlasmasi ---
for t,c,i,ctr,p in wb['Pages'].iter_rows(min_row=2, values_only=True):
    print(f"{c:>7,.0f} klik {i:>8,.0f} gos CTR {ctr*100:>5.1f}% poz {p:>5.1f}  {t}")
# Kliklerin %90+'i tek sayfadaysa icerik stratejisi calismiyor.

# --- 2. Pozisyon kovalari: firsat burada ---
for lo,hi,lbl in [(1,1.9,'1-2'),(2,2.9,'2-3'),(3,5.9,'3-6'),(6,10.9,'6-11'),(11,20.9,'11-21'),(21,999,'21+')]:
    m = [r for r in q if lo <= r[4] <= hi]
    if not m: continue
    ci, ii = sum(r[1] for r in m), sum(r[2] for r in m)
    print(f"poz {lbl:>6}: {len(m):>4} sorgu {ci:>7,.0f} klik {ii:>9,.0f} gos CTR {ci/ii*100:>5.2f}%")

# --- 3. Kume boyutlandirma (hacme gore degil, NIYETE gore) ---
def cluster(pat, label):
    m = [r for r in q if re.search(pat, r[0], re.I)]
    if not m: return
    ci, ii = sum(r[1] for r in m), sum(r[2] for r in m)
    pos = sum(r[4]*r[2] for r in m)/ii
    print(f"{label:28} {len(m):>4} sorgu {ci:>6,.0f} klik {ii:>8,.0f} gos "
          f"CTR {ci/ii*100:>5.2f}% ort.poz {pos:>4.1f}")

cluster(r'forehead|on (your |my |the )?head', 'tarif kumesi')
cluster(r'charade',                            'komsu kategori')
cluster(r'\b(free|online)\b',                  'modifier')
cluster(r'\b(words?|list|ideas?)\b',           'liste niyeti (DOGRULA!)')
```

## Zorunlu adım: sınıflandırmayı elle doğrula

Regex ilk denemede yanılttı. `\b(words?|list|ideas?)\b` deseni 62 sorgu buldu ve
"liste niyeti" sanıldı. Sorguları **okuyunca** hepsinin şu tipte olduğu görüldü:

```
guess the word on your head          65 gos
game with word on forehead           63 gos
game where you guess the word ...    51 gos
```

Bunlar liste aramıyor, **ürünü tarif ediyor**. Gerçek liste niyeti 13 sorgu /
155 gösterimdi — yani %90 hatalı sınıflandırma. **Her kümenin ilk 30 sorgusunu
gözle oku**, sonra karar ver.

```python
L = sorted([r for r in q if re.search(PAT, r[0], re.I)], key=lambda r: -r[2])
for t,c,i,ctr,p in L[:30]:
    print(f"{i:>6,.0f} gos {c:>4,.0f} klik poz {p:>5.1f}  {t}")
```

## Yorumlama kuralları

| Gözlem | Anlamı |
|---|---|
| Yüksek gösterim + poz 6–11 + düşük CTR | Ana fırsat. Pozisyon işi. |
| Yüksek gösterim + poz 1–2 + ~%0 CTR | **Niyet uyuşmazlığı.** Sorgu yanlış, sayfa değil. |
| Çok sorgu + düşük tek-sorgu hacmi + poz 4–8 | Uzun kuyruk kümesi. Özel sayfa aç. |
| Tek sorgu gösterimin %30+'ı | Baş terim. Otorite/backlink işi, içerik değil. |
| Tireli/kesme işaretli varyantta %0,1 CTR | Deyim/sözlük niyeti. Dönüşmez, kovala. |

Son satır önemli: upheads'te `heads-up` 5.044 gösterim **%0,1 CTR**, `head's up`
811 gösterim %0,1. Bunlar oyunu değil, "önceden haber verme" deyimini arıyordu.
Baş terimin hacmini olduğu gibi potansiyel sayma — **niyet kırılımını çıkar.**

## Cihaz kırılımı

upheads: mobil 21.955 klik %15,3 CTR · masaüstü 3.362 klik **%5,6** CTR, benzer
pozisyonda (6,27 vs 6,92). Masaüstünde 60.421 gösterim neredeyse boşa gidiyor.
Mobil-öncelikli bir ürün için bu normal ve üzerinde yapacak çok şey yok; ama
masaüstü CTR'ı mobilin 1/3'üyse **masaüstü için ayrı iddia yazmayı** değerlendir.

## Dönüşüm GSC'de yok

GSC kliki söyler, ne olduğunu söylemez. Sayfa başına klik ile GA4'teki
`cta_click` / `game_open` olaylarını eşleştir. 22 view getiren bir URL'in kaç
kullanıcıyı ürüne soktuğunu ancak bu söyler.
