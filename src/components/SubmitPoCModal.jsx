import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { X, AlertTriangle, CheckCircle, Shield, Lock } from 'lucide-react';
import { submitReport } from '../utils/backendCrypto';

export default function SubmitPoCModal({ hackTitle, reward, bountyId, bountyOwner, onClose }) {
  const currentAccount = useCurrentAccount();
  
  const [step, setStep] = useState(1);
  const [reportText, setReportText] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [reportId, setReportId] = useState(null);

  const handleSubmit = async () => {
    if (!reportText.trim() || !description.trim() || !impact.trim()) {
      setError('Please fill all required fields');
      return;
    }
    if (!currentAccount) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const fullReport = JSON.stringify({
        description,
        impact,
        reportDetails: reportText,
        submittedBy: currentAccount.address,
        timestamp: new Date().toISOString()
      }, null, 2);

      const result = await submitReport(bountyId, currentAccount.address, fullReport);
      setReportId(result.reportId);
      setStep(2);

    } catch (error) {
      console.error('Report submission failed:', error);
      setError('Failed to submit report: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {step === 1 && (
          <>
            <div className="modal-header">
              <h2>Submit Bug Report</h2>
              <p>{hackTitle}</p>
            </div>

            <div className="warning-box-modal">
              <Shield size={20} />
              <span>🔒 Your report will be encrypted end-to-end</span>
            </div>

            {error && (
              <div className="error-box-modal">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="modal-body">
              <div className="form-group">
                <label>Bug Report Details *</label>
                <textarea
                  className="form-textarea"
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Describe the vulnerability..."
                  rows={10}
                  required
                />
              </div>

              <div className="form-group">
                <label>Brief Description *</label>
                <input
                  type="text"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., SQL Injection"
                  required
                />
              </div>

              <div className="form-group">
                <label>Severity Level *</label>
                <select 
                  className="form-select"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  required
                >
                  <option value="">Select severity...</option>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="critical">🔴 Critical</option>
                </select>
              </div>

              <div className="encryption-notice">
                <Lock size={16} />
                <span>AES-256-GCM + RSA-2048 encryption</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit}
                disabled={!reportText.trim() || !description.trim() || !impact || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Shield size={20} />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    Submit Encrypted Report
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="modal-header">
              <div className="success-icon">
                <CheckCircle size={64} />
              </div>
              <h2>Report Submitted!</h2>
              <p>Your encrypted bug report has been received</p>
            </div>

            <div className="success-message">
              <div className="report-id-box">
                <strong>Report ID:</strong>
                <br />
                <code>{reportId}</code>
              </div>
              
              <p>✅ Encrypted and stored securely</p>
              <p>🔒 Only bounty owner can decrypt</p>
              <p>⏰ Auto-approved in 7 days if not reviewed</p>
              <p>💰 Reward: <strong>{reward} SUI</strong></p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary btn-full" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
