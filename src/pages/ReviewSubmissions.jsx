import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Check, X, Clock, AlertCircle, Shield, ExternalLink, Key } from 'lucide-react';
import { decryptReport } from '../utils/backendCrypto';

const API_BASE_URL = 'http://localhost:3001/api';
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;

export default function ReviewSubmissions() {
  const { bountyId } = useParams();
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [bounty, setBounty] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [decryptedContent, setDecryptedContent] = useState(null);

  useEffect(() => {
    loadBountyAndSubmissions();
  }, [bountyId]);

  const loadBountyAndSubmissions = async () => {
    try {
      // Get bounty details
      const bountyRes = await fetch(`${API_BASE_URL}/bounties/${bountyId}`);
      if (!bountyRes.ok) throw new Error('Bounty not found');
      const bountyData = await bountyRes.json();
      setBounty(bountyData.bounty);

      // Get submissions for this bounty
      const reportsRes = await fetch(`${API_BASE_URL}/reports/bounty/${bountyId}`);
      if (!reportsRes.ok) throw new Error('Failed to fetch reports');
      const reportsData = await reportsRes.json();
      setSubmissions(reportsData.reports || []);

    } catch (error) {
      console.error('Error loading bounty:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAndDecrypt = async (submission) => {
    try {
      // Fetch full report details including encrypted data
      const reportRes = await fetch(`${API_BASE_URL}/reports/${submission.id}`);
      if (!reportRes.ok) throw new Error('Failed to fetch report');
      const reportData = await reportRes.json();
      
      // Get private key from localStorage
      const privateKey = localStorage.getItem(`bounty_${bountyId}_privateKey`);
      
      if (!privateKey) {
        alert('⚠️ Private key not found!\n\nYou can only decrypt reports for bounties you created on this device.');
        return;
      }

      // Parse encrypted data
      let encryptedPayload, encryptedKey;
      try {
        const reportTextObj = JSON.parse(reportData.reportText);
        encryptedPayload = reportTextObj.encryptedPayload;
        encryptedKey = reportTextObj.encryptedKey;
      } catch (e) {
        // Fallback to direct properties
        encryptedPayload = reportData.encryptedPayload;
        encryptedKey = reportData.encryptedKey;
      }

      if (!encryptedPayload || !encryptedKey) {
        alert('❌ Report data is corrupted or not encrypted');
        return;
      }

      // Decrypt report
      console.log('🔓 Decrypting report...');
      const decrypted = await decryptReport(encryptedPayload, encryptedKey, privateKey);
      console.log('✅ Report decrypted successfully');
      
      setDecryptedContent(decrypted);
      setSelectedSubmission(submission);
      
    } catch (error) {
      console.error('Error decrypting report:', error);
      alert('Failed to decrypt report: ' + error.message);
    }
  };

  const handleReview = async (reportId, approve) => {
    if (!currentAccount) {
      alert('Please connect wallet');
      return;
    }

    setReviewing(reportId);

    try {
      // 1. Update status in backend first
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: approve ? 'approved' : 'rejected',
          walletAddress: currentAccount.address
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      const data = await response.json();

      // 2. If approved, release payment from escrow via smart contract
      if (approve && data.payment) {
        const { hackerWallet, bountyObjectId } = data.payment;
        
        if (!bountyObjectId) {
          throw new Error('Bounty object ID not found. Cannot release payment.');
        }

        console.log('💰 Releasing payment from escrow...');
        console.log('📦 Bounty Object:', bountyObjectId);
        console.log('👤 Hacker Wallet:', hackerWallet);
        
        // Create transaction to call approve_and_pay
        const tx = new Transaction();
        
        tx.moveCall({
          target: `${PACKAGE_ID}::bounty_escrow::approve_and_pay`,
          arguments: [
            tx.object(bountyObjectId), // Bounty shared object
            tx.pure.address(hackerWallet), // Hacker address
          ],
        });

        tx.setGasBudget(10000000);

        console.log('💳 Requesting wallet approval for payment release...');

        // Execute transaction
        const txResult = await signAndExecuteTransaction({
          transaction: tx,
        });

        console.log('✅ Payment released!');
        console.log('📋 TX Digest:', txResult.digest);

        alert(`✅ Report Approved & Payment Released!\n\n💰 Payment sent to hacker\n🔗 TX: ${txResult.digest.slice(0, 16)}...`);
      } else if (approve) {
        alert('✅ Report Approved!\n\n(No payment information found)');
      } else {
        alert('❌ Report Rejected');
      }

      await loadBountyAndSubmissions();
      setSelectedSubmission(null);
      setReviewNotes('');

    } catch (error) {
      console.error('Review error:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setReviewing(null);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      disputed: 'Disputed'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      disputed: '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  };

  const getTimeRemaining = (autoApproveAt) => {
    if (!autoApproveAt) return 'No timeout';
    
    const remainingMs = new Date(autoApproveAt) - Date.now();
    
    if (remainingMs <= 0) return 'Auto-approved';
    
    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    return `${days}d ${hours}h until auto-approve`;
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  if (!bounty) {
    return <div className="container"><div className="error">Bounty not found</div></div>;
  }

  const isOwner = currentAccount && currentAccount.address === bounty.ownerWallet;

  return (
    <div className="container review-page">
      <div className="page-header">
        <div>
          <h1>Review Submissions</h1>
          <p className="subtitle">{bounty.title}</p>
        </div>
        {isOwner && (
          <div className="review-mode-badge">
            <Shield size={20} />
            <span>Your Bounty</span>
          </div>
        )}
      </div>

      <div className="review-info-banner">
        <AlertCircle size={24} />
        <div>
          <strong>Auto-Approve: 7 days</strong>
          <p>Pending reports will be automatically approved after 7 days if not reviewed.</p>
        </div>
      </div>

      <div className="submissions-grid">
        {submissions.length === 0 ? (
          <div className="empty-state">
            <p>No submissions yet</p>
          </div>
        ) : (
          submissions.map((submission) => (
            <div key={submission.id} className="submission-card">
              <div className="submission-header">
                <div className="submission-meta">
                  <span className="submission-index">Report ID: {submission.id.substring(0, 8)}...</span>
                  <span 
                    className="severity-badge"
                    style={{ background: getStatusColor(submission.status) }}
                  >
                    {getStatusLabel(submission.status)}
                  </span>
                </div>
                
                {submission.status === 'pending' && isOwner && (
                  <div className="timeout-warning">
                    <Clock size={16} />
                    <span>{getTimeRemaining(submission.auto_approve_at)}</span>
                  </div>
                )}
              </div>

              <div className="submission-body">
                <div className="info-row">
                  <span className="label">Hacker:</span>
                  <span className="value address">{submission.hacker_wallet.slice(0, 6)}...{submission.hacker_wallet.slice(-4)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Submitted:</span>
                  <span className="value">{new Date(submission.created_at).toLocaleString()}</span>
                </div>
              </div>

              {isOwner && (
                <div className="submission-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDownloadAndDecrypt(submission)}
                  >
                    <Key size={16} />
                    Decrypt & View Report
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="modal review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Report</h2>
              <button className="close-btn" onClick={() => setSelectedSubmission(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="submission-details">
                <h3>🔓 Decrypted Report</h3>
                {decryptedContent && (
                  <div className="content-preview">
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{decryptedContent}</pre>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Review Notes</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Add your review notes..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-danger"
                onClick={() => handleReview(selectedSubmission.id, false)}
                disabled={reviewing !== null}
              >
                <X size={18} />
                Reject
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleReview(selectedSubmission.id, true)}
                disabled={reviewing !== null}
              >
                <Check size={18} />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}