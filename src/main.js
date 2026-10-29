/* main.js — 页面生命周期、场景调度、镜头、穿过画框的转场。
 *
 * 架构：
 *   主画布    WEBGL（因为 p5.brush 要求），只做最后一件事：把 2D 层 image 上去
 *   主绘图层  main2d（2D graphics, 1920×1080）—— 所有内容其实都画在这里
 *
 * 为什么这么分层：Canvas2D 的绘制比在 WEBGL 上拼要快得多，而 p5.brush 又必须要 WEBGL。
 * 于是让 WEBGL 只当"显示器"，每帧一次 image()（实测 1.1ms）。需要笔触的版块在烘焙阶段
 * 走 WEBGL graphics，出了纹理之后一样贴到 2D 层上。
 *
 * 渲染是 film time t 的纯函数：window.renderAt(t) 可以被任意顺序、任意次数调用。
 */
(function () {
  const V = (window.V = window.V || {});
  const HALF = 0.3;                 // 转场窗口：边界 ±0.3s
  let main2d = null;
  let ready = false;
  let warm = false;

  V.HALF = HALF;
  V.DEBUG_BEATS = /beats/.test(location.search);
  V.DEBUG_RIG = /rig/.test(location.search);
  V.DEBUG_RIDER = /rider/.test(location.search);
  V.noTransitions = /notrans/.test(location.search);

  /** 组装某个 section 的 meta */
  function metaFor(sec) {
    let strings = null;
    if (sec.kind === 'scene') strings = window.S.scenes[sec.index - 1];
    else if (sec.kind === 'intro') strings = window.S.intro;
    else strings = window.S.outro;
    return {
      id: sec.id, index: sec.index, kind: sec.kind,
      t0: sec.t0, t1: sec.t1, dur: sec.t1 - sec.t0, bars: sec.bars,
      strings,
      cam: V.camDefault(),
    };
  }

  /** 把某个 section 在时刻 t 的画面渲染进主绘图层 */
  function renderSceneTo2d(sec, t) {
    const ctx = main2d.drawingContext;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, V.W, V.H);
    ctx.restore();

    const sc = V.scenes[sec.id];
    const meta = metaFor(sec);
    if (sc && sc.draw) {
      try {
        sc.draw(ctx, t, t - sec.t0, meta);
      } catch (e) {
        window.__lastError = `${sec.id} @ t=${t.toFixed(2)}: ${(e && e.stack) || e}`;
        drawErrorCard(ctx, sec, e);
      }
    } else {
      drawMissingCard(ctx, sec);
    }
  }

  function drawMissingCard(ctx, sec) {
    ctx.fillStyle = '#2b2b33';
    ctx.fillRect(0, 0, V.W, V.H);
    V.text.draw(ctx, `${sec.id} — 还没做`, 960, 540, {
      font: 'cn', size: 64, color: '#fff', align: 'center', base: 'middle',
    });
  }
  function drawErrorCard(ctx, sec, e) {
    ctx.fillStyle = '#3a1e1e';
    ctx.fillRect(0, 0, V.W, V.H);
    V.text.draw(ctx, `${sec.id} 渲染出错`, 960, 480, {
      font: 'cn', size: 56, color: '#ffd6d6', align: 'center', base: 'middle',
    });
    V.text.draw(ctx, String(e && e.message || e).slice(0, 120), 960, 560, {
      font: 'en', size: 22, color: '#ffb0b0', align: 'center', base: 'middle',
    });
  }

  /** 把主绘图层送到 WEBGL 主画布 */
  function blitToMain() {
    push();
    translate(-V.W / 2, -V.H / 2);
    image(main2d, 0, 0, V.W, V.H);
    pop();
  }

  /**
   * 穿过画框。
   *
   * 空间逻辑：我们在向前穿过画框。
   *   画框 A 从舞台大小开始向我们放大，掠过屏幕边缘飞出；
   *   就在它掠过的那一瞬间（p≈0.5）画面从 A 换成 B；
   *   然后画框 B 从屏幕外收回来，落到舞台位置。
   *
   * 关键是「换画面」必须快（0.16 的窗口），否则两张不同画风的画面会叠出重影 —— 
   * 那看起来像失误，不像转场。空间感由画框的放大/缩小承担，不靠交叉淡化。
   */
  function composeTransition(ctx, p, secA, secB) {
    const snapA = V.layer.snap('a'), snapB = V.layer.snap('b');
    const cx = V.W / 2, cy = V.H / 2;
    const SIDE = 1080;                     // 舞台在屏幕上的边长

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, V.W, V.H);

    // ---- 画面：在 p = 0.5 处**硬切**，不交叉淡化 ----
    // 踩过两次：
    //   0.16 的窗口 → 50% 那一帧正好压在强拍上，两张不同画风叠出重影；
    //   缩到 0.08 → 重影没了，但 03 汉画像石（黑）与 04 唐白描（纸白）
    //   各 50% 混出来是**一整帧平灰**，在强拍上像闪了一下故障。
    // 结论：空间感由"画框掠过"承担，画面本身直接换 —— 这就是一次穿过去。
    // 缩放是连续的（A 出去时放到 1.07，B 进来时从 1.07 落回），所以硬切不跳。
    const cut = p >= 0.5;

    // ---- 镜头随"穿过"轻微前推，让空间有纵深 ----
    const push = 1 + Math.sin(V.clamp(p) * Math.PI) * 0.045;

    if (!cut) {
      // A 微微放大，像是被我们甩在身后
      const sa = push * (1 + V.clamp((p - 0.46) / 0.08) * 0.07);
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(sa, sa); ctx.translate(-cx, -cy);
      ctx.drawImage(snapA.canvas, 0, 0);
      ctx.restore();
    } else {
      // B 从略大的比例落回正常
      const sb = push * (1 + (1 - V.ease.outCubic(V.clamp((p - 0.54) / 0.46))) * 0.07);
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(sb, sb); ctx.translate(-cx, -cy);
      ctx.drawImage(snapB.canvas, 0, 0);
      ctx.restore();
    }

    // ---- 画框掠过：A 的框飞出，B 的框飞入。两者在 p=0.5 交接于屏幕外 ----
    const BAR = 10.0;
    if (p < 0.5) {
      const k = V.ease.inCubic(V.clamp(p / 0.5));
      const size = SIDE * (1 + k * 1.45);
      strokeStageBox(ctx, cx, cy, size, BAR * (1 + k * 2.0), (1 - k) * 0.95, TRANS_FRAME);
      // 残影：两三圈更淡更大的框，做出速度感
      for (let i = 1; i <= 2; i++) {
        const kk = V.ease.inCubic(V.clamp((p - i * 0.06) / 0.5));
        if (kk <= 0) continue;
        strokeStageBox(ctx, cx, cy, SIDE * (1 + kk * 1.45), BAR * (1 + kk * 2.0),
          (1 - kk) * 0.95 * (0.34 / i), TRANS_FRAME);
      }
    } else {
      const k = V.ease.outCubic(V.clamp((p - 0.5) / 0.5));
      const size = SIDE * (2.45 - k * 1.45);
      strokeStageBox(ctx, cx, cy, size, BAR * (3.0 - k * 2.0), k * 0.95, TRANS_FRAME);
    }

    // ---- 掠过瞬间的一点光冲击 ----
    const hit = V.pulse(p, 0.5, 0.22);
    if (hit > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = V.rgba('#fff8ea', hit * 0.16);
      ctx.fillRect(0, 0, V.W, V.H);
      ctx.restore();
    }

    ctx.restore();
  }

  /** ?rider 调试：只画骑手，放大，纯色底 */
  function renderRiderOnly(t) {
    const ctx = main2d.drawingContext;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#9c8a70';
    ctx.fillRect(0, 0, V.W, V.H);
    ctx.restore();
    V.base.drawRider(ctx, t, { x: 700, y: 1000, scale: 2.5, shadow: false });
  }

  /** 转场用的画框线：深色打底 + 亮色压上，黑白底都读得出来。
   *  早先直接用各版块自己的 frameColor（默认深棕 rgba(40,34,28)），
   *  在 03 汉画像石这种黑底版块上等于隐形 —— 转场也就跟着看不见了。 */
  const TRANS_FRAME = 'rgba(250,244,230,0.96)';

  function strokeStageBox(ctx, cx, cy, size, lw, alpha, color) {
    if (alpha <= 0.004 || lw <= 0.1) return;
    const x = cx - size / 2, y = cy - size / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    // 亮色宽带 + 深色细芯：深底上看得见宽带，浅底上看得见细芯。
    // 反过来的画法（深色打底+亮色压上）在 04 唐白描这种浅底上会整体糊成黑线。
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.strokeRect(x, y, size, size);
    ctx.strokeStyle = 'rgba(16,12,9,0.62)';
    ctx.lineWidth = lw * 0.32;
    ctx.strokeRect(x, y, size, size);
    ctx.restore();
  }

  /** 版块自己的画框颜色（转场不用它 —— 见 TRANS_FRAME 的注释）。
   *  留着给需要"框里框外不同材质"的版块用。 */
  V.frameColorOf = function (sec) {
    const spec = (V.scenes[sec.id] && V.scenes[sec.id].spec) || {};
    return (spec.frame && spec.frame.color) || 'rgba(40,34,28,0.75)';
  };

  /** 单帧渲染：纯函数 */
  V.frame = function (t) {
    V.T = t;
    window.__lastError = null;

    // ?rider —— 只画骑手，放大 2.6 倍，纯色底。查造型用：不隔着路面色和画框看形状。
    if (V.DEBUG_RIDER) {
      renderRiderOnly(t);
      blitToMain();
      return;
    }

    const tr = V.noTransitions ? null : V.TL.transitionAt(t, HALF);

    if (!tr) {
      renderSceneTo2d(V.TL.at(t), t);
      blitToMain();
      return;
    }
    renderSceneTo2d(tr.a, t);
    V.layer.captureFrom('a', main2d.canvas);
    renderSceneTo2d(tr.b, t);
    V.layer.captureFrom('b', main2d.canvas);
    composeTransition(main2d.drawingContext, tr.p, tr.a, tr.b);
    blitToMain();
  };

  // ---------- p5 生命周期 ----------
  async function loadFonts() {
    if (!document.fonts) return;
    const list = ['400 32px "Noto Serif SC"', '700 32px "Noto Serif SC"', '400 32px "EB Garamond"',
      '400 32px "JetBrains Mono"', '400 32px "Ma Shan Zheng"'];
    try {
      await Promise.all(list.map((f) => document.fonts.load(f, '鹈鹕测试 ABCabc 0123')));
      await document.fonts.ready;
    } catch (e) { console.warn('font load:', e && e.message); }
  }

  window.setup = async function () {
    pixelDensity(1);
    createCanvas(V.W, V.H, WEBGL);
    noLoop();
    brush.scaleBrushes(5);
    // 注册本片要用的自定义笔刷（水墨版块用）
    try {
      brush.add('ink', { type: 'default', weight: 4, scatter: 0.08, sharpness: 1, grain: 20, opacity: 255, spacing: 0.05, pressure: [1, 1, 1], rotate: 'none', noise: 0.04 });
      brush.add('inkDry', { type: 'default', weight: 4, scatter: 0.5, sharpness: 0.7, grain: 12, opacity: 230, spacing: 0.06, pressure: [1, 1, 1], rotate: 'none', noise: 0.2 });
      brush.add('bristle', { type: 'default', weight: 18, scatter: 1.2, sharpness: 0.8, grain: 6, opacity: 235, spacing: 0.06, pressure: [0.7, 1, 0.6], rotate: 'natural', noise: 0.2 });
    } catch (e) { console.warn('brush.add:', e && e.message); }

    main2d = createGraphics(V.W, V.H);
    main2d.pixelDensity(1);
    V.main2d = main2d;

    await loadFonts();

    // 暴露时间轴给预览页
    window.__tl = window.V.TL;
    ready = true;
    window.__ready = true;
    window.dispatchEvent(new CustomEvent('pelican-ready'));
  };

  window.draw = function () {
    window.__lastError = null;
    try {
      V.frame(window.__T || 0);
    } catch (e) {
      window.__lastError = `${(e && e.stack) || e}`;
      console.error('frame error:', e);
    }
  };

  /** 供 puppeteer / 预览页调用：渲染任意时刻 */
  window.renderAt = async function (t) {
    if (!ready) throw new Error('not ready');
    window.__T = t;
    if (!warm) {
      // p5.brush 会丢掉页面上第一次 fill，先热身一帧
      warm = true;
      await redraw();
    }
    await redraw();
    return window.__lastError || true;
  };

  /** 渲染并导出当前帧为 PNG 的 base64（避开 CDP 截图的时机问题，快 1.7~2.6 倍） */
  /** 抓一帧，返回 dataURL。
   *  png=true  → PNG（单帧截图用，无损，文件大但只存一张）
   *  png=false → JPEG q0.94（整片逐帧导出用：8280 张 PNG 要 8.8G，JPEG 只要 1G） */
  async function grab(t, png) {
    await window.renderAt(t);
    const cv = document.querySelector('canvas');
    const blob = await new Promise((res) =>
      (png ? cv.toBlob(res, 'image/png') : cv.toBlob(res, 'image/jpeg', 0.94)));
    return await new Promise((res) => {
      const f = new FileReader();
      f.onload = () => res(f.result);
      f.readAsDataURL(blob);
    });
  }
  window.grabFrame = (t) => grab(t, true);        // 截图：PNG
  window.grabFrameJpeg = (t) => grab(t, false);   // 逐帧导出：JPEG
})();
