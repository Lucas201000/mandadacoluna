const crypto = require('crypto');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://mandaladacoluna.vercel.app').replace(/\/$/, '');
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_PDF_BYTES = Math.floor(2.5 * 1024 * 1024);
const requestWindows = new Map();
const verificationAttempts = new Map();
const usedVerificationTokens = new Map();
const VERIFICATION_TTL_MS = 15 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

function allowRequest(request) {
  const now = Date.now();
  const client = String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const attempts = (requestWindows.get(client) || []).filter(timestamp => now - timestamp < RATE_WINDOW_MS);
  if (attempts.length >= MAX_REQUESTS_PER_WINDOW) return false;
  attempts.push(now);
  requestWindows.set(client, attempts);
  return true;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function json(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(body));
}

function sanitizePdfName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120);
}

function normalizePdfAttachment(rawAttachment) {
  if (!rawAttachment) return null;
  if (typeof rawAttachment !== 'object') throw new Error('Anexo inválido.');

  const name = sanitizePdfName(rawAttachment.name);
  const content = String(rawAttachment.content || '').trim().replace(/^data:application\/pdf;base64,/i, '');
  if (!name.toLowerCase().endsWith('.pdf') || !content) throw new Error('Anexo inválido.');
  if (content.length % 4 === 1 || !/^[A-Za-z0-9+/]+={0,2}$/.test(content)) throw new Error('Anexo inválido.');

  const buffer = Buffer.from(content, 'base64');
  if (!buffer.length || buffer.length > MAX_PDF_BYTES || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('Anexo inválido.');
  }

  // Rejeita variações de Base64 para evitar conteúdo ambíguo ou transformado.
  if (buffer.toString('base64') !== content) throw new Error('Anexo inválido.');

  return { name, content };
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : '';
}

function secureEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function verificationKeys(apiKey) {
  // O segredo opcional permite separar a rotação da Brevo da verificação.
  // Enquanto não estiver configurado, derivamos chaves com domínios distintos
  // exclusivamente no servidor; nenhuma delas é exposta ao navegador.
  const seed = process.env.EMAIL_VERIFICATION_SECRET || apiKey;
  const derive = purpose => crypto.createHmac('sha256', seed)
    .update(`mandala-email-verification:v1:${purpose}`)
    .digest();
  return { signing: derive('signing'), encryption: derive('encryption') };
}

function sign(signingKey, value) {
  return crypto.createHmac('sha256', signingKey).update(value).digest('base64url');
}

