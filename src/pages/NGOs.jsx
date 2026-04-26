import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, MapPin, CheckCircle2, AlertCircle, 
  ArrowLeft, Mail, Percent, FileText, Map as MapIcon 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { ngos, mockComplaints } from '../data/ngoData';
import './NGOs.css';

export default function NGOs() {
  const [selectedNGO, setSelectedNGO] = useState(null);

  const handleBack = () => setSelectedNGO(null);

  return (
    <div className="ngo-page">
      <AnimatePresence mode="wait">
        {!selectedNGO ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="ngo-header">
              <h1>NGO Network</h1>
              <p>Connect with the 16 dedicated environmental NGOs actively working across Bengaluru's localities to resolve civic and ecological issues.</p>
            </div>

            <div className="ngo-grid">
              {ngos.map((ngo) => (
                <motion.div 
                  key={ngo.id} 
                  className="ngo-card"
                  onClick={() => setSelectedNGO(ngo)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="ngo-card__header">
                    <div>
                      <h3 className="ngo-card__title">{ngo.name}</h3>
                      <div className="ngo-card__locality">
                        <MapPin size={14} />
                        {ngo.locality_name}
                      </div>
                    </div>
                    <Building2 size={24} color="var(--primary)" />
                  </div>
                  
                  <div className="ngo-card__stats">
                    <div className="ngo-stat">
                      <span className="ngo-stat__value">{ngo.issues_reported}</span>
                      <span className="ngo-stat__label">Assigned</span>
                    </div>
                    <div className="ngo-stat">
                      <span className="ngo-stat__value">{ngo.issues_resolved}</span>
                      <span className="ngo-stat__label">Resolved</span>
                    </div>
                    <div className="ngo-stat">
                      <span className="ngo-stat__value efficiency">{ngo.efficiency}%</span>
                      <span className="ngo-stat__label">Efficiency</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <button onClick={handleBack} className="ngo-detail__back">
              <ArrowLeft size={18} /> Back to Network
            </button>

            <div className="ngo-detail__header">
              <h2 className="ngo-detail__title">{selectedNGO.name}</h2>
              <div className="ngo-detail__meta">
                <div className="ngo-meta-item">
                  <MapPin size={18} color="var(--primary)" />
                  <span>{selectedNGO.locality_name} (Pin: {selectedNGO.pincode})</span>
                </div>
                <div className="ngo-meta-item">
                  <Mail size={18} color="var(--primary)" />
                  <span>{selectedNGO.contact}</span>
                </div>
                <div className="ngo-meta-item">
                  <Percent size={18} color="var(--primary)" />
                  <span>{selectedNGO.efficiency}% Resolution Rate</span>
                </div>
              </div>
              <p className="ngo-detail__desc">{selectedNGO.description}</p>
            </div>

            <div className="ngo-dashboard">
              <div className="ngo-map-container">
                <h3><MapIcon size={20} style={{display:'inline', marginRight:'8px', verticalAlign:'-3px'}} /> Complaint Heatmap</h3>
                <div className="ngo-map-wrapper">
                  {selectedNGO.lat ? (
                    <MapContainer 
                      center={[selectedNGO.lat, selectedNGO.lng]} 
                      zoom={14} 
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {mockComplaints.filter(c => c.assigned_ngo_id === selectedNGO.id && c.lat).map(complaint => {
                        const colors = {
                          'Pending': '#ef4444',
                          'Verified': '#f59e0b',
                          'In Progress': '#6366f1',
                          'Resolved': '#10b981'
                        };
                        return (
                          <CircleMarker 
                            key={complaint.id} 
                            center={[complaint.lat, complaint.lng]}
                            radius={8}
                            pathOptions={{ fillColor: colors[complaint.status], color: '#fff', weight: 2, fillOpacity: 0.8 }}
                          >
                            <Popup>
                              <strong>{complaint.issue_type}</strong><br/>
                              Status: {complaint.status}
                            </Popup>
                          </CircleMarker>
                        );
                      })}
                    </MapContainer>
                  ) : (
                    <div className="ngo-map-fallback">
                      <MapPin size={40} style={{opacity: 0.5, marginBottom: '1rem'}} />
                      <p>Map visualization unavailable for this locality.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="ngo-complaints">
                <h3><FileText size={20} style={{display:'inline', marginRight:'8px', verticalAlign:'-3px'}} />Assigned Complaints Dashboard</h3>
                <div className="complaint-list">
                  {mockComplaints.filter(c => c.assigned_ngo_id === selectedNGO.id).length > 0 ? (
                    mockComplaints.filter(c => c.assigned_ngo_id === selectedNGO.id).map(complaint => (
                      <div key={complaint.id} className="complaint-item">
                        <div className="complaint-info">
                          <h4>{complaint.issue_type}</h4>
                          <p>ID: {complaint.id} • Assigned: {complaint.date}</p>
                        </div>
                        <div className={`complaint-status ${complaint.status.toLowerCase().replace(' ', '-')}`}>
                          {complaint.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                      <CheckCircle2 size={40} style={{marginBottom: '1rem', opacity: 0.5}} />
                      <p>No active complaints assigned currently.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
