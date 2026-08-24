import { PROJECT, STORAGE_KEY, trackEvent } from './config.js';
import { QUESTIONS, RED_FLAGS } from './questions.js';
import { QUESTION_BREAKS } from './question-breaks.js';
import { calculateResult } from './scoring.js';

const root = document.querySelector('#app');
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
  assessmentId: crypto.randomUUID?.() || String(Date.now()),
  createdAt: new Date().toISOString(),
  user: { firstName: '', ageRange: '', email: '', whatsapp: '' },
  pain: { intensity: 5, duration: '', mainRegion: '', additionalRegions: [], radiation: '' },
  answers: {},
  safety: { redFlagDetected: false, selectedRedFlags: [], noRedFlagsConfirmed: false },
  step: 'home',
  qIndex: 0,
  interstitial: null
};

const regions = [
  'Pescoço',
  'Entre as escápulas',
  'Região torácica',
  'Região lombar',
  'Glúteos',
  'Braço',
  'Mão',
  'Perna',
  'Pé'
];

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetStepViewport() {
  window.scrollTo(0, 0);
  const heading = root.querySelector('h1, h2');

  if (!heading) return;

  heading.tabIndex = -1;
  try {
    heading.focus({ preventScroll: true });
  } catch {
    heading.focus();
  }
}

function layout(content, resetViewport = false) {
  root.innerHTML = `<a class="brand" href="index.html"><span class="brand-mark">M</span>${PROJECT.name}</a>${content}`;

  if (resetViewport) requestAnimationFrame(resetStepViewport);
}

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function button(label, className = 'btn', attributes = '') {
  return `<button class="${className}" ${attributes}>${label}</button>`;
}

window.addEventListener('beforeunload', event => {
  if (['basic', 'region', 'questions', 'interstitial'].includes(state.step)) {
    event.preventDefault();
    event.returnValue = '';
  }
});

function home(resetViewport = true) {
  layout(`
    <section class="hero">
      <p class="question-meta">AVALIAÇÃO EDUCATIVA GRATUITA</p>
      <h1>Sua dor na coluna está atrapalhando sua rotina? Entenda melhor seus sinais.</h1>
      <p class="lead">Em poucos minutos, responda perguntas simples e receba um resultado educativo com orientações iniciais.</p>
      <ul class="benefits">
        <li>Entenda melhor o comportamento da sua dor.</li>
        <li>Descubra qual módulo da mandala mais combina com seus sintomas.</li>
        <li>Baixe um relatório personalizado em PDF.</li>
      </ul>
      ${button('Começar minha avaliação', 'btn', 'id="start"')}
      <p class="notice">${PROJECT.healthNotice}</p>
    </section>
  `, resetViewport);

  document.querySelector('#start').onclick = () => {
    state.step = 'basic';
    persist();
    trackEvent('assessment_started');
    basic();
  };
}

function basic(resetViewport = true) {
  layout(`
    <section class="card">
      <p class="question-meta">ETAPA 1 DE 4</p>
      <h2>Vamos começar pelo básico</h2>
      <p class="lead">Use apenas seu primeiro nome. Você poderá incluir contato antes de liberar o relatório.</p>
      <form id="basic-form">
        <div class="form-grid">
          <label class="field">Primeiro nome
            <input required maxlength="60" name="name" value="${esc(state.user.firstName)}" autocomplete="given-name">
          </label>
          <label class="field">Faixa etária
            <select required name="age">
              <option value="">Selecione</option>
              ${['Até 24 anos', '25 a 34 anos', '35 a 44 anos', '45 a 54 anos', '55 a 64 anos', '65 anos ou mais', 'Prefiro não informar'].map(item => `<option ${state.user.ageRange === item ? 'selected' : ''}>${item}</option>`).join('')}
            </select>
          </label>
          <label class="field">Há quanto tempo sente a dor?
            <select required name="duration">
              <option value="">Selecione</option>
              ${['Menos de 7 dias', 'De 1 a 4 semanas', 'De 1 a 3 meses', 'Mais de 3 meses', 'Vai e volta há algum tempo'].map(item => `<option ${state.pain.duration === item ? 'selected' : ''}>${item}</option>`).join('')}
            </select>
          </label>
          <label class="field">Intensidade atual: <output id="pain-output">${state.pain.intensity}/10</output>
            <input aria-label="Intensidade da dor de 0 a 10" type="range" min="0" max="10" name="intensity" value="${state.pain.intensity}">
          </label>
        </div>
        <p class="error" id="form-error"></p>
        <div class="actions">
          ${button('Continuar', 'btn', 'type="submit"')}
          ${button('Voltar', 'btn ghost', 'type="button" id="back"')}
        </div>
      </form>
    </section>
  `, resetViewport);

  const form = document.querySelector('#basic-form');
  form.elements.intensity.oninput = event => {
    document.querySelector('#pain-output').textContent = `${event.target.value}/10`;
  };

  form.onsubmit = event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    state.user.firstName = form.elements.name.value.trim();
    state.user.ageRange = form.elements.age.value;
    state.pain.duration = form.elements.duration.value;
    state.pain.intensity = Number(form.elements.intensity.value);
    state.step = 'region';
    persist();
    trackEvent('personal_data_completed');
    region();
  };

  document.querySelector('#back').onclick = () => home();
}

