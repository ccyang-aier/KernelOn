# Liquid Glass 集成经验

## 关键判断

- 质感依赖真实背后像素采样。优先用真实 DOM 图片或真实页面内容做背景，不要只依赖 CSS `background-image`。
- 不要给玻璃组件外层随意加 `overflow-hidden`、`filter`、`opacity`、`transform`、`isolation` 或带 `z-index` 的包裹层。
- 不要用 0 尺寸 wrapper 承载组件。组件内部已有 `translate(-50%, -50%)` 定位逻辑。
- 层级问题优先靠 DOM 顺序解决。带 `z-index` 的父级 stacking context 可能隔断 `backdrop-filter` 采样。
- 圆角裁剪应约束真正输出折射的内部层，而不是在外层包裁剪容器。
- 多个玻璃面板同时存在时，确认旧面板已移除。不要直接用 `AnimatePresence` 包非 motion 的玻璃组件。

## 调试顺序

- 先复现已知正常 demo 的 DOM 结构，再改组件内部。
- 每次只引入一个变量：图标、hover、pressed、button 语义、子菜单、动效、层级。
- 视觉异常时先查父级渲染上下文，再查组件参数。
- 质感丢失优先排查采样上下文；动效异常优先排查传入玻璃根节点的 style。

## KernelOn 约定

- `LiquidGlassSvgFilter` 的外层 `style` 只传定位所需字段，例如 `position`、`left`、`top`。
- 桌面右键菜单不使用全屏 `z-index` wrapper；保持与壁纸、桌面内容处于可采样的同一页面上下文。
- 子菜单切换保留高亮胶囊 motion 动效，暂不恢复玻璃面板进出场动画。
