# Database Schema Document
## AIIA Clinical Trials Dashboard (AIIA-CTMS) — PostgreSQL

---

## 1. Entity-Relationship Overview
```
organizations ──< studies ──< sites
                     |            |
                     |            └──< subjects
                     ├──< milestones
                     ├──< iec_reviews
                     ├──< compliance_scores
                     └──< documents

subjects ──< consents
         ──< ecrf_entries ──< ecrf_field_values
         ──< ae_events ──< escalation_logs

users ──< audit_logs
users ──< notifications
users ──< user_roles >── roles

ae_events ──1 deadline_rules (resolved reference)
ecrf_entries ──> sdtm_mappings (via mapping_config)
```

## 2. Table Definitions

### 2.1 `organizations`
| Column | Type | Notes |
|---|---|---|
| org_id | UUID PK | |
| name | VARCHAR(255) | e.g., "AIIA", "Ministry of Ayush" |
| org_type | VARCHAR(50) | Ministry / Institute / Site-host |
| created_at | TIMESTAMPTZ | |

### 2.2 `studies`
| Column | Type | Notes |
|---|---|---|
| study_id | UUID PK | |
| org_id | UUID FK → organizations | |
| title | VARCHAR(500) | |
| ctri_reg_number | VARCHAR(50) | nullable until registered |
| phase | VARCHAR(50) | Interventional / Observational |
| therapeutic_area | VARCHAR(255) | |
| status | VARCHAR(30) | Draft / Pending_IEC / Active / Closed |
| start_date | DATE | |
| end_date | DATE | nullable |
| created_by | UUID FK → users | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### 2.3 `sites`
| Column | Type | Notes |
|---|---|---|
| site_id | UUID PK | |
| study_id | UUID FK → studies | |
| name | VARCHAR(255) | |
| location | VARCHAR(255) | |
| lat | DECIMAL | for map view |
| lng | DECIMAL | for map view |
| pi_user_id | UUID FK → users | |

### 2.4 `subjects`
| Column | Type | Notes |
|---|---|---|
| subject_id | UUID PK | de-identified system ID |
| site_id | UUID FK → sites | |
| enrollment_status | VARCHAR(30) | Screened / Randomized / Completed / Withdrawn |
| enrollment_date | DATE | |
| dosha_profile | JSONB | Ayurveda-specific baseline (nullable) |
| created_at | TIMESTAMPTZ | |
> Note: No direct PII columns here — PII (name, contact) stored in a separate `subject_pii` table with restricted access, linked by `subject_id`, to support data minimization.

### 2.5 `subject_pii` (restricted access table)
| Column | Type | Notes |
|---|---|---|
| subject_id | UUID PK, FK → subjects | |
| full_name_encrypted | BYTEA | AES-256 encrypted |
| contact_encrypted | BYTEA | AES-256 encrypted |
| abdm_health_id | VARCHAR(50) | nullable, for ABDM linkage |

### 2.6 `consents`
| Column | Type | Notes |
|---|---|---|
| consent_id | UUID PK | |
| subject_id | UUID FK → subjects | |
| version | VARCHAR(20) | |
| signed_date | DATE | |
| document_ref | UUID FK → documents | |

### 2.7 `ecrf_entries`
| Column | Type | Notes |
|---|---|---|
| entry_id | UUID PK | |
| subject_id | UUID FK → subjects | |
| form_type | VARCHAR(50) | e.g., "Vitals", "ConMeds", "Demographics" |
| visit_number | INT | |
| entered_by | UUID FK → users | |
| entered_at | TIMESTAMPTZ | |
| status | VARCHAR(20) | Draft / Submitted / Queried |

### 2.8 `ecrf_field_values`
| Column | Type | Notes |
|---|---|---|
| value_id | UUID PK | |
| entry_id | UUID FK → ecrf_entries | |
| field_name | VARCHAR(100) | CDASH field name |
| field_value | TEXT | |
| sdtm_domain | VARCHAR(10) | e.g., "DM", "AE", "VS", "CM" |
| sdtm_variable | VARCHAR(50) | mapped SDTM variable name |

### 2.9 `ae_events`
| Column | Type | Notes |
|---|---|---|
| ae_id | UUID PK | |
| subject_id | UUID FK → subjects | |
| study_id | UUID FK → studies | |
| event_type | VARCHAR(10) | AE / SAE |
| severity | VARCHAR(30) | Mild/Moderate/Severe/Life-threatening/Death |
| causality | VARCHAR(30) | Certain/Probable/Possible/Unlikely/Unrelated |
| onset_datetime | TIMESTAMPTZ | |
| description | TEXT | |
| reported_by | UUID FK → users | |
| report_deadline | TIMESTAMPTZ | computed by rules engine |
| status | VARCHAR(20) | Open / Reported / Breached / Closed |
| escalation_level | INT | 0 = none, increments per threshold breach |
| created_at | TIMESTAMPTZ | |

