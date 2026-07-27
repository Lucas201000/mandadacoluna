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

O progresso é armazenado em `localStorage`. Para salvar leads no Supabase, abra **SQL Editor** no projeto e execute [`supabase.sql`](supabase.sql). A integração usa somente a chave pública e uma política RLS de inserção; nunca inclua uma chave `service_role` no frontend. `trackEvent()` indica o ponto de integração com GA4 e pixels.

## PDF e testes

O PDF usa jsPDF e os gráficos Chart.js por CDN. Conclua uma avaliação, preencha o formulário de liberação e acione **Baixar relatório em PDF**. Verifique: gráficos visíveis, texto sem corte, nome com acentos, link clicável do produto e o comportamento no Safari do iPhone (onde o PDF pode abrir em prévia). A triagem com qualquer sinal de alerta deve exibir prioridade profissional e ocultar a recomendação comercial principal.

## Novos módulos

Adicione primeiro o módulo em `MODULES` e o produto correspondente em `MODULE_PRODUCTS`, depois inclua a nova chave nas funções de pontuação e nas perguntas. Atualize gráficos e textos para refletir a mudança.

## Privacidade e saúde

As páginas `privacidade.html`, `termos.html` e `aviso-saude.html` já estão ligadas no `config.js`. Revise seus textos, preencha responsável e canal de contato e valide juridicamente antes da publicação comercial. O aceite de marketing é separado do aceite necessário para gerar o relatório.

O arquivo `vercel.json` adiciona cabeçalhos básicos de segurança para a publicação na Vercel.
