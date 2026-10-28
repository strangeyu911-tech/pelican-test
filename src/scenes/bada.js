/* scenes/bada.js — 09 八大山人写意 · Bada Shanren, Xieyi · 约 1690
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.bada = window.V.base.makePlaceholder({
    tint: '#f4eee1',
    paper: 'xuan',
    label: 'SPARSE INK',
    numColor: 'rgba(60,50,40,0.10)',
    titleColor: '#2a2622',
    titleAccent: 'rgba(255,255,255,0.78)',
    road: { color: '#e6dfd0', speed: 1 },
    rider: { scale: 1 },
  });
})();
