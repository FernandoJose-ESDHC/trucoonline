/* Desenhe e Adivinhe — banco de palavras (curado à mão para a Central de Jogos, domínio público / CC0).
   Por nível e categoria; palavras separadas por "|". Só coisas desenháveis, sem palavrões. */
"use strict";
const DZ_CATS = {
  ani:'Animais', com:'Comidas e bebidas', obj:'Objetos', cas:'Casa', nat:'Natureza', pro:'Profissões',
  esp:'Esportes e diversão', tra:'Transportes', cor:'Corpo humano', rou:'Roupas e acessórios', lug:'Lugares',
  mus:'Música', tec:'Tecnologia', bra:'Coisas do Brasil', fan:'Fantasia e festas'
};
const DZ_PALAVRAS = {
  facil:{
    ani:'gato|cachorro|peixe|pássaro|cobra|aranha|borboleta|abelha|joaninha|tartaruga|coelho|porco|vaca|cavalo|galinha|pato|rato|sapo|leão|girafa|elefante|macaco|baleia|polvo|caracol|minhoca|coruja|pinguim|tubarão|urso|ovelha|formiga|jacaré|caranguejo|golfinho|zebra',
    com:'maçã|banana|uva|pera|laranja|morango|melancia|abacaxi|cenoura|ovo|pão|queijo|bolo|pizza|sorvete|pirulito|chocolate|leite|café|suco|pipoca|biscoito|cereja|limão|milho|tomate|batata|hambúrguer|salsicha|picolé|rosquinha',
    obj:'bola|chave|livro|lápis|tesoura|relógio|óculos|copo|garrafa|xícara|colher|garfo|faca|prato|vela|balão|presente|caixa|cadeado|escova de dente|pente|espelho|lâmpada|guarda-chuva|mala|bolsa|anel|martelo|régua|caneta|envelope|dado|bandeira|sino|pipa|tambor|ampulheta|lupa|troféu|âncora',
    cas:'casa|cama|mesa|cadeira|porta|janela|sofá|televisão|geladeira|fogão|chuveiro|banheira|privada|travesseiro|tapete|abajur|panela|escada',
    nat:'sol|lua|estrela|nuvem|chuva|árvore|flor|folha|montanha|rio|mar|praia|arco-íris|fogo|neve|raio|pedra|ilha|cacto|coqueiro|cogumelo|girassol|vulcão|planeta',
    esp:'gol|skate|patins|balanço|escorregador|raquete|ioiô|pião|bambolê|boneca|futebol',
    tra:'carro|ônibus|avião|barco|navio|trem|bicicleta|moto|foguete|caminhão|helicóptero|submarino|trator|semáforo',
    cor:'olho|nariz|boca|orelha|mão|pé|dente|cabelo|braço|perna|coração',
    rou:'chapéu|camiseta|calça|sapato|meia|boné|vestido|saia|luva|cachecol|gravata|bota|cinto|colar|coroa',
    mus:'violão|guitarra|piano|flauta|microfone|nota musical',
    tec:'celular|computador|rádio|robô|teclado',
    fan:'fantasma|monstro|dragão|sereia|fada|bruxa|pirata|rei|rainha|princesa|unicórnio|boneco de neve|castelo'
  },
  medio:{
    ani:'tigre|camelo|canguru|morcego|papagaio|pavão|lagosta|cavalo-marinho|estrela-do-mar|água-viva|esquilo|raposa|lobo|gorila|hipopótamo|rinoceronte|flamingo|tucano|arara|onça|tatu|lagarta|mosquito|libélula|escorpião|lagartixa|foca|peru|cisne|avestruz|dinossauro|cabra|burro|siri|caramujo|ninho',
    com:'cachorro-quente|sanduíche|pastel|espaguete|panqueca|churrasco|abacate|coco|pimenta|cebola|alho|brócolis|beterraba|sushi|torrada|mel|refrigerante|salada|sopa|pudim|bombom|chiclete|algodão-doce|ovo frito|kiwi|pepino|amendoim|pão de forma|melão',
    obj:'bússola|binóculo|câmera fotográfica|lanterna|vassoura|balde|regador|mochila|carteira|moeda|cofrinho|ímã|parafuso|prego|serrote|alicate|agulha|botão|cabide|termômetro|microscópio|telescópio|pá|mangueira|extintor|apito|medalha|megafone|bumerangue|leque|pincel|globo terrestre|saco de dormir',
    cas:'armário|estante|escrivaninha|micro-ondas|liquidificador|máquina de lavar|ferro de passar|ventilador|aspirador|varal|rede|lareira|chaminé|torneira|pia|cortina|campainha|telhado|berço|chaleira|frigideira|garagem|piscina|portão|cerca|caixa de correio|vaso de planta',
    nat:'cachoeira|tornado|onda|cometa|floresta|deserto|caverna|lago|rosa|tulipa|pinheiro|palmeira|bambu|trevo|semente|raiz|galho|tronco|gota|gelo|iceberg|lua cheia|pôr do sol|nascer do sol|eclipse|terremoto',
    pro:'médico|bombeiro|policial|professor|cozinheiro|pintor|palhaço|astronauta|carteiro|dentista|jardineiro|pescador|motorista|piloto|mágico|enfermeiro|cientista|fazendeiro|garçom|cabeleireiro|mecânico|pedreiro|salva-vidas|juiz|detetive|padeiro',
    esp:'basquete|vôlei|natação|surfe|boxe|judô|golfe|ciclismo|corrida|xadrez|boliche|pescaria|acampamento|cama elástica|gangorra|carrossel|roda-gigante|montanha-russa|amarelinha|bola de gude|cabo de guerra|dardos|arco e flecha|halteres|peteca|pingue-pongue|quebra-cabeça|baralho',
    tra:'metrô|ambulância|caminhão de bombeiro|patinete|canoa|veleiro|carroça|teleférico|disco voador|escavadeira|guindaste|bonde|lancha|avião de papel|carro de corrida|trenó|caiaque|balão de ar quente',
    cor:'esqueleto|cérebro|língua|sobrancelha|bigode|barba|joelho|cotovelo|umbigo|pegada|músculo|trança|dedo|unha|pescoço',
    rou:'chinelo|sandália|jaqueta|casaco|pijama|avental|capacete|máscara|gorro|suspensório|salto alto|tênis|biquíni|brinco|pulseira|relógio de pulso',
    lug:'escola|hospital|igreja|farol|ponte|cinema|circo|fazenda|zoológico|aeroporto|padaria|supermercado|biblioteca|parque|estádio|prédio|museu|posto de gasolina|pirâmide|iglu|barraca|feira|jardim|aquário|moinho',
    mus:'bateria|violino|saxofone|trompete|sanfona|gaita|harpa|triângulo|chocalho|fone de ouvido|caixa de som|xilofone|tamborim|cavaquinho',
    tec:'videogame|controle remoto|satélite|antena|impressora|pilha|calculadora|drone|carregador|elevador|escada rolante|tomada',
    bra:'carnaval|festa junina|fogueira|samba|pão de queijo|feijoada|brigadeiro|coxinha|açaí|saci|chapéu de palha|bandeirinha|pamonha|pé de moleque|cocada|guaraná|chimarrão|jangada|pandeiro|rede de dormir|tapioca',
    fan:'mago|varinha mágica|tesouro|mapa do tesouro|baú|poção|caveira|múmia|lobisomem|gênio da lâmpada|duende|gigante|anjo|super-herói|ninja|cavaleiro|espada|escudo|alienígena|vampiro|zumbi|abóbora|árvore de natal|papai noel|rena|coelhinho da páscoa|ovo de páscoa|bolo de aniversário'
  },
  dificil:{
    ani:'camaleão|ornitorrinco|tamanduá|capivara|mico-leão-dourado|louva-a-deus|vaga-lume|ouriço|porco-espinho|pica-pau|beija-flor|salamandra|lhama|alce|morsa|castor|pelicano|quati|bicho-preguiça|arraia|enguia|lula|percevejo|centopeia',
    com:'lasanha|omelete|estrogonofe|acarajé|quindim|pão francês|canjica|cuscuz|farofa|empada|torta|gelatina|chantili|jabuticaba|caju|goiaba|maracujá|mamão|pitanga|romã|figo|framboesa|espetinho|bolo de cenoura|milho cozido|sorvete de casquinha',
    obj:'grampeador|clipe|abridor de latas|ratoeira|catavento|estetoscópio|fita adesiva|carimbo|sacola|cavalete|porta-retrato|castiçal|funil|peneira|marreta|ventosa|lixa|trena|chave de fenda|corrente|mola|cadeado de bicicleta|alfinete|dedal',
    cas:'lustre|persiana|cabideiro|sótão|porão|maçaneta|interruptor|ralo|varanda|tábua de passar|escorredor|ralador|rolo de massa|batedeira|torradeira|filtro de barro|cômoda|criado-mudo|cafeteira|lava-louças',
    nat:'aurora boreal|constelação|oásis|geleira|arquipélago|maré|redemoinho|neblina|granizo|estalactite|recife de coral|manguezal|vitória-régia|ipê|samambaia|duna|penhasco|cratera|lua minguante|chuva de meteoros',
    pro:'arquiteto|veterinário|eletricista|encanador|costureira|fotógrafo|jornalista|bailarina|malabarista|apicultor|astrônomo|arqueólogo|mergulhador|lenhador|sapateiro|açougueiro|maestro|escultor|carpinteiro|domador|equilibrista|ventríloquo|guarda de trânsito',
    esp:'hipismo|esgrima|ginástica|paraquedismo|alpinismo|mergulho|maratona|pódio|sinuca|queimada|futevôlei|polo aquático|salto em altura|levantamento de peso|trampolim|patinação no gelo|corrida de saco|pique-esconde',
    tra:'dirigível|planador|asa-delta|paraquedas|gôndola|monociclo|triciclo|empilhadeira|rolo compressor|betoneira|balsa|transatlântico|carruagem|locomotiva|bondinho|caminhão-cegonha|carro anfíbio',
    cor:'estômago|coluna vertebral|cílios|sarda|covinha|impressão digital|tornozelo|calcanhar|queixo|bochecha|pulmão|costela|esôfago|rim',
    rou:'smoking|gravata-borboleta|macacão|sobretudo|colete|uniforme|fantasia|cartola|tiara|peruca|monóculo|chuteira|quimono|poncho|pochete|meia-calça|galocha',
    lug:'arranha-céu|prefeitura|delegacia|rodoviária|estação de trem|laboratório|observatório|labirinto|celeiro|galinheiro|planetário|torre|masmorra|templo|coliseu|cais|mirante|camarote',
    mus:'berimbau|contrabaixo|violoncelo|tuba|trombone|clarinete|gaita de foles|cuíca|agogô|metrônomo|partitura|orquestra|vitrola|castanholas|diapasão',
    tec:'painel solar|para-raios|código de barras|caixa eletrônico|catraca|turbina eólica|gerador|radar|marca-passo|fliperama|projetor',
    bra:'capoeira|frevo|bumba meu boi|mula sem cabeça|boitatá|curupira|iara|cocar|quadrilha|pau de sebo|caipira|forró|trio elétrico|escola de samba|cordel',
    fan:'centauro|ciclope|fênix|minotauro|pégaso|gárgula|feiticeira|bola de cristal|tapete voador|caldeirão|fada madrinha|lâmpada mágica|pote de ouro'
  }
};
