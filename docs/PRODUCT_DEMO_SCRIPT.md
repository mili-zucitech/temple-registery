# Temple Registry & Management Portal
## Complete Product Demo Script — Live Walkthrough Edition

> **Audience:** Government officials, District Collectors, investors, management teams, stakeholders
> **Format:** Live product demo walkthrough
> **Tone:** Confident, professional, enterprise-grade
> **Estimated runtime:** 45–60 minutes (full feature tour)

---

---

# SECTION 1 — INTRODUCTION

---

## Opening Narration

*Stand in front of the screen. Show the platform's landing/login page.*

---

**What I Should Say:**

"Karnataka is home to over 30,000 temples.

Each one has a trust, a board of members, employees, priests, contractors, properties, and financial assets — all of which need to be tracked, verified, and governed by the district administration.

Until now, that meant paper files, physical visits, and phone calls. A District Collector who needed information about a temple in their district had to wait one to three days just to get the files from the Revenue Office. No standardized forms. No digital records. No accountability trail.

That changes today.

This is the **Temple Registry and Management Portal** — a government-grade digital platform built specifically to digitize, standardize, and bring complete transparency to temple governance across Karnataka.

This is not just a records portal. This is a full workflow system — where temples submit their data, District Collectors review and approve it, everything is tracked in real time, and every action leaves a complete audit trail.

Let me walk you through the entire platform."

---

**Key Points to Hit in the Opening:**

- 30,000+ temples in Karnataka — massive governance scale problem
- Paper-based system → lost records, no accountability, delays
- This platform digitizes the entire governance chain end-to-end
- Every role, every workflow, every approval is built in
- Production-ready, enterprise-grade, running live

---

---

# SECTION 2 — ROLE EXPLANATION

---

## Platform Roles Overview

*Navigate to or show a role overview slide / diagram.*

---

**What I Should Say:**

"Before we dive into the features, let me explain who uses this platform and what they can do.

The platform is built around five distinct roles — and each role has a carefully defined set of permissions that are enforced at every level of the system."

---

### Role 1 — Super Admin (HR&CE Department)

**What I Should Say:**

"The **Super Admin** belongs to the HR&CE Department — the Hindu Religious and Charitable Endowments Department, which is the central authority that oversees all temple governance in Karnataka.

The Super Admin has the highest access level in the system. They can:

- Create and manage all user accounts — District Collectors, their staff, and Temple Authorities
- Manage the complete geo-hierarchy — State, District, Taluk, Hobli
- View every temple across Karnataka — no district boundary restrictions
- Override workflows, approve submissions, and manage escalations
- Access the complete audit log for any user, any temple, any action
- Configure system-wide notification rules and SLA thresholds

The Super Admin is the platform's control center. Everything flows through this role."

---

### Role 2 — District Collector (DC)

**What I Should Say:**

"The **District Collector** is the primary government authority in this system.

Each DC is assigned to exactly one district. They can only see temples within their own district — there is strict geographic scoping enforced at the database level.

The DC can:

- Search and browse all temples in their district with advanced filters
- View complete temple profiles — contact details, history, photographs, bank details
- View all trust records, board member details, employee lists, contractor records
- Review asset declarations submitted by Temple Authorities
- **Approve, reject, or request clarification** on those submissions
- Generate official acknowledgement letters for approved declarations
- Export PDF and CSV reports for official government reporting

The DC does not enter or edit temple data — their role is oversight and approval."

---

### Role 3 — DC Staff

**What I Should Say:**

"DC Staff are the support officers working in the District Collector's office.

They have the same read access as the DC — same district scope, same ability to search and view all temple information — but they cannot approve or reject any submissions.

Their job is to help the DC by pulling information quickly, preparing summary reports, and answering calls from temples who want to know the status of their submissions.

Think of DC Staff as the research and support arm for the District Collector."

---

### Role 4 — Temple Authority

**What I Should Say:**

"The **Temple Authority** is the temple's designated representative — typically a trustee or the temple manager.

Each Temple Authority account is linked to exactly one temple. They cannot see any other temple's data.

Their responsibilities are to:

- Maintain and update their temple's complete profile
- Manage their trust details and board members
- Manage employee and contractor records
- Submit annual asset declarations to the District Collector
- Respond to clarification requests from the DC
- Upload all supporting documents
- Track the status of every submission in real time

The Temple Authority is the data owner. Everything they submit goes through a structured approval workflow before it becomes official."

---

### Role 5 — Auditor / Viewer

**What I Should Say:**

"The **Auditor** role is designed for external oversight — state government departments, audit bodies, and compliance teams.

They have read-only access to temple data and reports. They can view audit logs, pull system-wide reports, and review the history of any temple or declaration.

They cannot modify anything. Pure oversight, pure transparency."

---

---

# SECTION 3 — COMPLETE FEATURE-WISE DEMO SCRIPT

---

## Feature 1 — Login & Authentication

---

**What I Should Say:**

"Let's start at the beginning — the login screen.

The platform uses secure JWT-based authentication. Every session is managed with short-lived access tokens and secure refresh tokens stored in httpOnly cookies — which means the credentials cannot be accessed or stolen by browser scripts.

When you log in, the system immediately knows who you are, what role you have, and which district you belong to. Every page, every action, every API call is filtered through that identity.

Let me log in as a District Collector."

**What I Should Show:**

- Open the login page
- Show the clean login form — email and password
- Log in with DC credentials
- Watch the redirect to the DC dashboard

**Key Points:**

- Tokens stored securely in httpOnly cookies — not localStorage
- Role-based redirect on login — different roles land on different dashboards
- Session management with automatic token refresh — no mid-session logouts
- All authentication events are captured in the audit log

**Demo Flow:**

1. Open the login page
2. Enter DC credentials
3. Show successful login → automatic redirect to DC Dashboard
4. Point out the role indicator in the top navigation

**Important UI Areas:**

- Login form with email + password
- Loading state during authentication
- Role-based dashboard redirect

**Transition Line:**

"Now that we're logged in as the District Collector, let me show you the first thing they see — their dashboard."

---

## Feature 2 — DC Dashboard Overview

---

**What I Should Say:**

"This is the District Collector's dashboard — and this is where every working day starts.

In a single screen, the DC immediately knows the state of every temple in their district.

At the top, we have the key performance indicators — total temples in the district, how many declarations are pending review, how many are overdue, and how many temple profiles are waiting for approval.

These numbers are not static. They update automatically. The moment a Temple Authority submits a declaration, this counter goes up. The moment the DC approves it, it goes down. Real-time governance.

Below the KPIs, we have the activity feed — a live log of what's been happening across all temples in the district. Who submitted, who updated, who was approved.

