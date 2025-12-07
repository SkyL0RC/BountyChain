# BountyChain 🛡️

**Sui blockchain üzerinde %100 trustless bug bounty platformu**

İlk geçerli PoC'yi gönderen hacker, escrow'dan otomatik olarak ödülü alır. Admin onayı yok, beklemek yok, sadece smart contract mantığı.

---

## 🎯 Özellikler

- ✅ **Trustless Escrow**: Bounty sahibi oluştururken parayı kilitler, hacker çözünce otomatik alır
- ✅ **Anında Ödeme**: Smart contract onayı ile direkt ödeme (2-8 hafta beklemek yok)
- ✅ **Şifreli Raporlar**: RSA ile uçtan uca şifreleme, sadece bounty sahibi okuyabilir
- ✅ **%0 Komisyon**: Platform ücreti yok (Immunefi %20-33 alır)
- ✅ **Privacy-First**: Raporlar blockchain dışında, sadece hash'i kaydedilir

---

## 🚀 Kurulum

### 1. Repoyu Klonla
```bash
git clone https://github.com/SkyL0RC/BountyChain.git
cd BountyChain
```

### 2. Frontend Kurulumu
```bash
npm install
cp .env.example .env
# .env dosyasını düzenle
```

### 3. Backend Kurulumu
```bash
cd backend
npm install

# PostgreSQL veritabanı oluştur
psql -U postgres -p 5433 -c "CREATE DATABASE bountychain_mvp;"

# Migration'ları çalıştır
psql -U postgres -p 5433 -d bountychain_mvp -f migrations/001_initial_schema.sql
psql -U postgres -p 5433 -d bountychain_mvp -f migrations/add_payment_columns.sql
```

### 4. Smart Contract Deploy
```bash
cd move
sui client publish --gas-budget 100000000
# Çıktıdan Package ID'yi kopyala ve .env'e ekle
```

### 5. Çalıştır
```bash
# Backend (Terminal 1)
cd backend
npm start

# Frontend (Terminal 2)
npm run dev
```

---

## 📦 Teknoloji Stack'i

### Blockchain & Smart Contracts
- **Sui Move**: Escrow ve ödeme mantığı
- **Sui Testnet**: Test network

### Frontend
- **React 19**: UI framework
- **Vite**: Build tool
- **@mysten/dapp-kit**: Wallet bağlantısı
- **React Router**: Routing
- **Lucide React**: İkonlar

### Backend
- **Node.js + Express**: API server
- **PostgreSQL**: Veritabanı
- **RSA Encryption**: Rapor şifreleme

---

## 🏗️ Mimari

```
┌─────────────┐
│   Browser   │
│  (Hacker)   │
└──────┬──────┘
       │ 1. Bounty listesini görüntüle
       │
       v
┌─────────────┐
│  PostgreSQL │◄────── Bounty metadata (title, reward, etc)
│   Backend   │
└──────┬──────┘
       │
       │ 2. Report submit (RSA encrypted)
       │
       v
┌─────────────┐
│   Sui Move  │◄────── Escrow + Payment logic
│   Contract  │
└─────────────┘
       │
       │ 3. Approve → approve_and_pay()
       │
       v
┌─────────────┐
│   Hacker    │◄────── SUI tokens (escrow'dan serbest)
│   Wallet    │
└─────────────┘
```

---

## 📝 Smart Contract Fonksiyonları

### `bounty_escrow.move`

```move
// Bounty oluştur ve parayı kilitle
public entry fun create_bounty(
    title: vector<u8>,
    reward: Coin<SUI>,
    ctx: &mut TxContext
)

// Raporu onayla ve parayı hackera gönder
public entry fun approve_and_pay(
    bounty: &mut Bounty,
    hacker: address,
    ctx: &mut TxContext
)

// Bounty iptal et ve parayı geri al
public entry fun cancel_bounty(
    bounty: Bounty,
    ctx: &mut TxContext
)
```

---

## 🔐 Güvenlik

- **RSA 2048-bit**: Report encryption
- **Sui Move**: Type-safe smart contracts
- **Shared Objects**: Atomic transactions
- **No Admin Keys**: Tamamen trustless

---

## 🛣️ Roadmap

- [x] MVP geliştirme
- [x] Escrow sistemi
- [x] RSA şifreleme
- [x] Bounty oluşturma
- [x] Report gönderme
- [x] Onay ve ödeme sistemi
- [ ] Testnet deploy
- [ ] Security audit
- [ ] Mainnet launch
- [ ] Leaderboard sistemi
- [ ] Multi-hacker support
- [ ] Dispute resolution

---

## 📄 Lisans

MIT

---

## 🤝 Katkıda Bulunma

1. Fork'la
2. Feature branch oluştur (`git checkout -b feature/amazing`)
3. Commit'le (`git commit -m 'feat: Add amazing feature'`)
4. Push'la (`git push origin feature/amazing`)
5. Pull Request aç

---

**Built with ❤️ on Sui 🔵**
