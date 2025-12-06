# BountyChain 🛡️

**Sui üzerinde %100 trustless, ilk geçerli PoC'ye anında ödeme yapan bug bounty platformu**

Powered by **Walrus** + **Seal** + **Sui Move**

---

## 🎯 Ne Yapıyor?

İlk geçerli bug report'u gönderen hacker anında paray alır. Admin yok, DAO yok, oracle yok. Sadece smart contract.

**Özellikler:**
- ✅ %0 komisyon (Immunefi %20-33 alır)
- ✅ Anında ödeme (2-8 hafta yerine)
- ✅ Privacy-first (Walrus + Seal encryption)
- ✅ Mini Hack programı (yeni başlayanlar için)

---

## 🚀 Kurulum

```bash
# 1. Clone & Install
git clone https://github.com/yourusername/BountyChain.git
cd BountyChain
npm install

# 2. Smart Contracts Deploy
cd move
sui client publish --gas-budget 100000000

# 3. Update .env
VITE_PACKAGE_ID=0xYOUR_PACKAGE_ID
VITE_BOUNTY_REGISTRY_ID=0xREGISTRY_ID

# 4. Run
npm run dev
```

---

## 📦 Tech Stack

- **Blockchain**: Sui Move
- **Storage**: Walrus
- **Encryption**: Seal
- **Frontend**: React + Vite

---

## 📝 TODO

- [x] Move contracts
- [x] Walrus integration
- [x] Seal encryption
- [x] Create Bounty UI
- [ ] Deploy to testnet
- [ ] Security audit

---

**Built on Sui 🔵**
