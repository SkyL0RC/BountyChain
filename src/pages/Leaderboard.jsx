import { useState, useEffect } from 'react';
import { Trophy, Award, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { getLeaderboard } from '../utils/sui';

export default function Leaderboard() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [leaderboardData, setLeaderboardData] = useState({ totalHackers: 0, hackers: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const leaderboardId = import.meta.env.VITE_LEADERBOARD_ID;
      
      if (!leaderboardId || leaderboardId === '0x0') {
        console.log('Leaderboard not deployed yet');
        setIsLoading(false);
        return;
      }

      const data = await getLeaderboard(suiClient, leaderboardId);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getBadges = (points) => {
    const badges = [];
    if (points >= 100) badges.push('🔥');
    if (points >= 50) badges.push('⚡');
    if (points >= 200) badges.push('👑');
    return badges;
  };

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1>
          <Trophy size={32} />
          Global Leaderboard
        </h1>
        <p>Top hackers competing for glory and rewards</p>
      </div>

      <div className="leaderboard-stats">
        <div className="stat-card">
          <Award size={24} />
          <div>
            <div className="stat-value">{leaderboardData.totalHackers}</div>
            <div className="stat-label">Active Hackers</div>
          </div>
        </div>
        <div className="stat-card">
          <Target size={24} />
          <div>
            <div className="stat-value">{leaderboardData.hackers.length}</div>
            <div className="stat-label">Ranked Players</div>
          </div>
        </div>
        <div className="stat-card">
          <Trophy size={24} />
          <div>
            <div className="stat-value">
              {leaderboardData.hackers.reduce((sum, h) => sum + h.points, 0)}
            </div>
            <div className="stat-label">Total Points</div>
          </div>
        </div>
      </div>

      <div className="leaderboard-table">
        <div className="table-header">
          <div className="col-rank">Rank</div>
          <div className="col-hacker">Hacker</div>
          <div className="col-score">Score</div>
          <div className="col-wins">Wins</div>
          <div className="col-badges">Badges</div>
        </div>

        <div className="table-body">
          {isLoading ? (
            <div className="empty-state-small">
              <Trophy size={48} />
              <p>Loading leaderboard...</p>
            </div>
          ) : leaderboardData.hackers.length === 0 ? (
            <div className="empty-state-small">
              <Trophy size={48} />
              <p>No hackers on leaderboard yet. Be the first to solve a bounty!</p>
            </div>
          ) : (
            leaderboardData.hackers.map((hacker, index) => {
              const rank = index + 1;
              const isCurrentUser = currentAccount?.address === hacker.address;
              const badges = getBadges(hacker.points);
              
              return (
                <Link 
                  to={`/profile/${hacker.address}`} 
                  key={hacker.address}
                  className={`leaderboard-row ${rank <= 3 ? 'top-three' : ''} ${isCurrentUser ? 'current-user' : ''}`}
                >
                  <div className="col-rank">
                    <span className={`rank-badge rank-${rank}`}>
                      {getRankEmoji(rank)}
                    </span>
                  </div>
                  <div className="col-hacker">
                    <div className="hacker-avatar">
                      {hacker.address.slice(0, 4)}
                    </div>
                    <span className="hacker-address">
                      {hacker.address.slice(0, 6)}...{hacker.address.slice(-4)}
                      {isCurrentUser && <span className="you-badge">You</span>}
                    </span>
                  </div>
                  <div className="col-score">
                    <span className="score-value">{hacker.points}</span>
                  </div>
                  <div className="col-wins">
                    <Trophy size={16} />
                    <span>{Math.floor(hacker.points / 30)}</span>
                  </div>
                  <div className="col-badges">
                    {badges.length > 0 ? (
                      badges.map((badge, idx) => (
                        <span key={idx} className="badge-icon">{badge}</span>
                      ))
                    ) : (
                      <span className="no-badges">—</span>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
