# Backup de continuidade — Mandala da Dor na Coluna

Atualizado em: 22 de agosto de 2026  
Projeto: **Mandala da Dor na Coluna**  
Responsável: **Lucas Gadoti Servelin — CREFITO 275401-F**

Este arquivo é um backup operacional para iniciar outra conversa sem perder o contexto relevante do projeto. Ele resume as decisões, o estado atual do código e as pendências da Mandala. Não inclui chaves, tokens ou senhas que tenham aparecido na conversa.

---

## Prompt de retomada — copie a partir daqui em uma nova conversa

```text
Você está dando continuidade ao projeto “Mandala da Dor na Coluna”, da Clínica Setterlin. Leia integralmente o arquivo BACKUP-CONTINUIDADE-MANDALA-2026-08-22.md antes de propor qualquer alteração. Trabalhe somente na Mandala da Dor; não misture este projeto com a plataforma interna Fisio Care Hub, planos de treinamento, área do cliente ou qualquer outro sistema.

Mantenha todos os requisitos de segurança e linguagem de saúde descritos no backup. Antes de editar, inspecione o repositório e preserve alterações não relacionadas. Para mudanças no site, implemente, teste e publique no GitHub/Vercel quando solicitado. Ao finalizar, informe de forma objetiva o que mudou, os arquivos afetados, como foi validado e o link atualizado.
```

---

## 1. Objetivo do projeto

Criar uma aplicação web estática, responsiva e voltada para conversão chamada **Mandala da Dor na Coluna**. O visitante responde a um questionário sobre seus relatos de dor na coluna, recebe um **resultado educativo** com os seis perfis da Mandala, vê gráficos, libera um relatório em PDF e pode acessar o módulo educativo correspondente.

O objetivo é organizar relatos e encaminhar a pessoa para um conteúdo educativo adequado, sem realizar diagnóstico médico, prescrever tratamento individual ou prometer cura.

### Público e tom

- Pessoas leigas com dor ou desconforto na coluna.
- Linguagem simples, acolhedora e objetiva.
- Conteúdo técnico deve ficar traduzido para linguagem comum, sem perder o contexto do sintoma relatado.
- Prioridade visual: celular, especialmente Safari no iPhone.

---

## 2. Regras clínicas e de linguagem — inegociáveis

Esta Mandala possui finalidade educativa. O questionário **não substitui avaliação, diagnóstico ou tratamento profissional**.

Usar expressões como:

- “perfil predominante”;
- “padrão de sintomas”;
- “resultado educativo”;
- “compatibilidade relatada”;
- “seus relatos apresentam características semelhantes a”.

Nunca usar expressões como:

- “você tem”;
- “seu diagnóstico é”;
- “essa é a causa exata”;
- “esse tratamento vai curar”.

Se a triagem identificar sinal de alerta, a prioridade visual e textual é procurar avaliação profissional. Nesse caso, a chamada comercial principal não deve aparecer como mensagem principal.

O arquivo `MANDALA-BASE-TECNICA.md` documenta princípios educacionais inspirados em referências de biomecânica e cinesiologia. Ele deve orientar clareza e coerência do questionário, nunca ser usado para transformar o resultado em diagnóstico.

---

## 3. Canais e links atuais

| Item | Valor atual |
|---|---|
| Site publicado | https://mandaladacoluna.vercel.app |
| Repositório | https://github.com/Lucas201000/mandadacoluna |
| Branch de produção | `main` |
| Commit de referência | `844c275` — Move opção neutra para triagem de segurança |
| Vitrine | `https://mandaladacoluna.vercel.app/vitrine.html` |
| Flowlink — entrada geral | `https://app-do-lucas.flowlink-app.online` |
| E-mail da clínica | `clinicasetterlin@gmail.com` |
| WhatsApp da clínica | `5515996592799` |

O deploy ocorre automaticamente pela Vercel após `git push origin main`.

---

## 4. Estrutura relevante do projeto

