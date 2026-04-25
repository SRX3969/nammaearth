import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, AlertCircle, Wind, Users, TrendingDown, ArrowRight,
  BarChart3, Shield, Smartphone, Globe, Zap, Database,
  ChevronRight, Activity, Thermometer, Droplets, Volume2
} from 'lucide-react';
import { getLocationData } from '../data/locations';
import './Home.css';

function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const features = [
  {
    icon: MapPin,
    title: 'Interactive Environmental Maps',
    desc: 'Real-time heatmaps showing air quality, noise levels, waste management, and green cover across Bengaluru.',
    color: 'var(--primary)',
    bg: 'var(--primary-light)',
  },
  {
    icon: AlertCircle,
    title: 'Citizen Issue Reporting',
    desc: 'Report garbage dumping, air pollution, noise complaints, and other environmental issues with photo evidence.',
    color: 'var(--accent)',
    bg: 'var(--accent-light)',
  },
  {
    icon: BarChart3,
    title: 'Data Analytics & Trends',
    desc: 'Comprehensive statistics and historical trend analysis for every locality with interactive charts.',
    color: 'var(--secondary)',
    bg: 'var(--secondary-light)',
  },
  {
    icon: Shield,
    title: 'Government API Integration',
    desc: 'Real-time data from CPCB, IMD, and municipal authorities ensures accuracy and credibility.',
    color: 'var(--sky)',
    bg: 'var(--sky-light)',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    desc: 'Fully responsive interface that works seamlessly across desktops, tablets, and smartphones.',
    color: '#8b5cf6',
    bg: '#f3e8ff',
  },
  {
    icon: Zap,
    title: 'AI-Powered Insights',
    desc: 'Smart environmental assistant that provides personalized recommendations and answers queries.',
    color: '#ec4899',
    bg: '#fce7f3',
  },
];

const techStack = [
  { icon: Globe, label: 'React', desc: 'Frontend Framework' },
  { icon: Database, label: 'Real-time APIs', desc: 'Government Data' },
  { icon: MapPin, label: 'Leaflet Maps', desc: 'Interactive Maps' },
  { icon: Zap, label: 'Gemini AI', desc: 'Smart Assistant' },
];

