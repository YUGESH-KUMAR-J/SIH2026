# Technical Requirements Document (TRD)
## AIIA Clinical Trials Dashboard (AIIA-CTMS)

---

## 1. System Overview
A cloud-hosted, three-tier web application: React frontend, REST/FHIR API backend, PostgreSQL primary store, with a rules engine for regulatory deadline calculation and an append-only audit log.

## 2. Architecture Diagram (described)
```
[React Frontend (Role Dashboards)]
        |  HTTPS/REST + JSON
[API Gateway / Auth (OAuth2 + RBAC + MFA)]
        |
[Application Layer]
   ├── Trial & Site Service
   ├── Subject/Enrollment Service
   ├── eCRF / CDASH-SDTM Mapping Service
   ├── Pharmacovigilance & Escalation Rules Engine
   ├── Compliance/IEC Service
   ├── Audit Log Service (append-only)
   └── FHIR R4 Gateway (HAPI FHIR)
        |
[PostgreSQL] -- [Object Storage: documents/consents] -- [Notification Service (email/SMS)]
```

## 3. Tech Stack
| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React + TypeScript, Tailwind, Recharts/D3 | Fast dashboarding, component reuse across roles |
| Backend | Node.js (NestJS) or Django REST Framework | REST + easy RBAC middleware |
| FHIR Server | HAPI FHIR (Dockerized) | Standards-native, fast to stand up |
| Database | PostgreSQL 15 | Relational integrity for trial/subject/AE data |
| Audit Store | Append-only Postgres table (hash-chained rows) | Tamper-evidence without full blockchain complexity |
| Auth | OAuth2 / OpenID Connect + JWT, TOTP-based MFA | Standard, auditable access control |
| File/Doc storage | S3-compatible object storage | Consent forms, protocol PDFs |
| Notifications | Email (SMTP) / SMS gateway | SAE escalation alerts |
| Hosting | Cloud (GCP/Azure, India region for data residency) | Compliance with data-residency expectations |
| CI/CD | GitHub Actions | Automated build/test/deploy for demo stability |

## 4. Key Technical Modules

### 4.1 Rules Engine (Regulatory Deadline Calculator)
- Config-driven rule set (JSON) mapping event type + severity → reporting deadline (e.g., SAE initial report within 24 hrs, follow-up within 14 days per NDCT Rules 2019 pattern)
- Triggers escalation events on a timer (cron/queue-based) when deadline is at risk
- Must be swappable/config-updatable without code redeploy (rules may change)

### 4.2 CDASH → SDTM Mapping Service
- MVP domains: DM (Demographics), AE (Adverse Events), VS (Vital Signs), CM (Concomitant Meds)
- Transformation layer maps raw eCRF field names to controlled SDTM variable names using a mapping config table
- Outputs SDTM-formatted datasets (CSV/XPT-like structure) + Define-XML metadata

### 4.3 FHIR R4 Gateway
- Exposes minimum resources: `Patient`, `AdverseEvent`, `ResearchStudy`
- Backed by HAPI FHIR server; internal Postgres data synced/mapped to FHIR resources
- Used to demonstrate interoperability with hospital EHR / ABDM (simulated)

### 4.4 Audit Log Service
- Every write operation (create/update/delete) emits an audit record: `actor_id, timestamp, entity, entity_id, field, old_value, new_value, prev_hash, record_hash`
- `record_hash = hash(prev_hash + payload)` — creates a tamper-evident chain
- Read-only, queryable audit viewer UI for Auditor role

### 4.5 RBAC & Auth
- Roles: PI, IEC Member, Data Manager, PV Officer, Sponsor/Admin, Executive Viewer, Auditor
- Permission matrix enforced at API layer (not just UI-hidden)
- MFA required for roles with access to subject-linked PII

## 5. API Design (representative endpoints)
```
POST   /api/studies                       Create study (CTRI-field validated)
GET    /api/studies/:id                   Get study detail
POST   /api/sites/:studyId                Add site to study
POST   /api/subjects                      Enroll subject (de-identified ID)
POST   /api/ecrf/:subjectId               Submit eCRF form data
POST   /api/ae                            Log AE/SAE event
GET    /api/ae/:id/deadline               Get computed reporting deadline + status
POST   /api/iec/review                    Submit IEC review decision
GET    /api/compliance/:studyId/score     Get compliance scorecard
GET    /api/audit?entity=&from=&to=       Query audit trail
GET    /fhir/Patient/:id                  FHIR resource (via gateway)
GET    /fhir/AdverseEvent/:id             FHIR resource (via gateway)
```

## 6. Data Standards Compliance
| Standard | Application |
|---|---|
| CDASH | eCRF form field design |
| SDTM | Backend data domain mapping |
| Define-XML | Auto-generated metadata for regulatory submission |
| HL7 FHIR R4 | Interoperability gateway |
| ABDM | Simulated linkage layer (health ID reference field) |

## 7. Non-Functional / Engineering Requirements
- **Security:** TLS 1.2+, encryption at rest (AES-256), parameterized queries (no raw SQL), input validation on all forms
- **Performance:** Paginated APIs, indexed queries on `study_id`, `subject_id`, `event_date`
- **Testing:** Unit tests for rules engine (deadline calc is safety-critical logic — must be tested thoroughly); integration tests for SDTM mapping
- **Logging/Monitoring:** Centralized app logs separate from audit log; error tracking (e.g., Sentry)
- **Environment config:** `.env`-based config for DB, auth secrets, rule-set version

## 8. Deployment Plan
- Docker Compose for local/demo (frontend, backend, HAPI FHIR, Postgres)
- Cloud deployment: containerized services on GCP Cloud Run / Azure App Service, managed Postgres
- Seed script loads synthetic CDISC-shaped demo data on startup

## 9. Third-Party/Public Resources Referenced
- CTRI (ctri.nic.in) — trial registration field reference
- CDISC (cdisc.org) — CDASH/SDTM/ADaM/Define-XML standards
- HL7 FHIR R4 spec, ABDM building blocks — interoperability reference
