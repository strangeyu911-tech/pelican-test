/* scenes/vertical.js — 19 竖屏短视频（112 – 118 s，3 小节）
 *
 * 16:9 的画面里塞一个 9:16 的竖屏，左右两条黑边把"这是手机"说清楚。
 *
 * 梗：算法自动重构画面。第 2 小节视频**啪地数码变焦**，把骑手怼到正中 ——
 *     代价是车轮被裁掉半截。它还在蹬，但看不见路。
 *
 *   ① 0 – 2   黑边合拢，视频亮起来；完整的手机界面浮上来
 *   ② 2 – 4   自动重构：1.0 → 1.52 倍急推，骑手居中，下缘切掉车轮；红点闪
 *   ③ 4 – 6   重构解除，退回 1.0，骑手朝右边出画
 *
 * 界面全部自绘 + 虚构命名（鹈视 / @鹈鹕骑士），不对应任何真实平台。
 * 文案在 strings.js 的 S.feed —— 那里是字形子集的唯一来源。
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;

  const VW = Math.round((V.H * 9) / 16);      // 607
  const VH = V.H;
  const X0 = Math.round((V.W - VW) / 2);      // 656

  function heart(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y + s * 0.72);
    c.bezierCurveTo(x - s * 0.95, y + s * 0.05, x - s * 0.55, y - s * 0.72, x, y - s * 0.24);
    c.bezierCurveTo(x + s * 0.55, y - s * 0.72, x + s * 0.95, y + s * 0.05, x, y + s * 0.72);
    c.closePath();
  }
  function bubble(c, x, y, s) {
    c.beginPath();
    c.roundRect(x - s, y - s * 0.8, s * 2, s * 1.5, s * 0.6);
    c.moveTo(x - s * 0.4, y + s * 0.66);
    c.lineTo(x - s * 0.12, y + s * 1.1);
    c.lineTo(x + s * 0.3, y + s * 0.66);
    c.closePath();
  }
  function bookmark(c, x, y, s) {
    c.beginPath();
    c.moveTo(x - s * 0.7, y - s);
    c.lineTo(x + s * 0.7, y - s);
    c.lineTo(x + s * 0.7, y + s);
    c.lineTo(x, y + s * 0.45);
    c.lineTo(x - s * 0.7, y + s);
    c.closePath();
  }
  function share(c, x, y, s) {
    c.beginPath();
    c.moveTo(x - s * 0.9, y + s * 0.5);
    c.lineTo(x + s * 0.85, y - s * 0.35);
    c.lineTo(x + s * 0.12, y + s * 0.02);
    c.lineTo(x + s * 0.3, y + s * 0.78);
    c.closePath();
  }
  function signal(c, x, y) {
    for (let i = 0; i < 4; i++) {
      const h = 4 + i * 3.4;
      c.fillRect(x + i * 6.4, y - h, 4.2, h);
    }
  }
  function battery(c, x, y) {
    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(x, y - 9, 30, 16, 3);
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.fillRect(x + 3, y - 6, 19, 10);
    c.fillRect(x + 32, y - 4, 3, 6);
    c.restore();
  }

  S.vertical = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const str = meta.strings;
      const F = window.S.feed;
      const cam = meta.cam || V.camDefault();

      const bars = V.ease.outCubic(V.clamp(u / 0.35));
      const reframe = V.envelope(u, 2.0, 2.16, 3.72, 3.94);
      const rz = 1 + reframe * 0.52;

      // ---------------- 视频内容 ----------------
      ctx.save();
      ctx.beginPath();
      ctx.rect(X0, 0, VW, VH);
      ctx.clip();

      const bg = ctx.createLinearGradient(0, 0, 0, VH);
      bg.addColorStop(0, '#f7c9a8');
      bg.addColorStop(0.34, '#e9b0a0');
      bg.addColorStop(0.62, '#c9a6b8');
      bg.addColorStop(1, '#8f88a8');
      ctx.fillStyle = bg;
      ctx.fillRect(X0, 0, VW, VH);

      // 远处楼群 + 窗
      const br = V.rng(21);
      for (let i = 0; i < 26; i++) {
        const bx = X0 + br() * VW;
        const bw2 = 22 + br() * 54;
        const bh = 60 + br() * 210;
        ctx.fillStyle = `rgba(${Math.round(90 + br() * 40)},${Math.round(80 + br() * 40)},${Math.round(110 + br() * 40)},0.34)`;
        ctx.fillRect(bx, 620 - bh, bw2, bh + 40);
        for (let k = 0; k < 5; k++) {
          ctx.fillStyle = `rgba(255,214,150,${0.2 + br() * 0.4})`;
          ctx.fillRect(bx + 4 + br() * (bw2 - 10), 620 - bh + 10 + br() * bh * 0.7, 4, 5);
        }
      }
      // 散景
      for (let i = 0; i < 34; i++) {
        const bx = X0 + br() * VW;
        const by = 200 + br() * 460;
        const rr = 6 + br() * 24;
        const gg = ctx.createRadialGradient(bx, by, 0, bx, by, rr);
        gg.addColorStop(0, 'rgba(255,220,170,0.34)');
        gg.addColorStop(1, 'rgba(255,220,170,0)');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(bx, by, rr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.translate(X0 + VW / 2, VH * 0.60);
      ctx.scale(rz, rz);
      ctx.translate(-(X0 + VW / 2), -(VH * 0.60));
      ctx.translate(0, reframe * 74);

      V.enterCam(ctx, cam);
      B.drawRoad(ctx, t, { color: '#c8a894', depth: 150, grain: 0.7 });
      B.drawRider(ctx, t, {
        scale: 1.12,
        shadow: true,
        shadowStyle: { alpha: 0.18, color: '#5a4436' },
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

      // ---------------- 界面 ----------------
      const ui = V.envelope(u, 0.1, 0.5, 99, 99);
      if (ui <= 0.004) return;
      ctx.save();
      ctx.globalAlpha = ui;

      const left = X0 + 26;
      const right = X0 + VW - 26;

      // 状态栏
      V.text.draw(ctx, '19:19', left, 42, {
        font: 'en', size: 21, color: '#ffffff', weight: 700,
        shadow: [0, 1, 6, 'rgba(0,0,0,0.45)'],
      });
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      signal(ctx, right - 96, 44);
      V.text.draw(ctx, '5G', right - 64, 44, { font: 'en', size: 17, color: '#ffffff', weight: 700 });
      battery(ctx, right - 40, 40);
      ctx.restore();

      // 顶部 App 名 + 标签 + 搜索
      V.text.draw(ctx, F.app, left, 110, {
        font: 'cn', size: 28, color: '#ffffff', weight: 700,
        shadow: [0, 2, 8, 'rgba(0,0,0,0.45)'],
      });
      const tabCx = X0 + VW * 0.52;
      V.text.draw(ctx, F.tabFollow, tabCx - 46, 110, {
        font: 'cn', size: 21, color: 'rgba(255,255,255,0.62)', align: 'center',
        shadow: [0, 1, 6, 'rgba(0,0,0,0.45)'],
      });
      V.text.draw(ctx, F.tabForYou, tabCx + 44, 110, {
        font: 'cn', size: 21, color: '#ffffff', align: 'center', weight: 700,
        shadow: [0, 1, 6, 'rgba(0,0,0,0.45)'],
      });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(tabCx + 26, 122, 36, 3);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(right - 12, 104, 8, 0, Math.PI * 2);
      ctx.moveTo(right - 6, 110);
      ctx.lineTo(right, 116);
      ctx.stroke();
      ctx.restore();

      // 右侧操作栏
      const rx = right - 16;
      const rail = [
        { y: 404, icon: 'heart', n: F.counts[0] },
        { y: 512, icon: 'bubble', n: F.counts[1] },
        { y: 620, icon: 'bookmark', n: F.counts[2] },
        { y: 728, icon: 'share', n: F.share },
      ];
      for (const it of rail) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3.2;
        if (it.icon === 'heart') {
          ctx.fillStyle = '#ff3b5c';
          heart(ctx, rx, it.y, 20);
          ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.95)';
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          if (it.icon === 'bubble') { bubble(ctx, rx, it.y, 18); ctx.stroke(); }
          if (it.icon === 'bookmark') { bookmark(ctx, rx, it.y, 18); ctx.stroke(); }
          if (it.icon === 'share') { share(ctx, rx, it.y, 18); ctx.fill(); }
        }
        ctx.restore();
        V.text.draw(ctx, it.n, rx, it.y + 46, {
          font: 'cn', size: 18, color: '#ffffff', align: 'center',
          shadow: [0, 0, 8, 'rgba(0,0,0,0.8)'],
        });
      }

      // 头像 + 关注加号
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.arc(rx, 322, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b2721';
      ctx.beginPath();
      ctx.ellipse(rx - 4, 330, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rx + 9, 316, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff3b5c';
      ctx.beginPath();
      ctx.arc(rx, 352, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx - 5.6, 350.4, 11.2, 3.2);
      ctx.fillRect(rx - 1.6, 346.4, 3.2, 11.2);
      ctx.restore();

      // 浮动评论：放在上部天空区（下面被骑手占着），左侧补一层压暗
      const cm = F.comments;

      for (let i = 0; i < cm.length; i++) {
        const y = 302 + i * 40;
        const a = V.envelope(u, 0.5 + i * 0.3, 0.95 + i * 0.3, 4.6 + i * 0.4, 5.0 + i * 0.4);
        if (a <= 0.01) continue;
        ctx.save();
        ctx.globalAlpha = ui * a;
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.beginPath();
        ctx.arc(left + 11, y - 6, 11, 0, Math.PI * 2);
        ctx.fill();
        V.text.draw(ctx, cm[i].user + '  ' + cm[i].text, left + 30, y, {
          font: 'cn', size: 18, color: 'rgba(255,255,255,0.97)',
          shadow: [0, 0, 8, 'rgba(0,0,0,0.75)'],
        });
        ctx.restore();
      }

      // 底部压暗
      const scrim = ctx.createLinearGradient(0, VH - 330, 0, VH);
      scrim.addColorStop(0, 'rgba(0,0,0,0)');
      scrim.addColorStop(0.5, 'rgba(0,0,0,0.38)');
      scrim.addColorStop(1, 'rgba(0,0,0,0.66)');
      ctx.fillStyle = scrim;
      ctx.fillRect(X0, VH - 330, VW, 330);

      // 底部文案
      V.text.draw(ctx, F.handle, left, 866, {
        font: 'cn', size: 27, color: '#ffffff', weight: 700,
        shadow: [0, 2, 8, 'rgba(0,0,0,0.5)'],
      });
      V.text.draw(ctx, str.cn, left, 904, {
        font: 'cn', size: 21, color: 'rgba(255,255,255,0.95)',
        shadow: [0, 1, 6, 'rgba(0,0,0,0.5)'],
      });
      V.text.draw(ctx, F.tags, left, 938, {
        font: 'cn', size: 19, color: 'rgba(255,255,255,0.92)',
        shadow: [0, 1, 6, 'rgba(0,0,0,0.5)'],
      });
      // 音符 + 原声
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.ellipse(left + 8, 981, 6.5, 4.6, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(left + 13, 964, 2.4, 17);
      ctx.restore();
      V.text.draw(ctx, F.music, left + 26, 984, {
        font: 'cn', size: 17, color: 'rgba(255,255,255,0.9)',
        shadow: [0, 1, 6, 'rgba(0,0,0,0.5)'],
      });

      // 进度条
      ctx.fillStyle = 'rgba(255,255,255,0.26)';
      ctx.fillRect(X0, VH - 24, VW, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillRect(X0, VH - 24, VW * 0.46, 3);

      // 重构红点
      if (reframe > 0.02) {
        ctx.save();
        ctx.globalAlpha = ui * reframe * (0.5 + 0.5 * Math.sin(u * 22));
        ctx.fillStyle = '#ff3b46';
        ctx.beginPath();
        ctx.arc(right - 4, 62, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    },
  };
})();
