/* scenes/mughal.js — 08 莫卧儿细密画（48 – 54 s，3 小节）
 *
 * 时代规矩：
 *   · 画幅外面还有一圈**画出来的边**（金藤 + 花），那是作品的一部分，不是装裱；
 *   · 构图对称、层次分明：天、远山、花园、水渠，一层压一层，每层都有金边；
 *   · 颜色是宝石色：青金石蓝、朱砂红、祖母绿、金、象牙 —— 平涂，但极精细；
 *   · 柏树是这路画里的标准件：瘦高、深绿、成对站在水渠两边；
 *   · 水渠一定画倒影。
 *
 * 梗：**倒影不跟着走**。第 2 小节鹈鹕停了半拍，水里的那一只还在蹬。
 *
 *   ① 0 – 2   花园展开，柏树成对退去，倒影跟着
 *   ② 2 – 4   鹈鹕停半拍，倒影继续蹬（错开）
 *   ③ 4 – 6   重新对上，继续走
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;

  const LAPIS = '#2b4a7d';
  const GOLD = '#c9a227';
  const GOLD_L = '#e8c86a';
  const CRIMSON = '#a52a2a';
  const EMERALD = '#2f6b4f';
  const IVORY = '#f2e8d0';
  const ROSE = '#c98a9a';

  /** 金线 */
  function gilt(c, w, col) {
    c.strokeStyle = col || GOLD;
    c.lineWidth = w || 1.6;
    c.lineCap = 'round';
    c.lineJoin = 'round';
  }

  /** 一朵小花：五个花瓣 + 一点花心 */
  function flower(c, x, y, r, petal, core) {
    c.save();
    c.fillStyle = petal;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      c.beginPath();
      c.ellipse(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62,
        r * 0.44, r * 0.30, a, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = core || GOLD_L;
    c.beginPath();
    c.arc(x, y, r * 0.26, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  /** 金藤边：四条边 + 四角花 */
  function illuminatedBorder(c, W, H, w) {
    c.save();
    // 底色：青金石
    c.fillStyle = LAPIS;
    c.fillRect(0, 0, W, w);
    c.fillRect(0, H - w, W, w);
    c.fillRect(0, 0, w, H);
    c.fillRect(W - w, 0, w, H);
    // 内外金线
    gilt(c, 3.0, GOLD);
    c.strokeRect(w * 0.30, w * 0.30, W - w * 0.6, H - w * 0.6);
    c.strokeRect(w * 0.78, w * 0.78, W - w * 1.56, H - w * 1.56);
    c.restore();

    // 藤：沿每条边画波浪 + 花
    const step = 92;
    const drawVine = (x0, y0, dx, dy, len) => {
      c.save();
      gilt(c, 1.8, GOLD_L);
      c.beginPath();
      for (let t = 0; t <= len; t += 8) {
        const px = x0 + dx * t;
        const py = y0 + dy * t;
        const off = Math.sin(t * 0.028) * w * 0.16;
        if (t === 0) c.moveTo(px + (dy !== 0 ? off : 0), py + (dx !== 0 ? off : 0));
        else c.lineTo(px + (dy !== 0 ? off : 0), py + (dx !== 0 ? off : 0));
      }
      c.stroke();
      c.restore();
      // 花：隔一段一朵
      for (let t = step * 0.5; t < len; t += step) {
        const px = x0 + dx * t + (dy !== 0 ? Math.sin(t * 0.028) * w * 0.16 : 0);
        const py = y0 + dy * t + (dx !== 0 ? Math.sin(t * 0.028) * w * 0.16 : 0);
        flower(c, px, py, w * 0.17, t % (step * 2) < step ? ROSE : IVORY, GOLD);
        // 叶片
        c.save();
        c.fillStyle = EMERALD;
        c.beginPath();
        c.ellipse(px + 14, py + 10, 9, 4.5, 0.6, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    };
    drawVine(w * 0.5, w * 0.5, 1, 0, W - w);
    drawVine(w * 0.5, H - w * 0.5, 1, 0, W - w);
    drawVine(w * 0.5, w * 0.5, 0, 1, H - w);
    drawVine(W - w * 0.5, w * 0.5, 0, 1, H - w);

    // 四角的老鼠簕（伊斯兰装帧的角花）
    for (const [cx, cy] of [[w, w], [W - w, w], [w, H - w], [W - w, H - w]]) {
      c.save();
      gilt(c, 2.0, GOLD);
      c.beginPath();
      c.moveTo(cx - w * 0.5, cy - w * 0.5);
      c.quadraticCurveTo(cx + w * 0.2, cy - w * 0.1, cx - w * 0.1, cy + w * 0.2);
      c.stroke();
      flower(c, cx, cy, w * 0.22, CRIMSON, GOLD_L);
      c.restore();
    }
  }

  /** 柏树：瘦高、深绿、一笔到尾 */
  function cypress(c, x, baseY, h, rnd) {
    const w = h * 0.13;
    c.save();
    c.fillStyle = EMERALD;
    c.beginPath();
    c.moveTo(x, baseY);
    c.quadraticCurveTo(x - w, baseY - h * 0.45, x, baseY - h);
    c.quadraticCurveTo(x + w, baseY - h * 0.45, x, baseY);
    c.closePath();
    c.fill();
    // 金边 + 竖纹
    c.strokeStyle = GOLD;
    c.lineWidth = 1.2;
    c.stroke();
    c.strokeStyle = 'rgba(15,40,28,0.5)';
    c.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      c.beginPath();
      c.moveTo(x, baseY - h * t * 0.95);
      c.lineTo(x + (rnd() - 0.5) * w * 0.6, baseY - h * t * 0.6);
      c.stroke();
    }
    c.restore();
  }

  /** 远山：一层层的平色带 + 金边（细密画的山就是这样摞起来的） */
  function hills(c, W, y, h, col, seed) {
    const rnd = V.rng(seed || 5);
    c.save();
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, y + h);
    let x = 0;
    while (x < W + 80) {
      const peak = y + rnd() * h * 0.5;
      const span = 90 + rnd() * 120;
      c.quadraticCurveTo(x + span * 0.5, peak, x + span, y + h * 0.55 + rnd() * h * 0.3);
      x += span;
    }
    c.lineTo(W, y + h);
    c.closePath();
    c.fill();
    c.strokeStyle = GOLD;
    c.lineWidth = 1.6;
    c.stroke();
    c.restore();
  }

  S.mughal = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const cam = meta.cam || V.camDefault();
      const BW = 92;                       // 边框宽

      const baked = V.layer.bake2d('mughal:base', (g) => {
        const c = g.drawingContext;
        const W = g.width, H = g.height;
        V.paper.paint(c, W, H, 'washi', 808);
        const rnd = V.rng(808);

        const picL = BW, picR = W - BW, picT = BW, picB = H - BW;

        // ================= 画面内 =================
        c.save();
        c.beginPath();
        c.rect(picL, picT, picR - picL, picB - picT);
        c.clip();

        // 天：从青金到象牙的渐变，压一层金
        const sky = c.createLinearGradient(0, picT, 0, picT + 300);
        sky.addColorStop(0, '#3d5f92');
        sky.addColorStop(0.55, '#7d94b4');
        sky.addColorStop(1, '#d8cba6');
        c.fillStyle = sky;
        c.fillRect(picL, picT, picR - picL, 320);
        // 金色的云（细密画的云是卷成团的）
        for (let i = 0; i < 9; i++) {
          const cx = picL + rnd() * (picR - picL);
          const cy = picT + 40 + rnd() * 130;
          c.save();
          c.strokeStyle = GOLD_L;
          c.lineWidth = 1.4;
          for (let k = 0; k < 3; k++) {
            c.beginPath();
            c.arc(cx + k * 13, cy - k * 5, 16 - k * 3, 0.4, Math.PI * 1.7);
            c.stroke();
          }
          c.restore();
        }

        // 远山三层
        hills(c, W, picT + 210, 110, '#6d7f9a', 11);
        hills(c, W, picT + 262, 96, '#7f8f7a', 12);
        hills(c, W, picT + 306, 84, '#8a9b78', 13);

        // ================= 花园 =================
        // 草地
        const lawn = c.createLinearGradient(0, picT + 350, 0, picB);
        lawn.addColorStop(0, '#7f9b6a');
        lawn.addColorStop(1, '#5f7d52');
        c.fillStyle = lawn;
        c.fillRect(picL, picT + 350, picR - picL, picB - picT - 350);

        // 大理石台基：骑手走在上面（细密画里的平台一定是白石 + 金线）
        const chanY = Math.round(V.ROAD_Y * V.U) - 9;
        c.fillStyle = '#efe6d2';
        c.fillRect(picL, chanY - 10, picR - picL, 118);
        // 石缝
        c.save();
        c.strokeStyle = 'rgba(160,146,116,0.55)';
        c.lineWidth = 1.1;
        for (let x = picL; x < picR; x += 74) {
          c.beginPath(); c.moveTo(x, chanY - 10); c.lineTo(x, chanY + 108); c.stroke();
        }
        for (const yy of [chanY + 34, chanY + 74]) {
          c.beginPath(); c.moveTo(picL, yy); c.lineTo(picR, yy); c.stroke();
        }
        c.restore();
        // 台基上下两道金线
        c.save();
        gilt(c, 2.4, GOLD);
        c.beginPath(); c.moveTo(picL, chanY - 10); c.lineTo(picR, chanY - 10); c.stroke();
        c.beginPath(); c.moveTo(picL, chanY + 108); c.lineTo(picR, chanY + 108); c.stroke();
        c.restore();
        // 栏杆：一排小瓶柱
        c.save();
        for (let x = picL + 12; x < picR; x += 46) {
          c.fillStyle = '#f7f0dd';
          c.strokeStyle = GOLD;
          c.lineWidth = 1.1;
          c.beginPath();
          c.moveTo(x - 6, chanY + 108);
          c.quadraticCurveTo(x - 9, chanY + 84, x - 4, chanY + 74);
          c.lineTo(x + 4, chanY + 74);
          c.quadraticCurveTo(x + 9, chanY + 84, x + 6, chanY + 108);
          c.closePath();
          c.fill();
          c.stroke();
        }
        c.restore();

        // 台基下方：一条花圃（画框内只剩这一条）
        for (let x = picL + 30; x < picR - 20; x += 52) {
          flower(c, x, chanY + 140, 9 + rnd() * 5, rnd() > 0.5 ? ROSE : IVORY, GOLD);
        }
        // 远处花圃
        for (let x = picL + 30; x < picR - 20; x += 58) {
          flower(c, x, chanY - 70, 8 + rnd() * 5, rnd() > 0.5 ? IVORY : CRIMSON, GOLD);
        }


        // 几何花坛：chahar bagh 的核心就是"把花园切成方块"
        for (let row = 0; row < 2; row++) {
          const by = picT + 372 + row * 118;
          for (let x = picL + 60; x < picR - 60; x += 246) {
            const bw = 168, bh = 84;
            c.save();
            c.fillStyle = row ? '#55743f' : '#5f7f48';
            c.fillRect(x, by, bw, bh);
            gilt(c, 2.0, GOLD);
            c.strokeRect(x, by, bw, bh);
            c.strokeStyle = 'rgba(165,42,42,0.55)';
            c.lineWidth = 1.4;
            c.strokeRect(x + 6, by + 6, bw - 12, bh - 12);
            // 里面的斜格
            c.strokeStyle = 'rgba(201,162,39,0.45)';
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(x, by + bh); c.lineTo(x + bw, by);
            c.moveTo(x, by); c.lineTo(x + bw, by + bh);
            c.stroke();
            c.restore();
            // 四个角上各一朵花
            for (const [dx, dy] of [[10, 12], [bw - 10, 12], [10, bh - 12], [bw - 10, bh - 12]]) {
              flower(c, x + dx, by + dy, 7, ROSE, GOLD_L);
            }
          }
        }

        // 柏树：成对，站在台基两侧
        for (let x = picL + 90; x < picR; x += 230) {
          cypress(c, x, chanY - 26, 330, rnd);
          cypress(c, x + 54, chanY - 26, 268, rnd);
        }

        // 廷臣：细密画讲等级，最重要的人画得最大 —— 这些小人只有一指高
        for (let i = 0; i < 14; i++) {
          const fx = picL + 40 + rnd() * (picR - picL - 80);
          const fy = chanY - 24 - rnd() * 90;
          const fh = 34 + rnd() * 12;
          c.save();
          c.strokeStyle = '#2a2a22';
          c.fillStyle = rnd() > 0.55 ? CRIMSON : LAPIS;
          c.lineWidth = 2.0;
          c.lineCap = 'round';
          // 头
          c.beginPath();
          c.arc(fx, fy - fh * 0.86, fh * 0.14, 0, Math.PI * 2);
          c.fill();
          // 袍子
          c.beginPath();
          c.moveTo(fx, fy - fh * 0.72);
          c.lineTo(fx, fy - fh * 0.18);
          c.stroke();
          // 腿
          c.beginPath();
          c.moveTo(fx, fy - fh * 0.18);
          c.lineTo(fx - fh * 0.10, fy);
          c.moveTo(fx, fy - fh * 0.18);
          c.lineTo(fx + fh * 0.10, fy);
          c.stroke();
          c.restore();
        }

        c.restore();

        // ================= 题名位置留白（题名由 titles 画） =================

        // ================= 边框 =================
        illuminatedBorder(c, W, H, BW);

        V.paper.innerShadow(c, W, H, 0.10, 120);
      }, { w: V.W, h: V.H });

      ctx.drawImage(baked.canvas, 0, 0);

      // ---------------- 动态层 ----------------
      V.enterCam(ctx, cam);

      const chanY = Math.round(V.ROAD_Y * V.U) - 9;
      // 第 2 小节：鹈鹕停半拍；倒影照常走 —— 这是这格的梗
      const stall = V.envelope(u, 1.7, 2.0, 2.9, 3.2);
      const riderU = u;

      // 本体
      B.drawRider(ctx, riderU, {
        scale: 1.0,
        shadow: true,
        shadowStyle: { alpha: 0.16, color: '#2b4a7d' },
        pelicanStyle: {
          body: '#f7f1e2', bodyShade: '#e6dcc4', line: '#1d3350',
          beak: GOLD, beakDark: '#8f6d18', pouch: CRIMSON, pouchShade: '#7d1f1f',
          leg: CRIMSON, eye: '#1d3350', lw: 2.2, feather: 0, eyeStyle: 'dot',
        },
        bikeStyle: {
          frame: '#1d3350', frameDark: '#1d3350', tire: '#1d3350', rim: '#1d3350',
          spoke: 'rgba(29,51,80,0.75)', saddle: '#1d3350', lw: 2.0, tubeW: 2.8, spokes: 12, shine: 0,
        },
      });

      V.exitCam(ctx);

      V.titles.draw(ctx, 'plaque', meta.strings, u, V.titles.opts('mughal', { dur: meta.dur }));
    },
  };
})();
