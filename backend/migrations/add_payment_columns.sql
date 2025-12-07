-- Add payment tracking columns to bounties table
ALTER TABLE bounties 
ADD COLUMN IF NOT EXISTS transaction_hash TEXT,
ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index on transaction_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_bounties_transaction_hash ON bounties(transaction_hash);
