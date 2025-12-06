import { useParams, Navigate, Link } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Wallet, Trophy, Award, Target, TrendingUp, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { address } = useParams();
  const currentAccount = useCurrentAccount();

  // Eğer URL'de adres varsa ve bağlı cüzdan yoksa, uyarı göster
  if (address && !currentAccount) {
    return (
      <div className="profile-page">
        <div className="empty-state">
          <AlertCircle size={64} />
          <h2>Wallet Not Connected</h2>
          <p>Please connect your wallet to view this profile.</p>
          <Link to="/" className="btn btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Eğer URL'de adres yoksa ve bağlı cüzdan varsa, cüzdan adresine yönlendir
  if (!address && currentAccount) {
    return <Navigate to={`/profile/${currentAccount.address}`} replace />;
  }

  // Eğer hiç cüzdan bağlı değilse, bağlantı iste
  if (!currentAccount) {
    return (
      <div className="profile-page">
        <div className="empty-state">
          <Wallet size={64} />
          <h2>Connect Your Wallet</h2>
          <p>Connect your Sui wallet to view your profile and participate in bug bounties.</p>
          <Link to="/" className="btn btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // URL'deki adres ile bağlı cüzdan adresi uyuşmuyor mu kontrol et
  const isOwnProfile = address === currentAccount.address;
  const displayAddress = address || currentAccount.address;
  const shortAddress = `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {displayAddress.slice(0, 4)}
        </div>
        <div className="profile-info">
          <div className="profile-rank">New Hacker</div>
          <h1>{shortAddress}</h1>
          <div className="profile-address">
            <Wallet size={16} />
            {displayAddress}
          </div>
          {isOwnProfile && (
            <div className="profile-badge-own">
              <Target size={16} />
              Your Profile
            </div>
          )}
        </div>
      </div>

      <div className="profile-stats-grid">
        <div className="stat-box">
          <div className="stat-icon reputation">
            <Award size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-value">0</div>
            <div className="stat-label">Reputation Score</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon wins">
            <Trophy size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-value">0</div>
            <div className="stat-label">Total Wins</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon rewards">
            <TrendingUp size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-value">0 SUI</div>
            <div className="stat-label">Total Rewards</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon success">
            <Target size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-value">—</div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>
      </div>

      <section className="profile-section">
        <h2>Badges</h2>
        <div className="empty-state-small">
          <Award size={48} />
          <p>No badges earned yet. Start solving bounties to earn badges!</p>
        </div>
      </section>

      <section className="profile-section">
        <h2>Performance Stats</h2>
        <div className="performance-grid">
          <div className="perf-item">
            <div className="perf-label">Average Solve Time</div>
            <div className="perf-value">—</div>
          </div>
          <div className="perf-item">
            <div className="perf-label">Expert Challenges</div>
            <div className="perf-value">0</div>
          </div>
          <div className="perf-item">
            <div className="perf-label">Intermediate Challenges</div>
            <div className="perf-value">0</div>
          </div>
          <div className="perf-item">
            <div className="perf-label">Beginner Challenges</div>
            <div className="perf-value">0</div>
          </div>
        </div>
      </section>

      <section className="profile-section">
        <h2>Solved Challenges</h2>
        <div className="empty-state-small">
          <Trophy size={48} />
          <p>No challenges solved yet. Visit the <Link to="/hacks">Challenges</Link> page to get started!</p>
        </div>
      </section>
    </div>
  );
}
