// what the captions will show: the page's buildChunks run over the built cues
const fs = require('fs'); const src = fs.readFileSync('ns2_main_check.js', 'utf8');
const i = src.indexOf('const CHUNK_JOIN'); const j = src.indexOf('buildChunks();', i);
const vo = JSON.parse(fs.readFileSync('ns2/audio/vo2.json', 'utf8')).lines;
const story = fs.readFileSync('ns2/story.js', 'utf8'); const texts = [...story.matchAll(/\{ t:[^,]+,\s+text:"(.*?)"/g)].map(m => m[1]);
const CUES = texts.map((text, k) => { const v = vo.find(l => l.cue === k); return v ? { text, t:v.t, w:v.w, d:v.d, ph:v.ph, end:v.t + v.d } : null; }).filter(Boolean);
let CHUNKS; eval(src.slice(i, j).replace('function buildChunks', 'buildChunks = function'));
buildChunks();
CHUNKS.forEach(c => console.log(c.t.toFixed(2).padStart(6), '-', c.end.toFixed(2).padStart(6), ' ', c.words.join(' ')));
