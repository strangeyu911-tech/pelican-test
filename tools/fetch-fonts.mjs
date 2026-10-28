// tools/fetch-fonts.mjs — 抓取并子集化 OFL 开源字体到 public/fonts/
// 字体不进仓库（体积 + 可变性），clone 后跑一次即可。
// 中文字体走 Google Fonts 的 text= 子集化：完整 Noto Serif SC 有 14.8MB，
// 且本机到 fonts.gstatic.com 只有 42KB/s，全量下载要 6 分钟；子集化后只有几十 KB。
//   node tools/fetch-fonts.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'fonts');
fs.mkdirSync(outDir, { recursive: true });

// ---------- 从 strings.js 取全片字符集 ----------
function loadStrings() {
  const src = fs.readFileSync(path.join(root, 'src', 'kit', 'strings.js'), 'utf8');
  const ctx = { window: {}, module: { exports: {} }, console };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.window.S || ctx.module.exports;
}
const S = loadStrings();
const CHARSET = S.charset();
console.log(`charset: ${CHARSET.length} unique chars`);

const GF = 'https://fonts.googleapis.com/css2?family=';

async function getCss(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  if (!r.ok) throw new Error(`css ${r.status}`);
  return await r.text();
}
function firstUrl(cssText) {
  const m = cssText.match(/url\((https:\/\/[^)]+)\)/);
  return m ? m[1] : null;
}
async function dl(url, file) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`dl ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(path.join(outDir, file), buf);
  console.log(`  ${file.padEnd(28)} ${(buf.length / 1024).toFixed(1)} KB`);
  return buf.length;
}

// 1) 中文衬线 — Noto Serif SC 400 / 700，text= 子集
//    URL 上限约 8KB；一个汉字 URL 编码后 9 字节，所以按 400 字分批
const BATCH = 400;
const cnBatches = [];
for (let i = 0; i < CHARSET.length; i += BATCH) cnBatches.push(CHARSET.slice(i, i + BATCH));
console.log(`\nNoto Serif SC — ${cnBatches.length} batch(es)`);

const faces = [];
for (const weight of [400, 700]) {
  for (let bi = 0; bi < cnBatches.length; bi++) {
    const text = cnBatches[bi];
    const enc = encodeURIComponent(text);
    const css = await getCss(`${GF}Noto+Serif+SC:wght@${weight}&text=${enc}`);
    const u = firstUrl(css);
    if (!u) { console.log(`  w${weight} b${bi}: no url`); continue; }
    const file = `NotoSerifSC-${weight}-${bi}.ttf`;
    await dl(u, file);
    faces.push({ family: 'Noto Serif SC', weight, file, glyphs: text });
  }
}

// 2) 英文衬线 — EB Garamond 可变字重（一个文件覆盖 400-800）
console.log('\nEB Garamond (variable)');
try {
  await dl('https://raw.githubusercontent.com/google/fonts/main/ofl/ebgaramond/EBGaramond%5Bwght%5D.ttf', 'EBGaramond-var.ttf');
  faces.push({ family: 'EB Garamond', weight: '400 800', file: 'EBGaramond-var.ttf' });
} catch (e) { console.log('  skip:', e.message); }

// 3) 等宽 — JetBrains Mono，只要 ASCII
console.log('\nJetBrains Mono (ASCII subset)');
try {
  const ascii = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
  const css = await getCss(`${GF}JetBrains+Mono:wght@400&text=${encodeURIComponent(ascii)}`);
  const u = firstUrl(css);
  if (u) { await dl(u, 'JetBrainsMono-400.ttf'); faces.push({ family: 'JetBrains Mono', weight: '400', file: 'JetBrainsMono-400.ttf' }); }
} catch (e) { console.log('  skip:', e.message); }

// 4) 毛笔楷书 — Ma Shan Zheng，中文字集
console.log('\nMa Shan Zheng');
try {
  const css = await getCss(`${GF}Ma+Shan+Zheng&text=${encodeURIComponent(cnBatches[0])}`);
  const u = firstUrl(css);
  if (u) { await dl(u, 'MaShanZheng-400.ttf'); faces.push({ family: 'Ma Shan Zheng', weight: '400', file: 'MaShanZheng-400.ttf' }); }
} catch (e) { console.log('  skip:', e.message); }

// ---------- 生成 fonts.css ----------
// 同一 family 的多个子集 face 必须给各自独立的 unicode-range，否则浏览器只取第一个。
function rangesOf(text) {
  const cps = [...new Set([...text].map((c) => c.codePointAt(0)))].sort((a, b) => a - b);
  const out = [];
  let start = cps[0], prev = cps[0];
  for (let i = 1; i < cps.length; i++) {
    if (cps[i] === prev + 1) { prev = cps[i]; continue; }
    out.push([start, prev]); start = prev = cps[i];
  }
  out.push([start, prev]);
  return out.map(([a, b]) => (a === b ? `U+${a.toString(16).toUpperCase()}` : `U+${a.toString(16).toUpperCase()}-${b.toString(16).toUpperCase()}`)).join(', ');
}

// 按 face 记录的实际字符集生成 unicode-range（同 family 多子集必须互不重叠）
let css = '/* 自动生成 — node tools/fetch-fonts.mjs。字体均为 SIL Open Font License 1.1 */\n';

for (const f of faces) {
  const range = f.glyphs ? rangesOf(f.glyphs) : '';
  css += `@font-face{font-family:'${f.family}';font-weight:${f.weight};font-display:block;` +
    (range ? `unicode-range:${range};` : '') +
    `src:url('${f.file}') format('truetype');}\n`;
}
fs.writeFileSync(path.join(outDir, 'fonts.css'), css);

const total = fs.readdirSync(outDir).filter((x) => x.endsWith('.ttf')).reduce((a, x) => a + fs.statSync(path.join(outDir, x)).size, 0);
console.log(`\ndone -> ${outDir}`);
console.log(`total ${(total / 1024).toFixed(1)} KB, ${faces.length} faces, fonts.css written`);
