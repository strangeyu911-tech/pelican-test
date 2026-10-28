/* scenes/chat.js — 17 早期聊天窗口 · Early Chat Client · 2000 年代
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.chat = window.V.base.makePlaceholder({
    tint: '#b6c3d2',
    paper: 'archive',
    label: 'INSTANT MESSAGE',
    numColor: 'rgba(30,40,60,0.14)',
    road: { color: '#c4cfdb', speed: 1 },
    rider: { scale: 1 },
  });
})();
