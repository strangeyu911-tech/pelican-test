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

  /** 拓片上的白线：略有抖动，像刀刻的**
   *  @param {number} w 线宽
   */
  function incise(c, pts, w, col, closed) {
    c.save();
    c.strokeStyle = col || LINE;
    c.lineWidth = w || 2.6;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    if (closed) c.closePath();
    c.stroke();
    c.restore();
  }

  /** 菱格边框：两排交错的菱形 */
  function lozengeBand(c, x0, x1, y, h, rnd) {
    const w = h * 1.15;
    for (let x = x0, i = 0; x < x1; x += w, i++) {
      const cy = y + h / 2;
      c.save();
      c.strokeStyle = LINE;
      c.lineWidth = 2.0;
      c.beginPath();
      c.moveTo(x, cy);
      c.lineTo(x + w / 2, y);
      c.lineTo(x + w, cy);
      c.lineTo(x + w / 2, y + h);
      c.closePath();
      c.stroke();
      // 菱形里点一个小圆
      if (i % 2 === 0) {
        c.beginPath();
        c.arc(x + w / 2, cy, h * 0.13, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    }
    incise(c, [[x0, y], [x1, y]], 3.0);
    incise(c, [[x0, y + h], [x1, y + h]], 3.0);
  }

  /** 绳纹边框：两股绳交缠 */
  function ropeBand(c, x0, x1, y, h) {
    const w = h * 0.9;
    c.save();
    c.strokeStyle = LINE;
    c.lineWidth = 2.2;
    c.lineJoin = 'round';
    for (let x = x0; x < x1; x += w) {
      c.beginPath();
      c.moveTo(x, y + h * 0.5);
      c.quadraticCurveTo(x + w * 0.5, y, x + w, y + h * 0.5);
      c.stroke();
      c.beginPath();
      c.moveTo(x, y + h * 0.5);
      c.quadraticCurveTo(x + w * 0.5, y + h, x + w, y + h * 0.5);
      c.stroke();
    }
    c.restore();
    incise(c, [[x0, y], [x1, y]], 2.4);
    incise(c, [[x0, y + h], [x1, y + h]], 2.4);
  }

  /** 云气纹：一长条 S 形主脉，两端各卷一个涡（外圈留口 + 内圈），另出一条支脉。 */
  function cloudCurl(c, x, y, s, dir) {
    c.save();
    c.strokeStyle = LINE_DIM;
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    // 主脉
    c.beginPath();
    c.moveTo(x, y);
    c.bezierCurveTo(x + s * 0.40 * dir, y - s * 0.52,
      x + s * 0.92 * dir, y + s * 0.26,
      x + s * 1.42 * dir, y - s * 0.06);
    c.stroke();
    // 两端的涡：外圈留个口，内圈收进去 —— 这才是卷云，不是套在一起的两个圆
    for (const t of [0, 1]) {
      const ex = x + s * 1.42 * dir * t;
      const ey = y - s * 0.06 * t;
      c.beginPath();
      c.arc(ex, ey, s * 0.17, 0.55, Math.PI * 2.1);
      c.stroke();
      c.beginPath();
      c.arc(ex + s * 0.09 * dir, ey + s * 0.03, s * 0.08, 0.2, Math.PI * 1.7, true);
      c.stroke();
    }
    // 支脉
    c.beginPath();
    c.moveTo(x + s * 0.52 * dir, y - s * 0.22);
    c.quadraticCurveTo(x + s * 0.70 * dir, y - s * 0.60, x + s * 0.94 * dir, y - s * 0.50);
    c.stroke();
    c.restore();
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
        cloudCurl(c, 90, 236, 250, 1);
        cloudCurl(c, 1660, 300, 232, -1);
        cloudCurl(c, 1400, 168, 190, 1);

        // ---- 题名 -->
        // （题名由 V.titles 画，这里只在它后面点两道竖线当"榜题"的框）
        incise(c, [[470, 150], [470, 420]], 2.0, LINE_DIM);
        incise(c, [[600, 150], [600, 420]], 2.0, LINE_DIM);

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
        incise(c, crack, 5.0, 'rgba(10,9,8,0.9)');
        incise(c, crack.map((q) => [q[0] + 3, q[1] + 2]), 2.0, LINE_DIM);

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
