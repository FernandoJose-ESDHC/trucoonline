/* Lista de palavras do jogo "Soletrando" (Central de Jogos) — escrita e revisada para a Central.
   Ortografia segundo o Acordo Ortográfico em vigor no Brasil (sem trema; "ideia", "voo", "heroico"...).
   Formato de cada linha: palavra|definição curta|frase de exemplo (a frase contém a palavra exata).
   Níveis: f = fácil, m = médio, d = difícil. */
"use strict";
const SOLE_RAW = {
f:`cachorro|Animal doméstico que late.|O cachorro latiu a noite inteira.
escola|Lugar onde se estuda.|As crianças vão à escola de manhã.
janela|Abertura na parede para entrar luz e ar.|Abra a janela para ventilar a sala.
cadeira|Móvel feito para sentar.|Puxe a cadeira e sente-se.
árvore|Planta grande com tronco e galhos.|A árvore do quintal deu muitas mangas.
pássaro|Animal com penas que voa.|Um pássaro fez ninho no telhado.
caderno|Conjunto de folhas para escrever.|Anote a lição no caderno.
chuva|Água que cai das nuvens.|A chuva molhou a roupa no varal.
laranja|Fruta cítrica de cor alaranjada.|Ela tomou suco de laranja no café.
girafa|Animal africano de pescoço muito comprido.|A girafa come as folhas mais altas.
açúcar|Pó doce usado para adoçar.|Coloque menos açúcar no café.
cebola|Bulbo usado como tempero, que faz chorar ao cortar.|Ele picou a cebola para o refogado.
abacaxi|Fruta tropical com coroa de folhas.|O abacaxi estava bem doce.
xícara|Recipiente pequeno com asa para bebidas.|Sirva o café na xícara azul.
relógio|Objeto que marca as horas.|O relógio da sala está adiantado.
música|Arte de combinar sons.|Ela ouve música enquanto estuda.
lâmpada|Objeto que produz luz elétrica.|A lâmpada da cozinha queimou.
ônibus|Veículo grande de transporte coletivo.|Pegamos o ônibus na esquina.
médico|Profissional que cuida da saúde.|O médico receitou repouso.
família|Grupo de pessoas parentes.|A família se reuniu no domingo.
história|Narração de fatos; estudo do passado.|Vovó contou uma história antes de dormir.
coração|Órgão que bombeia o sangue.|O coração bate mais rápido na corrida.
criança|Pessoa de pouca idade.|A criança brincava no parque.
sapato|Calçado que cobre o pé.|O sapato novo apertou o dedo.
camisa|Peça de roupa para o tronco.|Ele vestiu uma camisa listrada.
chocolate|Doce feito de cacau.|Ganhei uma barra de chocolate.
hospital|Lugar onde se tratam doentes.|Levaram o ferido ao hospital.
telefone|Aparelho para falar a distância.|O telefone tocou durante o jantar.
bicicleta|Veículo de duas rodas movido a pedal.|Fui à padaria de bicicleta.
tesoura|Instrumento de duas lâminas para cortar.|Use a tesoura sem ponta.
cozinha|Cômodo onde se preparam as refeições.|O cheiro de bolo vinha da cozinha.
travesseiro|Almofada para apoiar a cabeça ao dormir.|Ele dorme com dois travesseiros.
mochila|Bolsa que se carrega nas costas.|Guardei o lanche na mochila.
queijo|Alimento feito de leite coalhado.|Comprei pão de queijo na feira.
quintal|Terreno nos fundos da casa.|As galinhas ciscavam no quintal.
trabalho|Atividade feita para produzir algo.|Ele chegou cansado do trabalho.
amizade|Relação de carinho entre amigos.|A amizade deles começou na escola.
natureza|Conjunto de plantas, animais e paisagens.|Gostamos de passear em contato com a natureza.
floresta|Grande área coberta de árvores.|A onça vive na floresta.
borboleta|Inseto de asas coloridas.|Uma borboleta pousou na flor.
tartaruga|Réptil de casco duro.|A tartaruga anda devagar.
jacaré|Réptil de rio com boca grande.|O jacaré tomava sol na margem.
coelho|Animal de orelhas compridas que salta.|O coelho comeu a cenoura.
galinha|Ave doméstica que bota ovos.|A galinha chocou os ovos.
cavalo|Animal grande usado para montaria.|O cavalo galopou pelo campo.
sorvete|Doce gelado e cremoso.|Tomamos sorvete de morango.
pipoca|Milho estourado no calor.|Fizemos pipoca para ver o filme.
feijão|Grão muito comum no prato brasileiro.|Arroz com feijão é o almoço de todo dia.
manhã|Parte do dia entre o amanhecer e o meio-dia.|Acordei cedo hoje de manhã.
irmão|Filho dos mesmos pais.|Meu irmão mais velho dirige.
maçã|Fruta vermelha ou verde, crocante.|Levei uma maçã de lanche.
avião|Veículo que voa transportando pessoas.|O avião decolou no horário.
balão|Bola de borracha cheia de ar.|O balão estourou na festa.
limão|Fruta ácida e verde.|Ela fez uma limonada com limão.
fogão|Aparelho de cozinha para cozinhar.|A panela está no fogão.
caminhão|Veículo grande para cargas.|O caminhão trouxe a mudança.
almoço|Refeição do meio do dia.|O almoço está servido.
cabeça|Parte do corpo onde fica o cérebro.|Ele sentiu dor de cabeça.
braço|Membro do corpo entre o ombro e a mão.|Ela quebrou o braço jogando bola.
pescoço|Parte que liga a cabeça ao tronco.|A girafa tem um pescoço enorme.
dança|Movimento do corpo ao som de música.|A dança da quadrilha animou a festa.
praça|Espaço público aberto na cidade.|Encontramos os amigos na praça.
sábado|Dia da semana depois da sexta-feira.|No sábado vamos à praia.
domingo|Dia da semana depois do sábado.|O almoço de domingo é na casa da avó.
janeiro|Primeiro mês do ano.|As férias começam em janeiro.
dezembro|Último mês do ano.|O Natal é em dezembro.
número|Símbolo que indica quantidade.|Qual é o número da sua casa?
brinquedo|Objeto feito para brincar.|O brinquedo favorito dele é a bola.
foguete|Veículo que vai ao espaço.|O foguete subiu deixando fumaça.
formiga|Inseto pequeno que vive em colônias.|A formiga carregava uma folha.
peixe|Animal que vive na água e respira por guelras.|Pescamos um peixe grande no rio.
caixa|Recipiente para guardar coisas.|Guarde os brinquedos na caixa.
lixo|Restos que se jogam fora.|Não jogue lixo na rua.
chave|Objeto que abre e fecha fechaduras.|Esqueci a chave dentro de casa.
chinelo|Calçado leve e aberto.|Ele foi à padaria de chinelo.
geladeira|Aparelho que conserva alimentos no frio.|O suco está na geladeira.
girassol|Flor grande e amarela que segue o sol.|O girassol virou para o lado do sol.
jardim|Terreno com flores e plantas.|As rosas do jardim floresceram.
hoje|Neste dia.|Hoje é dia de prova.
homem|Pessoa adulta do sexo masculino.|O homem atravessou a rua.
ontem|No dia anterior a hoje.|Ontem choveu muito.
verão|Estação mais quente do ano.|No verão a praia fica cheia.
inverno|Estação mais fria do ano.|No inverno usamos casaco.
estrela|Astro que brilha no céu à noite.|Vimos uma estrela cadente.
planeta|Astro que gira em torno de uma estrela.|A Terra é o nosso planeta.
montanha|Elevação de terra muito alta.|Subimos a montanha a pé.
cidade|Grande povoação com ruas e prédios.|A cidade acordou com o barulho.
pessoa|Ser humano.|Cada pessoa tem seu jeito.
professor|Quem ensina.|O professor explicou a matéria.
vizinho|Quem mora perto.|O vizinho emprestou a escada.
amarelo|Cor da gema do ovo.|O sol foi pintado de amarelo.
vermelho|Cor do sangue.|O semáforo ficou vermelho.
abelha|Inseto que produz mel.|A abelha pousou na flor.
banana|Fruta comprida de casca amarela.|O macaco descascou a banana.
cenoura|Raiz alaranjada usada na comida.|O bolo de cenoura ficou fofinho.
melancia|Fruta grande, verde por fora e vermelha por dentro.|Cortamos a melancia no calor.
tomate|Fruto vermelho usado em saladas e molhos.|O molho de tomate ficou ótimo.
travessa|Prato grande para servir comida.|Coloque a lasanha na travessa.
espelho|Superfície que reflete a imagem.|Ela se olhou no espelho.
cobertor|Peça grossa para cobrir e aquecer na cama.|Peguei um cobertor por causa do frio.
bolacha|Biscoito.|Comi uma bolacha com leite.
bombeiro|Profissional que apaga incêndios.|O bombeiro salvou o gato da árvore.
dentista|Profissional que cuida dos dentes.|Fui ao dentista fazer uma limpeza.
viagem|Ida de um lugar para outro distante.|A viagem de férias foi ótima.
passeio|Saída para se divertir ou caminhar.|Fizemos um passeio no parque.
barulho|Som alto e desagradável.|O barulho da obra acordou o bebê.
sossego|Calma, tranquilidade.|No sítio há muito sossego.`,
m:`exemplo|Algo que serve de modelo.|Ele deu um bom exemplo aos colegas.
próximo|Que está perto; o seguinte.|O próximo ônibus passa em dez minutos.
máximo|O maior possível.|Ele se esforçou ao máximo na prova.
auxílio|Ajuda.|Os vizinhos vieram em auxílio da família.
excelente|Muito bom; ótimo.|A comida do restaurante é excelente.
piscina|Tanque com água para nadar.|As crianças pularam na piscina.
nascimento|Ato de nascer.|O nascimento do bebê alegrou a casa.
crescer|Aumentar de tamanho.|A planta vai crescer com a chuva.
descer|Ir para baixo.|Cuidado ao descer a escada.
pêssego|Fruta de casca aveludada.|Ela comeu um pêssego maduro.
chuchu|Legume verde e suave.|A sopa de chuchu ficou leve.
enxergar|Ver com os olhos.|Sem óculos ele não consegue enxergar.
enxame|Grande grupo de abelhas.|Um enxame de abelhas apareceu no telhado.
mexer|Movimentar; misturar.|É preciso mexer o doce sem parar.
puxar|Trazer para si com força.|Ajude-me a puxar a corda.
bruxa|Personagem que faz feitiços.|A bruxa da história voava de vassoura.
faxina|Limpeza geral.|Fizemos uma faxina na garagem.
xampu|Produto para lavar o cabelo.|Acabou o xampu do banheiro.
salsicha|Embutido comprido de carne.|O cachorro-quente leva salsicha.
cochilar|Dormir um pouco.|O avô gosta de cochilar depois do almoço.
beleza|Qualidade do que é belo.|A beleza da paisagem impressiona.
tristeza|Sentimento de quem está triste.|A tristeza passou com o tempo.
certeza|Conhecimento seguro.|Tenho certeza de que tranquei a porta.
surpresa|Algo que acontece sem se esperar.|A festa foi uma surpresa.
empresa|Organização que produz ou vende.|Ela abriu uma empresa de doces.
princesa|Filha de rei ou rainha.|A princesa do conto morava num castelo.
francesa|Mulher nascida na França.|A turista francesa elogiou o pão de queijo.
portuguesa|Mulher nascida em Portugal.|A pizza portuguesa leva ovo e cebola.
análise|Exame detalhado.|O laboratório fez a análise da água.
pesquisa|Investigação para descobrir algo.|A pesquisa foi feita na biblioteca.
através|De um lado a outro.|A luz passa através do vidro.
também|Do mesmo modo.|Eu também quero ir.
ninguém|Nenhuma pessoa.|Ninguém atendeu a porta.
alguém|Alguma pessoa.|Alguém deixou a luz acesa.
português|Língua falada no Brasil.|A prova de português foi fácil.
inglês|Língua falada na Inglaterra.|Ela estuda inglês à noite.
país|Nação, território com governo próprio.|O Brasil é um país enorme.
saúde|Bom estado do corpo e da mente.|Exercício faz bem à saúde.
juíza|Mulher que julga no tribunal.|A juíza ouviu as testemunhas.
egoísmo|Atitude de pensar só em si.|O egoísmo atrapalhou o trabalho em grupo.
ruína|Restos de uma construção destruída.|Visitamos a ruína de uma igreja antiga.
baú|Caixa grande com tampa.|Os brinquedos antigos ficam no baú.
rainha|Mulher que governa um reino.|A rainha acenou para o povo.
ideia|Pensamento, plano.|Tive uma ideia para o trabalho.
assembleia|Reunião de muitas pessoas para decidir.|A assembleia votou a proposta.
jiboia|Cobra grande que não tem veneno.|A jiboia dormia enrolada no galho.
heroico|Próprio de herói; corajoso.|O resgate foi um ato heroico.
voo|Ato de voar; viagem de avião.|O voo atrasou por causa da neblina.
enjoo|Mal-estar com vontade de vomitar.|Ela sentiu enjoo no barco.
herói|Pessoa admirada pela coragem.|O bombeiro virou herói da cidade.
chapéu|Peça que se usa na cabeça.|O vento levou o chapéu dele.
troféu|Prêmio dado ao vencedor.|O time ergueu o troféu.
anéis|Plural de anel.|Ela usa dois anéis na mão.
papéis|Plural de papel.|Os papéis voaram com o vento.
açougue|Loja que vende carne.|Compramos carne no açougue.
paçoca|Doce de amendoim moído.|A paçoca é típica das festas juninas.
carroça|Veículo de madeira puxado por animal.|O cavalo puxava a carroça.
poça|Pequena quantidade de água no chão.|O menino pulou na poça.
preguiça|Falta de vontade de fazer algo.|Bateu uma preguiça depois do almoço.
palhaço|Artista de circo que faz rir.|O palhaço tinha nariz vermelho.
cansaço|Falta de energia depois de esforço.|O cansaço da viagem era grande.
berço|Caminha de bebê.|O bebê dormiu no berço.
atenção|Concentração em algo.|Preste atenção na aula.
intenção|Vontade, propósito.|Não tive intenção de magoar ninguém.
discussão|Troca de opiniões, às vezes com briga.|A discussão terminou em acordo.
impressão|Opinião; ato de imprimir.|Tive a impressão de que ia chover.
profissão|Trabalho que alguém exerce.|Ela escolheu a profissão de enfermeira.
expressão|Jeito de se manifestar.|A expressão do rosto mostrava alegria.
geleia|Doce de fruta em consistência pastosa.|Passei geleia de uva no pão.
gengibre|Raiz picante usada como tempero.|O chá de gengibre esquenta.
gesso|Pó branco que endurece com água.|Ele ficou com o braço no gesso.
jeito|Maneira, modo.|Cada um tem seu jeito de falar.
gorjeta|Dinheiro extra dado por um serviço.|Deixamos gorjeta para o garçom.
sujeira|O que está sujo.|A sujeira tomou conta do quintal.
laje|Placa de concreto que cobre a casa.|Fizemos churrasco na laje.
majestade|Grandeza; tratamento dado a reis.|O leão anda com majestade.
tigela|Recipiente fundo para comida.|Comi cereal numa tigela.
garagem|Lugar para guardar o carro.|O carro dorme na garagem.
mensagem|Comunicação enviada a alguém.|Recebi uma mensagem da minha mãe.
ferrugem|Camada avermelhada que cobre o ferro.|O portão estava cheio de ferrugem.
analisar|Examinar com cuidado.|O técnico vai analisar o jogo.
paralisar|Fazer parar.|O susto pode paralisar uma pessoa.
improvisar|Fazer sem preparo.|O cantor teve de improvisar a letra.
avisar|Dar notícia; prevenir.|Esqueci de avisar que chegaria tarde.
realizar|Fazer acontecer.|Ele vai realizar o sonho de viajar.
organizar|Pôr em ordem.|Vamos organizar a festa juntos.
utilizar|Usar.|Pode utilizar o computador da sala.
vazio|Sem nada dentro.|O copo está vazio.
fazenda|Grande propriedade rural.|Passamos as férias na fazenda.
mingau|Papa de leite engrossada.|A avó fez mingau de aveia.
degrau|Cada parte de uma escada.|Ele tropeçou no último degrau.
anzol|Gancho usado para pescar.|O peixe mordeu o anzol.
hábito|Costume.|Ler antes de dormir é um bom hábito.
harmonia|Combinação agradável; paz.|A família vive em harmonia.
horta|Lugar onde se plantam verduras.|Colhemos alface na horta.
hóspede|Quem se hospeda em casa alheia.|O hóspede ficou no quarto de visitas.
humilde|Simples, modesto.|Mesmo famoso, ele continua humilde.
helicóptero|Aeronave com hélice em cima.|O helicóptero pousou no hospital.
passageiro|Quem viaja num veículo sem dirigir.|O passageiro desceu no ponto.
missão|Tarefa importante.|A missão dos astronautas deu certo.
campeão|Vencedor de uma competição.|O campeão subiu ao pódio.
cadeado|Fechadura móvel com argola.|Prendi a bicicleta com cadeado.
periquito|Ave pequena e verde, parente do papagaio.|O periquito assobiava na gaiola.
crânio|Conjunto de ossos da cabeça.|O capacete protege o crânio.
tábua|Peça plana de madeira.|Use a tábua para cortar a carne.
mágoa|Tristeza causada por ofensa.|Ela não guarda mágoa de ninguém.
tabuada|Tabela das operações com números.|Ele decorou a tabuada do sete.
costume|Hábito.|É costume comer peixe na Semana Santa.
xadrez|Jogo de tabuleiro com rei e rainha; padrão quadriculado.|Ele joga xadrez com o avô.
lagartixa|Pequeno réptil que anda nas paredes.|A lagartixa comeu o mosquito.
mortadela|Embutido de carne em fatias.|Comi um sanduíche de mortadela.
iogurte|Leite fermentado.|Tomei iogurte de morango.
bandeja|Prato largo para levar coisas.|O garçom trouxe os copos na bandeja.
companhia|Presença de alguém; empresa.|Obrigado pela companhia na viagem.
advogado|Profissional que defende causas na Justiça.|O advogado falou ao juiz.
frustrado|Desapontado.|Ficou frustrado com a derrota.
asterisco|Sinal gráfico em forma de estrela.|Coloque um asterisco ao lado do nome.
caranguejo|Crustáceo que anda de lado.|O caranguejo se escondeu na areia.
mendigo|Pessoa que pede esmola.|O mendigo agradeceu o prato de comida.
cozinheiro|Quem prepara a comida.|O cozinheiro caprichou no tempero.
exausto|Muito cansado.|Depois da maratona ficou exausto.
exato|Correto, preciso.|O resultado exato saiu à noite.
êxito|Sucesso.|A peça teve grande êxito.
táxi|Carro de aluguel com motorista.|Chamamos um táxi para o aeroporto.
lápis|Objeto de madeira com grafite para escrever.|Faça a prova a lápis.
tênis|Calçado esportivo; esporte com raquete.|Ele comprou um tênis para correr.
vírus|Ser microscópico que causa doenças.|O vírus da gripe se espalha rápido.
bônus|Prêmio extra.|Ganhei um bônus no fim do ano.
órfão|Quem perdeu os pais.|O menino órfão foi adotado.
órgão|Parte do corpo com função própria; instrumento musical.|O coração é um órgão vital.
sótão|Cômodo logo abaixo do telhado.|As caixas velhas ficam no sótão.
pólen|Pó das flores que as abelhas levam.|O pólen deixa algumas pessoas espirrando.
hífen|Tracinho que liga palavras.|Use hífen em "guarda-chuva".
rinoceronte|Animal africano com chifre no nariz.|O rinoceronte é um animal enorme.
hipopótamo|Animal grande que vive em rios africanos.|O hipopótamo passa o dia na água.
enxurrada|Água de chuva que corre com força.|A enxurrada levou o lixo da rua.
enxoval|Roupas e objetos para casamento ou bebê.|A avó ajudou a montar o enxoval.
caxumba|Doença que incha o pescoço.|Ele faltou à escola por causa da caxumba.
bexiga|Balão de festa; órgão que guarda a urina.|Enchemos uma bexiga para cada convidado.
graxa|Pasta gordurosa que lubrifica.|A corrente da bicicleta precisa de graxa.
xingar|Ofender com palavras.|Não se deve xingar o juiz.
mexerica|Fruta parecida com a laranja, fácil de descascar.|Ela descascou uma mexerica.
chiclete|Goma de mascar.|Não grude chiclete embaixo da mesa.`,
d:`exceção|O que foge à regra.|Toda regra tem uma exceção.
paralisação|Ato de parar as atividades.|A paralisação dos ônibus complicou o trânsito.
ascensão|Subida; elevação.|A ascensão do balão foi lenta.
privilégio|Vantagem especial.|Foi um privilégio conhecer o escritor.
excesso|O que passa da medida.|O excesso de sal faz mal.
exceder|Passar do limite.|Não deixe a carga exceder o peso permitido.
abscesso|Acúmulo de pus numa inflamação.|O dentista drenou o abscesso.
obsessão|Ideia fixa.|Arrumar a casa virou uma obsessão.
consciência|Percepção de si e do que é certo.|Ele agiu com a consciência tranquila.
discernimento|Capacidade de julgar com clareza.|É preciso discernimento para decidir.
imprescindível|Indispensável.|A água é imprescindível à vida.
rescisão|Cancelamento de um contrato.|Ele assinou a rescisão do contrato.
acessório|Objeto complementar.|O cinto é um acessório da roupa.
sucessão|Sequência; troca de quem ocupa um cargo.|Houve uma sucessão de vitórias.
cessão|Ato de ceder algo a alguém.|A cessão do terreno foi registrada em cartório.
sessão|Tempo de duração de uma reunião ou espetáculo.|A sessão de cinema começa às oito.
seção|Parte, divisão.|Os livros estão na seção de história.
hesitação|Dúvida antes de agir.|Respondeu sem nenhuma hesitação.
beneficente|Que faz caridade.|O bazar beneficente arrecadou alimentos.
meteorologia|Ciência que estuda o tempo e o clima.|A meteorologia prevê chuva para amanhã.
cabeleireiro|Profissional que corta cabelo.|O cabeleireiro mudou o meu corte.
reivindicar|Exigir um direito.|Os moradores foram reivindicar asfalto.
prazerosa|Que dá prazer.|A leitura foi uma experiência prazerosa.
excêntrico|Diferente, fora do comum.|O artista tinha um gosto excêntrico.
exuberante|Cheio de vida e abundância.|A mata exuberante cobria a serra.
exótico|Estranho; vindo de fora.|Ele provou uma fruta de sabor exótico.
inexorável|Que não se pode deter.|O tempo é inexorável.
extinção|Fim, desaparecimento.|O mico-leão esteve ameaçado de extinção.
espontâneo|Natural, feito sem obrigação.|O sorriso dela foi espontâneo.
esplêndido|Magnífico.|O pôr do sol estava esplêndido.
estrangeiro|Pessoa de outro país.|O estrangeiro pediu informação em inglês.
espectador|Quem assiste a um espetáculo.|Cada espectador ganhou um ingresso.
expectativa|Esperança de que algo aconteça.|A expectativa pela final era enorme.
extravagante|Exagerado, fora do comum.|Ela usou um chapéu extravagante.
enxaqueca|Dor de cabeça forte.|A enxaqueca o deixou de cama.
mexilhão|Molusco de concha escura.|O prato tinha mexilhão e camarão.
rubrica|Assinatura abreviada.|Coloque sua rubrica em todas as páginas.
gratuito|Que não se paga.|O show na praça é gratuito.
recorde|Melhor resultado já obtido.|O nadador bateu o recorde mundial.
hifens|Plural de hífen.|A palavra tem dois hifens.
abdômen|Barriga.|O médico examinou o abdômen.
bênção|Proteção divina; ato de abençoar.|Ele pediu a bênção à avó.
paralelepípedo|Pedra usada no calçamento das ruas.|A rua de paralelepípedo trepida o carro.
ornitorrinco|Mamífero australiano com bico de pato.|O ornitorrinco bota ovos.
idiossincrasia|Jeito próprio e peculiar de alguém.|Dormir de meias é uma idiossincrasia dele.
pretensioso|Que se acha mais do que é.|O discurso pretensioso não convenceu.
intercessão|Pedido feito em favor de alguém.|A intercessão do amigo resolveu o caso.
excursão|Passeio em grupo.|A turma fez uma excursão ao museu.
extensão|Tamanho; prolongamento.|A extensão da ponte é de dois quilômetros.
ascendente|Que sobe.|O avião fez uma curva ascendente.
adolescente|Jovem entre a infância e a idade adulta.|O adolescente ganhou o primeiro emprego.
descendente|Quem descende de alguém.|Ele é descendente de italianos.
fascínio|Atração forte, encanto.|O mar exerce um fascínio sobre as crianças.
florescer|Dar flores; prosperar.|O ipê vai florescer em agosto.
consciente|Que tem consciência.|O paciente estava consciente.
obcecado|Dominado por uma ideia fixa.|Ele ficou obcecado pelo quebra-cabeça.
beneficência|Ação de fazer o bem.|A festa foi em prol da beneficência.
assessoria|Equipe que ajuda e aconselha.|A assessoria de imprensa divulgou a nota.
compreensão|Entendimento.|Agradeço a sua compreensão.
pretensão|Desejo; aspiração.|Ele não tem pretensão de ser famoso.
cassação|Anulação de um direito ou mandato.|A cassação do mandato foi votada.
concessão|Ato de conceder; permissão.|A empresa ganhou a concessão da estrada.
obsoleto|Ultrapassado, fora de uso.|O aparelho ficou obsoleto.
exorbitante|Exagerado, muito acima do normal.|O preço da passagem estava exorbitante.
excelência|Qualidade do que é excelente.|O hospital é referência de excelência.
excitação|Agitação, animação.|A excitação das crianças antes da festa era grande.
exibição|Ato de mostrar ao público.|A exibição do filme foi aplaudida.
espontaneidade|Naturalidade.|A espontaneidade dela encanta a todos.
hesitar|Ficar em dúvida antes de agir.|Não precisa hesitar em pedir ajuda.
herbívoro|Que se alimenta de plantas.|O boi é um animal herbívoro.
hemisfério|Metade de uma esfera ou do planeta.|O Brasil fica quase todo no hemisfério sul.
empecilho|Obstáculo.|A chuva foi um empecilho para a viagem.
irrequieto|Que não para quieto.|O filhote irrequieto mordeu o sapato.
digladiar|Lutar, discutir com força.|Os dois candidatos vão digladiar no debate.
umedecer|Deixar um pouco molhado.|É bom umedecer o pano antes de limpar.
bússola|Instrumento que aponta o norte.|O explorador usou a bússola na mata.
cortiça|Casca de árvore leve, usada em rolhas.|A rolha de cortiça vedou a garrafa.
pichação|Inscrição feita com tinta em muros.|A pichação sujou a parede da escola.
ojeriza|Antipatia, aversão.|Ele tem ojeriza a barata.
viajem|Forma do verbo viajar (que eles viajem).|Espero que eles viajem em segurança.
cauda|Rabo dos animais.|O cachorro abanava a cauda.
calda|Líquido doce e grosso.|O pudim leva calda de caramelo.
concerto|Apresentação musical.|Fomos ao concerto da orquestra.
conserto|Reparo, ato de consertar.|O conserto da geladeira ficou caro.
acender|Pôr fogo; ligar a luz.|Vou acender a vela.
ascender|Subir.|O alpinista conseguiu ascender ao topo.
cela|Quarto de prisão ou de convento.|O preso voltou para a cela.
sela|Assento que se põe no cavalo.|Ajeitou a sela antes de montar.
censo|Contagem da população.|O censo conta quantos moradores há no país.
senso|Juízo, entendimento.|Ele tem bom senso de humor.
eminente|Importante, notável.|Um eminente cientista deu a palestra.
iminente|Que está para acontecer.|O perigo de chuva forte é iminente.
discrição|Qualidade de quem é discreto.|Ele agiu com muita discrição.
descrição|Ato de descrever.|A descrição do lugar estava perfeita.
eminência|Altura; pessoa importante.|O castelo ficava numa eminência do terreno.
excrescência|Saliência ou sobra desnecessária.|O médico retirou a excrescência da pele.
quinquilharia|Objetos de pouco valor.|A gaveta estava cheia de quinquilharia.
proparoxítona|Palavra com acento tônico na antepenúltima sílaba.|"Música" é uma palavra proparoxítona.
otorrinolaringologista|Médico de ouvido, nariz e garganta.|O otorrinolaringologista examinou a garganta.
ressurreição|Ato de voltar à vida.|O livro fala da ressurreição de um herói.
dignidade|Respeito que alguém merece.|Todos devem ser tratados com dignidade.
idôneo|Honesto, adequado.|Procuramos um profissional idôneo.
paralisia|Perda dos movimentos.|A picada causou paralisia na perna.
adivinhar|Descobrir sem saber.|Quero adivinhar quem chegou.
acessível|De fácil acesso ou preço.|O museu é acessível para cadeirantes.
assíduo|Frequente, constante.|Ele é um leitor assíduo da biblioteca.
exaltação|Ato de exaltar; agitação.|A exaltação da torcida tomou o estádio.
ansioso|Preocupado, aflito.|Fiquei ansioso esperando o resultado.
ansiedade|Aflição, preocupação.|A ansiedade antes da prova é normal.
apreensivo|Preocupado.|O pai ficou apreensivo com a demora.
excomungar|Expulsar da igreja.|O papa podia excomungar os hereges.
exilado|Quem foi obrigado a deixar o país.|O poeta viveu exilado por anos.
vicissitude|Mudança de sorte; dificuldade.|Superou cada vicissitude da vida.`
};
// Monta a lista: [{w, d, f, l}]
const SOLE_PALAVRAS = (() => {
  const out = [];
  for(const l of ['f', 'm', 'd']) for(const ln of SOLE_RAW[l].split('\n')){
    const p = ln.split('|'); if(p.length < 3) continue;
    out.push({w:p[0].trim(), d:p[1].trim(), f:p[2].trim(), l});
  }
  return out;
})();
