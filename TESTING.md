# 🧪 BountyChain Test Rehberi

## 🎯 Test Özeti

BountyChain platformunun 3 ana bileşeni var:
1. **Smart Contracts** (Sui blockchain)
2. **Walrus Storage** (Decentralized file storage)
3. **Frontend** (React + Vite)

## 🚀 Hızlı Test

### 1. Backend Test (Contract'ları Kontrol Et)
```bash
npm run test:contracts
```

Bu test:
- ✅ Package ID'yi kontrol eder
- ✅ Registry objelerini kontrol eder
- ✅ Walrus endpoint'lerini kontrol eder

**Beklenen Çıktı:**
```
✅ Bounty Registry exists
✅ Leaderboard exists
✅ Mini Hack Registry exists
✅ Package exists
```

### 2. Frontend Test (Manuel)
```bash
npm run dev
```

Tarayıcıda aç: http://localhost:5174

**F12'ye bas ve Console'u aç** - Tüm hatalar burada görünecek!

---

## 📋 Detaylı Test Checklist

### Test 1: Wallet Bağlantısı
1. "Connect Wallet" butonuna tıkla
2. Sui Wallet'ı seç
3. Bağlantıyı onayla
4. Adresin görünmesini bekle

**✅ Başarılı:** Adres header'da görünüyor
**❌ Hata:** Console'da "wallet connection failed" hatası

---

### Test 2: Bounty Oluşturma
1. "Create Bounty" sayfasına git
2. Formu doldur:
   ```
   Project Name: Test Project
   Title: Test Bug Bounty
   Description: Testing
   Scope: All
   Critical: 1 SUI
   High: 0.5 SUI
   Medium: 0.2 SUI
   Low: 0.1 SUI
   Deadline: 7 days
   ```
3. "Create Bounty" butonuna tıkla
4. Wallet'tan transaction'ı imzala
5. Success notification bekle

**✅ Başarılı:** Transaction başarılı, bounty oluştu
**❌ Hata:** Transaction failed, gas yetersiz, veya console error

**Console'da Kontrol Et:**
```javascript
// Başarılı olursa göreceksin:
"Transaction successful"
"Bounty created"

// Hata varsa göreceksin:
"Error creating bounty"
"Insufficient gas"
"Transaction failed"
```

---

### Test 3: PoC Submission (Walrus + Seal Test)
1. Hack List'ten bir bounty seç
2. "Submit PoC" butonuna tıkla
3. Bir test dosyası seç (.txt veya .pdf)
4. Severity seç (örn: High)
5. Description yaz
6. "Upload & Submit" tıkla
7. Progress bar'ı izle
8. Transaction'ı imzala

**✅ Başarılı:** 
- Progress bar %100'e ulaşır
- "File uploaded to Walrus" mesajı
- Transaction başarılı
- Console'da blob ID görünür

**❌ Hata:**
- Upload takılı kalır
- "Failed to upload" hatası
- Walrus timeout
- Transaction failed

**Console'da Kontrol Et:**
```javascript
// Walrus upload log'ları:
"Uploading to Walrus..."
"Blob ID: 0x..."
"Encrypting with Seal..."
"Submitting to blockchain..."

// Hata varsa:
"Walrus upload failed"
"Seal encryption failed"
"Transaction failed"
```

---

### Test 4: Mini Hack
1. "Mini Hack" sayfasına git
2. Bir challenge seç
3. "Submit Solution" tıkla
4. Test çözümü gir: `test123`
5. Submit'e tıkla
6. Transaction'ı imzala

**✅ Başarılı (bile yanlış cevap olsa):** Transaction imzalanır
**❌ Hata:** Transaction rejected veya console error

---

### Test 5: Leaderboard
1. "Leaderboard" sayfasına git
2. Loading spinner'ı izle
3. Leaderboard'un yüklenmesini bekle

**✅ Başarılı:** Liste görünür (boş olsa bile)
**❌ Hata:** Infinite loading, "Failed to fetch" hatası

