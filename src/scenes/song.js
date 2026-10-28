/* scenes/song.js — 05 宋代山水 · Song Landscape · 约 1000
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.song = window.V.base.makePlaceholder({
    tint: '#d6d0c0',
    paper: 'xuan',
    label: 'HANGING SCROLL',
    numColor: 'rgba(60,50,40,0.13)',
    titleColor: '#2a2622',
    titleAccent: 'rgba(255,255,255,0.78)',
    road: { color: '#c8c0ae', speed: 1 },
    rider: { scale: 1 },
  });
})();
