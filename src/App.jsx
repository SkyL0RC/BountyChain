import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import HackList from './pages/HackList';
import HackDetail from './pages/HackDetail';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import CreateBounty from './pages/CreateBounty';
import MiniHack from './pages/MiniHack';
import ReviewSubmissions from './pages/ReviewSubmissions';
import WeeklyChallenges from './pages/WeeklyChallenges';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/hacks" element={<HackList />} />
          <Route path="/hack/:id" element={<HackDetail />} />
          <Route path="/mini-hack" element={<MiniHack />} />
          <Route path="/weekly-challenges" element={<WeeklyChallenges />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile/:address" element={<Profile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-bounty" element={<CreateBounty />} />
          <Route path="/review/:bountyId" element={<ReviewSubmissions />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

