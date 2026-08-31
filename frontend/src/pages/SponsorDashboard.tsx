import React, { useState } from 'react';
import { Award, Target, Calendar, Map, CheckCircle2, ChevronRight, Globe, Info, Clock, Play } from 'lucide-react';

interface SponsorDashboardProps {
  studies: any[];
}

export default function SponsorDashboard({ studies }: SponsorDashboardProps) {
  const [selectedStudy, setSelectedStudy] = useState<any>(null);

  // SVG representation of India map pins
  const mapSites = [
    { name: 'AIIA Main Campus, New Delhi', lat: '28.52 N', lng: '77.28 E', top: '35%', left: '46%', color: 'var(--color-success)', count: 5 },
    { name: 'Regional Ayurveda Research Institute, Jaipur', lat: '26.91 N', lng: '75.78 E', top: '39%', left: '43%', color: 'var(--color-success)', count: 3 },
    { name: 'AIIA Satellite Centre, Goa', lat: '15.29 N', lng: '74.12 E', top: '65%', left: '41%', color: 'var(--color-success)', count: 2 },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2>Sponsor Portfolio Oversight Panel</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Evaluate global clinical trials portfolio progress, monitoring milestones, site recruitment funnels, and regulatory compliance indexes.
        </p>
      </div>

      {/* KPI row */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Global Portfolio Compliance</span>
            <Award size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <span className="kpi-value" style={{ color: 'var(--color-primary)' }}>92%</span>
          <div className="kpi-trend up">GCP-ASU scorecard baseline</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Sites Active Nationwide</span>
            <Globe size={20} style={{ color: 'var(--color-success)' }} />
          </div>
          <span className="kpi-value">3</span>
          <div className="kpi-trend neutral">Delhi, Jaipur, Goa</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Milestones on Track</span>
            <Target size={20} style={{ color: 'var(--color-info)' }} />
          </div>
          <span className="kpi-value">85%</span>
          <div className="kpi-trend neutral">2 milestones pending</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total subjects randomized</span>
            <Globe size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <span className="kpi-value">10</span>
          <div className="kpi-trend up">Target accrual: 250</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '30px' }}>
        
        {/* Left: Portfolio table */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Research Portfolio Status</h3>
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Trial Study</th>
                  <th>Phase</th>
                  <th>Compliance Score</th>
                  <th>Milestones</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {studies.map((study) => {
                  const msCount = study.milestones?.length || 0;
                  const msDone = study.milestones?.filter((m: any) => m.status === 'Complete').length || 0;
                  const pct = msCount > 0 ? Math.round((msDone / msCount) * 100) : 0;
                  return (
                    <tr
                      key={study.study_id}
                      onClick={() => setSelectedStudy(study)}
                      style={{ cursor: 'pointer', background: selectedStudy?.study_id === study.study_id ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    >
                      <td style={{ fontWeight: 600, maxWidth: '200px' }}>{study.title.substring(0, 50)}...</td>
                      <td>{study.phase}</td>
                      <td>
                        <span className="badge badge-info">{study.compliance_score_pct}%</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{pct}%</span>
                          <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)' }}></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          study.status === 'Active' ? 'badge-success' :
                          study.status === 'Pending_IEC' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {study.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: National Sites Map Pins */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '4px' }}>Trial Coordinates & Sites</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
            Interactive geographical distribution of AIIA clinical site centers.
          </p>

          <div className="map-widget">
            {/* Draw a simulated map grid background */}
            <svg style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.15 }} xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="gray" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Simulated contour of India Map */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              height: '80%',
              border: '2px dashed rgba(255,255,255,0.03)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />

            {mapSites.map((site) => (
              <div
                key={site.name}
                className="map-marker"
                style={{
                  top: site.top,
                  left: site.left,
                  color: site.color
                }}
                title={`${site.name} (${site.count} subjects)`}
                onClick={() => alert(`${site.name}\nCoordinates: ${site.lat}, ${site.lng}\nActive Enrolled Subjects: ${site.count}`)}
              >
                <div style={{
                  position: 'absolute',
                  top: '18px',
                  left: '-50px',
                  width: '120px',
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
                  boxShadow: 'var(--shadow-premium)'
                }}>
                  {site.name.split(',')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAIL VIEW ON SELECT STUDY */}
      {selectedStudy && (
        <div className="glass-card" style={{ padding: '24px', borderTop: '2px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: '6px' }}>Trial Detail Workspace</span>
              <h3>{selectedStudy.title}</h3>
            </div>
            <button className="btn btn-secondary" onClick={() => setSelectedStudy(null)} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
              Hide Details
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
            
            {/* Left Column: Milestones Timeline */}
            <div>
              <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: 'var(--color-primary)' }} /> Milestone Gantt Tracking
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '2px solid var(--glass-border)', paddingLeft: '16px', marginLeft: '8px' }}>
                {selectedStudy.milestones?.map((m: any) => (
                  <div key={m.milestone_id} style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-24px',
                      top: '2px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: m.status === 'Complete' ? 'var(--color-success)' : 'var(--bg-tertiary)',
                      border: '2px solid var(--bg-primary)'
                    }} />
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{m.name}</span>
                        <span className={`badge ${m.status === 'Complete' ? 'badge-success' : 'badge-warning'}`} style={{ padding: '2px 8px', fontSize: '0.65rem' }}>{m.status}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Planned: {m.planned_date} {m.actual_date ? `| Actual: ${m.actual_date}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Compliance score details */}
            <div>
              <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} /> GCP-ASU Compliance Checklist
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedStudy.compliance_scores?.map((sc: any) => (
                  <div
                    key={sc.score_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px'
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{sc.checkpoint}</span>
                    <span className={`badge ${
                      sc.status === 'Met' ? 'badge-success' :
                      sc.status === 'Due' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {sc.status}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/export/ctri/${selectedStudy.study_id}`);
                      if (res.ok) {
                        const xmlText = await res.text();
                        const blob = new Blob([xmlText], { type: 'application/xml' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `CTRI_Export_${selectedStudy.study_id}.xml`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        alert('CTRI-format XML export file downloaded successfully.');
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Export CTRI Schema (XML)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
