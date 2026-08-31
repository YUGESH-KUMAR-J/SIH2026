# Product Requirements Document (PRD)
## AIIA Clinical Trials Dashboard (AIIA-CTMS)
**Problem Statement ID:** 26046 | **Organization:** Ministry of Ayush | **Department:** All India Institute of Ayurveda (AIIA)

---

## 1. Purpose
Define what AIIA-CTMS must do, for whom, and why — a real-time, cloud-based, GCP-compliant Clinical Trial Management System for Ayurveda research, with CDISC/FHIR-interoperable data, role-based KPIs, and integrated ethics, regulatory (CTRI / NDCT Rules 2019), and pharmacovigilance tracking.

## 2. Background & Problem
AIIA runs interventional, observational, and multi-centre Ayurveda trials, and separately hosts the National Pharmacovigilance Coordination Centre (NPvCC) for ASU&H drugs. Today, study status, recruitment, milestones, data quality, and safety signals are tracked across disconnected spreadsheets and tools. This causes:
- Delayed regulatory decisions
- Missed Adverse Event (AE) / Serious Adverse Event (SAE) reporting deadlines
- Avoidable compliance risk under CTRI, GCP-ASU, ICMR guidelines, and NDCT Rules 2019
- No single, real-time, auditable view across sites and stakeholders

## 3. Goals & Objectives
| Goal | Success Metric |
|---|---|
| Centralize trial data across all AIIA-linked sites | 100% of active trials tracked in one system |
| Prevent missed AE/SAE reporting deadlines | 0 missed regulatory reporting windows |
| Provide standards-compliant, exportable data | Valid SDTM/Define-XML export for every trial |
| Give every stakeholder a real-time view | Role-based dashboard live for PI, IEC, Sponsor, NPvCC, Admin |
| Maintain a tamper-evident audit trail | 100% of data changes logged and traceable |

## 4. Non-Goals (Out of Scope for MVP)
- Full hospital EHR replacement
- Payment/finance and procurement management
- Native mobile apps (web-responsive only for MVP)
- Full ABDM patient-linkage (stub/mock integration for MVP; real integration is a stretch goal)

## 5. Target Users / Personas
1. **Principal Investigator (PI)** — manages a trial at a site; enrolls subjects, resolves queries, files AE/SAE reports.
2. **Institutional Ethics Committee (IEC) Member** — reviews protocols, consent versions, deviations.
3. **Data Manager** — ensures CDASH/SDTM data quality and completeness.
4. **Pharmacovigilance Officer (NPvCC)** — monitors AE/SAE signals nationwide, ensures reporting-timeline compliance.
5. **Sponsor / Trial Admin** — oversees trial portfolio, budget, timelines.
6. **Ministry/Executive Viewer** — views aggregate national KPIs.
7. **Auditor/Compliance Officer** — reviews audit trail, inspection readiness.

## 6. User Stories (MVP)
- As a PI, I want to register a new study with CTRI-required fields so it's compliant before submission.
- As a PI, I want to log an AE/SAE with severity so the system auto-calculates my reporting deadline.
- As an IEC member, I want to see all protocols pending review, sorted by days-pending, so nothing goes stale.
- As an NPvCC officer, I want a live countdown on every open SAE so I can intervene before a deadline lapses.
- As a Data Manager, I want to see % data completeness by SDTM domain per trial so I know where gaps are.
- As a Sponsor, I want a portfolio view of all trials with a compliance score so I can prioritize at-risk studies.
- As an Auditor, I want a searchable, immutable log of every data change so I can prepare for inspection.

## 7. Functional Requirements
### 7.1 Trial & Study Management
- Create/edit study with CTRI-mandated fields; validation before submission
- Multi-centre linkage (one trial → many sites)
- Milestone tracking (protocol approval → IEC clearance → enrollment → interim analysis → closure)

### 7.2 Subject & Recruitment Management
- De-identified subject IDs; enrollment funnel (screened → randomized → completed → withdrawn)
- Consent version tracking per subject

### 7.3 Data Capture & CDISC Compliance
- CDASH-based eCRF forms
- Backend mapping to SDTM domains (DM, AE, VS, CM minimum for MVP)
- Define-XML auto-generation

### 7.4 Pharmacovigilance (AE/SAE)
- AE/SAE entry with severity + causality
- Auto-calculated regulatory deadline (per NDCT Rules 2019) and countdown
- Auto-escalation notifications (PI → IEC → Sponsor → NPvCC) on missed/nearing deadlines
- National AE signal aggregation view

### 7.5 Ethics & Regulatory Compliance
- IEC approval workflow, protocol deviation logging
- Continuing/annual review reminders
- Compliance scorecard per trial mapped to GCP-ASU checkpoints

### 7.6 Dashboards & Reporting
- Role-based dashboards (see App Flow doc)
- Exportable reports (PDF/CSV/Define-XML)

### 7.7 Interoperability
- FHIR R4 API endpoints (minimum: Patient, AdverseEvent resources)
- CTRI-format export

### 7.8 Audit & Security
- Immutable, timestamped audit log (who/when/what/before-after)
- Role-based access control (RBAC), MFA for PII-adjacent roles

## 8. Non-Functional Requirements
| Category | Requirement |
|---|---|
| Performance | Dashboard load < 3s for up to 50 concurrent trials |
| Availability | 99.5% uptime target (cloud-hosted) |
| Security | Data encryption at rest & in transit; RBAC; MFA |
| Compliance | Audit trail immutability; data minimization for PII |
| Scalability | Support 100+ sites, 10,000+ subjects (synthetic data for demo) |
| Data | Only synthetic/de-identified datasets used in development & demo |

## 9. Assumptions & Constraints
- Real trial data is sensitive; all dev/demo uses synthetic or de-identified datasets
- Regulatory logic (NDCT 2019 timelines) is based on publicly available rules, not internal AIIA SOPs
- ABDM integration is simulated for MVP due to sandbox access constraints

## 10. Release Plan (Hackathon-Scoped)
| Phase | Scope |
|---|---|
| MVP (Demo Day) | Study registration, enrollment funnel, AE/SAE + auto-escalation, 3 role dashboards, audit log, synthetic FHIR endpoint |
| Post-MVP | Full SDTM domain coverage, ABDM live integration, mobile app, advanced signal-detection analytics |

## 11. Risks
| Risk | Mitigation |
|---|---|
| Misinterpreting NDCT 2019 timelines | Clearly cite public sources; keep rules config-driven, not hardcoded |
| Synthetic data looks unrealistic | Use CDISC public sample datasets as generation seed |
| Scope creep across 6+ dashboards | Prioritize SAE-escalation + 1-2 dashboards for deep demo, others as read-only mocks |
