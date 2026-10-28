/* pelican.js — 鹈鹕造型绘制。
 *
 * 核心思路：身体 + 脖子 + 头 + 喙 用**一条连续闭合轮廓**画出来，而不是几个圆柱拼起来。
 * 拼贴会在脖子根、下巴、喙根留下无法消除的接缝，看起来像塑料模型。
 * 一条轮廓才像生物。
 *
 * 喉囊、翅膀、腿另外单独叠上去 —— 它们的边界本来就是清晰的（下颌线、羽缝、羽根）。
 *
 * 辨识度靠五个特征：
 *   1 超长喙（≈ 0.56 倍身长），浅黄，基部厚、末端一个小下钩
 *   2 大喉囊（深橙红），上沿严格贴下颌线，从喉部垂到底再收向喙尖
 *   3 短而粗的 S 形脖子 —— 脖子**不能**做长做粗，否则整只鸟看起来像蛇
 *   4 细腿：大腿是羽毛色、只有跗跖是橙色的
 *   5 圆胖身体，短楔尾
 *
 * 坐标系约定（喙的局部系）：
 *   a = 沿喙向前，b = 垂直喙（**正 = 下方**）。
 *   ⚠️ 早先把上下喙画反了（下喙在轴线上方），结果喙尖出现向上的钩、喉囊跑到上喙外面去。
 *   改的时候务必记住 b 正 = 下。
 */
