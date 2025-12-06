-- BountyChain MVP Database Schema
-- Encrypted Bug Report Storage

-- Bounties table (stores project info and owner public keys)
CREATE TABLE IF NOT EXISTS bounties (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  reward_amount BIGINT NOT NULL,
  owner_wallet VARCHAR(255) NOT NULL,
  owner_public_key TEXT NOT NULL, -- RSA public key in PEM format
  status VARCHAR(20) DEFAULT 'active', -- active, closed, paused
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Reports table (stores ONLY encrypted data)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id VARCHAR(255) NOT NULL REFERENCES bounties(id),
  hacker_wallet VARCHAR(255) NOT NULL,
  
  -- ENCRYPTED DATA (backend cannot decrypt these)
  encrypted_payload TEXT NOT NULL, -- AES-encrypted report (base64)
  encrypted_key TEXT NOT NULL, -- RSA-encrypted AES key (base64)
  
  -- Metadata
  encryption_algo VARCHAR(50) DEFAULT 'AES-256-GCM+RSA',
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, disputed
  auto_approve_at TIMESTAMP, -- Auto-approve after 7 days if not reviewed
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_reports_bounty_id ON reports(bounty_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_auto_approve ON reports(auto_approve_at) WHERE status = 'pending';

-- Security notes:
-- 1. NO plaintext report data stored
-- 2. Backend CANNOT decrypt reports (no private keys)
-- 3. Only bounty owner can decrypt client-side
-- 4. Hybrid encryption: AES-256-GCM + RSA-2048
