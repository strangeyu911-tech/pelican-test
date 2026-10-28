/* scenes/han.js — 03 汉画像石拓片 · Han Stone Relief · 约 100
 *
 * 阶段 1：占位色块。只为验证节奏、转场、路面接缝、标题卡可读性。
 * 阶段 3 会被真实实现替换 —— 届时改这一个文件即可，不要动 _base.js。
 */
(function () {
  const S = (window.V.scenes = window.V.scenes || {});
  S.han = window.V.base.makePlaceholder({
    tint: '#15130f',
    paper: 'rubbing',
    label: 'STONE RELIEF',
    numColor: 'rgba(255,255,255,0.14)',
    road: { color: '#23201a', speed: 1 },
    rider: { scale: 1 },
  });
})();
