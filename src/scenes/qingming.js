/* scenes/qingming.js — 06 清明上河图 · Along the River · 约 1100
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.qingming = window.V.base.makePlaceholder({
    tint: '#ddd0ae',
    paper: 'silk',
    label: 'HANDSCROLL',
    numColor: 'rgba(80,60,20,0.14)',
    road: { color: '#cdbe98', speed: 1 },
    rider: { scale: 1 },
  });
})();
