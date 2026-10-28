/* scenes/maya.js — 07 玛雅抄本 · Maya Codex · 约 1200
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.maya = window.V.base.makePlaceholder({
    tint: '#8b3a2c',
    paper: 'washi',
    label: 'CODEX FOLD',
    numColor: 'rgba(255,230,200,0.20)',
    road: { color: '#9a4a34', speed: 1 },
    rider: { scale: 1 },
  });
})();
