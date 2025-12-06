import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Check, X, Clock, AlertCircle, Shield, ExternalLink } from 'lucide-react';
import { getWalrusClient } from '../utils/walrus';
import { getSealClient } from '../utils/seal';

export default function ReviewSubmissions() {
  const { bountyId } = useParams();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
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
      const bountyObject = await suiClient.getObject({
        id: bountyId,
        options: { showContent: true }
      });

      if (bountyObject.data) {
        const content = bountyObject.data.content.fields;
        setBounty(content);
        
        // Parse submissions
        const subs = content.submissions || [];
        const statuses = content.submission_statuses || [];
        
        const parsedSubmissions = subs.map((sub, index) => ({
          index,
          submitter: sub.fields.submitter,
          walrus_blob_id: sub.fields.walrus_blob_id,
          seal_encrypted_data: sub.fields.seal_encrypted_data,
          submitted_at: parseInt(sub.fields.submitted_at),
          severity: parseInt(sub.fields.severity),
          status: statuses[index] ? {
            is_reviewed: statuses[index].fields.is_reviewed,
            is_approved: statuses[index].fields.is_approved,
            reviewed_at: parseInt(statuses[index].fields.reviewed_at),
            review_notes: statuses[index].fields.review_notes
          } : {
            is_reviewed: false,
            is_approved: false,
            reviewed_at: 0,
            review_notes: ''
          }
        }));
        
        setSubmissions(parsedSubmissions);
      }
    } catch (error) {
      console.error('Error loading bounty:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAndDecrypt = async (submission) => {
    try {
      const walrus = getWalrusClient();
      const seal = getSealClient();
      
      // Download from Walrus
      const blobIdHex = '0x' + Buffer.from(submission.walrus_blob_id).toString('hex');
      const fileData = await walrus.downloadFile(blobIdHex);
      
      // Decrypt with Seal (if encrypted)
      if (submission.seal_encrypted_data && submission.seal_encrypted_data.length > 0) {
        const encryptedDataHex = '0x' + Buffer.from(submission.seal_encrypted_data).toString('hex');
        const decrypted = await seal.decryptFile(encryptedDataHex, currentAccount.address);
        setDecryptedContent(decrypted);
      } else {
        setDecryptedContent(fileData);
      }
      
      setSelectedSubmission(submission);
    } catch (error) {
      console.error('Error downloading/decrypting:', error);
      alert('Failed to download or decrypt submission');
    }
  };

  const handleReview = async (submissionIndex, approve) => {
    if (!currentAccount) {
      alert('Please connect wallet');
      return;
    }

    setReviewing(submissionIndex);

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${import.meta.env.VITE_PACKAGE_ID}::bounty_manager::review_submission`,
        arguments: [
          tx.object(import.meta.env.VITE_BOUNTY_REGISTRY_ID),
          tx.object(bountyId),
          tx.pure.u64(submissionIndex),
          tx.pure.bool(approve),
          tx.pure.string(reviewNotes || (approve ? 'Approved' : 'Rejected')),
          tx.object('0x6'), // Clock
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            alert(approve ? 'Submission approved!' : 'Submission rejected!');
            loadBountyAndSubmissions();
            setSelectedSubmission(null);
            setReviewNotes('');
          },
          onError: (error) => {
            console.error('Review error:', error);
            alert('Failed to review submission');
          }
        }
      );
    } catch (error) {
      console.error('Error:', error);
      alert('Error reviewing submission');
    } finally {
      setReviewing(null);
    }
  };

  const getSeverityLabel = (severity) => {
    const labels = ['Low', 'Medium', 'High', 'Critical'];
    return labels[severity] || 'Unknown';
  };

  const getSeverityColor = (severity) => {
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#dc2626'];
    return colors[severity] || '#6b7280';
  };

  const getTimeRemaining = (timeoutDays, submittedAt) => {
    const timeoutMs = timeoutDays * 24 * 60 * 60 * 1000;
    const elapsedMs = Date.now() - submittedAt;
    const remainingMs = timeoutMs - elapsedMs;
    
    if (remainingMs <= 0) return 'Timeout reached';
    
    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    return `${days}d ${hours}h remaining`;
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  if (!bounty) {
    return <div className="container"><div className="error">Bounty not found</div></div>;
  }

  const isOwner = currentAccount && currentAccount.address === bounty.creator;
  const reviewTimeout = parseInt(bounty.review_mode?.fields?.review_timeout_days || 7);
  const usePlatformReview = bounty.review_mode?.fields?.use_platform_review || false;

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
            <span>
              {usePlatformReview ? 'Platform Review (5%)' : 'Manual Review'}
            </span>
          </div>
        )}
      </div>

      <div className="review-info-banner">
        <AlertCircle size={24} />
        <div>
          <strong>Review Timeout: {reviewTimeout} days</strong>
          <p>
            {usePlatformReview 
              ? 'Platform validators can review immediately with 5% fee'
              : `You have ${reviewTimeout} days to review each submission. After that, platform reviews automatically with 10% fee.`
            }
          </p>
        </div>
      </div>

      <div className="submissions-grid">
        {submissions.length === 0 ? (
          <div className="empty-state">
            <p>No submissions yet</p>
          </div>
        ) : (
          submissions.map((submission) => (
            <div key={submission.index} className="submission-card">
              <div className="submission-header">
                <div className="submission-meta">
                  <span className="submission-index">#{submission.index + 1}</span>
                  <span 
                    className="severity-badge"
                    style={{ background: getSeverityColor(submission.severity) }}
                  >
                    {getSeverityLabel(submission.severity)}
                  </span>
                  {submission.status.is_reviewed && (
                    <span className={`review-status ${submission.status.is_approved ? 'approved' : 'rejected'}`}>
                      {submission.status.is_approved ? <Check size={16} /> : <X size={16} />}
                      {submission.status.is_approved ? 'Approved' : 'Rejected'}
                    </span>
                  )}
                </div>
                
                {!submission.status.is_reviewed && isOwner && (
                  <div className="timeout-warning">
                    <Clock size={16} />
                    <span>{getTimeRemaining(reviewTimeout, submission.submitted_at)}</span>
                  </div>
                )}
              </div>

              <div className="submission-body">
                <div className="info-row">
                  <span className="label">Submitter:</span>
                  <span className="value address">{submission.submitter.slice(0, 6)}...{submission.submitter.slice(-4)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Submitted:</span>
                  <span className="value">{new Date(submission.submitted_at).toLocaleString()}</span>
                </div>
                
                {submission.status.is_reviewed && (
                  <div className="review-notes">
                    <strong>Review Notes:</strong>
                    <p>{submission.status.review_notes || 'No notes'}</p>
                  </div>
                )}
              </div>

              {!submission.status.is_reviewed && isOwner && (
                <div className="submission-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDownloadAndDecrypt(submission)}
                  >
                    <ExternalLink size={16} />
                    View Details
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
              <h2>Review Submission #{selectedSubmission.index + 1}</h2>
              <button className="close-btn" onClick={() => setSelectedSubmission(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="submission-details">
                <h3>Vulnerability Details</h3>
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
                onClick={() => handleReview(selectedSubmission.index, false)}
                disabled={reviewing !== null}
              >
                <X size={18} />
                Reject
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleReview(selectedSubmission.index, true)}
                disabled={reviewing !== null}
              >
                <Check size={18} />
                Approve & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
