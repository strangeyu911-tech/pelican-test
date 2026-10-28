# 鹈鹕测试 · The Pelican Test

> 一只鹈鹕骑着自行车，沿一条连续的马路穿过 20 个美术史时期。
> 每次穿过画框，画风就变一次。

一部**完全由代码生成的动画短片**：没有手绘素材，没有外部音源，没有视频剪辑软件。
画面是 `t` 的纯函数，逐帧用无头 Chrome 导出；音乐用 Web Audio 实时合成。

- 时长 **2:18**（138.000 s）—— 需求写的是约 2:17，为了让 20 次穿画框**全部落在小节线上**，
  Intro 从 2.5 小节改成 3 小节，多出半秒。1920×1080，60 fps
- 120 BPM，69 小节，每一次穿画框都落在小节线上
- 20 个版块：撒哈拉岩画 → 埃及墓室 → 汉画像石 → 唐白描 → 宋山水 → 清明上河图 →
  玛雅抄本 → 莫卧儿细密画 → 八大山人 → 爪哇皮影 → 浮世绘 → 星月夜 → 呐喊 →
  诺斯费拉图 → 示波器 → 8-bit → 聊天客户端 → 蒸汽波 → 竖屏短视频 → 代码

---

## 两个交付物

1. **浏览器预览页** —— 底部有播放条（播放/暂停、拖动、当前版块名），实时 Web Audio。
   在项目根起一个静态服务，打开 `index.html` 即可。
2. **成片 MP4** —— Puppeteer 逐帧导 PNG + OfflineAudioContext 导出 WAV + ffmpeg 合成。

---

## 跑起来

需要 Node 20+、Chrome、ffmpeg。

```bash
npm install

# 起预览页（推荐用任一静态服务；本项目自带的工具会自动起）
node tools/preview-shot.mjs --t 40 --out shot.png   # 顺便截一张

# 时间轴表（69 小节的起止时间，给写版块的人用）
node tools/shot.mjs --tl

# 抽帧看某一格
node tools/shot.mjs --scene song
node tools/shot.mjs --t 30.5 --out docs/a.png
node tools/shot.mjs --t 8.5 --q rider               # 只看骑手（放大 2.5×）
node tools/shot.mjs --t 8.5 --q rider,rig           # 再看骨架锚点

# 接触表
node tools/sheet.mjs --sections                     # 20 个版块各一帧
node tools/sheet.mjs --every 7                      # 全片每 7 秒一帧

# 出片
node tools/render.mjs --fps 60 --workers 3          # → frames/（可续跑）
node tools/encode.mjs --fps 60 --audio audio/score.wav --out out/pelican.mp4

# 同一套 60fps 帧出 30fps 草稿（抽帧，不是重新渲染）
node tools/encode.mjs --fps 30 --every 2 --no-audio --out out/draft_30.mp4
```

`render.mjs` 已存在的帧会自动跳过，中断了直接重跑就是续跑；`--force` 全部重渲。
`encode.mjs --fps` 是**输出**帧率，配上 `--every N` 表示输入帧是输出的 N 倍。

---

## 结构

```
src/
  kit/        共用绘图工具：画框与相机、纸张质感、文字、烘焙层、全部上屏文案
  beat/       时间轴：BPM、小节、版块边界、踏频
  rig/        骨骼木偶：鹈鹕 + 自行车（只算关键点，不画）
  scenes/     23 个版块：intro / 20 格 / outro
  main.js     场景调度、穿过画框的转场、p5 生命周期
public/
  index.html  预览页 + 播放条
  vendor/     p5.js、p5.brush（原样分发）
  fonts/      OFL 字体（中文字体按本片用字做了子集化）
tools/        抽帧 / 接触表 / 编码 / 字体子集 / 浏览器驱动
briefs/       版块实现规范（STYLE.md）
docs/         计划书、截图、接触表
```

### 为什么这么分层

**主画布是 WEBGL 的**——因为 p5.brush 要求。但每帧只做一件事：把一张 2D 图 `image` 上去。
所有内容其实都画在一个 2D `p5.Graphics` 上。实测 WEBGL 只当"显示器"是 1.1 ms/帧，
而在 WEBGL 上直接堆图元要慢一个量级。

**静态层必须烘焙。** p5.brush 没有增量重绘：一整屏约 200 笔的完整重绘是 140 ms/帧，
烘焙一次之后每帧 `drawImage` 是 1.1 ms/帧 —— 9.6 倍。这不是优化，是能不能跑完的区别：
整片 8280 帧，前者 19 分钟变 2 小时。

**每帧是 `t` 的纯函数。** `window.renderAt(t)` 可以被任意顺序、任意次数调用
（配合固定种子的 mulberry32，不用 `Math.random`）。所以逐帧导出可以多 worker 并行、可以续跑。

**转场在强拍上硬切，不交叉淡化。** 早期版本让 A、B 两格同时交叉淡化 0.6 秒，
上一格的铅笔素描会透到下一格，像重影；缩到 0.08 秒后重影没了，但黑底的汉画像石与
纸白的唐白描各混 50%，得到的是**一整帧平灰**，读作"闪了一下故障"。
现在画面直接切，空间感全部交给"画框掠过"（框线飞出／飞入 + 4.5% 的推镜），
缩放是连续的，所以硬切不跳。

**`tools/spike.mjs` 是这套架构的出处。** 它对比了"每帧重画一整屏笔触"与"烘焙一次 + 每帧贴图"，
结果直接决定了上面那条烘焙铁律。数据见 `docs/DECISIONS_v1.1.md`。

---

## 当前进度

**阶段 1（骨架）已完成，20 个版块目前是占位色块。**

| | 状态 |
|---|---|
| 共用绘图工具、节拍、骨骼木偶（鹈鹕 + 自行车） | ✅ |
| 片头（纸张 + 素描图版 + 两句字幕）、片尾（21 格展墙 + 空席位） | ✅ 结构完整 |
| 连续马路、相机、穿过画框的转场 | ✅ |
| 20 个版块的色调 / 编号 / 标题卡 / 骑手走位 | ✅ 占位 |
| 20 个版块的真实画风 | ⬜ 阶段 2–3 |
| 音乐（实时 + 离线） | ⬜ 阶段 4 |
| 示波器那格的"影子通电"转场 | ⬜ 阶段 3 |

决策记录见 `docs/DECISIONS_v1.1.md`，版块实现规范见 `briefs/STYLE.md`。

---

## 版权

- 代码 MIT（见 `LICENSE`）。
- 第三方组件与字体见 `THIRD_PARTY_NOTICES.md`。
- 片中致敬的 20 件作品**全部处于公有领域**，逐条依据见 `THIRD_PARTY_NOTICES.md` 第 5 节。
- 未使用任何受保护的角色形象、真实品牌 logo、真实游戏素材、唱片封面或影视画面。
- 片中所有界面（聊天、短视频、游戏）均为虚构命名、自绘 UI。
- 音乐全部实时合成，无采样素材。

---

作者：[@strangeyu911-tech](https://github.com/strangeyu911-tech) · Strange Leo &lt;strangeyu911@gmail.com&gt;
