/* scenes/egypt.js — 02 埃及墓室壁画 · Egyptian Tomb Painting · 约前 1300
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.egypt = window.V.base.makePlaceholder({
    tint: '#c9a96a',
    paper: 'plaster',
    label: 'TOMB CHAPEL',
    numColor: 'rgba(60,40,10,0.18)',
    titleColor: '#2e2412',
    titleAccent: 'rgba(255,255,255,0.78)',
    road: { color: '#d4b57a', speed: 1 },
    rider: { scale: 1 },
  });
})();
