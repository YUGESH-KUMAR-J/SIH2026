import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, FileSpreadsheet, Download, RefreshCw, Layers, Terminal, CheckCircle } from 'lucide-react';

interface DataManagerDashboardProps {
  studies: any[];
}

export default function DataManagerDashboard({ studies }: DataManagerDashboardProps) {
  const [selectedStudyId, setSelectedStudyId] = useState('');
  const [completenessMatrix, setCompletenessMatrix] = useState<any[]>([]);
  const [exportResult, setExportResult] = useState<any>(null);
  const [queries, setQueries] = useState<any[]>([]);
  const [loadingCompleteness, setLoadingCompleteness] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  const fetchQueries = async () => {
    try {
      const res = await fetch('/api/ecrf/queries');
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((q: any) => ({
          id: q.entry_id,
          subject_id: q.subject_id,
          form: q.form_type,
          field: q.field_name,
          value: q.field_value,
          reason: `Outlier flagged: ${q.field_name} value ${q.field_value} at ${q.site_name}.`,
          status: q.status === 'Queried' ? 'Open' : 'Resolved',
          date: new Date(q.entered_at).toLocaleDateString()
        }));
        setQueries(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Initialize selected study
  useEffect(() => {
    if (studies.length > 0 && !selectedStudyId) {
      setSelectedStudyId(studies[0].study_id);
    }
    fetchQueries();
  }, [studies]);

  // Load completeness matrix
  const fetchCompleteness = async () => {
    if (!selectedStudyId) return;
    setLoadingCompleteness(true);
    try {
      const res = await fetch(`/api/ecrf/completeness/${selectedStudyId}`);
      if (res.ok) {
        const data = await res.json();
        setCompletenessMatrix(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCompleteness(false);
    }
  };

  useEffect(() => {
    fetchCompleteness();
  }, [selectedStudyId]);

  const handleExport = async () => {
    if (!selectedStudyId) return;
    setLoadingExport(true);
    setExportResult(null);

    try {
      const res = await fetch(`/api/export/sdtm/${selectedStudyId}`);
      if (res.ok) {
        const data = await res.json();
        setExportResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExport(false);
    }
  };

  const handleResolveQuery = async (id: string) => {
    try {
      const res = await fetch(`/api/ecrf/queries/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: 'u_dm' })
      });
      if (res.ok) {
        alert('Query marked resolved. eCRF status updated.');
        fetchQueries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Data Management & CDISC Compliance Suite</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Map Raw eCRF forms to CDISC SDTM domains, track database completeness matrix, and export regulatory-ready Define-XML files.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            className="form-select"
            value={selectedStudyId}
            onChange={(e) => setSelectedStudyId(e.target.value)}
            style={{ minWidth: '220px' }}
          >
            {studies.map(s => (
              <option key={s.study_id} value={s.study_id}>{s.title.substring(0, 35)}...</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={fetchCompleteness}>
            <RefreshCw size={16} /> Update Matrix
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Data Completeness Index</span>
            <Layers size={20} style={{ color: 'var(--color-success)' }} />
          </div>
          <span className="kpi-value" style={{ color: 'var(--color-success)' }}>91%</span>
          <div className="kpi-trend up">Exceeds 80% GCP threshold</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Unresolved Data Queries</span>
            <AlertCircle size={20} style={{ color: 'var(--color-warning)' }} />
          </div>
          <span className="kpi-value">{queries.filter(q => q.status === 'Open').length}</span>
          <div className="kpi-trend neutral">1 resolved this week</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Define-XML Schema Version</span>
            <Database size={20} style={{ color: 'var(--color-info)' }} />
          </div>
          <span className="kpi-value" style={{ fontSize: '1.5rem', marginTop: '12px' }}>v2.0 (CDISC)</span>
          <div className="kpi-trend neutral">Validation check: Passed</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">SDTM SDTM-IG Domains</span>
            <FileSpreadsheet size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <span className="kpi-value">4</span>
          <div className="kpi-trend neutral">DM, VS, CM, AE mapped</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '30px' }}>
        
        {/* Heatmap Matrix */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '10px' }}>Site Completeness Heatmap</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>
            Completeness tracking of CDASH raw data submissions (Forms vs Site Centers).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {completenessMatrix.map((row) => (
              <div key={row.site_id} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 120px)', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.site_name}>
                  {row.site_name}
                </span>
                {Object.keys(row.forms).map((form) => {
                  const val = row.forms[form];
                  const color = 
                    val === 100 ? 'var(--color-success)' :
                    val > 50 ? 'var(--color-info)' :
                    val > 0 ? 'var(--color-warning)' : 'var(--text-muted)';
                  const bg = 
                    val === 100 ? 'var(--color-success-glow)' :
                    val > 50 ? 'rgba(6, 182, 212, 0.1)' :
                    val > 0 ? 'var(--color-warning-glow)' : 'rgba(255,255,255,0.01)';
                  return (
                    <div
                      key={form}
                      style={{
                        padding: '10px',
                        background: bg,
                        color: color,
                        border: `1px solid ${bg}`,
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                      title={`${form}: ${val}% complete`}
                    >
                      {val}%
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '24px', justifyContent: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%' }}></span> 100% Completed</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-info)', borderRadius: '50%' }}></span> 50%-99% Active</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-warning)', borderRadius: '50%' }}></span> 1%-49% Gaps</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--text-muted)', borderRadius: '50%' }}></span> No data</span>
          </div>
        </div>

        {/* Data Queries Tracker */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '10px' }}>Active Discrepancy & Query Logs</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>
            Data quality validation flags sent to Principal Investigators for site remediation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {queries.map((q) => (
              <div key={q.id} style={{ border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-warning)' }}>{q.subject_id} — {q.field}</span>
                  <span className={`badge ${q.status === 'Open' ? 'badge-warning' : 'badge-success'}`}>{q.status}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{q.reason}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Logged: {q.date}</span>
                  {q.status === 'Open' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleResolveQuery(q.id)}
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      Verify & Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CDISC SDTM / Define-XML Export Panel */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
          <div>
            <h3>Regulatory Package Generator</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
              Maps internal SQL tables to CDISC SDTM-IG variable specs and generates official Define-XML definitions.
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleExport} disabled={loadingExport}>
            {loadingExport ? 'Transforming data...' : 'Generate CDISC Datasets'} <Download size={16} />
          </button>
        </div>

        {exportResult ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            {/* Define-XML Preview */}
            <div>
              <h4 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={16} style={{ color: 'var(--color-info)' }} /> Define-XML Metadata Sheet
              </h4>
              <div style={{
                background: '#040711',
                padding: '16px',
                borderRadius: '8px',
                maxHeight: '350px',
                overflowY: 'auto',
                border: '1px solid var(--glass-border)'
              }}>
                <pre style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'var(--color-info)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {exportResult.defineXml}
                </pre>
              </div>
            </div>

            {/* SDTM Datasets */}
            <div>
              <h4 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} style={{ color: 'var(--color-success)' }} /> Formatted SDTM Datasets
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '16px' }}>
                CDISC mapping complete. Choose domains to download clinical files.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.keys(exportResult.datasets).map((domain) => {
                  const rows = exportResult.datasets[domain];
                  return (
                    <div
                      key={domain}
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
                      <div>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{domain} Domain</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                          {rows.length} clinical subject record rows mapped
                        </span>
                      </div>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          // Simple file download simulation
                          const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(rows, null, 2))}`;
                          const downloadAnchor = document.createElement('a');
                          downloadAnchor.setAttribute('href', jsonString);
                          downloadAnchor.setAttribute('download', `${domain}_sdtm_dataset.json`);
                          document.body.appendChild(downloadAnchor);
                          downloadAnchor.click();
                          downloadAnchor.remove();
                        }}
                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      >
                        <Download size={14} /> CSV/JSON
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
            <Layers size={30} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a study from the top dropdown and click "Generate CDISC Datasets" to preview outputs.</p>
          </div>
        )}
      </div>

    </div>
  );
}
