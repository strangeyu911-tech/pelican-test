/* scenes/egypt.js — 02 埃及墓室壁画（12 – 18 s，3 小节）
 *
 * 时代规矩：一条地平线、上下分横带（register）、人物严格侧面、重要的人画得更大、
 * 底色上还留着匠人打的红网格。
 *
 * 梗：**埃及壁画里没有辐条**。轮子在这套画法里只能画成一个实心圆盘 ——
 *     于是它蹬得越使劲，轮子越看不出来在转，整辆车像在石板上滑。
 *     第 2 小节它低头看了一眼自己的轮子，还在蹬。
 *
 *   ① 0 – 2   横带立起来，象形文字浮出，骑手从左外进入
 *   ② 2 – 4   低头看轮子（headTilt 压下去），轮子依然是两个实心盘
 *   ③ 4 – 6   抬头，继续滑向右边
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;

  const PLASTER = '#d9c9a3';
  const GRID = 'rgba(176,72,48,0.24)';       // 匠人打的红网格
  const INK = '#20180f';
  const OCHRE_R = '#9c3f26';                 // 铁红
  const OCHRE_Y = '#c08a3a';
  const BLUE = '#3f6d84';

  // ---------------------------------------------------------------
  // 象形文字：五个能认出来的符号，够读成"这是埃及"就够
  // ---------------------------------------------------------------
  function gAnkh(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.16; c.lineCap = 'round';
    c.beginPath(); c.ellipse(x, y - s * 0.62, s * 0.24, s * 0.30, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(x, y - s * 0.30); c.lineTo(x, y + s * 0.86); c.stroke();
    c.beginPath(); c.moveTo(x - s * 0.42, y + s * 0.06); c.lineTo(x + s * 0.42, y + s * 0.06); c.stroke();
  }
  function gEye(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.13; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - s * 0.72, y);
    c.quadraticCurveTo(x, y - s * 0.54, x + s * 0.72, y);
    c.quadraticCurveTo(x, y + s * 0.46, x - s * 0.72, y);
    c.stroke();
    c.fillStyle = col;
    c.beginPath(); c.arc(x, y, s * 0.17, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(x - s * 0.1, y + s * 0.3); c.lineTo(x - s * 0.34, y + s * 0.78); c.stroke();
    c.beginPath(); c.moveTo(x + s * 0.5, y + s * 0.06); c.quadraticCurveTo(x + s * 0.92, y + s * 0.3, x + s * 0.66, y + s * 0.62); c.stroke();
  }
  function gWater(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.13; c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      c.lineTo(x - s * 0.7 + i * s * 0.46, y + (i % 2 ? s * 0.16 : -s * 0.16));
    }
    c.stroke();
  }
  function gLoaf(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y + s * 0.24, s * 0.46, Math.PI, 0);
    c.closePath(); c.fill();
  }
  function gReed(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = s * 0.15; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y + s * 0.86);
    c.quadraticCurveTo(x + s * 0.34, y, x - s * 0.02, y - s * 0.86);
    c.stroke();
  }
  function gBird(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(x, y + s * 0.12, s * 0.44, s * 0.26, -0.16, 0, Math.PI * 2);
    c.fill();
    c.beginPath(); c.arc(x + s * 0.44, y - s * 0.18, s * 0.15, 0, Math.PI * 2); c.fill();
    c.strokeStyle = col; c.lineWidth = s * 0.1;
    c.beginPath(); c.moveTo(x + s * 0.58, y - s * 0.20); c.lineTo(x + s * 0.86, y - s * 0.06); c.stroke();
    c.beginPath(); c.moveTo(x - s * 0.02, y + s * 0.36); c.lineTo(x - s * 0.02, y + s * 0.82); c.stroke();
    c.beginPath(); c.moveTo(x + s * 0.2, y + s * 0.36); c.lineTo(x + s * 0.2, y + s * 0.82); c.stroke();
  }
  const GLYPHS = [gAnkh, gEye, gWater, gLoaf, gReed, gBird];

  /** 一条横带里的象形文字列 */
  function glyphRow(c, x0, x1, y, size, rnd, cols) {
    const gap = size * 1.55;
    for (let x = x0; x < x1; x += gap) {
      const g = GLYPHS[rnd.int(0, GLYPHS.length - 1)];
      g(c, x, y, size * (0.82 + rnd() * 0.36), cols[rnd.int(0, cols.length - 1)]);
    }
  }

  S.egypt = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const cam = meta.cam || V.camDefault();

      // ---------------- 静态层 ----------------
      const baked = V.layer.bake2d('egypt:base', (g) => {
        const c = g.drawingContext;
        const W = g.width, H = g.height;
        V.paper.paint(c, W, H, 'plaster', 1300);
        const rnd = V.rng(1301);

        // 分带的地平线：上带、中带（场景）、下带
        const bandTop = 96, bandMid = 620, bandBot = 984;
        c.strokeStyle = 'rgba(60,40,20,0.42)';
        c.lineWidth = 3;
        for (const y of [bandTop, bandMid, bandBot]) {
          c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
        }
        // 双线（埃及壁画爱用双线收边）
        c.lineWidth = 1.2;
        for (const y of [bandTop + 7, bandMid - 7, bandBot - 7]) {
          c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
        }

        // 上带：象形文字
        glyphRow(c, 34, W - 34, 52, 34, V.rng(21), [INK, INK, OCHRE_R, BLUE]);
        // 下带：另一行，小一点
        glyphRow(c, 34, W - 34, 1036, 26, V.rng(22), [INK, OCHRE_R, BLUE, OCHRE_Y]);

        // 中带上方再浮一行，压在场景的"天空"里
        glyphRow(c, 60, W - 60, 250, 21, V.rng(23), [INK, 'rgba(32,24,15,0.75)']);

        // 左端三列竖排象形文字：墓室墙面不该有空场
        const cr = V.rng(24);
        for (let col = 0; col < 3; col++) {
          const cx = 96 + col * 74;
          c.save();
          c.strokeStyle = 'rgba(60,40,20,0.30)';
          c.lineWidth = 1.2;
          c.beginPath(); c.moveTo(cx - 34, bandTop + 12); c.lineTo(cx - 34, bandMid - 12); c.stroke();
          for (let y = bandTop + 46; y < bandMid - 60; y += 58) {
            const g2 = GLYPHS[cr.int(0, GLYPHS.length - 1)];
            g2(c, cx, y, 20 + cr() * 6, cr.int(0, 1) ? INK : BLUE);
          }
          c.restore();
        }

        // 匠人打的红网格：整幅等距，稍微不齐（手打的）
        c.save();
        c.strokeStyle = GRID;
        c.lineWidth = 1;
        for (let x = 0, i = 0; x < W; x += 78, i++) {
          const jx = Math.sin(i * 1.7) * 2.4;
          c.beginPath(); c.moveTo(x + jx, bandTop + 8); c.lineTo(x + jx, bandBot - 8); c.stroke();
        }
        for (let y = bandTop + 8, i = 0; y < bandBot - 8; y += 78, i++) {
          const jy = Math.sin(i * 2.3) * 2.0;
          c.beginPath(); c.moveTo(0, y + jy); c.lineTo(W, y + jy); c.stroke();
        }
        c.restore();

        // 中带右端：一根断掉的柱子（墓室墙角）
        c.save();
        c.fillStyle = 'rgba(150,110,60,0.34)';
        c.fillRect(W - 132, bandTop + 8, 40, bandMid - bandTop - 16);
        c.strokeStyle = 'rgba(60,40,20,0.35)';
        c.lineWidth = 2;
        c.strokeRect(W - 132, bandTop + 8, 40, bandMid - bandTop - 16);
        c.restore();

        // 墙面斑驳
        for (let i = 0; i < 260; i++) {
          const x = rnd() * W, y = rnd() * H, r = 1 + rnd() * 5;
          c.fillStyle = rnd() > 0.45 ? 'rgba(120,86,44,0.10)' : 'rgba(255,240,210,0.12)';
          c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        }

        V.paper.innerShadow(c, W, H, 0.16, 130);
      }, { w: V.W, h: V.H });

      ctx.drawImage(baked.canvas, 0, 0);

      // ---------------- 动态层 ----------------
      const cam2 = meta.cam || V.camDefault();
      V.enterCam(ctx, cam2);

      // 地面就是中带下沿那条线
      B.drawRoad(ctx, t, { color: '#cdb583', depth: 96, grain: 0.35, speed: 1 });

      // 第 2 小节：低头看轮子
      const look = V.envelope(u, 1.98, 2.30, 3.30, 3.70);
      const mods = {
        headTilt: look * 0.34,
        neckCurl: look * 0.22,
        lean: -look * 0.03,
        bob: look * 0.12,
      };

      B.drawRider(ctx, t, {
        scale: 1.16,
        mods,
        shadow: true,
        shadowStyle: { alpha: 0.12, color: '#5a4020' },
        pelicanStyle: {
          body: '#e3d3ad', bodyShade: '#d2bf95', line: INK,
          beak: OCHRE_Y, beakDark: '#9a6a24', pouch: OCHRE_Y, pouchShade: '#9a6a24',
          leg: OCHRE_R, eye: INK, lw: 3.0, feather: 0, eyeStyle: 'default',
        },
        // 没有辐条：轮子在埃及画法里只能是实心盘
        bikeStyle: {
          frame: INK, frameDark: INK, tire: INK, rim: INK,
          spoke: INK, saddle: INK, lw: 4.6, tubeW: 7, spokes: 0, shine: 0,
        },
      });

      V.exitCam(ctx);

      V.titles.draw(ctx, 'vertical', meta.strings, u, V.titles.opts('egypt', { dur: meta.dur }));
    },
  };
})();
