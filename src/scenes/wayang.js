/* scenes/wayang.js — 10 爪哇皮影戏 · Wayang Kulit · 约 1800
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.wayang = window.V.base.makePlaceholder({
    tint: '#8a4a22',
    paper: 'rock',
    label: 'SHADOW PLAY',
    numColor: 'rgba(255,230,200,0.18)',
    road: { color: '#7e4420', speed: 1 },
    rider: { scale: 1 },
  });
})();
