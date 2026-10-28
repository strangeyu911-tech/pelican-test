/* rig.js — 鹈鹕 + 自行车的骨骼木偶。
 *
 * 只算关键点，不负责绘制。各版块拿到同一套关键点，用自己的画笔去画，
 * 所以换风格时动作是连续的（这是全片"同一只鹈鹕"的物理基础）。
 *
 * 局部坐标：原点 = 后轮着地点，y 向上为负（屏幕坐标系惯例）。
 * 由调用方整体平移到路面：translate(rideX, V.ROAD_Y)。
 *
 * 脚踏一圈 = 两拍 = 1 秒（TL.pedal）。
 */
(function () {
  const V = (window.V = window.V || {});

  // ---------- 尺寸（单位空间。1000 单位 = 1080px，所以 1 单位约 1px@1080p） ----------
  const G = {
    R: 62,          // 车轮半径
    wb: 200,        // 轴距（后轮心到前轮心）
    bbDrop: 15,     // 中轴比轮心低多少
    bbBack: 22,     // 中轴在后轮心前方多少（坐管角度）
    seatH: 110,     // 中轴到座位的高度
    seatBack: 26,   // 座位比中轴靠后多少
    headUp: 96,     // 车头上端（把立顶）比轮心高多少
    headBack: 34,   // 车头上端比前轮心靠后多少
    crank: 34,      // 曲柄长
    thigh: 80,      // 大腿
    shin: 80,       // 小腿
    tube: 5,        // 车架管径（绘制用）
  };

  /** 两段式 IK：已知髋 H、脚踝 A、大腿 L1、小腿 L2，求膝 K。
   *  flip = +1 让膝盖朝前弯（骑车时膝盖向前顶）。 */
  function ik(H, A, L1, L2, flip) {
    const dx = A[0] - H[0], dy = A[1] - H[1];
    let d = Math.hypot(dx, dy);
    d = Math.min(d, L1 + L2 - 0.5);       // 够不着时让步，避免 NaN
    d = Math.max(d, Math.abs(L1 - L2) + 0.5); // 太近时让步
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const ux = dx / (d || 1), uy = dy / (d || 1);
    const mx = H[0] + ux * a, my = H[1] + uy * a;
    return [mx + uy * h * flip, my - ux * h * flip];
  }

  const rig = (V.rig = { geo: G, ik });

  /**
   * 解算整套骨架。
   * @param {number} t  全片时间（秒）
   * @param {object} mod 表演修饰参数（各版块可选）
   *   bob      车身起伏幅度倍率（默认 1）
   *   lean     身体前倾增量（弧度，正 = 往前趴）
   *   neckCurl 脖子弯曲增量（正 = 更 S 形）
   *   headTilt 头部俯仰（弧度）
   *   stretch  整体拉伸（1 = 正常）
   * @returns {object} 关键点集合
   */
  rig.pose = function (t, mod) {
    const m = mod || {};
    const bobAmt = m.bob ?? 1;
    const lean = m.lean ?? 0;
    const neckCurl = m.neckCurl ?? 0;
    const headTilt = m.headTilt ?? 0;
    const stretch = m.stretch ?? 1;

    // 脚踏相位：一圈 = 两拍 = 1 秒。全片统一，任何版块都对得上。
    const phase = V.TL.pedal(t);

    // 车身随踩踏轻微起伏：每半圈（= 每踩一下）下沉一次
    const bob = Math.sin(phase * 2) * 2.6 * bobAmt;

    const R = G.R, wb = G.wb;
    // 车体基准点
    const rear = [0, -R];
    const front = [wb, -R];
    const bb = [G.bbBack, -R + G.bbDrop + bob * 0.35];
    const seat = [bb[0] - G.seatBack, bb[1] - G.seatH];
    const head = [front[0] - G.headBack, -R - G.headUp * 0.5 + bob * 0.55];
    const stem = [head[0] + 6, head[1] - G.headUp * 0.5];
    const grip = [stem[0] + 26, stem[1] - 10 + bob * 0.55];

    // 曲柄两端（左 = 近端，右 = 远端）
    const crankL = [bb[0] + Math.cos(phase) * G.crank, bb[1] + Math.sin(phase) * G.crank];
    const crankR = [bb[0] - Math.cos(phase) * G.crank, bb[1] - Math.sin(phase) * G.crank];

    // ---- 鹈鹕 ----
    // 髋：坐在座上，略往前
    const hip = [seat[0] + 10, seat[1] - 6];
    const torsoAng = -0.58 + lean;
    const torsoLen = 100 * stretch;
    const ca = Math.cos(torsoAng), sa = Math.sin(torsoAng);
    // 躯干局部坐标 -> 屏幕。u = 沿脊椎向前，v = 垂直脊椎（负 = 背上，正 = 腹下）
    const BL = (u, v) => [hip[0] + ca * u - sa * v, hip[1] + sa * u + ca * v];

    // 躯干轮廓锚点：全部体型比例集中在这一张表里，改胖瘦/长短只动它。
    // 顺序：尾根 → 背 → 颈根 → 胸 → 腹（前 → 后）—— pelican.js 会绕成一圈。
    const body = [
      BL(-56, -2), BL(-42, -34), BL(-8, -55), BL(38, -60), BL(80, -48),
      BL(110, -23),                                  // ← body[5] = 颈根
      BL(118, 9), BL(103, 37), BL(60, 52), BL(9, 55), BL(-34, 38),
    ];
    const neckRoot = body[5];
    // 翅膀起点：体侧偏前（不是背脊）。挂在背脊上时翅膀会横切整个胸腔，看着像条围巾。
    const shoulder = BL(72, -14);

    // 脖子：从颈根先微微向后弓（喉部），再向前顶到头。
    // 这段只有 76 长、32 粗 —— 早先做成 92 长、56 粗，结果脖子比身体还抢眼，
    // 看起来像一条蛇，而不是一只鹈鹕。改动务必克制。
    const n1 = [neckRoot[0] - 9 - neckCurl * 9, neckRoot[1] - 28];
    const n2 = [neckRoot[0] + 11 + neckCurl * 15, neckRoot[1] - 53];
    const headC = [neckRoot[0] + 21 + neckCurl * 8 + lean * 10, neckRoot[1] - 74 * stretch];
    const neckW = [32, 27, 23, 20];

    // 头本身的朝向（喙的方向）。注意：喙长 ≈ 0.6 身长，是辨识度的第一来源。
    const beakAng = -0.05 + headTilt + lean * 0.28;
    const headR = 20 * stretch;
    const beakBase = [headC[0] + Math.cos(beakAng) * headR * 0.62, headC[1] + Math.sin(beakAng) * headR * 0.62];
    const beakLen = 98 * stretch;
    const beakTip = [beakBase[0] + Math.cos(beakAng) * beakLen, beakBase[1] + Math.sin(beakAng) * beakLen];
    // 喉囊：从喙根沿着下颌垂下来的一大袋，这是鹈鹕的灵魂
    const pouchDrop = 44 * stretch + Math.sin(phase) * 2.2;

    // 腿：从身体下缘长出（不是从髋点），否则两条腿像是插在肚子中间
    const legRoot = [hip[0] + 22, hip[1] + 27];
    const ankleR = [crankR[0], crankR[1] - 4];
    const ankleL = [crankL[0], crankL[1] - 4];
    const kneeR = ik(legRoot, ankleR, G.thigh, G.shin, 1);
    const kneeL = ik(legRoot, ankleL, G.thigh, G.shin, 1);

    // 翅膀：肩 -> 车把
    const wingElbow = [shoulder[0] - 16, shoulder[1] + 22];
    const wingTip = [grip[0] - 6, grip[1] - 4];

    // 尾：短楔形三角（pelican.js 单独画，不进主轮廓）
    const tailA = BL(-42, -26);                       // 根部上
    const tailB = BL(-92, -2 + Math.sin(phase * 2) * 2.2); // 尾尖
    const tailC = BL(-40, 18);                        // 根部下
    const tailTip = tailB;
    const tailBase = BL(-44, -4);

    return {
      // 车
      R, rear, front, bb, seat, head, stem, grip,
      crankL, crankR, pedalL: crankL, pedalR: crankR,
      // 鹈鹕
      hip, shoulder, neckRoot, n1, n2, headC, headR, beakBase, beakTip,
      beakLen, beakAng, neckW, body, pouchDrop, torsoLen, torsoAng,
      // 兼容旧接口：早先的代码只认 pouch / pouchMid / pouchBack / neckMid，保留别名以免各版块踩空
      pouch: [beakBase[0] + Math.cos(beakAng) * beakLen * 0.46, beakBase[1] + pouchDrop],
      pouchMid: [beakBase[0] + Math.cos(beakAng) * beakLen * 0.46, beakBase[1] + pouchDrop],
      pouchBack: [beakBase[0] - 10, beakBase[1] + pouchDrop * 0.45],
      neckMid: n2,
      wingElbow, wingTip, tailBase, tailTip, tailA, tailB, tailC,
      kneeL, kneeR, ankleL, ankleR, legRoot,
      // 状态
      phase, bob, torsoAng, lean,
      /** 车身包围盒（供各版块构图时避让 / 摄像机跟随） */
      bounds: {
        x0: tailTip[0] - 8, x1: beakTip[0] + 10,
        y0: headC[1] - headR - 18, y1: 6,
      },
    };
  };

  /**
   * 采样一整圈的关键点，供"影子""余辉""皮影"这类需要路径的版块使用。
   * @param {number} t 起点时间
   * @param {number} n 采样数
   */
  rig.cycle = function (t, n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(rig.pose(t + (i / n) * 1.0));
    return out;
  };
})();
