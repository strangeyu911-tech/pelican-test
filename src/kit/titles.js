/* titles.js — 20 个版块的题名（主题词）样式。
 *
 * 为什么不是一套排版走全片：这是讲美术史的片子，题名本身就该是美术史的一部分。
 * 岩画上的字是赭石抹上去的，拓片上的字是刻出来的，示波器上的字是荧光余辉，
 * 8-bit 的字是像素点 —— 换颜色是不够的，得换"写字的方式"和"写在哪里"。
 *
 * 用法：
 *   V.titles.draw(ctx, 'vertical', meta.strings, u, {
 *     dur: meta.dur, x: 1400, y: 180, size: 46, align: 'right', seal: true,
 *     ink: '#2a2622', accent: 'rgba(42,38,34,0.7)',
 *   });
 *
 * 所有样式都在**屏幕坐标**里画（调用前先 V.exitCam）。alpha 由 u 的包络统一给。
 */
(function () {
  const V = (window.V = window.V || {});
  const T = V.text;
  const K = (V.titles = {});

  /** 朱印只有一个字：鹈。字形已经在 strings.js 的字形子集里。 */
  const SEAL_CH = '鹈';

  // ============================================================
  // 公共零件
  // ============================================================

  /** 朱红印章：方印 + 印泥不均 + 白字 */
  function seal(ctx, cx, cy, s, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(cx, cy);
    ctx.rotate(-0.018);
    ctx.fillStyle = '#b8372c';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.09);
    else ctx.rect(-s / 2, -s / 2, s, s);
    ctx.fill();
    // 印泥不匀：两块更深的残影，位置固定（不能随机，否则每帧都在跳）
    ctx.save();
    ctx.globalAlpha *= 0.28;
    ctx.fillStyle = '#7d1f18';
    ctx.fillRect(-s * 0.5, -s * 0.5, s * 0.30, s * 0.16);
    ctx.fillRect(s * 0.06, s * 0.14, s * 0.26, s * 0.20);
    ctx.restore();
    T.draw(ctx, SEAL_CH, 0, 0, {
      font: 'cn', size: s * 0.60, color: '#f7f0e2', align: 'center', base: 'middle', weight: 700,
    });
    ctx.restore();
  }

  /** 竖排一段字，返回占用高度 */
  function vtext(ctx, str, x, y, o) {
    const opt = o || {};
    const size = opt.size || 40;
    const lh = (opt.lineHeight || 1.04) * size;
    const chars = [...str];
    for (let i = 0; i < chars.length; i++) {
      T.draw(ctx, chars[i], x, y + i * lh, Object.assign({}, opt, { align: 'center', base: 'top' }));
    }
    return chars.length * lh;
  }

  /** 用"多段短横"画一条毛笔味的下划线（直的太假） */
  function brushUnderline(ctx, x0, x1, y, color, w) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = i / n, b = (i + 1) / n;
      const ax = x0 + (x1 - x0) * a, bx = x0 + (x1 - x0) * b + 2;
      const jy = Math.sin(i * 2.7) * 1.1;
      ctx.lineWidth = w * (0.55 + 0.6 * Math.sin((i + 0.5) / n * Math.PI));
      ctx.beginPath();
      ctx.moveTo(ax, y + jy);
      ctx.lineTo(bx, y + jy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ============================================================
  // 八种样式
  // 约定：o.x 是锚点横坐标，o.align 决定文字从锚点往哪边长；
  //       o.y 是锚点纵坐标，各样式自行解释（竖排是首字顶端，横排是基线）。
  // ============================================================
  const ST = (K.STYLE = {});

  /** 现代三行 + 细线。兜底用。 */
  ST.plate = function (ctx, sc, o) {
    const cnSize = o.size || 40, enSize = o.enSize || 20;
    const align = o.align || 'left';
    const w = o.lineW || 348;
    const x0 = align === 'right' ? o.x - w : align === 'center' ? o.x - w / 2 : o.x;
    T.draw(ctx, sc.era, x0 + w, o.y - cnSize - enSize - 24, {
      font: 'en', size: enSize * 0.86, color: o.accent, align: 'right', spacing: 2.4,
    });
    ctx.beginPath();
    ctx.moveTo(x0, o.y - cnSize - enSize - 14);
    ctx.lineTo(x0 + w, o.y - cnSize - enSize - 14);
    ctx.strokeStyle = V.rgba(o.accent, 0.45);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    T.draw(ctx, sc.en, x0, o.y - cnSize - 4, {
      font: 'en', size: enSize, color: o.ink, spacing: 1.2, alpha: 0.82,
    });
    T.draw(ctx, sc.cn, x0, o.y, {
      font: o.cnFont || 'cn', size: cnSize, color: o.ink, weight: 700, spacing: o.spacing ?? 2,
    });
  };

  /** 竖排。题跋／落款的基本形制。
   *  border: 'slip' 细长签条 | 'cartouche' 圆角长框（埃及）| null 无框
   *  seal: true 在列尾按一枚朱印
   *  底框颜色跟着墨色自动反相 —— 白签条配深字、深签条配白字，
   *  否则浅底版块上的白签条和白纸糊成一片，字就没了。 */
  ST.vertical = function (ctx, sc, o) {
    const size = o.size || 44;
    const align = o.align || 'left';
    const lh = size * 1.04;
    const cnChars = [...sc.cn];
    const colW = size;
    const x0 = align === 'right' ? o.x - colW : align === 'center' ? o.x - colW / 2 : o.x;
    const eraSize = Math.max(15, size * 0.44);
    const totalH = cnChars.length * lh;
    const inkIsLight = typeof o.ink === 'string' && V.base.tintLum(o.ink) / 255 > 0.5;
    const slipFill = o.slipFill || (inkIsLight ? 'rgba(22,18,14,0.90)' : 'rgba(250,246,236,0.95)');
    const slipLine = o.slipLine || (inkIsLight ? 'rgba(250,246,236,0.42)' : 'rgba(58,50,40,0.48)');

    // ---- 底框 ----
    if (o.border === 'slip') {
      const padX = size * 0.46, padY = size * 0.36;
      const bx = x0 + colW / 2, by = o.y - padY;
      const bw = colW + padX * 2, bh = totalH + padY * 2;
      ctx.save();
      ctx.fillStyle = slipFill;
      ctx.beginPath();
      ctx.roundRect(bx - bw / 2, by, bw, bh, 2);
      ctx.fill();
      ctx.strokeStyle = slipLine;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    } else if (o.border === 'cartouche') {
      const padX = size * 0.72, padY = size * 0.42;
      const bx = x0 + colW / 2, by = o.y + totalH / 2;
      const bw = colW + padX * 2, bh = totalH + padY * 2;
      ctx.save();
      ctx.fillStyle = slipFill;
      ctx.beginPath();
      ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, bh * 0.5);
      ctx.fill();
      ctx.strokeStyle = slipLine;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      // 底端一道横杠：象形文字里表示"这是个名字"
      ctx.beginPath();
      ctx.moveTo(bx - bw * 0.28, by + bh / 2 - size * 0.16);
      ctx.lineTo(bx + bw * 0.28, by + bh / 2 - size * 0.16);
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.restore();
    }

    // ---- 年代：在标题列左侧，小一号。
    //      有框的时候必须让到**框外**，否则被框的边压掉半个字（埃及那格踩过）。 ----
    let eraX = x0 - size * 0.80;
    if (o.border === 'cartouche') {
      eraX = x0 + colW / 2 - (colW + size * 1.44) / 2 - eraSize * 0.85;
    } else if (o.border === 'slip') {
      eraX = x0 + colW / 2 - (colW + size * 0.92) / 2 - eraSize * 0.85;
    }
    vtext(ctx, sc.era, eraX, o.y + size * 0.20, {
      font: 'cn', size: eraSize, color: o.accent, weight: 400,
    });

    // ---- 标题 ----
    vtext(ctx, sc.cn, x0 + colW / 2, o.y, {
      font: o.cnFont || 'cnBrush', size, color: o.ink, weight: o.weight || 400,
      spacing: 0, lineHeight: 1.04,
    });

    // ---- 朱印 ----
    if (o.seal) seal(ctx, x0 + colW / 2, o.y + totalH + size * 0.62, size * 0.72, 0.95);
  };

  /** 描金匾额：深底 + 双线 + 四角菱形。 */
  ST.plaque = function (ctx, sc, o) {
    const cnSize = o.size || 40;
    const enSize = o.enSize || 17;
    const eraSize = o.eraSize || 16;
    const sp = cnSize * 0.10;
    const cnW = T.measure(ctx, sc.cn, { font: 'cn', size: cnSize, weight: 700, spacing: sp });
    const enW = T.measure(ctx, sc.en, { font: 'en', size: enSize });
    const eraW = T.measure(ctx, sc.era, { font: 'en', size: eraSize });
    const padX = cnSize * 0.95, padTop = cnSize * 0.55, padBot = cnSize * 0.62;
    const w = Math.max(cnW, enW, eraW) + padX * 2;
    const h = cnSize * 1.12 + enSize * 1.5 + eraSize * 1.6 + padTop + padBot;
    const bx = o.align === 'right' ? o.x - w : o.align === 'center' ? o.x - w / 2 : o.x;
    const by = o.y;

    ctx.save();
    // 牌面
    const fill = o.plaqueFill || 'rgba(26,20,16,0.93)';
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(bx, by, w, h, o.radius ?? 5);
    ctx.fill();
    // 外线 + 内线
    ctx.strokeStyle = o.gold || 'rgba(206,168,94,0.95)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.strokeStyle = o.goldSoft || 'rgba(206,168,94,0.42)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx + 6, by + 6, w - 12, h - 12, Math.max(1, (o.radius ?? 5) - 2));
    ctx.stroke();
    // 四角菱形
    if (o.corner !== false) {
      const d = 4.6;
      for (const [cx, cy] of [[bx + 6, by + 6], [bx + w - 6, by + 6], [bx + 6, by + h - 6], [bx + w - 6, by + h - 6]]) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - d); ctx.lineTo(cx + d, cy); ctx.lineTo(cx, cy + d); ctx.lineTo(cx - d, cy);
        ctx.closePath();
        ctx.fillStyle = o.gold || 'rgba(206,168,94,0.95)';
        ctx.fill();
      }
    }
    ctx.restore();

    const cx = bx + w / 2;
    T.draw(ctx, sc.era, cx, by + padTop + eraSize * 0.95, {
      font: 'en', size: eraSize, color: o.goldSoft || 'rgba(206,168,94,0.75)',
      align: 'center', spacing: 3.2,
    });
    T.draw(ctx, sc.cn, cx, by + padTop + eraSize * 1.9 + cnSize * 0.9, {
      font: o.cnFont || 'cn', size: cnSize, color: o.plaqueInk || '#f4ecdc',
      align: 'center', weight: 700, spacing: sp,
    });
    T.draw(ctx, sc.en, cx, by + h - padBot * 0.5, {
      font: 'en', size: enSize, color: o.plaqueInk || '#f4ecdc',
      align: 'center', alpha: 0.72, italic: true,
    });
    return { w, h };
  };

  /** 手写颜料：双层偏移 + 粗糙下划，像用指头蘸着颜料抹上去的。 */
  ST.painted = function (ctx, sc, o) {
    const size = o.size || 62;
    const align = o.align || 'left';
    const w = T.measure(ctx, sc.cn, { font: o.cnFont || 'cn', size, weight: 700, spacing: size * 0.06 });
    const x0 = align === 'right' ? o.x - w : align === 'center' ? o.x - w / 2 : o.x;
    ctx.save();
    ctx.translate(x0, o.y);
    ctx.rotate(o.rot ?? -0.018);
    // 底影：错开 2~3 px 的同色浅层，模拟颜料溢出
    T.draw(ctx, sc.cn, 2.6, 2.2, {
      font: o.cnFont || 'cn', size, color: o.accent, weight: 700,
      spacing: size * 0.06, alpha: 0.45,
    });
    T.draw(ctx, sc.cn, 0, 0, {
      font: o.cnFont || 'cn', size, color: o.ink, weight: 700, spacing: size * 0.06,
    });
    brushUnderline(ctx, 0, w, size * 0.22, o.underline || o.accent, Math.max(2, size * 0.055));
    T.draw(ctx, sc.era, w, size * 0.62, {
      font: 'en', size: size * 0.34, color: o.accent, align: 'right', spacing: 2.2,
    });
    ctx.restore();
    return { w };
  };

  /** 默片字幕卡：黑底白字 + 上下细线。 */
  ST.caption = function (ctx, sc, o) {
    const size = o.size || 34;
    const enSize = o.enSize || 17;
    const cnW = T.measure(ctx, sc.cn, { font: 'cn', size, weight: 700, spacing: size * 0.08 });
    const enW = T.measure(ctx, sc.en, { font: 'en', size: enSize });
    const w = Math.max(cnW, enW) + size * 2.6;
    const h = size * 2.5;
    const cx = o.align === 'left' ? o.x + w / 2 : o.align === 'right' ? o.x - w / 2 : o.x;
    const by = o.y - h / 2;
    ctx.save();
    ctx.fillStyle = o.plateFill || 'rgba(8,8,8,0.90)';
    ctx.fillRect(cx - w / 2, by, w, h);
    ctx.strokeStyle = 'rgba(240,236,224,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 + 10, by + 7); ctx.lineTo(cx + w / 2 - 10, by + 7);
    ctx.moveTo(cx - w / 2 + 10, by + h - 7); ctx.lineTo(cx + w / 2 - 10, by + h - 7);
    ctx.stroke();
    ctx.restore();
    T.draw(ctx, sc.cn, cx, by + h * 0.52, {
      font: 'cn', size, color: o.ink || '#f2eee2', align: 'center', weight: 700, spacing: size * 0.08,
    });
    T.draw(ctx, sc.en + ' · ' + sc.era, cx, by + h * 0.52 + enSize * 1.5, {
      font: 'en', size: enSize, color: o.ink || '#f2eee2', align: 'center', alpha: 0.62, spacing: 2.4,
    });
    return { w, h };
  };

  /** 等宽/终端：前缀 + 两行。glow 给示波器的荧光余辉用。 */
  ST.mono = function (ctx, sc, o) {
    const size = o.size || 21;
    const align = o.align || 'left';
    const prefix = o.prefix != null ? o.prefix : '// ';
    const lines = [prefix + sc.cn, prefix.replace(/./g, ' ') + sc.en, prefix.replace(/./g, ' ') + sc.era];
    const lh = size * 1.55;
    const x0 = o.x;
    ctx.save();
    if (o.glow) {
      ctx.shadowColor = o.glow;
      ctx.shadowBlur = o.glowBlur ?? 14;
    }
    lines.forEach((ln, i) => {
      T.draw(ctx, ln, x0, o.y + i * lh, {
        font: 'mono', size: i === 0 ? size : size * 0.86,
        color: i === 0 ? o.ink : o.accent, align,
        alpha: i === 0 ? 1 : 0.78,
      });
    });
    ctx.restore();
    // 光标
    if (o.caret) {
      const w = T.measure(ctx, lines[0], { font: 'mono', size });
      ctx.fillStyle = o.ink;
      ctx.fillRect(align === 'right' ? x0 - w - size * 0.7 : x0 + w + 2, o.y - size * 0.82, size * 0.46, size * 0.98);
    }
    return { w: T.measure(ctx, lines[0], { font: 'mono', size }), h: lh * 3 };
  };

  /** UI 浮层：账号名 + 说明，白字带投影。 */
  ST.hud = function (ctx, sc, o) {
    const size = o.size || 26;
    const align = o.align || 'left';
    const handle = o.handle || '@pelican';
    // 浅底版块（聊天客户端）不能加黑投影，否则字边缘糊成一团
    const sh = o.shadow === false ? null : (o.shadow || [0, 2, 10, 'rgba(0,0,0,0.55)']);
    T.draw(ctx, handle, o.x, o.y, {
      font: 'en', size: size * 0.92, color: o.ink || '#ffffff', align, weight: 700,
      shadow: sh,
    });
    T.draw(ctx, sc.cn, o.x, o.y + size * 1.35, {
      font: 'cn', size, color: o.ink || '#ffffff', align, weight: 400,
      shadow: sh,
    });
    T.draw(ctx, sc.en + ' · ' + sc.era, o.x, o.y + size * 2.30, {
      font: 'en', size: size * 0.58, color: o.accent || 'rgba(255,255,255,0.72)', align,
      shadow: sh,
    });
    return { h: size * 2.7 };
  };

  /** 霓虹：青色／洋红双影 + 白芯 + 一道横线。蒸汽波的本命。 */
  ST.neon = function (ctx, sc, o) {
    const size = o.size || 46;
    const align = o.align || 'left';
    const sp = size * 0.05;
    const w = T.measure(ctx, sc.cn, { font: 'cn', size, weight: 700, spacing: sp });
    const x0 = align === 'right' ? o.x - w : align === 'center' ? o.x - w / 2 : o.x;
    const ghost = o.ghost || 3.2;
    T.draw(ctx, sc.cn, x0 - ghost, o.y, {
      font: 'cn', size, weight: 700, spacing: sp, color: '#4fe6ff', alpha: 0.72,
    });
    T.draw(ctx, sc.cn, x0 + ghost, o.y, {
      font: 'cn', size, weight: 700, spacing: sp, color: '#ff5cc0', alpha: 0.72,
    });
    T.draw(ctx, sc.cn, x0, o.y, {
      font: 'cn', size, weight: 700, spacing: sp, color: o.ink || '#fdf2ff',
      shadow: [0, 0, 14, 'rgba(255,140,220,0.55)'],
    });
    // 横线 + 年代
    ctx.save();
    ctx.strokeStyle = o.accent || 'rgba(255,206,240,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, o.y + size * 0.30);
    ctx.lineTo(x0 + w, o.y + size * 0.30);
    ctx.stroke();
    ctx.restore();
    T.draw(ctx, sc.en + ' · ' + sc.era, x0, o.y + size * 0.30 + size * 0.46, {
      font: 'en', size: size * 0.34, color: o.accent || 'rgba(255,206,240,0.8)', spacing: 2.6,
    });
    return { w };
  };

  /** 像素字：小画布上写字，再关掉插值放大。
   *  只用一层 drawImage，源矩形按实测字宽裁，避免空白把对齐算歪。 */
  ST.pixel = function (ctx, sc, o) {
    const px = Math.max(2, Math.round(o.px || 4));      // 每个"像素"的屏幕边长
    const small = o.size || 22;                          // 小画布上的字号
    const tw = Math.ceil(T.measure(ctx, sc.cn, { font: 'mono', size: small })) + 2;
    const th = Math.ceil(small * 1.62);
    const g = V.layer.bake2d('title:pixel:' + sc.cn, (gg) => {
      const c = gg.drawingContext;
      c.clearRect(0, 0, gg.width, gg.height);
      c.textBaseline = 'top';
      c.fillStyle = o.ink || '#ffffff';
      c.font = T.font(T.FONT.mono, small, 700);
      c.fillText(sc.cn, 0, Math.round(small * 0.20));
      c.font = T.font(T.FONT.mono, small * 0.44, 400);
      c.fillStyle = o.accent || 'rgba(255,255,255,0.7)';
      c.fillText(sc.en, 0, Math.round(small * 1.10));
    }, { w: tw, h: th });

    const dw = tw * px, dh = th * px;
    const align = o.align || 'left';
    const dx = align === 'right' ? o.x - dw : align === 'center' ? o.x - dw / 2 : o.x;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(g.canvas, 0, 0, tw, th, dx, o.y, dw, dh);
    ctx.restore();
    return { w: dw, h: dh };
  };

  // ============================================================
  // 统一入口
  // ============================================================

  /** 取某一格的题名参数（版块里用：V.titles.opts('sahara', { dur: meta.dur })） */
  K.opts = function (id, extra) {
    const p = K.PLAN[id] || {};
    const o = Object.assign({ cnFont: 'cn' }, p, extra);
    // 默认墨色必须是真的深墨。早先留空 → tintLum(undefined) 退回 #888888（亮度 0.53），
    // 被当成"浅墨"，于是浅底上给了深签条 + 深字，整个题名糊成一块黑。
    if (o.ink == null) o.ink = '#2a2622';
    if (o.accent == null) o.accent = 'rgba(42,38,34,0.70)';
    return o;
  };

  /**
   * @param styleId  STYLE 的键
   * @param sc       { cn, en, era }
   * @param u        版块内时间
   * @param o        { dur, in0, in1, out0, out1, ...样式参数 }
   */
  K.draw = function (ctx, styleId, sc, u, o) {
    const opt = o || {};
    const st = ST[styleId] || ST.plate;
    const dur = opt.dur || 6;
    const a = V.envelope(
      u,
      opt.in0 ?? 0.06,
      opt.in1 ?? 0.52,
      opt.out0 ?? (dur - 0.55),
      opt.out1 ?? (dur - 0.12)
    );
    if (a <= 0.004) return null;
    ctx.save();
    ctx.globalAlpha *= a;
    const box = st(ctx, sc, Object.assign({}, opt, { alpha: a }));
    ctx.restore();
    return box;
  };

  /** 每格用哪套样式、放在哪。数值单位是屏幕像素（1920×1080）。
   *
   *  位置刻意铺开：竖排多在左右两侧、匾额在四角与顶中、默片卡在下缘、
   *  终端在左上、UI 在视频内 —— 二十格没有两个在同一处。
   *  少数几格点名 ink 是因为那个时代的颜料有固定色（赭石、铬黄、荧光绿）。 */
  K.PLAN = {
    sahara:    { style: 'painted', x: 512,  y: 258, size: 66, align: 'left', rot: -0.022,
                 ink: '#3c1d10', accent: 'rgba(60,29,16,0.80)', underline: 'rgba(60,29,16,0.55)' },
    egypt:     { style: 'vertical', x: 1268, y: 178, size: 54, align: 'left', border: 'cartouche' },
    han:       { style: 'vertical', x: 508,  y: 190, size: 50, align: 'left',
                 ink: '#e8e0cc', accent: 'rgba(232,224,204,0.62)' },
    tang:      { style: 'vertical', x: 1428, y: 220, size: 40, align: 'right' },
    song:      { style: 'vertical', x: 1878, y: 128, size: 38, align: 'right' },
    qingming:  { style: 'vertical', x: 176,  y: 200, size: 40, align: 'left', border: 'slip' },
    maya:      { style: 'plaque',   x: 452,  y: 128, size: 33, align: 'left',
                 // 抄本里没有"黑底金匾"这种东西：框是朱红的、底是石灰白的
                 gold: '#b03a2e', goldSoft: 'rgba(176,58,46,0.45)',
                 plaqueFill: 'rgba(247,240,222,0.97)',
                 plaqueInk: '#1a1512', ink: '#1a1512', accent: 'rgba(26,21,18,0.62)' },
    mughal:    { style: 'plaque',   x: 960,  y: 96,  size: 37, align: 'center',
                 // 莫卧儿的牌子是金框 + 深红底 + 象牙字
                 gold: '#c9a227', goldSoft: 'rgba(201,162,39,0.55)',
                 plaqueFill: 'rgba(120,26,26,0.95)',
                 plaqueInk: '#f2e8d0', ink: '#f2e8d0', accent: 'rgba(242,232,208,0.72)' },
    bada:      { style: 'vertical', x: 1396, y: 150, size: 56, align: 'left', seal: true },
    wayang:    { style: 'plaque',   x: 452,  y: 112, size: 37, align: 'left' },
    ukiyo:     { style: 'vertical', x: 1404, y: 150, size: 42, align: 'right', border: 'slip' },
    starry:    { style: 'painted',  x: 470,  y: 306, size: 68, align: 'left', rot: 0.02,
                 ink: '#f7dc62', accent: 'rgba(247,220,98,0.80)', underline: 'rgba(247,220,98,0.62)' },
    scream:    { style: 'painted',  x: 960,  y: 252, size: 74, align: 'center', rot: -0.05,
                 ink: '#241a15', accent: 'rgba(36,26,21,0.72)', underline: 'rgba(36,26,21,0.45)' },
    nosferatu: { style: 'caption',  x: 960,  y: 900, size: 32, align: 'center' },
    scope:     { style: 'mono',     x: 462,  y: 138, size: 22, align: 'left', prefix: '> ',
                 glow: '#7dff9a', glowBlur: 16, caret: true,
                 ink: '#a6ffbb', accent: 'rgba(166,255,187,0.62)' },
    pixel:     { style: 'pixel',    x: 960,  y: 100, px: 4, size: 22, align: 'center' },
    chat:      { style: 'hud',      x: 560,  y: 124, size: 24, align: 'left', handle: '@system',
                 shadow: false, ink: '#1d232a', accent: 'rgba(29,35,42,0.62)' },
    vapor:     { style: 'neon',     x: 1852, y: 902, size: 52, align: 'right',
                 ink: '#fdf2ff', accent: 'rgba(255,206,240,0.85)' },
    vertical:  { style: 'hud',      x: 690,  y: 786, size: 25, align: 'left', handle: '@pelican.rides',
                 ink: '#ffffff', accent: 'rgba(255,255,255,0.75)' },
    code:      { style: 'mono',     x: 466,  y: 146, size: 21, align: 'left', prefix: '// ', caret: true },
  };
})();
