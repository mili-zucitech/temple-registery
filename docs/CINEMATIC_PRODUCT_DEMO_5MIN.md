# TEMPLE REGISTRY & MANAGEMENT PORTAL
## CINEMATIC 5-MINUTE PRODUCT DEMO — COMPLETE PRODUCTION PACKAGE

> **Format:** Apple-launch-grade SaaS commercial · Government digital transformation film
> **Runtime:** 5:00 (300 seconds) · **Aspect:** 16:9 4K · **Frame Rate:** 24fps cinematic
> **Brand Palette:** `#E69419` Amber-Saffron · `#1A1A2E` Deep Navy · `#FFFFFF` Pure White · `#0EA5A0` Trust Teal
> **Tagline:** *"Karnataka's Temples. Reimagined for the Digital Age."*

---

## 1. PROJECT UNDERSTANDING

### 1.1 What the platform does
The **Temple Registry & Management Portal** is a state-grade governance platform that digitizes the end-to-end administration of Karnataka's 30,000+ temples under the Hindu Religious & Charitable Endowments (HR&CE) Act. It unifies temple registration, trust governance, asset declarations, staffing records, contractor management, geo-hierarchical discovery, and approval workflows into a single, auditable, role-based system.

### 1.2 The Business Problem
- Temple data sits in **paper ledgers, siloed spreadsheets, and disconnected departmental systems**.
- District Collectors (DCs) cannot get a **single source of truth** for the temples in their jurisdiction.
- Asset declarations, trust filings, and staff records are **untraceable, delayed, and audit-unfriendly**.
- Citizens, auditors, and the state lack **transparency** into how religious endowments are managed.
- Approvals move through **manual files** — losing weeks per cycle and breaking accountability chains.

### 1.3 Who Uses It
| Role | Purpose |
|---|---|
| **District Collector (DC)** | Search, inspect, and approve temple data in their district |
| **DC Office Staff** | Triage submissions, export reports, correspond with temples |
| **Temple Authority / Trustee** | Submit & maintain temple profile, trust, staff, contractors, assets |
| **Super Admin (HR&CE Dept.)** | Manage masters, grades, geo-hierarchy, users, system config |
| **Auditors / State Govt.** | Read-only compliance & disclosure access |

### 1.4 Operational Workflows
1. **Geo-Hierarchical Discovery** — State → City → District → Taluk → Hobli, with Grade A/B/C filters.
2. **Temple Lifecycle** — Registration → Profile build → Trust setup → Staff/Contractor onboarding → Continuous asset declaration → Audit.
3. **Submission Lifecycle (every entity)** — `DRAFT → SUBMITTED → APPROVED → REJECTED`, governed by a state-machine.
4. **Staging → Workflow → Main** — Every user mutation lands in a staging table, passes through DC approval, only then writes to the canonical temple record.

### 1.5 Governance & Approval Hierarchy
- **Temple Authority submits** → lands in **DC Staging Queue**.
- **DC / DC Staff reviews** → can Approve, Reject (immutable), or Query.
- **Approved data** flows into the **canonical Main Table** with full audit trail (who, when, what, why).
- **Notifications** fire on every state change — to the temple, the DC, and audit log subscribers.
- **Super Admin** retains override and configuration authority across districts.

### 1.6 Platform Value Proposition
- **One Source of Truth** for every temple in Karnataka.
- **Audit-grade transparency** with immutable rejection trails and full state-history.
- **DC dashboard** that surfaces pending approvals, overdue declarations, district analytics.
- **Role-based security** — JWT in httpOnly cookies, deny-by-default `@PreAuthorize` enforcement.
- **Enterprise architecture** — Spring Boot 3, JPA, Flyway, MapStruct, React 18, RTK Query, Shadcn UI.
- **Scalable to 30,000+ temples**, designed for nationwide replication.

### 1.7 Why It Matters
This is not just a portal — it is the **digital constitution** for how Karnataka governs its sacred infrastructure. It restores trust, accelerates decisions, and creates a permanent, queryable record of a 1,500-year-old administrative tradition.

---

## 2. VIDEO CREATIVE DIRECTION

| Element | Direction |
|---|---|
| **Video Title** | *"Temple Registry — Karnataka's Sacred Infrastructure, Reimagined"* |
| **Opening Hook** | Drone shot of a 12th-century stone temple at dawn → camera pulls back through a ledger of paper records dissolving into a glowing digital dashboard. |
| **Visual Direction** | Heritage-meets-hi-tech. Saffron + Navy palette. Warm temple-lamp glow against cool product-UI cyan. |
| **Cinematic Direction** | Anamorphic 2.39:1 letterbox during emotional beats; full-frame 16:9 during UI showcases. Shallow depth of field on the character; deep focus on product. |
| **Emotional Tone** | Reverent → Curious → Confident → Inspired. |
| **Pacing Strategy** | Slow-burn open (0:00–0:25), accelerating UI sequences (0:25–4:00), cinematic resolution (4:00–5:00). Average shot length drops from 5s to 1.8s mid-video, then expands again. |
| **Transition Style** | Liquid morphs between UI panels, light-leak wipes between act breaks, dolly-zoom on revelation moments. |
| **Camera Style** | Floating Steadicam around the presenter; precision dolly-ins on UI; orbital drone for hero shots. |
| **Motion Graphics Style** | Glassmorphic UI overlays, particle data-flows along Karnataka map, animated workflow chevrons. |
| **Lighting Style** | Soft key + warm rim (saffron) on the presenter; cool fill on UI scenes. Volumetric god-rays at act breaks. |
| **Animation Style** | Smooth easing (ease-out-quart), 60fps UI motion, never stiff or robotic. |
| **Editing Style** | J-cuts and L-cuts for narration continuity; match-on-action between presenter gestures and UI animation. |
| **Music Direction** | Indo-orchestral hybrid — tanpura drone + cinematic strings + modern synth pulse. Builds in three acts. |

---

## 3. MAIN CHARACTER DESIGN — "ANANYA"

> **One presenter. All five minutes. Never disappears.**

### 3.1 Character Bible
| Attribute | Specification |
|---|---|
| **Name** | Ananya Rao |
| **Age** | 30 |
| **Gender** | Female |
| **Ethnicity** | South Indian (Karnataka), realistic — not stylized |
| **Skin tone** | Warm medium-brown |
| **Hair** | Dark brown, shoulder-length, half-tied back, soft natural waves |
| **Eyes** | Deep brown, alert, warm |
| **Face** | Symmetrical, soft jawline, subtle smile lines, no heavy makeup |
| **Outfit** | Tailored saffron-trimmed navy blazer over crisp ivory silk blouse; charcoal trousers; minimalist gold stud earrings; thin steel-strap watch on left wrist |
| **Build** | 5'6", slender, upright posture |
| **Personality** | Intelligent, calm authority, warm but precise — a senior product strategist who briefs ministers |
| **Speaking style** | Measured, articulate Indian-English with gentle warmth; mid-pitch; clear consonants |
| **Movement style** | Smooth, deliberate, never fidgety; weight shifts between feet during pauses |
| **Gesture style** | Open palms when explaining trust, index-finger emphasis on numbers, two-hand frame when introducing dashboards |
| **Posture** | Tall, shoulders relaxed back, chin level |
| **Expressions** | Soft smile at rest, focused micro-frown when explaining problems, eyes-light-up when revealing solutions |
| **Body language** | Confident-collaborative — turns 15° toward the UI when presenting it, returns to camera when speaking to the viewer |

