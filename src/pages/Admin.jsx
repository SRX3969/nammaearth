import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, AlertCircle, MapPin, Clock, Check, X, Eye, Image as ImageIcon,
  FileText, Loader2, ChevronDown, ChevronUp, Filter,
  ShieldCheck, ShieldAlert, ShieldX, Fingerprint, Lock, LogIn, Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import emailjs from '@emailjs/browser';
import './Admin.css';

// Admin credentials — change these for production
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'NammaEarth@2026';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Admin() {
  // Admin auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard state
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [stats, setStats] = useState({ total: 0, submitted: 0, inProgress: 0, resolved: 0, rejected: 0 });
  
  // Action state for status updates
  const [selectedAction, setSelectedAction] = useState({ reportId: null, status: null });
  const [adminMessage, setAdminMessage] = useState('');
  const [isNotifying, setIsNotifying] = useState(false);

  // Check if admin session exists in sessionStorage
  useEffect(() => {
    const adminSession = sessionStorage.getItem('nammaearth_admin');
    if (adminSession === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadReports();
    }
  }, [isAuthenticated]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    // Simulate a brief delay for security feel
    setTimeout(() => {
      if (loginForm.username === ADMIN_USERNAME && loginForm.password === ADMIN_PASSWORD) {
        sessionStorage.setItem('nammaearth_admin', 'authenticated');
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError('Invalid credentials. Access denied.');
      }
      setLoginLoading(false);
    }, 800);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('nammaearth_admin');
    setIsAuthenticated(false);
    setLoginForm({ username: '', password: '' });
  };

  const loadReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const enrichedReports = data.map(r => ({
        ...r,
        user_name: r.user_name || 'Citizen',
        user_email: r.user_email || 'Citizen Email Not Available'
      }));
      
      setReports(enrichedReports);
      setStats({
        total: enrichedReports.length,
        submitted: enrichedReports.filter(r => r.status === 'Submitted').length,
        inProgress: enrichedReports.filter(r => r.status === 'In Progress').length,
        resolved: enrichedReports.filter(r => r.status === 'Resolved').length,
        rejected: enrichedReports.filter(r => r.status === 'Rejected').length,
      });
    }
    setLoading(false);
  };

  const handleActionClick = (reportId, status) => {
    setSelectedAction({ reportId, status });
    if (status === 'Resolved') {
      setAdminMessage('This issue has been successfully resolved. Thank you for making NammaEarth cleaner!');
    } else if (status === 'Rejected') {
      setAdminMessage('');
    } else {
      setAdminMessage('');
    }
  };

  const sendEmailNotification = async (report, newStatus, message) => {
    const targetEmail = report.user_email && report.user_email !== 'Citizen Email Not Available' ? report.user_email : '';
    if (!targetEmail) {
      console.warn("Could not send email: User email not available.");
      return true; // Return true to continue DB update even if email is missing
    }

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      alert("⚠️ EmailJS is not configured yet! Please add the EmailJS keys to your .env file to enable automatic background emails.");
      return false; 
    }

    try {
      const templateParams = {
        to_email: targetEmail,
        to_name: report.user_name,
        report_id: `#${report.id.substring(0,8)}`,
        report_type: report.type,
        report_location: report.location,
        new_status: newStatus.toUpperCase(),
        admin_message: message || "No additional message from authorities.",
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      return true;
    } catch (error) {
      console.error("Failed to send email via EmailJS:", error);
      alert("Error sending email automatically. Please check your EmailJS configuration.");
      return false;
    }
  };

  const confirmUpdateStatus = async () => {
    const { reportId, status } = selectedAction;
    setIsNotifying(true);
    
    const report = reports.find(r => r.id === reportId);
    
    // 1. Send the personalized email notification automatically
    const emailSent = await sendEmailNotification(report, status, adminMessage);
    
    if (!emailSent) {
      setIsNotifying(false);
      return; // Stop the process if email configuration failed
    }

    // 2. Update the database (Status only to preserve existing schema)
    const { error } = await supabase
      .from('reports')
      .update({ status: status })
      .eq('id', reportId);

    if (!error) {
      setReports(prev => {
        const updated = prev.map(r => r.id === reportId ? { ...r, status: status } : r);
        setStats({
          total: updated.length,
          submitted: updated.filter(r => r.status === 'Submitted').length,
          inProgress: updated.filter(r => r.status === 'In Progress').length,
          resolved: updated.filter(r => r.status === 'Resolved').length,
          rejected: updated.filter(r => r.status === 'Rejected').length,
        });
        return updated;
      });
      
      const targetEmail = report.user_email !== 'Citizen Email Not Available' ? report.user_email : 'the citizen';
      alert(`✅ Status successfully updated to ${status}.\n\nAn email was automatically sent in the background to: ${targetEmail}`);
    } else {
      alert("Error updating status in database.");
    }
    
    setIsNotifying(false);
    setSelectedAction({ reportId: null, status: null });
    setAdminMessage('');
  };

  const filteredReports = filter === 'All' ? reports : reports.filter(r => r.status === filter);

  const getVerificationBadge = (report) => {
    const status = report.verification_status;
    const score = report.verification_score;
    if (!status && score == null) return null;

    const config = {
      'Genuine': { icon: <ShieldCheck size={14} />, cls: 'admin-verify--genuine' },
      'Needs Review': { icon: <ShieldAlert size={14} />, cls: 'admin-verify--review' },
      'Suspicious': { icon: <ShieldX size={14} />, cls: 'admin-verify--suspicious' },
    };
    const c = config[status] || config['Needs Review'];
    return (
      <span className={`admin-verify-badge ${c.cls}`}>
        {c.icon} {score ?? '?'}/100
      </span>
    );
  };

  // ── Admin Login Screen ──
  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="container">
          <motion.div className="admin-login" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="admin-login__card card">
              <div className="admin-login__icon">
                <Shield size={48} />
              </div>
              <h1 className="admin-login__title">Admin Access</h1>
              <p className="admin-login__desc">
                This dashboard is restricted to authorized government officials. Enter your credentials to continue.
              </p>

              <form onSubmit={handleAdminLogin} className="admin-login__form">
                <div className="form-group">
                  <label className="form-label"><Lock size={14} /> Username</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter admin username"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><Lock size={14} /> Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter admin password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {loginError && (
                  <div className="admin-login__error">
                    <AlertCircle size={14} />
                    <span>{loginError}</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg admin-login__btn" disabled={loginLoading}>
                  {loginLoading ? (
                    <><Loader2 size={18} className="spin" /> Authenticating...</>
                  ) : (
                    <><LogIn size={18} /> Sign In to Dashboard</>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Dashboard (authenticated) ──
  if (loading) {
    return (
      <div className="admin-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 72px)' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <motion.div className="admin-header" initial="hidden" animate="visible" variants={fadeUp}>
          <div className="admin-header__left">
            <Shield size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <h1 className="admin-header__title">Admin Dashboard</h1>
              <p className="admin-header__desc">Government view — Manage and respond to citizen reports</p>
            </div>
          </div>
          <button className="btn btn-ghost admin-logout-btn" onClick={handleAdminLogout}>
            <Lock size={14} /> Logout
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div className="admin-stats" initial="hidden" animate="visible" variants={fadeUp}>
          {[
            { label: 'Total Reports', value: stats.total, color: 'var(--primary)' },
            { label: 'Pending Review', value: stats.submitted, color: '#d97706' },
            { label: 'In Progress', value: stats.inProgress, color: '#2563eb' },
            { label: 'Resolved', value: stats.resolved, color: '#16a34a' },
            { label: 'Rejected', value: stats.rejected, color: '#dc2626' },
          ].map(stat => (
            <div key={stat.label} className="admin-stat card">
              <span className="admin-stat__value" style={{ color: stat.color }}>{stat.value}</span>
              <span className="admin-stat__label">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Filter Tabs */}
        <div className="admin-filters">
          <Filter size={16} />
          {['All', 'Submitted', 'In Progress', 'Resolved', 'Rejected'].map(f => (
            <button key={f} className={`admin-filter ${filter === f ? 'admin-filter--active' : ''}`}
              onClick={() => setFilter(f)}>
              {f} {f !== 'All' && `(${f === 'Submitted' ? stats.submitted : f === 'In Progress' ? stats.inProgress : f === 'Resolved' ? stats.resolved : stats.rejected})`}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="admin-reports">
          {filteredReports.length === 0 ? (
            <div className="admin-empty card">
              <p>No reports found for this filter.</p>
            </div>
          ) : (
            filteredReports.map(report => (
              <motion.div key={report.id} className="admin-report card" layout>
                <div className="admin-report__header" onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}>
                  <div className="admin-report__left">
                    <span className="admin-report__type">{report.type}</span>
                    <span className="admin-report__meta">
                      <MapPin size={12} /> {report.location} · <Clock size={12} /> {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="admin-report__right">
                    {getVerificationBadge(report)}
                    <span className={`badge ${
                      report.status === 'Resolved' ? 'badge-success' :
                      report.status === 'In Progress' ? 'badge-warning' :
                      report.status === 'Rejected' ? 'badge-danger' : 'badge-info'
                    }`}>
                      {report.status}
                    </span>
                    {expandedId === report.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {expandedId === report.id && (
                  <div className="admin-report__body">
                    <div className="admin-report__details">
                      <div className="admin-detail">
                        <span className="admin-detail__label"><AlertCircle size={13} /> Issue Type</span>
                        <span className="admin-detail__value">{report.type}</span>
                      </div>
                      <div className="admin-detail">
                        <span className="admin-detail__label"><MapPin size={13} /> Location</span>
                        <span className="admin-detail__value">{report.location}</span>
                      </div>
                      <div className="admin-detail">
                        <span className="admin-detail__label"><Fingerprint size={13} /> Reported By</span>
                        <span className="admin-detail__value" style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{report.user_name}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{report.user_email}</span>
                        </span>
                      </div>
                      <div className="admin-detail">
                        <span className="admin-detail__label">Severity</span>
                        <span className="admin-detail__value">{report.severity || 'Medium'}</span>
                      </div>
                      <div className="admin-detail">
                        <span className="admin-detail__label">Coordinates</span>
                        <span className="admin-detail__value">
                          {report.lat && report.lng ? `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}` : 'Not provided'}
                        </span>
                      </div>
                    </div>

                    {/* Verification Section */}
                    {report.verification_score != null && (
                      <div className={`admin-verification admin-verification--${(report.verification_status || 'genuine').toLowerCase().replace(' ', '-')}`}>
                        <div className="admin-verification__header">
                          <Fingerprint size={15} />
                          <span className="admin-verification__title">Image Verification</span>
                          <span className={`admin-verify-badge admin-verify--${(report.verification_status || 'genuine').toLowerCase().replace(' ', '-')}`}>
                            {report.verification_status === 'Genuine' && <ShieldCheck size={13} />}
                            {report.verification_status === 'Needs Review' && <ShieldAlert size={13} />}
                            {report.verification_status === 'Suspicious' && <ShieldX size={13} />}
                            {report.verification_status || 'Unknown'} — {report.verification_score}/100
                          </span>
                        </div>
                        <div className="admin-verification__grid">
                          <div className="admin-vfield">
                            <span className="admin-vfield__label">Metadata Valid</span>
                            <span className={`admin-vfield__value ${report.metadata_valid ? 'admin-vfield--pass' : 'admin-vfield--fail'}`}>
                              {report.metadata_valid ? '✓ Valid' : '✗ Invalid'}
                            </span>
                          </div>
                          <div className="admin-vfield">
                            <span className="admin-vfield__label">Location Match</span>
                            <span className={`admin-vfield__value ${report.location_match ? 'admin-vfield--pass' : 'admin-vfield--fail'}`}>
                              {report.location_match ? '✓ Matched' : '✗ Mismatch'}
                            </span>
                          </div>
                          <div className="admin-vfield">
                            <span className="admin-vfield__label">Duplicate</span>
                            <span className={`admin-vfield__value ${!report.is_duplicate ? 'admin-vfield--pass' : 'admin-vfield--fail'}`}>
                              {report.is_duplicate ? '✗ Duplicate' : '✓ Original'}
                            </span>
                          </div>
                          <div className="admin-vfield">
                            <span className="admin-vfield__label">Screenshot</span>
                            <span className={`admin-vfield__value ${!report.is_screenshot ? 'admin-vfield--pass' : 'admin-vfield--fail'}`}>
                              {report.is_screenshot ? '✗ Screenshot' : '✓ Camera'}
                            </span>
                          </div>
                          <div className="admin-vfield">
                            <span className="admin-vfield__label">AI Detected</span>
                            <span className="admin-vfield__value">{report.ai_detected_issue || '—'}</span>
                          </div>
                          <div className="admin-vfield">
                            <span className="admin-vfield__label">AI Confidence</span>
                            <span className={`admin-vfield__value ${(report.ai_confidence || 0) >= 0.6 ? 'admin-vfield--pass' : 'admin-vfield--fail'}`}>
                              {report.ai_confidence ? `${Math.round(report.ai_confidence * 100)}%` : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {report.description && (
                      <div className="admin-report__desc">
                        <span className="admin-detail__label"><FileText size={13} /> Description</span>
                        <p>{report.description}</p>
                      </div>
                    )}

                    {report.image_url && (
                      <div className="admin-report__image">
                        <span className="admin-detail__label"><ImageIcon size={13} /> Evidence Photo</span>
                        <img src={report.image_url} alt="Report evidence" />
                      </div>
                    )}

                    <div className="admin-report__actions">
                      <span className="admin-actions-label">Update Status:</span>
                      <button className={`btn btn-sm admin-action-btn admin-action-btn--progress ${selectedAction.reportId === report.id && selectedAction.status === 'In Progress' ? 'active' : ''}`}
                        onClick={() => handleActionClick(report.id, 'In Progress')}
                        disabled={report.status === 'In Progress' || isNotifying}>
                        <Eye size={14} /> In Progress
                      </button>
                      <button className={`btn btn-sm admin-action-btn admin-action-btn--resolve ${selectedAction.reportId === report.id && selectedAction.status === 'Resolved' ? 'active' : ''}`}
                        onClick={() => handleActionClick(report.id, 'Resolved')}
                        disabled={report.status === 'Resolved' || isNotifying}>
                        <Check size={14} /> Resolved
                      </button>
                      <button className={`btn btn-sm admin-action-btn admin-action-btn--reject ${selectedAction.reportId === report.id && selectedAction.status === 'Rejected' ? 'active' : ''}`}
                        onClick={() => handleActionClick(report.id, 'Rejected')}
                        disabled={report.status === 'Rejected' || isNotifying}>
                        <X size={14} /> Reject
                      </button>
                    </div>

                    {/* Notification Input Panel */}
                    {selectedAction.reportId === report.id && (
                      <motion.div 
                        className="admin-notification-panel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        style={{ marginTop: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      >
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                          {selectedAction.status === 'In Progress' ? 'Message to Citizen (e.g. ETA for resolution):' : 
                           selectedAction.status === 'Rejected' ? 'Reason for Rejection:' : 
                           'Resolution Message:'}
                        </label>
                        <textarea 
                          value={adminMessage}
                          onChange={(e) => setAdminMessage(e.target.value)}
                          placeholder="Type your message here. This will be emailed directly to the citizen..."
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px', fontSize: '0.9rem', marginBottom: '12px', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button 
                            className="btn btn-sm btn-ghost" 
                            onClick={() => setSelectedAction({ reportId: null, status: null })}
                            disabled={isNotifying}
                          >
                            Cancel
                          </button>
                          <button 
                            className="btn btn-sm btn-primary" 
                            onClick={confirmUpdateStatus}
                            disabled={isNotifying}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            {isNotifying ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                            Confirm & Notify User
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
