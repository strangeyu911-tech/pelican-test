/* scenes/egypt.js — 02 埃及墓室壁画（12 – 18 s，3 小节）
 *
 * 时代规矩：一条地平线、上下分横带（register）、人物严格侧面、重要的人画得更大、
 * 底色上还留着匠人打的红网格、最上面一条"凯克"装饰带。
 *
 * 梗：**埃及壁画里没有辐条**。轮子在这套画法里只能画成一个实心圆盘 ——
 *     于是它蹬得越使劲，轮子越看不出来在转，整辆车像在石板上滑。
 *     第 2 小节它低头看了一眼自己的轮子，还在蹬。
 *
 *   ① 0 – 2   横带立起来，象形文字列浮出，骑手从左外进入
 *   ② 2 – 4   低头看轮子（headTilt 压下去），轮子依然是两个实心盘
 *   ③ 4 – 6   抬头，继续滑向右边
 *
 * 版式（从上到下）：
 *   凯克装饰带 / 双线 / 上横带（竖排象形文字列 + 王名圈）/ 粗分隔线 /
 *   主横带（场景：地平线 + 鹈鹕 + 供桌）/ 双线 / 下横带（另一些符号）
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;

  const PLASTER = '#d9c9a3';
  const INK = '#20180f';
  const RED = '#9c3f26';
  const YELLOW = '#c08a3a';
  const BLUE = '#3f6d84';
  const GREEN = '#4a7a5c';
  const WHITE = '#f2e9d4';

  // ---------------------------------------------------------------
  // 象形文字：能认出来的十来个符号，够读成"这是埃及"就够
  // ---------------------------------------------------------------
  function gAnkh(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.16; c.lineCap = 'round';
    c.beginPath(); c.ellipse(x, y - s * 0.62, s * 0.24, s * 0.30, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(x, y - s * 0.30); c.lineTo(x, y + s * 0.86); c.stroke();
    c.beginPath(); c.moveTo(x - s * 0.42, y + s * 0.06); c.lineTo(x + s * 0.42, y + s * 0.06); c.stroke();
  }
  function gEye(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.13; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - s * 0.72, y);
    c.quadraticCurveTo(x, y - s * 0.54, x + s * 0.72, y);
    c.quadraticCurveTo(x, y + s * 0.46, x - s * 0.72, y);
    c.stroke();
    c.fillStyle = col;
    c.beginPath(); c.arc(x, y, s * 0.17, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(x - s * 0.1, y + s * 0.3); c.lineTo(x - s * 0.34, y + s * 0.78); c.stroke();
  }
  function gWater(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.13; c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < 4; i++) c.lineTo(x - s * 0.7 + i * s * 0.46, y + (i % 2 ? s * 0.16 : -s * 0.16));
    c.stroke();
  }
  function gLoaf(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath(); c.arc(x, y + s * 0.24, s * 0.46, Math.PI, 0); c.closePath(); c.fill();
  }
  function gReed(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.15; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y + s * 0.86);
    c.quadraticCurveTo(x + s * 0.34, y, x - s * 0.02, y - s * 0.86);
    c.stroke();
  }
  function gBird(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath(); c.ellipse(x, y + s * 0.12, s * 0.44, s * 0.26, -0.16, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x + s * 0.44, y - s * 0.18, s * 0.15, 0, Math.PI * 2); c.fill();
    c.strokeStyle = col; c.lineWidth = s * 0.1;
    c.beginPath(); c.moveTo(x + s * 0.58, y - s * 0.20); c.lineTo(x + s * 0.86, y - s * 0.06); c.stroke();
    c.beginPath(); c.moveTo(x - s * 0.02, y + s * 0.36); c.lineTo(x - s * 0.02, y + s * 0.82); c.stroke();
    c.beginPath(); c.moveTo(x + s * 0.2, y + s * 0.36); c.lineTo(x + s * 0.2, y + s * 0.82); c.stroke();
  }
  /** 太阳盘：一个实心圆 + 上下各一道横 */
  function gSun(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath(); c.arc(x, y, s * 0.34, 0, Math.PI * 2); c.fill();
    c.strokeStyle = col; c.lineWidth = s * 0.09;
    c.beginPath(); c.moveTo(x - s * 0.6, y); c.lineTo(x + s * 0.6, y); c.stroke();
  }
  /** 圣蛇（乌赖乌斯）：一条立起的蛇 + 兜帽 */
  function gCobra(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.16; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - s * 0.3, y + s * 0.8);
    c.quadraticCurveTo(x + s * 0.36, y + s * 0.3, x + s * 0.12, y - s * 0.2);
    c.stroke();
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(x + s * 0.1, y - s * 0.44, s * 0.26, s * 0.3, 0.2, 0, Math.PI * 2);
    c.fill();
  }
  /** 篮（nb）：半个椭圆 + 提手 */
  function gBasket(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.12;
    c.beginPath(); c.arc(x, y + s * 0.1, s * 0.42, 0, Math.PI); c.stroke();
    c.beginPath(); c.arc(x, y - s * 0.1, s * 0.22, Math.PI, 0); c.stroke();
  }
  /** 羽毛（maat）：一根带锯齿的竖羽 */
  function gFeather(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.1;
    c.beginPath();
    c.moveTo(x, y + s * 0.86);
    c.quadraticCurveTo(x + s * 0.26, y, x, y - s * 0.86);
    c.stroke();
    c.beginPath();
    c.moveTo(x, y + s * 0.86);
    c.quadraticCurveTo(x - s * 0.26, y, x, y - s * 0.86);
    c.stroke();
  }
  const GLYPHS = [gAnkh, gEye, gWater, gLoaf, gReed, gBird, gSun, gCobra, gBasket, gFeather];

  // ---------------------------------------------------------------
  // 凯克装饰带：墓室墙顶那条像一束束纸草的边饰
  // ---------------------------------------------------------------
  function khekerBand(c, x0, x1, y, h, rnd) {
    const cols = [BLUE, GREEN, RED, YELLOW];
    const w = 34;
    for (let x = x0, i = 0; x < x1; i++, x += w) {
      const col = cols[i % cols.length];
      const hh = h * (0.86 + rnd() * 0.2);
      c.save();
      c.fillStyle = col;
      // 柱身
      c.fillRect(x + w * 0.28, y + hh * 0.34, w * 0.44, hh * 0.66);
      // 外扩的顶：像一束草捆
      c.beginPath();
      c.moveTo(x + w * 0.16, y + hh * 0.36);
      c.quadraticCurveTo(x + w * 0.5, y - hh * 0.12, x + w * 0.84, y + hh * 0.36);
      c.lineTo(x + w * 0.84, y + hh * 0.10);
      c.quadraticCurveTo(x + w * 0.5, y - hh * 0.34, x + w * 0.16, y + hh * 0.10);
      c.closePath();
      c.fill();
      // 柱身中间的深色线
      c.strokeStyle = 'rgba(32,24,15,0.42)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x + w * 0.5, y + hh * 0.42);
      c.lineTo(x + w * 0.5, y + hh * 0.96);
      c.stroke();
      c.restore();
    }
  }

  /** 竖排象形文字列：列与列之间有分隔线 */
  function glyphColumns(c, x0, x1, yTop, yBot, size, rnd, colPool) {
    const colW = size * 1.9;
    for (let x = x0; x < x1; x += colW) {
      // 分隔线
      c.save();
      c.strokeStyle = 'rgba(32,24,15,0.34)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(x - colW * 0.5, yTop);
      c.lineTo(x - colW * 0.5, yBot);
      c.stroke();
      c.restore();
      // 列里的符号
      // 偶尔断掉一两个（墙面有损伤），否则整面墙像壁纸
      let skip = 0;
      for (let y = yTop + size * 1.1; y < yBot - size * 0.6; y += size * 1.7) {
        if (skip > 0) { skip--; continue; }
        if (rnd() < 0.06) { skip = rnd.int(1, 3); continue; }
        const g = GLYPHS[rnd.int(0, GLYPHS.length - 1)];
        g(c, x, y, size * (0.70 + rnd() * 0.48), colPool[rnd.int(0, colPool.length - 1)]);
      }
    }
    // 右边界
    c.save();
    c.strokeStyle = 'rgba(32,24,15,0.34)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x1 - colW * 0.5, yTop);
    c.lineTo(x1 - colW * 0.5, yBot);
    c.stroke();
    c.restore();
  }

  /** 供桌：一张矮桌 + 莲花 + 面包 + 罐 */
  function offeringTable(c, x, y, s, rnd, mirror) {
    c.save();
    // 桌面
    c.fillStyle = RED;
    c.fillRect(x - s * 0.62, y - s * 0.06, s * 1.24, s * 0.10);
    // 桌腿
    c.fillStyle = INK;
    c.fillRect(x - s * 0.44, y + s * 0.04, s * 0.08, s * 0.34);
    c.fillRect(x + s * 0.36, y + s * 0.04, s * 0.08, s * 0.34);
    // 桌上的东西：面包（半圆）+ 罐（带把）
    for (let i = 0; i < 3; i++) {
      const bx = x - s * 0.38 + i * s * 0.34;
      c.fillStyle = YELLOW;
      c.beginPath();
      c.arc(bx, y - s * 0.06, s * 0.14, Math.PI, 0);
      c.closePath();
      c.fill();
      c.strokeStyle = INK;
      c.lineWidth = 1.4;
      c.stroke();
    }
    // 莲花：一根茎 + 张开的花
    c.strokeStyle = GREEN;
    c.lineWidth = s * 0.05;
    c.beginPath();
    const mx = mirror ? -1 : 1;
    c.moveTo(x + mx * s * 0.66, y - s * 0.06);
    c.quadraticCurveTo(x + mx * s * 0.72, y - s * 0.34, x + mx * s * 0.6, y - s * 0.6);
    c.stroke();
    c.fillStyle = BLUE;
    c.beginPath();
    c.moveTo(x + mx * s * 0.6, y - s * 0.6);
    c.quadraticCurveTo(x + mx * s * 0.46, y - s * 0.76, x + mx * s * 0.52, y - s * 0.9);
    c.quadraticCurveTo(x + mx * s * 0.6, y - s * 0.78, x + mx * s * 0.7, y - s * 0.9);
    c.quadraticCurveTo(x + mx * s * 0.76, y - s * 0.76, x + mx * s * 0.6, y - s * 0.6);
    c.fill();
    c.restore();
  }

  /** 正面眼：画在侧脸的头上的那只"永远看着你"的眼睛 */
  function egyptEye(c, cx, cy, r, ang) {
    c.save();
    c.translate(cx, cy);
    c.rotate(ang || 0);
    // 眼形
    c.beginPath();
    c.moveTo(-r * 1.15, 0);
    c.quadraticCurveTo(0, -r * 0.86, r * 1.05, -r * 0.12);
    c.quadraticCurveTo(0, r * 0.72, -r * 1.15, 0);
    c.closePath();
    c.fillStyle = WHITE;
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = r * 0.22;
    c.stroke();
    // 瞳
    c.beginPath();
    c.arc(0, -r * 0.06, r * 0.40, 0, Math.PI * 2);
    c.fillStyle = INK;
    c.fill();
    // 眼线：从外角往后拖一条
    c.strokeStyle = INK;
    c.lineWidth = r * 0.26;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-r * 1.15, 0);
    c.lineTo(-r * 1.85, r * 0.16);
    c.stroke();
    // 眉
    c.lineWidth = r * 0.20;
    c.beginPath();
    c.moveTo(-r * 1.25, -r * 0.72);
    c.quadraticCurveTo(0, -r * 1.28, r * 1.16, -r * 0.5);
    c.stroke();
    c.restore();
  }


  /**
   * 埃及式的翅膀：一块平板的带子，从肩到车把，里面横着几条彩条。
   * 这是整套埃及画法里最好认的一个元素 —— 有它，格子立刻"是埃及的"。
   */
  function egyptWing(c, p) {
    if (!p.shoulder || !p.grip) return;
    const A = p.shoulder, B = p.grip;
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    const nx = -uy, ny = ux;
    // 翅身带一点弧：直的会像一根棍
    const bend = 9;
    const mid = [A[0] + ux * L * 0.52 + nx * bend, A[1] + uy * L * 0.52 + ny * bend];
    const w0 = 30, w1 = 21, w2 = 7;
    const up = [
      [A[0] + nx * w0 * 0.5, A[1] + ny * w0 * 0.5],
      [mid[0] + nx * w1 * 0.5, mid[1] + ny * w1 * 0.5],
      [B[0] + nx * w2 * 0.5, B[1] + ny * w2 * 0.5],
    ];
    const dn = [
      [A[0] - nx * w0 * 0.5, A[1] - ny * w0 * 0.5],
      [mid[0] - nx * w1 * 0.5, mid[1] - ny * w1 * 0.5],
      [B[0] - nx * w2 * 0.5, B[1] - ny * w2 * 0.5],
    ];
    const outline = up.concat([dn[2], dn[1], dn[0]]);
    c.save();
    V.ink.path(c, outline);
    c.fillStyle = '#f6efdc';
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 3.0;
    c.lineJoin = 'round';
    c.stroke();
    // 羽列：**沿翅长**的四条带，横跨翅宽排开（真埃及翅膀就是这样分羽的）
    V.ink.clipped(c, outline, (cc) => {
      const bands = [BLUE, GREEN, RED, BLUE];
      for (let i = 0; i < bands.length; i++) {
        const o0 = -w0 * 0.5 + (i * w0) / bands.length;
        const o1 = -w0 * 0.5 + ((i + 1) * w0) / bands.length;
        cc.beginPath();
        cc.moveTo(A[0] + nx * o0, A[1] + ny * o0);
        cc.quadraticCurveTo(mid[0] + nx * o0 * 0.7, mid[1] + ny * o0 * 0.7,
          B[0] + nx * o0 * 0.3, B[1] + ny * o0 * 0.3);
        cc.lineTo(B[0] + nx * o1 * 0.3, B[1] + ny * o1 * 0.3);
        cc.quadraticCurveTo(mid[0] + nx * o1 * 0.7, mid[1] + ny * o1 * 0.7,
          A[0] + nx * o1, A[1] + ny * o1);
        cc.closePath();
        cc.fillStyle = bands[i];
        cc.globalAlpha = 0.72;
        cc.fill();
      }
      // 羽列之间的墨线
      cc.globalAlpha = 0.5;
      cc.strokeStyle = INK;
      cc.lineWidth = 1.4;
      for (let i = 1; i < bands.length; i++) {
        const o = -w0 * 0.5 + (i * w0) / bands.length;
        cc.beginPath();
        cc.moveTo(A[0] + nx * o, A[1] + ny * o);
        cc.quadraticCurveTo(mid[0] + nx * o * 0.7, mid[1] + ny * o * 0.7,
          B[0] + nx * o * 0.3, B[1] + ny * o * 0.3);
        cc.stroke();
      }
      cc.globalAlpha = 1;
    });
    // 翅尖三根飞羽
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(B[0] + nx * i * 2.6, B[1] + ny * i * 2.6);
      c.lineTo(B[0] + ux * 24 + nx * i * 7, B[1] + uy * 24 + ny * i * 7);
      c.stroke();
    }
    c.restore();
  }


  /** 身上的翅羽：埃及画里的鸟，身上一定要画出折叠的翅膀。
   *  没有这一层，身体就是一块白板。 */
  function bodyFeathers(c, p) {
    if (!p.body || p.body.length < 8) return;
    const pts = [p.body[1], p.body[2], p.body[3]];
    const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
    const cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
    c.save();
    // 必须裁进躯干轮廓：不裁的话羽线会跑到身体外面的墙上
    V.ink.clipped(c, p.body, (cc) => {
      cc.strokeStyle = INK;
      cc.lineCap = 'round';
      cc.lineWidth = 2.4;
      cc.beginPath();
      cc.moveTo(cx - 30, cy - 18);
      cc.quadraticCurveTo(cx + 8, cy - 28, cx + 40, cy + 2);
      cc.quadraticCurveTo(cx + 6, cy + 18, cx - 28, cy + 9);
      cc.stroke();
      cc.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const t = i / 3;
        cc.beginPath();
        cc.moveTo(cx - 22 + t * 10, cy - 12 + t * 6);
        cc.quadraticCurveTo(cx + 4, cy - 8 + t * 7, cx + 30 - t * 6, cy + 1 + t * 5);
        cc.stroke();
      }
    });
    c.restore();
  }

  S.egypt = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const cam = meta.cam || V.camDefault();

      // ---------------- 静态层 ----------------
      const baked = V.layer.bake2d('egypt:base', (g) => {
        const c = g.drawingContext;
        const W = g.width, H = g.height;
        V.paper.paint(c, W, H, 'plaster', 1300);
        const rnd = V.rng(1301);

        // 分带高度
        // 版式：地面线放在骑手脚下的 ROAD_Y（838），文字列在两侧一直排到地面。
        // 上一版把地面线放在 700，结果骑手的头穿过了分带线，像压在两块墙之间。
        const KH = 62;              // 凯克带
        const b1 = 96;              // 凯克带下沿
        const b2 = 470;             // 上横带下沿（细线，只切出一条檐下带）
        // 注意坐标系：烘焙层是**屏幕像素**，骑手在**舞台单位**里。
        // ROAD_Y 838 换算到屏幕是 838 * V.U ≈ 905，地面线必须画在这里，
        // 否则看起来骑手站在线下面一截（上一版就是这样）。
        const b3 = Math.round(V.ROAD_Y * V.U) - 9;   // ≈ 896
        const b4 = b3 + 56;                          // 踢脚线上沿

        // ---- 凯克装饰带 ----
        c.save();
        c.fillStyle = 'rgba(230,214,178,0.55)';
        c.fillRect(0, 12, W, KH + 8);
        c.restore();
        khekerBand(c, 8, W - 8, 26, KH - 10, V.rng(7));

        // ---- 分带线 ----
        const line = (y, w, col) => {
          c.save();
          c.strokeStyle = col || 'rgba(48,34,18,0.72)';
          c.lineWidth = w;
          c.beginPath();
          c.moveTo(0, y);
          c.lineTo(W, y);
          c.stroke();
          c.restore();
        };
        line(b1, 3.4);
        line(b1 + 9, 1.2);
        line(b2, 6.0);            // 粗分隔
        line(b2 + 11, 1.4);
        line(b3, 3.0);
        line(b3 + 8, 1.2);
        line(b4, 2.2);
        line(b4 + 7, 1.0);

        // ---- 上横带：左右各四列象形文字，中间留给王名圈 ----
        glyphColumns(c, 34, 452, b1 + 26, b3 - 26, 21, V.rng(21), [INK, INK, RED, BLUE]);
        glyphColumns(c, 1522, W - 34, b1 + 26, b3 - 26, 21, V.rng(22), [INK, BLUE, RED, GREEN]);

        // 地面线以下交给动态层画（路面会盖住这里）
        // ---- 匠人打的红网格 ----
        c.save();
        c.strokeStyle = 'rgba(176,72,48,0.22)';
        c.lineWidth = 1;
        for (let x = 0, i = 0; x < W; x += 78, i++) {
          const jx = Math.sin(i * 1.7) * 2.4;
          c.beginPath(); c.moveTo(x + jx, b1 + 10); c.lineTo(x + jx, b4 - 6); c.stroke();
        }
        for (let y = b1 + 10, i = 0; y < b4 - 6; y += 78, i++) {
          const jy = Math.sin(i * 2.3) * 2.0;
          c.beginPath(); c.moveTo(0, y + jy); c.lineTo(W, y + jy); c.stroke();
        }
        c.restore();

        // ---- 墙面损伤：灰泥剥落 + 裂缝 ----
        for (let i = 0; i < 7; i++) {
          const px = rnd.range(60, W - 60);
          const py = rnd.range(60, H - 60);
          const pr = rnd.range(22, 76);
          const pts = [];
          const n = rnd.int(8, 13);
          for (let q = 0; q < n; q++) {
            const a = (q / n) * Math.PI * 2;
            const rr = pr * (0.55 + rnd() * 0.7);
            pts.push([px + Math.cos(a) * rr, py + Math.sin(a) * rr * 0.8]);
          }
          c.save();
          c.globalAlpha = 0.26;
          c.fillStyle = '#e0d0aa';
          V.ink.path(c, pts);
          c.fill();
          c.globalAlpha = 0.35;
          c.strokeStyle = 'rgba(96,70,40,0.8)';
          c.lineWidth = 1.6;
          V.ink.path(c, pts);
          c.stroke();
          c.restore();
        }
        for (let i = 0; i < 5; i++) {
          let x = rnd.range(0, W), y = rnd.range(0, H * 0.7);
          let ang = rnd.range(-0.3, 0.3) + (rnd() > 0.5 ? 0.1 : Math.PI / 2);
          c.save();
          c.strokeStyle = 'rgba(60,40,20,0.30)';
          c.lineWidth = 0.9 + rnd() * 1.4;
          c.beginPath();
          c.moveTo(x, y);
          for (let k = 0; k < 18; k++) {
            ang += rnd.gauss() * 0.4;
            x += Math.cos(ang) * 22;
            y += Math.sin(ang) * 22;
            c.lineTo(x, y);
          }
          c.stroke();
          c.restore();
        }

        // 墙面斑驳
        for (let i = 0; i < 320; i++) {
          const x = rnd() * W, y = rnd() * H;
          c.fillStyle = rnd() > 0.45 ? 'rgba(120,86,44,0.09)' : 'rgba(255,244,214,0.11)';
          c.beginPath();
          c.arc(x, y, 1 + rnd() * 5, 0, Math.PI * 2);
          c.fill();
        }

        V.paper.innerShadow(c, W, H, 0.16, 130);
      }, { w: V.W, h: V.H });

      ctx.drawImage(baked.canvas, 0, 0);

      // ---------------- 地面线以下（屏幕坐标，画在路面之后）----------------
      const groundY = Math.round(V.ROAD_Y * V.U) - 9;
      const dadoTop = groundY + 74;

      // ---------------- 动态层 ----------------
      V.enterCam(ctx, cam);
      // 路面只留一条地面带：depth=8 → 顶边落在屏幕 ≈896（骑手脚下的地面线）。
      // 早先 depth=138，路面把墙下沿的字列全盖住了。
      B.drawRoad(ctx, t, { color: '#d3bd8c', depth: 8, grain: 0.22, speed: 1 });

      // 第 2 小节：低头看轮子
      const look = V.envelope(u, 1.98, 2.30, 3.30, 3.70);
      const mods = {
        headTilt: look * 0.34,
        neckCurl: look * 0.22,
        lean: -look * 0.03,
        bob: look * 0.12,
      };

      const r = B.drawRider(ctx, t, {
        scale: 1.10,
        mods,
        shadow: true,
        shadowStyle: { alpha: 0.12, color: '#5a4020' },
        // 埃及壁画是"平涂 + 粗轮廓"。底色是米黄墙，所以身体必须提到近白，
        // 否则整只鸟糊进墙里（上一版就是）。
        pelicanStyle: {
          body: '#f6efdc', bodyShade: '#e8dfc6', line: INK,
          beak: YELLOW, beakDark: '#8f6220', pouch: '#d9a441', pouchShade: '#a87a2c',
          leg: RED, eye: '#f6efdc', lw: 4.6, feather: 0, eyeStyle: 'dot',
        },
        // 没有辐条：轮子在埃及画法里只能是实心盘
        bikeStyle: {
          frame: INK, frameDark: INK, tire: INK, rim: INK,
          spoke: INK, saddle: INK, lw: 4.6, tubeW: 7, spokes: 0, shine: 0,
        },
      });

      // 正面眼：画在侧脸的头上的那只"永远看着你"的眼睛。
      // pose 的坐标是**骑手局部坐标**（原点在后轮触地点），
      // 必须套上和 drawRider 一样的平移 + 缩放，否则眼会跑到画面左上角。
      const p = r.p;
      const RSCALE = 1.10;
      const dx = p.beakTip[0] - p.beakBase[0];
      const dy = p.beakTip[1] - p.beakBase[1];
      const L = Math.hypot(dx, dy) || 1;
      const baX = dx / L, baY = dy / L;
      // 法线要指向头顶那一侧：(-baY, baX) 会落到下巴底下，眼就被喙挡住了
      const nX = baY, nY = -baX;
      const hr = p.headR || 20;
      const ex = p.headC[0] + baX * hr * 0.02 + nX * hr * 0.22;
      const ey = p.headC[1] + baY * hr * 0.02 + nY * hr * 0.22;
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.scale(RSCALE, RSCALE);
      egyptEye(ctx, ex, ey, hr * 0.46, Math.atan2(baY, baX));
      bodyFeathers(ctx, p);
      egyptWing(ctx, p);
      ctx.restore();

      V.exitCam(ctx);

      // ---- 地面线 / 供桌 / 踢脚：全部在屏幕坐标里画（必须在 exitCam 之后）----
      ctx.save();
      ctx.strokeStyle = 'rgba(48,34,18,0.70)';
      ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(V.W, groundY); ctx.stroke();
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(0, groundY + 7); ctx.lineTo(V.W, groundY + 7); ctx.stroke();
      ctx.lineWidth = 1.4;
      for (let x = 0; x < V.W; x += 26) {
        ctx.beginPath(); ctx.moveTo(x, groundY + 7); ctx.lineTo(x, groundY + 19); ctx.stroke();
      }
      // 供桌：站在地面线上，分列骑手左右
      offeringTable(ctx, 360, groundY - 46, 128, V.rng(71));
      offeringTable(ctx, 1452, groundY - 46, 128, V.rng(72), true);

      // 踢脚
      const dado = ctx.createLinearGradient(0, dadoTop, 0, V.H);
      dado.addColorStop(0, 'rgba(70,46,20,0.86)');
      dado.addColorStop(1, 'rgba(40,26,10,0.94)');
      ctx.fillStyle = dado;
      ctx.fillRect(0, dadoTop, V.W, V.H - dadoTop);
      ctx.strokeStyle = 'rgba(200,158,82,0.55)';
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(0, dadoTop); ctx.lineTo(V.W, dadoTop); ctx.stroke();
      // 踢脚上的一行符号
      const dr = V.rng(555);
      for (let x = 52; x < V.W - 40; x += 62) {
        const g5 = GLYPHS[dr.int(0, GLYPHS.length - 1)];
        g5(ctx, x, dadoTop + 42, 15 + dr() * 6, 'rgba(206,166,92,0.72)');
      }
      ctx.restore();


      V.titles.draw(ctx, 'vertical', meta.strings, u, V.titles.opts('egypt', { dur: meta.dur }));
    },
  };
})();
