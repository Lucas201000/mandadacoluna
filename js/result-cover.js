import { STORAGE_KEY } from './config.js';
import { calculateResult } from './scoring.js';

const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
const art = document.querySelector('.product-art');

if (stored?.answers && art) {
  const product = calculateResult(stored).recommendedProduct;
  art.classList.add('result-cover');
  art.style.backgroundImage = `url("${product.image}")`;
  art.setAttribute('aria-label', `Capa do ${product.name}`);
  art.textContent = '';
}
