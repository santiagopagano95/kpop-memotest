// Add idol photos to client/public/images/idols/
// Each image should be square, min 300x300px

// BTS
const BTS = [
  { id: 'jin-bts',        name: 'Jin',        group: 'BTS', image: 'jin.jpg' },
  { id: 'jungkook-bts',   name: 'Jungkook',   group: 'BTS', image: 'jungkook.jpg' },
  { id: 'taehyung-bts',   name: 'V',          group: 'BTS', image: 'taehyung.jpg' },
  { id: 'jimin-bts',      name: 'Jimin',      group: 'BTS', image: 'jimin.jpg' },
  { id: 'suga-bts',       name: 'Suga',       group: 'BTS', image: 'suga.jpg' },
  { id: 'rm-bts',         name: 'RM',         group: 'BTS', image: 'rm.jpg' },
  { id: 'jhope-bts',      name: 'J-Hope',     group: 'BTS', image: 'jhope.jpg' },
];

// BLACKPINK
const BLACKPINK = [
  { id: 'jisoo-bp',       name: 'Jisoo',      group: 'BLACKPINK', image: 'jisoo.jpg' },
  { id: 'jennie-bp',      name: 'Jennie',     group: 'BLACKPINK', image: 'jennie.jpg' },
  { id: 'rose-bp',        name: 'Rose',       group: 'BLACKPINK', image: 'rose.jpg' },
  { id: 'lisa-bp',        name: 'Lisa',       group: 'BLACKPINK', image: 'lisa.jpg' },
];

// TWICE
const TWICE = [
  { id: 'nayeon-twice',   name: 'Nayeon',     group: 'TWICE', image: 'nayeon.jpg' },
  { id: 'momo-twice',     name: 'Momo',       group: 'TWICE', image: 'momo.jpg' },
];

// Stray Kids
const STRAYKIDS = [
  { id: 'felix-skz',      name: 'Felix',      group: 'Stray Kids', image: 'felix.jpg' },
  { id: 'hyunjin-skz',    name: 'Hyunjin',    group: 'Stray Kids', image: 'hyunjin.jpg' },
];

// aespa
const AESPA = [
  { id: 'karina-aespa',   name: 'Karina',     group: 'aespa', image: 'karina.jpg' },
  { id: 'winter-aespa',   name: 'Winter',     group: 'aespa', image: 'winter.jpg' },
];

// LONGSHOT
const LONGSHOT = [
  { id: 'ohyul-ls',       name: 'Ohyul',      group: 'LONGSHOT', image: 'ohyul.jpg' },
  { id: 'louis-ls',       name: 'Louis',      group: 'LONGSHOT', image: 'louis.jpg' },
  { id: 'woojin-ls',      name: 'Woojin',     group: 'LONGSHOT', image: 'woojin.jpg' },
  { id: 'ryul-ls',        name: 'Ryul',       group: 'LONGSHOT', image: 'ryul.jpg' },
];

// GOT7
const GOT7 = [
  { id: 'jb-got7',        name: 'JB',         group: 'GOT7', image: 'jb.jpg' },
  { id: 'mark-got7',      name: 'Mark',       group: 'GOT7', image: 'mark.jpg' },
  { id: 'jackson-got7',   name: 'Jackson',    group: 'GOT7', image: 'jackson.jpg' },
  { id: 'jinyoung-got7',  name: 'Jinyoung',   group: 'GOT7', image: 'jinyoung.jpg' },
  { id: 'youngjae-got7',  name: 'Youngjae',   group: 'GOT7', image: 'youngjae.jpg' },
  { id: 'bambam-got7',    name: 'BamBam',     group: 'GOT7', image: 'bambam.jpg' },
  { id: 'yugyeom-got7',   name: 'Yugyeom',    group: 'GOT7', image: 'yugyeom.jpg' },
];

// Solistas y otros
const OTHERS = [
  { id: 'kangdaniel',     name: 'Kang Daniel', group: 'Solista', image: 'kangdaniel.jpg' },
  { id: 'zico',           name: 'Zico',        group: 'Solista', image: 'zico.jpg' },
  { id: 'jaypark',        name: 'Jay Park',    group: 'Solista', image: 'jaypark.jpg' },
];

// Todos los idols disponibles
const ALL_IDOLS = [
  ...BTS,
  ...BLACKPINK,
  ...TWICE,
  ...STRAYKIDS,
  ...AESPA,
  ...LONGSHOT,
  ...GOT7,
  ...OTHERS,
];

// Funcion para mezclar array (Fisher-Yates)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Exportar 12 idols aleatorios para cada sesion
export const IDOLS = shuffleArray(ALL_IDOLS).slice(0, 12);

// Exportar todos por si se necesita
export { ALL_IDOLS };
