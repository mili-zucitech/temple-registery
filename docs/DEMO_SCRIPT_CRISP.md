# Temple Registry & Management Portal
## Product Demo Script — Crisp Edition

> **Format:** Live walkthrough | **Audience:** Officials, investors, stakeholders | **Runtime:** ~25–30 min

---

## OPENING

"Karnataka has over 30,000 temples — each with a trust, employees, contractors, assets, and an annual compliance requirement to the District Collector.

Until now, all of that was paper files. A DC had to wait days just to see a temple's records.

This platform changes that. The Temple Registry and Management Portal digitizes every aspect of temple governance — from submission to approval — with a complete audit trail at every step.

Let me show you how it works."

---

## 1. LOGIN & AUTHENTICATION

**Say:** "Every user logs in with their credentials. The system knows their role and district immediately. Sessions are secured with httpOnly JWT cookies — credentials cannot be stolen by browser scripts. Let me log in as a District Collector."

**Show:**
- Login page → enter DC credentials → redirect to DC Dashboard
- Point out the role indicator in the top nav

**Key point:** Different roles land on different dashboards. All auth events are logged.

---

## 2. ROLES — WHO USES THIS PLATFORM

**Say:** "Five roles. Each with strict boundaries."

| Role | What They Do |
|------|-------------|
| **Super Admin** (HR&CE Dept) | Full platform control — users, geo data, audit logs, system config |
| **District Collector** | Searches temples in their district, reviews and approves submissions |
| **DC Staff** | Same read access as DC — cannot approve or reject |
| **Temple Authority** | Manages their own temple — submits profiles, declarations, documents |
| **Auditor** | Read-only access to reports and audit logs |

**Key point:** The DC can only see their own district. The Temple Authority can only see their own temple. Enforced at the database level — not just the UI.

---

## 3. DC DASHBOARD

**Say:** "This is the first thing a DC sees every morning. Four key numbers — total temples, pending declarations, overdue declarations, and pending profile reviews. These update in real time. Below that, recent activity across all temples in the district, and a grade distribution chart — how many Grade A, B, and C temples are in the jurisdiction."

**Show:**
- KPI cards: Total Temples / Pending / Overdue / Pending Profile Reviews
- Activity feed with event log
- Grade A/B/C distribution chart

**Key point:** Overdue counter shows in red. The DC immediately knows what needs attention before they do anything else.

---

## 4. GEO-HIERARCHY SEARCH

**Say:** "Karnataka is organized as State → District → Taluk → Hobli. Every temple is mapped to this hierarchy. The search cascades down — select a Taluk, the results filter instantly. Select a Hobli, it narrows further. No page reloads."

**Show:**
- Temple Search page → Geo filter panel
- Select District → Taluk → Hobli
- Watch result count update: "Temples found: 47"
- Clear Hobli → results expand back

**Key point:** DC cannot see temples outside their district even if they manually change the URL. Jurisdiction is enforced server-side.

---

## 5. TEMPLE SEARCH & FILTERING

**Say:** "On top of the geo filters, the DC can filter by grade, search by temple name, or use the two most important filters — Pending Only and Overdue Only. This focuses their attention exactly where it needs to go."

**Show:**
- Apply Grade A filter
- Apply Pending Only → list shows only action-required temples
- Apply Overdue Only → red-flagged temples surface
- Results table: Name, Grade badge, Taluk, Pending Actions, Overdue flag, Last Update

**Key point:** Results are sorted by pending + overdue count by default. Most urgent temples are always at the top.

---

## 6. TEMPLE PROFILE — DC VIEW

**Say:** "Clicking a temple opens its complete profile. Every piece of information the District Collector needs is here — identity details, contact information, GPS location, heritage description, annual festivals, bank details. The bank account is masked — only the last four digits are visible. Everything was submitted by the Temple Authority and officially approved."

**Show:**
- Overview tab: name, grade badge, registration number, deity, year established
- Address with district/taluk/hobli path
- Contact card: name, phone, email
- Heritage card: historical significance, annual festivals, linked institutions
- Bank details card: masked account number, IFSC, bank name
- Temple photograph

