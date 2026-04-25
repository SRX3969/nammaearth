import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, Eye, EyeOff, ArrowRight,
  MapPin, AlertCircle, Clock, ChevronRight, LogOut,
  Settings, Bell, Bookmark
} from 'lucide-react';
import LeafLogo from '../components/LeafLogo';
import './Login.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!isLogin && !form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.password) newErrors.password = 'Password is required';
    if (form.password.length < 6) newErrors.password = 'Minimum 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsLoggedIn(true);
    }
  };

  // Mock user data for dashboard
  const userData = {
    name: form.name || 'Citizen User',
    email: form.email || 'user@nammaearth.in',
    joined: 'April 2026',
    reportsSubmitted: 12,
    savedLocations: 5,
    recentReports: [
      { id: 1, type: 'Garbage Dumping', location: 'Koramangala', date: 'Apr 24, 2026', status: 'In Progress' },
      { id: 2, type: 'Air Pollution', location: 'Peenya', date: 'Apr 22, 2026', status: 'Resolved' },
      { id: 3, type: 'Noise Complaint', location: 'Indiranagar', date: 'Apr 20, 2026', status: 'Submitted' },
      { id: 4, type: 'Water Leakage', location: 'BTM Layout', date: 'Apr 18, 2026', status: 'Resolved' },
    ],
    savedLocs: [
      { name: 'Koramangala', aqi: 112 },
      { name: 'Indiranagar', aqi: 98 },
      { name: 'BTM Layout', aqi: 85 },
    ],
  };

  if (isLoggedIn) {
    return (
      <div className="profile-page">
        <div className="container">
          <motion.div className="profile-layout" initial="hidden" animate="visible" variants={fadeUp}>
            {/* Profile Sidebar */}
            <div className="profile-sidebar card">
              <div className="profile-avatar">
                <User size={32} />
              </div>
              <h2 className="profile-name">{userData.name}</h2>
              <p className="profile-email">{userData.email}</p>
              <p className="profile-joined"><Clock size={13} /> Member since {userData.joined}</p>

              <div className="profile-stats-row">
                <div className="profile-stat">
                  <span className="profile-stat__value">{userData.reportsSubmitted}</span>
                  <span className="profile-stat__label">Reports</span>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat__value">{userData.savedLocations}</span>
                  <span className="profile-stat__label">Saved</span>
                </div>
              </div>

              <nav className="profile-nav">
                <a className="profile-nav__link profile-nav__link--active">
                  <AlertCircle size={16} /> Report History
                </a>
                <a className="profile-nav__link">
                  <Bookmark size={16} /> Saved Locations
                </a>
                <a className="profile-nav__link">
                  <Bell size={16} /> Notifications
                </a>
                <a className="profile-nav__link">
                  <Settings size={16} /> Settings
                </a>
              </nav>

              <button className="btn btn-ghost profile-logout" onClick={() => setIsLoggedIn(false)}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>

            {/* Main Content */}
            <div className="profile-main">
              {/* Report History */}
              <div className="profile-section card">
                <h3 className="profile-section__title">
                  <AlertCircle size={16} /> Report History
                </h3>
                <div className="report-history">
                  {userData.recentReports.map(report => (
                    <div key={report.id} className="report-history__item">
                      <div className="report-history__info">
                        <span className="report-history__type">{report.type}</span>
                        <span className="report-history__meta">
                          <MapPin size={12} /> {report.location} · {report.date}
                        </span>
                      </div>
                      <span className={`badge ${
                        report.status === 'Resolved' ? 'badge-success' :
                        report.status === 'In Progress' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saved Locations */}
              <div className="profile-section card">
                <h3 className="profile-section__title">
                  <Bookmark size={16} /> Saved Locations
                </h3>
                <div className="saved-locations">
                  {userData.savedLocs.map(loc => (
                    <div key={loc.name} className="saved-location">
                      <div className="saved-location__info">
                        <MapPin size={14} style={{ color: 'var(--primary)' }} />
                        <span>{loc.name}</span>
                      </div>
                      <span className={`badge ${loc.aqi <= 100 ? 'badge-success' : 'badge-warning'}`}>
                        AQI {loc.aqi}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <motion.div className="login-card" initial="hidden" animate="visible" variants={fadeUp}>
          <div className="login-brand">
            <div className="login-brand__icon">
              <LeafLogo size={40} />
            </div>
            <h1 className="login-brand__title">NammaEarth</h1>
            <p className="login-brand__desc">
              {isLogin ? 'Welcome back! Sign in to continue.' : 'Create an account to get started.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="login-tabs">
            <button
              className={`login-tab ${isLogin ? 'login-tab--active' : ''}`}
              onClick={() => { setIsLogin(true); setErrors({}); }}
            >
              Sign In
            </button>
            <button
              className={`login-tab ${!isLogin ? 'login-tab--active' : ''}`}
              onClick={() => { setIsLogin(false); setErrors({}); }}
            >
              Sign Up
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  className="form-group"
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="form-label"><User size={15} /> Full Name</label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={e => handleChange('name', e.target.value)}
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group">
              <label className="form-label"><Mail size={15} /> Email Address</label>
              <input
                type="email"
                className="login-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label"><Lock size={15} /> Password</label>
              <div className="login-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            {isLogin && (
              <div className="login-extras">
                <label className="login-remember">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="login-forgot">Forgot password?</a>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg login-submit">
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="login-footer-text">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button className="login-switch" onClick={() => { setIsLogin(!isLogin); setErrors({}); }}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
