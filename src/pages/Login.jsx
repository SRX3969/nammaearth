import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, Eye, EyeOff, ArrowRight,
  MapPin, AlertCircle, Clock, LogOut,
  Settings, Bell, Bookmark, Loader2, Image, FileText, Trash2, X
} from 'lucide-react';
import LeafLogo from '../components/LeafLogo';
import { supabase } from '../lib/supabase';
import './Login.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [savedLocs, setSavedLocs] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [expandedReport, setExpandedReport] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadUserData(session.user.id);
      }
      setCheckingSession(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setReports([]);
        setSavedLocs([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (profileData) setProfile(profileData);

    const { data: reportsData } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (reportsData) setReports(reportsData);

    const { data: locsData } = await supabase
      .from('saved_locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (locsData) setSavedLocs(locsData);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    setAuthError('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setAuthError('');
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email, password: form.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { name: form.name } },
        });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    await supabase.from('profiles').update({ name: newName.trim() }).eq('id', user.id);
    setProfile(prev => ({ ...prev, name: newName.trim() }));
    setEditingName(false);
  };

  const handleDeleteReport = async (reportId) => {
    await supabase.from('reports').delete().eq('id', reportId);
    setReports(prev => prev.filter(r => r.id !== reportId));
    if (expandedReport === reportId) setExpandedReport(null);
  };

  if (checkingSession) {
    return (
      <div className="login-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  // ===== LOGGED-IN DASHBOARD =====
  if (user) {
    const displayName = profile?.name || user.user_metadata?.name || 'Citizen User';
    const displayEmail = profile?.email || user.email;
    const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <div className="profile-page">
        <div className="container">
          <motion.div className="profile-layout" initial="hidden" animate="visible" variants={fadeUp}>
            {/* Sidebar */}
            <div className="profile-sidebar card">
              <div className="profile-avatar">
                <User size={32} />
              </div>
              <h2 className="profile-name">{displayName}</h2>
              <p className="profile-email">{displayEmail}</p>
              <p className="profile-joined"><Clock size={13} /> Member since {joinDate}</p>

              <div className="profile-stats-row">
                <div className="profile-stat">
                  <span className="profile-stat__value">{reports.length}</span>
                  <span className="profile-stat__label">Reports</span>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat__value">{savedLocs.length}</span>
                  <span className="profile-stat__label">Saved</span>
                </div>
              </div>

              <nav className="profile-nav">
                <a className={`profile-nav__link ${activeTab === 'reports' ? 'profile-nav__link--active' : ''}`}
                   onClick={() => setActiveTab('reports')}>
                  <AlertCircle size={16} /> Report History
                </a>
                <a className={`profile-nav__link ${activeTab === 'saved' ? 'profile-nav__link--active' : ''}`}
                   onClick={() => setActiveTab('saved')}>
                  <Bookmark size={16} /> Saved Locations
                </a>
                <a className={`profile-nav__link ${activeTab === 'notifications' ? 'profile-nav__link--active' : ''}`}
                   onClick={() => setActiveTab('notifications')}>
                  <Bell size={16} /> Notifications
                </a>
                <a className={`profile-nav__link ${activeTab === 'settings' ? 'profile-nav__link--active' : ''}`}
                   onClick={() => setActiveTab('settings')}>
                  <Settings size={16} /> Settings
                </a>
              </nav>

              <button className="btn btn-ghost profile-logout" onClick={handleSignOut}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>

            {/* Main Content */}
            <div className="profile-main">
              {/* ===== REPORT HISTORY TAB ===== */}
              {activeTab === 'reports' && (
                <div className="profile-section card">
                  <h3 className="profile-section__title">
                    <AlertCircle size={16} /> Report History
                  </h3>
                  <div className="report-history">
                    {reports.length === 0 ? (
                      <p className="profile-empty">No reports yet. Submit your first report to track environmental issues!</p>
                    ) : (
                      reports.map(report => (
                        <div key={report.id} className="report-history__card">
                          <div className="report-history__item" onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}>
                            <div className="report-history__info">
                              <span className="report-history__type">{report.type}</span>
                              <span className="report-history__meta">
                                <MapPin size={12} /> {report.location} · {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            <span className={`badge ${
                              report.status === 'Resolved' ? 'badge-success' :
                              report.status === 'In Progress' ? 'badge-warning' : 'badge-info'
                            }`}>
                              {report.status}
                            </span>
                          </div>

                          {/* Expanded Report Details */}
                          {expandedReport === report.id && (
                            <motion.div
                              className="report-detail"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <div className="report-detail__grid">
                                <div className="report-detail__field">
                                  <span className="report-detail__label"><AlertCircle size={13} /> Issue Type</span>
                                  <span className="report-detail__value">{report.type}</span>
                                </div>
                                <div className="report-detail__field">
                                  <span className="report-detail__label"><MapPin size={13} /> Location</span>
                                  <span className="report-detail__value">{report.location}</span>
                                </div>
                                <div className="report-detail__field">
                                  <span className="report-detail__label"><Clock size={13} /> Submitted</span>
                                  <span className="report-detail__value">
                                    {new Date(report.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="report-detail__field">
                                  <span className="report-detail__label">Severity</span>
                                  <span className="report-detail__value">{report.severity || 'Medium'}</span>
                                </div>
                              </div>

                              {report.description && (
                                <div className="report-detail__desc">
                                  <span className="report-detail__label"><FileText size={13} /> Description</span>
                                  <p>{report.description}</p>
                                </div>
                              )}

                              {report.image_url && (
                                <div className="report-detail__image">
                                  <span className="report-detail__label"><Image size={13} /> Uploaded Photo</span>
                                  <img src={report.image_url} alt="Report evidence" />
                                </div>
                              )}

                              <div className="report-detail__actions">
                                <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteReport(report.id)}
                                  style={{ color: 'var(--danger)', fontSize: '0.8125rem' }}>
                                  <Trash2 size={14} /> Delete Report
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ===== SAVED LOCATIONS TAB ===== */}
              {activeTab === 'saved' && (
                <div className="profile-section card">
                  <h3 className="profile-section__title">
                    <Bookmark size={16} /> Saved Locations
                  </h3>
                  <div className="saved-locations">
                    {savedLocs.length === 0 ? (
                      <p className="profile-empty">No saved locations yet. Save locations from the map to monitor them.</p>
                    ) : (
                      savedLocs.map(loc => (
                        <div key={loc.id} className="saved-location">
                          <div className="saved-location__info">
                            <MapPin size={14} style={{ color: 'var(--primary)' }} />
                            <span>{loc.name}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ===== NOTIFICATIONS TAB ===== */}
              {activeTab === 'notifications' && (
                <div className="profile-section card">
                  <h3 className="profile-section__title">
                    <Bell size={16} /> Notifications
                  </h3>
                  <div className="notification-list">
                    {reports.length > 0 ? (
                      reports.slice(0, 5).map(report => (
                        <div key={report.id} className="notification-item">
                          <div className="notification-item__icon">
                            <AlertCircle size={16} />
                          </div>
                          <div className="notification-item__content">
                            <p className="notification-item__text">
                              Your report <strong>"{report.type}"</strong> at {report.location} is <strong>{report.status}</strong>
                            </p>
                            <span className="notification-item__time">
                              {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="profile-empty">No notifications yet. Submit a report to receive status updates.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ===== SETTINGS TAB ===== */}
              {activeTab === 'settings' && (
                <div className="profile-section card">
                  <h3 className="profile-section__title">
                    <Settings size={16} /> Account Settings
                  </h3>
                  <div className="settings-group">
                    <div className="settings-item">
                      <label className="settings-item__label">Display Name</label>
                      {editingName ? (
                        <div className="settings-item__edit">
                          <input
                            className="login-input"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Enter new name"
                          />
                          <button className="btn btn-primary btn-sm" onClick={handleUpdateName}>Save</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="settings-item__value">
                          <span>{displayName}</span>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditingName(true); setNewName(displayName); }}>Edit</button>
                        </div>
                      )}
                    </div>
                    <div className="settings-item">
                      <label className="settings-item__label">Email</label>
                      <div className="settings-item__value">
                        <span>{displayEmail}</span>
                      </div>
                    </div>
                    <div className="settings-item">
                      <label className="settings-item__label">Member Since</label>
                      <div className="settings-item__value">
                        <span>{joinDate}</span>
                      </div>
                    </div>
                    <div className="settings-item">
                      <label className="settings-item__label">Total Reports</label>
                      <div className="settings-item__value">
                        <span>{reports.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===== LOGIN/SIGNUP FORM =====
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

          <div className="login-tabs">
            <button className={`login-tab ${isLogin ? 'login-tab--active' : ''}`}
              onClick={() => { setIsLogin(true); setErrors({}); setAuthError(''); }}>Sign In</button>
            <button className={`login-tab ${!isLogin ? 'login-tab--active' : ''}`}
              onClick={() => { setIsLogin(false); setErrors({}); setAuthError(''); }}>Sign Up</button>
          </div>

          {authError && (
            <div className="auth-error-banner">
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div className="form-group" key="name"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <label className="form-label"><User size={15} /> Full Name</label>
                  <input type="text" className="login-input" placeholder="Enter your full name"
                    value={form.name} onChange={e => handleChange('name', e.target.value)} />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group">
              <label className="form-label"><Mail size={15} /> Email Address</label>
              <input type="email" className="login-input" placeholder="you@example.com"
                value={form.email} onChange={e => handleChange('email', e.target.value)} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label"><Lock size={15} /> Password</label>
              <div className="login-password-wrap">
                <input type={showPassword ? 'text' : 'password'} className="login-input" placeholder="Minimum 6 characters"
                  value={form.password} onChange={e => handleChange('password', e.target.value)} />
                <button type="button" className="login-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            {isLogin && (
              <div className="login-extras">
                <label className="login-remember"><input type="checkbox" /><span>Remember me</span></label>
                <a href="#" className="login-forgot">Forgot password?</a>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
              {loading ? (
                <><Loader2 size={16} className="spin" />{isLogin ? 'Signing In...' : 'Creating Account...'}</>
              ) : (
                <>{isLogin ? 'Sign In' : 'Create Account'}<ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="login-footer-text">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button className="login-switch" onClick={() => { setIsLogin(!isLogin); setErrors({}); setAuthError(''); }}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