And on the right, we have the grade distribution chart — a visual breakdown of how many Grade A, Grade B, and Grade C temples are in this district. At a glance, the DC knows the composition of their temple portfolio."

**What I Should Show:**

- DC Dashboard page fully loaded
- KPI cards at the top: Total Temples, Pending Declarations, Overdue Declarations, Pending Profile Reviews
- Activity feed in the middle
- Grade distribution (A/B/C) breakdown
- Highlight the "Pending" and "Overdue" counters — these are the action items

**Key Points:**

- Real-time KPIs pulled from the search summary table — fast, no heavy joins
- Overdue alerts surface immediately on login — the DC cannot miss them
- Activity feed shows the last N events across the entire district
- Grade distribution helps the DC plan inspection priorities (Grade A temples get highest attention)

**Demo Flow:**

1. Show the full dashboard layout
2. Point to each KPI card and explain what it means
3. Click into the "Pending Declarations" number to show it links to the filtered search
4. Show the activity feed and explain the event types
5. Show the grade distribution

**Important UI Areas:**

- KPI stat cards with real numbers
- Overdue badge (shown in red if overdue count > 0)
- Activity feed with timestamps and event types
- Grade A/B/C distribution breakdown
- Navigation sidebar with all module links

**Transition Line:**

"Now let's go into the most powerful feature this platform offers — the temple search."

---

## Feature 3 — Geo-Hierarchy Search

---

**What I Should Say:**

"One of the most important features in this platform is the geographic search — and it's built around how Karnataka's administrative structure actually works.

Karnataka is organized from State → District → Taluk → Hobli. Every temple in the system is mapped to this hierarchy precisely.

When a DC wants to find temples, they can drill down through this hierarchy — or stop at any level. They can search at the district level to see all temples across their jurisdiction. They can narrow to a specific Taluk. They can go all the way down to a Hobli to find temples in a specific village cluster.

Let me show you how this works."

**What I Should Show:**

- Open the Temple Search page for DC
- Show the Geo filter panel on the left or top
- Select a District (already pre-filtered to their district)
- Select a Taluk — watch the results filter in real time
- Select a Hobli — results narrow further
- Show the result count updating dynamically: "Temples found: 47"

**Key Points:**

- Cascading dropdowns — Taluk options change based on District; Hobli options change based on Taluk
- All selections stored in URL query params — the search is shareable and bookmarkable
- Result count displayed prominently before the list renders
- Zero page reloads — all filtering is instant via React Query
- DC jurisdiction is enforced server-side — they can never see outside their district even if they manipulate the URL

**Demo Flow:**

1. Open DC Temple Search page
2. Show the geo filter panel
3. Select District (pre-scoped)
4. Select a Taluk → show results filter
5. Select a Hobli → show results narrow
6. Clear Hobli selection → show all Taluk temples return
7. Point to the "Temples found: N" count

**Important UI Areas:**

- Cascading Geo dropdowns (District → Taluk → Hobli)
- Live result count banner
- Results table updating without page reload

**Transition Line:**

"Now let me combine that geo search with the other powerful filters available in the search module."

---

## Feature 4 — Temple Search & Advanced Filtering

---

**What I Should Say:**

"Beyond the geo hierarchy, the search module has a full set of filters that let the DC pinpoint exactly what they're looking for.

You can filter by temple grade — Grade A, B, or C — or view all grades together. You can search by temple name with partial text matching. You can filter to show only temples with pending declarations — so the DC's attention immediately goes to the temples that need action.

And critically — you can filter for overdue declarations. These are the high-priority cases where a temple was supposed to submit by a deadline and hasn't. The system automatically flags them, and they appear highlighted in the search results.

Let me show you each filter in action."

**What I Should Show:**

- Show the full filter panel
- Apply Grade A filter — results update instantly
- Apply "Pending Only" filter — show only temples with pending submissions
- Apply "Overdue Only" filter — show overdue cases highlighted in red
- Type a temple name in the search box — show partial name matching
- Show the search results table: columns for Temple Name, Grade badge, Taluk, Pending Actions, Overdue indicator, Last Update

**Key Points:**

- Multiple filters can be active simultaneously
- Filters persist in the URL — copy the URL and share it with a colleague
- Grade badge is color-coded and visually prominent in each row
- Pending Actions column is the default sort — the most urgent temples always rise to the top
- Overdue temples are visually flagged in the results table

**Demo Flow:**

1. Apply Grade A filter
2. Stack the "Pending Only" filter on top
3. Show the resulting filtered list
4. Sort by Pending Actions column
5. Click the "View" button on a temple to go into its full profile

**Important UI Areas:**

- Grade filter (A/B/C multi-select checkboxes)
- Pending Only / Overdue Only toggle checkboxes
- Temple name text search
- Results table with sortable columns
- Grade badges (color-coded: A = Gold, B = Silver, C = Bronze)
- Overdue indicator badge (red)
- "View Temple" action button

**Transition Line:**

"Let's click on a temple and see the complete profile view."

---

## Feature 5 — Temple Profile Management

---

**What I Should Say:**

"This is the Temple Profile page — and this is where the complete picture of a temple lives.

Every piece of information about this temple is organized into tabs. The Overview tab gives you the core identity — temple name, registration number, grade, primary deity, year of establishment, and address.

Below that, you have the contact details — who manages this temple, their phone number, email, and website. You have the location with actual GPS coordinates, and when integrated with the map, you can see exactly where the temple is.

You also have the Heritage and History section — the historical significance of this temple, the annual festivals it celebrates, any linked mutts or sub-temples, and the architectural landmark descriptions.

And then the financial information — the bank account details where the temple's funds are maintained, properly masked for security, with the bank name and IFSC code.

All of this data was submitted by the Temple Authority and has gone through the DC approval process. What you're looking at is the officially approved, verified profile."

**What I Should Show:**

- Temple Profile page Overview tab
- Highlight: Temple name, registration number, Grade badge
- Highlight: Primary deity, religious tradition
- Highlight: Year of establishment
- Highlight: Complete address with district/taluk/hobli hierarchy
- Highlight: Contact person name, phone, email
- Highlight: GPS coordinates
- Highlight: Bank details (masked account number visible: ****1234)
- Scroll through the Heritage & Profile Content card
- Show the temple photograph uploaded by the authority

**Key Points:**

- All data was submitted through a workflow — nothing is entered directly
- Bank account number is encrypted at rest and masked in the UI — security by design
- The profile shows both the currently approved data AND highlights if there's a pending update waiting for review
- Photographs are securely stored and served by the backend — not exposed publicly

**Demo Flow:**