### 3.2 Consistency Notes (CRITICAL)
- Same outfit, hair, lighting key for every shot.
- Identical facial geometry across all AI generations — lock seed/identity reference.
- Always lit from camera-left, warm rim from camera-right-rear.
- Voice pitch and cadence consistent — same TTS voice profile across all narration.
- Never cuts away to a sceneless UI — Ananya is always at least in-frame as a translucent overlay, picture-in-picture corner, or full presenter.

### 3.3 AI Image Generation Prompt (master)
```
Cinematic photoreal portrait of Ananya Rao — 30-year-old South Indian
woman, warm medium-brown skin, shoulder-length dark brown wavy hair half
tied back, deep brown eyes, soft confident smile, tailored navy blazer
with thin saffron trim, ivory silk blouse, gold stud earrings, steel
watch. Standing in a modern glass-walled government innovation lab, soft
warm key light camera-left, cool teal rim light camera-right-rear, shallow
depth of field, 85mm portrait lens, 8K, ARRI Alexa color science, Apple-
keynote aesthetic, premium SaaS commercial, hyper-realistic skin texture,
neutral expression, looking directly at camera.
```

### 3.4 Cinematic Character Prompt (for Veo / Sora / Kling)
```
Photoreal animated presenter "Ananya Rao", 30, South Indian woman, navy
blazer with saffron trim, ivory blouse, shoulder-length wavy brown hair,
standing confidently in a softly-lit modern command center. She gestures
naturally with open palms while explaining, turns 15 degrees to her left
to reference a floating holographic dashboard, then turns back to camera.
Lip-sync to provided narration. Smooth Steadicam slow push-in. Warm key
light, cool rim light, anamorphic bokeh, 24fps cinematic motion blur, no
stutter, no jitter, consistent identity across all clips.
```

### 3.5 AI Video Consistency Prompt (paste into every shot)
```
SAME CHARACTER as reference frame. Identical face, identical hair,
identical outfit (navy blazer with saffron trim + ivory blouse +
gold studs), identical lighting (warm key left, cool rim right-rear).
Maintain facial geometry, eye color, skin tone, body proportions.
Lip-sync only — no other face morphing. Steadicam motion only — no
teleporting or scene jumps.
```

### 3.6 Tool Compatibility
- **Veo 3 / Sora** — full body + lip-sync, use master prompt as system reference.
- **Kling 1.6 / Runway Gen-4** — image-to-video with locked reference frame.
- **Pika 2.0** — short presenter beats, character reference image required.
- **HeyGen / Synthesia** — clone Ananya's voice + face once, reuse for all narration takes.

---

## 4. COMPLETE 5-MINUTE TIMESTAMP SCRIPT

> **Structure:** Act I Hook (0:00–0:30) · Act II Problem (0:30–1:00) · Act III Platform Reveal (1:00–1:45) · Act IV Feature Tour (1:45–4:00) · Act V Governance Power (4:00–4:30) · Act VI CTA (4:30–5:00)

---

### SCENE 1 — `0:00 – 0:15` · COLD OPEN: HERITAGE
- **Scene Objective:** Establish reverence and scale of the problem.
- **Narration (Ananya, VO over visuals):** *"For over a thousand years, Karnataka's temples have stood as guardians of faith, art, and community."*
- **Character Dialogue:** Voiceover only — Ananya not yet on screen.
- **Character Actions:** N/A (VO).
- **Facial Expressions:** N/A.
- **Camera Angles:** Aerial wide → low-angle hero.
- **Camera Motion:** Slow drone orbit around a gopuram at golden-hour; ends on a 24mm push-in through temple doorway.
- **Background Environment:** Hampi-style stone temple, mist, golden light.
- **UI / Screenshot:** None.
- **Screenshot Placement:** N/A.
- **UI Highlight:** N/A.
- **Zoom Instructions:** Continuous slow 4% push.
- **Motion Graphics:** Lower-third fades in at 0:08 — *"30,000+ Temples. One Karnataka."* in serif Cinzel font, saffron underline.
- **On-screen Text:** Tagline above.
- **Sound Design:** Tanpura drone, distant temple bell, soft wind.
- **Background Music Mood:** Reverent, suspended.
- **Transition Style:** Light-leak wipe into next scene.
- **Visual Effects:** Lens flare from rising sun; dust particles in light shafts.
- **Editing Notes:** Hold long — let the audience breathe.
- **Emotion Target:** Awe + reverence.

---

### SCENE 2 — `0:15 – 0:30` · THE PROBLEM SURFACES
- **Scene Objective:** Visually reveal the chaos of paper-based governance.
- **Narration:** *"But behind their stone walls lives a paper-bound past — ledgers, files, and fragmented records scattered across districts."*
- **Character Dialogue:** None.
- **Character Actions:** N/A.
- **Facial Expressions:** N/A.
- **Camera Angles:** Top-down god-shot.
- **Camera Motion:** Vertical descent into a vintage wooden table covered in dusty ledgers, manila files, rubber stamps.
- **Background Environment:** Dimly-lit collector's office, warm tungsten lamp.
- **UI / Screenshot:** None.
- **Motion Graphics:** Paper pages flutter; a single page lifts and dissolves into pixels (foreshadow).
- **On-screen Text:** *"Fragmented. Untraceable. Overdue."* (one word per beat, fade-in).
- **Sound Design:** Paper rustles, distant typewriter, ticking clock.
- **Music Mood:** Tense low strings entering.
- **Transition:** Pixel-dissolve forward.
- **Visual Effects:** Particle disintegration of paper into glowing data-motes.
- **Editing Notes:** Match cut: last paper-mote becomes a UI dot in Scene 3.
- **Emotion Target:** Mild discomfort, recognition of problem.

---

### SCENE 3 — `0:30 – 0:50` · ANANYA ENTERS — THE GUIDE
- **Scene Objective:** Introduce the human guide.
- **Narration:** *"I'm Ananya. And this is the platform rewriting how Karnataka governs its sacred infrastructure."*
- **Character Dialogue:** Direct to camera.
- **Character Actions:** Walks into frame from camera-right, stops centre, opens arms in a soft welcoming gesture; behind her, the data-motes from Scene 2 swirl and resolve into a glowing logo.
- **Facial Expressions:** Warm confident smile, eye contact held.
- **Camera Angles:** Eye-level medium shot.
- **Camera Motion:** Slow 3% dolly-in.
- **Background Environment:** Modern glass-walled command center, blurred Karnataka map on rear wall, soft saffron uplighting.
- **UI / Screenshot:** **Platform logo / login splash** (use `Screenshot 2026-05-22 104533.png`).
- **Screenshot Placement:** Floating holographic panel behind Ananya, right shoulder, scaled to 35% of frame height, hold 0:42 – 0:50.
- **UI Highlight:** Soft glow around the logo.
- **Zoom Instructions:** None on UI; presenter dolly only.
- **Motion Graphics:** Logo materializes from particles.
- **On-screen Text:** *"Temple Registry & Management Portal"* fades in below logo.
- **Sound Design:** Brand sting (3-note saffron motif).
- **Music Mood:** Strings resolve to hopeful major chord.
- **Transition:** Camera pivots 30° → reveals dashboard in Scene 4.
- **Visual Effects:** Volumetric god-rays through glass wall.
- **Editing Notes:** L-cut: Ananya's voice continues into Scene 4.
- **Emotion Target:** Curiosity, trust onset.

---

