import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';
import * as crypto from 'crypto';

export interface Database {
  get<T = any>(sql: string, params?: unknown[]): Promise<T | undefined>;
  all<T = any>(sql: string, params?: unknown[]): Promise<T>;
  run(sql: string, params?: unknown[]): Promise<{ changes: number }>;
  exec(sql: string): Promise<void>;
}

const dbPath = process.env.VERCEL ? '/tmp/aiia_ctms.db' : path.join(__dirname, '..', 'data', 'aiia_ctms.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let sqliteDb: SqliteDatabase | null = null;

async function getSqliteConnection(): Promise<SqliteDatabase> {
  if (!sqliteDb) {
    sqliteDb = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    await sqliteDb.exec('PRAGMA foreign_keys = ON;');
  }
  return sqliteDb;
}

export async function getDb(): Promise<Database> {
  const db = await getSqliteConnection();

  return {
    async get<T = any>(sql: string, params: unknown[] = []): Promise<T | undefined> {
      return (await db.get(sql, params as any[])) as T | undefined;
    },
    async all<T = any>(sql: string, params: unknown[] = []): Promise<T> {
      return (await db.all(sql, params as any[])) as T;
    },
    async run(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
      const result = await db.run(sql, params as any[]);
      return { changes: result.changes ?? 0 };
    },
    async exec(sql: string): Promise<void> {
      await db.exec(sql);
    },
  };
}

export async function initDb(): Promise<void> {
  const db = await getDb();

  await db.exec('PRAGMA foreign_keys = ON;');

  if (true) {
  // Create tables in order of dependency
  await db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      org_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      org_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE,
      password_hash TEXT,
      mfa_enabled INTEGER NOT NULL DEFAULT 0,
      mfa_secret TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roles (
      role_id TEXT PRIMARY KEY,
      role_name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      site_id TEXT,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS studies (
      study_id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      title TEXT NOT NULL,
      ctri_reg_number TEXT,
      phase TEXT NOT NULL,
      therapeutic_area TEXT NOT NULL,
      status TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS sites (
      site_id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      lat REAL,
      lng REAL,
      pi_user_id TEXT NOT NULL,
      FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE,
      FOREIGN KEY (pi_user_id) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS subjects (
      subject_id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      enrollment_status TEXT NOT NULL,
      enrollment_date TEXT NOT NULL,
      dosha_profile TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subject_pii (
      subject_id TEXT PRIMARY KEY,
      full_name_encrypted TEXT NOT NULL,
      contact_encrypted TEXT NOT NULL,
      abdm_health_id TEXT,
      FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      document_id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      file_ref TEXT NOT NULL,
      version TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS consents (
      consent_id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      version TEXT NOT NULL,
      signed_date TEXT NOT NULL,
      document_ref TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
      FOREIGN KEY (document_ref) REFERENCES documents(document_id)
    );

    CREATE TABLE IF NOT EXISTS ecrf_entries (
      entry_id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      form_type TEXT NOT NULL,
      visit_number INTEGER NOT NULL,
      entered_by TEXT NOT NULL,
      entered_at TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
      FOREIGN KEY (entered_by) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS ecrf_field_values (
      value_id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      field_value TEXT NOT NULL,
      sdtm_domain TEXT,
      sdtm_variable TEXT,
      FOREIGN KEY (entry_id) REFERENCES ecrf_entries(entry_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deadline_rules (
      rule_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      deadline_offset_hours INTEGER NOT NULL,
      escalation_thresholds_pct TEXT NOT NULL, -- JSON Array: e.g. [50, 80, 100]
      escalation_chain TEXT NOT NULL,          -- JSON Array: e.g. ["PI", "IEC", "Sponsor", "NPvCC"]
      version INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ae_events (
      ae_id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      study_id TEXT NOT NULL,
      event_type TEXT NOT NULL, -- AE / SAE
      severity TEXT NOT NULL,   -- Mild/Moderate/Severe/Life-threatening/Death
      causality TEXT NOT NULL,  -- Certain/Probable/Possible/Unlikely/Unrelated
      onset_datetime TEXT NOT NULL,
      description TEXT NOT NULL,
      reported_by TEXT NOT NULL,
      report_deadline TEXT NOT NULL,
      status TEXT NOT NULL,     -- Open / Reported / Breached / Closed
      escalation_level INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
      FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE,
      FOREIGN KEY (reported_by) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS escalation_logs (
      escalation_id TEXT PRIMARY KEY,
      ae_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      notified_role TEXT NOT NULL,
      notified_at TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (ae_id) REFERENCES ae_events(ae_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS iec_reviews (
      review_id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      decision TEXT NOT NULL, -- Approved / Revision_Requested / Rejected
      comments TEXT,
      decision_date TEXT NOT NULL,
      e_signature_ref TEXT,
      FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(user_id),
      FOREIGN KEY (e_signature_ref) REFERENCES documents(document_id)
    );

    CREATE TABLE IF NOT EXISTS protocol_deviations (
      deviation_id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL,
      reported_by TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL, -- Minor / Major
      status TEXT NOT NULL,   -- Open / Reviewed / Closed
      reported_at TEXT NOT NULL,
      FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE,
      FOREIGN KEY (reported_by) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS compliance_scores (
      score_id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL,
      checkpoint TEXT NOT NULL,
      status TEXT NOT NULL, -- Met / Due / Breached
      computed_at TEXT NOT NULL,
      FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS milestones (
      milestone_id TEXT PRIMARY KEY,
      study_id TEXT NOT NULL,
      name TEXT NOT NULL,
      planned_date TEXT NOT NULL,
      actual_date TEXT,
      status TEXT NOT NULL, -- Pending / Complete / Delayed
      FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      audit_id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      field TEXT,
      old_value TEXT,
      new_value TEXT,
      prev_hash TEXT NOT NULL,
      record_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (actor_id) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      notification_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL, -- Escalation / Reminder / Decision
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
  `);

  const userColumns = await db.all('PRAGMA table_info(users)');
  if (!userColumns.some((column: any) => column.name === 'username')) {
    await db.run('ALTER TABLE users ADD COLUMN username TEXT');
  }
  if (!userColumns.some((column: any) => column.name === 'password_hash')) {
    await db.run('ALTER TABLE users ADD COLUMN password_hash TEXT');
  }
  if (!userColumns.some((column: any) => column.name === 'mfa_secret')) {
    await db.run('ALTER TABLE users ADD COLUMN mfa_secret TEXT');
  }
  }

  const demoCredentials = [
    ['u_pi', 'rajesh.pi'],
    ['u_iec', 'sunita.iec'],
    ['u_dm', 'manish.dm'],
    ['u_pv', 'vikram.pv'],
    ['u_sponsor', 'amit.sponsor'],
    ['u_auditor', 'roger.auditor'],
    ['u_executive', 'dg.executive'],
  ];
  for (const [userId, username] of demoCredentials) {
    await db.run(
      'UPDATE users SET username = ?, password_hash = ? WHERE user_id = ? AND (username IS NULL OR password_hash IS NULL)',
      [username, crypto.createHash('sha256').update('demo123').digest('hex'), userId]
    );
  }

  // Seeding
  const usersCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (usersCount && Number((usersCount as any).count) === 0) {
    console.log('Seeding database with clinical trials synthetic data...');
    await seedDatabase(db);
    console.log('Database seeded successfully.');
  }
}

async function seedDatabase(db: Database): Promise<void> {
  // 1. Roles
  const roles = [
    { role_id: 'r_pi', role_name: 'PI' },
    { role_id: 'r_iec', role_name: 'IEC' },
    { role_id: 'r_dm', role_name: 'DataManager' },
    { role_id: 'r_pv', role_name: 'PVOfficer' },
    { role_id: 'r_sponsor', role_name: 'Sponsor' },
    { role_id: 'r_auditor', role_name: 'Auditor' },
    { role_id: 'r_executive', role_name: 'Executive' },
  ];
  for (const r of roles) {
    await db.run('INSERT INTO roles (role_id, role_name) VALUES (?, ?)', [r.role_id, r.role_name]);
  }

  // 2. Users
  const users = [
    { user_id: 'u_pi', name: 'Dr. Rajesh Kumar', email: 'rajesh@aiia.gov.in', username: 'rajesh.pi', password: 'demo123', mfa_enabled: 0 },
    { user_id: 'u_iec', name: 'Dr. Sunita Sharma', email: 'sunita@aiia.gov.in', username: 'sunita.iec', password: 'demo123', mfa_enabled: 0 },
    { user_id: 'u_dm', name: 'Manish Gupta', email: 'manish@aiia.gov.in', username: 'manish.dm', password: 'demo123', mfa_enabled: 0 },
    { user_id: 'u_pv', name: 'Dr. Vikram Mehta', email: 'vikram@npvcc.gov.in', username: 'vikram.pv', password: 'demo123', mfa_enabled: 0 },
    { user_id: 'u_sponsor', name: 'Amit Verma', email: 'amit@sponsor.com', username: 'amit.sponsor', password: 'demo123', mfa_enabled: 0 },
    { user_id: 'u_auditor', name: 'Inspector Roger', email: 'roger@auditor.org', username: 'roger.auditor', password: 'demo123', mfa_enabled: 0 },
    { user_id: 'u_executive', name: 'Director General Ayush', email: 'dg@ayush.gov.in', username: 'dg.executive', password: 'demo123', mfa_enabled: 0 },
  ];
  const nowStr = new Date().toISOString();
  for (const u of users) {
    await db.run(
      'INSERT INTO users (user_id, name, email, username, password_hash, mfa_enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [u.user_id, u.name, u.email, u.username, crypto.createHash('sha256').update(u.password).digest('hex'), u.mfa_enabled, nowStr]
    );
    // Link user to role
    const rId = 'r_' + u.user_id.split('_')[1];
    await db.run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [u.user_id, rId]);
  }

  // 3. Organizations
  const orgs = [
    { org_id: 'org_aiia', name: 'All India Institute of Ayurveda (AIIA)', org_type: 'Institute' },
    { org_id: 'org_ayush', name: 'Ministry of Ayush', org_type: 'Ministry' },
    { org_id: 'org_rari', name: 'Regional Ayurveda Research Institute', org_type: 'Site-host' },
  ];
  for (const o of orgs) {
    await db.run(
      'INSERT INTO organizations (org_id, name, org_type, created_at) VALUES (?, ?, ?, ?)',
      [o.org_id, o.name, o.org_type, nowStr]
    );
  }

  // 4. Studies
  const studies = [
    {
      study_id: 's_ashwagandha',
      org_id: 'org_aiia',
      title: 'Evaluation of Ashwagandha (Withania somnifera) in Mild to Moderate Stress: A Randomized Controlled Trial',
      ctri_reg_number: 'CTRI/2026/08/042301',
      phase: 'Interventional',
      therapeutic_area: 'Mental Health',
      status: 'Active',
      start_date: '2026-01-15',
      end_date: '2026-12-31',
      created_by: 'u_sponsor',
    },
    {
      study_id: 's_ayush64',
      org_id: 'org_aiia',
      title: 'Observational Study on the Efficacy of Ayush-64 in Post-Viral Fatigue Syndrome',
      ctri_reg_number: 'CTRI/2026/05/039485',
      phase: 'Observational',
      therapeutic_area: 'Immunology',
      status: 'Active',
      start_date: '2026-03-20',
      end_date: '2026-10-31',
      created_by: 'u_sponsor',
    },
    {
      study_id: 's_haridra',
      org_id: 'org_aiia',
      title: 'Clinical Trial of Haridra and Shunthi in Osteoarthritis of Knee Joint',
      ctri_reg_number: null,
      phase: 'Interventional',
      therapeutic_area: 'Rheumatology',
      status: 'Pending_IEC',
      start_date: '2026-10-01',
      end_date: '2027-06-30',
      created_by: 'u_sponsor',
    },
  ];
  for (const s of studies) {
    await db.run(
      'INSERT INTO studies (study_id, org_id, title, ctri_reg_number, phase, therapeutic_area, status, start_date, end_date, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        s.study_id,
        s.org_id,
        s.title,
        s.ctri_reg_number,
        s.phase,
        s.therapeutic_area,
        s.status,
        s.start_date,
        s.end_date,
        s.created_by,
        nowStr,
        nowStr,
      ]
    );
  }

  // 5. Sites
  const sites = [
    {
      site_id: 'site_delhi',
      study_id: 's_ashwagandha',
      name: 'AIIA Main Campus, New Delhi',
      location: 'New Delhi, Delhi',
      lat: 28.5283,
      lng: 77.2882,
      pi_user_id: 'u_pi',
    },
    {
      site_id: 'site_jaipur',
      study_id: 's_ashwagandha',
      name: 'Regional Ayurveda Research Institute, Jaipur',
      location: 'Jaipur, Rajasthan',
      lat: 26.9124,
      lng: 75.7873,
      pi_user_id: 'u_pi',
    },
    {
      site_id: 'site_goa',
      study_id: 's_ayush64',
      name: 'AIIA Satellite Centre, Goa',
      location: 'Goa',
      lat: 15.2993,
      lng: 74.124,
      pi_user_id: 'u_pi',
    },
  ];
  for (const s of sites) {
    await db.run(
      'INSERT INTO sites (site_id, study_id, name, location, lat, lng, pi_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [s.site_id, s.study_id, s.name, s.location, s.lat, s.lng, s.pi_user_id]
    );
  }

  // 6. Subjects & Consent
  // Let's create subjects for Ashwagandha (Delhi & Jaipur) and Ayush-64 (Goa)
  const subjectsData = [
    // Delhi Site Subjects
    { id: 'sub_delhi_001', status: 'Completed', date: '2026-01-20', profile: '{"vata": 40, "pitta": 30, "kapha": 30}', site: 'site_delhi', name: 'Ramesh Sharma', contact: '+91-9876543210' },
    { id: 'sub_delhi_002', status: 'Randomized', date: '2026-02-05', profile: '{"vata": 20, "pitta": 50, "kapha": 30}', site: 'site_delhi', name: 'Sanjay Verma', contact: '+91-9988776655' },
    { id: 'sub_delhi_003', status: 'Randomized', date: '2026-02-12', profile: '{"vata": 30, "pitta": 30, "kapha": 40}', site: 'site_delhi', name: 'Pooja Patel', contact: '+91-9898989898' },
    { id: 'sub_delhi_004', status: 'Screened', date: '2026-03-01', profile: null, site: 'site_delhi', name: 'Anjali Gupta', contact: '+91-9797979797' },
    { id: 'sub_delhi_005', status: 'Withdrawn', date: '2026-01-22', profile: '{"vata": 50, "pitta": 20, "kapha": 30}', site: 'site_delhi', name: 'Vikram Singh', contact: '+91-9696969696' },
    // Jaipur Site Subjects
    { id: 'sub_jaipur_001', status: 'Randomized', date: '2026-02-10', profile: '{"vata": 35, "pitta": 35, "kapha": 30}', site: 'site_jaipur', name: 'Karan Johar', contact: '+91-9595959595' },
    { id: 'sub_jaipur_002', status: 'Completed', date: '2026-01-18', profile: '{"vata": 30, "pitta": 45, "kapha": 25}', site: 'site_jaipur', name: 'Meena Kanwar', contact: '+91-9494949494' },
    { id: 'sub_jaipur_003', status: 'Screened', date: '2026-03-05', profile: null, site: 'site_jaipur', name: 'Rajendra Prasad', contact: '+91-9393939393' },
    // Goa Site Subjects (Study 2)
    { id: 'sub_goa_001', status: 'Randomized', date: '2026-03-25', profile: '{"vata": 25, "pitta": 25, "kapha": 50}', site: 'site_goa', name: 'Fernandes Dsouza', contact: '+91-9292929292' },
    { id: 'sub_goa_002', status: 'Completed', date: '2026-04-01', profile: '{"vata": 40, "pitta": 40, "kapha": 20}', site: 'site_goa', name: 'Maria Souza', contact: '+91-9191919191' },
  ];

  // Document mock for consents
  await db.run(
    "INSERT INTO documents (document_id, entity_type, entity_id, file_ref, version, uploaded_by, uploaded_at) VALUES ('doc_consent_v1', 'Consent', 's_ashwagandha', '/s3/consents/ashwagandha_v1.pdf', '1.0', 'u_pi', ?)",
    [nowStr]
  );
  await db.run(
    "INSERT INTO documents (document_id, entity_type, entity_id, file_ref, version, uploaded_by, uploaded_at) VALUES ('doc_consent_v2', 'Consent', 's_ayush64', '/s3/consents/ayush64_v1.pdf', '1.0', 'u_pi', ?)",
    [nowStr]
  );

  for (const s of subjectsData) {
    await db.run(
      'INSERT INTO subjects (subject_id, site_id, enrollment_status, enrollment_date, dosha_profile, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [s.id, s.site, s.status, s.date, s.profile, nowStr]
    );

    // Write encrypted PII (simulated with standard hex encoding of simple XOR or plain string for demo, let's just use JSON/string encryption wrapper mock)
    const nameEnc = Buffer.from(s.name).toString('base64');
    const contactEnc = Buffer.from(s.contact).toString('base64');
    const healthId = `ABHA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    await db.run(
      'INSERT INTO subject_pii (subject_id, full_name_encrypted, contact_encrypted, abdm_health_id) VALUES (?, ?, ?, ?)',
      [s.id, nameEnc, contactEnc, healthId]
    );

    // Consent
    if (s.status !== 'Screened') {
      const consentId = `c_${s.id}`;
      const docRef = s.site.includes('goa') ? 'doc_consent_v2' : 'doc_consent_v1';
      await db.run(
        'INSERT INTO consents (consent_id, subject_id, version, signed_date, document_ref) VALUES (?, ?, ?, ?, ?)',
        [consentId, s.id, '1.0', s.date, docRef]
      );
    }
  }

  // 7. eCRF Form Entries & Field Values (to show data quality checklist)
  // Let's populate vital signs (VS), demographics (DM), concomitant meds (CM) for some subjects
  const entries = [
    { entry_id: 'e_001', subject_id: 'sub_delhi_001', form_type: 'Demographics', visit_number: 1, entered_by: 'u_pi', status: 'Submitted' },
    { entry_id: 'e_002', subject_id: 'sub_delhi_001', form_type: 'Vitals', visit_number: 1, entered_by: 'u_pi', status: 'Submitted' },
    { entry_id: 'e_003', subject_id: 'sub_delhi_001', form_type: 'ConMeds', visit_number: 1, entered_by: 'u_pi', status: 'Submitted' },
    { entry_id: 'e_004', subject_id: 'sub_delhi_002', form_type: 'Demographics', visit_number: 1, entered_by: 'u_pi', status: 'Submitted' },
    { entry_id: 'e_005', subject_id: 'sub_delhi_002', form_type: 'Vitals', visit_number: 1, entered_by: 'u_pi', status: 'Draft' }, // Draft to show completeness progress
    { entry_id: 'e_006', subject_id: 'sub_jaipur_001', form_type: 'Demographics', visit_number: 1, entered_by: 'u_pi', status: 'Submitted' },
    { entry_id: 'e_007', subject_id: 'sub_jaipur_001', form_type: 'Vitals', visit_number: 1, entered_by: 'u_pi', status: 'Queried' }, // Queried status
    { entry_id: 'e_008', subject_id: 'sub_goa_001', form_type: 'Demographics', visit_number: 1, entered_by: 'u_pi', status: 'Submitted' },
  ];

  for (const e of entries) {
    await db.run(
      'INSERT INTO ecrf_entries (entry_id, subject_id, form_type, visit_number, entered_by, entered_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [e.entry_id, e.subject_id, e.form_type, e.visit_number, e.entered_by, nowStr, e.status]
    );
  }

  // Field values
  const fields = [
    // Demographics e_001
    { val_id: 'v_1', entry_id: 'e_001', name: 'AGE', value: '45', domain: 'DM', variable: 'AGE' },
    { val_id: 'v_2', entry_id: 'e_001', name: 'SEX', value: 'M', domain: 'DM', variable: 'SEX' },
    { val_id: 'v_3', entry_id: 'e_001', name: 'RACE', value: 'ASIAN', domain: 'DM', variable: 'RACE' },
    // Vitals e_002
    { val_id: 'v_4', entry_id: 'e_002', name: 'SYSBP', value: '120', domain: 'VS', variable: 'VSORRES' },
    { val_id: 'v_5', entry_id: 'e_002', name: 'DIABP', value: '80', domain: 'VS', variable: 'VSORRES' },
    { val_id: 'v_6', entry_id: 'e_002', name: 'HR', value: '72', domain: 'VS', variable: 'VSORRES' },
    // ConMeds e_003
    { val_id: 'v_7', entry_id: 'e_003', name: 'CMTRT', value: 'Chyawanprash', domain: 'CM', variable: 'CMTRT' },
    { val_id: 'v_8', entry_id: 'e_003', name: 'DOSE', value: '10g', domain: 'CM', variable: 'CMDOSE' },
    // Demographics e_004
    { val_id: 'v_9', entry_id: 'e_004', name: 'AGE', value: '38', domain: 'DM', variable: 'AGE' },
    { val_id: 'v_10', entry_id: 'e_004', name: 'SEX', value: 'F', domain: 'DM', variable: 'SEX' },
    // Vitals e_005 (Draft)
    { val_id: 'v_11', entry_id: 'e_005', name: 'SYSBP', value: '135', domain: 'VS', variable: 'VSORRES' },
    // Demographics e_006
    { val_id: 'v_12', entry_id: 'e_006', name: 'AGE', value: '29', domain: 'DM', variable: 'AGE' },
    { val_id: 'v_13', entry_id: 'e_006', name: 'SEX', value: 'M', domain: 'DM', variable: 'SEX' },
    // Vitals e_007 (Queried)
    { val_id: 'v_14', entry_id: 'e_007', name: 'SYSBP', value: '180', domain: 'VS', variable: 'VSORRES' }, // Alert value
    // Demographics e_008
    { val_id: 'v_15', entry_id: 'e_008', name: 'AGE', value: '52', domain: 'DM', variable: 'AGE' },
    { val_id: 'v_16', entry_id: 'e_008', name: 'SEX', value: 'F', domain: 'DM', variable: 'SEX' },
  ];
  for (const f of fields) {
    await db.run(
      'INSERT INTO ecrf_field_values (value_id, entry_id, field_name, field_value, sdtm_domain, sdtm_variable) VALUES (?, ?, ?, ?, ?, ?)',
      [f.val_id, f.entry_id, f.name, f.value, f.domain, f.variable]
    );
  }

  // 8. Deadline Rules (NDCT Rules 2019)
  await db.run(
    "INSERT INTO deadline_rules (rule_id, event_type, deadline_offset_hours, escalation_thresholds_pct, escalation_chain, version, active) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      'rule_sae_initial',
      'SAE',
      24,
      JSON.stringify([50, 80, 100]),
      JSON.stringify(['PI', 'IEC', 'Sponsor', 'NPvCC']),
      1,
      1,
    ]
  );
  await db.run(
    "INSERT INTO deadline_rules (rule_id, event_type, deadline_offset_hours, escalation_thresholds_pct, escalation_chain, version, active) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      'rule_ae_routine',
      'AE',
      168, // 7 days
      JSON.stringify([50, 80, 100]),
      JSON.stringify(['PI', 'DataManager', 'Sponsor']),
      1,
      1,
    ]
  );

  // 9. AE / SAE Events (to populate countdowns and statistics)
  // Let's compute dates relative to current execution time to make countdown dynamic
  const dateHoursAgo = (hours: number) => {
    const d = new Date();
    d.setHours(d.getHours() - hours);
    return d.toISOString();
  };

  const aes = [
    {
      ae_id: 'ae_001',
      subject_id: 'sub_delhi_001',
      study_id: 's_ashwagandha',
      event_type: 'AE',
      severity: 'Mild',
      causality: 'Unlikely',
      onset_datetime: dateHoursAgo(48),
      description: 'Transient headache in the evening, resolved without medication.',
      reported_by: 'u_pi',
      report_deadline: dateHoursAgo(48 - 168), // 7 days from onset
      status: 'Closed',
      escalation_level: 0,
    },
    {
      // Severe SAE, onset 2 hours ago -> T-minus 22 hours (Amber)
      ae_id: 'ae_002',
      subject_id: 'sub_delhi_002',
      study_id: 's_ashwagandha',
      event_type: 'SAE',
      severity: 'Severe',
      causality: 'Probable',
      onset_datetime: dateHoursAgo(2),
      description: 'Acute Gastric Hemorrhage. Subject hospitalized.',
      reported_by: 'u_pi',
      report_deadline: dateHoursAgo(2 - 24), // 24 hours from onset
      status: 'Open',
      escalation_level: 0,
    },
    {
      // Life-threatening SAE, onset 19 hours ago -> T-minus 5 hours (Red, Escalated to IEC)
      ae_id: 'ae_003',
      subject_id: 'sub_jaipur_001',
      study_id: 's_ashwagandha',
      event_type: 'SAE',
      severity: 'Life-threatening',
      causality: 'Certain',
      onset_datetime: dateHoursAgo(19),
      description: 'Severe Anaphylactic Shock following study drug ingestion.',
      reported_by: 'u_pi',
      report_deadline: dateHoursAgo(19 - 24), // 24 hours from onset
      status: 'Open',
      escalation_level: 1, // Level 1 = Escalated to IEC (passed 80% threshold)
    },
    {
      // Severe SAE, onset 36 hours ago -> Breached (Red, Escalated to Sponsor/NPvCC)
      ae_id: 'ae_004',
      subject_id: 'sub_goa_001',
      study_id: 's_ayush64',
      event_type: 'SAE',
      severity: 'Severe',
      causality: 'Possible',
      onset_datetime: dateHoursAgo(36),
      description: 'Severe liver enzyme elevation (ALT/AST > 5x ULN).',
      reported_by: 'u_pi',
      report_deadline: dateHoursAgo(36 - 24), // Passed!
      status: 'Breached',
      escalation_level: 3, // Passed 100% threshold, escalated to all
    },
  ];

  for (const a of aes) {
    await db.run(
      'INSERT INTO ae_events (ae_id, subject_id, study_id, event_type, severity, causality, onset_datetime, description, reported_by, report_deadline, status, escalation_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        a.ae_id,
        a.subject_id,
        a.study_id,
        a.event_type,
        a.severity,
        a.causality,
        a.onset_datetime,
        a.description,
        a.reported_by,
        a.report_deadline,
        a.status,
        a.escalation_level,
        a.onset_datetime,
      ]
    );

    // Create mock escalation logs for open/escalated SAEs
    if (a.escalation_level >= 1) {
      await db.run(
        "INSERT INTO escalation_logs (escalation_id, ae_id, level, notified_role, notified_at, resolved) VALUES (?, ?, ?, 'IEC', ?, 0)",
        [`esc_${a.ae_id}_1`, a.ae_id, 1, dateHoursAgo(24 - 12)]
      );
    }
    if (a.escalation_level >= 2) {
      await db.run(
        "INSERT INTO escalation_logs (escalation_id, ae_id, level, notified_role, notified_at, resolved) VALUES (?, ?, ?, 'Sponsor', ?, 0)",
        [`esc_${a.ae_id}_2`, a.ae_id, 2, dateHoursAgo(24 - 4)]
      );
    }
    if (a.escalation_level >= 3) {
      await db.run(
        "INSERT INTO escalation_logs (escalation_id, ae_id, level, notified_role, notified_at, resolved) VALUES (?, ?, ?, 'NPvCC', ?, 0)",
        [`esc_${a.ae_id}_3`, a.ae_id, 3, dateHoursAgo(24 - 0)]
      );
    }
  }

  // 10. IEC Reviews
  const reviews = [
    { id: 'rev_1', study: 's_ashwagandha', reviewer: 'u_iec', decision: 'Approved', comments: 'Study protocol v1.2 and consent form approved for implementation.', signature: 'doc_sig_1' },
    { id: 'rev_2', study: 's_ayush64', reviewer: 'u_iec', decision: 'Approved', comments: 'Observational protocol approved. Ensure safety reporting channels are open.', signature: 'doc_sig_2' },
  ];
  // Upload sig documents
  await db.run("INSERT INTO documents (document_id, entity_type, entity_id, file_ref, version, uploaded_by, uploaded_at) VALUES ('doc_sig_1', 'IEC_Review', 's_ashwagandha', '/s3/signatures/sunita_sig_1.png', '1.0', 'u_iec', ?)", [nowStr]);
  await db.run("INSERT INTO documents (document_id, entity_type, entity_id, file_ref, version, uploaded_by, uploaded_at) VALUES ('doc_sig_2', 'IEC_Review', 's_ayush64', '/s3/signatures/sunita_sig_2.png', '1.0', 'u_iec', ?)", [nowStr]);

  for (const r of reviews) {
    await db.run(
      'INSERT INTO iec_reviews (review_id, study_id, reviewer_id, decision, comments, decision_date, e_signature_ref) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [r.id, r.study, r.reviewer, r.decision, r.comments, dateHoursAgo(200), r.signature]
    );
  }

  // 11. Milestones
  const ms = [
    // Ashwagandha Milestones
    { id: 'ms_1', study_id: 's_ashwagandha', name: 'Protocol Finalization', planned: '2025-11-01', actual: '2025-11-05', status: 'Complete' },
    { id: 'ms_2', study_id: 's_ashwagandha', name: 'IEC Ethics Clearance', planned: '2025-12-15', actual: '2025-12-20', status: 'Complete' },
    { id: 'ms_3', study_id: 's_ashwagandha', name: 'Trial Registration (CTRI)', planned: '2026-01-10', actual: '2026-01-15', status: 'Complete' },
    { id: 'ms_4', study_id: 's_ashwagandha', name: 'Subject Enrollment Commencement', planned: '2026-01-15', actual: '2026-01-20', status: 'Complete' },
    { id: 'ms_5', study_id: 's_ashwagandha', name: 'Interim Safety Analysis', planned: '2026-06-30', actual: '2026-07-10', status: 'Complete' },
    { id: 'ms_6', study_id: 's_ashwagandha', name: 'Completion of Target Enrollment', planned: '2026-09-30', actual: null, status: 'Pending' },
    // Haridra
    { id: 'ms_7', study_id: 's_haridra', name: 'IEC Approval Board Meeting', planned: '2026-09-10', actual: null, status: 'Pending' },
  ];
  for (const m of ms) {
    await db.run(
      'INSERT INTO milestones (milestone_id, study_id, name, planned_date, actual_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [m.id, m.study_id, m.name, m.planned, m.actual, m.status]
    );
  }

  // 12. Protocol Deviations
  await db.run(
    "INSERT INTO protocol_deviations (deviation_id, study_id, reported_by, description, severity, status, reported_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      'dev_001',
      's_ashwagandha',
      'u_pi',
      'Subject sub_delhi_002 missed Visit 2 window by 4 days due to personal travel.',
      'Minor',
      'Reviewed',
      dateHoursAgo(100),
    ]
  );
  await db.run(
    "INSERT INTO protocol_deviations (deviation_id, study_id, reported_by, description, severity, status, reported_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      'dev_002',
      's_ashwagandha',
      'u_pi',
      'Blood sample for vitals collection was taken before consent renewal on version 2.0 (consented 1 hour later).',
      'Major',
      'Open',
      dateHoursAgo(10),
    ]
  );

  // 13. Compliance Scorecard Checkpoints
  const scorecards = [
    // Ashwagandha
    { id: 'cs_1', study: 's_ashwagandha', check: 'CTRI Registration', status: 'Met' },
    { id: 'cs_2', study: 's_ashwagandha', check: 'IEC Continuing Review', status: 'Met' },
    { id: 'cs_3', study: 's_ashwagandha', check: 'SAE Reporting Timeliness', status: 'Breached' }, // Because of ae_004
    { id: 'cs_4', study: 's_ashwagandha', check: 'Consent Signatures Completeness', status: 'Met' },
    // Ayush 64
    { id: 'cs_5', study: 's_ayush64', check: 'CTRI Registration', status: 'Met' },
    { id: 'cs_6', study: 's_ayush64', check: 'IEC Continuing Review', status: 'Due' },
    { id: 'cs_7', study: 's_ayush64', check: 'SAE Reporting Timeliness', status: 'Met' },
  ];
  for (const c of scorecards) {
    await db.run(
      'INSERT INTO compliance_scores (score_id, study_id, checkpoint, status, computed_at) VALUES (?, ?, ?, ?, ?)',
      [c.id, c.study, c.check, c.status, nowStr]
    );
  }

  // 14. Audit Log initialization (hash-chained)
  // Let's create an initial dummy seed block
  const dummyActor = 'u_sponsor';
  const dummyEntityId = 's_ashwagandha';
  const initTimestamp = dateHoursAgo(240);
  const initPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const initHashPayload = initPrevHash + dummyActor + 'Study' + dummyEntityId + 'CREATE' + 'status' + '' + 'Initial Seed' + initTimestamp;
  const initRecordHash = crypto.createHash('sha256').update(initHashPayload).digest('hex');

  await db.run(
    'INSERT INTO audit_logs (audit_id, actor_id, entity_type, entity_id, action, field, old_value, new_value, prev_hash, record_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      'audit_init_id',
      dummyActor,
      'Study',
      dummyEntityId,
      'CREATE',
      'status',
      '',
      'Initial Seed',
      initPrevHash,
      initRecordHash,
      initTimestamp,
    ]
  );
}
