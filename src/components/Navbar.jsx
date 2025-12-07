import { Link, useLocation } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Zap, Trophy, User, Plus, Sparkles } from 'lucide-react';
import WalletConnect from './WalletConnect';

export default function Navbar() {
  const location = useLocation();
  const currentAccount = useCurrentAccount();
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <Zap size={28} />
          <span>BountyChain</span>
        </Link>

        <div className="navbar-links">
          <Link to="/hacks" className={`nav-link ${isActive('/hacks')}`}>
            Challenges
          </Link>
          <Link to="/weekly-challenges" className={`nav-link ${isActive('/weekly-challenges')}`}>
            <Sparkles size={18} />
            Weekly
          </Link>
          <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard')}`}>
            <Trophy size={18} />
            Leaderboard
          </Link>
          {currentAccount && (
            <Link to="/create-bounty" className={`nav-link ${isActive('/create-bounty')}`}>
              <Plus size={18} />
              Create Bounty
            </Link>
          )}
          {currentAccount ? (
            <Link to={`/profile/${currentAccount.address}`} className={`nav-link ${isActive('/profile')}`}>
              <User size={18} />
              Profile
            </Link>
          ) : (
            <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>
              <User size={18} />
              Profile
            </Link>
          )}
        </div>

        <WalletConnect />
      </div>
    </nav>
  );
}
