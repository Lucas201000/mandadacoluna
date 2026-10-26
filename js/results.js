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
    ? (trialReady ? 'Assista à Aula 1 gratuita e conheça o conteúdo deste módulo.' : 'Conheça o conteúdo educativo preparado para este módulo.')
    : product.shortDescription;
  const accessLabel = trialReady ? `Assistir à Aula 1 do Módulo ${module.id}` : `Acessar o Módulo ${module.id}`;

  return `
    <section class="card module-access module-access--${placement}" style="--module-color:${product.color};--product-color:${product.color}">
      <p class="question-meta">${placement === 'top' ? 'SEU PRÓXIMO PASSO EDUCATIVO' : 'MÓDULO RECOMENDADO'}</p>
      <div class="product">
        <div class="product-art" aria-hidden="true">${module.id}</div>
        <div>
          <h3>${esc(product.name)}</h3>
          <p>${esc(description)}</p>
          ${compact || !trialReady ? '' : '<p class="small"><strong>Aula 1 gratuita disponível.</strong></p>'}
          <a class="btn" href="${product.trialUrl}" target="_blank" rel="noopener" data-module-access="${placement}">${accessLabel}</a>
        </div>
      </div>
    </section>`;
}

function show() {
  const module = MODULES[result.primaryModule];
  const product = result.recommendedProduct;
  const flagDetected = result.safety.redFlagDetected;
  const safeName = esc(result.user.firstName || 'Você');
  const safeRegions = esc(result.pain.additionalRegions.join(', '));

  root.innerHTML = `
    <a class="brand" href="index.html"><span class="brand-mark">M</span>${PROJECT.name}</a>
    <header class="results-header">
      <p class="question-meta">RESULTADO EDUCATIVO</p>
      <h1>Seu resultado na Mandala da Dor</h1>
      <p class="lead">${safeName}, suas respostas apresentam maior compatibilidade com o Módulo ${module.id}: ${module.name}.</p>
    </header>
    ${flagDetected ? `
      <section class="notice alert">
        <strong>Suas respostas incluem sinais que merecem avaliação profissional.</strong><br>
        Isso não significa necessariamente que exista algo grave, mas esse tipo de sintoma não deve ser analisado somente por um questionário online. Procure atendimento profissional.
      </section>` : ''}
    <div class="results-grid ${!flagDetected ? 'has-recommendation' : ''}" style="margin-top:20px">
      <section class="card primary result-primary" style="--module-color:${module.color}">
        <p class="question-meta">PERFIL PREDOMINANTE</p>
        <h2>Módulo ${module.id} — ${module.name}</h2>
        <div class="metric">${result.percentages[module.key]}%</div>
        <p class="small">de compatibilidade relatada</p>
        <p>${module.description}</p>
        <p class="notice">${PROJECT.healthNotice}</p>
      </section>
      <section class="card result-summary">
        <h3>Resumo dos relatos</h3>
        <ul class="detail-list">
          <li>Intensidade informada: ${result.pain.intensity}/10</li>
          <li>Regiões: ${safeRegions}</li>
          <li>Duração: ${result.pain.duration}</li>
          <li>Secundários: ${result.secondaryModules.map(key => MODULES[key].short).join(' e ')}</li>
        </ul>
      </section>
      ${!flagDetected ? recommendedModuleCard(module, product, 'top', true) : ''}
    </div>
    <section class="card report-actions" id="report-actions" style="margin-top:20px">
      <h2>Seu relatório está pronto</h2>
      <p class="small">Se quiser guardar seu resultado, baixe o PDF neste aparelho. Não é necessário preencher dados, receber código ou sair desta página.</p>
      <div class="actions">
        <button class="btn" id="pdf">Baixar relatório em PDF</button>
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
