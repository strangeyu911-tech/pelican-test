/* timeline.js — 全片结构与时间轴。唯一真相源。
 *
 * 120 BPM：1 拍 0.5s，1 小节（4 拍）2s。
 * 所有版块边界都落在小节线上（= 强拍），因为每格都是整小节数。
 *
 *   Intro   3 小节 = 6s                     [0, 6)
 *   版块 1╌20  合计 60 小节 = 120s          [6, 126)
 *   Outro   6 小节 = 12s                    [126, 138)
 *   总计    69 小节 = 138s = 2:18
 *
 * 版块时长分配（为什么有长有短）：
 *   tang(4)  2 小节 —— 纯墨线展示，笔法本身就是内容，4 秒够
 *   bada(9)  2 小节 —— 寥寥数笔 + 白眼，留白多，4 秒够
 *   song(5)  4 小节 —— 「鹈鹕小到几乎看不见，镜头推近才找到」需要推镜时间
 *   code(20) 4 小节 —— 逐行写 SVG 代码 + 鹈鹕被一笔笔画出，观众还要读得清
 *   其余     3 小节 —— 进场 / 梗 / 骑向下一道画框
 */
(function () {
  const BPM = 120;
  const BEAT = 60 / BPM;      // 0.5
  const BAR = 4 * BEAT;       // 2.0

  const INTRO_BARS = 3;
  const OUTRO_BARS = 6;

  // 版块出场顺序（与 strings.js 的 S.scenes 顺序一致）
  const ORDER = [
    'sahara', 'egypt', 'han', 'tang', 'song',
    'qingming', 'maya', 'mughal', 'bada', 'wayang',
    'ukiyo', 'starry', 'scream', 'nosferatu', 'scope',
    'pixel', 'chat', 'vapor', 'vertical', 'code',
  ];

  // 只列偏离默认 3 小节的
  const BARS_OVERRIDE = {
    tang: 2, bada: 2,
    song: 4, code: 4,
  };

  function build() {
    const sections = [];
    let t = 0;

    sections.push({
      kind: 'intro', id: 'intro', index: 0,
      t0: 0, t1: INTRO_BARS * BAR, bars: INTRO_BARS,
    });
    t = INTRO_BARS * BAR;

    ORDER.forEach((id, i) => {
      const bars = BARS_OVERRIDE[id] ?? 3;
      const dur = bars * BAR;
      sections.push({
        kind: 'scene', id, index: i + 1,
        t0: t, t1: t + dur, bars, dur,
      });
      t += dur;
    });

    sections.push({
      kind: 'outro', id: 'outro', index: 21,
      t0: t, t1: t + OUTRO_BARS * BAR, bars: OUTRO_BARS,
    });
    t += OUTRO_BARS * BAR;

    // 过画框的时刻（相邻 section 的接缝），全部应为小节线
    const boundaries = sections.slice(1).map((s) => s.t0);

    return {
      fps: 30,
      bpm: BPM,
      beat: BEAT,
      bar: BAR,
      barsTotal: Math.round(t / BAR),
      duration: t,
      sections,
      boundaries,
    };
  }

  const TL = build();

  // ---------- 查询工具 ----------
  /** 时间 t 属于哪个 section（含 0.3s 转场外扩，返回主 section） */
  TL.at = function (t) {
    const S = TL.sections;
    for (let i = 0; i < S.length; i++) if (t >= S[i].t0 && t < S[i].t1) return S[i];
    return t < 0 ? S[0] : S[S.length - 1];
  };

  /** 按 id 找 section */
  TL.byId = function (id) {
    return TL.sections.find((s) => s.id === id) || null;
  };

  /** 只取 20 个版块 */
  TL.scenes = function () {
    return TL.sections.filter((s) => s.kind === 'scene');
  };

  /** 某个时刻是否落在转场窗口里（边界 ±half） */
  TL.transitionAt = function (t, half) {
    half = half ?? 0.3;
    for (const b of TL.boundaries) {
      if (t >= b - half && t <= b + half) {
        const a = TL.at(b - half - 0.001);
        const c = TL.at(b + half + 0.001);
        return { boundary: b, a, b: c, p: (t - (b - half)) / (2 * half) };
      }
    }
    return null;
  };

  /** t 是在第几拍（可为小数） */
  TL.beatPos = function (t) { return t / BEAT; };
  /** t 是在第几小节（可为小数） */
  TL.barPos = function (t) { return t / BAR; };

  /**
   * 脚踏相位：一圈 = 两拍 = 1 秒。
   * 全片统一，所以任何版块、任何风格里鹈鹕的踩踏节奏都对得上。
   */
  TL.pedal = function (t) { return (t / (2 * BEAT)) * Math.PI * 2; };

  /** section 内的局部时间 */
  TL.local = function (t, sec) { return t - sec.t0; };

  /** 到下一个边界的距离（秒）；没有下一个则返回 Infinity */
  TL.toNextBoundary = function (t) {
    for (const b of TL.boundaries) if (b > t) return b - t;
    return Infinity;
  };

  /** 强拍强度：1 = 小节首拍，0.6 = 第三拍，0.3 = 其余 */
  TL.accent = function (t) {
    const b = ((t / BEAT) % 4 + 4) % 4;
    if (b < 0.001) return 1;
    if (Math.abs(b - 2) < 0.001) return 0.6;
    return 0.3;
  };

  if (typeof window !== 'undefined') {
    (window.V = window.V || {}).TL = TL;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = TL;
})();
