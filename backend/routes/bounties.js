import express from 'express';
import pool from '../config/database.js';
import { generateRSAKeyPair } from '../utils/crypto.js';

const router = express.Router();

/**
 * POST /api/bounties
 * Create new bounty
 * 
 * Body:
 * - id: string (unique bounty ID)
 * - title: string
 * - description: string
 * - rewardAmount: number
 * - ownerWallet: string
 * - ownerPublicKey: string (RSA public key PEM) - optional, will generate if not provided
 */
router.post('/', async (req, res) => {
  try {
    const { id, title, description, rewardAmount, ownerWallet, ownerPublicKey } = req.body;

    // Validation
    if (!id || !title || !rewardAmount || !ownerWallet) {
      return res.status(400).json({
        error: 'Missing required fields: id, title, rewardAmount, ownerWallet'
      });
    }

    // If no public key provided, generate one for demo/testing
    let publicKey = ownerPublicKey;
    let privateKey = null;
    
    if (!publicKey) {
      console.log('⚠️  No public key provided, generating RSA key pair for demo');
      const keyPair = generateRSAKeyPair();
      publicKey = keyPair.publicKey;
      privateKey = keyPair.privateKey;
    }

    // Insert bounty
    const query = await pool.query(
      `INSERT INTO bounties 
       (id, title, description, reward_amount, owner_wallet, owner_public_key)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, title, description, rewardAmount, ownerWallet, publicKey]
    );

    const bounty = query.rows[0];

    console.log(`✅ Bounty created: ${id}`);

    const response = {
      success: true,
      bounty: {
        id: bounty.id,
        title: bounty.title,
        description: bounty.description,
        rewardAmount: bounty.reward_amount,
        ownerWallet: bounty.owner_wallet,
        status: bounty.status,
        createdAt: bounty.created_at
      }
    };

    // Return private key only if we generated it (for demo purposes)
    if (privateKey) {
      response.demo = {
        warning: 'Generated keys for demo - In production, use wallet-derived keys',
        publicKey,
        privateKey
      };
    }

    res.status(201).json(response);

  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        error: 'Bounty ID already exists'
      });
    }
    
    console.error('❌ Bounty creation failed:', error);
    res.status(500).json({
      error: 'Bounty creation failed',
      details: error.message
    });
  }
});

/**
 * GET /api/bounties/:id
 * Get bounty details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = await pool.query(
      `SELECT 
        id, title, description, reward_amount, owner_wallet, 
        owner_public_key, status, created_at
       FROM bounties
       WHERE id = $1`,
      [id]
    );

    if (query.rows.length === 0) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    const bounty = query.rows[0];

    res.json({
      bounty: {
        id: bounty.id,
        title: bounty.title,
        description: bounty.description,
        rewardAmount: bounty.reward_amount,
        ownerWallet: bounty.owner_wallet,
        ownerPublicKey: bounty.owner_public_key,
        status: bounty.status,
        createdAt: bounty.created_at
      }
    });

  } catch (error) {
    console.error('❌ Bounty fetch failed:', error);
    res.status(500).json({
      error: 'Failed to fetch bounty',
      details: error.message
    });
  }
});

/**
 * GET /api/bounties
 * List all bounties
 */
router.get('/', async (req, res) => {
  try {
    const query = await pool.query(
      `SELECT 
        *
       FROM bounties
       ORDER BY created_at DESC`
    );

    const bounties = query.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      rewardAmount: row.reward_amount,
      ownerWallet: row.owner_wallet,
      status: row.status,
      createdAt: row.created_at
    }));

    res.json({
      count: bounties.length,
      bounties
    });

  } catch (error) {
    console.error('❌ Bounties list failed:', error);
    res.status(500).json({
      error: 'Failed to list bounties',
      details: error.message
    });
  }
});

export default router;
