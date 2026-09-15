import { MODULE_PRODUCTS, PROJECT, trackEvent } from './config.js';

const root = document.querySelector('#trial-lesson-app');
const moduleKey = new URLSearchParams(location.search).get('modulo');
const product = MODULE_PRODUCTS[moduleKey];
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

function youtubeEmbed(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      if (parsed.pathname.startsWith('/embed/')) return `https://www.youtube-nocookie.com${parsed.pathname}`;
    }
  } catch {}
  return '';
}

function vimeoEmbed(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('vimeo.com')) return '';
    const id = parsed.pathname.split('/').filter(Boolean).pop();
    return /^\d+$/.test(id || '') ? `https://player.vimeo.com/video/${id}` : '';
  } catch {
    return '';
  }
}

function videoMarkup(lesson, productData) {
  const source = String(lesson.videoUrl || '').trim();
  const youtube = youtubeEmbed(source);
  const vimeo = vimeoEmbed(source);
  if (youtube || vimeo) {
    return `<iframe title="Aula experimental: ${esc(lesson.title)}" src="${youtube || vimeo}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }
  if (source) {
    return `<video class="lesson-video" controls playsinline preload="metadata" poster="${esc(productData.image)}"><source src="${esc(source)}">Seu navegador não suporta este vídeo.</video>`;
  }
  return `<div class="lesson-placeholder"><div><div class="lesson-play" aria-hidden="true">▶</div><h2>Aula experimental</h2><p>O vídeo desta aula será inserido aqui. A estrutura já está pronta para receber um link do YouTube, Vimeo ou um vídeo MP4 hospedado.</p></div></div>`;
}

if (!product) {
  root.innerHTML = `<a class="brand" href="index.html"><span class="brand-mark">M</span>${PROJECT.name}</a><section class="card"><h1>Módulo não encontrado</h1><p class="lead">Escolha um módulo na vitrine ou faça a avaliação para receber uma indicação educativa.</p><a class="btn" href="vitrine.html">Ver módulos</a></section>`;
} else {
  const lesson = product.lesson;
  const checkoutAction = product.checkoutUrl
    ? `<a class="btn" href="${esc(product.checkoutUrl)}" target="_blank" rel="noopener" id="checkout-module">Continuar para a aula 2</a>`
    : `<div class="lesson-next-disabled"><strong>Próxima etapa em configuração.</strong><br>Assim que o checkout deste módulo for conectado, este botão levará diretamente para a Aula 2.</div>`;
  const comboAction = product.comboCheckoutUrl
    ? `<a class="btn ghost" href="${esc(product.comboCheckoutUrl)}" target="_blank" rel="noopener" id="checkout-combo">Quero os 6 módulos</a>`
    : '';

  root.innerHTML = `
    <a class="brand" href="vitrine.html?produto=${esc(product.slug)}"><span class="brand-mark">M</span>${PROJECT.name}</a>
    <section class="hero lesson-hero" style="--module-color:${esc(product.color)}">
      <div>
        <p class="lesson-eyebrow"><span class="lesson-count">${product.moduleId}</span> AULA EXPERIMENTAL GRATUITA</p>
        <h1>${esc(product.name)}</h1>
        <p class="lead">${esc(lesson.title)}</p>
        <p class="small">${esc(lesson.focus)}</p>
      </div>
      <img class="lesson-cover" src="${esc(product.image)}" alt="Capa do ${esc(product.name)}" onerror="this.style.display='none'">
    </section>
    <div class="lesson-layout" style="--module-color:${esc(product.color)}">
      <section class="card lesson-video-card">
        ${videoMarkup(lesson, product)}
      </section>
      <aside class="card">
        <p class="question-meta">NESTA AULA VOCÊ VAI</p>
        <h2>Começar pelo essencial</h2>
        <ul class="lesson-list">${lesson.outcomes.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
      </aside>
    </div>
    <section class="card lesson-locked" style="--module-color:${esc(product.color)};margin-top:20px">
      <p class="lesson-lock-label">🔒 AULA 2 E PRÓXIMAS ETAPAS</p>
      <h2>Gostou da primeira aula?</h2>
      <p class="lead">Continue no conteúdo completo do Módulo ${product.moduleId}. A próxima etapa abre o checkout correspondente.</p>
      ${checkoutAction}
      ${comboAction}
      <p class="lesson-checkout-note">Após a compra aprovada, entre na Flowlink usando o <strong>mesmo e-mail utilizado na Hotmart</strong> para acessar o conteúdo completo.</p>
    </section>
    <section class="card lesson-access">
      <strong>Você já comprou?</strong>
      <p class="small">Entre na Flowlink com o mesmo e-mail usado na compra. Se o acesso ainda não aparecer, fale com a Clínica Setterlin para conferirmos sua liberação.</p>
      <a class="btn secondary" href="${esc(product.flowlinkUrl)}" target="_blank" rel="noopener" id="flowlink-access">Entrar na Flowlink</a>
    </section>
    <section class="card lesson-back">
      <h2>Importante</h2>
      <p class="small">Este conteúdo possui finalidade educativa e não substitui avaliação, diagnóstico ou tratamento profissional. Se houver piora importante ou sinais de alerta, priorize atendimento profissional.</p>
      <a class="btn ghost" href="vitrine.html?produto=${esc(product.slug)}">Voltar para os módulos</a>
    </section>
    <footer class="footer"><a href="${PROJECT.privacyUrl}">Privacidade</a> · <a href="${PROJECT.termsUrl}">Termos</a> · <a href="${PROJECT.healthNoticeUrl}">Aviso de saúde</a></footer>`;

  trackEvent('trial_lesson_viewed', { module: moduleKey });
  document.querySelector('#checkout-module')?.addEventListener('click', () => trackEvent('product_checkout_clicked', { module: moduleKey, source: 'trial_lesson' }));
  document.querySelector('#checkout-combo')?.addEventListener('click', () => trackEvent('product_checkout_clicked', { module: 'combo', source: 'trial_lesson' }));
  document.querySelector('#flowlink-access')?.addEventListener('click', () => trackEvent('flowlink_member_access_clicked', { module: moduleKey }));
  root.querySelector('video')?.addEventListener('play', () => trackEvent('trial_lesson_started', { module: moduleKey }));
}
