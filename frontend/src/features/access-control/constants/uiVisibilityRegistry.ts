import type { TargetType } from '../accessControlApi'
import { TARGET_KEYS } from './targetKeys'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VisibilityItem {
  key: string
  targetType: TargetType
  label: string
  description: string
}

export interface VisibilitySection {
  id: string
  title: string
  items: VisibilityItem[]
}

export interface RoleVisibilityConfig {
  roleLabel: string
  sections: VisibilitySection[]
}

// ─── Role configurations ──────────────────────────────────────────────────────

const DC_CONFIG: RoleVisibilityConfig = {
  roleLabel: 'District Collector',
  sections: [
    {
      id: 'sidebar',
      title: 'Sidebar Navigation',
      items: [
        { key: TARGET_KEYS.PAGE_DC_DASHBOARD,  targetType: 'PAGE', label: 'Dashboard',         description: 'Main overview with district stats and quick actions' },
        { key: TARGET_KEYS.PAGE_DC_EXPORT,     targetType: 'PAGE', label: 'Export',             description: 'Download temple data as reports' },
        { key: TARGET_KEYS.PAGE_DC_ACTIVITY,   targetType: 'PAGE', label: 'Activity',           description: 'Recent activity feed for the district' },
      ],
    },
    {
      id: 'kpi',
      title: 'Dashboard KPI Cards',
      items: [
        { key: TARGET_KEYS.KPI_DC_TOTAL_TEMPLES,        targetType: 'KPI_CARD', label: 'Total Temples',        description: 'Count of temples under this district' },
        { key: TARGET_KEYS.KPI_DC_PENDING_DECLARATIONS, targetType: 'KPI_CARD', label: 'Pending Declarations', description: 'Declarations awaiting review' },
        { key: TARGET_KEYS.KPI_DC_OVERDUE_DECLARATIONS, targetType: 'KPI_CARD', label: 'Overdue Declarations', description: 'Declarations past their due date' },
        { key: TARGET_KEYS.KPI_DC_PROFILE_REVIEWS,      targetType: 'KPI_CARD', label: 'Profile Reviews',      description: 'Temple profile updates awaiting approval' },
      ],
    },
    {
      id: 'search-filters',
      title: 'Temple Search Filters',
      items: [
        { key: TARGET_KEYS.SECTION_DC_SEARCH_DECLARATION_STATUS, targetType: 'SECTION', label: 'Declaration Status',    description: 'Filter temples by declaration workflow status' },
        { key: TARGET_KEYS.SECTION_DC_SEARCH_TRUST_REGISTERED,   targetType: 'SECTION', label: 'Trust Registration',    description: 'Filter temples by trust registration status' },
        { key: TARGET_KEYS.SECTION_DC_SEARCH_SAVED_FILTERS,      targetType: 'SECTION', label: 'Saved Filter Presets',  description: 'Quick-access preset buttons (No Declaration, Pending Verification, High Risk)' },
        { key: TARGET_KEYS.SECTION_DC_SEARCH_CARD_STATUS,         targetType: 'SECTION', label: 'Card Declaration Badge', description: 'Declaration status badge shown on each temple card' },
        { key: TARGET_KEYS.SECTION_DC_SEARCH_CARD_TRUST,          targetType: 'SECTION', label: 'Card Trust Badge',       description: 'Trust registration badge shown on each temple card' },
      ],
    },
    {
      id: 'tabs',
      title: 'Temple Profile Tabs',
      items: [
        { key: TARGET_KEYS.TAB_DC_TEMPLE_OVERVIEW,        targetType: 'TAB', label: 'Overview',        description: 'Basic info and location details' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_DECLARATIONS,    targetType: 'TAB', label: 'Declarations',    description: 'Annual financial declarations' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_TRUST,           targetType: 'TAB', label: 'Trust & Board',   description: 'Trust members and governance details' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_STAFF,           targetType: 'TAB', label: 'Staff',           description: 'Temple employees and roles' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_CONTRACTORS,     targetType: 'TAB', label: 'Contractors',     description: 'External contractors and vendors' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_DOCUMENTS,       targetType: 'TAB', label: 'Documents',       description: 'Uploaded files and certificates' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_TIMELINE,        targetType: 'TAB', label: 'Timeline',        description: 'History of changes and events' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_PROFILE_HISTORY, targetType: 'TAB', label: 'Profile History', description: 'Previous profile submission records' },
      ],
    },
  ],
}

const DC_STAFF_CONFIG: RoleVisibilityConfig = {
  roleLabel: 'DC Staff',
  sections: DC_CONFIG.sections,
}

