/* scenes/vapor.js — 18 蒸汽波 · Vaporwave · 2010 年代
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.vapor = window.V.base.makePlaceholder({
    tint: '#c96fb0',
    paper: 'archive',
    label: 'MALLSOFT',
    numColor: 'rgba(60,20,80,0.16)',
    road: { color: '#b0609c', speed: 1 },
    rider: { scale: 1 },
  });
})();
