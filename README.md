# Mandala da Dor na Coluna

MVP estático de um funil educativo sobre padrões de sintomas na coluna. O projeto não fornece diagnóstico médico e mostra uma triagem de segurança antes de qualquer recomendação comercial.

## Executar localmente

Abra `index.html` em um servidor local. Por exemplo, com a extensão Live Server do VS Code ou `npx serve .`. Um servidor é recomendado porque os arquivos JavaScript usam módulos ES.

## Publicar

- **GitHub Pages:** envie os arquivos para um repositório, abra **Settings > Pages**, selecione a branch e a pasta raiz.
- **Netlify:** arraste a pasta do projeto em `app.netlify.com/drop` ou conecte o repositório. Não há etapa de build.
- **Vercel:** importe o repositório e escolha o preset **Other**. Diretório de saída: raiz do projeto.

Depois de apontar um domínio próprio, troque `mandaladacoluna.vercel.app` por ele em `index.html`, `robots.txt` e `sitemap.xml`; então envie o sitemap ao Google Search Console.

## Onde personalizar

- `js/config.js`: nome do projeto, contato, avisos, cores, imagens, preços e URLs dos seis produtos. Os links/imagens atuais são provisórios.
- `js/questions.js`: perguntas, alternativas e seus pontos por módulo.
- `js/scoring.js`: cálculo e normalização. Cada percentual é `pontuação obtida / maior pontuação possível por pergunta` e não uma probabilidade médica.
- `css/styles.css`: identidade visual e responsividade.

## Dados e integrações

### Privacidade da operação atual

- As respostas do questionário podem revelar dados de saúde e ficam somente no navegador, por até 24 horas após a última atividade.
- O usuário precisa aceitar a Política de Privacidade antes de persistir as respostas localmente.
- Para liberar e receber o relatório, o usuário confirma a Política, dá consentimento específico para usar as respostas de saúde na geração e no envio do PDF e confirma que controla o e-mail informado com um código temporário.
- WhatsApp é opcional. O Supabase recebe apenas nome, e-mail, WhatsApp se preenchido, escolha de marketing, metadados de consentimento e prazo de retenção. Respostas, pontuações, regiões e sinais de alerta não são enviados como lead.
- O registro mínimo possui prazo operacional de 90 dias. Defina uma rotina interna para eliminar ou anonimizar registros expirados, respeitando obrigações legais e solicitações de titulares.

Para adaptar a tabela existente, abra **SQL Editor** no Supabase e execute [`supabase.sql`](supabase.sql). A migração não apaga registros atuais, mas é obrigatória antes de publicar este código, pois inclui as colunas de consentimento e torna WhatsApp opcional. A integração usa somente a chave pública e uma política RLS de inserção; nunca inclua uma chave `service_role` no frontend. `trackEvent()` indica o ponto de integração com GA4 e pixels; não envie respostas de saúde, e-mail ou WhatsApp para plataformas de anúncios.

### E-mail transacional pela Brevo

A função protegida `api/send-assessment-email.js` primeiro envia um código temporário sem relatos de saúde. Só depois da confirmação ela prepara e envia o mesmo relatório gerado no navegador como anexo PDF. O arquivo não é gravado publicamente nem salvo no Supabase: ele permanece apenas na memória do navegador até ser transmitido por HTTPS à função da Vercel e à Brevo. Na Vercel, em **Settings → Environment Variables**, configure as variáveis somente no ambiente **Production**:

- `BREVO_API_KEY`: chave de API da Brevo.
- `BREVO_SENDER_EMAIL`: remetente já verificado na Brevo.
- `BREVO_SENDER_NAME`: nome que aparecerá no remetente, por exemplo `Mandala da Dor na Coluna`.
- `EMAIL_VERIFICATION_SECRET` (recomendado): segredo aleatório e exclusivo para assinar os códigos de confirmação. Ele permite trocar a chave da Brevo sem invalidar o mecanismo de confirmação.
- `PUBLIC_SITE_URL` (opcional): URL pública do site; atualmente `https://mandaladacoluna.vercel.app`.
- `BREVO_MARKETING_LIST_ID` (opcional): ID da lista da Brevo para quem marcou a autorização de marketing.

Nunca coloque `BREVO_API_KEY` ou `EMAIL_VERIFICATION_SECRET` no `js/config.js`, no GitHub ou em outro arquivo público. Depois de salvar as variáveis, faça um novo deploy pela Vercel ou envie um novo commit. O e-mail transacional é enviado sem criar contato de marketing; a Brevo só recebe/cria o contato na lista de marketing quando a pessoa marcar a autorização opcional. O anexo é limitado a 2,5 MB antes da codificação; se ele não puder ser anexado, a pessoa recebe a confirmação e ainda poderá baixar o PDF diretamente no site. O e-mail não contém as respostas completas do questionário, sinal de alerta nem recomendação de módulo.

## PDF e testes

O PDF usa jsPDF e os gráficos Chart.js por CDN. Conclua uma avaliação, preencha o formulário de liberação e confirme o código enviado ao e-mail. O site manterá o botão **Baixar relatório em PDF** disponível mesmo se a entrega do e-mail falhar. Verifique: gráficos visíveis, texto sem corte, nome com acentos, código recebido, anexo recebido, link clicável do produto e o comportamento no Safari do iPhone (onde o PDF pode abrir em prévia). A triagem com qualquer sinal de alerta deve exibir prioridade profissional e ocultar a recomendação comercial principal.

## Novos módulos

Adicione primeiro o módulo em `MODULES` e o produto correspondente em `MODULE_PRODUCTS`, depois inclua a nova chave nas funções de pontuação e nas perguntas. Atualize gráficos e textos para refletir a mudança.

## Privacidade e saúde

As páginas `privacidade.html`, `termos.html` e `aviso-saude.html` já estão ligadas no `config.js`. O aceite de marketing é separado do consentimento necessário para gerar e enviar o relatório. Antes de publicidade em escala, mudanças de fornecedores ou criação de integrações de analytics, valide as práticas com assessoria jurídica e atualize a Política.

O arquivo `vercel.json` adiciona cabeçalhos básicos de segurança para a publicação na Vercel.
