# BountyChain MVP - Backend API

End-to-end encrypted bug bounty platform with PostgreSQL backend.

## 🎯 MVP Features

- ✅ **Hybrid Encryption**: AES-256-GCM + RSA-2048
- ✅ **Zero-Knowledge Backend**: Backend cannot decrypt reports
- ✅ **Auto-Approval**: Reports auto-approve after 7 days
- ✅ **PostgreSQL Storage**: Encrypted data only
- ✅ **RESTful API**: Clean API for frontend integration

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Database
```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE bountychain_mvp;"

# Set password
sudo -u postgres psql -p 5433 -d bountychain_mvp -c "ALTER USER postgres PASSWORD 'postgres';"

# Run migrations
sudo -u postgres psql -p 5433 -d bountychain_mvp < migrations/001_initial_schema.sql
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env if needed (default ports: DB=5433, API=3001)
```

### 4. Start Server
```bash
npm start
```

Server runs on: http://localhost:3001

## 📚 API Documentation

### Bounties

#### Create Bounty
```bash
POST /api/bounties
{
  "id": "bounty-123",
  "title": "SQL Injection Bug",
  "description": "Find SQL injection vulnerabilities",
  "rewardAmount": 1000,
  "ownerWallet": "0x...",
  "ownerPublicKey": "-----BEGIN PUBLIC KEY-----\n..."
}
```

#### Get Bounty
```bash
GET /api/bounties/:id
```

#### List Bounties
```bash
GET /api/bounties
```

### Reports

#### Submit Encrypted Report
```bash
POST /api/reports
{
  "bountyId": "bounty-123",
  "hackerWallet": "0x...",
  "reportText": "Bug details..." 
}
```

**Note**: Frontend encrypts reportText before sending. Backend receives already-encrypted data.

#### Get Encrypted Report
```bash
GET /api/reports/:id
```

Returns encrypted payload - decrypt client-side with private key.

#### List Reports for Bounty
```bash
GET /api/reports/bounty/:bountyId
```

#### Update Report Status
```bash
POST /api/reports/:id/status
{
  "status": "approved", # or "rejected", "disputed"
  "walletAddress": "0x..." # For authorization
}
```

## 🔐 Security Model

### Encryption Flow

**Submission (Client-Side):**
1. Generate random AES-256 key
2. Encrypt report with AES-256-GCM
3. Encrypt AES key with owner's RSA public key
4. Send encrypted data to backend

**Storage (Backend):**
- Only stores: `encrypted_payload`, `encrypted_key`
- Backend NEVER sees plaintext
- No private keys on server

**Decryption (Owner Only - Client-Side):**
1. Fetch encrypted data from API
2. Decrypt AES key with private key (client-side)
3. Decrypt report with AES key (client-side)

### Auto-Approval

- Reports pending > 7 days → auto-approved
- Cron job runs every 10 minutes
- Ensures timely resolution

## 🗄️ Database Schema

```sql
-- Bounties
CREATE TABLE bounties (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  reward_amount BIGINT NOT NULL,
  owner_wallet VARCHAR(255) NOT NULL,
  owner_public_key TEXT NOT NULL, -- RSA public key
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now()
);

-- Reports (ENCRYPTED ONLY)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id VARCHAR(255) REFERENCES bounties(id),
  hacker_wallet VARCHAR(255) NOT NULL,
  encrypted_payload TEXT NOT NULL, -- AES-encrypted report
  encrypted_key TEXT NOT NULL, -- RSA-encrypted AES key
  encryption_algo VARCHAR(50) DEFAULT 'AES-256-GCM+RSA',
  status VARCHAR(20) DEFAULT 'pending',
  auto_approve_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

## 🧪 Testing

### Create Test Bounty
```bash
curl -X POST http://localhost:3001/api/bounties \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-bounty-1",
    "title": "Test Bounty",
    "description": "Find bugs",
    "rewardAmount": 100,
    "ownerWallet": "0x123"
  }'
```

This will auto-generate RSA keys for demo. Save the returned `privateKey`.

### Submit Test Report
```bash
# First, get bounty public key
curl http://localhost:3001/api/bounties/test-bounty-1

# Then use frontend to submit (encryption handled client-side)
```

### Check Auto-Approval
```bash
# List pending reports
curl http://localhost:3001/api/reports/bounty/test-bounty-1

# Wait 7 days (or modify auto_approve_at in DB for testing)
# Reports will auto-approve
```

## 🔧 Development

### File Structure
```
backend/
├── server.js           # Main server
├── config/
│   └── database.js     # PostgreSQL connection
├── utils/
│   └── crypto.js       # Encryption utilities
├── routes/
│   ├── bounties.js     # Bounty endpoints
│   └── reports.js      # Report endpoints
├── jobs/
│   └── autoApproval.js # Auto-approval cron
└── migrations/
    └── 001_initial_schema.sql
```

### Environment Variables
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5433
DB_NAME=bountychain_mvp
DB_USER=postgres
DB_PASSWORD=postgres
CORS_ORIGIN=http://localhost:5173
```

## 🚧 Migration Path

**Current MVP:**
- PostgreSQL storage
- Node.js crypto module
- RESTful API

**Future (Decentralized):**
- Walrus for storage
- Seal for encryption
- Sui smart contracts
- On-chain rewards

Clean migration path:
1. Swap PostgreSQL → Walrus SDK
2. Swap Node crypto → Seal SDK
3. Add smart contract integration
4. Keep same API surface

## 📝 Notes

- Backend NEVER decrypts reports
- Private keys NEVER touch server
- All encryption happens client-side
- Auto-approval ensures no reports stuck pending
- Clean separation: crypto utils reusable for Walrus/Seal

## 🆘 Troubleshooting

**Database connection failed:**
```bash
# Check PostgreSQL running
pg_isready -p 5433

# Start if needed
sudo systemctl start postgresql@16-main
```

**Port 3001 in use:**
```bash
# Kill existing process
pkill -f "node server.js"
```

**CORS errors:**
```bash
# Update CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:5173
```

## 📄 License

MIT
