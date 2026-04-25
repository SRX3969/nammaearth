import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ExternalLink, Globe, Users } from 'lucide-react';
import LeafLogo from './LeafLogo';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">
              <LeafLogo size={28} />
              <span>NammaEarth</span>
            </div>
            <p className="footer__desc">
              A real-time environmental intelligence platform empowering citizens and city authorities to monitor, report, and improve urban environmental health.
            </p>
            <div className="footer__social">
              <a href="#" className="footer__social-link" aria-label="Twitter"><Globe size={18} /></a>
              <a href="#" className="footer__social-link" aria-label="LinkedIn"><Users size={18} /></a>
              <a href="#" className="footer__social-link" aria-label="GitHub"><ExternalLink size={18} /></a>
            </div>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Platform</h4>
            <Link to="/map" className="footer__link">Live Map</Link>
            <Link to="/statistics" className="footer__link">Statistics</Link>
            <Link to="/leaderboard" className="footer__link">Leaderboard</Link>
            <Link to="/report" className="footer__link">Report Issue</Link>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Resources</h4>
            <a href="#" className="footer__link">API Documentation</a>
            <a href="#" className="footer__link">Data Sources</a>
            <a href="#" className="footer__link">Open Data Portal</a>
            <a href="#" className="footer__link">Research Papers</a>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Contact</h4>
            <a href="mailto:support@nammaearth.in" className="footer__link footer__contact-link">
              <Mail size={14} />
              support@nammaearth.in
            </a>
            <a href="tel:+918001234567" className="footer__link footer__contact-link">
              <Phone size={14} />
              +91 800-123-4567
            </a>
            <span className="footer__link footer__contact-link">
              <MapPin size={14} />
              Bengaluru, Karnataka, India
            </span>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} NammaEarth. All rights reserved.</p>
          <div className="footer__bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
