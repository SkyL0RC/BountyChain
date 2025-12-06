import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, DollarSign, Calendar, Github, Globe, AlertCircle } from 'lucide-react';
import { createBounty } from '../utils/backendCrypto';

const API_BASE_URL = 'http://localhost:3001/api';

export default function CreateBounty() {
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rewardAmount: '',
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

    if (!formData.title || !formData.rewardAmount) {
      setError('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createBounty(
        formData.title,
        formData.rewardAmount,
        currentAccount.address,
        formData.description
      );

      console.log('Bounty created successfully:', result);
      alert(`Bounty created! ID: ${result.bounty.id}`);
      
      // Kısa bir bekleme sonrası yönlendir (database'e yazılması için)
      setTimeout(() => {
        navigate('/hacks');
      }, 500);

    } catch (error) {
      console.error('Bounty creation failed:', error);
      setError(error.message);
    } finally {
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
        <p>Create a bug bounty with encrypted report submission</p>
      </div>

      <form onSubmit={handleSubmit} className="bounty-form">
        {error && (
          <div className="error-box">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-section">
          <h3>Bounty Information</h3>
          
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
            <label>Description</label>
            <textarea
              name="description"
              className="form-textarea"
              rows="6"
              placeholder="Describe your project, what you're looking for, and any specific areas of concern..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Reward Amount (SUI) *</label>
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

          <div className="warning-box-form">
            <Lock size={20} />
            <Shield size={20} />
            <span>All reports will be encrypted with your public key. Only you can read them.</span>
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
                <Shield size={20} />
                Create Bounty
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
