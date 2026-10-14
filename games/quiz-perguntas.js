/* Banco de perguntas do Quiz (conhecimentos gerais, pt-BR). Escrito para a Central de Jogos.
   Formato de cada linha: nível|pergunta|resposta certa|errada 1|errada 2|errada 3|explicação curta
   nível: f = fácil, m = médio, d = difícil. As alternativas são embaralhadas na hora do jogo. */
"use strict";
const QUIZ_CATS = {br:'Brasil', hist:'História', geo:'Geografia', cie:'Ciências', esp:'Esportes', mus:'Música', cin:'Cinema/TV', var:'Variedades'};
const QUIZ_RAW = {
br:`f|Qual é a capital do Brasil?|Brasília|Rio de Janeiro|São Paulo|Salvador|Brasília é a capital desde 1960, quando foi inaugurada por Juscelino Kubitschek.
f|Em que ano a esquadra de Pedro Álvares Cabral chegou ao Brasil?|1500|1492|1530|1822|A frota de Cabral chegou ao litoral da Bahia em abril de 1500.
f|Quais são as cores da bandeira do Brasil?|Verde, amarelo, azul e branco|Verde, amarelo e vermelho|Azul, branco e vermelho|Verde, branco e preto|O losango amarelo sobre o verde e o círculo azul com a faixa branca.
f|Qual é o lema escrito na bandeira do Brasil?|Ordem e Progresso|Paz e Amor|Independência ou Morte|Deus e Pátria|O lema foi inspirado no positivismo de Auguste Comte.
f|Quantos estados o Brasil tem, sem contar o Distrito Federal?|26|27|25|24|São 26 estados mais o Distrito Federal: 27 unidades federativas.
f|Qual é a moeda atual do Brasil?|Real|Cruzeiro|Peso|Cruzado|O Real circula desde julho de 1994.
f|Em que dia se comemora a Independência do Brasil?|7 de setembro|15 de novembro|21 de abril|1º de maio|Em 7 de setembro de 1822, às margens do riacho Ipiranga.
f|Qual é o maior estado brasileiro em área?|Amazonas|Pará|Mato Grosso|Minas Gerais|O Amazonas tem cerca de 1,5 milhão de km².
f|Qual é a cidade mais populosa do Brasil?|São Paulo|Rio de Janeiro|Brasília|Salvador|A capital paulista tem mais de 11 milhões de habitantes.
f|Qual estado é famoso pelo pão de queijo?|Minas Gerais|Bahia|Paraná|Pará|O pão de queijo é um símbolo da culinária mineira.
f|Em qual cidade fica o Cristo Redentor?|Rio de Janeiro|São Paulo|Salvador|Belo Horizonte|Fica no morro do Corcovado e foi inaugurado em 1931.
f|Qual é o menor estado brasileiro em área?|Sergipe|Alagoas|Espírito Santo|Rio de Janeiro|Sergipe tem cerca de 21 mil km².
f|Qual árvore deu nome ao Brasil?|Pau-brasil|Ipê|Jequitibá|Seringueira|A madeira avermelhada, cor de brasa, deu nome à terra.
f|Qual é a língua oficial do Brasil?|Português|Espanhol|Tupi|Inglês|O português chegou com os colonizadores no século XVI.
f|Qual era a capital do Brasil antes de Brasília?|Rio de Janeiro|Salvador|São Paulo|Petrópolis|O Rio foi capital de 1763 a 1960.
m|Quem foi o primeiro presidente do Brasil?|Deodoro da Fonseca|Getúlio Vargas|Floriano Peixoto|Prudente de Morais|O marechal Deodoro liderou a Proclamação da República em 1889.
m|Em que ano foi proclamada a República no Brasil?|1889|1822|1888|1891|Em 15 de novembro de 1889.
m|Qual lei aboliu a escravidão no Brasil em 1888?|Lei Áurea|Lei do Ventre Livre|Lei dos Sexagenários|Lei Eusébio de Queirós|Foi assinada pela princesa Isabel em 13 de maio de 1888.
m|Quem foi o primeiro imperador do Brasil?|Dom Pedro I|Dom Pedro II|Dom João VI|Dom Manuel|Dom Pedro I governou de 1822 a 1831.
m|Qual é a capital do Tocantins?|Palmas|Araguaína|Gurupi|Porto Nacional|Palmas foi fundada em 1989 e é a capital planejada mais nova do país.
m|Qual é a capital de Roraima?|Boa Vista|Macapá|Porto Velho|Rio Branco|Boa Vista é a única capital brasileira totalmente no hemisfério norte.
m|Qual é a capital do Amapá?|Macapá|Boa Vista|Belém|Oiapoque|Macapá é cortada pela Linha do Equador.
m|Qual é a capital do Acre?|Rio Branco|Porto Velho|Cruzeiro do Sul|Manaus|Rio Branco fica às margens do rio Acre.
m|Qual é a capital de Rondônia?|Porto Velho|Rio Branco|Ji-Paraná|Cuiabá|Porto Velho fica às margens do rio Madeira.
m|Qual é a capital de Santa Catarina?|Florianópolis|Joinville|Blumenau|Curitiba|Grande parte de Florianópolis fica na Ilha de Santa Catarina.
m|Qual é a capital do Espírito Santo?|Vitória|Vila Velha|Serra|Cariacica|Vitória fica numa ilha.
m|Qual é a capital da Paraíba?|João Pessoa|Campina Grande|Natal|Recife|João Pessoa é uma das cidades mais antigas do país.
m|Qual é a capital de Mato Grosso do Sul?|Campo Grande|Cuiabá|Dourados|Corumbá|Cuiabá é a capital de Mato Grosso.
m|Qual estado é o berço das tradições gaúchas e do chimarrão?|Rio Grande do Sul|Santa Catarina|Paraná|Mato Grosso do Sul|“Gaúcho” é quem nasce no Rio Grande do Sul.
m|Qual estado brasileiro faz divisa com mais estados?|Bahia|Minas Gerais|Goiás|Tocantins|A Bahia faz divisa com oito estados.
m|Qual é o ponto mais alto do Brasil?|Pico da Neblina|Pico da Bandeira|Monte Roraima|Pico Paraná|Fica no Amazonas e tem cerca de 2.995 m.
m|Quem compôs a música do Hino Nacional Brasileiro?|Francisco Manuel da Silva|Osório Duque Estrada|Carlos Gomes|Heitor Villa-Lobos|A letra é de Joaquim Osório Duque Estrada.
m|Em que ano Brasília foi inaugurada?|1960|1955|1964|1950|A inauguração foi em 21 de abril de 1960.
m|Qual arquiteto projetou os principais prédios de Brasília?|Oscar Niemeyer|Lúcio Costa|Burle Marx|Paulo Mendes da Rocha|Lúcio Costa fez o plano da cidade; Niemeyer, os edifícios.
m|Em que estado ficam as Cataratas do Iguaçu, do lado brasileiro?|Paraná|Santa Catarina|Mato Grosso do Sul|São Paulo|Ficam em Foz do Iguaçu, na fronteira com a Argentina.
m|Qual é o bioma mais extenso do Brasil?|Amazônia|Cerrado|Mata Atlântica|Caatinga|A Amazônia ocupa quase metade do território brasileiro.
m|Qual bioma existe somente no Brasil?|Caatinga|Amazônia|Pantanal|Pampa|A Caatinga é exclusivamente brasileira, típica do semiárido nordestino.
m|Em qual cidade amazonense acontece o festival dos bois Garantido e Caprichoso?|Parintins|Manaus|Santarém|Tefé|O Festival Folclórico de Parintins acontece todo mês de junho.
m|Em qual cidade acontece o Círio de Nazaré?|Belém|Manaus|São Luís|Fortaleza|É uma das maiores procissões religiosas do mundo.
m|Qual cidade catarinense é famosa por sua Oktoberfest?|Blumenau|Joinville|Florianópolis|Chapecó|A festa celebra a colonização alemã da região.
m|Qual é o rio mais extenso totalmente brasileiro?|São Francisco|Amazonas|Paraná|Tocantins|O “Velho Chico” nasce em Minas Gerais e deságua entre Alagoas e Sergipe.
m|Em que estado ficam os Lençóis Maranhenses?|Maranhão|Piauí|Ceará|Rio Grande do Norte|Dunas brancas com lagoas de água da chuva.
m|Qual arquipélago pernambucano é famoso pelo mergulho e pelos golfinhos?|Fernando de Noronha|Abrolhos|Atol das Rocas|Trindade|Noronha é parque nacional marinho.
d|Qual foi a primeira capital do Brasil?|Salvador|Rio de Janeiro|Recife|São Vicente|Salvador foi a capital de 1549 a 1763.
d|Qual tratado de 1494 dividiu as terras descobertas entre Portugal e Espanha?|Tratado de Tordesilhas|Tratado de Madri|Tratado de Petrópolis|Tratado de Utrecht|Uma linha imaginária separava as terras portuguesas das espanholas.
d|Qual estado foi incorporado ao Brasil pelo Tratado de Petrópolis, em 1903?|Acre|Rondônia|Mato Grosso|Amapá|O território foi negociado com a Bolívia.
d|Em que ano o voto feminino foi garantido pelo Código Eleitoral brasileiro?|1932|1889|1946|1915|O Código Eleitoral de 1932 garantiu o direito de voto às mulheres.
d|Qual capital brasileira fica mais ao norte?|Boa Vista|Macapá|Manaus|Belém|Boa Vista está a cerca de 2° de latitude norte.
d|Qual é a capital brasileira mais ao sul?|Porto Alegre|Florianópolis|Curitiba|Pelotas|Pelotas fica mais ao sul, mas não é capital.
d|Qual capital fica no ponto mais oriental das Américas?|João Pessoa|Natal|Recife|Fortaleza|A Ponta do Seixas fica em João Pessoa.
d|Qual Constituição brasileira ficou conhecida como “Constituição Cidadã”?|A de 1988|A de 1946|A de 1967|A de 1934|Ela marcou a volta da democracia após o regime militar.
d|Qual estado brasileiro tem o litoral mais extenso?|Bahia|Rio de Janeiro|Maranhão|São Paulo|A Bahia tem mais de 900 km de costa.
d|Qual revolta criou a República Rio-Grandense (1835–1845)?|Revolução Farroupilha|Cabanagem|Sabinada|Balaiada|Os farrapos lutaram por dez anos contra o Império.
d|Qual revolta baiana de 1798 também ficou conhecida como Revolta dos Alfaiates?|Conjuração Baiana|Sabinada|Revolta dos Malês|Guerra de Canudos|Muitos participantes eram alfaiates e soldados.
d|Por quanto tempo Getúlio Vargas governou sem interrupção a partir de 1930?|15 anos|10 anos|8 anos|20 anos|De 1930 a 1945; depois voltou eleito em 1951.
d|Quantos países fazem fronteira com o Brasil?|10|8|12|9|Só Chile e Equador, na América do Sul, não fazem divisa com o Brasil.`,

hist:`f|Em que ano o homem pisou na Lua pela primeira vez?|1969|1965|1972|1959|A missão Apollo 11 pousou na Lua em julho de 1969.
f|Quem foi o primeiro homem a pisar na Lua?|Neil Armstrong|Buzz Aldrin|Yuri Gagarin|Michael Collins|Aldrin desceu logo depois; Collins ficou na órbita.
f|Qual civilização construiu as pirâmides de Gizé?|Egípcios|Romanos|Maias|Gregos|Foram construídas há cerca de 4.500 anos.
f|Em que ano começou a Segunda Guerra Mundial?|1939|1914|1945|1941|Começou com a invasão da Polônia pela Alemanha.
f|Em que ano terminou a Segunda Guerra Mundial?|1945|1944|1950|1918|A guerra terminou em 1945, na Europa em maio e na Ásia em setembro.
f|Qual muro caiu em 1989, simbolizando o fim da Guerra Fria?|Muro de Berlim|Muralha da China|Muro das Lamentações|Muralha de Adriano|O muro dividia Berlim Oriental e Ocidental desde 1961.
f|Quem chegou à América em 1492 navegando a serviço da Espanha?|Cristóvão Colombo|Vasco da Gama|Fernão de Magalhães|Américo Vespúcio|Colombo achava que tinha chegado às Índias.
f|Que povo antigo ficou famoso pelos gladiadores e pelo Coliseu?|Romanos|Egípcios|Vikings|Persas|O Coliseu foi inaugurado no ano 80.
f|Qual navio afundou em 1912 depois de bater num iceberg?|Titanic|Lusitania|Britannic|Queen Mary|O naufrágio aconteceu em sua viagem inaugural.
m|Em que ano começou a Primeira Guerra Mundial?|1914|1918|1939|1905|A guerra durou de 1914 a 1918.
m|Qual revolução começou em 1789 com a Queda da Bastilha?|Revolução Francesa|Revolução Russa|Revolução Industrial|Revolução Americana|O lema era “Liberdade, Igualdade, Fraternidade”.
m|Quem foi o primeiro ser humano a ir ao espaço?|Yuri Gagarin|Neil Armstrong|John Glenn|Alan Shepard|O soviético voou em abril de 1961.
m|Qual navegador português chegou à Índia por mar em 1498?|Vasco da Gama|Pedro Álvares Cabral|Bartolomeu Dias|Fernão de Magalhães|Ele contornou a África pelo Cabo da Boa Esperança.
m|Qual imperador francês foi derrotado na Batalha de Waterloo, em 1815?|Napoleão Bonaparte|Luís XIV|Carlos Magno|Luís XVI|Depois da derrota, Napoleão foi exilado na ilha de Santa Helena.
m|Em que país começou a Revolução Industrial?|Inglaterra|França|Alemanha|Estados Unidos|Começou no século XVIII, com as máquinas a vapor e as tecelagens.
m|Quem escreveu as 95 teses que deram início à Reforma Protestante?|Martinho Lutero|João Calvino|Erasmo de Roterdã|Henrique VIII|As teses foram publicadas em 1517.
m|Qual cidade foi atingida pela primeira bomba atômica usada em guerra?|Hiroshima|Nagasaki|Tóquio|Osaka|Foi em 6 de agosto de 1945; Nagasaki foi atingida três dias depois.
m|Qual civilização construiu Machu Picchu?|Incas|Astecas|Maias|Olmecas|A cidadela fica nos Andes peruanos.
m|Qual era a capital do Império Asteca?|Tenochtitlán|Cusco|Chichén Itzá|Teotihuacán|Onde hoje fica a Cidade do México.
m|Quem liderou a resistência não violenta pela independência da Índia?|Mahatma Gandhi|Jawaharlal Nehru|Sidarta Gautama|Indira Gandhi|A Índia ficou independente do Reino Unido em 1947.
m|Em que ano a família real portuguesa chegou ao Brasil?|1808|1822|1789|1815|Ela fugia das tropas de Napoleão.
m|Qual guerra opôs Brasil, Argentina e Uruguai ao Paraguai?|Guerra do Paraguai|Guerra dos Farrapos|Guerra de Canudos|Guerra do Contestado|Durou de 1864 a 1870 (Tríplice Aliança).
m|Qual filósofo grego foi professor de Alexandre, o Grande?|Aristóteles|Platão|Sócrates|Pitágoras|Aristóteles foi aluno de Platão.
m|Qual país lançou o Sputnik, o primeiro satélite artificial?|União Soviética|Estados Unidos|China|Alemanha|O Sputnik 1 foi lançado em 1957.
m|Qual povo nórdico saqueava o litoral europeu entre os séculos VIII e XI?|Vikings|Celtas|Hunos|Mongóis|Eram navegadores da Escandinávia.
m|Qual rainha governou o Reino Unido por mais de 70 anos, até 2022?|Elizabeth II|Vitória|Elizabeth I|Ana|Ela reinou de 1952 a 2022.
m|Quem foi o primeiro presidente dos Estados Unidos?|George Washington|Abraham Lincoln|Thomas Jefferson|John Adams|Governou de 1789 a 1797.
m|Qual era a língua do Império Romano?|Latim|Grego|Italiano|Aramaico|Do latim vieram o português, o espanhol, o italiano e o francês.
m|Qual faraó teve o túmulo quase intacto descoberto em 1922?|Tutancâmon|Ramsés II|Quéops|Akhenaton|O túmulo foi encontrado por Howard Carter.
m|Qual era o líder do Quilombo dos Palmares no fim do século XVII?|Zumbi|Ganga Zumba|Tiradentes|Antônio Conselheiro|O 20 de novembro, Dia da Consciência Negra, lembra Zumbi.
m|Quem liderou o arraial de Canudos, na Bahia?|Antônio Conselheiro|Lampião|Padre Cícero|Zumbi|A guerra de Canudos terminou em 1897.
m|Qual era o apelido de Virgulino Ferreira da Silva, o cangaceiro mais famoso?|Lampião|Corisco|Volta Seca|Antônio Silvino|Lampião andava com Maria Bonita.
m|Quem é chamado de “Pai da Aviação” no Brasil, pelo voo do 14-Bis?|Santos Dumont|Irmãos Wright|Bartolomeu de Gusmão|Augusto Severo|O voo foi em Paris, em 1906.
m|Qual guerra envolveu os Estados Unidos no Sudeste Asiático entre 1955 e 1975?|Guerra do Vietnã|Guerra da Coreia|Guerra do Golfo|Guerra dos Seis Dias|Terminou com a queda de Saigon.
m|Qual cidade grega antiga é considerada o berço da democracia?|Atenas|Esparta|Tebas|Corinto|Na democracia ateniense, os cidadãos votavam em assembleia.
m|Em que dia é lembrado Tiradentes no Brasil?|21 de abril|7 de setembro|15 de novembro|12 de outubro|Tiradentes foi executado em 21 de abril de 1792.
m|Qual inventor patenteou a lâmpada incandescente de uso comercial em 1879?|Thomas Edison|Nikola Tesla|Graham Bell|Isaac Newton|Edison aperfeiçoou o filamento para durar muitas horas.
d|Em que ano caiu o Império Romano do Ocidente?|476|1453|1066|800|O último imperador, Rômulo Augusto, foi deposto em 476.
d|Qual cidade foi tomada pelos otomanos em 1453, encerrando o Império Bizantino?|Constantinopla|Roma|Atenas|Alexandria|Hoje a cidade se chama Istambul.
d|Qual líder mongol fundou o maior império contínuo da história?|Gengis Khan|Kublai Khan|Átila|Tamerlão|O império mongol ia da China ao leste da Europa.
d|Qual documento inglês de 1215 limitou o poder do rei?|Magna Carta|Bill of Rights|Ato de Supremacia|Petição de Direitos|Foi assinada pelo rei João sem Terra.
d|Em que ano a África do Sul teve suas primeiras eleições multirraciais?|1994|1990|1985|2000|Nelson Mandela foi eleito presidente.
d|Que dinastia chinesa construiu a maior parte da Muralha que vemos hoje?|Ming|Qin|Han|Tang|Os trechos de tijolo mais conhecidos são da dinastia Ming.
d|Qual batalha de 1066 marcou a conquista normanda da Inglaterra?|Batalha de Hastings|Batalha de Agincourt|Batalha de Waterloo|Batalha de Poitiers|Guilherme, o Conquistador, venceu o rei Haroldo.
d|Qual crise de 1962 quase levou EUA e URSS a uma guerra nuclear?|Crise dos Mísseis de Cuba|Crise de Suez|Bloqueio de Berlim|Guerra da Coreia|Mísseis soviéticos foram instalados em Cuba.
d|Em que ano a Revolução Russa levou os bolcheviques ao poder?|1917|1905|1922|1991|A Revolução de Outubro foi liderada por Lenin.
d|Qual rei francês foi guilhotinado em 1793?|Luís XVI|Luís XIV|Luís XV|Carlos X|Sua esposa, Maria Antonieta, também foi executada.
d|O que foi a Inconfidência Mineira?|Um movimento contra a Coroa portuguesa em 1789|Uma revolta de escravizados em 1835|Uma guerra contra o Paraguai|O golpe que proclamou a República|Os inconfidentes reagiam aos impostos sobre o ouro; Tiradentes foi seu mártir.
d|Qual período da história do Brasil é chamado de “Era Vargas”?|1930 a 1945|1945 a 1964|1889 a 1930|1964 a 1985|Inclui o Governo Provisório, o Constitucional e o Estado Novo.
d|Em que ano começou o regime militar no Brasil?|1964|1968|1954|1979|O regime durou até 1985.
d|Qual movimento de 1983–1984 pediu eleições diretas para presidente no Brasil?|Diretas Já|Caras-pintadas|Tenentismo|Marcha da Família|Comícios reuniram milhões de pessoas.
d|Qual expedição completou a primeira volta ao mundo (1519–1522)?|A de Fernão de Magalhães|A de Cristóvão Colombo|A de Pedro Álvares Cabral|A de James Cook|Magalhães morreu nas Filipinas; Juan Sebastián Elcano completou a viagem.
d|Qual povo antigo criou o Código de Hamurábi?|Babilônios|Egípcios|Hebreus|Fenícios|É um dos mais antigos conjuntos de leis escritas.
d|Que povo criou o alfabeto que deu origem ao grego e ao latino?|Fenícios|Sumérios|Egípcios|Persas|Os fenícios eram grandes comerciantes do Mediterrâneo.`,

geo:`f|Qual é o maior oceano do mundo?|Pacífico|Atlântico|Índico|Ártico|O Pacífico cobre cerca de um terço da superfície da Terra.
f|Qual é o maior país do mundo em área?|Rússia|Canadá|China|Estados Unidos|A Rússia tem mais de 17 milhões de km².
f|Qual é o continente mais populoso?|Ásia|África|Europa|América|Mais da metade da população mundial vive na Ásia.
f|Qual é a capital da Argentina?|Buenos Aires|Montevidéu|Santiago|Córdoba|Montevidéu é a capital do Uruguai.
f|Qual é a capital de Portugal?|Lisboa|Porto|Coimbra|Madri|Lisboa fica às margens do rio Tejo.
f|Qual é a capital da França?|Paris|Lyon|Marselha|Bruxelas|Bruxelas é a capital da Bélgica.
f|Qual é a capital do Japão?|Tóquio|Quioto|Osaka|Pequim|Quioto foi a capital imperial por mais de mil anos.
f|Em que continente fica o Egito?|África|Ásia|Europa|Oceania|Só a península do Sinai fica na Ásia.
f|Qual é o rio com o maior volume de água do mundo?|Amazonas|Nilo|Mississippi|Yangtzé|O Amazonas despeja no mar mais água que qualquer outro rio.
f|Qual é a montanha mais alta do mundo?|Everest|K2|Aconcágua|Kilimanjaro|O Everest tem cerca de 8.849 m, na fronteira do Nepal com a China.
f|Qual país tem o formato de uma bota?|Itália|Grécia|Espanha|Chile|A península Itálica lembra uma bota.
f|Qual é o maior deserto quente do mundo?|Saara|Atacama|Gobi|Kalahari|O Saara ocupa boa parte do norte da África.
f|Qual linha imaginária divide a Terra em hemisférios Norte e Sul?|Linha do Equador|Meridiano de Greenwich|Trópico de Capricórnio|Trópico de Câncer|O meridiano de Greenwich divide Leste e Oeste.
f|Qual é o maior país da América do Sul?|Brasil|Argentina|Peru|Colômbia|O Brasil ocupa quase metade do continente.
f|Qual é o continente mais frio?|Antártida|Europa|Ásia|América|A Antártida tem as temperaturas mais baixas já medidas.
f|Qual é a capital da Alemanha?|Berlim|Munique|Frankfurt|Hamburgo|Berlim voltou a ser capital da Alemanha unificada em 1990.
f|Qual é a capital do México?|Cidade do México|Guadalajara|Cancún|Monterrey|A cidade foi construída sobre a antiga Tenochtitlán.
f|Qual é a capital da Rússia?|Moscou|São Petersburgo|Kiev|Minsk|Kiev é a capital da Ucrânia; Minsk, de Belarus.
m|Qual é a capital da Austrália?|Camberra|Sydney|Melbourne|Perth|Camberra foi planejada para ser a capital, entre Sydney e Melbourne.
m|Qual é a capital do Canadá?|Ottawa|Toronto|Vancouver|Montreal|Toronto é a maior cidade, mas a capital é Ottawa.
m|Qual é a capital da Turquia?|Ancara|Istambul|Izmir|Antália|Istambul é a maior cidade turca.
m|Qual é a montanha mais alta das Américas?|Aconcágua|Denali|Chimborazo|Pico da Neblina|Fica na Argentina e tem cerca de 6.960 m.
m|Qual é o país mais populoso da África?|Nigéria|Egito|Etiópia|África do Sul|A Nigéria tem mais de 200 milhões de habitantes.
m|Qual país passou a ser o mais populoso do mundo em 2023, segundo a ONU?|Índia|China|Estados Unidos|Indonésia|A Índia ultrapassou a China.
m|Qual é o menor país do mundo?|Vaticano|Mônaco|San Marino|Liechtenstein|O Vaticano tem menos de meio quilômetro quadrado.
m|Em que país fica Machu Picchu?|Peru|Bolívia|Chile|Equador|Fica perto de Cusco, nos Andes.
m|Qual é a capital do Egito?|Cairo|Alexandria|Luxor|Gizé|As pirâmides de Gizé ficam ao lado do Cairo.
m|Qual é a capital do Chile?|Santiago|Valparaíso|Lima|La Paz|Lima é a capital do Peru.
m|Além da Bolívia, qual país sul-americano não tem saída para o mar?|Paraguai|Uruguai|Equador|Venezuela|Paraguai e Bolívia são os únicos sem litoral na América do Sul.
m|Qual estreito separa a Europa da África?|Estreito de Gibraltar|Estreito de Bósforo|Estreito de Magalhães|Estreito de Bering|Tem cerca de 14 km na parte mais estreita.
m|Qual canal liga o Atlântico ao Pacífico na América Central?|Canal do Panamá|Canal de Suez|Canal da Mancha|Canal de Corinto|Foi inaugurado em 1914.
m|Qual canal liga o Mar Mediterrâneo ao Mar Vermelho?|Canal de Suez|Canal do Panamá|Canal de Kiel|Estreito de Ormuz|Fica no Egito e foi inaugurado em 1869.
m|Qual é a maior ilha do mundo?|Groenlândia|Nova Guiné|Bornéu|Madagascar|A Austrália é considerada continente, não ilha.
m|Qual cordilheira é tradicionalmente usada como limite entre Europa e Ásia?|Montes Urais|Cáucaso|Alpes|Cárpatos|Os Urais atravessam a Rússia de norte a sul.
m|Qual é a capital da Coreia do Sul?|Seul|Busan|Pyongyang|Incheon|Pyongyang é a capital da Coreia do Norte.
m|Qual é a capital da Índia?|Nova Délhi|Mumbai|Calcutá|Bangalore|Mumbai é a maior cidade indiana.
m|Qual oceano banha a costa leste da África?|Índico|Atlântico|Pacífico|Ártico|O Atlântico banha a costa oeste.
m|Além da Argentina, em que país fica a Patagônia?|Chile|Uruguai|Paraguai|Bolívia|A Patagônia é o extremo sul do continente.
m|Qual trópico passa perto da cidade de São Paulo?|Trópico de Capricórnio|Trópico de Câncer|Linha do Equador|Círculo Polar Antártico|O Trópico de Capricórnio corta o estado de São Paulo.
m|Qual é o deserto mais seco do mundo, fora as regiões polares?|Atacama|Saara|Gobi|Namibe|Fica no norte do Chile.
d|Qual é a capital da Nova Zelândia?|Wellington|Auckland|Christchurch|Queenstown|Auckland é a maior cidade, mas a capital é Wellington.
d|Qual é a capital do Marrocos?|Rabat|Casablanca|Marrakech|Fez|Casablanca é a maior cidade do país.
d|Qual cidade é a sede do governo federal da Suíça?|Berna|Zurique|Genebra|Basileia|Zurique e Genebra são maiores, mas o governo fica em Berna.
d|Qual país tem mais fusos horários, contando seus territórios?|França|Rússia|Estados Unidos|Reino Unido|Com seus territórios ultramarinos, a França tem 12 fusos.
d|Qual é o lago mais profundo do mundo?|Baikal|Titicaca|Superior|Vitória|O Baikal, na Sibéria, passa de 1.600 m de profundidade.
d|Qual é o rio mais longo da Europa?|Volga|Danúbio|Reno|Sena|O Volga corre só pela Rússia e deságua no Mar Cáspio.
d|Onde fica o ponto mais baixo em terra firme do planeta?|Nas margens do Mar Morto|No Vale da Morte|Na Fossa das Marianas|Na Depressão de Qattara|Fica mais de 400 m abaixo do nível do mar.
d|Qual destes países NÃO é cortado pela Linha do Equador?|Peru|Equador|Colômbia|Brasil|O Peru fica todo ao sul da linha, por pouco.
d|Qual é a capital da Islândia?|Reykjavík|Oslo|Helsinque|Copenhague|É a capital mais ao norte de um país independente.
d|Qual é a capital do Quênia?|Nairóbi|Mombaça|Adis Abeba|Kampala|Adis Abeba é a capital da Etiópia.
d|Qual é o maior país da América do Sul depois do Brasil?|Argentina|Peru|Colômbia|Bolívia|A Argentina tem cerca de 2,8 milhões de km².
d|Qual cidade é a sede do governo da Bolívia?|La Paz|Sucre|Santa Cruz de la Sierra|Cochabamba|Sucre é a capital constitucional; o governo fica em La Paz.
d|Qual é o maior lago do mundo, sem ligação natural com o oceano?|Mar Cáspio|Mar Morto|Mar Negro|Mar de Aral|Apesar do nome, o Cáspio é considerado um lago.
d|Qual é a capital da Noruega?|Oslo|Bergen|Estocolmo|Helsinque|Estocolmo é a capital da Suécia.`,

cie:`f|Qual é o planeta mais próximo do Sol?|Mercúrio|Vênus|Marte|Terra|Mercúrio dá uma volta no Sol em 88 dias.
f|Qual é o maior planeta do Sistema Solar?|Júpiter|Saturno|Netuno|Terra|Júpiter caberia mais de mil Terras.
f|Qual é a fórmula química da água?|H₂O|CO₂|O₂|NaCl|Dois átomos de hidrogênio e um de oxigênio.
f|Qual planeta é conhecido como “planeta vermelho”?|Marte|Vênus|Júpiter|Mercúrio|A cor vem do óxido de ferro no solo.
f|Que gás as plantas absorvem do ar na fotossíntese?|Gás carbônico|Oxigênio|Nitrogênio|Hélio|Elas absorvem gás carbônico e liberam oxigênio.
f|Quantos ossos tem o corpo humano adulto?|206|186|256|300|Os bebês nascem com mais ossos, que se fundem com o tempo.
f|Qual órgão bombeia o sangue pelo corpo?|Coração|Pulmão|Fígado|Rim|O coração bate cerca de 100 mil vezes por dia.
f|Qual é a estrela mais próxima da Terra?|Sol|Alfa Centauri|Sírius|Estrela Polar|Depois do Sol, a mais próxima é Proxima Centauri.
f|A que temperatura a água ferve ao nível do mar?|100 °C|90 °C|80 °C|120 °C|Em lugares altos, ela ferve a uma temperatura menor.
f|Qual é o maior órgão do corpo humano?|Pele|Fígado|Intestino|Cérebro|A pele protege o corpo e regula a temperatura.
f|Quantas patas tem um inseto?|6|8|4|10|Aranhas têm 8 patas e não são insetos.
f|Qual é o satélite natural da Terra?|Lua|Sol|Marte|Europa|Europa é uma lua de Júpiter.
f|Que inseto produz o mel?|Abelha|Vespa|Formiga|Borboleta|As abelhas fazem mel a partir do néctar das flores.
f|Que mamífero é capaz de voar de verdade?|Morcego|Pinguim|Avestruz|Esquilo-voador|O esquilo-voador apenas plana.
m|Qual é o símbolo químico do ouro?|Au|Ag|Go|Or|Vem do latim “aurum”. Ag é a prata.
m|Qual é o símbolo químico do sódio?|Na|So|Sd|S|Vem do latim “natrium”. S é o enxofre.
m|Qual cientista formulou a teoria da relatividade?|Albert Einstein|Isaac Newton|Galileu Galilei|Stephen Hawking|A relatividade especial é de 1905; a geral, de 1915.
m|Qual cientista propôs a evolução por seleção natural?|Charles Darwin|Gregor Mendel|Louis Pasteur|Jean-Baptiste Lamarck|O livro “A Origem das Espécies” é de 1859.
m|Qual é a velocidade aproximada da luz no vácuo?|300 mil km/s|30 mil km/s|3 milhões de km/s|340 m/s|340 m/s é a velocidade do som no ar.
m|Em que parte da célula fica o material genético, nas células eucariontes?|Núcleo|Membrana|Ribossomo|Parede celular|O DNA fica guardado no núcleo.
m|Qual é o gás mais abundante na atmosfera da Terra?|Nitrogênio|Oxigênio|Gás carbônico|Argônio|O nitrogênio é cerca de 78% do ar.
m|Que vitamina o corpo produz com a exposição ao sol?|Vitamina D|Vitamina C|Vitamina A|Vitamina B12|A vitamina D ajuda a fixar o cálcio nos ossos.
m|Qual tipo de sangue é conhecido como doador universal de hemácias?|O negativo|AB positivo|A positivo|B negativo|AB positivo é o receptor universal.
m|Qual planeta tem os anéis mais visíveis?|Saturno|Júpiter|Urano|Netuno|Todos os gigantes gasosos têm anéis, mas os de Saturno são os maiores.
m|Quantos planetas tem o Sistema Solar?|8|9|7|10|Plutão passou a ser planeta-anão em 2006.
m|Qual é a unidade de medida da corrente elétrica?|Ampère|Volt|Watt|Ohm|Volt mede tensão; ohm, resistência; watt, potência.
m|Qual metal é líquido à temperatura ambiente?|Mercúrio|Chumbo|Alumínio|Ferro|O mercúrio era usado em termômetros antigos.
m|Quem descobriu a penicilina?|Alexander Fleming|Louis Pasteur|Marie Curie|Edward Jenner|Fleming fez a descoberta em 1928, a partir de um fungo.
m|Qual organela é chamada de “usina de energia” da célula?|Mitocôndria|Complexo de Golgi|Lisossomo|Ribossomo|A mitocôndria faz a respiração celular.
m|O que mede a escala Richter?|A magnitude de terremotos|A força dos ventos|A acidez|A temperatura|Cada ponto a mais representa cerca de 32 vezes mais energia.
m|Qual é o pH da água pura a 25 °C?|7|0|14|5|pH 7 é neutro; abaixo é ácido, acima é básico.
m|Qual é o maior animal que já existiu?|Baleia-azul|Tiranossauro|Elefante-africano|Megalodonte|A baleia-azul pode passar de 30 m de comprimento.
m|Qual é o osso mais longo do corpo humano?|Fêmur|Tíbia|Úmero|Rádio|O fêmur é o osso da coxa.
m|Quem formulou as três leis do movimento e a gravitação universal?|Isaac Newton|Galileu Galilei|Johannes Kepler|Albert Einstein|Os “Principia” de Newton são de 1687.
m|Qual é a molécula que carrega a informação genética?|DNA|ATP|Glicose|Hemoglobina|DNA é o ácido desoxirribonucleico.
m|Que células do sangue combatem as infecções?|Leucócitos|Hemácias|Plaquetas|Plasma|As hemácias levam oxigênio; as plaquetas ajudam na coagulação.
m|Em qual galáxia fica o Sistema Solar?|Via Láctea|Andrômeda|Triângulo|Grande Nuvem de Magalhães|A Via Láctea é uma galáxia espiral.
m|Qual é a fórmula do sal de cozinha?|NaCl|KCl|NaOH|CaCO₃|Cloreto de sódio.
d|Qual é o elemento químico mais abundante no universo?|Hidrogênio|Hélio|Oxigênio|Carbono|Cerca de três quartos da matéria comum é hidrogênio.
d|Qual é o número atômico do carbono?|6|12|8|14|O carbono tem 6 prótons; 12 é a massa do isótopo mais comum.
d|Quem foi a primeira pessoa a ganhar dois prêmios Nobel?|Marie Curie|Linus Pauling|Albert Einstein|Niels Bohr|Ganhou em Física (1903) e Química (1911).
d|Em qual camada da atmosfera fica a maior parte do ozônio?|Estratosfera|Troposfera|Mesosfera|Termosfera|A camada de ozônio filtra a radiação ultravioleta.
d|Quantos cromossomos tem uma célula humana comum?|46|23|48|44|São 23 pares; os gametas têm 23.
d|Qual é a unidade de frequência no Sistema Internacional?|Hertz|Joule|Pascal|Newton|1 hertz é um ciclo por segundo.
d|Em qual planeta o dia é mais longo que o ano?|Vênus|Mercúrio|Marte|Júpiter|Vênus gira muito devagar: uma rotação leva cerca de 243 dias terrestres.
d|Como se chama a passagem direta do estado sólido para o gasoso?|Sublimação|Evaporação|Condensação|Fusão|É o que acontece com o gelo-seco.
d|Que lei diz que a toda ação corresponde uma reação de mesma intensidade e sentido oposto?|Terceira lei de Newton|Primeira lei de Newton|Lei de Ohm|Lei de Hooke|É o princípio da ação e reação.
d|Qual gás nobre é usado em letreiros luminosos avermelhados?|Neônio|Argônio|Hélio|Xenônio|Por isso esses letreiros são chamados de “neon”.
d|Qual parte do encéfalo coordena o equilíbrio e os movimentos?|Cerebelo|Bulbo|Hipotálamo|Córtex frontal|O cerebelo fica na parte de trás, embaixo do cérebro.
d|Qual é, aproximadamente, a temperatura do zero absoluto em graus Celsius?|−273 °C|−100 °C|0 °C|−459 °C|−459 é o valor aproximado em Fahrenheit.
d|Quantos corações tem um polvo?|3|1|2|4|Dois bombeiam sangue para as brânquias e um para o corpo.
d|Qual mamífero bota ovos, além das equidnas?|Ornitorrinco|Canguru|Coala|Tatu|Ornitorrinco e equidnas são os monotremados.
d|Qual planeta tem o eixo tão inclinado que gira quase “deitado”?|Urano|Netuno|Saturno|Marte|A inclinação de Urano é de cerca de 98°.`,

esp:`f|Quantos jogadores um time de futebol tem em campo?|11|10|12|9|Dez na linha e um goleiro.
f|Quantas Copas do Mundo de futebol masculino o Brasil já ganhou?|5|4|6|3|1958, 1962, 1970, 1994 e 2002.
f|Em que esporte se usam raquete e peteca?|Badminton|Tênis|Squash|Tênis de mesa|O badminton é disputado com uma peteca de penas.
f|Qual esporte é jogado na NBA?|Basquete|Beisebol|Futebol americano|Hóquei no gelo|A NBA é a liga profissional de basquete dos Estados Unidos.
f|Quantos pontos vale uma cesta de fora da linha de três no basquete?|3|2|4|1|Lances livres valem 1 ponto.
f|Qual é o apelido de Edson Arantes do Nascimento?|Pelé|Garrincha|Zico|Didi|Pelé é tricampeão mundial (1958, 1962, 1970).
f|Quantos jogadores um time de vôlei tem em quadra?|6|5|7|11|No vôlei de praia são 2.
f|Em que esporte se disputa o torneio de Wimbledon?|Tênis|Golfe|Atletismo|Críquete|É o torneio de tênis mais antigo, jogado na grama.
f|De quantos em quantos anos acontecem os Jogos Olímpicos de Verão?|4|2|3|5|Os Jogos de 2021 foram exceção, adiados pela pandemia.
f|Quantos anéis tem a bandeira olímpica?|5|4|6|7|Os anéis representam os continentes unidos pelo esporte.
f|Quantos jogadores um time de basquete tem em quadra?|5|6|7|4|Cada time tem 5 jogadores em quadra.
f|Qual é o tempo regulamentar de uma partida de futebol?|90 minutos|80 minutos|100 minutos|60 minutos|Dois tempos de 45 minutos.
f|Qual é o apelido da seleção brasileira de futebol, por causa do uniforme amarelo?|Canarinho|Tucano|Sabiá|Bem-te-vi|“Seleção Canarinho” virou apelido na década de 1950.
m|Em que esporte se usam os golpes “ippon” e “wazari”?|Judô|Caratê|Boxe|Esgrima|Um ippon encerra a luta de judô.
m|Em que ano o Brasil sediou pela segunda vez uma Copa do Mundo?|2014|2010|2006|1998|A primeira foi em 1950.
m|Qual seleção venceu a Copa do Mundo de 2014?|Alemanha|Argentina|Brasil|Espanha|A Alemanha venceu a Argentina na final, no Maracanã.
m|Qual seleção venceu a Copa do Mundo de 2022, no Catar?|Argentina|França|Croácia|Brasil|A Argentina venceu a França nos pênaltis.
m|Qual piloto brasileiro foi tricampeão de Fórmula 1 e morreu em 1994?|Ayrton Senna|Nelson Piquet|Emerson Fittipaldi|Rubens Barrichello|Senna foi campeão em 1988, 1990 e 1991.
m|Em que cidade foram os Jogos Olímpicos de 2016?|Rio de Janeiro|Londres|Tóquio|Pequim|Foram os primeiros Jogos na América do Sul.
m|Qual é a distância oficial de uma maratona?|42,195 km|40 km|21,097 km|50 km|21,097 km é a meia maratona.
m|Quantos sets, no máximo, pode ter uma partida de vôlei?|5|3|4|7|Vence quem ganhar 3 sets; o 5º vai até 15 pontos.
m|No futebol, o que acontece com quem recebe dois cartões amarelos no mesmo jogo?|É expulso|Paga uma multa|Sai por 10 minutos|Nada|O segundo amarelo vira vermelho.
m|Qual país criou as regras do futebol moderno, em 1863?|Inglaterra|Brasil|França|Itália|A Football Association foi fundada em Londres.
m|Qual atleta jamaicano é recordista mundial dos 100 m rasos?|Usain Bolt|Carl Lewis|Yohan Blake|Asafa Powell|9,58 s, em 2009.
m|Qual nadador tem o maior número de medalhas de ouro olímpicas?|Michael Phelps|Mark Spitz|Ryan Lochte|Ian Thorpe|Phelps ganhou 23 ouros.
m|Qual é o esporte de Rayssa Leal, medalhista olímpica?|Skate|Surfe|Ginástica|Judô|Ela ganhou prata em Tóquio aos 13 anos.
m|Qual é o esporte de Gabriel Medina?|Surfe|Skate|Natação|Vela|Medina foi campeão mundial de surfe em 2014, 2018 e 2021.
m|Quantos buracos tem um campo de golfe padrão?|18|9|12|21|Campos menores podem ter 9 buracos.
m|No xadrez, qual peça só anda na diagonal?|Bispo|Torre|Cavalo|Rei|A torre anda em linha reta e o cavalo em “L”.
m|Em que esporte se usa o termo “strike” quando todos os pinos caem de uma vez?|Boliche|Golfe|Hóquei|Tênis|São 10 pinos no boliche.
m|Qual ginasta brasileira ganhou ouro olímpico no salto em Tóquio 2020?|Rebeca Andrade|Daiane dos Santos|Flávia Saraiva|Jade Barbosa|Rebeca também ganhou ouro no solo em Paris 2024.
m|Como se chama a jogada do vôlei em que se ataca a bola com força para baixo?|Cortada|Levantamento|Saque|Bloqueio|A cortada costuma vir depois do levantamento.
m|No tênis, como se chama o placar zero?|Love|Zero|Nil|Deuce|“Deuce” é o empate em 40 a 40.
m|Qual é o estilo de natação mais rápido?|Crawl (nado livre)|Costas|Peito|Borboleta|No nado livre quase todos usam o crawl.
m|Qual esporte mistura futebol e vôlei e foi criado no Rio de Janeiro?|Futevôlei|Frescobol|Beach soccer|Peteca|Joga-se na areia, sem usar as mãos.
m|Qual esporte de praia carioca é jogado com raquetes de madeira, sem rede e sem vencedor?|Frescobol|Beach tennis|Futevôlei|Peteca|O objetivo é não deixar a bola cair.
m|Qual time de Belo Horizonte é conhecido como “Galo”?|Atlético Mineiro|Cruzeiro|América Mineiro|Villa Nova|O Cruzeiro é a “Raposa”; o América, o “Coelho”.
m|Em 1950, qual seleção perdeu o jogo decisivo da Copa para o Uruguai no Maracanã?|Brasil|Argentina|Itália|Suécia|A derrota ficou conhecida como “Maracanazo”.
m|Qual é o esporte de Hugo Calderano?|Tênis de mesa|Tênis|Badminton|Squash|Ele é o mesatenista brasileiro mais bem colocado da história.
d|Qual clube é o maior campeão da Copa Libertadores?|Independiente|Boca Juniors|River Plate|Estudiantes|O Independiente, da Argentina, tem 7 títulos.
d|Em que ano Pelé ganhou sua primeira Copa do Mundo?|1958|1962|1970|1954|Ele tinha 17 anos, na Copa da Suécia.
d|Qual país sediou a primeira Copa do Mundo, em 1930?|Uruguai|Itália|Brasil|França|O Uruguai também foi o campeão.
d|Quais pilotos dividem o recorde de 7 títulos da Fórmula 1?|Lewis Hamilton e Michael Schumacher|Ayrton Senna e Alain Prost|Juan Manuel Fangio e Sebastian Vettel|Niki Lauda e Nelson Piquet|Fangio, com 5, foi recordista por décadas.
d|Qual jogadora brasileira foi eleita seis vezes a melhor do mundo pela FIFA?|Marta|Formiga|Cristiane|Sissi|Marta também é a maior artilheira das Copas, entre homens e mulheres.
d|Qual é a altura oficial da rede de vôlei masculino?|2,43 m|2,24 m|2,50 m|2,10 m|No feminino, a rede tem 2,24 m.
d|Em que esporte se disputa a Stanley Cup?|Hóquei no gelo|Beisebol|Futebol americano|Rúgbi|É o troféu da NHL.
d|Quantos pontos vale um touchdown no futebol americano?|6|7|3|5|Depois dele, o time ainda pode tentar o ponto extra.
d|Em que ano o futebol feminino estreou nos Jogos Olímpicos?|1996|1984|2000|1992|Foi em Atlanta, nos Estados Unidos.
d|Qual brasileiro foi o primeiro eleito melhor jogador do mundo pela FIFA, em 1994?|Romário|Ronaldo|Rivaldo|Bebeto|Romário foi o craque do tetra.
d|Quantos jogadores um time de handebol tem em quadra?|7|6|5|11|Seis na linha e um goleiro.
d|Qual é o nome oficial do estádio do Maracanã?|Estádio Jornalista Mário Filho|Estádio Governador Magalhães Pinto|Estádio Cícero Pompeu de Toledo|Estádio Paulo Machado de Carvalho|Magalhães Pinto é o Mineirão; Cícero Pompeu de Toledo, o Morumbi.
d|Qual é o nome oficial do Mineirão?|Estádio Governador Magalhães Pinto|Estádio Jornalista Mário Filho|Estádio Raimundo Sampaio|Estádio Castelão|Raimundo Sampaio é o Independência.`,

mus:`f|Quantas notas tem a escala musical tradicional (dó, ré, mi...)?|7|5|8|12|Dó, ré, mi, fá, sol, lá, si.
f|Qual instrumento tem teclas brancas e pretas?|Piano|Violão|Flauta|Bateria|As teclas pretas são os sustenidos e bemóis.
f|Quantas cordas tem um violão comum?|6|4|5|7|Existe também o violão de sete cordas, usado no choro.
f|Qual ritmo é a base das escolas de samba?|Samba|Forró|Axé|Frevo|As escolas desfilam no Carnaval com samba-enredo.
f|Qual banda britânica era formada por John, Paul, George e Ringo?|The Beatles|The Rolling Stones|Queen|The Who|Os Beatles surgiram em Liverpool.
f|Qual cantor é conhecido como o “Rei do Rock”?|Elvis Presley|Michael Jackson|Chuck Berry|Little Richard|Elvis fez sucesso a partir dos anos 1950.
f|Qual cantor é conhecido como o “Rei do Pop”?|Michael Jackson|Elvis Presley|Prince|Stevie Wonder|“Thriller” é o álbum mais vendido da história.
f|Qual ritmo nordestino é tocado com sanfona, zabumba e triângulo?|Forró|Samba|Bossa nova|Pagode|É o “trio pé de serra”.
f|Qual destes é um instrumento de percussão?|Pandeiro|Violino|Flauta|Trompete|O pandeiro é essencial no samba e no choro.
f|Qual instrumento tem bumbo, caixa e pratos e é tocado com baquetas?|Bateria|Piano|Harpa|Acordeão|A bateria marca o ritmo nas bandas.
f|Qual ritmo baiano fez sucesso no Carnaval de Salvador com os trios elétricos?|Axé|Bossa nova|Sertanejo|Choro|O axé explodiu nos anos 1980 e 1990.
f|Chitãozinho & Xororó são uma dupla de qual estilo musical?|Sertanejo|Pagode|Rock|Forró|O sertanejo é um dos gêneros mais ouvidos do Brasil.
f|Quantos músicos tem um quarteto?|4|3|5|2|Trio tem 3 e quinteto, 5.
m|Quem é conhecido como o “Rei do Baião”?|Luiz Gonzaga|Dominguinhos|Jackson do Pandeiro|Gilberto Gil|Luiz Gonzaga levou a música nordestina para todo o Brasil.
m|Qual música de Tom Jobim e Vinicius de Moraes é uma das mais gravadas do mundo?|Garota de Ipanema|Aquarela do Brasil|Asa Branca|Carinhoso|Foi composta em 1962.
m|Qual movimento musical surgiu no fim dos anos 1950 com João Gilberto?|Bossa nova|Tropicália|Jovem Guarda|Manguebeat|A batida do violão de João Gilberto virou marca da bossa nova.
m|Quais artistas lideraram a Tropicália?|Caetano Veloso e Gilberto Gil|Roberto e Erasmo Carlos|Tom Jobim e Vinicius|Chico Buarque e Milton Nascimento|O movimento é do fim dos anos 1960.
m|Quem é chamado de “Rei” da música brasileira e liderou a Jovem Guarda?|Roberto Carlos|Erasmo Carlos|Tim Maia|Wanderléa|A Jovem Guarda era o rock romântico dos anos 1960.
m|Qual ritmo pernambucano é dançado com pequenas sombrinhas coloridas?|Frevo|Maracatu|Xote|Coco|O frevo é Patrimônio Imaterial da Humanidade.
m|Qual compositor alemão continuou compondo mesmo depois de ficar surdo?|Ludwig van Beethoven|Wolfgang Amadeus Mozart|Johann Sebastian Bach|Richard Wagner|A Nona Sinfonia foi composta quando ele já era surdo.
m|Quem compôs a ópera “A Flauta Mágica”?|Mozart|Beethoven|Haydn|Schubert|Mozart era austríaco e morreu aos 35 anos.
m|Qual compositor brasileiro escreveu as “Bachianas Brasileiras”?|Heitor Villa-Lobos|Carlos Gomes|Tom Jobim|Chiquinha Gonzaga|Ele misturou Bach com a música brasileira.
m|Quem compôs “Ó Abre Alas”, considerada a primeira marchinha de Carnaval?|Chiquinha Gonzaga|Noel Rosa|Pixinguinha|Ary Barroso|A marchinha é de 1899.
m|Quem compôs “Aquarela do Brasil”?|Ary Barroso|Noel Rosa|Cartola|Dorival Caymmi|A música é de 1939.
m|Qual cantora brasileira tinha o apelido de “Pimentinha”?|Elis Regina|Gal Costa|Maria Bethânia|Clara Nunes|Elis gravou “Como Nossos Pais” e “O Bêbado e a Equilibrista”.
m|Quem compôs e gravou “Construção” (1971)?|Chico Buarque|Caetano Veloso|Milton Nascimento|Djavan|Os versos terminam todos em palavras proparoxítonas.
m|Quantas cordas tem um cavaquinho?|4|6|5|8|O cavaquinho é essencial no samba e no choro.
m|Qual banda de Brasília gravou “Que País É Este”?|Legião Urbana|Titãs|Paralamas do Sucesso|Barão Vermelho|A banda era liderada por Renato Russo.
m|Qual banda gravou “Bohemian Rhapsody”?|Queen|The Beatles|Pink Floyd|Led Zeppelin|A música é de 1975, com Freddie Mercury.
m|Qual banda gravou “Smells Like Teen Spirit”?|Nirvana|Pearl Jam|Foo Fighters|Metallica|O sucesso é de 1991.
m|Qual cantor mineiro gravou “Travessia” e “Canção da América”?|Milton Nascimento|Beto Guedes|Lô Borges|Flávio Venturini|Milton é um dos nomes do Clube da Esquina.
m|Em que cidade surgiu o Clube da Esquina?|Belo Horizonte|Rio de Janeiro|Salvador|São Paulo|A esquina fica no bairro Santa Tereza.
m|Como se chama o conjunto de cinco linhas onde se escrevem as notas?|Pauta (pentagrama)|Clave|Compasso|Partitura|A clave fica no início da pauta.
m|Quem compôs “As Quatro Estações”?|Antonio Vivaldi|Johann Sebastian Bach|Georg Friedrich Händel|Mozart|Vivaldi era italiano, do período barroco.
m|Qual clave é usada para as notas mais agudas, como as do violino?|Clave de sol|Clave de fá|Clave de dó|Clave de ré|A clave de fá é usada para sons graves.
m|Qual ritmo jamaicano tornou Bob Marley famoso?|Reggae|Ska|Calipso|Dancehall|O reggae surgiu no fim dos anos 1960.
m|Qual instrumento de metal tem três pistões e é comum no jazz?|Trompete|Trombone de vara|Clarinete|Saxofone|O trombone de vara não tem pistões, e o sax é da família das madeiras.
m|O que significa cantar “a cappella”?|Cantar sem instrumentos|Cantar apenas em igreja|Tocar sem partitura|Cantar muito alto|Só as vozes fazem a música.
m|Qual cantora americana é famosa pelo álbum “1989” e pela turnê “The Eras Tour”?|Taylor Swift|Beyoncé|Lady Gaga|Katy Perry|A turnê bateu recordes de público e bilheteria.
d|Qual compositor brasileiro escreveu a ópera “O Guarani”?|Carlos Gomes|Villa-Lobos|Alberto Nepomuceno|Camargo Guarnieri|A ópera estreou em Milão em 1870.
d|Quantas teclas tem um piano moderno padrão?|88|76|61|100|São 52 brancas e 36 pretas.
d|Qual andamento musical significa “bem devagar”?|Largo|Allegro|Presto|Vivace|Allegro é rápido e alegre; presto, muito rápido.
d|Quem é o autor do choro “Carinhoso”?|Pixinguinha|Jacob do Bandolim|Ernesto Nazareth|Waldir Azevedo|A letra foi feita depois por João de Barro.
d|Qual gênero brasileiro tem como clássicos “Tico-Tico no Fubá” e “Brasileirinho”?|Choro|Samba-canção|Frevo|Baião|O choro surgiu no Rio no século XIX.
d|Qual movimento musical do Recife misturou maracatu e rock nos anos 1990?|Manguebeat|Tropicália|Axé|Brega|Chico Science & Nação Zumbi foram os destaques.
d|Quem compôs “Asa Branca” com Humberto Teixeira?|Luiz Gonzaga|Dominguinhos|Sivuca|Jackson do Pandeiro|“Asa Branca” é de 1947.
d|Qual sambista, um dos fundadores da Mangueira, compôs “As Rosas Não Falam”?|Cartola|Nelson Cavaquinho|Noel Rosa|Paulinho da Viola|Cartola também batizou as cores verde e rosa.
d|Qual cantor tinha o apelido de “Síndico” e marcou o soul brasileiro?|Tim Maia|Jorge Ben Jor|Wilson Simonal|Cassiano|Ele gravou “Azul da Cor do Mar” e “Primavera”.
d|Quem compôs “País Tropical”?|Jorge Ben Jor|Tim Maia|Wilson Simonal|Gilberto Gil|Foi gravada por Simonal em 1969.
d|Qual instrumento indiano de cordas ficou famoso com Ravi Shankar?|Cítara|Alaúde|Harpa|Bandolim|A cítara indiana tem cordas que vibram por simpatia.
d|Qual destes compositores é do período barroco?|Johann Sebastian Bach|Frédéric Chopin|Claude Debussy|Ludwig van Beethoven|Chopin é romântico; Debussy, impressionista.`,

cin:`f|Qual é o nome do camundongo mais famoso da Disney?|Mickey|Jerry|Speedy|Remy|Mickey apareceu em 1928.
f|Em que filme um peixe-palhaço procura o filho perdido?|Procurando Nemo|O Rei Leão|Shrek|Moana|Marlin e Dory atravessam o oceano atrás de Nemo.
f|Qual é o nome do leão protagonista de “O Rei Leão”?|Simba|Mufasa|Scar|Nala|Mufasa é o pai de Simba; Scar, o tio.
f|Qual super-herói é conhecido como o “Homem-Morcego”?|Batman|Superman|Homem-Aranha|Flash|Batman é Bruce Wayne.
f|Em que cidade mora o Batman?|Gotham|Metrópolis|Nova York|Springfield|Metrópolis é a cidade do Superman.
f|Qual é o nome do ogro verde da DreamWorks?|Shrek|Hulk|Gru|Fiona|Fiona é a princesa que vira ogra.
f|Em “Toy Story”, qual é o nome do caubói?|Woody|Buzz|Andy|Jessie|Andy é o dono dos brinquedos.
f|Que personagem diz “Ao infinito e além!”?|Buzz Lightyear|Woody|Wall-E|Relâmpago McQueen|Buzz é o patrulheiro espacial de “Toy Story”.
f|Qual bruxinho estuda em Hogwarts?|Harry Potter|Frodo|Percy Jackson|Merlin|A série de livros é de J. K. Rowling.
f|Qual personagem de Mauricio de Sousa é dentuça e usa vestido vermelho?|Mônica|Magali|Marina|Rosinha|Ela anda com o coelho Sansão.
f|Qual personagem da Turma da Mônica é comilona e adora melancia?|Magali|Cascão|Cebolinha|Mônica|O gato dela se chama Mingau.
f|Qual personagem da Turma da Mônica troca o “r” pelo “l”?|Cebolinha|Cascão|Chico Bento|Franjinha|Cebolinha vive bolando “planos infalíveis”.
f|Qual boneco de madeira tem o nariz que cresce quando mente?|Pinóquio|Gepeto|Peter Pan|Chucky|Gepeto é o carpinteiro que o criou.
f|Qual é a princesa de “Frozen” que tem poderes de gelo?|Elsa|Anna|Moana|Rapunzel|Anna é a irmã de Elsa.
f|Qual é o nome verdadeiro do Homem-Aranha?|Peter Parker|Bruce Wayne|Clark Kent|Tony Stark|Bruce Wayne é o Batman.
f|Qual é a identidade secreta do Superman?|Clark Kent|Bruce Wayne|Peter Parker|Barry Allen|Ele trabalha como jornalista no Planeta Diário.
f|Qual é o prêmio mais famoso do cinema americano, uma estatueta dourada?|Oscar|Emmy|Grammy|Globo de Ouro|O Emmy é da TV e o Grammy, da música.
m|Qual filme de 1997 conta o romance de Jack e Rose num navio?|Titanic|Pearl Harbor|Poseidon|Náufrago|Dirigido por James Cameron, ganhou 11 Oscars.
m|Quem dirigiu “Jurassic Park” (1993)?|Steven Spielberg|George Lucas|James Cameron|Ridley Scott|Spielberg também dirigiu “E.T.” e “Tubarão”.
m|Qual saga tem Luke Skywalker e Darth Vader?|Star Wars|Star Trek|Duna|Matrix|O primeiro filme é de 1977.
m|Em “O Senhor dos Anéis”, quem leva o Um Anel até Mordor?|Frodo|Gandalf|Aragorn|Legolas|Frodo vai acompanhado de Sam.
m|Qual filme brasileiro de 2002 tem Buscapé como narrador?|Cidade de Deus|Tropa de Elite|Central do Brasil|Carandiru|Foi indicado a quatro Oscars.
m|Em qual filme brasileiro de 1998 Fernanda Montenegro vive a personagem Dora?|Central do Brasil|O Auto da Compadecida|Cidade de Deus|Bicho de Sete Cabeças|Ela foi indicada ao Oscar de melhor atriz.
m|Quem são os protagonistas de “O Auto da Compadecida”?|João Grilo e Chicó|Lampião e Maria Bonita|Buscapé e Zé Pequeno|Pedrinho e Narizinho|“Não sei, só sei que foi assim”, diz Chicó.
m|Quem escreveu “O Auto da Compadecida”?|Ariano Suassuna|Jorge Amado|Nelson Rodrigues|Dias Gomes|A peça é de 1955.
m|Qual é o nome do sítio criado por Monteiro Lobato?|Sítio do Picapau Amarelo|Sítio do Tio Barnabé|Fazenda Boa Vista|Sítio Recanto Feliz|Lá vivem Dona Benta, Narizinho, Pedrinho e Emília.
m|Qual boneca de pano falante vive no Sítio do Picapau Amarelo?|Emília|Narizinho|Cuca|Tia Nastácia|Emília foi feita por Tia Nastácia.
m|Qual animação da Pixar se passa dentro da mente da menina Riley?|Divertida Mente|Viva|Soul|Up|Alegria, Tristeza, Raiva, Medo e Nojinho comandam a mente dela.
m|Em “Up — Altas Aventuras”, o que faz a casa voar?|Balões|Um foguete|Um tornado|Pássaros|Milhares de balões coloridos levantam a casa.
m|Qual ator viveu o Homem de Ferro nos filmes da Marvel de 2008 a 2019?|Robert Downey Jr.|Chris Evans|Chris Hemsworth|Mark Ruffalo|Chris Evans fez o Capitão América.
m|Em que filme se diz “Que a Força esteja com você”?|Star Wars|Matrix|Avatar|Jornada nas Estrelas|A Força é a energia usada pelos Jedi.
m|Qual animação de Hayao Miyazaki ganhou o Oscar em 2003?|A Viagem de Chihiro|Meu Amigo Totoro|Princesa Mononoke|O Castelo Animado|Foi a primeira animação japonesa a ganhar o Oscar.
m|Em que país fica Bollywood, polo de cinema?|Índia|Paquistão|Bangladesh|Tailândia|O nome mistura Bombaim (Mumbai) e Hollywood.
m|Quem é o criador da Turma da Mônica?|Mauricio de Sousa|Ziraldo|Monteiro Lobato|Laerte|A Mônica foi inspirada numa filha dele.
m|Qual personagem de Ziraldo é um menino com uma panela na cabeça?|Menino Maluquinho|Pererê|Chico Bento|Pedrinho|O livro é de 1980.
m|Qual ator interpreta o pirata Jack Sparrow?|Johnny Depp|Orlando Bloom|Brad Pitt|Keanu Reeves|Os filmes são da série “Piratas do Caribe”.
m|Em qual filme o herói escolhe entre a pílula vermelha e a azul?|Matrix|A Origem|Blade Runner|O Exterminador do Futuro|Neo toma a pílula vermelha.
m|Qual é o nome do cachorro do Charlie Brown?|Snoopy|Pluto|Scooby-Doo|Bidu|Snoopy vive em cima da casinha.
m|Em qual filme se diz que “a vida é como uma caixa de chocolates”?|Forrest Gump|Náufrago|Quero Ser Grande|Filadélfia|O filme é de 1994, com Tom Hanks.
m|Na animação “Wall-E”, qual é o nome da robô que o protagonista conhece?|EVA|R2-D2|BB-8|Baymax|EVA vem à Terra procurar plantas.
d|Qual filme brasileiro ganhou o Oscar de Melhor Filme Internacional em 2025?|Ainda Estou Aqui|Central do Brasil|Cidade de Deus|O Pagador de Promessas|O filme é de Walter Salles, com Fernanda Torres.
d|Qual filme brasileiro ganhou a Palma de Ouro em Cannes, em 1962?|O Pagador de Promessas|Vidas Secas|Deus e o Diabo na Terra do Sol|Central do Brasil|Foi dirigido por Anselmo Duarte.
d|Qual é o principal prêmio do Festival de Cannes?|Palma de Ouro|Leão de Ouro|Urso de Ouro|Concha de Ouro|O Leão é de Veneza; o Urso, de Berlim.
d|Quem dirigiu “Psicose” (1960)?|Alfred Hitchcock|Stanley Kubrick|Orson Welles|Billy Wilder|A cena do chuveiro é uma das mais famosas do cinema.
d|Qual filme de Orson Welles, de 1941, é apontado como um dos melhores da história?|Cidadão Kane|Casablanca|E o Vento Levou|O Mágico de Oz|“Rosebud” é a palavra misteriosa do filme.
d|Em “O Mágico de Oz”, qual é o nome da cachorrinha de Dorothy?|Totó|Lassie|Bidu|Snoopy|Dorothy segue a estrada de tijolos amarelos.
d|Qual cineasta liderou o Cinema Novo e dirigiu “Deus e o Diabo na Terra do Sol”?|Glauber Rocha|Nelson Pereira dos Santos|Cacá Diegues|Walter Salles|O lema era “uma câmera na mão e uma ideia na cabeça”.
d|Qual foi o primeiro longa-metragem de animação da Disney, de 1937?|Branca de Neve e os Sete Anões|Pinóquio|Cinderela|Fantasia|Foi um enorme sucesso de bilheteria.
d|Qual é o cachorro do Cebolinha, na Turma da Mônica?|Floquinho|Bidu|Monicão|Rex|Floquinho é verde e peludo; Bidu é do Franjinha.
d|Quem viveu o Coringa em “Batman: O Cavaleiro das Trevas” (2008)?|Heath Ledger|Joaquin Phoenix|Jack Nicholson|Jared Leto|Ele ganhou o Oscar de ator coadjuvante.
d|Em que ano estreou o primeiro filme de “Star Wars”?|1977|1980|1983|1975|O filme foi escrito e dirigido por George Lucas.
d|Qual série animada americana mostra uma família amarela em Springfield?|Os Simpsons|Uma Família da Pesada|South Park|Futurama|Estreou como série em 1989.`,

var:`f|Quantos dias tem um ano bissexto?|366|365|364|360|O dia a mais é o 29 de fevereiro.
f|Quantos minutos tem uma hora?|60|100|30|120|E cada minuto tem 60 segundos.
f|Que cor resulta da mistura de azul e amarelo?|Verde|Roxo|Laranja|Marrom|Azul com vermelho dá roxo; amarelo com vermelho, laranja.
f|Quantos lados tem um hexágono?|6|5|7|8|O pentágono tem 5; o octógono, 8.
f|Qual animal passa a vida nas árvores e é famoso pela lentidão?|Bicho-preguiça|Macaco-prego|Tamanduá|Quati|Ele desce da árvore cerca de uma vez por semana.
f|Quantas horas tem um dia?|24|12|48|20|É o tempo de uma volta da Terra em torno de si.
f|Quanto é 7 × 8?|56|54|48|64|7 × 8 = 56.
f|Qual é o maior mamífero terrestre?|Elefante-africano|Girafa|Rinoceronte|Hipopótamo|A girafa é o mais alto.
f|Qual fruta é a base do guacamole?|Abacate|Manga|Limão|Kiwi|O guacamole é um prato mexicano.
f|Qual é a principal matéria-prima do chocolate?|Cacau|Café|Baunilha|Cana|O chocolate é feito das sementes do cacau.
f|Quantos meses do ano têm 31 dias?|7|6|5|8|Janeiro, março, maio, julho, agosto, outubro e dezembro.
f|No baralho, qual naipe é representado por um coração?|Copas|Espadas|Ouros|Paus|Os naipes são copas, espadas, ouros e paus.
f|Qual ave é símbolo da paz?|Pomba branca|Águia|Coruja|Arara|A pomba com o ramo de oliveira é um símbolo antigo.
f|Qual é o feminino de “cavalo”?|Égua|Cavala|Potra|Vaca|Potro e potra são os filhotes.
f|Qual é o coletivo de peixes?|Cardume|Rebanho|Bando|Matilha|Rebanho é de gado; matilha, de cães.
f|Quantos anos tem um século?|100|1.000|10|50|Mil anos formam um milênio.
f|De qual país é a pizza?|Itália|Estados Unidos|Grécia|França|A pizza margherita nasceu em Nápoles.
f|De qual país é o sushi?|Japão|China|Coreia do Sul|Tailândia|O sushi leva arroz temperado com vinagre.
f|Qual é o ingrediente principal da feijoada?|Feijão-preto|Feijão-carioca|Lentilha|Grão-de-bico|É servida com arroz, couve, farofa e laranja.
f|Quantas cartas tem um baralho comum, sem os curingas?|52|54|48|40|São 13 cartas de cada um dos 4 naipes.
f|Quantos zeros tem um milhão?|6|5|7|9|1.000.000.
m|Qual é o idioma com mais falantes nativos no mundo?|Mandarim|Inglês|Espanhol|Hindi|O inglês tem mais falantes no total, contando quem aprendeu.
m|Quem pintou a “Mona Lisa”?|Leonardo da Vinci|Michelangelo|Rafael|Vincent van Gogh|O quadro está no Museu do Louvre, em Paris.
m|Quem pintou “A Noite Estrelada”?|Vincent van Gogh|Claude Monet|Pablo Picasso|Salvador Dalí|Foi pintada em 1889.
m|Qual pintora brasileira fez o quadro “Abaporu”?|Tarsila do Amaral|Anita Malfatti|Djanira|Lygia Clark|“Abaporu” significa “homem que come gente” em tupi.
m|Quem escreveu “Dom Casmurro”?|Machado de Assis|José de Alencar|Graciliano Ramos|Aluísio Azevedo|Capitu traiu ou não Bentinho? O mistério continua.
m|Quem escreveu “Grande Sertão: Veredas”?|Guimarães Rosa|Graciliano Ramos|Jorge Amado|Euclides da Cunha|O narrador é o jagunço Riobaldo.
m|Quem escreveu “Vidas Secas”?|Graciliano Ramos|Rachel de Queiroz|José Lins do Rego|João Cabral de Melo Neto|Conta a vida de Fabiano e sua família no sertão.
m|Quem escreveu “Dom Quixote”?|Miguel de Cervantes|William Shakespeare|Dante Alighieri|Luís de Camões|O fiel escudeiro é Sancho Pança.
m|Quem escreveu “Os Lusíadas”?|Luís de Camões|Fernando Pessoa|Eça de Queirós|Gil Vicente|O poema narra a viagem de Vasco da Gama.
m|Quem escreveu “Romeu e Julieta”?|William Shakespeare|Charles Dickens|Oscar Wilde|Molière|A história se passa em Verona, na Itália.
m|Quantas casas tem um tabuleiro de xadrez?|64|81|100|49|São 8 fileiras de 8 casas.
m|Quanto é 15% de 200?|30|15|20|45|10% de 200 é 20; 5% é 10.
m|Qual é a raiz quadrada de 144?|12|14|11|16|12 × 12 = 144.
m|Quantos segundos tem uma hora?|3.600|360|6.000|1.440|1.440 é o número de minutos de um dia.
m|Qual é o plural de “cidadão”?|Cidadãos|Cidadões|Cidadães|Cidadans|Como em “irmãos” e “mãos”.
m|Que classe de palavra é “rapidamente”?|Advérbio|Adjetivo|Verbo|Substantivo|Palavras com “-mente” costumam ser advérbios de modo.
m|Qual é o coletivo de abelhas?|Enxame|Cardume|Alcateia|Matilha|Alcateia é de lobos.
m|Qual é o coletivo de lobos?|Alcateia|Manada|Cardume|Revoada|Manada é de animais grandes, como bois e elefantes.
m|Que número romano representa 50?|L|C|D|X|C vale 100; D, 500; X, 10.
m|Que número romano representa 1.000?|M|D|C|K|MM, por exemplo, é 2.000.
m|Que bebida brasileira leva cachaça, limão, açúcar e gelo?|Caipirinha|Quentão|Batida|Mojito|O mojito é cubano e leva rum e hortelã.
m|Qual prato baiano é um bolinho de feijão-fradinho frito no dendê?|Acarajé|Vatapá|Moqueca|Tapioca|Costuma ser recheado com vatapá e camarão.
m|Qual prato paraense leva tucupi, jambu e camarão seco?|Tacacá|Baião de dois|Arrumadinho|Barreado|É servido quente, em cuia.
m|Qual fruta amazônica é muito consumida gelada, na tigela?|Açaí|Cupuaçu|Graviola|Caju|No Pará, também é comido com peixe e farinha.
m|Quantos zeros tem um bilhão?|9|6|12|8|1.000.000.000.
m|Qual é o valor aproximado do número pi?|3,14|2,71|1,61|3,41|2,71 é o número de Euler; 1,61, a razão áurea.
m|Qual é a pedra preciosa natural mais dura?|Diamante|Rubi|Safira|Esmeralda|O diamante é carbono puro.
m|Que bodas se comemoram com 25 anos de casamento?|Bodas de prata|Bodas de ouro|Bodas de diamante|Bodas de papel|As bodas de papel são de 1 ano.
m|Em qual cidade fica o Museu do Louvre?|Paris|Londres|Roma|Madri|A pirâmide de vidro da entrada é de 1989.
m|Quanto dá a soma dos ângulos internos de um triângulo?|180°|360°|90°|270°|Num quadrilátero, a soma é 360°.
d|Qual é o menor número primo?|2|1|3|0|O 2 é o único primo par; o 1 não é primo.
d|Que bodas se comemoram com 50 anos de casamento?|Bodas de ouro|Bodas de prata|Bodas de rubi|Bodas de cristal|As de 60 anos são as de diamante.
d|Qual poeta escreveu “No meio do caminho tinha uma pedra”?|Carlos Drummond de Andrade|Manuel Bandeira|Cecília Meireles|Vinicius de Moraes|Drummond nasceu em Itabira, Minas Gerais.
d|Quem criou Macunaíma, o “herói sem nenhum caráter”?|Mário de Andrade|Oswald de Andrade|Monteiro Lobato|Jorge Amado|O livro é de 1928.
d|Quem escreveu “A Hora da Estrela”?|Clarice Lispector|Rachel de Queiroz|Cecília Meireles|Lygia Fagundes Telles|A protagonista é a nordestina Macabéa.
d|Qual evento de 1922 marcou o início do modernismo brasileiro?|Semana de Arte Moderna|Semana Santa|Semana Farroupilha|Semana da Pátria|Aconteceu no Theatro Municipal de São Paulo.
d|Quantas peças tem um dominó tradicional (até o duplo-seis)?|28|24|32|36|São todas as combinações de 0 a 6.
d|Qual artista do barroco mineiro esculpiu os profetas de Congonhas?|Aleijadinho|Mestre Ataíde|Victor Brecheret|Di Cavalcanti|Aleijadinho era Antônio Francisco Lisboa.
d|O que estuda a ornitologia?|As aves|Os insetos|Os peixes|Os fungos|Insetos são estudados pela entomologia.
d|O que estuda a numismática?|Moedas e medalhas|Números primos|Selos|Rochas|Quem coleciona selos pratica a filatelia.
d|Quantos lados tem um dodecágono?|12|10|20|11|“Dodeca” quer dizer doze.`
};
/* monta o banco: {id, c, l, p, a:[certa, e1, e2, e3], x} */
const QUIZ_BANCO = [];
for(const c in QUIZ_RAW) QUIZ_RAW[c].split('\n').forEach((ln, i) => {
  const f = ln.split('|'); if(f.length < 7) return;
  QUIZ_BANCO.push({id:c + i, c, l:f[0], p:f[1], a:[f[2], f[3], f[4], f[5]], x:f[6]});
});
