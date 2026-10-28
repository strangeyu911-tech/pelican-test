/* bike.js — 自行车绘制。侧面视角，关键点从 V.rig.pose() 取。
 * 同样是纯 Canvas2D，坐标系由调用方设好。
 */
(function () {
  const V = (window.V = window.V || {});
  const B = (V.bike = {});

  B.defaultStyle = {
    frame: '#3a4a52',
    frameDark: '#243036',
    tire: '#1e2022',
    rim: '#8c9398',
    spoke: '#b9bfc3',
    saddle: '#2a2320',
    lw: 2.2,
    tubeW: 5,
    spokes: 10,
    /** 轮辋高光强度 0..1 */
    shine: 0.4,
  };

  /** 单个轮子 */
  function wheel(ctx, c, R, ang, s) {
    // 胎
    ctx.beginPath();
    ctx.arc(c[0], c[1], R, 0, Math.PI * 2);
    ctx.strokeStyle = s.tire;
    ctx.lineWidth = s.tubeW * 1.9;
    ctx.stroke();
    // 轮辋
    ctx.beginPath();
    ctx.arc(c[0], c[1], R - s.tubeW * 0.9, 0, Math.PI * 2);
    ctx.strokeStyle = s.rim;
    ctx.lineWidth = s.lw * 0.9;
    ctx.stroke();
    // 辐条
    ctx.strokeStyle = s.spoke;
    ctx.lineWidth = s.lw * 0.42;
    ctx.beginPath();
    const n = s.spokes;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ang;
      const inner = R * 0.16;
      ctx.moveTo(c[0] + Math.cos(a) * inner, c[1] + Math.sin(a) * inner);
      ctx.lineTo(c[0] + Math.cos(a) * (R - s.tubeW * 0.9), c[1] + Math.sin(a) * (R - s.tubeW * 0.9));
    }
    ctx.stroke();
    // 花鼓
    ctx.beginPath();
    ctx.arc(c[0], c[1], R * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = s.rim;
    ctx.fill();
    ctx.strokeStyle = s.frameDark;
    ctx.lineWidth = s.lw * 0.6;
    ctx.stroke();
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} p V.rig.pose()
   * @param {object} st 风格
   */
  B.draw = function (ctx, p, st) {
    const s = Object.assign({}, B.defaultStyle, st || {});
    const tw = s.tubeW;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 轮子转动角：与脚踏同相（齿比 2:1，脚踏一圈轮子转两圈，视觉上更活）
    const wheelAng = p.phase * 2;

    // ---- 后轮 ----
    wheel(ctx, p.rear, p.R, wheelAng, s);
    // ---- 前轮 ----
    wheel(ctx, p.front, p.R, wheelAng * 1.02, s);

    // ---- 车架 ----
    const tubes = [
      [p.bb, p.seat],       // 座管
      [p.seat, p.head],     // 上管
      [p.bb, p.head],       // 下管
      [p.bb, p.rear],       // 后下叉
      [p.seat, p.rear],     // 后上叉
      [p.head, p.front],    // 前叉
    ];
    ctx.strokeStyle = s.frame;
    ctx.lineWidth = tw;
    ctx.beginPath();
    for (const [a, b] of tubes) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    ctx.stroke();
    // 管子的高光（一根细亮线，让车架有金属感）
    ctx.strokeStyle = V.rgba('#ffffff', 0.18 * s.shine + 0.06);
    ctx.lineWidth = tw * 0.34;
    ctx.beginPath();
    for (const [a, b] of tubes) {
      ctx.moveTo(a[0] - 0.9, a[1] - 0.9);
      ctx.lineTo(b[0] - 0.9, b[1] - 0.9);
    }
    ctx.stroke();

    // ---- 把立 + 车把 ----
    ctx.strokeStyle = s.frameDark;
    ctx.lineWidth = tw * 0.72;
    ctx.beginPath();
    ctx.moveTo(p.head[0], p.head[1]);
    ctx.lineTo(p.stem[0], p.stem[1]);
    ctx.stroke();
    // 弯把：从把立前端往前弯一点再往下
    ctx.beginPath();
    ctx.moveTo(p.stem[0], p.stem[1]);
    ctx.quadraticCurveTo(p.grip[0] - 2, p.stem[1] - 12, p.grip[0], p.grip[1]);
    ctx.strokeStyle = s.frame;
    ctx.lineWidth = tw * 0.8;
    ctx.stroke();
    // 把套
    ctx.beginPath();
    ctx.arc(p.grip[0], p.grip[1], tw * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = s.saddle;
    ctx.fill();

    // ---- 座垫 ----
    ctx.beginPath();
    ctx.moveTo(p.seat[0] - 24, p.seat[1] + 2);
    ctx.quadraticCurveTo(p.seat[0] - 6, p.seat[1] - 7, p.seat[0] + 16, p.seat[1] - 1);
    ctx.quadraticCurveTo(p.seat[0] - 2, p.seat[1] + 7, p.seat[0] - 24, p.seat[1] + 2);
    ctx.closePath();
    ctx.fillStyle = s.saddle;
    ctx.fill();

    // ---- 牙盘 + 链条 ----
    ctx.beginPath();
    ctx.arc(p.bb[0], p.bb[1], tw * 2.6, 0, Math.PI * 2);
    ctx.fillStyle = s.rim;
    ctx.fill();
    ctx.strokeStyle = s.frameDark;
    ctx.lineWidth = s.lw * 0.7;
    ctx.stroke();
    // 链条：牙盘上缘 -> 后轮花鼓
    ctx.strokeStyle = V.rgba(s.frameDark, 0.75);
    ctx.lineWidth = s.lw * 0.5;
    ctx.beginPath();
    ctx.moveTo(p.bb[0], p.bb[1] - tw * 2.6);
    ctx.lineTo(p.rear[0], p.rear[1] - p.R * 0.13);
    ctx.moveTo(p.bb[0], p.bb[1] + tw * 2.6);
    ctx.lineTo(p.rear[0], p.rear[1] + p.R * 0.13);
    ctx.stroke();

    // ---- 曲柄（远端在下、近端在上，画一次的层次就够）----
    ctx.strokeStyle = s.frameDark;
    ctx.lineWidth = tw * 0.68;
    ctx.beginPath();
    ctx.moveTo(p.bb[0], p.bb[1]);
    ctx.lineTo(p.crankR[0], p.crankR[1]);
    ctx.stroke();
    ctx.strokeStyle = s.frame;
    ctx.beginPath();
    ctx.moveTo(p.bb[0], p.bb[1]);
    ctx.lineTo(p.crankL[0], p.crankL[1]);
    ctx.stroke();
    // 踏板
    for (const c of [p.crankR, p.crankL]) {
      ctx.beginPath();
      ctx.moveTo(c[0] - 9, c[1] + 1);
      ctx.lineTo(c[0] + 9, c[1] + 1);
      ctx.strokeStyle = s.saddle;
      ctx.lineWidth = tw * 0.62;
      ctx.stroke();
    }

    ctx.restore();
  };

  /** 只有车轮的轮廓线（示波器版块的发光线条用） */
  B.outline = function (ctx, p, color, lw) {
    ctx.save();
    // ⚠️ 必须自己设 strokeStyle。早先没设，靠"上一个绘制留下的颜色"运气好，
    // 结果展墙缩略图里的自行车直接消失。
    ctx.strokeStyle = color || B.defaultStyle.line;
    ctx.lineWidth = lw || 1.6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(p.rear[0], p.rear[1], p.R, 0, Math.PI * 2);
    ctx.moveTo(p.front[0] + p.R, p.front[1]);
    ctx.arc(p.front[0], p.front[1], p.R, 0, Math.PI * 2);
    const tubes = [[p.bb, p.seat], [p.seat, p.head], [p.bb, p.head], [p.bb, p.rear], [p.seat, p.rear], [p.head, p.front]];
    for (const [a, b] of tubes) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    ctx.stroke();
    ctx.restore();
  };
})();
