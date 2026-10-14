/* Base de cartas do "Quem Sou Eu?" (pt-BR), escrita para a Central de Jogos.
   Cada categoria tem perguntas prontas (atributos) e cartas no formato
   "Nome|emoji|atributos com SIM|atributos com TALVEZ" — o resto é NÃO.
   As expressões (re) servem para os bots entenderem perguntas escritas à mão. */
"use strict";
const QSE_CATS = {
  animais:{nome:'Animal', plural:'Animais', ico:'🐾',
    perg:[
      ['mam','Sou mamífero?',/mam[íi]fer/],
      ['ave','Sou uma ave?',/\bave\b|p[áa]ssaro/],
      ['pei','Sou um peixe?',/peixe/],
      ['rep','Sou um réptil?',/r[ée]ptil/],
      ['anf','Sou um anfíbio?',/anf[íi]bio/],
      ['ins','Sou um inseto?',/inseto/],
      ['voa','Eu voo?',/\bvo(o|a|ar|ando)\b/],
      ['agu','Vivo na água (ou passo muito tempo nela)?',/[áa]gua|\bmar\b|\brio\b|\bnad/],
      ['dom','Sou doméstico (de estimação ou de fazenda)?',/dom[ée]stic|estima[çc]|fazenda|s[íi]tio/],
      ['gra','Sou maior que uma pessoa?',/maior que|grande|enorme|gigante/],
      ['peq','Sou menor que um gato?',/menor que|pequen|min[úu]scul/],
      ['car','Como carne?',/carne|carn[íi]vor|\bca[çc]/],
      ['pen','Tenho penas?',/pena/],
      ['p4','Tenho quatro patas?',/quatro patas|4 patas/],
      ['bra','Vivo solto na natureza do Brasil?',/brasil/],
      ['per','Sou perigoso para as pessoas?',/perigos|venen|\bmord|\bpic[oa]/],
      ['lis','Tenho listras ou manchas?',/listr|manch|pintad/],
      ['cas','Tenho casco, carapaça ou concha?',/casco|carapa|concha/],
      ['chi','Tenho chifres?',/chifr/],
      ['sel','Vivo na floresta?',/floresta|selva|\bmata\b/],
      ['fri','Vivo em lugar muito frio?',/frio|gelo|neve/],
      ['afr','Vivo na África?',/[áa]frica/],
      ['not','Sou mais ativo à noite?',/noite|noturn/],
      ['ros','Sou cor-de-rosa?',/rosa/],
      ['car2','Carrego carga ou puxo carroça?',/carga|carro[çc]a|pux/],
      ['bic','Tenho um bico grande?',/bico/]
    ],
    cartas:`Cachorro|🐶|mam dom p4 car|peq lis gra
Gato|🐱|mam dom p4 car not|lis
Cavalo|🐴|mam dom p4 gra car2|lis
Vaca|🐄|mam dom p4 gra chi lis|
Porco|🐷|mam dom p4|gra ros
Galinha|🐔|ave dom pen|voa
Pato|🦆|ave dom pen voa agu|
Ovelha|🐑|mam dom p4|
Cabra|🐐|mam dom p4 chi|
Coelho|🐰|mam dom p4|peq
Hamster|🐹|mam dom p4 peq|not
Burro|🐴|mam dom p4 car2|gra
Papagaio|🦜|ave pen voa bra sel|dom
Arara|🦜|ave pen voa bra sel|bic
Tucano|🐦|ave pen voa bra sel bic|
Coruja|🦉|ave pen voa car not|sel bra
Águia|🦅|ave pen voa car|per
Pinguim|🐧|ave pen agu car fri|
Beija-flor|🐦|ave pen voa bra peq|sel
Pombo|🐦|ave pen voa|
Avestruz|🪶|ave pen gra afr|per
Flamingo|🦩|ave pen voa agu ros|
Urubu|🐦|ave pen voa car bra|
Cisne|🦢|ave pen voa agu|
Pavão|🦚|ave pen|voa dom
Ema|🪶|ave pen bra|gra
Leão|🦁|mam p4 car gra afr per|
Tigre|🐯|mam p4 car gra per lis sel|
Onça-pintada|🐆|mam p4 car per lis bra sel|gra not
Elefante|🐘|mam p4 gra afr|per
Girafa|🦒|mam p4 gra afr lis|chi
Zebra|🦓|mam p4 gra afr lis|
Hipopótamo|🦛|mam p4 gra afr agu per|
Rinoceronte|🦏|mam p4 gra afr chi per|
Macaco|🐒|mam sel|bra p4
Mico-leão-dourado|🐒|mam bra sel peq|
Gorila|🦍|mam gra afr sel|p4
Urso|🐻|mam p4 car gra per|fri sel
Urso-polar|🐻|mam p4 car gra per fri|agu
Panda|🐼|mam p4 gra sel lis|
Coala|🐨|mam sel|p4
Canguru|🦘|mam|gra
Camelo|🐫|mam p4 gra car2|afr
Lobo|🐺|mam p4 car per|not sel fri
Raposa|🦊|mam p4 car not|sel
Capivara|🦫|mam p4 agu bra|
Bicho-preguiça|🦥|mam bra sel|
Tamanduá|🐾|mam p4 bra|sel
Tatu|🐾|mam p4 bra cas|not
Morcego|🦇|mam voa not peq|car
Esquilo|🐿️|mam p4 peq sel|
Rato|🐭|mam p4 peq not|dom
Ornitorrinco|🦫|mam agu|
Golfinho|🐬|mam agu car|gra
Baleia|🐋|mam agu gra|car
Foca|🦭|mam agu car fri|
Tubarão|🦈|pei agu car per gra|
Peixe-palhaço|🐠|pei agu peq lis|
Piranha|🐟|pei agu car bra per peq|
Cavalo-marinho|🐠|pei agu peq|
Polvo|🐙|agu car|
Caranguejo|🦀|agu cas|car
Estrela-do-mar|⭐|agu|
Tartaruga|🐢|rep p4 cas|agu
Jabuti|🐢|rep p4 cas bra|
Jacaré|🐊|rep p4 car agu bra per gra|
Cobra|🐍|rep car per|bra sel
Camaleão|🦎|rep p4 peq|sel
Lagartixa|🦎|rep p4 peq|
Sapo|🐸|anf p4 peq|agu
Formiga|🐜|ins peq|per
Abelha|🐝|ins voa peq lis per|
Borboleta|🦋|ins voa peq|lis
Joaninha|🐞|ins voa peq lis cas|
Mosquito|🦟|ins voa peq per|not
Barata|🪳|ins peq not|voa
Aranha|🕷️|peq car|per
Escorpião|🦂|peq car per|not
Caracol|🐌|peq cas|`},

  profissoes:{nome:'Profissão', plural:'Profissões', ico:'🧑',
    perg:[
      ['uni','Uso uniforme ou roupa especial?',/uniform|roupa especial|jaleco|farda/],
      ['sau','Trabalho com saúde?',/sa[úu]de|doen|hospital|cl[íi]nica|m[ée]dic/],
      ['ext','Trabalho ao ar livre?',/ar livre|\brua\b|fora de casa/],
      ['vei','Dirijo ou piloto um veículo?',/dirij|dirig|pilot|ve[íi]culo|carro|avi[ãa]o/],
      ['ani','Trabalho com animais?',/animal|animais|bicho/],
      ['cri','Trabalho com crianças?',/crian[çc]/],
      ['com','Trabalho com comida?',/comida|cozinh|aliment/],
      ['art','Sou artista (música, palco, arte)?',/artist|\barte\b|m[úu]sic|palco|cant|dan[çc]/],
      ['esc','Trabalho em escritório ou com computador?',/escrit[óo]rio|computador/],
      ['fer','Uso ferramentas ou máquinas?',/ferrament|m[áa]quina/],
      ['seg','Protejo as pessoas ou faço cumprir a lei?',/seguran|proteg|\blei\b|crime/],
      ['fac','Preciso de faculdade para trabalhar?',/faculdade|diploma|universid/],
      ['noi','Costumo trabalhar de madrugada ou à noite?',/noite|madrugada/],
      ['via','Viajo muito no trabalho?',/viaj/],
      ['pla','Trabalho com plantas ou com a terra?',/planta|terra|ro[çc]a|campo|horta/],
      ['ven','Vendo coisas?',/vend|loja|com[ée]rcio/],
      ['agu','Trabalho na água ou no mar?',/[áa]gua|\bmar\b|barco|navio/],
      ['per','Meu trabalho é perigoso?',/perigos|risco/],
      ['ens','Ensino coisas às pessoas?',/ensin|\baula|professor/],
      ['apa','Cuido da aparência das pessoas (cabelo, roupa)?',/cabelo|beleza|apar[êe]ncia|roupa/],
      ['con','Construo ou conserto coisas?',/constru|consert/],
      ['arm','Uso arma?',/\barma/],
      ['cli','Atendo clientes direto, cara a cara?',/client|atend/],
      ['mad','Trabalho com madeira?',/madeira/]
    ],
    cartas:`Médico|🩺|uni sau fac|noi seg
Enfermeiro|💉|uni sau fac noi|
Dentista|🦷|uni sau fac|
Veterinário|🐾|sau ani fac|uni
Professor|📚|cri ens fac|
Bombeiro|🚒|uni seg ext per vei noi|
Policial|👮|uni seg ext vei per noi arm|
Piloto de avião|✈️|uni vei via fac|noi
Motorista de ônibus|🚌|uni vei|noi ext
Caminhoneiro|🚚|vei via|noi ext
Cozinheiro|🍳|uni com|noi
Padeiro|🥖|uni com ven noi|
Garçom|🍽️|uni com cli|noi
Confeiteiro|🎂|com ven|uni
Agricultor|🚜|ext pla vei fer|ani
Jardineiro|🌷|ext pla fer|
Pescador|🎣|ext ani agu|via noi
Cabeleireiro|💇|apa cli|ven
Costureiro|🧵|apa fer|
Pedreiro|🧱|ext fer con per|uni
Carpinteiro|🔨|fer con mad|
Eletricista|💡|fer per con|uni ext
Encanador|🔧|fer con|
Mecânico|🔧|fer uni con vei|
Engenheiro|📐|fac con esc|ext
Arquiteto|🏛️|fac esc|art con
Advogado|⚖️|fac esc seg|
Juiz|⚖️|fac seg uni|esc
Cientista|🔬|fac uni|esc
Astronauta|🚀|uni vei via fac per|
Programador|💻|esc fac|noi
Jornalista|📰|esc via fac|ext
Fotógrafo|📷|art via|ext
Cantor|🎤|art via noi|
Ator|🎭|art|noi via
Bailarino|🩰|art uni|
Palhaço|🤡|art cri uni|via
Mágico|🎩|art uni noi|cri
Pintor artístico|🎨|art|
Escritor|✍️|art esc|
Jogador de futebol|⚽|uni ext via|
Salva-vidas|🏖️|uni ext agu seg|
Carteiro|✉️|uni ext|vei
Gari|🧹|uni ext|noi
Vendedor|🛍️|ven cli|
Caixa de supermercado|🛒|uni ven cli|
Marinheiro|⚓|uni agu via vei|per
Soldado|🎖️|uni seg ext per arm|via
Detetive|🔍|seg|noi arm
Babá|🍼|cri|
Farmacêutico|💊|sau fac uni ven cli|
Psicólogo|🧠|sau fac|
Entregador de moto|🛵|vei ext|uni per`},

  objetos:{nome:'Objeto', plural:'Objetos', ico:'📦',
    perg:[
      ['ele','Uso eletricidade ou bateria?',/eletric|bateria|tomada|ligar|energia/],
      ['cas','Fico dentro de casa?',/dentro de casa|\bcasa\b/],
      ['coz','Fico na cozinha?',/cozinh/],
      ['mao','Caibo na mão?',/\bm[ãa]o\b|pequen|bolso/],
      ['gra','Sou maior que uma pessoa?',/maior que|grande|enorme/],
      ['mad','Sou feito de madeira?',/madeira/],
      ['met','Sou feito de metal?',/metal|ferro|\ba[çc]o\b/],
      ['pla','Sou feito de plástico?',/pl[áa]stic/],
      ['vid','Tenho vidro?',/vidro/],
      ['tel','Tenho tela?',/\btela/],
      ['rod','Tenho rodas?',/roda/],
      ['som','Faço som ou barulho?',/\bsom\b|barulho|toco|toca/],
      ['esc','Uso na escola?',/escola|estud/],
      ['cor','Uso no corpo (vestir ou carregar comigo)?',/vest|corpo|carreg/],
      ['tra','Sou um meio de transporte?',/transport|levo pessoas/],
      ['cor2','Corto coisas?',/cort/],
      ['lim','Sirvo para limpar?',/limp/],
      ['esp','Uso em esporte ou brincadeira?',/esport|brinc|jog/],
      ['luz','Faço luz?',/\bluz|ilumin/],
      ['agu','Uso com água?',/[áa]gua|molh/],
      ['pap','Sou feito de papel?',/papel/],
      ['pon','Tenho pontas?',/ponta|pontud/],
      ['cab','Uso na cabeça?',/cabe[çc]a/],
      ['din','Sirvo para comprar coisas?',/compr|dinheiro|pag/],
      ['abr','Sirvo para abrir alguma coisa?',/\babr/]
    ],
    cartas:`Celular|📱|ele mao tel som vid|cor
Televisão|📺|ele cas tel som vid|
Computador|💻|ele cas tel som esc|
Geladeira|🧊|ele cas coz gra met|
Fogão|🔥|cas coz met|ele
Micro-ondas|📦|ele cas coz met vid som|
Liquidificador|🍹|ele coz som cas|vid pla
Panela|🍲|coz met cas|
Garfo|🍴|coz met mao pon|
Faca|🔪|coz met mao cor2 pon|
Colher|🥄|coz met mao|
Copo|🥛|coz vid mao agu|pla
Prato|🍽️|coz cas|vid
Cadeira|🪑|cas mad|met pla
Cama|🛏️|cas mad gra|
Sofá|🛋️|cas gra|mad
Ventilador|🌀|ele cas som pla|
Lâmpada|💡|ele luz vid mao cas|
Lanterna|🔦|ele luz mao|pla
Vela|🕯️|luz mao|cas
Relógio|⏰|mao vid|ele som cor
Óculos|👓|mao cor vid|cab
Chapéu|🎩|cor cab|
Sapato|👟|cor|
Guarda-chuva|☂️|agu|cor met pon abr
Mochila|🎒|cor esc|
Lápis|✏️|mad esc mao pon|
Caneta|🖊️|pla esc mao|
Tesoura|✂️|met esc mao cor2 pon|
Caderno|📓|pap esc mao|
Livro|📖|pap esc mao|cas
Régua|📏|esc mao|pla mad
Bola|⚽|esp|mao
Bicicleta|🚲|rod met esp tra|
Carro|🚗|rod met gra tra vid som|ele
Ônibus|🚌|rod met gra tra vid som|
Avião|✈️|gra met tra som vid|rod
Barco|⛵|tra agu gra|mad met
Trem|🚆|rod met gra tra som|ele
Patinete|🛴|rod esp tra|met
Skate|🛹|rod mad esp tra|
Piano|🎹|som mad gra cas|
Violão|🎸|som mad|
Tambor|🥁|som|mad
Apito|🔊|som mao|met pla
Escova de dentes|🦷|mao pla lim agu cas|
Sabonete|🧼|mao lim agu cas|
Toalha|🏖️|agu cas|cor lim
Vassoura|🧹|lim cas|mad pla
Balde|🪣|agu pla|met lim
Chuveiro|🚿|agu cas|ele met
Espelho|🪞|vid cas|
Janela|🪟|vid cas|mad met
Porta|🚪|cas mad gra|met abr
Chave|🔑|met mao abr|
Cadeado|🔒|met mao|
Martelo|🔨|met mad mao|
Pipa|🪁|esp pap|
Ursinho de pelúcia|🧸|esp mao cas|
Dado|🎲|esp mao|pla
Videogame|🎮|ele tel som esp cas|
Fone de ouvido|🎧|ele som cor mao cab|
Câmera fotográfica|📷|ele mao vid|tel
Moeda|🪙|met mao din|
Anel|💍|met cor mao|
Coroa|👑|met cor cab|pon
Microfone|🎤|ele som mao met|
Escada|🪜|gra|mad met
Secador de cabelo|💨|ele som mao cas|`},

  folclore:{nome:'Personagem do folclore', plural:'Folclore', ico:'🌙',
    perg:[
      ['mul','Sou mulher?',/mulher|feminin|\bmo[çc]a/],
      ['cr2','Pego ou assusto crianças?',/(pego|assusto|levo|como).*crian|crian[çc]as? (desobedient|levad|que n[ãa]o dorm)/],
      ['cri','Sou criança?',/crian[çc]a|menin/],
      ['hom','Sou homem ou menino?',/homem|menino|masculin|rapaz/],
      ['hum','Tenho forma humana?',/humano|forma de gente|\bpessoa/],
      ['ani','Tenho forma de animal?',/animal|bicho/],
      ['tra','Me transformo em outra coisa?',/transform|\bvir(o|a)\b/],
      ['agu','Vivo na água (rio ou mar)?',/[áa]gua|\brio\b|\bmar\b/],
      ['mat','Vivo na mata ou floresta?',/\bmata\b|floresta/],
      ['fog','Tenho fogo?',/fogo/],
      ['noi','Apareço à noite?',/noite|noturn/],
      ['ass','Assusto as pessoas?',/assust|medo|malvad|\bmau\b/],
      ['pro','Protejo a natureza ou os animais?',/proteg|natureza/],
      ['bom','Sou do bem (ajudo ou alegro as pessoas)?',/do bem|bonzinho|ajud|alegr/],
      ['nor','Sou do Norte (Amazônia)?',/norte|amaz[ôo]n/],
      ['nde','Sou do Nordeste?',/nordest/],
      ['sul','Sou do Sul?',/\bsul\b|ga[úu]ch/],
      ['can','Canto ou assobio?',/cant|assobi/],
      ['cha','Uso chapéu ou gorro?',/chap[ée]u|gorro|carapu/],
      ['per','Tenho uma perna só?',/perna/],
      ['pes','Tenho os pés virados para trás?',/p[ée]s|virad/],
      ['cab','Tenho algo estranho na cabeça (sem cabeça, cabeção, cabelo de fogo)?',/cabe[çc]|cabelo/],
      ['gra','Sou gigante?',/gigante|enorme|grand/]
    ],
    cartas:`Saci-Pererê|🌪️|hom cri hum mat cha per|noi ass
Curupira|🌳|hom hum mat pro pes cab|cri ass
Iara|🐚|mul hum agu can nor|ani ass tra
Boitatá|🐍|ani fog pro mat noi|ass sul
Mula sem cabeça|🐴|ani fog noi ass tra mul cab|
Boto-cor-de-rosa|🐬|ani agu tra nor cha hom|noi
Cuca|🐊|mul ass cr2 noi|hum ani
Lobisomem|🐺|hom tra ani noi ass|hum gra
Negrinho do Pastoreio|🐎|hom cri hum bom sul|
Caipora|🐗|mat pro|hum mul hom cri ass
Mapinguari|🦍|mat nor gra ass|ani hum cab
Corpo-seco|💀|hom hum ass noi|
Bicho-papão|👹|ass cr2 noi|ani hum
Matinta Pereira|🦉|mul tra noi nor can ass hum|ani
Pisadeira|👣|mul hum noi ass|
Cabeça de Cuia|🌊|hom hum agu nde cab|ass
Comadre Fulozinha|🌿|mul hum mat pro nde|cri cab
Bumba meu boi|🐂|ani nde bom|nor
Uirapuru|🐦|ani mat nor can bom|
Vitória-régia|🪷|mul agu nor tra|hum
Mãe do Ouro|✨|fog|mul noi pro
Chupa-cabra|👽|ani noi ass|
Homem do Saco|🎒|hom hum ass cr2|noi
Caboclo-d'água|🌊|hom agu nde ass|hum
Alamoa|👻|mul hum agu noi ass tra nde|
Anhangá|🦌|ani mat pro|fog ass
Romãozinho|😈|hom cri hum ass|
Papa-figo|😨|hom hum ass cr2 nde|noi
Ipupiara|🌊|agu ass ani|hum`},

  comidas:{nome:'Comida', plural:'Comidas', ico:'🍽️',
    perg:[
      ['doc','Sou doce?',/doce|a[çc][úu]car/],
      ['sal','Sou salgado?',/salgad/],
      ['fru','Sou uma fruta?',/fruta/],
      ['ver','Sou um legume ou verdura?',/legume|verdura|vegetal/],
      ['car','Tenho carne (de boi, frango ou peixe)?',/carne|frango|peixe/],
      ['que','Sou servido quente?',/quente/],
      ['gel','Sou servido gelado?',/gelad|\bfrio/],
      ['bra','Sou bem típico do Brasil?',/brasil|t[íi]pic/],
      ['mao','Posso ser comido com a mão?',/\bm[ãa]o\b/],
      ['asa','Vou ao forno?',/forno|assad/],
      ['fri','Sou frito?',/frit/],
      ['liq','Sou uma bebida?',/bebida|\bbeb|l[íi]quid/],
      ['caf','Apareço no café da manhã?',/caf[ée] da manh/],
      ['fes','Apareço em festas (aniversário, festa junina)?',/festa|anivers/],
      ['lei','Tenho leite ou queijo?',/leite|queijo/],
      ['tri','Tenho massa ou farinha de trigo?',/trigo|massa|farinha/],
      ['vrd','Sou verde?',/verde/],
      ['vrm','Sou vermelho?',/vermelh/],
      ['ama','Sou amarelo?',/amarel/],
      ['red','Sou redondo?',/redond/],
      ['cal','Tenho caldo ou molho?',/caldo|molho/],
      ['pei','Tenho peixe ou frutos do mar?',/peixe|camar|frutos do mar/],
      ['bco','Sou branco?',/branc/]
    ],
    cartas:`Feijoada|🍲|sal car que bra cal|
Pão de queijo|🧀|sal que bra mao asa lei caf red|fes
Brigadeiro|🍫|doc bra mao fes lei red|
Coxinha|🍗|sal car fri bra mao fes tri|que
Pastel|🥟|sal fri mao tri que|car bra
Pizza|🍕|sal que asa lei tri red|car mao
Hambúrguer|🍔|sal car que mao tri red|
Cachorro-quente|🌭|sal car que mao tri|bra fes
Sorvete|🍦|doc gel lei|mao
Bolo|🎂|doc asa fes tri|lei caf red
Pipoca|🍿|que mao fes|sal doc bco
Arroz|🍚|sal que bra bco|
Feijão|🥣|sal que bra|
Batata frita|🍟|sal fri que mao ver|ama
Ovo frito|🍳|sal que fri|caf
Macarrão|🍝|sal que tri|car cal
Lasanha|🍝|sal que asa lei tri car cal|
Sushi|🍣|sal car pei|gel mao
Salada|🥗|ver vrd|sal gel
Sopa|🍜|sal que liq cal|car ver
Banana|🍌|fru doc mao ama caf bra|
Maçã|🍎|fru doc mao vrm red|vrd
Laranja|🍊|fru doc red mao|caf liq
Uva|🍇|fru doc mao red|vrd
Melancia|🍉|fru doc vrd gel red|vrm
Abacaxi|🍍|fru doc ama|bra
Morango|🍓|fru doc vrm mao|
Manga|🥭|fru doc ama|bra vrd
Açaí|🍇|fru gel bra doc|liq
Coco|🥥|fru bra red|liq bco
Limão|🍋|fru vrd red|ama
Abacate|🥑|fru vrd|doc
Cenoura|🥕|ver|
Tomate|🍅|vrm red|fru ver
Alface|🥬|ver vrd|
Milho|🌽|ver ama fes bra|que
Brócolis|🥦|ver vrd|que
Batata|🥔|ver|que red
Pão francês|🥖|sal tri caf asa bra mao|que
Queijo|🧀|sal lei ama|caf red
Leite|🥛|liq lei caf bco|que gel
Café|☕|liq que caf bra|doc
Suco de laranja|🧃|liq doc gel caf|fru
Chocolate|🍫|doc lei|mao
Pudim|🍮|doc lei gel red|asa
Pé de moleque|🥜|doc bra fes mao|
Paçoca|🥜|doc bra fes mao|red
Pamonha|🌽|bra fes ama que|doc sal
Tapioca|🌮|bra caf que bco|doc sal red
Acarajé|🧆|sal fri bra que mao|car pei
Churrasco|🍖|sal car que bra|
Moqueca|🍲|sal car que bra cal pei|
Farofa|🥣|sal bra|car
Biscoito|🍪|doc asa caf mao tri|sal red
Rosquinha|🍩|doc fri mao tri red|
Panqueca|🥞|que tri red|doc sal caf
Picolé|🍧|doc gel mao|
Mel|🍯|doc liq|ama
Bala|🍬|doc mao|
Algodão-doce|☁️|doc fes|
Quindim|🍮|doc bra ama fes red|
Canjica|🥣|doc bra fes lei que bco|`}
};
/* perguntas gerais (servem para descobrir a categoria) */
const QSE_GERAL = [
  ['c:animais','Sou um animal?',/\banimal|\bbicho/],
  ['c:profissoes','Sou uma profissão (uma pessoa que trabalha)?',/profiss|trabalh|emprego/],
  ['c:objetos','Sou um objeto?',/objeto|\bcoisa/],
  ['c:folclore','Sou um personagem do folclore?',/folclor|lenda|personagem/],
  ['c:comidas','Sou uma comida ou bebida?',/comida|bebida|aliment|comest/]
];
/* lista única de cartas: {id, n (nome), e (emoji), c (categoria), s:Set sim, t:Set talvez} */
const QSE_CARTAS = [];
for(const c in QSE_CATS) QSE_CATS[c].cartas.split('\n').forEach(ln => {
  const f = ln.split('|'); if(f.length < 3) return;
  QSE_CARTAS.push({id:QSE_CARTAS.length, n:f[0], e:f[1], c, s:new Set(f[2].split(' ').filter(Boolean)), t:new Set((f[3] || '').split(' ').filter(Boolean))});
});
