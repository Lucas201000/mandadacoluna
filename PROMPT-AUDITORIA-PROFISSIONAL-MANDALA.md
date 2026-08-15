# Prompt profissional — Auditoria de conversão, clareza e segurança da Mandala da Dor

Atue como uma equipe integrada de UX mobile, copywriting de conversão ética, acessibilidade, front-end e revisão de linguagem em saúde. Audite a aplicação **Mandala da Dor na Coluna** e implemente somente correções de baixo risco que preservem o funcionamento já validado.

## Resultado esperado

Uma pessoa leiga deve conseguir, pelo celular, entender a proposta, responder o questionário sem se sentir perdida, visualizar um resultado educativo, reconhecer quando precisa priorizar atendimento profissional e chegar ao módulo correspondente sem exposição antecipada de preço.

## Limites clínicos inegociáveis

- A ferramenta é educativa; não diagnostica, não identifica causa exata e não promete tratamento ou cura.
- Preferir: “perfil predominante”, “compatibilidade relatada”, “padrão de sintomas”, “seus relatos apresentam características semelhantes a” e “resultado educativo”.
- Nunca usar: “você tem”, “seu diagnóstico é”, “essa é a causa exata” ou “esse tratamento vai curar”.
- Sinais de alerta devem ter prioridade sobre CTA comercial e recomendação de módulo.
- Não mudar perguntas, pesos, cálculo dos seis módulos ou critérios de alerta sem revisão explícita do responsável técnico.

## Auditoria obrigatória

### 1. Fluxo e conversão

- Verificar a promessa inicial, CTA, benefício percebido e aviso educativo.
- Garantir que o resultado resumido apareça antes do formulário de contato.
- Remover passos, botões ou textos que criem dúvida sem ajudar a decisão.
- Confirmar progresso salvo, botões de voltar e mensagens de erro claras.

### 2. Linguagem para leigos

- Uma ideia por pergunta.
- Usar tarefas reconhecíveis: sentar, levantar, girar, abaixar, carregar e caminhar.
- Não exigir conhecimento de anatomia, fisioterapia ou biomecânica.
- Permitir respostas honestas como “não sei identificar” quando necessário.

### 3. Segurança e acessibilidade

- Testar foco visível, teclado, leitores de tela, labels, erros com `role=alert` e áreas de toque.
- Evitar controles duplicados ou estados visuais ambíguos.
- Testar em largura de 390 px e sem rolagem horizontal.
- Respeitar redução de movimento.

### 4. Resultado, PDF e vitrine

- Explicar a porcentagem como compatibilidade educativa, não probabilidade de doença.
- Exibir o módulo predominante, perfis secundários e aviso profissional.
- Quando não houver sinal de alerta, o CTA deve mostrar “Acessar o Módulo X”, sem citar plataformas de terceiros.
- Quando houver sinal de alerta, a recomendação comercial não pode ser o conteúdo principal.
- Testar capas de módulos, links, detalhes expansíveis e fallback de imagem.
- Confirmar que o PDF tem link clicável para o módulo predominante e não usa linguagem diagnóstica.

## Regra de implementação

Antes de editar, classificar cada achado como:

- Corrigir agora: falha visual, acessibilidade, texto confuso, link quebrado ou fricção simples;
- Configuração pendente: depende de URL, vídeo, produto, credencial ou decisão do responsável;
- Revisão clínica necessária: altera perguntas, pesos, critérios de alerta ou interpretação.

Aplicar somente itens “Corrigir agora”. Após cada alteração, validar JavaScript, checar erros de console, verificar o fluxo em celular e garantir que não exista rolagem horizontal.

## Entrega

Informar de forma objetiva:

1. Achados corrigidos;
2. Arquivos alterados;
3. Testes realizados;
4. Pendências que dependem do responsável técnico;
5. Riscos evitados por não alterar regras clínicas.