1. Open the Overview tab
2. Walk through each data card section by section
3. Point out the profile status badge — "APPROVED" with the date
4. If a pending update exists, show the orange "Pending Review" indicator
5. Show the temple photograph

**Important UI Areas:**

- Grade badge (prominently placed)
- Status badge (APPROVED / PENDING REVIEW)
- Heritage & Profile Content card
- Bank details card with masked account number
- Temple photograph section

**Transition Line:**

"Now let me switch roles and show you how a Temple Authority actually submits and manages this profile."

---

## Feature 6 — Temple Registration & Profile Submission Workflow

---

*Switch to Temple Authority login.*

**What I Should Say:**

"Let me now log in as a Temple Authority.

When a Temple Authority logs in for the first time, they're presented with their temple's current profile status. Every piece of data they submit goes through a formal workflow — Draft → Submitted → Approved or Rejected.

Let me walk you through how a Temple Authority updates their profile and submits it for DC review.

We click 'Edit Profile' — and the profile form opens. They can update every field — contact details, description, bank information, photographs, historical notes, annual festivals — everything.

Once they've made their changes, they click 'Save as Draft.' The changes are saved but not yet visible to the DC. They can come back and continue editing.

When they're ready, they click 'Submit for Review.' At that point, the submission is locked for editing, and it enters the DC's review queue. The DC will see it immediately in their dashboard's 'Pending Profile Reviews' counter."

**What I Should Show:**

- TA Dashboard — show the current profile status card
- Click "Edit Profile"
- Show the comprehensive profile form with all fields
- Fill in or modify a field — e.g., update the contact phone number
- Click "Save as Draft" — show the DRAFT status badge
- Click "Submit for Review" — show the confirmation dialog
- After submission, show the profile status changing to "SUBMITTED / PENDING REVIEW"
- Show the TA can no longer edit while it's under review

**Key Points:**

- DRAFT state: editable, not visible to DC
- SUBMITTED state: locked for editing, visible to DC for review
- Staging architecture: no data goes directly to the main profile — it always goes through staging first
- Version tracking: every submission creates a new version number
- If the DC rejects it, the TA can create a new version and resubmit

**Demo Flow:**

1. Login as Temple Authority
2. Show TA dashboard with profile status
3. Click "Edit Profile"
4. Modify a field
5. Save as Draft
6. Submit for Review
7. Show "SUBMITTED" status badge
8. Show the TA-side read-only view while pending

**Important UI Areas:**

- Profile Status Card on TA Dashboard
- Edit Profile button
- Form with all fields organized by section
- Save as Draft vs Submit for Review buttons
- Status badge transition animation
- Version number display

**Transition Line:**

"Now let me switch back to the District Collector and show you how they review and approve this submission."

---

## Feature 7 — DC Approval Workflow for Temple Profile

---

*Switch back to DC login.*

**What I Should Say:**

"Back on the DC's dashboard — you can see the 'Pending Profile Reviews' counter has gone up by one. The DC now knows there's a new submission waiting for their review.

They click into it and land on the Temple Profile review page. On the right side, they can see the current approved version of the profile. On the left, they can see what the Temple Authority has submitted as a proposed update — highlighted to show exactly what changed.

The DC reviews it carefully. If everything looks correct, they click 'Approve' — add an optional remark — and submit.

At that moment, the new version becomes the officially approved profile. The previous version is automatically marked as 'Superseded.' The Temple Authority receives a notification. The audit log captures the exact time, the approver, and the remarks.

If the DC finds issues — they click 'Reject.' They must provide a reason. The Temple Authority receives that feedback and can create a new version to address the DC's concerns."

**What I Should Show:**

- DC Dashboard showing incremented Pending Profile Reviews count
- Navigate to the Pending Submissions list
- Click on the specific temple's pending review
- Show the side-by-side comparison: Current Approved vs. Proposed Update
- Highlight changed fields
- Click "Approve" → show remarks dialog → confirm
- Show the profile status updating to "APPROVED"
- Show the Superseded previous version in the history
- Alternatively, show the Reject flow with a rejection reason

**Key Points:**

- Every approval or rejection requires the DC to be in the same district as the temple — enforced server-side
- Remarks are captured and stored — full paper trail
- Previous approved version is preserved as "Superseded" — never deleted
- Notification automatically sent to Temple Authority on approval or rejection
- All actions captured in the audit log

**Demo Flow:**

1. DC Dashboard → highlight Pending Profile Reviews count
2. Navigate to DC Temple Profile review page
3. Open pending submission
4. Review the proposal
5. Click Approve → enter remarks → confirm
6. Show "APPROVED" status with timestamp
7. Show the version history tab — previous version shows "SUPERSEDED"

**Important UI Areas:**

- "Pending Profile Reviews" counter on dashboard
- Approve button (green) with remarks field
- Reject button (red) with mandatory reason field
- Status badge transitions
- Version history list

**Transition Line:**

"Now let's look at another critical module — Trust and Board Management."

---

## Feature 8 — Trust & Board Management

---

*Stay on Temple Authority view or switch to DC view of the Trust tab.*

**What I Should Say:**

"Every temple has a Trust — the registered legal entity that is legally responsible for managing the temple's affairs and finances.

The Trust module captures the complete profile of the trust: name, registration number, the registering authority, trust type — public or private — PAN number, and the bank account details.

And then the board members. Every trustee, every board member, their designation, their appointment date, their tenure end date — all of it is captured here. Current board members are shown separately from historical members who have left or whose tenure has ended. This creates a clear, auditable record of who was responsible for what, and when.

The Aadhaar numbers of board members are stored encrypted and displayed masked — only the last four digits are visible. The PAN number is also masked. Security is non-negotiable.

When the trust has a new board member — the Temple Authority goes in, adds them, and that record is immediately visible to the DC. There's no staging workflow for trust data — it's direct-save, because the trust data is informational, not approval-gated.

Meeting minutes can also be uploaded here — PDF documents of the board's official meetings, creating a complete governance record."

**What I Should Show:**

- Navigate to the Trust tab in the Temple Profile
- Show trust registration details: name, registration number, trust type, PAN (masked)
- Scroll to the Board Members section
- Show current board members table: Name, Designation, Appointment Date, Tenure End
- Show historical members (greyed out / separate section)
- Show the Aadhaar masked display (XXXX-XXXX-1234 format)
- Show the Meeting Minutes upload section
- Navigate to a board member's detail view to show all their fields

**Key Points:**

- Trust data is directly saved — no staging cycle (read: immediate visibility to DC)
- Aadhaar stored AES-256-GCM encrypted — only last 4 digits shown to any role
- PAN number masked for DC/DC Staff; fully visible only to Super Admin
- Board members retain complete history — past members are preserved, not deleted
- Meeting minutes provide official documentation of trust governance decisions

