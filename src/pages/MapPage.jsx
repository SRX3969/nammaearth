import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wind, Trash2, Car, Cloud, Volume2, Droplets, TreePine, Home,
  Factory, Layers, ChevronRight, X, Thermometer, Activity,
  AlertTriangle, RefreshCw, Search, Filter
} from 'lucide-react';
import { getLocationData, mapFilters, mapLayers, BANGALORE_CENTER, getAQIColor } from '../data/locations';
import './MapPage.css';

const iconMap = {
  Wind, Trash2, Car, Cloud, Volume2, Droplets, TreePine, Home, Factory, AlertTriangle
};

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export default function MapPage() {
  const [locationData, setLocationData] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeLayers, setActiveLayers] = useState(['air']);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLayers, setShowLayers] = useState(false);
  const [mapCenter, setMapCenter] = useState(BANGALORE_CENTER);
  const [mapZoom, setMapZoom] = useState(12);

  useEffect(() => {
    const data = getLocationData();
    setLocationData(data);
    const interval = setInterval(() => {
      setLocationData(getLocationData());
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = useMemo(() => {
    let data = [...locationData];
    if (activeFilter) {
      const filterMap = {
        'industrial': ['industrial'],
        'traffic': ['traffic'],
        'waste': data.filter(d => d.wasteIndex > 60).map(d => d.id),
        'residential': ['residential'],
      };
      if (activeFilter === 'waste') {
        data = data.filter(d => d.wasteIndex > 60);
      } else {
        data = data.filter(d => d.type === activeFilter || filterMap[activeFilter]?.includes(d.type));
      }
    }
    if (searchQuery) {
      data = data.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return data;
  }, [locationData, activeFilter, searchQuery]);

  const toggleLayer = (layerId) => {
    setActiveLayers(prev =>
      prev.includes(layerId)
        ? prev.filter(l => l !== layerId)
        : [...prev, layerId]
    );
  };

  const getMarkerRadius = (loc) => {
    if (activeLayers.includes('air')) return Math.max(8, loc.aqi / 15);
    if (activeLayers.includes('noise')) return Math.max(8, loc.noiseLevel / 5);
    if (activeLayers.includes('waste')) return Math.max(8, loc.wasteIndex / 5);
    return 12;
  };

  const getMarkerColor = (loc) => {
    if (activeLayers.includes('air')) return getAQIColor(loc.aqi);
    if (activeLayers.includes('noise')) return loc.noiseLevel > 70 ? '#f44336' : loc.noiseLevel > 50 ? '#ff9800' : '#4caf50';
    if (activeLayers.includes('waste')) return loc.wasteIndex > 60 ? '#8b5cf6' : '#4caf50';
    if (activeLayers.includes('water')) return loc.waterQuality === 'Safe' ? '#3b82f6' : '#f44336';
    if (activeLayers.includes('green')) return loc.greenCover > 30 ? '#4caf50' : '#ff9800';
    return '#3b82f6';
  };

  const refreshData = () => {
    setLocationData(getLocationData());
  };

  return (
    <div className="map-page">
      {/* Left Panel */}
      <aside className="map-sidebar">
        <div className="map-sidebar__header">
          <h2 className="map-sidebar__title">
            <Filter size={18} />
            Controls
          </h2>
          <button className="map-sidebar__refresh" onClick={refreshData} title="Refresh data">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="map-search">
          <Search size={16} className="map-search__icon" />
          <input
            type="text"
            className="map-search__input"
            placeholder="Search locality..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Buttons */}
        <div className="map-filters">
          <h3 className="map-filters__title">Zone Filters</h3>
          {mapFilters.map(filter => {
            const Icon = iconMap[filter.icon] || Wind;
            return (
              <button
                key={filter.id}
                className={`map-filter-btn ${activeFilter === filter.id ? 'map-filter-btn--active' : ''}`}
                onClick={() => setActiveFilter(activeFilter === filter.id ? null : filter.id)}
                style={{
                  '--filter-color': filter.color,
                  '--filter-bg': filter.color + '15',
                }}
              >
                <span className="map-filter-btn__icon" style={{ color: filter.color }}>
                  <Icon size={16} />
                </span>
                <span className="map-filter-btn__label">{filter.label}</span>
              </button>
            );
          })}
        </div>

        {/* Layers */}
        <div className="map-layers">
          <h3 className="map-layers__title">
            <Layers size={16} />
            Map Layers
          </h3>
          {mapLayers.map(layer => {
            const Icon = iconMap[layer.icon] || Wind;
            return (
              <label key={layer.id} className="map-layer-toggle">
                <input
                  type="checkbox"
                  checked={activeLayers.includes(layer.id)}
                  onChange={() => toggleLayer(layer.id)}
                />
                <span className="map-layer-toggle__check" />
                <Icon size={15} />
                <span>{layer.label}</span>
              </label>
            );
          })}
        </div>

        <div className="map-sidebar__stats">
          <div className="map-sidebar__stat">
            <span className="map-sidebar__stat-value">{filteredData.length}</span>
            <span className="map-sidebar__stat-label">Locations</span>
          </div>
          <div className="map-sidebar__stat">
            <span className="map-sidebar__stat-value">
              {filteredData.length > 0
                ? Math.round(filteredData.reduce((s, d) => s + d.aqi, 0) / filteredData.length)
                : 0}
            </span>
            <span className="map-sidebar__stat-label">Avg AQI</span>
          </div>
        </div>
      </aside>

      {/* Map */}
      <div className="map-container">
        <MapContainer
          center={BANGALORE_CENTER}
          zoom={12}
          className="map-leaflet"
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          {filteredData.map(loc => (
            <CircleMarker
              key={loc.id}
              center={[loc.lat, loc.lng]}
              radius={getMarkerRadius(loc)}
              pathOptions={{
                color: getMarkerColor(loc),
                fillColor: getMarkerColor(loc),
                fillOpacity: 0.5,
                weight: 2,
              }}
              eventHandlers={{
                click: () => setSelectedLocation(loc),
              }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{loc.name}</strong>
                  <div>AQI: <span style={{ color: getAQIColor(loc.aqi), fontWeight: 600 }}>{loc.aqi}</span> — {loc.category.label}</div>
                  <div>Temperature: {loc.temperature}°C</div>
                  <div>Humidity: {loc.humidity}%</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Active filter badge */}
        {activeFilter && (
          <div className="map-active-filter">
            <span>Showing: {mapFilters.find(f => f.id === activeFilter)?.label}</span>
            <button onClick={() => setActiveFilter(null)}><X size={14} /></button>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.aside
            className="map-info-panel"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="map-info-panel__header">
              <h3>{selectedLocation.name}</h3>
              <button onClick={() => setSelectedLocation(null)}><X size={18} /></button>
            </div>

            <div className="map-info-panel__aqi" style={{ background: selectedLocation.category.bg }}>
              <div className="map-info-panel__aqi-value" style={{ color: selectedLocation.category.color }}>
                {selectedLocation.aqi}
              </div>
              <div className="map-info-panel__aqi-label" style={{ color: selectedLocation.category.color }}>
                {selectedLocation.category.label}
              </div>
              <div className="map-info-panel__aqi-meta">
                Dominant: {selectedLocation.dominantPollutant} · Updated {selectedLocation.lastUpdated}
              </div>
            </div>

            <div className="map-info-panel__section">
              <h4><Activity size={14} /> Pollutants (µg/m³)</h4>
              <div className="pollutant-grid">
                {[
                  { label: 'PM2.5', value: selectedLocation.pollutants.pm25 },
                  { label: 'PM10', value: selectedLocation.pollutants.pm10 },
                  { label: 'NO₂', value: selectedLocation.pollutants.no2 },
                  { label: 'SO₂', value: selectedLocation.pollutants.so2 },
                  { label: 'CO', value: selectedLocation.pollutants.co },
                  { label: 'O₃', value: selectedLocation.pollutants.o3 },
                  { label: 'NH₃', value: selectedLocation.pollutants.nh3 },
                ].map(p => (
                  <div key={p.label} className="pollutant-item">
                    <span className="pollutant-item__label">{p.label}</span>
                    <span className="pollutant-item__value">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="map-info-panel__section">
              <h4><Cloud size={14} /> Weather</h4>
              <div className="weather-grid">
                <div className="weather-item">
                  <Thermometer size={16} />
                  <div>
                    <span className="weather-item__value">{selectedLocation.temperature}°C</span>
                    <span className="weather-item__label">Temperature</span>
                  </div>
                </div>
                <div className="weather-item">
                  <Droplets size={16} />
                  <div>
                    <span className="weather-item__value">{selectedLocation.humidity}%</span>
                    <span className="weather-item__label">Humidity</span>
                  </div>
                </div>
                <div className="weather-item">
                  <Wind size={16} />
                  <div>
                    <span className="weather-item__value">{selectedLocation.windSpeed} km/h</span>
                    <span className="weather-item__label">Wind Speed</span>
                  </div>
                </div>
                <div className="weather-item">
                  <Volume2 size={16} />
                  <div>
                    <span className="weather-item__value">{selectedLocation.noiseLevel} dB</span>
                    <span className="weather-item__label">Noise Level</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="map-info-panel__section">
              <h4><TreePine size={14} /> Environmental</h4>
              <div className="env-stats">
                <div className="env-stat">
                  <span className="env-stat__label">Water Quality</span>
                  <span className={`badge ${selectedLocation.waterQuality === 'Safe' ? 'badge-success' : 'badge-warning'}`}>
                    {selectedLocation.waterQuality}
                  </span>
                </div>
                <div className="env-stat">
                  <span className="env-stat__label">Waste Index</span>
                  <span className="env-stat__value">{selectedLocation.wasteIndex}/100</span>
                </div>
                <div className="env-stat">
                  <span className="env-stat__label">Green Cover</span>
                  <span className="env-stat__value">{selectedLocation.greenCover}%</span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
