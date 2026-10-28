// tools/preview-shot.mjs — 截一张"预览页"的图（含底部播放条），用来确认两个交付物里的第一个。
//   node tools/preview-shot.mjs --t 40 --out docs/shots/preview.png
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, openPage, ensureDir, parseArgs } from './_browser.mjs';

const args = parseArgs(process.argv);
const t = Number(args.t ?? 40);
const out = path.resolve(ROOT, String(args.out || 'docs/shots/preview.png'));

const ctx = await openPage({});
// 控制条平时是隐藏的（鼠标移到下缘才出现）。
// 只靠 page.mouse.move 不稳：headless 下这条 mousemove 有时不落到 window 上，
// 而 pelican-ready 那边的 3.2s 自动显示早就过点了。所以截图前再补一次合成事件。
const pokeBar = () => ctx.page.evaluate(() => {
  window.dispatchEvent(new MouseEvent('mousemove', {
    clientY: window.innerHeight - 10, bubbles: true,
  }));
});
await ctx.page.mouse.move(960, 1050);
await pokeBar();
await ctx.page.evaluate(async (tt) => {
  const seek = document.querySelector('#seek');
  const btn = document.querySelector('#play');
  if (seek) {
    seek.value = String(Math.round((tt / window.V.TL.duration) * 1000));
    seek.dispatchEvent(new Event('input', { bubbles: true }));
  }
  await new Promise((r) => setTimeout(r, 200));
  // 真的播一下，验证播放循环也在跑
  if (btn) btn.click();
  await new Promise((r) => setTimeout(r, 320));
  if (btn) btn.click();
}, t);
await pokeBar();
await new Promise((r) => setTimeout(r, 300));

const info = await ctx.page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  return {
    time: q('#time') && q('#time').textContent,
    name: q('#name') && q('#name').textContent,
    barVisible: q('#bar') ? getComputedStyle(q('#bar')).opacity : null,
    seek: q('#seek') && q('#seek').value,
    err: window.__lastError,
  };
});
console.log('UI 状态：', JSON.stringify(info));

ensureDir(path.dirname(out));
await ctx.page.screenshot({ path: out, type: 'png' });
console.log('→', path.relative(ROOT, out));
await ctx.close();
process.exit(0);
