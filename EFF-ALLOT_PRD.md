# Product Requirements Document

## EFF-ALLOT — Efficient Allotment
**Intelligent Emergency Healthcare Coordination & Hospital Resource Allocation Platform**

| | |
|---|---|
| **Document status** | Draft v1.0 |
| **Build target** | Google Antigravity (agentic dev platform) |
| **Prototype scope** | Hackathon-ready demo, production-extensible |

---

## 1. Problem Statement

In a medical emergency, the hardest problem isn't finding an ambulance — it's knowing **where the ambulance should go**. Hospitals that are geographically closest often can't take the patient: no ICU bed, no ventilator, no specialist on shift, or the road route is actually slower due to traffic. Today this gets solved by phone calls, guesswork, and driver instinct — under time pressure that costs lives.

EFF-ALLOT removes the guesswork. It connects **Patient → Ambulance → Hospital → Resources → Control Room** into one real-time, decision-driven system.

---

## 2. Vision & Goals

> **EFF-ALLOT ensures a patient reaches the right hospital, with the right resources, by the right route, at the right time.**

**Primary goal:** minimize avoidable delay between emergency detection and appropriate treatment, by automating three decisions that are currently manual and slow:

1. Which hospital can actually treat this patient right now?
2. Which route gets the ambulance there fastest — not just nearest?
3. Who has authority to unlock reserved emergency capacity when normal capacity runs out?

---

## 3. Users

| Role | Who they are | What they need from the system |
|---|---|---|
| **Caller / Patient** | Person reporting the emergency, or a user self-requesting via the portal | Fast, low-friction way to get help moving; visibility into status |
| **Attender (Ambulance Crew)** | EMT/driver riding the ambulance | The case, the patient's condition, the best hospital, and the fastest live route — with zero decision-making friction |
| **Hospital Staff** | ER/ICU desk at a partner hospital | Advance warning of an incoming critical patient and what to prepare |
| **Control Room / Admin** | Authorized emergency dispatcher | Full visibility across all active cases, ambulances, hospital capacity, and the power to unlock Government Reserved ICU beds |

---

## 4. Scope

**In scope for the prototype:**
- Case creation via emergency call intake (control-room entered) and self-service portal request
- Single Case ID as the source of truth across all four dashboards
- Mandatory ambulance dispatch (no accept/reject — acknowledge-only, with fault-triggered reassignment)
- Hospital ranking via TOPSIS (capability, availability, ETA, reliability, load)
- Traffic-aware routing via A* (time-cost, not distance-cost)
- Government Reserved ICU: 2 beds per hospital, control-room-only allocation
- Live map (best hospital + route) visible to driver, attender, and control room simultaneously
- Real-time propagation of any case update across all subscribed dashboards
- Escalation path when no hospital/resource is available

**Out of scope for the prototype** (noted as future work):
- Payment/billing integration
- Multi-city/multi-region dispatch federation
- Full EHR/medical records integration
- Insurance verification

---

## 5. Core Concepts

**Case ID** — every emergency is one record (e.g. `LF-1025`) created the moment a call/complaint or portal request comes in. Every actor — control room, attender, hospital — reads and writes to this one record. Nothing exists outside a Case ID.

**Government Reserved ICU** — each hospital sets aside 2 ICU beds (prototype default; configurable in production) that only the Control Room/Admin can allocate, kept visually and logically separate from normal hospital inventory.

**TOPSIS** — ranks candidate hospitals by weighted criteria (capability match, live resource availability, ETA, reliability, current load) to answer *"where should this patient go?"*

**A\*** — computes the actual route cost in **time**, not distance, to answer *"how does the ambulance get there fastest?"* Example the system must handle correctly: a 10 km route at 20 minutes beats a 5 km route at 30 minutes because of traffic — EFF-ALLOT always optimizes for time.

---

## 6. Functional Requirements

### 6.1 Case Intake
- FR-1: Control room can open a new Case ID from an incoming call, entering location, patient condition, and severity.
- FR-2: A caller can self-request via the portal; a Case ID is generated immediately and the ambulance is dispatched **before** the intake form is fully completed — the form enriches the case in parallel, it never blocks dispatch.
- FR-3: Severity is classified (Critical / High / Moderate / Low) to drive resource requirements.