**Console'da Kontrol Et:**
```javascript
// Başarılı:
"Loading leaderboard..."
"Leaderboard data:", [...]

// Hata:
"Failed to load leaderboard"
"Error fetching data"
```

---

## 🐛 Yaygın Hatalar ve Çözümleri

### Hata 1: "Insufficient gas"
**Neden:** Wallet'ta SUI yok
**Çözüm:** 
```bash
# Testnet faucet'ten SUI al:
https://faucet.sui.io/
```

### Hata 2: "Network mismatch"
**Neden:** Wallet mainnet'te, kod testnet'te
**Çözüm:** Wallet'ı testnet'e çevir

### Hata 3: "Failed to fetch from Walrus"
**Neden:** CORS veya network error (NORMAL)
**Çözüm:** Kod içinde handle ediliyor, ignore et

### Hata 4: "Object not found"
**Neden:** .env'deki ID'ler yanlış
**Çözüm:**
```bash
# .env dosyasını kontrol et
cat .env

# Doğru ID'ler var mı?
# Yoksa yeniden deploy et
npm run deploy
```

### Hata 5: "Transaction failed: Object version mismatch"
**Neden:** Shared object race condition
**Çözüm:** Transaction'ı tekrar dene

### Hata 6: Console'da kırmızı hatalar
**Neden:** Kod hatası veya missing dependency
**Çözüm:**
```bash
# Node modules'ı temizle ve yeniden yükle
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 🔍 Console'da Neye Bakmak?

### ✅ Normal Log'lar (Sorun Değil):
```
[vite] connected
[HMR] ready
Wallet connected: 0x...
Loading bounties...
```

### ❌ Sorunlu Log'lar:
```
Error: Failed to fetch
Uncaught TypeError: ...
Transaction failed
Network request failed
CORS error (eğer Walrus dışında)
```

---

## 📊 Test Sonucu Raporu

Her test sonrası şunu yaz:

```markdown
## Test Tarihi: [06/12/2025]

### Başarılı Testler ✅
- [ ] Wallet bağlantısı
- [ ] Bounty oluşturma
- [ ] PoC submission
- [ ] Mini Hack
- [ ] Leaderboard

### Başarısız Testler ❌
- [ ] [Test adı] - [Hata mesajı]

### Console Errors
```
[Buraya console'daki hataları yapıştır]
```

### Ekran Görüntüleri
[Varsa ekle]

### Notlar
[Önemli gözlemler]
```

---

## 💡 Test İpuçları

1. **Her zaman Console açık tut** (F12)
2. **Network Tab'ı izle** - Failed request'leri gör
3. **Wallet'ta yeterli SUI olsun** (testnet faucet)
4. **Her test sonrası sayfayı yenile** - Cache temizlenir
5. **Transaction fail olursa tekrar dene** - Network issue olabilir
6. **Screenshot al** - Hataları göstermen için

---

## 🎓 Test Stratejisi

### Seviye 1: Temel Test (5 dk)
- Wallet bağlan
- Ana sayfayı gez
- Console'da hata olup olmadığına bak

### Seviye 2: Orta Test (15 dk)
- Bounty oluştur
- PoC submit et
- Leaderboard'a bak

### Seviye 3: Full Test (30 dk)
- Checklist'teki her şeyi test et
- Tüm hataları kaydet
- Screenshot al

---

## 📞 Yardım Gerekirse

Hata bulursan, şunları paylaş:
1. Console log'ları (F12 → Console → Copy)
2. Network tab hataları (F12 → Network)
3. Ne yapmaya çalıştığın
4. Ne beklediğin
5. Ne olduğu
6. Screenshot

---

## ✅ Test Tamamlandı!

Testler başarılıysa:
- Smart contract'lar çalışıyor ✅
- Walrus entegrasyonu çalışıyor ✅
- Seal encryption çalışıyor ✅
- Frontend çalışıyor ✅

Artık production'a hazırsın! 🚀
