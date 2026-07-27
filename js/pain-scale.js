import { STORAGE_KEY } from './config.js';

function mountPainScale() {
  const chart = document.querySelector('#module-chart');
  if (!chart || document.querySelector('#pain-scale-card')) return false;
  const result = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  const intensity = Math.max(0, Math.min(10, Number(result?.pain?.intensity ?? 0)));
  const card = document.createElement('section');
  card.className = 'card pain-scale-card';
  card.id = 'pain-scale-card';
  card.innerHTML = `<h2>Intensidade informada</h2><div class="pain-scale" aria-label="Intensidade informada: ${intensity} de 10">${Array.from({length:11},(_,i)=>`<span class="pain-step ${i<=intensity?'active':''}" data-level="${i}">${i}</span>`).join('')}</div><div class="pain-labels"><span>Leve · 0 a 3</span><span>Moderada · 4 a 6</span><span>Intensa · 7 a 10</span></div><p class="small">Você informou <strong>${intensity}/10</strong>. Esta escala organiza a intensidade relatada e não representa gravidade clínica isolada.</p>`;
  chart.closest('section').before(card);
  return true;
}

if (!mountPainScale()) new MutationObserver(() => mountPainScale()).observe(document.body, { childList: true, subtree: true });
