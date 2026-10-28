/* frame.js — 坐标系统、镜头、缓动、可播种随机。
 *
 * 两套坐标系：
 *   1) 舞台坐标系（单位空间）：每个版块在 1000×1000 单位内作画。
 *      1 单位 = 1.08 px，1000 单位铺满 1080 高度。
 *      在屏幕上是 x∈[420,1500] 的正方形，两侧各 420px 是 over-scan 溢出区。
 *   2) 屏幕坐标系（像素）：左上原点，0..1920 × 0..1080。
 *
 * 进入/退出用 V.pushCam(cam) / V.popCam()。
 * 镜头作用在单位空间上：单位点 (u,v) -> 屏幕点 ((u-cx)*U*zoom + W/2, (v-cy)*U*zoom + H/2)
 */
(function () {
  const V = (window.V = window.V || {});

  // ---------- 基本常量 ----------
  V.W = 1920;
  V.H = 1080;
  V.STAGE = 1000;                 // 舞台边长（单位）
  V.U = V.H / V.STAGE;            // 1 单位 = 1.08 px
  V.OX = (V.W - V.STAGE * V.U) / 2;  // 舞台在屏幕上的左边 x = 420
  V.FPS = 30;

  /** 路面基准线（单位空间）。全片统一，这样穿画框时路面是接的。 */
  V.ROAD_Y = 838;
  /** 鹈鹕后轮着地点的默认 x（单位空间） */
  V.RIDER_X = 360;

  // ---------- 数学 ----------
  V.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  V.lerp = (a, b, t) => a + (b - a) * t;
  V.map = (x, a, b, c, d) => c + ((x - a) / (b - a)) * (d - c);
  V.smoothstep = (a, b, x) => { const t = V.clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  /** 以 0 为中心、range 内为 1 的钟形，用于"这一拍闪一下" */
  V.pulse = (t, center, width) => {
    const d = Math.abs(t - center) / width;
    return d >= 1 ? 0 : 1 - d * d;
  };

  // ---------- 缓动 ----------
  const E = (V.ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => t * (2 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutExpo: (t) =>
      t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    outBack: (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    outElastic: (t) => {
      if (t <= 0) return 0; if (t >= 1) return 1;
      const c = (2 * Math.PI) / 3;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1;
    },
    /** 快进慢停，转场推镜用 */
    outQuint: (t) => 1 - Math.pow(1 - t, 5),
  });

  // ---------- 可播种随机 ----------
  /** 同一个 seed 永远给同一串数，保证 renderAt(t) 是纯函数 */
  V.rng = function (seed) {
    let a = seed >>> 0;
    const f = function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.range = (lo, hi) => lo + f() * (hi - lo);
    f.int = (lo, hi) => Math.floor(lo + f() * (hi - lo + 1));
    f.pick = (arr) => arr[Math.floor(f() * arr.length)];
    f.sign = () => (f() < 0.5 ? -1 : 1);
    /** 近似正态，用于自然分布的抖动 */
    f.gauss = () => (f() + f() + f() + f() - 2) * 0.7;
    return f;
  };

  // ---------- 颜色 ----------
  V.rgba = function (hex, a) {
    const h = hex.replace('#', '');
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a == null ? 1 : a})`;
  };
  V.mixHex = function (h1, h2, t) {
    const p = (h) => { const n = h.replace('#', ''); return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)]; };
    const a = p(h1), b = p(h2);
    const c = a.map((x, i) => Math.round(V.lerp(x, b[i], t)));
    return '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');
  };
  /** 只改亮度，保持色相 */
  V.shade = function (hex, amount) {
    const n = hex.replace('#', '');
    const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
    const f = (x) => V.clamp(Math.round(x + amount * 255), 0, 255);
    return '#' + [f(r), f(g), f(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
  };

  // ---------- 镜头 ----------
  /** 默认镜头：正对舞台中心，1:1 */
  V.camDefault = function () {
    return { x: V.STAGE / 2, y: V.STAGE / 2, zoom: 1, rot: 0 };
  };

  /**
   * 进入镜头坐标系（Canvas2D 版）。之后直接在 1000×1000 单位空间里画。
   * 主绘图层是 2D graphics，原点在左上，所以先平移到屏幕中心。
   */
  V.enterCam = function (ctx, cam) {
    ctx.save();
    ctx.translate(V.W / 2, V.H / 2);
    ctx.scale(V.U * cam.zoom, V.U * cam.zoom);
    ctx.translate(-cam.x, -cam.y);
    if (cam.rot) ctx.rotate(cam.rot);
  };
  V.exitCam = function (ctx) { ctx.restore(); };

  /** 进入屏幕坐标系（左上原点，像素）。2D 层本来就以左上为原点，所以只是配对用的 */
  V.enterScreen = function (ctx) { ctx.save(); };
  V.exitScreen = function (ctx) { ctx.restore(); };

  /**
   * 进入镜头坐标系（p5 版）。只在主 WEBGL 画布上直接画时用。
   */
  V.pushCam = function (cam) {
    push();
    scale(V.U * cam.zoom);
    translate(-cam.x, -cam.y);
    if (cam.rot) rotate(cam.rot);
  };
  V.popCam = function () { pop(); };

  /** 进入屏幕坐标系（p5 版，左上原点） */
  V.pushScreen = function () {
    push();
    translate(-V.W / 2, -V.H / 2);
  };
  V.popScreen = function () { pop(); };

  /** 单位 -> 屏幕像素（用于在 2D 层上叠加，比如 HUD） */
  V.toScreen = function (u, v, cam) {
    return [
      (u - cam.x) * V.U * cam.zoom + V.W / 2,
      (v - cam.y) * V.U * cam.zoom + V.H / 2,
    ];
  };

  // ---------- 画框 ----------
  /**
   * 舞台的四边就是画框。返回四个角的单位坐标，供各版块按自己的材质画边框。
   * 转场时 frameInset 会向外扩张（>0 = 往外），p=0 时贴着舞台边缘。
   */
  V.stageRect = function () {
    return { x0: 0, y0: 0, x1: V.STAGE, y1: V.STAGE };
  };

  // ---------- 时间辅助 ----------
  /** 版块内三小节的进度：0 = 刚进场，1 = 该走了 */
  V.sectPhase = function (u, dur) { return V.clamp(u / dur); };
  /** 第 n 小节内的进度（n 从 0 起） */
  V.barPhase = function (u, n, bar) { return V.clamp((u - n * bar) / bar); };
  /** 在 [a,b] 秒内是否为 1，用于"到点才出现" */
  V.window = function (t, a, b) { return t >= a && t <= b ? 1 : 0; };
  /** 淡入淡出包络：a..b 淡入，c..d 淡出 */
  V.envelope = function (t, a, b, c, d) {
    if (t <= a || t >= d) return 0;
    if (t < b) return V.smoothstep(a, b, t);
    if (t <= c) return 1;
    return 1 - V.smoothstep(c, d, t);
  };
})();
