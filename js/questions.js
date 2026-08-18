// Perguntas e pontuações são editáveis e independentes do HTML.
// A linguagem é educativa e simples; as pontuações não devem ser alteradas sem revisão.
const s = (inflamatoria = 0, muscular = 0, compressao = 0, rigidez = 0, encurtamento = 0, instabilidade = 0) => ({ inflamatoria, muscular, compressao, rigidez, encurtamento, instabilidade });
const q = (id, theme, question, options) => ({ id, theme, question, options: options.map(([optionId, text, scores]) => ({ id: `${optionId}`, text, scores })) });

export const QUESTIONS = [
  q('q01', 'Como a dor se apresenta', 'Qual frase mais combina com o que você sente na maior parte do tempo?', [
    ['a', 'É forte, não passa e parece irritada', s(4, 0, 1, 1)],
    ['b', 'Parece peso, cansaço ou músculos doloridos', s(0, 4, 0, 1)],
    ['c', 'Parece choque, queimação ou pontadas que se espalham', s(1, 0, 5, 0)],
    ['d', 'Parece travamento ou dificuldade para me mexer', s(1, 1, 0, 5)],
    ['e', 'Não sei dizer', s()]
  ]),
  q('q02', 'Quando aparece', 'Em qual situação a dor costuma ficar mais presente?', [
    ['a', 'Mesmo parado(a), é difícil achar uma posição confortável', s(4, 0, 1)],
    ['b', 'Depois de um dia corrido, estressante ou tenso', s(0, 4, 0, 1)],
    ['c', 'Depois de ficar muito tempo na mesma posição ou fazer esforço', s(0, 1, 1, 1, 0, 4)],
    ['d', 'Quando volto a me mexer depois de ficar parado(a)', s(1, 0, 0, 4, 1)]
  ]),
  q('q03', 'O que piora', 'O que costuma piorar mais o que você sente?', [
    ['a', 'Quase todo movimento parece piorar', s(4, 1, 1)],
    ['b', 'Estresse, rotina pesada ou tensão', s(0, 5)],
    ['c', 'Me inclinar, tossir ou carregar peso', s(0, 0, 5)],
    ['d', 'Ficar muito tempo sentado(a), em pé ou na mesma posição', s(0, 1, 0, 1, 0, 5)]
  ]),
  q('q04', 'O que ajuda', 'O que costuma trazer mais alívio?', [
    ['a', 'Quase nada parece ajudar', s(4)],
    ['b', 'Calor, massagem ou uma pausa curta', s(0, 5)],
    ['c', 'Mudar uma posição específica', s(1, 0, 4)],
    ['d', 'Começar a me mexer devagar', s(0, 1, 0, 5, 1)]
  ]),
  q('q05', 'Rigidez', 'Ao acordar ou depois de ficar parado(a), como seu corpo fica?', [
    ['a', 'Muito travado e demora para soltar', s(2, 1, 0, 5)],
    ['b', 'Com os músculos duros ou apertados', s(0, 5, 0, 1)],
    ['c', 'Com sensação de puxar nas pernas ou no quadril', s(0, 1, 0, 1, 5)],
    ['d', 'Não percebo isso', s()]
  ]),
  q('q06', 'Movimentos', 'Qual movimento do dia a dia parece mais difícil para você?', [
    ['a', 'Girar o corpo ou olhar para os lados', s(0, 1, 0, 5)],
    ['b', 'Abaixar ou levantar', s(1, 1, 1, 4, 2)],
    ['c', 'Chegar perto dos pés com as mãos', s(0, 0, 0, 1, 5)],
    ['d', 'Nenhum movimento em especial', s()]
  ]),
  q('q07', 'Tensão muscular', 'Você sente pontos doloridos ou músculos duros quando toca na região?', [
    ['a', 'Muitas vezes', s(0, 5)],
    ['b', 'Às vezes', s(0, 2)],
    ['c', 'Quase nunca', s()]
  ]),
  q('q08', 'Alongamento', 'Quando você alonga com cuidado, o que costuma sentir?', [
    ['a', 'Um puxão forte nos músculos ou nas pernas', s(0, 1, 0, 0, 5)],
    ['b', 'Alívio por um tempo', s(0, 2, 0, 1, 3)],
    ['c', 'A dor piora ou se espalha', s(2, 0, 4)],
    ['d', 'Não noto diferença', s()]
  ]),
  q('q09', 'Força e controle', 'Em relação a sustentar seu corpo, o que mais parece com você?', [
    ['a', 'Sinto fraqueza ou falta de firmeza', s(0, 0, 1, 0, 0, 5)],
    ['b', 'Canso mesmo com pouco esforço', s(0, 3, 0, 0, 0, 4)],
    ['c', 'Acho alguns movimentos difíceis de controlar', s(0, 0, 1, 0, 0, 5)],
    ['d', 'Nada disso', s()]
  ]),
  q('q10', 'Dor que se espalha', 'A dor fica no mesmo lugar ou vai para outra região?', [
    ['a', 'Fica no mesmo lugar', s(1, 2, 0, 1)],
    ['b', 'Vai para o braço ou a mão', s(0, 0, 5)],
    ['c', 'Vai para o glúteo, a perna ou o pé', s(0, 0, 5)],
    ['d', 'Muda de lugar', s(0, 4, 1)]
  ]),
  q('q11', 'Sensações', 'Você percebe formigamento ou dormência?', [
    ['a', 'Muitas vezes', s(0, 0, 5)],
    ['b', 'Às vezes', s(0, 0, 3)],
    ['c', 'Não percebo', s()]
  ]),
  q('q12', 'Posições', 'Qual situação mais combina com o que você sente?', [
    ['a', 'É difícil achar uma posição confortável', s(4, 0, 1)],
    ['b', 'Piora quando fico sentado(a) ou em pé por muito tempo', s(0, 2, 0, 1, 0, 4)],
    ['c', 'Piora em uma posição bem específica', s(1, 0, 4)],
    ['d', 'Melhora quando começo a me mexer', s(0, 1, 0, 5)]
  ]),
  q('q13', 'Rotina', 'O que mais atrapalha sua rotina?', [
    ['a', 'A dor forte e a sensação de irritação', s(4)],
    ['b', 'A tensão no fim do dia', s(0, 4)],
    ['c', 'O receio de um movimento fazer a dor se espalhar', s(0, 0, 4, 0, 0, 2)],
    ['d', 'A falta de movimento ou de resistência', s(0, 1, 0, 3, 1, 4)]
  ]),
  q('q14', 'Como evolui', 'Com o passar do tempo, como esse padrão costuma acontecer?', [
    ['a', 'Fica mais forte em pouco tempo', s(4, 0, 1)],
    ['b', 'Aparece em épocas de tensão ou sobrecarga', s(0, 5)],
    ['c', 'Volta depois de esforço', s(0, 1, 0, 0, 0, 5)],
    ['d', 'Muda conforme meu corpo fica mais rígido', s(1, 0, 0, 5)]
  ]),
  q('q15', 'Movimento', 'Qual frase é mais parecida com o que você sente?', [
    ['a', 'Sinto as articulações presas ou travadas', s(1, 0, 0, 5)],
    ['b', 'Sinto os músculos curtos, como se estivessem puxando', s(0, 1, 0, 1, 5)],
    ['c', 'Sinto que minha coluna não sustenta bem', s(0, 0, 0, 0, 0, 5)],
    ['d', 'Sinto uma dor mais sensível ou irritada', s(4, 0, 2)]
  ]),
  q('q16', 'Dias piores', 'Nos dias em que está pior, o que você sente mais?', [
    ['a', 'Dor forte que não passa', s(5)],
    ['b', 'Peso e tensão nos músculos', s(0, 4)],
    ['c', 'Queimação, choque ou formigamento', s(1, 0, 5)],
    ['d', 'Rigidez que limita meus movimentos', s(1, 0, 0, 5)]
  ]),
  q('q17', 'Depois do esforço', 'Depois de se exercitar ou fazer tarefas do dia a dia, o que você percebe?', [
    ['a', 'A dor fica irritada e demora para acalmar', s(4)],
    ['b', 'Os músculos ficam cansados e tensos', s(0, 5)],
    ['c', 'A dor se espalha ou fica mais sensível', s(0, 0, 4)],
    ['d', 'Sinto falta de resistência ou firmeza', s(0, 1, 0, 0, 0, 5)]
  ]),
  q('q18', 'Visão geral', 'Qual frase mais parece com o que você sente?', [
    ['a', 'Minha dor parece sempre forte ou irritada', s(5)],
    ['b', 'Meus músculos ficam tensos, duros ou doloridos', s(0, 5)],
    ['c', 'Minha dor se espalha, aperta ou vai para outra região', s(0, 0, 5)],
    ['d', 'Tenho dificuldade para me mexer ou meu corpo fica rígido', s(0, 0, 0, 5)],
    ['e', 'Sinto meus músculos curtos ou puxando', s(0, 0, 0, 0, 5)],
    ['f', 'Sinto minha coluna fraca ou sem firmeza', s(0, 0, 0, 0, 0, 5)]
  ])
];

export const RED_FLAGS = [
  ['rf1', 'Perda importante de força ou força piorando'],
  ['rf2', 'Dificuldade que apareceu de repente para caminhar'],
  ['rf3', 'Perda do controle da urina ou do intestino'],
  ['rf4', 'Dormência na região íntima'],
  ['rf5', 'Dor depois de acidente ou trauma importante'],
  ['rf6', 'Febre junto com a dor'],
  ['rf7', 'Perda de peso sem explicação'],
  ['rf8', 'Dor muito forte e ficando cada vez pior'],
  ['rf9', 'Algum histórico ou sintoma que está me preocupando'],
  ['rf10', 'Dor forte à noite que não muda com a posição']
].map(([id, text]) => ({ id, text }));
