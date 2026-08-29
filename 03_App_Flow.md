# App Flow Document
## AIIA Clinical Trials Dashboard (AIIA-CTMS)

---

## 1. High-Level User Flow Map
```
[Credentials Dashboard]
      |
[Role Router] ---------------------------------------------------
      |            |            |            |          |        |
     PI          IEC Member  Data Manager  PV Officer  Sponsor  Auditor
```

## 2. Onboarding & Auth Flow
1. User visits the credentials dashboard → enters username and password → selects **Forgot password?** when needed
2. System validates role → routes to role-specific dashboard
3. First-time users complete profile + digital signature setup (for e-signatures on approvals)

## 3. PI Flow — Study & Subject Management
```
Login → PI Dashboard
   → [New Study] → CTRI-field form → Validation → Submit for IEC review → Status: Pending
   → [Existing Study] → Site overview
        → [Enroll Subject] → De-identified ID generated → Consent version attached
        → [Fill eCRF] → Form auto-saves → Data Manager notified of new entry
        → [Report AE/SAE] → Severity + causality selected
              → System auto-calculates deadline
              → Countdown widget appears on PI + PV dashboards
              → If nearing deadline: PI gets alert → escalates to IEC/Sponsor if unactioned
```

## 4. IEC Member Flow — Ethics Review
```
Login → IEC Dashboard
   → [Pending Reviews Queue] sorted by days-pending
        → Open protocol → Review documents → Approve / Request Revision / Reject
        → Decision logged with e-signature + timestamp
   → [Protocol Deviations] → Review deviation reports submitted by PIs → Action/close
   → [Continuing Review Reminders] → Approve annual re-certification
```

## 5. Data Manager Flow — Data Quality
```
Login → Data Manager Dashboard
   → [Data Completeness View] per study, per SDTM domain (DM/AE/VS/CM)
        → Drill into incomplete records → Send query to site
   → [Query Resolution Tracker] → Mark resolved/open
   → [Export] → Generate SDTM dataset + Define-XML → Download
```

## 6. Pharmacovigilance (NPvCC) Flow — Safety Monitoring
```
Login → PV Dashboard
   → [Open SAEs Countdown List] (color-coded: green/yellow/red by time remaining)
        → Click SAE → View causality, severity, linked subject/drug
        → If deadline breached → Auto-flag + compliance-risk log entry created
   → [Signal Detection Heatmap] → AE frequency by drug/formulation across trials
   → [National Trend View] → AE reports over time, all AIIA-linked trials
```

## 7. Sponsor/Admin Flow — Portfolio Oversight
```
Login → Sponsor Dashboard
   → [Portfolio Overview] → All trials, status chips (on-track/at-risk/delayed)
        → Click trial → Multi-site roll-up → drill to site-level detail
   → [Compliance Scorecard] → Radar chart of GCP-ASU checkpoints per trial
   → [Regulatory Submission Tracker] → CTRI status, Define-XML export status
```

## 8. Auditor Flow — Compliance & Inspection Readiness
```
Login → Audit Dashboard
   → [Audit Trail Search] → Filter by entity/date/user → View before/after values
   → [Inspection Readiness Checklist] → GCP/NDCT 2019 requirement checklist with status
   → [Document Version History] → Protocol amendments, consent form versions
```

## 9. Cross-Cutting Flow — AE/SAE Escalation (Core Differentiator)
```
AE/SAE Logged by PI
   → Rules Engine computes deadline based on severity + event type
   → Countdown starts (visible to PI + PV Officer)
   → T-minus alerts sent at configured intervals (e.g., 50%, 80%, 100% of window elapsed)
   → If PI does not act by threshold:
        → Auto-escalate to IEC
        → If still unactioned:
        → Auto-escalate to Sponsor + NPvCC
   → On resolution: audit log entry created; countdown closed; compliance score updated
```

## 10. Data Export / Interoperability Flow
```
Data Manager triggers Export
   → System maps internal DB records → SDTM domain structure
   → Define-XML metadata generated
   → FHIR Gateway exposes Patient/AdverseEvent/ResearchStudy resources
   → External system (e.g., hospital EHR / ABDM sandbox) can query via FHIR API
```

## 11. Notification Flow (applies across roles)
```
Trigger event (deadline nearing, IEC decision, query raised, escalation)
   → Notification Service → Email/SMS to relevant role
   → In-app notification bell updated
   → Notification also logged in audit trail
```
