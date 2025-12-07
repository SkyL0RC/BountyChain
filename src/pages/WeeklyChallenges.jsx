import { useState } from 'react';
import { Sparkles, Trophy, Clock, Target, Zap, Star, TrendingUp } from 'lucide-react';

// Mock data - sadece frontend için
const weeklyBounties = [
  {
    id: 'w1',
    title: 'SQL Injection Basics',
    description: 'Find and exploit a simple SQL injection vulnerability in a login form. Perfect for beginners!',
    reward: 0.05,
    difficulty: 'beginner',
    solvers: 12,
    timeLeft: '2 days',
    tags: ['SQL', 'Web Security', 'Beginner']
  },
  {
    id: 'w2',
    title: 'XSS Challenge',
    description: 'Identify and exploit a reflected XSS vulnerability. Learn the basics of cross-site scripting.',
    reward: 0.08,
    difficulty: 'beginner',
    solvers: 8,
    timeLeft: '3 days',
    tags: ['XSS', 'JavaScript', 'Web']
  },
  {
    id: 'w3',
    title: 'API Authentication Bypass',
    description: 'Bypass a weak API authentication mechanism. Great introduction to API security testing.',
    reward: 0.1,
    difficulty: 'intermediate',
    solvers: 5,
    timeLeft: '4 days',
    tags: ['API', 'Authentication', 'REST']
  },
  {
    id: 'w4',
    title: 'JWT Token Manipulation',
    description: 'Exploit a misconfigured JWT implementation. Learn about token-based authentication flaws.',
    reward: 0.15,
    difficulty: 'intermediate',
    solvers: 3,
    timeLeft: '5 days',
    tags: ['JWT', 'Crypto', 'Web']
  },
  {
    id: 'w5',
    title: 'CSRF Attack Vector',
    description: 'Execute a cross-site request forgery attack. Understand how CSRF tokens work.',
    reward: 0.07,
    difficulty: 'beginner',
    solvers: 10,
    timeLeft: '1 day',
    tags: ['CSRF', 'Web Security']
  },
  {
    id: 'w6',
    title: 'Path Traversal',
    description: 'Exploit a directory traversal vulnerability to access sensitive files.',
    reward: 0.12,
    difficulty: 'intermediate',
    solvers: 6,
    timeLeft: '6 days',
    tags: ['File System', 'Linux', 'Web']
  }
];

const pastWinners = [
  { week: 'Week 45', winner: '0xAb12...3f4e', challenges: 5, earned: 0.45 },
  { week: 'Week 44', winner: '0x7c3d...8a1b', challenges: 4, earned: 0.38 },
  { week: 'Week 43', winner: '0x9f2e...5c6d', challenges: 6, earned: 0.52 }
];

export default function WeeklyChallenges() {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const filteredBounties = selectedDifficulty === 'all' 
    ? weeklyBounties 
    : weeklyBounties.filter(b => b.difficulty === selectedDifficulty);

  return (
    <div className="weekly-challenges-page">
      {/* Hero Section */}
      <div className="weekly-hero">
        <div className="weekly-hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>New Challenges Every Monday</span>
          </div>
          <h1>Weekly Challenges</h1>
          <p className="hero-subtitle">
            Perfect for beginners! Solve easy challenges, earn rewards, and climb the leaderboard.
            <br />
            First solver gets the full reward - no sharing!
          </p>
          <div className="hero-stats">
            <div className="hero-stat-item">
              <Target size={20} />
              <div>
                <div className="stat-number">{weeklyBounties.length}</div>
                <div className="stat-label">Active Challenges</div>
              </div>
            </div>
            <div className="hero-stat-item">
              <Trophy size={20} />
              <div>
                <div className="stat-number">{weeklyBounties.reduce((acc, b) => acc + b.solvers, 0)}</div>
                <div className="stat-label">Solutions Submitted</div>
              </div>
            </div>
            <div className="hero-stat-item">
              <Zap size={20} />
              <div>
                <div className="stat-number">{weeklyBounties.reduce((acc, b) => acc + b.reward, 0).toFixed(2)} SUI</div>
                <div className="stat-label">Total Rewards</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="weekly-filters">
        <button 
          className={`filter-btn ${selectedDifficulty === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedDifficulty('all')}
        >
          All Challenges
        </button>
        <button 
          className={`filter-btn ${selectedDifficulty === 'beginner' ? 'active' : ''}`}
          onClick={() => setSelectedDifficulty('beginner')}
        >
          Beginner
        </button>
        <button 
          className={`filter-btn ${selectedDifficulty === 'intermediate' ? 'active' : ''}`}
          onClick={() => setSelectedDifficulty('intermediate')}
        >
          Intermediate
        </button>
      </div>

      {/* Challenges Grid */}
      <div className="weekly-grid">
        {filteredBounties.map(bounty => (
          <div key={bounty.id} className="weekly-card">
            <div className="weekly-card-header">
              <span className={`difficulty-badge ${bounty.difficulty}`}>
                {bounty.difficulty}
              </span>
              <div className="time-left">
                <Clock size={14} />
                <span>{bounty.timeLeft}</span>
              </div>
            </div>

            <h3 className="weekly-card-title">{bounty.title}</h3>
            <p className="weekly-card-desc">{bounty.description}</p>

            <div className="weekly-card-tags">
              {bounty.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>

            <div className="weekly-card-footer">
              <div className="reward-info">
                <Trophy size={18} />
                <span className="reward-amount">{bounty.reward} SUI</span>
              </div>
              <div className="solvers-info">
                <Star size={14} />
                <span>{bounty.solvers} trying</span>
              </div>
            </div>

            <button className="weekly-try-btn" disabled>
              <Zap size={16} />
              Coming Soon
            </button>
          </div>
        ))}
      </div>

      {/* Past Winners Section */}
      <div className="past-winners-section">
        <div className="section-header">
          <TrendingUp size={24} />
          <h2>Hall of Fame</h2>
        </div>
        <div className="winners-grid">
          {pastWinners.map(winner => (
            <div key={winner.week} className="winner-card">
              <div className="winner-week">{winner.week}</div>
              <div className="winner-address">{winner.winner}</div>
              <div className="winner-stats">
                <span>{winner.challenges} challenges solved</span>
                <span className="winner-earned">{winner.earned} SUI earned</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
