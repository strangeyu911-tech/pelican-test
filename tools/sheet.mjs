// tools/sheet.mjs — 接触表（contact sheet）：把若干时刻拼成一张带标签的大图。
// 阶段自查主力：一眼能看出 20 个版块的色调、构图、节奏有没有排好。
//
//   node tools/sheet.mjs --every 7                全片每 7 秒抽一帧
//   node tools/sheet.mjs --sections               每个版块的"梗"那一拍各抽一帧（20 格）
//   node tools/sheet.mjs --times 0,2.1,4.2,6.3    指定时刻
//   node tools/sheet.mjs --sections --cols 4 --out docs/sheets/s1.png
//
// 合成在页面内做：字体已经加载好，标签直接复用 V.text，不用在 Node 里搭 canvas。
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, openPage, ensureDir, parseArgs } from './_browser.mjs';

const args = parseArgs(process.argv);
const cols = Math.max(2, Number(args.cols || 5));
const max = Math.max(1, Number(args.max || 25));
const outArg = String(args.out || 'docs/sheets/sheet.png');
const query = args.q && args.q !== true ? String(args.q) : '';

const ctx = await openPage({ query });
const info = await ctx.page.evaluate(() => ({
  duration: window.V.TL.duration,
  bar: window.V.TL.bar,
  sections: window.V.TL.sections.map((s) => ({ id: s.id, index: s.index, kind: s.kind, t0: s.t0, t1: s.t1 })),
}));

// ---- 决定抽哪些时刻 ----
let times = [];
if (args.times && args.times !== true) {
  times = String(args.times).split(/[,\s]+/).filter(Boolean).map(Number);
} else if (args.sections) {
  // 每个版块第 2 小节的中段 = 梗正在演的时候
  times = info.sections
    .filter((s) => s.kind === 'scene')
    .map((s) => s.t0 + Math.min(info.bar * 1.5, (s.t1 - s.t0) * 0.62));
} else {
  const every = Number(args.every || 7);
  for (let t = 0; t < info.duration - 0.2; t += every) times.push(t);
}
if (args.from != null) times = times.filter((t) => t >= Number(args.from));
if (args.to != null) times = times.filter((t) => t <= Number(args.to));
times = times.map((t) => Math.max(0, Math.min(info.duration - 1e-3, t)));

// ---- 分页 ----
const pages = [];
for (let i = 0; i < times.length; i += max) pages.push(times.slice(i, i + max));

const outAbs = path.resolve(ROOT, outArg);
ensureDir(path.dirname(outAbs));
const ext = path.extname(outAbs) || '.png';
const base = outAbs.slice(0, outAbs.length - ext.length);

let n = 0;
for (const page of pages) {
  n++;
  const items = page.map((t) => {
    const sec = info.sections.find((s) => t >= s.t0 && t < s.t1);
    return { t, id: sec ? sec.id : '?' };
  });

  const dataUrl = await ctx.page.evaluate(async ({ items, cols, W, H, fontPx }) => {
    // 画布尺寸：缩略图宽 384（1080p 的 1/5），下面留一条标签带
    const CW = 384, CH = 216, PAD = 13, LAB = 27;
    const rows = Math.ceil(items.length / cols);
    const sw = cols * CW + (cols + 1) * PAD;
    const sh = rows * (CH + LAB) + (rows + 1) * PAD;
    const cv = document.createElement('canvas');
    cv.width = sw; cv.height = sh;
    const c = cv.getContext('2d');
    c.fillStyle = '#181613';
    c.fillRect(0, 0, sw, sh);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const r = Math.floor(i / cols), cc = i % cols;
      const x = PAD + cc * (CW + PAD);
      const y = PAD + r * (CH + LAB + PAD);
      const url = await window.grabFrame(it.t);
      const im = await new Promise((res, rej) => {
        const o = new Image();
        o.onload = () => res(o);
        o.onerror = rej;
        o.src = url;
      });
      c.drawImage(im, x, y, CW, CH);
      c.strokeStyle = 'rgba(255,255,255,0.22)';
      c.lineWidth = 1;
      c.strokeRect(x + 0.5, y + 0.5, CW - 1, CH - 1);
      // 标签：左边时间码，右边版块 id
      if (window.V && window.V.text) {
        window.V.text.draw(c, it.t.toFixed(2) + 's', x + 2, y + CH + 18, {
          font: 'en', size: 15, color: 'rgba(255,255,255,0.8)',
        });
        window.V.text.draw(c, it.id, x + CW - 2, y + CH + 18, {
          font: 'en', size: 15, color: 'rgba(255,255,255,0.55)', align: 'right',
        });
      } else {
        c.fillStyle = '#fff';
        c.font = fontPx + ' monospace';
        c.fillText(it.t.toFixed(2) + 's', x + 2, y + CH + 18);
      }
    }
    return cv.toDataURL('image/png');
  }, { items, cols, W: 1920, H: 1080, fontPx: 15 });

  const file = pages.length === 1 ? outAbs : base + `_${n}` + ext;
  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`${page.length} 格 → ${path.relative(ROOT, file)}`);
}

const err = await ctx.page.evaluate(() => window.__lastError);
if (err) console.log('\n[渲染错误]', String(err).slice(0, 700));
await ctx.close();
process.exit(0);
