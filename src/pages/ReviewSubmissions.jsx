import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Check, X, Clock, AlertCircle, Shield, ExternalLink } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

export default function ReviewSubmissions() {
  const { bountyId } = useParams();
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();

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
      
      // TODO: Decrypt with owner's private key
      // For now, show encrypted data
      setDecryptedContent(JSON.stringify({
        encryptedPayload: reportData.encryptedPayload,
        encryptedKey: reportData.encryptedKey,
        note: 'Decrypt functionality will be added'
      }, null, 2));
      
      setSelectedSubmission(submission);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    }
  };

  const handleReview = async (reportId, approve) => {
    if (!currentAccount) {
      alert('Please connect wallet');
      return;
    }

    setReviewing(reportId);

    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: approve ? 'approved' : 'rejected',
          walletAddress: currentAccount.address
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      alert(approve ? 'Report approved!' : 'Report rejected!');
      await loadBountyAndSubmissions();
      setSelectedSubmission(null);
      setReviewNotes('');

    } catch (error) {
      console.error('Review error:', error);
      alert('Error: ' + error.message);
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

              {submission.status === 'pending' && isOwner && (
                <div className="submission-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDownloadAndDecrypt(submission)}
                  >
                    <ExternalLink size={16} />
                    View Encrypted Report
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
                <h3>Encrypted Report Data</h3>
                {decryptedContent && (
                  <div className="content-preview">
                    <pre>{decryptedContent}</pre>
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