function encryptVerification(payload, encryptionKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const content = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${content.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}`;
}

function decryptVerification(token, encryptionKey) {
  const [ivValue, contentValue, tagValue, ...extra] = String(token || '').split('.');
  if (!ivValue || !contentValue || !tagValue || extra.length) return null;
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    const content = Buffer.concat([decipher.update(Buffer.from(contentValue, 'base64url')), decipher.final()]);
    return JSON.parse(content.toString('utf8'));
  } catch {
    return null;
  }
}

function issueVerification({ keys, email, firstName, marketingConsent }) {
  const expiresAt = Date.now() + VERIFICATION_TTL_MS;
  const nonce = crypto.randomBytes(16).toString('hex');
  const code = String(crypto.randomInt(0, 100000000)).padStart(8, '0');
  const payload = {
    version: 1,
    email,
    firstName,
    marketingConsent: marketingConsent === true,
    expiresAt,
    nonce
  };
  payload.codeProof = sign(keys.signing, `code:${email}:${firstName}:${payload.marketingConsent ? '1' : '0'}:${expiresAt}:${nonce}:${code}`);
  const token = encryptVerification(payload, keys.encryption);
  return { code, expiresAt, token };
}

function readVerification(token, keys) {
  const payload = decryptVerification(token, keys.encryption);
  if (
    payload?.version !== 1
    || !normalizeEmail(payload.email)
    || typeof payload.firstName !== 'string'
    || payload.firstName.length < 1
    || payload.firstName.length > 60
    || typeof payload.marketingConsent !== 'boolean'
    || typeof payload.nonce !== 'string'
    || !Number.isFinite(payload.expiresAt)
    || typeof payload.codeProof !== 'string'
    || payload.expiresAt <= Date.now()
  ) return null;
  return payload;
}

function verifyCode(payload, code, keys) {
  if (!/^\d{8}$/.test(String(code || ''))) return false;
  const expectedProof = sign(keys.signing, `code:${payload.email}:${payload.firstName}:${payload.marketingConsent ? '1' : '0'}:${payload.expiresAt}:${payload.nonce}:${code}`);
  return secureEqual(payload.codeProof, expectedProof);
}

function pruneVerificationState() {
  const now = Date.now();
  for (const [token, entry] of verificationAttempts) {
    if (entry.expiresAt <= now) verificationAttempts.delete(token);
  }
  for (const [token, expiresAt] of usedVerificationTokens) {
    if (expiresAt <= now) usedVerificationTokens.delete(token);
  }
}

function allowVerificationAttempt(token, expiresAt) {
  pruneVerificationState();
  const current = verificationAttempts.get(token) || { count: 0, expiresAt };
  if (current.count >= MAX_VERIFICATION_ATTEMPTS) return false;
  verificationAttempts.set(token, { count: current.count + 1, expiresAt });
  return true;
}

async function upsertBrevoContact({ apiKey, email, firstName, marketingConsent }) {
  // Lista "Mandala — conteúdos autorizados" criada na Brevo.
  // A lista precisa ser configurada explicitamente no ambiente da Vercel.
  const marketingListId = Number.parseInt(process.env.BREVO_MARKETING_LIST_ID || '', 10);
  if (marketingConsent !== true || !Number.isInteger(marketingListId) || marketingListId <= 0) return false;

  const payload = {
    email: String(email).trim(),
    // Não atualiza contatos existentes a partir de uma solicitação pública.
    updateEnabled: false,
    listIds: [marketingListId]
  };
  if (firstName) payload.attributes = { FIRSTNAME: String(firstName).trim().slice(0, 100) };

  try {
    const contactResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!contactResponse.ok) {
      console.error('Brevo contact request failed:', contactResponse.status);
      return false;
    }
    return true;
  } catch {
    console.error('Brevo contact request failed unexpectedly.');
    return false;
  }
}

async function sendVerificationCode({ apiKey, senderEmail, senderName, email, firstName, code }) {
  const safeName = escapeHtml(firstName);
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email, name: firstName }],
      subject: 'Confirme seu e-mail para receber o relatório',
      htmlContent: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F6F8FA;color:#18322F;font-family:Arial,sans-serif"><main style="max-width:620px;margin:0 auto;padding:28px"><section style="background:#ffffff;border:1px solid #DCE7E4;border-radius:16px;padding:30px"><p style="color:#237A6B;font-weight:700;letter-spacing:.08em;font-size:12px">MANDALA DA DOR NA COLUNA</p><h1 style="font-size:26px;line-height:1.2">Confirme seu e-mail</h1><p>Olá, ${safeName}.</p><p>Use este código para confirmar que este endereço pode receber seu relatório educativo:</p><p style="font-size:28px;font-weight:700;letter-spacing:.16em">${code}</p><p style="font-size:13px;color:#60716F">O código expira em 15 minutos. Este e-mail não contém informações sobre seus relatos de saúde.</p></section></main></body></html>`,
      textContent: `Mandala da Dor na Coluna\n\nOlá, ${firstName}.\n\nUse este código para confirmar seu e-mail e receber seu relatório educativo: ${code}\n\nO código expira em 15 minutos. Este e-mail não contém informações sobre seus relatos de saúde.`,
      tags: ['mandala-da-dor', 'confirmacao-email']
    })
  });

  if (!response.ok) {
    console.error('Brevo rejected verification email:', response.status);
    return false;
  }
  return true;
}

