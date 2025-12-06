import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, DollarSign, Calendar, Github, Globe, AlertCircle } from 'lucide-react';

export default function CreateBounty() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scope: '',
    projectName: '',
    githubUrl: '',
    websiteUrl: '',
    rewardAmount: '',
    criticalReward: '',
    highReward: '',
    mediumReward: '',
    lowReward: '',
    deadlineDays: '30',
    usePlatformReview: false,      // Yeni: Platform kontrolü
    reviewTimeoutDays: '7',        // Yeni: Timeout süresi
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Validation
      const totalSeverityRewards = 
        parseFloat(formData.criticalReward || 0) +
        parseFloat(formData.highReward || 0) +
        parseFloat(formData.mediumReward || 0) +
        parseFloat(formData.lowReward || 0);

      if (totalSeverityRewards > parseFloat(formData.rewardAmount)) {
        throw new Error('Total severity rewards cannot exceed total reward amount');
      }

      // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
      const rewardInMist = Math.floor(parseFloat(formData.rewardAmount) * 1_000_000_000);
      const criticalInMist = Math.floor(parseFloat(formData.criticalReward || 0) * 1_000_000_000);
      const highInMist = Math.floor(parseFloat(formData.highReward || 0) * 1_000_000_000);
      const mediumInMist = Math.floor(parseFloat(formData.mediumReward || 0) * 1_000_000_000);
      const lowInMist = Math.floor(parseFloat(formData.lowReward || 0) * 1_000_000_000);

      const tx = new Transaction();

      // Split coin for reward
      const [rewardCoin] = tx.splitCoins(tx.gas, [rewardInMist]);

      // Create bounty
      tx.moveCall({
        target: `${import.meta.env.VITE_PACKAGE_ID}::bounty_manager::create_bounty`,
        arguments: [
          tx.object(import.meta.env.VITE_BOUNTY_REGISTRY_ID),
          tx.pure.string(formData.title),
          tx.pure.string(formData.description),
          tx.pure.string(formData.scope),
          tx.pure.string(formData.projectName),
          tx.pure.string(formData.githubUrl),
          tx.pure.string(formData.websiteUrl),
          rewardCoin,
          tx.pure.u64(criticalInMist),
          tx.pure.u64(highInMist),
          tx.pure.u64(mediumInMist),
          tx.pure.u64(lowInMist),
          tx.pure.u64(parseInt(formData.deadlineDays)),
          tx.pure.bool(formData.usePlatformReview),    // Yeni
          tx.pure.u64(parseInt(formData.reviewTimeoutDays)), // Yeni
          tx.object('0x6'), // Clock object
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Bounty created successfully:', result);
            alert('Bounty created successfully!');
            navigate('/hacks');
          },
          onError: (error) => {
            console.error('Bounty creation failed:', error);
            setError('Transaction failed: ' + error.message);
            setIsSubmitting(false);
          }
        }
      );

    } catch (error) {
      console.error('Bounty creation failed:', error);
      setError(error.message);
      setIsSubmitting(false);
    }
  };

  if (!currentAccount) {
    return (
      <div className="create-bounty-page">
        <div className="empty-state">
          <Shield size={64} />
          <h2>Connect Your Wallet</h2>
          <p>You need to connect your Sui wallet to create a bounty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-bounty-page">
      <div className="page-header">
        <h1>
          <Shield size={32} />
          Create Bug Bounty
        </h1>
        <p>Launch a trustless bug bounty with escrow and automatic payouts</p>
      </div>

      <form onSubmit={handleSubmit} className="bounty-form">
        {error && (
          <div className="error-box">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-section">
          <h3>Project Information</h3>
          
          <div className="form-group">
            <label>Bounty Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g., Smart Contract Security Audit"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              name="projectName"
              className="form-input"
              placeholder="Your Project Name"
              value={formData.projectName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <Github size={16} />
                GitHub Repository
              </label>
              <input
                type="url"
                name="githubUrl"
                className="form-input"
                placeholder="https://github.com/..."
                value={formData.githubUrl}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>
                <Globe size={16} />
                Website URL
              </label>
              <input
                type="url"
                name="websiteUrl"
                className="form-input"
                placeholder="https://..."
                value={formData.websiteUrl}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              className="form-textarea"
              rows="6"
              placeholder="Describe your project, what you're looking for, and any specific areas of concern..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Scope (In-Scope / Out-of-Scope) *</label>
            <textarea
              name="scope"
              className="form-textarea"
              rows="8"
              placeholder={`**In Scope:**
- Smart contracts in /contracts folder
- Frontend authentication
- API endpoints

**Out of Scope:**
- Third-party dependencies
- Social engineering
- DDoS attacks`}
              value={formData.scope}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>
            <DollarSign size={24} />
            Reward Structure
          </h3>

          <div className="warning-box-form">
            <Lock size={20} />
            <span>Funds will be locked in escrow until deadline or valid submission</span>
          </div>

          <div className="form-group">
            <label>Total Reward Pool (SUI) *</label>
            <input
              type="number"
              name="rewardAmount"
              className="form-input"
              placeholder="e.g., 1000"
              step="0.01"
              min="1"
              value={formData.rewardAmount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="severity-rewards">
            <h4>Severity-Based Rewards</h4>
            <p className="severity-hint">Optional: Define rewards for different severity levels</p>
            
            <div className="form-row">
              <div className="form-group">
                <label className="severity-label critical">Critical</label>
                <input
                  type="number"
                  name="criticalReward"
                  className="form-input"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  value={formData.criticalReward}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="severity-label high">High</label>
                <input
                  type="number"
                  name="highReward"
                  className="form-input"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  value={formData.highReward}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="severity-label medium">Medium</label>
                <input
                  type="number"
                  name="mediumReward"
                  className="form-input"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  value={formData.mediumReward}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="severity-label low">Low</label>
                <input
                  type="number"
                  name="lowReward"
                  className="form-input"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  value={formData.lowReward}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <Calendar size={24} />
            Timeline
          </h3>

          <div className="form-group">
            <label>Bounty Duration (Days) *</label>
            <select
              name="deadlineDays"
              className="form-select"
              value={formData.deadlineDays}
              onChange={handleChange}
              required
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days (Recommended)</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </div>
        
        <div className="form-section review-mode-section">
          <h3>
            <Shield size={24} />
            Review Configuration
          </h3>
          
          <div className="review-mode-card">
            <div className="review-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="usePlatformReview"
                  checked={formData.usePlatformReview}
                  onChange={(e) => setFormData({...formData, usePlatformReview: e.target.checked})}
                />
                <div className="checkbox-content">
                  <span className="checkbox-title">
                    Enable Platform Review
                    <span className="badge badge-fee">5% Fee</span>
                  </span>
                  <p className="checkbox-desc">
                    BountyChain validators will review and approve submissions for you. 
                    Professional verification with a 5% platform fee (vs 3% if you review yourself).
                  </p>
                </div>
              </label>
            </div>
            
            <div className="form-group">
              <label>
                Review Timeout (Days) *
                <span className="label-hint">
                  If you don't review within this time, platform will review (10% fee)
                </span>
              </label>
              <select
                name="reviewTimeoutDays"
                className="form-select"
                value={formData.reviewTimeoutDays}
                onChange={handleChange}
                required
              >
                <option value="3">3 days</option>
                <option value="7">7 days (Recommended)</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
              <div className="info-box">
                <AlertCircle size={16} />
                <span>
                  {formData.usePlatformReview 
                    ? 'Platform will review submissions immediately (5% fee). If you review yourself: 3% fee.'
                    : `You review: 3% fee. If you don't review within ${formData.reviewTimeoutDays} days: 10% fee (platform auto-review).`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/hacks')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Bounty...' : (
              <>
                <Lock size={20} />
                Create Bounty & Lock Funds
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
