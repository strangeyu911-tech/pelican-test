/* scenes/starry.js — 12 星月夜 · The Starry Night · 1889
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.starry = window.V.base.makePlaceholder({
    tint: '#1b2a5c',
    paper: 'archive',
    label: 'OIL ON CANVAS',
    numColor: 'rgba(230,220,180,0.16)',
    titleColor: '#e8e2c8',
    titleAccent: 'rgba(255,255,255,0.78)',
    road: { color: '#25366c', speed: 1 },
    rider: { scale: 1 },
  });
})();
