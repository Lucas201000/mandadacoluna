const crypto = require('crypto');

// Fluxo separado do relatório do quiz: este endpoint recebe somente a
// confirmação de compra da Hotmart e envia as instruções de acesso. Ele não
// lê, grava ou envia respostas da avaliação nem dados de saúde.
const FLOWLINK_URL = 'https://clinica-setterlin.flowlink-app.online/';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const recentTransactions = new Map();
const RECENT_TRANSACTION_TTL_MS = 24 * 60 * 60 * 1000;

const PRODUCTS = {
  '8200610': { label: 'Módulo 1 — Acalmando a Dor Irritada' },
  '8200634': { label: 'Módulo 2 — Alívio da Tensão Muscular' },
  '8200662': { label: 'Módulo 3 — Dor Irradiada e Nervo Sensível' },
  '8200755': { label: 'Módulo 4 — Recuperando a Mobilidade' },
  '8201776': { label: 'Módulo 5 — Flexibilidade e Músculos Encurtados' },
  '8201801': { label: 'Módulo 6 — Força, Estabilidade e Controle' },
  '8510985': { label: 'Combo Mandala da Dor — 6 módulos', combo: true }
};

function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(body));
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : '';
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function secureEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function cleanupRecentTransactions() {
  const expiry = Date.now() - RECENT_TRANSACTION_TTL_MS;
  for (const [key, timestamp] of recentTransactions) {
    if (timestamp < expiry) recentTransactions.delete(key);
  }
}

function extractPurchase(body) {
  // A Hotmart envia os detalhes abaixo de data. A leitura tolera os formatos
  // documentados e variações de testes, sem assumir campos não necessários.
  const data = body && typeof body === 'object' && body.data && typeof body.data === 'object' ? body.data : {};
  const buyer = data.buyer && typeof data.buyer === 'object' ? data.buyer : {};
  const product = data.product && typeof data.product === 'object' ? data.product : {};
  const purchase = data.purchase && typeof data.purchase === 'object' ? data.purchase : {};
  return {
    event: String(body?.event || '').trim(),
    email: normalizeEmail(buyer.email),
    firstName: String(buyer.first_name || buyer.name || '').trim().slice(0, 80),
    productId: String(product.id || product.ucode || '').trim(),
    transaction: String(purchase.transaction || purchase.transaction_id || '').trim()
  };
}

function accessEmail({ firstName, product }) {
  const safeName = escapeHtml(firstName || '');
  const safeProduct = escapeHtml(product.label);
  const title = 'Seu acesso à Mandala da Dor está pronto';
  const item = product.combo
    ? 'Os seis módulos ficam disponíveis para você.'
    : `Seu acesso ao ${safeProduct} está disponível.`;
  const htmlContent = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F6F8FA;color:#18322F;font-family:Arial,sans-serif"><main style="max-width:620px;margin:0 auto;padding:28px"><section style="background:#fff;border:1px solid #DCE7E4;border-radius:16px;padding:30px"><p style="color:#237A6B;font-weight:700;letter-spacing:.08em;font-size:12px">MANDALA DA DOR NA COLUNA</p><h1 style="font-size:26px;line-height:1.2;margin:0 0 18px">${title}</h1><p>Olá${safeName ? `, ${safeName}` : ''}.</p><p>${item}</p><p>Entre na FlowLink usando <strong>o mesmo e-mail informado na compra</strong>. No primeiro acesso, crie sua senha ou use a opção “Esqueci minha senha”.</p><p style="margin:28px 0"><a href="${FLOWLINK_URL}" style="display:inline-block;background:#237A6B;color:#fff;text-decoration:none;border-radius:8px;padding:13px 20px;font-weight:700">Acessar a FlowLink</a></p><p>Se não localizar a mensagem de boas-vindas, confira as abas Promoções, spam ou lixo eletrônico.</p><p>Se precisar de ajuda, fale com a Clínica Setterlin pelo WhatsApp: <a href="https://wa.me/5515996592799" style="color:#237A6B">clique aqui para falar conosco</a>.</p><p style="font-size:13px;color:#60716F;margin-top:26px">Este e-mail contém somente instruções de acesso e não traz informações de saúde.</p></section></main></body></html>`;
  const textContent = [
    title,
    `Olá${firstName ? `, ${firstName}` : ''}.`,
    product.combo ? 'Os seis módulos ficam disponíveis para você.' : `Seu acesso ao ${product.label} está disponível.`,
    `Acesse a FlowLink com o mesmo e-mail informado na compra: ${FLOWLINK_URL}`,
    'No primeiro acesso, crie sua senha ou use “Esqueci minha senha”.',
    'Se precisar de ajuda: https://wa.me/5515996592799',
    'Este e-mail contém somente instruções de acesso e não traz informações de saúde.'
  ].join('\n\n');
  return { title, htmlContent, textContent };
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Método não permitido.' });
  }

  const hottok = process.env.HOTMART_HOTTOK;
  const receivedHottok = request.headers['x-hotmart-hottok'];
  if (!hottok || !secureEqual(receivedHottok, hottok)) {
    return sendJson(response, 401, { error: 'Webhook não autorizado.' });
  }

  const purchase = extractPurchase(request.body || {});
  if (purchase.event !== 'PURCHASE_APPROVED') {
    return sendJson(response, 202, { ignored: true, reason: 'Evento não é compra aprovada.' });
  }
  const product = PRODUCTS[purchase.productId];
  if (!product) return sendJson(response, 202, { ignored: true, reason: 'Produto fora da Mandala da Dor.' });
  if (!purchase.email) return sendJson(response, 422, { error: 'E-mail do comprador inválido.' });

  cleanupRecentTransactions();
  const idempotencyKey = purchase.transaction || `${purchase.productId}:${purchase.email}`;
  if (recentTransactions.has(idempotencyKey)) return sendJson(response, 200, { duplicate: true });

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = normalizeEmail(process.env.BREVO_SENDER_EMAIL);
  const senderName = String(process.env.BREVO_SENDER_NAME || 'Clínica Setterlin').trim().slice(0, 100);
  if (!apiKey || !senderEmail) return sendJson(response, 503, { error: 'Envio de acesso ainda não configurado.' });

  const email = accessEmail({ firstName: purchase.firstName, product });
  try {
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: purchase.email, name: purchase.firstName || undefined }],
        subject: email.title,
        htmlContent: email.htmlContent,
        textContent: email.textContent,
        tags: ['mandala-da-dor', 'acesso-pos-compra', `produto-${purchase.productId}`]
      })
    });
    if (!brevoResponse.ok) {
      console.error('Brevo rejected post-purchase email:', brevoResponse.status);
      return sendJson(response, 502, { error: 'Não foi possível enfileirar o e-mail de acesso.' });
    }
    recentTransactions.set(idempotencyKey, Date.now());
    return sendJson(response, 200, { accepted: true });
  } catch {
    console.error('Post-purchase email failed unexpectedly.');
    return sendJson(response, 502, { error: 'Não foi possível enfileirar o e-mail de acesso.' });
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: '1mb' } } };
