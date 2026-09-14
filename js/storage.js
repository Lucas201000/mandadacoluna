import { LOCAL_STORAGE_TTL_MS, STORAGE_KEY } from './config.js';

function parseStoredAssessment() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function expiresAt(value) {
  const explicitExpiry = Date.parse(value?.localExpiresAt || '');
  if (Number.isFinite(explicitExpiry)) return explicitExpiry;

  const createdAt = Date.parse(value?.createdAt || '');
  return Number.isFinite(createdAt) ? createdAt + LOCAL_STORAGE_TTL_MS : 0;
}

export function loadAssessment() {
  const value = parseStoredAssessment();
  if (!value) return null;

  if (!expiresAt(value) || expiresAt(value) <= Date.now()) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }

  return value;
}

export function saveAssessment(value) {
  const nextExpiry = new Date(Date.now() + LOCAL_STORAGE_TTL_MS).toISOString();
  value.localExpiresAt = nextExpiry;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  return value;
}

export function clearAssessment() {
  localStorage.removeItem(STORAGE_KEY);
}
