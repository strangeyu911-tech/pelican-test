/* scenes/han.js — 03 汉画像石拓片（18 – 24 s，3 小节）
 *
 * 时代规矩：拓片是"纸压在石头上、墨打在凸面"，所以**凸的是黑的、刻进去的线是白的** ——
 * 画面天生是黑底白线，没有明暗，没有透视，人一律侧脸，车马一律整排。
 * 边框一定是几何纹（菱格、绳纹、云气），中间留大块的黑。
 *
 * 梗：**地面是一条裂缝**。石料中间裂开了，骑手就沿着裂缝走；
 *     第 2 小节裂缝分叉，它没得选，还是走原来那条。
 *
 *   ① 0 – 2   黑底浮出，菱格边框与云气立起来，骑手从左外进入
 *   ② 2 – 4   裂缝在旁边岔出一道，骑手不管，继续沿原来那条走
 *   ③ 4 – 6   石面缺角（拓片上一块空白），骑手朝下一个画框去
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;

  const BLACK = '#15130f';
  const LINE = '#e8e0cc';          // 刻进去的凹槽 = 白线
  const LINE_DIM = 'rgba(232,224,204,0.62)';

  // ---------------- 折线采样：所有曲线都先变成折线，才能逐段控制线宽 ----------------

  function sampleQuad(p0, p1, p2, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
        u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
    }
    return out;
  }

  function sampleBez(p0, p1, p2, p3, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
        a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
    }
    return out;
  }

  /**
   * 拓片上的白线 = 刻进石头里的凹槽。
   *
   * 真拓片**没有等宽的线**：刻得深的地方白线宽，刻浅的地方窄，石头崩了的地方干脆断掉。
   * 所以这里逐段画：每段线宽 = 基础宽 × 包络(两端细) × 噪声，另有一段段的断口，
   * 再在边上带一条极细的"毛边"（刀锋刮出来的）。
   *
   * @param {object} o { seed, breaks, taper, closed }
   */
  function incise(c, pts, w, col, o) {
    const opt = o || {};
    const base = w || 2.6;
    const color = col || LINE;
    const rnd = V.rng(opt.seed || 1);
    const list = pts.slice();
    if (opt.closed) list.push(list[0]);

    // 沿线累计长度，用来做包络
    const seg = [];
    let total = 0;
    for (let i = 1; i < list.length; i++) {
      const d = Math.hypot(list[i][0] - list[i - 1][0], list[i][1] - list[i - 1][1]);
      seg.push(d);
      total += d;
    }
    if (total < 1) return;

    // 断口：在总长的若干百分比处不开刀
    const breaks = [];
    const nb = opt.breaks == null ? Math.round(total / 260) : opt.breaks;
    for (let i = 0; i < nb; i++) {
      const at = rnd() * total;
      const len = 6 + rnd() * (opt.breakLen || 34);
      breaks.push([at, at + len]);
    }
    const broken = (d) => {
      for (const b of breaks) if (d > b[0] && d < b[1]) return true;
      return false;
    };

    c.save();
    c.strokeStyle = color;
    // 用平头：圆头会在每一小段的末端鼓出一个"珠子"，整条线看着像串珠
    c.lineCap = 'butt';
    c.lineJoin = 'round';

    let run = 0;
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1], b = list[i];
      const d = seg[i - 1];
      const steps = Math.max(1, Math.round(d / 7));
      let px = a[0], py = a[1];
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        const x = a[0] + (b[0] - a[0]) * t;
        const y = a[1] + (b[1] - a[1]) * t;
        const along = run + d * t;
        if (!broken(along)) {
          // 包络：两端细、中间粗
          const e = opt.taper === false ? 1
            : Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, along / total))), 0.45);
          c.lineWidth = Math.max(0.7, base * (0.70 + e * 0.50) * (0.86 + rnd() * 0.28));
          c.globalAlpha = 0.86 + rnd() * 0.14;
          c.beginPath();
          c.moveTo(px, py);
          c.lineTo(x, y);
          c.stroke();
        }
        px = x; py = y;
      }
      run += d;
    }

    // 毛边：贴着线扫一道极细的、断续的痕
    if (opt.burr !== false) {
      c.globalAlpha = 0.30;
      c.lineWidth = Math.max(0.6, base * 0.34);
      c.lineCap = 'butt';
      let run2 = 0;
      for (let i = 1; i < list.length; i++) {
        const a = list[i - 1], b = list[i];
        const d = seg[i - 1];
        const steps = Math.max(1, Math.round(d / 14));
        for (let k = 1; k <= steps; k++) {
          if (rnd() > 0.55) continue;
          const t0 = (k - 1) / steps, t1 = k / steps;
          c.beginPath();
          c.moveTo(a[0] + (b[0] - a[0]) * t0 + (rnd() - 0.5) * 2.4,
            a[1] + (b[1] - a[1]) * t0 + (rnd() - 0.5) * 2.4);
          c.lineTo(a[0] + (b[0] - a[0]) * t1 + (rnd() - 0.5) * 2.4,
            a[1] + (b[1] - a[1]) * t1 + (rnd() - 0.5) * 2.4);
          c.stroke();
        }
        run2 += d;
      }
    }
    c.restore();
  }

  /** 圆弧采样成折线 */
  function sampleArc(cx, cy, r, a0, a1, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }

  /** 菱格边框：上下一排菱形，每条边都是刻出来的（有线宽变化、会断） */
  function lozengeBand(c, x0, x1, y, h, rnd) {
    const w = h * 1.15;
    let i = 0;
    for (let x = x0; x < x1; x += w, i++) {
      const cy = y + h / 2;
      incise(c, [[x, cy], [x + w / 2, y], [x + w, cy], [x + w / 2, y + h]], 2.2, LINE,
        { closed: true, seed: 900 + i, breaks: 0 });
      if (i % 2 === 0) {
        incise(c, sampleArc(x + w / 2, cy, h * 0.13, 0, Math.PI * 2, 14), 1.8, LINE,
          { closed: true, seed: 950 + i, breaks: 0, burr: false });
      }
    }
    incise(c, [[x0, y], [x1, y]], 3.2, LINE, { seed: 11, breaks: 3, breakLen: 22 });
    incise(c, [[x0, y + h], [x1, y + h]], 3.2, LINE, { seed: 12, breaks: 3, breakLen: 22 });
  }

  /** 绳纹边框：两股绳交缠，同样逐段控制线宽 */
  function ropeBand(c, x0, x1, y, h) {
    const w = h * 0.9;
    let i = 0;
    for (let x = x0; x < x1; x += w, i++) {
      incise(c, sampleQuad([x, y + h * 0.5], [x + w * 0.5, y], [x + w, y + h * 0.5], 9),
        2.2, LINE, { seed: 300 + i, breaks: 0 });
      incise(c, sampleQuad([x, y + h * 0.5], [x + w * 0.5, y + h], [x + w, y + h * 0.5], 9),
        2.2, LINE, { seed: 400 + i, breaks: 0 });
    }
    incise(c, [[x0, y], [x1, y]], 2.6, LINE, { seed: 21, breaks: 3, breakLen: 18 });
    incise(c, [[x0, y + h], [x1, y + h]], 2.6, LINE, { seed: 22, breaks: 3, breakLen: 18 });
  }

  /** 云气纹：一长条 S 形主脉 + 两端卷涡 + 支脉。全部走 incise，所以有线宽与断口。 */
  function cloudCurl(c, x, y, s, dir, seed) {
    const sd = seed || 1;
    // 主脉
    incise(c, sampleBez([x, y],
      [x + s * 0.40 * dir, y - s * 0.52],
      [x + s * 0.92 * dir, y + s * 0.26],
      [x + s * 1.42 * dir, y - s * 0.06], 26), 2.4, LINE_DIM, { seed: sd, breakLen: 26 });
    // 两端的涡
    for (const t of [0, 1]) {
      const ex = x + s * 1.42 * dir * t;
      const ey = y - s * 0.06 * t;
      incise(c, sampleArc(ex, ey, s * 0.17, 0.55, Math.PI * 2.1, 16), 2.2, LINE_DIM,
        { seed: sd + t * 7, breaks: 1, breakLen: 10 });
      incise(c, sampleArc(ex + s * 0.09 * dir, ey + s * 0.03, s * 0.08, 0.2, Math.PI * 1.7, 12),
        1.8, LINE_DIM, { seed: sd + 3 + t, breaks: 0, burr: false });
    }
    // 支脉
    incise(c, sampleQuad([x + s * 0.52 * dir, y - s * 0.22],
      [x + s * 0.70 * dir, y - s * 0.60],
      [x + s * 0.94 * dir, y - s * 0.50], 14), 2.0, LINE_DIM, { seed: sd + 11, breakLen: 14 });
  }


  /** 阙：汉代最典型的门楼 —— 两根柱子、一道横楣、上面一片瓦顶。
   *  汉画像石里几乎每块都有它，加一座就把右侧的空黑填满了。 */
  function queGate(c, x, baseY, w, h, seed) {
    const rnd = V.rng(seed || 71);
    const half = w / 2;
    const pillarW = w * 0.11;
    const topY = baseY - h;

    // 两根柱子（略带收分）
    for (const sx of [-1, 1]) {
      const px = x + sx * (half - pillarW);
      const pts = [
        [px - pillarW * 0.5, baseY],
        [px - pillarW * 0.42, baseY - h * 0.62],
        [px - pillarW * 0.34, topY + h * 0.10],
        [px + pillarW * 0.34, topY + h * 0.10],
        [px + pillarW * 0.42, baseY - h * 0.62],
        [px + pillarW * 0.5, baseY],
      ];
      incise(c, pts, 2.6, LINE, { closed: true, seed: seed + sx + 2, breaks: 0 });
      // 柱身上的横线（汉代木构的束带）
      for (let k = 1; k < 4; k++) {
        const y = baseY - h * (0.18 + k * 0.14);
        incise(c, [[px - pillarW * 0.42, y], [px + pillarW * 0.42, y]], 1.8, LINE_DIM,
          { seed: seed + k * 7, breaks: 0, burr: false });
      }
    }

    // 横楣
    incise(c, [[x - half, topY + h * 0.10], [x + half, topY + h * 0.10]], 3.0, LINE,
      { seed: seed + 11, breaks: 2, breakLen: 16 });
    incise(c, [[x - half, topY + h * 0.02], [x + half, topY + h * 0.02]], 2.2, LINE,
      { seed: seed + 12, breaks: 1, breakLen: 14 });

    // 瓦顶：一条微微下凹的檐线 + 两端的翘角
    const eave = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      eave.push([x - half * 1.06 + half * 2.12 * t, topY - Math.sin(t * Math.PI) * h * 0.055]);
    }
    incise(c, eave, 3.2, LINE, { seed: seed + 21, breaks: 2, breakLen: 18 });
    // 翘角
    incise(c, [[x - half * 1.06, topY], [x - half * 1.16, topY - h * 0.055]], 2.4, LINE,
      { seed: seed + 22, breaks: 0 });
    incise(c, [[x + half * 1.06, topY], [x + half * 1.16, topY - h * 0.055]], 2.4, LINE,
      { seed: seed + 23, breaks: 0 });
    // 瓦垄
    for (let i = 1; i < 9; i++) {
      const t = i / 9;
      const bx = x - half * 1.02 + half * 2.04 * t;
      const by = topY - Math.sin(t * Math.PI) * h * 0.055;
      incise(c, [[bx, by], [bx, by + h * 0.075]], 1.5, LINE_DIM,
        { seed: seed + 30 + i, breaks: 0, burr: false });
    }
    // 顶脊
    incise(c, [[x - half * 0.94, topY + h * 0.075], [x + half * 0.94, topY + h * 0.075]], 2.0, LINE_DIM,
      { seed: seed + 40, breaks: 1, breakLen: 12 });
  }

  S.han = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const cam = meta.cam || V.camDefault();

      const baked = V.layer.bake2d('han:base', (g) => {
        const c = g.drawingContext;
        const W = g.width, H = g.height;
        V.paper.paint(c, W, H, 'rubbing', 103);
        const rnd = V.rng(303);

        // 拓片的墨不匀：再压几层深墨块，让黑不是一块死黑
        for (let i = 0; i < 40; i++) {
          const x = rnd() * W, y = rnd() * H;
          const r = 60 + rnd() * 220;
          const gg = c.createRadialGradient(x, y, 0, x, y, r);
          gg.addColorStop(0, `rgba(8,7,6,${0.10 + rnd() * 0.18})`);
          gg.addColorStop(1, 'rgba(8,7,6,0)');
          c.fillStyle = gg;
          c.beginPath();
          c.arc(x, y, r, 0, Math.PI * 2);
          c.fill();
        }
        // 拓包没打到的地方：一点点纸白
        for (let i = 0; i < 2600; i++) {
          c.fillStyle = `rgba(226,218,200,${0.03 + rnd() * 0.10})`;
          c.beginPath();
          c.arc(rnd() * W, rnd() * H, 0.6 + rnd() * 2.2, 0, Math.PI * 2);
          c.fill();
        }

        // ---- 边框 ----
        lozengeBand(c, 18, W - 18, 26, 46, rnd);
        ropeBand(c, 18, W - 18, H - 96, 40);

        // ---- 云气 ----
        cloudCurl(c, 90, 236, 250, 1, 501);
        queGate(c, 1620, Math.round(V.ROAD_Y * V.U) - 9, 300, 400, 71);
        cloudCurl(c, 1400, 168, 190, 1, 505);

        // ---- 题名 -->
        // （题名由 V.titles 画，这里只在它后面点两道竖线当"榜题"的框）
        incise(c, [[470, 150], [470, 420]], 2.4, LINE_DIM, { seed: 61, breakLen: 26 });
        incise(c, [[600, 150], [600, 420]], 2.4, LINE_DIM, { seed: 62, breakLen: 26 });

        // ---- 石头的裂缝：从左上斜下来，穿过整个画面 ----
        const crack = [];
        let cx = -40, cy = 120;
        let ang = 0.42;
        for (let i = 0; i < 46; i++) {
          crack.push([cx, cy]);
          ang += (rnd() - 0.5) * 0.30;
          cx += Math.cos(ang) * 46;
          cy += Math.sin(ang) * 34;
          if (cy > H + 40) break;
        }
        // 裂缝是双线：一条深、一条浅，才有"崩开"的感觉
        incise(c, crack, 5.4, 'rgba(10,9,8,0.9)', { seed: 77, breaks: 3, breakLen: 22, burr: false });
        incise(c, crack.map((q) => [q[0] + 3, q[1] + 2]), 2.0, LINE_DIM, { seed: 78, breakLen: 30 });

        // 裂缝旁边的碎屑
        for (let i = 0; i < 90; i++) {
          const s = crack[Math.floor(rnd() * crack.length)];
          if (!s) continue;
          c.fillStyle = `rgba(232,224,204,${0.05 + rnd() * 0.16})`;
          c.beginPath();
          c.arc(s[0] + (rnd() - 0.5) * 40, s[1] + (rnd() - 0.5) * 30, 0.8 + rnd() * 2.4, 0, Math.PI * 2);
          c.fill();
        }

        // ---- 石面缺角：右上角崩掉一块，露出底下没上墨的纸 ----
        // 崩口要毛边：等边的多边形会像贴上去的一块纸
        const notch = [];
        const nr = V.rng(808);
        for (let i = 0; i < 22; i++) {
          const a = (i / 22) * Math.PI * 2;
          const rx = 68 + nr() * 20;
          const ry = 58 + nr() * 18;
          notch.push([W - 340 + Math.cos(a) * rx, 168 + Math.sin(a) * ry]);
        }
        c.save();
        c.fillStyle = '#ded3b8';
        V.ink.path(c, notch);
        c.fill();
        // 崩口的暗边
        c.strokeStyle = 'rgba(10,9,8,0.75)';
        c.lineWidth = 3.4;
        V.ink.path(c, notch);
        c.stroke();
        // 缺口里露出的纸纹
        c.globalAlpha = 0.5;
        for (let i = 0; i < 40; i++) {
          c.strokeStyle = 'rgba(180,168,140,0.5)';
          c.lineWidth = 0.8;
          const bx = W - 430 + rnd() * 180;
          const by = 100 + rnd() * 140;
          c.beginPath();
          c.moveTo(bx, by);
          c.lineTo(bx + (rnd() - 0.5) * 24, by + (rnd() - 0.5) * 16);
          c.stroke();
        }
        c.restore();

        V.paper.innerShadow(c, W, H, 0.20, 120);
      }, { w: V.W, h: V.H });

      ctx.drawImage(baked.canvas, 0, 0);

      // ---------------- 动态层 ----------------
      V.enterCam(ctx, cam);

      // 地面：一条白线 + 稀疏的草（画像石的地面就是一道刻痕）
      const groundY = V.ROAD_Y;
      ctx.save();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 3.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-200, groundY);
      ctx.lineTo(V.STAGE + 200, groundY);
      ctx.stroke();
      // 草：短竖线，错开着排，随路面滚动
      const off = (t * B.ROAD_SPEED) % 90;
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = LINE_DIM;
      for (let x = -200; x < V.STAGE + 200; x += 90) {
        const bx = x - off;
        ctx.beginPath();
        ctx.moveTo(bx, groundY);
        ctx.lineTo(bx + 4, groundY - 22);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + 10, groundY);
        ctx.lineTo(bx + 16, groundY - 15);
        ctx.stroke();
      }
      // 第 2 小节：旁边岔出一道裂缝
      const fork = V.envelope(u, 1.6, 2.4, 9, 9);
      if (fork > 0.02) {
        ctx.save();
        ctx.globalAlpha = fork;
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(760, groundY);
        ctx.lineTo(830, groundY + 40);
        ctx.lineTo(872, groundY + 96);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // 骑手：白线 + 黑填充（阴刻）
      const rr = B.drawRider(ctx, t, {
        scale: 1.12,
        shadow: false,
        pelicanStyle: {
          // 阴刻效果：身体填石头的黑、只留白轮廓。
          // 注意不能用 'rgba(0,0,0,0)' 当填充色 —— V.mixHex/rgba 只吃 hex，
          // 解析失败会让 fillStyle 保持上一次的值（上一次是白），
          // 结果腹部阴影被填成一块白圆（这一版踩过）。
          body: '#15130f', bodyShade: '#15130f', line: LINE,
          beak: '#15130f', beakDark: '#15130f',
          pouch: '#15130f', pouchShade: '#15130f',
          leg: LINE, eye: LINE, lw: 2.8, feather: 0, eyeStyle: 'dot',
          fillBody: true,
        },
        bikeStyle: {
          frame: LINE, frameDark: LINE_DIM, tire: LINE, rim: LINE,
          spoke: LINE_DIM, saddle: LINE, lw: 2.4, tubeW: 3.4, spokes: 10, shine: 0,
        },
      });

      // 翅膀根那块宽缎带在纯线描里会读成一个多余的内圈，
      // 用一块黑椭圆盖掉 —— 背景和身体都是黑的，只要不进白轮廓就看不出来。
      const pp = rr.p;
      if (pp.body && pp.body.length > 6) {
        const bb = V.ink.bounds(pp.body);
        const ccx = (bb.x0 + bb.x1) / 2;
        const ccy = (bb.y0 + bb.y1) / 2;
        ctx.save();
        ctx.translate(rr.x, rr.y);
        ctx.scale(1.12, 1.12);
        ctx.fillStyle = '#15130f';
        ctx.beginPath();
        ctx.ellipse(ccx, ccy, (bb.x1 - bb.x0) * 0.34, (bb.y1 - bb.y0) * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();

        // 折翼：线描里身体不能是一颗光蛋，要有一道翅的界线
        V.ink.clipped(ctx, pp.body, (cc) => {
          cc.strokeStyle = LINE;
          cc.lineCap = 'round';
          cc.lineWidth = 2.4;
          cc.beginPath();
          cc.moveTo(ccx - 34, ccy - 20);
          cc.quadraticCurveTo(ccx + 6, ccy - 30, ccx + 40, ccy + 2);
          cc.quadraticCurveTo(ccx + 4, ccy + 20, ccx - 32, ccy + 10);
          cc.stroke();
          cc.lineWidth = 1.6;
          for (let i = 0; i < 2; i++) {
            const t = i / 2;
            cc.beginPath();
            cc.moveTo(ccx - 24 + t * 12, ccy - 12 + t * 7);
            cc.quadraticCurveTo(ccx + 4, ccy - 8 + t * 8, ccx + 30 - t * 6, ccy + 1 + t * 6);
            cc.stroke();
          }
        });
        ctx.restore();
      }

      V.exitCam(ctx);

      V.titles.draw(ctx, 'vertical', meta.strings, u, V.titles.opts('han', { dur: meta.dur }));
    },
  };
})();
