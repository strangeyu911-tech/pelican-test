/* scenes/qingming.js — 06 清明上河图（36 – 42 s，3 小节）
 *
 * 时代规矩：绢本设色、界面（界画）—— 屋木舟车都用界尺画，线直、角方；
 * 视点是斜俯视，一切从斜上方看下去；颜色是褪的：赭石、橄榄、灰青。
 * 最要紧的是**密**：满卷都是人、船、摊、柳、屋顶。
 *
 * 梗：**太挤了，谁都没注意它**。整条街几十号人各干各的，鹈鹕从中间骑过去，
 *     没有一个人抬头。
 *
 * 版式（自上而下，按真实手卷的比例）：
 *   远岸屋顶 → 河（船 + 虹桥）→ 近岸临河店铺 → 街道（骑手）→ 前景屋顶
 * 人物的身高是这把尺：一个人 ≈ 62px，一栋房子 ≈ 3 个人高。
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;

  const INK = '#2e2b23';
  const INK_SOFT = 'rgba(46,43,35,0.55)';
  const OCHRE = '#b08a52';
  const RED = '#9d5340';
  const TILE = 'rgba(92,96,74,0.80)';

  /** 界画的一条线 */
  function ruled(c, x1, y1, x2, y2, w, col) {
    c.save();
    c.strokeStyle = col || INK;
    c.lineWidth = w || 1.6;
    c.lineCap = 'butt';
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.restore();
  }

  /** 一片瓦顶：斜俯视的梯形 + 瓦垄 + 屋脊 + 翘角 */
  function roof(c, x, y, w, h, seed) {
    const rnd = V.rng(seed || 1);
    const top = y - h;
    const inset = w * 0.12;
    c.save();
    c.fillStyle = TILE;
    c.beginPath();
    c.moveTo(x - w / 2 + inset, top);
    c.lineTo(x + w / 2 - inset, top);
    c.lineTo(x + w / 2, y);
    c.lineTo(x - w / 2, y);
    c.closePath();
    c.fill();
    // 瓦垄
    c.strokeStyle = 'rgba(38,36,30,0.40)';
    c.lineWidth = 1;
    const n = Math.max(5, Math.round(w / 8));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      c.beginPath();
      c.moveTo(x - w / 2 + inset + (w - inset * 2) * t, top);
      c.lineTo(x - w / 2 + w * t, y);
      c.stroke();
    }
    // 屋脊 + 檐口
    c.strokeStyle = 'rgba(28,26,21,0.88)';
    c.lineWidth = 3.2;
    c.beginPath(); c.moveTo(x - w / 2 + inset, top); c.lineTo(x + w / 2 - inset, top); c.stroke();
    c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.stroke();
    // 翘角
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(x - w / 2, y);
    c.quadraticCurveTo(x - w / 2 - w * 0.06, y - h * 0.30, x - w / 2 - w * 0.03, y - h * 0.52);
    c.stroke();
    c.beginPath();
    c.moveTo(x + w / 2, y);
    c.quadraticCurveTo(x + w / 2 + w * 0.06, y - h * 0.30, x + w / 2 + w * 0.03, y - h * 0.52);
    c.stroke();
    // 檐下阴影
    c.fillStyle = 'rgba(46,43,35,0.14)';
    c.fillRect(x - w / 2, y, w, Math.min(10, h * 0.16));
    // 墙上的零星斑点（旧绢）
    c.fillStyle = 'rgba(120,100,66,0.10)';
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.ellipse(x + (rnd() - 0.5) * w * 0.8, y + (rnd() - 0.5) * h, 3 + rnd() * 6, 2 + rnd() * 4, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  /** 一栋房：白墙 + 门洞 + 界画格子窗 + 屋顶 */
  function house(c, x, y, w, h, seed) {
    const bodyH = h * 0.66;
    const rnd = V.rng(seed || 2);
    c.save();
    c.fillStyle = 'rgba(236,226,200,0.94)';
    c.fillRect(x - w * 0.44, y, w * 0.88, bodyH);
    c.strokeStyle = 'rgba(46,43,35,0.55)';
    c.lineWidth = 1.3;
    c.strokeRect(x - w * 0.44, y, w * 0.88, bodyH);
    // 门
    c.fillStyle = 'rgba(58,50,36,0.78)';
    c.fillRect(x - w * 0.09, y + bodyH * 0.26, w * 0.18, bodyH * 0.74);
    // 窗
    c.strokeStyle = 'rgba(46,43,35,0.48)';
    c.lineWidth = 1;
    const wx = x + w * 0.26 - w * 0.05;
    c.strokeRect(wx, y + bodyH * 0.24, w * 0.10, bodyH * 0.30);
    c.beginPath(); c.moveTo(wx + w * 0.05, y + bodyH * 0.24); c.lineTo(wx + w * 0.05, y + bodyH * 0.54); c.stroke();
    // 檐下的一道阴影
    c.fillStyle = 'rgba(46,43,35,0.10)';
    c.fillRect(x - w * 0.44, y, w * 0.88, bodyH * 0.12);
    c.restore();
    roof(c, x, y, w * 1.14, h * 0.40, seed + 1);
    void rnd;
  }

  /** 船：长条船身 + 拱篷 + 桅 + 橹。船身是"上平下弧"，不是橄榄 */
  function boat(c, x, y, s, seed) {
    const rnd = V.rng(seed || 3);
    const L = s, Hh = s * 0.20;
    c.save();
    // 船身：上缘基本直，下缘一条弧
    c.beginPath();
    c.moveTo(x - L * 0.5, y - Hh * 0.55);
    c.lineTo(x + L * 0.5, y - Hh * 0.62);
    c.quadraticCurveTo(x + L * 0.30, y + Hh * 0.45, x, y + Hh * 0.50);
    c.quadraticCurveTo(x - L * 0.30, y + Hh * 0.45, x - L * 0.5, y - Hh * 0.55);
    c.closePath();
    c.fillStyle = 'rgba(126,98,62,0.86)';
    c.fill();
    c.strokeStyle = 'rgba(34,30,23,0.85)';
    c.lineWidth = 1.8;
    c.stroke();
    // 船板线
    c.lineWidth = 0.9;
    c.strokeStyle = 'rgba(34,30,23,0.35)';
    for (let i = 1; i < 4; i++) {
      const yy = y - Hh * 0.55 + (Hh * 1.0) * (i / 4);
      c.beginPath();
      c.moveTo(x - L * 0.46, yy);
      c.quadraticCurveTo(x, yy + Hh * 0.10, x + L * 0.46, yy - Hh * 0.04);
      c.stroke();
    }
    // 拱篷
    c.beginPath();
    c.moveTo(x - L * 0.20, y - Hh * 0.58);
    c.quadraticCurveTo(x, y - Hh * 1.55, x + L * 0.20, y - Hh * 0.60);
    c.closePath();
    c.fillStyle = 'rgba(214,198,162,0.95)';
    c.fill();
    c.strokeStyle = 'rgba(34,30,23,0.8)';
    c.lineWidth = 1.5;
    c.stroke();
    // 篷骨
    c.lineWidth = 0.9;
    for (let i = 1; i < 5; i++) {
      const t = -0.20 + 0.40 * (i / 5);
      c.beginPath();
      c.moveTo(x + L * t, y - Hh * 0.58);
      c.quadraticCurveTo(x + L * t, y - Hh * 1.42, x + L * t, y - Hh * 0.58);
      c.stroke();
    }
    // 桅
    c.strokeStyle = 'rgba(34,30,23,0.85)';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(x + L * 0.06, y - Hh * 1.42);
    c.lineTo(x + L * 0.06, y - Hh * 3.0);
    c.stroke();
    // 橹
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x - L * 0.46, y - Hh * 0.5);
    c.lineTo(x - L * 0.66, y + Hh * 0.5);
    c.stroke();
    void rnd;
    c.restore();
  }

  /** 柳：从树冠往下垂的长枝 —— 不是一根根竖着长的草 */
  function willow(c, x, baseY, h, seed) {
    const rnd = V.rng(seed || 4);
    const crownY = baseY - h;
    c.save();
    // 主干
    c.strokeStyle = 'rgba(52,46,34,0.80)';
    c.lineWidth = 4.0;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, baseY);
    c.quadraticCurveTo(x + h * 0.05, baseY - h * 0.45, x - h * 0.02, crownY);
    c.stroke();
    // 树冠：一团淡淡的绿
    c.fillStyle = 'rgba(96,112,74,0.30)';
    c.beginPath();
    c.ellipse(x, crownY - h * 0.04, h * 0.26, h * 0.13, 0, 0, Math.PI * 2);
    c.fill();
    // 垂枝：从树冠往外甩，再垂下去
    for (let i = 0; i < 52; i++) {
      const t0 = (rnd() - 0.5) * h * 0.40;
      const sy = crownY - h * 0.04 + (rnd() - 0.5) * h * 0.06;
      const len = h * (0.30 + rnd() * 0.46);
      const out = (rnd() - 0.5) * h * 0.30;
      c.strokeStyle = `rgba(74,92,60,${0.34 + rnd() * 0.40})`;
      c.lineWidth = 1.1 + rnd() * 1.2;
      c.beginPath();
      c.moveTo(x + t0, sy);
      c.quadraticCurveTo(x + t0 + out * 0.7, sy + len * 0.45, x + t0 + out, sy + len);
      c.stroke();
    }
    c.restore();
  }

  /** 小人物：一指高。界画里的人就是这样几笔 */
  function figure(c, x, y, h, col, phase) {
    c.save();
    c.strokeStyle = col || INK;
    c.fillStyle = col || INK;
    c.lineWidth = Math.max(1.2, h * 0.055);
    c.lineCap = 'round';
    c.beginPath();
    c.arc(x, y - h * 0.88, h * 0.12, 0, Math.PI * 2);
    c.fill();
    // 身（一件袍子）
    c.beginPath();
    c.moveTo(x, y - h * 0.76);
    c.lineTo(x, y - h * 0.30);
    c.stroke();
    // 腿：交替抬
    const sw = Math.sin(phase || 0) * h * 0.16;
    c.beginPath();
    c.moveTo(x, y - h * 0.30);
    c.lineTo(x - sw, y);
    c.moveTo(x, y - h * 0.30);
    c.lineTo(x + sw, y);
    c.stroke();
    // 臂
    c.beginPath();
    c.moveTo(x, y - h * 0.66);
    c.lineTo(x + h * 0.15, y - h * 0.46);
    c.stroke();
    c.restore();
  }


  /** 板车：两只轮子 + 车厢 + 车辕 + 一头驴 */
  function cart(c, x, y, s, seed) {
    const rnd = V.rng(seed || 9);
    c.save();
    // 车厢
    c.fillStyle = 'rgba(150,120,78,0.92)';
    c.fillRect(x - s * 0.34, y - s * 0.42, s * 0.66, s * 0.22);
    c.strokeStyle = 'rgba(34,30,23,0.8)';
    c.lineWidth = 1.6;
    c.strokeRect(x - s * 0.34, y - s * 0.42, s * 0.66, s * 0.22);
    // 车辕
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(x + s * 0.32, y - s * 0.30);
    c.lineTo(x + s * 0.62, y - s * 0.34);
    c.stroke();
    // 两个轮子
    for (const wx of [-0.16, 0.18]) {
      c.beginPath();
      c.arc(x + s * wx, y - s * 0.10, s * 0.15, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(34,30,23,0.85)';
      c.lineWidth = 1.8;
      c.stroke();
      c.lineWidth = 0.9;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        c.beginPath();
        c.moveTo(x + s * wx, y - s * 0.10);
        c.lineTo(x + s * wx + Math.cos(a) * s * 0.15, y - s * 0.10 + Math.sin(a) * s * 0.15);
        c.stroke();
      }
    }
    // 驴：一个身子 + 四条腿 + 一条长脸
    const lx = x + s * 0.78;
    c.strokeStyle = 'rgba(62,56,44,0.85)';
    c.fillStyle = 'rgba(96,88,70,0.85)';
    c.lineWidth = 1.8;
    c.beginPath();
    c.ellipse(lx, y - s * 0.34, s * 0.16, s * 0.09, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(lx + s * 0.13, y - s * 0.38);
    c.lineTo(lx + s * 0.26, y - s * 0.50);
    c.stroke();
    for (const dx of [-0.09, -0.02, 0.06, 0.11]) {
      c.beginPath();
      c.moveTo(lx + s * dx, y - s * 0.30);
      c.lineTo(lx + s * dx + (rnd() - 0.5) * 3, y - s * 0.10);
      c.stroke();
    }
    c.restore();
  }

  /** 酒旗：一根杆 + 一面竖布 */
  function banner(c, x, y, h, seed) {
    const rnd = V.rng(seed || 10);
    c.save();
    c.strokeStyle = 'rgba(34,30,23,0.8)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y - h);
    c.stroke();
    c.fillStyle = 'rgba(226,212,182,0.95)';
    c.beginPath();
    c.moveTo(x + 2, y - h);
    c.lineTo(x + 26, y - h + 6);
    c.lineTo(x + 24, y - h + 52);
    c.lineTo(x + 2, y - h + 46);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(46,43,35,0.6)';
    c.lineWidth = 1.2;
    c.stroke();
    // 旗上的墨字（几笔）
    c.strokeStyle = 'rgba(46,43,35,0.7)';
    c.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(x + 8, y - h + 14 + i * 12);
      c.lineTo(x + 20, y - h + 12 + i * 12);
      c.stroke();
    }
    void rnd;
    c.restore();
  }

  /** 货担：一根扁担 + 两只筐 */
  function load(c, x, y, s) {
    c.save();
    c.strokeStyle = 'rgba(34,30,23,0.75)';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(x - s * 0.5, y - s * 0.62);
    c.lineTo(x + s * 0.5, y - s * 0.58);
    c.stroke();
    for (const dx of [-0.5, 0.5]) {
      c.beginPath();
      c.moveTo(x + s * dx, y - s * 0.60);
      c.lineTo(x + s * dx, y - s * 0.34);
      c.stroke();
      c.fillStyle = 'rgba(146,116,74,0.85)';
      c.beginPath();
      c.ellipse(x + s * dx, y - s * 0.24, s * 0.15, s * 0.13, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(34,30,23,0.7)';
      c.lineWidth = 1.2;
      c.stroke();
    }
    c.restore();
  }

  S.qingming = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const cam = meta.cam || V.camDefault();

      const baked = V.layer.bake2d('qingming:base', (g) => {
        const c = g.drawingContext;
        const W = g.width, H = g.height;
        V.paper.paint(c, W, H, 'silk', 606);
        const rnd = V.rng(606);

        const riverTop = 250;
        const riverBot = 486;
        const streetTop = 700;
        const bankY = Math.round(V.ROAD_Y * V.U) - 9;   // ≈ 896

        // ================= 远岸：屋顶 + 树 =================
        // 后面一排（小、淡）。等宽等高会排成一堵墙 —— 每栋都要不一样，中间还要留空当。
        let bx0 = -30;
        let hi = 0;
        while (bx0 < W + 90) {
          const hw = 66 + rnd() * 52;
          if (rnd() > 0.14) house(c, bx0 + hw / 2, 138 + rnd() * 10, hw, 62 + rnd() * 26, 200 + hi);
          bx0 += hw + 16 + rnd() * 46;
          hi++;
        }
        // 前面一排（大、清楚）
        bx0 = -70;
        hi = 0;
        while (bx0 < W + 90) {
          const hw = 104 + rnd() * 74;
          if (rnd() > 0.12) house(c, bx0 + hw / 2, 196 + rnd() * 12, hw, 84 + rnd() * 34, 400 + hi);
          bx0 += hw + 18 + rnd() * 52;
          hi++;
        }
        // 屋后树影
        for (let i = 0; i < 52; i++) {
          c.fillStyle = `rgba(92,108,78,${0.14 + rnd() * 0.16})`;
          c.beginPath();
          c.ellipse(rnd() * W, 72 + rnd() * 46, 20 + rnd() * 26, 10 + rnd() * 12, 0, 0, Math.PI * 2);
          c.fill();
        }
        // 河滩：房基与水线之间的一条土岸，别留一条空白绢
        c.fillStyle = 'rgba(202,184,144,0.90)';
        c.fillRect(0, 196, W, riverTop - 196);
        // 岸边几丛草
        c.save();
        c.strokeStyle = 'rgba(96,112,76,0.45)';
        c.lineWidth = 1.2;
        for (let i = 0; i < 220; i++) {
          const gx = rnd() * W;
          const gy = 214 + rnd() * (riverTop - 220);
          c.beginPath();
          c.moveTo(gx, gy);
          c.lineTo(gx + (rnd() - 0.5) * 6, gy - (4 + rnd() * 9));
          c.stroke();
        }
        c.restore();
        // 岸线
        ruled(c, 0, riverTop - 2, W, riverTop - 2, 2.4, 'rgba(46,43,35,0.55)');

        // ================= 河 =================
        const rg = c.createLinearGradient(0, riverTop, 0, riverBot);
        rg.addColorStop(0, 'rgba(158,172,164,0.50)');
        rg.addColorStop(0.45, 'rgba(176,188,178,0.58)');
        rg.addColorStop(1, 'rgba(156,170,162,0.46)');
        c.fillStyle = rg;
        c.fillRect(0, riverTop, W, riverBot - riverTop);
        // 水纹：一截截短横线，长短不一（不是重复的扇贝）
        c.save();
        c.strokeStyle = 'rgba(58,72,66,0.26)';
        c.lineWidth = 1.1;
        c.lineCap = 'round';
        for (let y = riverTop + 16; y < riverBot - 6; y += 11) {
          let x = -20 + rnd() * 30;
          while (x < W) {
            const len = 14 + rnd() * 34;
            c.beginPath();
            c.moveTo(x, y + (rnd() - 0.5) * 2);
            c.lineTo(x + len, y + (rnd() - 0.5) * 2);
            c.stroke();
            x += len + 10 + rnd() * 26;
          }
        }
        c.restore();
        ruled(c, 0, riverBot, W, riverBot, 2.8, 'rgba(46,43,35,0.62)');

        // ================= 船 =================
        boat(c, 268, 404, 176, 71);
        boat(c, 760, 372, 214, 72);
        boat(c, 1420, 420, 156, 73);
        boat(c, 1760, 344, 132, 74);

        // ================= 虹桥 =================
        const bx = 1080, bw = 420;
        // 桥的两端要落在两岸上：左端在近岸（streetTop 附近），右端在远岸（riverTop 附近），
        // 中间拱起来 —— 不然桥就是立在水里的一个箍。
        // 桥的两端都落在**水边**（riverBot / riverTop），不是落在街心。
        // 落在街心的话，桥看起来是一段架在陆地上的坡道。
        const deckY = (tt) => V.lerp(riverBot + 6, riverTop - 4, tt)
          - Math.sin(tt * Math.PI) * 104;
        c.save();
        // 桥身：一条厚木带
        c.strokeStyle = 'rgba(126,98,62,0.92)';
        c.lineWidth = 26;
        c.lineJoin = 'round';
        c.beginPath();
        for (let i = 0; i <= 24; i++) {
          const tt = i / 24;
          const px = bx - bw / 2 + bw * tt;
          if (i === 0) c.moveTo(px, deckY(tt)); else c.lineTo(px, deckY(tt));
        }
        c.stroke();
        // 桥面上下两条墨线
        c.strokeStyle = 'rgba(34,30,23,0.9)';
        c.lineWidth = 2.6;
        for (const off of [-13, 13]) {
          c.beginPath();
          for (let i = 0; i <= 24; i++) {
            const tt = i / 24;
            const px = bx - bw / 2 + bw * tt;
            if (i === 0) c.moveTo(px, deckY(tt) + off); else c.lineTo(px, deckY(tt) + off);
          }
          c.stroke();
        }
        // 桥面木板
        c.strokeStyle = 'rgba(34,30,23,0.30)';
        c.lineWidth = 1;
        for (let i = 1; i < 40; i++) {
          const tt = i / 40;
          const px = bx - bw / 2 + bw * tt;
          c.beginPath();
          c.moveTo(px, deckY(tt) - 13);
          c.lineTo(px, deckY(tt) + 13);
          c.stroke();
        }
        // 栏板：密柱 + 两道横杆
        c.strokeStyle = 'rgba(34,30,23,0.75)';
        c.lineWidth = 1.4;
        for (let i = 0; i <= 30; i++) {
          const tt = i / 30;
          const px = bx - bw / 2 + bw * tt;
          const py = deckY(tt) - 13;
          c.beginPath();
          c.moveTo(px, py);
          c.lineTo(px, py - 20);
          c.stroke();
        }
        c.lineWidth = 2.0;
        for (const dy of [-20, -34]) {
          c.beginPath();
          for (let i = 0; i <= 24; i++) {
            const tt = i / 24;
            const px = bx - bw / 2 + bw * tt;
            if (i === 0) c.moveTo(px, deckY(tt) - 13 + dy); else c.lineTo(px, deckY(tt) - 13 + dy);
          }
          c.stroke();
        }
        // 桥上的人
        for (let i = 0; i < 12; i++) {
          const tt = 0.06 + rnd() * 0.88;
          const px = bx - bw / 2 + bw * tt;
          figure(c, px, deckY(tt) - 16, 54, 'rgba(40,37,30,0.86)', rnd() * 6);
        }
        c.restore();

        // ================= 近岸：先铺地，再盖房 =================
        // 顺序反了的话，地面会把店铺整排糊掉（这一版踩过）。
        c.fillStyle = 'rgba(210,192,152,0.94)';
        c.fillRect(0, riverBot, W, streetTop - riverBot);
        let sx0 = -50;
        let si = 0;
        while (sx0 < W + 90) {
          const hw = 108 + rnd() * 80;
          if (rnd() > 0.16) house(c, sx0 + hw / 2, streetTop - 78 - rnd() * 14, hw, 92 + rnd() * 34, 600 + si);
          sx0 += hw + 20 + rnd() * 40;
          si++;
        }

        // ================= 街道 =================
        const street = c.createLinearGradient(0, streetTop, 0, H);
        street.addColorStop(0, 'rgba(200,182,142,0.95)');
        street.addColorStop(0.55, 'rgba(192,172,132,0.95)');
        street.addColorStop(1, 'rgba(176,156,118,0.95)');
        c.fillStyle = street;
        c.fillRect(0, streetTop, W, H - streetTop);
        // 街口一道墨线：两带之间不要硬切
        ruled(c, 0, streetTop, W, streetTop, 2.2, 'rgba(46,43,35,0.45)');
        // 街面的纵向车辙
        c.save();
        c.strokeStyle = 'rgba(120,100,66,0.16)';
        c.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
          const x = 80 + i * 260 + rnd() * 60;
          c.beginPath();
          c.moveTo(x, streetTop + 20);
          c.lineTo(x + 30, H);
          c.stroke();
        }
        c.restore();

        // 摊位
        const stall = (sx, sy, sw) => {
          c.save();
          c.strokeStyle = 'rgba(46,43,35,0.78)';
          c.lineWidth = 2.2;
          c.beginPath(); c.moveTo(sx - sw / 2, sy); c.lineTo(sx - sw / 2, sy - 54); c.stroke();
          c.beginPath(); c.moveTo(sx + sw / 2, sy); c.lineTo(sx + sw / 2, sy - 54); c.stroke();
          c.fillStyle = 'rgba(230,214,182,0.96)';
          c.beginPath();
          c.moveTo(sx - sw / 2 - 14, sy - 54);
          c.lineTo(sx + sw / 2 + 14, sy - 54);
          c.lineTo(sx + sw / 2 + 4, sy - 76);
          c.lineTo(sx - sw / 2 - 4, sy - 76);
          c.closePath();
          c.fill();
          c.strokeStyle = 'rgba(46,43,35,0.62)';
          c.lineWidth = 1.4;
          c.stroke();
          c.fillStyle = 'rgba(157,83,64,0.55)';
          c.beginPath(); c.ellipse(sx - sw * 0.2, sy - 50, 10, 6, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = 'rgba(124,127,87,0.6)';
          c.beginPath(); c.ellipse(sx + sw * 0.18, sy - 50, 9, 5, 0, 0, Math.PI * 2); c.fill();
          c.restore();
        };
        stall(392, bankY - 10, 84);
        stall(836, bankY - 6, 76);
        stall(1480, bankY - 12, 88);

        // 街上的车、旗、担：把空地填起来
        cart(c, 240, bankY + 6, 132, 21);
        cart(c, 1088, bankY - 2, 118, 22);
        cart(c, 1560, bankY + 10, 126, 23);
        banner(c, 520, bankY - 8, 96, 31);
        banner(c, 1180, bankY - 12, 110, 32);
        banner(c, 1824, bankY - 6, 92, 33);
        load(c, 700, bankY - 2, 44);
        load(c, 940, bankY + 4, 40);
        load(c, 1408, bankY - 4, 46);

        // 柳：沿街
        willow(c, 196, bankY + 8, 250, 11);
        willow(c, 640, bankY + 16, 286, 12);
        willow(c, 1268, bankY + 4, 232, 13);
        willow(c, 1724, bankY + 12, 268, 14);

        // ================= 前景：最下面一排屋顶（我们是站在更高的地方往下看） =================
        let fx0 = -90;
        let fi = 0;
        while (fx0 < W + 120) {
          const fw = 150 + rnd() * 130;
          roof(c, fx0 + fw / 2, H + 6 + rnd() * 14, fw, 120 + rnd() * 80, 800 + fi);
          fx0 += fw + 8 + rnd() * 26;
          fi++;
        }

        // ================= 远景小人（铺满街市） =================
        for (let i = 0; i < 34; i++) {
          figure(c, rnd() * W, streetTop + 20 + rnd() * 170, 50 + rnd() * 14,
            'rgba(40,37,30,0.60)', rnd() * 6);
        }

        V.paper.innerShadow(c, W, H, 0.10, 120);
      }, { w: V.W, h: V.H });

      ctx.drawImage(baked.canvas, 0, 0);

      // ---------------- 动态层 ----------------
      V.enterCam(ctx, cam);

      // 走动的路人：跟着路面滚，比主角多得多
      const off = (t * B.ROAD_SPEED) % 300;
      for (let i = 0; i < 11; i++) {
        const base = i * 186 + 40;
        const span = V.STAGE + 500;
        const x = ((base - off) % span + span) % span - 250;
        const y = V.ROAD_Y - 6 + (i % 4) * 14;
        figure(ctx, x, y, 58 + (i % 3) * 8, 'rgba(40,37,30,0.82)', t * 6 + i);
      }

      // 主角：混在人堆里
      B.drawRider(ctx, t, {
        scale: 0.42,
        shadow: true,
        shadowStyle: { alpha: 0.14, color: '#5c4a2c' },
        pelicanStyle: {
          body: '#efe6cf', bodyShade: '#e0d4b6', line: INK,
          beak: OCHRE, beakDark: '#8a6a34', pouch: RED, pouchShade: '#7d3f30',
          leg: RED, eye: INK, lw: 2.4, feather: 0, eyeStyle: 'dot',
        },
        bikeStyle: {
          frame: INK, frameDark: INK_SOFT, tire: INK, rim: INK_SOFT,
          spoke: INK_SOFT, saddle: INK, lw: 2.0, tubeW: 3.0, spokes: 10, shine: 0,
        },
      });

      V.exitCam(ctx);

      V.titles.draw(ctx, 'vertical', meta.strings, u, V.titles.opts('qingming', { dur: meta.dur }));
    },
  };
})();
