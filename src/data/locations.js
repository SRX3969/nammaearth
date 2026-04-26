// Bengaluru localities with coordinates and simulated environmental data
export const BANGALORE_CENTER = [12.9716, 77.5946];

export const locations = [
  { id: 1, name: 'Peenya Industrial Area', lat: 13.0300, lng: 77.5200, type: 'industrial', population: 'medium' },
  { id: 2, name: 'Whitefield', lat: 12.9698, lng: 77.7500, type: 'tech-hub', population: 'high' },
  { id: 3, name: 'Electronic City', lat: 12.8456, lng: 77.6603, type: 'tech-hub', population: 'high' },
  { id: 4, name: 'Silk Board', lat: 12.9176, lng: 77.6234, type: 'traffic', population: 'high' },
  { id: 5, name: 'Marathahalli', lat: 12.9591, lng: 77.7009, type: 'residential', population: 'high' },
  { id: 6, name: 'KR Puram', lat: 12.9990, lng: 77.6964, type: 'traffic', population: 'high' },
  { id: 7, name: 'Bellandur', lat: 12.9260, lng: 77.6762, type: 'residential', population: 'high' },
  { id: 8, name: 'Hebbal', lat: 13.0358, lng: 77.5970, type: 'traffic', population: 'medium' },
  { id: 9, name: 'Yelahanka', lat: 13.1007, lng: 77.5963, type: 'residential', population: 'medium' },
  { id: 10, name: 'BTM Layout', lat: 12.9166, lng: 77.6101, type: 'residential', population: 'high' },
  { id: 11, name: 'Indiranagar', lat: 12.9784, lng: 77.6408, type: 'commercial', population: 'high' },
  { id: 12, name: 'Koramangala', lat: 12.9352, lng: 77.6245, type: 'commercial', population: 'high' },
  { id: 13, name: 'Majestic', lat: 12.9767, lng: 77.5713, type: 'traffic', population: 'high' },
  { id: 14, name: 'Jayanagar', lat: 12.9308, lng: 77.5838, type: 'residential', population: 'medium' },
  { id: 15, name: 'Banashankari', lat: 12.9255, lng: 77.5468, type: 'residential', population: 'medium' },
  { id: 16, name: 'Rajajinagar', lat: 12.9900, lng: 77.5530, type: 'residential', population: 'medium' },
];

// Simulated AQI data generator
function generateAQI(locationType) {
  const baseAQI = {
    'industrial': { min: 180, max: 350 },
    'tech-hub': { min: 80, max: 180 },
    'traffic': { min: 140, max: 280 },
    'residential': { min: 50, max: 150 },
    'commercial': { min: 90, max: 200 },
  };
  const range = baseAQI[locationType] || { min: 60, max: 160 };
  return Math.floor(range.min + Math.random() * (range.max - range.min));
}

function getAQICategory(aqi) {
  if (aqi <= 50) return { label: 'Good', color: '#4caf50', bg: '#e8f5e9' };
  if (aqi <= 100) return { label: 'Satisfactory', color: '#8bc34a', bg: '#f1f8e9' };
  if (aqi <= 200) return { label: 'Moderate', color: '#ff9800', bg: '#fff3e0' };
  if (aqi <= 300) return { label: 'Poor', color: '#f44336', bg: '#ffebee' };
  if (aqi <= 400) return { label: 'Very Poor', color: '#9c27b0', bg: '#f3e5f5' };
  return { label: 'Severe', color: '#7e0023', bg: '#fce4ec' };
}

function generatePollutants(aqi) {
  const factor = aqi / 150;
  return {
    pm25: Math.round(15 + factor * 120 + Math.random() * 30),
    pm10: Math.round(30 + factor * 180 + Math.random() * 40),
    no2: Math.round(10 + factor * 60 + Math.random() * 20),
    so2: Math.round(5 + factor * 30 + Math.random() * 10),
    co: +(0.5 + factor * 3 + Math.random() * 1).toFixed(1),
    o3: Math.round(20 + factor * 80 + Math.random() * 25),
    nh3: Math.round(5 + factor * 25 + Math.random() * 10),
  };
}

