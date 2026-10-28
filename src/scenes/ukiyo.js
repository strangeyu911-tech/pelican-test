/* scenes/ukiyo.js — 11 浮世绘 · Ukiyo-e · 1830 年代
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.ukiyo = window.V.base.makePlaceholder({
    tint: '#2e4a6b',
    paper: 'washi',
    label: 'TŌKAIDŌ ROAD',
    numColor: 'rgba(240,230,208,0.18)',
    road: { color: '#3a5878', speed: 1 },
    rider: { scale: 1 },
  });
})();
