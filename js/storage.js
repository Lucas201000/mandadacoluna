import { LOCAL_STORAGE_TTL_MS, PRIVACY_POLICY_VERSION, STORAGE_KEY } from './config.js';

let cleanupTimer = null;

function parseStoredAssessment() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

// O resultado precisa ficar disponível por pouco tempo para retomada e PDF,
// mas dados de contato não são necessários para isso. Esta limpeza também
// remove e-mail/WhatsApp deixados por versões anteriores do formulário.
function withoutContactData(value) {
  const stored = JSON.parse(JSON.stringify(value));

  if (stored?.user) {
    delete stored.user.email;
    delete stored.user.whatsapp;
    delete stored.user.marketingConsent;
  }

  if (stored?.consent) {
    delete stored.consent.reportPrivacyAcknowledgedAt;
    delete stored.consent.reportSensitiveDataConsentAt;
    delete stored.consent.marketingConsentAt;
  }

  return stored;
}

function expiresAt(value) {
  const explicitExpiry = Date.parse(value?.localExpiresAt || '');
  if (Number.isFinite(explicitExpiry)) return explicitExpiry;

  const createdAt = Date.parse(value?.createdAt || '');
  return Number.isFinite(createdAt) ? createdAt + LOCAL_STORAGE_TTL_MS : 0;
}

function scheduleCleanup(expiry) {
  if (cleanupTimer) window.clearTimeout(cleanupTimer);

  const delay = expiry - Date.now();
  if (delay <= 0) {
    clearAssessment();
    return;
  }

  // O prazo atual é de 24 horas, bem abaixo do limite do setTimeout.
  cleanupTimer = window.setTimeout(clearAssessment, delay);
}

export function loadAssessment() {
  const value = parseStoredAssessment();
  if (!value) return null;

  if (!expiresAt(value) || expiresAt(value) <= Date.now()) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }

  // Uma atualização de política exige novo aceite. Assim, a aplicação não
  // atribui consentimento retroativamente a uma versão que não foi lida.
  if (value?.consent?.policyVersion !== PRIVACY_POLICY_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }

  const sanitized = withoutContactData(value);
  if (JSON.stringify(sanitized) !== JSON.stringify(value)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  }

  scheduleCleanup(expiresAt(sanitized));
  return sanitized;
}

export function saveAssessment(value) {
  const nextExpiry = new Date(Date.now() + LOCAL_STORAGE_TTL_MS).toISOString();
  value.localExpiresAt = nextExpiry;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutContactData(value)));
  scheduleCleanup(Date.parse(nextExpiry));
  return value;
}

export function clearAssessment() {
  if (cleanupTimer) window.clearTimeout(cleanupTimer);
  cleanupTimer = null;
  localStorage.removeItem(STORAGE_KEY);
}
