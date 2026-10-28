/* scenes/sahara.js — 01 撒哈拉岩画 · Saharan Rock Art · 约前 4000
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.sahara = window.V.base.makePlaceholder({
    tint: '#b5763e',
    paper: 'rock',
    label: 'ROCK SHELTER',
    numColor: 'rgba(255,240,220,0.20)',
    titleColor: '#f6ead6',
    titleAccent: 'rgba(255,255,255,0.78)',
    road: { color: '#a8703f', speed: 1 },
    rider: { scale: 1 },
  });
})();
