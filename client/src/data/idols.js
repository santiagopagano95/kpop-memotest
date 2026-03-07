// All available idols
// Add idol photos to client/public/images/idols/
// Each image should be square, min 300x300px

export const ALL_IDOLS = [
  // BTS
  { id: 'jin-bts', name: 'Jin', group: 'BTS', image: 'jin.jpg' },
  { id: 'jungkook-bts', name: 'Jungkook', group: 'BTS', image: 'jungkook.jpg' },
  { id: 'taehyung-bts', name: 'V', group: 'BTS', image: 'taehyung.jpg' },
  { id: 'jimin-bts', name: 'Jimin', group: 'BTS', image: 'jimin.jpg' },
  { id: 'suga-bts', name: 'Suga', group: 'BTS', image: 'suga.jpg' },
  { id: 'rm-bts', name: 'RM', group: 'BTS', image: 'rm.jpg' },
  { id: 'jhope-bts', name: 'J-Hope', group: 'BTS', image: 'jhope.jpg' },
  // BLACKPINK
  { id: 'jisoo-bp', name: 'Jisoo', group: 'BLACKPINK', image: 'jisoo.jpg' },
  { id: 'jennie-bp', name: 'Jennie', group: 'BLACKPINK', image: 'jennie.jpg' },
  { id: 'rose-bp', name: 'Rose', group: 'BLACKPINK', image: 'rose.jpg' },
  { id: 'lisa-bp', name: 'Lisa', group: 'BLACKPINK', image: 'lisa.jpg' },
  // TWICE
  { id: 'nayeon-twice', name: 'Nayeon', group: 'TWICE', image: 'nayeon.jpg' },
  { id: 'jeongyeon-twice', name: 'Jeongyeon', group: 'TWICE', image: 'jeongyeon.jpg' },
  { id: 'momo-twice', name: 'Momo', group: 'TWICE', image: 'momo.jpg' },
  { id: 'sana-twice', name: 'Sana', group: 'TWICE', image: 'sana.jpg' },
  { id: 'jihyo-twice', name: 'Jihyo', group: 'TWICE', image: 'jihyo.jpg' },
  { id: 'mina-twice', name: 'Mina', group: 'TWICE', image: 'mina.jpg' },
  { id: 'dahyun-twice', name: 'Dahyun', group: 'TWICE', image: 'dahyun.jpg' },
  { id: 'chaeyoung-twice', name: 'Chaeyoung', group: 'TWICE', image: 'chaeyoung.jpg' },
  { id: 'tzuyu-twice', name: 'Tzuyu', group: 'TWICE', image: 'tzuyu.jpg' },
  // Stray Kids
  { id: 'felix-skz', name: 'Felix', group: 'Stray Kids', image: 'felix.jpg' },
  { id: 'hyunjin-skz', name: 'Hyunjin', group: 'Stray Kids', image: 'hyunjin.jpg' },
  // aespa
  { id: 'karina-aespa', name: 'Karina', group: 'aespa', image: 'karina.jpg' },
  { id: 'winter-aespa', name: 'Winter', group: 'aespa', image: 'winter.jpg' },
  // LONGSHOT
  { id: 'ohyul-ls', name: 'Ohyul', group: 'LNGSHOT', image: 'ohyul.jpg' },
  { id: 'louis-ls', name: 'Louis', group: 'LNGSHOT', image: 'louis.jpg' },
  { id: 'woojin-ls', name: 'Woojin', group: 'LNGSHOT', image: 'woojin.jpg' },
  { id: 'ryul-ls', name: 'Ryul', group: 'LNGSHOT', image: 'ryul.jpg' },
  // GOT7
  { id: 'jb-got7', name: 'JB', group: 'GOT7', image: 'jb.jpg' },
  { id: 'mark-got7', name: 'Mark', group: 'GOT7', image: 'mark.jpg' },
  { id: 'jackson-got7', name: 'Jackson', group: 'GOT7', image: 'jackson.jpg' },
  { id: 'jinyoung-got7', name: 'Jinyoung', group: 'GOT7', image: 'jinyoung.jpg' },
  { id: 'youngjae-got7', name: 'Youngjae', group: 'GOT7', image: 'youngjae.jpg' },
  { id: 'bambam-got7', name: 'BamBam', group: 'GOT7', image: 'bambam.jpg' },
  { id: 'yugyeom-got7', name: 'Yugyeom', group: 'GOT7', image: 'yugyeom.jpg' },
  // Solistas
  { id: 'kangdaniel', name: 'Kang Daniel', group: 'Solista', image: 'kangdaniel.jpg' },
  { id: 'zico', name: 'Zico', group: 'Solista', image: 'zico.jpg' },
  { id: 'jaypark', name: 'Jay Park', group: 'Solista', image: 'jaypark.jpg' },
];

// Board size options: pairs count -> total cards
export const BOARD_SIZES = [
  { pairs: 6, label: '12 cartas (4x3)', cols: 4 },
  { pairs: 8, label: '16 cartas (4x4)', cols: 4 },
  { pairs: 10, label: '20 cartas (5x4)', cols: 5 },
];
