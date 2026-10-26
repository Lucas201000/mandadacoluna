import { MODULE_PRODUCTS, PROJECT, trackEvent } from './config.js';

const root = document.querySelector('#trial-lesson-app');
const queryModuleKey = new URLSearchParams(location.search).get('modulo');
const pathProduct = Object.entries(MODULE_PRODUCTS).find(([, item]) => location.pathname.replace(/\/$/, '') === `/modulo${item.moduleId}`);
const moduleKey = queryModuleKey || pathProduct?.[0];
const product = MODULE_PRODUCTS[moduleKey];
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const MODULE_CTA_COPY = {
  inflamatoria: { headline: 'A dor está mais irritada? Comece pelo que o seu corpo tolera hoje.', detail: 'Você já encontrou seu ponto de partida. Agora é sua escolha começar.' },
  muscular: { headline: 'A tensão não precisa continuar mandando na sua rotina.', detail: 'Você já identificou seu ponto de partida. Agora é sua escolha começar com mais leveza.' },
  compressao: { headline: 'Quando a dor se espalha, segurança vem antes de intensidade.', detail: 'Você já sabe por onde começar. Agora é sua escolha avançar no seu ritmo.' },
  rigidez: { headline: 'Seu corpo pode recuperar movimento sem precisar forçar.', detail: 'Você já encontrou o caminho. Agora é sua escolha voltar a se mover com confiança.' },
  encurtamento: { headline: 'Ganhar liberdade de movimento começa com progressão, não com pressa.', detail: 'Você já encontrou o caminho. Agora é sua escolha começar.' },
  instabilidade: { headline: 'Mais estabilidade na rotina começa com uma base bem construída.', detail: 'Você já tem um ponto de partida. Agora é sua escolha construir essa base.' }
};

function youtubeEmbed(url) {
  try {
    const parsed = new URL(url);
    let id = '';
    if (parsed.hostname.includes('youtu.be')) id = parsed.pathname.slice(1);
    if (parsed.hostname.includes('youtube.com')) {
      id = parsed.searchParams.get('v') || (parsed.pathname.startsWith('/embed/') ? parsed.pathname.slice('/embed/'.length) : '');
    }
    if (!id) return '';
    const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
    embed.searchParams.set('autoplay', '1');
    embed.searchParams.set('mute', '1');
    embed.searchParams.set('playsinline', '1');
    embed.searchParams.set('enablejsapi', '1');
    embed.searchParams.set('rel', '0');
    embed.searchParams.set('cc_load_policy', '0');
    embed.searchParams.set('iv_load_policy', '3');
    embed.searchParams.set('hl', 'pt-BR');
    embed.searchParams.set('origin', location.origin);
    return embed.toString();
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
  if (youtube) {
    return `<div class="lesson-video-frame">
      <iframe id="lesson-video-player" title="Aula experimental: ${esc(lesson.title)}" src="${youtube}" loading="eager" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>
      <button class="lesson-sound-button" type="button" aria-label="Ativar o som e reiniciar o vídeo">Ativar som</button>
    </div>`;
  }
  if (vimeo) {
    return `<iframe title="Aula experimental: ${esc(lesson.title)}" src="${vimeo}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }
  if (source) {
    return `<video class="lesson-video" controls playsinline preload="metadata" poster="${esc(productData.image)}"><source src="${esc(source)}">Seu navegador não suporta este vídeo.</video>`;
  }
  return `<div class="lesson-placeholder"><div><div class="lesson-play" aria-hidden="true">▶</div><h2>Aula experimental</h2><p>O vídeo desta aula será inserido aqui. A estrutura já está pronta para receber um link do YouTube, Vimeo ou um vídeo MP4 hospedado.</p></div></div>`;
}

function setupMutedAutoplay() {
  const iframe = root.querySelector('#lesson-video-player');
  const soundButton = root.querySelector('.lesson-sound-button');
  if (!iframe || !soundButton) return;

  let restartedWithSound = false;
  const sendCommand = (func, args = []) => {
    iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube-nocookie.com');
  };
  const restartWithSound = () => {
    if (restartedWithSound) return;
    restartedWithSound = true;
    sendCommand('seekTo', [0, true]);
    sendCommand('unMute');
    sendCommand('playVideo');
    soundButton.hidden = true;
    soundButton.setAttribute('aria-hidden', 'true');
  };

  soundButton.addEventListener('click', restartWithSound);
  window.addEventListener('message', event => {
    if (event.origin !== 'https://www.youtube-nocookie.com' && event.origin !== 'https://www.youtube.com') return;
    try {
      const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (message?.event === 'onVolumeChange' && message?.info?.muted === false) restartWithSound();
    } catch {}
  });
}

if (!product) {
  root.innerHTML = `<a class="brand" href="index.html"><span class="brand-mark">M</span>${PROJECT.name}</a><section class="card"><h1>Módulo não encontrado</h1><p class="lead">Escolha um módulo na vitrine ou faça a avaliação para receber uma indicação educativa.</p><a class="btn" href="vitrine.html">Ver módulos</a></section>`;
} else {
  const lesson = product.lesson;
  const cta = MODULE_CTA_COPY[moduleKey];
  const moduleTitle = product.name.replace(/^Módulo\s+\d+\s*[—-]\s*/i, '');
  const checkoutAction = product.checkoutUrl
    ? `<a class="btn" href="${esc(product.checkoutUrl)}" target="_blank" rel="noopener" id="checkout-module">QUERO COMEÇAR AGORA</a>`
    : `<div class="lesson-next-disabled"><strong>Próxima etapa em configuração.</strong><br>Assim que ela estiver liberada, este botão levará diretamente para a Aula 2.</div>`;
  root.innerHTML = `
    <a class="brand" href="vitrine.html?produto=${esc(product.slug)}"><span class="brand-mark">M</span>${PROJECT.name}</a>
    <section class="hero lesson-hero" style="--module-color:${esc(product.color)}">
      <div class="lesson-title">
        <span>Módulo ${product.moduleId}</span>
        <strong>${esc(moduleTitle)}</strong>
      </div>
      <img class="lesson-cover" src="${esc(product.image)}" alt="Capa do ${esc(product.name)}" onerror="this.style.display='none'">
    </section>
    <section class="lesson-video-card lesson-video-wide">
      ${videoMarkup(lesson, product)}
    </section>
    <section class="card lesson-locked" style="--module-color:${esc(product.color)};margin-top:20px">
      <h2>${esc(cta?.headline || 'Seu próximo passo começa agora.')}</h2>
      <p class="lead">${esc(cta?.detail || 'Agora é sua escolha começar.')}</p>
      ${checkoutAction}
    </section>
    <footer class="footer"><a href="${PROJECT.privacyUrl}">Privacidade</a> · <a href="${PROJECT.termsUrl}">Termos</a> · <a href="${PROJECT.healthNoticeUrl}">Aviso de saúde</a></footer>`;

  trackEvent('trial_lesson_viewed', { module: moduleKey });
  document.querySelector('#checkout-module')?.addEventListener('click', () => trackEvent('product_checkout_clicked', { module: moduleKey, source: 'trial_lesson' }));
  root.querySelector('video')?.addEventListener('play', () => trackEvent('trial_lesson_started', { module: moduleKey }));
  setupMutedAutoplay();
}