### SCENE 4 — `0:50 – 1:10` · THE DC DASHBOARD HERO REVEAL
- **Scene Objective:** Show the command center for District Collectors.
- **Narration:** *"Every District Collector now has one screen — one source of truth — for every temple in their jurisdiction."*
- **Character Dialogue:** Continues to camera, then turns 15° to indicate dashboard.
- **Character Actions:** Right-hand sweep gesture toward dashboard as it materializes.
- **Facial Expressions:** Engaged, slight head-tilt of approval.
- **Camera Angles:** Wide → push-in to over-the-shoulder of Ananya looking at UI.
- **Camera Motion:** 1.5s dolly + slight crane up.
- **Background Environment:** Command center; dashboard fills the rear wall as a 4K display.
- **UI / Screenshot:** **DC Dashboard** (`Screenshot 2026-05-22 154203.png`).
- **Screenshot Placement:** Full rear-wall display, 0:55 – 1:10.
- **UI Highlight:** Sequential glow on KPI cards — *Total Temples → Pending Approvals → Overdue Declarations → District Coverage*.
- **Zoom Instructions:** After 1:02, virtual camera pushes into the dashboard, becoming full-frame UI at 1:08.
- **Motion Graphics:** Numbers count up from 0 to live values; subtle particle trails on each card.
- **On-screen Text:** *"One Dashboard. Every Temple. Real Time."*
- **Sound Design:** Soft UI chime per KPI card.
- **Music Mood:** Rising hopeful pulse.
- **Transition:** Match-zoom into a single KPI card → Scene 5.
- **Visual Effects:** Glassmorphic blur on inactive cards, sharp focus on highlighted card.
- **Editing Notes:** Cursor never visible — UI animates itself.
- **Emotion Target:** Confidence, clarity.

---

### SCENE 5 — `1:10 – 1:30` · GEO-HIERARCHICAL SEARCH
- **Scene Objective:** Demonstrate State → District → Taluk → Hobli cascade.
- **Narration:** *"From the state capital, drill down — district, taluk, hobli — until you find the exact temple you need. In seconds."*
- **Character Dialogue:** Voice-over while Ananya appears as a picture-in-picture in lower-left at 30% size.
- **Character Actions:** Points right, tracking the dropdown cascade.
- **Facial Expressions:** Focused, eyes following cursor path.
- **Camera Angles:** Full-frame UI with PiP presenter.
- **Camera Motion:** Static on UI; soft float on PiP.
- **Background Environment:** UI takes full frame.
- **UI / Screenshot:** **Temple Search page with cascading dropdowns** (`Screenshot 2026-05-22 154324.png`).
- **Screenshot Placement:** Full frame 1:10 – 1:30.
- **UI Highlight:** Each dropdown highlights in saffron as it opens — State → City → District → Taluk → Hobli.
- **Zoom Instructions:** Subtle 2% slow zoom-in over 20s.
- **Motion Graphics:** Animated cursor moves smoothly between dropdowns; results list populates with a staggered fade-in.
- **On-screen Text:** Bottom-right counter — *"Results: 1 → 47 → 312 → 1,284"* updating with each cascade.
- **Sound Design:** Crisp click per dropdown, soft whoosh on result populate.
- **Music Mood:** Rhythmic pulse, building.
- **Transition:** Side-wipe to grade filter.
- **Visual Effects:** Karnataka map in background subtly highlights the chosen district.
- **Editing Notes:** Time the cascade to land precisely on the rhythm.
- **Emotion Target:** "I can find anything."

---

### SCENE 6 — `1:30 – 1:45` · GRADE FILTER + TEMPLE CARDS
- **Scene Objective:** Show Grade A/B/C filtering and result cards.
- **Narration:** *"Filter by grade. Inspect any temple. Every record — alive, searchable, and instantly available."*
- **Character Dialogue:** PiP, eyes tracking results.
- **Character Actions:** Single emphatic nod when "Grade A" badge glows.
- **Camera Angles:** Full-frame UI.
- **UI / Screenshot:** **Temple list view with grade badges** (`Screenshot 2026-05-22 154428.png`).
- **UI Highlight:** Grade A/B/C toggle pills animate; cards reflow with smooth easing.
- **Zoom Instructions:** Zoom into one Grade A temple card at 1:42, preparing for Scene 7.
- **Motion Graphics:** Badge glow halo on Grade A cards.
- **On-screen Text:** *"Grade A · Grade B · Grade C"*.
- **Sound Design:** Filter-snap click.
- **Music Mood:** Drive continues.
- **Transition:** Card expands into full Temple Profile (Scene 7).
- **Emotion Target:** Precision.

---

### SCENE 7 — `1:45 – 2:10` · TEMPLE PROFILE — THE 360° RECORD
- **Scene Objective:** Showcase complete temple profile with maps & history.
- **Narration:** *"Each temple, a complete 360° record — deity, history, GPS, governance, photographs — all in one place."*
- **Character Dialogue:** Ananya returns to half-frame on left, UI on right.
- **Character Actions:** Two-hand frame gesture as profile opens.
- **Camera Angles:** Split-frame composition.
- **UI / Screenshot:** **Temple Profile detail page** (`Screenshot 2026-05-22 154459.png`).
- **Screenshot Placement:** Right 60% of frame.
- **UI Highlight:** Sequential glow — *Name → Deity → Address → GPS map → Photograph*.
- **Zoom Instructions:** Zoom into embedded Google Map at 2:00, animated pin drop.
- **Motion Graphics:** Animated map pin drop with ripple; photo carousel auto-advances.
- **On-screen Text:** *"Heritage. Documented."*
- **Sound Design:** Map pin "ding"; subtle camera-shutter for photos.
- **Music Mood:** Strings warm and steady.
- **Transition:** Tab-swipe right to Trust module.
- **Emotion Target:** Completeness.

---

### SCENE 8 — `2:10 – 2:35` · TRUST & BOARD GOVERNANCE
- **Scene Objective:** Demonstrate trust registration, board members, meeting records.
- **Narration:** *"Behind every temple stands a trust. Every trustee, every appointment, every meeting — recorded, verifiable, accountable."*
- **Character Dialogue:** Half-frame, gesturing with deliberate authority.
- **Character Actions:** Single index-finger emphasis on "verifiable".
- **UI / Screenshot:** **Trust & Board Members page** (`Screenshot 2026-05-22 154547.png`).
- **UI Highlight:** Trust registration card → Board members table → past vs. current tabs.
- **Zoom Instructions:** Zoom into PAN/registration fields (masked Aadhaar visible).
- **Motion Graphics:** Animated org-chart of trustees rendering node-by-node.
- **On-screen Text:** *"Governance. Documented."*
- **Sound Design:** Soft data-pop per node.
- **Music Mood:** Steady, formal.
- **Transition:** Vertical wipe down to Staff module.
- **Emotion Target:** Accountability.

---

### SCENE 9 — `2:35 – 3:00` · EMPLOYEES & CONTRACTORS
- **Scene Objective:** Show staff and contractor management.
- **Narration:** *"From archakas to administrators, from masons to maintenance contractors — every role, every contract, fully tracked."*
- **Character Dialogue:** Ananya returns to centre presenter mode briefly at 2:48.
- **Character Actions:** Wide arm-sweep at 2:50 to indicate scale.
- **UI / Screenshot:** **Employee module list** (`Screenshot 2026-05-22 154615.png`) → **Contractor list** (`Screenshot 2026-05-22 155843.png`).
- **Screenshot Placement:** Split-screen at 2:45, then full-frame contractor view 2:50 – 3:00.
- **UI Highlight:** Status pills (Active / On Leave / Retired); contract value column glow.
- **Zoom Instructions:** Zoom into a contract PDF preview at 2:57.
- **Motion Graphics:** Animated timeline of contract period bar.
- **On-screen Text:** *"People. Policies. Proof."*
- **Sound Design:** Page-flip whoosh between split screens.
- **Music Mood:** Energetic mid-tempo.
- **Transition:** Liquid morph into Asset Declaration.
- **Emotion Target:** Operational rigor.

