# İçerik — şarkıları ve setlist'i buradan düzenlersiniz

Uygulamadaki her şey bu klasördeki `.yaml` dosyalarından gelir. Kod bilmeye
gerek yok: dosyaları GitHub üzerinden düzenleyip kaydetmeniz yeterli.

Bir şeyi yanlış yazarsanız uygulama bozulmaz — **kayıt sırasında hata verir ve
neyin yanlış olduğunu söyler.** Kendi bilgisayarınızda kontrol etmek için:

```
npm run content:check
```

Bu komut hem hataları hem de **hangi şarkıda ne eksik** olduğunu listeler.

---

## Üç tür dosya var

| Dosya | Ne tutar |
|---|---|
| `band.yaml` | Grup kadrosu — kim var, hangi enstrümanı çalıyor |
| `concerts/subat.yaml` | **Setlist** — şarkı sırası ve her şarkıda kimin çaldığı |
| `songs/sarki-adi.yaml` | Şarkının kendisi — ton, tempo, bölümler, akorlar, sözler |

Mantık şu: **kadro konsere aittir** (her konserde değişebilir), **ton ve akorlar
şarkıya aittir** (konserden konsere aynı kalır).

---

## 1. Setlist'i değiştirmek — `concerts/february.yaml`

Sıra, dosyadaki sıradır. Bir şarkıyı yukarı almak için satırını yukarı taşıyın.

```yaml
setlist:
  - song: bad-romance
    lineup: { vokal: [berfin, doga], gitar: [itri], klavye: [seco], bas: [dogukan], davul: [burak] }
```

- `song:` → `songs/` klasöründeki dosya adı (`.yaml` olmadan).
- `lineup:` içindeki isimler `band.yaml`'daki `id`'lerdir — `Doğa` değil, `doga`.
- **Vokal listesinde ilk isim solisttir.**
- `segue: true` eklerseniz "sonraki şarkıya ara vermeden geçilir" demektir.

Ara eklemek için:

```yaml
  - break: KISA BİR ARA
    minutes: 15
```

Şarkı çıkarmak için satırı silin. Şarkı eklemek için önce `songs/` içinde
dosyasını oluşturun, sonra buraya bir satır ekleyin.

---

## 2. Bir şarkıyı doldurmak — `songs/bad-romance.yaml`

```yaml
id: bad-romance
title: "Bad Romance"
artist: "Lady Gaga"
key: Am                # yazılı ton. Herkes kendi telefonunda istediği gibi transpoze eder.
tempo: 119             # BPM
meter: "4/4"
style: pop             # eşlik ritmi: pop, rock, funk, ballad, latin, disco
```

### Bölümler ve akorlar

```yaml
structure:
  - id: intro
    label: "Intro"
    chords: "| F | G | Am E/G# | C/A |"
    cue: "Synth intro — 2 bar"
  - id: verse
    label: "Verse"
    chords: "| Am | % | F | C |"
    repeat: 2
```

Akor yazımı tek kural: **`|` barları ayırır.**

- Bir barda iki akor → aralarına boşluk: `| C F |`
- Önceki barın aynısı → `%`: `| Am | % |`
- Akor yok → `N.C.`
- `repeat: 2` → bölüm arka arkaya iki kez çalınır.

Akorları yazarken `Am`, `Bb`, `F#m7`, `Cmaj7`, `E/G#` gibi normal yazım geçerli.
Transpoze ettiğinizde uygulama akorları hedef tonun işaretlemesine göre yeniden
yazar (örneğin Bb'ye giderken `A#` değil `Bb`).

### Sözler

```yaml
lyrics: |
  [Verse 1]
  İlk satır
  İkinci satır

  [Nakarat]
  Nakarat satırı
```

- `[Köşeli parantez]` içindeki başlıklar bölüm adıdır.
- İsterseniz akorları söz içine gömebilirsiniz: `Seni [Am]çok özledim`.
  Bunlar sadece **Akorlar** görünümünde çıkar; **Sözler** görünümü onları gizler.

### Uyarılar ve geçişler

```yaml
cues:
  - { at: intro, text: "START — KEYS AND VOX" }
  - { text: "Serbest tempo, KLİK YOK" }      # at: yoksa şarkının tamamı için

transitions:
  in:  "Get Lucky biter bitmez, ara vermeden"
  out: "Kandırdım'a davul fill ile geç"
```

---

## 3. Kadroyu değiştirmek — `band.yaml`

```yaml
members:
  - { id: doga, name: Doğa, roles: [vokal] }
```

- `id` küçük harf, boşluksuz, Türkçe karaktersiz olmalı (`dogukan`, `ozan-a`).
- `name` istediğiniz gibi yazılabilir (`Doğa`, `Ekin Berkyürek`).
- `roles` → o kişinin çalabildiği enstrümanlar.

`roles:` bölümündeki `slots` sayısı, setlist ekranındaki sütun sayısıdır —
geçen yılki tabloda Vokal 3 sütundu, Gitar 2.

---

## Sık yapılan hatalar

| Hata mesajı | Anlamı |
|---|---|
| `unknown member "dogu"` | `band.yaml`'da böyle bir `id` yok — yazımı kontrol edin |
| `references song "x", but content/songs/x.yaml does not exist` | Setlist'te olmayan bir şarkıya işaret ediyorsunuz |
| `role "vokal" has 4 people but only 3 slot(s)` | `band.yaml`'daki `slots` sayısını artırın |
| `must look like 4/4, 6/8, 3/4` | `meter` yazımı hatalı |
| `invalid YAML` | Genelde tırnak ya da girinti hatası — iki boşluk kullanın, tab kullanmayın |
