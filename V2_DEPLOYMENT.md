# 🚀 BountyChain v2.0 Deployment Guide

## ⚠️ Önemli: Yeni Deploy Gerekli

Yeni review sistemi için kontratlar değişti. **Yeniden deploy etmen gerekiyor!**

---

## 📦 Deploy Adımları

### 1. Move Kontratlarını Derle
```bash
cd move
sui move build
```

### 2. Kontratları Deploy Et
```bash
npm run deploy
```

**Beklenen Çıktı:**
```
✅ Build successful!
📦 Publishing to Sui testnet...
✅ Package ID: 0x...
✅ Bounty Registry ID: 0x...
✅ Leaderboard ID: 0x...
✅ Mini Hack Registry ID: 0x...
```

### 3. .env Dosyası Otomatik Güncellenir
Deploy script otomatik olarak `.env` dosyasını güncelleyecek.

### 4. Frontend'i Restart Et
```bash
npm run dev
```

---

## 🧪 Test Planı

### Test 1: Review Mode UI Testi
1. `/create-bounty` sayfasına git
2. Formu doldur
3. **"Review Configuration"** bölümünü kontrol et:
   - ✅ "Enable Platform Review" checkbox görünüyor mu?
   - ✅ "Owner Review Timeout" dropdown çalışıyor mu?
   - ✅ Info box açıklama metni görünüyor mu?

**Beklenen:**
- Purple gradient background
- Checkbox ve select çalışıyor
- Fee badge'ler görünüyor

---

### Test 2: Bounty Oluşturma (Manuel Review)
1. `/create-bounty` sayfası
2. Form doldur:
   ```
   Title: Test Review System
   Reward: 1 SUI
   Platform Review: OFF ❌
   Timeout: 7 days
   ```
3. "Create Bounty" tıkla
4. Transaction'ı imzala

**Beklenen:**
- ✅ Transaction başarılı
- ✅ Bounty oluştu
- ✅ Console'da hata yok

---

### Test 3: Bounty Oluşturma (Platform Review)
1. Form doldur:
   ```
   Title: Test Platform Review
   Reward: 1 SUI
   Platform Review: ON ✅
   Timeout: 3 days
   ```
2. Create bounty

**Beklenen:**
- ✅ Transaction başarılı
- ✅ Review mode kaydedildi

---

### Test 4: PoC Submission
1. `/hacks` sayfasından bounty seç
2. "Submit PoC" tıkla
3. Test dosyası yükle
4. Submit et

**Beklenen:**
- ✅ Walrus upload başarılı
- ✅ Transaction başarılı
- ✅ Submission status = "Pending Review"

---

### Test 5: Review Submissions Sayfası
1. Bounty sahibi olarak `/review/BOUNTY_ID` git
2. Submission'ları gör

**Beklenen:**
- ✅ Sayfa açılıyor
- ✅ Submission'lar listeleniyor
- ✅ Timeout countdown görünüyor
- ✅ "View Details" butonu çalışıyor

---

### Test 6: Submission Review (Owner)
1. Review sayfasında
2. "View Details" tıkla
3. Review notes yaz
4. "Approve & Pay" tıkla
5. Transaction imzala

**Beklenen:**
- ✅ Modal açılıyor
- ✅ Transaction başarılı
- ✅ Hacker ödeme alıyor (%97 - %3 platform fee)
- ✅ Status = "Approved"

---

## 🐛 Beklenen Hatalar ve Çözümler

### Hata 1: "Module not found: bounty_manager"
**Sebep:** Eski package ID kullanılıyor
**Çözüm:**
```bash
npm run deploy  # Yeniden deploy
# .env otomatik güncellenir
npm run dev     # Restart
```

### Hata 2: "Function not found: review_submission"
**Sebep:** Kontratlar güncellenmemiş
**Çözüm:** Yeniden deploy et

### Hata 3: "Invalid argument count"
**Sebep:** create_bounty'ye 2 yeni parametre eklendi
**Çözüm:** Frontend zaten güncelli, cache temizle
```bash
# Browser'da Ctrl+Shift+R (hard refresh)
```

### Hata 4: "Review page 404"
**Sebep:** Route eklenmedi
**Çözüm:** App.jsx'de route ekli mi kontrol et

---

## ✅ Test Checklist

### Contract Test
- [ ] Package deploy başarılı
- [ ] Registry ID alındı
- [ ] Leaderboard ID alındı
- [ ] .env güncellendi

### UI Test
- [ ] Create bounty form yükleniyor
- [ ] Review mode section görünüyor
- [ ] Checkbox çalışıyor
- [ ] Timeout dropdown çalışıyor
- [ ] Info box görünüyor

### Functionality Test
- [ ] Manuel review mode ile bounty oluşturuldu
- [ ] Platform review mode ile bounty oluşturuldu
- [ ] PoC submission çalışıyor
- [ ] Review sayfası açılıyor
- [ ] Submission listesi yükleniyor
- [ ] Review modal açılıyor
- [ ] Approve transaction başarılı
- [ ] Hacker ödeme aldı
- [ ] Platform fee doğru hesaplandı

### Edge Cases
- [ ] Timeout süresi doğru hesaplanıyor
- [ ] Duplicate submission engelleniyor
- [ ] Sadece owner review yapabiliyor
- [ ] Review edilen submission tekrar edilemiyor

---

## 📊 Test Sonuçları

Her test sonrası şunu kaydet:

```markdown
## Test Tarihi: [06/12/2025]

### Başarılı Testler ✅
- Contract deployment
- UI rendering
- Bounty creation (manual)
- Bounty creation (platform)
- PoC submission
- Review page load
- Approve & pay

### Başarısız Testler ❌
- [Varsa buraya yaz]

### Console Errors
[Varsa buraya yapıştır]

### Gas Costs
- Create bounty: ~X SUI
- Submit PoC: ~Y SUI
- Review submission: ~Z SUI

### Notlar
[Önemli gözlemler]
```

---

## 🎯 Production Hazırlığı

### 1. Mainnet Deploy Öncesi
- [ ] Tüm testler başarılı
- [ ] Gas cost'lar makul
- [ ] Security audit yapıldı (opsiyonel)
- [ ] Dokümantasyon tamamlandı

### 2. Mainnet Deploy
```bash
# .env'i mainnet'e çevir
VITE_SUI_NETWORK=mainnet

# Deploy
npm run deploy
```

### 3. İlk Platform Validator Ekle
```javascript
// Admin wallet ile çalıştır
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::bounty_manager::add_platform_validator`,
  arguments: [
    tx.object(REGISTRY_ID),
    tx.pure.address('YOUR_VALIDATOR_ADDRESS'),
  ],
});
```

### 4. Monitoring
- Bounty creation count
- Review mode distribution
- Platform fee collected
- Average review time

---

## 🚨 Acil Durumlar

### Kritik Bug Bulunursa
1. Hemen testnet'te durdur
2. Bug'ı not et
3. Fix yap
4. Yeniden test et
5. Deploy et

### Mainnet'te Problem
1. Platform validator'ı disable et
2. Manuel review'a geç
3. Problem çöz
4. Validator'ı re-enable et

---

## 📞 Destek

Sorun çıkarsa:
1. Console log'ları kopyala
2. Network tab'ı kontrol et
3. Transaction hash'i al
4. Sui Explorer'da kontrol et

---

## ✨ Sonraki Adımlar

- [ ] Deploy et
- [ ] Test et
- [ ] Validator ekle
- [ ] Monitoring kur
- [ ] Duyur! 🚀
