import { PROJECT, MODULES, trackEvent } from './config.js';

const PAGE = {
  width: 210,
  height: 297,
  margin: 16,
  contentWidth: 178,
  footerY: 290
};

const MM_PER_POINT = 0.352778;

function dateLabel(iso) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

function safeName(name) {
  return (name || 'usuario')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase();
}

function resolveProductUrl(product) {
  const configuredUrl = product?.trialUrl || product?.productUrl || PROJECT.flowlinkUrl || PROJECT.storefrontUrl;
  if (!configuredUrl) return '';

  try {
    return new URL(configuredUrl, window.location.href).href;
  } catch {
    return '';
  }
}

function textHeight(pdf, lines, lineHeightFactor = 1.3) {
  return Math.max(1, lines.length) * pdf.getFontSize() * MM_PER_POINT * lineHeightFactor;
}

function writeWrappedText(pdf, text, x, y, { maxWidth = PAGE.contentWidth, lineHeightFactor = 1.3 } = {}) {
  const lines = pdf.splitTextToSize(String(text || ''), maxWidth);
  pdf.text(lines, x, y, { lineHeightFactor });
  return y + textHeight(pdf, lines, lineHeightFactor);
}

function addFooter(pdf) {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(90);
  writeWrappedText(
    pdf,
    'Este relatório possui finalidade educativa e não substitui avaliação, diagnóstico ou tratamento profissional.',
    PAGE.margin,
    PAGE.footerY,
    { maxWidth: 154, lineHeightFactor: 1.15 }
  );
  pdf.text(`Página ${pdf.getNumberOfPages()}`, PAGE.width - PAGE.margin, PAGE.footerY, { align: 'right' });
}

function addTitle(pdf, heading, subheading) {
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(24, 50, 47);
  pdf.setFontSize(24);
  let y = writeWrappedText(pdf, heading, PAGE.margin, 28, { lineHeightFactor: 1.05 });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(90);
  y = writeWrappedText(pdf, subheading, PAGE.margin, y + 3, { lineHeightFactor: 1.3 });

  return y;
}

function getChartImage(chart) {
  const source = chart?.canvas;
  if (!source?.width || !source?.height || typeof chart.toBase64Image !== 'function') return null;

  // Uma cópia com fundo branco evita transparência escura em alguns leitores de PDF
  // e limita o tamanho do bitmap para a geração continuar leve no celular.
  const scale = Math.min(1, 1600 / source.width, 1200 / source.height);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height
  };
}

function addContainedChart(pdf, chart, { x, y, width, height }) {
  const image = getChartImage(chart);
  if (!image) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(90);
    pdf.text('O gráfico não ficou disponível nesta geração.', x, y + 8);
    return null;
  }

  // Nunca força largura e altura ao mesmo tempo sem respeitar a proporção original.
  // Isso impede que gráficos fiquem esticados ou achatados no PDF.
  const imageRatio = image.width / image.height;
  let drawWidth = width;
  let drawHeight = drawWidth / imageRatio;

  if (drawHeight > height) {
    drawHeight = height;
    drawWidth = drawHeight * imageRatio;
  }

  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  pdf.addImage(image.dataUrl, 'PNG', drawX, drawY, drawWidth, drawHeight);

  return { x: drawX, y: drawY, width: drawWidth, height: drawHeight };
}

function waitForChartsToPaint() {
  if (typeof window.requestAnimationFrame !== 'function') return Promise.resolve();
  return new Promise(resolve => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });
}

