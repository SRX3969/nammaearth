import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import Statistics from './pages/Statistics';
import Leaderboard from './pages/Leaderboard';
import ReportIssue from './pages/ReportIssue';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Admin from './pages/Admin';
import './App.css';

// Pages where footer should be hidden (full-height layouts)
const FULL_HEIGHT_PAGES = ['/chat', '/map'];

function App() {
  const location = useLocation();
  const hideFooter = FULL_HEIGHT_PAGES.includes(location.pathname);

  return (
    <div className={`app ${hideFooter ? 'app--full-height' : ''}`}>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default App;

