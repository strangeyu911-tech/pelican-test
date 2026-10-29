/* scenes/maya.js — 07 玛雅抄本（42 – 48 s，3 小节）
 *
 * 时代规矩：
 *   · 手风琴折的树皮纸，表面刷一层白石灰，所以底是**奶白**不是黄；
 *   · 颜料只有几种：铁红、烟黑、玛雅蓝、少量赭黄 —— 都是平的，不调不晕；
 *   · 每一页被红黑线切成若干格（compartment），格里放神像、日期柱、字块；
 *   · 数字是"横条 + 圆点"（一点 = 1，一横 = 5），全用红或黑；
 *   · 竖着的折痕是这本东西最认得出的物理特征。
 *
 * 梗：**它的旅程只是一行日期**。骑手头顶挂着一组横条圆点，一路骑一路往上跳 ——
 *     在抄本里，它不是一个角色，是一个计数。
 *
 *   ① 0 – 2   折痕压出，红框与字块立起来，日期从 1 开始
 *   ② 2 – 4   骑手穿过第一道折痕（折痕上有阴影带）
 *   ③ 4 – 6   日期跳到 13，继续往右
 */

(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;

  const CREAM = '#efe6cf';
  const RED = '#b03a2e';
  const BLACK = '#1a1512';
  const BLUE = '#2f6f8f';
  const OCHRE = '#c08a2e';

  /** 玛雅数字：一点 = 1，一横 = 5。n 在 1..19 */
  function barDot(c, x, y, n, s, col) {
    const bars = Math.floor(n / 5);
    const dots = n % 5;
    c.save();
    c.fillStyle = col || RED;
    // 横条从下往上叠
    for (let i = 0; i < bars; i++) {
      const by = y - i * s * 0.34;
      c.beginPath();
      c.roundRect(x - s * 0.5, by - s * 0.16, s, s * 0.17, s * 0.08);
      c.fill();
    }
    // 圆点在最上面一排
    const dotY = y - bars * s * 0.34 - s * 0.26;
    for (let i = 0; i < dots; i++) {
      const dx = (i - (dots - 1) / 2) * s * 0.30;
      c.beginPath();
      c.arc(x + dx, dotY, s * 0.10, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  /** 字块：圆角方框 + 里面两三笔抽象符号 */
  function glyphBlock(c, x, y, w, h, seed) {
    const rnd = V.rng(seed || 1);
    const ink = rnd() > 0.72 ? RED : BLACK;
    c.save();
    // 框
    c.strokeStyle = rnd() > 0.6 ? RED : BLACK;
    c.lineWidth = 2.4;
    c.beginPath();
    c.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.22);
    c.stroke();
    // 里面的笔画
    c.strokeStyle = ink;
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    const kind = Math.floor(rnd() * 5);
    const cx = x, cy = y;
    if (kind === 0) {
      // 一个圈 + 一横
      c.beginPath();
      c.ellipse(cx, cy - h * 0.10, w * 0.22, h * 0.20, 0, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.moveTo(cx - w * 0.26, cy + h * 0.24);
      c.lineTo(cx + w * 0.26, cy + h * 0.24);
      c.stroke();
    } else if (kind === 1) {
      // 两竖 + 一点
      c.beginPath();
      c.moveTo(cx - w * 0.18, cy - h * 0.26);
      c.lineTo(cx - w * 0.18, cy + h * 0.26);
      c.moveTo(cx + w * 0.18, cy - h * 0.26);
      c.lineTo(cx + w * 0.18, cy + h * 0.10);
      c.stroke();
      c.fillStyle = ink;
      c.beginPath();
      c.arc(cx + w * 0.18, cy + h * 0.24, w * 0.07, 0, Math.PI * 2);
      c.fill();
    } else if (kind === 2) {
      // S 形
      c.beginPath();
      c.moveTo(cx - w * 0.22, cy - h * 0.24);
      c.quadraticCurveTo(cx + w * 0.24, cy - h * 0.04, cx - w * 0.20, cy + h * 0.24);
      c.stroke();
    } else if (kind === 3) {
      // 横条 + 两点（像数字）
      c.fillStyle = ink;
      c.fillRect(cx - w * 0.26, cy + h * 0.06, w * 0.52, h * 0.10);
      c.beginPath();
      c.arc(cx - w * 0.12, cy - h * 0.16, w * 0.07, 0, Math.PI * 2);
      c.arc(cx + w * 0.12, cy - h * 0.16, w * 0.07, 0, Math.PI * 2);
      c.fill();
    } else {
      // 三笔放射
      for (let i = -1; i <= 1; i++) {
        c.beginPath();
        c.moveTo(cx, cy + h * 0.26);
        c.lineTo(cx + i * w * 0.22, cy - h * 0.24);
        c.stroke();
      }
    }
    // 偶尔点一块玛雅蓝
    if (rnd() > 0.78) {
      c.globalAlpha = 0.55;
      c.fillStyle = BLUE;
      c.fillRect(x - w * 0.22, y - h * 0.22, w * 0.18, h * 0.16);
      c.globalAlpha = 1;
    }
    c.restore();
  }

  S.maya = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const cam = meta.cam || V.camDefault();

      const baked = V.layer.bake2d('maya:base', (g) => {
        const c = g.drawingContext;
        const W = g.width, H = g.height;
        V.paper.paint(c, W, H, 'washi', 707);
        const rnd = V.rng(707);

        const boxL = 96, boxR = W - 96;
        const boxT = 318, boxB = 892;

        // ---- 石灰底：偏奶白，局部有剥落 ----
        c.save();
        c.globalAlpha = 0.72;
        c.fillStyle = CREAM;
        c.fillRect(0, 0, W, H);
        c.restore();
        for (let i = 0; i < 26; i++) {
          const x = rnd() * W, y = rnd() * H;
          const r = 18 + rnd() * 70;
          c.save();
          c.globalAlpha = 0.30 + rnd() * 0.25;
          c.fillStyle = 'rgba(214,198,166,1)';
          c.beginPath();
          c.ellipse(x, y, r, r * (0.5 + rnd() * 0.5), rnd() * 3, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }

        // ---- 外框：红黑双线 ----
        c.save();
        c.strokeStyle = RED;
        c.lineWidth = 10;
        c.strokeRect(46, 46, W - 92, H - 92);
        c.strokeStyle = BLACK;
        c.lineWidth = 2.4;
        c.strokeRect(62, 62, W - 124, H - 124);
        c.restore();

        // ---- 顶部字块带：两排，大小不一 ----
        // 一行等大的方块会像仪表盘；真抄本的字块是挤在一起的，横竖都有变化。
        for (let row = 0; row < 2; row++) {
          let x = 100 - (row ? 26 : 0);
          while (x < W - 110) {
            const bw = 46 + rnd() * 34;
            const bh = 44 + rnd() * 20;
            glyphBlock(c, x + bw / 2, 108 + row * 62, bw, bh, 100 + x + row * 7);
            x += bw + 6 + rnd() * 10;
          }
        }

        // ---- 中间：神像格（红框内） ----
        c.save();
        c.strokeStyle = RED;
        c.lineWidth = 7;
        c.strokeRect(boxL, boxT, boxR - boxL, boxB - boxT);
        c.strokeStyle = BLACK;
        c.lineWidth = 1.8;
        c.strokeRect(boxL + 12, boxT + 12, boxR - boxL - 24, boxB - boxT - 24);
        c.restore();

        // 格子里上下各一条红带（抄本里常见）
        c.save();
        c.fillStyle = 'rgba(176,58,46,0.14)';
        c.fillRect(boxL + 12, boxT + 12, boxR - boxL - 24, 34);
        c.fillRect(boxL + 12, boxB - 46, boxR - boxL - 24, 34);
        c.restore();

        // ---- 底部字块带：两排 ----
        for (let row = 0; row < 2; row++) {
          let x = 100 - (row ? 24 : 0);
          while (x < W - 110) {
            const bw = 48 + rnd() * 32;
            const bh = 42 + rnd() * 18;
            glyphBlock(c, x + bw / 2, H - 150 + row * 56, bw, bh, 900 + x + row * 5);
            x += bw + 6 + rnd() * 10;
          }
        }

        // ---- 格子里左右各两列字块：抄本的每一格都是满的 ----
        for (const side of [0, 1]) {
          for (let col = 0; col < 2; col++) {
            const gx = side ? W - 190 - col * 66 : 190 + col * 66;
            let gy = boxT + 96;
            while (gy < boxB - 76) {
              const bw = 54 + rnd() * 12;
              const bh = 50 + rnd() * 14;
              glyphBlock(c, gx, gy, bw, bh, (side * 500 + col * 60) + gy);
              gy += bh + 12 + rnd() * 10;
            }
          }
        }

        // ---- 格子顶上的红带 + 三个日期块 ----
        c.save();
        c.fillStyle = 'rgba(176,58,46,0.22)';
        c.fillRect(boxL + 12, boxT + 12, boxR - boxL - 24, 48);
        c.restore();
        for (let i = 0; i < 6; i++) {
          glyphBlock(c, 470 + i * 168, boxT + 36, 60, 40, 300 + i);
        }

        // ---- 手风琴折痕：两条竖影 ----
        for (const fx of [W * 0.333, W * 0.666]) {
          const gg = c.createLinearGradient(fx - 26, 0, fx + 26, 0);
          gg.addColorStop(0, 'rgba(120,104,74,0)');
          gg.addColorStop(0.45, 'rgba(120,104,74,0.22)');
          gg.addColorStop(0.5, 'rgba(90,76,52,0.30)');
          gg.addColorStop(0.55, 'rgba(120,104,74,0.20)');
          gg.addColorStop(1, 'rgba(120,104,74,0)');
          c.fillStyle = gg;
          c.fillRect(fx - 26, 0, 52, H);
          // 折线上的一点磨损
          c.save();
          c.globalAlpha = 0.5;
          c.strokeStyle = 'rgba(150,132,98,0.7)';
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(fx, 40);
          c.lineTo(fx, H - 40);
          c.stroke();
          c.restore();
        }

        // ---- 石灰的细裂纹 ----
        for (let i = 0; i < 7; i++) {
          let x = rnd() * W, y = rnd() * H;
          let ang = rnd() * Math.PI * 2;
          c.save();
          c.strokeStyle = 'rgba(150,130,96,0.28)';
          c.lineWidth = 0.9;
          c.beginPath();
          c.moveTo(x, y);
          for (let k = 0; k < 14; k++) {
            ang += rnd.gauss() * 0.5;
            x += Math.cos(ang) * 26;
            y += Math.sin(ang) * 26;
            c.lineTo(x, y);
          }
          c.stroke();
          c.restore();
        }

        V.paper.innerShadow(c, W, H, 0.12, 130);
      }, { w: V.W, h: V.H });

      ctx.drawImage(baked.canvas, 0, 0);

      // ---------------- 动态层 ----------------
      V.enterCam(ctx, cam);

      // 地面：一条红的横线（抄本里格子底部就是一道色带）
      ctx.save();
      ctx.strokeStyle = RED;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-200, V.ROAD_Y);
      ctx.lineTo(V.STAGE + 200, V.ROAD_Y);
      ctx.stroke();
      ctx.restore();

      // 骑手：黑线 + 奶白身 + 红蓝点缀（抄本神像的画法）
      const rr = B.drawRider(ctx, t, {
        scale: 1.02,
        shadow: false,
        pelicanStyle: {
          body: '#f6efdc', bodyShade: '#e6dbc0', line: BLACK,
          beak: OCHRE, beakDark: '#8f5f18', pouch: RED, pouchShade: '#8a2a20',
          leg: RED, eye: BLACK, lw: 2.8, feather: 0, eyeStyle: 'dot',
        },
        bikeStyle: {
          frame: BLACK, frameDark: BLACK, tire: BLACK, rim: BLACK,
          spoke: 'rgba(26,21,18,0.75)', saddle: BLACK, lw: 2.4, tubeW: 3.4, spokes: 8, shine: 0,
        },
      });

      // 抄本里的神像都有装饰：给鹈鹕加一条朱红胸带、蓝羽冠和三根头饰翎
      const pp = rr.p;
      ctx.save();
      ctx.translate(rr.x, rr.y);
      ctx.scale(1.02, 1.02);
      // 胸带
      V.ink.clipped(ctx, pp.body, (cc) => {
        cc.fillStyle = RED;
        cc.globalAlpha = 0.85;
        cc.beginPath();
        cc.ellipse(pp.shoulder[0] - 14, pp.shoulder[1] + 34, 46, 16, 0.2, 0, Math.PI * 2);
        cc.fill();
      });
      // 头饰翎：三根从头顶往后甩的羽毛
      const hx = pp.headC[0], hy = pp.headC[1] - pp.headR * 0.85;
      for (let i = 0; i < 3; i++) {
        const spread = (i - 1) * 0.42;
        const len = pp.headR * (3.4 + i * 0.4);
        ctx.strokeStyle = i === 1 ? BLUE : BLACK;
        ctx.lineWidth = 4.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.quadraticCurveTo(
          hx - Math.cos(Math.PI / 2 - spread) * len * 0.6,
          hy - Math.sin(Math.PI / 2 - spread) * len * 0.6,
          hx - len * (0.75 + (i - 1) * 0.18),
          hy - len * 0.42
        );
        ctx.stroke();
        // 翎上的一点红
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(hx - len * (0.62 + (i - 1) * 0.14), hy - len * 0.34, 5.0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      V.exitCam(ctx);

      // ---------------- 日期柱：就挂在骑手头顶 ----------------
      // 一路骑一路往上跳 —— 在抄本里它不是角色，是一个计数。
      const n = 1 + Math.floor((V.clamp(u / (meta.dur || 6)) * 13) % 13);
      // 放在骑手**左边**的空白处：挂头顶会和头翎打架，而且格子左边本来就是空的
      const rx2 = 520;
      const ny = 520;
      ctx.save();
      // 底下一条朱红横线，把它和格子里的日期栏连起来
      ctx.strokeStyle = RED;
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(rx2 - 130, ny + 52);
      ctx.lineTo(rx2 + 130, ny + 52);
      ctx.stroke();
      barDot(ctx, rx2, ny, n, 104, RED);
      // 两侧各点一个玛雅蓝的装饰点
      ctx.fillStyle = BLUE;
      for (const dx of [-118, 118]) {
        ctx.beginPath();
        ctx.arc(rx2 + dx, ny + 6, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      V.titles.draw(ctx, 'plaque', meta.strings, u, V.titles.opts('maya', { dur: meta.dur }));
    },
  };
})();
