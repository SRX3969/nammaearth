import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Leaf, MapPin, BarChart3, Trophy, AlertCircle, MessageSquare, User, Sun, Moon, Building2 } from 'lucide-react';
import LeafLogo from './LeafLogo';
import './Navbar.css';

const navLinks = [
  { path: '/', label: 'Home', icon: Leaf },
  { path: '/map', label: 'Map', icon: MapPin },
  { path: '/statistics', label: 'Statistics', icon: BarChart3 },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/report', label: 'Report Issue', icon: AlertCircle },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/ngos', label: 'NGO Network', icon: Building2 },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('nammaearth-theme');
    return saved === 'dark';
  });
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('nammaearth-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <div className="navbar__logo">
            <LeafLogo size={36} />
          </div>
          <span className="navbar__title">NammaEarth</span>
        </Link>

        <div className={`navbar__links ${isOpen ? 'navbar__links--open' : ''}`}>
          {navLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <Link to="/login" className="navbar__login-btn">
            <User size={16} />
            <span>Login</span>
          </Link>
        </div>

        <div className="navbar__actions">
          <button
            className="theme-toggle"
            onClick={() => setDark(!dark)}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="navbar__toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
