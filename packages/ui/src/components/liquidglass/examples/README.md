# Wallpaper Hero LiquidGlass 经典示例

`WallpaperHeroLiquidGlassExample.tsx` 是从 KernelOn Wallpaper Home Hero 双按钮多轮实验中提炼的完整参考实现。它保留真实液态折射方案的关键工程约束，即使 Wallpaper 产品页已经回退为 CSS 磨砂玻璃，也不要删除或简化此示例。

## 示例覆盖的能力

- `190 × 42` 主操作与 `80 × 42` 轻操作共用 Frosted preset。
- 原生 `button` 保留 `onClick`、`aria-pressed`、键盘激活和焦点行为。
- 背景 canvas、WebGL surface、交互 DOM 三层分离。
- 按真实 `object-fit: cover` 投影和按钮的屏幕坐标截取局部背景，不把整张 Hero 图片缩进按钮。
- staging canvas 完整且不透明后才以 `copy` 一次提交；新帧未完成时旧帧继续显示。
- canvas 像素提交后显式调用 `instance.markChanged(canvas)`。
- 轮播 transition 只在 620ms 跟随窗口内使用 RAF；静止后停止，不使用永久 `data-dynamic`。
- resize、scroll、图片 load 都会重新计算几何位置。
- ready 检查只检测输出 canvas 中央 50% 核心区，并要求连续两帧通过；shadow padding 不再误伤小按钮。
- 唯一的 1px 结构边框由 root `::after` 持有；等待态不再自带 inset ring，避免 ready 切换前后叠成双边框。
- 初始化失败时保留轻量 CSS fallback，原生按钮与事件仍然可用，不能让 WebGL 失败变成空白花瓶。
- 每个实例在卸载时销毁 WebGL、RAF、ResizeObserver 和事件监听。

## DOM 契约

顺序不能随意改变：

1. 第一个直接子元素是不可见的局部背景 `<canvas>`，供 LiquidGlass 捕获。
2. 第二个子元素是带 `data-config` 的 glass surface。
3. 最上层是 `data-liquid-glass-skip-capture` 的原生 `<button>`。

视觉层必须 `pointer-events: none`。图标和文字不能绘进 WebGL canvas，否则清晰度、ARIA 与交互都会退化。

## 已验证的 Frosted 参数

```ts
{
  blurAmount: 0.25,
  refraction: 0.69,
  chromAberration: 0.05,
  edgeHighlight: 0.05,
  specular: 0,
  fresnel: 1,
  cornerRadius: 21,
  zRadius: 21,
  opacity: 1,
  saturation: 0,
  brightness: 0,
  shadowOpacity: 0.1,
  shadowSpread: 5,
  shadowOffsetY: 1,
  button: true,
  bevelMode: 0
}
```

`blurAmount: 0.25` 来自官方 Frosted Panel 基线；`0.5` 在 42px 控件上容易变成厚重磨砂。阴影从官方强化值收敛到 `0.1 / 5`，防止高亮背景出现明显黑色胶囊。

## 关键踩坑

### 折射背景位置错误

只传图片 URL 不代表取样正确。必须用图片 DOM rect、natural size 与 `cover` 投影计算 source rect，再映射到按钮的 viewport rect。否则按钮会折射整张 Hero，而不是自己所在的小块背景。

### 切换时白边或白屏

不要先清空展示 canvas 再异步绘制新图。所有绘制先进入 staging canvas，只有 alpha 全部达到阈值才替换当前帧。背景 URL 已变化不等于像素已可用。

### canvas 更新但玻璃不更新

Canvas 像素变化不会产生 DOM mutation。每次成功提交后必须调用 `markChanged(canvas)`，但不要为了省事添加永久 `data-dynamic`。

### 首次 ready 误判

LiquidGlass 输出 canvas 包含 shadow padding。用整张 canvas 的有效像素占比判断会把圆形或短按钮永久判为 fallback。应检测中央核心区，并至少连续两帧稳定。

### 滚动和轮播不同步

仅监听 React props 或图片 URL 不够。局部取样依赖 viewport 坐标，因此需要监听 scroll、resize、图片 load 与轮播 transition。transition 使用有限时间 RAF，结束后立即停机。

### 多实例性能

一个 `LiquidGlass` 实例对应一个 WebGL context。少量 Hero 按钮可以接受；大量控件应优先由同一 root/实例管理多个 glassElements，或改用 CSS 磨砂玻璃。不要在列表中无上限创建实例。

### 页面级背景切换

Home 图片、Explore 渐变、Settings 伪元素不是同一种背景源。若玻璃跨页面常驻，必须把 `activeView` 作为背景 revision，并为每类背景建立明确合成模型；仅查询 `.hero img` 会在 Hero 卸载后保留旧帧。

## 采用前的验收门禁

- 首次打开没有白面、空 canvas 或残缺月牙。
- 暗建筑、亮天空、纯色、云层和高频网格上均能看见真实折射。
- 快速轮播、反向切换与连续点击无白边闪烁。
- 页面滚动时局部背景位置同步。
- hover、active、Tab、Enter、Space 和点击事件完整。
- 静止后无永久 RAF、无持续 html-to-image、无控制台错误。
- 卸载后 WebGL context、Observer 和事件监听均释放。

此目录是教学与回归参考，不从 `liquidglass/index.ts` 导出，也不应被 Wallpaper 生产代码反向依赖。
