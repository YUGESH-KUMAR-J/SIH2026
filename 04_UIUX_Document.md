# UI/UX Document
## AIIA Clinical Trials Dashboard (AIIA-CTMS)

---

## 1. Design Principles
- **Clarity over decoration** — this is regulatory/clinical software; every screen should answer "what needs my attention right now?"
- **Status at a glance** — heavy use of color-coded chips/badges (green/amber/red) for compliance and deadline states
- **Role-first navigation** — each user only sees what's relevant to their role; no clutter from other modules
- **Trust signals** — audit trail, timestamps, and e-signatures visible wherever data can be edited, to reinforce GCP compliance
- **Accessibility** — WCAG AA contrast minimum; all charts have text/table fallback for screen readers

## 2. Visual Language
| Element | Guidance |
|---|---|
| Color palette | Neutral base (white/slate-gray) + semantic colors: green (compliant/on-track), amber (approaching deadline/at-risk), red (breached/non-compliant), blue (informational/primary actions) |
| Typography | Clean sans-serif (e.g., Inter/Roboto); clear hierarchy — H1 page title, H2 section, body 14-16px |
| Iconography | Consistent icon set (e.g., Lucide) for study, subject, AE, IEC, audit — used consistently across all dashboards for recognizability |
| Spacing | Generous whitespace on data-dense screens to avoid clinical-software "cramped spreadsheet" feel |

## 3. Global Layout
```
+--------------------------------------------------------------+
|  Top Bar: Logo | Role Switcher (if multi-role) | Notifications | Profile |
+--------+-------------------------------------------------------+
| Side   |  Page Title + Breadcrumb                               |
| Nav    |  Filter Bar (Study / Site / Date Range)                |
| (role- |  ------------------------------------------------      |
| based) |  KPI Cards Row (3-5 cards)                             |
|        |  ------------------------------------------------      |
|        |  Main Content: Charts / Tables / Lists                 |
+--------+-------------------------------------------------------+
```

## 4. Screen-by-Screen Wireframe Notes

### 4.1 Credentials Dashboard
- Centered card, minimal form, AIIA/Ministry of Ayush branding
- Username and password fields with a forgot-password action at the bottom

### 4.2 PI Dashboard
- KPI cards: Active Studies, Subjects Enrolled, Open Queries, Open AE/SAE
- Enrollment funnel chart (screened → randomized → completed → withdrawn)
- Table: My Studies (status chip: Active/Pending IEC/Closed)
- Prominent **"Report AE/SAE"** button — always visible (this is the safety-critical action)

### 4.3 AE/SAE Reporting Form
- Step form: Event details → Severity/Causality → Auto-shown deadline banner ("Report due by: [date/time], in Xh Ym")
- Deadline banner color-coded live as time passes
- Submit → confirmation screen with reference ID

### 4.4 IEC Dashboard
- KPI cards: Pending Reviews, Approved This Month, Deviations Open
- Queue table: Protocol | Submitted Date | Days Pending | Action buttons (Approve/Revise/Reject)
- Detail drawer (slide-in panel) instead of full navigation, to keep reviewer in flow

### 4.5 Pharmacovigilance Dashboard (core differentiator screen)
- Large **SAE Countdown List** as primary content — card per open SAE with live countdown timer, color-coded border
- Signal heatmap: grid of Drug × AE-type, cell intensity = frequency
- National trend line chart (AE reports/month)
- Filter bar: Drug, Trial, Severity, Date Range

### 4.6 Sponsor/Admin Dashboard
- Portfolio table/grid — each trial as a card with status chip, mini progress bar, compliance score badge
- Click-through to Trial Detail page: multi-site tabs, milestone timeline (Gantt-style), radar chart for GCP-ASU checkpoint compliance

### 4.7 Data Manager Dashboard
- Heatmap grid: Sites (rows) × eCRF Forms (columns), cell = completion %
- Query resolution line chart
- Export panel: select study → "Generate SDTM + Define-XML" button → download link

### 4.8 Audit Trail Viewer
- Search/filter bar (entity, user, date range)
- Table: Timestamp | Actor | Entity | Field | Old Value → New Value | Hash (verified ✓ icon)
- Read-only, no edit affordances anywhere on this screen (reinforces immutability)

### 4.9 Executive/Ministry Dashboard
- India map with trial site markers, color-coded by status
- Aggregate KPI row: Total Active Trials, Total Enrolled, SAEs This Quarter, Compliance Risk Index
- Trend charts: approvals, completions over time

## 5. Component Library (reusable across dashboards)
- KPI Card (label, value, trend arrow)
- Status Chip (color + label)
- Countdown Badge (time remaining, color-coded)
- Data Table (sortable, filterable, paginated)
- Funnel Chart, Radar Chart, Heatmap Grid, Timeline/Gantt, India Map widget
- Slide-in Detail Drawer
- Notification Bell + Dropdown

## 6. Interaction Patterns
- **Progressive disclosure**: summary cards → click → detail drawer/page, never dump full detail on landing view
- **Inline validation**: CTRI-required fields validate as user types, not just on submit
- **Optimistic UI with rollback**: form submissions show immediate feedback, roll back with error toast on failure
- **Confirmation for irreversible actions**: IEC approve/reject, AE/SAE submission require a confirm step (with e-signature capture)

## 7. Responsive Behavior
- MVP target: desktop-first (clinical/admin staff primarily on desktop), responsive down to tablet
- Charts collapse to stacked single-column below 768px; tables become horizontally scrollable

## 8. Accessibility Checklist
- Color is never the only signal (icons/text labels accompany all status chips)
- Keyboard navigable forms and tables
- Alt text on all chart/graph SVGs
- Minimum 4.5:1 contrast ratio on text
