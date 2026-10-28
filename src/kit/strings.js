/* strings.js — 全片文字的单一真相源。
 * 所有会出现在画面上的字都写在这里。字体子集化（tools/fetch-fonts.mjs）直接读这个文件，
 * 所以新增文案必须改这里，否则渲染时会缺字。
 */
(function () {
  const S = {};

  // ---------- 全片结构 ----------
  S.title = '鹈鹕测试';
  S.titleEn = 'The Pelican Test';
  S.subtitle = '一部关于人类如何反复描绘同一只鸟的简史';
  S.subtitleEn = 'A Brief History of Drawing the Same Bird';

  // ---------- Intro ----------
  S.intro = {
    caption: '图一　鹈鹕骑行图（摹本）',
    captionEn: 'Fig. 1 — Pelican Riding (after the original)',
    lines: [
      '人类自古以来就痴迷于画鹈鹕骑自行车。',
      '——早在自行车被发明之前。',
    ],
    credit: '——《鹈鹕骑行艺术通史》，卷一',
    creditEn: '— A General History of Pelican Cycling, Vol. I',
  };

  // ---------- 20 个版块 ----------
  S.scenes = [
    { id: 'sahara',  cn: '撒哈拉岩画',   en: 'Saharan Rock Art',              era: '约前 4000' },
    { id: 'egypt',   cn: '埃及墓室壁画', en: 'Egyptian Tomb Painting',        era: '约前 1300' },
    { id: 'han',     cn: '汉画像石拓片', en: 'Han Stone Relief Rubbing',      era: '约 100' },
    { id: 'tang',    cn: '唐代白描',     en: 'Tang Baimiao Line Drawing',     era: '约 750' },
    { id: 'song',    cn: '宋代山水',     en: 'Song Dynasty Landscape',        era: '约 1000' },
    { id: 'qingming',cn: '清明上河图',   en: 'Along the River During Qingming',era: '约 1100' },
    { id: 'maya',    cn: '玛雅抄本',     en: 'Maya Codex',                    era: '约 1200' },
    { id: 'mughal',  cn: '莫卧儿细密画', en: 'Mughal Miniature',              era: '约 1600' },
    { id: 'bada',    cn: '八大山人写意', en: 'Bada Shanren, Xieyi',           era: '约 1690' },
    { id: 'wayang',  cn: '爪哇皮影戏',   en: 'Wayang Kulit',                  era: '约 1800' },
    { id: 'ukiyo',   cn: '浮世绘',       en: 'Ukiyo-e',                       era: '1830 年代' },
    { id: 'starry',  cn: '星月夜',       en: 'The Starry Night',              era: '1889' },
    { id: 'scream',  cn: '呐喊',         en: 'The Scream',                    era: '1893' },
    { id: 'nosferatu',cn: '诺斯费拉图',  en: 'Nosferatu',                     era: '1922' },
    { id: 'scope',   cn: '示波器矢量图', en: 'Oscilloscope Vector Display',   era: '1950 年代' },
    { id: 'pixel',   cn: '8-bit 像素游戏',en: '8-bit Platformer',             era: '1980 年代' },
    { id: 'chat',    cn: '早期聊天窗口', en: 'Early Chat Client',             era: '2000 年代' },
    { id: 'vapor',   cn: '蒸汽波',       en: 'Vaporwave',                     era: '2010 年代' },
    { id: 'vertical',cn: '竖屏短视频',   en: 'Vertical Short Video',          era: '2020 年代' },
    { id: 'code',    cn: '代码美学',     en: 'Code Aesthetic',                era: '2020 年代' },
  ];

  // ---------- Outro ----------
  S.outro = {
    lines: [
      '截至目前，人类共提交了 20 份答卷。',
      '鹈鹕本人对此尚未发表评论。',
    ],
    linesEn: [
      'To date, humanity has submitted twenty responses.',
      'The pelican has declined to comment.',
    ],
    placard: '鹈鹕（本人）',
    placardEn: 'PELICAN (in person)',
    empty: '第 21 席',
  };

  // ---------- 界面 ----------
  S.ui = {
    play: '播放', pause: '暂停', scene: '版块', of: '/',
    loading: '载入中', ready: '就绪',
  };

  // ---------- 供字体子集化使用：把所有可见文字拼成一个大字符串 ----------
  S.allGlyphs = function () {
    const parts = [S.title, S.titleEn, S.subtitle, S.subtitleEn];
    parts.push(S.intro.caption, S.intro.captionEn, ...S.intro.lines, S.intro.credit, S.intro.creditEn);
    for (const s of S.scenes) parts.push(s.cn, s.en, s.era);
    parts.push(...S.outro.lines, ...S.outro.linesEn, S.outro.placard, S.outro.placardEn, S.outro.empty);
    parts.push(S.ui.play, S.ui.pause, S.ui.scene, S.ui.loading, S.ui.ready);
    // 常用标点、数字、拉丁字母，兜底
    parts.push('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    parts.push('—–·、。，：；！？（）《》「」『』…　％');
    return parts.join('');
  };

  /** 去重后的字符数组 */
  S.charset = function () {
    return [...new Set([...S.allGlyphs()])].join('');
  };

  if (typeof window !== 'undefined') window.S = S;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})();
