export const API_BASE = import.meta.env.VITE_API_BASE_URL

export const API_PATHS = {
  AUTH: {
    LOGIN: '/auth/login',
    MFA_VERIFY: '/auth/mfa-verify',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PASSWORD_RESET_REQUEST: '/auth/password-reset-req',
    PASSWORD_RESET_CONFIRM: '/auth/password-reset',
    AADHAAR_OTP_REQUEST: '/auth/aadhaar-otp-req',
    AADHAAR_OTP_VERIFY: '/auth/aadhaar-otp-verify',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  GEO: {
    STATES: '/geo/states',
    CITIES: (stateId: number) => `/geo/states/${stateId}/cities`,
    DISTRICTS: (cityId: number) => `/geo/cities/${cityId}/districts`,
    TALUKS: (districtId: number) => `/geo/districts/${districtId}/taluks`,
    HOBLIS: (talukId: number) => `/geo/taluks/${talukId}/hoblis`,
  },
  TEMPLES: {
    LIST: '/temples',
    DETAIL: (id: number) => `/temples/${id}`,
  },
  NOTIFICATIONS: '/notifications',
} as const
