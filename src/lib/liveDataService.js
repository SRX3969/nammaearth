/**
 * NammaEarth — Live Data Service
 * Fetches real-time environmental data from Open-Meteo APIs (free, no API key).
 * Applies locality-type offsets so industrial, traffic, residential areas show
 * realistically different AQI values even within the same city grid cell.
 */

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ── Locality-type multipliers (applied on top of live base) ─────────────
// Industrial areas have ~40% more pollution, residential ~20% less, etc.
const TYPE_MULTIPLIER = {
  'industrial':  1.40,
  'traffic':     1.25,
  'tech-hub':    1.05,
  'commercial':  1.10,
  'residential': 0.80,
};

// Per-locality small hash offset so even same-type localities differ slightly
function nameOffset(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h) + name.charCodeAt(i);
    h = h & h;
  }
  return (Math.abs(h) % 21) - 10; // range: -10 to +10
}

function applyLocModifier(value, type, name) {
  const mult = TYPE_MULTIPLIER[type] || 1.0;
  const offset = nameOffset(name || '');
  return Math.max(1, Math.round(value * mult + offset));
}

// ── AQI + Pollutants for a single locality ──────────────────────────────
export async function fetchLiveAQI(lat, lng, locType, locName) {
  const key = `aqi_${locName || `${lat}_${lng}`}`;
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?` +
      `latitude=${lat}&longitude=${lng}` +
      `&current=us_aqi,pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide,ammonia`
    );
    const data = await res.json();
    const c = data.current || {};
    const baseAqi = c.us_aqi ?? null;

    const result = {
      aqi: baseAqi != null ? applyLocModifier(baseAqi, locType, locName) : null,
      pollutants: {
        pm25: applyLocModifier(Math.round(c.pm2_5 ?? 0), locType, locName),
        pm10: applyLocModifier(Math.round(c.pm10 ?? 0), locType, locName),
        no2: applyLocModifier(Math.round(c.nitrogen_dioxide ?? 0), locType, locName),
        so2: applyLocModifier(Math.round(c.sulphur_dioxide ?? 0), locType, locName),
        co: +((c.carbon_monoxide ?? 0) / 1000 * (TYPE_MULTIPLIER[locType] || 1)).toFixed(1),
        o3: applyLocModifier(Math.round(c.ozone ?? 0), locType, locName),
        nh3: applyLocModifier(Math.round(c.ammonia ?? 0), locType, locName),
      },
    };
    setCache(key, result);
    return result;
  } catch {
    return null;
  }
}

// ── Current Weather + 7-day Daily Forecast ──────────────────────────────
export async function fetchLiveWeather(lat, lng, locName) {
  const key = `weather_${locName || `${lat}_${lng}`}`;
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean` +
      `&timezone=Asia/Kolkata&forecast_days=7`
    );
    const data = await res.json();

    // Small per-locality temp/humidity offset so values aren't identical
    const tempOff = (nameOffset(locName || '') % 3); // ±2°C variation
    const humOff = (nameOffset(locName || '') % 5);  // ±4% variation

    // Use realistic Bengaluru defaults if API is missing fields
    const baseTemp = data.current?.temperature_2m ?? 28;
    const baseHum = data.current?.relative_humidity_2m ?? 60;
    const baseWind = data.current?.wind_speed_10m ?? 8;

    // Clamp temperature between 25 and 40
    let finalTemp = Math.round(baseTemp + tempOff);
    finalTemp = Math.max(25, Math.min(40, finalTemp));

    const result = {
      temperature: finalTemp,
      humidity: Math.max(20, Math.min(95, Math.round(baseHum + humOff))),
      windSpeed: +(baseWind).toFixed(1),
      daily: (data.daily?.time || []).map((date, i) => {
        let maxT = data.daily?.temperature_2m_max?.[i] ?? 32;
        let minT = data.daily?.temperature_2m_min?.[i] ?? 22;
        let avgT = (maxT + minT) / 2 + tempOff;
        return {
          day: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
          temperature: Math.max(25, Math.min(40, Math.round(avgT))),
          humidity: Math.max(20, Math.min(95, Math.round((data.daily?.relative_humidity_2m_mean?.[i] ?? 60) + humOff))),
        };
      }),
    };
    setCache(key, result);
    return result;
  } catch {
    return null;
  }
}

// ── 24-Hour Hourly AQI (historical) ─────────────────────────────────────
export async function fetchHourlyAQI(lat, lng, locType, locName) {
  const key = `hourly_${locName || `${lat}_${lng}`}`;
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?` +
      `latitude=${lat}&longitude=${lng}` +
      `&hourly=us_aqi` +
      `&past_hours=24&forecast_hours=1`
    );
    const data = await res.json();
    const times = data.hourly?.time || [];
    const aqis = data.hourly?.us_aqi || [];

    const hourly = times.map((t, i) => {
      const d = new Date(t);
      return {
        time: d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
        aqi: applyLocModifier(aqis[i] ?? 0, locType, locName),
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      };
    });

    const validAqis = hourly.map(d => d.aqi).filter(v => v > 0);
    if (validAqis.length === 0) return null;

    const minAQI = Math.min(...validAqis);
    const maxAQI = Math.max(...validAqis);
    const minIdx = hourly.findIndex(d => d.aqi === minAQI);
    const maxIdx = hourly.findIndex(d => d.aqi === maxAQI);

    const result = {
      hourly,
      min: { value: minAQI, time: hourly[minIdx]?.time || '' },
      max: { value: maxAQI, time: hourly[maxIdx]?.time || '' },
      current: hourly[hourly.length - 1]?.aqi || validAqis[validAqis.length - 1],
    };
    setCache(key, result);
    return result;
  } catch {
    return null;
  }
}

// ── AQI for ALL localities (comparison chart) ───────────────────────────
export async function fetchAllLocalitiesAQI(localities) {
  const key = 'all_localities_aqi';
  const cached = getCached(key);
  if (cached) return cached;

  try {
    // Fetch base AQI once (Bangalore center), then apply per-locality modifiers
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?` +
      `latitude=12.9716&longitude=77.5946&current=us_aqi`
    );
    const data = await res.json();
    const baseAQI = data.current?.us_aqi;
    if (baseAQI == null) return null;

    const results = localities.map(loc => ({
      ...loc,
      aqi: applyLocModifier(baseAQI, loc.type, loc.name),
    }));

    setCache(key, results);
    return results;
  } catch {
    return null;
  }
}
