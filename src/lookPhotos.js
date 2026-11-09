// Catálogo editorial: classificação baseada na inspeção visual das fotografias enviadas.
// Os nomes dos arquivos originais são preservados para associação exata.
const metadata = {
  "WhatsApp Image 2026-11-05 at 17.42.39 (1).jpeg": {
    "title": "Sporty Night",
    "style": "Sporty",
    "pieces": [
      "Jaqueta esportiva preta com listras brancas",
      "regata branca",
      "shorts esportivo azul-marinho sobre shorts preto",
      "meias brancas",
      "tênis preto com listras brancas",
      "bolsa esportiva preta"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.39 (2).jpeg": {
    "title": "Sporty All White",
    "style": "Sporty",
    "pieces": [
      "Jaqueta esportiva branca de zíper",
      "shorts branco",
      "meias brancas",
      "tênis branco e cinza",
      "fones prateados",
      "bolsa de academia branca"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.39 (3).jpeg": {
    "title": "Sporty Grey",
    "style": "Sporty",
    "pieces": [
      "Camiseta branca de manga curta",
      "calça de moletom cinza de pernas amplas",
      "tênis branco e cinza",
      "bolsa esportiva cinza",
      "fones prateados"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.39.jpeg": {
    "title": "Cowgirl Sunset",
    "style": "Western",
    "pieces": [
      "Chapéu cowboy marrom",
      "jaqueta de couro marrom",
      "regata branca",
      "jeans amplo com bordados",
      "cinto de fivela dourada",
      "botas marrons",
      "bolsa marrom"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.40 (2).jpeg": {
    "title": "Navy Gym Set",
    "style": "Sporty",
    "pieces": [
      "Top esportivo azul-marinho",
      "shorts azul-marinho",
      "meias esportivas brancas",
      "tênis branco e cinza",
      "fones prateados",
      "relógio esportivo"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.40 (3).jpeg": {
    "title": "Retro Campus",
    "style": "Y2K",
    "pieces": [
      "Polo cropped vinho com detalhes creme",
      "jeans baggy com aplicações",
      "tênis vinho",
      "bolsa marrom",
      "óculos e acessórios dourados"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.40.jpeg": {
    "title": "Pink Pilates",
    "style": "Sporty",
    "pieces": [
      "Jaqueta esportiva rosa-claro com zíper",
      "shorts rosa combinando",
      "meias brancas",
      "tênis rosa e branco",
      "bolsa branca",
      "garrafa rosa"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.41 (1).jpeg": {
    "title": "Dark Graphic Street",
    "style": "Streetwear",
    "pieces": [
      "Gorro preto estampado",
      "camiseta preta",
      "jaqueta oversized preta com desenhos",
      "jeans baggy grafite estampado",
      "tênis branco e preto"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.41 (2).jpeg": {
    "title": "Vintage Track",
    "style": "Streetwear",
    "pieces": [
      "Jaqueta esportiva bege com listras marrons",
      "minissaia jeans",
      "tênis retrô bege e vinho",
      "bolsa de ombro marrom",
      "óculos escuros"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.41 (3).jpeg": {
    "title": "Varsity Denim",
    "style": "Streetwear",
    "pieces": [
      "Jaqueta esportiva creme e vinho",
      "regata branca",
      "jeans baggy com estampa",
      "tênis preto e branco",
      "bolsa preta"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.41.jpeg": {
    "title": "Graphic Denim 2000",
    "style": "Y2K",
    "pieces": [
      "Boné azul-marinho",
      "regata preta com lettering",
      "jeans baggy grafite com estampa",
      "tênis escuro com listras brancas",
      "bolsa preta e acessórios metálicos"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.42 (1).jpeg": {
    "title": "Pink Ribbons",
    "style": "Coquette",
    "pieces": [
      "Vestido rosa-claro plissado com laços nos ombros e babados",
      "sandálias brancas de salto",
      "bolsa branca estruturada",
      "laço rosa no cabelo"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.42 (2).jpeg": {
    "title": "Pearl Bow",
    "style": "Coquette",
    "pieces": [
      "Vestido curto rosa-claro com laço branco no ombro",
      "meia-calça rosa suave",
      "sandálias claras com laços",
      "bolsa rosa",
      "joias de pérolas"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.42 (3).jpeg": {
    "title": "Pink Tweed",
    "style": "Coquette",
    "pieces": [
      "Vestido curto rosa e branco em padronagem tweed",
      "colar de pérolas",
      "bolsa branca estruturada",
      "scarpins rosa"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.42.jpeg": {
    "title": "Floral Romance",
    "style": "Coquette",
    "pieces": [
      "Vestido floral rosa com mangas caídas e tecido leve",
      "bolsa rosa matelassê",
      "sandálias rosa com laços",
      "acessórios delicados"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.43 (1).jpeg": {
    "title": "Burgundy Boho",
    "style": "Boho",
    "pieces": [
      "Blusa vinho ombro a ombro com mangas fluidas",
      "jeans azul de pernas amplas",
      "cinto largo de medalhões",
      "bolsa marrom",
      "sapatos vinho"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.43 (2).jpeg": {
    "title": "Lace & Denim",
    "style": "Boho",
    "pieces": [
      "Blusa bege de renda com alças",
      "minissaia jeans",
      "cinto com ilhoses",
      "botas altas marrons de camurça",
      "bolsa marrom"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.43 (3).jpeg": {
    "title": "Earthy Wanderer",
    "style": "Boho",
    "pieces": [
      "Blusa creme bordada com amarração frontal e mangas amplas",
      "saia longa assimétrica estampada em tons terrosos",
      "bolsa com franjas",
      "sandálias plataforma"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.43.jpeg": {
    "title": "Parisian Blush",
    "style": "Coquette",
    "pieces": [
      "Boina branca",
      "blusa rosa-claro de gola alta com laço",
      "minissaia xadrez plissada",
      "bolsa xadrez clara",
      "sandálias rosa com laços"
    ]
  },
  "WhatsApp Image 2026-11-05 at 17.42.44 (1).jpeg": {"title":"Renda e Botas","style":"Boho","pieces":["Vestido longo de renda creme com amarração","Botas altas de couro marrom","Bolsa marrom com franjas","Colares dourados"]},
  "WhatsApp Image 2026-11-05 at 17.42.44 (2).jpeg": {"title":"Xadrez Noturno","style":"Dark Academia","pieces":["Blusa xadrez com mangas bufantes","Saia preta plissada com cinto","Meia-calça preta floral","Sapatos pretos plataforma","Boina e bolsa escura"]},
  "WhatsApp Image 2026-11-05 at 17.42.44.jpeg": {"title":"Verde Oliva","style":"Boho","pieces":["Blusa marrom frente única com amarração","Saia longa verde oliva em camadas","Cinto largo marrom","Bolsa verde estampada","Sandálias marrons"]},
  "WhatsApp Image 2026-11-05 at 17.42.45 (1).jpeg": {"title":"Biblioteca à Noite","style":"Dark Academia","pieces":["Blusa preta de gola alta","Minissaia xadrez","Cinto largo marrom","Meia-calça preta","Botas pretas de cano alto","Bolsa marrom"]},
  "WhatsApp Image 2026-11-05 at 17.42.45 (2).jpeg": {"title":"Campus Vintage","style":"Dark Academia","pieces":["Casaco marrom","Blusa creme com detalhe de renda","Saia curta xadrez","Meia-calça escura","Meias claras","Botas marrons e bolsa de ombro"]},
  "WhatsApp Image 2026-11-05 at 17.42.45 (3).jpeg": {"title":"Silver Denim","style":"Y2K","pieces":["Blusa branca drapeada","Shorts jeans escuros","Cinto preto com tachas","Bolsa prateada","Botas pretas felpudas"]},
  "WhatsApp Image 2026-11-05 at 17.42.45 (4).jpeg": {"title":"Leather Star","style":"Grunge","pieces":["Jaqueta preta de couro oversized","Blusa preta cropped","Shorts jeans pretos estampados","Cinto preto","Botas pretas de cano alto"]},
  "WhatsApp Image 2026-11-05 at 17.42.45.jpeg": {"title":"Biblioteca Vintage","style":"Dark Academia","pieces":["Camisa creme com mangas bufantes","Colete marrom","Saia midi plissada xadrez","Meias claras","Sapatos Oxford marrons","Bolsa marrom"]},
  "WhatsApp Image 2026-11-05 at 17.42.46 (1).jpeg": {"title":"Midnight Fur","style":"Grunge","pieces":["Casaco preto felpudo com capuz","Blusa preta estampada","Minissaia preta com tachas","Bolsa preta com aplicações","Botas pretas com tachas"]},
  "WhatsApp Image 2026-11-05 at 17.42.46 (2).jpeg": {"title":"Black Lace","style":"Gothic","pieces":["Blusa preta com botões","Saia preta de babados","Cintos com ilhoses","Meia-calça rendada floral","Botas pretas com fivelas","Bolsa preta"]},
  "WhatsApp Image 2026-11-05 at 17.42.46.jpeg": {"title":"Studded Rebel","style":"Y2K","pieces":["Top preto com aplicações metálicas","Shorts jeans escuros com cinto","Boné preto com estampa de caveira","Bolsa preta","Tênis pretos robustos"]},
  "WhatsApp Image 2026-11-05 at 17.42.47 (1).jpeg": {"title":"Floral Blush","style":"Coquette","pieces":["Blusa creme com estampa floral rosa e mangas delicadas","Saia longa rosa-claro","Bolsa clara de ombro","Sandálias rosa com laços","Acessório de cabelo rosa"]},
  "WhatsApp Image 2026-11-05 at 17.42.47 (2).jpeg": {"title":"Polka Dot Romance","style":"Coquette","pieces":["Vestido rosa de bolinhas com mangas bufantes","Laços pretos","Meias claras até o joelho","Sapatos Mary Jane pretos","Bolsa rosa"]},
  "WhatsApp Image 2026-11-05 at 17.42.47.jpeg": {"title":"Parisian Dots","style":"Coquette","pieces":["Blusa rosa com sobreposição branca de bolinhas e amarração","Minissaia branca de bolinhas","Bolsa rosa","Sandálias brancas com laços"]}
};
const photos = require.context('../assets/looks', false, /\.(jpe?g|png)$/i);
export const localLooks = photos.keys().sort().map((key, index) => {
 const filename = key.replace(/^\.\//, '');
 const details = metadata[filename];
 return {
   id: 'editorial-' + index,
   local: true,
   image: photos(key),
   title: details?.title || 'Inspiração MAD ' + String(index + 1).padStart(2, '0'),
   style: details?.style || 'A classificar',
   pieces: details?.pieces || ['Descrição das peças pendente de revisão visual'],
 };
});
