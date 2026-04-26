import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Search, Wind, Thermometer, Droplets, Volume2, TrendingUp,
  Calendar, MapPin, Activity, Filter, Clock, ArrowDown, ArrowUp
} from 'lucide-react';
import { getLocationData, getHistoricalAQI, getWeeklyAQI, get24HourAQI, locations } from '../data/locations';
import './Statistics.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const COLORS = ['#0f6b8a', '#2d8a56', '#e8873a', '#4a9ece', '#8b5cf6', '#ec4899', '#f59e0b'];

export default function Statistics() {
  const [locationData, setLocationData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [historicalData, setHistoricalData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hourlyAQI, setHourlyAQI] = useState(null);

  useEffect(() => {
    const data = getLocationData();
    setLocationData(data);
    setSelectedLocation(data[0]?.name || '');
    setHistoricalData(getHistoricalAQI());
    setWeeklyData(getWeeklyAQI());
    setHourlyAQI(get24HourAQI());
  }, []);

  const currentLoc = locationData.find(l => l.name === selectedLocation) || locationData[0];

  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pollutantBreakdown = currentLoc ? [
    { name: 'PM2.5', value: currentLoc.pollutants.pm25 },
    { name: 'PM10', value: currentLoc.pollutants.pm10 },
    { name: 'NO₂', value: currentLoc.pollutants.no2 },
    { name: 'SO₂', value: currentLoc.pollutants.so2 },
    { name: 'CO', value: Math.round(currentLoc.pollutants.co * 100) },
    { name: 'O₃', value: currentLoc.pollutants.o3 },
    { name: 'NH₃', value: currentLoc.pollutants.nh3 },
  ] : [];

  const aqiComparison = locationData.map(l => ({
    name: l.name.length > 12 ? l.name.slice(0, 12) + '…' : l.name,
    fullName: l.name,
    aqi: l.aqi,
    fill: l.aqi <= 100 ? '#4caf50' : l.aqi <= 200 ? '#ff9800' : '#f44336',
  })).sort((a, b) => a.aqi - b.aqi);

  const wasteData = locationData.map(l => ({
    name: l.name.length > 10 ? l.name.slice(0, 10) + '…' : l.name,
    waste: l.wasteIndex,
    green: l.greenCover,
  }));

  return (
    <div className="statistics">
      <div className="container">
        {/* Header */}
        <motion.div
          className="stats-header"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <div>
            <h1 className="stats-header__title">Environmental Statistics</h1>
            <p className="stats-header__desc">Detailed analytics and trends for Bengaluru localities</p>
          </div>
        </motion.div>

        {/* Location Selector */}
        <motion.div
          className="stats-selector"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <div className="stats-search">
            <Search size={16} className="stats-search__icon" />
            <input
              type="text"
              className="stats-search__input"
              placeholder="Search locality..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="stats-location-chips">
            {filteredLocations.map(loc => (
              <button
                key={loc.id}
                className={`stats-chip ${selectedLocation === loc.name ? 'stats-chip--active' : ''}`}
                onClick={() => { setSelectedLocation(loc.name); setSearchQuery(''); }}
              >
                <MapPin size={13} />
                {loc.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Summary Cards */}
        {currentLoc && (
          <motion.div
            className="stats-summary"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {[
              { icon: Wind, label: 'AQI', value: currentLoc.aqi, sub: currentLoc.category.label, color: currentLoc.category.color },
              { icon: Thermometer, label: 'Temperature', value: `${currentLoc.temperature}°C`, sub: 'Current', color: '#e8873a' },
              { icon: Droplets, label: 'Humidity', value: `${currentLoc.humidity}%`, sub: 'Relative', color: '#3b82f6' },
              { icon: Volume2, label: 'Noise', value: `${currentLoc.noiseLevel} dB`, sub: currentLoc.noiseLevel > 70 ? 'High' : 'Normal', color: '#8b5cf6' },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.label} className="stats-card card" variants={fadeUp}>
                  <div className="stats-card__icon" style={{ background: card.color + '15', color: card.color }}>
                    <Icon size={20} />
                  </div>
                  <div className="stats-card__info">
                    <div className="stats-card__value" style={{ color: card.color }}>{card.value}</div>
                    <div className="stats-card__label">{card.label}</div>
                    <div className="stats-card__sub">{card.sub}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Charts Grid */}
        <div className="stats-charts">
          {/* AQI Trend */}
          <motion.div className="stats-chart card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="stats-chart__header">
              <h3><TrendingUp size={16} /> AQI Monthly Trend</h3>
              <span className="badge badge-info"><Calendar size={12} /> 12 months</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f6b8a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0f6b8a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Area type="monotone" dataKey="aqi" stroke="#0f6b8a" strokeWidth={2} fill="url(#aqiGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pollutant Breakdown */}
          <motion.div className="stats-chart card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="stats-chart__header">
              <h3><Activity size={16} /> Pollutant Breakdown</h3>
              <span className="badge badge-warning">{currentLoc?.dominantPollutant || 'PM2.5'}</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pollutantBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pollutantBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Weekly Weather */}
          <motion.div className="stats-chart card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="stats-chart__header">
              <h3><Thermometer size={16} /> Weekly Weather Trends</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="temperature" stroke="#e8873a" strokeWidth={2} dot={{ r: 4 }} name="Temp (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Humidity (%)" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* 24-Hour Historical AQI */}
          {hourlyAQI && (
            <motion.div className="stats-chart card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <div className="stats-chart__header">
                <h3><Clock size={16} /> Historical Air Quality (24h)</h3>
                <span className="badge badge-info"><Calendar size={12} /> Bangalore</span>
              </div>

              {/* Min / Max badges */}
              <div className="aqi24-summary">
                <div className="aqi24-badge aqi24-badge--current">
                  <span className="aqi24-badge__value">{hourlyAQI.current}</span>
                  <span className="aqi24-badge__label">Current AQI</span>
                </div>
                <div className="aqi24-badge aqi24-badge--min">
                  <ArrowDown size={13} />
                  <span className="aqi24-badge__value">{hourlyAQI.min.value}</span>
                  <span className="aqi24-badge__label">Min · {hourlyAQI.min.time}</span>
                </div>
                <div className="aqi24-badge aqi24-badge--max">
                  <ArrowUp size={13} />
                  <span className="aqi24-badge__value">{hourlyAQI.max.value}</span>
                  <span className="aqi24-badge__label">Max · {hourlyAQI.max.time}</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={hourlyAQI.hourly} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    stroke="#9ca3af"
                    interval={2}
                    angle={-35}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#f1f5f9',
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
                    formatter={(value) => [`AQI: ${value}`, '']}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item ? `${label} — ${item.date}` : label;
                    }}
                  />
                  <Bar dataKey="aqi" radius={[2, 2, 0, 0]} barSize={12}>
                    {hourlyAQI.hourly.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.aqi <= 50 ? '#4caf50' :
                          entry.aqi <= 100 ? '#f59e0b' :
                          entry.aqi <= 200 ? '#f97316' :
                          '#ef4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* AQI Comparison */}
          <motion.div className="stats-chart stats-chart--wide card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="stats-chart__header">
              <h3><Filter size={16} /> AQI Comparison Across Localities</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aqiComparison} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#9ca3af" width={100} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value, name, props) => [value, `AQI — ${props.payload.fullName}`]}
                />
                <Bar dataKey="aqi" radius={[0, 4, 4, 0]} barSize={14}>
                  {aqiComparison.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Waste & Green */}
          <motion.div className="stats-chart stats-chart--wide card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="stats-chart__header">
              <h3><Activity size={16} /> Waste Index vs Green Cover</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={wasteData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="waste" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} name="Waste Index" />
                <Bar dataKey="green" fill="#2d8a56" radius={[4, 4, 0, 0]} barSize={16} name="Green Cover %" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