export function getLocationData() {
  return locations.map(loc => {
    const aqi = generateAQI(loc.type);
    const category = getAQICategory(aqi);
    const pollutants = generatePollutants(aqi);
    const dominantPollutant = aqi > 200 ? 'PM2.5' : aqi > 100 ? 'PM10' : 'O₃';
    return {
      ...loc,
      aqi,
      category,
      pollutants,
      dominantPollutant,
      temperature: Math.round(24 + Math.random() * 10),
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: +(2 + Math.random() * 12).toFixed(1),
      noiseLevel: Math.round(40 + Math.random() * 50),
      waterQuality: Math.random() > 0.3 ? 'Safe' : 'Caution',
      wasteIndex: Math.round(20 + Math.random() * 80),
      greenCover: Math.round(10 + Math.random() * 50),
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  });
}

export function getAQIColor(aqi) {
  if (aqi <= 50) return '#4caf50';
  if (aqi <= 100) return '#8bc34a';
  if (aqi <= 200) return '#ff9800';
  if (aqi <= 300) return '#f44336';
  if (aqi <= 400) return '#9c27b0';
  return '#7e0023';
}

export function getAQICategoryLabel(aqi) {
  return getAQICategory(aqi).label;
}

// Filter categories for map buttons
export const mapFilters = [
  { id: 'industrial', label: 'Industrial & High Pollution Zones', icon: 'Factory', color: '#ef4444' },
  { id: 'traffic', label: 'High Traffic Congestion Areas', icon: 'Car', color: '#f59e0b' },
  { id: 'waste', label: 'Waste Dumping Hotspots', icon: 'Trash2', color: '#8b5cf6' },
  { id: 'residential', label: 'Residential High Population Areas', icon: 'Home', color: '#3b82f6' },
];

// Map layers
export const mapLayers = [
  { id: 'air', label: 'Air Quality', icon: 'Wind', active: true },
  { id: 'waste', label: 'Waste Management', icon: 'Trash2', active: false },
  { id: 'traffic', label: 'Traffic', icon: 'Car', active: false },
  { id: 'weather', label: 'Weather', icon: 'Cloud', active: false },
  { id: 'noise', label: 'Noise', icon: 'Volume2', active: false },
  { id: 'water', label: 'Water Quality', icon: 'Droplets', active: false },
  { id: 'green', label: 'Green Infrastructure', icon: 'TreePine', active: false },
];

// Issue types
export const issueTypes = [
  { id: 'garbage', label: 'Garbage Dumping', icon: 'Trash2', color: '#8b5cf6' },
  { id: 'air', label: 'Air Pollution', icon: 'Wind', color: '#ef4444' },
  { id: 'noise', label: 'Noise Complaint', icon: 'Volume2', color: '#f59e0b' },
  { id: 'water', label: 'Water Leakage', icon: 'Droplets', color: '#3b82f6' },
  { id: 'burning', label: 'Illegal Burning', icon: 'Flame', color: '#dc2626' },
  { id: 'drainage', label: 'Blocked Drainage', icon: 'AlertTriangle', color: '#6b7280' },
];

// Leaderboard data
export function getLeaderboardData() {
  const data = getLocationData();
  return data.sort((a, b) => a.aqi - b.aqi).map((loc, i) => ({
    rank: i + 1,
    ...loc,
    issuesReported: Math.floor(Math.random() * 120) + 5,
    activeUsers: Math.floor(Math.random() * 500) + 50,
    resolvedIssues: Math.floor(Math.random() * 80) + 10,
  }));
}

// Historical AQI data for charts
export function getHistoricalAQI(locationName) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    month,
    aqi: Math.floor(60 + Math.random() * 200),
    pm25: Math.floor(20 + Math.random() * 150),
    pm10: Math.floor(40 + Math.random() * 200),
    no2: Math.floor(10 + Math.random() * 80),
  }));
}

export function getWeeklyAQI() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    aqi: Math.floor(60 + Math.random() * 180),
    temperature: Math.round(24 + Math.random() * 10),
    humidity: Math.round(40 + Math.random() * 40),
  }));
}

// 24-hour historical AQI data (hourly)
export function get24HourAQI() {
  const now = new Date();
  const data = [];
  const baseAQI = 95 + Math.floor(Math.random() * 20);

  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = time.getHours();

    // Simulate diurnal pattern: higher AQI during morning (8-10) and evening (17-20) rush
    let modifier = 0;
    if (hour >= 8 && hour <= 10) modifier = 15 + Math.random() * 10;
    else if (hour >= 17 && hour <= 20) modifier = 20 + Math.random() * 15;
    else if (hour >= 0 && hour <= 5) modifier = -10 - Math.random() * 10;
    else modifier = Math.random() * 10 - 5;

    const aqi = Math.max(30, Math.round(baseAQI + modifier + (Math.random() * 12 - 6)));

    const label = time.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    data.push({
      time: label,
      aqi,
      date: time.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    });
  }

  const aqiValues = data.map(d => d.aqi);
  const minAQI = Math.min(...aqiValues);
  const maxAQI = Math.max(...aqiValues);
  const minIdx = aqiValues.indexOf(minAQI);
  const maxIdx = aqiValues.indexOf(maxAQI);

  return {
    hourly: data,
    min: { value: minAQI, time: data[minIdx]?.time || '' },
    max: { value: maxAQI, time: data[maxIdx]?.time || '' },
    current: data[data.length - 1]?.aqi || baseAQI,
  };
}
