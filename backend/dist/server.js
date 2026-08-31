"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./db/database");
const logger_1 = require("./audit/logger");
const engine_1 = require("./rules/engine");
const gateway_1 = require("./fhir/gateway");
const uuid_1 = require("uuid");
const crypto = __importStar(require("crypto"));
const qrcode_1 = __importDefault(require("qrcode"));
const otplib_1 = require("otplib");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 5000;
const mfaChallenges = new Map();
const demoMfaSecrets = new Map();
const roleNames = ['PI', 'IEC', 'DataManager', 'PVOfficer', 'Sponsor', 'Auditor', 'Executive'];
const demoUsers = [
    { user_id: 'u_pi', name: 'Dr. Rajesh Kumar', email: 'rajesh@aiia.gov.in', username: 'rajesh.pi', role_name: 'PI', password_hash: crypto.createHash('sha256').update('demo123').digest('hex') },
    { user_id: 'u_iec', name: 'Dr. Sunita Sharma', email: 'sunita@aiia.gov.in', username: 'sunita.iec', role_name: 'IEC', password_hash: crypto.createHash('sha256').update('demo123').digest('hex') },
    { user_id: 'u_dm', name: 'Manish Gupta', email: 'manish@aiia.gov.in', username: 'manish.dm', role_name: 'DataManager', password_hash: crypto.createHash('sha256').update('demo123').digest('hex') },
    { user_id: 'u_pv', name: 'Dr. Vikram Mehta', email: 'vikram@npvcc.gov.in', username: 'vikram.pv', role_name: 'PVOfficer', password_hash: crypto.createHash('sha256').update('demo123').digest('hex') },
    { user_id: 'u_sponsor', name: 'Amit Verma', email: 'amit@sponsor.com', username: 'amit.sponsor', role_name: 'Sponsor', password_hash: crypto.createHash('sha256').update('demo123').digest('hex') },
    { user_id: 'u_auditor', name: 'Inspector Roger', email: 'roger@auditor.org', username: 'roger.auditor', role_name: 'Auditor', password_hash: crypto.createHash('sha256').update('demo123').digest('hex') },
    { user_id: 'u_executive', name: 'Director General Ayush', email: 'dg@ayush.gov.in', username: 'dg.executive', role_name: 'Executive', password_hash: crypto.createHash('sha256').update('demo123').digest('hex') },
];
function publicUser(user) {
    return { id: user.user_id, name: user.name, email: user.email, role: user.role_name };
}
function getDemoUser(username, password) {
    const passwordHash = crypto.createHash('sha256').update(password || '').digest('hex');
    return demoUsers.find((user) => user.username === username && user.password_hash === passwordHash);
}
function getDemoMfaSecret(userId) {
    let secret = demoMfaSecrets.get(userId);
    if (!secret) {
        secret = (0, otplib_1.generateSecret)();
        demoMfaSecrets.set(userId, secret);
    }
    return secret;
}
function createToken() {
    return crypto.randomBytes(32).toString('hex');
}
async function createMfaSetup(user, secret) {
    const uri = (0, otplib_1.generateURI)({ issuer: 'AIIA-CTMS', label: user.email || user.username, secret });
    return { secret, qrCode: await qrcode_1.default.toDataURL(uri), issuer: 'AIIA-CTMS' };
}
function createChallenge(userId) {
    const challengeId = crypto.randomBytes(32).toString('hex');
    mfaChallenges.set(challengeId, { userId, expiresAt: Date.now() + 5 * 60 * 1000 });
    return challengeId;
}
// Initialize Database
(0, database_1.initDb)()
    .then(() => {
    // Start background watcher job every 10 seconds for real-time demo escalation
    setInterval(async () => {
        try {
            await (0, engine_1.checkDeadlinesAndEscalate)();
        }
        catch (err) {
            console.error('Error running PV deadline watcher job:', err);
        }
    }, 10000);
    app.listen(PORT, () => {
        console.log(`AIIA-CTMS backend server running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.warn('Database initialization failed; continuing in demo fallback mode.', err.message || err);
    app.listen(PORT, () => {
        console.log(`AIIA-CTMS backend server running in demo mode on port ${PORT}`);
    });
});
// --- AUTH / LOGIN ROUTE ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const fallbackUser = getDemoUser(username, password);
    if (fallbackUser) {
        const secret = getDemoMfaSecret(fallbackUser.user_id);
        const setup = await createMfaSetup(fallbackUser, secret);
        return res.json({
            mfaRequired: true,
            challengeId: createChallenge(fallbackUser.user_id),
            setup,
            user: publicUser(fallbackUser)
        });
    }
    try {
        const db = await (0, database_1.getDb)();
        const user = await db.get(`SELECT u.*, r.role_name 
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.user_id
       JOIN roles r ON r.role_id = ur.role_id
      WHERE u.username = ? AND u.password_hash = ?`, [username, crypto.createHash('sha256').update(password || '').digest('hex')]);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        let setup;
        let secret = user.mfa_secret;
        if (!secret) {
            secret = (0, otplib_1.generateSecret)();
            await db.run('UPDATE users SET mfa_secret = ? WHERE user_id = ?', [secret, user.user_id]);
            setup = await createMfaSetup(user, secret);
        }
        res.json({
            mfaRequired: true,
            challengeId: createChallenge(user.user_id),
            setup,
            user: publicUser(user)
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/auth/register', async (req, res) => {
    const { name, email, username, password, role } = req.body;
    if (!name || !email || !username || !password || !roleNames.includes(role)) {
        return res.status(400).json({ message: 'Name, email, username, password, and a valid role are required.' });
    }
    if (String(password).length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    const db = await (0, database_1.getDb)();
    try {
        const existing = await db.get('SELECT user_id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existing)
            return res.status(409).json({ message: 'Username or email is already registered.' });
        const userId = `u_${(0, uuid_1.v4)().substring(0, 8)}`;
        const secret = (0, otplib_1.generateSecret)();
        const now = new Date().toISOString();
        const roleRow = await db.get('SELECT role_id FROM roles WHERE role_name = ?', [role]);
        if (!roleRow)
            return res.status(400).json({ message: 'Selected role is not available.' });
        await db.run('INSERT INTO users (user_id, name, email, username, password_hash, mfa_enabled, mfa_secret, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)', [userId, name, email, username, crypto.createHash('sha256').update(password).digest('hex'), secret, now]);
        await db.run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleRow.role_id]);
        const user = { user_id: userId, name, email, username, role_name: role };
        res.status(201).json({ mfaRequired: true, challengeId: createChallenge(userId), setup: await createMfaSetup(user, secret), user: publicUser(user) });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/auth/verify-mfa', async (req, res) => {
    const { challengeId, code } = req.body;
    const challenge = mfaChallenges.get(challengeId);
    if (!challenge || challenge.expiresAt < Date.now()) {
        if (challengeId)
            mfaChallenges.delete(challengeId);
        return res.status(401).json({ message: 'MFA session expired. Please sign in again.' });
    }
    try {
        const demoUser = demoUsers.find((user) => user.user_id === challenge.userId);
        let user = demoUser || null;
        let secret = demoUser ? getDemoMfaSecret(challenge.userId) : null;
        if (!demoUser) {
            const db = await (0, database_1.getDb)();
            user = await db.get(`SELECT u.*, r.role_name FROM users u JOIN user_roles ur ON ur.user_id = u.user_id JOIN roles r ON r.role_id = ur.role_id WHERE u.user_id = ?`, [challenge.userId]);
            secret = user?.mfa_secret || null;
        }
        if (!user || !secret || !/^\d{6}$/.test(String(code || ''))) {
            return res.status(401).json({ message: 'Enter the 6-digit code from your authenticator app.' });
        }
        const result = await (0, otplib_1.verify)({ secret, token: String(code) });
        if (!result.valid)
            return res.status(401).json({ message: 'Invalid or expired authenticator code.' });
        if (!demoUser) {
            const db = await (0, database_1.getDb)();
            await db.run('UPDATE users SET mfa_enabled = 1 WHERE user_id = ?', [user.user_id]);
        }
        mfaChallenges.delete(challengeId);
        res.json({ token: createToken(), user: publicUser(user) });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- STUDIES ENDPOINTS ---
app.post('/api/studies', async (req, res) => {
    const { title, ctri_registration_pending, ctri_reg_number, phase, therapeutic_area, sites, actorId } = req.body;
    const db = await (0, database_1.getDb)();
    // Simple validation
    if (!title || !phase || !therapeutic_area || !actorId) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    // CTRI format check if registered
    if (!ctri_registration_pending && ctri_reg_number) {
        const ctriRegex = /^CTRI\/\d{4}\/\d{2}\/\d{6}$/;
        if (!ctriRegex.test(ctri_reg_number)) {
            return res.status(400).json({ message: 'CTRI number must be in format CTRI/YYYY/MM/XXXXXX' });
        }
    }
    const studyId = `s_${(0, uuid_1.v4)().substring(0, 8)}`;
    const now = new Date().toISOString();
    try {
        await db.run('BEGIN TRANSACTION');
        // Create study
        await db.run(`INSERT INTO studies (study_id, org_id, title, ctri_reg_number, phase, therapeutic_area, status, start_date, created_by, created_at, updated_at)
       VALUES (?, 'org_aiia', ?, ?, ?, ?, 'Pending_IEC', ?, ?, ?, ?)`, [studyId, title, ctri_reg_number || null, phase, therapeutic_area, now.substring(0, 10), actorId, now, now]);
        // Add study sites
        if (sites && Array.isArray(sites)) {
            for (const site of sites) {
                const siteId = `site_${(0, uuid_1.v4)().substring(0, 8)}`;
                await db.run(`INSERT INTO sites (site_id, study_id, name, location, lat, lng, pi_user_id)
           VALUES (?, ?, ?, ?, ?, ?, 'u_pi')`, [siteId, studyId, site.name, site.location, site.lat || 28, site.lng || 77]);
            }
        }
        // Set up default compliance scorecard checkpoints
        const csCheckpoints = ['CTRI Registration', 'IEC Continuing Review', 'SAE Reporting Timeliness', 'Consent Signatures Completeness'];
        const randomizedMetCount = Math.floor(Math.random() * (csCheckpoints.length + 1));
        const randomizedMetCheckpoints = new Set(csCheckpoints
            .sort(() => Math.random() - 0.5)
            .slice(0, randomizedMetCount));
        for (const cp of csCheckpoints) {
            await db.run(`INSERT INTO compliance_scores (score_id, study_id, checkpoint, status, computed_at)
         VALUES (?, ?, ?, ?, ?)`, [`cs_${(0, uuid_1.v4)().substring(0, 8)}`, studyId, cp, randomizedMetCheckpoints.has(cp) ? 'Met' : 'Due', now]);
        }
        // Add milestones
        const msList = ['Protocol Submission', 'IEC Ethics Clearance', 'Trial Registration (CTRI)', 'Subject Enrollment Commencement'];
        for (let i = 0; i < msList.length; i++) {
            const milestoneId = `ms_${(0, uuid_1.v4)().substring(0, 8)}`;
            const plannedDate = new Date();
            plannedDate.setDate(plannedDate.getDate() + (i * 30));
            await db.run(`INSERT INTO milestones (milestone_id, study_id, name, planned_date, actual_date, status)
         VALUES (?, ?, ?, ?, ?, 'Pending')`, [milestoneId, studyId, msList[i], plannedDate.toISOString().substring(0, 10), i === 0 ? now.substring(0, 10) : null]);
        }
        // Log to audit log
        await (0, logger_1.writeAuditLog)(actorId, 'Study', studyId, 'CREATE', 'status', '', 'Pending_IEC');
        await db.run('COMMIT');
        res.status(201).json({ study_id: studyId, status: 'Pending_IEC' });
    }
    catch (err) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/studies', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        const studies = await db.all(`SELECT s.*, o.name as org_name,
       (SELECT COUNT(*) FROM subjects sub JOIN sites si ON si.site_id = sub.site_id WHERE si.study_id = s.study_id) as enrolled_count
       FROM studies s
       JOIN organizations o ON o.org_id = s.org_id`);
        // Attach sites and compliance scores
        for (const study of studies) {
            study.sites = await db.all('SELECT * FROM sites WHERE study_id = ?', [study.study_id]);
            const scores = await db.all('SELECT * FROM compliance_scores WHERE study_id = ?', [study.study_id]);
            study.compliance_scores = scores;
            // Calculate overall score percentage
            const metCount = scores.filter((sc) => sc.status === 'Met').length;
            study.compliance_score_pct = scores.length > 0 ? Math.round((metCount / scores.length) * 100) : 100;
        }
        res.json(studies);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/studies/:id', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        const study = await db.get(`SELECT s.*, o.name as org_name 
       FROM studies s 
       JOIN organizations o ON o.org_id = s.org_id 
       WHERE s.study_id = ?`, [req.params.id]);
        if (!study) {
            return res.status(404).json({ message: 'Study not found' });
        }
        study.sites = await db.all('SELECT * FROM sites WHERE study_id = ?', [study.study_id]);
        study.milestones = await db.all('SELECT * FROM milestones WHERE study_id = ? ORDER BY planned_date ASC', [study.study_id]);
        study.compliance_scores = await db.all('SELECT * FROM compliance_scores WHERE study_id = ?', [study.study_id]);
        const metCount = study.compliance_scores.filter((sc) => sc.status === 'Met').length;
        study.compliance_score_pct = study.compliance_scores.length > 0 ? Math.round((metCount / study.compliance_scores.length) * 100) : 100;
        res.json(study);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- SUBJECTS ENDPOINTS ---
app.post('/api/subjects', async (req, res) => {
    const { site_id, full_name, contact, dosha_profile, actorId } = req.body;
    const db = await (0, database_1.getDb)();
    if (!site_id || !full_name || !contact || !actorId) {
        return res.status(400).json({ message: 'Missing required subject details' });
    }
    const subjectId = `SUB-${(0, uuid_1.v4)().substring(0, 6).toUpperCase()}`;
    const now = new Date().toISOString();
    try {
        await db.run('BEGIN TRANSACTION');
        // Create base subject
        await db.run(`INSERT INTO subjects (subject_id, site_id, enrollment_status, enrollment_date, dosha_profile, created_at)
       VALUES (?, ?, 'Screened', ?, ?, ?)`, [subjectId, site_id, now.substring(0, 10), dosha_profile ? JSON.stringify(dosha_profile) : null, now]);
        // Encrypt and store PII
        const nameEnc = Buffer.from(full_name).toString('base64');
        const contactEnc = Buffer.from(contact).toString('base64');
        const abdmId = `ABHA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        await db.run(`INSERT INTO subject_pii (subject_id, full_name_encrypted, contact_encrypted, abdm_health_id)
       VALUES (?, ?, ?, ?)`, [subjectId, nameEnc, contactEnc, abdmId]);
        // Sign mock consent document
        const docId = `doc_${(0, uuid_1.v4)().substring(0, 8)}`;
        await db.run(`INSERT INTO documents (document_id, entity_type, entity_id, file_ref, version, uploaded_by, uploaded_at)
       VALUES (?, 'Consent', ?, ?, '1.0', ?, ?)`, [docId, subjectId, `/s3/consents/${subjectId}_consent_v1.pdf`, actorId, now]);
        await db.run(`INSERT INTO consents (consent_id, subject_id, version, signed_date, document_ref)
       VALUES (?, ?, '1.0', ?, ?)`, [`c_${(0, uuid_1.v4)().substring(0, 8)}`, subjectId, now.substring(0, 10), docId]);
        // Log to audit log (de-identified only!)
        await (0, logger_1.writeAuditLog)(actorId, 'Subject', subjectId, 'CREATE', 'enrollment_status', '', 'Screened');
        await db.run('COMMIT');
        res.status(201).json({ subject_id: subjectId, status: 'Screened' });
    }
    catch (err) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/subjects', async (req, res) => {
    const db = await (0, database_1.getDb)();
    const { study_id } = req.query;
    try {
        let query = `
      SELECT s.*, si.name as site_name, st.title as study_title, st.study_id
      FROM subjects s
      JOIN sites si ON si.site_id = s.site_id
      JOIN studies st ON st.study_id = si.study_id
    `;
        const params = [];
        if (study_id) {
            query += ` WHERE st.study_id = ?`;
            params.push(study_id);
        }
        const subjects = await db.all(query, params);
        // Attach consent signatures
        for (const sub of subjects) {
            sub.consent = await db.get('SELECT * FROM consents WHERE subject_id = ?', [sub.subject_id]);
            sub.pii = await db.get('SELECT abdm_health_id FROM subject_pii WHERE subject_id = ?', [sub.subject_id]);
        }
        res.json(subjects);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Update subject enrollment status (eCRF action)
app.post('/api/subjects/:id/status', async (req, res) => {
    const { status, actorId } = req.body;
    const db = await (0, database_1.getDb)();
    try {
        const oldSub = await db.get('SELECT enrollment_status FROM subjects WHERE subject_id = ?', [req.params.id]);
        if (!oldSub)
            return res.status(404).json({ message: 'Subject not found' });
        await db.run('UPDATE subjects SET enrollment_status = ? WHERE subject_id = ?', [status, req.params.id]);
        await (0, logger_1.writeAuditLog)(actorId, 'Subject', req.params.id, 'UPDATE', 'enrollment_status', oldSub.enrollment_status, status);
        res.json({ message: 'Subject enrollment status updated' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- eCRF DATA ENTRY ENDPOINTS ---
app.post('/api/ecrf/:subjectId', async (req, res) => {
    const { form_type, visit_number, fields, actorId } = req.body;
    const db = await (0, database_1.getDb)();
    if (!form_type || !visit_number || !fields || !actorId) {
        return res.status(400).json({ message: 'Missing required parameters' });
    }
    const entryId = `e_${(0, uuid_1.v4)().substring(0, 8)}`;
    const now = new Date().toISOString();
    try {
        await db.run('BEGIN TRANSACTION');
        // Create entry
        await db.run(`INSERT INTO ecrf_entries (entry_id, subject_id, form_type, visit_number, entered_by, entered_at, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Submitted')`, [entryId, req.params.subjectId, form_type, visit_number, actorId, now]);
        // Save field values with SDTM mapping configuration
        for (const key of Object.keys(fields)) {
            const valueId = `v_${(0, uuid_1.v4)().substring(0, 8)}`;
            let sdtmDomain = '';
            let sdtmVariable = '';
            // Auto CDASH to SDTM Mapping logic for MVP domains
            if (form_type === 'Demographics') {
                sdtmDomain = 'DM';
                sdtmVariable = key; // e.g. AGE -> AGE, SEX -> SEX, RACE -> RACE
            }
            else if (form_type === 'Vitals') {
                sdtmDomain = 'VS';
                sdtmVariable = key === 'SYSBP' || key === 'DIABP' || key === 'HR' || key === 'TEMP' ? 'VSORRES' : key;
            }
            else if (form_type === 'ConMeds') {
                sdtmDomain = 'CM';
                sdtmVariable = key === 'drug_name' ? 'CMTRT' : key === 'dose' ? 'CMDOSE' : key === 'frequency' ? 'CMDOSFRQ' : key;
            }
            await db.run(`INSERT INTO ecrf_field_values (value_id, entry_id, field_name, field_value, sdtm_domain, sdtm_variable)
         VALUES (?, ?, ?, ?, ?, ?)`, [valueId, entryId, key, fields[key].toString(), sdtmDomain, sdtmVariable]);
        }
        // Log audit entry
        await (0, logger_1.writeAuditLog)(actorId, 'eCRF_Entry', entryId, 'CREATE', 'status', '', 'Submitted');
        await db.run('COMMIT');
        res.status(201).json({ entry_id: entryId, status: 'Submitted' });
    }
    catch (err) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/ecrf/completeness/:studyId', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        // Return percent completeness per domain per site for Data Manager
        const sites = await db.all('SELECT site_id, name FROM sites WHERE study_id = ?', [req.params.studyId]);
        const formTypes = ['Demographics', 'Vitals', 'ConMeds'];
        const completionMatrix = [];
        for (const site of sites) {
            const subjects = await db.all('SELECT subject_id FROM subjects WHERE site_id = ? AND enrollment_status != \'Screened\'', [site.site_id]);
            const subCount = subjects.length;
            const siteResult = { site_id: site.site_id, site_name: site.name, forms: {} };
            for (const form of formTypes) {
                if (subCount === 0) {
                    siteResult.forms[form] = 0;
                    continue;
                }
                // Count how many subjects have submitted this form
                const submittedForms = await db.get(`SELECT COUNT(DISTINCT subject_id) as count 
           FROM ecrf_entries 
           WHERE subject_id IN (SELECT subject_id FROM subjects WHERE site_id = ?) 
           AND form_type = ? AND status = 'Submitted'`, [site.site_id, form]);
                const count = submittedForms ? submittedForms.count : 0;
                const completionPct = Math.round((count / subCount) * 100);
                siteResult.forms[form] = Math.min(completionPct, 100);
            }
            completionMatrix.push(siteResult);
        }
        res.json(completionMatrix);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- PHARMACOVIGILANCE (AE/SAE) ENDPOINTS ---
app.post('/api/ae', async (req, res) => {
    const { subject_id, study_id, event_type, severity, causality, onset_datetime, description, actorId } = req.body;
    const db = await (0, database_1.getDb)();
    if (!subject_id || !study_id || !event_type || !severity || !causality || !onset_datetime || !description || !actorId) {
        return res.status(400).json({ message: 'Missing AE/SAE parameters' });
    }
    const aeId = `ae_${(0, uuid_1.v4)().substring(0, 8)}`;
    const now = new Date().toISOString();
    try {
        const reportDeadline = await (0, engine_1.calculateDeadline)(event_type, onset_datetime);
        await db.run('BEGIN TRANSACTION');
        // Create AE record
        await db.run(`INSERT INTO ae_events (ae_id, subject_id, study_id, event_type, severity, causality, onset_datetime, description, reported_by, report_deadline, status, escalation_level, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', 0, ?)`, [aeId, subject_id, study_id, event_type, severity, causality, onset_datetime, description, actorId, reportDeadline, now]);
        // Log to audit log
        await (0, logger_1.writeAuditLog)(actorId, 'AE_Event', aeId, 'CREATE', 'status', '', 'Open');
        // If it's a Serious AE, send an immediate notification to the PV Officer
        if (event_type === 'SAE') {
            const pvOfficer = await db.get(`SELECT u.user_id FROM users u 
         JOIN user_roles ur ON ur.user_id = u.user_id 
         JOIN roles r ON r.role_id = ur.role_id 
         WHERE r.role_name = 'PVOfficer' LIMIT 1`);
            if (pvOfficer) {
                const notifId = (0, uuid_1.v4)();
                await db.run(`INSERT INTO notifications (notification_id, user_id, type, message, read, created_at)
           VALUES (?, ?, 'Reminder', ?, 0, ?)`, [notifId, pvOfficer.user_id, `CRITICAL: New SAE reported for subject ${subject_id} in study ${study_id}. 24h Countdown timer has started.`, now]);
            }
        }
        await db.run('COMMIT');
        res.status(201).json({
            ae_id: aeId,
            report_deadline: reportDeadline,
            status: 'Open',
            escalation_level: 0
        });
    }
    catch (err) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/ae', async (req, res) => {
    const db = await (0, database_1.getDb)();
    const { study_id } = req.query;
    try {
        let query = `
      SELECT ae.*, s.title as study_title, sub.site_id, si.name as site_name
      FROM ae_events ae
      JOIN studies s ON s.study_id = ae.study_id
      JOIN subjects sub ON sub.subject_id = ae.subject_id
      JOIN sites si ON si.site_id = sub.site_id
    `;
        const params = [];
        if (study_id) {
            query += ` WHERE ae.study_id = ?`;
            params.push(study_id);
        }
        query += ` ORDER BY ae.onset_datetime DESC`;
        const events = await db.all(query, params);
        // Attach live countdown metrics (seconds remaining)
        const now = new Date().getTime();
        for (const e of events) {
            const deadline = new Date(e.report_deadline).getTime();
            e.time_remaining_seconds = Math.max(0, Math.round((deadline - now) / 1000));
            e.total_duration_seconds = Math.round((deadline - new Date(e.onset_datetime).getTime()) / 1000);
            e.elapsed_percentage = Math.min(100, Math.round(((now - new Date(e.onset_datetime).getTime()) / (deadline - new Date(e.onset_datetime).getTime())) * 100));
            // Get escalation history
            e.escalation_logs = await db.all('SELECT * FROM escalation_logs WHERE ae_id = ? ORDER BY level ASC', [e.ae_id]);
        }
        res.json(events);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Update AE status (e.g. resolve/close it)
app.post('/api/ae/:id/resolve', async (req, res) => {
    const { actorId, comments } = req.body;
    const db = await (0, database_1.getDb)();
    try {
        const event = await db.get('SELECT status, study_id FROM ae_events WHERE ae_id = ?', [req.params.id]);
        if (!event)
            return res.status(404).json({ message: 'AE event not found' });
        await db.run('BEGIN TRANSACTION');
        await db.run("UPDATE ae_events SET status = 'Closed', escalation_level = 0 WHERE ae_id = ?", [req.params.id]);
        // Resolve escalation logs
        await db.run('UPDATE escalation_logs SET resolved = 1 WHERE ae_id = ?', [req.params.id]);
        // Log audit
        await (0, logger_1.writeAuditLog)(actorId, 'AE_Event', req.params.id, 'UPDATE', 'status', event.status, 'Closed');
        // If it was breached, re-verify and update compliance scores
        if (event.status === 'Breached') {
            const breachedCount = await db.get("SELECT COUNT(*) as count FROM ae_events WHERE study_id = ? AND status = 'Breached'", [event.study_id]);
            const count = breachedCount ? breachedCount.count : 0;
            if (count === 0) {
                await db.run("UPDATE compliance_scores SET status = 'Met', computed_at = ? WHERE study_id = ? AND checkpoint = 'SAE Reporting Timeliness'", [new Date().toISOString(), event.study_id]);
            }
        }
        await db.run('COMMIT');
        res.json({ message: 'Safety event resolved successfully' });
    }
    catch (err) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});
// --- IEC / PROTOCOL REVIEW ENDPOINTS ---
app.get('/api/iec/pending', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        const studies = await db.all(`SELECT s.*, o.name as org_name,
       (SELECT COUNT(*) FROM documents d WHERE d.entity_id = s.study_id AND d.entity_type = 'Study') as document_count
       FROM studies s
       JOIN organizations o ON o.org_id = s.org_id
       WHERE s.status = 'Pending_IEC'`);
        res.json(studies);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/iec/review', async (req, res) => {
    const { study_id, reviewer_id, decision, comments, signature_base64 } = req.body;
    const db = await (0, database_1.getDb)();
    if (!study_id || !reviewer_id || !decision) {
        return res.status(400).json({ message: 'Missing review parameters' });
    }
    const reviewId = `rev_${(0, uuid_1.v4)().substring(0, 8)}`;
    const now = new Date().toISOString();
    try {
        await db.run('BEGIN TRANSACTION');
        // Save mock signature document
        let sigDocId = null;
        if (signature_base64) {
            sigDocId = `doc_sig_${(0, uuid_1.v4)().substring(0, 8)}`;
            await db.run(`INSERT INTO documents (document_id, entity_type, entity_id, file_ref, version, uploaded_by, uploaded_at)
         VALUES (?, 'Signature', ?, ?, '1.0', ?, ?)`, [sigDocId, study_id, `/s3/signatures/sig_${reviewer_id}.png`, reviewer_id, now]);
        }
        // Insert review decision
        await db.run(`INSERT INTO iec_reviews (review_id, study_id, reviewer_id, decision, comments, decision_date, e_signature_ref)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [reviewId, study_id, reviewer_id, decision, comments || '', now, sigDocId]);
        // Update study status
        const newStatus = decision === 'Approved' ? 'Active' : decision === 'Revision_Requested' ? 'Draft' : 'Closed';
        await db.run('UPDATE studies SET status = ?, updated_at = ? WHERE study_id = ?', [newStatus, now, study_id]);
        // If approved, update the IEC checklist score
        if (decision === 'Approved') {
            await db.run(`UPDATE compliance_scores SET status = 'Met', computed_at = ?
         WHERE study_id = ? AND checkpoint = 'CTRI Registration'`, [now, study_id]);
            await db.run(`UPDATE compliance_scores SET status = 'Met', computed_at = ?
         WHERE study_id = ? AND checkpoint = 'IEC Continuing Review'`, [now, study_id]);
            // Mark milestone Complete
            await db.run(`UPDATE milestones SET actual_date = ?, status = 'Complete'
         WHERE study_id = ? AND name = 'IEC Ethics Clearance'`, [now.substring(0, 10), study_id]);
        }
        // Log audit
        await (0, logger_1.writeAuditLog)(reviewer_id, 'Study', study_id, 'UPDATE', 'status', 'Pending_IEC', newStatus);
        // Notify Sponsor
        const sponsor = await db.get(`SELECT u.user_id FROM users u 
       JOIN user_roles ur ON ur.user_id = u.user_id 
       JOIN roles r ON r.role_id = ur.role_id 
       WHERE r.role_name = 'Sponsor' LIMIT 1`);
        if (sponsor) {
            const msg = `Ethics Committee decision logged for study ${study_id}: Status updated to ${newStatus}.`;
            await db.run(`INSERT INTO notifications (notification_id, user_id, type, message, read, created_at)
         VALUES (?, ?, 'Decision', ?, 0, ?)`, [`notif_${(0, uuid_1.v4)().substring(0, 8)}`, sponsor.user_id, msg, now]);
        }
        await db.run('COMMIT');
        res.status(201).json({ review_id: reviewId, status: newStatus });
    }
    catch (err) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});
// --- PROTOCOL DEVIATIONS & REMINDERS ENDPOINTS ---
app.get('/api/iec/deviations', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        const list = await db.all(`SELECT pd.*, s.title as study_title 
       FROM protocol_deviations pd
       JOIN studies s ON s.study_id = pd.study_id
       ORDER BY pd.reported_at DESC`);
        res.json(list);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/iec/deviations/:id/resolve', async (req, res) => {
    const { actorId, status } = req.body;
    const db = await (0, database_1.getDb)();
    try {
        const oldDev = await db.get('SELECT status, study_id FROM protocol_deviations WHERE deviation_id = ?', [req.params.id]);
        if (!oldDev)
            return res.status(404).json({ message: 'Deviation not found' });
        await db.run("UPDATE protocol_deviations SET status = ? WHERE deviation_id = ?", [status || 'Reviewed', req.params.id]);
        await (0, logger_1.writeAuditLog)(actorId, 'Protocol_Deviation', req.params.id, 'UPDATE', 'status', oldDev.status, status || 'Reviewed');
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/iec/reminders', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        const list = await db.all(`SELECT cs.*, s.title as study_title 
       FROM compliance_scores cs
       JOIN studies s ON s.study_id = cs.study_id
       WHERE cs.checkpoint = 'IEC Continuing Review' OR cs.status = 'Due'`);
        res.json(list);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/iec/reminders/:id/recertify', async (req, res) => {
    const { actorId } = req.body;
    const db = await (0, database_1.getDb)();
    const now = new Date().toISOString();
    try {
        const oldScore = await db.get('SELECT status, study_id FROM compliance_scores WHERE score_id = ?', [req.params.id]);
        if (!oldScore)
            return res.status(404).json({ message: 'Remind scorecard not found' });
        await db.run("UPDATE compliance_scores SET status = 'Met', computed_at = ? WHERE score_id = ?", [now, req.params.id]);
        await (0, logger_1.writeAuditLog)(actorId, 'Compliance_Score', req.params.id, 'UPDATE', 'status', oldScore.status, 'Met');
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- AUDIT TRAIL ENDPOINTS ---
app.get('/api/audit', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        const logs = await db.all(`SELECT al.*, u.name as actor_name 
       FROM audit_logs al
       JOIN users u ON u.user_id = al.actor_id
       ORDER BY al.created_at DESC`);
        res.json(logs);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/audit/verify', async (req, res) => {
    try {
        const result = await (0, logger_1.verifyAuditChain)();
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// In-memory store to remember what was tampered so we can restore it
let tamperedRecord = null;
// Endpoint to simulate tampering for verification testing
app.post('/api/audit/tamper', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        // Fetch the last audit record including its original new_value before tampering
        const lastRecord = await db.get('SELECT audit_id, new_value FROM audit_logs ORDER BY created_at DESC LIMIT 1');
        if (!lastRecord) {
            return res.status(400).json({ message: 'No audit records to tamper' });
        }
        // Save the original value so we can restore it later
        tamperedRecord = { audit_id: lastRecord.audit_id, original_new_value: lastRecord.new_value };
        await db.run("UPDATE audit_logs SET new_value = 'TAMPERED_VALUE' WHERE audit_id = ?", [lastRecord.audit_id]);
        res.json({ message: `Tampered with audit record ID ${lastRecord.audit_id}. Verify chain to check detection.` });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Endpoint to restore the tampered record back to its original state
app.post('/api/audit/reset', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        if (!tamperedRecord) {
            // Nothing was tampered — chain is already clean
            return res.json({ message: 'No tampered record to restore. Ledger is already clean.' });
        }
        // Fetch the full record so we can recompute the correct hash
        const record = await db.get('SELECT * FROM audit_logs WHERE audit_id = ?', [tamperedRecord.audit_id]);
        if (!record) {
            tamperedRecord = null;
            return res.status(404).json({ message: 'Tampered record not found.' });
        }
        const originalNewValue = tamperedRecord.original_new_value;
        // Recompute the correct SHA-256 hash using the original new_value
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        const payload = record.prev_hash +
            record.actor_id +
            record.entity_type +
            record.entity_id +
            record.action +
            (record.field || '') +
            (record.old_value || '') +
            (originalNewValue || '') +
            record.created_at;
        const correctHash = crypto.createHash('sha256').update(payload).digest('hex');
        // Restore the original new_value AND its correct record_hash
        await db.run('UPDATE audit_logs SET new_value = ?, record_hash = ? WHERE audit_id = ?', [originalNewValue, correctHash, tamperedRecord.audit_id]);
        tamperedRecord = null;
        res.json({ message: 'Audit ledger restored to original state. Hash chain is valid again.' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- NOTIFICATIONS ENDPOINTS ---
app.get('/api/notifications/:userId', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        const list = await db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
        res.json(list);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/notifications/:id/read', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        await db.run('UPDATE notifications SET read = 1 WHERE notification_id = ?', [req.params.id]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- SDTM EXPORTER ENDPOINT ---
app.get('/api/export/sdtm/:studyId', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        // Generate SDTM JSON data structure mapping the relational tables
        const study = await db.get('SELECT * FROM studies WHERE study_id = ?', [req.params.studyId]);
        if (!study)
            return res.status(404).json({ message: 'Study not found' });
        // DM Domain
        const dmQuery = `
      SELECT s.subject_id as USUBJID, ? as STUDYID, s.enrollment_status as ARM, s.enrollment_date as RFSTDTC,
      (SELECT field_value FROM ecrf_field_values efv JOIN ecrf_entries ee ON ee.entry_id = efv.entry_id WHERE ee.subject_id = s.subject_id AND efv.field_name = 'AGE' LIMIT 1) as AGE,
      (SELECT field_value FROM ecrf_field_values efv JOIN ecrf_entries ee ON ee.entry_id = efv.entry_id WHERE ee.subject_id = s.subject_id AND efv.field_name = 'SEX' LIMIT 1) as SEX,
      (SELECT field_value FROM ecrf_field_values efv JOIN ecrf_entries ee ON ee.entry_id = efv.entry_id WHERE ee.subject_id = s.subject_id AND efv.field_name = 'RACE' LIMIT 1) as RACE
      FROM subjects s
      JOIN sites si ON si.site_id = s.site_id
      WHERE si.study_id = ? AND s.enrollment_status != 'Screened'
    `;
        const dmDataset = await db.all(dmQuery, [study.study_id, study.study_id]);
        // VS Domain
        const vsQuery = `
      SELECT s.subject_id as USUBJID, ? as STUDYID, efv.field_name as VSTESTCD, efv.field_value as VSORRES, ee.visit_number as VISITNUM, ee.entered_at as VSDTC
      FROM ecrf_field_values efv
      JOIN ecrf_entries ee ON ee.entry_id = efv.entry_id
      JOIN subjects s ON s.subject_id = ee.subject_id
      JOIN sites si ON si.site_id = s.site_id
      WHERE si.study_id = ? AND efv.sdtm_domain = 'VS'
    `;
        const vsDataset = await db.all(vsQuery, [study.study_id, study.study_id]);
        // CM Domain
        const cmQuery = `
      SELECT s.subject_id as USUBJID, ? as STUDYID,
      (SELECT field_value FROM ecrf_field_values WHERE entry_id = ee.entry_id AND field_name = 'CMTRT' LIMIT 1) as CMTRT,
      (SELECT field_value FROM ecrf_field_values WHERE entry_id = ee.entry_id AND field_name = 'DOSE' LIMIT 1) as CMDOSE,
      (SELECT field_value FROM ecrf_field_values WHERE entry_id = ee.entry_id AND field_name = 'frequency' LIMIT 1) as CMDOSFRQ,
      ee.entered_at as CMDTC
      FROM ecrf_entries ee
      JOIN subjects s ON s.subject_id = ee.subject_id
      JOIN sites si ON si.site_id = s.site_id
      WHERE si.study_id = ? AND ee.form_type = 'ConMeds'
    `;
        const cmDataset = await db.all(cmQuery, [study.study_id, study.study_id]);
        // AE Domain
        const aeQuery = `
      SELECT ae.subject_id as USUBJID, ae.study_id as STUDYID, ae.description as AETERM, ae.severity as AESEV, ae.causality as AEREL, ae.onset_datetime as AESTDTC, ae.status as AEOUT
      FROM ae_events ae
      WHERE ae.study_id = ?
    `;
        const aeDataset = await db.all(aeQuery, [study.study_id]);
        // Define-XML simulation
        const defineXml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <ODM xmlns="http://www.cdisc.org/ns/odm/v1.3" FileType="Transactional" FileOID="AIIA-CTMS-${study.study_id}" CreationDateTime="${new Date().toISOString()}">
        <Study OID="${study.study_id}">
          <GlobalVariables>
            <StudyName>${study.title}</StudyName>
            <ProtocolName>${study.title.substring(0, 30)}</ProtocolName>
          </GlobalVariables>
          <MetaDataVersion OID="MDV.AIIA-CTMS.001" Name="CDISC SDTM Metadata Definition" Description="Seeded metadata for trial submission">
             <ItemGroupDef OID="IG.DM" Name="DM" Repeating="No" Domain="DM" Purpose="Tabulation">
               <ItemRef ItemOID="IT.USUBJID" OrderNumber="1" Mandatory="Yes"/>
               <ItemRef ItemOID="IT.AGE" OrderNumber="2" Mandatory="Yes"/>
               <ItemRef ItemOID="IT.SEX" OrderNumber="3" Mandatory="Yes"/>
               <ItemRef ItemOID="IT.RACE" OrderNumber="4" Mandatory="Yes"/>
             </ItemGroupDef>
             <ItemGroupDef OID="IG.VS" Name="VS" Repeating="Yes" Domain="VS" Purpose="Tabulation">
               <ItemRef ItemOID="IT.USUBJID" OrderNumber="1"/>
               <ItemRef ItemOID="IT.VSTESTCD" OrderNumber="2"/>
               <ItemRef ItemOID="IT.VSORRES" OrderNumber="3"/>
             </ItemGroupDef>
             <ItemGroupDef OID="IG.CM" Name="CM" Repeating="Yes" Domain="CM" Purpose="Tabulation">
               <ItemRef ItemOID="IT.USUBJID" OrderNumber="1"/>
               <ItemRef ItemOID="IT.CMTRT" OrderNumber="2"/>
               <ItemRef ItemOID="IT.CMDOSE" OrderNumber="3"/>
             </ItemGroupDef>
          </MetaDataVersion>
        </Study>
      </ODM>
    `.trim();
        res.json({
            study_id: study.study_id,
            title: study.title,
            defineXml,
            datasets: {
                DM: dmDataset,
                VS: vsDataset,
                CM: cmDataset,
                AE: aeDataset
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/export/ctri/:studyId', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        const study = await db.get('SELECT * FROM studies WHERE study_id = ?', [req.params.studyId]);
        if (!study)
            return res.status(404).json({ message: 'Study not found' });
        const sites = await db.all('SELECT * FROM sites WHERE study_id = ?', [study.study_id]);
        const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<ctri_trial_export>
  <trial_id>${study.study_id}</trial_id>
  <public_title>${study.title}</public_title>
  <scientific_title>${study.title}</scientific_title>
  <ctri_number>${study.ctri_reg_number || 'Pending Board Approval'}</ctri_number>
  <phase>${study.phase}</phase>
  <therapeutic_area>${study.therapeutic_area}</therapeutic_area>
  <status>${study.status}</status>
  <start_date>${study.start_date}</start_date>
  <sites_count>${sites.length}</sites_count>
  <sites>
    ${sites.map((s) => `
    <site>
      <name>${s.name}</name>
      <location>${s.location}</location>
      <pi_user_id>${s.pi_user_id}</pi_user_id>
    </site>`).join('')}
  </sites>
</ctri_trial_export>
    `.trim();
        res.setHeader('Content-Type', 'application/xml');
        res.send(xml);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- DATA QUERIES & DOCUMENTS ENDPOINTS ---
app.get('/api/ecrf/queries', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        const list = await db.all(`SELECT ee.*, s.subject_id, si.name as site_name, efv.field_name, efv.field_value
       FROM ecrf_entries ee
       JOIN subjects s ON s.subject_id = ee.subject_id
       JOIN sites si ON si.site_id = s.site_id
       LEFT JOIN ecrf_field_values efv ON efv.entry_id = ee.entry_id
       WHERE ee.status = 'Queried'`);
        res.json(list);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/ecrf/queries/:id/resolve', async (req, res) => {
    const { actorId } = req.body;
    const db = await (0, database_1.getDb)();
    try {
        const entry = await db.get('SELECT status, subject_id FROM ecrf_entries WHERE entry_id = ?', [req.params.id]);
        if (!entry)
            return res.status(404).json({ message: 'eCRF entry not found' });
        await db.run("UPDATE ecrf_entries SET status = 'Submitted' WHERE entry_id = ?", [req.params.id]);
        await (0, logger_1.writeAuditLog)(actorId, 'eCRF_Entry', req.params.id, 'UPDATE', 'status', 'Queried', 'Submitted');
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/documents', async (req, res) => {
    const db = await (0, database_1.getDb)();
    try {
        const list = await db.all(`SELECT d.*, u.name as uploader_name 
       FROM documents d
       JOIN users u ON u.user_id = d.uploaded_by
       ORDER BY d.uploaded_at DESC`);
        res.json(list);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- FHIR R4 INTEROPERABILITY ENDPOINTS ---
app.get('/fhir/Patient/:id', async (req, res) => {
    try {
        const resource = await (0, gateway_1.getFhirPatient)(req.params.id);
        if (!resource) {
            return res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: `Patient ${req.params.id} not found` }] });
        }
        res.setHeader('Content-Type', 'application/fhir+json');
        res.json(resource);
    }
    catch (err) {
        res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
});
app.get('/fhir/ResearchStudy/:id', async (req, res) => {
    try {
        const resource = await (0, gateway_1.getFhirResearchStudy)(req.params.id);
        if (!resource) {
            return res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: `ResearchStudy ${req.params.id} not found` }] });
        }
        res.setHeader('Content-Type', 'application/fhir+json');
        res.json(resource);
    }
    catch (err) {
        res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
});
app.get('/fhir/AdverseEvent/:id', async (req, res) => {
    try {
        const resource = await (0, gateway_1.getFhirAdverseEvent)(req.params.id);
        if (!resource) {
            return res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: `AdverseEvent ${req.params.id} not found` }] });
        }
        res.setHeader('Content-Type', 'application/fhir+json');
        res.json(resource);
    }
    catch (err) {
        res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
});