### 6.2 Ambulance Dispatch
- FR-4: The nearest suitable ambulance is **auto-assigned** to a Case ID — there is no accept/reject step.
- FR-5: The assigned attender must acknowledge receipt (confirms visibility, does not approve/deny).
- FR-6: The only exit from an assignment is a declared fault (breakdown, already engaged, crew unavailable), which immediately triggers reassignment to the next-best ambulance.

### 6.3 Hospital Matching (TOPSIS)
- FR-7: System filters hospitals by hard capability requirements (ICU, ventilator, specialist, trauma team).
- FR-8: Remaining hospitals are scored and ranked using TOPSIS with configurable weights.
- FR-9: If the top-ranked hospital rejects or loses the required resource before arrival, the system re-ranks automatically and reassigns.

### 6.4 Government Reserved ICU
- FR-10: Each hospital tracks 2 Government Reserved ICU beds separately from normal ICU inventory, each with its own state (Available / Reserved / Occupied).
- FR-11: Only Control Room/Admin can move a Government bed from Available → Reserved.
- FR-12: Every state change on a Government bed is written to an audit log (who, when, for which Case ID).

### 6.5 Map & Routing
- FR-13: Driver, attender, and control room all see the same live map: candidate hospital(s), route(s), and live ETA per route — computed via traffic-weighted A*.
- FR-14: The recommended hospital/route is visually flagged with a one-line reason (e.g. "10 min faster despite longer distance").
- FR-15: ETA recalculates on a fixed interval (15–30s) from live traffic; the system does not flip its recommendation for ETA gaps under a defined threshold, to avoid visible "flip-flopping" mid-transit.

### 6.6 Real-Time Sync
- FR-16: Every dashboard that touches a Case ID subscribes to that case's live channel; any field update (hospital selected, ETA, resource reserved, severity change) broadcasts to all subscribers instantly.

### 6.7 Dashboards
- FR-17: **Patient/User** — submit request, view case status, view ambulance ETA.
- FR-18: **Ambulance (Attender)** — view assigned case, patient condition, live map with recommended hospital/route, update case en route.
- FR-19: **Hospital** — view incoming case details and ETA, update own resource/bed status, accept/reject at the resource level (hospital-level rejection remains valid — a hospital can genuinely lack capacity; this is distinct from ambulance dispatch, which is mandatory).
- FR-20: **Control Room/Admin** — full case list, live ambulance/hospital map, Government ICU allocation controls, escalation queue, hospital ranking view, analytics.

### 6.8 Escalation
- FR-21: If no hospital (including Government Reserve) can take the case, or an ambulance is critically delayed, the system raises an escalation to Control Room for manual intervention rather than failing silently.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Real-time performance** | Case updates must propagate to all subscribed dashboards in under 2 seconds |
| **Reliability** | No single point of failure in Case ID lookup; reservation actions must be atomic (no double-booking a bed) |
| **Access control** | Government Reserved ICU actions restricted to authenticated Control Room/Admin role only |
| **Auditability** | All Government ICU and hospital-reassignment actions are logged with timestamp and actor |
| **Availability** | Prototype should tolerate a hospital or ambulance going offline without crashing active case tracking |
| **Accessibility** | Control room and hospital dashboards usable for long shifts — legible at a glance, high contrast for the map/status view |

---

## 8. UX/UI Design Direction — "Humanized, Not AI-Generated"

This is a stated requirement, not a nice-to-have: the interface must not read as generic AI-tool output. Concretely, that means avoiding the three patterns that currently make any UI look AI-generated by default:

- **Avoid:** warm cream background + high-contrast serif + terracotta/clay accent (the "default AI look").
- **Avoid:** near-black background with a single acid-green or vermilion accent glow.
- **Avoid:** broadsheet/hairline-rule minimalism used just because it looks "clean," with no connection to the subject matter.

Instead, ground the design in what this product actually is: **emergency medical infrastructure**, used by people under time pressure, not a consumer app.