export default function Home() {
  const [locationData, setLocationData] = useState([]);
  const [currentAQI, setCurrentAQI] = useState(0);

  useEffect(() => {
    const data = getLocationData();
    setLocationData(data);
    const avgAQI = Math.round(data.reduce((sum, d) => sum + d.aqi, 0) / data.length);
    setCurrentAQI(avgAQI);
  }, []);

  const getAQIStatus = (aqi) => {
    if (aqi <= 100) return { label: 'Satisfactory', cls: 'hero-aqi--good' };
    if (aqi <= 200) return { label: 'Moderate', cls: 'hero-aqi--moderate' };
    return { label: 'Poor', cls: 'hero-aqi--poor' };
  };

  const aqiStatus = getAQIStatus(currentAQI);

  return (
    <div className="home">
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__bg-grid" />
          <div className="hero__bg-glow" />
        </div>
        <div className="hero__content container">
          <motion.div
            className="hero__text"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.12 } },
            }}
          >
            <motion.div variants={fadeUp} className="hero__badge">
              <Activity size={14} />
              <span>Live Environmental Monitoring</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="hero__title">
              Real-Time Environmental
              <br />
              <span className="hero__title-accent">Intelligence for Bengaluru</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="hero__subtitle">
              Monitor air quality, track pollution, report issues, and make data-driven decisions 
              for a cleaner, healthier city. Powered by government APIs and citizen participation.
            </motion.p>
            <motion.div variants={fadeUp} className="hero__actions">
              <Link to="/map" className="btn btn-primary btn-lg">
                <MapPin size={18} />
                Explore Map
              </Link>
              <Link to="/report" className="btn btn-outline btn-lg">
                <AlertCircle size={18} />
                Report Issue
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero__card"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="hero-aqi-card">
              <div className="hero-aqi-card__header">
                <Wind size={18} />
                <span>Bengaluru City AQI</span>
                <span className="hero-aqi-card__live">
                  <span className="hero-aqi-card__dot" />
                  Live
                </span>
              </div>
              <div className={`hero-aqi-card__value ${aqiStatus.cls}`}>
                {currentAQI}
              </div>
              <div className="hero-aqi-card__label">{aqiStatus.label}</div>
              <div className="hero-aqi-card__stats">
                <div className="hero-aqi-card__stat">
                  <Thermometer size={14} />
                  <span>29°C</span>
                </div>
                <div className="hero-aqi-card__stat">
                  <Droplets size={14} />
                  <span>62%</span>
                </div>
                <div className="hero-aqi-card__stat">
                  <Wind size={14} />
                  <span>8 km/h</span>
                </div>
              </div>
              <div className="hero-aqi-card__footer">
                Updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== LIVE STATS ===== */}
      <section className="live-stats">
        <div className="container">
          <div className="live-stats__grid">
            <div className="live-stats__card">
              <div className="live-stats__icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Wind size={22} />
              </div>
              <div className="live-stats__info">
                <div className="live-stats__value"><AnimatedCounter end={currentAQI} /></div>
                <div className="live-stats__label">Current AQI</div>
              </div>
            </div>
            <div className="live-stats__card">
              <div className="live-stats__icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <AlertCircle size={22} />
              </div>
              <div className="live-stats__info">
                <div className="live-stats__value"><AnimatedCounter end={2847} /></div>
                <div className="live-stats__label">Issues Reported</div>
              </div>
            </div>
            <div className="live-stats__card">
              <div className="live-stats__icon" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                <Users size={22} />
              </div>
              <div className="live-stats__info">
                <div className="live-stats__value"><AnimatedCounter end={12450} /></div>
                <div className="live-stats__label">Active Citizens</div>
              </div>
            </div>
            <div className="live-stats__card">
              <div className="live-stats__icon" style={{ background: '#fce7f3', color: '#ec4899' }}>
                <TrendingDown size={22} />
              </div>
              <div className="live-stats__info">
                <div className="live-stats__value"><AnimatedCounter end={18} suffix="%" /></div>
                <div className="live-stats__label">Pollution Reduced</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features section">
        <div className="container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <span className="section-header__tag">Features</span>
            <h2 className="section-header__title">Everything You Need for Environmental Monitoring</h2>
            <p className="section-header__desc">
              A comprehensive platform combining real-time data, citizen participation, and AI-powered insights.
            </p>
          </motion.div>

          <div className="features__grid">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="feature-card card"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  custom={i}
                  variants={fadeUp}
                >
                  <div className="feature-card__icon" style={{ background: feature.bg, color: feature.color }}>
                    <Icon size={22} />
                  </div>
                  <h3 className="feature-card__title">{feature.title}</h3>
                  <p className="feature-card__desc">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== LOCALITY SNAPSHOT ===== */}
      <section className="localities section" style={{ background: 'var(--gray-100)' }}>
        <div className="container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <span className="section-header__tag">Live Data</span>
            <h2 className="section-header__title">Real-Time Locality Snapshot</h2>
            <p className="section-header__desc">
              Current environmental conditions across key areas in Bengaluru.
            </p>
          </motion.div>

          <div className="localities__grid">
            {locationData.slice(0, 8).map((loc, i) => (
              <motion.div
                key={loc.id}
                className="locality-card card"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-20px' }}
                custom={i}
                variants={fadeUp}
              >
                <div className="locality-card__header">
                  <h4 className="locality-card__name">{loc.name}</h4>
                  <span
                    className="locality-card__aqi"
                    style={{ background: loc.category.bg, color: loc.category.color }}
                  >
                    AQI {loc.aqi}
                  </span>
                </div>
                <div className="locality-card__meta">
                  <span><Thermometer size={13} /> {loc.temperature}°C</span>
                  <span><Droplets size={13} /> {loc.humidity}%</span>
                  <span><Volume2 size={13} /> {loc.noiseLevel}dB</span>
                </div>
                <div className="locality-card__bar">
                  <div
                    className="locality-card__bar-fill"
                    style={{
                      width: `${Math.min(loc.aqi / 4, 100)}%`,
                      background: loc.category.color,
                    }}
                  />
                </div>
                <div className="locality-card__footer">
                  <span className="locality-card__category">{loc.category.label}</span>
                  <span className="locality-card__time">Updated {loc.lastUpdated}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="localities__cta">
            <Link to="/map" className="btn btn-primary">
              View All on Map <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TECH ===== */}
      <section className="tech section">
        <div className="container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <span className="section-header__tag">Technology</span>
            <h2 className="section-header__title">Built with Modern Technology</h2>
            <p className="section-header__desc">
              Leveraging cutting-edge tools for reliability, speed, and scalability.
            </p>
          </motion.div>

          <div className="tech__grid">
            {techStack.map((tech, i) => {
              const Icon = tech.icon;
              return (
                <motion.div
                  key={tech.label}
                  className="tech-card"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  variants={fadeUp}
                >
                  <div className="tech-card__icon"><Icon size={28} /></div>
                  <div className="tech-card__label">{tech.label}</div>
                  <div className="tech-card__desc">{tech.desc}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta section">
        <div className="container">
          <motion.div
            className="cta__card"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUp}
          >
            <h2 className="cta__title">Ready to Make a Difference?</h2>
            <p className="cta__desc">
              Join thousands of citizens who are actively contributing to a cleaner, greener Bengaluru.
              Start monitoring your locality today.
            </p>
            <div className="cta__actions">
              <Link to="/map" className="btn btn-primary btn-lg">
                Get Started <ArrowRight size={16} />
              </Link>
              <Link to="/chat" className="btn btn-outline btn-lg" style={{ borderColor: '#fff', color: '#fff' }}>
                Talk to AI Assistant
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
