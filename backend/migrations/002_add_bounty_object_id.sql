-- Add bounty_object_id and transaction_hash columns to bounties table
-- This stores the Sui blockchain object ID and transaction hash for each bounty

ALTER TABLE bounties 
ADD COLUMN IF NOT EXISTS bounty_object_id VARCHAR(66),
ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(66);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bounties_object_id ON bounties(bounty_object_id);
CREATE INDEX IF NOT EXISTS idx_bounties_tx_hash ON bounties(transaction_hash);

-- Add comment
COMMENT ON COLUMN bounties.bounty_object_id IS 'Sui blockchain shared object ID for the bounty escrow';
COMMENT ON COLUMN bounties.transaction_hash IS 'Transaction hash/digest from bounty creation';
