-- Add difficulty and expires_at columns to bounties table

ALTER TABLE bounties 
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_bounties_difficulty ON bounties(difficulty);
CREATE INDEX IF NOT EXISTS idx_bounties_expires_at ON bounties(expires_at);

-- Update existing bounties to have expiration (30 days from creation)
UPDATE bounties 
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;

COMMENT ON COLUMN bounties.difficulty IS 'Difficulty level: beginner, intermediate, expert';
COMMENT ON COLUMN bounties.expires_at IS 'Bounty expiration date';