**Demo Flow:**

1. Open Trust tab on temple profile
2. Walk through trust registration details
3. Show current board members
4. Click into a board member — show their masked Aadhaar
5. Show historical members section
6. Show the meeting minutes upload area
7. Briefly show adding a new board member (TA side)

**Important UI Areas:**

- Trust registration details card
- Board Members table (current vs. historical toggle)
- Masked Aadhaar display
- Masked PAN display
- Meeting minutes file upload

**Transition Line:**

"Let's move to the people side of temple management — employees and contractors."

---

## Feature 9 — Employee Management

---

**What I Should Say:**

"Every temple has staff — priests, administrative officers, maintenance workers, security personnel. All of them are managed in the Employee module.

A Temple Authority can add an employee, capture their designation, employee type, date of joining, salary grade, and contact information. The moment they're added, the DC can see them in the temple's employee list.

The employment status is tracked throughout their tenure. When an employee goes on leave, their status is updated to 'On Leave.' When they retire or resign, their status is updated accordingly, and their leaving date is captured.

No records are ever deleted. A retired employee stays in the system with their full history. This is critical for audit purposes — the government needs to know who was employed at a temple during any given period.

Let me show you the employee list and how the status lifecycle works."

**What I Should Show:**

- Navigate to the Employees tab (DC view or TA view)
- Show the employee list table: Name, Type (Priest/Admin/Maintenance/Security), Designation, Join Date, Status badge
- Show status badges: Active (green), On Leave (yellow), Retired (grey), Resigned (grey)
- Click into an employee to show their full detail
- On TA side, show the "Add Employee" button and form
- Show the "Update Status" action — change Active → On Leave
- Show the date of leaving field for Retired/Resigned

**Key Points:**

- Four employee types: Priest (Archaka), Administrative Staff, Maintenance, Security
- Status lifecycle: Active → On Leave → Active, or Active → Retired / Resigned (terminal)
- Retired/Resigned records are never deleted — full historical visibility
- Temple Authority scoped to their own temple's employees only
- DC can view all employees across all district temples

**Demo Flow:**

1. Open Employees tab
2. Walk through the employee list
3. Show status badges and their color coding
4. Click an employee → full detail view
5. Show "Add Employee" form on TA side
6. Show status update action

**Important UI Areas:**

- Employee list table with status badges
- Employee type filter
- Status filter (Active / On Leave / Retired / Resigned)
- Add Employee button (TA only)
- Employee detail panel

**Transition Line:**

"Now let's look at Contractors — the external service providers that temples engage for everything from construction to security services."

---

## Feature 10 — Contractor Management

---

**What I Should Say:**

"Temples regularly engage contractors for maintenance work, renovation projects, catering for festivals, security, and other services. The Contractor module tracks all of this.

For each contractor, we capture their name, GST registration number, the type of service they provide, the contract reference number and work order date, the contract value in rupees, and the payment status.

The actual contract document — the signed PDF — can be uploaded directly in the system. So when the DC or an auditor wants to verify a contract, they don't need to request physical documents. It's right here.

When a contract ends, the Temple Authority closes it in the system. The record remains — with the contract end date — giving the DC a complete history of every vendor the temple has worked with."

**What I Should Show:**

- Navigate to the Contractors tab
- Show the contractor list: Name, Service Type, Contract Value, Status (Active/Ended)
- Click a contractor to show their full detail
- Show the contract document download link
- Show GST number field
- Show contract value with payment status
- On TA side, show the "Add Contractor" form

**Key Points:**

- GST number captured — financial accountability
- Contract documents uploaded and accessible instantly — no file requests
- Soft-delete pattern: ended contracts remain visible with their history
- Payment status tracked: Paid, Partially Paid, Pending
- DC can see all contractors for all temples in their district

**Demo Flow:**

1. Open Contractors tab
2. Walk through contractor list
3. Click a contractor → full detail with contract document link
4. Show an active vs. ended contractor record
5. Show "Add Contractor" flow on TA side

**Important UI Areas:**

- Contractor list table with Active/Ended status
- Contract value display in INR
- Payment status badge
- Document download link (contract PDF)
- Add Contractor button (TA only)

**Transition Line:**

"Now let's cover the most critical workflow in this entire platform — the Asset Declaration."

---

## Feature 11 — Asset Declaration Workflow

---

**What I Should Say:**

"The Asset Declaration is the financial heart of this platform.

Every temple is legally required to declare its assets to the District Collector annually. These assets include immovable property — agricultural land, temple buildings, leased properties — and movable assets — gold, silver, idols, vehicles, electronic equipment, financial instruments.

Before this platform, temples submitted these declarations on paper, in different formats, at different times. There was no standardization, no deadline tracking, and no digital acknowledgement.

Now, it all happens here.

Let me show you the complete declaration lifecycle — from a Temple Authority creating a draft, all the way to the DC approving it and a digital acknowledgement being issued."

**What I Should Show:**

- TA Dashboard → Declaration section
- Show financial year list with status badges
- Show "Submit New Declaration" button
- Open the declaration form — structured sections for immovable and movable assets
- Fill in some fields to demonstrate the form
- Save as Draft → show DRAFT badge ("In Progress")
- Submit → show PENDING_REVIEW badge ("Submitted")

**Key Points:**

- Declarations are organized by financial year
- State badges: Not Started (grey), In Progress (blue), Submitted (yellow), Clarification Required (orange), Verification Pending (purple), Approved (green), Rejected (red), Overdue (dark red)
- Once submitted, the declaration is locked — the Temple Authority cannot edit it until the DC responds
- The snapshot of the declaration at submission time is preserved — future edits don't alter the submitted record
- Overdue flag is automatically set by the system if a deadline passes without submission

**Demo Flow:**

1. TA Dashboard → Declarations section
2. Show year-wise status list
3. Click "Start New Declaration" for current year
4. Walk through the form sections: Immovable Assets, Movable Assets
5. Save as Draft
6. Submit → confirmation dialog
7. Show "Submitted" badge with timestamp
8. Switch to DC view → show this declaration appears in the Pending queue

**Important UI Areas:**

- Financial year list with status badges
- Declaration form: Immovable Assets section (land, buildings, leased properties)
- Declaration form: Movable Assets section (gold, silver, idols, vehicles, equipment)
- Submit button with confirmation dialog
- Status badge progression
- Overdue alert banner (dark red, shown on dashboard when overdue)

**Transition Line:**

"Now let me show you what happens on the DC side when this declaration arrives."

---

