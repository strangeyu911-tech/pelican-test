/* _base.js — 所有场景共用的骨架：路面、骑手布置、画框、占位版块工厂。
 *
 * 约定（后面 20 个版块都必须遵守）：
 *   - 在 1000×1000 单位空间作画，原点左上，y 向下
 *   - 路面基准线固定 y = V.ROAD_Y (838)，骑手后轮着地点固定 x = V.RIDER_X (360)
 *   - 所以每格的骑手位置都一样，穿画框时人是接的
 *
 * 场景接口：
 *   scene.draw(ctx, t, u, meta)
 *     ctx  主绘图层的 2D context（1920×1080，左上原点）
 *     t    全片时间（秒）
 *     u    版块内时间 = t - meta.t0
 *     meta { id, index, t0, t1, dur, strings, cam }
 *
 * 主绘图层是 2D graphics，最后一次性 image 到 WEBGL 主画布。
 * 这样既能用 Canvas2D 画（快），又能给需要 p5.brush 的版块留出 WEBGL 烘焙。
 */
(function () {
  const V = (window.V = window.V || {});
  const S = (V.scenes = V.scenes || {});
  const B = (V.base = {});

  /** 路面滚动速度（单位/秒）。不严格等于轮速，慢 40% 看起来更舒服。 */
  B.ROAD_SPEED = 466;

  /** 解算骑手姿态并给出落点 */
  B.riderAt = function (t, opts) {
    const o = opts || {};
    return {
      p: V.rig.pose(t, o.mods),
      x: o.x ?? V.RIDER_X,
      y: o.y ?? V.ROAD_Y,
    };
  };

  /**
   * 画骑手（自行车 + 鹈鹕）。ctx 已进入单位坐标系。
   */
  B.drawRider = function (ctx, t, opts) {
    const o = opts || {};
    const r = B.riderAt(t, o);
    ctx.save();
    ctx.translate(r.x, r.y);
    if (o.scale && o.scale !== 1) ctx.scale(o.scale, o.scale);
    if (o.flip) ctx.scale(-1, 1);
    if (o.rotate) ctx.rotate(o.rotate);

    if (o.shadow !== false) {
      const sh = o.shadowStyle || {};
      ctx.save();
      ctx.globalAlpha = sh.alpha ?? 0.17;
      ctx.fillStyle = sh.color || '#000000';
      ctx.beginPath();
      ctx.ellipse((r.p.rear[0] + r.p.front[0]) / 2, 7, 172, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (o.drawBike !== false) V.bike.draw(ctx, r.p, o.bikeStyle);
    if (o.drawPelican !== false) V.pelican.draw(ctx, r.p, o.pelicanStyle, t);
    if (V.DEBUG_RIG) B.drawRigDebug(ctx, r.p);
    ctx.restore();
    return r;
  };

  /** 骨架叠加层（?rig）。标出所有锚点，调姿态时靠它，不靠猜。 */
  B.drawRigDebug = function (ctx, p) {
    const keys = [
      'hip', 'shoulder', 'neckRoot', 'n1', 'n2', 'headC', 'beakBase', 'beakTip',
      'legRoot', 'kneeL', 'ankleL', 'kneeR', 'ankleR', 'tailBase', 'tailTip', 'grip',
    ];
    ctx.save();
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(0,150,255,0.85)';
    ctx.beginPath();
    curveThroughDots(ctx, p.body, true);
    ctx.stroke();
    ctx.beginPath();
    for (const k of ['neckRoot', 'n1', 'n2', 'headC']) {
      if (!p[k]) continue;
      ctx.lineTo(p[k][0], p[k][1]);
    }
    ctx.moveTo(p.hip[0], p.hip[1]);
    ctx.lineTo(p.shoulder[0], p.shoulder[1]);
    ctx.stroke();
    for (const k of keys) {
      const pt = p[k];
      if (!pt) continue;
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 2.6, 0, Math.PI * 2);
      ctx.fillStyle = '#0096ff';
      ctx.fill();
      ctx.font = '9px monospace';
      ctx.fillStyle = '#004a80';
      ctx.fillText(k, pt[0] + 4, pt[1] - 4);
    }
    ctx.restore();
  };

  function curveThroughDots(ctx, pts, closed) {
    if (!pts || pts.length < 2) return;
    const n = pts.length;
    const get = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    ctx.moveTo(pts[0][0], pts[0][1]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      ctx.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
        p2[0], p2[1]
      );
    }
    if (closed) ctx.closePath();
  }

  /**
   * 路面带。阶段 1 通用；各版块可覆盖成自己的质地（土路、石板、水面、网格）。
   *
   * 两个容易画错的点：
   *   1. 带子必须够深。ROAD_Y 是**着地线**，不是路面顶边 —— 若顶边贴着 ROAD_Y，
   *      带子只剩 26 单位，远边线就变成地平线，骑手看起来在路肩上骑。
   *      所以顶边抬到 ROAD_Y - depth（默认 150），骑手落在路面里 38% 处。
   *   2. 远边浅、近边深的一道渐变，才能把"平面"读成"向后延伸的地面"。
   */
  B.drawRoad = function (ctx, t, o) {
    const opt = o || {};
    const y = opt.y ?? V.ROAD_Y;
    const speed = (opt.speed ?? 1) * B.ROAD_SPEED;
    const off = (t * speed) % 2000;
    const top = y - (opt.depth ?? 150);
    const bot = V.STAGE + 60;
    const base = opt.color || '#cfc4ab';
    // 底色亮度决定一切的符号：浅底要压暗才看得出是地面，深底必须提亮 ——
    // 深底再压暗会夹到纯黑，渐变一加白就糊出一条灰带（03 汉画像石踩过）。
    const lb = tintLum(base) / 255;
    const light = lb > 0.5;      // 底色偏亮 → 用深色墨；偏暗 → 用浅色墨

    ctx.save();
    // 底色 + 纵深渐变（远边略亮、近边略深，把平面读成向后延伸的地面）
    const grd = ctx.createLinearGradient(0, top, 0, bot);
    grd.addColorStop(0, V.shade(base, 0.035 + 0.035 * lb));
    grd.addColorStop(0.3, base);
    grd.addColorStop(1, V.shade(base, -0.035 - 0.035 * lb));
    ctx.fillStyle = grd;
    ctx.fillRect(-600, top, 2200, bot - top);

    // 小石子：三条不同深度带，各自速度不同，制造视差。
    // 颜色必须从路面自身推出来 —— 写死米白/深褐在洋红路面上会变成一层灰扑扑的脏点。
    const rnd = V.rng(4242);
    const n = Math.round(170 * (opt.grain ?? 1));
    const dotA = V.shade(base, light ? -0.16 : 0.15);
    const dotB = V.shade(base, light ? 0.22 : -0.13);
    for (let i = 0; i < n; i++) {
      const gx = rnd();
      const depth = rnd();                 // 0 = 靠近路面远侧，1 = 近侧
      const r = 1.1 + depth * 3.4;
      const gy = top + 6 + depth * (bot - top - 12);
      const shift = off * (0.45 + depth * 1.1);
      let x = ((gx * 2000 - shift) % 2000 + 2000) % 2000 - 600;
      ctx.fillStyle = rnd() > 0.55
        ? V.rgba(dotA, 0.42 + depth * 0.30)
        : V.rgba(dotB, 0.30 + depth * 0.25);
      ctx.beginPath();
      ctx.arc(x, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 远侧路肩线：压深/提亮一点，明确"这是路面开始的地方"
    ctx.beginPath();
    ctx.moveTo(-600, top + 1);
    ctx.lineTo(1600, top + 1);
    // 路肩线：亮底压暗、暗底再压一层更深的阴影缝。暗底上刷浅色线 = 一条横贯全屏的亮带。
    ctx.strokeStyle = opt.edge || V.rgba(light ? '#4a4338' : '#0b0a08', 0.55);
    ctx.lineWidth = 2.6;
    ctx.stroke();
    // 远侧一线雾光，把地面推远（深底上不能加太狠，否则变成一条亮带）
    const haze = ctx.createLinearGradient(0, top, 0, top + 34);
    haze.addColorStop(0, V.rgba('#ffffff', 0.02 + lb * 0.11));
    haze.addColorStop(1, V.rgba('#ffffff', 0));
    ctx.fillStyle = haze;
    ctx.fillRect(-600, top, 2200, 34);

    ctx.restore();
  };

  /** 极简画框（阶段 1 通用；各版块后面换成自己的装帧材质） */
  B.drawFrame = function (ctx, o) {
    const opt = o || {};
    if (opt.none) return;
    const inset = opt.inset ?? 14;
    ctx.save();
    ctx.strokeStyle = opt.color || V.rgba('#2c2620', 0.5);
    ctx.lineWidth = opt.lw ?? 3;
    ctx.strokeRect(inset, inset, V.STAGE - inset * 2, V.STAGE - inset * 2);
    ctx.restore();
  };

  /**
   * 占位版块的工厂。阶段 1 的 20 格全部用它，只为验证节奏、转场、接缝。
   * 后面每格会被真实实现逐个替换。
   *
   * @param {object} spec
   *   tint        时代主色
   *   paper       底材预设名
   *   label       左上角小标签
   *   numColor    大编号颜色
   *   titleColor  标题卡主色
   *   road        传给 drawRoad 的参数
   *   rider       传给 drawRider 的参数
   *   cnFont      标题卡字体
   */
  /** 底色亮度 0–255。 */
  function tintLum(hex) {
    const h = String(hex || '#888888').replace('#', '');
    if (h.length < 6) return 0;
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  /** 相对亮度（WCAG），用于算对比度 */
  function relLum(hex) {
    const h = String(hex || '#888888').replace('#', '');
    if (h.length < 6) return 0;
    const ch = [0, 2, 4].map((i) => {
      const v = parseInt(h.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  function contrast(a, b) {
    const x = relLum(a), y = relLum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }

  /**
   * 该用深墨还是白墨？
   * 不能用亮度阈值 —— 中间调会判错：蒸汽波的主色 #c96fb0 亮度 145，
   * 落在"深底"一侧，于是白字只有 3.3:1 对比度，糊在洋红里。
   * 改成实算两种墨的对比度，并且要求深墨**明显**更好才换（差 12% 以内仍用白字），
   * 因为中等明度的底色上白字更像标题、深字更像正文。
   */
  function preferDarkInk(hex) {
    return contrast(hex, '#2a2622') >= contrast(hex, '#ffffff') * 1.12;
  }

  // 给各版块自己挑墨色用（不改 mark 的话会重复踩"中间调白字看不清"的坑）
  B.tintLum = tintLum;
  B.contrast = contrast;
  B.preferDarkInk = preferDarkInk;
  /** 按底色自动挑一套墨色，返回 { pale, ink, inkSoft, inkLine } */
  B.inkFor = function (tint) {
    const pale = preferDarkInk(tint);
    return pale
      ? { pale, ink: '#2a2622', inkSoft: 'rgba(42,38,34,0.72)', inkLine: 'rgba(58,50,40,0.45)' }
      : { pale, ink: '#ffffff', inkSoft: 'rgba(255,255,255,0.82)', inkLine: 'rgba(255,255,255,0.42)' };
  };

  B.makePlaceholder = function (spec) {
    const sp = spec || {};
    const pale = preferDarkInk(sp.tint || '#888888');
    const numColor = sp.numColor || (pale ? 'rgba(48,40,30,0.20)' : 'rgba(255,255,255,0.22)');
    const labelColor = sp.labelColor || (pale ? 'rgba(48,40,30,0.55)' : 'rgba(255,255,255,0.62)');
    const titleColor = sp.titleColor || (pale ? '#2a2622' : '#ffffff');
    const titleAccent = sp.titleAccent || (pale ? 'rgba(42,38,34,0.72)' : 'rgba(255,255,255,0.82)');
    return {
      placeholder: true,
      spec: sp,
      draw: function (ctx, t, u, meta) {
        const sc = meta.strings;
        const dur = meta.dur;
        const px = (v) => v * V.U;

        // ---- 静态层（只烤一次）----
        const baked = V.layer.bake2d('ph:' + meta.id, (g) => {
          const c = g.drawingContext;
          V.paper.paint(c, g.width, g.height, sp.paper || 'xuan', meta.index * 131 + 7);
          // 时代的底色铺满整个屏幕（over-scan），不只是舞台 —— 否则两侧会露出纸底，
          // 视觉上像"一张小画浮在纸上"，而不是"镜头正处在这个时代里"
          c.fillStyle = sp.tint || '#cccccc';
          c.fillRect(0, 0, g.width, g.height);
          // 画框外压暗一点，暗示取景框比画心大
          V.paper.innerShadow(c, g.width, g.height, 0.16, 150);
          // 大编号
          V.text.draw(c, String(meta.index).padStart(2, '0'), px(V.STAGE / 2), px(452), {
            font: 'en', size: px(330), color: numColor,
            align: 'center', base: 'middle', weight: 700,
          });
          // 左上角标签
          if (sp.label) {
            V.text.draw(c, sp.label, px(76), px(104), {
              font: 'en', size: px(21), color: labelColor,
              align: 'left', spacing: 3.2,
            });
          }
        }, { w: V.W, h: V.H });

        // ---- 合成静态层 ----
        ctx.drawImage(baked.canvas, 0, 0);

        // ---- 动态层 ----
        const cam = meta.cam || V.camDefault();
        V.enterCam(ctx, cam);
        // 路面颜色跟着时代主色走。默认的米色在 03 汉画像石这种黑底格子里
        // 会横出一条刺眼的亮带；反过来浅底（唐、宋）压得不够就糊成一片纸。
        // 所以压暗量按底色亮度分档，浅底必须压得更狠。
        const tint = sp.tint || '#cfc4ab';
        const lum = tintLum(tint);
        const autoShift = lum > 200 ? -0.30 : lum > 146 ? -0.22 : lum > 70 ? -0.10 : 0.11;
        const roadOpt = Object.assign({ color: V.shade(tint, sp.roadDark ?? autoShift) }, sp.road);
        // 画框先画，路面后画 —— 路面的近景要盖住画框的底边，
        // 否则一条横线横穿路面，像路面漏出了画面。
        B.drawFrame(ctx, sp.frame);
        B.drawRoad(ctx, t, roadOpt);
        // 默认骑手尺度：1.42 时整只鸟约占画面高 23%，是"中景跟拍"的舒服比例。
        // 各版块可以覆盖（宋山水要压到很小、8-bit 要顶到很大）。
        B.drawRider(ctx, t, Object.assign({ scale: 1.42 }, sp.rider));
        V.exitCam(ctx);

        // ---- 标题卡（屏幕坐标，每帧随 alpha 变，不能烤）----
        // 放在右侧纸边（画框外），纵向居中：既不压画框线，也不挡画里的骑手。
        V.text.titleCardAt(ctx, sc, u, {
          x: 1544, y: 566, dur,
          color: titleColor,
          accent: titleAccent,
          cnFont: sp.cnFont || 'cn',
          lineW: 348,
          cnSize: 40, enSize: 20,
          cnWeight: 700,
        });

        // ---- 版块内的三小节提示（阶段 1 自查用，可关）----
        if (V.DEBUG_BEATS) {
          const bars = ['① 进场', '② 梗', '③ 离场'];
          const bi = V.clamp(Math.floor(u / V.TL.bar), 0, 2);
          V.text.draw(ctx, bars[bi], 80, 1050, { font: 'cn', size: 22, color: 'rgba(0,0,0,0.45)' });
        }
      },
    };
  };
})();
