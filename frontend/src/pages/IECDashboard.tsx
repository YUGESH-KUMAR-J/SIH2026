import React, { useState, useEffect } from 'react';
import { FileText, ClipboardList, CheckCircle2, AlertCircle, XCircle, Clock, BookOpen, PenTool, ShieldAlert } from 'lucide-react';

interface IECDashboardProps {
  user: any;
  refreshTrigger: number;
  refreshData: () => void;
}

export default function IECDashboard({ user, refreshTrigger, refreshData }: IECDashboardProps) {
  const [pendingStudies, setPendingStudies] = useState<any[]>([]);
  const [deviations, setDeviations] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'deviations' | 'reminders'>('pending');
  const [selectedStudy, setSelectedStudy] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Review form states
  const [decision, setDecision] = useState('Approved');
  const [comments, setComments] = useState('');
  const [sigName, setSigName] = useState('');

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/iec/pending');
      if (res.ok) {
        const data = await res.json();
        setPendingStudies(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeviations = async () => {
    try {
      const res = await fetch('/api/iec/deviations');
      if (res.ok) {
        const data = await res.json();
        setDeviations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/iec/reminders');
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchDeviations();
    fetchReminders();
  }, [refreshTrigger]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudy) return;
    if (!sigName) {
      alert('Please enter your digital signature to authenticate this ethical decision.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/iec/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          study_id: selectedStudy.study_id,
          reviewer_id: user.id,
          decision,
          comments,
          signature_base64: btoa(unescape(encodeURIComponent(sigName)))
        })
      });

      if (res.ok) {
        alert(`Ethics Board decision [${decision}] successfully recorded. Audit log block chained.`);
        setSelectedStudy(null);
        setComments('');
        setSigName('');
        fetchPending();
        fetchReminders();
        refreshData();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed to submit review');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDeviation = async (id: string, newStatus: string) => {
    if (!window.confirm(`Mark this protocol deviation as ${newStatus}?`)) return;
    try {
      const res = await fetch(`/api/iec/deviations/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: user.id, status: newStatus })
      });
      if (res.ok) {
        alert('Deviation status updated in GCP ledger.');
        fetchDeviations();
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecertify = async (id: string) => {
    if (!window.confirm('Renew ethics board approval for this study for another calendar year?')) return;
    try {
      const res = await fetch(`/api/iec/reminders/${id}/recertify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: user.id })
      });
      if (res.ok) {
        alert('Ethics certification renewed. Continuing review score updated.');
        fetchReminders();
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2>Ethics Board (IEC) Review Panel</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Evaluate trial protocols, audit protocol deviations, and renew continuing certifications for active studies.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pending Ethics Clearance</span>
            <Clock size={20} style={{ color: 'var(--color-warning)' }} />
          </div>
          <span className="kpi-value">{pendingStudies.length}</span>
          <div className="kpi-trend neutral">Sorting by oldest submission</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Protocol Deviations</span>
            <AlertCircle size={20} style={{ color: 'var(--color-danger)' }} />
          </div>
          <span className="kpi-value" style={{ color: deviations.filter(d => d.status === 'Open').length > 0 ? 'var(--color-danger)' : 'inherit' }}>
            {deviations.filter(d => d.status === 'Open').length}
          </span>
          <div className="kpi-trend neutral">Requires audit action</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Continuing Reviews Due</span>
            <ShieldAlert size={20} style={{ color: 'var(--color-warning)' }} />
          </div>
          <span className="kpi-value" style={{ color: reminders.filter(r => r.status === 'Due').length > 0 ? 'var(--color-warning)' : 'inherit' }}>
            {reminders.filter(r => r.status === 'Due').length}
          </span>
          <div className="kpi-trend neutral">Under 30 days remaining</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px', gap: '20px' }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'pending' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'pending' ? 'var(--color-primary)' : 'var(--text-secondary)',
              padding: '10px 16px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Pending Protocols ({pendingStudies.length})
          </button>
          <button
            onClick={() => setActiveTab('deviations')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'deviations' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'deviations' ? 'var(--color-primary)' : 'var(--text-secondary)',
              padding: '10px 16px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Protocol Deviations ({deviations.filter(d => d.status === 'Open').length})
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'reminders' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'reminders' ? 'var(--color-primary)' : 'var(--text-secondary)',
              padding: '10px 16px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Continuing Reviews ({reminders.filter(r => r.status === 'Due').length})
          </button>
        </div>

        {/* Tab 1: Pending Protocols */}
        {activeTab === 'pending' && (
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Trial Protocol Title</th>
                  <th>Submitted Date</th>
                  <th>Days Pending</th>
                  <th>Required Documents</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingStudies.map((study) => {
                  const daysPending = Math.max(0, Math.round((new Date().getTime() - new Date(study.created_at).getTime()) / (1000 * 60 * 60 * 24)));
                  return (
                    <tr key={study.study_id}>
                      <td style={{ fontWeight: 600, maxWidth: '280px' }}>{study.title}</td>
                      <td>{new Date(study.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${daysPending > 5 ? 'badge-danger' : 'badge-warning'}`}>
                          {daysPending} days pending
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={14} style={{ color: 'var(--color-primary)' }} /> Protocol Document (v1.0)
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-warning">Pending IEC</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => setSelectedStudy(study)}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Review Protocol
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {pendingStudies.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No trial protocols currently pending ethical review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Protocol Deviations */}
        {activeTab === 'deviations' && (
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Trial Title</th>
                  <th>Deviation Details</th>
                  <th>Severity</th>
                  <th>Reported Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deviations.map((dev) => (
                  <tr key={dev.deviation_id}>
                    <td style={{ fontWeight: 600, maxWidth: '200px' }}>{dev.study_title}</td>
                    <td>{dev.description}</td>
                    <td>
                      <span className={`badge ${dev.severity === 'Major' ? 'badge-danger' : 'badge-warning'}`}>
                        {dev.severity}
                      </span>
                    </td>
                    <td>{new Date(dev.reported_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${dev.status === 'Open' ? 'badge-danger' : 'badge-success'}`}>
                        {dev.status}
                      </span>
                    </td>
                    <td>
                      {dev.status === 'Open' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleResolveDeviation(dev.deviation_id, 'Reviewed')}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'var(--color-success)' }}
                          >
                            Acknowledge
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.8rem' }}>Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {deviations.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No protocol deviations recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Continuing Review Reminders */}
        {activeTab === 'reminders' && (
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Trial Title</th>
                  <th>Compliance Checkpoint</th>
                  <th>Last Evaluation</th>
                  <th>Current Scorecard Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((rem) => (
                  <tr key={rem.score_id}>
                    <td style={{ fontWeight: 600, maxWidth: '240px' }}>{rem.study_title}</td>
                    <td>{rem.checkpoint}</td>
                    <td>{new Date(rem.computed_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${rem.status === 'Met' ? 'badge-success' : 'badge-warning'}`}>
                        {rem.status === 'Met' ? 'Approved / Met' : 'Renewal Due'}
                      </span>
                    </td>
                    <td>
                      {rem.status !== 'Met' ? (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleRecertify(rem.score_id)}
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          Recertify Approval
                        </button>
                      ) : (
                        <span style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '0.8rem' }}>Certified</span>
                      )}
                    </td>
                  </tr>
                ))}
                {reminders.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No continuing reviews currently due.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL REVIEW SLIDE-IN DRAWER */}
      {selectedStudy && (
        <div className="drawer-overlay" onClick={() => setSelectedStudy(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ width: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
              <div>
                <span className="badge badge-warning" style={{ marginBottom: '6px' }}>Board Ethics Review</span>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '4px' }}>Protocol Evaluation</h3>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedStudy(null)}
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Close Drawer
              </button>
            </div>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Clinical Trial Title</label>
                <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500, marginTop: '4px', lineHeight: '1.4' }}>
                  {selectedStudy.title}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Study Phase</label>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedStudy.phase}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Therapeutic Focus</label>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedStudy.therapeutic_area}</p>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Ethical Review Documents</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a
                    href="#download-protocol"
                    onClick={(e) => { e.preventDefault(); alert('Downloading Protocol PDF (v1.0)...'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.85rem',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      color: 'var(--color-primary)',
                      textDecoration: 'none'
                    }}
                  >
                    <BookOpen size={16} /> Clinical_Protocol_AIIA_CTMS.pdf (v1.0)
                  </a>
                </div>
              </div>

              {/* Review Input Section */}
              <form onSubmit={handleReviewSubmit} style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Ethics Board Decision</label>
                  <select
                    className="form-select"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Approved">Approved (Clear Protocol to Start)</option>
                    <option value="Revision_Requested">Revision Requested (Re-submission Required)</option>
                    <option value="Rejected">Rejected (Disallow Study)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Review Board Comments & Conditions</label>
                  <textarea
                    className="form-textarea"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Enter detailed feedback, protocol issues, or conditions of approval..."
                    rows={4}
                    required
                  />
                </div>

                {/* Digital Signature */}
                <div style={{ background: 'rgba(59,130,246,0.03)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <PenTool size={16} /> Authentication e-Signature
                  </label>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Type your full official name below as authorization of this decision. This will be linked to your public key and stored in the tamper-evident log.
                  </p>
                  <input
                    type="text"
                    className="form-input"
                    value={sigName}
                    onChange={(e) => setSigName(e.target.value)}
                    placeholder="Enter Full Name (e.g. Dr. Sunita Sharma)"
                    style={{ width: '100%', fontStyle: 'italic', fontFamily: 'serif', fontSize: '1.1rem' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`btn ${
                    decision === 'Approved' ? 'btn-primary' :
                    decision === 'Rejected' ? 'btn-danger' : 'btn-secondary'
                  }`}
                  style={{ width: '100%', height: '48px', marginTop: '10px', color: '#fff' }}
                  disabled={loading}
                >
                  {loading ? 'Submitting Ethics Board Decision...' : 'Lock Board Decision'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
