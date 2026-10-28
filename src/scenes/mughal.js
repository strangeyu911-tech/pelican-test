/* scenes/mughal.js — 08 莫卧儿细密画 · Mughal Miniature · 约 1600
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.mughal = window.V.base.makePlaceholder({
    tint: '#c9963c',
    paper: 'washi',
    label: 'GARDEN SCENE',
    numColor: 'rgba(60,40,10,0.18)',
    titleColor: '#33240c',
    titleAccent: 'rgba(255,255,255,0.78)',
    road: { color: '#b98a34', speed: 1 },
    rider: { scale: 1 },
  });
})();
