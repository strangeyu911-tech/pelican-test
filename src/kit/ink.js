/* kit/ink.js — 水墨画法共用零件。
 *
 * 03 汉画像石 / 04 唐白描 / 05 宋山水 / 06 清明上河图 / 09 八大山人 都要用。
 *
 * 为什么值得单独做一个模块：
 *   前一版宋山水直接用"随机撒一堆笔画"来凑皴法，结果永远像草 ——
 *   因为**纯随机会结块、会留空**，而真画的笔触是"有意图的密"。
 *   这里所有笔触都铺在**抖动网格**上（先均匀布点，再加随机偏移），
 *   密度是可控的，读起来才像笔，不像噪点。
 *
 * 另一个关键是**噪声**：墨色不匀靠 2D value noise 调制，
 * 不是靠几个大椭圆（那会变成一块块灰斑）。
 */
(function () {
  const V = (window.V = window.V || {});
  const K = (V.ink = {});

  // ============================================================
  // 噪声
  // ============================================================

  /** 2D value noise，返回 [0,1) 的连续函数 */
  K.noise = function (seed) {
    const rnd = V.rng(seed || 1);
    const N = 256;
    const tab = new Float32Array(N * N);
    for (let i = 0; i < tab.length; i++) tab[i] = rnd();
    const at = (x, y) => tab[((y & (N - 1)) * N) + (x & (N - 1))];
    const smooth = (t) => t * t * (3 - 2 * t);
    return function (x, y) {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const u = smooth(xf), v = smooth(yf);
      const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
      return V.lerp(V.lerp(a, b, u), V.lerp(c, d, u), v);
    };
  };

  /** 多倍频叠加：fbm(x, y, 3, 0.5) */
  K.fbm = function (noise, x, y, oct, gain) {
    let v = 0, amp = 1, sum = 0, f = 1;
    const g = gain == null ? 0.5 : gain;
    const o = oct || 3;
    for (let i = 0; i < o; i++) {
      v += noise(x * f, y * f) * amp;
      sum += amp;
      amp *= g;
      f *= 2;
    }
    return v / sum;
  };

  // ============================================================
  // 抖动网格：所有笔触的落点
  // ============================================================

  /** 在矩形里按抖动网格布点，返回 [{x,y}] */
  K.jitterGrid = function (x0, y0, x1, y1, stepX, stepY, rnd, jitter) {
    const j = jitter == null ? 0.42 : jitter;
    const out = [];
    const nx = Math.max(1, Math.round((x1 - x0) / stepX));
    const ny = Math.max(1, Math.round((y1 - y0) / stepY));
    const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        out.push([
          x0 + (ix + 0.5 + (rnd() - 0.5) * 2 * j) * dx,
          y0 + (iy + 0.5 + (rnd() - 0.5) * 2 * j) * dy,
        ]);
      }
    }
    return out;
  };

  /** 沿折线布点（苔点沿山脊用），spread 是垂直方向的散开量 */
  K.alongPath = function (pts, step, rnd, spread) {
    const out = [];
    let carry = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      if (len < 1e-3) continue;
      const n = Math.max(1, Math.round((len + carry) / step));
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const px = a[0] + dx * t + (rnd() - 0.5) * (spread || 0);
        const py = a[1] + dy * t + (rnd() - 0.5) * (spread || 0) * 0.6;
        out.push([px, py]);
      }
      carry = (len + carry) % step;
    }
    return out;
  };

  // ============================================================
  // 路径工具
  // ============================================================

  K.path = function (c, pts, close) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    if (close !== false) c.closePath();
  };

  /** 把后续绘制裁进多边形 */
  K.clipped = function (c, pts, fn) {
    c.save();
    K.path(c, pts);
    c.clip();
    fn(c);
    c.restore();
  };

  // ============================================================
  // 山石轮廓生成
  // ============================================================

  /**
   * 崖：平顶 + 顶边锯齿 + 两侧台阶式陡壁。
   * 宋人画的巨碑是"一块被劈开的石板"，不是馒头也不是金字塔。
   *
   * @param {object} o
   *   x0,x1    崖顶横范围
   *   yTop     崖顶基准高度
   *   yBot     崖脚
   *   jag      顶边锯齿幅度
   *   notch    0..1，顶边出现深凹的概率
   *   step     侧壁台阶数
   *   flare    崖脚外扩
   */
  K.cliff = function (o, rnd) {
    const { x0, x1, yTop, yBot, jag } = o;
    const notch = o.notch == null ? 0.22 : o.notch;
    const steps = o.step == null ? 4 : o.step;
    const flare = o.flare == null ? 52 : o.flare;
    const top = [];
    const n = o.n || 18;

    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = V.lerp(x0, x1, t);
      let y = yTop;
      // 缓坡：靠近两端微微下沉
      y += Math.pow(Math.abs(t - 0.5) * 2, 3) * jag * 1.4;
      // 锯齿：小起伏不断，偶尔来一处深凹
      if (i > 0 && i < n) {
        // 三级起伏：毛边 / 小缺口 / 偶尔一道大缺口。
        // 统一大小的三角齿会变成锯条。
        y += (rnd() - 0.45) * jag * 0.55;
        if (rnd() < 0.35) y += jag * rnd() * 0.6;
        if (rnd() < notch) y += jag * (1.2 + rnd() * 2.2);
      }
      top.push([x, y]);
    }

    // 侧壁：**不是**一条直边，而是从崖顶一路锯齿着落下去。
    // 直边是"贴纸感"的主要来源 —— 真崖的侧影每一段都不一样。
    const h = yBot - yTop;
    const segs = 12;
    const side = (xEdge, sign) => {
      const out = [];
      for (let i = 1; i <= segs; i++) {
        const f = i / (segs + 1);
        // 整体向外撇，同时每段左右错开
        const base = flare * Math.pow(f, 1.4);
        const jitter = (rnd() - 0.45) * flare * 0.55;
        out.push([xEdge + sign * (base + jitter), yTop + h * f]);
      }
      out.push([xEdge + sign * flare, yBot]);
      return out;
    };
    return top.concat(side(x1, 1), side(x0, -1).reverse());
  };

  // ============================================================
  // 墨法
  // ============================================================

  /**
   * 山体的墨色。
   *
   * 底：上浓下淡的渐变（交代形体）。
   * 面：**点厾**——抖动网格上铺上万个 1~3px 的小点，透明度由 fbm 给。
   *     这是把"墨的浓淡"做出来的唯一稳的办法：
   *     用过几个大椭圆，结果在画面上留下一个个看得见的灰斑/黑洞，像墨点洒了。
   *     小点在高密度下会自己平均成连续的调子，远看就是墨，近看是笔。
   */
  K.washMass = function (c, pts, o) {
    const opt = o || {};
    const nz = K.noise(opt.seed || 3);
    const bounds = K.bounds(pts);

    const g = c.createLinearGradient(0, bounds.y0, 0, bounds.y1);
    g.addColorStop(0, opt.top || 'rgba(30,27,22,0.97)');
    g.addColorStop(0.55, opt.mid || 'rgba(52,47,39,0.93)');
    g.addColorStop(1, opt.bot || 'rgba(112,104,89,0.45)');
    c.save();
    K.path(c, pts);
    c.fillStyle = g;
    c.fill();

    K.clipped(c, pts, (cc) => {
      const step = opt.step || 6;
      const grid = K.jitterGrid(bounds.x0, bounds.y0, bounds.x1, bounds.y1, step, step, V.rng(opt.seed || 3), 0.55);
      cc.save();
      const dark = opt.dark || '#070605';
      const pale = opt.pale || '#b3a992';
      for (const pt of grid) {
        const x = pt[0], y = pt[1];
        const n = K.fbm(nz, x * 0.0045, y * 0.0045, 3, 0.55);
        const d = (n - 0.5) * (opt.strength == null ? 1.1 : opt.strength);
        if (d > 0) {
          cc.globalAlpha = Math.min(0.55, d * 0.85);
          cc.fillStyle = dark;
        } else {
          cc.globalAlpha = Math.min(0.30, -d * 0.42);
          cc.fillStyle = pale;
        }
        const r = step * (0.16 + Math.abs(d) * 0.22);
        cc.fillRect(x - r, y - r, r * 2, r * 2);
      }
      cc.restore();
    });
    c.restore();
    return bounds;
  };

  /**
   * 皴：铺在抖动网格上的短笔，长度和透明度由噪声给。
   * 关键是**网格**，不是随机撒 —— 随机撒一定结块又留空，看着像草。
   *
   * @param {object} o
   *   x0,y0,x1,y1  范围
   *   step         格距（越小越密）
   *   len          笔长范围 [min,max]
   *   dir          整体方向：0=竖，0.5=斜，1=横（弧度系数）
   *   color, alpha
   */
  K.cun = function (c, pts, o) {
    const opt = o || {};
    const nz = K.noise(opt.seed || 7);
    const b = K.bounds(pts);
    const x0 = opt.x0 == null ? b.x0 : opt.x0;
    const x1 = opt.x1 == null ? b.x1 : opt.x1;
    const y0 = opt.y0 == null ? b.y0 : b.y0;
    const y1 = opt.y1 == null ? b.y1 : opt.y1;
    const step = opt.step || 9;
    const grid = K.jitterGrid(x0, y0, x1, y1, step, step * (opt.aspect || 1), V.rng(opt.seed || 7), 0.48);
    const dir = opt.dir == null ? 0 : opt.dir;     // 0 竖，PI/2 横
    const lenMin = (opt.len && opt.len[0]) || 9;
    const lenMax = (opt.len && opt.len[1]) || 30;

    c.save();
    if (pts) { K.path(c, pts); c.clip(); }
    c.strokeStyle = opt.color || '#0a0806';
    c.lineCap = 'round';
    for (const [x, y] of grid) {
      const n = K.fbm(nz, x * 0.011, y * 0.011, 2, 0.6);
      const a = (opt.alpha == null ? 0.4 : opt.alpha) * (0.18 + n * 0.95);
      if (a < 0.012) continue;
      const len = V.lerp(lenMin, lenMax, n);
      const ang = dir + (n - 0.5) * (opt.wobble == null ? 0.22 : opt.wobble);
      c.globalAlpha = a;
      c.lineWidth = (opt.thick == null ? 1.4 : opt.thick) * (0.6 + n * 0.9);
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.sin(ang) * len, y + Math.cos(ang) * len);
      c.stroke();
    }
    c.restore();
  };


  /**
   * 积墨边：沿轮廓在**内侧**压一道更深的墨。
   * 这是水墨最关键的一个特征 —— 墨在纸边上会积住，边一定比里面深。
   * 没有这一道，山体看起来就是一块贴纸。
   */
  K.edgeInk = function (c, pts, o) {
    const opt = o || {};
    const rnd = V.rng(opt.seed || 17);
    K.clipped(c, pts, (cc) => {
      cc.strokeStyle = opt.color || '#0a0806';
      cc.lineJoin = 'round';
      const base = opt.w == null ? 18 : opt.w;
      const a0 = opt.alpha == null ? 0.16 : opt.alpha;
      const passes = [[base, a0 * 0.9], [base * 0.55, a0 * 1.5], [base * 0.24, a0 * 2.0]];
      for (const ps of passes) {
        cc.globalAlpha = Math.min(0.75, ps[1]);
        cc.lineWidth = ps[0] * (0.75 + rnd() * 0.5);
        K.path(cc, pts);
        cc.stroke();
      }
    });
  };

  /** 渗墨：轮廓外侧一圈极淡的晕。让山"压在纸上"而不是"贴在纸上"。 */
  K.bleed = function (c, pts, o) {
    const opt = o || {};
    const rnd = V.rng(opt.seed || 19);
    const base = opt.w || 26;
    c.save();
    c.strokeStyle = opt.color || '#3a352c';
    c.lineJoin = 'round';
    for (const ps of [[base, 0.05], [base * 1.9, 0.028]]) {
      c.globalAlpha = ps[1];
      c.lineWidth = ps[0] * (0.8 + rnd() * 0.4);
      K.path(c, pts);
      c.stroke();
    }
    c.restore();
  };

  /**
   * 沿"流线"布皴：先定几条竖向流线，再在流线两侧撒笔。
   * 均匀网格的皴会像印刷网纹；真画的笔是顺着一道道石棱往下走的。
   */
  K.cunFlow = function (c, pts, o) {
    const opt = o || {};
    const b = K.bounds(pts);
    const rnd = V.rng(opt.seed || 23);
    const nz = K.noise((opt.seed || 23) + 7);
    const lines = opt.lines || 14;
    const yA = opt.yTop == null ? b.y0 : opt.yTop;
    const yB = opt.yBot == null ? b.y1 : opt.yBot;
    c.save();
    K.path(c, pts);
    c.clip();
    c.strokeStyle = opt.color || '#0a0806';
    c.lineCap = 'round';
    for (let i = 0; i < lines; i++) {
      const x0 = b.x0 + (b.x1 - b.x0) * ((i + 0.5) / lines + (rnd() - 0.5) * 0.05);
      const drift = (rnd() - 0.5) * 60;
      const n = Math.round((opt.per || 26) * (0.6 + rnd() * 0.8));
      for (let k = 0; k < n; k++) {
        const t = Math.pow(rnd(), 0.85);
        const y = V.lerp(yA, yB, t);
        const nn = nz(x0 * 0.01, y * 0.01);
        const x = x0 + drift * t + (nn - 0.5) * (opt.spread || 26);
        const n2 = nz(x * 0.02, y * 0.02);
        const len = opt.len ? V.lerp(opt.len[0], opt.len[1], n2) : 30 * n2;
        c.globalAlpha = (opt.alpha == null ? 0.34 : opt.alpha) * (0.2 + n2 * 0.9);
        c.lineWidth = (opt.thick == null ? 1.5 : opt.thick) * (0.5 + n2);
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + (opt.slant || 0) * len, y + len);
        c.stroke();
      }
    }
    c.restore();
  };


  /**
   * 分层罩染：一层一层把墨罩上去。
   *
   * 真画的山不是一个平涂的色块加一层纹理，而是十几遍淡墨叠出来的 ——
   * 每遍只盖住一部分，交界处自然出现深浅。这是"墨分五色"的做法。
   * 边缘要软：同一个形状画三遍，每遍略放大一圈、透明度降一档。
   */
  K.layerWash = function (c, pts, o) {
    const opt = o || {};
    const b = K.bounds(pts);
    const rnd = V.rng(opt.seed || 31);
    const n = opt.n || 18;
    const tone = opt.tone || '#4c463a';
    const baseA = opt.alpha == null ? 0.085 : opt.alpha;
    const bias = opt.bias == null ? 0.45 : opt.bias;
    c.save();
    K.path(c, pts);
    c.clip();
    for (let i = 0; i < n; i++) {
      const cx = b.x0 + (b.x1 - b.x0) * (0.02 + rnd() * 0.96);
      const cy = b.y0 + (b.y1 - b.y0) * (Math.pow(rnd(), 1 + bias * 2) * 0.94);
      const rw = (b.x1 - b.x0) * (0.08 + rnd() * 0.26);
      const ratio = 0.35 + rnd() * 0.55;
      const a = baseA * (0.45 + rnd() * 0.9);
      // 每层用 2~3 个错开的椭圆叠出来，形状才不规则；
      // 用径向渐变收边，边缘是软的 —— 多边形会留下折角，看着像揉皱的纸。
      const lobes = 2 + Math.floor(rnd() * 2);
      for (let q = 0; q < lobes; q++) {
        const ox = cx + (rnd() - 0.5) * rw * 0.7;
        const oy = cy + (rnd() - 0.5) * rw * ratio * 0.7;
        const rr = rw * (0.55 + rnd() * 0.6);
        c.save();
        c.translate(ox, oy);
        c.scale(1, ratio);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, rr);
        g.addColorStop(0, V.rgba(tone, a));
        g.addColorStop(0.55, V.rgba(tone, a * 0.55));
        g.addColorStop(1, V.rgba(tone, 0));
        c.fillStyle = g;
        c.beginPath();
        c.arc(0, 0, rr, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }
    c.restore();
  };

  /** 裂隙：几道短促、有角度、两端渐细的重墨。山石的结构靠它交代。 */
  K.crevice = function (c, pts, o) {
    const opt = o || {};
    const b = K.bounds(pts);
    const rnd = V.rng(opt.seed || 37);
    c.save();
    K.path(c, pts);
    c.clip();
    c.strokeStyle = opt.color || '#15120d';
    c.lineCap = 'round';
    for (let i = 0; i < (opt.n || 12); i++) {
      const x = b.x0 + (b.x1 - b.x0) * rnd();
      const y = b.y0 + (b.y1 - b.y0) * rnd() * 0.85;
      const len = (opt.len || 90) * (0.4 + rnd());
      const ang = (opt.ang == null ? 1.35 : opt.ang) + (rnd() - 0.5) * 0.5;
      const steps = 5;
      for (let k = 0; k < steps; k++) {
        const t0 = k / steps, t1 = (k + 1) / steps;
        // 两端细中间粗
        c.globalAlpha = (opt.alpha == null ? 0.5 : opt.alpha) * Math.sin(Math.PI * (t0 + t1) / 2) * 1.1;
        c.lineWidth = (opt.thick || 3) * Math.sin(Math.PI * (t0 + t1) / 2) + 0.4;
        c.beginPath();
        c.moveTo(x + Math.cos(ang) * len * t0, y + Math.sin(ang) * len * t0);
        c.lineTo(x + Math.cos(ang) * len * t1, y + Math.sin(ang) * len * t1);
        c.stroke();
      }
    }
    c.restore();
  };

  /** 苔点：沿折线（山脊）布，密处成团 */
  K.moss = function (c, pathPts, o) {
    const opt = o || {};
    const nz = K.noise(opt.seed || 11);
    const step = opt.step || 7;
    const pts = K.alongPath(pathPts, step, V.rng(opt.seed || 11), opt.spread || 6);
    c.save();
    if (opt.clipPts) { K.path(c, opt.clipPts); c.clip(); }
    c.fillStyle = opt.color || '#171310';
    for (const [x, y] of pts) {
      const n = K.fbm(nz, x * 0.02, y * 0.02, 2, 0.6);
      if (n < (opt.threshold == null ? 0.34 : opt.threshold)) continue;
      const r = (opt.r == null ? 2.2 : opt.r) * (0.55 + n);
      c.globalAlpha = (opt.alpha == null ? 0.8 : opt.alpha) * (0.35 + n * 0.8);
      c.beginPath();
      c.ellipse(x, y + n * (opt.drop || 0), r, r * (0.6 + n * 0.6), n * 3, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  };

  /**
   * 山脚淡出：在**轮廓内部**用纸色渐变抹掉，不留边。
   * 这比"盖一条雾带"干净得多 —— 盖一条一定留下一条看得见的边界。
   */
  K.fadeBase = function (c, pts, paper, y0, y1, strength) {
    const b = K.bounds(pts);
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, V.rgba(paper, 0));
    g.addColorStop(0.5, V.rgba(paper, (strength == null ? 0.6 : strength) * 0.62));
    g.addColorStop(1, V.rgba(paper, 1));
    K.clipped(c, pts, (cc) => {
      cc.fillStyle = g;
      cc.fillRect(b.x0 - 10, y0, b.x1 - b.x0 + 20, Math.max(b.y1 - y0, 1));
      // 渐变结束之后一律实纸色
      cc.fillStyle = V.rgba(paper, 1);
      cc.fillRect(b.x0 - 10, y1, b.x1 - b.x0 + 20, Math.max(0, b.y1 - y1) + 40);
    });
  };

  /** 极软的一团雾（径向，无边） */
  K.haze = function (c, cx, cy, rx, ry, paper, alpha) {
    c.save();
    c.translate(cx, cy);
    c.scale(rx / 600, ry / 600);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 600);
    g.addColorStop(0, V.rgba(paper, alpha));
    g.addColorStop(0.55, V.rgba(paper, alpha * 0.5));
    g.addColorStop(1, V.rgba(paper, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, 600, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };

  /** 轮廓线：带手抖的折线 */
  K.contour = function (c, pts, o) {
    const opt = o || {};
    const rnd = V.rng(opt.seed || 5);
    c.save();
    c.strokeStyle = opt.color || '#141109';
    c.lineWidth = opt.w || 2;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const jx = (rnd() - 0.5) * (opt.jitter == null ? 2.2 : opt.jitter);
      const jy = (rnd() - 0.5) * (opt.jitter == null ? 2.2 : opt.jitter);
      if (i === 0) c.moveTo(pts[i][0] + jx, pts[i][1] + jy);
      else c.lineTo(pts[i][0] + jx, pts[i][1] + jy);
    }
    c.stroke();
    c.restore();
  };

  /** 包围盒 */
  K.bounds = function (pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
    return { x0, y0, x1, y1 };
  };
})();
