/* spike.js — 性能可行性验证
 * 目的：在本机（Windows + Chrome headless + SwiftShader/D3D11）测出三个数字：
 *   1) 每帧从零重画一个水墨山水场景（~200 笔 brush）需要多少 ms
 *   2) 静态层烘焙后，每帧 blit + 动态骑手需要多少 ms
 *   3) 单帧 PNG 截图耗时
 * 同时验证两个技术假设：
 *   H1: brush 可以重定向到 p5.Graphics(WEBGL) 做离屏烘焙
 *   H2: 参数化鹈鹕骑手（IK 腿）在纯 2D 路径下足够便宜
 */
(function () {
  const W = 1920, H = 1080;
  // 舞台：1000×1000 单位居中铺满高度 -> 1080px，两侧各溢出 420px
  const U = 1080 / 1000;              // unit -> px
  const OX = (W - 1000 * U) / 2;      // 舞台原点在屏幕上的 x = 420

  // ---------- 随机（可播种，保证纯函数） ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- 鹈鹕 + 自行车：参数化骨骼 ----------
  // 侧面视角。所有坐标以"后轮着地点"为原点、单位 = px（1080 基准）。
  // pose 只与 pedal 相位有关，所以换风格时动作天然连续。
  const RIG = {
    R: 33,               // 车轮半径
    wheelbase: 108,      // 轴距
    bbDrop: 8,           // 中轴低于轮心
    seatH: 74,           // 座管高度
    crank: 17,           // 曲柄长
  };

  // 两段式 IK：已知髋 H、脚踝 A、大腿 L1、小腿 L2，求膝 K（膝盖朝前）
  function ik(Hp, A, L1, L2, flip) {
    const dx = A[0] - Hp[0], dy = A[1] - Hp[1];
    let d = Math.hypot(dx, dy);
    d = Math.min(d, L1 + L2 - 0.01);
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const ux = dx / (d || 1), uy = dy / (d || 1);
    const mx = Hp[0] + ux * a, my = Hp[1] + uy * a;
    return [mx + uy * h * flip, my - ux * h * flip];
  }

  /** 由时间 t 算出整套骨架关键点。纯函数。 */
  function pose(t, opts = {}) {
    const bpm = 120, beat = 60 / bpm, bar = 4 * beat;
    // 脚踏一圈 = 两拍 = 1 秒 = 2*PI
    const phase = (t / (2 * beat)) * Math.PI * 2;
    const bob = Math.sin(phase * 2) * 2.2;          // 车身随踩踏轻微起伏
    const R = RIG.R, wb = RIG.wheelbase;
    const rear = [0, 0], front = [wb, 0];
    const bb = [(rear[0] + front[0]) / 2 - 6, R - RIG.bbDrop + bob * 0.3]; // 中轴
    const seat = [bb[0] - 16, bb[1] - RIG.seatH];
    const head = [front[0] - 26, R - 62 + bob * 0.5];                       // 车头上端
    const grip = [head[0] + 30, head[1] - 16 + bob * 0.5];                  // 车把

    // 曲柄两端
    const crankL = [bb[0] + Math.cos(phase) * RIG.crank, bb[1] + Math.sin(phase) * RIG.crank];
    const crankR = [bb[0] - Math.cos(phase) * RIG.crank, bb[1] - Math.sin(phase) * RIG.crank];

    // 鹈鹕：坐在座上，身体略前倾
    const hip = [seat[0] + 6, seat[1] - 4];
    const shoulder = [hip[0] + 40, hip[1] - 46];
    const neckBase = shoulder;
    const headC = [shoulder[0] + 26, shoulder[1] - 34];
    const beakBase = [headC[0] + 10, headC[1] + 3];
    const beakTip = [beakBase[0] + 62, beakBase[1] + 6];
    const pouch = [beakBase[0] + 34, beakBase[1] + 26];   // 喉囊底

    // 腿：髋 -> 踏板
    const kneeN = ik(hip, crankR, 46, 46, 1);
    const kneeF = ik(hip, crankL, 46, 46, 1);
    // 翅膀 -> 车把
    const wingElbow = [shoulder[0] - 6, shoulder[1] + 26];
    const wingTip = [grip[0] - 4, grip[1] - 2];

    return {
      phase, bob, R, rear, front, bb, seat, head, grip,
      crankL, crankR, hip, shoulder, neckBase, headC, beakBase, beakTip, pouch,
      kneeN, kneeF, wingElbow, wingTip,
      tail: [hip[0] - 30, hip[1] - 6],
    };
  }

  // 用纯 Canvas2D 画笔触（供 2D 层与骨骼示意使用）
  function drawRig2D(ctx, p, style = {}) {
    const ink = style.ink || '#1a1a1a';
    const lw = style.lw || 3;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ink;
    ctx.lineWidth = lw;

    // 轮
    for (const c of [p.rear, p.front]) {
      ctx.beginPath(); ctx.arc(c[0], c[1], p.R, 0, Math.PI * 2); ctx.stroke();
      // 辐条
      ctx.save(); ctx.lineWidth = lw * 0.35;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + p.phase * 0.5;
        ctx.beginPath(); ctx.moveTo(c[0], c[1]);
        ctx.lineTo(c[0] + Math.cos(a) * p.R, c[1] + Math.sin(a) * p.R); ctx.stroke();
      }
      ctx.restore();
    }
    // 车架
    const frame = [[p.rear, p.seat], [p.seat, p.bb], [p.bb, p.head], [p.head, p.seat], [p.head, p.front]];
    ctx.beginPath();
    for (const [a, b] of frame) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    ctx.stroke();
    // 车把 + 座
    ctx.beginPath();
    ctx.moveTo(p.head[0] - 4, p.head[1] - 6); ctx.lineTo(p.grip[0], p.grip[1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.seat[0] - 9, p.seat[1] - 2); ctx.lineTo(p.seat[0] + 9, p.seat[1] - 3);
    ctx.lineWidth = lw * 1.8; ctx.stroke(); ctx.lineWidth = lw;

    // 曲柄 + 踏板
    ctx.beginPath();
    ctx.moveTo(p.bb[0], p.bb[1]); ctx.lineTo(p.crankR[0], p.crankR[1]);
    ctx.moveTo(p.bb[0], p.bb[1]); ctx.lineTo(p.crankL[0], p.crankL[1]);
    ctx.lineWidth = lw * 0.9; ctx.stroke(); ctx.lineWidth = lw;

    // 腿（后腿深、前腿浅，避免糊成一团）
    const legStroke = (knee, foot, alpha) => {
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(p.hip[0], p.hip[1]); ctx.lineTo(knee[0], knee[1]); ctx.lineTo(foot[0], foot[1]);
      ctx.stroke(); ctx.restore();
    };
    legStroke(p.kneeN, p.crankR, 0.45);
    legStroke(p.kneeF, p.crankL, 0.95);

    // 蹬板
    for (const c of [p.crankL, p.crankR]) {
      ctx.save(); ctx.lineWidth = lw * 1.4;
      ctx.beginPath(); ctx.moveTo(c[0] - 6, c[1]); ctx.lineTo(c[0] + 6, c[1]); ctx.stroke(); ctx.restore();
    }

    // 鹈鹕身体
    ctx.beginPath();
    ctx.moveTo(p.hip[0] - 26, p.hip[1] - 8);
    ctx.quadraticCurveTo(p.hip[0] - 6, p.hip[1] - 34, p.shoulder[0] + 4, p.shoulder[1] + 2);
    ctx.quadraticCurveTo(p.shoulder[0] - 16, p.shoulder[1] + 26, p.hip[0] + 2, p.hip[1] + 6);
    ctx.quadraticCurveTo(p.hip[0] - 14, p.hip[1] + 10, p.hip[0] - 26, p.hip[1] - 8);
    ctx.closePath();
    ctx.stroke();

    // 尾
    ctx.beginPath();
    ctx.moveTo(p.hip[0] - 22, p.hip[1] - 10);
    ctx.lineTo(p.tail[0] - 10, p.tail[1] - 2);
    ctx.lineTo(p.hip[0] - 20, p.hip[1] + 2);
    ctx.stroke();

    // 脖子 + 头
    ctx.beginPath();
    ctx.moveTo(p.neckBase[0] - 2, p.neckBase[1] + 4);
    ctx.quadraticCurveTo(p.headC[0] - 22, p.headC[1] + 24, p.headC[0] - 4, p.headC[1] + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.headC[0], p.headC[1], 9, 0, Math.PI * 2); ctx.stroke();

    // 喙 + 喉囊（鹈鹕本体）
    ctx.beginPath();
    ctx.moveTo(p.beakBase[0], p.beakBase[1] - 3);
    ctx.lineTo(p.beakTip[0], p.beakTip[1] - 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.beakBase[0] + 4, p.beakBase[1] + 3);
    ctx.quadraticCurveTo(p.pouch[0], p.pouch[1] + 6, p.beakTip[0] - 4, p.beakTip[1] + 2);
    ctx.quadraticCurveTo(p.pouch[0] - 8, p.pouch[1] - 12, p.beakBase[0] + 4, p.beakBase[1] + 3);
    ctx.closePath();
    ctx.stroke();

    // 翅膀
    ctx.beginPath();
    ctx.moveTo(p.shoulder[0] - 4, p.shoulder[1] + 4);
    ctx.quadraticCurveTo(p.wingElbow[0] + 6, p.wingElbow[1], p.wingTip[0], p.wingTip[1]);
    ctx.stroke();

    ctx.restore();
  }

  // ---------- 水墨山水场景（用 brush 画，测性能用） ----------
  // 画在 1000×1000 单位空间里；调用方负责把坐标系映射好
  function inkLandscape(seed, t) {
    const rnd = mulberry32(seed);
    const N = (v) => Math.round(v * 100) / 100;

    // 远山：淡墨大块 + 飞白
    brush.set('inkDry', '#8a8578', 3.2);
    for (let k = 0; k < 3; k++) {
      const baseY = 300 + k * 70;
      const pts = [];
      for (let i = 0; i <= 26; i++) {
        const u = i / 26;
        const x = -120 + u * 1240;
        const y = baseY - Math.sin(u * Math.PI) * (150 - k * 34) - rnd() * 26;
        pts.push([N(x), N(y)]);
      }
      brush.spline(pts, 1);
    }

    // 主峰：浓墨侧锋（致敬《溪山行旅图》的巨碑式山体）
    brush.set('ink', '#2b2924', 5.5);
    const peak = [[300, 640], [352, 470], [400, 372], [452, 300], [500, 252], [548, 292], [598, 356], [650, 448], [700, 560]];
    brush.spline(peak.map(([x, y]) => [N(x), N(y)]), 1);

    // 皴法：垂直短笔触，模拟雨点皴 / 斧劈皴
    for (let k = 0; k < 90; k++) {
      const u = rnd();
      const x = 320 + u * 360;
      const topY = 260 + Math.abs(u - 0.5) * 620 + rnd() * 60;
      const len = 26 + rnd() * 66;
      const drift = (rnd() - 0.5) * 12;
      brush.set(rnd() > 0.6 ? 'inkDry' : 'ink', rnd() > 0.5 ? '#2b2924' : '#4a463e', 1.6 + rnd() * 2.4);
      brush.line(N(x), N(topY), N(x + drift), N(topY + len));
    }

    // 近景岩石
    brush.set('bristle', '#3a362e', 9);
    brush.fill('#4a463e', 120);
    brush.beginShape(0);
    [[60, 860], [150, 800], [260, 830], [320, 900], [300, 1000], [40, 1000]].forEach(([x, y]) => brush.vertex(x, y));
    brush.endShape(true);
    brush.noFill();

    // 树：松
    const tree = (x, y, s) => {
      brush.set('ink', '#2b2924', 2.2 * s);
      brush.line(x, y, x + 6 * s, y - 70 * s);
      for (let i = 0; i < 7; i++) {
        const yy = y - 16 - i * 9 * s;
        brush.set('inkDry', '#2b2924', 1.3 * s);
        brush.line(x + 5 * s, yy, x + (18 + rnd() * 12) * s, yy - (6 + rnd() * 8) * s);
        brush.line(x + 5 * s, yy, x - (10 + rnd() * 8) * s, yy - (4 + rnd() * 7) * s);
      }
    };
    tree(150, 850, 1.1);
    tree(228, 878, 0.85);

    // 路：横向长卷（一条淡墨双线，中间留白当路）
    brush.set('inkDry', '#6a6459', 2.4);
    brush.spline([[-140, 1002], [200, 996], [520, 1004], [860, 998], [1160, 1006]], 1);

    // 落款（示意）
    brush.set('ink', '#2b2924', 1.8);
    brush.line(880, 180, 880, 300);
    brush.line(880, 188, 918, 188);
  }

  // ---------- p5 生命周期 ----------
  let mode = 'A';           // A = 每帧全量重画, B = 烘焙 + blit
  let baked = null;         // p5.Graphics
  let l2 = null;            // 2D 图层
  const stats = { frames: [] };

  window.p5Ready = false;
  window.__ready = false;

  window.setup = function () {
    pixelDensity(1);
    createCanvas(W, H, WEBGL);
    noLoop();
    brush.scaleBrushes(5);
    brush.add('ink', { type: 'default', weight: 4, scatter: 0.08, sharpness: 1, grain: 20, opacity: 255, spacing: 0.05, pressure: [1, 1, 1], rotate: 'none', noise: 0.04 });
    brush.add('inkDry', { type: 'default', weight: 4, scatter: 0.5, sharpness: 0.7, grain: 12, opacity: 230, spacing: 0.06, pressure: [1, 1, 1], rotate: 'none', noise: 0.2 });
    brush.add('bristle', { type: 'default', weight: 18, scatter: 1.2, sharpness: 0.8, grain: 6, opacity: 235, spacing: 0.06, pressure: [0.7, 1, 0.6], rotate: 'natural', noise: 0.2 });
    l2 = createGraphics(W, H);
    l2.pixelDensity(1);
    window.p5Ready = true;
    window.__ready = true;
  };

  const clearBrushState = () => {
    brush.noFill(); brush.noHatch(); brush.noWash(); brush.noField(); brush.noClip();
    brush.noStroke();
  };

  /** 把 1000×1000 单位空间的坐标系推进屏幕坐标（左上原点） */
  function pushStage() {
    push();
    translate(-W / 2, -H / 2);   // WEBGL 中心原点 -> 左上原点
    translate(OX, 0);
    scale(U);
    // 之后 (0..1000, 0..1000) 就是单位空间
  }
  function popStage() { pop(); }

  // 图 1：纯 brush 全量重画
  function paintSceneFull(t) {
    background('#efe8d8');
    pushStage();
    inkLandscape(1337, t);
    popStage();
    // 骑手用 brush 也画一遍（真实场景里就是各风格自己的绘制函数）
    push();
    translate(-W / 2, -H / 2);
    translate(OX + 300, 830);
    const p = pose(t);
    // 直接用 canvas path 画（和 2D 层同款，保证两种模式成本可比）
    pop();
    flushBrush();
  }

  /** 强制 p5.brush 把队列里的笔触合成出来（画一条画布外的线触发） */
  function flushBrush() {
    brush.set('ink', '#efe8d8', 0.02);
    brush.line(-3000, -3000, -2999, -3000);
    brush.noStroke();
  }

  function bakeStatic(t) {
    const pg = createGraphics(W, H, WEBGL);
    pg.pixelDensity(1);
    pg.background('#efe8d8');
    brush.load(pg);
    pg.push();
    pg.translate(-W / 2, -H / 2);
    pg.translate(OX, 0);
    pg.scale(U);
    inkLandscape(1337, t);
    brush.load();
    pg.pop();
    return pg;
  }

  let warm = false;
  window.spikeFrame = async function (t, m) {
    mode = m || mode;
    if (!warm) { warm = true; await redraw(); }   // p5.brush 首帧会丢第一次 fill，先热身一帧

    if (mode === 'A') {
      await redraw();
    } else {
      await redraw();
    }
    return true;
  };

  window.draw = function () {
    const t = window.__T || 0;
    const t0 = performance.now();

    if (mode === 'A') {
      paintSceneFull(t);
      // 2D 层画骑手
      const p = pose(t);
      l2.clear();
      l2.push();
      l2.translate(OX + 300, 820);
      drawRig2D(l2.drawingContext, p, { lw: 2.6 });
      l2.pop();
      push();
      translate(-W / 2, -H / 2);
      image(l2, 0, 0, W, H);
      pop();
    } else {
      if (!baked) baked = bakeStatic(t);
      background('#efe8d8');
      push();
      translate(-W / 2, -H / 2);
      image(baked, 0, 0, W, H);
      const p = pose(t);
      l2.clear();
      l2.push();
      l2.translate(OX + 300, 820);
      drawRig2D(l2.drawingContext, p, { lw: 2.6 });
      l2.pop();
      image(l2, 0, 0, W, H);
      pop();
    }

    const t1 = performance.now();
    stats.frames.push(t1 - t0);
    window.__lastError = null;
  };

  window.spikeStats = function () {
    const f = stats.frames;
    if (!f.length) return { n: 0 };
    const sorted = [...f].sort((a, b) => a - b);
    return {
      n: f.length,
      mean: f.reduce((a, b) => a + b, 0) / f.length,
      p50: sorted[Math.floor(f.length * 0.5)],
      p95: sorted[Math.floor(f.length * 0.95)],
      max: sorted[f.length - 1],
      first: f[0],
      last: f[f.length - 1],
    };
  };
  window.spikeReset = function () { stats.frames = []; baked = null; };
  window.spikeSetMode = function (m) { mode = m; baked = null; stats.frames = []; };

  // 供 puppeteer 调用
  window.renderAt = async function (t) {
    window.__T = t;
    await redraw();
    return true;
  };
})();
