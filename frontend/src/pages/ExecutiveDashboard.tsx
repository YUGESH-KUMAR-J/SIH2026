import React, { useState } from 'react';
import { Award, Globe, Heart, ShieldAlert, BarChart3, TrendingUp, Layers, X, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface ExecutiveDashboardProps {
  studies: any[];
}

interface SafetyIncident {
  id: number;
  title: string;
  description: string;
  date: string;
  status: 'Active' | 'Escalated' | 'Resolved';
  escalationLevel: number;
  severity: 'Critical' | 'High' | 'Medium';
}

export default function ExecutiveDashboard({ studies }: ExecutiveDashboardProps) {
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<SafetyIncident | null>(null);

  // Map markers with enhanced details
  const mapSites = [
    { 
      id: 1,
      name: 'New Delhi Center', 
      lat: '28.52 N', 
      lng: '77.28 E', 
      top: '28.9%', 
      left: '47.5%', 
      status: 'Active',
      subjects: 4,
      trials: 2,
      studiesCount: 2,
      address: 'AIIA Research Institute, New Delhi'
    },
    { 
      id: 2,
      name: 'Jaipur Center', 
      lat: '26.91 N', 
      lng: '75.78 E', 
      top: '46.7%', 
      left: '40%', 
      status: 'Active',
      subjects: 3,
      trials: 1,
      studiesCount: 1,
      address: 'Rajasthan Medical Research Center, Jaipur'
    },
    { 
      id: 3,
      name: 'Goa Center', 
      lat: '15.29 N', 
      lng: '74.12 E', 
      top: '57.8%', 
      left: '37.5%', 
      status: 'Active',
      subjects: 3,
      trials: 2,
      studiesCount: 1,
      address: 'Coastal Clinical Research Institute, Goa'
    },
  ];

  // Critical safety incidents with escalation tracking
  const safetyIncidents: SafetyIncident[] = [
    {
      id: 1,
      title: 'Adverse Event - Study AY-2024-001',
      description: 'Grade 2 Nausea reported in subject cohort. Follow-up evaluation scheduled.',
      date: '2026-08-28',
      status: 'Escalated',
      escalationLevel: 1,
      severity: 'High'
    },
    {
      id: 2,
      title: 'Protocol Deviation - Data Recording',
      description: 'Missing informed consent documentation for 1 subject. Re-consenting in progress.',
      date: '2026-08-27',
      status: 'Escalated',
      escalationLevel: 2,
      severity: 'Critical'
    },
    {
      id: 3,
      title: 'Equipment Malfunction - Monitoring Device',
      description: 'ECG monitor calibration drift detected. Device under maintenance. Subjects unaffected.',
      date: '2026-08-26',
      status: 'Active',
      escalationLevel: 1,
      severity: 'Medium'
    }
  ];

  // Group trials by therapeutic focus for chart with varied data
  const getChartData = () => {
    const therapeuticAreas = [
      { name: 'Mental Health', value: 2 },
      { name: 'Rheumatology', value: 5 },
      { name: 'Immunology', value: 3 },
      { name: 'Cardiology', value: 7 },
      { name: 'Dermatology', value: 1 }
    ];
    
    return therapeuticAreas.map((area) => ({
      name: area.name,
      Trials: area.value
    }));
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2>Ayush Clinical Trials Command Center</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          National executive oversight of clinical studies under AIIA. Monitors therapeutic trends and GCP safety checkpoints.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active National Trials</span>
            <Layers size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <span className="kpi-value">{studies.length}</span>
          <div className="kpi-trend up">
            <TrendingUp size={12} /> 1 pending approval
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Randomized Subjects</span>
            <Globe size={20} style={{ color: 'var(--color-success)' }} />
          </div>
          <span className="kpi-value">10</span>
          <div className="kpi-trend up">Across all centers</div>
        </div>
        <div 
          className="glass-card kpi-card" 
          style={{ cursor: 'pointer' }}
          onClick={() => setSelectedIncident(safetyIncidents[0])}
        >
          <div className="kpi-header">
            <span className="kpi-title">Critical Safety Incidents</span>
            <ShieldAlert size={20} style={{ color: 'var(--color-danger)' }} />
          </div>
          <span className="kpi-value" style={{ color: 'var(--color-danger)' }}>{safetyIncidents.length}</span>
          <div className="kpi-trend neutral">Click to view escalation status</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Global Compliance Index</span>
            <Award size={20} style={{ color: 'var(--color-info)' }} />
          </div>
          <span className="kpi-value" style={{ color: 'var(--color-info)' }}>92%</span>
          <div className="kpi-trend up">Exceeds Ministry expectations</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
        
        {/* Left: India Map site centers */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '10px' }}>National Clinical Footprint</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>
            AIIA-linked research sites hosting active clinical trial randomizations. Click markers for details.
          </p>

          <div className="map-widget">
            {/* SVG Map of India */}
            <svg 
              viewBox="0 0 800 900" 
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="indiaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#1a3a52', stopOpacity: 0.4 }} />
                  <stop offset="100%" style={{ stopColor: '#0f2438', stopOpacity: 0.4 }} />
                </linearGradient>
              </defs>
              
              {/* Simplified India Outline */}
              <path
                d="M 350,150 L 420,140 L 450,160 L 460,200 L 470,250 L 480,300 L 475,350 L 465,380 L 455,400 L 445,420 L 430,450 L 420,480 L 410,510 L 400,540 L 390,560 L 380,580 L 370,590 L 360,600 L 350,610 L 340,600 L 330,580 L 320,560 L 310,540 L 305,510 L 300,480 L 295,450 L 290,420 L 285,380 L 280,350 L 275,300 L 270,250 L 265,200 L 280,160 L 320,150 Z"
                fill="url(#indiaGradient)"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth="2"
              />
              
              {/* City circles */}
              <circle cx="380" cy="260" r="8" fill="rgba(59, 130, 246, 0.3)" stroke="var(--color-info)" strokeWidth="2" />
              <circle cx="320" cy="420" r="8" fill="rgba(59, 130, 246, 0.3)" stroke="var(--color-info)" strokeWidth="2" />
              <circle cx="300" cy="520" r="8" fill="rgba(59, 130, 246, 0.3)" stroke="var(--color-info)" strokeWidth="2" />
              
              {/* Pulsing animation circles */}
              <circle cx="380" cy="260" r="12" fill="none" stroke="var(--color-info)" strokeWidth="2" opacity="0.6" />
              <circle cx="320" cy="420" r="12" fill="none" stroke="var(--color-info)" strokeWidth="2" opacity="0.6" />
              <circle cx="300" cy="520" r="12" fill="none" stroke="var(--color-info)" strokeWidth="2" opacity="0.6" />
            </svg>

            {mapSites.map((site) => (
              <div
                key={site.id}
                className="map-marker"
                style={{
                  top: site.top,
                  left: site.left,
                  color: 'var(--color-info)',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedSite(site)}
              >
                <div style={{
                  position: 'absolute',
                  top: '18px',
                  left: '-40px',
                  width: '100px',
                  textAlign: 'center',
                  background: 'rgba(11, 15, 25, 0.85)',
                  border: '1px solid var(--glass-border)',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  zIndex: 10
                }}>
                  {site.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Bar chart of therapeutic focus */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <BarChart3 size={20} style={{ color: 'var(--color-primary)' }} /> Therapeutic Specializations
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>
              AIIA clinical trials categorised by therapeutic research domain.
            </p>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a303c" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)' }} />
                <Bar dataKey="Trials" fill="var(--color-primary)" radius={[4, 4, 0, 0]}>
                  {getChartData().map((entry, index) => (
                    <option key={index} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '20px' }}>
            <Heart size={14} style={{ color: 'var(--color-danger)', marginRight: '6px', verticalAlign: 'middle' }} />
            Mental Health, Rheumatology, and Immunology represent the active Ayurveda research priorities.
          </div>
        </div>

      </div>

      {/* Location Details Modal */}
      {selectedSite && (
        <div className="modal-overlay" onClick={() => setSelectedSite(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>{selectedSite.name}</h2>
              <button 
                onClick={() => setSelectedSite(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '24px' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>Location</p>
                <p style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{selectedSite.address}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>Coordinates</p>
                <p style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{selectedSite.lat}, {selectedSite.lng}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>STATUS</p>
                <p style={{ color: 'var(--color-success)', fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedSite.status}</p>
              </div>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>SUBJECTS ENROLLED</p>
                <p style={{ color: 'var(--color-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedSite.subjects}</p>
              </div>
              <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>ACTIVE TRIALS</p>
                <p style={{ color: 'var(--color-info)', fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedSite.trials}</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '12px' }}>Center Performance</p>
              <ul style={{ listStyle: 'none', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <li style={{ marginBottom: '8px' }}>✓ GCP Compliance: 95%</li>
                <li style={{ marginBottom: '8px' }}>✓ Data Entry Accuracy: 98%</li>
                <li>✓ Protocol Adherence: 96%</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Safety Incidents Modal */}
      {selectedIncident && (
        <div className="modal-overlay" onClick={() => setSelectedIncident(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={24} style={{ color: 'var(--color-danger)' }} />
                Critical Safety Incidents
              </h2>
              <button 
                onClick={() => setSelectedIncident(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '24px' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', overflowX: 'auto' }}>
              {safetyIncidents.map((incident) => (
                <button
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  style={{
                    background: selectedIncident.id === incident.id ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                    border: `1px solid ${selectedIncident.id === incident.id ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                    color: 'var(--text-primary)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Incident #{incident.id}
                </button>
              ))}
            </div>

            <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>{selectedIncident.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '16px' }}>
                {selectedIncident.description}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>Reported Date</p>
                  <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{selectedIncident.date}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>Severity</p>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    background: selectedIncident.severity === 'Critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: selectedIncident.severity === 'Critical' ? 'var(--color-danger)' : 'var(--color-warning)'
                  }}>
                    {selectedIncident.severity}
                  </span>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>Escalation Status</p>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    background: selectedIncident.status === 'Escalated' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: selectedIncident.status === 'Escalated' ? 'var(--color-danger)' : 'var(--color-success)'
                  }}>
                    {selectedIncident.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>Escalation Level</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      background: level <= selectedIncident.escalationLevel ? 'var(--color-danger)' : 'var(--bg-tertiary)',
                      color: level <= selectedIncident.escalationLevel ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${level <= selectedIncident.escalationLevel ? 'var(--color-danger)' : 'var(--glass-border)'}`
                    }}
                  >
                    {level}
                  </div>
                ))}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '12px' }}>
                Level {selectedIncident.escalationLevel} of 3 • Requires immediate attention
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
