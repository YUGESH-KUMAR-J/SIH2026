import React, { useState } from 'react';
import { Shield, UserRound, LockKeyhole, ArrowRight, Eye, EyeOff, Smartphone, Copy, UserPlus } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: { id: string; name: string; email: string; role: string; token: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [mfaStep, setMfaStep] = useState<{ challengeId: string; user: any; setup?: { qrCode: string; secret: string } } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [registration, setRegistration] = useState({ name: '', email: '', role: 'PI' });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setError('');
    setForgotPasswordMessage('');
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { username, password } : { ...registration, username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || (mode === 'register' ? 'Registration failed.' : 'Invalid username or password.'));
      }

      setMfaStep({ challengeId: data.challengeId, user: data.user, setup: data.setup });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-mfa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId: mfaStep?.challengeId, code: mfaCode }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'MFA verification failed.');
      onLoginSuccess({ ...data.user, token: data.token });
    } catch (err: any) { setError(err.message || 'MFA verification failed'); } finally { setLoading(false); }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      padding: '20px',
      background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)'
    }}>
      <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '40px', background: 'rgba(30, 41, 59, 0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            color: '#3b82f6',
            marginBottom: '15px'
          }}>
            <Shield size={30} />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '8px' }}>AIIA-CTMS</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Clinical Trials Management Portal
          </p>
          <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '10px', marginTop: '8px', display: 'inline-block' }}>
            GCP & NDCT Rules 2019 Compliant
          </span>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ width: '100%', marginBottom: '20px', padding: '12px', borderRadius: '8px', display: 'block', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {mfaStep ? (
          <form onSubmit={handleMfaSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Smartphone size={28} style={{ color: 'var(--color-primary)', marginBottom: '10px' }} />
              <h2 style={{ color: '#fff', fontSize: '1.25rem' }}>Verify your authenticator</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>Open Google Authenticator or Microsoft Authenticator and enter the current 6-digit code.</p>

            </div>
            {mfaStep.setup && <div style={{ textAlign: 'center', marginBottom: '18px' }}><img src={mfaStep.setup.qrCode} alt="Authenticator setup QR code" style={{ width: '180px', height: '180px', background: '#fff', padding: '8px', borderRadius: '8px' }} /><p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '10px' }}>Manual setup key</p><code style={{ color: '#fff', wordBreak: 'break-all' }}>{mfaStep.setup.secret}</code><button type="button" aria-label="Copy setup key" onClick={() => navigator.clipboard?.writeText(mfaStep.setup!.secret)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}><Copy size={14} /></button></div>}
            <input className="form-input" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="Enter 6-digit code" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))} required autoFocus style={{ width: '100%', textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.3rem' }} />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', marginTop: '18px' }} disabled={loading}>{loading ? 'Verifying...' : 'Verify and access portal'} <ArrowRight size={18} /></button>
            <button type="button" onClick={() => { setMfaStep(null); setMfaCode(''); }} style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Back to sign in</button>
          </form>
        ) : <form onSubmit={handleLoginSubmit}>
            {mode === 'register' && <><div className="form-group"><label htmlFor="name">Full name</label><input id="name" className="form-input" value={registration.name} onChange={(e) => setRegistration({ ...registration, name: e.target.value })} required /></div><div className="form-group"><label htmlFor="email">Email</label><input id="email" type="email" className="form-input" value={registration.email} onChange={(e) => setRegistration({ ...registration, email: e.target.value })} required /></div><div className="form-group"><label htmlFor="role">Role</label><select id="role" className="form-input" value={registration.role} onChange={(e) => setRegistration({ ...registration, role: e.target.value })}><option value="PI">Principal Investigator</option><option value="IEC">Ethics Committee</option><option value="DataManager">Data Manager</option><option value="PVOfficer">Pharmacovigilance</option><option value="Sponsor">Sponsor / Admin</option><option value="Auditor">Auditor / Inspector</option><option value="Executive">Ayush Executive</option></select></div></>}
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div style={{ position: 'relative' }}>
                <UserRound size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  id="username"
                  className="form-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', paddingLeft: '45px' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <LockKeyhole size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-secondary)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={mode === 'register' ? 8 : undefined}
                  style={{ width: '100%', paddingLeft: '45px', paddingRight: '45px' }}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '11px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-primary"
              style={{ width: '100%', height: '48px', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? (mode === 'register' ? 'Creating account...' : 'Signing in...') : (mode === 'register' ? 'Create account' : 'Access Portal')} <ArrowRight size={18} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setForgotPasswordMessage('Please contact your system administrator to reset your password.')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.85rem', padding: '4px' }}
              >
                Forgot password?
              </button>
              {forgotPasswordMessage && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '8px' }}>{forgotPasswordMessage}</p>
              )}
            </div>

            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '18px auto 0', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}><UserPlus size={16} /> {mode === 'login' ? 'Create an account' : 'Back to sign in'}</button>

          </form>}
      </div>
    </div>
  );
}