## Feature 12 — DC Declaration Review & Approval

---

**What I Should Say:**

"The DC receives an in-app notification — a new declaration has been submitted. They can also see the pending count on their dashboard has increased.

They open the declaration. They can see the complete asset declaration — every item the temple has declared. They review it carefully.

Now they have four options:

**Approve** — if everything looks correct. The declaration is accepted officially. A digital acknowledgement is generated with an official acknowledgement number. The Temple Authority can download it immediately.

**Request Clarification** — if there's a question about a specific item. The DC types their query and sends it back. The status changes to 'Clarification Requested' and the Temple Authority is notified. They can respond inline, and the declaration returns to the DC's review queue.

**Flag for Physical Verification** — for high-value declarations or suspicious entries, the DC can flag the declaration for a physical site inspection. An official record of the verification findings must be entered before the declaration can be approved or rejected.

**Reject** — if the declaration has serious issues, the DC rejects it with a mandatory reason. The Temple Authority can then correct and resubmit as a new version.

Let me demonstrate the approval flow and the clarification loop."

**What I Should Show:**

- DC view → Pending Declarations list
- Open a submitted declaration
- Show the full declaration detail with all asset entries
- Show the four action buttons: Approve, Clarify, Physical Verify, Reject
- Click "Approve" → remarks dialog → confirm
- Show the status changing to "APPROVED"
- Show the acknowledgement number being generated
- Alternatively, show "Request Clarification" → type a query → submit
- Show TA notification of clarification request
- Show TA responding → declaration re-entering DC review queue

**Key Points:**

- Four distinct actions: Approve, Clarify, Physical Verify, Reject
- Approved = terminal state — no modifications after approval
- Clarification loop creates a structured Q&A record between DC and Temple Authority
- Physical verification requires the DC to enter findings before they can close the declaration
- Digital acknowledgement generated automatically on approval — no manual paperwork
- SLA timers: if a declaration sits in "Physical Verification" for 30+ days, the Super Admin is alerted

**Demo Flow:**

1. DC Dashboard → click Pending Declarations counter
2. Open a declaration in PENDING_REVIEW
3. Review asset details
4. Click Approve → remarks → confirm
5. Show APPROVED status + acknowledgement number
6. Go back, open another declaration
7. Click "Request Clarification" → enter query → submit
8. Switch to TA side → show notification + clarification indicator
9. TA responds → switch back to DC → declaration is back in review queue

**Important UI Areas:**

- Pending Declarations list with overdue indicators
- Declaration detail view with all asset sections
- Four action buttons (Approve = green, Reject = red, Clarify = amber, Verify = purple)
- Clarification thread (inline Q&A with timestamps)
- Acknowledgement number display after approval
- Overdue badge (dark red, with SLA days counter)

**Transition Line:**

"Let me now show you the document management system that supports all of these workflows."

---

## Feature 13 — Document Uploads & Document Management

---

**What I Should Say:**

"Every module in this platform supports document uploads — and they're all accessible from one central place.

Temple Authorities can upload supporting documents for their trust registration — things like the trust deed, registration certificate, and board resolutions. They can upload employee appointment letters. Contractor agreements. Asset ownership documents for their declarations.

All uploaded files are validated before storage — only PDFs and approved image formats are accepted, with file size limits enforced. No unsecured file types can enter the system.

From the DC side, all documents are accessible directly within the relevant context. When reviewing a declaration, the DC can see the supporting documents right there in the declaration view. When reviewing a contractor's profile, the contract document is linked directly.

Documents are served securely by the backend — the actual file URLs are not publicly accessible. Every file access requires a valid authenticated session."

**What I Should Show:**

- Navigate to the Documents section on a temple profile (TA view)
- Show categorized document list: Trust Documents, Declaration Attachments, Contractor Contracts
- Click a document to preview it
- Show the upload dialog — drag & drop or file picker
- Show the file type and size validation in action
- DC view: show documents appearing inline in the declaration detail

**Key Points:**

- Documents organized by category and context
- Secure file serving — no direct public URLs
- File type validation enforced (PDF, images only for photos)
- File size limits enforced server-side
- Documents associated with specific records — not loose uploads

**Demo Flow:**

1. TA side → open Documents section
2. Show document categories
3. Upload a document — drag and drop
4. Show validation feedback for unsupported file
5. Show successful upload with file name and upload date
6. Switch to DC side → view the same document in declaration context

**Important UI Areas:**

- Document category tabs
- File upload area (drag & drop)
- File validation error messages
- Document list with name, date, size
- Preview / Download buttons

**Transition Line:**

"Now let's look at one of the platform's most important governance features — the Notification system."

---

## Feature 14 — Notification System

---

**What I Should Say:**

"No approval workflow is useful if the people involved don't know what's happening. The notification system ensures that every relevant action triggers an immediate, targeted alert to the right person.

When a Temple Authority submits a declaration — the DC gets a notification.
When the DC approves — the Temple Authority gets a notification.
When the DC requests clarification — the Temple Authority gets a notification.
When a profile submission is rejected — the Temple Authority gets a notification.

All notifications appear in the in-app notification inbox — the bell icon at the top of the screen. Unread notifications have a badge count. You can mark individual notifications as read, or mark all as read at once.

Critically — all notifications are logged in the system, including their delivery status. The Super Admin can see if any notifications failed to deliver and trigger a manual retry.

And from the Super Admin's configuration panel, notification rules can be configured — which events trigger notifications, who receives them, and what the message templates say. The system is fully configurable without code changes."

**What I Should Show:**

- Show the notification bell icon in the top navigation with an unread badge count
- Click the bell → notification dropdown opens
- Show individual notifications with event description, temple name, timestamp
- Click a notification → it navigates to the relevant record
- Show "Mark All as Read" button
- Super Admin side → Notification Rules page
- Show the list of configurable notification rules
- Show toggling a notification rule on/off

**Key Points:**

- In-app notifications only (v1) — designed to add email/SMS in v2
- Every notification is linked to the source record — one click navigates you there
- Notification delivery status tracked — no silent failures
- Super Admin can configure notification rules without developer involvement
- Notification failures visible in the Super Admin dashboard

**Demo Flow:**

1. Show notification bell with badge count
2. Open notification dropdown
3. Read through two or three notifications
4. Click one → navigate to source record
5. Mark all as read
6. Switch to Super Admin → Notification Rules page
7. Show the rule list and toggle an enable/disable

**Important UI Areas:**

- Bell icon with unread badge counter
- Notification dropdown panel
- Individual notification items with type icon, description, timestamp
- Mark as Read / Mark All as Read buttons
- Super Admin: Notification Rules list with toggle switches

**Transition Line:**

