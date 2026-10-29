/* scenes/song.js — 05 宋代山水（28 – 36 s，4 小节）
 *
 * 致敬《溪山行旅图》一路的"巨碑山水"：主峰占据画幅中央，人在山脚小到看不见。
 *
 * 梗：前两小节观众根本找不到鹈鹕 —— 它就是山道上一个点；镜头推上来才认出是只骑车的鹈鹕。
 *
 *   ① 0 – 2   全景，主峰压下来，鹈鹕 0.30 倍
 *   ② 2 – 4   镜头推近
 *   ③ 4 – 6   认出来了
 *   ④ 6 – 8   继续推，朝下一个画框去
 *
 * 画法全部走 src/kit/ink.js：
 *   · 山体 = 上浓下淡的底 + 噪声水痕（不是平涂，也不是几块大灰斑）
 *   · 皴   = 抖动网格上的短笔（不是随机撒 —— 随机会结块又留空，长成草）
 *   · 苔点 = 沿山脊布点（不是均匀撒）
 *   · 山脚 = 在轮廓内部用纸色淡出（不盖雾带，盖一条一定留边）
 *
 * 版面按真迹比例：主峰平顶占画幅中间 43%，崖顶在 6% 高，崖脚 65%；
 * 左右各一座矮崖；雾在山脚；中景土坡长树；前景河滩 + 坡石。
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;
  const K = V.ink;

  const PAPER = '#efe8d8';


  S.song = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const dur = meta.dur || 8;

      const baked = V.layer.bake2d('song:base', (g) => {
        const c = g.drawingContext;
        const W = g.width, H = g.height;
        V.paper.paint(c, W, H, 'xuan', 1007);

        // ---------- 1 天 ----------
        const sky = c.createLinearGradient(0, 0, 0, 560);
        sky.addColorStop(0, 'rgba(203,184,153,0.70)');
        sky.addColorStop(1, 'rgba(203,184,153,0)');
        c.fillStyle = sky;
        c.fillRect(0, 0, W, 560);

        // ---------- 2 远山 ----------
        for (let k = 0; k < 3; k++) {
          const base = 356 + k * 38;
          const nz = K.noise(90 + k);
          const pts = [];
          for (let i = 0; i <= 26; i++) {
            const x = -60 + i * 80;
            const hh = 26 + K.fbm(nz, i * 0.31, k * 3.7, 2, 0.5) * (70 + k * 26);
            pts.push([x, base - hh]);
          }
          pts.push([2020, base + 180], [-60, base + 180]);
          c.save();
          c.globalAlpha = [0.30, 0.24, 0.18][k];
          c.fillStyle = ['#b9b19f', '#a89f8c', '#8e8674'][k];
          K.path(c, pts);
          c.fill();
          c.restore();
        }

        // ---------- 3 左右矮崖 ----------
        const leftCliff = K.cliff({ x0: -30, x1: 460, yTop: 392, yBot: 700, jag: 13, notch: 0.16, n: 14, step: 3, flare: 40 }, V.rng(21));
        const rightCliff = K.cliff({ x0: 1352, x1: 1958, yTop: 306, yBot: 700, jag: 16, notch: 0.2, n: 16, step: 4, flare: 46 }, V.rng(22));

        for (const [pts, seed, tone] of [[leftCliff, 31, 0.46], [rightCliff, 32, 0.54]]) {
          c.save();
          c.globalAlpha = tone * 0.8;
          c.fillStyle = '#8d8574';
          K.path(c, pts);
          c.fill();
          c.restore();
          K.layerWash(c, pts, { n: 12, alpha: 0.08, tone: '#3a352b', seed, bias: 0.6 });
          K.layerWash(c, pts, { n: 7, alpha: 0.09, tone: '#26221b', seed: seed + 9, bias: 1.2 });
          K.cunFlow(c, pts, { lines: 10, per: 24, len: [6, 22], spread: 12, alpha: 0.22, thick: 1.2, seed: seed + 1 });
          K.edgeInk(c, pts, { w: 16, alpha: 0.12, seed: seed + 4 });
          K.contour(c, pts.slice(0, 16), { color: '#2a2620', w: 2.4, seed: seed + 2 });
          K.moss(c, pts.slice(0, 16), { step: 8, spread: 9, r: 2.4, alpha: 0.6, seed: seed + 3, threshold: 0.3 });
        }

        // ---------- 4 主峰 ----------
        const main = K.cliff({
          x0: 470, x1: 1268, yTop: 66, yBot: 706, jag: 22, notch: 0.26, n: 22, step: 5, flare: 74,
        }, V.rng(41));

        // 墨：先一层极淡的底，再罩 20 层，最后补裂隙与短皴
        // 底子要够深。上一版底只有 0.22 的淡灰，罩完还是一团雾。
        c.save();
        c.globalAlpha = 0.62;
        c.fillStyle = '#4a4438';
        K.path(c, main);
        c.fill();
        c.restore();

        // 罩染：主体加深 + 少量提亮，做出"墨分五色"
        K.layerWash(c, main, { n: 22, alpha: 0.09, tone: '#231f19', seed: 51, bias: 0.5 });
        K.layerWash(c, main, { n: 12, alpha: 0.11, tone: '#191612', seed: 52, bias: 1.2 });
        K.layerWash(c, main, { n: 9, alpha: 0.07, tone: '#a29883', seed: 53, bias: 0.25 });

        // 裂隙不能长：130px 的竖线在崖面上就是一道道刮痕。改成 60px、偏斜 25°。
        K.crevice(c, main, { n: 10, len: 60, ang: 1.22, thick: 2.6, alpha: 0.22, seed: 54 });
        K.crevice(c, main, { n: 22, len: 34, ang: 1.18, thick: 1.4, alpha: 0.18, seed: 55 });

        // 皴：短笔，只在崖顶一带密
        K.cunFlow(c, main, { lines: 40, per: 64, len: [6, 22], spread: 18, slant: 0.04, alpha: 0.18, thick: 1.0, seed: 71 });
        K.cunFlow(c, main, { lines: 22, per: 40, len: [8, 30], spread: 24, slant: 0.06, alpha: 0.16, thick: 1.6, seed: 75 });
        K.cunFlow(c, main, {
          lines: 22, per: 30, len: [8, 32], spread: 16, slant: 0.04, alpha: 0.26, thick: 1.5, seed: 74, yTop: 60, yBot: 300,
        });
        K.edgeInk(c, main, { w: 24, alpha: 0.16, color: '#080705', seed: 73 });

        K.contour(c, main.slice(0, 23), { color: '#0b0908', w: 4.6, jitter: 2.8, seed: 64 });
        K.moss(c, main.slice(0, 23), { step: 4.2, spread: 14, r: 3.0, alpha: 0.9, seed: 65, drop: 9, threshold: 0.18 });
        K.moss(c, main.slice(0, 23), { step: 11, spread: 90, r: 2.2, alpha: 0.34, seed: 66, drop: 40, threshold: 0.42 });

        // ---------- 5 瀑布 ----------
        const fx = 1150, fy = 212;
        const fallG = c.createLinearGradient(0, fy, 0, 640);
        fallG.addColorStop(0, 'rgba(252,249,240,0.94)');
        fallG.addColorStop(0.45, 'rgba(252,249,240,0.70)');
        fallG.addColorStop(1, 'rgba(252,249,240,0)');
        const fr = V.rng(404);
        c.save();
        c.fillStyle = fallG;
        c.beginPath();
        c.moveTo(fx - 7, fy);
        for (let i = 1; i <= 7; i++) c.lineTo(fx - 7 - i * 1.1 + (fr() - 0.5) * 5, fy + ((640 - fy) * i) / 7);
        for (let i = 7; i >= 0; i--) c.lineTo(fx + 8 + i * 1.1 + (fr() - 0.5) * 5, fy + ((640 - fy) * i) / 7);
        c.closePath();
        c.fill();
        c.strokeStyle = 'rgba(20,17,13,0.55)';
        c.lineWidth = 1.7;
        c.beginPath(); c.moveTo(fx - 7, fy); c.lineTo(fx - 16, 634); c.stroke();
        c.beginPath(); c.moveTo(fx + 8, fy); c.lineTo(fx + 18, 634); c.stroke();
        c.restore();

        // ---------- 6 山脚淡出 ----------
        // 淡出从 580 才开始，给山体留足实墨；结束点在 742，正好被中景土坡盖住接缝
        K.fadeBase(c, main, PAPER, 580, 742, 0.95);
        K.fadeBase(c, leftCliff, PAPER, 560, 742, 0.95);
        K.fadeBase(c, rightCliff, PAPER, 560, 742, 0.95);
        K.haze(c, W * 0.5, 740, 1400, 120, PAPER, 0.44);

        // ---------- 7 中景：土坡 + 树 + 亭 ----------
        const nz2 = K.noise(77);
        const mounds = [
          { x0: -40, x1: 520, top: 742 },
          { x0: 480, x1: 1040, top: 736 },
          { x0: 1000, x1: 1560, top: 746 },
          { x0: 1520, x1: 1980, top: 750 },
        ];
        for (const m of mounds) {
          const pts = [];
          const n = 10;
          for (let i = 0; i <= n; i++) {
            const x = V.lerp(m.x0, m.x1, i / n);
            pts.push([x, m.top + Math.sin(i * 1.3 + m.x0) * 6]);
          }
          pts.push([m.x1, 812], [m.x0, 812]);
          c.save();
          c.globalAlpha = 0.5;
          c.fillStyle = '#8b8375';
          K.path(c, pts);
          c.fill();
          c.restore();
          K.cun(c, pts, { step: 10, len: [6, 18], dir: 0.2, alpha: 0.24, thick: 1.2, seed: 80 + m.x0 });
        }

        // 树：成丛、留空、大小不一。
        // 等距排开一定会变成一条篱笆 —— 真画里树是"这里一丛、那里几棵"。
        const trnd = V.rng(310);
        let tx = -30;
        while (tx < W + 40) {
          const gap = 34 + trnd() * 96;
          tx += gap;
          if (trnd() < 0.18) continue;                 // 空档
          const clusterN = 1 + Math.floor(trnd() * 4);
          const baseY = 738 + trnd() * 14;
          const baseH = 30 + trnd() * 26;
          for (let k = 0; k < clusterN; k++) {
            const bx = tx + (trnd() - 0.5) * 54;
            const bh = baseH * (0.62 + trnd() * 0.75);
            const ty = baseY + (trnd() - 0.5) * 8;
            const r = V.rng(900 + Math.floor(tx) * 7 + k);
            c.save();
            c.strokeStyle = '#2b2721';
            c.lineWidth = Math.max(1, bh * 0.06);
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(bx, ty);
            c.quadraticCurveTo(bx + bh * 0.1, ty - bh * 0.5, bx - bh * 0.05, ty - bh);
            c.stroke();
            // 冠形：不规则暗块
            c.fillStyle = '#16120d';
            c.globalAlpha = 0.55;
            c.beginPath();
            const cy0 = ty - bh * 0.86;
            const crx = bh * 0.42, cry = bh * 0.30;
            for (let q = 0; q < 13; q++) {
              const a = (q / 13) * Math.PI * 2;
              const rr = 0.62 + r() * 0.52;
              const px = bx + Math.cos(a) * crx * rr;
              const py = cy0 + Math.sin(a) * cry * rr;
              if (q === 0) c.moveTo(px, py); else c.lineTo(px, py);
            }
            c.closePath();
            c.fill();
            c.globalAlpha = 1;
            // 点叶
            const leaf = K.jitterGrid(bx - bh * 0.44, ty - bh * 1.16, bx + bh * 0.44, ty - bh * 0.58, 3.4, 3.4, r, 0.55);
            c.fillStyle = '#16120d';
            for (const lf of leaf) {
              const lx = lf[0], ly = lf[1];
              const nn = K.fbm(nz2, lx * 0.05, ly * 0.05, 2, 0.5);
              if (nn < 0.34) continue;
              c.globalAlpha = 0.35 + nn * 0.6;
              c.beginPath();
              c.ellipse(lx, ly, 1.3 + nn * 2.4, 1.1 + nn * 2.0, nn * 3, 0, Math.PI * 2);
              c.fill();
            }
            c.restore();
          }
        }
        // 崖肩上的树：真画会在崖顶和崖腰点几丛，交代尺度
        const ledgeTrees = [[508, 96, 26], [560, 120, 20], [1178, 110, 22],
          [1214, 150, 18], [640, 214, 16], [1042, 246, 18], [900, 300, 14]];
        for (let li = 0; li < ledgeTrees.length; li++) {
          const lt = ledgeTrees[li];
          const r2 = V.rng(600 + li);
          for (let q = 0; q < 3; q++) {
            const bx = lt[0] + (r2() - 0.5) * lt[2] * 1.4;
            const bh = lt[2] * (0.7 + r2() * 0.5);
            c.save();
            c.strokeStyle = '#14110c';
            c.lineWidth = Math.max(1, bh * 0.09);
            c.beginPath();
            c.moveTo(bx, lt[1]);
            c.lineTo(bx + (r2() - 0.5) * 4, lt[1] - bh);
            c.stroke();
            c.fillStyle = '#14110c';
            c.globalAlpha = 0.85;
            c.beginPath();
            c.ellipse(bx, lt[1] - bh * 1.05, bh * 0.5, bh * 0.32, 0, 0, Math.PI * 2);
            c.fill();
            c.restore();
          }
        }

        // 亭
        c.save();
        c.fillStyle = '#1b1813';
        c.beginPath();
        c.moveTo(1188, 736); c.lineTo(1232, 736); c.lineTo(1246, 716); c.lineTo(1174, 716);
        c.closePath(); c.fill();
        c.fillRect(1194, 736, 3, 20);
        c.fillRect(1222, 736, 3, 20);
        c.restore();

        // ---------- 8 山道 ----------
        const pathG = c.createLinearGradient(0, 812, 0, 852);
        pathG.addColorStop(0, 'rgba(234,225,204,0.97)');
        pathG.addColorStop(1, 'rgba(221,209,185,0.97)');
        c.fillStyle = pathG;
        c.fillRect(0, 812, W, 40);
        c.save();
        c.strokeStyle = 'rgba(56,50,41,0.42)';
        c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(0, 812); c.lineTo(W, 812); c.stroke();
        c.beginPath(); c.moveTo(0, 852); c.lineTo(W, 852); c.stroke();
        c.restore();

        // ---------- 9 河滩 + 前景坡石 ----------
        const ng = V.rng(120);
        c.save();
        c.strokeStyle = 'rgba(66,60,49,0.26)';
        c.lineWidth = 1.3;
        for (let i = 0; i < 11; i++) {
          const y = 870 + i * 17 + ng() * 6;
          c.beginPath();
          c.moveTo(ng() * 260, y);
          c.lineTo(W - ng() * 260, y + (ng() - 0.5) * 6);
          c.stroke();
        }
        c.restore();
        c.save();
        c.strokeStyle = 'rgba(42,38,30,0.58)';
        c.lineWidth = 1.25;
        c.lineCap = 'round';
        for (let i = 0; i < 420; i++) {
          const gx = ng() * W;
          const gy = 858 + Math.pow(ng(), 0.62) * 224;
          c.beginPath();
          c.moveTo(gx, gy);
          c.lineTo(gx + (ng() - 0.5) * 7, gy - (6 + ng() * 16));
          c.stroke();
        }
        c.restore();
        for (let i = 0; i < 34; i++) {
          c.save();
          c.globalAlpha = 0.5 + ng() * 0.45;
          c.fillStyle = '#332f27';
          c.beginPath();
          c.ellipse(ng() * W, 872 + ng() * 186, 5 + ng() * 26, 3 + ng() * 13, ng() * 3, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }

        const boulder = (bx, by, bw, bh, seed) => {
          const r = V.rng(seed);
          const pts = [];
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const rr = 0.5 + r() * 0.2;
            pts.push([bx + Math.cos(a) * bw * rr, by + Math.sin(a) * bh * rr]);
          }
          c.save();
          c.fillStyle = '#2b2721';
          K.path(c, pts);
          c.fill();
          c.restore();
          K.clipped(c, pts, (cc) => {
            cc.globalAlpha = 0.3;
            cc.fillStyle = PAPER;
            for (let i = 0; i < 10; i++) {
              cc.beginPath();
              cc.ellipse(bx + (r() - 0.5) * bw * 0.7, by + (r() - 0.5) * bh * 0.7,
                bw * (0.05 + r() * 0.16), bh * (0.04 + r() * 0.12), r() * 3, 0, Math.PI * 2);
              cc.fill();
            }
            cc.globalAlpha = 0.55;
            cc.strokeStyle = '#100e0a';
            for (let i = 0; i < 26; i++) {
              cc.lineWidth = 0.8 + r() * 1.8;
              const sx = bx + (r() - 0.5) * bw * 0.8;
              const sy = by + (r() - 0.5) * bh * 0.8;
              cc.beginPath();
              cc.moveTo(sx, sy);
              cc.lineTo(sx + (r() - 0.5) * 26, sy + 10 + r() * 24);
              cc.stroke();
            }
          });
          K.contour(c, pts.concat([pts[0]]), { color: '#0f0d0a', w: 2.2, seed: seed + 1 });
        };
        boulder(48, 1042, 210, 150, 201);
        boulder(224, 1074, 140, 104, 202);
        boulder(1888, 1036, 236, 168, 203);
        boulder(1700, 1066, 156, 116, 204);


        // ---------- 10 颗粒 + 暗角 ----------
        const gr = V.rng(991);
        for (let i = 0; i < 12000; i++) {
          c.fillStyle = gr() > 0.5 ? 'rgba(255,255,255,0.030)' : 'rgba(0,0,0,0.030)';
          c.fillRect(gr() * W, gr() * H, 1.6, 1.6);
        }
        V.paper.innerShadow(c, W, H, 0.13, 140);
      }, { w: V.W, h: V.H });

      // ---------------- 镜头 ----------------
      const push = V.ease.inOutCubic(V.clamp((u - 2.0) / 3.2));
      const cam = {
        x: V.lerp(V.STAGE * 0.5, V.RIDER_X + 160, push),
        y: V.lerp(V.STAGE * 0.5, 690, push),
        zoom: V.lerp(0.96, 1.72, push),
      };

      ctx.save();
      ctx.translate(960, 540);
      ctx.scale(1 + push * 0.14, 1 + push * 0.14);
      ctx.translate(-960, -540);
      ctx.drawImage(baked.canvas, 0, 0);
      ctx.restore();

      for (let i = 0; i < 3; i++) {
        const y = 640 + i * 46;
        const cx = (((t * (7 + i * 3)) % 2600) + 2600) % 2600 - 340;
        K.haze(ctx, cx, y, 900, 96, PAPER, 0.30 - i * 0.06);
      }

      V.enterCam(ctx, cam);
      B.drawRoad(ctx, t, { color: '#d3cab4', depth: 34, grain: 0.5, speed: 0.8 });
      B.drawRider(ctx, t, {
        scale: 0.30,
        shadow: true,
        shadowStyle: { alpha: 0.10, color: '#2a2622' },
        pelicanStyle: {
          body: '#f4eee0', bodyShade: '#e2d9c4', line: '#2b2720',
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