```text
/
├── index.html                 # Funil/questionário
├── resultado.html             # Resultado, gráficos, lead e PDF
├── vitrine.html               # Vitrine dos seis módulos
├── privacidade.html           # Página legal
├── termos.html                # Página legal
├── aviso-saude.html           # Página legal
├── css/
│   ├── styles.css             # Identidade visual principal e responsividade
│   ├── mobile-ux.css          # Ajustes de UX para celular
│   ├── module-covers.css      # Capas dos módulos
│   ├── storefront-content.css # Vitrine e depoimentos
│   ├── pain-scale.css         # Escala visual da intensidade
│   └── print.css              # Impressão
├── js/
│   ├── app.js                 # Navegação, etapas e triagem de segurança
│   ├── questions.js           # Perguntas e pontuações — não colocar no HTML
│   ├── scoring.js             # Pontuação e compatibilidade educativa
│   ├── results.js             # Página de resultado
│   ├── charts.js              # Chart.js
│   ├── pdf-generator.js       # jsPDF e link clicável do módulo
│   ├── lead.js                # Formulário, Supabase e Brevo
│   ├── config.js              # Central de configuração
│   ├── storefront.js          # Vitrine e módulo recomendado
│   ├── storefront-content.js  # Conteúdo adicional da vitrine
│   ├── result-cover.js        # Capa do resultado
│   ├── response-summary.js    # Resumo de respostas
│   ├── pain-scale.js          # Renderização da escala de dor
│   └── share.js               # Compartilhamento
├── api/send-assessment-email.js # Função Vercel/Brevo
├── assets/images/produto-modulo-1.jpg ... produto-modulo-6.jpg
├── supabase.sql
├── README.md
├── TAREFAS-PENDENTES.md
├── MANDALA-BASE-TECNICA.md
├── PROMPT-AUDITORIA-MANDALA.md
└── PROMPT-AUDITORIA-PROFISSIONAL-MANDALA.md
```

### Atenção ao diretório de trabalho

Existem muitos arquivos não rastreados no repositório ligados a outros projetos internos e arquivos temporários. Não adicionar, remover, mover ou publicar esses arquivos ao trabalhar na Mandala sem autorização explícita. Os arquivos da Mandala acima são a fonte de verdade para este projeto.

---

## 5. Os seis módulos da Mandala

| Nº | Chave | Nome | Cor da Mandala |
|---:|---|---|---|
| 1 | `inflamatoria` | Dor inflamatória ou irritada | `#D84A4A` |
| 2 | `muscular` | Dor muscular por tensão ou contratura | `#F2993A` |
| 3 | `compressao` | Dor associada a compressão ou sensibilidade nervosa | `#55A85A` |
| 4 | `rigidez` | Dor associada a rigidez ou falta de mobilidade | `#39A9B8` |
| 5 | `encurtamento` | Dor associada a encurtamento muscular | `#7A4FA3` |
| 6 | `instabilidade` | Dor associada a instabilidade, falta de força ou controle | `#3569B7` |

Essas cores devem ser preservadas em gráficos e diferenciação dos perfis. Elas não devem dominar a interface geral.

---

## 6. Identidade visual atual — Clínica Setterlin

Em 17/08/2026, a Mandala foi ajustada para usar a identidade da Clínica Setterlin de modo leve e profissional.

### Cores de interface

- Azul profundo da clínica (botões e estrutura): `#12435B`;
- Azul profundo no hover: `#0D3347`;
- Turquesa da clínica (destaques): `#45D3C1`;
- Turquesa claro (fundos leves): `#E8FAF7`;
- Azul acinzentado: `#7187A3`;
- Texto principal: `#11374D`;
- Texto secundário: `#61758A`;
- Fundo: `#F4F8F8`;
- Bordas: `#D5E5E7`.

Princípios de design:

- Interface limpa, cartões brancos, sombras leves e bastante respiro.
- Botões principais em azul profundo; turquesa para detalhes e estados suaves.
- Não usar cores fortes em excesso.
- Manter áreas de toque grandes e fonte mínima adequada para celular.
- O símbolo no topo usa uma variação visual suave da paleta, enquanto a Mandala mantém as seis cores nos resultados.

Os meta `theme-color` de `index.html`, `resultado.html` e `vitrine.html` já usam `#12435B`.

---

## 7. Funil implementado

### Etapas da avaliação

1. Página inicial com explicação, benefícios e aviso educativo.
2. Dados básicos: primeiro nome, faixa etária, duração e intensidade de 0 a 10.
3. Localização: região principal/adicionais e se a sensação fica concentrada ou se espalha.
4. Questionário de 18 perguntas, uma por tela, com barra de progresso, voltar, persistência e pontuação separada do HTML.
5. Triagem de segurança antes do resultado.
6. Resultado educativo: perfil predominante, dois secundários, gráfico de barras, gráfico de principais perfis, intensidade e orientação.
7. Captura de lead antes do relatório completo/PDF: nome, e-mail, WhatsApp, aceite de privacidade e marketing opcional.
8. PDF personalizado com gráficos e link clicável para o módulo recomendado.
9. Vitrine educativa com o módulo indicado em destaque e os demais módulos disponíveis.