---

### SCENE 10 — `3:00 – 3:25` · ASSET DECLARATION WORKFLOW
- **Scene Objective:** The hero module — declaration of movable + immovable assets with DC approval.
- **Narration:** *"And the moment that matters most — asset declaration. Land, gold, idols, vehicles — submitted by the temple, reviewed by the District Collector, locked into an audit-grade record."*
- **Character Dialogue:** Deliberate, slower cadence on "audit-grade record".
- **Character Actions:** Open palms transitioning into a firm closing fist on "locked".
- **UI / Screenshot:** **Asset Declaration form** (`Screenshot 2026-05-22 155905.png`) → **Declaration list with status badges** (`Screenshot 2026-05-22 155927.png`).
- **Screenshot Placement:** Form 3:00 – 3:10, list 3:10 – 3:25.
- **UI Highlight:** Status pill animates `DRAFT → SUBMITTED → APPROVED` with chevron motion.
- **Zoom Instructions:** Zoom into status pill morphing through states.
- **Motion Graphics:** Vault-lock icon clicks shut on "locked"; chevron workflow arrows.
- **On-screen Text:** *"DRAFT → SUBMITTED → APPROVED"* (animates with status pill).
- **Sound Design:** Vault-lock thud at 3:23.
- **Music Mood:** Tension build → resolution.
- **Transition:** Camera pulls back to reveal DC's approval inbox (Scene 11).
- **Emotion Target:** Trust + finality.

---

### SCENE 11 — `3:25 – 3:50` · DC APPROVAL QUEUE — STAGING → MAIN
- **Scene Objective:** Show staging → workflow → main architecture in motion.
- **Narration:** *"Nothing is written to the canonical record until the District Collector approves it. Staging. Workflow. Main. One unbreakable chain."*
- **Character Dialogue:** Authoritative, segmented delivery.
- **Character Actions:** Three sequential hand-chops on "Staging. Workflow. Main."
- **UI / Screenshot:** **DC Approval Queue** (`Screenshot 2026-05-22 160727.png`) → **Approval detail with diff view** (`Screenshot 2026-05-22 160741.png`).
- **Screenshot Placement:** Queue 3:25 – 3:35, detail 3:35 – 3:50.
- **UI Highlight:** "Approve" button glows green; "Reject" pulses red but stays inactive (showing immutability).
- **Zoom Instructions:** Zoom into the field-level diff (old vs new values).
- **Motion Graphics:** Animated pipeline diagram — Staging cylinder → Workflow gears → Main vault.
- **On-screen Text:** *"Staging · Workflow · Main"* — three pillars graphic.
- **Sound Design:** Mechanical gear engages on "workflow"; safe-door close on "main".
- **Music Mood:** Powerful, deliberate.
- **Transition:** Pipeline diagram explodes into Notification scene.
- **Emotion Target:** Architectural confidence.

---

### SCENE 12 — `3:50 – 4:10` · NOTIFICATIONS & AUDIT TRAIL
- **Scene Objective:** Real-time notifications and immutable audit log.
- **Narration:** *"Every action — notified. Every change — logged. Every decision — traceable. Forever."*
- **Character Dialogue:** Ananya in PiP, four words four beats.
- **Character Actions:** Counts four fingers on "notified · logged · traceable · forever".
- **UI / Screenshot:** **Notification panel** (`Screenshot 2026-05-22 160808.png`) → **Audit log timeline** (`Screenshot 2026-05-22 160828.png`).
- **Screenshot Placement:** Notification slide-in from top-right at 3:50, audit log full-frame at 4:00.
- **UI Highlight:** Notification bell ringing animation; audit log entries cascading with timestamps.
- **Zoom Instructions:** Zoom into an audit entry showing user, action, before/after.
- **Motion Graphics:** Notification bell shake + badge counter increment.
- **On-screen Text:** *"Notified · Logged · Traceable · Forever"*.
- **Sound Design:** Soft bell chime per notification.
- **Music Mood:** Hopeful crescendo beginning.
- **Transition:** Audit timeline scrolls upward → analytics charts.
- **Emotion Target:** Transparency.

---

### SCENE 13 — `4:10 – 4:30` · ANALYTICS, REPORTS, EXPORTS
- **Scene Objective:** Showcase district-level analytics and export power.
- **Narration:** *"For the District Collector — analytics that turn governance into insight. Exportable. Shareable. Audit-ready."*
- **Character Dialogue:** PiP, energetic.
- **Character Actions:** Single celebratory nod when charts animate.
- **UI / Screenshot:** **Analytics dashboard with bar/pie charts** (`Screenshot 2026-05-22 160903.png`) → **Export to PDF/Excel modal** (`Screenshot 2026-05-22 160923.png`).
- **Screenshot Placement:** Analytics full frame 4:10 – 4:22, export modal pops at 4:22 – 4:30.
- **UI Highlight:** Charts animate from zero; download button glows.
- **Zoom Instructions:** Quick zoom-out for full district map heat-overlay.
- **Motion Graphics:** Karnataka map with heatmap of temple density.
- **On-screen Text:** *"Insight. Delivered."*
- **Sound Design:** Chart-render swoosh; gentle ding on export.
- **Music Mood:** Triumphant build.
- **Transition:** Camera pulls way out — analytics shrinks to a tile in a wall of tiles → Scene 14.
- **Emotion Target:** Power + clarity.

---

### SCENE 14 — `4:30 – 4:45` · THE GRAND MONTAGE
- **Scene Objective:** Rapid 12-shot montage of every module to convey scale.
- **Narration:** *"One platform. Every temple. Every district. Every record. Reimagined."*
- **Character Dialogue:** Powerful, slow, one phrase per montage beat.
- **Character Actions:** Centre-frame again, slight slow-mo turn toward camera.
- **UI / Screenshot:** 12 screenshots in 1.2s each — Login → DC Dashboard → Search → Profile → Trust → Staff → Contractors → Declaration → Approval → Notifications → Audit → Analytics. (Use the chronological screenshot series from `155843` through `162422`.)
- **Screenshot Placement:** Full-frame rapid cuts with match-on-action.
- **UI Highlight:** Saffron flash between each cut.
- **Zoom Instructions:** Each shot enters with a 5% push.
- **Motion Graphics:** Saffron light-leak between cuts; Karnataka map ghost-overlay.
- **On-screen Text:** Single word per shot — *One · Every · Temple · District · Record · Reimagined*.
- **Sound Design:** Rhythmic drum on each cut, building.
- **Music Mood:** Crescendo to peak.
- **Transition:** Final cut whites out into Scene 15.
- **Emotion Target:** Awe + scale.

---

