import React, { useState, useEffect } from 'react';
import { Shield, Bell, User, LogOut, LayoutDashboard, Database, FileText, Settings, ShieldAlert, Award, Activity, Search } from 'lucide-react';
import Login from './pages/Login';
import PIDashboard from './pages/PIDashboard';
import PVDashboard from './pages/PVDashboard';
import IECDashboard from './pages/IECDashboard';
import DataManagerDashboard from './pages/DataManagerDashboard';
import SponsorDashboard from './pages/SponsorDashboard';
import AuditorDashboard from './pages/AuditorDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [studies, setStudies] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  // Load session from localStorage if exists
  useEffect(() => {
    const savedUser = localStorage.getItem('aiia_ctms_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchStudies = async () => {
    try {
      const res = await fetch('/api/studies');
      if (res.ok) {
        const data = await res.json();
        setStudies(data);
      }
    } catch (err) {
      console.error('Error fetching studies:', err);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Poll notifications every 5 seconds to show real-time PV escalations
  useEffect(() => {
    if (user) {
      fetchStudies();
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [user, refreshTrigger]);

  const handleLoginSuccess = (session: UserSession) => {
    localStorage.setItem('aiia_ctms_user', JSON.stringify(session));
    setUser(session);
  };

  const handleLogout = () => {
    localStorage.removeItem('aiia_ctms_user');
    setUser(null);
    setShowNotifPopover(false);
  };

  const handleRoleChange = (newRole: string) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    localStorage.setItem('aiia_ctms_user', JSON.stringify(updated));
    setUser(updated);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleReadNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchStudies();
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Determine which dashboard components to render
  const renderDashboard = () => {
    switch (user.role) {
      case 'PI':
        return <PIDashboard user={user} studies={studies} refreshData={refreshData} />;
      case 'PVOfficer':
        return <PVDashboard user={user} refreshTrigger={refreshTrigger} />;
      case 'IEC':
        return <IECDashboard user={user} refreshTrigger={refreshTrigger} refreshData={refreshData} />;
      case 'DataManager':
        return <DataManagerDashboard studies={studies} />;
      case 'Sponsor':
        return <SponsorDashboard studies={studies} />;
      case 'Auditor':
        return <AuditorDashboard refreshTrigger={refreshTrigger} />;
      case 'Executive':
        return <ExecutiveDashboard studies={studies} />;
      default:
        return <div>Access Denied. Unknown user role scope.</div>;
    }
  };

  const getRoleDisplayName = (r: string) => {
    switch (r) {
      case 'PI': return 'Principal Investigator';
      case 'PVOfficer': return 'Pharmacovigilance (NPvCC)';
      case 'IEC': return 'Ethics Committee (IEC)';
      case 'DataManager': return 'Clinical Data Manager';
      case 'Sponsor': return 'Trial Sponsor Admin';
      case 'Auditor': return 'Regulatory Compliance Auditor';
      case 'Executive': return 'Ayush Ministry Executive';
      default: return r;
    }
  };

  const unreadNotifs = notifications.filter(n => n.read === 0);

  return (
    <div className="app-container">
      
      {/* SIDEBAR NAVIGATION */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <Shield size={26} style={{ color: 'var(--color-primary)' }} />
          <span className="logo-text">AIIA-CTMS</span>
        </div>

        <ul className="sidebar-menu">
          <li className="menu-item active">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </li>
          <li className="menu-item" onClick={() => alert('Feature in development - Post-MVP release')}>
            <Database size={18} />
            <span>CRF Forms Library</span>
          </li>
          <li className="menu-item" onClick={() => alert('Feature in development - Post-MVP release')}>
            <FileText size={18} />
            <span>SOP & Guidelines</span>
          </li>
          <li className="menu-item" onClick={() => alert('Feature in development - Post-MVP release')}>
            <Settings size={18} />
            <span>System Settings</span>
          </li>
        </ul>

        {/* Sidebar Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{user.name}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{user.email}</p>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>

      {/* HEADER / TOPBAR */}
      <header className="header">
        <div className="header-title-section">
          <span className="header-subtitle">AIIA Clinical Trials Workspace</span>
          <h1 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600 }}>
            {getRoleDisplayName(user.role)}
          </h1>
        </div>

        <div className="header-controls">
          {/* Real-time interactive Role Switcher for Demo Day convenience */}
          <div className="role-badge-switcher">
            <User size={14} style={{ color: 'var(--color-primary)' }} />
            <select
              className="role-switcher-select"
              value={user.role}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              <option value="PI">PI Dashboard</option>
              <option value="PVOfficer">Pharmacovigilance (NPvCC)</option>
              <option value="IEC">Ethics Committee (IEC)</option>
              <option value="DataManager">Clinical Data Manager</option>
              <option value="Sponsor">Sponsor Admin</option>
              <option value="Auditor">Compliance Auditor</option>
              <option value="Executive">Ministry Executive</option>
            </select>
          </div>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifPopover(!showNotifPopover)}
              style={{
                background: 'transparent',
                border: 'none',
                color: unreadNotifs.length > 0 ? 'var(--color-warning)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '8px',
                position: 'relative'
              }}
            >
              <Bell size={20} />
              {unreadNotifs.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'var(--color-danger)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px var(--color-danger)'
                }}>
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotifPopover && (
              <div className="notif-popover">
                <div className="notif-header">
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Notification Alerts</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {unreadNotifs.length} unread
                  </span>
                </div>
                <div className="notif-body">
                  {notifications.map((notif) => (
                    <div
                      key={notif.notification_id}
                      className={`notif-item ${notif.read === 0 ? 'unread' : ''}`}
                      onClick={() => handleReadNotification(notif.notification_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <p style={{ lineHeight: '1.3' }}>{notif.message}</p>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                        {new Date(notif.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No notification messages.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT DISPLAY */}
      <main className="main-content">
        {renderDashboard()}
      </main>

    </div>
  );
}
