import { STORAGE_KEY } from './config.js';
import { QUESTIONS } from './questions.js';

function mountResponseSummary() {
  const chart = document.querySelector('#module-chart');
  if (!chart || document.querySelector('#response-summary')) return false;
  const result = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  const selections = QUESTIONS.map(question => {
    const option = question.options.find(item => item.id === result?.answers?.[question.id]);
    return option ? { theme: question.theme, text: option.text } : null;
  }).filter(Boolean);
  if (!selections.length) return false;
  const section = document.createElement('section');
  section.id = 'response-summary';
  section.className = 'card';
  section.innerHTML = `<h2>Principais relatos selecionados</h2><p class="small">Este resumo reproduz suas escolhas no questionário e ajuda a contextualizar o resultado educativo.</p><ul class="detail-list">${selections.slice(0,8).map(item => `<li><strong>${item.theme}:</strong> ${item.text}</li>`).join('')}</ul>${selections.length > 8 ? `<p class="small">Mais ${selections.length - 8} respostas foram consideradas no cálculo.</p>` : ''}`;
  chart.closest('section').before(section);
  return true;
}

if (!mountResponseSummary()) new MutationObserver(() => mountResponseSummary()).observe(document.body, { childList: true, subtree: true });
