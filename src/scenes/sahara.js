/* scenes/sahara.js — 01 撒哈拉岩画（6 – 12 s，3 小节）
 *
 * 时代规矩：岩画没有透视、没有轮子、没有个体 —— 同一个侧影用同一个模子反复按。
 * 梗：整面岩壁上是一排一模一样的"鹈鹕骑车"，间距精确得像盖章；
 *     第 2 小节画家又在它旁边补按了一下，两只是同一个模子 —— 它并不特别。
 *
 *   ① 0 – 2   岩壁立起来，骑手从左外进入，右侧已经有一排先祖
 *   ② 2 – 4   旁边多按了一模一样的第二只（淡入、微微右移、再淡出）
 *   ③ 4 – 6   那一排向远处收小，骑手朝下一个画框去
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;

  // 两种颜料：身体深到近乎黑，喙和袋用浅赭（像高岭土）。
  // 试过全身一色 —— 头和身体糊成一团，读不出是只鸟；只有喙部反相才认得出鹈鹕。
  // 撒哈拉岩画用的是红赭（氧化铁），不是黑。全身一色会糊成一团，
  // 只有让喙和袋浅一档、轮廓再深一档，才既像岩画又认得出是鹈鹕。
  const OCHRE = {
    body: '#8a3a18', bodyShade: '#7a3114', line: '#4e1e08',
    beak: '#c98a4e', beakDark: '#a86a34', pouch: '#b3743a', pouchShade: '#96592a',
    leg: '#7a3114', eye: '#4e1e08', lw: 2.6, feather: 0, eyeStyle: 'dot',
  };
  /** 岩画没有细辐条：一个粗圈 + 五根棍，管线也是粗的。 */
  const BIKE = {
    frame: '#5e240c', frameDark: '#5e240c', tire: '#5e240c', rim: '#5e240c',
    spoke: '#5e240c', saddle: '#5e240c', lw: 4.6, tubeW: 8, spokes: 6, shine: 0,
  };

  const SP = 500;          // 岩壁上"盖章"的间距

  /** 侧面剪影：和主角共用同一个 rig.pose，所以完全一样。 */
  function stamped(ctx, t, x, y, scale, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    B.drawRider(ctx, t, {
      x, y, scale, shadow: false,
      pelicanStyle: OCHRE,
      bikeStyle: BIKE,
    });
    ctx.restore();
  }

  S.sahara = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const cam = meta.cam || V.camDefault();

      // ---------------- 静态层：岩壁 ----------------
      const baked = V.layer.bake2d('sahara:base', (g) => {
        const c = g.drawingContext;
        const W = g.width, H = g.height;
        V.paper.paint(c, W, H, 'rock', 4001);

        const rnd = V.rng(77);
        const K = V.ink;

        // ---------- 1 岩壁的"体"：不是一块平面，是起伏的石面 ----------
        // 做法：先用罩染压出大的明暗（凸起受光、凹陷背光），再补裂缝和剥落。
        // 上一版只画了层理和石孔 —— 全是纹理没有体积，看着像一张砂纸。
        const bulges = [
          // x, y, rx, ry, 明暗（正=暗/凹，负=亮/凸）
          [0.18, 0.24, 0.20, 0.15, -0.20],
          [0.46, 0.16, 0.24, 0.12, 0.22],
          [0.74, 0.30, 0.22, 0.18, -0.18],
          [0.30, 0.55, 0.26, 0.16, 0.20],
          [0.62, 0.62, 0.30, 0.14, -0.16],
          [0.88, 0.66, 0.20, 0.16, 0.18],
          [0.10, 0.78, 0.22, 0.12, 0.16],
          [0.52, 0.40, 0.16, 0.10, -0.14],
        ];
        for (const b of bulges) {
          const cx = b[0] * W, cy = b[1] * H;
          const rx = b[2] * W, ry = b[3] * H;
          const dark = b[4] > 0;
          c.save();
          c.translate(cx, cy);
          c.scale(1, ry / rx);
          const gg = c.createRadialGradient(0, 0, 0, 0, 0, rx);
          const col = dark ? '42,20,8' : '255,226,186';
          gg.addColorStop(0, `rgba(${col},${Math.abs(b[4])})`);
          gg.addColorStop(0.6, `rgba(${col},${Math.abs(b[4]) * 0.45})`);
          gg.addColorStop(1, `rgba(${col},0)`);
          c.fillStyle = gg;
          c.beginPath();
          c.arc(0, 0, rx, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }

        // ---------- 2 露岩：石皮磨掉的地方比周围浅，但**没有硬边** ----------
        // 上一版画成多边形色块 + 描边，像贴了一张张纸片。
        // 真岩石皮剥落是渐变的，只在最外缘留一道很薄的暗线。
        for (let i = 0; i < 5; i++) {
          const px = rnd.range(120, W - 120);
          const py = rnd.range(90, H * 0.66);
          const pr = rnd.range(90, 210);
          c.save();
          c.translate(px, py);
          c.scale(1, 0.62);
          const gg = c.createRadialGradient(0, 0, pr * 0.15, 0, 0, pr);
          gg.addColorStop(0, 'rgba(238,196,150,0.34)');
          gg.addColorStop(0.62, 'rgba(230,186,140,0.18)');
          gg.addColorStop(1, 'rgba(230,186,140,0)');
          c.fillStyle = gg;
          c.beginPath();
          c.arc(0, 0, pr, 0, Math.PI * 2);
          c.fill();
          c.restore();
          // 薄边：一段不闭合的弧，粗细不匀
          c.save();
          c.strokeStyle = 'rgba(52,20,6,0.34)';
          c.lineCap = 'round';
          const a0 = rnd() * Math.PI * 2;
          const span = 1.6 + rnd() * 2.4;
          for (let q = 0; q < 16; q++) {
            const t0 = a0 + (q / 16) * span;
            const t1 = a0 + ((q + 1) / 16) * span;
            c.globalAlpha = 0.16 + rnd() * 0.24;
            c.lineWidth = 1.2 + rnd() * 2.2;
            c.beginPath();
            c.moveTo(px + Math.cos(t0) * pr * 0.92, py + Math.sin(t0) * pr * 0.60);
            c.lineTo(px + Math.cos(t1) * pr * 0.94, py + Math.sin(t1) * pr * 0.61);
            c.stroke();
          }
          c.restore();
        }

        // ---------- 3 层理 ----------
        for (let i = 0; i < 6; i++) {
          const y0 = 96 + i * 152 + rnd.gauss() * 20;
          const amp = 12 + rnd() * 20;
          const ph = rnd() * 6.28;
          const tone = i % 2 ? '#7c4a22' : '#d8a878';
          c.save();
          c.globalAlpha = 0.07 + rnd() * 0.07;
          c.fillStyle = tone;
          c.beginPath();
          c.moveTo(-40, y0);
          for (let x = -40; x <= W + 40; x += 56) c.lineTo(x, y0 + Math.sin(x * 0.0028 + ph) * amp);
          c.lineTo(W + 40, y0 + 30 + amp);
          for (let x = W + 40; x >= -40; x -= 56) c.lineTo(x, y0 + 30 + Math.sin(x * 0.0028 + ph) * amp);
          c.closePath();
          c.fill();
          c.restore();
        }

        // ---------- 4 裂缝：随机游走 + 分叉，深浅两层 ----------
        for (let i = 0; i < 10; i++) {
          let x = rnd.range(0, W), y = rnd.range(0, H * 0.8);
          let ang = rnd.range(-0.4, 0.4) + (rnd() > 0.5 ? 0.2 : Math.PI / 2);
          const seg = rnd.int(16, 34);
          const path = [[x, y]];
          for (let k = 0; k < seg; k++) {
            ang += rnd.gauss() * 0.38;
            x += Math.cos(ang) * 24;
            y += Math.sin(ang) * 24;
            path.push([x, y]);
          }
          c.save();
          c.strokeStyle = 'rgba(36,14,4,0.40)';
          c.lineWidth = 1.0 + rnd() * 1.8;
          c.lineCap = 'round';
          K.path(c, path, false);
          c.stroke();
          // 裂缝右侧一道高光，裂缝才有深度
          c.strokeStyle = 'rgba(255,222,180,0.16)';
          c.lineWidth = 1.4;
          K.path(c, path.map((q) => [q[0] + 2.2, q[1] + 1.6]), false);
          c.stroke();
          c.restore();
        }

        // ---------- 5 石孔与颗粒 ----------
        for (let i = 0; i < 900; i++) {
          const x = rnd.range(0, W), y = rnd.range(0, H);
          c.fillStyle = rnd() > 0.5 ? 'rgba(64,28,10,0.15)' : 'rgba(255,232,196,0.14)';
          c.beginPath();
          c.arc(x, y, rnd.range(0.6, 3.0), 0, Math.PI * 2);
          c.fill();
        }

        // ---------- 6 手印 ----------
        handStencil(c, 196, 300, 1.5, -0.22, V.rng(11));
        handStencil(c, 1648, 392, 1.32, 0.16, V.rng(12));
        handStencil(c, 806, 132, 1.1, -0.06, V.rng(13));

        // ---------- 7 岩檐 + 贴地暗部 ----------
        const lip = c.createLinearGradient(0, 0, 0, 320);
        lip.addColorStop(0, 'rgba(20,8,2,0.66)');
        lip.addColorStop(0.5, 'rgba(20,8,2,0.20)');
        lip.addColorStop(1, 'rgba(20,8,2,0)');
        c.fillStyle = lip;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        c.lineTo(W, 230);
        for (let x = W; x >= 0; x -= 72) c.lineTo(x, 230 + Math.sin(x * 0.0042 + 1.7) * 36);
        c.closePath();
        c.fill();

        // 颗粒：把前面所有平滑的东西打碎，岩面才有砂砾感
        const gr = V.rng(4411);
        for (let i = 0; i < 26000; i++) {
          const gx = gr() * W, gy = gr() * H;
          const lite = gr() > 0.5;
          c.fillStyle = lite ? 'rgba(255,228,190,0.055)' : 'rgba(60,24,8,0.055)';
          c.fillRect(gx, gy, 1.4 + gr() * 1.6, 1.4 + gr() * 1.6);
        }

        V.paper.innerShadow(c, W, H, 0.20, 150);
      }, { w: V.W, h: V.H });

      ctx.drawImage(baked.canvas, 0, 0);

      // ---------------- 动态层 ----------------
      V.enterCam(ctx, cam);

      // 岩棚下的尘土
      B.drawRoad(ctx, t, { color: '#b07a48', depth: 150, grain: 1.9 });

      const shift = (t * B.ROAD_SPEED) % SP;

      // ---- 那排"模子"：画在骑手之前，永远在它身后 ----
      const herd = V.clamp((u - 0.15) / 1.5);
      const shrink = V.clamp((u - 4.0) / 2.0);
      for (let k = 1; k <= 5; k++) {
        const x = V.RIDER_X + k * SP - shift;
        if (x < -300 || x > V.W + 300) continue;
        stamped(ctx, t, x, V.ROAD_Y - 2 + (k % 3) * 3, 0.92 * (1 - shrink * 0.03 * k), 0.45 * herd);
      }

      // ---- 第 2 小节：画家在它旁边又按了一下 ----
      const dup = V.envelope(u, 2.02, 2.34, 3.30, 3.86);
      if (dup > 0.004) {
        const slide = V.ease.outCubic(V.clamp((u - 2.02) / 2.0)) * 26;
        stamped(ctx, t, V.RIDER_X + 86 + slide, V.ROAD_Y - 7, 0.94, 0.80 * dup);
      }

      // ---- 主角 ----
      B.drawRider(ctx, t, {
        scale: 1.02,
        shadow: true,
        shadowStyle: { alpha: 0.10, color: '#3a1a08' },
        pelicanStyle: OCHRE,
        bikeStyle: BIKE,
      });

      V.exitCam(ctx);

      // ---------------- 题名 ----------------
      V.titles.draw(ctx, 'painted', meta.strings, u, V.titles.opts('sahara', { dur: meta.dur }));
    },
  };

  /** 喷绘手印：颜料只喷在手的**外面**。
   *  早先用 Path2D + evenodd 裁剪，结果 inside/outside 反了，手反成了黑的；
   *  直接做点在多边形内的判定最稳。 */
  function handStencil(c, x, y, s, rot, rnd) {
    // 手指要长、要分开，否则手的剪影会是一个连指手套
    const fingers = [
      [-30, -40, 10, 44, -0.38], [-11, -56, 9.5, 50, -0.12], [7, -58, 9.5, 50, 0.05],
      [25, -46, 9, 42, 0.24], [40, -12, 8, 34, 0.72], [-38, 6, 9, 34, -1.12],
    ];
    const zones = [[0, 20, 31, 37, 0]];
    for (const f of fingers) zones.push([f[0], f[1], f[2], f[3], f[4]]);

    const cos = Math.cos(-rot), sin = Math.sin(-rot);
    const inside = (px, py) => {
      // 反旋转回手本身的坐标系
      const rx = (px * cos - py * sin) / s;
      const ry = (px * sin + py * cos) / s;
      for (const z of zones) {
        const dx = rx - z[0], dy = ry - z[1];
        const a = z[4];
        const ux = dx * Math.cos(-a) - dy * Math.sin(-a);
        const uy = dx * Math.sin(-a) + dy * Math.cos(-a);
        if ((ux * ux) / (z[2] * z[2]) + (uy * uy) / (z[3] * z[3]) <= 1) return true;
      }
      return false;
    };

    // 颜料云要**宽**：贴着手的边最浓，往外渐渐散开。
    // 上一版半径只有 46~150 且密度全压在内圈，结果画出来是一圈黑轮廓，不是喷雾。
    for (let i = 0; i < 7000; i++) {
      const a = rnd() * Math.PI * 2;
      const k = Math.pow(rnd(), 0.62);
      const rr = (40 + k * 78) * s;
      const px = Math.cos(a) * rr * 0.94;
      const py = Math.sin(a) * rr * 1.02;
      if (inside(px, py)) continue;
      const near = 1 - Math.min(1, (rr / s - 40) / 72);
      c.fillStyle = `rgba(58,20,8,${(0.06 + near * 0.24) * (0.5 + rnd() * 0.8)})`;
      c.beginPath();
      c.arc(x + px, y + py, (0.55 + rnd() * 3.2) * s, 0, Math.PI * 2);
      c.fill();
    }
  }
})();