**Direction to follow:**
- **Palette**: draw from real emergency/medical signal color — the reds, ambers, and clinical whites/blues that already carry meaning in this domain (triage colors, hospital signage), not decorative gradients. Use color functionally: a color always means the same status everywhere (e.g. red = occupied, never used decoratively elsewhere).
- **Typography**: a clear, high-legibility workhorse typeface for data-dense dashboards (control room, hospital) — this is read under stress, not browsed casually. Reserve any personality/display type for the patient-facing portal only, where warmth and reassurance matter more than density.
- **Tone per dashboard, not one tone for all four**: the patient portal should feel calm and reassuring; the attender's in-motion map view should be stripped to only what's needed at a glance (large touch targets, minimal text, no decorative motion); the control room should feel like a command center — dense, precise, built for scanning many cases at once; the hospital view should feel procedural and calm, like existing hospital admin software staff already trust.
- **Case ID as a real, tactile element** — treat the Case ID like an actual dispatch tag (the way real EMS systems display run numbers), not a generic app ID field.
- **Motion**: use it only where it carries real information — a bed's status changing color, an ETA ticking down, a route redrawing when traffic changes. No ambient animation, no decorative transitions. In a life-critical tool, unnecessary motion reads as noise, not polish — and it's also one of the biggest tells of AI-generated design.
- **Copy**: plain, active-voice, and specific — "Reserve Government ICU," not "Allocate Resource." Failure/empty states explain exactly what happened and what to do next, in the system's voice, without apology.
- **The map screen (driver + control room)** is the signature element of this product. It should not look like a generic maps API embed — the recommended-route callout ("10 min faster despite longer distance") is the single moment of personality the whole interface is allowed; keep everything else around it quiet.

---

## 9. Technical Approach for Building in Google Antigravity

Google Antigravity is agent-first: instead of hand-coding every file, work at the task level and let agents plan → execute → verify, reviewing Artifacts (plans, diffs, screenshots, browser recordings) rather than raw code line-by-line.

**Suggested task breakdown (each as a separate Antigravity agent task):**

1. **Case Service** — Case ID schema, creation, and update endpoints; the single source of truth all other services read/write to.
2. **Realtime Layer** — Socket-based case rooms; one room per Case ID; any write to the Case Service broadcasts to subscribers.
3. **Dispatch Engine** — auto-assignment of nearest ambulance, acknowledge-only flow, fault-triggered reassignment.
4. **Matching Engine (TOPSIS)** — hospital filtering + scoring service.
5. **Routing Engine (A\*)** — traffic-weighted route/ETA computation, exposed to both driver and control-room map views.
6. **Government Reserve Engine** — bed-level state machine, role-gated actions, audit log.
7. **Four Dashboards** (Patient, Attender, Hospital, Control Room) — each a separate agent task, all consuming the same Case Service/Realtime Layer APIs, each following the tone/design direction in Section 8.
8. **Escalation & Analytics** — escalation queue, reliability scoring, case-completion metrics.

For each task, use Antigravity's Plan Artifact before execution (review the plan, not just the final diff), and use its browser-in-the-loop verification to confirm the map/dashboard actually renders and updates live before accepting the task as done.

---

## 10. Data Model (Summary)

```
CASE
 ├─ case_id, status, severity, timestamps
 ├─ patient { location, condition, requirements }
 ├─ ambulance_id
 ├─ hospital_id
 ├─ reserved_bed_id (normal or government)
 └─ history[] (append-only event log)

AMBULANCE
 ├─ ambulance_id, status, location, equipment, crew

HOSPITAL
 ├─ hospital_id, location, capabilities, reliability_score
 ├─ icu_normal { total, available }
 └─ icu_government[] (bed_id, status, reserved_for_case_id)

GOVERNMENT_RESERVATION (audit)
 ├─ bed_id, case_id, reserved_by, reserved_at, status_history[]
```

---

## 11. Success Metrics

- Time from case creation to hospital confirmation
- Time from ambulance assignment to acknowledgment
- % of cases where the system's recommended hospital differed from "nearest" — demonstrates the core value proposition
- % of Government Reserve allocations with complete audit trail
- Dashboard update latency (case change → all subscribers updated)

---

## 12. Risks & Assumptions

| Risk | Mitigation |
|---|---|
| Live traffic data unavailable/rate-limited in prototype | Simulate traffic multipliers per route for demo scenarios |
| Two hospitals with near-identical ETA cause visible flip-flopping | Apply a minimum ETA-gap threshold before switching recommendation |
| Government bed double-booking under concurrent requests | Reservation writes must be atomic/locking at the bed-record level |
| UI defaults to generic "AI tool" look under time pressure to ship | Section 8 direction is treated as a hard requirement, reviewed before demo, not an afterthought |

---

## 13. One-Line Pitch

**EFF-ALLOT (Efficient Allotment)** — the right patient, the right hospital, the right route, the right resource, at the right time.
