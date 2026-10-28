/* layer.js — 烘焙与图层缓存。
 *
 * 为什么必须烘焙：p5.brush 没有增量重绘，每帧从零重画一个场景约 140ms。
 * 把静态层烘成纹理后，每帧只剩 blit（约 1ms），差 9.6 倍。
 *
 * 两种烘焙目标：
 *   bakeInk()  用 WEBGL graphics —— 需要 p5.brush 画的场合（水墨、笔触）
 *   bake2d()   用 2D graphics   —— 纯 Canvas2D 场合，更快也更省显存
 *
 * LRU 上限 8 张：1920×1080 RGBA 每张 8.3MB，同时活着太多会挤爆显存和 WebGL 上下文数。
 */
(function () {
  const V = (window.V = window.V || {});
  const L = (V.layer = {});

  const store = new Map();   // key -> { g, used, webgl }
  // 全片 23 张（21 段 + intro + outro），全部常驻也就 23×8.3MB ≈ 190MB。
  // 早先设 8 会在淘汰时 remove() 掉 canvas，导致后续 drawImage 读到被复用的画布内容（串帧）。
  const MAX = 40;
  let hits = 0, misses = 0;

  function evictIfNeeded() {
    if (store.size <= MAX) return;
    // 找最久没用的淘汰
    let oldestKey = null, oldest = Infinity;
    for (const [k, v] of store) if (v.used < oldest) { oldest = v.used; oldestKey = k; }
    if (oldestKey) {
      const e = store.get(oldestKey);
      try { e.g.remove(); } catch (_) {}
      store.delete(oldestKey);
    }
  }

  /**
   * 通用烘焙。
   * @param {string} key  唯一键（场景 id + 层号）
   * @param {function} fn (graphics) => void  只会在首次调用时执行
   * @param {object} o { webgl: bool, w, h }
   * @returns {p5.Graphics}
   */
  L.bake = function (key, fn, o) {
    const opt = o || {};
    const hit = store.get(key);
    if (hit) { hit.used = ++L.clock; hits++; return hit.g; }
    misses++;

    const w = opt.w || V.W, h = opt.h || V.H;
    const g = opt.webgl ? createGraphics(w, h, WEBGL) : createGraphics(w, h);
    g.pixelDensity(1);
    if (opt.webgl) {
      // brush 需要知道往哪个目标画
      brush.load(g);
      try { fn(g); } finally {
        // 强制把队列里的笔刷合成出来
        try {
          brush.set('ink', '#000000', 0.01);
          brush.line(-9000, -9000, -8999, -9000);
        } catch (_) {}
        brush.load();
      }
    } else {
      fn(g);
    }
    store.set(key, { g, used: ++L.clock, webgl: !!opt.webgl });
    evictIfNeeded();
    return g;
  };
  L.clock = 1;

  /** 水墨类烘焙（WEBGL + p5.brush） */
  L.bakeInk = function (key, fn, o) {
    return L.bake(key, fn, Object.assign({ webgl: true }, o));
  };

  /** 2D 烘焙 */
  L.bake2d = function (key, fn, o) {
    return L.bake(key, fn, Object.assign({ webgl: false }, o));
  };

  L.has = function (key) { return store.has(key); };

  L.clear = function () {
    for (const [, e] of store) { try { e.g.remove(); } catch (_) {} }
    store.clear();
    hits = misses = 0;
  };

  /** 清掉某个前缀的所有烘焙（切换场景组时用） */
  L.clearPrefix = function (prefix) {
    for (const [k, e] of [...store]) {
      if (k.startsWith(prefix)) { try { e.g.remove(); } catch (_) {} store.delete(k); }
    }
  };

  L.stats = function () {
    return { size: store.size, max: MAX, hits, misses, keys: [...store.keys()] };
  };

  // ---------- 转场用的全屏快照 ----------
  // 两个场景要同时"活着"才能做交叉合成，所以各留一张 2D 缓冲
  let snapA = null, snapB = null;

  L.snap = function (which) {
    const g = which === 'b' ? snapB : snapA;
    return g;
  };

  L.initSnaps = function () {
    if (!snapA) { snapA = createGraphics(V.W, V.H); snapA.pixelDensity(1); }
    if (!snapB) { snapB = createGraphics(V.W, V.H); snapB.pixelDensity(1); }
  };

  /**
   * 把任意源 canvas 的内容复制进转场快照。
   * 用 drawImage 而不是 p5 的 get()，因为 WEBGL 下 get() 每次都会泄漏一张纹理。
   */
  L.captureFrom = function (which, srcCanvas) {
    L.initSnaps();
    const target = which === 'b' ? snapB : snapA;
    const ctx = target.drawingContext;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, V.W, V.H);
    ctx.drawImage(srcCanvas, 0, 0, V.W, V.H);
    return target;
  };
})();
