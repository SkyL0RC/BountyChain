import express from 'express';
import pool from '../config/database.js';
import { encryptReport } from '../utils/crypto.js';

const router = express.Router();

/**
 * POST /api/reports
 * Submit encrypted bug report
 * 
 * Body:
 * - bountyId: string
 * - hackerWallet: string
 * - reportText: string (plaintext - will be encrypted)
 * 
 * Flow:
 * 1. Get bounty owner's public key from DB
 * 2. Encrypt report with hybrid encryption
 * 3. Store encrypted data in DB
 * 4. Set auto-approve timer (7 days)
 */
router.post('/', async (req, res) => {
  try {
    const { bountyId, hackerWallet, reportText } = req.body;

    // Validation
    if (!bountyId || !hackerWallet || !reportText) {
      return res.status(400).json({
        error: 'Missing required fields: bountyId, hackerWallet, reportText'
      });
    }

    // Get bounty owner's public key
    const bountyQuery = await pool.query(
      'SELECT owner_public_key, status FROM bounties WHERE id = $1',
      [bountyId]
    );

    if (bountyQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    const bounty = bountyQuery.rows[0];
    
    if (bounty.status !== 'active') {
      return res.status(400).json({ error: 'Bounty is not active' });
    }

    // Encrypt report (hybrid: AES-256-GCM + RSA)
    const { encryptedPayload, encryptedKey } = encryptReport(
      reportText,
      bounty.owner_public_key
    );

    // Set auto-approve date (7 days from now)
    const autoApproveAt = new Date();
    autoApproveAt.setDate(autoApproveAt.getDate() + 7);

    // Store encrypted report
    const insertQuery = await pool.query(
      `INSERT INTO reports 
       (bounty_id, hacker_wallet, encrypted_payload, encrypted_key, auto_approve_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at, auto_approve_at`,
      [bountyId, hackerWallet, encryptedPayload, encryptedKey, autoApproveAt]
    );

    const report = insertQuery.rows[0];

    console.log(`✅ Encrypted report submitted: ${report.id}`);
    console.log(`   Bounty: ${bountyId}`);
    console.log(`   Hacker: ${hackerWallet}`);
    console.log(`   Auto-approve: ${autoApproveAt.toISOString()}`);

    res.status(201).json({
      success: true,
      reportId: report.id,
      autoApproveAt: report.auto_approve_at,
      message: 'Report submitted successfully (encrypted)'
    });

  } catch (error) {
    console.error('❌ Report submission failed:', error);
    res.status(500).json({
      error: 'Report submission failed',
      details: error.message
    });
  }
});

/**
 * GET /api/reports/:id
 * Fetch encrypted report
 * 
 * Returns encrypted data for client-side decryption
 * Backend NEVER decrypts - only bounty owner can decrypt with private key
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = await pool.query(
      `SELECT 
        r.id,
        r.bounty_id,
        r.hacker_wallet,
        r.encrypted_payload,
        r.encrypted_key,
        r.encryption_algo,
        r.status,
        r.auto_approve_at,
        r.created_at,
        b.title as bounty_title,
        b.reward_amount
       FROM reports r
       JOIN bounties b ON r.bounty_id = b.id
       WHERE r.id = $1`,
      [id]
    );

    if (query.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = query.rows[0];

    // Return encrypted data (client-side decryption required)
    res.json({
      id: report.id,
      bountyId: report.bounty_id,
      bountyTitle: report.bounty_title,
      rewardAmount: report.reward_amount,
      hackerWallet: report.hacker_wallet,
      
      // ENCRYPTED DATA (backend cannot read this)
      encryptedPayload: report.encrypted_payload,
      encryptedKey: report.encrypted_key,
      encryptionAlgo: report.encryption_algo,
      
      // Metadata
      status: report.status,
      autoApproveAt: report.auto_approve_at,
      createdAt: report.created_at
    });

  } catch (error) {
    console.error('❌ Report fetch failed:', error);
    res.status(500).json({
      error: 'Failed to fetch report',
      details: error.message
    });
  }
});

/**
 * GET /api/reports/bounty/:bountyId
 * List all reports for a bounty (metadata only)
 */
router.get('/bounty/:bountyId', async (req, res) => {
  try {
    const { bountyId } = req.params;

    const query = await pool.query(
      `SELECT 
        id,
        hacker_wallet,
        status,
        auto_approve_at,
        created_at
       FROM reports
       WHERE bounty_id = $1
       ORDER BY created_at DESC`,
      [bountyId]
    );

    res.json({
      bountyId,
      count: query.rows.length,
      reports: query.rows
    });

  } catch (error) {
    console.error('❌ Reports list failed:', error);
    res.status(500).json({
      error: 'Failed to list reports',
      details: error.message
    });
  }
});

/**
 * GET /api/reports/hacker/:walletAddress
 * List all reports submitted by a hacker
 */
router.get('/hacker/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const query = await pool.query(
      `SELECT 
        r.id,
        r.bounty_id,
        r.status,
        r.created_at,
        b.title as bounty_title,
        b.reward_amount
       FROM reports r
       JOIN bounties b ON r.bounty_id = b.id
       WHERE r.hacker_wallet = $1
       ORDER BY r.created_at DESC`,
      [walletAddress]
    );

    res.json({
      hackerWallet: walletAddress,
      count: query.rows.length,
      reports: query.rows
    });

  } catch (error) {
    console.error('❌ Hacker reports list failed:', error);
    res.status(500).json({
      error: 'Failed to list hacker reports',
      details: error.message
    });
  }
});

/**
 * POST /api/reports/:id/status
 * Update report status (approve/reject/dispute)
 * 
 * When approved:
 * - Frontend will trigger payment from escrow to hacker
 * - Backend records the approval
 * 
 * Body:
 * - status: 'approved' | 'rejected' | 'disputed'
 * - walletAddress: string (for authorization check)
 */
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, walletAddress } = req.body;

    // Validation
    const validStatuses = ['approved', 'rejected', 'disputed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress required' });
    }

    // Get report and bounty info
    const reportQuery = await pool.query(
      `SELECT r.*, b.owner_wallet, b.reward_amount, b.transaction_hash as bounty_tx, b.bounty_object_id
       FROM reports r
       JOIN bounties b ON r.bounty_id = b.id
       WHERE r.id = $1`,
      [id]
    );

    if (reportQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportQuery.rows[0];

    // Authorization: Only bounty owner can update status
    if (report.owner_wallet.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(403).json({
        error: 'Unauthorized: Only bounty owner can update report status'
      });
    }

    // Update status
    const updateQuery = await pool.query(
      `UPDATE reports 
       SET status = $1, updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    const updated = updateQuery.rows[0];

    console.log(`✅ Report ${id} status updated to: ${status}`);
    
    // Return payment info if approved
    const response = {
      success: true,
      reportId: updated.id,
      status: updated.status,
      updatedAt: updated.updated_at
    };

    if (status === 'approved') {
      response.payment = {
        hackerWallet: report.hacker_wallet,
        amount: report.reward_amount,
        bountyObjectId: report.bounty_object_id,
        message: 'Smart contract will release payment from escrow'
      };
      
      if (!report.bounty_object_id) {
        console.warn('⚠️  Warning: bounty_object_id is missing for approved report');
      }
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Status update failed:', error);
    res.status(500).json({
      error: 'Failed to update report status',
      details: error.message
    });
  }
});

export default router;
