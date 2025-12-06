import pool from '../config/database.js';

/**
 * Auto-Approval Job
 * 
 * Runs every 10 minutes
 * Checks for reports that:
 * - status = 'pending'
 * - auto_approve_at < NOW()
 * 
 * Auto-approves them if owner didn't review within 7 days
 */

export async function runAutoApprovalJob() {
  try {
    const result = await pool.query(
      `UPDATE reports
       SET status = 'approved', updated_at = now()
       WHERE status = 'pending'
         AND auto_approve_at < now()
       RETURNING id, bounty_id, hacker_wallet`
    );

    if (result.rows.length > 0) {
      console.log(`✅ Auto-approved ${result.rows.length} report(s):`);
      result.rows.forEach(report => {
        console.log(`   - Report ${report.id} (Bounty: ${report.bounty_id})`);
      });
    }

    return result.rows.length;

  } catch (error) {
    console.error('❌ Auto-approval job failed:', error);
    throw error;
  }
}

/**
 * Start auto-approval job (runs every 10 minutes)
 */
export function startAutoApprovalJob() {
  const INTERVAL = 10 * 60 * 1000; // 10 minutes

  console.log('🕒 Auto-approval job started (runs every 10 minutes)');

  // Run immediately on start
  runAutoApprovalJob().catch(err => {
    console.error('Initial auto-approval job failed:', err);
  });

  // Then run every 10 minutes
  setInterval(() => {
    runAutoApprovalJob().catch(err => {
      console.error('Auto-approval job failed:', err);
    });
  }, INTERVAL);
}
