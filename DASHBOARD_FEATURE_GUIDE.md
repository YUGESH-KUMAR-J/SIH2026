# Executive Dashboard - Feature Guide

## 🎯 Quick Start

### Feature 1: Variable Bar Chart Heights
**What Changed**: The "Therapeutic Specializations" bar chart now displays bars with different heights instead of uniform heights.

**How to See It**:
1. Look at the right side of the dashboard in the "Therapeutic Specializations" section
2. You'll see bars for Mental Health, Rheumatology, Immunology, Cardiology, and Dermatology
3. Each bar has a different height based on the number of trials in that therapeutic area

**Benefits**:
- Better visual distinction between therapeutic areas
- Easier to compare trial counts at a glance
- More professional data visualization

---

### Feature 2: Interactive India Map with Location Details
**What Changed**: Map location markers are now fully interactive.

**How to Use**:
1. Locate the "National Clinical Footprint" map on the left side of the dashboard
2. You'll see 3 location markers on the map:
   - New Delhi Center (upper-middle area, 35% top)
   - Jaipur Center (middle-left area, 39% top)
   - Goa Center (lower area, 65% top)
3. **Click any marker** to open a detailed modal
4. The modal displays:
   - 📍 Full center address and coordinates
   - 🟢 Status (Active)
   - 👥 Number of enrolled subjects
   - 📋 Number of active trials
   - 📊 Center performance metrics

**Center Details**:

| Center | Subjects | Trials | Address |
|--------|----------|--------|---------|
| New Delhi | 4 | 2 | AIIA Research Institute, New Delhi |
| Jaipur | 3 | 1 | Rajasthan Medical Research Center, Jaipur |
| Goa | 3 | 2 | Coastal Clinical Research Institute, Goa |

**How to Close the Modal**:
- Click the ❌ (X) button in the top-right corner
- Click outside the modal (on the dark overlay)

**Performance Metrics Shown**:
- GCP Compliance: 95%
- Data Entry Accuracy: 98%
- Protocol Adherence: 96%

---

### Feature 3: Critical Safety Incidents with Escalation Tracking
**What Changed**: The "Critical Safety Incidents" KPI card is now clickable to show detailed escalation information.

**How to Use**:
1. Locate the **"Critical Safety Incidents"** KPI card (red card showing number "3")
2. The card now shows: "Click to view escalation status"
3. **Click on the card** to open the Safety Incidents modal
4. The modal displays:
   - List of all 3 incidents as clickable buttons (Incident #1, #2, #3)
   - Detailed information about the selected incident:
     - Incident title and description
     - Reported date
     - Severity level (Critical/High/Medium)
     - Escalation status
     - Visual escalation level indicator (1-3)

**Incidents Included**:

#### Incident #1: Adverse Event
- **Status**: Escalated
- **Severity**: High ⚠️
- **Date**: 2026-08-28
- **Description**: Grade 2 Nausea reported in subject cohort. Follow-up evaluation scheduled.
- **Escalation Level**: 1 of 3 (Active escalation)

#### Incident #2: Protocol Deviation
- **Status**: Escalated
- **Severity**: Critical 🚨
- **Date**: 2026-08-27
- **Description**: Missing informed consent documentation for 1 subject. Re-consenting in progress.
- **Escalation Level**: 2 of 3 (High escalation)

#### Incident #3: Equipment Malfunction
- **Status**: Active
- **Severity**: Medium ⚠️
- **Date**: 2026-08-26
- **Description**: ECG monitor calibration drift detected. Device under maintenance. Subjects unaffected.
- **Escalation Level**: 1 of 3 (Initial escalation)

**How to Switch Between Incidents**:
1. In the modal, you'll see buttons for "Incident #1", "Incident #2", "Incident #3"
2. Click any button to switch to that incident
3. The details section updates automatically

**Escalation Level Indicator**:
- Shows 3 circles (●●●)
- Filled red circles (●) = escalated levels
- Empty gray circles (○) = non-escalated levels
- Example: Incident #2 shows 2 filled circles (highest escalation)

**Color Coding**:
- **Severity**:
  - 🔴 Critical = Red background
  - 🟠 High = Amber background
  - 🟡 Medium = Yellow background
- **Status**:
  - Escalated = Red badge
  - Active = Gray badge
  - Resolved = Green badge

**How to Close the Modal**:
- Click the ❌ (X) button in the top-right corner
- Click outside the modal (on the dark overlay)

---

## 🎨 Design Elements

### Visual Theme
- Glass-morphism effect on all cards
- Dark premium theme (blue accents)
- Color-coded status indicators
- Responsive grid layouts

### Interactive Elements
- Hover effects on all clickable elements
- Smooth animations for modals
- Real-time status updates
- Clear visual feedback

### Accessibility
- Clear labels and descriptions
- High contrast colors
- Keyboard navigable (clicking elements)
- Descriptive error/status messages

---

## 📊 Data Flow

```
Dashboard Load
    ↓
Shows 4 KPI Cards
    ├→ Active National Trials
    ├→ Randomized Subjects
    ├→ Critical Safety Incidents (CLICKABLE)
    └→ Global Compliance Index
    ↓
Shows 2 Main Sections
    ├→ National Clinical Footprint (Map - INTERACTIVE)
    │   └→ Click markers for location details
    │
    └→ Therapeutic Specializations (Bar Chart - VARIED HEIGHTS)
```

---

## 🔄 Workflow Examples

### Example 1: Check a Specific Center
1. Click on "New Delhi Center" marker
2. Review the enrolled subjects (4) and active trials (2)
3. Check performance metrics (95% GCP compliance)
4. Close modal
5. Click on another center to compare

### Example 2: Review Safety Incident Escalation
1. Click the "Critical Safety Incidents" card
2. See incident #1 by default (Adverse Event)
3. Click "Incident #2" button to view protocol deviation
4. Check escalation level (Level 2 of 3)
5. Switch to "Incident #3" for equipment issue
6. Close modal

### Example 3: Analyze Trial Distribution
1. Look at the bar chart on the right
2. Notice Mental Health has the highest number of trials
3. Rheumatology and Immunology are secondary focus areas
4. Cardiology and Dermatology have lower trial counts
5. Use this data for resource allocation planning

---

## ⚡ Quick Reference

| Action | Location | Result |
|--------|----------|--------|
| Click map marker | National Clinical Footprint section | Opens location details modal |
| Click KPI card #3 | Critical Safety Incidents card | Opens incidents modal |
| Look at chart | Therapeutic Specializations section | See varied bar heights |
| Close modal | X button or outside click | Returns to dashboard |
| Switch incident | Incident #1/2/3 buttons | Updates incident details |

---

## 💡 Tips & Best Practices

1. **For Center Monitoring**: Check each center's performance metrics regularly to identify areas needing improvement
2. **For Incident Management**: Review escalation levels to prioritize actions
3. **For Trial Planning**: Use the therapeutic specializations chart to guide resource allocation
4. **For Compliance**: Monitor the Global Compliance Index (92%) to ensure regulatory adherence

---

## 🔧 Technical Details

- **Technology**: React + TypeScript
- **Charts**: Recharts library
- **Icons**: Lucide-react
- **Styling**: CSS variables + inline styles
- **State Management**: React hooks (useState)
- **Type Safety**: Full TypeScript support

---

## 📝 Notes

- All data shown is for demonstration purposes
- Real implementation should connect to backend APIs
- Incidents and centers can be updated dynamically
- Modal overlays use proper event handling
- Responsive design works on all screen sizes
