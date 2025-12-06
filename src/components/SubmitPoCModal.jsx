import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { X, Upload, FileCode, Wallet, AlertTriangle, CheckCircle, Shield, Lock } from 'lucide-react';
import { getWalrusClient } from '../utils/walrus';
import { getSealClient } from '../utils/seal';

export default function SubmitPoCModal({ hackTitle, reward, bountyId, bountyOwner, onClose }) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [step, setStep] = useState(1); // 1: upload, 2: wallet confirmation, 3: success
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState('');
  const [sealEncryption, setSealEncryption] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [walrusData, setWalrusData] = useState(null);
  const [sealData, setSealData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      await uploadToWalrus(selectedFile);
    }
  };

  const uploadToWalrus = async (file) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      const walrusClient = getWalrusClient('testnet');
      
      // Progress tracking ile Walrus'a yükle
      const result = await walrusClient.uploadFileWithProgress(
        file,
        (percent) => setUploadProgress(percent),
        30 // 30 epoch (≈30 gün) sakla
      );

      setWalrusData(result);
      console.log('Walrus upload successful:', result);

      // Eğer Seal encryption aktifse şifrele
      if (sealEncryption && bountyOwner) {
        await encryptWithSeal(file, bountyOwner);
      }

      setIsUploading(false);
    } catch (error) {
      console.error('Walrus upload failed:', error);
      setError('File upload failed: ' + error.message);
      setIsUploading(false);
    }
  };

  const encryptWithSeal = async (file, bountyOwnerAddress) => {
    try {
      const sealClient = getSealClient();
      const encrypted = await sealClient.encryptFile(file, bountyOwnerAddress);
      setSealData(encrypted);
      console.log('Seal encryption successful');
    } catch (error) {
      console.error('Seal encryption failed:', error);
      setError('Encryption failed: ' + error.message);
    }
  };



  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      await uploadToWalrus(droppedFile);
    }
  };

  const handleSubmit = () => {
    if (!file || !description.trim() || !impact.trim()) {
      alert('Please fill all required fields');
      return;
    }
    if (!walrusData) {
      alert('Please wait for file upload to complete');
      return;
    }
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }
    setStep(2);
  };

  const handleWalletConfirm = async () => {
    try {
      setError(null);

      // Severity mapping
      const severityMap = {
        'low': 0,
        'medium': 1,
        'high': 2,
        'critical': 3
      };

      const walrusClient = getWalrusClient('testnet');
      const walrusBlobBytes = walrusClient.blobIdToBytes(walrusData.blobId);

      let sealBytes = new Uint8Array(0);
      if (sealEncryption && sealData) {
        sealBytes = sealData.encryptedData;
      }

      // Sui Transaction oluştur
      const tx = new Transaction();
      
      // submit_poc fonksiyonunu çağır
      tx.moveCall({
        target: `${process.env.VITE_PACKAGE_ID}::bounty_manager::submit_poc`,
        arguments: [
          tx.object(bountyId),
          tx.pure.vector('u8', Array.from(walrusBlobBytes)),
          tx.pure.vector('u8', Array.from(sealBytes)),
          tx.pure.u8(severityMap[impact]),
          tx.object('0x6'), // Clock object
        ],
      });

      // Transaction'ı imzala ve gönder
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Submission successful:', result);
            setStep(3);
          },
          onError: (error) => {
            console.error('Submission failed:', error);
            setError('Transaction failed: ' + error.message);
          }
        }
      );

    } catch (error) {
      console.error('Wallet confirmation failed:', error);
      setError('Failed to submit: ' + error.message);
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
              <h2>Submit Proof of Concept</h2>
              <p>{hackTitle}</p>
            </div>

            <div className="warning-box-modal">
              <AlertTriangle size={20} />
              <span>Only the first valid submission gets the {reward} SUI reward</span>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Upload Proof of Concept</label>
                <div 
                  className={`file-upload-area ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    onChange={handleFileChange}
                    accept=".sol,.js,.ts,.move,.rs,.py,.md,.pdf"
                    style={{ display: 'none' }}
                  />
                  {file ? (
                    <div className="file-selected">
                      <FileCode size={32} />
                      <div className="file-info">
                        <div className="file-name">{file.name}</div>
                        <div className="file-size">{(file.size / 1024).toFixed(2)} KB</div>
                        {isUploading && (
                          <div className="upload-progress">
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                            <span className="progress-text">Uploading to Walrus... {uploadProgress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="file-upload-placeholder">
                      <Upload size={32} />
                      <div>Drag and drop your files here</div>
                      <div className="file-hint">or click to browse</div>
                      <div className="file-formats">Supports: .sol, .js, .ts, .move, .rs, .py, .md, .pdf</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Impact Assessment *</label>
                <select 
                  className="form-select"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                >
                  <option value="">Select severity</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="form-group">
                <label>Vulnerability Description (Markdown supported) *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the vulnerability, steps to reproduce, and potential impact..."
                  rows="8"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="char-count">{description.length} / 2000</div>
              </div>

              <div className="form-group">
                <div className="seal-toggle">
                  <div className="seal-toggle-header">
                    <Lock size={20} />
                    <span>Seal Encryption</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={sealEncryption}
                        onChange={(e) => setSealEncryption(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <p className="seal-description">
                    {sealEncryption 
                      ? '🔒 Your submission will be encrypted and only visible to the project team'
                      : '⚠️ Warning: Your submission will be publicly visible'}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit}
                disabled={!file || !description.trim() || !impact || isUploading}
              >
                {sealEncryption ? (
                  <>
                    <Lock size={20} />
                    Submit & Encrypt
                  </>
                ) : (
                  'Submit Finding'
                )}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="modal-header">
              <h2>Confirm Submission</h2>
              <p>Review and sign with your wallet</p>
            </div>

            <div className="confirmation-box">
              <div className="confirmation-item">
                <span className="confirmation-label">Challenge:</span>
                <span className="confirmation-value">{hackTitle}</span>
              </div>
              <div className="confirmation-item">
                <span className="confirmation-label">Reward:</span>
                <span className="confirmation-value highlight">{reward} SUI</span>
              </div>
              <div className="confirmation-item">
                <span className="confirmation-label">File:</span>
                <span className="confirmation-value">{file?.name}</span>
              </div>
            </div>

            <div className="wallet-action">
              <Wallet size={48} />
              <h3>Sign with your wallet</h3>
              <p>Confirm the transaction in your wallet to submit your PoC</p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleWalletConfirm}>
                <Wallet size={20} />
                Confirm with Wallet
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="modal-header">
              <div className="success-icon">
                <CheckCircle size={64} />
              </div>
              <h2>Submission Received!</h2>
              <p>Your proof of concept is being validated</p>
            </div>

            <div className="success-message">
              <p>
                Your exploit has been submitted successfully. Our automated validation system 
                is now testing your PoC against the vulnerable contract.
              </p>
              <p>
                If you're the first to submit a valid solution, you'll receive <strong>{reward} SUI</strong> within 
                minutes. Check your wallet and profile for updates.
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary btn-full" onClick={onClose}>
                View My Submissions
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
