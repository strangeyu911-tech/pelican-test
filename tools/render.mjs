// tools/render.mjs — 逐帧导出 PNG（多 worker，可续跑）。
//
//   node tools/render.mjs                         整片，30fps，3 worker
//   node tools/render.mjs --fps 60 --workers 4    60fps 对比测试
//   node tools/render.mjs --from 0 --to 12        只渲前 12 秒
//   node tools/render.mjs --step 5                每 5 帧渲 1 帧（快速看节奏）
//   node tools/render.mjs --out frames_test       换输出目录
//
// 已存在的帧默认跳过（--force 覆盖），所以中断了直接重跑就是续跑。
//
// 为什么每个 worker 独占一个页面：p5.brush / 烘焙缓存都是全局状态，
// 单页面多线程没意义；多开页面才能真正并行吃满 CPU。
// 而每帧渲染本身是 t 的纯函数，所以切成连片段互不干扰。
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, openPage, grabJpeg, ensureDir, parseArgs } from './_browser.mjs';

const args = parseArgs(process.argv);
const fps = Number(args.fps || 30);
const workers = Math.max(1, Number(args.workers || 3));
const step = Math.max(1, Number(args.step || 1));
const force = !!args.force;
const query = args.q && args.q !== true ? String(args.q) : '';
const outDir = ensureDir(path.resolve(ROOT, String(args.out || 'frames')));

// 先开一个页面拿时间轴
const probe = await openPage({ query });
const info = await probe.page.evaluate(() => ({
  duration: window.V.TL.duration,
  sections: window.V.TL.sections.map((s) => ({ id: s.id, t0: s.t0, t1: s.t1 })),
}));
await probe.close();

const from = Number(args.from ?? 0);
const to = Number(args.to ?? info.duration);
const total = Math.max(1, Math.round(((to - from) * fps) / step));
const digits = String(Math.round(info.duration * fps)).length + 1;
const nameOf = (i) => `frame_${String(i).padStart(digits, '0')}.jpg`;

// 计算本区间内实际要渲的帧号
const all = [];
for (let k = 0; k < total; k++) all.push(Math.round(from * fps) + k * step);

const todo = all.filter((f) => force || !fs.existsSync(path.join(outDir, nameOf(f))));
const skipped = all.length - todo.length;
console.log(
  `区间 ${from.toFixed(2)}–${to.toFixed(2)}s  ${total} 帧 @${fps}fps  step=${step}  worker=${workers}` +
  (skipped ? `  已有 ${skipped} 帧跳过` : '')
);
if (!todo.length) {
  console.log('没有要渲的帧。');
  process.exit(0);
}

const started = Date.now();
let done = 0;
let failed = null;

// 连片切块
const chunks = [];
const per = Math.ceil(todo.length / workers);
for (let w = 0; w < workers; w++) {
  const slice = todo.slice(w * per, (w + 1) * per);
  if (slice.length) chunks.push(slice);
}

function bar(n, t, elapsed) {
  const width = 28;
  const k = n / t;
  const fill = Math.round(k * width);
  const rate = n / (elapsed / 1000);
  const eta = rate > 0 ? (t - n) / rate : 0;
  return `${'█'.repeat(fill)}${'·'.repeat(width - fill)} ${(k * 100).toFixed(1)}%  ` +
    `${n}/${t}  ${rate.toFixed(2)} f/s  剩 ${Math.floor(eta / 60)}:${String(Math.round(eta % 60)).padStart(2, '0')}`;
}

let lastPrint = 0;
function report() {
  const el = Date.now() - started;
  if (el - lastPrint > 900 || done === todo.length) {
    lastPrint = el;
    process.stdout.write('\r' + bar(done, todo.length, el) + '   ');
  }
}

async function runChunk(slice, idx) {
  const ctx = await openPage({ query });
  try {
    for (const f of slice) {
      if (failed) break;
      const t = f / fps;
      const file = path.join(outDir, nameOf(f));
      try {
        const png = await grabJpeg(ctx.page, t);
        const err = await ctx.page.evaluate(() => window.__lastError);
        if (err) throw new Error(String(err).slice(0, 600));
        // 先写临时文件再改名：中途被杀不会留下半张图被当成"已完成"
        const tmp = file + '.part';
        fs.writeFileSync(tmp, png);
        // Windows 上偶尔会被杀软/索引服务锁住一瞬间，rename 报 EPERM。
        // 重试几次（同步小睡用 Atomics.wait，不阻塞事件循环以外的东西）
        let ok = false;
        for (let a = 0; a < 5 && !ok; a++) {
          try { fs.renameSync(tmp, file); ok = true; } catch (e) {
            if (e.code !== 'EPERM' && e.code !== 'EBUSY') throw e;
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 40);
          }
        }
        if (!ok) throw new Error('rename 重试 5 次仍失败: ' + file);
      } catch (e) {
        failed = failed || { t, file, error: e };
        break;
      }
      done++;
      report();
    }
  } finally {
    await ctx.close();
  }
}

await Promise.all(chunks.map((c, i) => runChunk(c, i)));
process.stdout.write('\n');

const el = (Date.now() - started) / 1000;
if (failed) {
  console.error(`\n在第 ${failed.t.toFixed(3)}s（${path.basename(failed.file)}）失败：`);
  console.error(String((failed.error && failed.error.message) || failed.error).slice(0, 1200));
  process.exit(1);
}
console.log(`完成 ${done} 帧，用时 ${el.toFixed(1)}s（${(done / el).toFixed(2)} f/s）→ ${path.relative(ROOT, outDir)}`);