const handler = async (request, response) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return json(response, 405, { error: 'Método não permitido.' });
  }

  const origin = request.headers.origin;
  const requestOrigin = request.headers.host ? `https://${request.headers.host}` : SITE_URL;
  if (!origin || origin !== requestOrigin) return json(response, 403, { error: 'Origem não autorizada.' });
  if (!allowRequest(request)) return json(response, 429, { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Mandala da Dor na Coluna';
  if (!apiKey || !senderEmail) return json(response, 503, { error: 'O envio de e-mail ainda não está configurado.' });
  const keys = verificationKeys(apiKey);

  const body = request.body || {};
  const action = body.action;
  const normalizedSenderEmail = normalizeEmail(senderEmail);
  if (!normalizedSenderEmail) return json(response, 400, { error: 'E-mail do remetente inválido.' });

  if (action === 'request-report-code') {
    const normalizedFirstName = String(body.firstName || '').trim();
    const email = normalizeEmail(body.email);
    if (!email) return json(response, 400, { error: 'E-mail inválido.' });
    if (!normalizedFirstName || normalizedFirstName.length > 60) return json(response, 400, { error: 'Nome inválido.' });
    if (body.privacyConsent !== true || body.sensitiveDataConsent !== true) {
      return json(response, 400, { error: 'É necessário autorizar o tratamento dos dados de saúde para enviar o relatório por e-mail.' });
    }

    const verification = issueVerification({
      keys,
      email,
      firstName: normalizedFirstName,
      marketingConsent: body.marketingConsent === true
    });

    try {
      const sent = await sendVerificationCode({
        apiKey,
        senderEmail: normalizedSenderEmail,
        senderName,
        email,
        firstName: normalizedFirstName,
        code: verification.code
      });
      if (!sent) return json(response, 502, { error: 'Não foi possível enviar o código de confirmação agora.' });
      return json(response, 200, { verificationToken: verification.token, expiresInSeconds: Math.floor(VERIFICATION_TTL_MS / 1000) });
    } catch {
      console.error('Brevo verification email request failed unexpectedly.');
      return json(response, 502, { error: 'Não foi possível enviar o código de confirmação agora.' });
    }
  }

  if (action !== 'send-verified-report') {
    return json(response, 400, { error: 'Solicitação de envio inválida.' });
  }

  const verificationToken = String(body.verificationToken || '');
  const verification = readVerification(verificationToken, keys);
  if (!verification || usedVerificationTokens.has(verificationToken)) {
    return json(response, 400, { error: 'O código expirou ou já foi usado. Solicite um novo código.' });
  }
  if (!allowVerificationAttempt(verificationToken, verification.expiresAt)) {
    return json(response, 429, { error: 'Muitas tentativas com este código. Solicite um novo código.' });
  }
  if (!verifyCode(verification, body.verificationCode, keys)) {
    return json(response, 400, { error: 'Código de confirmação inválido.' });
  }

  let pdfAttachment = null;
  try {
    pdfAttachment = normalizePdfAttachment(body.attachment);
  } catch {
    return json(response, 400, { error: 'Não foi possível validar o arquivo do relatório.' });
  }

  const email = normalizeEmail(verification.email);
  const normalizedFirstName = verification.firstName;
  const safeName = escapeHtml(normalizedFirstName);
  const hasPdfAttachment = Boolean(pdfAttachment);
  const title = 'Seu relatório educativo está pronto';
  const message = hasPdfAttachment
    ? 'Você solicitou uma cópia do seu relatório educativo. O arquivo está anexado a este e-mail.'
    : 'Você solicitou uma cópia do seu relatório educativo. A geração do anexo não foi concluída; o arquivo continua disponível para baixar na página em que a avaliação foi realizada.';
  const attachmentMessage = hasPdfAttachment
    ? '<p>Seu relatório educativo em PDF está anexado a este e-mail.</p>'
    : '';
  const htmlContent = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F6F8FA;color:#18322F;font-family:Arial,sans-serif"><main style="max-width:620px;margin:0 auto;padding:28px"><section style="background:#ffffff;border:1px solid #DCE7E4;border-radius:16px;padding:30px"><p style="color:#237A6B;font-weight:700;letter-spacing:.08em;font-size:12px">MANDALA DA DOR NA COLUNA</p><h1 style="font-size:26px;line-height:1.2">${title}</h1><p>Olá${safeName ? `, ${safeName}` : ''}.</p><p>${message}</p>${attachmentMessage}<p style="font-size:13px;color:#60716F">Este e-mail e a avaliação possuem finalidade educativa e não substituem avaliação, diagnóstico ou tratamento profissional.</p></section></main></body></html>`;
  const textContent = [
    title,
    `Olá, ${normalizedFirstName}.`,
    message,
    'Este e-mail e a avaliação possuem finalidade educativa e não substituem avaliação, diagnóstico ou tratamento profissional.'
  ].filter(Boolean).join('\n\n');

  try {
    // Contato de marketing só é criado na Brevo quando a pessoa opta por isso.
    // O envio transacional não precisa adicionar quem não autorizou comunicações.
    const contactSaved = verification.marketingConsent === true
      ? await upsertBrevoContact({ apiKey, email, firstName: normalizedFirstName, marketingConsent: true })
      : false;
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: String(email).trim(), name: normalizedFirstName }],
        subject: title,
        htmlContent,
        textContent,
        attachment: hasPdfAttachment ? [{ name: pdfAttachment.name, content: pdfAttachment.content }] : undefined,
        tags: ['mandala-da-dor', ...(hasPdfAttachment ? ['relatorio-pdf'] : [])]
      })
    });
    const brevoPayload = await brevoResponse.json().catch(() => ({}));
    if (!brevoResponse.ok) {
      console.error('Brevo rejected transactional email:', brevoResponse.status);
      return json(response, 502, { error: 'Não foi possível enviar o e-mail agora.' });
    }
    usedVerificationTokens.set(verificationToken, verification.expiresAt);
    // A resposta da Brevo confirma que a mensagem entrou na fila de envio.
    // O identificador permite localizar a entrega nos Logs transacionais,
    // sem expor chaves ou dados sensíveis ao navegador.
    return json(response, 200, {
      sent: true,
      contactSaved,
      pdfAttached: hasPdfAttachment,
      messageId: typeof brevoPayload.messageId === 'string' ? brevoPayload.messageId : null
    });
  } catch {
    console.error('Brevo transactional email request failed unexpectedly.');
    return json(response, 502, { error: 'Não foi possível enviar o e-mail agora.' });
  }
};

module.exports = handler;
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb'
    }
  }
};
