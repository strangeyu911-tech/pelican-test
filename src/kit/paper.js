/* paper.js — 底材纹理：宣纸、岩壁、拓片、绢本、屏幕。
 *
 * 纹理只在烘焙阶段生成一次（约 40ms/张 @1920×1080），之后每帧只 blit。
 * 全部用可播种随机，同一个 seed 永远同一张纸。
 */
(function () {
  const V = (window.V = window.V || {});
  const P = (V.paper = {});

  /** 分形 value noise：预生成 2^n 网格再双线性插值，比 perlin 快很多 */
  function noiseField(seed, gw, gh) {
    const rnd = V.rng(seed);
    const g = new Float32Array((gw + 1) * (gh + 1));
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    const at = (i, j) => g[(j % (gh + 1)) * (gw + 1) + (i % (gw + 1))];
    return function (x, y) {
      const fx = x * gw, fy = y * gh;
      const i = Math.floor(fx), j = Math.floor(fy);
      const tx = fx - i, ty = fy - j;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = V.lerp(at(i, j), at(i + 1, j), sx);
      const b = V.lerp(at(i, j + 1), at(i + 1, j + 1), sx);
      return V.lerp(a, b, sy);
    };
  }

  /** 多倍频叠加 */
  function fbm(seed, octaves) {
    const fields = [];
    for (let o = 0; o < octaves; o++) fields.push({ f: noiseField(seed + o * 977, 4 << o, 4 << o), w: 1 / (1 << o) });
    const tot = fields.reduce((s, x) => s + x.w, 0);
    return (x, y) => fields.reduce((s, x2) => s + x2.f(x, y) * x2.w, 0) / tot;
  }

  /** 预设底材 */
  P.PRESETS = {
    /** 宣纸：暖白、云斑、细纤维。水墨版块的底 */
    xuan: {
      base: '#efe8d8', amp: 13, fiber: 0.55, fiberColor: '#d8cdb5', cloud: 1.0, vignette: 0.1, grain: 3.2,
    },
    /** 米色稿纸（Intro / Outro 的档案纸） */
    archive: {
      base: '#e9e0cc', amp: 10, fiber: 0.4, fiberColor: '#d2c5aa', cloud: 0.8, vignette: 0.14, grain: 2.8,
    },
    /** 岩壁：赭石、粗糙、有颗粒 */
    rock: {
      base: '#c98b52', amp: 34, fiber: 0.1, fiberColor: '#8f5a2e', cloud: 1.4, vignette: 0.3, grain: 9,
    },
    /** 拓片：黑底，纸的纤维是灰白的 */
    rubbing: {
      base: '#1c1a17', amp: 20, fiber: 0.7, fiberColor: '#5a544a', cloud: 1.1, vignette: 0.22, grain: 5,
    },
    /** 绢本：暖黄、有经纬 */
    silk: {
      base: '#e6d9b8', amp: 8, fiber: 0.3, fiberColor: '#cbb98c', cloud: 0.7, vignette: 0.12, grain: 2.2, weave: true,
    },
    /** 埃及石灰岩墙面 */
    plaster: {
      base: '#d9c9a3', amp: 16, fiber: 0.2, fiberColor: '#bda87c', cloud: 1.2, vignette: 0.18, grain: 4.5,
    },
    /** 泛黄的老纸（浮世绘、细密画） */
    washi: {
      base: '#efe3c8', amp: 11, fiber: 0.6, fiberColor: '#d9c9a4', cloud: 0.9, vignette: 0.1, grain: 3,
    },
  };

  /**
   * 在给定的 2D context 上生成底材。
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w 像素宽
   * @param {number} h 像素高
   * @param {object|string} preset 预设名或自定义参数
   * @param {number} seed
   */
  P.paint = function (ctx, w, h, preset, seed) {
    const p = Object.assign({}, P.PRESETS[preset] || P.PRESETS.xuan, typeof preset === 'object' ? preset : {});
    const sd = seed || 12345;
    const rnd = V.rng(sd);

    // 基底色
    const n0 = p.base.replace('#', '');
    const br = parseInt(n0.slice(0, 2), 16), bg = parseInt(n0.slice(2, 4), 16), bb = parseInt(n0.slice(4, 6), 16);

    const cloud = fbm(sd, 4);
    const mid = fbm(sd + 5000, 3);

    const img = ctx.createImageData(w, h);
    const d = img.data;
    const invW = 1 / w, invH = 1 / h;
    const cx = 0.5, cy = 0.5;

    for (let y = 0; y < h; y++) {
      const fy = y * invH;
      for (let x = 0; x < w; x++) {
        const fx = x * invW;
        // 云斑（大尺度）+ 中尺度起伏 + 细颗粒
        const c = cloud(fx, fy) - 0.5;
        const m = mid(fx, fy) - 0.5;
        const g = (rnd() - 0.5) * 0.6;
        let k = (c * 1.0 * p.cloud + m * 0.5) * p.amp + g * p.grain;

        // 暗角
        if (p.vignette > 0) {
          const dx = (fx - cx) * 2, dy = (fy - cy) * 2;
          const r2 = dx * dx + dy * dy;
          k -= r2 * p.vignette * 60;
        }

        const i = (y * w + x) * 4;
        d[i] = V.clamp(br + k, 0, 255);
        d[i + 1] = V.clamp(bg + k, 0, 255);
        d[i + 2] = V.clamp(bb + k * 0.92, 0, 255);
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // 纤维：短划 + 偶尔的深色小点
    const fiberN = Math.round((w * h) / 9000 * p.fiber);
    ctx.save();
    ctx.strokeStyle = p.fiberColor;
    ctx.lineCap = 'round';
    for (let i = 0; i < fiberN; i++) {
      const x = rnd() * w, y = rnd() * h;
      const len = 3 + rnd() * 16;
      const a = rnd() * Math.PI * 2;
      ctx.globalAlpha = 0.05 + rnd() * 0.16;
      ctx.lineWidth = 0.5 + rnd() * 0.9;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
    // 绢的经纬
    if (p.weave) {
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = p.fiberColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 4) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y < h; y += 4) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
    }
    // 几处霉斑/水渍，老纸的灵魂
    if (p.cloud > 0.6) {
      for (let i = 0; i < 5; i++) {
        const x = rnd() * w, y = rnd() * h, r = 40 + rnd() * 130;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, V.rgba(p.fiberColor, 0.05 + rnd() * 0.04));
        grd.addColorStop(1, V.rgba(p.fiberColor, 0));
        ctx.globalAlpha = 1;
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    return ctx;
  };

  /** 叠一层"毛玻璃尘埃"（用于画面整体统一） */
  P.dust = function (ctx, w, h, amount, seed) {
    const rnd = V.rng(seed || 7);
    const n = Math.round((w * h) / 12000 * (amount == null ? 1 : amount));
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = rnd() * w, y = rnd() * h;
      ctx.fillStyle = rnd() > 0.5 ? V.rgba('#ffffff', 0.03 + rnd() * 0.07) : V.rgba('#000000', 0.02 + rnd() * 0.06);
      ctx.beginPath();
      ctx.arc(x, y, 0.4 + rnd() * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  /** 边缘压暗（画框内侧的阴影，让画面"陷进去"） */
  P.innerShadow = function (ctx, w, h, strength, inset) {
    const s = strength == null ? 0.35 : strength;
    const ins = inset == null ? 60 : inset;
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, 0, ins);
    g.addColorStop(0, V.rgba('#000000', s));
    g.addColorStop(1, V.rgba('#000000', 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, ins);
    const g2 = ctx.createLinearGradient(0, h, 0, h - ins);
    g2.addColorStop(0, V.rgba('#000000', s));
    g2.addColorStop(1, V.rgba('#000000', 0));
    ctx.fillStyle = g2;
    ctx.fillRect(0, h - ins, w, ins);
    const g3 = ctx.createLinearGradient(0, 0, ins, 0);
    g3.addColorStop(0, V.rgba('#000000', s));
    g3.addColorStop(1, V.rgba('#000000', 0));
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, ins, h);
    const g4 = ctx.createLinearGradient(w, 0, w - ins, 0);
    g4.addColorStop(0, V.rgba('#000000', s));
    g4.addColorStop(1, V.rgba('#000000', 0));
    ctx.fillStyle = g4;
    ctx.fillRect(w - ins, 0, ins, h);
    ctx.restore();
  };

  /** CRT 扫描线（示波器 / 老屏幕） */
  P.scanlines = function (ctx, w, h, alpha, gap) {
    const g = gap || 4;
    ctx.save();
    ctx.fillStyle = V.rgba('#000000', alpha == null ? 0.18 : alpha);
    for (let y = 0; y < h; y += g) ctx.fillRect(0, y, w, g * 0.5);
    ctx.restore();
  };
})();