### SCENE 15 — `4:45 – 5:00` · FINAL CTA
- **Scene Objective:** Cinematic close — call to action.
- **Narration:** *"Temple Registry. Karnataka's sacred infrastructure — finally, fully, digital. The future of governance is here."*
- **Character Dialogue:** Full-frame Ananya, eye contact, warm closing smile.
- **Character Actions:** Stands centred, hands clasped at waist, single confident nod on "here".
- **Facial Expressions:** Calm pride, eyes crinkling slightly with smile.
- **Camera Angles:** Eye-level medium → slow push-in to medium-close.
- **Camera Motion:** 4% dolly-in over 12 seconds.
- **Background Environment:** Command center fades to soft saffron gradient with floating Karnataka map silhouette.
- **UI / Screenshot:** Platform logo + tagline lockup; URL + email/QR code.
- **Screenshot Placement:** Below Ananya at 4:55, fade-in over 1.5s.
- **UI Highlight:** Logo glow; QR pulses gently.
- **Motion Graphics:** Saffron particle bloom behind logo.
- **On-screen Text:** *"Temple Registry & Management Portal"* · *"Karnataka HR&CE · Digital Karnataka 2026"* · QR code · `templeregistry.karnataka.gov.in`.
- **Sound Design:** Brand sting (3-note saffron motif) on logo reveal; final temple bell at 4:59.
- **Music Mood:** Reverent triumphant resolution.
- **Transition:** Slow fade to navy with saffron logo single-frame.
- **Visual Effects:** Final freeze-frame on Ananya's smile + logo lockup.
- **Editing Notes:** Hold final logo frame 1.5s before black.
- **Emotion Target:** Inspiration + inevitability.

---

## 5. FULL STORYBOARD TABLE

| # | Timestamp | Narration (excerpt) | Character Action | Screenshot Needed | Animation | Camera Motion | Transition | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | 0:00–0:15 | *"For over a thousand years…"* | Voice-over only | None (temple footage) | Lens flare, dust motes | Drone orbit + push-in | Light-leak wipe | Reverence open |
| 2 | 0:15–0:30 | *"…paper-bound past…"* | VO | None (ledger footage) | Paper → pixel disintegration | Top-down descent | Pixel dissolve | Problem reveal |
| 3 | 0:30–0:50 | *"I'm Ananya…"* | Walks in, opens arms | Login splash | Logo particle materialize | Dolly-in 3% | Pivot 30° | Hero entry |
| 4 | 0:50–1:10 | *"…one source of truth…"* | Sweep gesture | DC Dashboard | KPI count-up, sequential glow | Crane up + push-in | Match-zoom | Hero reveal |
| 5 | 1:10–1:30 | *"…drill down…"* | PiP, points right | Search cascading dropdowns | Cursor animation, results stagger | Static + slow 2% zoom | Side-wipe | Geo cascade |
| 6 | 1:30–1:45 | *"Filter by grade…"* | PiP, nod | Temple list w/ grade pills | Card reflow | Static | Card expand | Grade filter |
| 7 | 1:45–2:10 | *"…360° record…"* | Two-hand frame | Temple Profile + map | Map pin drop ripple | Split-frame | Tab swipe | 360 profile |
| 8 | 2:10–2:35 | *"…trust…verifiable…"* | Index-finger emphasis | Trust & Board page | Org-chart node render | Slight orbit | Vertical wipe | Governance |
| 9 | 2:35–3:00 | *"…archakas to administrators…"* | Wide sweep | Employee + Contractor | Status pills, contract timeline | Split → full | Liquid morph | Staffing |
| 10 | 3:00–3:25 | *"…asset declaration…locked…"* | Open → closing fist | Asset form + status list | Status pill morph chevrons | Push-in then pull | Camera pull-back | Asset workflow |
| 11 | 3:25–3:50 | *"Staging. Workflow. Main."* | Three hand-chops | DC approval queue + diff | Pipeline diagram + gears | Static + diff zoom | Explode pipeline | Architecture |
| 12 | 3:50–4:10 | *"Notified · Logged · Traceable · Forever"* | Four-finger count | Notifications + audit log | Bell shake, cascading entries | Static | Scroll-up | Audit |
| 13 | 4:10–4:30 | *"Insight. Delivered."* | Single nod | Analytics + export modal | Chart animate-in, heatmap | Crane out | Pull-out to montage | Analytics |
| 14 | 4:30–4:45 | *"One platform. Every temple…"* | Slow-mo turn | 12-shot montage | Saffron light-leaks, push-ins | Rapid cuts | Whiteout | Grand montage |
| 15 | 4:45–5:00 | *"…the future is here."* | Calm nod | Logo + QR + URL | Particle bloom, logo glow | Dolly-in 4% | Fade to navy | Final CTA |

---

## 6. COMPLETE SCREENSHOT REQUIREMENTS

> Save all screenshots in `/screenshots/video/` using the naming convention `S<scene#>_<module>_<state>.png` at minimum **1920×1080** (4K preferred).

### Group A — Authentication & Login
| ID | Screenshot | Why | Duration | Focus Area | Animation | Editing |
|---|---|---|---|---|---|---|
| A1 | Login splash with logo | Brand entry, Scene 3 | 8s | Centered logo + tagline | Particle materialize | Fade-in over Ananya |
| A2 | Login form (DC role) | (Optional B-roll) | 2s | Role selector dropdown | Cursor hover | Insert in montage |

### Group B — DC Dashboard
| B1 | Full DC dashboard hero | Scene 4 hero reveal | 20s | KPI cards row | Sequential glow + count-up | Push-in to full frame |
| B2 | KPI close-up: Pending Approvals | Match-zoom into Scene 5 | 3s | One card | Number animate | Match-zoom transition |
| B3 | KPI close-up: Overdue Declarations | Tension beat | 2s | One card | Red pulse | Highlight + glow |

### Group C — Geo-Hierarchy Search
| C1 | Empty search page (State selected) | Scene 5 baseline | 3s | All 5 dropdowns | Default state | Static |
| C2 | District dropdown open | Cascade beat 1 | 3s | District list | Open + highlight | Saffron glow |
| C3 | Taluk dropdown open | Cascade beat 2 | 3s | Taluk list | Open + highlight | Continuation |
| C4 | Hobli dropdown open | Cascade beat 3 | 3s | Hobli list | Open + highlight | Continuation |
| C5 | Final result list populated | Result reveal | 5s | Result count + cards | Staggered fade-in | Lock for grade filter |

### Group D — Temple Profile
| D1 | Temple list with grade badges | Scene 6 | 15s | Grade A/B/C pills | Card reflow | Saffron pill glow |
| D2 | Temple profile detail (top) | Scene 7 | 12s | Name, deity, address | Sequential glow | Split-frame right 60% |
| D3 | Temple profile map embed | Scene 7 climax | 8s | Embedded Google Map | Pin drop ripple | Zoom into map |
| D4 | Temple photo carousel | B-roll | 5s | Photo gallery | Auto-advance | Inset in profile |

### Group E — Trust & Board
| E1 | Trust registration card | Scene 8 | 12s | Trust name, reg no, PAN | Field-by-field glow | Vertical scroll reveal |
| E2 | Board members table | Scene 8 | 10s | Members grid | Org-chart overlay | Node-by-node render |
| E3 | Past vs Current toggle | Detail beat | 3s | Tab switcher | Tab swipe | Smooth tab transition |

### Group F — Staff & Contractors
| F1 | Employee list with status pills | Scene 9 first half | 10s | Status column | Pill animation | Split-screen left |
| F2 | Contractor list with contract values | Scene 9 second half | 10s | Contract value + status | Timeline bar | Full frame |
| F3 | Contract PDF preview modal | Scene 9 climax | 5s | PDF viewer | Modal slide-up | Zoom into doc |

### Group G — Asset Declaration
| G1 | Asset declaration form (movable + immovable tabs) | Scene 10 | 10s | Tab switcher | Tab swipe | Highlight categories |
| G2 | Declaration list with status badges | Scene 10 climax | 15s | Status pills DRAFT/SUBMITTED/APPROVED | Status morph chevron | Pill animation |
| G3 | Declaration detail with attachments | B-roll | 5s | Attached docs | Doc icon row | Inset montage |