"Now let's talk about what happens behind the scenes — the Audit Log."

---

## Feature 15 — Audit Logs

---

**What I Should Say:**

"In government software, accountability is everything. Every action in this platform — every approval, every rejection, every login, every profile edit, every data access — is captured in the audit log.

This is not optional. This is fundamental to how the platform is built.

The audit log has two streams. The first is data events — every create, update, approve, reject, submit action, with the exact user who performed it, the exact timestamp, and a before/after snapshot of what changed.

The second stream is authentication events — every login attempt, every logout, every failed authentication, every token refresh. If there's ever a security concern about unauthorized access, this log tells you exactly what happened.

From the Super Admin's audit log viewer, you can search by user, by temple, by action type, and by date range. You can pull the complete history of any temple or any user in seconds.

For an audit body that previously had to manually search through paper files — this changes everything."

**What I Should Show:**

- Super Admin side → Audit Log page
- Show the two tabs: Data Events, Auth Events
- Show the Data Events list: timestamp, actor, action type, entity, temple name
- Apply a filter — filter by a specific temple name or user
- Click an event → show the detail view with before/after snapshot
- Switch to Auth Events tab → show login attempts, failures
- Show the date range filter

**Key Points:**

- Immutable audit trail — records cannot be edited or deleted
- Before/after snapshots stored for every data mutation
- Auth events track every security-relevant action
- Searchable and filterable by any combination of fields
- Fully accessible to Super Admin and Auditor roles
- Critical for compliance with government audit mandates

**Demo Flow:**

1. Super Admin → Audit Log page
2. Show Data Events tab with entries
3. Filter by a specific temple
4. Click an event → show detail with before/after
5. Switch to Auth Events → show login/failure history
6. Apply date range filter

**Important UI Areas:**

- Data Events tab vs. Auth Events tab
- Event list: timestamp, user, action, entity
- Event detail panel with before/after JSON snapshot
- Filter panel: user, temple, action type, date range
- Pagination for large result sets

**Transition Line:**

"With an audit log like this, reporting becomes straightforward. Let me show you the Analytics and Reports module."

---

## Feature 16 — Analytics & Reports

---

**What I Should Say:**

"The Analytics module gives decision-makers a high-level view of what's happening across the temple governance ecosystem.

For the District Collector — they can see their district's declaration compliance rate. What percentage of temples have submitted their annual declaration? How many are overdue? How many have been approved this year versus last year?

For the Super Admin — they get a statewide view. District-by-district comparison of compliance rates, pending workloads, overdue escalations. They can identify which districts need attention and which are performing well.

All of this is visualized with charts and graphs — not raw tables. It's designed to support executive briefings and government reviews.

And when someone needs the raw data — they can export it."

**What I Should Show:**

- DC Analytics section on their dashboard
- Show the declaration compliance rate chart for their district
- Show grade distribution pie chart
- Show pending vs. approved declarations trend over time
- Super Admin side → statewide analytics
- Show district-wise compliance table
- Show the overdue breakdown by district

**Key Points:**

- Compliance rate = metric that matters most to the government
- Grade distribution shows the portfolio composition of the jurisdiction
- Trend charts show if things are improving or getting worse over time
- Statewide view enables central oversight and policy decisions
- Real numbers from the production database — not mocked up

**Demo Flow:**

1. DC Dashboard → Analytics section
2. Show compliance rate metric
3. Show grade distribution chart
4. Show recent activity trend
5. Super Admin → statewide dashboard with district comparison table

**Important UI Areas:**

- Compliance rate percentage card
- Grade distribution pie chart
- Timeline trend chart
- District comparison table (Super Admin)
- Overdue escalation counters

**Transition Line:**

"Analytics tell you what's happening. Export lets you share it with the world. Let me show you the Export features."

---

## Feature 17 — Export Features

---

**What I Should Say:**

"Government work requires official documentation. When a District Collector needs to submit a report to their superior about the temple administration situation in their district — they can do it in one click.

The Export module generates two formats:

**PDF** — an official formatted report with the DC's name, district, and date on the cover. This is the document you submit to the government. It includes the filtered list of temples with their key data points.

**CSV** — a raw data export for further analysis. This is what the DC Staff uses to prepare spreadsheet reports or import data into other government systems.

The export scope is always limited to the current filtered view. The DC cannot accidentally export data from outside their jurisdiction.

Every export action is logged in the audit trail — who exported what, and when."

**What I Should Show:**

- DC Export page or export button in search results
- Show the format selection: PDF / CSV
- Show the scope indicator: "Exporting N temples matching current filters"
- Trigger a PDF export → show loading state → download begins
- Show the generated PDF with header: DC name, district, date, filtered temple list
- Show CSV export → download opens in spreadsheet

**Key Points:**

- Exports are jurisdiction-scoped — no cross-district data leakage
- PDF is official government report quality
- Every export logged in audit trail
- Scope limited to current filtered view — performance-safe
- DC and DC Staff both have export access (DC Staff has lower row limits)

**Demo Flow:**

1. Apply filters in the temple search
2. Click Export
3. Select PDF format
4. Show download progress
5. Open the PDF — show the official header
6. Repeat with CSV

**Important UI Areas:**

- Export button in search results toolbar
- Format selection (PDF / CSV)
- Scope indicator: "N temples selected"
- Download progress indicator
- Export history (if visible in audit log)

**Transition Line:**

"Let me now show you the User Management module — how the Super Admin controls who has access to what."

---

## Feature 18 — User Management & Admin Configuration

---

**What I Should Say:**

"The Super Admin controls all user accounts from the User Management module.

When a new District Collector is posted to a district — their account is created here. Role is set to District Collector. District is assigned. They log in and immediately have access only to their district's data.

When a new Temple Authority needs to be onboarded — their account is created here. The system automatically creates a placeholder temple record in the same transaction. The Temple Authority logs in and finds their temple already set up and ready for them to start populating.

Every user has an Aadhaar number on file — captured during onboarding. This is how identity is verified.

And if a user's account needs to be deactivated — a single toggle disables their access immediately, without deleting any of the data they've worked with.

Let me show you the user management interface."

**What I Should Show:**

- Super Admin → User Management page
- Show the user list: Name, Role badge, District/Temple, Status (Active/Inactive), Last Login
- Click "Create User" → show the form
- Select role "DISTRICT_COLLECTOR" → show district assignment field appears
- Select role "TEMPLE_AUTHORITY" → show temple name field appears + Aadhaar field
- Show the "Create Temple Also?" toggle for TA creation
- Show toggle to deactivate a user
- Show the role filter on the user list

**Key Points:**

