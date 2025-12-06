import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Trophy, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

// API base URL
const API_BASE_URL = 'http://localhost:3001/api';

const pastWeeks = [
  {
    week: 11,
    title: 'Week 11 - Access Control Week',
    winner: '0x7a9f...5a2f',
    reward: 250,
    challenges: 4
  },
  {
    week: 10,
    title: 'Week 10 - Oracle Manipulation',
    winner: '0x4b2f...8f4b',
    reward: 300,
    challenges: 3
  },
  {
    week: 9,
    title: 'Week 9 - Reentrancy Special',
    winner: '0x9c5e...9c5e',
    reward: 200,
    challenges: 5
  }
];

export default function HackList() {
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('reward-desc');

  // Backend'den bounty'leri çek
  useEffect(() => {
    const fetchBounties = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/bounties`);
        if (!response.ok) throw new Error('Failed to fetch bounties');
        const data = await response.json();
        setBounties(data.bounties || []);
      } catch (err) {
        console.error('Error fetching bounties:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBounties();
  }, []);

  // Filtreleme ve sıralama
  let filteredHacks = [...bounties];

  // Status filtresi
  if (statusFilter === 'active') {
    filteredHacks = filteredHacks.filter(h => h.status === 'active');
  } else if (statusFilter === 'expired') {
    filteredHacks = filteredHacks.filter(h => h.status === 'expired');
  }

  // Difficulty filtresi (şimdilik backend'de difficulty yok, ileride eklenebilir)
  if (difficultyFilter !== 'all') {
    filteredHacks = filteredHacks.filter(h => h.difficulty === difficultyFilter);
  }

  // Sıralama
  if (sortBy === 'reward-desc') {
    filteredHacks.sort((a, b) => parseFloat(b.rewardAmount) - parseFloat(a.rewardAmount));
  } else if (sortBy === 'reward-asc') {
    filteredHacks.sort((a, b) => parseFloat(a.rewardAmount) - parseFloat(b.rewardAmount));
  } else if (sortBy === 'newest') {
    filteredHacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (loading) {
    return (
      <div className="hack-list-page">
        <div className="page-header">
          <h1>Bug Bounties</h1>
          <p>Loading bounties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hack-list-page">
        <div className="page-header">
          <h1>Bug Bounties</h1>
          <p style={{ color: '#f44336' }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hack-list-page">
      <div className="page-header">
        <h1>Mini Hack Challenges</h1>
        <p>First to solve wins the full reward. No sharing. No second place.</p>
      </div>

      <div className="filters">
        <button 
          className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          Active
        </button>
        <button 
          className={`filter-btn ${statusFilter === 'expired' ? 'active' : ''}`}
          onClick={() => setStatusFilter('expired')}
        >
          Expired
        </button>
        <button 
          className={`filter-btn ${statusFilter === 'my-submissions' ? 'active' : ''}`}
          onClick={() => setStatusFilter('my-submissions')}
        >
          My Submissions
        </button>
        <div className="filter-divider"></div>
        <button 
          className={`filter-btn ${difficultyFilter === 'beginner' ? 'active' : ''}`}
          onClick={() => setDifficultyFilter(difficultyFilter === 'beginner' ? 'all' : 'beginner')}
        >
          Beginner
        </button>
        <button 
          className={`filter-btn ${difficultyFilter === 'intermediate' ? 'active' : ''}`}
          onClick={() => setDifficultyFilter(difficultyFilter === 'intermediate' ? 'all' : 'intermediate')}
        >
          Intermediate
        </button>
        <button 
          className={`filter-btn ${difficultyFilter === 'expert' ? 'active' : ''}`}
          onClick={() => setDifficultyFilter(difficultyFilter === 'expert' ? 'all' : 'expert')}
        >
          Expert
        </button>
        
        <div className="sort-dropdown">
          <span className="sort-label">Sort by:</span>
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="reward-desc">Reward ↓</option>
            <option value="reward-asc">Reward ↑</option>
            <option value="newest">Newest</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>
      </div>

      <div className="hack-grid">
        {filteredHacks.length === 0 ? (
          <div className="empty-state-small">
            <AlertCircle size={48} />
            <p>No challenges found matching your filters</p>
          </div>
        ) : (
          filteredHacks.map(hack => (
            <Link to={`/hack/${hack.id}`} key={hack.id} className="hack-card">
              <div className="hack-card-header">
                <span className={`difficulty-badge ${hack.difficulty || 'beginner'}`}>
                  {hack.difficulty || 'standard'}
                </span>
                <span className={`status-badge ${hack.status}`}>
                  {hack.status === 'active' ? (
                    <>
                      <div className="pulse-dot"></div>
                      Active
                    </>
                  ) : (
                    <>
                      <Trophy size={14} />
                      {hack.status}
                    </>
                  )}
                </span>
              </div>

            <h3 className="hack-title">{hack.title}</h3>
            {hack.description && (
              <p className="hack-description">{hack.description.substring(0, 100)}...</p>
            )}

            <div className="hack-meta">
              <div className="reward">
                <span className="reward-amount">{hack.rewardAmount} SUI</span>
                <span className="reward-label">Reward</span>
              </div>
              <div className="timer">
                <Clock size={16} />
                <span>{new Date(hack.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="hack-footer">
              <div className="solvers">
                <AlertCircle size={14} />
                View Details
              </div>
              {hack.status === 'active' && (
                <span className="try-label">Submit PoC →</span>
              )}
            </div>
          </Link>
          ))
        )}
      </div>

      {/* Past Weeks Archive */}
      <section className="archive-section">
        <div 
          className="archive-header"
          onClick={() => setShowArchive(!showArchive)}
        >
          <h3>Past Weeks Archive</h3>
          {showArchive ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
        
        {showArchive && (
          <div className="archive-content">
            {pastWeeks.map((week) => (
              <div key={week.week} className="archive-week-card">
                <div className="archive-week-title">{week.title}</div>
                <div className="archive-week-meta">
                  <span className="archive-reward">{week.reward} SUI</span>
                  <span className="archive-challenges">{week.challenges} challenges</span>
                </div>
                <div className="archive-week-winner">
                  Winner: {week.winner}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
