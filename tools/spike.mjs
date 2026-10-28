// tools/spike.mjs — 性能基线测试（页面内 toBlob 导出，不用 CDP 截图）
//   node tools/spike.mjs [--frames 24]
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, x, i, arr) => {
    if (x.startsWith('--')) a.push([x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return a;
  }, [])
);
const NFRAMES = +(args.frames ?? 24);
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const base = u.startsWith('/src/') ? root : pub;
  const f = path.join(base, u === '/' ? 'index.html' : u);
  if (!f.startsWith(base) || !fs.existsSync(f)) { res.statusCode = 404; return res.end('nf'); }
  res.setHeader('content-type', mime[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
    '--enable-unsafe-swiftshader', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--no-sandbox'],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 300)));

const t0 = Date.now();
await page.goto(`http://localhost:${port}/spike.html`);
await page.waitForFunction('window.__ready === true', { timeout: 120000 });
console.log(`ready ${Date.now() - t0}ms`);
console.log('WebGL:', await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  const d = gl && gl.getExtension('WEBGL_debug_renderer_info');
  return gl ? (d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) : 'NONE';
}));

async function bench(mode, n) {
  await page.evaluate((m) => window.spikeSetMode(m), mode);
  const res = await page.evaluate(async ({ n }) => {
    const out = { draw: [], export: [] };
    for (let i = 0; i < n; i++) {
      const a = performance.now();
      await window.renderAt(i / 30);
      out.draw.push(performance.now() - a);
      if (i > 0) { // 首帧含烘焙，导出单独记
        const b = performance.now();
        await new Promise((r) => document.querySelector('canvas').toBlob(r, 'image/png'));
        out.export.push(performance.now() - b);
      }
    }
    return { draw: out.draw, exp: out.export, stats: window.spikeStats() };
  }, { n });
  return res;
}

const pct = (arr, p) => { const s = [...arr].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const fmt = (a) => a.length ? `mean ${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1)} p50 ${pct(a, .5).toFixed(1)} p95 ${pct(a, .95).toFixed(1)} max ${Math.max(...a).toFixed(1)}` : 'n/a';

await page.evaluate(() => window.spikeSetMode('A'));
const A = await bench('A', NFRAMES);
console.log(`\n[A] 每帧全量重画 brush 水墨（~200 笔）`);
console.log(`    draw:   ${fmt(A.draw.slice(1))}   (首帧 ${A.draw[0].toFixed(1)}ms)`);
console.log(`    export: ${fmt(A.exp)}`);

await page.evaluate(() => window.spikeSetMode('B'));
const B = await bench('B', NFRAMES);
console.log(`\n[B] 烘焙 + 每帧 blit + 动态骑手`);
console.log(`    draw:   ${fmt(B.draw.slice(1))}   (首帧含烘焙 ${B.draw[0].toFixed(1)}ms)`);
console.log(`    export: ${fmt(B.exp)}`);

// 存两张图
async function save(mode, file) {
  const b64 = await page.evaluate(async (m) => {
    window.spikeSetMode(m);
    await window.renderAt(0.4);
    await window.renderAt(0.4);   // 热身一次，确保烘焙完成
    const cv = document.querySelector('canvas');
    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    return await new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); });
  }, mode);
  fs.writeFileSync(path.join(root, 'docs', file), Buffer.from(b64.split(',')[1], 'base64'));
}
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
await save('A', 'spike_A.png');
await save('B', 'spike_B.png');

await browser.close();
server.close();

const total30 = Math.round(137 * 30), total60 = Math.round(137 * 60);
const perB = pct(B.draw.slice(1), .5) + pct(B.exp, .5);
const perA = pct(A.draw.slice(1), .5) + pct(A.exp, .5);
console.log('\n=== 单帧总成本（draw+export）与全片推算 ===');
console.log(`A 全量重画: ${perA.toFixed(0)}ms/帧  30fps ${(total30 * perA / 60000).toFixed(1)}min  60fps ${(total60 * perA / 60000).toFixed(1)}min  (单线程)`);
console.log(`B 烘焙+blit: ${perB.toFixed(0)}ms/帧  30fps ${(total30 * perB / 60000).toFixed(1)}min  60fps ${(total60 * perB / 60000).toFixed(1)}min  (单线程)`);
process.exit(0);