### Group H — DC Approval Workflow
| H1 | DC approval queue list | Scene 11 | 10s | Queue table | Row glow | Hero static |
| H2 | Approval detail with field-level diff | Scene 11 climax | 15s | Old vs New columns | Diff highlight | Zoom into diff |
| H3 | Approve button confirm modal | Detail beat | 3s | Confirm dialog | Modal slide | Button glow |
| H4 | Rejection reason form | Architecture proof | 3s | Reason textarea | Inactive (immutability) | Subtle red pulse |

### Group I — Notifications & Audit
| I1 | Notification panel slide-in | Scene 12 first half | 8s | Notification list | Bell shake + slide | Top-right slide-in |
| I2 | Audit log timeline | Scene 12 second half | 12s | Timeline entries | Cascading reveal | Vertical scroll |
| I3 | Audit entry detail (before/after) | Architecture proof | 5s | Diff view | Highlight | Zoom in |

### Group J — Analytics & Reports
| J1 | Analytics dashboard | Scene 13 first half | 12s | Bar + pie charts | Charts animate from 0 | Full frame |
| J2 | Karnataka map heatmap | Scene 13 climax | 6s | Heatmap overlay | Heat reveal by district | Map zoom-out |
| J3 | Export modal (PDF/Excel) | Scene 13 end | 6s | Format selector + button | Modal slide-up | Button glow |

### Group K — Admin & Role Management
| K1 | User management list | Montage | 1.2s | User roles column | Static | Montage cut |
| K2 | Master data — Geo hierarchy admin | Montage | 1.2s | Hierarchy tree | Static | Montage cut |
| K3 | Grade configuration screen | Montage | 1.2s | Grade rules | Static | Montage cut |

### Group L — Responsive / Mobile (optional B-roll)
| L1 | Mobile DC dashboard | Versatility proof | 3s | Mobile viewport | Tilt-in animation | Insert in CTA |
| L2 | Tablet temple search | Versatility proof | 3s | Tablet viewport | Slide-in | Insert in CTA |

---

## 7. SCENE-WISE AI VIDEO GENERATION PROMPTS

> Paste each prompt into Veo / Runway / Kling / Pika / Sora. Always attach the locked **Ananya reference image** + consistency prompt from §3.5.

### Prompt — Scene 1 (Cold Open)
```
Cinematic 4K aerial drone shot at golden hour, slowly orbiting a 12th-
century South Indian stone temple gopuram, soft mist rising, warm
saffron sunrise rays, lens flare, dust motes in light shafts, anamorphic
2.39:1, ARRI Alexa color, Apple-launch aesthetic, slow push-in toward
temple doorway, 24fps cinematic motion blur, reverent atmosphere.
```

### Prompt — Scene 2 (Problem)
```
Top-down god-shot of a vintage wooden collector's desk in a dimly lit
office, covered in dusty manila files, leather-bound ledgers, rubber
stamps, ink pots, warm tungsten lamp. Slow vertical camera descent.
Single paper page lifts and disintegrates into glowing golden data
pixels. Anamorphic, tense, cinematic, 4K, photoreal.
```

### Prompt — Scene 3 (Ananya enters)
```
[USE ANANYA REFERENCE]. Ananya Rao walks confidently into frame from
camera right, stops centre, opens both arms in a warm welcoming
gesture, smiles softly at camera. Behind her, glowing data particles
swirl and resolve into a saffron logo. Modern glass-walled command
center, warm saffron uplighting, cool teal rim light. Slow 3% dolly-
in. 24fps cinematic. Lip-sync to narration: "I'm Ananya. And this is
the platform rewriting how Karnataka governs its sacred infrastructure."
```

### Prompt — Scene 4 (Dashboard reveal)
```
[USE ANANYA REFERENCE]. Ananya stands centre frame, sweeps her right
hand toward a massive holographic dashboard materializing on the rear
glass wall. KPI cards glow sequentially in saffron. Camera cranes up
and pushes in over her shoulder. Modern command center, warm + cool
lighting balance, anamorphic bokeh, premium SaaS aesthetic, 4K, 24fps.
```

### Prompt — Scene 5 (Search cascade — UI showcase)
```
Photoreal 4K UI screen recording aesthetic: a Karnataka government
dashboard with five cascading dropdowns (State → City → District →
Taluk → Hobli) opening one by one with smooth easing, saffron glow
highlight per dropdown, animated cursor moving between fields, result
list populating with staggered fade-in. Subtle 2% slow zoom-in over
20 seconds. Glassmorphic panels, Karnataka map ghost in background.
```

### Prompt — Scene 7 (Temple profile + map)
```
Split-frame composition: Ananya on left half gesturing with two open
palms framing the UI, right half shows a temple profile page with
embedded Google Map. Animated map pin drops with a ripple effect on
the temple location. Sequential UI element glow. Warm cinematic
lighting on Ananya, sharp clean UI on right. 4K, 24fps.
```

### Prompt — Scene 10 (Asset declaration workflow)
```
[USE ANANYA REFERENCE]. Ananya stands beside a floating UI showing
an asset declaration form transforming into a list with status pills.
Status pill animates: DRAFT → SUBMITTED → APPROVED with chevron
motion. A vault-lock icon clicks shut on the word "locked". Ananya's
hands transition from open palms to a firm closing fist. Dramatic
warm key + cool rim lighting. Premium enterprise SaaS commercial,
4K, 24fps, anamorphic.
```

### Prompt — Scene 11 (Staging → Workflow → Main)
```
Cinematic data-architecture visualization: three illuminated pillars
labeled "Staging", "Workflow", "Main" connecting through animated
pipeline of glowing saffron particles flowing left-to-right. Mechanical
gears engage on "workflow", a vault door closes on "main". Camera
slowly orbits 15 degrees. Dark navy background, saffron particles,
volumetric lighting, 4K, 24fps, premium architecture diagram aesthetic.
```

### Prompt — Scene 14 (Grand montage)
```
Rapid 12-shot montage at 1.2 seconds per shot, each shot a different
UI screen of the Temple Registry platform, each entering with a 5%
push-in, saffron light-leak flash between cuts, rhythmic drum beat
sync. Karnataka map ghost overlay throughout. Crescendo of motion,
4K, 24fps, premium SaaS commercial editing.
```

### Prompt — Scene 15 (Final CTA)
```
[USE ANANYA REFERENCE]. Ananya stands centre frame, hands clasped at
waist, gives a calm confident nod, warm closing smile, eye contact
with camera. Background fades from command center to soft saffron
gradient with floating Karnataka map silhouette. Logo + tagline + QR
code fade in below her at 4:55. Slow 4% dolly-in over 12 seconds.
Particle bloom behind logo. Reverent triumphant resolution, 4K, 24fps.
```

---

## 8. VOICEOVER DIRECTION

### 8.1 Voice Profile
- **Voice type:** Indian-English female, warm-confident, mid-pitch (~210 Hz fundamental).
- **Suggested AI tools:** ElevenLabs ("Sarayu" or custom-cloned Ananya), HeyGen, Murf "Priya IN".
- **Tone:** Senior consultant briefing the Chief Minister — authoritative without being cold.

### 8.2 Pacing
- **Acts I & II (0:00–1:00):** Slow, reverent. ~125 words/minute. Breath between sentences.
- **Acts III & IV (1:00–4:00):** Building energy. ~145 wpm. Crisp consonants.
- **Act V (4:00–4:45):** Driving, rhythmic. ~155 wpm.
- **Act VI (4:45–5:00):** Slow, deliberate. ~115 wpm. Final phrase with a pause before "here".

