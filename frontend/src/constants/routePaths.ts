export const ROUTE_PATHS = {
  // Auth
  LOGIN: '/login',
  MFA_VERIFY: '/mfa-verify',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  UNAUTHORIZED: '/403',

  // DC / DC Staff
  DC_DASHBOARD: '/dc/dashboard',
  DC_TEMPLES: '/dc/temples',
  DC_TEMPLE_DETAIL: '/dc/temples/:templeId',
  DC_DECLARATIONS: '/dc/declarations',
  DC_DECLARATION_DETAIL: '/dc/declarations/:id',
  DC_EXPORT: '/dc/export',

  // Temple Authority
  TA_DASHBOARD: '/ta/dashboard',
  TA_TEMPLE: '/ta/temple',
  TA_TEMPLE_EDIT: '/ta/temple/edit',
  TA_TEMPLE_REVIEW: '/ta/temple/review',
  TA_TRUST: '/ta/trust',
  TA_EMPLOYEES: '/ta/employees',
  TA_EMPLOYEE_DETAIL: '/ta/employees/:id',
  TA_CONTRACTORS: '/ta/contractors',
  TA_CONTRACTOR_NEW: '/ta/contractors/new',
  TA_CONTRACTOR_EDIT: '/ta/contractors/edit/:id',
  TA_CONTRACTOR_DETAIL: '/ta/contractors/:id',
  TA_DECLARATIONS: '/ta/declarations',
  TA_DECLARATION_NEW: '/ta/declarations/new',
  TA_DECLARATION_DETAIL: '/ta/declarations/:id',
  TA_DOCUMENTS: '/ta/documents',
  TA_PROFILE_STATUS: '/ta/profile-status',
  TA_ACTIVITY: '/ta/activity',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_GEO: '/admin/geo',
  ADMIN_TOOLS: '/admin/tools',

  // Auditor
  AUDITOR_DASHBOARD: '/auditor/dashboard',
  AUDITOR_TEMPLES: '/auditor/temples',
  AUDITOR_TEMPLE_DETAIL: '/auditor/temples/:templeId',
  AUDITOR_DECLARATIONS: '/auditor/declarations',
  AUDITOR_DECLARATION_DETAIL: '/auditor/declarations/:id',
} as const
