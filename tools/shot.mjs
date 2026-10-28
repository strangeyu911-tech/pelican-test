// tools/shot.mjs — 渲染单个时刻，存成 PNG。调试主力。
//   node tools/shot.mjs --t 8.5
//   node tools/shot.mjs --t 30 --out docs/song.png
//   node tools/shot.mjs --scene song            （渲染该版块第 2 小节的开头 = 梗的时机）
//   node tools/shot.mjs --sheet 0 12 5          （从 0s 到 12s 平均 5 张）
//   node tools/shot.mjs --t 8.5 --q rider       （只看骑手，放大 2.5×，纯色底）
//   node tools/shot.mjs --t 8.5 --q rider,rig   （再看骨架锚点）
//   node tools/shot.mjs --tl                      （只打印时间轴表，不渲染）
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, openPage, grabPNG, ensureDir, parseArgs } from './_browser.mjs';

const args = parseArgs(process.argv);
const outDir = ensureDir(path.join(ROOT, 'docs', 'shots'));

const ctx = await openPage({ verbose: true, query: args.q && args.q !== true ? String(args.q) : '' });
const tl = await ctx.page.evaluate(() => ({
  duration: window.V.TL.duration,
  sections: window.V.TL.sections.map((s) => ({ id: s.id, kind: s.kind, index: s.index, t0: s.t0, t1: s.t1 })),
  bar: window.V.TL.bar,
}));

const jobs = [];
if (args.tl) {
  for (const s of tl.sections) {
    const bars = ((s.t1 - s.t0) / tl.bar).toFixed(2).replace(/\.00$/, '');
    console.log(`${String(s.index).padStart(2, ' ')}  ${s.kind.padEnd(6)} ${s.id.padEnd(9)} ${s.t0.toFixed(2).padStart(7)} – ${s.t1.toFixed(2).padStart(7)}  ${bars} 小节  → node tools/shot.mjs --scene ${s.id}`);
  }
  console.log(`全长 ${tl.duration.toFixed(3)}s  ${(tl.duration / tl.bar).toFixed(0)} 小节`);
  await ctx.close();
  process.exit(0);
}
if (args.sheet) {
  const times = String(args.sheet).trim().split(/[,\s]+/).map(Number);
  const [a, b, n] = times;
  const count = n || 6;
  for (let i = 0; i < count; i++) jobs.push({ t: a + ((b - a) * i) / Math.max(1, count - 1), name: `sheet_${a}_${b}_${i}` });
} else if (args.scene) {
  const sec = tl.sections.find((s) => s.id === args.scene);
  if (!sec) { console.error('找不到版块', args.scene); await ctx.close(); process.exit(1); }
  // 默认取第 2 小节的中间 = 梗正在演的时候
  jobs.push({ t: sec.t0 + tl.bar * 1.5, name: `${args.scene}_gag` });
  jobs.push({ t: sec.t0 + 0.6, name: `${args.scene}_enter` });
  jobs.push({ t: sec.t1 - 0.9, name: `${args.scene}_exit` });
} else {
  const t = args.t != null ? Number(args.t) : 0;
  jobs.push({ t, name: args.out ? path.basename(String(args.out), '.png') : `t${t.toFixed(2)}` });
}

const t0 = Date.now();
for (const j of jobs) {
  const tt = Math.max(0, Math.min(tl.duration - 1e-3, j.t));
  const png = await grabPNG(ctx.page, tt);
  const file = args.out && jobs.length === 1
    ? path.resolve(ROOT, String(args.out))
    : path.join(outDir, `${j.name}.png`);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, png);
  const sec = tl.sections.find((s) => tt >= s.t0 && tt < s.t1);
  console.log(`${tt.toFixed(2)}s  ${sec ? sec.id : '?'}  ${(png.length / 1024).toFixed(0)}KB  -> ${path.relative(ROOT, file)}`);
}
const err = await ctx.page.evaluate(() => window.__lastError);
if (err) console.log('\n[渲染错误]', String(err).slice(0, 800));
if (ctx.logs.length) console.log('\n[页面日志]\n' + ctx.logs.slice(0, 12).join('\n'));
console.log(`\n${jobs.length} 张，用时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);

await ctx.close();
process.exit(0);
