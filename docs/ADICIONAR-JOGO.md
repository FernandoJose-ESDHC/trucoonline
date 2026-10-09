# ➕ Como adicionar um jogo novo à Central

A Central foi feita para crescer. Cada jogo é **um arquivo HTML** dentro de `games/` que descreve só as **regras**. Tudo o resto já vem pronto da **Mesa** (`shared/mesa.js`):

- tela inicial do jogo (nome, opções, criar/entrar em sala, jogar contra bots, regras);
- salas online por código (PeerJS/WebRTC), sem cadastro;
- sala de espera com lugares, times e chat;
- bots nos lugares vazios e quando alguém cai (e devolução do lugar quando a pessoa volta);
- cada jogador recebe **só o que pode ver** (a Mesa chama `view(estado, lugar)` para cada um);
- fim de partida, placar da mesa e histórico de vitórias.

## Passo a passo

1. **Copie o modelo** [`games/modelo-jogo-da-velha.html`](../games/modelo-jogo-da-velha.html) — um jogo da velha completo, online e com bot, em ~80 linhas.
2. **Troque as regras** no objeto passado para `Mesa.run({...})` (tabela abaixo).
3. **Registre o jogo** acrescentando uma linha em [`games/registry.js`](../games/registry.js):
   ```js
   { id:'velha', name:'Jogo da Velha', cat:'tabuleiro', icon:'⭕', url:'games/modelo-jogo-da-velha.html',
     players:'2', online:true, desc:'Três em linha antes do adversário.' },
   ```
4. (Opcional) Acrescente o arquivo à lista `CORE` em [`sw.js`](../sw.js) para ele abrir sem internet.

Pronto: o jogo aparece na Central, com salas online e bots.

## O que a definição do jogo precisa ter

| Campo | Obrigatório | O que faz |
|---|---|---|
| `id`, `name`, `icon` | sim | Identificação. O `id` também separa as salas online deste jogo. |
| `players` **ou** `seats(opts)` | sim | Número de lugares (fixo, ou calculado pelas opções). |
| `setup(players, opts)` | sim | Cria o estado inicial. `players` = `[{name, human}]`. Roda só no anfitrião. |
| `waiting(estado)` | sim | Lista dos lugares que precisam jogar agora. Bots nesses lugares jogam sozinhos. |
| `apply(estado, lugar, ação)` | sim | Valida e aplica a jogada. Devolve `{ok:false, err:'motivo'}` se for inválida, ou `{events:[...], pause:ms}`. |
| `over(estado)` | sim | `null` enquanto o jogo segue; no fim, `{winners:[lugares], draw, text}`. |
| `bot(estado, lugar, opts)` | sim | Devolve a ação do bot (mesmo formato da ação do jogador). |
| `view(estado, lugar)` | sim | O que esse lugar pode ver — **esconda as cartas dos outros aqui**. |
| `render(view, mesa, ui)` | sim | Desenha em `ui.stage`. Use `ui.act(ação)` para jogar e `ui.rerender()` para redesenhar após uma seleção local. |
| `options` | não | Seletores que aparecem na tela inicial e na sala: `[{key, label, default, choices:[[valor, rótulo]]}]`. |
| `team(lugar, n, opts)` | não | Time de cada lugar (mostra "Dupla 1/2" na sala). |
| `seatLabel(lugar, n, opts)` | não | Rótulo do lugar na sala (ex.: "Brancas"). |
| `topInfo(view, mesa)` | não | HTML pequeno no topo (placar, vez). |
| `botDelay(estado, lugar, opts)` | não | Tempo de "pensar" do bot, em ms. |
| `onEvent(evento, mesa, ui)` | não | Reage a eventos no navegador de cada jogador (sons, animações). |
| `rules` | não | HTML das regras (string ou função das opções). |
| `tick(estado, opts, agora)` / `tickMs` | não | Relógio do anfitrião para rodadas com tempo (padrão a cada 500 ms). Devolva `{changed, events}` quando mudar algo. |

### Eventos prontos

Devolva em `apply(...).events`:

- `{k:'snd', s:'card'|'move'|'capture'|'deal'|'alert'|'win'|'lose'}` — som;
- `{k:'banner', text, bad}` — letreiro grande na tela;
- `{k:'log', text}` — linha no histórico;
- `{k:'say', seat, text}` — balão em cima do jogador (o elemento precisa ter `data-seat`);
- `{k:'toast', text, seat}` — aviso rápido (só para aquele lugar, se `seat` for informado).

### Utilitários do `shared/core.js`

`makeDeck({ranks, decks, jokers})`, `shuffle`, `cardEl(carta, {back, label, cls})`, `flyFrom` (animação de carta voando), `modal`, `pmodal`, `toast`, `banner`, `confetti`, `Snd.*`, `Stats`, `CFG` (nome, som, velocidade).
Para jogos de combinação de cartas há `shared/melds.js` (trincas, sequências, canastras).

## Dicas

- **Nunca confie na ação recebida**: valide tudo em `apply` (um jogador online pode mandar qualquer coisa).
- **Estado só com dados simples** (objetos, arrays, números, textos) — é ele que vira JSON.
- Para jogos com várias etapas na mesma vez (comprar → baixar → descartar), mantenha a mesma pessoa em `waiting` e guarde a fase no estado.
- Teste rápido sem ninguém: abra o jogo, clique em **Jogar contra bots** e, no console, rode `Mesa._H.seats[0].human = false; Mesa._step()` — os bots jogam a partida inteira.
