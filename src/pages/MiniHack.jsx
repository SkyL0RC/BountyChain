import { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Trophy, Clock, CheckCircle, Lock, Zap } from 'lucide-react';

export default function MiniHack() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [solution, setSolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: Fetch active mini hack from contract
  const currentMiniHack = null;

  const handleSolveChallenge = async (e) => {
    e.preventDefault();
    
    if (!currentAccount) {
      alert('Please connect your wallet first');
      return;
    }

    if (!solution.trim()) {
      alert('Please enter your solution');
      return;
    }

    setIsSubmitting(true);

    try {
      // Solution'ı hash'le (basit - production'da daha güvenli olmalı)
      const encoder = new TextEncoder();
      const data = encoder.encode(solution);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));

      const tx = new Transaction();

      tx.moveCall({
        target: `${import.meta.env.VITE_PACKAGE_ID}::mini_hack::solve_challenge`,
        arguments: [
          tx.object(import.meta.env.VITE_MINI_HACK_REGISTRY_ID),
          tx.object(currentMiniHack.objectId), // MiniHack object ID
          tx.pure.u64(selectedChallenge.id),
          tx.pure.vector('u8', hashArray),
          tx.object('0x6'), // Clock
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Challenge solved!', result);
            alert(`Congratulations! You won ${selectedChallenge.reward} SUI! 🎉`);
            setSelectedChallenge(null);
            setSolution('');
            setIsSubmitting(false);
          },
          onError: (error) => {
            console.error('Solution failed:', error);
            alert('Wrong solution or already claimed. Try again!');
            setIsSubmitting(false);
          }
        }
      );

    } catch (error) {
      console.error('Submit error:', error);
      alert('Error: ' + error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mini-hack-page">
      <div className="page-header">
        <h1>
          <Zap size={32} />
          Weekly Mini Hack
        </h1>
        <p>Quick challenges for beginners. First to solve gets the full reward!</p>
      </div>

      {/* Current Week */}
      <div className="current-mini-hack">
        <div className="mini-hack-header">
          <div className="mini-hack-badge">Week {currentMiniHack.week}</div>
          <h2>{currentMiniHack.title}</h2>
          <p>{currentMiniHack.description}</p>
        </div>

        <div className="mini-hack-stats">
          <div className="stat-item">
            <Trophy size={20} />
            <span>{currentMiniHack.totalPool} SUI</span>
            <small>Total Pool</small>
          </div>
          <div className="stat-item">
            <Clock size={20} />
            <span>{currentMiniHack.endTime}</span>
            <small>Ends</small>
          </div>
          <div className="stat-item status-active">
            <Zap size={20} />
            <span>Active</span>
            <small>Status</small>
          </div>
        </div>

        <div className="challenges-grid">
          {currentMiniHack.challenges.map((challenge) => (
            <div 
              key={challenge.id} 
              className={`challenge-card ${challenge.isClaimed ? 'claimed' : ''}`}
            >
              <div className="challenge-header">
                <span className={`difficulty-badge ${challenge.difficulty}`}>
                  {challenge.difficulty}
                </span>
                <span className="challenge-reward">{challenge.reward} SUI</span>
              </div>

              <p className="challenge-task">{challenge.task}</p>

              {challenge.isClaimed ? (
                <div className="challenge-claimed">
                  <CheckCircle size={16} />
                  <span>Already Claimed</span>
                </div>
              ) : (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setSelectedChallenge(challenge)}
                  disabled={!currentAccount}
                >
                  {currentAccount ? 'Submit Solution' : 'Connect Wallet'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Past Weeks */}
      <section className="past-mini-hacks">
        <h3>Past Weeks</h3>
        <div className="past-weeks-list">
          {pastMiniHacks.map((week) => (
            <div key={week.week} className="past-week-card">
              <div className="past-week-info">
                <div className="week-badge">Week {week.week}</div>
                <div className="week-title">{week.title}</div>
                <div className="week-date">{week.endDate}</div>
              </div>
              <div className="past-week-winner">
                <Trophy size={16} />
                <span>{week.winner}</span>
                <span className="winner-reward">{week.totalEarned} SUI</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Solution Modal */}
      {selectedChallenge && (
        <div className="modal-overlay" onClick={() => setSelectedChallenge(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Solution</h2>
              <p>{selectedChallenge.task}</p>
            </div>

            <div className="modal-body">
              <div className="reward-display">
                <Trophy size={32} />
                <div>
                  <div className="reward-amount">{selectedChallenge.reward} SUI</div>
                  <div className="reward-label">First to solve wins</div>
                </div>
              </div>

              <form onSubmit={handleSolveChallenge}>
                <div className="form-group">
                  <label>Your Solution (hash will be verified on-chain)</label>
                  <textarea
                    className="form-textarea"
                    rows="6"
                    placeholder="Enter your solution, exploit code, or vulnerability description..."
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    required
                  />
                </div>

                <div className="warning-box-modal">
                  <Lock size={20} />
                  <span>Only the first correct solution will receive the reward</span>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={() => setSelectedChallenge(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit & Claim Reward'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
