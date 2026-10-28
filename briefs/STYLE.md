# 版块实现规范（STYLE.md）

> 这是给「20 个版块」写代码的人（或 agent）看的唯一契约。
> 读完之后你只需要看 `src/scenes/sahara.js` 一个真实实现，就能动手。
> **不符合本文件硬性条款的版块会被退回重写。**

---

## 0. 一句话

每格 = 一个 `scene` 对象，暴露 `draw(ctx, t, u, meta)`，必须在 **1920×1080 的 Canvas2D**
上画出这一格在时刻 `t` 的画面。它是 `t` 的**纯函数**：同样的 `t` 调一万次，像素一样。

---

## 1. 坐标系

| 量 | 值 | 说明 |
|---|---|---|
| 单位空间 | `0..1000` 双方 | 在 `V.enterCam(ctx, cam)` 之后作画，1 单位 ≈ 1.08 px |
| 路面基准 | `V.ROAD_Y = 838` | 后轮着地点所在水平线，**所有版块必须一致** |
| 骑手锚点 | `V.RIDER_X = 360` | 后轮着地点的 x，**所有版块必须一致** |
| 画心 | `V.STAGE = 1000` | 1000×1000 的方形画心，就是"画框"里面 |

> 全片是"一条连续的马路"。**路面高度和骑手横向位置一旦有版块不一样，穿画框时人就会跳。**
> 这两条是硬约束，不要为了构图好看去改；要改构图就改相机（`meta.cam` 或自己的 `V.enterCam`）。

---

## 2. 三小节结构

每格 3 小节（2 秒 / 小节，`V.TL.bar = 2.0`），少数是 2 或 4 小节。
`u = t - meta.t0` 是版块内时间。

| 小节 | u 范围 | 任务 |
|---|---|---|
| ① | `0 .. bar` | **进场**：这一格的世界立起来，鹈鹕骑进来 |
| ② | `bar .. 2bar` | **梗**：这一格唯一的那个笑话，可以慢放/定格 |
| ③ | `2bar .. dur` | **离场**：朝下一个画框骑过去，画面开始收 |

**一格里只准有一个梗。** 两个梗 = 两个都不成立。
梗必须来自"这一门艺术语言的规矩"和"骑自行车"之间的冲突，不是来自画得潦草。
例：埃及墓室壁画里鹈鹕必须站成标准侧面姿势 → 它一边蹬车一边努力保持侧面僵直。

---

## 3. 必须做的事

### 3.1 题名（主题词）

**每格一套样式、一个位置，不许统一。** 这是讲美术史的片子，题名本身也该是美术史的一部分：
岩画上的字是赭石抹上去的，拓片上的字是刻出来的，示波器上的字是荧光余辉，
8-bit 的字是像素点。换颜色是不够的，得换"写字的方式"和"写在哪里"。

八种样式在 `src/kit/titles.js`：`plate / vertical / plaque / painted / caption / mono / hud / pixel`。
每格用哪套、放在哪，写在同文件的 `K.PLAN` 里；**初始位置见 `briefs/TITLE_PLAN.md`**，
九宫格尽量铺开，相邻两格不要撞在同一处。

```js
V.titles.draw(ctx, 'vertical', meta.strings, u, V.titles.opts('bada', { dur: meta.dur }));
```

`meta.strings` 来自 `src/kit/strings.js`（中文名 / 英文名 / 年代），**不要自己写死文字**。
所有上屏文字都必须在 `strings.js` 里，那是唯一的字形子集来源 —— 漏一个字，那个字就会掉成方框。
同理**不要用 ASCII 以外的装饰符号**（♪ ★ 之类），等宽字体只子集了 ASCII。

墨色：`V.base.inkFor(底色)` 实算两种墨的对比度再决定，并要求深墨明显更好才换 ——
靠亮度阈值会判错，蒸汽波主色 `#c96fb0` 亮度 145 落在"深底"一侧，白字只有 3.3:1，糊在洋红里。

想加新样式：在 `ST` 里加一个函数 `(ctx, sc, o) => {…}`，`o.x/o.y/o.align` 为锚点，
alpha 由 `K.draw` 统一给。**不要引入新的汉字**（会破坏字形子集）。

### 3.2 路面：两个必踩的坑

```js
V.base.drawRoad(ctx, t, { color: V.shade(底色, 偏移), depth: 150, grain: 1 });
```

1. **`V.ROAD_Y` 是着地线，不是路面顶边。** 带子顶边默认在 `ROAD_Y - 150`，
   骑手落在地面里约 38% 处。以前顶边贴着 `ROAD_Y`（只剩 26 单位），
   远边线就成了地平线，骑手看起来在路肩上骑、路面像一条横线。
