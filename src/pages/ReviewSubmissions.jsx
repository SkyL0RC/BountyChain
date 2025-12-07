import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Check, X, Clock, AlertCircle, Shield, ExternalLink, Key, FileText, User, Calendar, ArrowLeft, Coins } from 'lucide-react';
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

      // Get encrypted data directly from API response
      const { encryptedPayload, encryptedKey } = reportData;

      if (!encryptedPayload || !encryptedKey) {
        console.error('Missing encryption data:', reportData);
        alert('❌ Report data is corrupted or not encrypted');
        return;
      }

      // Decrypt report
      console.log('🔓 Decrypting report...');
      console.log('📦 Encrypted Payload length:', encryptedPayload.length);
      console.log('🔑 Encrypted Key length:', encryptedKey.length);
      
      const decrypted = await decryptReport(encryptedPayload, encryptedKey, privateKey);
      
      console.log('✅ Report decrypted successfully');
      console.log('📄 Decrypted content:', decrypted);
      
      // Check if decrypted content is still encrypted (double encryption)
      let finalContent = decrypted;
      try {
        const parsed = JSON.parse(decrypted);
        if (parsed.encryptedPayload && parsed.encryptedKey) {
          console.log('🔄 Detected double encryption, decrypting again...');
          finalContent = await decryptReport(parsed.encryptedPayload, parsed.encryptedKey, privateKey);
          console.log('✅ Second decryption successful:', finalContent);
        }
      } catch (e) {
        // Not JSON or no double encryption, use as is
      }
      
      setDecryptedContent(finalContent);
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
      <button className="back-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="review-hero">
        <div className="review-hero-content">
          <div className="review-hero-badge">
            <Shield size={16} />
            <span>Review Center</span>
          </div>
          <h1 className="review-hero-title">{bounty.title}</h1>
          <div className="review-hero-stats">
            <div className="hero-stat">
              <Coins size={20} />
              <div>
                <div className="stat-value">{(bounty.rewardAmount / 1_000_000_000).toFixed(3)} SUI</div>
                <div className="stat-label">Reward</div>
              </div>
            </div>
            <div className="hero-stat">
              <FileText size={20} />
              <div>
                <div className="stat-value">{submissions.length}</div>
                <div className="stat-label">Submissions</div>
              </div>
            </div>
            <div className="hero-stat">
              <Clock size={20} />
              <div>
                <div className="stat-value">7 Days</div>
                <div className="stat-label">Auto-Approve</div>
              </div>
            </div>
          </div>
          {!isOwner && (
            <div className="warning-banner">
              <AlertCircle size={20} />
              <span>You are not the owner of this bounty</span>
            </div>
          )}
        </div>
      </div>

      <div className="submissions-section">
        <h2 className="section-title">Submissions ({submissions.length})</h2>
        
        {submissions.length === 0 ? (
          <div className="empty-submissions">
            <FileText size={48} />
            <h3>No submissions yet</h3>
            <p>Waiting for hackers to submit their reports</p>
          </div>
        ) : (
          <div className="submissions-list">
            {submissions.map((submission) => (
              <div 
                key={submission.id} 
                className="modern-submission-card"
                onClick={() => isOwner && submission.status === 'pending' && handleDownloadAndDecrypt(submission)}
                style={{ cursor: isOwner && submission.status === 'pending' ? 'pointer' : 'default' }}
              >
                <div className="submission-card-header">
                  <div className="submission-id">
                    <FileText size={18} />
                    <span>{submission.id.substring(0, 12)}...</span>
                  </div>
                  <span 
                    className="status-pill"
                    style={{ background: getStatusColor(submission.status) + '20', color: getStatusColor(submission.status) }}
                  >
                    {getStatusLabel(submission.status)}
                  </span>
                </div>

                <div className="submission-info-grid">
                  <div className="info-item">
                    <User size={16} />
                    <div>
                      <div className="info-label">Hacker</div>
                      <div className="info-value">{submission.hacker_wallet.slice(0, 8)}...{submission.hacker_wallet.slice(-6)}</div>
                    </div>
                  </div>
                  <div className="info-item">
                    <Calendar size={16} />
                    <div>
                      <div className="info-label">Submitted</div>
                      <div className="info-value">{new Date(submission.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                {submission.status === 'pending' && isOwner && (
                  <div className="auto-approve-timer">
                    <Clock size={14} />
                    <span>{getTimeRemaining(submission.auto_approve_at)}</span>
                  </div>
                )}

                {isOwner && submission.status === 'pending' && (
                  <button
                    className="btn-decrypt"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadAndDecrypt(submission);
                    }}
                  >
                    <Key size={18} />
                    <span>Click to Decrypt & Review</span>
                    <ExternalLink size={14} />
                  </button>
                )}

                {!isOwner && (
                  <div className="submission-locked">
                    <Shield size={16} />
                    <span>Only bounty owner can review</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="review-modal-modern" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <div>
                <h2>Review Report</h2>
                <p className="modal-subtitle">ID: {selectedSubmission.id.substring(0, 16)}...</p>
              </div>
              <button className="modal-close" onClick={() => setSelectedSubmission(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="review-modal-body">
              <div className="decrypted-section">
                <div className="section-header">
                  <Key size={20} />
                  <h3>Decrypted Report Content</h3>
                </div>
                {decryptedContent && (() => {
                  try {
                    const reportData = JSON.parse(decryptedContent);
                    return (
                      <div className="report-fields">
                        <div className="report-field">
                          <div className="field-label">
                            <Shield size={16} />
                            Impact Level
                          </div>
                          <div className={`field-value impact-${reportData.impact}`}>
                            {reportData.impact?.toUpperCase() || 'N/A'}
                          </div>
                        </div>

                        <div className="report-field">
                          <div className="field-label">
                            <FileText size={16} />
                            Description
                          </div>
                          <div className="field-value">
                            {reportData.description || 'No description provided'}
                          </div>
                        </div>

                        <div className="report-field">
                          <div className="field-label">
                            <AlertCircle size={16} />
                            Report Details
                          </div>
                          <div className="field-value report-details">
                            {reportData.reportDetails || 'No details provided'}
                          </div>
                        </div>

                        <div className="report-field">
                          <div className="field-label">
                            <User size={16} />
                            Submitted By
                          </div>
                          <div className="field-value monospace">
                            {reportData.submittedBy?.slice(0, 10)}...{reportData.submittedBy?.slice(-8)}
                          </div>
                        </div>

                        <div className="report-field">
                          <div className="field-label">
                            <Calendar size={16} />
                            Timestamp
                          </div>
                          <div className="field-value">
                            {new Date(reportData.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  } catch (e) {
                    // Fallback: not JSON, display as text
                    return (
                      <div className="report-content">
                        <pre>{decryptedContent}</pre>
                      </div>
                    );
                  }
                })()}
              </div>

              <div className="notes-section">
                <label className="section-label">
                  <FileText size={16} />
                  Review Notes (Optional)
                </label>
                <textarea
                  className="notes-textarea"
                  rows="4"
                  placeholder="Add your thoughts about this submission..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="review-modal-footer">
              <button
                className="btn-review btn-reject"
                onClick={() => handleReview(selectedSubmission.id, false)}
                disabled={reviewing !== null}
              >
                <X size={18} />
                <span>Reject Report</span>
              </button>
              <button
                className="btn-review btn-approve"
                onClick={() => handleReview(selectedSubmission.id, true)}
                disabled={reviewing !== null}
              >
                <Check size={18} />
                <span>Approve & Pay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}