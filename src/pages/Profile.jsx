import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Wallet, Trophy, Award, Target, TrendingUp, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

export default function Profile() {
  const { address } = useParams();
  const currentAccount = useCurrentAccount();
  const [userBounties, setUserBounties] = useState([]);
  const [solvedBounties, setSolvedBounties] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayAddress = address || currentAccount?.address;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!displayAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Kullanıcının oluşturduğu bounty'leri getir
        const bountiesResponse = await fetch(`${API_BASE_URL}/bounties`);
        if (!bountiesResponse.ok) throw new Error('Failed to fetch bounties');
        const bountiesData = await bountiesResponse.json();
        
        const userCreatedBounties = bountiesData.bounties.filter(
          b => b.ownerWallet === displayAddress
        );
        setUserBounties(userCreatedBounties);

        // Kullanıcının approve aldığı raporları getir
        const reportsResponse = await fetch(`${API_BASE_URL}/reports/hacker/${displayAddress}`);
        if (!reportsResponse.ok) throw new Error('Failed to fetch reports');
        const reportsData = await reportsResponse.json();
        
        // Kullanıcının approved raporlarını filtrele
        const approvedReports = reportsData.reports.filter(
          r => r.status === 'approved'
        );

        // Her approved rapor için bounty bilgisini getir (zaten join ile geliyor ama tam bounty objesi için fetch gerekebilir veya join verisi yeterli olabilir)
        // Backend endpoint'i bounty_title ve reward_amount dönüyor, ama tam bounty objesi için fetch yapalım
        // Veya backend'den gelen veriyi kullanalım:
        
        const solvedBountiesData = approvedReports.map(report => ({
          id: report.bounty_id,
          title: report.bounty_title,
          rewardAmount: report.reward_amount,
          createdAt: report.created_at, // Rapor tarihi mi bounty tarihi mi? Backend query'de r.created_at var.
          // Bounty description yok, ama şimdilik idare eder veya fetch yapabiliriz.
          // Tutarlılık için fetch yapalım.
        }));

        // Detaylı bounty bilgilerini çekelim
        const detailedSolvedBounties = await Promise.all(
          solvedBountiesData.map(async (bounty) => {
            try {
              const bountyResponse = await fetch(`${API_BASE_URL}/bounties/${bounty.id}`);
              if (bountyResponse.ok) {
                const bountyData = await bountyResponse.json();
                return bountyData.bounty;
              }
              return null;
            } catch (err) {
              console.error('Error fetching bounty:', err);
              return null;
            }
          })
        );

        // Null değerleri filtrele ve benzersiz bounty'leri al
        const uniqueSolvedBounties = detailedSolvedBounties
          .filter(b => b !== null)
          .filter((bounty, index, self) => 
            index === self.findIndex(b => b.id === bounty.id)
          );

        setSolvedBounties(uniqueSolvedBounties);

      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [displayAddress]);

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
        <h2>Created Bounties</h2>
        {loading ? (
          <div className="empty-state-small">
            <p>Loading...</p>
          </div>
        ) : userBounties.length > 0 ? (
          <div className="bounties-list">
            {userBounties.map(bounty => (
              <Link to={`/hack/${bounty.id}`} key={bounty.id} className="bounty-item">
                <div className="bounty-item-header">
                  <h3>{bounty.title}</h3>
                  <span className={`status-badge ${bounty.status}`}>{bounty.status}</span>
                </div>
                <div className="bounty-item-meta">
                  <span className="reward">{(bounty.rewardAmount / 1_000_000_000).toFixed(3)} SUI</span>
                  <span className="date">{new Date(bounty.createdAt).toLocaleDateString()}</span>
                </div>
                {bounty.description && (
                  <p className="bounty-item-desc">{bounty.description.substring(0, 100)}...</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state-small">
            <Trophy size={48} />
            <p>No bounties created yet. Visit the <Link to="/create-bounty">Create Bounty</Link> page to get started!</p>
          </div>
        )}
      </section>

      <section className="profile-section">
        <h2>Solved Challenges</h2>
        {loading ? (
          <div className="empty-state-small">
            <p>Loading...</p>
          </div>
        ) : solvedBounties.length > 0 ? (
          <div className="bounties-list">
            {solvedBounties.map(bounty => (
              <Link to={`/hack/${bounty.id}`} key={bounty.id} className="bounty-item">
                <div className="bounty-item-header">
                  <h3>{bounty.title}</h3>
                  <span className="status-badge approved">Solved</span>
                </div>
                <div className="bounty-item-meta">
                  <span className="reward">{(bounty.rewardAmount / 1_000_000_000).toFixed(3)} SUI</span>
                  <span className="date">{new Date(bounty.createdAt).toLocaleDateString()}</span>
                </div>
                {bounty.description && (
                  <p className="bounty-item-desc">{bounty.description.substring(0, 100)}...</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state-small">
            <Trophy size={48} />
            <p>No challenges solved yet. Visit the <Link to="/hacks">Challenges</Link> page to get started!</p>
          </div>
        )}
      </section>
    </div>
  );
}
