# Complete E2E Coverage Matrix

## Scope

This matrix maps high-risk workflows to Playwright suites and highlights residual gaps.

## Role Coverage

| Role | Auth Contract | Permission Contract | Workflow Actions | Read Paths |
|---|---|---|---|---|
| SUPER_ADMIN | `auth-permissions.api.spec.ts` | Create temple auth boundary | Indirect via governance permissions | Profile and admin-access smoke via existing suites |
| DISTRICT_COLLECTOR | `auth-permissions.api.spec.ts` | DC-only governance checks | Approve / clarify / reject / under-review | Timeline and declaration review flows |
| TEMPLE_AUTHORITY | `auth-permissions.api.spec.ts` | TA blocked from DC actions | Declaration + trust submit/respond/resubmit | Notifications and own timeline |
| AUDITOR | Existing UI login/filter suites | Read-only route behavior | No write path allowed | Directory and audit-facing reads |
| VIEWER | Role login via env profile (`auth/me`) | Read-only boundary (non-write) | No workflow write action | Dashboard/read routes via existing UI suites |

## Workflow Status Transition Coverage

### Declaration

| Transition | Covered By |
|---|---|
| `DRAFT -> SUBMITTED` | `declaration-lifecycle.api.spec.ts` |
| `SUBMITTED -> CLARIFICATION_REQUESTED` | `declaration-lifecycle.api.spec.ts` |
| `CLARIFICATION_REQUESTED -> CLARIFICATION_RESPONDED` | `declaration-lifecycle.api.spec.ts` |
| `CLARIFICATION_RESPONDED -> APPROVED` | `declaration-lifecycle.api.spec.ts` |
| `SUBMITTED -> REJECTED` | `declaration-lifecycle.api.spec.ts` |
| `REJECTED -> (update allowed)` | `declaration-lifecycle.api.spec.ts` |
| `REJECTED -> RESUBMIT (new version)` | `declaration-lifecycle.api.spec.ts` |
| Invalid: withdraw from `UNDER_REVIEW` | `declaration-lifecycle.api.spec.ts` |
| Idempotent replay (approve) | `declaration-lifecycle.api.spec.ts` |

### Trust

| Transition | Covered By |
|---|---|
| `DRAFT/CLARIFICATION_REQUESTED/UPDATED_AFTER_APPROVAL -> SUBMITTED/RESUBMITTED` | `trust-governance.api.spec.ts` (adaptive status progression) |
| `APPROVED/RE_APPROVED -> UPDATED_AFTER_APPROVAL` on TA edit | `trust-governance.api.spec.ts` |
| `RESUBMITTED -> RE_APPROVED` via `REJECT_EDIT` path | `trust-governance.api.spec.ts` |
| Governance status rejection reason projection | `trust-governance.api.spec.ts` |

## Validation and Guardrails

| Rule | Covered By |
|---|---|
| Duplicate declaration per temple/year blocked | `validation-and-transitions.api.spec.ts` |
| Declaration update blocked after submit | `validation-and-transitions.api.spec.ts` |
| Clarification message min-length validation | `validation-and-transitions.api.spec.ts` |
| Trust financial future FY blocked | `validation-and-transitions.api.spec.ts` |
| Trust financial duplicate year blocked | `trust-governance.api.spec.ts` |
| Board-member Aadhaar uniqueness | `trust-governance.api.spec.ts` |

## Notification and Timeline

| Concern | Covered By |
|---|---|
| Notification created after declaration approval | `timeline-notification.api.spec.ts` |
| Mark single notification read | `timeline-notification.api.spec.ts` |
| Timeline includes declaration approved event | `timeline-notification.api.spec.ts` |
| TA blocked from non-owned temple timeline | `timeline-notification.api.spec.ts` |
| Timeline page-size clamp (max 50) | `timeline-notification.api.spec.ts` |

## UI/POM Coverage

| Area | Suite |
|---|---|
| Login and logout | `auth.spec.ts` |
| Temple directory saved filters and chip behavior | `temple-directory-saved-filters.spec.ts` |
| Existing declaration/trust end-to-end UI/API hybrid flows | `declaration-workflow.spec.ts`, `trust-workflow.spec.ts` |

## Residual Gaps (Tracked)

1. Document upload/download + access control matrix is not fully exhaustive across all roles and file types.
2. Temple profile staging workflow transitions (`DRAFT/SUBMITTED/APPROVED/REJECTED`) need dedicated full-suite parity similar to declaration and trust.
3. Contractor and employee module governance transition tests are still mostly indirect through existing suites.
4. Cross-browser matrix currently runs Chromium only; Firefox/WebKit can be added once environment stability is confirmed.
5. Production read-only profile smoke-tagging exists at config level but dedicated read-only tag filters should be added for strict production gating.