- Role determines what fields appear in the creation form
- Temple Authority creation auto-creates a linked temple record — atomic, in one transaction
- District assignment for DC is locked at creation — scope is immutable
- Aadhaar number collected on onboarding — identity verification
- Deactivation is instant and reversible — account is preserved
- All user management actions are logged in the audit trail

**Demo Flow:**

1. User Management page → show user list
2. Filter by role "DISTRICT_COLLECTOR" → show DC accounts
3. Click "Create User"
4. Select TEMPLE_AUTHORITY role → show dynamic form fields
5. Fill in name, email, Aadhaar, temple name
6. Submit → show user created + temple created in one action
7. Show the new user in the list with INACTIVE status → activate them

**Important UI Areas:**

- User list table: Name, Role badge, District, Status, Last Login
- Role filter dropdown
- Create User button → modal form
- Role selection driving dynamic form fields
- Active/Inactive toggle
- Temple name auto-creation indicator

**Transition Line:**

"Beyond user management, the Super Admin also controls the geo master data — the administrative hierarchy that the entire platform is built on."

---

## Feature 19 — Geo Master Data Management

---

**What I Should Say:**

"Every temple in this system is geo-located to a specific Hobli, within a Taluk, within a District, within the state of Karnataka.

The Super Admin manages this entire geographic hierarchy from the Geo Management module. If the government reorganizes administrative boundaries — if a new Taluk is created, or a District boundary changes — it's updated here. And that update propagates instantly through every search, every filter, every temple record.

This is the master reference for all geographic data in the platform. It's not hardcoded — it's fully configurable, and the Super Admin owns it."

**What I Should Show:**

- Super Admin → Geo Management page
- Show the hierarchy: State → District → Taluk → Hobli
- Expand Karnataka → show all districts
- Expand a District → show its Taluks
- Expand a Taluk → show its Hoblis
- Show the "Add New Hobli" action
- Show how adding a new entry immediately makes it available in temple search dropdowns

**Key Points:**

- Four-level hierarchy: State, District, Taluk, Hobli
- Any level can be added, edited, or deactivated
- Changes propagate immediately — no cache flush needed
- This is the data backbone that enables all geo-hierarchy search functionality
- Templates Authority cannot modify geo data — read-only reference for them

**Demo Flow:**

1. Open Geo Management page
2. Navigate down the hierarchy
3. Show an existing Taluk's Hobli list
4. Show "Add Hobli" form
5. Show how the new entry appears in the search dropdown

**Important UI Areas:**

- Tree/hierarchy view of geo data
- Add/Edit/Deactivate actions at each level
- Breadcrumb navigation through the hierarchy

**Transition Line:**

"Let me now show you one of the most powerful governance tools in the system — Temple Governance controls."

---

## Feature 20 — Temple Governance Controls (Super Admin)

---

**What I Should Say:**

"The Super Admin has the ability to take governance actions on any temple — anywhere in Karnataka — through the Temple Governance module.

If a temple is found to be non-compliant or has serious issues, the Super Admin can:

**Suspend** a temple — it becomes inactive for administrative purposes. Temple Authority can still log in but cannot submit new data.

**Freeze** a temple — a more severe action, typically during investigation.

**Reactivate** — restore a suspended or frozen temple to active status.

**Archive** — for temples that have permanently ceased operations. Archived temples are preserved in the system for historical reference but cannot be interacted with.

Every governance action requires a mandatory reason. Every action is logged. And critically — the Temple Authority cannot create a new Temple Authority user account for an archived temple."

**What I Should Show:**

- Super Admin → Temple Governance page (or temple profile with governance options)
- Show the governance status indicator on a temple profile
- Show the "Suspend" action with the mandatory reason dialog
- Show the "Freeze" action
- Show the "Reactivate" action
- Show the "Archive" action with a warning that this is irreversible
- Show the governance action history for a temple

**Key Points:**

- Four governance states: Active, Suspended, Frozen, Archived
- All actions require mandatory reasons
- All actions are audit-logged
- Archived is the permanent end-state — no reactivation possible
- Governance actions affect what the Temple Authority can do in the portal

**Demo Flow:**

1. Open Temple Governance page
2. Show a temple with Active status
3. Click Suspend → enter reason → confirm
4. Show temple status changing to Suspended
5. Show governance action in the temple's history
6. Click Reactivate → restore to Active

**Important UI Areas:**

- Governance status badge on temple profile
- Suspend / Freeze / Reactivate / Archive action buttons
- Mandatory reason dialog with confirmation
- Governance history timeline on the temple profile
- Warning dialog for irreversible Archive action

**Transition Line:**

"Finally, let me tie everything together and show you the complete end-to-end submission workflow from start to finish."

---

## Feature 21 — End-to-End Submission Workflow

---

**What I Should Say:**

"Let me walk you through the complete lifecycle one more time — from a Temple Authority starting their annual declaration, to the District Collector approving it, to the acknowledgement being issued.

This is the core of what this platform does. Everything else supports this workflow.

Step one: The Temple Authority logs in, goes to their dashboard, and clicks 'Start New Declaration' for this financial year.

Step two: They fill out the declaration form — every immovable and movable asset is documented.

Step three: They upload supporting documents — land documents, valuations, photographs.

Step four: They click 'Submit for Review.' The declaration is locked. An in-app notification fires to the District Collector.

Step five: The DC logs in, sees the pending declaration in their dashboard, opens it, reviews every entry and every attached document.

Step six: The DC is satisfied. They click 'Approve,' enter their official remarks, and confirm.

Step seven: The system automatically generates an official digital acknowledgement with a unique acknowledgement number and the DC's name.

Step eight: The Temple Authority receives a notification — 'Your declaration has been approved.' They go to their Downloads section and download the official acknowledgement PDF.

Step nine: Every step of this process — the submission, the review, the approval, the notification, the download — is recorded in the immutable audit log.

That's the complete loop. Start to finish. No paper. No physical visits. No lost documents. Full accountability, from every direction."

**What I Should Show:**

- Start with TA dashboard → declaration not started
- Show each step live: create → fill → upload → submit
- Switch to DC → notification received → open → review → approve
- Show acknowledgement number generated
- Switch to TA → notification received → download acknowledgement
- Open the acknowledgement PDF
- Show the audit log entries for all these steps

**Demo Flow:**

1. TA login → Dashboard → Start Declaration
2. Fill form → Upload document → Submit
3. DC login → Notification bell lit → Open pending declaration
4. DC → Approve with remarks
5. System → Acknowledgement generated
6. TA → Notification → Downloads → Download acknowledgement PDF
7. Super Admin → Audit log → Show all 8 events in sequence

---

