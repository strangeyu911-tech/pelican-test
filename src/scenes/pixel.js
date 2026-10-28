/* scenes/pixel.js — 16 8-bit 像素游戏 · 8-bit Platformer · 1980 年代
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.pixel = window.V.base.makePlaceholder({
    tint: '#2a3a8a',
    paper: 'archive',
    label: 'CARTRIDGE',
    numColor: 'rgba(255,255,255,0.18)',
    titleColor: '#ffffff',
    titleAccent: 'rgba(255,255,255,0.78)',
    road: { color: '#33459c', speed: 1 },
    rider: { scale: 1 },
  });
})();
