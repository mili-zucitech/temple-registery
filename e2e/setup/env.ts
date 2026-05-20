import 'dotenv/config';

export type E2ETarget = 'local' | 'dev' | 'staging' | 'production';
export type RoleKey = 'SA' | 'DC' | 'DC_STAFF' | 'TA' | 'AUDITOR' | 'VIEWER';

export interface RoleCredentials {
  username: string;
  password: string;
}

export interface E2EDatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface E2EEnvironment {
  target: E2ETarget;
  readOnly: boolean;
  baseURL: string;
  apiOrigin: string;
  apiV1Base: string;
  db: E2EDatabaseConfig;
  roles: Record<RoleKey, RoleCredentials>;
}

function toTarget(value: string | undefined): E2ETarget {
  const normalized = (value ?? 'local').trim().toLowerCase();
  if (normalized === 'local' || normalized === 'dev' || normalized === 'staging' || normalized === 'production') {
    return normalized;
  }
  return 'local';
}

function normalizeOrigin(value: string | undefined, fallback: string): string {
  const base = (value ?? fallback).trim();
  return base.replace(/\/+$/, '');
}

function normalizeApiV1Base(value: string | undefined, fallbackOrigin: string): string {
  const raw = normalizeOrigin(value, `${fallbackOrigin}/api/v1`);
  if (raw.endsWith('/api/v1')) {
    return raw;
  }
  if (raw.endsWith('/api')) {
    return `${raw}/v1`;
  }
  return `${raw}/api/v1`;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
}

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function resolveRole(role: RoleKey, fallbackUsername: string): RoleCredentials {
  const prefix = `E2E_${role}`;
  return {
    username: process.env[`${prefix}_USERNAME`] ?? fallbackUsername,
    password: process.env[`${prefix}_PASSWORD`] ?? 'password123',
  };
}

export function loadE2EEnvironment(): E2EEnvironment {
  const target = toTarget(process.env.E2E_TARGET);
  const baseURL = normalizeOrigin(process.env.E2E_BASE_URL, 'http://localhost:3000');
  const apiOrigin = normalizeOrigin(process.env.E2E_API_ORIGIN, process.env.API_BASE_URL ?? 'http://localhost:8080');
  const apiV1Base = normalizeApiV1Base(process.env.E2E_API_V1_BASE, apiOrigin);
  const readOnly = parseBoolean(process.env.E2E_READ_ONLY, target === 'production');

  return {
    target,
    readOnly,
    baseURL,
    apiOrigin,
    apiV1Base,
    db: {
      host: process.env.DB_HOST ?? 'localhost',
      port: parsePort(process.env.DB_PORT, 3306),
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'temple_registry',
    },
    roles: {
      SA: resolveRole('SA', 'super_admin'),
      DC: resolveRole('DC', 'dc_mysuru'),
      DC_STAFF: resolveRole('DC_STAFF', 'dc_staff_mysuru'),
      TA: resolveRole('TA', 'ta_chamundi'),
      AUDITOR: resolveRole('AUDITOR', 'auditor_dev'),
      VIEWER: resolveRole('VIEWER', 'viewer_state'),
    },
  };
}

export const env = loadE2EEnvironment();