### 8.3 Emphasis Words (bold these in TTS)
*thousand years · paper-bound · one screen · one source of truth · drill down · seconds · 360° · trust · verifiable · audit-grade · locked · staging · workflow · main · notified · logged · traceable · forever · insight · One · Every · Reimagined · future · here.*

### 8.4 Pauses (insert SSML `<break>`)
- 0.7s pause before "I'm Ananya." (Scene 3)
- 0.5s pauses between "Staging." "Workflow." "Main." (Scene 11)
- 0.4s pauses between "Notified · Logged · Traceable · Forever" (Scene 12)
- 1.2s pause before final word "here." (Scene 15)

### 8.5 Emotional Delivery Map
| Section | Delivery |
|---|---|
| Heritage open | Hushed, reverent |
| Problem | Slight concern, grounded |
| Ananya entry | Warm, welcoming |
| Feature tour | Confident, energetic |
| Architecture | Authoritative, measured |
| CTA | Inspiring, calm certainty |

### 8.6 SSML Template Snippet
```xml
<speak>
  <prosody rate="92%" pitch="-1st">For over a <emphasis level="strong">thousand years</emphasis>,
  Karnataka's temples have stood as guardians of faith, art, and community.</prosody>
  <break time="800ms"/>
  <prosody rate="98%">But behind their stone walls lives a <emphasis>paper-bound past</emphasis>…</prosody>
</speak>
```

---

## 9. PROFESSIONAL EDITING GUIDE

### 9.1 Pipeline
**Capture → Assemble → Refine → Polish → Master**

1. **Capture** — Record Ananya in HeyGen / Veo per scene. Capture UI screen recordings at 4K60 in OBS with cursor hidden.
2. **Assemble** — Cut to script in DaVinci Resolve / Premiere Pro using the timestamp markers.
3. **Refine** — Add motion graphics in After Effects (UI glow, particle systems, workflow pipeline).
4. **Polish** — Color grade in Resolve (warm saffron LUT for Ananya, cool teal LUT for UI).
5. **Master** — Export 4K H.265 + 1080p H.264 deliverables.

### 9.2 Cinematic Transitions Cheat Sheet
| Transition | When to Use | How |
|---|---|---|
| Light-leak wipe | Act breaks | AE "Optical Flares" plugin, 0.5s |
| Match-zoom | KPI card → next scene | Scale + position match keyframes |
| Liquid morph | Module → module | AE "Liquify" + motion blur |
| Pixel dissolve | Paper → digital (Scene 2) | Particle disintegration plugin |
| L-cut / J-cut | Narration continuity | Offset audio by 0.4–0.8s |

### 9.3 UI Animation Techniques
- **Sequential KPI glow:** stagger 0.2s opacity + outer-glow keyframes.
- **Animated cursor:** custom cursor PNG, bezier motion path, ease-out-quart.
- **Status pill morph:** crossfade between pill states with chevron sweep.
- **Pipeline diagram:** AE "Trapcode Particular" for the saffron particle flow.

### 9.4 Focus & Blur
- Picture-in-picture Ananya: 12px Gaussian blur on background UI.
- Diff-view zoom: keep diff sharp, blur surrounding columns at 8px.
- Montage cuts: 4px directional motion blur in direction of cut.

### 9.5 Screen Replacement
- Record presenter in front of green screen, key out with Primatte.
- Composite UI onto a virtual 4K display behind her using corner-pin tracking.
- Add subtle screen reflection for realism (10% opacity overlay).

### 9.6 Pacing Guidance
- Act I average shot: 5s · Act II: 4s · Act III: 3s · Act IV: 2.2s · Act V (montage): 1.2s · Act VI: 6s.
- Beat sync: cut on every 4th drum hit during montage.

### 9.7 Modern SaaS Editing Techniques
- Subtle camera shake (0.3px) during action moments — adds realism.
- Chromatic aberration (0.5px) during high-emotion beats.
- Film grain overlay at 8% on dark scenes for cinematic texture.
- Letterbox bars (2.39:1) on Scenes 1, 2, 14, 15 for cinematic distinction.

---

## 10. BACKGROUND MUSIC GUIDE

### 10.1 Music Architecture
| Section | Time | Mood | Instrumentation | BPM |
|---|---|---|---|---|
| Heritage Open | 0:00–0:30 | Reverent, suspended | Tanpura drone, temple bells, sparse strings | 60 |
| Problem | 0:15–0:30 | Tense, grounded | Low strings, ticking clock | 70 |
| Ananya Entry | 0:30–0:50 | Hopeful, warm | Cello + harp + soft synth pad | 85 |
| Feature Tour | 0:50–3:50 | Driving, modern | Pulse synth + strings + tabla rhythm | 110→125 |
| Architecture | 3:25–3:50 | Powerful, deliberate | Brass swells + sub-bass | 100 |
| Audit & Analytics | 3:50–4:30 | Triumphant build | Full orchestra + electronic pulse | 130 |
| Montage | 4:30–4:45 | Crescendo peak | Full hybrid orchestra + drums | 140 |
| CTA | 4:45–5:00 | Reverent resolution | Strings resolve to major chord + final bell | 70 |

### 10.2 Recommended Tracks (royalty-free placeholders)
- **Heritage:** "Sacred Origins" — Epidemic Sound
- **Build:** "Aspire" — Musicbed
- **Architecture:** "Foundation" — Artlist
- **Montage:** "Rise of Nations" — Epidemic Sound
- **CTA:** "Eternal" — Musicbed

### 10.3 Custom Score Brief (if commissioning)
> *"Compose a 5-minute Indo-orchestral hybrid score. Open with tanpura drone and temple bells. Introduce western strings at 0:30. Add modern synth pulse and tabla rhythm from 0:50. Build through three energy tiers, peaking with full orchestra + electronic drums at 4:30. Resolve to reverent major-key strings + single temple bell at 4:59. Brand motif: 3-note saffron sting (D — A — F#) — appears at 0:48, 3:23, 4:58."*

### 10.4 Transition Audio (between sections)
- 0:30: Soft "data-shimmer" whoosh.
- 1:10: Page-turn whoosh into UI.
- 3:00: Mechanical clunk for staging.
- 4:30: White-noise riser into montage.
- 4:58: Final temple bell.

---

## 11. FINAL CTA SCENE (DEEP-DIVE)

### Atmosphere
Ananya stands alone in a softly-lit space that is no longer the command center — it is somewhere between a temple antechamber and a futuristic boardroom. The background is a saffron-to-navy gradient with a faint Karnataka silhouette etched in light.

### Beats
| Time | Visual | Audio |
|---|---|---|
| 4:45 | Ananya centred, warm key light intensifies | Music swells to triumphant resolution |
| 4:48 | Slow 4% dolly-in begins | First three notes of brand motif |
| 4:50 | Ananya: *"Temple Registry."* | Single percussive accent |
| 4:53 | Ananya: *"Karnataka's sacred infrastructure — finally, fully, digital."* | Strings sustain |
| 4:57 | Ananya: *"The future of governance is…"* | Music holds |
| 4:59 | Single nod, smile, eye contact: *"…here."* | Final temple bell |
| 5:00 | Freeze-frame on smile + logo lockup + QR code + URL | Music tail-out |

### On-Screen Lockup (5:00 frame)
```
        ┌────────────────────────────────────┐
        │   [Saffron Temple+Pixel Logo]      │
        │  Temple Registry & Management Portal│
        │                                    │
        │   Karnataka HR&CE · Digital 2026   │
        │                                    │
        │  templeregistry.karnataka.gov.in   │
        │              [QR]                  │
        └────────────────────────────────────┘
```