2. **偏移量必须有符号**：浅底压暗（`-0.22 ~ -0.30`），深底提亮（`+0.11`）。
   深底再压暗会夹到纯黑，渐变一加白就糊出一条贯穿全屏的灰带。

石子颜色由 `drawRoad` 从路面色自己推（`shade(±0.15)`），不要塞固定的米白/深褐 ——
在洋红路面上会变成一层灰扑扑的脏点。

画框要画在路面**之前**，让路面盖住画框底边；否则一条横线横穿路面，像路面漏出了画面。

### 3.3 静态层必须烘焙

```js
const baked = V.layer.bake2d('sahara:base', (g) => {
  const c = g.drawingContext;
  // 这里可以画几百笔，只跑一次
}, { w: V.W, h: V.H });

// 每帧
ctx.drawImage(baked.canvas, 0, 0);
```

**原因（实测，不是保守）：** 一整屏 ~200 笔的 p5.brush 重绘 = 140 ms/帧；
烘焙一次 + 每帧 `drawImage` = 1.1 ms/帧。差 9.6 倍。
整片 8280 帧，140 ms 就是 19 分钟变 2 小时。

烘焙 key 必须全局唯一，用 `'<版块id>:<用途>'`。同一个 key 只烤一次，之后命中缓存。

### 3.4 只用 `V.*` 里的工具

| 需要什么 | 用什么 |
|---|---|
| 纸/石/绢/宣纸底 | `V.paper.paint(c, w, h, preset, seed)`，preset 见 `paper.js` |
| 内阴影/暗角 | `V.paper.innerShadow(c, w, h, strength, inset)` |
| 上屏文字 | `V.text.draw / titleCard / titleCardAt / vertical / paragraph` |
| 相机 | `V.enterCam(ctx, cam)` / `V.exitCam(ctx)`（Canvas2D） |
| 相机（p5 栈） | `V.pushCam / V.popCam` |
| 骑手 | `V.base.drawRider(ctx, t, { mods, x, y, scale, flip, ... })` |
| 只要骨架 | `V.rig.pose(t, mods)` |
| 路面 | `V.base.drawRoad(ctx, t, { color, depth, speed, grain })` |
| 画框 | `V.base.drawFrame(ctx, { color, lw, inset, none })` |
| 按底色挑墨色 | `V.base.inkFor(底色)` → `{ pale, ink, inkSoft, inkLine }`；`V.base.tintLum / contrast / preferDarkInk` |
| 确定性随机 | `V.rng(seed)` → `.range / .int / .pick / .sign / .gauss` |
| 插值 | `V.clamp / lerp / map / smoothstep / pulse`，缓动 `V.ease.*` |
| 包络（淡入淡出） | `V.envelope(u, in0, in1, out0, out1)` |
| 节拍 | `V.TL.beatPos(t) / barPos(t) / accent(t) / boundaryNear(t)` |

**禁止** `Math.random()`、`Date.now()`、`performance.now()`、任何网络请求、任何 DOM 操作。
确定性一旦破坏，帧序列就不能并行渲染，也不能续跑。

### 3.5 遵循节拍

- `120 BPM`，1 拍 `0.5 s`，1 小节 `2.0 s`。
- **每一次穿画框都落在小节线上**（= 强拍）。这是全片节奏的地基，不要自己挪。
- 脚踏一圈 = 2 拍 = 1 秒（`V.TL.pedal(t)`，`rig.pose` 已内置）。
- `V.TL.accent(t)` 给出当前拍的重音强度（1 / 0.6 / 0.3），抖一下、闪一下都用它。
- 强拍上发生的事：字幕落位、闪光灯、8-bit 的 `1UP`、聊天窗口抖一下、皮影车轮卡一下。

### 3.6 骑手怎么演

```js
V.base.drawRider(ctx, t, {
  mods: { lean: 0.08, neckCurl: 0.4, headTilt: -0.05, bob: 1.3, stretch: 1.02 },
  scale: 1.42,   // 默认值；1.42 时整只鸟约占画面高 23%
});
```

尺度按版块调：宋山水压到 `0.55`（几乎看不见，靠推镜找），8-bit 顶到 `1.9`。

| mod | 含义 | 典型用法 |
|---|---|---|
| `bob` | 车身起伏倍率 | 石板路 1.6，水面 0.4 |
| `lean` | 前倾增量（弧度） | 冲刺 +0.15，装优雅 −0.06 |
| `neckCurl` | 脖子 S 形增量 | 紧张 0.6，放松 −0.3 |
| `headTilt` | 头部俯仰 | 看镜头/看观众 |
| `stretch` | 整体拉伸 | 4 帧动画/夸张帧 1.06 |

