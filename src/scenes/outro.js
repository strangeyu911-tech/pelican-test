/* scenes/outro.js — 新闻发布会（126 – 138 s，6 小节）
 *
 * 展墙 7×3，占画面宽度约 90%。前 20 格按顺序放 20 个版块，第 21 格是空的新闻发布会席位。
 *
 *   0.0 – 1.4   全景，展墙就位，字幕 1
 *   2.0 – 5.0   镜头缓缓推向第 21 格
 *   4.0/4.5/5.0 闪光灯三下（拍点上），照亮空椅子
 *   6.2 – 10.4  停住，字幕 2
 *  10.8 – 11.4  鹈鹕骑车从席位后方一闪而过
 *  11.4 – 12.0  定格在空席位，只留一声车铃
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});

  // 展墙布局
  const COLS = 7, ROWS = 3;
  const CW = 220, CH = 150, GAP = 28;
  const WALL_W = COLS * CW + (COLS - 1) * GAP;   // 1708
  const WALL_H = ROWS * CH + (ROWS - 1) * GAP;   // 506
  const X0 = (V.W - WALL_W) / 2;                 // 106
  const Y0 = 250;

  const cellRect = (i) => {
    const c = i % COLS, r = Math.floor(i / COLS);
    return { x: X0 + c * (CW + GAP), y: Y0 + r * (CH + GAP), w: CW, h: CH };
  };

  // 第 21 格（index 20）中心
  const cell21 = cellRect(20);

  /** 镜头：从全景推到第 21 格。
   *
   *  烤图比屏幕大一圈（见 PAD），所以镜头可以一直推到把第 21 格摆在正中 ——
   *  早先烤图正好 1920×1080，cam.x 被"不能露出画布右边缘"卡在 1552，
   *  结果最后一帧空席位偏右、右边留一大条纸白。 */
  function cameraAt(u) {
    const k = V.clamp((u - 2.0) / 3.0);
    const e = V.ease.inOutCubic(k);
    return {
      // 不把第 21 格摆在正中：它是整面墙的最后一格，右边天然只有纸。
      // 摆在黄金分割偏右（约 57%），左半由 19/20 格撑住，构图才不空。
      x: V.lerp(960, 1660, e),
      y: V.lerp(540, 675, e),
      zoom: V.lerp(1, 3.2, e),      // 2.8 时空席位只占画面 32%，收尾不够重
    };
  }

  /** 展墙里的小鹈鹕剪影：烤成精灵图，再按格贴。
   *  不能直接用 rgba 半透明色现画 —— 身体、翅膀、腿是几次独立 fill，
   *  重叠处 alpha 会叠加，肚皮上会浮出一块更亮的椭圆。
   *
   *  必须出**深浅两版**：第 4、9 格是纸白底（唐白描、八大山人），
   *  白色剪影贴上去等于没有。按底色亮度选版本。 */
  function miniSprite(dark) {
    return V.layer.bake2d(dark ? 'outro:miniDark' : 'outro:mini', (g) => {
      const c = g.drawingContext;
      c.clearRect(0, 0, g.width, g.height);
      const col = dark ? '#2f2a22' : '#ffffff';
      const p = V.rig.pose(0.0, { bob: 0 });
      c.save();
      c.translate(46, g.height - 16);
      c.scale(0.26, 0.26);
      V.pelican.silhouette(c, p, col);
      V.bike.outline(c, p, col, 6);      // 6 ÷ 0.26 ≈ 1.5px，缩略图里车架才看得见
      c.restore();
    }, { w: 132, h: 120 });
  }

  /** 底色亮度（0-255）。用来决定剪影用白还是用深色。 */
  function lum(hex) {
    const h = String(hex).replace('#', '');
    if (h.length < 6) return 0;
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  /** 把精灵图贴到格子里（底边对齐格子的地平线） */
  function miniRider(ctx, r, alpha, dark) {
    const sp = miniSprite(dark);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(sp.canvas, r.x + r.w / 2 - 66, r.y + r.h - 24 - 120);
    ctx.restore();
  }

  S.outro = {
    draw: function (ctx, t, u, meta) {
      const str = window.S.outro;
      const cam = cameraAt(u);

      // ---------- 静态层：整个展墙（只烤一次，推镜时作为纹理放大）----------
      // 烤图比屏幕四边各多 PAD，镜头才能把边上的格子推到画面中央而不露画布边。
      const PAD = 280;
      const baked = V.layer.bake2d('outro:wall', (g) => {
        const c = g.drawingContext;
        // 纸底铺满整张烤图（未平移，所以覆盖 0..g.width）
        V.paper.paint(c, g.width, g.height, 'archive', 77113);
        // 之后一律在"舞台坐标"里画：舞台原点在烤图的 (PAD, PAD)
        // 注意：**暗角不能烤进这张图**。暗角是贴在画框边上的效果，
        // 烤进去之后推镜到 3.2× ，舞台右边缘那道渐变会变成一条横贯画面的竖缝。
        c.save();
        c.translate(PAD, PAD);

        const scenes = window.S.scenes;
        for (let i = 0; i < 21; i++) {
          const rc = cellRect(i);
          const isSeat = i === 20;

          // 画框
          c.save();
          c.strokeStyle = 'rgba(58,50,40,0.42)';
          c.lineWidth = 2;
          c.strokeRect(rc.x, rc.y, rc.w, rc.h);
          c.restore();

          if (!isSeat) {
            const sc = scenes[i];
            const spec = (V.scenes[sc.id] && V.scenes[sc.id].spec) || {};
            // 该版块的代表色
            c.fillStyle = spec.tint || '#cccccc';
            c.fillRect(rc.x + 2, rc.y + 2, rc.w - 4, rc.h - 4);
            // 编号
            V.text.draw(c, String(i + 1).padStart(2, '0'), rc.x + 12, rc.y + 30, {
              font: 'en', size: 17, color: 'rgba(255,255,255,0.55)',
            });
            // 迷你骑手（浅底用深剪影，深底用白剪影）
            miniRider(c, rc, 0.62, lum(spec.tint || '#888888') > 145);
            // 底下压一条暗带，让编号读得出来
            const grd = c.createLinearGradient(0, rc.y, 0, rc.y + rc.h);
            grd.addColorStop(0, 'rgba(0,0,0,0.20)');
            grd.addColorStop(0.45, 'rgba(0,0,0,0)');
            grd.addColorStop(1, 'rgba(0,0,0,0.22)');
            c.fillStyle = grd;
            c.fillRect(rc.x + 2, rc.y + 2, rc.w - 4, rc.h - 4);
          } else {
            // ---- 第 21 格：空的新闻发布会席位 ----
            drawPressSeat(c, rc);
          }
        }
        c.restore();   // 回到烤图坐标
      }, { w: V.W + PAD * 2, h: V.H + PAD * 2 });

      // ---------- 镜头变换后画展墙 ----------
      ctx.save();
      ctx.translate(960, 540);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);
      ctx.drawImage(baked.canvas, -PAD, -PAD);
      ctx.restore();

      // 暗角画在屏幕坐标（不随镜头缩放）—— 4 条渐变，每帧一次，约 0.6 ms
      V.paper.innerShadow(ctx, V.W, V.H, 0.26, 110);

      // ---------- 闪光灯：4.0 / 4.5 / 5.0 三下 ----------
      // 衰减 0.16 s（不是 0.34）：60fps 下 0.34 s 是 20 帧，整面墙白花花地糊 1/3 秒，
      // 读作"渲染过曝"而不是闪光灯。0.16 s ≈ 9 帧，是闪光灯的读感。
      let flash = 0;
      for (const ft of [4.0, 4.5, 5.0]) {
        const d = u - ft;
        if (d >= 0 && d < 0.16) flash = Math.max(flash, Math.pow(1 - d / 0.16, 2.2));
      }
      if (flash > 0.003) {
        // 全屏提亮
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = V.rgba('#fff6e0', flash * 0.66);
        ctx.fillRect(0, 0, V.W, V.H);
        ctx.restore();
        // 从第 21 格位置迸出来的小光晕
        const cx = (cell21.x + cell21.w / 2 - cam.x) * cam.zoom + 960;
        const cy = (cell21.y + cell21.h / 2 - cam.y) * cam.zoom + 540;
        const grd = ctx.createRadialGradient(cx, cy, 10, cx, cy, 420 * cam.zoom * 0.5);
        grd.addColorStop(0, V.rgba('#fffbe8', flash * 0.60));
        grd.addColorStop(1, V.rgba('#fffbe8', 0));
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, V.W, V.H);
      }

      // ---------- 鹈鹕一闪而过：10.8 – 11.4 ----------
      if (u >= 10.8 && u <= 11.55) {
        const k = V.clamp((u - 10.8) / 0.6);
        const e = V.ease.inOutQuad(k);
        const px = V.lerp(-360, 2280, e);
        const py = 828;
        const s = 2.1;
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(s, s);
        const p = V.rig.pose(t);
        ctx.save();
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse((p.rear[0] + p.front[0]) / 2, 8, 172, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        V.bike.draw(ctx, p, { lw: 1.9, tubeW: 4.2 });
        V.pelican.draw(ctx, p, { lw: 2.2 }, t);
        ctx.restore();
      }

      // ---------- 字幕 ----------
      const a1 = V.envelope(u, 0.4, 0.95, 3.2, 3.7);
      if (a1 > 0.002) {
        V.text.draw(ctx, str.lines[0], 960, 892, {
          font: 'cn', size: 40, color: '#2a2622', align: 'center', weight: 400, alpha: a1, spacing: 1.4,
        });
      }
      const a2 = V.envelope(u, 6.2, 6.8, 10.2, 10.7);
      if (a2 > 0.002) {
        const rise = (1 - V.ease.outCubic(V.clamp((u - 6.2) / 0.6))) * 12;
        V.text.draw(ctx, str.lines[1], 960, 892 + rise, {
          font: 'cn', size: 40, color: '#2a2622', align: 'center', weight: 400, alpha: a2, spacing: 1.4,
        });
      }

      // ---------- 末尾定格：极轻的暗角收拢 ----------
      if (u > 11.2) {
        const k = V.clamp((u - 11.2) / 0.8);
        ctx.save();
        ctx.globalAlpha = k * 0.55;
        const grd = ctx.createRadialGradient(960, 540, 300, 960, 540, 980);
        grd.addColorStop(0, 'rgba(0,0,0,0)');
        grd.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, V.W, V.H);
        ctx.restore();
      }
    },
  };

  /** 第 21 格：空席位。桌子 + 三支麦克风（不带任何真实媒体标志）+ 席卡 + 空椅子。
   *  这一格是片尾的落点，推到 2.8× 时占半屏，所以细节要比别的格子多一档：
   *  椅子要读得出是椅子（靠背 + 两侧扶手），桌子要有台面高光和前脸，
   *  麦克风要有底座和斜度，席卡略微带透视。 */
  function drawPressSeat(c, rc) {
    const W = rc.w, H = rc.h;

    // 背景：新闻发布厅的灰蓝墙
    const bg = c.createLinearGradient(0, rc.y, 0, rc.y + H);
    bg.addColorStop(0, '#242b34');
    bg.addColorStop(0.55, '#39424e');
    bg.addColorStop(1, '#2b323b');
    c.fillStyle = bg;
    c.fillRect(rc.x, rc.y, W, H);

    // 一束顶光打下来
    const spot = c.createRadialGradient(
      rc.x + W * 0.5, rc.y + H * 0.10, 6,
      rc.x + W * 0.5, rc.y + H * 0.50, W * 0.78
    );
    spot.addColorStop(0, 'rgba(255,248,220,0.34)');
    spot.addColorStop(0.55, 'rgba(255,248,220,0.10)');
    spot.addColorStop(1, 'rgba(255,248,220,0)');
    c.fillStyle = spot;
    c.fillRect(rc.x, rc.y, W, H);

    c.save();
    c.translate(rc.x, rc.y);

    // ---- 空椅子（桌后，只露靠背和扶手）----
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.30)';
    c.beginPath();
    c.ellipse(110, 92, 44, 8, 0, 0, Math.PI * 2);
    c.fill();
    // 靠背
    const chair = c.createLinearGradient(96, 46, 124, 78);
    chair.addColorStop(0, '#2b333d');
    chair.addColorStop(1, '#171c22');
    c.fillStyle = chair;
    c.beginPath();
    c.moveTo(96, 74);
    c.lineTo(98, 52);
    c.quadraticCurveTo(110, 44, 122, 52);
    c.lineTo(124, 74);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.13)';
    c.lineWidth = 1;
    c.stroke();
    // 两侧扶手
    c.fillStyle = '#212831';
    c.fillRect(90, 70, 7, 14);
    c.fillRect(123, 70, 7, 14);
    c.restore();

    // ---- 桌子：台面 + 前脸 + 台沿高光 ----
    c.save();
    const deskW = 148, deskX = 36;
    const face = c.createLinearGradient(0, 80, 0, 104);
    face.addColorStop(0, '#8a6c50');
    face.addColorStop(0.28, '#6f5540');
    face.addColorStop(1, '#4a382a');
    c.fillStyle = face;
    c.beginPath();
    c.roundRect(deskX, 80, deskW, 24, [2, 2, 3, 3]);
    c.fill();
    // 台沿高光
    c.fillStyle = 'rgba(255,235,200,0.30)';
    c.fillRect(deskX, 80, deskW, 1.6);
    // 前脸暗部
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.fillRect(deskX, 98, deskW, 6);
    c.restore();

    // ---- 麦克风：三支，底座 + 斜杆 + 球头 ----
    for (let i = 0; i < 3; i++) {
      const mx = 74 + i * 36;
      const lean = (i - 1) * 5;
      const topY = 54 - (i === 1 ? 5 : 0);
      // 底座
      c.fillStyle = '#12161b';
      c.beginPath();
      c.ellipse(mx, 80, 6.5, 2.2, 0, 0, Math.PI * 2);
      c.fill();
      // 杆
      c.strokeStyle = '#1a1f26';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(mx, 80);
      c.lineTo(mx + lean, topY);
      c.stroke();
      // 杆上一点反光
      c.strokeStyle = 'rgba(255,255,255,0.22)';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(mx + 0.8, 78);
      c.lineTo(mx + lean + 0.8, topY + 2);
      c.stroke();
      // 球头
      c.fillStyle = '#0d1116';
      c.beginPath();
      c.arc(mx + lean, topY - 2.6, 4.4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.16)';
      c.beginPath();
      c.arc(mx + lean - 1.4, topY - 4, 1.5, 0, Math.PI * 2);
      c.fill();
    }

    // ---- 席卡：略微透视的白卡，立在桌前 ----
    c.save();
    c.translate(110, 74);
    c.transform(1, 0, -0.14, 1, 0, 0);
    c.fillStyle = '#f2eee2';
    c.beginPath();
    c.roundRect(-30, -9, 60, 17, 1.5);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.28)';
    c.lineWidth = 0.8;
    c.stroke();
    V.text.draw(c, '鹈鹕', 0, 0, {
      font: 'cn', size: 10.5, color: '#2a2622', align: 'center', base: 'middle', weight: 700,
    });
    c.restore();

    c.restore();

    // 标签：第 21 席
    V.text.draw(c, '21', rc.x + 12, rc.y + 30, { font: 'en', size: 17, color: 'rgba(255,255,255,0.5)' });
  }
})();
