import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Trophy, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const mockHacks = [
  {
    id: 1,
    title: 'Reentrancy Guard Bypass',
    difficulty: 'beginner',
    reward: 50,
    timeLeft: '2d 14h',
    status: 'open',
    solvers: 3
  },
  {
    id: 2,
    title: 'Flash Loan Oracle Attack',
    difficulty: 'intermediate',
    reward: 150,
    timeLeft: '5d 3h',
    status: 'open',
    solvers: 1
  },
  {
    id: 3,
    title: 'Integer Overflow in Token Mint',
    difficulty: 'beginner',
    reward: 75,
    timeLeft: 'Solved',
    status: 'solved',
    solvers: 8,
    winner: '0x7a9f...3e2c'
  },
  {
    id: 4,
    title: 'Cross-Chain Bridge Exploit',
    difficulty: 'expert',
    reward: 500,
    timeLeft: '6d 22h',
    status: 'open',
    solvers: 0
  },
  {
    id: 5,
    title: 'Access Control Vulnerability',
    difficulty: 'intermediate',
    reward: 120,
    timeLeft: '4d 8h',
    status: 'open',
    solvers: 2
  },
  {
    id: 6,
    title: 'NFT Metadata Manipulation',
    difficulty: 'beginner',
    reward: 60,
    timeLeft: '3d 16h',
    status: 'open',
    solvers: 5
  },
  {
    id: 7,
    title: 'Signature Replay Attack',
    difficulty: 'intermediate',
    reward: 180,
    timeLeft: '1d 2h',
    status: 'open',
    solvers: 4
  },
  {
    id: 8,
    title: 'Governance Vote Manipulation',
    difficulty: 'expert',
    reward: 400,
    timeLeft: 'Solved',
    status: 'solved',
    solvers: 2,
    winner: '0x4b2f...8d1a'
  }
];

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
  const [showArchive, setShowArchive] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('reward-desc');

  // Filtreleme ve sıralama
  let filteredHacks = [...mockHacks];

  // Status filtresi
  if (statusFilter === 'active') {
    filteredHacks = filteredHacks.filter(h => h.status === 'open');
  } else if (statusFilter === 'expired') {
    filteredHacks = filteredHacks.filter(h => h.status === 'solved');
  } else if (statusFilter === 'my-submissions') {
    filteredHacks = []; // Backend entegrasyonu sonrası kullanıcının submission'larını göster
  }

  // Difficulty filtresi
  if (difficultyFilter !== 'all') {
    filteredHacks = filteredHacks.filter(h => h.difficulty === difficultyFilter);
  }

  // Sıralama
  if (sortBy === 'reward-desc') {
    filteredHacks.sort((a, b) => b.reward - a.reward);
  } else if (sortBy === 'reward-asc') {
    filteredHacks.sort((a, b) => a.reward - b.reward);
  } else if (sortBy === 'newest') {
    filteredHacks.reverse();
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
                <span className={`difficulty-badge ${hack.difficulty}`}>
                  {hack.difficulty}
                </span>
                <span className={`status-badge ${hack.status}`}>
                  {hack.status === 'open' ? (
                    <>
                      <div className="pulse-dot"></div>
                      Open
                    </>
                  ) : (
                    <>
                      <Trophy size={14} />
                      Solved
                    </>
                  )}
                </span>
              </div>

            <h3 className="hack-title">{hack.title}</h3>

            <div className="hack-meta">
              <div className="reward">
                <span className="reward-amount">{hack.reward} SUI</span>
                <span className="reward-label">Reward</span>
              </div>
              <div className="timer">
                {hack.status === 'open' ? (
                  <>
                    <Clock size={16} />
                    <span>{hack.timeLeft}</span>
                  </>
                ) : (
                  <span className="winner-text">Winner: {hack.winner}</span>
                )}
              </div>
            </div>

            <div className="hack-footer">
              <div className="solvers">
                <AlertCircle size={14} />
                {hack.solvers} attempting
              </div>
              {hack.status === 'open' && (
                <span className="try-label">Try Now →</span>
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
