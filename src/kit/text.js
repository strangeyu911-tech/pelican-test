/* text.js — 文字绘制。走原生 Canvas2D，因为 p5 的 textFont() 不认 @font-face 字体。
 *
 * 字体栈（public/fonts/fonts.css 里注册）：
 *   'Noto Serif SC'  中文衬线（宋体）— 标题卡、字幕
 *   'EB Garamond'    英文衬线 — 英文标题、图注
 *   'JetBrains Mono' 等宽 — 代码美学版块
 *   'Ma Shan Zheng'  毛笔楷书 — 中国古风版块的标题
 */
(function () {
  const V = (window.V = window.V || {});
  const T = (V.text = {});

  T.FONT = {
    cn: '"Noto Serif SC", "Songti SC", "SimSun", serif',
    cnBrush: '"Ma Shan Zheng", "KaiTi", "STKaiti", "Noto Serif SC", serif',
    en: '"EB Garamond", "Georgia", "Times New Roman", serif',
    mono: '"JetBrains Mono", "Consolas", "Menlo", monospace',
  };

  /** 拼 canvas font 字符串 */
  T.font = function (family, size, weight, italic) {
    return `${italic ? 'italic ' : ''}${weight || 400} ${size}px ${family}`;
  };

  /**
   * 画一行字。
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} str
   * @param {number} x
   * @param {number} y
   * @param {object} o
   *   font    T.FONT 的键，或完整 family 字符串
   *   size    字号（px）
   *   weight  字重
   *   color   填充色
   *   align   left | center | right
   *   base    top | middle | alphabetic | bottom
   *   spacing 字间距（px，Chrome 99+ 支持 letterSpacing）
   *   stroke  描边色
   *   strokeW 描边宽
   *   shadow  [dx, dy, blur, color]
   *   alpha   0..1
   *   maxW    超出则压缩
   */
  T.draw = function (ctx, str, x, y, o) {
    const opt = o || {};
    const family = T.FONT[opt.font] || opt.font || T.FONT.cn;
    const size = opt.size || 32;

    ctx.save();
    if (opt.alpha != null) ctx.globalAlpha *= opt.alpha;
    ctx.font = T.font(family, size, opt.weight, opt.italic);
    ctx.textAlign = opt.align || 'left';
    ctx.textBaseline = opt.base || 'alphabetic';
    if (opt.spacing != null && 'letterSpacing' in ctx) ctx.letterSpacing = `${opt.spacing}px`;
    if (opt.shadow) {
      ctx.shadowOffsetX = opt.shadow[0];
      ctx.shadowOffsetY = opt.shadow[1];
      ctx.shadowBlur = opt.shadow[2];
      ctx.shadowColor = opt.shadow[3];
    }
    if (opt.maxW) {
      const w = ctx.measureText(str).width;
      if (w > opt.maxW) {
        ctx.translate(x, y);
        ctx.scale(opt.maxW / w, 1);
        ctx.translate(-x, -y);
      }
    }
    if (opt.stroke) {
      ctx.strokeStyle = opt.stroke;
      ctx.lineWidth = opt.strokeW || 3;
      ctx.lineJoin = 'round';
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = opt.color || '#1a1a1a';
    ctx.fillText(str, x, y);
    ctx.restore();
  };

  T.measure = function (ctx, str, o) {
    const opt = o || {};
    ctx.save();
    ctx.font = T.font(T.FONT[opt.font] || opt.font || T.FONT.cn, opt.size || 32, opt.weight, opt.italic);
    if (opt.spacing != null && 'letterSpacing' in ctx) ctx.letterSpacing = `${opt.spacing}px`;
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  };

  /** 竖排（汉画像石、八大山人、落款用） */
  T.vertical = function (ctx, str, x, y, o) {
    const opt = o || {};
    const size = opt.size || 32;
    const lh = opt.lineHeight || size * 1.06;
    const chars = [...str];
    for (let i = 0; i < chars.length; i++) {
      T.draw(ctx, chars[i], x, y + i * lh, Object.assign({}, opt, { align: 'center', base: 'top' }));
    }
    return chars.length * lh;
  };

  /** 多行居中段落，返回总高 */
  T.paragraph = function (ctx, lines, cx, y, o) {
    const opt = o || {};
    const size = opt.size || 32;
    const lh = opt.lineHeight || size * 1.6;
    lines.forEach((ln, i) => {
      T.draw(ctx, ln, cx, y + i * lh, Object.assign({}, opt, { align: 'center' }));
    });
    return lines.length * lh;
  };

  /**
   * 标准标题卡（阶段 1 通用版；后续各版块可覆盖成自己的装帧）
   * 中文名 + 英文名 + 年代，三行左对齐，右下角。
   * @param {object} sc  { cn, en, era }
   * @param {object} o   { x, y, color, accent, alpha, cnFont, enSize, cnSize }
   */
  T.titleCard = function (ctx, sc, o) {
    const opt = o || {};
    const x = opt.x ?? 1560;
    const y = opt.y ?? 900;
    const color = opt.color || '#2a2622';
    const accent = opt.accent || color;
    const alpha = opt.alpha == null ? 1 : opt.alpha;
    if (alpha <= 0.002) return;

    ctx.save();
    ctx.globalAlpha *= alpha;

    // 一条细线压在英文名上方，给点版面感
    const enSize = opt.enSize || 19;
    const cnSize = opt.cnSize || 34;
    const lineW = opt.lineW ?? 300;

    T.draw(ctx, sc.era, x + lineW, y - cnSize - enSize - 26, {
      font: 'en', size: enSize * 0.86, color: accent, align: 'right', spacing: 2.4, weight: 400,
    });
    ctx.beginPath();
    ctx.moveTo(x, y - cnSize - enSize - 16);
    ctx.lineTo(x + lineW, y - cnSize - enSize - 16);
    ctx.strokeStyle = V.rgba(accent, 0.45);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    T.draw(ctx, sc.en, x, y - cnSize - 4, {
      font: 'en', size: enSize, color: color, align: 'left', spacing: 1.2, alpha: 0.82,
    });
    T.draw(ctx, sc.cn, x, y, {
      font: opt.cnFont || 'cn', size: cnSize, color: color, align: 'left', weight: opt.cnWeight || 700,
    });

    ctx.restore();
  };

  /** 淡入淡出包络下的标题卡 */
  T.titleCardAt = function (ctx, sc, localT, o) {
    const opt = o || {};
    const a = opt.fadeIn ?? 0.45;
    const b = opt.holdFrom ?? 0.45;
    const c = opt.holdTo ?? (opt.dur ? opt.dur - 0.5 : 4.2);
    const d = opt.fadeOut ?? (opt.dur ? opt.dur - 0.12 : 4.6);
    const alpha = V.envelope(localT, 0, a, c, d);
    if (alpha <= 0.002) return;
    // 微微上浮
    const rise = (1 - V.ease.outCubic(V.clamp(localT / a))) * 10;
    T.titleCard(ctx, sc, Object.assign({}, opt, { alpha, y: (opt.y ?? 900) + rise }));
  };

  /** 逐字打出（打字机），返回已显示的字数 */
  T.typewriter = function (ctx, str, x, y, reveal) {
    const n = Math.max(0, Math.min(str.length, Math.floor(reveal)));
    return str.slice(0, n);
  };
})();
