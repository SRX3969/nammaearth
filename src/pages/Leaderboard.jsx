import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Medal, TrendingUp, TrendingDown, Users, AlertCircle,
  ArrowUp, ArrowDown, MapPin, Award, Star, CheckCircle
} from 'lucide-react';
import { getLeaderboardData, getAQIColor } from '../data/locations';
import './Leaderboard.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [sortBy, setSortBy] = useState('aqi');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    setData(getLeaderboardData());
  }, []);

  const sortedData = [...data].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    return (a[sortBy] - b[sortBy]) * multiplier;
  });

  const cleanest = data.length > 0 ? data[0] : null;
  const mostPolluted = data.length > 0 ? data[data.length - 1] : null;
  const mostActive = [...data].sort((a, b) => b.activeUsers - a.activeUsers)[0];
  const mostReported = [...data].sort((a, b) => b.issuesReported - a.issuesReported)[0];

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder(key === 'aqi' ? 'asc' : 'desc');
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="rank-badge rank-badge--gold"><Trophy size={14} /></span>;
    if (rank === 2) return <span className="rank-badge rank-badge--silver"><Medal size={14} /></span>;
    if (rank === 3) return <span className="rank-badge rank-badge--bronze"><Award size={14} /></span>;
    return <span className="rank-number">{rank}</span>;
  };

  return (
    <div className="leaderboard">
      <div className="container">
        <motion.div className="lb-header" initial="hidden" animate="visible" variants={fadeUp}>
          <h1 className="lb-header__title">Environmental Leaderboard</h1>
          <p className="lb-header__desc">Rankings based on environmental performance across Bengaluru localities</p>
        </motion.div>

        {/* Highlight Cards */}
        <motion.div
          className="lb-highlights"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {[
            { title: 'Cleanest Locality', location: cleanest, icon: Star, color: '#4caf50', bg: '#e8f5e9' },
            { title: 'Most Polluted', location: mostPolluted, icon: AlertCircle, color: '#f44336', bg: '#ffebee' },
            { title: 'Most Active Citizens', location: mostActive, icon: Users, color: '#3b82f6', bg: '#eff6ff', valueKey: 'activeUsers' },
            { title: 'Highest Reporting', location: mostReported, icon: CheckCircle, color: '#8b5cf6', bg: '#f3e8ff', valueKey: 'issuesReported' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.title} className="lb-highlight card" variants={fadeUp}>
                <div className="lb-highlight__icon" style={{ background: card.bg, color: card.color }}>
                  <Icon size={22} />
                </div>
                <div className="lb-highlight__title">{card.title}</div>
                <div className="lb-highlight__location">
                  <MapPin size={14} />
                  {card.location?.name || '—'}
                </div>
                <div className="lb-highlight__value" style={{ color: card.color }}>
                  {card.valueKey
                    ? card.location?.[card.valueKey]?.toLocaleString() || '—'
                    : `AQI ${card.location?.aqi || '—'}`
                  }
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Table */}
        <motion.div className="lb-table-wrapper card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <div className="lb-table-header">
            <h3>Full Rankings</h3>
            <div className="lb-table-sort">
              <span>Sort by:</span>
              {[
                { key: 'aqi', label: 'AQI' },
                { key: 'activeUsers', label: 'Users' },
                { key: 'issuesReported', label: 'Issues' },
              ].map(s => (
                <button
                  key={s.key}
                  className={`lb-sort-btn ${sortBy === s.key ? 'lb-sort-btn--active' : ''}`}
                  onClick={() => handleSort(s.key)}
                >
                  {s.label}
                  {sortBy === s.key && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                </button>
              ))}
            </div>
          </div>

          <div className="lb-table-scroll">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Locality</th>
                  <th>Type</th>
                  <th>AQI</th>
                  <th>Status</th>
                  <th>Active Users</th>
                  <th>Issues Reported</th>
                  <th>Resolved</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((loc, i) => (
                  <tr key={loc.id} className={i < 3 ? 'lb-table__row--top' : ''}>
                    <td className="lb-table__rank">{getRankBadge(i + 1)}</td>
                    <td className="lb-table__name">
                      <MapPin size={14} style={{ color: 'var(--gray-400)' }} />
                      {loc.name}
                    </td>
                    <td>
                      <span className="lb-type-badge">{loc.type}</span>
                    </td>
                    <td>
                      <span className="lb-aqi" style={{ color: getAQIColor(loc.aqi) }}>
                        {loc.aqi}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          loc.aqi <= 100 ? 'badge-success' : loc.aqi <= 200 ? 'badge-warning' : 'badge-danger'
                        }`}
                      >
                        {loc.category.label}
                      </span>
                    </td>
                    <td>{loc.activeUsers.toLocaleString()}</td>
                    <td>{loc.issuesReported}</td>
                    <td>
                      <div className="lb-resolved">
                        <span>{loc.resolvedIssues}</span>
                        <div className="lb-resolved__bar">
                          <div
                            className="lb-resolved__fill"
                            style={{
                              width: `${Math.min((loc.resolvedIssues / loc.issuesReported) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
