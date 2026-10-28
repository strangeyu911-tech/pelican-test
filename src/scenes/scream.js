/* scenes/scream.js — 13 呐喊 · The Scream · 1893
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.scream = window.V.base.makePlaceholder({
    tint: '#c25733',
    paper: 'washi',
    label: 'TEMPERA',
    numColor: 'rgba(255,240,210,0.18)',
    road: { color: '#b04c2c', speed: 1 },
    rider: { scale: 1 },
  });
})();