function region(resetViewport = true) {
  layout(`
    <section class="card">
      <p class="question-meta">ETAPA 2 DE 4</p>
      <h2>Onde você sente mais desconforto?</h2>
      <p class="lead">Escolha primeiro a região que mais incomoda. Se sentir em outros lugares, você pode marcar mais opções.</p>
      <div class="region-grid" id="regions">
        ${regions.map(regionName => `<button class="option ${state.pain.additionalRegions.includes(regionName) ? 'selected' : ''}" data-region="${regionName}" aria-pressed="${state.pain.additionalRegions.includes(regionName)}">${regionName}</button>`).join('')}
      </div>
      <p class="small" aria-live="polite">${state.pain.mainRegion ? `Região principal selecionada: <strong>${esc(state.pain.mainRegion)}</strong>` : 'Nenhuma região selecionada ainda.'}</p>
      <h3 style="margin-top:28px">A sensação fica no mesmo lugar ou se espalha?</h3>
      <div class="option-grid" id="radiation">
        ${[
          ['concentrada', 'Fica no mesmo lugar'],
          ['braco', 'Vai para o braço ou mão'],
          ['perna', 'Vai para o glúteo, perna ou pé'],
          ['muda', 'Muda de lugar'],
          ['nao-sei', 'Não sei identificar']
        ].map(([value, label]) => `<button class="option ${state.pain.radiation === value ? 'selected' : ''}" data-value="${value}" aria-pressed="${state.pain.radiation === value}">${label}</button>`).join('')}
      </div>
      <p class="error" id="region-error" role="alert"></p>
      <div class="actions">
        ${button('Continuar', 'btn', 'id="region-next"')}
        ${button('Voltar', 'btn ghost', 'id="region-back"')}
      </div>
    </section>
  `, resetViewport);

  document.querySelectorAll('#regions button').forEach(item => {
    item.onclick = () => {
      const regionName = item.dataset.region;
      state.pain.additionalRegions = state.pain.additionalRegions.includes(regionName)
        ? state.pain.additionalRegions.filter(value => value !== regionName)
        : [...state.pain.additionalRegions, regionName];
      state.pain.mainRegion = state.pain.additionalRegions[0] || '';
      persist();
      region(false);
    };
  });

  document.querySelectorAll('#radiation button').forEach(item => {
    item.onclick = () => {
      state.pain.radiation = item.dataset.value;
      persist();
      region(false);
    };
  });

  document.querySelector('#region-next').onclick = () => {
    if (!state.pain.additionalRegions.length || !state.pain.radiation) {
      document.querySelector('#region-error').textContent = 'Escolha uma região e informe se a sensação fica no mesmo lugar ou se espalha.';
      return;
    }

    state.step = 'questions';
    persist();
    trackEvent('body_region_selected', { regions: state.pain.additionalRegions });
    question();
  };

  document.querySelector('#region-back').onclick = () => basic();
}

function question(resetViewport = true) {
  const currentQuestion = QUESTIONS[state.qIndex];
  const questionBreak = QUESTION_BREAKS.find(item => item.afterQuestionId === currentQuestion.id);
  const progress = (state.qIndex + 1) / QUESTIONS.length * 100;

  layout(`
    <section class="card">
      <div class="progress-label"><span>Pergunta ${state.qIndex + 1} de ${QUESTIONS.length}</span><span>${Math.round(progress)}%</span></div>
      <div class="progress"><span style="width:${progress}%"></span></div>
      <p class="question-meta">${currentQuestion.theme.toUpperCase()}</p>
      <h2>${currentQuestion.question}</h2>
      <div class="option-grid" id="options" style="margin-top:24px">
        ${currentQuestion.options.map(option => `<button class="option ${state.answers[currentQuestion.id] === option.id ? 'selected' : ''}" data-id="${option.id}" aria-pressed="${state.answers[currentQuestion.id] === option.id}">${option.text}</button>`).join('')}
      </div>
      <div class="actions">
        ${button('Continuar', 'btn', `id="q-next" ${!state.answers[currentQuestion.id] ? 'disabled' : ''}`)}
        ${button('Voltar', 'btn ghost', 'id="q-back"')}
      </div>
    </section>
  `, resetViewport);

  document.querySelectorAll('#options button').forEach(item => {
    item.onclick = () => {
      state.answers[currentQuestion.id] = item.dataset.id;
      persist();
      trackEvent('question_answered', { questionId: currentQuestion.id });
      question(false);
    };
  });

  document.querySelector('#q-next').onclick = () => {
    if (questionBreak) {
      state.step = 'interstitial';
      state.interstitial = questionBreak.id;
      persist();
      interstitial();
      return;
    }

    if (state.qIndex < QUESTIONS.length - 1) {
      state.qIndex += 1;
      persist();
      question();
      return;
    }

    state.step = 'safety';
    persist();
    safety();
  };

  document.querySelector('#q-back').onclick = () => {
    if (state.qIndex) {
      state.qIndex -= 1;
      persist();
      question();
      return;
    }

    region();
  };
}