async function buildAssessmentPdf(result, charts) {
  if (!window.jspdf?.jsPDF) {
    throw new Error('A biblioteca de PDF não foi carregada.');
  }

  // Garante que a captura acontece somente depois de o Chart.js terminar o desenho.
  await waitForChartsToPaint();

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const primary = MODULES[result.primaryModule];
  const product = result.recommendedProduct || {};
  const productUrl = resolveProductUrl(product);
  const productName = product.name || `Módulo ${primary.id}`;
  const productDescription = product.shortDescription || primary.recommendation;

  // Capa
  const coverTitleBottom = addTitle(pdf, PROJECT.name, 'Relatório educativo personalizado');
  const coverCardY = Math.max(52, coverTitleBottom + 9);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(21);
  const nameLines = pdf.splitTextToSize(result.user.firstName || 'Sua avaliação', 160);
  const nameHeight = textHeight(pdf, nameLines, 1.05);
  const coverCardHeight = Math.max(42, nameHeight + 31);
  pdf.setFillColor(primary.color);
  pdf.roundedRect(PAGE.margin, coverCardY, PAGE.contentWidth, coverCardHeight, 5, 5, 'F');
  pdf.setTextColor(255);
  pdf.text(nameLines, 24, coverCardY + 18, { lineHeightFactor: 1.05 });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  const coverDateY = coverCardY + 18 + nameHeight + 4;
  pdf.text(dateLabel(result.createdAt), 24, coverDateY);
  pdf.text('Resultado educativo personalizado', 24, coverDateY + 8);
  addFooter(pdf);

  // Resumo
  pdf.addPage();
  let y = addTitle(pdf, 'Resumo da sua avaliação', 'Informações relatadas durante o questionário.') + 10;
  pdf.setTextColor(30);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(13);
  y = writeWrappedText(pdf, `Intensidade informada: ${result.pain.intensity}/10`, PAGE.margin, y) + 4;
  y = writeWrappedText(pdf, `Região: ${result.pain.additionalRegions.join(', ') || 'Não informada'}`, PAGE.margin, y, { maxWidth: 170 }) + 4;
  y = writeWrappedText(pdf, `Duração: ${result.pain.duration || 'Não informada'}`, PAGE.margin, y) + 7;
  pdf.setFont('helvetica', 'bold');
  y = writeWrappedText(pdf, `Perfil predominante: Módulo ${primary.id} - ${primary.name}`, PAGE.margin, y, { maxWidth: 175, lineHeightFactor: 1.35 }) + 4;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  y = writeWrappedText(pdf, primary.description, PAGE.margin, y, { maxWidth: 175, lineHeightFactor: 1.5 }) + 6;
  y = writeWrappedText(
    pdf,
    `Perfis secundários: ${result.secondaryModules.map(key => `Módulo ${MODULES[key].id} - ${MODULES[key].short}`).join(' - ') || 'Não informado'}`,
    PAGE.margin,
    y,
    { maxWidth: 175, lineHeightFactor: 1.45 }
  ) + 7;

  if (result.safety.redFlagDetected) {
    pdf.setTextColor(160, 40, 40);
    pdf.setFont('helvetica', 'bold');
    writeWrappedText(pdf, 'Atenção: suas respostas incluem sinais que merecem avaliação profissional.', PAGE.margin, y, { maxWidth: 175, lineHeightFactor: 1.45 });
    pdf.setFont('helvetica', 'normal');
  }
  addFooter(pdf);

  // Gráficos
  pdf.addPage();
  addTitle(pdf, 'Gráficos educativos', 'As porcentagens mostram compatibilidade relatada, não probabilidade de doença ou diagnóstico.');
  addContainedChart(pdf, charts?.bars, { x: PAGE.margin, y: 52, width: PAGE.contentWidth, height: 88 });
  addContainedChart(pdf, charts?.donut, { x: 46, y: 150, width: 118, height: 92 });
  addFooter(pdf);

  // Interpretação
  pdf.addPage();
  y = addTitle(pdf, 'Interpretação educativa', 'Este conteúdo organiza os padrões relatados, sem substituir uma avaliação profissional.') + 11;
  pdf.setTextColor(30);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  y = writeWrappedText(pdf, 'Padrão predominante', PAGE.margin, y) + 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  y = writeWrappedText(pdf, primary.description, PAGE.margin, y, { maxWidth: 175, lineHeightFactor: 1.55 }) + 11;
  pdf.setFont('helvetica', 'bold');
  y = writeWrappedText(pdf, 'Orientação inicial', PAGE.margin, y) + 5;
  pdf.setFont('helvetica', 'normal');
  y = writeWrappedText(pdf, primary.recommendation, PAGE.margin, y, { maxWidth: 175, lineHeightFactor: 1.55 }) + 11;
  pdf.setFont('helvetica', 'bold');
  y = writeWrappedText(pdf, 'Respostas de segurança', PAGE.margin, y) + 5;
  pdf.setFont('helvetica', 'normal');
  writeWrappedText(
    pdf,
    result.safety.redFlagDetected
      ? 'Há sinais selecionados. Procure avaliação profissional conforme a urgência percebida.'
      : 'Nenhum sinal de alerta foi selecionado nesta triagem. Isso não substitui uma avaliação profissional.',
    PAGE.margin,
    y,
    { maxWidth: 175, lineHeightFactor: 1.55 }
  );
  addFooter(pdf);

  // Próximo passo. Não exibe chamada comercial em casos com sinais de alerta.
  pdf.addPage();
  const nextTitleBottom = addTitle(
    pdf,
    result.safety.redFlagDetected ? 'Próximo passo com prioridade' : `Conheça o Módulo ${primary.id}`,
    result.safety.redFlagDetected
      ? 'Priorize atendimento profissional antes de considerar uma recomendação comercial.'
      : 'Acesse o conteúdo correspondente ao perfil predominante.'
  );
  const productCardY = Math.max(55, nextTitleBottom + 9);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  const productNameLines = pdf.splitTextToSize(productName, 160);
  const productNameHeight = textHeight(pdf, productNameLines, 1.2);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const productDescriptionLines = pdf.splitTextToSize(productDescription, 160);
  const productDescriptionHeight = textHeight(pdf, productDescriptionLines, 1.35);
  const productCardHeight = Math.max(48, 18 + productNameHeight + 5 + productDescriptionHeight + 12);
  pdf.setFillColor(primary.color);
  pdf.roundedRect(PAGE.margin, productCardY, PAGE.contentWidth, productCardHeight, 5, 5, 'F');
  pdf.setTextColor(255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(productNameLines, 24, productCardY + 18, { lineHeightFactor: 1.2 });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(productDescriptionLines, 24, productCardY + 23 + productNameHeight, { lineHeightFactor: 1.35 });

  if (!result.safety.redFlagDetected && productUrl) {
    const buttonY = productCardY + productCardHeight + 15;
    pdf.setFillColor(primary.color);
    pdf.roundedRect(PAGE.margin, buttonY, PAGE.contentWidth, 16, 4, 4, 'F');
    pdf.setTextColor(255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(`Acessar o Módulo ${primary.id}`, PAGE.margin + 8, buttonY + 11);
    pdf.link(PAGE.margin, buttonY, PAGE.contentWidth, 16, { url: productUrl });

    pdf.setTextColor(24, 50, 47);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const urlY = buttonY + 27;
    writeWrappedText(pdf, `Caso o botão não abra, acesse: ${productUrl}`, PAGE.margin, urlY, { maxWidth: 175, lineHeightFactor: 1.35 });
    // Mantém uma segunda área clicável sobre o endereço escrito.
    pdf.link(PAGE.margin, urlY - 5, PAGE.contentWidth, 18, { url: productUrl });
  }
  addFooter(pdf);

  const date = new Date(result.createdAt);
  const name = `avaliacao-mandala-da-dor-${safeName(result.user.firstName)}-${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}.pdf`;

  return { pdf, filename: name };
}

function arrayBufferToBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }

  return window.btoa(binary);
}

// Gera o mesmo arquivo usado no download, mas sem iniciar um download automático.
// O conteúdo fica apenas na memória do navegador até ser enviado pelo HTTPS à função da Vercel.
export async function createPdfAttachment(result, charts) {
  const { pdf, filename } = await buildAssessmentPdf(result, charts);
  const arrayBuffer = pdf.output('arraybuffer');

  return {
    name: filename,
    content: arrayBufferToBase64(arrayBuffer),
    size: arrayBuffer.byteLength
  };
}

export async function generatePdf(result, charts) {
  const { pdf, filename } = await buildAssessmentPdf(result, charts);
  pdf.save(filename);
  trackEvent('pdf_generated');
  trackEvent('pdf_downloaded');

  return { filename };
}
