/* =====================================================================
   Lista de jogos da Central.
   Para adicionar um jogo novo: crie games/<id>.html (veja
   docs/ADICIONAR-JOGO.md) e acrescente uma entrada aqui. Só isso.
   ===================================================================== */
const JOGOS = [
  { id:'truco-mineiro', name:'Truco Mineiro', cat:'truco', icon:'🃏', url:'games/truco.html?mode=mineiro', stats:'truco',
    players:'4 · duplas', online:true, desc:'O clássico de Minas: Zap, Copas, Espadilha e 7 de Ouros. Mão vale 2, truco vale 4.' },
  { id:'truco-paulista', name:'Truco Paulista', cat:'truco', icon:'🂡', url:'games/truco.html?mode=paulista', stats:'truco',
    players:'4 · duplas', online:true, desc:'Com vira: a manilha muda a cada mão. Mão vale 1, truco vale 3.' },
  { id:'trucao', name:'Trucão', cat:'truco', icon:'🔥', url:'games/truco.html?mode=trucao', stats:'truco',
    players:'6 ou 8 · trios/quartetos', online:true, desc:'Molde do Mineiro com 8 manilhas: 2♦, Á♦, 7 rato e catatau acima do Zap.' },
  { id:'douradinho', name:'Douradinho', cat:'truco', icon:'👑', url:'games/truco.html?mode=douradinho', stats:'truco',
    players:'6 · 3×3', online:true, desc:'A Dama de Ouros manda em tudo, seguida de Valete, Dunga, Piu e Cinquinho de paus.' },
  { id:'douradao', name:'Douradão', cat:'truco', icon:'💰', url:'games/truco.html?mode=douradao', stats:'truco',
    players:'8 · 4×4', online:true, desc:'O Douradinho para 8: o Rei de Ouros sobe acima da Douradinha.' },
  { id:'canastra', name:'Canastra', cat:'cartas', icon:'🎴', url:'games/canastra.html',
    players:'2 ou 4 · duplas', online:true, desc:'Sequências do mesmo naipe, coringa no 2, morto e canastras limpas e sujas.' },
  { id:'pife', name:'Pife', cat:'cartas', icon:'🀄', url:'games/pife.html',
    players:'2 a 6', online:true, desc:'Forme três jogos com 9 cartas — trincas ou sequências — e bata primeiro.' },
  { id:'21', name:'21', cat:'cartas', icon:'🎰', url:'games/21.html',
    players:'1 a 5 · contra a banca', online:true, desc:'Chegue o mais perto de 21 sem estourar. Fichas, dobrar e 21 de mão paga 3 por 2.' },
  { id:'paciencia', name:'Paciência', cat:'solo', icon:'🂮', url:'games/paciencia.html',
    players:'1', online:false, desc:'A paciência clássica (Klondike): monte as quatro pilhas do Ás ao Rei.' },
  { id:'xadrez', name:'Xadrez', cat:'tabuleiro', icon:'♟️', url:'games/xadrez.html',
    players:'2', online:true, desc:'Regras completas: roque, en passant, promoção, xeque-mate e empates.' },
  { id:'damas', name:'Damas', cat:'tabuleiro', icon:'⛀', url:'games/damas.html',
    players:'2', online:true, desc:'Damas brasileiras: captura obrigatória, lei da maioria e dama que voa.' },
  { id:'ultima', name:'Última Carta', cat:'cartas', icon:'🌈', url:'games/ultima.html',
    players:'2 a 8', online:true, desc:'Cores, números, Pular, Inverter e +4: esvazie a mão e não esqueça de gritar ÚLTIMA!' },
  { id:'domino', name:'Dominó', cat:'tabuleiro', icon:'⚅', url:'games/domino.html',
    players:'2 a 4 · duplas', online:true, desc:'Duplo-seis em duplas (sem compra) ou individual com monte. Bata ou tranque o jogo.' },
  { id:'ludo', name:'Ludo', cat:'tabuleiro', icon:'🎲', url:'games/ludo.html',
    players:'2 a 4', online:true, desc:'Dê a volta no tabuleiro e leve as 4 peças ao centro. Capture os adversários!' },
  { id:'trilha', name:'Trilha', cat:'tabuleiro', icon:'⭕', url:'games/trilha.html',
    players:'2', online:true, desc:'O moinho: forme trilhas de 3 para tirar peças do adversário. Coloque, mova e voe.' },
  { id:'batalha', name:'Batalha Naval', cat:'tabuleiro', icon:'⚓', url:'games/batalha.html',
    players:'2', online:true, desc:'Posicione a frota e afunde os navios inimigos. Navios não se tocam, nem na diagonal.' },
  { id:'reversi', name:'Reversi', cat:'tabuleiro', icon:'🔘', url:'games/reversi.html',
    players:'2', online:true, desc:'Cerque e vire as peças do adversário; quem tiver mais peças no fim vence.' },
  { id:'quatro', name:'Quatro em Linha', cat:'tabuleiro', icon:'🔴', url:'games/quatro.html',
    players:'2', online:true, desc:'Solte as peças nas colunas e faça 4 em linha antes do adversário.' },
  { id:'gamao', name:'Gamão', cat:'tabuleiro', icon:'🟤', url:'games/gamao.html',
    players:'2', online:true, desc:'Dados, barra, bloqueios e retirada. Partida até 3, 5 ou 7 pontos com gammon.' },
  { id:'go', name:'Go', cat:'tabuleiro', icon:'⚫', url:'games/go.html',
    players:'2', online:true, desc:'Cerque território no 9×9 ou 13×13: capturas, ko, contagem chinesa e komi 6,5.' },
  { id:'mancala', name:'Mancala', cat:'tabuleiro', icon:'🌰', url:'games/mancala.html',
    players:'2', online:true, desc:'Kalah: semeie no sentido anti-horário, capture e encha seu depósito.' },
  { id:'restaum', name:'Resta Um', cat:'solo', icon:'📍', url:'games/restaum.html',
    players:'1', online:false, desc:'Pule os pinos até sobrar um só — no centro é perfeito! Com dica que resolve.' },
  { id:'senha', name:'Senha', cat:'solo', icon:'🔐', url:'games/senha.html',
    players:'1', online:false, desc:'Descubra a combinação de cores — ou desafie o computador a descobrir a sua.' }
];
const CATEGORIAS = [
  ['todos','Todos'], ['truco','Truco'], ['cartas','Cartas'], ['tabuleiro','Tabuleiro'], ['solo','Solo']
];