### Pontuação

- As perguntas e pontos estão em `js/questions.js`.
- Cada alternativa pode somar 0 a 5 para vários módulos.
- `js/scoring.js` calcula a compatibilidade por `pontuação obtida / pontuação máxima possível no módulo × 100`, limitada a 100.
- O percentual é **compatibilidade relatada educativa**, não probabilidade clínica ou diagnóstico.
- Alterar respostas e voltar no funil recalcula corretamente ao finalizar.

---

## 8. Estado importante da triagem de segurança

Arquivo principal: `js/app.js`, função `safety()`.

Os sinais de alerta são definidos em `RED_FLAGS` no fim de `js/questions.js`:

- perda importante/progressiva de força;
- dificuldade súbita para caminhar;
- perda de controle urinário ou intestinal;
- dormência na região íntima;
- acidente ou trauma importante;
- febre associada à dor;
- perda de peso inexplicada;
- dor intensa/progressiva;
- histórico ou sintoma preocupante;
- dor noturna intensa sem mudança com posição.

### Última correção publicada

O usuário apontou corretamente que a opção “nenhuma das alternativas” deveria estar na **triagem de sinais de alerta**, e não na pergunta 18 de perfis.

Estado publicado:

- A pergunta 18 permanece com os seis perfis da Mandala, sem resposta neutra adicional.
- A tela “ETAPA 4 DE 4 · TRIAGEM DE SEGURANÇA” contém a opção:
  **“Nenhum desses sinais está presente”**.
- Ao marcar essa opção, `selectedRedFlags` é limpo e `redFlagDetected` fica `false`.
- Ao escolher qualquer sinal de alerta, a opção neutra é desmarcada.
- A tela mostra o auxílio: “Se nenhuma alternativa se aplicar a você, marque a última opção.”

Essa lógica está no commit `844c275` e foi confirmada na Vercel.

---

## 9. Produtos, Flowlink e experiência desejada

### Regra comercial no site

- Não mostrar preço dos módulos na Mandala ou na vitrine.
- O botão público usa “Acessar o Módulo X”, sem mencionar Flowlink visivelmente.
- A pessoa deve abrir o módulo correspondente ao perfil predominante.
- A intenção é permitir que ela assista à **primeira aula gratuita**.
- Ao tentar assistir à segunda aula, deve ver a chamada para comprar e desbloquear o restante.

### Fluxo final desejado no Flowlink

1. Cada módulo possui uma página pública e um link próprio.
2. A primeira aula é aberta sem compra.
3. A partir da segunda aula, o conteúdo fica bloqueado.
4. A área bloqueada apresenta um botão de checkout do produto correspondente.
5. Após compra na Hotmart, a pessoa recebe acesso ao módulo comprado.
6. O combo libera os seis módulos.
7. O acesso deveria funcionar sem criar uma barreira de login desnecessária; caso a plataforma exija identificação, usar apenas e-mail de forma simples.

### Situação técnica atual

`js/config.js` contém `FLOWLINK_TRIAL_URLS` para os seis módulos, mas todos estão vazios. Por isso, enquanto não houver links individuais confirmados, os CTAs levam para a entrada geral do Flowlink:

`https://app-do-lucas.flowlink-app.online`

Quando o responsável pelo Flowlink entregar links públicos individuais, preencher somente:

```js
export const FLOWLINK_TRIAL_URLS = {
  inflamatoria: 'URL-DO-MODULO-1',
  muscular: 'URL-DO-MODULO-2',
  compressao: 'URL-DO-MODULO-3',
  rigidez: 'URL-DO-MODULO-4',
  encurtamento: 'URL-DO-MODULO-5',
  instabilidade: 'URL-DO-MODULO-6'
};
```

Não espalhar esses links por outros arquivos. O PDF e a vitrine usam a configuração central.

### Hotmart

Os IDs existentes em `js/config.js` são apenas para conferência interna, não são links de checkout:

| Módulo | ID Hotmart |
|---|---:|
| 1 — Inflamatória | `8200610` |
| 2 — Muscular | `8200634` |
| 3 — Compressão | `8200662` |
| 4 — Rigidez | `8200755` |
| 5 — Encurtamento | `8201776` |
| 6 — Instabilidade | `8201801` |

