/* scenes/sahara.js — 01 撒哈拉岩画（6 – 12 s，3 小节）
 *
 * 时代规矩：岩画没有透视、没有轮子、没有个体 —— 同一个侧影用同一个模子反复按。
 * 梗：整面岩壁上是一排一模一样的"鹈鹕骑车"，间距精确得像盖章；
 *     第 2 小节画家又在它旁边补按了一下，两只是同一个模子 —— 它并不特别。
 *
 *   ① 0 – 2   岩壁立起来，骑手从左外进入，右侧已经有一排先祖
 *   ② 2 – 4   旁边多按了一模一样的第二只（淡入、微微右移、再淡出）
 *   ③ 4 – 6   那一排向远处收小，骑手朝下一个画框去
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (window.V.scenes = window.V.scenes || {});
  const B = V.base;

  // 两种颜料：身体深到近乎黑，喙和袋用浅赭（像高岭土）。
  // 试过全身一色 —— 头和身体糊成一团，读不出是只鸟；只有喙部反相才认得出鹈鹕。
  const OCHRE = {
    body: '#331708', bodyShade: '#331708', line: '#331708',
    beak: '#dcac74', beakDark: '#c08f52', pouch: '#c68a4c', pouchShade: '#a9703a',
    leg: '#331708', eye: '#331708', lw: 3.2, feather: 0, eyeStyle: 'dot',
  };
  /** 岩画没有细辐条：一个粗圈 + 五根棍，管线也是粗的。 */
  const BIKE = {
    frame: '#331708', frameDark: '#331708', tire: '#331708', rim: '#331708',
    spoke: '#331708', saddle: '#331708', lw: 5.4, tubeW: 9, spokes: 6, shine: 0,
  };

  const SP = 500;          // 岩壁上"盖章"的间距

  /** 侧面剪影：和主角共用同一个 rig.pose，所以完全一样。 */
  function stamped(ctx, t, x, y, scale, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    B.drawRider(ctx, t, {
      x, y, scale, shadow: false,
      pelicanStyle: OCHRE,
      bikeStyle: BIKE,
    });
    ctx.restore();
  }

  S.sahara = {
    placeholder: false,
    draw: function (ctx, t, u, meta) {
      const cam = meta.cam || V.camDefault();

      // ---------------- 静态层：岩壁 ----------------
      const baked = V.layer.bake2d('sahara:base', (g) => {
        const c = g.drawingContext;
        const W = g.width, H = g.height;
        V.paper.paint(c, W, H, 'rock', 4001);

        const rnd = V.rng(77);

        // 层理：几条起伏的色带
        for (let i = 0; i < 7; i++) {
          const y0 = 90 + i * 132 + rnd.gauss() * 22;
          const amp = 10 + rnd() * 16;
          const ph = rnd() * 6.28;
          const tone = i % 2 ? '#8a5327' : '#d09a63';
          c.save();
          c.globalAlpha = 0.10 + rnd() * 0.09;
          c.fillStyle = tone;
          c.beginPath();
          c.moveTo(-40, y0);
          for (let x = -40; x <= W + 40; x += 60) c.lineTo(x, y0 + Math.sin(x * 0.0031 + ph) * amp);
          c.lineTo(W + 40, y0 + 26 + amp);
          for (let x = W + 40; x >= -40; x -= 60) c.lineTo(x, y0 + 26 + Math.sin(x * 0.0031 + ph) * amp);
          c.closePath();
          c.fill();
          c.restore();
        }

        // 裂缝：随机游走 + 自然分叉
        for (let i = 0; i < 7; i++) {
          let x = rnd.range(0, W), y = rnd.range(0, H * 0.8);
          let ang = rnd.range(-0.5, 0.5) + (rnd() > 0.5 ? 0 : Math.PI / 2);
          c.save();
          c.strokeStyle = 'rgba(44,18,6,0.32)';
          c.lineWidth = 0.9 + rnd() * 1.6;
          c.beginPath();
          c.moveTo(x, y);
          const seg = rnd.int(14, 30);
          for (let k = 0; k < seg; k++) {
            ang += rnd.gauss() * 0.42;
            x += Math.cos(ang) * 26;
            y += Math.sin(ang) * 26;
            c.lineTo(x, y);
          }
          c.stroke();
          c.restore();
        }

        // 石孔
        for (let i = 0; i < 620; i++) {
          const x = rnd.range(0, W), y = rnd.range(0, H);
          c.fillStyle = rnd() > 0.55 ? 'rgba(70,32,12,0.16)' : 'rgba(255,226,186,0.13)';
          c.beginPath();
          c.arc(x, y, rnd.range(0.7, 3.4), 0, Math.PI * 2);
          c.fill();
        }

        // 手印：喷出来的负形
        handStencil(c, 232, 336, 1.55, -0.22, V.rng(11));
        handStencil(c, 1692, 226, 1.35, 0.16, V.rng(12));
        handStencil(c, 900, 120, 1.15, -0.06, V.rng(13));

        // 顶部岩檐
        const lip = c.createLinearGradient(0, 0, 0, 300);
        lip.addColorStop(0, 'rgba(24,10,4,0.60)');
        lip.addColorStop(0.55, 'rgba(24,10,4,0.16)');
        lip.addColorStop(1, 'rgba(24,10,4,0)');
        c.fillStyle = lip;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(W, 0);
        c.lineTo(W, 210);
        for (let x = W; x >= 0; x -= 80) c.lineTo(x, 210 + Math.sin(x * 0.0042 + 1.7) * 34);
        c.closePath();
        c.fill();

        V.paper.innerShadow(c, W, H, 0.20, 150);
      }, { w: V.W, h: V.H });

      ctx.drawImage(baked.canvas, 0, 0);

      // ---------------- 动态层 ----------------
      V.enterCam(ctx, cam);

      // 岩棚下的尘土
      B.drawRoad(ctx, t, { color: '#b07a48', depth: 150, grain: 1.9 });

      const shift = (t * B.ROAD_SPEED) % SP;

      // ---- 那排"模子"：画在骑手之前，永远在它身后 ----
      const herd = V.clamp((u - 0.15) / 1.5);
      const shrink = V.clamp((u - 4.0) / 2.0);
      for (let k = 1; k <= 5; k++) {
        const x = V.RIDER_X + k * SP - shift;
        if (x < -300 || x > V.W + 300) continue;
        stamped(ctx, t, x, V.ROAD_Y - 2 + (k % 3) * 3, 1.08 * (1 - shrink * 0.03 * k), 0.45 * herd);
      }

      // ---- 第 2 小节：画家在它旁边又按了一下 ----
      const dup = V.envelope(u, 2.02, 2.34, 3.30, 3.86);
      if (dup > 0.004) {
        const slide = V.ease.outCubic(V.clamp((u - 2.02) / 2.0)) * 26;
        stamped(ctx, t, V.RIDER_X + 96 + slide, V.ROAD_Y - 7, 1.10, 0.80 * dup);
      }

      // ---- 主角 ----
      B.drawRider(ctx, t, {
        scale: 1.24,
        shadow: true,
        shadowStyle: { alpha: 0.10, color: '#3a1a08' },
        pelicanStyle: OCHRE,
        bikeStyle: BIKE,
      });

      V.exitCam(ctx);

      // ---------------- 题名 ----------------
      V.titles.draw(ctx, 'painted', meta.strings, u, V.titles.opts('sahara', { dur: meta.dur }));
    },
  };

  /** 喷绘手印：先在手上"挖洞"，再往洞外喷 —— 用 evenodd 裁剪，不动画布透明度。
   *  早先用 destination-out 直接挖，把岩壁挖成了透明，屏幕底下透出白色，
   *  三个手印变成了三只发光的白手。 */
  function handStencil(c, x, y, s, rot, rnd) {
    const fingers = [
      [-26, -32, 11, 30, -0.34], [-9, -44, 10.5, 34, -0.10], [8, -45, 10.5, 34, 0.06],
      [24, -36, 9.5, 28, 0.26], [36, -8, 8.5, 24, 0.66], [-34, 6, 10, 26, -1.05],
    ];
    const hand = new Path2D();
    hand.ellipse(0, 18, 34, 40, 0, 0, Math.PI * 2);
    for (const [fx, fy, fr, fl, fa] of fingers) {
      const m = new DOMMatrix();
      m.translateSelf(fx, fy);
      m.rotateSelf((fa * 180) / Math.PI);
      const sub = new Path2D();
      sub.ellipse(0, 0, fr, fl, 0, 0, Math.PI * 2);
      hand.addPath(sub, m);
    }

    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(s, s);

    const clip = new Path2D();
    clip.rect(-240, -260, 480, 520);
    clip.addPath(hand);
    c.clip(clip, 'evenodd');

    // 颜料云紧贴手边最浓，往外迅速变淡 —— 手形是靠这层浓度梯度"显"出来的
    for (let i = 0; i < 1500; i++) {
      const a = rnd() * Math.PI * 2;
      const k = Math.pow(rnd(), 2.1);
      const rr = 42 + k * 88;
      const dens = 0.34 * (1 - k) + 0.03;
      c.fillStyle = `rgba(48,15,6,${dens * (0.5 + rnd() * 0.9)})`;
      c.beginPath();
      c.arc(Math.cos(a) * rr * 0.90, Math.sin(a) * rr * 1.05, 0.6 + rnd() * 3.0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
})();
