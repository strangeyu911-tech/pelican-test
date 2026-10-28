/* scenes/vertical.js — 19 竖屏短视频 · Vertical Short Video · 2020 年代
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.vertical = window.V.base.makePlaceholder({
    tint: '#111111',
    paper: 'rubbing',
    label: '9:16 FEED',
    numColor: 'rgba(255,255,255,0.14)',
    titleColor: '#ffffff',
    titleAccent: 'rgba(255,255,255,0.78)',
    road: { color: '#181818', speed: 1 },
    rider: { scale: 1 },
  });
})();