O ID do combo ainda não foi preenchido. Houve conversas sobre preço e garantia, mas como o site não deve mostrar preço, a configuração comercial final deve ser validada diretamente na Hotmart antes de alterar qualquer texto.

### Documento já criado para o responsável do Flowlink

Existe um PDF local com a especificação do fluxo desejado:

`output/pdf/especificacao-fluxo-degustacao-flowlink.pdf`

Ele descreve primeira aula gratuita, paywall a partir da segunda, integração de compra e critérios de aceite. Não alterar o fluxo do site para simular links individuais sem ter os links reais.

---

## 10. Leads, Supabase e Brevo

### Supabase

- Projeto configurado: `dsgsksamlcyfrqrthjpa`.
- A tabela é `assessment_leads`.
- O script de criação/configuração está em `supabase.sql`.
- A aplicação usa apenas uma chave pública no frontend, com RLS para inserção.
- Não colocar uma chave `service_role` no frontend, no GitHub ou em backups.

`saveLead()` fica em `js/config.js`. O progresso da avaliação também fica temporariamente em `localStorage` sob `mandalaDorAssessmentV1`.

### Brevo

- O formulário envia lead pelo fluxo existente depois do aceite necessário.
- O marketing é opcional e separado do aceite de privacidade.
- A lista Brevo “Mandala — conteúdos autorizados” foi criada com ID `3`.
- A função Vercel `api/send-assessment-email.js` trata do e-mail transacional.
- O e-mail transacional já foi testado com sucesso no Gmail em conversa anterior.

Na Vercel, as variáveis de ambiente esperadas são:

```text
BREVO_API_KEY
BREVO_SENDER_EMAIL
BREVO_SENDER_NAME
PUBLIC_SITE_URL
BREVO_MARKETING_LIST_ID
```

Nunca copiar valores de API, tokens, senhas ou chaves para documentos, código público ou chat. Caso uma chave tenha sido compartilhada em algum chat, é recomendável revogá-la e criar outra na respectiva plataforma.

---

## 11. PDF, gráficos e vitrine

### Resultado e PDF

- Chart.js gera o gráfico de barras dos seis módulos e a distribuição dos perfis.
- jsPDF gera o PDF personalizado.
- O PDF contém link externo clicável para o módulo recomendado.
- Antes de gerar o PDF, os gráficos devem estar renderizados.
- Em iPhone/Safari, o navegador pode abrir uma prévia antes do download; isso é esperado.
- Evitar clique duplo criar PDFs duplicados — o botão é desabilitado durante a geração.

### Vitrine

Endereço: `vitrine.html?produto=compressao` (substitua pelo slug desejado).

- Lê o parâmetro `produto`.
- Destaca o módulo correspondente.
- Exibe os seis módulos.
- Usa capas em `assets/images/produto-modulo-1.jpg` até `produto-modulo-6.jpg`.
- Contém conteúdo educativo, depoimentos provisórios e links legais.
- Os depoimentos atuais são ilustrativos e devem ser substituídos somente por relatos reais, autorizados e revisados.

---

## 12. Páginas legais e privacidade

Já existem e estão conectadas:

- `privacidade.html`;
- `termos.html`;
- `aviso-saude.html`.

Elas são essenciais antes de tráfego pago e captura de dados. Devem passar por revisão jurídica final antes de uma campanha comercial em escala.

O arquivo `vercel.json` inclui cabeçalhos básicos de segurança.

---

## 13. Métricas e eventos

Existe a função central `trackEvent(eventName, eventData)` em `js/config.js`. Atualmente registra no console e possui comentários para GA4, Meta Pixel, TikTok Pixel ou API futura.

Eventos preparados incluem:

- `assessment_started`;
- `personal_data_completed`;
- `body_region_selected`;
- `question_answered`;
- `red_flag_detected`;
- `assessment_completed`;
- `result_viewed`;
- `lead_submitted`;
- `pdf_generated`;
- `pdf_downloaded`;
- `trial_lesson_clicked`;
- `storefront_viewed`;
- `product_checkout_clicked`;
- `assessment_restarted`.

O usuário pediu para deixar Google Analytics e Meta Pixel para depois. Não incluir IDs reais, pixels ou cookies de marketing sem consentimento e sem receber os IDs corretos.

---

