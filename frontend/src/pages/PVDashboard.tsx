import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, RefreshCw, Activity, ArrowRight, HeartPulse, ShieldCheck, MapPin, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface PVDashboardProps {
  user: any;
  refreshTrigger: number;
}

export default function PVDashboard({ user, refreshTrigger }: PVDashboardProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tickerTime, setTickerTime] = useState(new Date().getTime());

  // Background ticker to decrement countdowns every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerTime(new Date().getTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/ae');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshTrigger]);

  const handleResolveEvent = async (aeId: string) => {
    if (!window.confirm('Confirm that all regulatory documents for this SAE have been filed and you wish to close this safety case?')) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/ae/${aeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: user.id })
      });
      if (res.ok) {
        alert('Safety case resolved and closed. Compliance scores updated.');
        setSelectedEvent(null);
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Process event calculations live
  const getProcessedEvents = () => {
    return events.map((e) => {
      if (e.status === 'Closed') {
        return { ...e, remaining_str: 'Resolved', remaining_seconds: -1, pct: 100, colorClass: 'badge-success' };
      }

      const deadline = new Date(e.report_deadline).getTime();
      const onset = new Date(e.onset_datetime).getTime();
      const total = deadline - onset;
      const elapsed = tickerTime - onset;
      const remainingMs = deadline - tickerTime;

      const remainingSecs = Math.max(0, Math.round(remainingMs / 1000));
      const pct = Math.min(100, Math.round((elapsed / total) * 100));

      let remainingStr = '';
      let colorClass = 'countdown-green';
      let borderStyle = '1px solid var(--glass-border)';

      if (remainingSecs <= 0 || e.status === 'Breached') {
        remainingStr = 'BREACHED';
        colorClass = 'countdown-red';
        borderStyle = '2px solid var(--color-danger)';
      } else {
        const hrs = Math.floor(remainingSecs / 3600);
        const mins = Math.floor((remainingSecs % 3600) / 60);
        const secs = remainingSecs % 60;
        remainingStr = `${hrs}h ${mins}m ${secs}s`;

        if (hrs < 4) {
          colorClass = 'countdown-red';
          borderStyle = '2px solid var(--color-danger)';
        } else if (hrs < 12) {
          colorClass = 'countdown-yellow';
          borderStyle = '2px solid var(--color-warning)';
        }
      }

      return {
        ...e,
        remaining_seconds: remainingSecs,
        remaining_str: remainingStr,
        pct,
        colorClass,
        borderStyle
      };
    });
  };

  const processedEvents = getProcessedEvents();
  const openSaes = processedEvents.filter(e => e.event_type === 'SAE' && e.status !== 'Closed');
  const breachedSaes = processedEvents.filter(e => e.status === 'Breached');

  // Heatmap Data (Drug x Symptoms)
  const heatmapData = [
    { drug: 'Ashwagandha', symptom: 'Headache', count: 4, intensity: 'low' },
    { drug: 'Ashwagandha', symptom: 'Gastric Hemorrhage', count: 1, intensity: 'medium' },
    { drug: 'Ashwagandha', symptom: 'Anaphylaxis', count: 1, intensity: 'medium' },
    { drug: 'Ashwagandha', symptom: 'Liver Elevation', count: 0, intensity: 'none' },

    { drug: 'Ayush-64', symptom: 'Headache', count: 1, intensity: 'low' },
    { drug: 'Ayush-64', symptom: 'Gastric Hemorrhage', count: 0, intensity: 'none' },
    { drug: 'Ayush-64', symptom: 'Anaphylaxis', count: 0, intensity: 'none' },
    { drug: 'Ayush-64', symptom: 'Liver Elevation', count: 2, intensity: 'high' },

    { drug: 'Haridra', symptom: 'Headache', count: 0, intensity: 'none' },
    { drug: 'Haridra', symptom: 'Gastric Hemorrhage', count: 0, intensity: 'none' },
    { drug: 'Haridra', symptom: 'Anaphylaxis', count: 0, intensity: 'none' },
    { drug: 'Haridra', symptom: 'Liver Elevation', count: 0, intensity: 'none' },
  ];

  // Chart data
  const trendData = [
    { name: 'Mar', AEs: 2, SAEs: 0 },
    { name: 'Apr', AEs: 4, SAEs: 1 },
    { name: 'May', AEs: 5, SAEs: 0 },
    { name: 'Jun', AEs: 8, SAEs: 2 },
    { name: 'Jul', AEs: 12, SAEs: 1 },
    { name: 'Aug', AEs: 15, SAEs: 3 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>National Pharmacovigilance Control Panel</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            ASU&H drug safety coordinator view. Tracks clinical trials adverse event signals and enforces NDCT Rules 2019 report thresholds.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchEvents}>
          <RefreshCw size={16} /> Refresh Feeds
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Open SAEs</span>
            <ShieldAlert size={20} style={{ color: 'var(--color-warning)' }} />
          </div>
          <span className="kpi-value" style={{ color: openSaes.length > 0 ? 'var(--color-warning)' : 'inherit' }}>
            {openSaes.length}
          </span>
          <div className="kpi-trend neutral">Require action under 24h</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Breached Regulatory Windows</span>
            <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />
          </div>
          <span className="kpi-value" style={{ color: breachedSaes.length > 0 ? 'var(--color-danger)' : 'inherit' }}>
            {breachedSaes.length}
          </span>
          <div className="kpi-trend neutral">Compliance scorecard impacted</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Signal Alerts Generated</span>
            <Activity size={20} style={{ color: 'var(--color-info)' }} />
          </div>
          <span className="kpi-value" style={{ color: 'var(--color-info)' }}>2</span>
          <div className="kpi-trend neutral">Liver enzymes & headaches</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Resolved Safety Cases</span>
            <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
          </div>
          <span className="kpi-value">
            {processedEvents.filter(e => e.status === 'Closed').length}
          </span>
          <div className="kpi-trend up">Closed GCP records</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '30px' }}>
        
        {/* Left Side: Live SAE Countdowns */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} style={{ color: 'var(--color-primary)' }} /> Live Safety Report Tickers
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Regulatory countdown under Drugs & Clinical Trials Rules 2019. Color codes reflect risk profile.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {processedEvents.filter(e => e.status !== 'Closed').map((e) => (
              <div
                key={e.ae_id}
                className="glass-card"
                onClick={() => setSelectedEvent(e)}
                style={{
                  padding: '20px',
                  cursor: 'pointer',
                  border: e.borderStyle,
                  background: 'rgba(255, 255, 255, 0.01)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Subject: {e.subject_id} | Trial: {e.study_title.substring(0, 30)}...
                    </span>
                    <h4 style={{ marginTop: '4px', fontSize: '1rem', color: '#fff' }}>{e.description}</h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${
                      e.remaining_seconds === 0 ? 'badge-danger' :
                      e.remaining_seconds < 14400 ? 'badge-danger' : // Under 4 hours
                      e.remaining_seconds < 43200 ? 'badge-warning' : 'badge-success' // Under 12 hours
                    }`} style={{ fontSize: '0.85rem', padding: '6px 12px', letterSpacing: '0.5px' }}>
                      {e.remaining_str}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Onset: {new Date(e.onset_datetime).toLocaleString()}</span>
                  <span>Escalation Level: {e.escalation_level} / 3</span>
                </div>

                <div className="countdown-bar-container">
                  <div
                    className={`countdown-bar ${e.colorClass}`}
                    style={{ width: `${e.pct}%` }}
                  />
                </div>
              </div>
            ))}

            {processedEvents.filter(e => e.status !== 'Closed').length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
                <CheckCircle size={30} style={{ color: 'var(--color-success)', marginBottom: '8px' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>All safety events are fully processed or resolved.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Trend line chart & Signal Heatmap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Signal Heatmap */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '10px' }}>Active Signal Heatmap</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>
              Aggregate frequency grid: Drug Formulation vs. Safety Symptom.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 'bold' }}></span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Headache</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Gastric</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Anaphylaxis</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Liver</span>

              {/* Rows */}
              {['Ashwagandha', 'Ayush-64', 'Haridra'].map((drug) => (
                <React.Fragment key={drug}>
                  <span style={{ fontWeight: 'bold', textAlign: 'left', display: 'flex', alignItems: 'center' }}>{drug}</span>
                  {['Headache', 'Gastric Hemorrhage', 'Anaphylaxis', 'Liver Elevation'].map((sym) => {
                    const cell = heatmapData.find(h => h.drug === drug && h.symptom === sym);
                    const bg = 
                      cell?.intensity === 'high' ? 'rgba(239, 68, 68, 0.4)' :
                      cell?.intensity === 'medium' ? 'rgba(245, 158, 11, 0.3)' :
                      cell?.intensity === 'low' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)';
                    const color = 
                      cell?.intensity === 'high' ? '#fca5a5' :
                      cell?.intensity === 'medium' ? '#fcd34d' :
                      cell?.intensity === 'low' ? '#93c5fd' : 'var(--text-muted)';
                    return (
                      <div
                        key={sym}
                        className="heatmap-cell"
                        style={{ background: bg, color: color }}
                        title={`${cell?.count} incidents reported`}
                      >
                        {cell?.count}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Trend Chart */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Safety Log Trend Line</h3>
            <div style={{ height: '180px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a303c" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="AEs" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="SAEs" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* DETAIL DRAWER FOR ACTIVE EVENT */}
      {selectedEvent && (
        <div className="drawer-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
              <div>
                <span className="badge badge-danger" style={{ marginBottom: '6px' }}>{selectedEvent.event_type} Safety Case</span>
                <h2>{selectedEvent.subject_id}</h2>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedEvent(null)}
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Close Drawer
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Symptoms / Symptoms Description</label>
                <p style={{ fontSize: '1rem', color: '#fff', fontWeight: 500, marginTop: '4px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px' }}>
                  {selectedEvent.description}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Severity</label>
                  <p style={{ fontWeight: 'bold', color: '#fca5a5' }}>{selectedEvent.severity}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ASU Causality Link</label>
                  <p style={{ fontWeight: 'bold', color: '#fcd34d' }}>{selectedEvent.causality}</p>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Research Trial Study</label>
                <p style={{ fontSize: '0.85rem' }}>{selectedEvent.study_title}</p>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Clinical Site Host</label>
                <p style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} /> {selectedEvent.site_name}
                </p>
              </div>

              {/* Escalation Track */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Escalation Alerts Sent History</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--color-success)' }} />
                    <div>
                      <span style={{ fontWeight: 'bold' }}>Level 0 (PI)</span> — Logged at {new Date(selectedEvent.onset_datetime).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {selectedEvent.escalation_logs?.map((log: any) => (
                    <div
                      key={log.escalation_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.8rem',
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.1)',
                        borderRadius: '6px'
                      }}
                    >
                      <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
                      <div>
                        <span style={{ fontWeight: 'bold' }}>Level {log.level} ({log.notified_role})</span> — Notified at {new Date(log.notified_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleResolveEvent(selectedEvent.ae_id)}
                style={{ width: '100%', background: 'var(--color-success)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
                disabled={loading}
              >
                Resolve & Close Safety Case
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