### 2.10 `deadline_rules`
| Column | Type | Notes |
|---|---|---|
| rule_id | UUID PK | |
| event_type | VARCHAR(10) | AE / SAE |
| deadline_offset_hours | INT | |
| escalation_thresholds_pct | INT[] | e.g., {50,80,100} |
| escalation_chain | TEXT[] | e.g., {PI,IEC,Sponsor,NPvCC} |
| version | INT | rule versioning |
| active | BOOLEAN | |

### 2.11 `escalation_logs`
| Column | Type | Notes |
|---|---|---|
| escalation_id | UUID PK | |
| ae_id | UUID FK → ae_events | |
| level | INT | |
| notified_role | VARCHAR(30) | |
| notified_at | TIMESTAMPTZ | |
| resolved | BOOLEAN | |

### 2.12 `iec_reviews`
| Column | Type | Notes |
|---|---|---|
| review_id | UUID PK | |
| study_id | UUID FK → studies | |
| reviewer_id | UUID FK → users | |
| decision | VARCHAR(20) | Approved / Revision_Requested / Rejected |
| comments | TEXT | |
| decision_date | TIMESTAMPTZ | |
| e_signature_ref | UUID FK → documents | |

### 2.13 `protocol_deviations`
| Column | Type | Notes |
|---|---|---|
| deviation_id | UUID PK | |
| study_id | UUID FK → studies | |
| reported_by | UUID FK → users | |
| description | TEXT | |
| severity | VARCHAR(20) | Minor / Major |
| status | VARCHAR(20) | Open / Reviewed / Closed |
| reported_at | TIMESTAMPTZ | |

### 2.14 `compliance_scores`
| Column | Type | Notes |
|---|---|---|
| score_id | UUID PK | |
| study_id | UUID FK → studies | |
| checkpoint | VARCHAR(100) | e.g., "CTRI Registration" |
| status | VARCHAR(50) | Met / Due / Breached |
| computed_at | TIMESTAMPTZ | |

### 2.15 `milestones`
| Column | Type | Notes |
|---|---|---|
| milestone_id | UUID PK | |
| study_id | UUID FK → studies | |
| name | VARCHAR(100) | e.g., "IEC Clearance", "Enrollment Complete" |
| planned_date | DATE | |
| actual_date | DATE | nullable |
| status | VARCHAR(20) | Pending / Complete / Delayed |

### 2.16 `documents`
| Column | Type | Notes |
|---|---|---|
| document_id | UUID PK | |
| entity_type | VARCHAR(50) | Study / Consent / IEC_Review |
| entity_id | UUID | |
| file_ref | VARCHAR(500) | object storage path |
| version | VARCHAR(20) | |
| uploaded_by | UUID FK → users | |
| uploaded_at | TIMESTAMPTZ | |

### 2.17 `users` / `roles` / `user_roles`
| Table | Key Columns |
|---|---|
| users | user_id (PK), name, email, username, password_hash, mfa_enabled, created_at |
| roles | role_id (PK), role_name (PI/IEC/DataManager/PVOfficer/Sponsor/Auditor/Executive) |
| user_roles | user_id (FK), role_id (FK), site_id (FK, nullable — scopes PI to their site) |

### 2.18 `audit_logs` (append-only)
| Column | Type | Notes |
|---|---|---|
| audit_id | UUID PK | |
| actor_id | UUID FK → users | |
| entity_type | VARCHAR(50) | |
| entity_id | UUID | |
| action | VARCHAR(20) | CREATE/UPDATE/DELETE |
| field | VARCHAR(100) | nullable |
| old_value | TEXT | nullable |
| new_value | TEXT | nullable |
| prev_hash | CHAR(64) | |
| record_hash | CHAR(64) | |
| created_at | TIMESTAMPTZ | |
> No UPDATE/DELETE permissions granted on this table at the DB role level — enforced append-only via Postgres GRANT restrictions and, optionally, a `BEFORE UPDATE/DELETE` trigger that raises an exception.

### 2.19 `notifications`
| Column | Type | Notes |
|---|---|---|
| notification_id | UUID PK | |
| user_id | UUID FK → users | |
| type | VARCHAR(50) | Escalation / Reminder / Decision |
| message | TEXT | |
| read | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

## 3. Indexing Strategy
- `ae_events(study_id, status)` — fast dashboard filtering of open AE/SAEs
- `ae_events(report_deadline)` — supports the Deadline Watcher background job
- `ecrf_field_values(entry_id, sdtm_domain)` — supports completeness aggregation
- `audit_logs(entity_type, entity_id, created_at)` — supports audit search
- `subjects(site_id, enrollment_status)` — supports enrollment funnel queries

## 4. Data Retention & Minimization Notes
- `subject_pii` is a separate, access-restricted table with column-level encryption — supports de-identification-by-default
- Synthetic data generator (dev/demo only) populates all tables above with CDISC-shaped fake data; no real subject data is ever used in this project
