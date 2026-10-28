/* scenes/nosferatu.js — 14 诺斯费拉图 · Nosferatu · 1922
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.nosferatu = window.V.base.makePlaceholder({
    tint: '#171d18',
    paper: 'rock',
    label: 'SILENT FILM',
    numColor: 'rgba(220,216,192,0.14)',
    titleColor: '#d8d4c0',
    titleAccent: 'rgba(255,255,255,0.78)',
    road: { color: '#1f2620', speed: 1 },
    rider: { scale: 1 },
  });
})();
