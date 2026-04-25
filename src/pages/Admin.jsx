import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, AlertCircle, MapPin, Clock, Check, X, Eye, Image as ImageIcon,
  FileText, Loader2, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Admin.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Admin() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [stats, setStats] = useState({ total: 0, submitted: 0, inProgress: 0, resolved: 0, rejected: 0 });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReports(data);
      setStats({
        total: data.length,
        submitted: data.filter(r => r.status === 'Submitted').length,
        inProgress: data.filter(r => r.status === 'In Progress').length,
        resolved: data.filter(r => r.status === 'Resolved').length,
        rejected: data.filter(r => r.status === 'Rejected').length,
      });
    }
    setLoading(false);
  };

  const updateStatus = async (reportId, newStatus) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', reportId);

    if (!error) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      // Recalculate stats
      setReports(prev => {
        const updated = prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r);
        setStats({
          total: updated.length,
          submitted: updated.filter(r => r.status === 'Submitted').length,
          inProgress: updated.filter(r => r.status === 'In Progress').length,
          resolved: updated.filter(r => r.status === 'Resolved').length,
          rejected: updated.filter(r => r.status === 'Rejected').length,
        });
        return updated;
      });
    }
  };

  const filteredReports = filter === 'All' ? reports : reports.filter(r => r.status === filter);

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
                      <button className="btn btn-sm admin-action-btn admin-action-btn--progress"
                        onClick={() => updateStatus(report.id, 'In Progress')}
                        disabled={report.status === 'In Progress'}>
                        <Eye size={14} /> In Progress
                      </button>
                      <button className="btn btn-sm admin-action-btn admin-action-btn--resolve"
                        onClick={() => updateStatus(report.id, 'Resolved')}
                        disabled={report.status === 'Resolved'}>
                        <Check size={14} /> Resolved
                      </button>
                      <button className="btn btn-sm admin-action-btn admin-action-btn--reject"
                        onClick={() => updateStatus(report.id, 'Rejected')}
                        disabled={report.status === 'Rejected'}>
                        <X size={14} /> Reject
                      </button>
                    </div>
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