const TA_CONFIG: RoleVisibilityConfig = {
  roleLabel: 'Temple Authority',
  sections: [
    {
      id: 'sidebar',
      title: 'Sidebar Navigation',
      items: [
        { key: TARGET_KEYS.PAGE_TA_DASHBOARD,      targetType: 'PAGE', label: 'Dashboard',      description: 'Temple overview and compliance status' },
        { key: TARGET_KEYS.PAGE_TA_TEMPLE_SEARCH,  targetType: 'PAGE', label: 'Temple Search',   description: 'Browse all registered temples district-wide' },
        { key: TARGET_KEYS.PAGE_TA_TRUST,          targetType: 'PAGE', label: 'Trust & Board',   description: 'Manage trust members and governance' },
        { key: TARGET_KEYS.PAGE_TA_EMPLOYEES,      targetType: 'PAGE', label: 'Employees',       description: 'Manage temple staff records' },
        { key: TARGET_KEYS.PAGE_TA_CONTRACTORS,    targetType: 'PAGE', label: 'Contractors',     description: 'Manage vendor and contractor records' },
        { key: TARGET_KEYS.PAGE_TA_DOCUMENTS,      targetType: 'PAGE', label: 'Documents',       description: 'Upload and manage temple documents' },
        { key: TARGET_KEYS.PAGE_TA_DECLARATIONS,   targetType: 'PAGE', label: 'Declarations',    description: 'Submit and track annual declarations' },
      ],
    },
    {
      id: 'search-kpi',
      title: 'Temple Search KPI Cards',
      items: [
        { key: TARGET_KEYS.KPI_TA_SEARCH_TOTAL_TEMPLES,   targetType: 'KPI_CARD', label: 'Total Temples',   description: 'Total registered temples in the district' },
        { key: TARGET_KEYS.KPI_TA_SEARCH_OVERDUE,         targetType: 'KPI_CARD', label: 'Overdue',         description: 'Declarations past their due date' },
        { key: TARGET_KEYS.KPI_TA_SEARCH_PENDING,         targetType: 'KPI_CARD', label: 'Pending Review',  description: 'Declarations awaiting DC review' },
        { key: TARGET_KEYS.KPI_TA_SEARCH_PROFILE_REVIEWS, targetType: 'KPI_CARD', label: 'Profile Reviews', description: 'Temple profile updates awaiting approval' },
      ],
    },
    {
      id: 'search-filters',
      title: 'Temple Search Filters',
      items: [
        { key: TARGET_KEYS.SECTION_TA_SEARCH_DECLARATION_STATUS, targetType: 'SECTION', label: 'Declaration Status',    description: 'Filter temples by declaration workflow status' },
        { key: TARGET_KEYS.SECTION_TA_SEARCH_TRUST_REGISTERED,   targetType: 'SECTION', label: 'Trust Registration',    description: 'Filter temples by trust registration status' },
        { key: TARGET_KEYS.SECTION_TA_SEARCH_SAVED_FILTERS,      targetType: 'SECTION', label: 'Saved Filter Presets',  description: 'Quick-access preset buttons (No Declaration, Pending Verification, High Risk)' },
        { key: TARGET_KEYS.SECTION_TA_SEARCH_CARD_STATUS,         targetType: 'SECTION', label: 'Card Declaration Badge', description: 'Declaration status badge shown on each temple card' },
        { key: TARGET_KEYS.SECTION_TA_SEARCH_CARD_TRUST,          targetType: 'SECTION', label: 'Card Trust Badge',       description: 'Trust registration badge shown on each temple card' },
      ],
    },
    {
      id: 'own-tabs',
      title: 'Own Temple Profile Tabs',
      items: [
        { key: TARGET_KEYS.TAB_TA_TEMPLE_OVERVIEW,  targetType: 'TAB', label: 'Overview',  description: 'Basic temple information' },
        { key: TARGET_KEYS.TAB_TA_TEMPLE_HISTORY,   targetType: 'TAB', label: 'History',   description: 'Previous submission records' },
        { key: TARGET_KEYS.TAB_TA_TEMPLE_TIMELINE,  targetType: 'TAB', label: 'Timeline',  description: 'Chronological event log' },
      ],
    },
    {
      id: 'district-tabs',
      title: 'District Temple Profile Tabs',
      items: [
        { key: TARGET_KEYS.TAB_DC_TEMPLE_OVERVIEW,     targetType: 'TAB', label: 'Overview',     description: 'Basic info and location details' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_DECLARATIONS, targetType: 'TAB', label: 'Declarations', description: 'Annual financial declarations' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_TRUST,        targetType: 'TAB', label: 'Trust & Board', description: 'Trust members and governance details' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_STAFF,        targetType: 'TAB', label: 'Staff',        description: 'Temple employees and roles' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_CONTRACTORS,  targetType: 'TAB', label: 'Contractors',  description: 'External contractors and vendors' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_DOCUMENTS,    targetType: 'TAB', label: 'Documents',    description: 'Uploaded files and certificates' },
        { key: TARGET_KEYS.TAB_DC_TEMPLE_TIMELINE,     targetType: 'TAB', label: 'Timeline',     description: 'History of changes and events' },
      ],
    },
  ],
}

