/* =====================================================================
   Lista de jogos da Central.
   Para adicionar um jogo novo: crie games/<id>.html (veja
   docs/ADICIONAR-JOGO.md) e acrescente uma entrada aqui. Só isso.
   ===================================================================== */
const JOGOS = [
  { id:'truco-mineiro', name:'Truco Mineiro', cat:'truco', icon:'🃏', url:'games/truco.html?mode=mineiro', stats:'truco',
    players:'4 · duplas', online:true, desc:'O clássico de Minas: Zap, Copas, Espadilha e Pica-fumo. Mão vale 2, truco vale 4.' },
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
    players:'2', online:true, desc:'Damas brasileiras: captura obrigatória, lei da maioria e dama que voa.' }
];
const CATEGORIAS = [
  ['todos','Todos'], ['truco','Truco'], ['cartas','Cartas'], ['tabuleiro','Tabuleiro'], ['solo','Solo']
];
