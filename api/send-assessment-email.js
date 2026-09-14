const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://mandaladacoluna.vercel.app').replace(/\/$/, '');
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_PDF_BYTES = Math.floor(2.5 * 1024 * 1024);
const requestWindows = new Map();

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

  const { firstName, email, marketingConsent, privacyConsent, sensitiveDataConsent, attachment } = request.body || {};
  const normalizedFirstName = String(firstName || '').trim();
  if (!EMAIL_PATTERN.test(String(email || '')) || !EMAIL_PATTERN.test(senderEmail)) return json(response, 400, { error: 'E-mail inválido.' });
  if (!normalizedFirstName || normalizedFirstName.length > 60) return json(response, 400, { error: 'Nome inválido.' });
  if (privacyConsent !== true || sensitiveDataConsent !== true) {
    return json(response, 400, { error: 'É necessário autorizar o tratamento dos dados de saúde para enviar o relatório por e-mail.' });
  }

  let pdfAttachment = null;
  try {
    pdfAttachment = normalizePdfAttachment(attachment);
  } catch {
    return json(response, 400, { error: 'Não foi possível validar o arquivo do relatório.' });
  }

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
    const contactSaved = marketingConsent === true
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
