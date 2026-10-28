/* scenes/intro.js — 开场：一本正经地胡说（0 – 6 s，3 小节）
 *
 * 纸张质感 + 衬线字体 + 纪录片式庄重。
 * 两条字幕，第二条必须砸在强拍上（t = 2.0），砸完鹈鹕就骑进来。
 *
 *   0.00  纸张显现，颗粒落定
 *   0.35  图注淡入
 *   0.55  第一条字幕淡入
 *   2.00  第二条字幕在强拍上砸下（0.12s 内到位，很快）
 *   2.55  出处小字淡入（比正文小两号，灰色）
 *   3.95  两句字幕与出处一起退场，鹈鹕同时从左侧画外骑入
 *   6.00  交接给版块 1
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});

  S.intro = {
    draw: function (ctx, t, u, meta) {
      const sx = (v) => v;                 // 屏幕坐标，直接像素
      const str = window.S.intro;

      // ---------- 静态层：纸 + 图注 + 素描插图 ----------
      const baked = V.layer.bake2d('intro:base', (g) => {
        const c = g.drawingContext;
        V.paper.paint(c, g.width, g.height, 'archive', 20261028);
        V.paper.dust(c, g.width, g.height, 0.8, 99);
        V.paper.innerShadow(c, g.width, g.height, 0.13, 140);

        // ---- 素描插图：一只骑车的鹈鹕（细线、无填充）----
        // 插图比例：整只鸟约 340 单位高，乘 bs 后必须放得下（by - 340*bs > 60）
        const bx = 1372, by = 472, bs = 1.12;
        c.save();
        c.translate(bx, by);
        c.scale(bs, bs);
        c.globalAlpha = 0.72;
        // 铅笔底稿的轻微旋转
        c.rotate(-0.035);
        const p = V.rig.pose(0.0, { bob: 0, lean: -0.05 });
        V.bike.draw(c, p, {
          frame: '#4a443a', frameDark: '#3a352c', tire: '#4a443a', rim: '#6a6254',
          spoke: '#8a8272', saddle: '#3a352c', lw: 1.5, tubeW: 3.2, spokes: 8, shine: 0,
        });
        V.pelican.draw(c, p, {
          body: 'rgba(0,0,0,0)', bodyShade: 'rgba(0,0,0,0)', line: '#4a443a',
          beak: 'rgba(0,0,0,0)', pouch: 'rgba(0,0,0,0)', leg: 'rgba(0,0,0,0)',
          eye: '#3a352c', lw: 1.6, feather: 0, fillBody: false, eyeStyle: 'dot',
        }, 0);
        c.restore();

        // ---- 图注 ----
        V.text.draw(c, str.caption, bx - 128, by + 186, {
          font: 'cn', size: 23, color: 'rgba(58,50,40,0.80)', align: 'left', weight: 400,
        });
        V.text.draw(c, str.captionEn, bx - 128, by + 214, {
          font: 'en', size: 16, color: 'rgba(58,50,40,0.48)', align: 'left', italic: true,
        });
        // 图注上方一条细线，像图版的边框
        c.beginPath();
        c.moveTo(bx - 132, by + 162);
        c.lineTo(bx + 400, by + 162);
        c.strokeStyle = 'rgba(58,50,40,0.22)';
        c.lineWidth = 1;
        c.stroke();
      }, { w: V.W, h: V.H });

      ctx.drawImage(baked.canvas, 0, 0);

      // ---------- 第一条字幕：0.55 起淡入 ----------
      // 必须留到 3.95 才退场：两句是一段话，第 1 句先走、第 2 句才落，
      // 铺垫就白铺了 —— 观众读不到"自古以来"和"自行车还没发明"的对撞。
      const a1 = V.envelope(u, 0.55, 1.05, 3.95, 4.35);
      if (a1 > 0.002) {
        const rise1 = (1 - V.ease.outCubic(V.clamp((u - 0.55) / 0.5))) * 14;
        V.text.draw(ctx, str.lines[0], 960, 792 + rise1, {
          font: 'cn', size: 44, color: '#2a2622', align: 'center', weight: 400,
          alpha: a1, spacing: 1.5,
        });
      }

      // ---------- 第二条字幕：强拍（t=2.0）砸下，0.12s 到位 ----------
      const a2 = V.envelope(u, 2.0, 2.14, 3.95, 4.35);
      if (a2 > 0.002) {
        const k = V.clamp((u - 2.0) / 0.14);
        const e = V.ease.outQuart(k);
        const rise2 = (1 - e) * 26;
        const sc2 = 1 + (1 - e) * 0.045;
        ctx.save();
        ctx.translate(960, 878 + rise2);
        ctx.scale(sc2, sc2);
        V.text.draw(ctx, str.lines[1], 0, 0, {
          font: 'cn', size: 40, color: '#2a2622', align: 'center', weight: 400,
          alpha: a2, spacing: 1.5,
        });
        ctx.restore();
      }

      // ---------- 出处小字 ----------
      const a3 = V.envelope(u, 2.55, 3.15, 3.95, 4.35);
      if (a3 > 0.002) {
        V.text.draw(ctx, str.credit, 1462, 962, {
          font: 'cn', size: 19, color: 'rgba(58,50,40,0.52)', align: 'right', alpha: a3,
        });
        V.text.draw(ctx, str.creditEn, 1462, 988, {
          font: 'en', size: 14, color: 'rgba(58,50,40,0.34)', align: 'right', italic: true, alpha: a3,
        });
      }

      // ---------- 鹈鹕骑入：3.95 起，从左侧画外进入 ----------
      if (u >= 3.9) {
        const k = V.clamp((u - 3.9) / 2.1);
        const e = V.ease.inOutQuad(k);
        // 从 x=-420 骑到 x=1020（屏幕像素）
        const px = V.lerp(-420, 1020, e);
        const py = 1000;
        const s = 1.85;

        // 一条极淡的地平线，只在鹈鹕出现时浮现
        const la = V.clamp((u - 3.9) / 0.6) * 0.5;
        ctx.save();
        ctx.globalAlpha = la;
        ctx.beginPath();
        ctx.moveTo(0, py + 6);
        ctx.lineTo(V.W, py + 6);
        ctx.strokeStyle = 'rgba(58,50,40,0.30)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(s, s);
        const p = V.rig.pose(t);
        // 影子
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse((p.rear[0] + p.front[0]) / 2, 8, 172, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        V.bike.draw(ctx, p, {
          frame: '#3f4a44', frameDark: '#2a3330', tire: '#22262a', rim: '#8c9398',
          spoke: '#b9bfc3', saddle: '#2a2320', lw: 1.9, tubeW: 4.4, spokes: 10,
        });
        V.pelican.draw(ctx, p, {
          body: '#f4efe4', bodyShade: '#ded4c0', line: '#2a2622', beak: '#e8a33d',
          pouch: '#e07b3a', leg: '#d98a2b', eye: '#2a2622', lw: 2.2, feather: 0.4,
        }, t);
        ctx.restore();
      }
    },
  };
})();
