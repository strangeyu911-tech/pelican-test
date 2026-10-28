/* scenes/code.js — 20 代码美学 · Code Aesthetic · 2020 年代
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.code = window.V.base.makePlaceholder({
    tint: '#11161e',
    paper: 'rubbing',
    label: 'SVG SOURCE',
    numColor: 'rgba(200,220,240,0.16)',
    road: { color: '#161d26', speed: 1 },
    rider: { scale: 1 },
  });
})();
