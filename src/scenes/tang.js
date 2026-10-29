/* scenes/tang.js — 04 唐代白描（24 – 30 s，3 小节）
 *
 * 时代规矩：白描只有线 —— 不上色、不晕染、不画阴影，一条线要走到底。
 * 唐人管这个叫"铁线描"：线要匀、要挺、要能撑住形体。
 * 而吴道子那一路的衣纹叫"吴带当风"—— 线会飘，飘得比人还长。
 *
 * 梗：**白描的线会飘**。鹈鹕一骑起来，身上就抽出几条飘带，
 *     越飘越长，长到比整只鸟还长；第 2 小节飘带缠了一下自己的车轮，又松开。
 *
 *   ① 0 – 2   白纸，一条地平线，骑手从左边进来，飘带抽出来
 *   ② 2 – 4   飘带长到最长，末端缠了一下车轮
 *   ③ 4 – 6   松开，继续往右
 *
 * 画面上只允许有：纸、一条地面线、骑手、飘带、题名、一方朱印。
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;

  const INK = '#1c1a16';
  const INK_SOFT = 'rgba(28,26,22,0.55)';
  const PAPER = '#f3ecdb';

  /** 一条飘带：从锚点往左飘，越远越软、越细 */
  function ribbon(ctx, ax, ay, len, amp, freq, phase, w, col) {
    const n = 46;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = ax - len * t;
      const decay = Math.pow(1 - t, 0.7);
      const y = ay
        + Math.sin(t * freq * Math.PI * 2 + phase) * amp * (0.35 + t * 0.9)
        + Math.sin(t * freq * 4.1 + phase * 1.7) * amp * 0.18 * t;
      pts.push([x, y, decay]);
    }
    ctx.save();
    ctx.strokeStyle = col || INK_SOFT;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // 逐段画，宽度沿长度衰减
    for (let i = 1; i <= n; i++) {
      const a = pts[i - 1], b = pts[i];
      ctx.globalAlpha = 0.28 + a[2] * 0.62;
      ctx.lineWidth = Math.max(0.5, w * (0.25 + a[2] * 0.95));
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
    ctx.restore();
    return pts;
  }

  S.tang = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const cam = meta.cam || V.camDefault();

      const baked = V.layer.bake2d('tang:base', (g) => {
        const c = g.drawingContext;
        const W = g.width, H = g.height;
        V.paper.paint(c, W, H, 'xuan', 707);
        const rnd = V.rng(707);

        // 绢的经纬：极淡，只在靠边处看得出来
        c.save();
        c.strokeStyle = 'rgba(150,138,112,0.10)';
        c.lineWidth = 1;
        for (let x = 0; x < W; x += 6) {
          c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke();
        }
        for (let y = 0; y < H; y += 6) {
          c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
        }
        c.restore();

        // 几处极淡的水渍（老纸的痕迹）
        for (let i = 0; i < 16; i++) {
          const x = rnd() * W, y = rnd() * H;
          const r = 40 + rnd() * 180;
          const gg = c.createRadialGradient(x, y, 0, x, y, r);
          gg.addColorStop(0, `rgba(176,158,120,${0.03 + rnd() * 0.05})`);
          gg.addColorStop(1, 'rgba(176,158,120,0)');
          c.fillStyle = gg;
          c.beginPath();
          c.arc(x, y, r, 0, Math.PI * 2);
          c.fill();
        }

        // 朱印：右下角一方，白文
        const sx = W - 148, sy = H - 210, ss = 74;
        c.save();
        c.globalAlpha = 0.86;
        c.fillStyle = '#b8372c';
        c.beginPath();
        c.roundRect(sx - ss / 2, sy - ss / 2, ss, ss, ss * 0.08);
        c.fill();
        c.globalAlpha = 0.28;
        c.fillStyle = '#6f1a13';
        c.fillRect(sx - ss / 2, sy - ss / 2, ss * 0.30, ss * 0.14);
        c.restore();
        V.text.draw(c, '鹈', sx, sy, {
          font: 'cnBrush', size: ss * 0.58, color: '#f6efe0', align: 'center', base: 'middle',
        });

        V.paper.innerShadow(c, W, H, 0.07, 150);
      }, { w: V.W, h: V.H });

      ctx.drawImage(baked.canvas, 0, 0);

      // ---------------- 动态层 ----------------
      V.enterCam(ctx, cam);

      // 地面：一条线，就这么简单（白描不画地面，只画界线）
      const groundY = V.ROAD_Y;
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      // 线要断一下：白描的线也是手画的，不会一刀齐
      ctx.beginPath();
      ctx.moveTo(-200, groundY);
      ctx.lineTo(V.STAGE * 0.62, groundY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(V.STAGE * 0.635, groundY + 1);
      ctx.lineTo(V.STAGE + 200, groundY);
      ctx.stroke();
      ctx.restore();

      // ---- 先取骨架，再画飘带，最后画骑手 ----
      // 顺序很重要：飘带必须先画，让身体把它们"长出来"的根部盖住；
      // 反过来画，飘带就会横穿身体。
      const p = V.rig.pose(t);
      // 这一格只有 **2 小节（4 秒）**（timeline 里 tang: 2）。
      // 之前按 3 小节的 6 秒编节奏，第 2、3 拍根本播不到 —— 全部改成按 dur 比例。
      const d = meta.dur || 4;
      const grow = V.clamp(u / (d * 0.3));
      const baseLen = 210 + grow * 250;
      const surge = V.envelope(u, d * 0.34, d * 0.5, d * 0.72, d * 0.9);

      ctx.save();
      ctx.translate(V.RIDER_X, V.ROAD_Y);
      ctx.scale(1.16, 1.16);
      const anchors = [
        [p.grip[0] - 6, p.grip[1] + 4, 1.00, 0.00],
        [p.tailA[0] + 4, p.tailA[1] - 2, 0.86, 0.55],
        [p.tailB[0] + 2, p.tailB[1] + 3, 0.72, 1.10],
        [p.beakTip[0] - 18, p.beakTip[1] + 16, 0.62, 1.65],
        [p.body[6][0] + 6, p.body[6][1] - 4, 0.94, 2.20],
      ];
      for (const [ax, ay, k, ph] of anchors) {
        const len = baseLen * k + surge * 120 * k;
        ribbon(ctx, ax, ay, len,
          26 + k * 16 + surge * 10,
          0.9 + k * 0.35,
          ph + t * 2.6,
          3.4 * k,
          'rgba(28,26,22,0.62)');
      }
      ctx.restore();

      // 骑手：极细的线 + 纸色填充（遮住后面的线，但不显眼）
      B.drawRider(ctx, t, {
        scale: 1.16,
        shadow: false,
        pelicanStyle: {
          body: PAPER, bodyShade: PAPER, line: INK,
          beak: PAPER, beakDark: PAPER, pouch: PAPER, pouchShade: PAPER,
          leg: INK, eye: INK, lw: 1.7, feather: 0, eyeStyle: 'dot',
          fillBody: true,
        },
        bikeStyle: {
          frame: INK, frameDark: INK_SOFT, tire: INK, rim: INK,
          spoke: INK_SOFT, saddle: INK, lw: 1.5, tubeW: 2.2, spokes: 12, shine: 0,
        },
      });

      V.exitCam(ctx);

      V.titles.draw(ctx, 'vertical', meta.strings, u, V.titles.opts('tang', { dur: meta.dur }));
    },
  };
})();