const AUDITOR_CONFIG: RoleVisibilityConfig = {
  roleLabel: 'Auditor',
  sections: [
    {
      id: 'sidebar',
      title: 'Sidebar Navigation',
      items: [
        { key: TARGET_KEYS.PAGE_AUDITOR_DASHBOARD,     targetType: 'PAGE', label: 'Dashboard',     description: 'Auditor overview and key metrics' },
        { key: TARGET_KEYS.PAGE_AUDITOR_OBSERVATIONS,  targetType: 'PAGE', label: 'Observations',  description: 'Log and track audit observations' },
        { key: TARGET_KEYS.PAGE_AUDITOR_COMPLIANCE,    targetType: 'PAGE', label: 'Compliance',    description: 'Compliance status reports' },
        { key: TARGET_KEYS.PAGE_AUDITOR_AUDIT_TRAIL,   targetType: 'PAGE', label: 'Audit Trail',   description: 'Full system audit log' },
      ],
    },
    {
      id: 'kpi',
      title: 'Dashboard KPI Cards',
      items: [
        { key: TARGET_KEYS.KPI_AUDITOR_OPEN_OBSERVATIONS,    targetType: 'KPI_CARD', label: 'Open Observations',    description: 'Active unresolved observations' },
        { key: TARGET_KEYS.KPI_AUDITOR_COMPLIANCE_ANOMALIES, targetType: 'KPI_CARD', label: 'Compliance Anomalies', description: 'Temples with compliance issues' },
        { key: TARGET_KEYS.KPI_AUDITOR_OVERDUE_DECLARATIONS, targetType: 'KPI_CARD', label: 'Overdue Declarations', description: 'Declarations past their due date' },
        { key: TARGET_KEYS.KPI_AUDITOR_ASSIGNED_REVIEWS,     targetType: 'KPI_CARD', label: 'Assigned Reviews',     description: 'Reviews currently assigned to this auditor' },
      ],
    },
  ],
}

const VIEWER_CONFIG: RoleVisibilityConfig = {
  roleLabel: 'Viewer',
  sections: [
    {
      id: 'sidebar',
      title: 'Sidebar Navigation',
      items: [
        { key: TARGET_KEYS.PAGE_VIEWER_DASHBOARD, targetType: 'PAGE', label: 'Dashboard', description: 'Read-only statewide overview' },
        { key: TARGET_KEYS.PAGE_VIEWER_EXPORT,    targetType: 'PAGE', label: 'Export',    description: 'Download statewide reports' },
      ],
    },
    {
      id: 'kpi',
      title: 'Dashboard KPI Cards',
      items: [
        { key: TARGET_KEYS.KPI_VIEWER_COMPLIANCE_ANOMALIES, targetType: 'KPI_CARD', label: 'Compliance Anomalies', description: 'Temples with compliance issues' },
        { key: TARGET_KEYS.KPI_VIEWER_OVERDUE_DECLARATIONS, targetType: 'KPI_CARD', label: 'Overdue Declarations', description: 'Declarations past their due date' },
        { key: TARGET_KEYS.KPI_VIEWER_OPEN_OBSERVATIONS,    targetType: 'KPI_CARD', label: 'Open Observations',    description: 'Active unresolved observations' },
        { key: TARGET_KEYS.KPI_VIEWER_ASSIGNED_REVIEWS,     targetType: 'KPI_CARD', label: 'Assigned Reviews',     description: 'Reviews currently assigned' },
      ],
    },
  ],
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const UI_VISIBILITY_REGISTRY: Record<string, RoleVisibilityConfig> = {
  DISTRICT_COLLECTOR: DC_CONFIG,
  DC_STAFF:           DC_STAFF_CONFIG,
  TEMPLE_AUTHORITY:   TA_CONFIG,
  AUDITOR:            AUDITOR_CONFIG,
  VIEWER:             VIEWER_CONFIG,
}

export const REGISTRY_ROLE_TABS = [
  { role: 'DISTRICT_COLLECTOR', label: 'District Collector' },
  { role: 'DC_STAFF',           label: 'DC Staff' },
  { role: 'TEMPLE_AUTHORITY',   label: 'Temple Authority' },
  { role: 'AUDITOR',            label: 'Auditor' },
  { role: 'VIEWER',             label: 'Viewer' },
]