**风格要改的是"怎么画"，不是"骨架怎么动"。**
20 格的骨架必须连续 —— 这是"同一只鹈鹕"的物理基础。
形状可以差很多（14 号只有影子），但关键点必须来自同一个 `rig.pose(t)`。

### 3.7 拆件与风格化

- 线条风格：传 `pelicanStyle: { line, lw, body, beak, pouch, eyeStyle }`。
  `eyeStyle` 有 `default / roll / dot / hollow`。
- 只有剪影：`V.pelican.silhouette(ctx, p, color)`。
- 只要车架线：`V.bike.outline(ctx, p, color, lw)`（**它自己设 strokeStyle**）。
- 要完全重画：自己遍历 `p` 的关键点，别改 `rig.js` 的比例。

---

## 4. 性能预算

在 i5-8300H / UHD 630 上，单帧（1080p，包含烘焙命中）目标 **< 60 ms**。

- 每帧新画的图元控制在 **几百个** 以内。上千个就说明该烘焙。
- 每帧 `createLinearGradient / createRadialGradient` **不要超过 3 个**（实测每个 ~0.15ms，但会累积）。
- 每帧 `getImageData / putImageData` **禁止**。
- 每帧 `ctx.filter = 'blur(...)'` **禁止**（慢 10 倍以上），要模糊就烘焙时模糊一次。
- 需要"余辉""残影"这种累积效果：用固定长度的采样环（≤8 个历史采样），不要存整帧位图。

---

## 5. 版权红线

- 只致敬**公有领域**作品。20 个目标全部已核对（见 `docs/PLAN_v1.0.md` 6.2 节）。
- **不得出现**：真实唱片封面、电影画面、游戏角色、受保护的角色形象、真实品牌 logo / 图标 / 吉祥物 / 关卡 / 音效。
- 聊天窗口、短视频 App、游戏界面一律**虚构命名**，自己画 UI，不用任何真实图标。
- 不得复制参考仓库 `Tunai-0511/meme67-art-history` 的任何代码、文案、构图、具体笑点。
  架构层面的思路（烘焙、连续马路、纯函数渲染）是独立实现的。

---

## 6. 自查流程（提交前必须全部跑过）

```bash
# 1. 梗那一拍、进场、离场，各一张
node tools/shot.mjs --scene <id>

# 2. 整格 3 张放一起看节奏
node tools/sheet.mjs --times <t0>,<t0+bar>,<t0+2*bar> --out docs/shots/<id>_sheet.png

# 3. 和左右两格拼一起，确认穿画框时人和路面是接的
node tools/sheet.mjs --times <prev_t1-1>,<t0>,<t1+1> --out docs/shots/<id>_join.png

# 4. 全片接触表，确认色调在这一段里没有和邻居撞车
node tools/sheet.mjs --sections
```

**必须亲眼看过这四张图**，再声称完成。
`window.__lastError` 非空 = 没完成；控制台有 `frame error` = 没完成。

---

## 7. 常见错误（都踩过）

| 症状 | 原因 |
|---|---|
| 每帧几百 ms | 忘了烘焙，或者在 `draw` 里现算 `paper.paint` |
| 穿画框时人"跳"了一下 | 改了 `V.ROAD_Y` 或 `V.RIDER_X`，或者自己在 `drawRider` 外面又加了 translate |
| 文字变成方框 | 用了 `strings.js` 里没有的字（字形子集只包含那里出现过的字） |
| 图看着像"一张小画浮在纸上" | 底色没铺满整屏（over-scan），只铺了 0..1000 的画心 |
| 同一个 key 烤出两张不同的图 | 烘焙回调里读了 `t`；烘焙必须是常量 |
| 每次渲染结果不一样 | 用了 `Math.random()` |
| 帧序列拼起来有闪烁 | 每帧都重新 `paper.paint`，噪点场在跳；纸底必须烘焙 |
| 深底版块路面糊出一条灰带 | 给路面传了负偏移，深底被夹到纯黑，渐变加白就变成灰带。深底要 **提亮** |
| 骑手像在路肩上骑 | 路面顶边贴到了 `ROAD_Y`，带子只剩 26 单位。用 `depth: 150` |
| 路面上一层脏灰点 | 石子写死了米白/深褐。让 `drawRoad` 从路面色自己推 |
| 中间调版块标题看不清 | 用亮度阈值判墨色。改用 `V.base.inkFor()` |
| 标题卡被画框线穿过 | 题名在 `x: 1544`（画框右边缘之外），画框右边缘在屏幕 x≈1485 |
| 题名和其他 19 格一个样 | 没走 `V.titles.PLAN`，或者样式换了但位置没换 |
| 装饰符号变成方框 | `♪ ★ →` 这类符号不在等宽字体子集里，只用 ASCII |
