import { PROJECT, STORAGE_KEY, MODULES, trackEvent } from './config.js';
import { calculateResult } from './scoring.js';
import { renderCharts } from './charts.js';
import { mountLeadForm } from './lead.js';
import { createPdfAttachment, generatePdf } from './pdf-generator.js';

const root = document.querySelector('#result-app');
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
}[char]));

let result = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');

if (!result || !result.answers) {
  root.innerHTML = `
    <section class="card">
      <h1>Nenhuma avaliação encontrada</h1>
      <p class="lead">Comece uma nova avaliação para ver seu resultado educativo.</p>
      <a class="btn" href="index.html">Começar avaliação</a>
    </section>`;
} else {
  result = calculateResult(result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  show();
}

function recommendedModuleCard(module, product, placement, compact = false) {
  const description = compact
    ? 'Aula experimental disponível para você conhecer o conteúdo deste módulo.'
    : product.shortDescription;

  return `
    <section class="card module-access module-access--${placement}" style="--module-color:${product.color};--product-color:${product.color}">
      <p class="question-meta">${placement === 'top' ? 'SEU PRÓXIMO PASSO EDUCATIVO' : 'MÓDULO RECOMENDADO'}</p>
      <div class="product">
        <div class="product-art" aria-hidden="true">${module.id}</div>
        <div>
          <h3>${esc(product.name)}</h3>
          <p>${esc(description)}</p>
          ${compact ? '' : '<p class="small"><strong>Aula experimental disponível.</strong></p>'}
          <a class="btn" href="${product.trialUrl}" target="_blank" rel="noopener" data-module-access="${placement}">Acessar o Módulo ${module.id}</a>
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
    <section class="card" style="margin-top:20px">
      <h2>Compatibilidade com os módulos</h2>
      <p class="small">As porcentagens representam o quanto suas respostas se aproximam dos padrões educativos da Mandala. Elas não representam probabilidade de doença ou diagnóstico.</p>
      <div class="chart-wrap"><canvas id="module-chart" aria-label="Gráfico de barras dos seis módulos"></canvas></div>
    </section>
    <section class="card" style="margin-top:20px">
      <h2>Principais perfis</h2>
      <div class="chart-wrap"><canvas id="profile-chart" aria-label="Gráfico de distribuição dos principais perfis"></canvas></div>
    </section>
    ${!flagDetected ? `<div style="margin-top:20px">${recommendedModuleCard(module, product, 'middle')}</div>` : ''}
    <section class="card lead-box" id="lead-gate">
      <h2>Para liberar seu relatório completo para download, faça um breve cadastro.</h2>
      <p class="small">Após a liberação, enviaremos uma cópia do relatório em PDF para o e-mail informado. Você também poderá baixar o arquivo aqui. Autorizar conteúdos e recomendações é opcional.</p>
      <form id="lead-form">
        <div class="form-grid">
          <label class="field">Nome
            <input required name="name" value="${esc(result.user.firstName || '')}" autocomplete="given-name">
          </label>
          <label class="field">E-mail
            <input required type="email" name="email" autocomplete="email">
          </label>
          <label class="field full">WhatsApp
            <input required type="tel" name="whatsapp" inputmode="tel" autocomplete="tel" minlength="8" placeholder="(00) 00000-0000">
          </label>
          <label class="check full"><input type="checkbox" name="privacy" required>Li e aceito a <a href="${PROJECT.privacyUrl}">política de privacidade</a> para gerar o relatório.</label>
          <label class="check full"><input type="checkbox" name="marketing">Autorizo receber conteúdos e recomendações (opcional).</label>
        </div>
        <div class="actions"><button class="btn" type="submit">Liberar relatório completo</button></div>
      </form>
    </section>
    <section class="card hidden" id="report-actions" style="margin-top:20px" tabindex="-1">
      <h2>Seu relatório está liberado</h2>
      <p class="small">A geração pode abrir uma prévia em alguns navegadores de celular.</p>
      <div class="actions">
        <button class="btn" id="pdf">Baixar relatório em PDF</button>
        ${!flagDetected ? `<a class="btn secondary" href="${product.trialUrl}" target="_blank" rel="noopener" data-module-access="unlocked">Acessar o Módulo ${module.id}</a>` : ''}
        <button class="btn secondary" id="print">Imprimir</button>
        <a class="btn ghost" href="index.html" id="restart">Refazer avaliação</a>
      </div>
    </section>
    <footer class="footer"><a href="${PROJECT.privacyUrl}">Privacidade</a> · <a href="${PROJECT.termsUrl}">Termos</a> · ${PROJECT.healthNotice}</footer>`;

  const charts = renderCharts(result);
  trackEvent('result_viewed');

  document.querySelectorAll('[data-module-access]').forEach(link => {
    link.onclick = () => {
      trackEvent('trial_lesson_clicked', { module: result.primaryModule, placement: link.dataset.moduleAccess });
    };
  });

  mountLeadForm(
    result,
    () => {
      const reportActions = document.querySelector('#report-actions');
      reportActions.classList.remove('hidden');
      try {
        reportActions.focus({ preventScroll: true });
      } catch {
        reportActions.focus();
      }
    },
    () => createPdfAttachment(result, charts)
  );

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

  document.querySelector('#print').onclick = () => window.print();
  document.querySelector('#restart').onclick = () => {
    localStorage.removeItem(STORAGE_KEY);
    trackEvent('assessment_restarted');
  };
}
