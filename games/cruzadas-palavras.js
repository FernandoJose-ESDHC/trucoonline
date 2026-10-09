/* =====================================================================
   Palavras Cruzadas — banco de palavras e dicas (escrito para a Central)
   Formato: uma linha por palavra, "palavra|dica". Os blocos #1, #2 e #3
   são os níveis fácil, médio e difícil. Na grade as letras ficam sem
   acento e sem hífen (ex.: "maçã" vira MACA).
   ===================================================================== */
"use strict";
const CZ_BANCO = `
#1
gato|Felino doméstico que mia
cão|O melhor amigo do homem
casa|Lugar onde a gente mora
sol|Estrela que ilumina a Terra de dia
lua|Satélite natural da Terra
mar|Grande extensão de água salgada
rio|Curso de água que corre até o mar
pão|Alimento de farinha assado no forno
leite|Bebida branca tirada da vaca
café|Bebida escura do cafezinho
arroz|Grão que acompanha o feijão no prato
feijão|Grão da feijoada
ovo|A galinha põe
bola|Objeto redondo do futebol
mesa|Móvel onde se fazem as refeições
cama|Móvel onde se dorme
porta|Abre-se para entrar num cômodo
janela|Abertura na parede que deixa entrar luz e ar
livro|Tem capa, páginas e se lê
lápis|Escreve e pode ser apontado
escola|Lugar onde se estuda
amigo|Companheiro de confiança
água|Líquido essencial à vida
fogo|Produz chama e calor
chuva|Água que cai das nuvens
nuvem|Fica no céu e pode trazer chuva
flor|Parte colorida e perfumada da planta
árvore|Planta grande, com tronco e galhos
folha|Parte verde da planta; também a do caderno
peixe|Animal que vive na água e respira por guelras
pato|Ave que faz "quá-quá"
vaca|Animal que dá leite e faz "muu"
cavalo|Animal que relincha e pode ser montado
porco|Animal da fazenda que gosta de lama
ovelha|Animal que dá lã
leão|O rei da selva
macaco|Animal que adora banana
rato|Roedor perseguido pelo gato
sapo|Anfíbio que coaxa
cobra|Réptil sem patas
abelha|Inseto que produz mel
mel|Doce produzido pelas abelhas
uva|Fruta da qual se faz o vinho
banana|Fruta amarela e comprida
laranja|Fruta cítrica de suco famoso
limão|Fruta azeda da caipirinha
maçã|Fruta vermelha da Branca de Neve
manga|Fruta tropical; também parte da camisa
pera|Fruta em formato de gota
melão|Fruta de casca amarela, parente da melancia
coco|Fruta cuja água se bebe na praia
azul|Cor do céu sem nuvens
verde|Cor da grama
branco|Cor da neve
preto|Cor do carvão
rosa|Flor com espinhos; também uma cor
roxo|Cor da berinjela
dente|Fica na boca e serve para mastigar
olho|Órgão da visão
nariz|Órgão do olfato
boca|Por onde comemos e falamos
mão|Tem cinco dedos
braço|Membro que liga o ombro à mão
perna|Membro usado para andar
cabelo|Cresce na cabeça
orelha|Parte externa do ouvido
dedo|A mão tem cinco
unha|Cresce na ponta do dedo
carro|Veículo de quatro rodas
avião|Meio de transporte que voa
barco|Veículo que navega
trem|Anda sobre trilhos
ônibus|Transporte coletivo das cidades
moto|Veículo de duas rodas em que o piloto usa capacete
pai|O homem que tem filhos
mãe|Quem nos deu a vida
avó|Mãe da mãe ou do pai
avô|Pai do pai ou da mãe
tio|Irmão do pai ou da mãe
tia|Irmã do pai ou da mãe
irmão|Filho dos mesmos pais
neto|Filho do filho
primo|Filho do tio
bebê|Criança de colo
rei|Usa coroa e governa a monarquia
dia|Período de 24 horas
noite|Período escuro, depois do pôr do sol
ano|Tem doze meses
mês|Janeiro é um
hora|Tem sessenta minutos
semana|Tem sete dias
verão|Estação mais quente do ano
inverno|Estação mais fria do ano
frio|O contrário de quente
doce|O contrário de salgado
alto|O contrário de baixo
novo|O contrário de velho
feliz|Muito contente
rir|Achar graça
correr|Andar muito depressa
nadar|Mover-se na água com braços e pernas
cantar|Soltar a voz com melodia
dormir|Descansar de olhos fechados
comer|Pôr comida na boca
beber|Tomar um líquido
ler|O que se faz com um livro
amor|Sentimento de quem gosta muito
paz|O contrário de guerra
sal|Tempero branco tirado do mar
açúcar|Adoça o café
bolo|Doce de aniversário com velinhas
pipoca|Milho estourado do cinema
queijo|Feito de leite; o rato adora
sopa|Prato quente servido em tigela
suco|Bebida de fruta espremida
chá|Bebida feita com folhas em água quente
copo|Usado para beber água
prato|Onde se serve a comida
garfo|Talher com dentes
faca|Talher que corta
colher|Talher da sopa
panela|Vai ao fogão para cozinhar
sofá|Assento estofado da sala
chave|Abre a fechadura
relógio|Marca as horas
sapato|Calçado de couro
meia|Vai no pé, dentro do sapato
chapéu|Vai na cabeça para proteger do sol
boné|Chapéu com aba na frente
festa|Comemoração com música e convidados
música|Arte dos sons
dança|Movimento do corpo ao som da música
jogo|Partida com regras e vencedor
gol|O objetivo do futebol
time|Equipe esportiva
praia|Lugar de areia à beira-mar
ilha|Terra cercada de água por todos os lados
areia|Cobre o chão da praia
pedra|Pedaço duro de rocha
terra|Nosso planeta
céu|Onde ficam as nuvens e as estrelas
estrela|Brilha no céu à noite
vento|Ar em movimento
fazenda|Propriedade rural com plantações e gado
cidade|Lugar com muitas ruas, casas e prédios
rua|Via pública onde passam os carros
ponte|Liga as margens de um rio
parque|Área verde para passear e brincar
loja|Estabelecimento onde se compra
médico|Profissional que cuida da saúde
dentista|Cuida dos dentes
padeiro|Faz o pão
carteiro|Entrega as cartas
papel|Folha usada para escrever
cola|Serve para grudar
tinta|Usada para pintar
foto|Imagem tirada com a câmera
carta|Mensagem escrita enviada pelo correio
nome|Como uma pessoa é chamada
idade|Quantos anos alguém tem
ouro|Metal precioso amarelo
bala|Docinho embrulhado
tatu|Animal com carapaça que cava buracos
onça|Grande felino pintado do Brasil
arara|Ave colorida de bico curvo
tucano|Ave de bico enorme e colorido
urso|Animal grande e peludo que hiberna
lobo|Uiva para a lua
coelho|Orelhudo que come cenoura
girafa|Animal de pescoço muito comprido
zebra|Animal listrado da África
baleia|O maior animal do mar
violão|Instrumento de seis cordas
piano|Instrumento de teclas pretas e brancas
tambor|Instrumento de percussão tocado com baquetas
sino|Toca na torre da igreja
anel|Joia usada no dedo
colar|Joia usada no pescoço
saia|Roupa feminina da cintura para baixo
calça|Roupa com duas pernas
camisa|Roupa com botões e colarinho
vestido|Roupa feminina de uma peça só
toalha|Usada para se secar depois do banho
sabão|Usado para lavar
banho|Toma-se no chuveiro
escova|Usada para pentear ou limpar os dentes
cadeira|Móvel para sentar
tapete|Cobre o chão da sala
lâmpada|Acende para iluminar
chão|Onde pisamos
teto|Parte de cima do cômodo
parede|Divide os cômodos da casa
jardim|Área com flores e plantas
horta|Onde se plantam verduras
milho|Grão da pamonha e da pipoca
batata|Tubérculo usado para fazer purê e fritas
tomate|Fruto vermelho do molho de macarrão
cebola|Faz chorar quem a corta
alho|Tempero vendido em cabeças com dentes
cenoura|Raiz laranja que o coelho come
alface|Verdura da salada
pizza|Prato italiano redondo assado no forno
macarrão|Massa do espaguete
carne|Vai para o churrasco
frango|Galinha que vai para a panela
pastel|Salgado frito vendido na feira
sorvete|Doce gelado da casquinha
chocolate|Doce feito de cacau
bicicleta|Veículo de duas rodas movido a pedal
pipa|Brinquedo que voa preso a uma linha
boneca|Brinquedo em forma de gente
balão|Bexiga cheia de ar
dado|Cubo com pontos de 1 a 6
roda|Peça redonda que gira
rede|Usada para dormir no Nordeste; também a do gol
mapa|Desenho de um lugar visto de cima
tempo|Passa e não volta
vida|O tempo em que se existe
nota|Recebe-se na prova; também a do dó-ré-mi
aula|Lição dada pelo professor
prova|Exame escolar
lição|Dever de casa
asa|Parte da ave usada para voar
ave|Animal com penas e bico
ninho|Casa do passarinho
lago|Água parada cercada de terra
lata|Embalagem de metal do refrigerante
sola|Parte de baixo do sapato
toca|Buraco onde mora o coelho
vela|Ilumina sem luz elétrica; também a do barco
rosto|O mesmo que cara
arco|Atira flechas
flecha|Lançada pelo arco
alvo|Onde se quer acertar
selo|Colado no envelope da carta
trono|Cadeira do rei
lar|A casa da família
eco|Som que volta repetido
oca|Casa indígena
ema|Grande ave brasileira que não voa
ostra|Molusco que pode ter uma pérola
arame|Fio de metal da cerca
sorriso|Expressão de alegria no rosto
beijo|Carinho dado com os lábios
abraço|Aperto carinhoso com os braços
bolsa|Onde se guardam carteira e chaves
caneta|Escreve com tinta
régua|Mede e traça linhas retas
caderno|Tem folhas pautadas para anotar
tesoura|Corta papel com duas lâminas
pente|Arruma o cabelo
galo|Canta de manhã cedo
galinha|Põe ovos no galinheiro
gelo|Água congelada
neve|Chuva congelada que cai em lugares muito frios
calor|Sensação de quando está quente
roupa|O que vestimos
vaso|Onde se planta uma flor dentro de casa
dinheiro|Usado para comprar
moeda|Dinheiro de metal
preço|Quanto custa
barato|Que custa pouco
caro|Que custa muito
grande|O contrário de pequeno
cheio|O contrário de vazio
limpo|O contrário de sujo
forte|Que tem muita força
rápido|Muito veloz
lento|Devagar
bonito|Agradável de ver
amarelo|Cor da banana madura
#2
âncora|Peça de ferro que prende o navio ao fundo
farol|Torre que orienta os navios com luz
bússola|Instrumento que aponta o norte
capivara|O maior roedor do mundo
jacaré|Réptil de papo amarelo dos rios brasileiros
tamanduá|Come formigas com a língua comprida
preguiça|Animal lento que vive nas árvores; também falta de vontade
camelo|Animal do deserto com corcovas
pinguim|Ave que não voa e vive no frio
coruja|Ave noturna, símbolo da sabedoria
águia|Ave de rapina de visão aguçada
pavão|Ave de cauda colorida em leque
golfinho|Mamífero marinho muito inteligente
polvo|Animal marinho de oito braços
camarão|Crustáceo do bobó
caranguejo|Anda de lado na lama do mangue
formiga|Inseto trabalhador que vive em colônia
borboleta|Inseto de asas coloridas que já foi lagarta
aranha|Tece teia e tem oito patas
mosquito|Inseto que pica e zumbe no ouvido
cigarra|Inseto que canta no verão
tubarão|Peixe predador de dentes afiados
vulcão|Montanha que expele lava
deserto|Região muito seca, como o Saara
oceano|O Atlântico é um
cachoeira|Queda-d'água
caverna|Gruta escura na rocha
montanha|Grande elevação de terra
floresta|A Amazônia é a maior do mundo
geleira|Grande massa de gelo
planeta|Marte é um
cometa|Astro com cauda luminosa, como o Halley
eclipse|Quando a Lua esconde o Sol
órbita|Caminho de um astro em volta de outro
Marte|O planeta vermelho
Saturno|O planeta dos anéis
Vênus|Planeta mais brilhante do céu, a estrela-d'alva
foguete|Leva astronautas ao espaço
museu|Lugar que guarda e expõe obras e objetos históricos
teatro|Lugar onde se apresentam peças
cinema|Sala onde se assistem a filmes
novela|Folhetim da TV que passa à noite
jornal|Traz as notícias do dia
revista|Publicação ilustrada semanal ou mensal
poema|Texto em versos
rima|Mesmo som no fim de dois versos
piada|História curta para fazer rir
enigma|Mistério a ser decifrado
segredo|O que não se conta a ninguém
tesouro|O pirata enterrou um
pirata|Saqueador dos mares, às vezes com tapa-olho
castelo|Moradia fortificada de reis
espada|Arma do cavaleiro medieval
escudo|Protege o guerreiro dos golpes
coroa|Símbolo da realeza
rainha|Esposa do rei, ou a que governa
príncipe|Filho do rei
dragão|Monstro lendário que cospe fogo
fada|Ser mágico com varinha de condão
bruxa|Voa numa vassoura
saci|Do folclore: uma perna só e gorro vermelho
curupira|Do folclore: protege as matas e tem os pés virados para trás
iara|Sereia dos rios no folclore brasileiro
boto|No folclore, vira rapaz para encantar as moças
cuca|Bruxa com cara de jacaré do Sítio do Picapau Amarelo
samba|Ritmo do carnaval carioca
forró|Dança nordestina ao som da sanfona
frevo|Dança pernambucana com sombrinha colorida
carnaval|Festa popular com fantasias e blocos
fantasia|Roupa usada no carnaval; também imaginação
máscara|Esconde o rosto
sanfona|O acordeão do forró
pandeiro|Instrumento de percussão com platinelas
cavaquinho|Pequeno instrumento de quatro cordas do samba
berimbau|Instrumento de arco e cabaça da capoeira
capoeira|Luta e dança afro-brasileira
judô|Arte marcial japonesa de quimono e faixas
xadrez|Jogo de rei, rainha e peões
baralho|Conjunto de cartas para jogar
truco|Jogo de cartas em que se grita "seis!"
peão|Peça do xadrez; também trabalhador da fazenda
torre|Peça do xadrez que anda em linha reta
árbitro|Apita o jogo
goleiro|Defende o gol
pênalti|Cobrança da marca da cal
escanteio|Cobrança feita do canto do campo
torcida|Quem vibra na arquibancada
estádio|Grande arena de jogos
medalha|Prêmio dos três primeiros colocados
troféu|Taça dada ao campeão
atleta|Quem pratica esporte
vôlei|Esporte de rede com seis jogadores em cada lado
tênis|Esporte de raquete; também calçado
natação|Esporte praticado na piscina
remo|Esporte de barco com pás
surfe|Esporte praticado sobre as ondas
xícara|Recipiente com asa para o café
chaleira|Ferve água para o chá
peneira|Separa o fino do grosso
funil|Ajuda a passar líquido para a garrafa
balde|Recipiente com alça para carregar água
vassoura|Usada para varrer
espelho|Reflete a nossa imagem
gaveta|Compartimento que se puxa no móvel
armário|Móvel para guardar roupas
geladeira|Mantém os alimentos frios
fogão|Tem bocas e forno
martelo|Usado para bater pregos
prego|O martelo bate nele
serrote|Serra manual para madeira
alicate|Ferramenta que segura e corta arame
mochila|Bolsa que se leva nas costas
carteira|Guarda o dinheiro; também mesa de escola
cofre|Guarda dinheiro com segredo
banco|Guarda o dinheiro; também assento da praça
mercado|Onde se compram alimentos
feira|Mercado de rua com barracas
padaria|Loja do pão francês
farmácia|Onde se compram remédios
hospital|Onde se tratam os doentes
remédio|Tomado para curar doença
vacina|Previne doenças
febre|Temperatura alta do corpo
tosse|Sintoma comum do resfriado
gripe|Doença com febre e nariz escorrendo
saúde|Bem-estar do corpo e da mente
coração|Bombeia o sangue
pulmão|Órgão da respiração
cérebro|Órgão que comanda o corpo
osso|O cachorro adora roer
sangue|Líquido vermelho que corre nas veias
joelho|Articulação no meio da perna
cotovelo|Articulação no meio do braço
ombro|Onde o braço se liga ao tronco
queixo|Parte de baixo do rosto
testa|Parte do rosto acima dos olhos
umbigo|Fica no meio da barriga
Brasil|País do samba e do futebol pentacampeão
Portugal|País de Pedro Álvares Cabral
Japão|A Terra do Sol Nascente
China|País da Grande Muralha
Egito|País das pirâmides de Gizé
Itália|País da pizza e da Torre de Pisa
França|País da Torre Eiffel
México|País dos mariachis e dos tacos
Peru|País de Machu Picchu; também ave da ceia de Natal
Cuba|Ilha caribenha cuja capital é Havana
Chile|País comprido e estreito da América do Sul
Recife|Capital de Pernambuco
Natal|Festa de 25 de dezembro; também capital potiguar
Belém|Capital do Pará
Manaus|Capital do Amazonas
Salvador|Capital da Bahia
Curitiba|Capital do Paraná
Palmas|Capital do Tocantins
Macapá|Capital do Amapá
Goiânia|Capital de Goiás
Maceió|Capital de Alagoas
Amazonas|Rio com o maior volume de água do mundo
pampa|Planície do Rio Grande do Sul
sertão|Interior seco do Nordeste
cerrado|Vegetação do Planalto Central, de árvores tortas
mangue|Lamaçal da beira-mar onde vivem caranguejos
caju|Fruta cuja castanha fica do lado de fora
goiaba|Fruta de polpa vermelha usada num doce com queijo (Romeu e Julieta)
açaí|Fruto roxo da Amazônia servido na tigela
mamão|Fruta também chamada de papaia
abacaxi|Fruta de coroa e casca espinhenta
jabuticaba|Fruta preta que nasce grudada no tronco
pitanga|Frutinha vermelha com gomos
caqui|Fruta alaranjada e mole de origem asiática
abacate|Fruta verde da vitamina e do guacamole
morango|Fruta vermelha com sementes por fora
cereja|Fruta pequena que enfeita o topo do bolo
ameixa|Fruta que, seca, fica preta e enrugada
pêssego|Fruta de casca aveludada
figo|Fruta da figueira
feijoada|Feijão-preto cozido com carnes de porco
moqueca|Peixe cozido com dendê e leite de coco
acarajé|Bolinho de feijão frito no dendê, da Bahia
coxinha|Salgado em formato de gota, recheado de frango
tapioca|Feita com a goma da mandioca na frigideira
cuscuz|Prato de flocos de milho cozidos no vapor
farofa|Farinha de mandioca torrada na manteiga
pamonha|Feita de milho verde e cozida na palha
canjica|Doce de milho branco com leite
brigadeiro|Docinho de chocolate das festas de aniversário
quindim|Doce amarelo de gema e coco
paçoca|Doce de amendoim que esfarela
pudim|Sobremesa com calda de caramelo
churrasco|Carne assada na brasa
pimenta|Tempero que arde
canela|Especiaria em pau; também parte da perna
orégano|Erva que vai na pizza
mandioca|Raiz também chamada de aipim ou macaxeira
abóbora|Legume grande e alaranjado
pepino|Legume verde da salada; também problema
quiabo|Legume que solta baba
chuchu|Legume verde-claro que dá em trepadeira
vagem|Legume verde comprido com grãos dentro
ervilha|Grão verde e redondo que vem na vagem
lentilha|Grão comido no Ano-Novo para dar sorte
professor|Quem ensina
advogado|Defende causas na Justiça
bombeiro|Apaga incêndios
policial|Mantém a ordem e prende ladrões
pintor|Pinta paredes ou quadros
piloto|Conduz avião ou carro de corrida
mecânico|Conserta carros
pedreiro|Levanta paredes com tijolos
juiz|Dá a sentença no tribunal
garçom|Serve as mesas no restaurante
cozinheiro|Prepara a comida
jardineiro|Cuida das plantas
pescador|Vive de pescar
fotógrafo|Tira fotos profissionalmente
ator|Interpreta papéis
cantor|Vive de cantar
alegria|Sentimento de quem está contente
saudade|Falta que se sente de alguém ou de algo
medo|Sentimento diante do perigo
raiva|Sentimento de quem está bravo
ciúme|Medo de perder quem se ama
coragem|O contrário de medo
vergonha|Faz o rosto ficar vermelho
orgulho|Satisfação com o próprio mérito
esperança|Dizem que é a última que morre
calendário|Mostra os dias do ano
domingo|Primeiro dia da semana
sábado|Dia que vem depois da sexta
janeiro|Primeiro mês do ano
março|Terceiro mês do ano
agosto|Oitavo mês do ano
outono|Estação em que as folhas caem
primavera|Estação das flores
trovão|Estrondo que vem depois do relâmpago
relâmpago|Clarão no céu durante a tempestade
garoa|Chuva fininha, típica de São Paulo
neblina|Nuvem baixa que atrapalha a visão
geada|Orvalho congelado das madrugadas frias
furacão|Tempestade violenta de ventos em giro
arco-íris|Aparece no céu com sete cores depois da chuva
oásis|Lugar com água e plantas no meio do deserto
iglu|Casa de gelo dos povos do Ártico
barraca|Abrigo de lona do acampamento
ímã|Atrai o ferro
radar|Detecta objetos a distância; flagra quem corre na estrada
robô|Máquina que imita ações humanas
computador|Máquina com teclado, tela e processador
teclado|Tem as teclas do computador
celular|Telefone que se leva no bolso
internet|Rede mundial de computadores
senha|Código secreto de acesso
câmera|Aparelho que tira fotos
rádio|Aparelho que toca música e notícias por ondas
televisão|Aparelho em que se assiste à novela
pérola|Joia que nasce dentro da ostra
orla|Faixa à beira da praia
atlas|Livro de mapas
taco|Bastão da sinuca; também peça do piso
tear|Máquina de tecer
teia|Rede feita pela aranha
sela|Assento do cavaleiro sobre o cavalo
seta|Flecha; também o pisca-pisca do carro
vila|Pequeno povoado
tora|Pedaço grosso de tronco cortado
nora|Esposa do filho
genro|Marido da filha
sogra|Mãe do marido ou da esposa
rota|Caminho planejado
nata|Camada de gordura do leite fervido
elo|Cada argola de uma corrente
aro|Círculo de metal da roda da bicicleta
ira|Raiva muito forte
tela|Onde o pintor pinta; também a do celular
lenda|História popular passada de boca em boca
fábula|História com animais que termina com uma moral
herói|Quem faz atos de grande coragem
vilão|O malvado da história
sereia|Metade mulher, metade peixe
gigante|Enorme, colossal
anão|Muito pequeno; personagem da Branca de Neve
mágico|Tira coelho da cartola
palhaço|Faz rir no circo com nariz vermelho
circo|Espetáculo sob a lona, com trapezistas e palhaços
trapézio|Barra suspensa do acrobata do circo
viagem|Ida de um lugar a outro, muitas vezes nas férias
mala|Leva-se as roupas na viagem
passaporte|Documento para viajar ao exterior
hotel|Hospedagem paga para viajantes
estrada|Caminho para carros entre cidades
pedágio|Taxa paga para passar na rodovia
semáforo|Sinal de trânsito com três luzes
calçada|Lugar onde anda o pedestre
esquina|Encontro de duas ruas
praça|Espaço público com bancos e árvores
igreja|Templo com sino e altar
prefeito|Governa o município
eleição|Quando se vota para escolher governantes
voto|Escolha feita na urna
lei|Regra que todos devem cumprir
#3
âmbar|Resina fóssil amarelada que pode guardar insetos
ébano|Madeira preta e muito dura
ônix|Pedra semipreciosa negra
safira|Pedra preciosa azul
rubi|Pedra preciosa vermelha
topázio|Pedra preciosa geralmente amarelo-dourada
esmeralda|Pedra preciosa verde
jade|Pedra verde muito usada na arte chinesa
quartzo|Mineral dos cristais transparentes
granito|Rocha dura usada em pias e bancadas
mármore|Rocha nobre das esculturas gregas
argila|Barro usado na cerâmica
ferrugem|Óxido avermelhado que corrói o ferro
cobre|Metal avermelhado dos fios elétricos
estanho|Metal usado na solda e nas latas antigas
mercúrio|Metal líquido dos termômetros antigos; também planeta
oxigênio|Gás essencial à respiração
átomo|Menor partícula de um elemento químico
elétron|Partícula de carga negativa
gravidade|Força que faz as coisas caírem
energia|Capacidade de realizar trabalho
vácuo|Espaço sem matéria
prisma|Sólido de vidro que separa a luz branca em cores
lente|Peça de vidro dos óculos
eixo|Linha em torno da qual algo gira
alavanca|Barra que multiplica a força sobre um ponto de apoio
roldana|Polia que ajuda a levantar peso
engrenagem|Conjunto de rodas dentadas
âmago|O centro, a essência de algo
ápice|O ponto mais alto
êxodo|Saída em massa de um povo
ócio|Tempo livre, descanso
ermo|Lugar deserto, sem ninguém
tênue|Muito fino, delicado
efêmero|Que dura pouco
perene|Que dura para sempre
árduo|Difícil, trabalhoso
ávido|Muito desejoso
sóbrio|Moderado; que não bebeu
exímio|Excelente no que faz
ímpeto|Impulso repentino
astuto|Esperto, sagaz
afável|Gentil no trato
vetusto|Muito antigo
sagaz|Esperto e perspicaz
ufano|Orgulhoso, envaidecido
lacônico|Que fala pouco, de poucas palavras
cético|Que duvida de tudo
eloquente|Que fala bem e convence
iminente|Que está prestes a acontecer
eminente|Ilustre, notável
dilema|Escolha difícil entre duas opções
paradoxo|Ideia que parece contradizer a si mesma
utopia|Sociedade ideal e imaginária
mito|Narrativa lendária sobre deuses e heróis
odisseia|Viagem cheia de aventuras, como a de Ulisses
epopeia|Longo poema épico, como Os Lusíadas
soneto|Poema de catorze versos
crônica|Texto curto sobre o cotidiano, gênero de Rubem Braga
prosa|Texto escrito sem versos
sátira|Crítica feita com humor
Camões|Autor de Os Lusíadas
Capitu|Personagem dos "olhos de ressaca", de Dom Casmurro
Iracema|A virgem dos lábios de mel, de José de Alencar
Macunaíma|O herói sem nenhum caráter, de Mário de Andrade
Tiradentes|Mártir da Inconfidência Mineira
Cabral|Comandante da esquadra que chegou ao Brasil em 1500
Zumbi|Líder do Quilombo dos Palmares
quilombo|Comunidade formada por escravizados que fugiam
império|O Brasil foi um de 1822 a 1889
república|Forma de governo proclamada no Brasil em 1889
senado|Casa do Congresso com 81 parlamentares
decreto|Ordem escrita de uma autoridade
tratado|Acordo formal entre países
censo|Contagem oficial da população
Pantanal|Grande planície alagável de Mato Grosso e Mato Grosso do Sul
caatinga|Mata branca e espinhosa do sertão nordestino
restinga|Vegetação de areia à beira-mar
várzea|Terreno plano que alaga na cheia do rio
igarapé|Pequeno rio amazônico, caminho de canoa
pororoca|Onda que sobe o rio Amazonas quando a maré encontra o rio
delta|Foz de rio dividida em vários braços; também letra grega
estuário|Foz larga onde a água doce encontra a do mar
istmo|Faixa estreita de terra que liga duas massas de terra
arquipélago|Conjunto de ilhas
península|Terra cercada de água por quase todos os lados
planalto|Terreno elevado e plano
cânion|Vale profundo e estreito cavado por um rio
atol|Ilha de coral em forma de anel
tundra|Vegetação rasteira das regiões geladas
savana|Campo com árvores esparsas, típico da África
monção|Vento sazonal que traz chuvas ao sul da Ásia
Saara|O maior deserto quente do mundo
Andes|Cordilheira da América do Sul
Nilo|Rio que banha o Egito
Tejo|Rio que passa por Lisboa
Lisboa|Capital de Portugal
Roma|A Cidade Eterna
Atenas|Capital da Grécia, berço da democracia
Paris|A Cidade Luz
Madri|Capital da Espanha
Cairo|Capital do Egito
Lima|Capital do Peru; também fruta cítrica
Quito|Capital do Equador
Havana|Capital de Cuba
Tóquio|Capital do Japão
Moscou|Capital da Rússia
Oslo|Capital da Noruega
Viena|Capital da Áustria, terra das valsas
Berlim|Capital da Alemanha
ópera|Teatro cantado com orquestra
sinfonia|Grande composição para orquestra
maestro|Rege a orquestra
batuta|Varinha do maestro
partitura|Papel com as notas da música
oboé|Instrumento de sopro de palheta dupla e som anasalado
fagote|O mais grave dos sopros de palheta dupla da orquestra
harpa|Instrumento de cordas tocado com os dedos, associado aos anjos
tuba|O mais grave dos metais da orquestra
cuíca|Instrumento do samba que "ronca"
agogô|Sino duplo de percussão de origem africana
alaúde|Instrumento de cordas medieval de corpo arredondado
afresco|Pintura feita sobre parede de reboco fresco
mosaico|Imagem montada com pedrinhas coloridas
escultor|Artista que esculpe
paleta|Placa onde o pintor mistura as tintas
cinzel|Ferramenta do escultor
fuso|Instrumento de fiar; também o da hora de cada região
bigorna|Bloco de ferro onde o ferreiro bate o metal
forja|Fornalha do ferreiro
astrolábio|Instrumento de navegação dos descobridores
caravela|Embarcação das grandes navegações portuguesas
galeão|Grande navio a vela de guerra e comércio
leme|Peça que dá direção ao barco
proa|A parte da frente do navio
popa|A parte de trás do navio
convés|Piso superior do navio
mastro|Sustenta as velas do navio
calango|Lagarto pequeno e ligeiro do sertão
mocó|Roedor das pedras da caatinga
seriema|Ave do cerrado de canto alto e topete
sabiá|Ave símbolo do Brasil, citada na Canção do Exílio
quati|Mamífero de focinho comprido e cauda anelada
ariranha|Lontra gigante do Pantanal
jaguatirica|Felino pintado, menor que a onça
lhama|Animal de carga dos Andes
iguana|Lagarto verde com crista nas costas
narval|Baleia do Ártico com um longo dente em espiral
morsa|Mamífero polar de presas enormes; também ferramenta de prender peças
ornitorrinco|Mamífero com bico de pato que põe ovos
camaleão|Réptil que muda de cor
hiena|Animal africano cujo grito parece uma risada
chacal|Canídeo selvagem da África e da Ásia
gnu|Antílope africano das grandes migrações
alce|Grande cervo de chifres largos do hemisfério norte
bisão|Bovino selvagem das pradarias americanas
cisne|Ave branca de pescoço longo dos lagos
condor|Grande ave de rapina dos Andes
pelicano|Ave com uma bolsa no bico
abutre|Ave que se alimenta de carniça
íbis|Ave sagrada do antigo Egito
anu|Ave preta que come carrapatos do gado
lontra|Mamífero aquático brincalhão que come peixes
texugo|Mamífero cavador de focinho listrado
tâmara|Fruto doce da palmeira do deserto
romã|Fruta cheia de sementes vermelhas, símbolo de Ano-Novo
nêspera|Fruta amarela também chamada de ameixa-amarela
cupuaçu|Fruta amazônica parente do cacau
graviola|Fruta verde de casca com espinhos moles
pequi|Fruto do cerrado que não se deve morder com força
umbu|Fruta do sertão nordestino
buriti|Palmeira das veredas
ipê|Árvore que enfeita o cerrado de amarelo ou roxo
jequitibá|Gigante da Mata Atlântica
araucária|Pinheiro do Paraná, que dá o pinhão
pinhão|Semente da araucária, comida nas festas juninas
vatapá|Creme baiano de pão, camarão e dendê
tacacá|Caldo paraense com tucupi e jambu
tucupi|Caldo amarelo da mandioca, base do pato paraense
jambu|Erva paraense que deixa a boca formigando
maniçoba|Prato paraense feito com folhas de mandioca
sarapatel|Prato feito com miúdos de porco
chimarrão|Bebida gaúcha de erva-mate na cuia
cuia|Recipiente do chimarrão
bombacha|Calça larga do gaúcho
gaúcho|Natural do Rio Grande do Sul
candango|Pioneiro que construiu Brasília
capixaba|Natural do Espírito Santo
potiguar|Natural do Rio Grande do Norte
barriga-verde|Apelido de quem nasce em Santa Catarina
tropeiro|Condutor de tropas de mulas no Brasil colonial
bandeirante|Desbravador paulista do interior do Brasil
inconfidência|Conspiração mineira de 1789
abolição|Fim da escravidão, em 1888
regência|Período de governo entre os dois reinados
sesmaria|Lote de terra dado pela Coroa portuguesa
alforria|Liberdade concedida a um escravizado
xilogravura|Gravura em madeira do cordel
cordel|Literatura popular em folhetos pendurados em barbante
repente|Canto improvisado do Nordeste
maracatu|Cortejo pernambucano com rei, rainha e tambores
congada|Festa afro-brasileira com coroação de reis
bumba-meu-boi|Folguedo com o boi que morre e ressuscita
ciranda|Dança de roda de Pernambuco
xaxado|Dança dos cangaceiros
cangaço|Banditismo do sertão, de Lampião
Lampião|O Rei do Cangaço
Aleijadinho|Escultor dos profetas de Congonhas
Portinari|Pintor de "Os Retirantes"
Tarsila|Pintora do "Abaporu"
Drummond|Poeta de "No meio do caminho tinha uma pedra"
Bandeira|Poeta de "Vou-me embora pra Pasárgada"
Pasárgada|Lugar onde o poeta é amigo do rei
Pixinguinha|Compositor de "Carinhoso"
bossa|___ nova, estilo de Tom Jobim e João Gilberto
choro|Gênero musical de flauta, cavaquinho e violão
modinha|Canção sentimental brasileira dos séculos XVIII e XIX
seresta|Cantoria romântica à noite, debaixo da janela
`;
