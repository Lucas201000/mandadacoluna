const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://mandaladacoluna.vercel.app').replace(/\/$/, '');

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

async function upsertBrevoContact({ apiKey, email, firstName, marketingConsent }) {
  const marketingListId = Number.parseInt(process.env.BREVO_MARKETING_LIST_ID, 10);
  const payload = {
    email: String(email).trim(),
    updateEnabled: true,
    attributes: firstName ? { FIRSTNAME: String(firstName).trim().slice(0, 100) } : {}
  };
  if (marketingConsent && Number.isInteger(marketingListId) && marketingListId > 0) {
    payload.listIds = [marketingListId];
  }

  try {
    const contactResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!contactResponse.ok) {
      console.error('Brevo contact upsert failed:', contactResponse.status, await contactResponse.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Brevo contact upsert error:', error);
    return false;
  }
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return json(response, 405, { error: 'Método não permitido.' });
  }

  const origin = request.headers.origin;
  const requestOrigin = request.headers.host ? `https://${request.headers.host}` : SITE_URL;
  if (origin && origin !== requestOrigin) return json(response, 403, { error: 'Origem não autorizada.' });

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Mandala da Dor na Coluna';
  if (!apiKey || !senderEmail) return json(response, 503, { error: 'O envio de e-mail ainda não está configurado.' });

  const { firstName, email, assessmentId, primaryModule, redFlagDetected, marketingConsent } = request.body || {};
  if (!EMAIL_PATTERN.test(String(email || '')) || !EMAIL_PATTERN.test(senderEmail)) return json(response, 400, { error: 'E-mail inválido.' });

  const safeName = escapeHtml(String(firstName || ''));
  const safeModule = escapeHtml(String(primaryModule || ''));
  const safeAssessmentId = escapeHtml(String(assessmentId || ''));
  const hasSafetyAlert = Boolean(redFlagDetected);
  const title = hasSafetyAlert ? 'Sua avaliação educativa foi registrada' : 'Sua avaliação educativa está pronta';
  const message = hasSafetyAlert
    ? 'Suas respostas incluem sinais que merecem avaliação profissional. Isso não significa necessariamente algo grave, mas não deve ser analisado somente por um questionário online.'
    : `Seu resultado educativo está disponível. O perfil predominante informado foi: ${safeModule || 'Mandala da Dor na Coluna'}.`;
  const productBlock = hasSafetyAlert ? '' : `<p style="margin:24px 0"><a href="${SITE_URL}/vitrine.html" style="display:inline-block;background:#237A6B;color:#ffffff;padding:13px 18px;border-radius:10px;text-decoration:none;font-weight:700">Conhecer os módulos educativos</a></p>`;
  const htmlContent = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F6F8FA;color:#18322F;font-family:Arial,sans-serif"><main style="max-width:620px;margin:0 auto;padding:28px"><section style="background:#ffffff;border:1px solid #DCE7E4;border-radius:16px;padding:30px"><p style="color:#237A6B;font-weight:700;letter-spacing:.08em;font-size:12px">MANDALA DA DOR NA COLUNA</p><h1 style="font-size:26px;line-height:1.2">${title}</h1><p>Olá${safeName ? `, ${safeName}` : ''}.</p><p>${message}</p>${productBlock}<p style="font-size:13px;color:#60716F">Este e-mail e a avaliação possuem finalidade educativa e não substituem avaliação, diagnóstico ou tratamento profissional.</p><p style="font-size:12px;color:#60716F">Referência da avaliação: ${safeAssessmentId || 'não informada'}.</p></section></main></body></html>`;

  try {
    const contactSaved = await upsertBrevoContact({ apiKey, email, firstName, marketingConsent: Boolean(marketingConsent) });
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: { name: senderName, email: senderEmail }, to: [{ email: String(email).trim(), name: String(firstName || '').trim() }], subject: title, htmlContent, tags: ['mandala-da-dor', hasSafetyAlert ? 'triagem-prioritaria' : 'resultado-educativo'] })
    });
    if (!brevoResponse.ok) {
      console.error('Brevo rejected transactional email:', brevoResponse.status, await brevoResponse.text());
      return json(response, 502, { error: 'Não foi possível enviar o e-mail agora.' });
    }
    return json(response, 200, { sent: true, contactSaved });
  } catch (error) {
    console.error('Brevo transactional email error:', error);
    return json(response, 502, { error: 'Não foi possível enviar o e-mail agora.' });
  }
};