## Feature 22 — Staging → Workflow → Main Architecture

---

**What I Should Say:**

"Let me take one minute to explain the architecture principle that makes all of this trustworthy.

Every piece of data in this platform — temple profiles, declarations, trust updates — follows the same rule: nothing goes directly into the official record.

It goes into a staging area first. In staging, it's tagged as DRAFT. The Temple Authority can edit it as many times as they like. It does not affect any official record.

When they submit, it moves into the workflow. It enters PENDING_REVIEW status. Now it's visible to the DC, but the official record hasn't changed yet.

Only when the DC explicitly approves it does the data move into the main, official record. At that point, the previous version is marked as SUPERSEDED and preserved for history.

This three-stage architecture — Staging → Workflow → Main — means the official record is always clean, always approved, and always traceable.

It's the governance guarantee of this entire platform."

**What I Should Show:**

- Show a simple visual or explain with the UI
- Point to the staging status (DRAFT) vs. the approved profile
- Show the version history — current APPROVED, previous SUPERSEDED
- Show how a new draft doesn't overwrite the approved record
- Show the version numbering system

**Key Points:**

- DRAFT → SUBMITTED (staging) → PENDING_REVIEW (workflow) → APPROVED (main)
- At any point in the process, the last approved version is still the official record
- Superseded versions are preserved — full version history
- REJECTED state: Temple Authority can create a new version and start again
- This architecture prevents accidental overwrites and ensures every change is intentional

---

---

# SECTION 4 — FINAL PLATFORM BENEFITS

---

## Closing Narration

*Stand in front of the full dashboard. Summarize the complete platform.*

---

**What I Should Say:**

"Let me close with what this platform actually means for the people who use it.

For the **District Collector** — they no longer wait days for files. They log in, search, and have the complete picture of every temple in their district in seconds. They can approve declarations, track compliance, and generate official reports — all from their desk.

For the **Temple Authority** — they no longer travel to the district office for every submission. They log in, fill their forms, submit digitally, and get an official digital acknowledgement. If the DC has questions, they answer them online. No more lost paperwork.

For the **HR&CE Department** — they have a real-time dashboard of compliance across all districts in Karnataka. They can see where there are problems, where there are delays, and take action immediately.

For **Auditors and Oversight Bodies** — every action, every approval, every change is in the immutable audit log. Audit queries that used to take weeks now take seconds.

And for the temples themselves — for the first time, their complete history, their assets, their trust records, their staff — all of it is preserved digitally, permanently, and securely.

This platform digitizes 30,000 temples. It brings transparency to temple governance. And it gives the District Collector the tools they need to do their job effectively.

This is the Temple Registry and Management Portal. Thank you."

---

**Final Key Points to Cover:**

- 30,000+ temples — the scale of the governance problem solved
- End-to-end digitization: no paper, no physical visits
- Role-based access control: right people see the right data
- Complete audit trail: every action permanently recorded
- Workflow-based approvals: nothing unofficial enters the system
- Real-time notifications: no missed deadlines
- Export and reporting: official government-grade documents in one click
- Security: AES-256-GCM encryption, masked sensitive data, httpOnly JWT cookies
- Scalability: built on Spring Boot + React — enterprise-grade stack
- Production-ready: 535 backend tests, live on port 8080

---

---

# APPENDIX — QUICK REFERENCE CHEAT SHEET

---

## Status Badges (Color Reference)

| Status | Color | Meaning |
|--------|-------|---------|
| DRAFT / In Progress | Blue | Saved, not submitted |
| SUBMITTED / Pending Review | Yellow | Under DC review |
| CLARIFICATION REQUIRED | Orange | DC asked a question |
| VERIFICATION PENDING | Purple | Flagged for physical inspection |
| APPROVED | Green | Officially approved |
| REJECTED | Red | Requires correction |
| OVERDUE | Dark Red | Deadline missed |
| SUPERSEDED | Grey | Replaced by newer version |

---

## Role Permissions Summary

| Action | Super Admin | DC | DC Staff | Temple Authority |
|--------|-------------|-----|----------|------------------|
| View all temples | ✅ All | ✅ Own district | ✅ Own district | ✅ Own temple only |
| Edit temple data | ✅ | ❌ | ❌ | ✅ Own temple |
| Submit declaration | ❌ | ❌ | ❌ | ✅ |
| Approve declaration | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ | ❌ |
| Export reports | ✅ | ✅ | ✅ (limited) | ✅ (own data) |
| Configure system | ✅ | ❌ | ❌ | ❌ |

---

## Workflow States

```
Temple Profile:      DRAFT → PENDING_REVIEW → APPROVED
                                           ↘ REJECTED → (new DRAFT)
                     APPROVED → SUPERSEDED (on new approval)

Asset Declaration:   DRAFT → PENDING_REVIEW → APPROVED (terminal)
                                           ↘ CLARIFICATION_REQUESTED → PENDING_REVIEW
                                           ↘ PHYSICAL_VERIFICATION → APPROVED / REJECTED
                                           ↘ REJECTED → (new version DRAFT)
```

---

## Key Module List (for navigation during demo)

1. Login Screen
2. DC Dashboard → KPI Cards, Activity Feed, Grade Distribution
3. DC Temple Search → Geo Filters, Grade Filters, Pending/Overdue Filters
4. Temple Profile → Overview, Contact, Heritage, Bank Details, Photograph
5. DC Profile Review → Side-by-side comparison, Approve / Reject
6. TA Dashboard → Profile Status, Declaration Status, Quick Stats
7. TA Profile Edit → Form, Save Draft, Submit for Review
8. Trust Tab → Registration Details, Board Members, Meeting Minutes
9. Employees Tab → List, Status Badges, Add Employee
10. Contractors Tab → List, Contract Value, Document Download
11. Declaration Form → Immovable Assets, Movable Assets, Upload, Submit
12. DC Declaration Review → Full Detail, Approve / Clarify / Verify / Reject
13. Acknowledgement → Download PDF with acknowledgement number
14. Notifications → Bell icon, Dropdown, Mark as Read
15. Audit Log → Data Events, Auth Events, Filter, Detail View
16. Analytics → Compliance Rate, Grade Chart, Trend
17. Export → PDF Report, CSV Export
18. User Management → Create User, Role Assignment, Activate/Deactivate
19. Geo Management → Hierarchy Tree, Add/Edit Entries
20. Temple Governance → Suspend / Freeze / Archive actions
21. Super Admin Dashboard → Statewide KPIs, District Comparison
22. Notification Rules → Enable/Disable, Templates

---

*End of Demo Script — Temple Registry & Management Portal*
*Version 1.0 — Generated for Live Product Walkthrough*
