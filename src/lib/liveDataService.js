/**
 * NammaEarth — Live Data Service
 * Fetches real-time environmental data from Open-Meteo APIs (free, no API key).
 * - Air Quality API: AQI, PM2.5, PM10, NO2, SO2, CO, O3, NH3
 * - Weather API: Temperature, Humidity, Wind, 7-day forecast
 * All results cached for 5 minutes to avoid excessive API calls.
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

// ── AQI + Pollutants for a single locality ──────────────────────────────
export async function fetchLiveAQI(lat, lng) {
  const key = `aqi_${lat.toFixed(2)}_${lng.toFixed(2)}`;
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
    const result = {
      aqi: c.us_aqi ?? null,
      pollutants: {
        pm25: Math.round(c.pm2_5 ?? 0),
        pm10: Math.round(c.pm10 ?? 0),
        no2: Math.round(c.nitrogen_dioxide ?? 0),
        so2: Math.round(c.sulphur_dioxide ?? 0),
        co: +((c.carbon_monoxide ?? 0) / 1000).toFixed(1), // µg/m³ → mg/m³
        o3: Math.round(c.ozone ?? 0),
        nh3: Math.round(c.ammonia ?? 0),
      },
    };
    setCache(key, result);
    return result;
  } catch {
    return null;
  }
}

// ── Current Weather + 7-day Daily Forecast ──────────────────────────────
export async function fetchLiveWeather(lat, lng) {
  const key = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`;
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
    const result = {
      temperature: Math.round(data.current?.temperature_2m ?? 0),
      humidity: Math.round(data.current?.relative_humidity_2m ?? 0),
      windSpeed: +(data.current?.wind_speed_10m ?? 0).toFixed(1),
      daily: (data.daily?.time || []).map((date, i) => ({
        day: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
        temperature: Math.round(
          ((data.daily.temperature_2m_max?.[i] ?? 0) + (data.daily.temperature_2m_min?.[i] ?? 0)) / 2
        ),
        humidity: Math.round(data.daily.relative_humidity_2m_mean?.[i] ?? 0),
      })),
    };
    setCache(key, result);
    return result;
  } catch {
    return null;
  }
}

// ── 24-Hour Hourly AQI (historical) ─────────────────────────────────────
export async function fetchHourlyAQI(lat, lng) {
  const key = `hourly_${lat.toFixed(2)}_${lng.toFixed(2)}`;
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
        aqi: aqis[i] ?? 0,
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
    const results = await Promise.all(
      localities.map(async (loc) => {
        try {
          const res = await fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?` +
            `latitude=${loc.lat}&longitude=${loc.lng}&current=us_aqi`
          );
          const data = await res.json();
          return { ...loc, aqi: data.current?.us_aqi ?? null };
        } catch {
          return { ...loc, aqi: null };
        }
      })
    );
    const validResults = results.filter(r => r.aqi !== null);
    if (validResults.length > 0) {
      setCache(key, validResults);
      return validResults;
    }
    return null;
  } catch {
    return null;
  }
}