function interstitial(resetViewport = true) {
  const item = QUESTION_BREAKS.find(questionBreak => questionBreak.id === state.interstitial);

  if (!item) {
    state.interstitial = null;
    state.step = 'questions';
    persist();
    question();
    return;
  }

  const progress = Math.round((state.qIndex + 1) / QUESTIONS.length * 100);
  layout(`
    <section class="card testimonial-card" aria-labelledby="testimonial-title">
      <div class="progress-label"><span>Pausa rápida</span><span>${progress}% concluído</span></div>
      <div class="progress"><span style="width:${progress}%"></span></div>
      <p class="question-meta">${esc(item.eyebrow)}</p>
      <h2 id="testimonial-title">${esc(item.title)}</h2>
      <blockquote class="testimonial-quote">
        <p>${esc(item.quote)}</p>
        <footer>— ${esc(item.author)}</footer>
      </blockquote>
      <p class="small">${esc(item.note)}</p>
      <p class="testimonial-source-text"><strong>Fonte:</strong> ${esc(item.source)}</p>
      <div class="actions">
        ${button('Continuar avaliação', 'btn', 'id="story-next"')}
        ${button('Voltar à pergunta', 'btn ghost', 'id="story-back"')}
      </div>
    </section>
  `, resetViewport);

  document.querySelector('#story-next').onclick = () => {
    state.interstitial = null;
    state.qIndex += 1;
    state.step = 'questions';
    persist();
    question();
  };

  document.querySelector('#story-back').onclick = () => {
    state.interstitial = null;
    state.step = 'questions';
    persist();
    question();
  };
}

function safety(resetViewport = true) {
  const selectedFlags = state.safety.selectedRedFlags || [];
  const noFlags = state.safety.noRedFlagsConfirmed === true;
  const noneOption = position => `
    <label class="option ${noFlags ? 'selected' : ''}">
      <input type="checkbox" data-none="${position}" aria-label="Nenhum desses sinais está presente — ${position === 'top' ? 'início da lista' : 'fim da lista'}" ${noFlags ? 'checked' : ''}>
      <span>Nenhum desses sinais está presente</span>
    </label>`;

  layout(`
    <section class="card">
      <p class="question-meta">ETAPA 4 DE 4 · TRIAGEM DE SEGURANÇA</p>
      <h2>Antes do resultado, uma verificação importante</h2>
      <p class="lead">Marque somente os sinais que estejam presentes. Se nenhum se aplicar, escolha “Nenhum desses sinais está presente”.</p>
      <div class="option-grid" id="flags">
        ${noneOption('top')}
        ${RED_FLAGS.map(flag => `<label class="option ${selectedFlags.includes(flag.id) ? 'selected' : ''}"><input type="checkbox" value="${flag.id}" ${selectedFlags.includes(flag.id) ? 'checked' : ''}><span>${flag.text}</span></label>`).join('')}
        ${noneOption('bottom')}
      </div>
      <p class="small">Você pode marcar a primeira ou a última opção caso nenhum sinal esteja presente.</p>
      <div class="actions">
        ${button('Ver meu resultado', 'btn', 'id="finish"')}
        ${button('Voltar', 'btn ghost', 'id="safety-back"')}
      </div>
    </section>
  `, resetViewport);

  document.querySelectorAll('#flags input').forEach(input => {
    input.onchange = () => {
      if (input.dataset.none && input.checked) {
        state.safety.selectedRedFlags = [];
        state.safety.noRedFlagsConfirmed = true;
      } else if (input.dataset.none) {
        state.safety.noRedFlagsConfirmed = false;
      } else {
        state.safety.selectedRedFlags = [...document.querySelectorAll('#flags input:checked')]
          .filter(item => !item.dataset.none)
          .map(item => item.value);
        state.safety.noRedFlagsConfirmed = false;
      }

      state.safety.redFlagDetected = state.safety.selectedRedFlags.length > 0;
      persist();
      safety(false);
    };
  });

  document.querySelector('#finish').onclick = () => {
    const result = calculateResult(state);
    result.createdAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    trackEvent(result.safety.redFlagDetected ? 'red_flag_detected' : 'assessment_completed');
    layout(`
      <section class="card loading" role="status" aria-live="polite">
        <div class="spinner"></div>
        <h2>Estamos preparando seu resultado</h2>
        <p class="lead">Comparando os seis módulos e preparando seus gráficos...</p>
      </section>
    `, true);
    setTimeout(() => {
      location.href = 'resultado.html';
    }, 250);
  };

  document.querySelector('#safety-back').onclick = () => {
    state.qIndex = QUESTIONS.length - 1;
    question();
  };
}

if (state.step === 'basic') basic();
else if (state.step === 'region') region();
else if (state.step === 'questions') question();
else if (state.step === 'interstitial') interstitial();
else if (state.step === 'safety') safety();
else home();
