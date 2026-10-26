import { PROJECT, MODULES, trackEvent } from './config.js';
import { calculateResult } from './scoring.js';
import { renderCharts } from './charts.js';
import { generatePdf } from './pdf-generator.js';
import { clearAssessment, loadAssessment, saveAssessment } from './storage.js';

const root = document.querySelector('#result-app');
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
}[char]));

let result = loadAssessment();

const MODULE_CTA_COPY = {
  inflamatoria: 'A dor está mais irritada? Comece pelo que o seu corpo tolera hoje.',
  muscular: 'A tensão não precisa continuar mandando na sua rotina.',
  compressao: 'Quando a dor se espalha, segurança vem antes de intensidade.',
  rigidez: 'Seu corpo pode recuperar movimento sem precisar forçar.',
  encurtamento: 'Ganhar liberdade de movimento começa com progressão, não com pressa.',
  instabilidade: 'Mais estabilidade na rotina começa com uma base bem construída.'
};

if (!result || !result.answers) {
  root.innerHTML = `
    <section class="card">
      <h1>Nenhuma avaliação encontrada</h1>
      <p class="lead">Comece uma nova avaliação para ver seu resultado educativo.</p>
      <a class="btn" href="index.html">Começar avaliação</a>
    </section>`;
} else {
  result = calculateResult(result);
  saveAssessment(result);
  show();
}

function youtubeEmbed(url) {
  try {
    const parsed = new URL(url);
    const id = parsed.hostname.includes('youtu.be')
      ? parsed.pathname.slice(1)
      : parsed.hostname.includes('youtube.com')
        ? parsed.searchParams.get('v') || (parsed.pathname.startsWith('/embed/') ? parsed.pathname.slice('/embed/'.length) : '')
        : '';
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
  } catch {
    return '';
  }
}

function resultVideo(product) {
  const embed = youtubeEmbed(product.lesson?.videoUrl || '');
  if (!embed) return '';
  return `
    <section class="result-presentation" aria-label="Apresentação do módulo recomendado">
      <div class="result-video-frame">
        <iframe id="result-video-player" title="Apresentação do ${esc(product.name)}" src="${embed}" loading="eager" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>
        <button class="result-sound-button" type="button" aria-label="Ativar o som e reiniciar o vídeo">Ativar som</button>
      </div>
    </section>`;
}

function setupResultVideo() {
  const iframe = root.querySelector('#result-video-player');
  const soundButton = root.querySelector('.result-sound-button');
  if (!iframe || !soundButton) return;

  let restartedWithSound = false;
  const command = (func, args = []) => iframe.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    'https://www.youtube-nocookie.com'
  );
  const restartWithSound = () => {
    if (restartedWithSound) return;
    restartedWithSound = true;
    command('seekTo', [0, true]);
    command('unMute');
    command('playVideo');
    soundButton.hidden = true;
  };

  soundButton.addEventListener('click', restartWithSound);
}

function show() {
  const module = MODULES[result.primaryModule];
  const product = result.recommendedProduct;
  const flagDetected = result.safety.redFlagDetected;

  root.innerHTML = `
    <a class="brand" href="index.html"><span class="brand-mark">M</span>${PROJECT.name}</a>
    <header class="results-header">
      <p class="question-meta">SEU RESULTADO</p>
      <h1>Seu ponto de partida é o Módulo ${module.id}</h1>
      <p class="lead">${esc(module.name)}</p>
    </header>
    ${flagDetected ? `
      <section class="notice alert">
        <strong>Suas respostas incluem sinais que merecem avaliação profissional.</strong><br>
        Isso não significa necessariamente que exista algo grave, mas esse tipo de sintoma não deve ser analisado somente por um questionário online. Procure atendimento profissional.
      </section>` : ''}
    ${!flagDetected ? `
      <section class="card result-next-step" style="--module-color:${esc(product.color)}">
        <p class="question-meta">SEU PRÓXIMO PASSO</p>
        <h2>${esc(product.name)}</h2>
        ${resultVideo(product)}
        <p class="result-cta-headline">${esc(MODULE_CTA_COPY[result.primaryModule] || 'Você já identificou por onde começar.')}</p>
        <p class="lead">Você já identificou seu ponto de partida. Agora é sua escolha começar.</p>
        <a class="btn result-checkout" href="${esc(product.checkoutUrl)}" target="_blank" rel="noopener" id="result-checkout">QUERO COMEÇAR AGORA</a>
      </section>` : ''}
    <section class="card report-actions" id="report-actions" style="margin-top:20px">
      <p class="small">Quer guardar este resultado?</p>
      <div class="actions">
        <button class="btn ghost" id="pdf">Baixar relatório em PDF</button>
        <a class="btn ghost" href="index.html" id="restart">Refazer avaliação</a>
      </div>
    </section>
    <div class="pdf-chart-source" aria-hidden="true">
      <div class="chart-wrap"><canvas id="module-chart"></canvas></div>
      <div class="chart-wrap"><canvas id="profile-chart"></canvas></div>
    </div>
    <footer class="footer"><a href="${PROJECT.privacyUrl}">Privacidade</a> · <a href="${PROJECT.termsUrl}">Termos</a> · <a href="${PROJECT.healthNoticeUrl}">Aviso de saúde</a></footer>`;

  const charts = renderCharts(result);
  trackEvent('result_viewed');

  document.querySelector('#result-checkout')?.addEventListener('click', () => {
    trackEvent('product_checkout_clicked', { module: result.primaryModule, source: 'quiz_result' });
  });
  setupResultVideo();

  document.querySelector('#pdf').onclick = async event => {
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = 'Gerando PDF...';

    try {
      await generatePdf(result, charts);
    } catch (error) {
      window.alert('Não foi possível gerar o PDF. Tente novamente.');
      console.error(error);
    } finally {
      event.currentTarget.disabled = false;
      event.currentTarget.textContent = 'Baixar relatório em PDF';
    }
  };

  document.querySelector('#restart').onclick = () => {
    clearAssessment();
    trackEvent('assessment_restarted');
  };
}