## 14. Auditorias já executadas

Foram criados dois prompts/documentos de auditoria:

- `PROMPT-AUDITORIA-MANDALA.md`;
- `PROMPT-AUDITORIA-PROFISSIONAL-MANDALA.md`.

Melhorias já realizadas durante auditorias:

- linguagem das perguntas simplificada sem perder contexto;
- indicação de que a primeira região selecionada é a principal;
- capa/imagem dos módulos na vitrine;
- detalhes expansíveis da vitrine;
- responsividade e áreas de toque mobile;
- correção de checkbox visual duplicado na triagem;
- retirada do nome Flowlink da interface pública;
- CTAs adaptados para “Acessar o Módulo X”;
- uso da paleta leve da Clínica Setterlin;
- opção neutra corrigida no local certo da triagem de segurança.

Nos testes visuais anteriores não houve erros de console nem rolagem horizontal indevida. Mesmo assim, testar sempre depois de alterações relevantes, especialmente no iPhone.

---

## 15. Pendências priorizadas

### Antes de divulgar / vender

- Confirmar publicação dos seis produtos na Hotmart, garantia e checkout.
- Criar e confirmar o combo de seis módulos com duração de acesso definida.
- Criar e publicar as aulas experimentais dos seis módulos.
- Receber do Flowlink os seis links públicos individuais e preencher `FLOWLINK_TRIAL_URLS`.
- Testar compra real e liberação do módulo correto no Flowlink.
- Revisar juridicamente as páginas legais antes de tráfego pago.

### E-mail e relacionamento

- Finalizar automações de e-mail na Brevo apenas para quem autorizou marketing.
- Revisar remetente, endereço de resposta e domínio de envio.
- Não utilizar o perfil de dor para personalização comercial sem aceite específico para essa finalidade.

### Métricas e tráfego pago

- Obter e configurar ID de Google Analytics 4.
- Obter e configurar ID de Meta Pixel.
- Criar banner/preferências de consentimento antes de ativar métricas de marketing.
- Configurar UTMs e validar eventos.

### Marca e conteúdo

- Conectar domínio próprio na Vercel quando disponível.
- Revisar imagens finais dos módulos.
- Trocar depoimentos ilustrativos por depoimentos autorizados.
- Revisar textos de produtos quando o funil do Flowlink estiver pronto.

### Testes de lançamento

- Realizar avaliação completa em iPhone, Android, Chrome, Edge, Firefox e Safari.
- Confirmar PDF, gráficos e link clicável do módulo.
- Confirmar lead no Supabase e e-mail transacional na Brevo.
- Confirmar que sinais de alerta ocultam a recomendação comercial principal.
- Conferir todos os links externos e páginas legais.
- Revisar teclado, foco, contraste e leitor de tela.

O arquivo `TAREFAS-PENDENTES.md` contém a lista de referência já existente e deve ser mantido sincronizado se novas tarefas forem concluídas.

---

## 16. Como trabalhar e publicar com segurança

1. Começar com `git status --short` e preservar arquivos não relacionados.
2. Inspecionar o arquivo central correto antes de mudar:
   - textos/produtos/links: `js/config.js`;
   - perguntas/pontos: `js/questions.js`;
   - etapas e triagem: `js/app.js`;
   - cálculo: `js/scoring.js`;
   - resultados: `js/results.js`;
   - estilo: `css/styles.css` e `css/mobile-ux.css`.
3. Validar sintaxe (`node --check` quando aplicável), fluxo e ausência de erros no console.
4. Fazer commit apenas dos arquivos alterados para a Mandala.
5. Publicar via `git push origin main` quando Lucas pedir deploy/publicação.
6. Confirmar a Vercel acessando o arquivo/página alterada no domínio público.
7. Nunca expor ou registrar chaves da Brevo, tokens, senhas, credenciais de Hotmart, login do Flowlink ou chave privilegiada do Supabase.

---

## 17. Último estado confirmado

- Site público: https://mandaladacoluna.vercel.app
- Última funcionalidade publicada: opção “Nenhum desses sinais está presente” na triagem de segurança.
- A opção está na **ETAPA 4 DE 4 · TRIAGEM DE SEGURANÇA**, e não no questionário de perfis.
- A Vercel foi confirmada com essa correção.
- A paleta atual é a da Clínica Setterlin, suave e responsiva.
- Nenhuma funcionalidade deve ser removida sem solicitação explícita do Lucas.

