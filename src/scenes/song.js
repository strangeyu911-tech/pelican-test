/* scenes/song.js — 05 宋代山水（28 – 36 s，4 小节）
 *
 * 致敬《溪山行旅图》：一座占满画幅的巨碑式主峰，人在山脚小到看不见。
 *
 * 梗：前两小节观众根本找不到鹈鹕 —— 它就是山道上一个点；
 *     第 2 小节镜头推上来，第 3 小节才认出来是只骑车的鹈鹕。
 *
 *   ① 0 – 2   全景，主峰压下来，鹈鹕 0.30 倍，几乎是个墨点
 *   ② 2 – 4   镜头推近
 *   ③ 4 – 6   认出来了
 *   ④ 6 – 8   继续推，朝下一个画框去
 *
 * 水墨要点（这版踩过的坑）：
 *   · 山脊不能做二次曲线平滑 —— 会把峰头抹成一朵云。必须用折线，硬转角。
 *   · 雾不能横着刷一条白带 —— 会变成贯穿全屏的灰条纹。
 *     正确做法是**把山脚溶掉**：从透明渐变到纸色，山自然就消失在雾里。
 *   · 树要成组、有高矮疏密，单棵细竿像天线。
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;

  const PAPER = '#efe8d8';
  const M_FAR = '#c3bcab';
  const M_MID = '#8f8877';
  const M_NEAR = '#4a453a';
  const M_DARK = '#2b2721';

  /** 折线山体（硬转角，不做平滑） */
  function massif(c, pts, fill, alpha) {
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = fill;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.lineTo(pts[pts.length - 1][0], V.H + 60);
    c.lineTo(pts[0][0], V.H + 60);
    c.closePath();
    c.fill();
    c.restore();
  }

  /** 把山脚溶进雾里：从透明渐变到纸色 */
  function dissolve(c, yTop, yBot) {
    const g = c.createLinearGradient(0, yTop, 0, yBot);
    g.addColorStop(0, V.rgba(PAPER, 0));
    g.addColorStop(0.55, V.rgba(PAPER, 0.45));
    g.addColorStop(1, V.rgba(PAPER, 1));
    c.save();
    c.fillStyle = g;
    c.fillRect(0, yTop, V.W, yBot - yTop);
    c.restore();
  }

  /** 皴：短促斜笔，密在暗部 */
  function cun(c, rnd, x0, y0, x1, y1, n, color, alpha, tilt) {
    c.save();
    c.strokeStyle = color;
    c.lineCap = 'round';
    const k = tilt == null ? 0.45 : tilt;
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * rnd();
      const y = y0 + (y1 - y0) * rnd();
      const len = 7 + rnd() * 24;
      c.globalAlpha = alpha * (0.2 + rnd() * 0.8);
      c.lineWidth = 0.7 + rnd() * 2.2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + len * k, y + len * (0.75 + rnd() * 0.5));
      c.stroke();
    }
    c.restore();
  }

  /** 一丛松：两三棵一组，高矮错开 */
  function grove(c, rnd, x, y, h, n) {
    for (let i = 0; i < n; i++) {
      const px = x + (i - (n - 1) / 2) * h * 0.42 + rnd.gauss() * h * 0.08;
      const ph = h * (0.62 + rnd() * 0.55);
      const py = y + rnd.gauss() * h * 0.12;
      c.save();
      c.globalAlpha = 0.55 + rnd() * 0.4;
      c.strokeStyle = M_DARK;
      c.lineCap = 'round';
      c.lineWidth = Math.max(1.1, ph * 0.035);
      c.beginPath();
      c.moveTo(px, py);
      c.quadraticCurveTo(px + ph * 0.05, py - ph * 0.55, px + ph * 0.01, py - ph);
      c.stroke();
      // 针叶：一串短横，越往上越短
      for (let j = 0; j < 6; j++) {
        const yy = py - ph * (0.26 + j * 0.125);
        const w = ph * (0.30 - j * 0.035);
        c.lineWidth = Math.max(0.8, ph * 0.022);
        c.beginPath();
        c.moveTo(px + ph * 0.01, yy);
        c.lineTo(px - w, yy - ph * 0.02);
        c.moveTo(px + ph * 0.01, yy);
        c.lineTo(px + w, yy - ph * 0.03);
        c.stroke();
      }
      c.restore();
    }
  }

  S.song = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const dur = meta.dur || 8;

      const baked = V.layer.bake2d('song:base', (g) => {
        const c = g.drawingContext;
        const W = g.width, H = g.height;
        V.paper.paint(c, W, H, 'xuan', 1007);
        const rnd = V.rng(505);

        // 天色：上暖下沉
        const sky = c.createLinearGradient(0, 0, 0, 720);
        sky.addColorStop(0, 'rgba(222,209,186,0.60)');
        sky.addColorStop(1, 'rgba(222,209,186,0)');
        c.fillStyle = sky;
        c.fillRect(0, 0, W, 720);

        // ---- 极远：一层淡影，只交代"后面还有山" ----
        c.save();
        c.globalAlpha = 0.34;
        c.fillStyle = M_FAR;
        c.beginPath();
        c.moveTo(-40, 420);
        for (let i = 0; i <= 16; i++) {
          const x = -40 + i * 128;
          c.lineTo(x, 420 - Math.abs(Math.sin(i * 1.37 + 0.6)) * 86 - (i % 3) * 14);
        }
        c.lineTo(2000, 640);
        c.lineTo(-40, 640);
        c.closePath();
        c.fill();
        c.restore();

        // ---- 主峰：大到出画。只露一段山腰，下缘斜切进雾里 ----
        // 不画山脚 —— 一整条水平山脚会把画面切成两半，也会变成一条横贯全屏的色带。
        const flank = [
          [-60, 900], [-60, 300], [60, 236], [150, 262], [236, 190], [318, 214],
          [402, 150], [486, 176], [560, 126], [640, 158], [706, 118], [780, 168],
          [846, 214], [902, 286], [946, 372], [988, 448], [1024, 512], [1064, 560],
          [1108, 604], [1152, 646], [1200, 700], [1246, 760], [1300, 820],
          [1300, 900],
        ];
        c.save();
        c.globalAlpha = 1;
        c.fillStyle = M_DARK;
        c.beginPath();
        c.moveTo(flank[0][0], flank[0][1]);
        for (let i = 1; i < flank.length; i++) c.lineTo(flank[i][0], flank[i][1]);
        c.closePath();
        c.fill();
        c.restore();

        // 山腰的受光面：整片提亮一档，位置固定在右上坡
        c.save();
        c.globalAlpha = 0.30;
        c.fillStyle = M_MID;
        c.beginPath();
        c.moveTo(560, 126); c.lineTo(640, 158); c.lineTo(706, 118); c.lineTo(780, 168);
        c.lineTo(846, 214); c.lineTo(902, 286); c.lineTo(946, 372);
        c.lineTo(860, 420); c.lineTo(760, 330); c.lineTo(660, 240); c.closePath();
        c.fill();
        c.restore();

        // 皴：沿坡向下，暗部密
        cun(c, rnd, 60, 150, 560, 560, 380, '#100e0b', 0.46, 0.34);
        cun(c, rnd, 380, 200, 900, 620, 260, '#100e0b', 0.34, 0.40);
        cun(c, rnd, 900, 460, 1260, 800, 150, '#100e0b', 0.26, 0.46);


        // ---- 主峰与右峰之间的瀑布，在雾里断掉 ----
        const fx = 968, fy = 372;
        const fall = c.createLinearGradient(0, fy, 0, 700);
        fall.addColorStop(0, 'rgba(250,246,236,0.95)');
        fall.addColorStop(0.7, 'rgba(250,246,236,0.50)');
        fall.addColorStop(1, 'rgba(250,246,236,0)');
        c.save();
        c.fillStyle = fall;
        const fr = V.rng(404);
        c.beginPath();
        c.moveTo(fx - 7, fy);
        // 两侧都带细微摆动，直边梯形会像一条水泥滑道
        for (let i = 1; i <= 5; i++) {
          const yy = fy + ((700 - fy) * i) / 5;
          c.lineTo(fx - 7 - i * 1.7 + (fr() - 0.5) * 5, yy);
        }
        for (let i = 5; i >= 0; i--) {
          const yy = fy + ((700 - fy) * i) / 5;
          c.lineTo(fx + 8 + i * 1.7 + (fr() - 0.5) * 5, yy);
        }
        c.closePath();
        c.fill();
        c.restore();

        // ---- 右峰：矮一截，压在主峰之后 ----
        c.save();
        c.globalAlpha = 0.48;
        c.fillStyle = M_MID;
        c.beginPath();
        c.moveTo(1330, 900);
        c.lineTo(1360, 700); c.lineTo(1404, 620); c.lineTo(1440, 540);
        c.lineTo(1490, 500); c.lineTo(1524, 528); c.lineTo(1568, 566);
        c.lineTo(1618, 610); c.lineTo(1680, 660); c.lineTo(1760, 720);
        c.lineTo(1860, 790); c.lineTo(1960, 860); c.lineTo(1980, 900);
        c.closePath();
        c.fill();
        c.restore();

        // 山脚一起溶进雾（只溶最后一小段，不要整条横带）
        dissolve(c, 640, 812);

        // ---- 近景：松树长在路肩上 ----
        grove(c, V.rng(31), 96, 762, 168, 3);
        grove(c, V.rng(32), 286, 766, 116, 2);
        grove(c, V.rng(33), 1832, 762, 152, 3);
        grove(c, V.rng(34), 1688, 766, 104, 2);
        grove(c, V.rng(35), 1524, 768, 86, 2);

        // 细颗粒抖动：大片平涂在 8-bit + h264 下会压出横向色阶，
        // 撒一层 ±3% 的噪点就能打散（这不是"质感"，是抗带）
        const gr = V.rng(991);
        for (let i = 0; i < 9000; i++) {
          const gx = gr() * W, gy = gr() * H;
          c.fillStyle = gr() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)';
          c.fillRect(gx, gy, 1.6, 1.6);
        }

        // 路肩的草丛：三两根短线一组，沿路稀疏排开
        const tg = V.rng(77);
        for (let i = 0; i < 90; i++) {
          const gx = tg() * W;
          const gy = 742 + tg() * 20;
          c.save();
          c.strokeStyle = 'rgba(46,42,34,0.55)';
          c.lineWidth = 1.1;
          for (let k = 0; k < 3; k++) {
            c.beginPath();
            c.moveTo(gx + k * 3, gy);
            c.quadraticCurveTo(gx + k * 5 - 4, gy - 9 - tg() * 6, gx + k * 7 - 9, gy - 16 - tg() * 10);
            c.stroke();
          }
          c.restore();
        }

        V.paper.innerShadow(c, W, H, 0.10, 130);
      }, { w: V.W, h: V.H });

      // ---------------- 镜头 ----------------
      const push = V.ease.inOutCubic(V.clamp((u - 2.0) / 3.2));
      // 推镜不能把山推没了：1.95 倍时可见高度只有 513 单位，画面里只剩地面。
      // 1.72 倍 + 把镜头压在 690，山脚、路、骑手刚好同框，骑手落在下三分之一。
      const cam = {
        x: V.lerp(V.STAGE * 0.5, V.RIDER_X + 160, push),
        y: V.lerp(V.STAGE * 0.5, 690, push),
        zoom: V.lerp(0.96, 1.72, push),
      };

      // 远景只做轻微视差（整块放大会糊成一团）
      ctx.save();
      ctx.translate(960, 540);
      ctx.scale(1 + push * 0.14, 1 + push * 0.14);
      ctx.translate(-960, -540);
      ctx.drawImage(baked.canvas, 0, 0);
      ctx.restore();

      // 漂移的雾：用**椭圆径向渐变**，四边都羽化。
      // 早先用横向线性渐变铺 rect，左右是软的、上下是硬的 ——
      // 于是山体上出现三条边缘笔直的横带，看着像色阶断层。
      for (let i = 0; i < 3; i++) {
        const y = 486 + i * 76;
        const cx = (((t * (7 + i * 3)) % 2600) + 2600) % 2600 - 340;
        ctx.save();
        ctx.translate(cx, y);
        ctx.scale(2.6, 0.34);
        const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, 330);
        gg.addColorStop(0, `rgba(246,240,228,${0.34 - i * 0.07})`);
        gg.addColorStop(0.55, `rgba(246,240,228,${0.16 - i * 0.04})`);
        gg.addColorStop(1, 'rgba(246,240,228,0)');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(0, 0, 330, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      V.enterCam(ctx, cam);
      B.drawRoad(ctx, t, { color: '#c6bda8', depth: 74, grain: 0.85, speed: 0.8 });
      B.drawRider(ctx, t, {
        scale: 0.30,
        shadow: true,
        shadowStyle: { alpha: 0.08, color: '#2a2622' },
        pelicanStyle: {
          body: '#f1ebdd', bodyShade: '#e0d7c3', line: '#2b2720',
          beak: '#c9a35c', beakDark: '#a07f3e', pouch: '#b98a52', pouchShade: '#96703f',
          leg: '#a8813f', eye: '#2b2720', lw: 1.8, feather: 0.25,
        },
        bikeStyle: {
          frame: '#3a352c', frameDark: '#2a2620', tire: '#2a2620', rim: '#6a6355',
          spoke: '#8a8375', saddle: '#2a2620', lw: 1.2, tubeW: 2.4, spokes: 8, shine: 0,
        },
      });
      V.exitCam(ctx);

      V.titles.draw(ctx, 'vertical', meta.strings, u, V.titles.opts('song', { dur }));
    },
  };
})();
