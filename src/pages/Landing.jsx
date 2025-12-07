import { Link } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { Wallet, Trophy, Zap, Shield, Lock, CheckCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

export default function Landing() {
  const currentAccount = useCurrentAccount();
  const [completedBounties, setCompletedBounties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedBounties = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/bounties`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        
        // Completed bounties = en az 1 approved report'u olan bounties
        const bountiesWithApprovedReports = [];
        for (const bounty of data.bounties) {
          try {
            const reportsRes = await fetch(`${API_BASE_URL}/reports/bounty/${bounty.id}`);
            if (reportsRes.ok) {
              const reportsData = await reportsRes.json();
              const hasApproved = reportsData.reports.some(r => r.status === 'approved');
              if (hasApproved) {
                bountiesWithApprovedReports.push(bounty);
              }
            }
          } catch (err) {
            console.error('Error fetching reports:', err);
          }
        }
        
        setCompletedBounties(bountiesWithApprovedReports.slice(0, 3)); // İlk 3'ünü göster
      } catch (error) {
        console.error('Error fetching completed bounties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedBounties();
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            The First Zero-Admin,<br />
            <span className="gradient-text">Fully On-Chain Bug Bounty Platform</span><br />
            <span className="hero-subtitle-small">on Sui</span>
          </h1>
          <p className="hero-subtitle">
            Powered by Walrus & Seal. Secure, transparent, and fully decentralized.
          </p>
          <div className="cta-buttons">
            <Link to="/hacks" className="btn btn-primary">
              <Trophy size={20} />
              Explore Bounties
            </Link>
            <Link to="/mini-hack" className="btn btn-secondary">
              <Zap size={20} />
              Weekly Mini Hacks
            </Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-value">$2.4M</div>
            <div className="stat-label">Total TVL Locked</div>
          </div>
          <div className="stat">
            <div className="stat-value">47</div>
            <div className="stat-label">Active Bounties</div>
          </div>
          <div className="stat">
            <div className="stat-value">$890K</div>
            <div className="stat-label">Total Paid Out</div>
          </div>
          <div className="stat">
            <div className="stat-value">234</div>
            <div className="stat-label">Hackers Rewarded</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-icon">
              <Trophy />
            </div>
            <h3>1. Create</h3>
            <p>Projects lock funds in escrow and create bounties with custom rules and rewards.</p>
          </div>
          <div className="step">
            <div className="step-icon">
              <Shield />
            </div>
            <h3>2. Submit</h3>
            <p>Hackers find bugs and submit findings encrypted with Seal, stored on Walrus.</p>
          </div>
          <div className="step">
            <div className="step-icon">
              <Wallet />
            </div>
            <h3>3. Get Paid</h3>
            <p>Smart contracts verify and release rewards instantly. No middlemen, no delays.</p>
          </div>
        </div>
      </section>

      {/* Featured Challenges Preview */}
      <section className="featured">
        <div className="featured-header">
          <h2 className="section-title">Recently Completed Bounties</h2>
          <Link to="/hacks" className="view-all">View All Bounties →</Link>
        </div>
        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : completedBounties.length > 0 ? (
          <div className="completed-bounties-grid">
            {completedBounties.map(bounty => (
              <Link to={`/hack/${bounty.id}`} key={bounty.id} className="completed-bounty-card">
                <div className="completed-badge">
                  <CheckCircle size={20} />
                  <span>Completed</span>
                </div>
                <h3>{bounty.title}</h3>
                <div className="bounty-reward">
                  <Trophy size={16} />
                  <span>{bounty.rewardAmount} SUI</span>
                </div>
                <p className="bounty-owner-small">
                  by {bounty.ownerWallet.slice(0, 6)}...{bounty.ownerWallet.slice(-4)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state-small">
            <Trophy size={48} />
            <p>No completed bounties yet. Be the first to solve one!</p>
          </div>
        )}
      </section>

      <section className="featured">
        <div className="featured-header">
          <h2 className="section-title">Top Leaderboard Hackers</h2>
          <Link to="/leaderboard" className="view-all">View Full Leaderboard →</Link>
        </div>
        <div className="leaderboard-preview">
          {currentAccount ? (
            <div className="preview-rank-item">
              <span className="preview-rank">🥇</span>
              <span className="preview-address">
                {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
              </span>
              <span className="preview-points">0 pts</span>
            </div>
          ) : (
            <div className="empty-state-small">
              <Trophy size={48} />
              <p>Connect your wallet to see leaderboard rankings</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-text">Powered by</div>
          <div className="footer-logos">
            <div className="footer-logo">Sui</div>
            <div className="footer-logo">Walrus</div>
            <div className="footer-logo">Seal</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
