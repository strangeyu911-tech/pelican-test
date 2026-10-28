/* scenes/scope.js — 15 示波器矢量图 · Oscilloscope Vector · 1950 年代
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.scope = window.V.base.makePlaceholder({
    tint: '#08120a',
    paper: 'rubbing',
    label: 'CRT DISPLAY',
    numColor: 'rgba(126,240,138,0.20)',
    road: { color: '#0c1a0e', speed: 1 },
    rider: { scale: 1 },
  });
})();
