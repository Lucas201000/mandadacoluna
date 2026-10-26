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

function recommendedModuleCard(module, product, placement, compact = false) {
  const trialReady = product.trialUrlConfigured;
  const description = compact
    ? (trialReady ? 'Assista à apresentação gratuita e conheça o caminho deste módulo.' : 'Conheça o conteúdo educativo preparado para este módulo.')
    : product.shortDescription;
  const accessLabel = trialReady ? `Ver a apresentação do Módulo ${module.id}` : `Acessar o Módulo ${module.id}`;

  return `
    <section class="card module-access module-access--${placement}" style="--module-color:${product.color};--product-color:${product.color}">
      <p class="question-meta">${placement === 'top' ? 'SEU PRÓXIMO PASSO EDUCATIVO' : 'MÓDULO RECOMENDADO'}</p>
      <div class="product">
        <div class="product-art" aria-hidden="true">${module.id}</div>
        <div>
          <h3>${esc(product.name)}</h3>
          <p>${esc(description)}</p>
          ${compact || !trialReady ? '' : '<p class="small"><strong>Apresentação gratuita disponível.</strong></p>'}
          <a class="btn" href="${product.trialUrl}" target="_blank" rel="noopener" data-module-access="${placement}">${accessLabel}</a>
        </div>
      </div>
    </section>`;
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
    ${!flagDetected ? `<div class="result-focus">${recommendedModuleCard(module, product, 'top', true)}</div>` : ''}
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

  document.querySelectorAll('[data-module-access]').forEach(link => {
    link.onclick = () => {
      trackEvent('trial_lesson_clicked', { module: result.primaryModule, placement: link.dataset.moduleAccess });
    };
  });

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
