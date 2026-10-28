/* scenes/vertical.js — 19 竖屏短视频（112 – 118 s，3 小节）
 *
 * 16:9 的画面里塞一个 9:16 的竖屏，左右两条黑边把"这是手机"说清楚。
 *
 * 梗：算法自动重构画面。第 2 小节视频**啪地数码变焦**，把骑手怼到正中 ——
 *     代价是车轮被裁掉半截。它还在蹬，但看不见路。
 *
 *   ① 0 – 2   黑边合拢，视频亮起来；骑手在画面偏左，右半边是天空
 *   ② 2 – 4   自动重构：1.0 → 1.52 倍急推，骑手居中，下缘切掉车轮；红点闪
 *   ③ 4 – 6   重构解除，退回 1.0，骑手朝右边出画
 *
 * 所有 UI 都是自绘 + 虚构命名，不用任何真实平台的图标。
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;

  const VW = Math.round((V.H * 9) / 16);      // 607
  const VH = V.H;
  const X0 = Math.round((V.W - VW) / 2);      // 656

  /** 心形 */
  function heart(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y + s * 0.72);
    c.bezierCurveTo(x - s * 0.95, y + s * 0.05, x - s * 0.55, y - s * 0.72, x, y - s * 0.24);
    c.bezierCurveTo(x + s * 0.55, y - s * 0.72, x + s * 0.95, y + s * 0.05, x, y + s * 0.72);
    c.closePath();
  }
  /** 评论气泡 */
  function bubble(c, x, y, s) {
    c.beginPath();
    c.roundRect(x - s, y - s * 0.78, s * 2, s * 1.5, s * 0.55);
    c.moveTo(x - s * 0.35, y + s * 0.7);
    c.lineTo(x - s * 0.1, y + s * 1.12);
    c.lineTo(x + s * 0.35, y + s * 0.7);
  }
  /** 分享箭头 */
  function share(c, x, y, s) {
    c.beginPath();
    c.moveTo(x - s, y + s * 0.55);
    c.lineTo(x + s * 0.9, y - s * 0.35);
    c.lineTo(x + s * 0.1, y + s * 0.05);
    c.lineTo(x + s * 0.35, y + s * 0.8);
    c.closePath();
  }

  S.vertical = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const str = meta.strings;
      const cam = meta.cam || V.camDefault();

      // 黑边：0 → 0.35s 合拢
      const bars = V.ease.outCubic(V.clamp(u / 0.35));

      // 自动重构：2.0 进场，3.9 解除
      const reframe = V.envelope(u, 2.0, 2.16, 3.72, 3.94);
      const rz = 1 + reframe * 0.52;

      // ---------------- 视频内容（裁进 9:16） ----------------
      ctx.save();
      ctx.beginPath();
      ctx.rect(X0, 0, VW, VH);
      ctx.clip();

      // 背景：一段明晃晃的天光 + 远坡，短平快
      const bg = ctx.createLinearGradient(0, 0, 0, VH);
      bg.addColorStop(0, '#8fd0e8');
      bg.addColorStop(0.48, '#cfe7dd');
      bg.addColorStop(1, '#f0dcb4');
      ctx.fillStyle = bg;
      ctx.fillRect(X0, 0, VW, VH);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.ellipse(X0 + VW * 0.7, 210, 150, 52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(X0 + VW * 0.3, 268, 110, 38, 0, 0, Math.PI * 2);
      ctx.fill();

      // 数码变焦：以骑手为锚点推近，并整体上移（把车轮推出画外）
      ctx.translate(X0 + VW / 2, VH * 0.60);
      ctx.scale(rz, rz);
      ctx.translate(-(X0 + VW / 2), -(VH * 0.60));
      ctx.translate(0, reframe * 74);

      V.enterCam(ctx, cam);
      B.drawRoad(ctx, t, { color: '#d9c9a4', depth: 150, grain: 0.7 });
      B.drawRider(ctx, t, {
        scale: 1.34,
        shadow: true,
        shadowStyle: { alpha: 0.16, color: '#6b5a3a' },
      });
      V.exitCam(ctx);
      ctx.restore();

      // ---------------- 黑边 ----------------
      ctx.save();
      ctx.fillStyle = '#0a0a0a';
      const bw = X0 * bars;
      ctx.fillRect(0, 0, bw, VH);
      ctx.fillRect(V.W - bw, 0, bw, VH);
      ctx.restore();

      // ---------------- UI ----------------
      const ui = V.envelope(u, 0.12, 0.55, 99, 99);
      if (ui > 0.004) {
        ctx.save();
        ctx.globalAlpha = ui;

        // 右侧操作栏
        const rx = X0 + VW - 46;
        const items = [
          { y: 452, draw: () => heart(ctx, rx, 452, 17), n: '124K', hot: 1 },
          { y: 556, draw: () => bubble(ctx, rx, 556, 17), n: '3.1K', hot: 0 },
          { y: 660, draw: () => share(ctx, rx, 660, 16), n: '8.2K', hot: 0 },
        ];
        for (const it of items) {
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.94)';
          ctx.strokeStyle = 'rgba(255,255,255,0.94)';
          ctx.lineWidth = 3;
          ctx.shadowColor = 'rgba(0,0,0,0.35)';
          ctx.shadowBlur = 8;
          ctx.fillStyle = it.hot ? '#ff4d6a' : 'rgba(255,255,255,0.94)';
          if (it.hot) ctx.strokeStyle = '#ff4d6a';
          it.draw();
          if (it.hot) ctx.fill(); else { ctx.lineWidth = 3; ctx.stroke(); }
          ctx.restore();
          V.text.draw(ctx, it.n, rx, it.y + 44, {
            font: 'en', size: 17, color: '#ffffff', align: 'center',
            shadow: [0, 1, 6, 'rgba(0,0,0,0.5)'],
          });
        }

        // 底部压一层渐变：不定这一层，白字压在车轮上等于没字
        const scrim = ctx.createLinearGradient(0, VH - 300, 0, VH);
        scrim.addColorStop(0, 'rgba(0,0,0,0)');
        scrim.addColorStop(0.55, 'rgba(0,0,0,0.34)');
        scrim.addColorStop(1, 'rgba(0,0,0,0.62)');
        ctx.fillStyle = scrim;
        ctx.fillRect(X0, VH - 300, VW, 300);

        // 底部：账号 + 说明 + 进度
        V.text.draw(ctx, '@pelican.rides', X0 + 26, 892, {
          font: 'en', size: 24, color: '#ffffff', weight: 700,
          shadow: [0, 2, 8, 'rgba(0,0,0,0.45)'],
        });
        V.text.draw(ctx, str.cn, X0 + 26, 928, {
          font: 'cn', size: 22, color: '#ffffff',
          shadow: [0, 2, 8, 'rgba(0,0,0,0.45)'],
        });
        V.text.draw(ctx, 'original audio', X0 + 26, 962, {
          font: 'en', size: 16, color: 'rgba(255,255,255,0.86)',
          shadow: [0, 2, 8, 'rgba(0,0,0,0.45)'],
        });

        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(X0 + 26, 1004, VW - 52, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillRect(X0 + 26, 1004, (VW - 52) * 0.42, 3);

        // 重构时右上角闪一个红点，像"正在追踪主体"
        if (reframe > 0.02) {
          const blink = 0.55 + 0.45 * Math.sin(u * 22);
          ctx.save();
          ctx.globalAlpha = ui * reframe * blink;
          ctx.fillStyle = '#ff3b46';
          ctx.beginPath();
          ctx.arc(X0 + VW - 42, 54, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      // ---------------- 题名：账号名已经占了左下，这里只留一行年代 ----------------
      // 竖屏这格不另起标题样式 —— 账号／说明本身就是这一格的题名。
      void str;
    },
  };
})();
