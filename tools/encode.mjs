// tools/encode.mjs — 帧序列 + 音轨 → MP4（H.264 / yuv420p / faststart）
//
//   node tools/encode.mjs                             frames/ + audio/score.wav → out/pelican.mp4
//   node tools/encode.mjs --fps 30 --every 2          从 60fps 帧抽一半出 30fps 草稿
//   node tools/encode.mjs --no-audio                  只出画面（音乐还没做好时）
//   node tools/encode.mjs --from 0 --to 12 --out out/rough.mp4    阶段粗剪
//
// 参数选择：
//   crf 18 + preset slow：接近视觉无损，线稿/网点这类高频内容不会糊
//   yuv420p：QuickTime / 微信 / 各平台播放器都吃得下
//   faststart：moov 前置，网页里能边下边播
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, ensureDir, parseArgs } from './_browser.mjs';

const args = parseArgs(process.argv);
const fps = Number(args.fps || 30);
const crf = String(args.crf || 18);
const preset = String(args.preset || 'slow');
const framesDir = path.resolve(ROOT, String(args.frames || 'frames'));
const audio = args.audio && args.audio !== true
  ? path.resolve(ROOT, String(args.audio))
  : path.resolve(ROOT, 'audio', 'score.wav');
const outFile = path.resolve(ROOT, String(args.out || 'out/pelican.mp4'));
const from = Number(args.from ?? 0);
const to = args.to && args.to !== true ? Number(args.to) : null;
// every=N：帧序列本身是输出帧率的 N 倍（60fps 帧 → 30fps 成片就写 --every 2）
const every = Math.max(1, Math.round(Number(args.every || 1)));
const srcFps = fps * every;

if (!fs.existsSync(framesDir)) {
  console.error(`找不到帧目录 ${framesDir}，先跑 node tools/render.mjs`);
  process.exit(1);
}
const files = fs.readdirSync(framesDir).filter((f) => /^frame_\d+\.(png|jpg)$/.test(f)).sort();
if (!files.length) {
  console.error(`${framesDir} 里没有 frame_*.jpg`);
  process.exit(1);
}

// frame_000001.png → 帧号 → 时间；用它算区间，避免目录里有多段不相邻的帧
const numOf = (f) => Number(f.match(/(\d+)\.(png|jpg)$/)[1]);
const first = numOf(files[0]);
const last = numOf(files[files.length - 1]);
const skip = Math.round(from * srcFps) - first;
const srcAvail = last - first + 1 - Math.max(0, skip);
const count = to == null ? Math.floor(srcAvail / every) : Math.round((to - from) * fps);

ensureDir(path.dirname(outFile));
const hasAudio = !args['no-audio'] && fs.existsSync(audio);

const ffArgs = [
  '-y', '-hide_banner', '-loglevel', 'warning', '-stats',
  '-framerate', String(srcFps),
  '-start_number', String(first + Math.max(0, skip)),
  '-i', path.join(framesDir, 'frame_%0' + String(files[0].match(/(\d+)\.(png|jpg)$/)[1].length) + 'd.jpg'),
];
if (every > 1) {
  // 输入按 srcFps 排时间轴，选出每第 N 帧，再锁到目标帧率
  ffArgs.push('-vf', `select='not(mod(n\\,${every}))'`, '-fps_mode', 'cfr', '-r', String(fps));
}
if (hasAudio) {
  ffArgs.push('-ss', String(from), '-i', audio);
}
ffArgs.push(
  '-frames:v', String(Math.max(1, count)),
  '-c:v', 'libx264', '-preset', preset, '-crf', crf,
  '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
  '-movflags', '+faststart',
);
if (hasAudio) {
  ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
} else {
  ffArgs.push('-an');
}
ffArgs.push(outFile);

console.log(`ffmpeg  ${files.length} 帧 @${srcFps}fps → ${fps}fps${every > 1 ? `（每 ${every} 帧取 1）` : ''}  crf ${crf}  ${hasAudio ? '带音轨 ' + path.relative(ROOT, audio) : '无音轨'}`);
console.log(`        → ${path.relative(ROOT, outFile)}`);

const t0 = Date.now();
const p = spawn('ffmpeg', ffArgs, { stdio: ['ignore', 'inherit', 'inherit'] });
p.on('error', (e) => {
  console.error('起不了 ffmpeg：', e.message);
  process.exit(1);
});
p.on('close', (code) => {
  if (code !== 0) {
    console.error(`ffmpeg 退出码 ${code}`);
    process.exit(code);
  }
  const sz = fs.statSync(outFile).size;
  console.log(`完成  ${(sz / 1048576).toFixed(1)} MB  用时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);
});