---

## 7. TEMPLE AUTHORITY — PROFILE SUBMISSION

*Switch to TA login.*

**Say:** "Now from the Temple Authority's side. They edit their profile, fill in every detail, and save it as a Draft. It stays in staging — the DC cannot see it yet. When they're ready, they hit Submit for Review. The profile is locked, a notification fires to the DC, and the pending counter on the DC dashboard goes up by one."

**Show:**
- TA Dashboard → Profile Status Card → Edit Profile
- Update a field → Save as Draft → DRAFT badge
- Submit for Review → SUBMITTED / PENDING REVIEW badge
- TA now sees read-only view — cannot edit while pending

**Key point:** Nothing enters the official record directly. Staging → Workflow → Approval. Always.

---

## 8. DC PROFILE APPROVAL

*Switch back to DC.*

**Say:** "The DC sees the new pending profile review. They open it and see what has changed. They click Approve, add their remarks, and confirm. The new version becomes the official approved profile. The previous version is marked Superseded and preserved for history. The Temple Authority gets notified instantly."

**Show:**
- DC Dashboard → incremented Pending Profile Reviews
- Open the pending submission
- Show proposed changes
- Click Approve → remarks → confirm
- Status → APPROVED with timestamp
- Version history tab → previous version shows SUPERSEDED

---

## 9. TRUST & BOARD MANAGEMENT

**Say:** "Every temple has a Trust — the legal entity managing temple affairs. The Trust module captures the registration details, PAN number, bank account, and every board member — current and historical. When a trustee's tenure ends, they move to the historical view. Nothing is deleted. The Aadhaar numbers are encrypted and shown masked — only the last four digits. Full privacy by design."

**Show:**
- Trust tab → registration details, PAN (masked), bank details
- Board Members: current members table + historical members section
- Aadhaar display: XXXX-XXXX-1234 format
- Meeting minutes upload section

---

## 10. EMPLOYEE MANAGEMENT

**Say:** "Temple staff — priests, administrative officers, maintenance, security — are all tracked here. The status lifecycle follows them through their tenure. Active → On Leave → Active again. Or Active → Retired or Resigned. Retired employees stay in the system with their full history. The government needs to know who was employed at a temple at any point in time."

**Show:**
- Employee list: Name, Type, Designation, Join Date, Status badge
- Status badges: Active (green), On Leave (yellow), Retired / Resigned (grey)
- Add Employee form on TA side

---

## 11. CONTRACTOR MANAGEMENT

**Say:** "Every contractor the temple engages — for construction, maintenance, catering, security — is logged here. GST number, contract value, payment status, and the actual signed contract document are all captured. When the DC or auditor wants to verify a contract, they don't need to request the physical document. It's right here."

**Show:**
- Contractor list: Name, Service Type, Contract Value, Status
- Click a contractor → full detail + contract document download link
- Show active vs. ended contractor records

---

## 12. ASSET DECLARATION — SUBMISSION

**Say:** "The Asset Declaration is the most critical compliance workflow. Every temple declares its assets annually — immovable properties like land and buildings, and movable assets like gold, silver, idols, and vehicles. The Temple Authority fills the structured form, uploads supporting documents, and submits. The declaration is locked at submission and visible to the DC immediately."

**Show:**
- TA Dashboard → Declarations section → year-wise status list
- Status badges: Not Started (grey) → In Progress (blue) → Submitted (yellow)
- Open declaration form → Immovable Assets section → Movable Assets section
- Upload a document → Submit
- Status changes to SUBMITTED; DC notified

**Key point:** Overdue declarations are automatically flagged. The system tracks deadlines and escalates — no manual chasing required.

---

## 13. DC DECLARATION REVIEW

**Say:** "The DC opens the pending declaration and has four options. Approve — if everything checks out, a digital acknowledgement is issued with an official acknowledgement number. Request Clarification — if there's a question, the DC types it and sends it back; the Temple Authority responds inline, and it returns to the review queue. Physical Verification — for high-value cases, the DC flags it for a site inspection and must record the findings before closing. Reject — the Temple Authority can correct and resubmit as a new version."

