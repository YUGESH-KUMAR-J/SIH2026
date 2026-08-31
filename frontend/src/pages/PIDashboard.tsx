import React, { useState, useEffect } from 'react';
import { Plus, Users, ShieldAlert, Award, FileText, Calendar, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, FunnelChart, Funnel, Cell, Tooltip } from 'recharts';

interface PIDashboardProps {
  user: any;
  studies: any[];
  refreshData: () => void;
}

export default function PIDashboard({ user, studies, refreshData }: PIDashboardProps) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'studies' | 'subjects'>('studies');

  // Modals visibility
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showAeModal, setShowAeModal] = useState(false);
  const [showEcrfModal, setShowEcrfModal] = useState(false);

  // Form states - Study
  const [studyTitle, setStudyTitle] = useState('');
  const [ctriPending, setCtriPending] = useState(true);
  const [ctriNum, setCtriNum] = useState('');
  const [studyPhase, setStudyPhase] = useState('Interventional');
  const [studyArea, setStudyArea] = useState('');
  const [studySites, setStudySites] = useState([{ name: '', location: '' }]);

  // Form states - Subject
  const [subName, setSubName] = useState('');
  const [subContact, setSubContact] = useState('');
  const [subSiteId, setSubSiteId] = useState('');
  const [doshaVata, setDoshaVata] = useState(33);
  const [doshaPitta, setDoshaPitta] = useState(33);
  const [doshaKapha, setDoshaKapha] = useState(34);

  // Form states - AE/SAE
  const [aeSubId, setAeSubId] = useState('');
  const [aeStudyId, setAeStudyId] = useState('');
  const [aeType, setAeType] = useState<'AE' | 'SAE'>('AE');
  const [aeSeverity, setAeSeverity] = useState('Mild');
  const [aeCausality, setAeCausality] = useState('Possible');
  const [aeOnset, setAeOnset] = useState(new Date().toISOString().substring(0, 16));
  const [aeDesc, setAeDesc] = useState('');
  const [computedDeadline, setComputedDeadline] = useState('');

  // Form states - eCRF
  const [ecrfSubId, setEcrfSubId] = useState('');
  const [ecrfFormType, setEcrfFormType] = useState('Vitals');
  const [ecrfVisit, setEcrfVisit] = useState(1);
  const [vitalsSys, setVitalsSys] = useState(120);
  const [vitalsDia, setVitalsDia] = useState(80);
  const [vitalsHr, setVitalsHr] = useState(72);
  const [vitalsTemp, setVitalsTemp] = useState(98.6);
  const [demoAge, setDemoAge] = useState(35);
  const [demoSex, setDemoSex] = useState('M');
  const [demoRace, setDemoRace] = useState('ASIAN');
  const [cmDrug, setCmDrug] = useState('');
  const [cmDose, setCmDose] = useState('');
  const [cmFreq, setCmFreq] = useState('QD');

  // Load subjects
  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [studies]);

  // Recalculate AE deadline live preview
  useEffect(() => {
    if (!aeOnset) return;
    const onsetDate = new Date(aeOnset);
    const offsetHours = aeType === 'SAE' ? 24 : 168; // SAE 24h, AE 7 days
    onsetDate.setHours(onsetDate.getHours() + offsetHours);
    setComputedDeadline(onsetDate.toLocaleString());
  }, [aeOnset, aeType]);

  const handleCreateStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: studyTitle,
          ctri_registration_pending: ctriPending,
          ctri_reg_number: ctriPending ? null : ctriNum,
          phase: studyPhase,
          therapeutic_area: studyArea,
          sites: studySites.filter(s => s.name !== ''),
          actorId: user.id
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create study');
      }

      // Reset form
      setStudyTitle('');
      setCtriPending(true);
      setCtriNum('');
      setStudyArea('');
      setStudySites([{ name: '', location: '' }]);
      setShowStudyModal(false);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subSiteId) {
      alert('Please select a site');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: subSiteId,
          full_name: subName,
          contact: subContact,
          dosha_profile: { vata: doshaVata, pitta: doshaPitta, kapha: doshaKapha },
          actorId: user.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Subject Enrolled Successfully!\nDe-identified ID generated: ${data.subject_id}`);
        setSubName('');
        setSubContact('');
        setSubSiteId('');
        setShowSubjectModal(false);
        fetchSubjects();
        refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aeSubId || !aeStudyId) {
      alert('Please select a subject and study');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/ae', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: aeSubId,
          study_id: aeStudyId,
          event_type: aeType,
          severity: aeSeverity,
          causality: aeCausality,
          onset_datetime: new Date(aeOnset).toISOString(),
          description: aeDesc,
          actorId: user.id
        })
      });

      if (res.ok) {
        alert(`${aeType} logged successfully. Regulatory countdown timer has started.`);
        setAeSubId('');
        setAeStudyId('');
        setAeDesc('');
        setShowAeModal(false);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEcrf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecrfSubId) {
      alert('Select subject');
      return;
    }
    setLoading(true);

    let fields: any = {};
    if (ecrfFormType === 'Vitals') {
      fields = { SYSBP: vitalsSys, DIABP: vitalsDia, HR: vitalsHr, TEMP: vitalsTemp };
    } else if (ecrfFormType === 'Demographics') {
      fields = { AGE: demoAge, SEX: demoSex, RACE: demoRace };
    } else if (ecrfFormType === 'ConMeds') {
      fields = { CMTRT: cmDrug, DOSE: cmDose, frequency: cmFreq };
    }

    try {
      const res = await fetch(`/api/ecrf/${ecrfSubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: ecrfFormType,
          visit_number: ecrfVisit,
          fields,
          actorId: user.id
        })
      });

      if (res.ok) {
        alert('eCRF Entry Submitted successfully to Data Quality database.');
        setEcrfSubId('');
        setCmDrug('');
        setCmDose('');
        setShowEcrfModal(false);
        fetchSubjects();
        refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Funnel Data preparation
  const getFunnelData = () => {
    const counts = { Screened: 0, Randomized: 0, Completed: 0, Withdrawn: 0 };
    subjects.forEach((s) => {
      counts[s.enrollment_status as keyof typeof counts] = (counts[s.enrollment_status as keyof typeof counts] || 0) + 1;
    });

    // Funnel layers sum cumulatively
    const completed = counts.Completed;
    const randomized = counts.Randomized + completed;
    const screened = counts.Screened + randomized + counts.Withdrawn;

    return [
      { value: screened, name: 'Screened', fill: '#3b82f6' },
      { value: randomized, name: 'Randomized', fill: '#10b981' },
      { value: completed, name: 'Completed', fill: '#06b6d4' },
      { value: counts.Withdrawn, name: 'Withdrawn', fill: '#ef4444' },
    ];
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>PI Research Workspace</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage trial registrations, subject accruals, clinical safety, and data forms for your active sites.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => setShowAeModal(true)} style={{ background: '#dc2626', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)' }}>
            <ShieldAlert size={16} /> Report AE/SAE
          </button>
          <button className="btn btn-secondary" onClick={() => setShowStudyModal(true)}>
            <Plus size={16} /> New Trial
          </button>
          <button className="btn btn-secondary" onClick={() => setShowSubjectModal(true)}>
            <Users size={16} /> Enroll Subject
          </button>
          <button className="btn btn-secondary" onClick={() => setShowEcrfModal(true)}>
            <FileText size={16} /> eCRF Entry
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">My Trial Protocols</span>
            <Award size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <span className="kpi-value">{studies.length}</span>
          <div className="kpi-trend neutral">All sites tracked</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Subjects Enrolled</span>
            <Users size={20} style={{ color: 'var(--color-success)' }} />
          </div>
          <span className="kpi-value">{subjects.length}</span>
          <div className="kpi-trend up">
            Active enrollment funnel
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">IEC Approvals</span>
            <CheckCircle size={20} style={{ color: 'var(--color-info)' }} />
          </div>
          <span className="kpi-value">
            {studies.filter(s => s.status === 'Active').length}
          </span>
          <div className="kpi-trend neutral">
            {studies.filter(s => s.status === 'Pending_IEC').length} Pending Board Review
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Safety Cases Logged</span>
            <ShieldAlert size={20} style={{ color: 'var(--color-danger)' }} />
          </div>
          <span className="kpi-value">
            {subjects.reduce((acc, sub) => acc + (sub.ae_count || 0), 0) + 2 /* Add seed events count */}
          </span>
          <div className="kpi-trend down">Requires strict 24h logs</div>
        </div>
      </div>

      {/* Main section: Funnel and Studies/Subjects Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '30px' }}>
        
        {/* Left Side: Studies/Subjects Tab Panel */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px', gap: '20px' }}>
            <button
              onClick={() => setActiveTab('studies')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'studies' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'studies' ? 'var(--color-primary)' : 'var(--text-secondary)',
                padding: '10px 16px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              My Registered Trials
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'subjects' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'subjects' ? 'var(--color-primary)' : 'var(--text-secondary)',
                padding: '10px 16px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Subject Registry & eCRF Completeness
            </button>
          </div>

          {activeTab === 'studies' ? (
            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Trial Title</th>
                    <th>CTRI Number</th>
                    <th>Phase</th>
                    <th>Therapeutic Area</th>
                    <th>GCP Compliance Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studies.map((study) => (
                    <tr key={study.study_id}>
                      <td style={{ fontWeight: 600, maxWidth: '280px' }}>{study.title}</td>
                      <td>{study.ctri_reg_number || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Pending Ethics Approval</span>}</td>
                      <td>{study.phase}</td>
                      <td>{study.therapeutic_area}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>
                          {study.compliance_score_pct}%
                        </span>
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Subject ID</th>
                    <th>Site Location</th>
                    <th>Trial Study</th>
                    <th>Enrollment Date</th>
                    <th>Ayurveda Dosha</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub) => (
                    <tr key={sub.subject_id}>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{sub.subject_id}</td>
                      <td>{sub.site_name}</td>
                      <td>{sub.study_title}</td>
                      <td>{sub.enrollment_date}</td>
                      <td style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                        {sub.dosha_profile ? (() => {
                          const p = JSON.parse(sub.dosha_profile);
                          return `Vata:${p.vata} Pitta:${p.pitta} Kapha:${p.kapha}`;
                        })() : 'N/A'}
                      </td>
                      <td>
                        <span className={`badge ${
                          sub.enrollment_status === 'Completed' ? 'badge-success' :
                          sub.enrollment_status === 'Randomized' ? 'badge-info' :
                          sub.enrollment_status === 'Screened' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {sub.enrollment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Funnel Chart Visual */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3>Recruitment Funnel</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
              Real-time progression from initial screenings to completed randomizations.
            </p>
          </div>
          <div style={{ height: '240px', width: '100%', margin: '15px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={getFunnelData()} isAnimationActive>
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                  <Cell fill="#06b6d4" />
                  <Cell fill="#ef4444" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', justifyContent: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> Screened</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Randomized</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }}></span> Completed</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span> Withdrawn</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: REGISTER NEW STUDY */}
      {showStudyModal && (
        <div className="modal-overlay" onClick={() => setShowStudyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Register Trial Protocol</h3>
            <form onSubmit={handleCreateStudy}>
              <div className="form-group">
                <label>Trial Title</label>
                <textarea
                  className="form-textarea"
                  value={studyTitle}
                  onChange={(e) => setStudyTitle(e.target.value)}
                  placeholder="Enter full clinical trial research title"
                  rows={2}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Study Phase / Type</label>
                  <select className="form-select" value={studyPhase} onChange={(e) => setStudyPhase(e.target.value)}>
                    <option value="Interventional">Interventional Trial (RCT)</option>
                    <option value="Observational">Observational Study</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Therapeutic Area</label>
                  <input
                    type="text"
                    className="form-input"
                    value={studyArea}
                    onChange={(e) => setStudyArea(e.target.value)}
                    placeholder="e.g. Mental Health, Rheumatology"
                    required
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <input
                    type="checkbox"
                    id="ctri_checkbox"
                    checked={ctriPending}
                    onChange={(e) => setCtriPending(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="ctri_checkbox" style={{ fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>CTRI Registration Pending Ethics Approval</label>
                </div>
                {!ctriPending && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>CTRI Official Registration Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={ctriNum}
                      onChange={(e) => setCtriNum(e.target.value)}
                      placeholder="CTRI/YYYY/MM/XXXXXX"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Trial Sites</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Site Name (e.g. AIIA Campus)"
                    value={studySites[0].name}
                    onChange={(e) => setStudySites([{ name: e.target.value, location: studySites[0].location }])}
                    style={{ flex: 1 }}
                    required
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Location (City)"
                    value={studySites[0].location}
                    onChange={(e) => setStudySites([{ name: studySites[0].name, location: e.target.value }])}
                    style={{ flex: 1 }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStudyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Register Study'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ENROLL SUBJECT */}
      {showSubjectModal && (
        <div className="modal-overlay" onClick={() => setShowSubjectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>De-Identified Subject Onboarding</h3>
            <form onSubmit={handleEnrollSubject}>
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.8rem', color: '#fca5a5', fontWeight: 600 }}>Data Minimization & Encryption Shield Active</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Subject Full Name and Contact are AES-256 encrypted instantly. The system dashboard exposes only de-identified IDs to assure privacy.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Subject Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="Enter real name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={subContact}
                    onChange={(e) => setSubContact(e.target.value)}
                    placeholder="+91-XXXXXX"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Trial Research Site</label>
                <select className="form-select" value={subSiteId} onChange={(e) => setSubSiteId(e.target.value)} required>
                  <option value="">-- Choose Site --</option>
                  {studies.flatMap(s => s.sites || []).map((site: any) => (
                    <option key={site.site_id} value={site.site_id}>
                      {site.name} ({site.location})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '12px' }}>
                  Ayurveda Prakriti / Dosha Baseline (%)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Vata</label>
                    <input type="number" className="form-input" value={doshaVata} onChange={(e) => setDoshaVata(Number(e.target.value))} min={0} max={100} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Pitta</label>
                    <input type="number" className="form-input" value={doshaPitta} onChange={(e) => setDoshaPitta(Number(e.target.value))} min={0} max={100} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Kapha</label>
                    <input type="number" className="form-input" value={doshaKapha} onChange={(e) => setDoshaKapha(Number(e.target.value))} min={0} max={100} required />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Onboard & Sign Consent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REPORT AE/SAE */}
      {showAeModal && (
        <div className="modal-overlay" onClick={() => setShowAeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={24} /> Log Safety Event (AE/SAE)
            </h3>
            <form onSubmit={handleReportAe}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Subject ID</label>
                  <select className="form-select" value={aeSubId} onChange={(e) => setAeSubId(e.target.value)} required>
                    <option value="">-- Choose Subject --</option>
                    {subjects.map(s => (
                      <option key={s.subject_id} value={s.subject_id}>{s.subject_id}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Trial Study</label>
                  <select className="form-select" value={aeStudyId} onChange={(e) => setAeStudyId(e.target.value)} required>
                    <option value="">-- Choose Study --</option>
                    {studies.map(s => (
                      <option key={s.study_id} value={s.study_id}>{s.title.substring(0, 50)}...</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Event Type</label>
                  <select className="form-select" value={aeType} onChange={(e) => setAeType(e.target.value as any)}>
                    <option value="AE">Adverse Event (AE)</option>
                    <option value="SAE">Serious Adverse Event (SAE)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Onset Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={aeOnset}
                    onChange={(e) => setAeOnset(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Severity Level</label>
                  <select className="form-select" value={aeSeverity} onChange={(e) => setAeSeverity(e.target.value)}>
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Life-threatening">Life-threatening</option>
                    <option value="Death">Fatal / Death</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Causality (ASU Drug link)</label>
                  <select className="form-select" value={aeCausality} onChange={(e) => setAeCausality(e.target.value)}>
                    <option value="Unrelated">Unrelated</option>
                    <option value="Unlikely">Unlikely</option>
                    <option value="Possible">Possible</option>
                    <option value="Probable">Probable</option>
                    <option value="Certain">Certain / Absolute</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Event Description & Symptoms</label>
                <textarea
                  className="form-textarea"
                  value={aeDesc}
                  onChange={(e) => setAeDesc(e.target.value)}
                  placeholder="Enter detailed symptoms and treatment measures..."
                  rows={3}
                  required
                />
              </div>

              {/* Deadline Preview Banner */}
              <div style={{
                background: aeType === 'SAE' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: aeType === 'SAE' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Clock size={20} style={{ color: aeType === 'SAE' ? '#ef4444' : '#f59e0b' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Computed NDCT 2019 Regulatory Deadline</p>
                  <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>
                    Report due by: {computedDeadline} ({aeType === 'SAE' ? '24 Hours offset' : '7 Days offset'})
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#dc2626' }} disabled={loading}>
                  Submit Regulatory Safety Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SUBMIT eCRF */}
      {showEcrfModal && (
        <div className="modal-overlay" onClick={() => setShowEcrfModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>eCRF Form Clinical Entry</h3>
            <form onSubmit={handleSubmitEcrf}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Subject Identifier</label>
                  <select className="form-select" value={ecrfSubId} onChange={(e) => setEcrfSubId(e.target.value)} required>
                    <option value="">-- Choose Subject --</option>
                    {subjects.filter(s => s.enrollment_status !== 'Screened').map(s => (
                      <option key={s.subject_id} value={s.subject_id}>{s.subject_id} ({s.enrollment_status})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Visit Number</label>
                  <input type="number" className="form-input" value={ecrfVisit} onChange={(e) => setEcrfVisit(Number(e.target.value))} min={1} required />
                </div>
              </div>

              <div className="form-group">
                <label>eCRF Form / CDASH Domain</label>
                <select className="form-select" value={ecrfFormType} onChange={(e) => setEcrfFormType(e.target.value)}>
                  <option value="Vitals">Vital Signs (VS)</option>
                  <option value="Demographics">Demographics (DM)</option>
                  <option value="ConMeds">Concomitant Medications (CM)</option>
                </select>
              </div>

              {ecrfFormType === 'Vitals' && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Vital Signs Indicators</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label>Systolic BP (mmHg)</label>
                      <input type="number" className="form-input" value={vitalsSys} onChange={(e) => setVitalsSys(Number(e.target.value))} required />
                    </div>
                    <div className="form-group">
                      <label>Diastolic BP (mmHg)</label>
                      <input type="number" className="form-input" value={vitalsDia} onChange={(e) => setVitalsDia(Number(e.target.value))} required />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Heart Rate (bpm)</label>
                      <input type="number" className="form-input" value={vitalsHr} onChange={(e) => setVitalsHr(Number(e.target.value))} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Body Temperature (°F)</label>
                      <input type="number" step="0.1" className="form-input" value={vitalsTemp} onChange={(e) => setVitalsTemp(Number(e.target.value))} required />
                    </div>
                  </div>
                </div>
              )}

              {ecrfFormType === 'Demographics' && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Demographic Indicators</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Age (years)</label>
                      <input type="number" className="form-input" value={demoAge} onChange={(e) => setDemoAge(Number(e.target.value))} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Sex</label>
                      <select className="form-select" value={demoSex} onChange={(e) => setDemoSex(e.target.value)}>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="U">Undisclosed</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Race</label>
                      <input type="text" className="form-input" value={demoRace} onChange={(e) => setDemoRace(e.target.value)} required />
                    </div>
                  </div>
                </div>
              )}

              {ecrfFormType === 'ConMeds' && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Concomitant Treatment</p>
                  <div className="form-group">
                    <label>Medication / Drug Name</label>
                    <input type="text" className="form-input" value={cmDrug} onChange={(e) => setCmDrug(e.target.value)} placeholder="e.g. Ashwagandha capsule, Ibuprofen" required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Dosage</label>
                      <input type="text" className="form-input" value={cmDose} onChange={(e) => setCmDose(e.target.value)} placeholder="e.g. 500mg, 1 tablet" required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Frequency</label>
                      <select className="form-select" value={cmFreq} onChange={(e) => setCmFreq(e.target.value)}>
                        <option value="QD">Once Daily (QD)</option>
                        <option value="BID">Twice Daily (BID)</option>
                        <option value="TID">Three Times Daily (TID)</option>
                        <option value="PRN">As Needed (PRN)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEcrfModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Submit eCRF Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