(function () {
  const V = (window.V = window.V || {});
  const P = (V.pelican = {});

  // ---------- 曲线工具 ----------
  function curveThrough(ctx, pts, closed, tension) {
    const n = pts.length;
    if (n < 2) return;
    const t = tension == null ? 0.5 : tension;
    const get = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    ctx.moveTo(pts[0][0], pts[0][1]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const c1 = [p1[0] + ((p2[0] - p0[0]) * t) / 3, p1[1] + ((p2[1] - p0[1]) * t) / 3];
      const c2 = [p2[0] - ((p3[0] - p1[0]) * t) / 3, p2[1] - ((p3[1] - p1[1]) * t) / 3];
      ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]);
    }
    if (closed) ctx.closePath();
  }
  P.curveThrough = curveThrough;

  function ribbon(pts, widths) {
    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(pts.length - 1, i + 1)];
      let dx = next[0] - prev[0], dy = next[1] - prev[1];
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const w = widths[i] / 2;
      left.push([p[0] - dy * w, p[1] + dx * w]);
      right.push([p[0] + dy * w, p[1] - dx * w]);
    }
    return { left, right, poly: [...left, ...right.slice().reverse()] };
  }
  P.ribbon = ribbon;

  /**
   * 锥形胶囊：两点 + 两端直径，直接连成闭合多边形。
   * 腿不能用 ribbon + Catmull-Rom —— 3 个点做样条会把膝盖抹成一张弓。
   */
  function taper(ctx, a, b, w0, w1) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const ang = Math.atan2(ny, nx);
    ctx.beginPath();
    ctx.arc(a[0], a[1], w0 / 2, ang, ang + Math.PI);
    ctx.lineTo(b[0] - nx * (w1 / 2), b[1] - ny * (w1 / 2));
    ctx.arc(b[0], b[1], w1 / 2, ang + Math.PI, ang + Math.PI * 2);
    ctx.closePath();
  }
  P.taper = taper;

  // ---------- 几何 ----------

  /** 脖子前后两侧边界。路径向上时 +法线 = 前方 */
  function neckSides(p, w) {
    const pts = [p.neckRoot, p.n1, p.n2, p.headC];
    const widths = w || p.neckW || [32, 27, 23, 20];
    const front = [], back = [];
    for (let i = 0; i < pts.length; i++) {
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(pts.length - 1, i + 1)];
      let dx = next[0] - prev[0], dy = next[1] - prev[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      const nx = -dy, ny = dx;
      const h = widths[i] / 2;
      front.push([pts[i][0] + nx * h, pts[i][1] + ny * h]);
      back.push([pts[i][0] - nx * h, pts[i][1] - ny * h]);
    }
    return { front, back };
  }
  P.neckSides = neckSides;

  /** 喙的局部坐标系构造器 */
  function beakFrame(p) {
    const ba = p.beakAng;
    const baX = Math.cos(ba), baY = Math.sin(ba);
    const nX = -baY, nY = baX;                 // b 正 = 下
    const base = p.beakBase, L = p.beakLen, tip = p.beakTip;
    const B = (a, b) => [base[0] + baX * a + nX * b, base[1] + baY * a + nY * b];
    const hc = p.headC, hr = p.headR;
    const H = (a, b) => [hc[0] + baX * a + nX * b, hc[1] + baY * a + nY * b];
    return { ba, baX, baY, nX, nY, base, L, tip, hc, hr, B, H };
  }
  P.beakFrame = beakFrame;

  /**
   * 上喙脊线，**喙根 → 喙尖**。第一列一律是喙长的比例，不许写绝对值 ——
   * 早先这里写了一个 12，被乘上 beakLen 变成 1176，喙直接飞出画外。
   */
  const UPPER = [[-0.06, -15.5], [0.12, -14.6], [0.34, -11.6], [0.66, -8.6], [0.92, -5.6]];
  /** 下颌线，同样是**喙根 → 喙尖**。
   *  ⚠️ 顺序写反过一次，轮廓在喙部折返，喙尖被切成"黄色楔子 + 外面一片奶白透镜"两半。 */
  const LOWER = [[0.02, 9.0], [0.18, 7.0], [0.44, 6.2], [0.70, 5.2], [0.94, 3.6]];

  function upperPts(f) {
    return UPPER.map(([a, b]) => f.B(a * f.L, b));
  }
  function lowerPts(f) {
    return LOWER.map(([a, b]) => f.B(a * f.L, b));
  }
  /** 喙尖的两个点：tipA 在尖端下前方（形成小下钩），tipB 在尖端后上方 */
  function tipPts(f) {
    return [
      [f.tip[0] + f.baX * 2.6 + f.nX * 5.6, f.tip[1] + f.baY * 2.6 + f.nY * 5.6],
      [f.tip[0] - f.baX * 2.0 - f.nX * 1.6, f.tip[1] - f.baY * 2.0 - f.nY * 1.6],
    ];
  }

  /**
   * 整只鸟的连续轮廓（顺时针绕一圈）：
   *   尾 → 腹 → 胸 → 脖子前侧 ↑ → 下巴 → 下颌 → 喙尖（小下钩）→ 上喙
   *      → 额头 → 头顶 → 后脑 → 脖子后侧 ↓ → 背 → 尾根
   */
  function fullOutline(p) {
    const f = beakFrame(p);
    const ns = neckSides(p);
    const pts = [];

    // 尾不在这里 —— 尾是独立楔形（见 tailPath）。硬塞进样条会被抹圆成一个瘤。

    // 腹：尾根 → 胸前（body[10] → body[6]）
    for (let i = 10; i >= 6; i--) pts.push(p.body[i]);

    // 脖子前侧：从下往上 → 直接接下颌（不再插一个"下巴"点：
    // 脖子前缘本来就在头心前方，插了独立下巴点会让轮廓在那里折返成一个尖片）
    pts.push(ns.front[0], ns.front[1], ns.front[2], ns.front[3]);

    // 下颌（根→尖）→ 喙尖（小下钩）→ 上喙（尖→根）
    for (const q of lowerPts(f)) pts.push(q);
    const tp = tipPts(f);
    pts.push(tp[0], tp[1]);
    for (const q of upperPts(f).reverse()) pts.push(q);
    pts.push(f.H(f.hr * 0.64, -f.hr * 0.78));
    pts.push(f.H(f.hr * 0.02, -f.hr * 1.02));
    pts.push(f.H(-f.hr * 0.74, -f.hr * 0.64));
    // 不再画后脑最后那个点：它会把枕部顶出去，再接脖子就成了一个尖角

    // 脖子后侧：从上往下
    pts.push(ns.back[3], ns.back[2], ns.back[1], ns.back[0]);

    // 背：颈根 → 尾根（body[5] → body[0]）
    for (let i = 5; i >= 0; i--) pts.push(p.body[i]);
    return pts;
  }
  P.fullOutline = fullOutline;

  /** 喉囊：上沿严格贴下颌线，从喉部垂到底再收向喙尖 */
  function pouchPath(ctx, p) {
    const f = beakFrame(p);
    const d = p.pouchDrop, L = f.L;
    const jaw = lowerPts(f);                            // 根 → 尖
    const tipJaw = jaw[jaw.length - 1];
    ctx.beginPath();
    ctx.moveTo(jaw[0][0], jaw[0][1]);
    // 袋底：喉部 → 最深处（约 34% 处）→ 收向喙尖
    ctx.bezierCurveTo(...f.B(0.0, d * 0.70), ...f.B(L * 0.12, d * 1.02), ...f.B(L * 0.34, d));
    ctx.bezierCurveTo(...f.B(L * 0.64, d * 0.94), ...f.B(L * 0.88, d * 0.30), tipJaw[0], tipJaw[1]);
    // 沿下颌线收回喉部（与轮廓共用同一组点，保证两条线重合）
    curveThrough(ctx, jaw.slice().reverse(), false, 0.5);
    ctx.closePath();
  }
  P.pouchPath = pouchPath;

  /**
   * 尾：独立楔形，画在身体**之前**，让身体把它根部盖住。
   * 三个点、直边、硬角 —— 圆角一出现就变成瘤。
   */
  function tailPath(ctx, p) {
    ctx.beginPath();
    ctx.moveTo(p.tailA[0], p.tailA[1]);
    ctx.lineTo(p.tailB[0], p.tailB[1]);
    ctx.lineTo(p.tailC[0], p.tailC[1]);
    ctx.closePath();
  }
  P.tailPath = tailPath;

  /** 躯干局部坐标（u 沿脊椎向前，v 垂直脊椎，负 = 背侧） */
  function bodyFrame(p) {
    const a = p.torsoAng, ca = Math.cos(a), sa = Math.sin(a);
    return (u, v) => [p.hip[0] + ca * u - sa * v, p.hip[1] + sa * u + ca * v];
  }
  P.bodyFrame = bodyFrame;

  /**
   * 收在体侧的翅羽片。单靠那条伸向车把的"手臂"，鸟看起来像没有翅膀；
   * 补一片贴在胁部的羽毛，才有"翅膀被收起来了"的读感。
   */
  function foldedWingPts(p) {
    const BL = bodyFrame(p);
    // 开放曲线：只描边不填色。填了色的贴片在任何底色上都会像一张贴纸。
    return [BL(58, -20), BL(34, -42), BL(2, -40), BL(-24, -22), BL(-38, 2), BL(-24, 18)];
  }
  P.foldedWingPts = foldedWingPts;

  /** 翅膀：肩 → 车把。细、锥形、末端收尖；宽一点就变成船桨。 */
  function wingPts(p) {
    const wA = p.shoulder;
    const wD = [p.grip[0] - 1, p.grip[1] - 6];
    const dx = wD[0] - wA[0], dy = wD[1] - wA[1];
    const wl = Math.hypot(dx, dy) || 1;
    const px = -dy / wl, py = dx / wl;            // 路径左手侧 = 后下方
    const at = (f, k) => [wA[0] + dx * f + px * k, wA[1] + dy * f + py * k];
    const pts = [wA, at(0.34, -5), at(0.66, -2), at(0.86, 1), wD];
    const widths = [25, 20, 13, 8, 4];
    return { pts, widths, rib: ribbon(pts, widths), at, dx, dy, wl, px, py };
  }
  P.wingPts = wingPts;

  P.defaultStyle = {
    body: '#f7f2e6',
    bodyShade: '#ddd2bc',
    line: '#2a2622',
    beak: '#f4bd58',
    beakDark: '#c9902f',
    pouch: '#d4672e',
    pouchShade: '#ad4d1c',
    leg: '#d98a2b',
    eye: '#2a2622',
    lw: 2.6,
    feather: 0.5,
    eyeStyle: 'default',
    fillBody: true,
  };

  /**
   * 画鹈鹕。
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} p   V.rig.pose()
   * @param {object} st  风格参数
   * @param {number} t   时间（眨眼）
   */
  P.draw = function (ctx, p, st, t) {
    const s = Object.assign({}, P.defaultStyle, st || {});
    const lw = s.lw;
    const f = beakFrame(p);
    const hc = p.headC, hr = p.headR;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 远端腿（最底）
    drawLeg(ctx, p.legRoot || p.hip, p.kneeR, p.ankleR, s, 0.34);

    // 近端大腿：画在身体**之前**，让肚子把它的根部盖住，
    // 否则大腿根那一圈描边会横跨肚皮，看起来像贴上去的一根香肠。
    drawThigh(ctx, p.legRoot || p.hip, p.kneeL, s, 1);

    // 尾（在身体之前，让身体把根部盖住）
    tailPath(ctx, p);
    if (s.fillBody) {
      ctx.fillStyle = V.mixHex(s.body, s.bodyShade, 0.32);
      ctx.fill();
    }
    ctx.strokeStyle = s.line;
    ctx.lineWidth = lw * 0.85;
    ctx.stroke();

    // ===== 躯干 + 脖子 + 头 + 喙：一条连续轮廓 =====
    const outline = fullOutline(p);
    ctx.beginPath();
    curveThrough(ctx, outline, true, 0.52);
    if (s.fillBody) {
      const bg = ctx.createLinearGradient(hc[0] + 60, hc[1] - hr * 2, p.hip[0], p.hip[1] + 52);
      bg.addColorStop(0, s.body);
      bg.addColorStop(1, V.mixHex(s.body, s.bodyShade, 0.5));
      ctx.fillStyle = bg;
      ctx.fill();
    }
    ctx.strokeStyle = s.line;
    ctx.lineWidth = lw;
    ctx.stroke();

    // ===== 喙：一整块楔形，上脊 + 喙尖 + 下颌连成闭合环 =====
    // ⚠️ 不能把两次 curveThrough 串在同一个 path 里 —— 它内部有 moveTo，会开新子路径，
    // 填色时变成两条细缝，喙就没有黄色了。必须一次给完整点列。
    if (s.fillBody) {
      const tp = tipPts(f);
      ctx.beginPath();
      curveThrough(ctx, upperPts(f).concat([tp[1], tp[0]], lowerPts(f).slice().reverse()), true, 0.5);
      ctx.fillStyle = s.beak;
      ctx.fill();
    }

    // 腹部阴影（裁在轮廓里）
    if (s.fillBody && s.feather > 0.01) {
      ctx.save();
      ctx.beginPath();
      curveThrough(ctx, outline, true, 0.52);
      ctx.clip();
      ctx.fillStyle = V.rgba(s.bodyShade, 0.62);
      ctx.beginPath();
      ctx.ellipse(p.hip[0] + 56, p.hip[1] + 34, 70, 27, p.torsoAng, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ===== 喉囊 =====
    pouchPath(ctx, p);
    if (s.fillBody) {
      const pg = ctx.createLinearGradient(
        f.base[0] + f.baX * 10, f.base[1] + f.baY * 10 - 10,
        f.base[0] + f.baX * 40, f.base[1] + p.pouchDrop + 8
      );
      pg.addColorStop(0, s.pouch);
      pg.addColorStop(1, s.pouchShade);
      ctx.fillStyle = pg;
      ctx.fill();
    }
    ctx.strokeStyle = s.line;
    ctx.lineWidth = lw * 0.9;
    ctx.stroke();

    // 喙中线：让它看起来是扁的、有厚度
    ctx.beginPath();
    ctx.moveTo(f.base[0] + f.baX * 16 + f.nX * -9, f.base[1] + f.baY * 16 + f.nY * -9);
    ctx.quadraticCurveTo(
      f.base[0] + f.baX * f.L * 0.6 + f.nX * -7.5,
      f.base[1] + f.baY * f.L * 0.6 + f.nY * -7.5,
      f.tip[0] - f.baX * 9 - f.nX * 5, f.tip[1] - f.baY * 9 - f.nY * 5
    );
    ctx.strokeStyle = V.rgba(s.beakDark, 0.5);
    ctx.lineWidth = lw * 0.42;
    ctx.stroke();

    // ===== 翅羽分界线（收在体侧的一道线，不填色）=====
    ctx.beginPath();
    curveThrough(ctx, foldedWingPts(p), false, 0.5);
    ctx.strokeStyle = V.rgba(s.line, 0.62);
    ctx.lineWidth = lw * 0.62;
    ctx.stroke();

    // ===== 翅膀（伸向车把）=====
    const wg = wingPts(p);
    ctx.beginPath();
    curveThrough(ctx, wg.rib.poly, true, 0.5);
    if (s.fillBody) {
      ctx.fillStyle = V.mixHex(s.body, s.bodyShade, 0.5);
      ctx.fill();
    }
    ctx.strokeStyle = s.line;
    ctx.lineWidth = lw * 0.85;
    ctx.stroke();
    // 三道初级飞羽：贴着翼尖往后扇开
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const k0 = wg.at(0.78 + i * 0.06, -1 + i * 1.5);
      const k1 = wg.at(0.52 + i * 0.04, 9 + i * 3);
      ctx.moveTo(k0[0], k0[1]);
      ctx.quadraticCurveTo(
        (k0[0] + k1[0]) / 2 + wg.px * 3, (k0[1] + k1[1]) / 2 + wg.py * 3,
        k1[0], k1[1]
      );
    }
    ctx.strokeStyle = V.rgba(s.line, 0.4);
    ctx.lineWidth = lw * 0.5;
    ctx.stroke();

    // ===== 眼 =====
    const eyePos = [
      hc[0] + f.baX * hr * 0.16 + f.nX * -hr * 0.70,
      hc[1] + f.baY * hr * 0.16 + f.nY * -hr * 0.70,
    ];
    const er = hr * 0.27;
    const blink = (t != null && t % 4.3 < 0.09) ? 0.1 : 1;
    if (s.eyeStyle === 'roll') {
      ctx.beginPath();
      ctx.arc(eyePos[0], eyePos[1], er * 1.55, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = s.line; ctx.lineWidth = lw * 0.65; ctx.stroke();
      ctx.beginPath();
      ctx.arc(eyePos[0] + er * 0.1, eyePos[1] - er * 0.95, er * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = s.eye; ctx.fill();
    } else if (s.eyeStyle === 'dot') {
      ctx.beginPath();
      ctx.arc(eyePos[0], eyePos[1], er * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = s.eye; ctx.fill();
    } else if (s.eyeStyle === 'hollow') {
      ctx.beginPath();
      ctx.arc(eyePos[0], eyePos[1], er * 1.15, 0, Math.PI * 2);
      ctx.strokeStyle = s.line; ctx.lineWidth = lw * 0.85; ctx.stroke();
    } else {
      // 默认眼：小珠子，不是大眼白。
      // 之前 sclera 半径 er*1.15、瞳孔 er*0.55 —— 眼白直径到了头径的 63%，
      // 中景一看就是"贴了假眼"。缩到 er*0.85，瞳孔放大到 er*0.5，再加一点高光。
      ctx.beginPath();
      ctx.ellipse(eyePos[0], eyePos[1], er * 0.85, er * 0.85 * blink, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = s.line; ctx.lineWidth = lw * 0.55; ctx.stroke();
      if (blink > 0.3) {
        ctx.beginPath();
        ctx.arc(eyePos[0] + er * 0.12, eyePos[1] + er * 0.10, er * 0.50, 0, Math.PI * 2);
        ctx.fillStyle = s.eye; ctx.fill();
        ctx.beginPath();
        ctx.arc(eyePos[0] - er * 0.10, eyePos[1] - er * 0.22, er * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
      }
    }

    // 近端跗跖 + 蹼足（最上）
    drawShank(ctx, p.kneeL, p.ankleL, s, 1);

    ctx.restore();
  };

  function drawThigh(ctx, root, knee, s, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    // 大腿：羽毛色 —— 画成橙色会像一条木头假腿
    taper(ctx, root, knee, 21, 13);
    ctx.fillStyle = alpha > 0.5 ? V.mixHex(s.body, s.bodyShade, 0.22) : s.body;
    ctx.fill();
    ctx.strokeStyle = s.line;
    ctx.lineWidth = s.lw * 0.7;
    ctx.stroke();
    ctx.restore();
  }

  function drawShank(ctx, knee, ankle, s, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    // 跗跖：细，橙色
    taper(ctx, knee, ankle, 9, 6.5);
    ctx.fillStyle = s.leg; ctx.fill();
    ctx.strokeStyle = s.line; ctx.lineWidth = s.lw * 0.7; ctx.stroke();
    // 膝
    ctx.beginPath();
    ctx.arc(knee[0], knee[1], 6.6, 0, Math.PI * 2);
    ctx.fillStyle = s.leg; ctx.fill();
    ctx.strokeStyle = s.line; ctx.lineWidth = s.lw * 0.55; ctx.stroke();
    // 蹼足
    ctx.beginPath();
    ctx.moveTo(ankle[0] - 3, ankle[1] - 4.5);
    ctx.lineTo(ankle[0] + 17, ankle[1] - 2);
    ctx.lineTo(ankle[0] + 14, ankle[1] + 5);
    ctx.lineTo(ankle[0] - 3, ankle[1] + 4);
    ctx.closePath();
    ctx.fillStyle = s.leg; ctx.fill();
    ctx.strokeStyle = s.line; ctx.lineWidth = s.lw * 0.5; ctx.stroke();
    ctx.restore();
  }

  function drawLeg(ctx, root, knee, ankle, s, alpha) {
    drawThigh(ctx, root, knee, s, alpha);
    drawShank(ctx, knee, ankle, s, alpha);
  }

  /** 剪影（影子版块、展墙缩略图用） */
  P.silhouette = function (ctx, p, color) {
    const col = color || '#000';
    ctx.save();
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    curveThrough(ctx, fullOutline(p), true, 0.52);
    ctx.fill();
    pouchPath(ctx, p);
    ctx.fill();

    const wg = wingPts(p);
    ctx.beginPath();
    curveThrough(ctx, wg.rib.poly, true, 0.5);
    ctx.fill();

    for (const [k, a] of [[p.kneeL, p.ankleL], [p.kneeR, p.ankleR]]) {
      taper(ctx, p.legRoot || p.hip, k, 19, 12);
      ctx.fill();
      taper(ctx, k, a, 8, 6);
      ctx.fill();
    }
    // 尾
    tailPath(ctx, p);
    ctx.fill();
    ctx.restore();
  };
})();
