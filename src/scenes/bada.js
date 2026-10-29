/* scenes/bada.js — 09 八大山人写意（54 – 58 s，2 小节）
 *
 * 时代规矩：
 *   · **极简**。一张纸上只有一只鸟、一块石头、几笔草，剩下全是空白（留白）。
 *   · 墨只有浓淡干湿，没有颜色；鸟的身子常常只用一道湿笔的轮廓，不填。
 *   · 眼睛画成方的或圆的，**瞳子顶在眼眶最上沿**，向上翻 —— 这就是"白眼"，
 *     是朱耷对这个世界最出名的一个态度。
 *   · 落款「八大山人」四个字连写，看着像"哭之"又像"笑之"。
 *   · 印章：朱文一方，压在名款下面。
 *
 * 梗：**它翻了个白眼**。骑到一半，瞳子往上一顶，就再没落下来。
 *
 *   ① 0 – 1.4  一笔淡水墨铺开，鸟（鹈鹕）从左边入画，眼睛是正常的
 *   ② 1.4 – 4  瞳子顶到眼眶上沿，翻着白眼继续骑
 *
 * 构图：右下角一块石，鸟在石上，右上角竖着题款 + 两方印，左侧大片空白。
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;
  const K = V.ink;

  const INK = '#1e1c18';
  const PAPER = '#f4eee1';

  /**
   * 飞白：干笔。把一笔拆成一小段一小段，中间随机断开，
   * 剩下的白就是笔在纸上蹭出来的飞白。
   */
  function dryStroke(c, pts, w, rnd, opt) {
    const o = opt || {};
    const gaps = o.gaps == null ? 0.28 : o.gaps;
    c.save();
    c.strokeStyle = o.color || INK;
    c.lineCap = 'round';
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.round(d / 9));
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        carry += d / n;
        if (rnd() < gaps) continue;
        const taper = Math.sin(Math.PI * Math.min(1, (i - 1 + t0) / (pts.length - 1)));
        c.globalAlpha = (o.alpha == null ? 0.9 : o.alpha) * (0.55 + rnd() * 0.45);
        c.lineWidth = Math.max(0.6, (w || 6) * (0.35 + taper * 0.8) * (0.7 + rnd() * 0.6));
        c.beginPath();
        c.moveTo(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0);
        c.lineTo(a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1);
        c.stroke();
      }
    }
    c.restore();
  }

  /** 一块石头：湿笔铺底 + 干笔擦 + 苔点 */
  function rock(c, x, y, w, h, seed) {
    const rnd = V.rng(seed || 21);
    const pts = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / (n - 1)) * Math.PI;
      const rr = 0.72 + rnd() * 0.36;
      pts.push([x + Math.cos(a) * w * 0.5 * rr, y + Math.sin(a) * h * rr]);
    }
    // 底边
    pts.push([x - w * 0.5, y + h * 0.18]);
    pts.push([x + w * 0.5, y + h * 0.18]);

    c.save();
    K.path(c, pts);
    const g = c.createLinearGradient(0, y - h, 0, y + h * 0.2);
    g.addColorStop(0, 'rgba(38,34,28,0.86)');
    g.addColorStop(1, 'rgba(58,52,42,0.55)');
    c.fillStyle = g;
    c.fill();
    c.restore();

    // 干笔擦出石面的纹理
    K.clipped(c, pts, (cc) => {
      for (let i = 0; i < 26; i++) {
        const sx = x - w * 0.5 + rnd() * w;
        const sy = y - h * 0.8 + rnd() * h * 0.9;
        const len = 40 + rnd() * 90;
        dryStroke(cc, [[sx, sy], [sx + (rnd() - 0.5) * 30, sy + len]], 4 + rnd() * 5, rnd,
          { color: 'rgba(24,20,16,0.55)', gaps: 0.45 });
      }
    });

    // 轮廓 + 苔点
    K.contour(c, pts.concat([pts[0]]), { color: 'rgba(20,17,14,0.9)', w: 3.4, seed: seed + 1 });
    K.moss(c, pts.slice(0, 6), { step: 9, spread: 14, r: 4.6, alpha: 0.9, seed: seed + 2, threshold: 0.2 });
  }

  /** 题款：竖排的抽象墨字（不写字，只留笔势，避免用错字） */
  function colophon(c, x, y, count, size, seed) {
    const rnd = V.rng(seed || 9);
    c.save();
    c.strokeStyle = 'rgba(30,28,24,0.82)';
    c.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      const cy = y + i * size * 1.25;
      // 每个"字"用两三笔
      for (let k = 0; k < 3; k++) {
        const sx = x + (rnd() - 0.5) * size * 0.5;
        const sy = cy + (rnd() - 0.5) * size * 0.5;
        c.lineWidth = 1.6 + rnd() * 2.4;
        c.beginPath();
        c.moveTo(sx - size * 0.3, sy + (rnd() - 0.5) * size * 0.4);
        c.quadraticCurveTo(sx, sy - size * 0.2, sx + size * 0.32, sy + (rnd() - 0.5) * size * 0.4);
        c.stroke();
      }
    }
    c.restore();
  }

  /** 朱文印：红方框 + 白字 */
  function seal(c, x, y, s, txt) {
    c.save();
    c.fillStyle = 'rgba(178,48,38,0.90)';
    c.beginPath();
    c.roundRect(x - s / 2, y - s / 2, s, s, s * 0.08);
    c.fill();
    c.globalAlpha = 0.22;
    c.fillStyle = '#6b1712';
    c.fillRect(x - s / 2, y - s / 2, s * 0.34, s * 0.16);
    c.restore();
    V.text.draw(c, txt, x, y, {
      font: 'cnBrush', size: s * 0.56, color: '#f7f1e2', align: 'center', base: 'middle',
    });
  }

  S.bada = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const cam = meta.cam || V.camDefault();
      const dur = meta.dur || 4;

      const baked = V.layer.bake2d('bada:base', (g) => {
        const c = g.drawingContext;
        const W = g.width, H = g.height;
        V.paper.paint(c, W, H, 'xuan', 909);
        const rnd = V.rng(909);

        // 一笔极淡的远山：只为了给一个大空白一个理由
        c.save();
        c.globalAlpha = 0.16;
        c.fillStyle = '#7d7565';
        c.beginPath();
        c.moveTo(180, 250);
        c.quadraticCurveTo(420, 150, 700, 214);
        c.quadraticCurveTo(880, 250, 1000, 236);
        c.lineTo(1000, 300);
        c.lineTo(180, 300);
        c.closePath();
        c.fill();
        c.restore();

        // 右下角的石
        const bankY = Math.round(V.ROAD_Y * V.U) - 9;
        rock(c, 1500, bankY - 60, 520, 210, 31);

        // 石头旁的几笔草
        c.save();
        c.strokeStyle = 'rgba(26,23,19,0.78)';
        c.lineCap = 'round';
        for (let i = 0; i < 9; i++) {
          const gx = 1180 + rnd() * 260;
          c.lineWidth = 1.4 + rnd() * 2.0;
          c.beginPath();
          c.moveTo(gx, bankY - 6);
          c.quadraticCurveTo(gx + (rnd() - 0.5) * 26, bankY - 40, gx + (rnd() - 0.5) * 60, bankY - 78);
          c.stroke();
        }
        c.restore();

        // 地面：一道极淡的长横（写意画的地面常常只是一道干笔）
        dryStroke(c, [[300, bankY], [1150, bankY - 4], [1900, bankY]], 5.0, rnd,
          { color: 'rgba(30,28,24,0.42)', gaps: 0.42 });

        // 题款：右上角竖排 + 两方印
        colophon(c, 1732, 168, 5, 46, 41);
        seal(c, 1732, 440, 62, '鹈');
        seal(c, 1732, 516, 54, '山');

        V.paper.innerShadow(c, W, H, 0.05, 150);
      }, { w: V.W, h: V.H });

      ctx.drawImage(baked.canvas, 0, 0);

      // ---------------- 动态层 ----------------
      V.enterCam(ctx, cam);

      // 鸟：湿笔轮廓、不填色（八大的鸟身子常常是空的）
      const rr = B.drawRider(ctx, t, {
        scale: 1.18,
        shadow: false,
        pelicanStyle: {
          body: PAPER, bodyShade: PAPER, line: 'rgba(26,23,19,0.92)',
          beak: PAPER, beakDark: PAPER, pouch: 'rgba(26,23,19,0.10)', pouchShade: PAPER,
          leg: 'rgba(26,23,19,0.85)', eye: PAPER, lw: 4.4, feather: 0, eyeStyle: 'dot',
          fillBody: true,
        },
        bikeStyle: {
          // 写意里没有自行车这种东西 —— 只留几笔枯墨的圈和杆
          frame: 'rgba(26,23,19,0.72)', frameDark: 'rgba(26,23,19,0.5)',
          tire: 'rgba(26,23,19,0.80)', rim: 'rgba(26,23,19,0.45)',
          spoke: 'rgba(26,23,19,0.35)', saddle: 'rgba(26,23,19,0.8)',
          lw: 3.6, tubeW: 5.0, spokes: 7, shine: 0,
        },
      });

      // ---- 白眼：瞳子往上一顶 ----
      // 这是全片最出名的一个表情，必须画准：眼眶方中带圆，瞳子顶在最上沿。
      const p = rr.p;
      const dx = p.beakTip[0] - p.beakBase[0];
      const dy = p.beakTip[1] - p.beakBase[1];
      const L = Math.hypot(dx, dy) || 1;
      const baX = dx / L, baY = dy / L;
      const nX = baY, nY = -baX;              // 指向头顶侧
      const hr = p.headR || 20;
      const ex = p.headC[0] + baX * hr * 0.02 + nX * hr * 0.20;
      const ey = p.headC[1] + baY * hr * 0.02 + nY * hr * 0.20;
      const flip = V.ease.inOutCubic(V.clamp((u - dur * 0.35) / (dur * 0.16)));

      ctx.save();
      ctx.translate(rr.x, rr.y);
      ctx.scale(1.18, 1.18);
      // ⚠️ 别忘了移到眼睛的位置 —— 少了这一句，眼会画在骑手的原点（脚下），
      //    看起来像"根本没画眼睛"（这一版踩过）。
      ctx.translate(ex, ey);
      ctx.rotate(Math.atan2(baY, baX));
      const er = hr * 0.62;
      // 眼眶：方中带圆（八大的眼睛不是正圆）
      ctx.strokeStyle = INK;
      ctx.lineWidth = er * 0.30;
      ctx.beginPath();
      ctx.roundRect(-er, -er * 0.86, er * 2, er * 1.72, er * 0.55);
      ctx.stroke();
      // 瞳子：从中间顶到上沿
      // 眼眶内沿在 ±0.86er，瞳子半径 0.46er；
      // 要让瞳子**刚好贴住上沿**，圆心应该在 -0.86 + 0.46 = -0.40er，
      // 再往上顶就跑到眼眶外面去了（上一版顶成了头顶上一个黑点）。
      const py = flip * (-er * 0.40);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(0, py, er * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      V.exitCam(ctx);

      V.titles.draw(ctx, 'vertical', meta.strings, u, V.titles.opts('bada', { dur }));
    },
  };
})();