**Show:**
- DC → Pending Declarations list → open a declaration
- Four action buttons: Approve (green), Clarify (amber), Verify (purple), Reject (red)
- Approve flow → remarks → acknowledgement number generated
- Clarification flow → DC types query → TA notified → TA responds → returns to DC queue

---

## 14. DOCUMENT MANAGEMENT

**Say:** "Every module supports document uploads — trust deeds, appointment letters, contractor agreements, asset ownership proofs. All files are validated before storage — only PDFs and approved image formats accepted. Documents are served securely by the backend. No direct public URLs. Every access requires a valid session."

**Show:**
- Documents section → category tabs (Trust, Declarations, Contractors)
- Upload dialog → drag & drop
- File type validation error on unsupported format
- DC view: document linked inline within declaration detail

---

## 15. NOTIFICATIONS

**Say:** "Every workflow action triggers an immediate in-app notification to the right person. Submission → DC notified. Approval → Temple Authority notified. Clarification request → Temple Authority notified. The bell icon shows the unread count. Click any notification and it takes you directly to the relevant record."

**Show:**
- Bell icon with unread badge
- Notification dropdown: event description, temple name, timestamp
- Click notification → navigate to source record
- Mark All as Read
- Super Admin → Notification Rules page → toggle enable/disable

---

## 16. AUDIT LOGS

**Say:** "Every action in this platform is permanently recorded. Two audit streams — Data Events capture every create, update, approve, reject, with a before-and-after snapshot. Auth Events capture every login, logout, and failed attempt. Searchable by user, temple, action type, and date range. An audit query that used to take weeks now takes seconds."

**Show:**
- Super Admin → Audit Log → Data Events tab
- Filter by temple → show filtered entries
- Click an event → before/after snapshot
- Auth Events tab → login history with timestamps

---

## 17. ANALYTICS & EXPORT

**Say:** "The Analytics module shows declaration compliance rates, grade distributions, and trend charts — designed for executive briefings. When someone needs the raw data, the Export module generates an official PDF report with the DC's name and district on the cover, or a CSV for spreadsheet analysis. Exports are scoped to the current filtered view — no cross-district data can leak. Every export is logged."

**Show:**
- DC analytics: compliance rate card, grade distribution chart
- Super Admin: district-wise compliance comparison table
- Export button → PDF or CSV format selection → download
- Open generated PDF → show official header with DC name and district

---

## 18. USER MANAGEMENT

**Say:** "The Super Admin creates and manages every user account. When a new Temple Authority is onboarded, the system automatically creates a linked temple record in the same transaction — they log in and their temple is already there. District Collectors are scoped to their district at creation — that boundary never changes. Deactivating a user is one toggle — instant, reversible, and audit-logged."

**Show:**
- User Management → user list with role badges
- Create User → select TEMPLE_AUTHORITY → dynamic form with temple name field
- Submit → user + temple created atomically
- Toggle deactivate a user → instant


## CLOSING

"Let me close with what this actually means.

A District Collector no longer waits days for files. They search, review, and approve from their desk.

A Temple Authority no longer travels to the DC office. They submit digitally and get an official acknowledgement in minutes.

The HR&CE Department has a real-time view of compliance across all of Karnataka.

Every action, every approval, every change — permanently in the audit log.

30,000 temples. One platform. Complete transparency.

This is the Temple Registry and Management Portal."

---

## QUICK REFERENCE

**Status Badge Colors**

| Status | Color |
|--------|-------|
| Draft / In Progress | Blue |
| Submitted / Pending Review | Yellow |
| Clarification Required | Orange |
| Verification Pending | Purple |
| Approved | Green |
| Rejected | Red |
| Overdue | Dark Red |
| Superseded | Grey |

**Core Workflow**
```
DRAFT → SUBMITTED → PENDING_REVIEW → APPROVED ✓
                               ↘ CLARIFICATION → PENDING_REVIEW
                               ↘ REJECTED → new DRAFT
```

---
*Temple Registry & Management Portal — Demo Script v2 (Crisp Edition)*
