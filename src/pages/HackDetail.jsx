import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Trophy, AlertTriangle, ArrowLeft, Code, FileText, ExternalLink, Github, Globe, Shield, Lock } from 'lucide-react';
import SubmitPoCModal from '../components/SubmitPoCModal';

const mockHackDetails = {
  1: {
    title: 'Reentrancy Guard Bypass',
    projectName: 'DeFi Protocol X',
    projectLogo: '🏦',
    github: 'https://github.com/defi-protocol-x',
    website: 'https://defiprotocolx.io',
    difficulty: 'beginner',
    reward: 50,
    escrowStatus: 'locked',
    timeLeft: '2d 14h',
    status: 'open',
    solvers: 3,
    description: 'Find and exploit a vulnerability in the reentrancy guard implementation. The contract claims to be protected against reentrancy attacks, but there\'s a subtle flaw.',
    severityRewards: [
      { severity: 'Critical', reward: '5,000 USDC', color: 'critical' },
      { severity: 'High', reward: '2,500 USDC', color: 'high' },
      { severity: 'Medium', reward: '1,000 USDC', color: 'medium' },
      { severity: 'Low', reward: '250 USDC', color: 'low' }
    ],
    scope: {
      inScope: [
        'Smart contracts in /contracts folder',
        'Web3 integration code',
        'Oracle price feed implementation'
      ],
      outOfScope: [
        'Frontend UI bugs',
        'Documentation typos',
        'Known issues in dependencies'
      ]
    },
    objectives: [
      'Identify the vulnerability in the guard mechanism',
      'Create a working exploit contract',
      'Demonstrate successful fund extraction'
    ],
    contractCode: `// Vulnerable Contract
contract VulnerableBank {
    mapping(address => uint256) public balances;
    bool private locked;
    
    modifier noReentrant() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw() public noReentrant {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");
        
        (bool success,) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] = 0;
    }
}`
  }
};

export default function HackDetail() {
  const { id } = useParams();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const hack = mockHackDetails[id] || mockHackDetails[1];

  return (
    <div className="hack-detail-page">
      <Link to="/hacks" className="back-link">
        <ArrowLeft size={20} />
        Back to Challenges
      </Link>

      <div className="hack-detail-header">
        <div className="project-info">
          <div className="project-logo">{hack.projectLogo}</div>
          <div className="project-details">
            <h1>{hack.projectName}</h1>
            <div className="project-links">
              {hack.github && (
                <a href={hack.github} target="_blank" rel="noopener noreferrer" className="project-link">
                  <Github size={16} />
                  GitHub
                </a>
              )}
              {hack.website && (
                <a href={hack.website} target="_blank" rel="noopener noreferrer" className="project-link">
                  <Globe size={16} />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="hack-detail-title-row">
          <h2>{hack.title}</h2>
          <span className={`difficulty-badge ${hack.difficulty}`}>
            {hack.difficulty}
          </span>
        </div>
        
        <div className="hack-detail-meta">
          <div className="meta-item reward-big">
            <Trophy size={24} />
            <div>
              <div className="meta-value">{hack.reward} SUI</div>
              <div className="meta-label">Max Reward</div>
            </div>
          </div>
          <div className="meta-item">
            <Lock size={24} className="escrow-locked" />
            <div>
              <div className="meta-value">{hack.escrowStatus}</div>
              <div className="meta-label">Escrow Status</div>
            </div>
          </div>
          <div className="meta-item">
            <Clock size={24} />
            <div>
              <div className="meta-value">{hack.timeLeft}</div>
              <div className="meta-label">Remaining</div>
            </div>
          </div>
          <div className="meta-item">
            <AlertTriangle size={24} />
            <div>
              <div className="meta-value">{hack.solvers}</div>
              <div className="meta-label">Attempting</div>
            </div>
          </div>
        </div>

        <div className="walrus-seal-badge">
          <Shield size={16} />
          <Lock size={16} />
          <span>Findings stored privately on Walrus + Seal encrypted</span>
        </div>
      </div>

      <div className="warning-box">
        <AlertTriangle size={20} />
        <div>
          <strong>Winner Takes All:</strong> Only the first valid submission gets rewarded. 
          Make sure your PoC is complete before submitting.
        </div>
      </div>

      <div className="hack-content">
        <section className="content-section">
          <h2>
            <FileText size={20} />
            Challenge Description
          </h2>
          <p>{hack.description}</p>
        </section>

        <section className="content-section">
          <h2>Severity Rewards</h2>
          <div className="severity-table">
            {hack.severityRewards.map((item, idx) => (
              <div key={idx} className={`severity-row ${item.color}`}>
                <span className="severity-name">{item.severity}</span>
                <span className="severity-reward">{item.reward}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section">
          <h2>Scope</h2>
          <div className="scope-section">
            <div className="scope-group">
              <h3 className="scope-title in-scope">✓ In Scope</h3>
              <ul className="scope-list">
                {hack.scope.inScope.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="scope-group">
              <h3 className="scope-title out-of-scope">✗ Out of Scope</h3>
              <ul className="scope-list">
                {hack.scope.outOfScope.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="content-section">
          <h2>Objectives</h2>
          <ul className="objectives-list">
            {hack.objectives.map((obj, idx) => (
              <li key={idx}>{obj}</li>
            ))}
          </ul>
        </section>

        <section className="content-section">
          <h2>
            <Code size={20} />
            Vulnerable Contract
          </h2>
          <pre className="code-block">
            <code>{hack.contractCode}</code>
          </pre>
        </section>

        <div className="submit-section">
          <button 
            className="btn btn-primary btn-large"
            onClick={() => setShowSubmitModal(true)}
          >
            <Trophy size={20} />
            Submit Proof of Concept
          </button>
          <p className="submit-hint">
            Upload your exploit code and provide a brief explanation of the vulnerability
          </p>
        </div>
      </div>

      {showSubmitModal && (
        <SubmitPoCModal 
          hackTitle={hack.title}
          reward={hack.reward}
          onClose={() => setShowSubmitModal(false)}
        />
      )}
    </div>
  );
}
