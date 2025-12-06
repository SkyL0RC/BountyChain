# BountyChain Test Checklist

## ✅ Test Adımları

### 1. Contract Test (Backend)
```bash
npm run test:contracts
# veya
bash scripts/test-contracts.sh
```

**Kontrol Et:**
- [ ] Package ID mevcut
- [ ] Bounty Registry mevcut
- [ ] Leaderboard mevcut
- [ ] Mini Hack Registry mevcut
- [ ] Walrus endpoint erişilebilir

---

### 2. Frontend Test (Manuel)
```bash
npm run dev
```

Tarayıcıda: http://localhost:5174

#### A. Wallet Bağlantısı
- [ ] "Connect Wallet" butonu çalışıyor
- [ ] Sui Wallet açılıyor
- [ ] Bağlantı onaylanıyor
- [ ] Adres görünüyor
- [ ] Console'da hata yok

#### B. Ana Sayfa
- [ ] Tüm bölümler render oluyor
- [ ] Stats görünüyor (TVL, Bounties, etc.)
- [ ] Navigation çalışıyor
- [ ] No console errors

#### C. Hack List
- [ ] Sayfa açılıyor
- [ ] Bounty listesi görünüyor (boş olabilir)
- [ ] Filter butonları çalışıyor
- [ ] Sort dropdown çalışıyor
- [ ] Console'da hata yok

#### D. Create Bounty
- [ ] Form açılıyor
- [ ] Tüm alanlar çalışıyor
- [ ] Validation çalışıyor
- [ ] "Create Bounty" butonu çalışıyor
- [ ] Wallet transaction popup açılıyor
- [ ] Transaction imzalanabiliyor
- [ ] Success notification geliyor
- [ ] Console'da hata yok

**Test Verisi:**
```
Project Name: Test Project
Title: Test Bug Bounty  
Description: Testing bounty creation
Scope: Smart contracts only
Critical: 1 SUI
High: 0.5 SUI
Medium: 0.2 SUI
Low: 0.1 SUI
Deadline: 7 days
GitHub: https://github.com/test/test
Website: https://test.com
```

#### E. PoC Submission
- [ ] Bounty detay sayfası açılıyor
- [ ] "Submit PoC" modal açılıyor
- [ ] Dosya seçimi çalışıyor
- [ ] Severity seçimi çalışıyor
- [ ] Upload progress bar görünüyor
- [ ] Walrus'a upload başarılı
- [ ] Transaction popup açılıyor
- [ ] Transaction başarılı
- [ ] Console'da hata yok

**Test Dosyası:** Herhangi bir .txt veya .pdf dosya

#### F. Mini Hack
- [ ] Sayfa açılıyor
- [ ] Challenge'lar görünüyor
- [ ] "Submit Solution" modal açılıyor
- [ ] Solution input çalışıyor
- [ ] Transaction popup açılıyor
- [ ] Console'da hata yok

#### G. Leaderboard
- [ ] Sayfa açılıyor
- [ ] Leaderboard yükleniyor
- [ ] Sıralama görünüyor
- [ ] Console'da hata yok

---

## 🐛 Hata Analizi

### Console'da Kontrol Et (F12 → Console)

**Normal Mesajlar (Sorun Değil):**
```
✅ "Vite ready in..."
✅ "[HMR] connected"
✅ Walrus 404 before upload (normal)
```

**Sorun Olan Hatalar:**
```
❌ "Uncaught Error..."
❌ "Failed to fetch..."
❌ "TypeError..."
❌ "ReferenceError..."
❌ "Transaction failed"
```

### Network Tab'da Kontrol Et (F12 → Network)

**Başarılı Requests:**
- Sui RPC: Status 200
- Walrus upload: Status 200
- Static assets: Status 200

**Sorunlu Requests:**
- Status 500: Server error
- Status 0: CORS (Walrus için normal)
- Pending: Request takılı kalmış

---

## 📝 Test Sonuçları Template

```
# Test Tarihi: [TARIH]

## Contract Test
- Package Exists: ✅/❌
- Registry Exists: ✅/❌
- Leaderboard Exists: ✅/❌
- Mini Hack Exists: ✅/❌
- Walrus Reachable: ✅/❌

## Frontend Test
- Wallet Connection: ✅/❌
- Homepage: ✅/❌
- Hack List: ✅/❌
- Create Bounty: ✅/❌
- PoC Submission: ✅/❌
- Mini Hack: ✅/❌
- Leaderboard: ✅/❌

## Console Errors
[Varsa buraya yapıştır]

## Network Errors
[Varsa buraya yapıştır]

## Notlar
[Önemli gözlemler]
```

---

## 🚨 Sık Karşılaşılan Sorunlar

### 1. "Insufficient gas"
**Çözüm:** Testnet faucet'ten SUI al
```
https://faucet.sui.io/
```

### 2. "Network mismatch"
**Çözüm:** Wallet'ı testnet'e ayarla

### 3. "Object not found"
**Çözüm:** .env dosyasını kontrol et, ID'ler doğru mu?

### 4. "Failed to fetch Walrus"
**Çözüm:** Normal, Walrus CORS hatası olabilir (kod içinde handle ediliyor)

### 5. "Module not found"
**Çözüm:** 
```bash
npm install
```

### 6. Port 5173 kullanımda
**Çözüm:** Otomatik 5174'e geçer veya:
```bash
killall node
npm run dev
```

---

## ⚡ Quick Test Command

Tüm testleri hızlıca çalıştır:
```bash
# 1. Backend test
bash scripts/test-contracts.sh

# 2. Frontend başlat
npm run dev

# 3. Tarayıcıda aç
# http://localhost:5174

# 4. F12 aç ve console'u izle

# 5. Checklist'i takip et
```
