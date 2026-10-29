// tools/_browser.mjs — 起本地静态服务 + 启动 Chrome 打开预览页，等它就绪。
// shot / render / sheet 共用这一套，避免每个脚本各写一遍。
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

export const CHROME =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

/** 起一个只读静态服务，端口随机 */
export function startServer() {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    // /src/** 直接读项目根，其余读 public/
    const base = u.startsWith('/src/') ? ROOT : PUB;
    const f = path.join(base, u === '/' ? 'index.html' : u);
    if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.statusCode = 404;
      return res.end('not found');
    }
    res.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream');
    res.setHeader('cache-control', 'no-store');
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/**
 * 打开一个渲染页并等 __ready。
 * @param {object} o { page: 'index.html', query: '', width, height, verbose }
 */
export async function openPage(o = {}) {
  if (!fs.existsSync(CHROME)) throw new Error(`Chrome 不在 ${CHROME}，可用 CHROME_PATH 指定`);
  const { server, port } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--use-angle=d3d11',
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization',
      '--enable-unsafe-swiftshader',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--font-render-hinting=none',
    ],
    defaultViewport: {
      width: o.width || 1920,
      height: o.height || 1080,
      deviceScaleFactor: 1,
    },
  });
  const page = await browser.newPage();
  const logs = [];
  page.on('pageerror', (e) => {
    logs.push('[pageerror] ' + e.message);
    if (o.verbose) console.log('[pageerror]', e.message.slice(0, 300));
  });
  page.on('console', (m) => {
    if (m.type() === 'error') {
      logs.push('[console.error] ' + m.text());
      if (o.verbose) console.log('[console.error]', m.text().slice(0, 300));
    }
  });

  const q = o.query ? '?' + o.query : '';
  await page.goto(`http://127.0.0.1:${port}/${o.page || 'index.html'}${q}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await page.waitForFunction('window.__ready === true', { timeout: 180000, polling: 120 });

  return {
    page, browser, port,
    logs,
    async close() {
      try { await browser.close(); } catch (_) {}
      try { server.close(); } catch (_) {}
    },
  };
}

/** 页面内导出当前帧为 PNG（比 CDP 截图快 1.7~2.6 倍，且不受合成时机影响） */
export async function grabPNG(page, t) {
  const dataUrl = await page.evaluate(async (tt) => await window.grabFrame(tt), t);
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

/** 逐帧导出用：JPEG（体积是 PNG 的 1/8） */
export async function grabJpeg(page, t) {
  const dataUrl = await page.evaluate(async (tt) => await window.grabFrameJpeg(tt), t);
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
  return p;
}

/** 解析 --key value 形式的参数 */
export function parseArgs(argv) {
  return Object.fromEntries(
    argv.slice(2).reduce((a, x, i, arr) => {
      if (x.startsWith('--')) {
        a.push([x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
      }
      return a;
    }, [])
  );
}
