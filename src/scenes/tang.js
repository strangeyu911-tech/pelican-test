/* scenes/tang.js — 04 唐代白描 · Tang Baimiao · 约 750
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.tang = window.V.base.makePlaceholder({
    tint: '#efe8d8',
    paper: 'xuan',
    label: 'INK ON SILK',
    numColor: 'rgba(60,50,40,0.13)',
    road: { color: '#d8cfbc', speed: 1 },
    rider: { scale: 1 },
  });
})();
