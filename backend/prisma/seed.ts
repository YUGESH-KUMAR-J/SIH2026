import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const dateHoursAgo = (hours: number) => {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
};

async function main() {
  console.log('--- Starting AIIA CTMS Prisma Seeder ---');

  // Clean existing records in reverse dependency order
  console.log('Cleaning existing records...');
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.complianceScore.deleteMany({});
  await prisma.protocolDeviation.deleteMany({});
  await prisma.iecReview.deleteMany({});
  await prisma.escalationLog.deleteMany({});
  await prisma.aeEvent.deleteMany({});
  await prisma.deadlineRule.deleteMany({});
  await prisma.ecrfFieldValue.deleteMany({});
  await prisma.ecrfEntry.deleteMany({});
  await prisma.consent.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.subjectPii.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.site.deleteMany({});
  await prisma.study.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.organization.deleteMany({});

  const nowStr = new Date().toISOString();

  // 1. Roles
  console.log('Seeding Roles...');
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
    await prisma.role.create({ data: r });
  }

  // 2. Users
  console.log('Seeding Users...');
  const users = [
    { user_id: 'u_pi', name: 'Dr. Rajesh Kumar', email: 'rajesh@aiia.gov.in', username: 'rajesh.pi', password: 'demo123', mfa_enabled: 0 },
    { user_id: 'u_iec', name: 'Dr. Sunita Sharma', email: 'sunita@aiia.gov.in', username: 'sunita.iec', password: 'demo123', mfa_enabled: 0 },
    { user_id: 'u_dm', name: 'Manish Gupta', email: 'manish@aiia.gov.in', username: 'manish.dm', password: 'demo123', mfa_enabled: 0 },
    { user_id: 'u_pv', name: 'Dr. Vikram Mehta', email: 'vikram@npvcc.gov.in', username: 'vikram.pv', password: 'demo123', mfa_enabled: 0 },
    { user_id: 'u_sponsor', name: 'Amit Verma', email: 'amit@sponsor.com', username: 'amit.sponsor', password: 'demo123', mfa_enabled: 0 },
    { user_id: 'u_auditor', name: 'Inspector Roger', email: 'roger@auditor.org', username: 'roger.auditor', password: 'demo123', mfa_enabled: 0 },
    { user_id: 'u_executive', name: 'Director General Ayush', email: 'dg@ayush.gov.in', username: 'dg.executive', password: 'demo123', mfa_enabled: 0 },
  ];
  for (const u of users) {
    await prisma.user.create({
      data: {
        user_id: u.user_id,
        name: u.name,
        email: u.email,
        username: u.username,
        password_hash: crypto.createHash('sha256').update(u.password).digest('hex'),
        mfa_enabled: u.mfa_enabled,
        mfa_secret: 'JBSWY3DPEHPK3PXP',
        created_at: nowStr,
      },
    });
    const rId = 'r_' + u.user_id.split('_')[1];
    await prisma.userRole.create({
      data: {
        user_id: u.user_id,
        role_id: rId,
        site_id: u.user_id === 'u_pi' ? 'site_delhi' : null,
      },
    });
  }

  // 3. Organizations
  console.log('Seeding Organizations...');
  const orgs = [
    { org_id: 'org_aiia', name: 'All India Institute of Ayurveda (AIIA)', org_type: 'Institute' },
    { org_id: 'org_ayush', name: 'Ministry of Ayush', org_type: 'Ministry' },
    { org_id: 'org_rari', name: 'Regional Ayurveda Research Institute', org_type: 'Site-host' },
  ];
  for (const o of orgs) {
    await prisma.organization.create({
      data: {
        org_id: o.org_id,
        name: o.name,
        org_type: o.org_type,
        created_at: nowStr,
      },
    });
  }

  // 4. Studies
  console.log('Seeding Studies...');
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
    await prisma.study.create({
      data: {
        study_id: s.study_id,
        org_id: s.org_id,
        title: s.title,
        ctri_reg_number: s.ctri_reg_number,
        phase: s.phase,
        therapeutic_area: s.therapeutic_area,
        status: s.status,
        start_date: s.start_date,
        end_date: s.end_date,
        created_by: s.created_by,
        created_at: nowStr,
        updated_at: nowStr,
      },
    });
  }

  // 5. Sites
  console.log('Seeding Sites...');
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
    await prisma.site.create({ data: s });
  }

  // 6. Documents & Mock Files
  console.log('Seeding Documents...');
  const documents = [
    { document_id: 'doc_consent_v1', entity_type: 'Consent', entity_id: 's_ashwagandha', file_ref: '/s3/consents/ashwagandha_v1.pdf', version: '1.0', uploaded_by: 'u_pi', uploaded_at: nowStr },
    { document_id: 'doc_consent_v2', entity_type: 'Consent', entity_id: 's_ayush64', file_ref: '/s3/consents/ayush64_v1.pdf', version: '1.0', uploaded_by: 'u_pi', uploaded_at: nowStr },
    { document_id: 'doc_sig_1', entity_type: 'IEC_Review', entity_id: 's_ashwagandha', file_ref: '/s3/signatures/sunita_sig_1.png', version: '1.0', uploaded_by: 'u_iec', uploaded_at: nowStr },
    { document_id: 'doc_sig_2', entity_type: 'IEC_Review', entity_id: 's_ayush64', file_ref: '/s3/signatures/sunita_sig_2.png', version: '1.0', uploaded_by: 'u_iec', uploaded_at: nowStr },
  ];
  for (const doc of documents) {
    await prisma.document.create({ data: doc });
  }

  // 7. Subjects & Encrypted PII
  console.log('Seeding Subjects & PII...');
  const subjectsData = [
    { id: 'sub_delhi_001', status: 'Completed', date: '2026-01-20', profile: '{"vata": 40, "pitta": 30, "kapha": 30}', site: 'site_delhi', name: 'Ramesh Sharma', contact: '+91-9876543210' },
    { id: 'sub_delhi_002', status: 'Randomized', date: '2026-02-05', profile: '{"vata": 20, "pitta": 50, "kapha": 30}', site: 'site_delhi', name: 'Sanjay Verma', contact: '+91-9988776655' },
    { id: 'sub_delhi_003', status: 'Randomized', date: '2026-02-12', profile: '{"vata": 30, "pitta": 30, "kapha": 40}', site: 'site_delhi', name: 'Pooja Patel', contact: '+91-9898989898' },
    { id: 'sub_delhi_004', status: 'Screened', date: '2026-03-01', profile: null, site: 'site_delhi', name: 'Anjali Gupta', contact: '+91-9797979797' },
    { id: 'sub_delhi_005', status: 'Withdrawn', date: '2026-01-22', profile: '{"vata": 50, "pitta": 20, "kapha": 30}', site: 'site_delhi', name: 'Vikram Singh', contact: '+91-9696969696' },
    { id: 'sub_jaipur_001', status: 'Randomized', date: '2026-02-10', profile: '{"vata": 35, "pitta": 35, "kapha": 30}', site: 'site_jaipur', name: 'Karan Johar', contact: '+91-9595959595' },
    { id: 'sub_jaipur_002', status: 'Completed', date: '2026-01-18', profile: '{"vata": 30, "pitta": 45, "kapha": 25}', site: 'site_jaipur', name: 'Meena Kanwar', contact: '+91-9494949494' },
    { id: 'sub_jaipur_003', status: 'Screened', date: '2026-03-05', profile: null, site: 'site_jaipur', name: 'Rajendra Prasad', contact: '+91-9393939393' },
    { id: 'sub_goa_001', status: 'Randomized', date: '2026-03-25', profile: '{"vata": 25, "pitta": 25, "kapha": 50}', site: 'site_goa', name: 'Fernandes Dsouza', contact: '+91-9292929292' },
    { id: 'sub_goa_002', status: 'Completed', date: '2026-04-01', profile: '{"vata": 40, "pitta": 40, "kapha": 20}', site: 'site_goa', name: 'Maria Souza', contact: '+91-9191919191' },
  ];

  for (const s of subjectsData) {
    await prisma.subject.create({
      data: {
        subject_id: s.id,
        site_id: s.site,
        enrollment_status: s.status,
        enrollment_date: s.date,
        dosha_profile: s.profile,
        created_at: nowStr,
      },
    });

    const nameEnc = Buffer.from(s.name).toString('base64');
    const contactEnc = Buffer.from(s.contact).toString('base64');
    const healthId = `ABHA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    await prisma.subjectPii.create({
      data: {
        subject_id: s.id,
        full_name_encrypted: nameEnc,
        contact_encrypted: contactEnc,
        abdm_health_id: healthId,
      },
    });

    if (s.status !== 'Screened') {
      const consentId = `c_${s.id}`;
      const docRef = s.site.includes('goa') ? 'doc_consent_v2' : 'doc_consent_v1';
      await prisma.consent.create({
        data: {
          consent_id: consentId,
          subject_id: s.id,
          version: '1.0',
          signed_date: s.date,
          document_ref: docRef,
        },
      });
    }
  }

  // 8. eCRF Form Entries & Field Values
  console.log('Seeding eCRF Entries & Field Values...');
  const entries = [
    { entry_id: 'e_001', subject_id: 'sub_delhi_001', form_type: 'Demographics', visit_number: 1, entered_by: 'u_pi', status: 'Submitted' },
    { entry_id: 'e_002', subject_id: 'sub_delhi_001', form_type: 'Vitals', visit_number: 1, entered_by: 'u_pi', status: 'Submitted' },
    { entry_id: 'e_003', subject_id: 'sub_delhi_001', form_type: 'ConMeds', visit_number: 1, entered_by: 'u_pi', status: 'Submitted' },
    { entry_id: 'e_004', subject_id: 'sub_delhi_002', form_type: 'Demographics', visit_number: 1, entered_by: 'u_pi', status: 'Submitted' },
    { entry_id: 'e_005', subject_id: 'sub_delhi_002', form_type: 'Vitals', visit_number: 1, entered_by: 'u_pi', status: 'Draft' },
    { entry_id: 'e_006', subject_id: 'sub_jaipur_001', form_type: 'Demographics', visit_number: 1, entered_by: 'u_pi', status: 'Submitted' },
    { entry_id: 'e_007', subject_id: 'sub_jaipur_001', form_type: 'Vitals', visit_number: 1, entered_by: 'u_pi', status: 'Queried' },
    { entry_id: 'e_008', subject_id: 'sub_goa_001', form_type: 'Demographics', visit_number: 1, entered_by: 'u_pi', status: 'Submitted' },
  ];

  for (const e of entries) {
    await prisma.ecrfEntry.create({
      data: {
        entry_id: e.entry_id,
        subject_id: e.subject_id,
        form_type: e.form_type,
        visit_number: e.visit_number,
        entered_by: e.entered_by,
        entered_at: nowStr,
        status: e.status,
      },
    });
  }

  const fields = [
    { val_id: 'v_1', entry_id: 'e_001', name: 'AGE', value: '45', domain: 'DM', variable: 'AGE' },
    { val_id: 'v_2', entry_id: 'e_001', name: 'SEX', value: 'M', domain: 'DM', variable: 'SEX' },
    { val_id: 'v_3', entry_id: 'e_001', name: 'RACE', value: 'ASIAN', domain: 'DM', variable: 'RACE' },
    { val_id: 'v_4', entry_id: 'e_002', name: 'SYSBP', value: '120', domain: 'VS', variable: 'VSORRES' },
    { val_id: 'v_5', entry_id: 'e_002', name: 'DIABP', value: '80', domain: 'VS', variable: 'VSORRES' },
    { val_id: 'v_6', entry_id: 'e_002', name: 'HR', value: '72', domain: 'VS', variable: 'VSORRES' },
    { val_id: 'v_7', entry_id: 'e_003', name: 'CMTRT', value: 'Chyawanprash', domain: 'CM', variable: 'CMTRT' },
    { val_id: 'v_8', entry_id: 'e_003', name: 'DOSE', value: '10g', domain: 'CM', variable: 'CMDOSE' },
    { val_id: 'v_9', entry_id: 'e_004', name: 'AGE', value: '38', domain: 'DM', variable: 'AGE' },
    { val_id: 'v_10', entry_id: 'e_004', name: 'SEX', value: 'F', domain: 'DM', variable: 'SEX' },
    { val_id: 'v_11', entry_id: 'e_005', name: 'SYSBP', value: '135', domain: 'VS', variable: 'VSORRES' },
    { val_id: 'v_12', entry_id: 'e_006', name: 'AGE', value: '29', domain: 'DM', variable: 'AGE' },
    { val_id: 'v_13', entry_id: 'e_006', name: 'SEX', value: 'M', domain: 'DM', variable: 'SEX' },
    { val_id: 'v_14', entry_id: 'e_007', name: 'SYSBP', value: '180', domain: 'VS', variable: 'VSORRES' },
    { val_id: 'v_15', entry_id: 'e_008', name: 'AGE', value: '52', domain: 'DM', variable: 'AGE' },
    { val_id: 'v_16', entry_id: 'e_008', name: 'SEX', value: 'F', domain: 'DM', variable: 'SEX' },
  ];

  for (const f of fields) {
    await prisma.ecrfFieldValue.create({
      data: {
        value_id: f.val_id,
        entry_id: f.entry_id,
        field_name: f.name,
        field_value: f.value,
        sdtm_domain: f.domain,
        sdtm_variable: f.variable,
      },
    });
  }

  // 9. Deadline Rules
  console.log('Seeding Deadline Rules...');
  await prisma.deadlineRule.create({
    data: {
      rule_id: 'rule_sae_initial',
      event_type: 'SAE',
      deadline_offset_hours: 24,
      escalation_thresholds_pct: JSON.stringify([50, 80, 100]),
      escalation_chain: JSON.stringify(['PI', 'IEC', 'Sponsor', 'NPvCC']),
      version: 1,
      active: 1,
    },
  });
  await prisma.deadlineRule.create({
    data: {
      rule_id: 'rule_ae_routine',
      event_type: 'AE',
      deadline_offset_hours: 168,
      escalation_thresholds_pct: JSON.stringify([50, 80, 100]),
      escalation_chain: JSON.stringify(['PI', 'DataManager', 'Sponsor']),
      version: 1,
      active: 1,
    },
  });

  // 10. Adverse Events (AE / SAE) & Escalation Logs
  console.log('Seeding Adverse Events (AE/SAE)...');
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
      report_deadline: dateHoursAgo(48 - 168),
      status: 'Closed',
      escalation_level: 0,
    },
    {
      ae_id: 'ae_002',
      subject_id: 'sub_delhi_002',
      study_id: 's_ashwagandha',
      event_type: 'SAE',
      severity: 'Severe',
      causality: 'Probable',
      onset_datetime: dateHoursAgo(2),
      description: 'Acute Gastric Hemorrhage. Subject hospitalized.',
      reported_by: 'u_pi',
      report_deadline: dateHoursAgo(2 - 24),
      status: 'Open',
      escalation_level: 0,
    },
    {
      ae_id: 'ae_003',
      subject_id: 'sub_jaipur_001',
      study_id: 's_ashwagandha',
      event_type: 'SAE',
      severity: 'Life-threatening',
      causality: 'Certain',
      onset_datetime: dateHoursAgo(19),
      description: 'Severe Anaphylactic Shock following study drug ingestion.',
      reported_by: 'u_pi',
      report_deadline: dateHoursAgo(19 - 24),
      status: 'Open',
      escalation_level: 1,
    },
    {
      ae_id: 'ae_004',
      subject_id: 'sub_goa_001',
      study_id: 's_ayush64',
      event_type: 'SAE',
      severity: 'Severe',
      causality: 'Possible',
      onset_datetime: dateHoursAgo(36),
      description: 'Severe liver enzyme elevation (ALT/AST > 5x ULN).',
      reported_by: 'u_pi',
      report_deadline: dateHoursAgo(36 - 24),
      status: 'Breached',
      escalation_level: 3,
    },
  ];

  for (const a of aes) {
    await prisma.aeEvent.create({
      data: {
        ae_id: a.ae_id,
        subject_id: a.subject_id,
        study_id: a.study_id,
        event_type: a.event_type,
        severity: a.severity,
        causality: a.causality,
        onset_datetime: a.onset_datetime,
        description: a.description,
        reported_by: a.reported_by,
        report_deadline: a.report_deadline,
        status: a.status,
        escalation_level: a.escalation_level,
        created_at: a.onset_datetime,
      },
    });

    if (a.escalation_level >= 1) {
      await prisma.escalationLog.create({
        data: {
          escalation_id: `esc_${a.ae_id}_1`,
          ae_id: a.ae_id,
          level: 1,
          notified_role: 'IEC',
          notified_at: dateHoursAgo(24 - 12),
          resolved: 0,
        },
      });
    }
    if (a.escalation_level >= 2) {
      await prisma.escalationLog.create({
        data: {
          escalation_id: `esc_${a.ae_id}_2`,
          ae_id: a.ae_id,
          level: 2,
          notified_role: 'Sponsor',
          notified_at: dateHoursAgo(24 - 4),
          resolved: 0,
        },
      });
    }
    if (a.escalation_level >= 3) {
      await prisma.escalationLog.create({
        data: {
          escalation_id: `esc_${a.ae_id}_3`,
          ae_id: a.ae_id,
          level: 3,
          notified_role: 'NPvCC',
          notified_at: dateHoursAgo(24 - 0),
          resolved: 0,
        },
      });
    }
  }

  // 11. IEC Reviews
  console.log('Seeding IEC Reviews...');
  const reviews = [
    { id: 'rev_1', study: 's_ashwagandha', reviewer: 'u_iec', decision: 'Approved', comments: 'Study protocol v1.2 and consent form approved for implementation.', signature: 'doc_sig_1' },
    { id: 'rev_2', study: 's_ayush64', reviewer: 'u_iec', decision: 'Approved', comments: 'Observational protocol approved. Ensure safety reporting channels are open.', signature: 'doc_sig_2' },
  ];
  for (const r of reviews) {
    await prisma.iecReview.create({
      data: {
        review_id: r.id,
        study_id: r.study,
        reviewer_id: r.reviewer,
        decision: r.decision,
        comments: r.comments,
        decision_date: dateHoursAgo(200),
        e_signature_ref: r.signature,
      },
    });
  }

  // 12. Milestones
  console.log('Seeding Milestones...');
  const ms = [
    { id: 'ms_1', study_id: 's_ashwagandha', name: 'Protocol Finalization', planned: '2025-11-01', actual: '2025-11-05', status: 'Complete' },
    { id: 'ms_2', study_id: 's_ashwagandha', name: 'IEC Ethics Clearance', planned: '2025-12-15', actual: '2025-12-20', status: 'Complete' },
    { id: 'ms_3', study_id: 's_ashwagandha', name: 'Trial Registration (CTRI)', planned: '2026-01-10', actual: '2026-01-15', status: 'Complete' },
    { id: 'ms_4', study_id: 's_ashwagandha', name: 'Subject Enrollment Commencement', planned: '2026-01-15', actual: '2026-01-20', status: 'Complete' },
    { id: 'ms_5', study_id: 's_ashwagandha', name: 'Interim Safety Analysis', planned: '2026-06-30', actual: '2026-07-10', status: 'Complete' },
    { id: 'ms_6', study_id: 's_ashwagandha', name: 'Completion of Target Enrollment', planned: '2026-09-30', actual: null, status: 'Pending' },
    { id: 'ms_7', study_id: 's_haridra', name: 'IEC Approval Board Meeting', planned: '2026-09-10', actual: null, status: 'Pending' },
  ];
  for (const m of ms) {
    await prisma.milestone.create({
      data: {
        milestone_id: m.id,
        study_id: m.study_id,
        name: m.name,
        planned_date: m.planned,
        actual_date: m.actual,
        status: m.status,
      },
    });
  }

  // 13. Protocol Deviations
  console.log('Seeding Protocol Deviations...');
  await prisma.protocolDeviation.create({
    data: {
      deviation_id: 'dev_001',
      study_id: 's_ashwagandha',
      reported_by: 'u_pi',
      description: 'Subject sub_delhi_002 missed Visit 2 window by 4 days due to personal travel.',
      severity: 'Minor',
      status: 'Reviewed',
      reported_at: dateHoursAgo(100),
    },
  });
  await prisma.protocolDeviation.create({
    data: {
      deviation_id: 'dev_002',
      study_id: 's_ashwagandha',
      reported_by: 'u_pi',
      description: 'Blood sample for vitals collection was taken before consent renewal on version 2.0 (consented 1 hour later).',
      severity: 'Major',
      status: 'Open',
      reported_at: dateHoursAgo(10),
    },
  });

  // 14. Compliance Scores
  console.log('Seeding Compliance Scores...');
  const scores = [
    { score_id: 'score_1', study_id: 's_ashwagandha', checkpoint: 'IEC Approved Protocol Adherence', status: 'Met', computed_at: nowStr },
    { score_id: 'score_2', study_id: 's_ashwagandha', checkpoint: 'Informed Consent 100% Signed', status: 'Met', computed_at: nowStr },
    { score_id: 'score_3', study_id: 's_ashwagandha', checkpoint: 'SAE Reporting Within Statutory 24h', status: 'Met', computed_at: nowStr },
    { score_id: 'score_4', study_id: 's_ashwagandha', checkpoint: 'eCRF Field Verification Rate > 90%', status: 'Due', computed_at: nowStr },
  ];
  for (const sc of scores) {
    await prisma.complianceScore.create({ data: sc });
  }

  // 15. Cryptographic Audit Logs (21 CFR Part 11)
  console.log('Seeding Cryptographic Audit Logs...');
  let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const initialAuditEntries = [
    { actor: 'u_sponsor', type: 'Study', id: 's_ashwagandha', action: 'CREATE', field: 'status', oldVal: null, newVal: 'Pending_IEC' },
    { actor: 'u_iec', type: 'IECReview', id: 'rev_1', action: 'APPROVE', field: 'decision', oldVal: 'Pending', newVal: 'Approved' },
    { actor: 'u_sponsor', type: 'Study', id: 's_ashwagandha', action: 'UPDATE', field: 'status', oldVal: 'Pending_IEC', newVal: 'Active' },
    { actor: 'u_pi', type: 'Subject', id: 'sub_delhi_001', action: 'ENROLL', field: 'status', oldVal: null, newVal: 'Screened' },
    { actor: 'u_pi', type: 'Consent', id: 'c_sub_delhi_001', action: 'SIGN', field: 'version', oldVal: null, newVal: '1.0' },
    { actor: 'u_pi', type: 'Subject', id: 'sub_delhi_001', action: 'RANDOMIZE', field: 'status', oldVal: 'Screened', newVal: 'Randomized' },
    { actor: 'u_pi', type: 'EcrfEntry', id: 'e_002', action: 'SUBMIT', field: 'status', oldVal: 'Draft', newVal: 'Submitted' },
    { actor: 'u_pi', type: 'AeEvent', id: 'ae_002', action: 'REPORT_SAE', field: 'severity', oldVal: null, newVal: 'Severe' },
    { actor: 'u_pv', type: 'Escalation', id: 'esc_ae_003_1', action: 'ESCALATE', field: 'level', oldVal: '0', newVal: '1' },
    { actor: 'u_dm', type: 'EcrfEntry', id: 'e_007', action: 'FLAG_QUERY', field: 'status', oldVal: 'Submitted', newVal: 'Queried' },
    { actor: 'u_pi', type: 'ProtocolDeviation', id: 'dev_001', action: 'REPORT', field: 'status', oldVal: null, newVal: 'Reviewed' },
    { actor: 'u_pi', type: 'ProtocolDeviation', id: 'dev_002', action: 'REPORT', field: 'status', oldVal: null, newVal: 'Open' },
    { actor: 'u_sponsor', type: 'Milestone', id: 'ms_1', action: 'COMPLETE', field: 'status', oldVal: 'Pending', newVal: 'Complete' },
  ];

  for (let i = 0; i < initialAuditEntries.length; i++) {
    const item = initialAuditEntries[i];
    const logId = `audit_${1000 + i}`;
    const timestamp = dateHoursAgo(initialAuditEntries.length * 2 - i * 2);

    const recordString = `${prevHash}|${item.actor}|${item.type}|${item.id}|${item.action}|${item.field || ''}|${item.newVal || ''}|${timestamp}`;
    const recordHash = crypto.createHash('sha256').update(recordString).digest('hex');

    await prisma.auditLog.create({
      data: {
        audit_id: logId,
        actor_id: item.actor,
        entity_type: item.type,
        entity_id: item.id,
        action: item.action,
        field: item.field,
        old_value: item.oldVal,
        new_value: item.newVal,
        prev_hash: prevHash,
        record_hash: recordHash,
        created_at: timestamp,
      },
    });

    prevHash = recordHash;
  }

  // 16. Notifications
  console.log('Seeding Notifications...');
  await prisma.notification.create({
    data: {
      notification_id: 'notif_1',
      user_id: 'u_iec',
      type: 'Escalation',
      message: 'URGENT: Serious Adverse Event ae_003 escalated to Ethics Committee. Action required.',
      read: 0,
      created_at: nowStr,
    },
  });
  await prisma.notification.create({
    data: {
      notification_id: 'notif_2',
      user_id: 'u_dm',
      type: 'Query',
      message: 'Data validation rule flagged entry e_007 for field SYSBP with outlier value 180.',
      read: 0,
      created_at: nowStr,
    },
  });

  console.log('--- AIIA CTMS Prisma Seeding Completed Successfully! All dashboard data preserved! ---');
}

main()
  .catch((e) => {
    console.error('Error during Prisma seed execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
