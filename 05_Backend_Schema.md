# Backend Schema Document
## AIIA Clinical Trials Dashboard (AIIA-CTMS)

---

## 1. Service Architecture (Domain-Driven)
| Service | Responsibility |
|---|---|
| Auth Service | Login, RBAC, MFA, session/JWT issuance |
| Study Service | Study/site CRUD, CTRI field validation, milestones |
| Subject Service | Subject enrollment, de-identified ID generation, consent linkage |
| eCRF Service | Form definitions (CDASH-based), data capture, auto-save |
| SDTM Mapping Service | Maps eCRF data → SDTM domains, generates Define-XML |
| Pharmacovigilance Service | AE/SAE CRUD, deadline rules engine, escalation triggers |
| IEC/Compliance Service | Review workflow, deviation logs, compliance scorecards |
| Audit Service | Append-only log writer/reader, hash-chain verification |
| Notification Service | Email/SMS/in-app alerts |
| FHIR Gateway Service | Exposes FHIR R4 resources, syncs from internal DB |

## 2. Core Entities & Relationships (conceptual)
```
Organization (Ministry/AIIA)
   └── Study (1) ──< Site (many)
                 ──< Subject (many, via Site)
                 ──< Milestone (many)
                 ──< IEC_Review (many)
                 ──< ComplianceScore (1, computed)

Subject (1) ──< Enrollment
         ──< Consent (versioned)
         ──< eCRF_Entry (many, per visit/form)
         ──< AE_Event (many)

AE_Event (1) ──< Escalation_Log (many)
           ──1 Deadline_Rule (resolved at creation)

User (Role) ──< Audit_Log (as actor)
User (Role) ──< Notification (as recipient)
```

## 3. Key API Contracts (Request/Response Shape)

### 3.1 Create Study
```json
POST /api/studies
Request:
{
  "title": "string",
  "ctri_registration_pending": true,
  "phase": "Interventional | Observational",
  "therapeutic_area": "string",
  "iec_id": "uuid",
  "sites": ["site_id", "..."]
}
Response: { "study_id": "uuid", "status": "Draft" }
```

### 3.2 Log AE/SAE
```json
POST /api/ae
Request:
{
  "subject_id": "uuid",
  "study_id": "uuid",
  "event_type": "AE | SAE",
  "severity": "Mild | Moderate | Severe | Life-threatening | Death",
  "causality": "Certain | Probable | Possible | Unlikely | Unrelated",
  "onset_datetime": "ISO8601",
  "description": "string"
}
Response:
{
  "ae_id": "uuid",
  "report_deadline": "ISO8601",
  "status": "Open",
  "escalation_level": 0
}
```

### 3.3 Compliance Scorecard
```json
GET /api/compliance/:studyId/score
Response:
{
  "study_id": "uuid",
  "checkpoints": [
    { "requirement": "CTRI Registration", "status": "Met" },
    { "requirement": "IEC Continuing Review", "status": "Due in 12 days" },
    { "requirement": "SAE Reporting Timeliness", "status": "1 breach in last 90 days" }
  ],
  "overall_score_pct": 82
}
```

## 4. Deadline Rules Engine — Config Structure
```json
{
  "rule_id": "sae_initial_report",
  "trigger": { "event_type": "SAE" },
  "deadline_offset_hours": 24,
  "escalation_thresholds_pct": [50, 80, 100],
  "escalation_chain": ["PI", "IEC", "Sponsor", "NPvCC"]
}
```
Rules are stored as versioned config rows in DB (not hardcoded), so timelines can be updated if NDCT Rules 2019 interpretation changes, without a code deploy.

## 5. Audit Log Record Structure
```json
{
  "audit_id": "uuid",
  "actor_id": "uuid",
  "actor_role": "string",
  "timestamp": "ISO8601",
  "entity_type": "Study | Subject | AE_Event | IEC_Review | ...",
  "entity_id": "uuid",
  "action": "CREATE | UPDATE | DELETE",
  "field": "string | null",
  "old_value": "string | null",
  "new_value": "string | null",
  "prev_hash": "sha256",
  "record_hash": "sha256"
}
```
`record_hash = SHA256(prev_hash + entity_id + field + old_value + new_value + timestamp)` — any tampering breaks the chain on verification.

## 6. RBAC Permission Matrix (representative)
| Resource | PI | IEC | Data Mgr | PV Officer | Sponsor | Auditor |
|---|---|---|---|---|---|---|
| Create Study | ✓ (Draft) | — | — | — | ✓ | — |
| Approve Study | — | ✓ | — | — | — | — |
| Enroll Subject | ✓ | — | — | — | — | — |
| Submit eCRF | ✓ | — | ✓ (view/query) | — | — | — |
| Log AE/SAE | ✓ | — | — | ✓ (view) | — | — |
| View Audit Log | — | — | — | — | — | ✓ |
| Export SDTM/Define-XML | — | — | ✓ | — | ✓ (view) | — |

## 7. FHIR Resource Mapping (MVP)
| Internal Entity | FHIR Resource |
|---|---|
| Subject | `Patient` |
| Study | `ResearchStudy` |
| AE_Event | `AdverseEvent` |
| Site | `Location` / `Organization` |

## 8. Background Jobs
| Job | Frequency | Purpose |
|---|---|---|
| Deadline Watcher | Every 5 min | Check open AE/SAE against deadlines, trigger escalation |
| Continuing Review Reminder | Daily | Flag IEC annual reviews due within 30 days |
| Data Completeness Recalc | Hourly | Recompute per-domain % completeness for Data Manager dashboard |
| Audit Chain Verification | Daily | Re-verify hash chain integrity, alert Auditor on break |