### Emotional Imprint
*"This is the future of temple governance and administration."*

---

## 12. README — VIDEO PRODUCTION TEAM HANDBOOK

```markdown
# Temple Registry — Cinematic 5-Minute Demo · Production README

## 1. Project Understanding (TL;DR)
The Temple Registry & Management Portal digitizes Karnataka's 30,000+ temples
under the HR&CE Act. Users: District Collectors (DCs), DC Staff, Temple
Authorities, Super Admins, Auditors. Core workflow: Staging Table → Workflow
→ Main Table. States: DRAFT → SUBMITTED → APPROVED → REJECTED. Modules:
geo-hierarchy search, temple profile, trust & board, staff & contractors,
asset declaration, DC approval queue, notifications, audit log, analytics.

## 2. Video Style Summary
- Length: 5:00 · 4K · 24fps · 16:9 (2.39:1 letterboxed at act breaks)
- Palette: #E69419 saffron · #1A1A2E navy · #FFFFFF white · #0EA5A0 teal
- Tone: Apple launch × Karnataka heritage × enterprise SaaS commercial
- Presenter: "Ananya Rao" — same character in every scene

## 3. Production Pipeline
Pre-production → Asset capture → AI generation → Edit → Motion graphics →
Color → Sound → Master

## 4. Required Tools
| Stage | Tool |
|---|---|
| Storyboard | Frame.io / Milanote |
| AI video (presenter) | Veo 3 · Sora · Kling 1.6 · HeyGen |
| AI video (B-roll) | Runway Gen-4 · Pika 2.0 |
| Voiceover | ElevenLabs (custom voice clone) |
| Screen capture | OBS Studio (4K60, cursor hidden) |
| NLE | DaVinci Resolve Studio / Premiere Pro |
| Motion graphics | After Effects + Trapcode Particular + Element 3D |
| Color | DaVinci Resolve (custom saffron + teal LUTs) |
| Sound | Adobe Audition / Pro Tools |
| Music | Epidemic Sound · Musicbed · Artlist · (or custom score) |

## 5. AI Tools Recommended (per use case)
- **Presenter generation:** HeyGen with custom Ananya avatar (locked face + voice)
- **Cinematic B-roll:** Veo 3 or Sora for hero shots
- **Image-to-video transitions:** Kling 1.6 or Runway Gen-4
- **Voice cloning:** ElevenLabs Voice Lab (one upload of Ananya reference)

## 6. Scene Workflow (per scene)
1. Read scene spec from CINEMATIC_PRODUCT_DEMO_5MIN.md §4
2. Generate / capture all required assets (presenter clip + UI screens + B-roll)
3. Place on timeline at exact timestamp
4. Apply transitions per storyboard table
5. Add motion graphics and on-screen text
6. Sync to music beats
7. Color grade
8. Render scene preview, review against script, iterate

## 7. Screenshot Organization Structure
/screenshots/video/
  /A_login/
    A1_login_splash.png
    A2_login_form.png
  /B_dashboard/
    B1_dc_dashboard_hero.png
    B2_kpi_pending.png
    ...
  /C_search/
  /D_profile/
  /E_trust/
  /F_staff/
  /G_declaration/
  /H_approval/
  /I_notifications/
  /J_analytics/
  /K_admin/
  /L_responsive/

Naming: S<scene#>_<module>_<state>.png (1920x1080 min, 3840x2160 preferred)

## 8. Voiceover Workflow
1. Clone Ananya voice in ElevenLabs (one 60s reference recording)
2. Paste full script (§4) split per scene into ElevenLabs
3. Apply SSML emphasis + breaks (§8.4–8.6)
4. Export per-scene WAV files (48kHz, 24-bit)
5. Drop into NLE on dedicated VO track
6. Sync presenter lip-sync in HeyGen using these WAVs

## 9. Editing Workflow
1. Lay rough cut against script timecodes
2. Drop in screenshots at scene markers
3. Add motion graphics (After Effects → dynamic link to NLE)
4. Apply transitions per §9.2
5. Add SFX from §10.4
6. Sync music to scene boundaries
7. Color grade (warm Ananya / cool UI)
8. Final master pass

## 10. Rendering Workflow
- Preview renders: 1080p H.264, 12 Mbps
- Final masters:
  - 4K H.265 (HDR10 if available) — 50 Mbps — for showcase
  - 4K H.264 — 80 Mbps — for editing master
  - 1080p H.264 — 16 Mbps — for web distribution
  - Square 1:1 1080p (30s social cut)
  - Vertical 9:16 1080p (60s social cut)

## 11. Asset Checklist
- [ ] Ananya reference image (locked face / outfit)
- [ ] Ananya voice clone profile (ElevenLabs)
- [ ] 15 presenter clips (one per scene)
- [ ] 60+ UI screenshots organized per §6
- [ ] Drone temple footage (Scene 1)
- [ ] Paper ledger footage (Scene 2)
- [ ] Karnataka map vector asset
- [ ] Brand logo (saffron temple+pixel mark)
- [ ] Custom LUTs (saffron-warm + teal-cool)
- [ ] Music tracks per §10.2
- [ ] SFX library (bells, whooshes, clicks)
- [ ] QR code asset for CTA

## 12. Production Tips
- Lock Ananya's reference image FIRST. Never re-generate her face mid-project.
- Capture all UI screenshots at the same time of day (consistent screen brightness).
- Hide cursor during UI capture — animate cursor in post for control.
- Use the same browser zoom (100%) for every screenshot.
- Render all motion graphics with transparent alpha for flexibility.
- Maintain a single shared style guide for fonts (Cinzel headers + Inter body).
- Cut to music beats — never cut against the music.

## 13. Consistency Instructions
- Ananya: identical face, outfit, hair, lighting in EVERY shot.
- Color: warm key on Ananya, cool key on UI — never reversed.
- Font hierarchy: Cinzel for hero text, Inter for UI text, never mixed.
- Motion easing: ease-out-quart for UI, ease-in-out for camera.
- Transitions: never repeat the same transition twice in a row.
- Brand sting (3-note saffron motif): only at 0:48, 3:23, 4:58 — never elsewhere.

## 14. Final Export Recommendations
| Deliverable | Resolution | Codec | Bitrate | Use |
|---|---|---|---|---|
| Showcase Master | 3840×2160 | H.265 (HDR10) | 50 Mbps | Stakeholder screening |
| Web Master | 1920×1080 | H.264 | 16 Mbps | YouTube / Vimeo |
| Social Square | 1080×1080 | H.264 | 12 Mbps | LinkedIn / X |
| Social Vertical | 1080×1920 | H.264 | 12 Mbps | Instagram Reels |
| Archival | 3840×2160 | ProRes 422 HQ | n/a | Long-term archive |

## 15. Sign-Off
Director: ___________  Date: _______
Producer: ___________  Date: _______
Client (HR&CE): ______  Date: _______
```

---

## END OF MASTER PRODUCTION PACKAGE

> **Total runtime:** 5:00 · **Total scenes:** 15 · **Total UI assets required:** ~60 · **Total presenter clips:** 15 · **Estimated production:** Pre-prod 1 week · Asset capture 1 week · AI generation 1 week · Edit + polish 2 weeks.

*This package is production-ready. The team can begin scene-by-scene execution immediately using §4 (script), §5 (storyboard), §6 (screenshot checklist), and §7 (AI prompts) as their working documents.*
