import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Clock, Trophy, AlertTriangle, ArrowLeft, Code, FileText, ExternalLink, Github, Globe, Shield, Lock, ListChecks } from 'lucide-react';
import SubmitPoCModal from '../components/SubmitPoCModal';

const API_BASE_URL = 'http://localhost:3001/api';

export default function HackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const [hack, setHack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const fetchBounty = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/bounties/${id}`);
        if (!response.ok) throw new Error('Bounty not found');
        const data = await response.json();
        setHack(data.bounty);
      } catch (err) {
        console.error('Error fetching bounty:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBounty();
  }, [id]);

  if (loading) {
    return (
      <div className="hack-detail-page">
        <Link to="/hacks" className="back-link">
          <ArrowLeft size={20} />
          Back to Bounties
        </Link>
        <div className="hack-detail-header">
          <h1>Loading bounty details...</h1>
        </div>
      </div>
    );
  }

  if (error || !hack) {
    return (
      <div className="hack-detail-page">
        <Link to="/hacks" className="back-link">
          <ArrowLeft size={20} />
          Back to Bounties
        </Link>
        <div className="hack-detail-header">
          <h1>Bounty Not Found</h1>
          <p style={{ color: '#f44336' }}>{error || 'This bounty does not exist.'}</p>
        </div>
      </div>
    );
  }

  const isOwner = currentAccount && hack && currentAccount.address === hack.ownerWallet;

  return (
    <div className="hack-detail-page">
      <Link to="/hacks" className="back-link">
        <ArrowLeft size={20} />
        Back to Bounties
      </Link>

      <div className="hack-detail-header">
        <div className="project-info">
          <div className="project-logo">🎯</div>
          <div className="project-details">
            <h1>Bug Bounty</h1>
            <div className="project-links">
              <span className="project-link">
                <Shield size={16} />
                ID: {hack.id}
              </span>
            </div>
          </div>
        </div>

        <div className="hack-detail-title-row">
          <h2>{hack.title}</h2>
          <span className={`difficulty-badge ${hack.status}`}>
            {hack.status}
          </span>
        </div>
        
        <div className="hack-detail-meta">
          <div className="meta-item reward-big">
            <Trophy size={24} />
            <div>
              <div className="meta-value">{hack.rewardAmount} SUI</div>
              <div className="meta-label">Reward</div>
            </div>
          </div>
          <div className="meta-item">
            <Lock size={24} className="escrow-locked" />
            <div>
              <div className="meta-value">Encrypted</div>
              <div className="meta-label">Report Storage</div>
            </div>
          </div>
          <div className="meta-item">
            <Clock size={24} />
            <div>
              <div className="meta-value">{new Date(hack.createdAt).toLocaleDateString()}</div>
              <div className="meta-label">Created</div>
            </div>
          </div>
        </div>
      </div>

      <div className="warning-box">
        <AlertTriangle size={20} />
        <div>
          <strong>Secure Submission:</strong> Your report will be encrypted with the bounty owner's public key. 
          Only they can read it.
        </div>
      </div>

      <div className="hack-content">
        <section className="content-section">
          <h2>
            <FileText size={20} />
            Bounty Description
          </h2>
          <p>{hack.description || 'No description provided.'}</p>
        </section>

        <section className="content-section">
          <h2>
            <Shield size={20} />
            Bounty Owner
          </h2>
          <p className="owner-address">{hack.ownerWallet}</p>
        </section>

        <div className="submit-section">
          {isOwner ? (
            <button 
              className="btn btn-secondary btn-large"
              onClick={() => navigate(`/review/${id}`)}
            >
              <ListChecks size={20} />
              Review Submissions
            </button>
          ) : (
            <button 
              className="btn btn-primary btn-large"
              onClick={() => setShowSubmitModal(true)}
              disabled={hack.status !== 'active'}
            >
              <Trophy size={20} />
              Submit Encrypted Report
            </button>
          )}
          <p className="submit-hint">
            {isOwner 
              ? "You are the owner of this bounty. Review submitted reports here."
              : "Your vulnerability report will be encrypted end-to-end before submission"
            }
          </p>
        </div>
      </div>

      {showSubmitModal && (
        <SubmitPoCModal 
          hackTitle={hack.title}
          reward={hack.rewardAmount}
          bountyId={id}
          onClose={() => setShowSubmitModal(false)}
        />
      )}
    </div>
  );
}
