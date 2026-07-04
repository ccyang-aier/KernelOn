# LiquidGlassSvgFilter Issues And Fix Notes

本文记录 KernelOn 当前实际引入版本：

- `packages/ui/src/components/liquid-glass-svg-filter`
- 当前主要调用点：`packages/shell/src/components/desktop-context-menu.tsx`

不要把本文直接套用到 `open_source/liquid-glass-react`。KernelOn 使用的是迁移到 `packages/ui` 的 `LiquidGlassSvgFilter` 版本，后续修复和验收都应以这个目录为准。

## 1. 修复是否会影响 Liquid Glass 质感

总体结论：这些问题的修复大多数不会降低液态玻璃质感，反而会提高它在 KernelOn 中的产品级质量。它们主要解决的是工程边界、布局协议、性能、浏览器降级、可访问性和可测试性，不是要削弱折射、模糊、色散或高光。

不过，部分修复如果做得粗，会影响视觉表现，需要截图回归：

- SSR/client-only 防护：不改变视觉质量，只是避免组件被错误用于 Server Component。
- 单根容器封装：可能影响 `backdrop-filter` 采样和 stacking context。修复时不要随手加 `overflow-hidden`、`filter`、`opacity`、`isolation` 或无意义 `z-index`。
- 限制 `style` 输入：不降低质量，能减少误用。需要保留当前右键菜单的 `position/left/top` 定位行为。
- 鼠标更新节流：合理使用 `requestAnimationFrame` 不会降低流畅度，反而减少重渲染。节流过粗会让边缘高光和弹性反馈变迟钝。
- `ResizeObserver`：只会让尺寸和滤镜层更准确，属于正向修复。
- 浏览器降级：Firefox/Safari 上可能主动降低折射效果，但这是可预测降级，不是主体验质量倒退。
- 可访问性封装：对视觉质量无负面影响，但 focus ring、键盘态需要按 KernelOn 视觉语言设计。
- 参数 clamp：会减少极端炫技参数空间，但能避免无效 SVG/CSS、过度模糊和性能异常。
- `mode="shader"` 保护：不影响当前右键菜单，因为当前使用 `mode="standard"`。
- 增加测试：不影响运行时质量，但能避免后续改动悄悄破坏菜单位置、圆角、filter 或交互结构。

因此，后续修复方向不是“降低 liquid glass 质量”，而是把它从实验组件收敛成可控的 KernelOn 系统材质组件。

## 2. 当前使用边界

当前 `LiquidGlassSvgFilter` 主要用于桌面右键菜单和二级菜单。调用点已做了几个重要规避：

- `desktop-context-menu.tsx` 是 Client Component。
- 使用 `style={{ position: 'absolute', left, top }}`，没有传复杂视觉样式。
- `elasticity={0}`，避免菜单本体出现鼠标拉伸。
- `mode="standard"`，没有启用 CPU 生成 displacement map 的 `shader` 模式。
- 交互语义由内部真实 `button` 提供，而不是把玻璃根节点当按钮。

这些约束应保留，除非先把组件重构成更稳定的公共 primitive。

## 3. 问题清单

### 3.1 Client-only 边界不显式

状态：pass（2026-07-04，视觉验收通过，code review 通过）

现状：

- `GlassContainer` render 阶段直接读取 `navigator.userAgent`。
- 组件内部使用多个 React hooks。
- 当前调用点是 `'use client'`，所以右键菜单场景暂时安全。

影响：

- 如果未来从 Server Component 直接 import 或渲染，可能出现 `navigator is not defined` 或 Next.js client/server 边界错误。
- 组件使用约束不清晰，后续 agent 容易误用。

建议：

- 在组件入口增加明确 client-only 约定，例如文件顶部 `'use client'`。
- 对 `navigator` 使用 `typeof navigator !== 'undefined'` 防护。
- 在 README 和本文保留“只能用于客户端交互层”的说明。

质量影响：

- 不影响玻璃视觉，是安全性和边界修复。

### 3.2 Fragment 多 sibling 图层不适合作为普通容器

状态：pass（2026-07-04，视觉验收通过，code review 通过）

现状：

- `LiquidGlassSvgFilter` 返回 Fragment。
- Fragment 内包含 overLight 遮罩层、主玻璃容器、边框高光层和 hover 层等多个 sibling。
- 这些层依赖同一套 `position/top/left/transform/width/height` 对齐。

影响：

- 如果放进普通文档流，多个 sibling 都可能参与布局，造成占位、错位或点击区域异常。
- 如果外部 wrapper 加了不合适的 stacking context，可能破坏 `backdrop-filter` 背景采样。
- 该组件更像“绝对定位的玻璃面板效果包”，不是普通 `Surface`。

建议：

- 短期：继续把 `style` 限定为定位字段，并只用于浮层/菜单。
- 中期：提供一个稳定单根 host，但必须避免破坏 backdrop 采样。
- 不要在修复时盲目给 host 加 `overflow-hidden`、`opacity`、`filter` 或 `isolation`。

质量影响：

- 单根封装做对了会提升稳定性。
- 做错了会直接让玻璃失去真实背景采样或边缘折射。

### 3.3 `style` API 过宽

状态：pass（2026-07-04，视觉验收通过，code review 通过）

现状：

- 外部 `style` 被展开到 `baseStyle`，但内部会覆盖 `transform` 和 `transition`。
- 同一个 `style` 又间接参与 overlay 层定位。

影响：

- 调用者传 `transform` 会被覆盖，产生误解。
- 调用者传 `opacity`、`filter`、`isolation`、`overflow`、`zIndex` 等属性，可能破坏材质或层级。
- 当前集成经验已约定 `style` 只传定位字段，但类型层没有表达这个约束。

建议：

- 引入更窄的定位 prop，例如 `positionStyle` 或 `placement`。
- 或在类型上只允许 `position/left/top/right/bottom` 等字段。
- 保留当前右键菜单定位行为。

质量影响：

- 不降低视觉质量，能减少误用导致的质感丢失。

### 3.4 鼠标移动触发高频 React state 更新

状态：pass（2026-07-04，视觉验收通过，code review 通过）

现状：

- 内部 `mousemove` 每次调用都会 set 两组 state：`internalMouseOffset` 和 `internalGlobalMousePos`。
- 主菜单和子菜单可同时监听同一个 `mouseContainer`。

影响：

- 当前只有 1-2 个菜单实例，风险可控。
- 如果以后用于 Dock、多窗口、工具条或多个面板，鼠标移动会触发多个实例高频重渲染。
- 在低端设备上可能表现为高光卡顿、菜单响应迟滞或掉帧。

建议：

- 用 `requestAnimationFrame` 合并鼠标更新。
- 或把鼠标坐标写入 CSS variables / Motion values，减少 React render。
- 对无弹性场景，例如当前菜单 `elasticity={0}`，评估是否仍需要完整 mouse tracking。

质量影响：

- rAF 合并通常提升质量。
- 过度节流会让高光方向反馈变慢，需要视觉验证。

### 3.5 尺寸更新只监听 window resize

状态：pass（2026-07-04，视觉验收通过，code review 通过）

现状：

- `glassSize` 初始为 `{ width: 270, height: 69 }`。
- mount 和 `window.resize` 时通过 `getBoundingClientRect()` 更新。
- 没有监听 children 内容变化。

影响：

- 菜单内容、字体、语言、异步数据或响应式宽度变化后，滤镜层和边框层可能仍用旧尺寸。
- 可能出现边缘高光、SVG filter、hover overlay 与真实容器尺寸不一致。
- 当前右键菜单内容固定，所以暂时较稳定。

建议：

- 使用 `ResizeObserver` 监听主玻璃元素。
- 初始尺寸可继续作为 fallback，但应尽快被真实尺寸替换。

质量影响：

- 正向提升，让玻璃层和内容尺寸更一致。

### 3.6 浏览器降级策略粗糙

状态：pass（2026-07-04，视觉验收通过，code review 通过）

现状：

- Firefox 通过 UA 判断关闭 SVG filter。
- `backdropFilter` 未统一设置 `WebkitBackdropFilter`。
- Safari/Firefox 的 SVG filter、mask、backdrop-filter 差异没有明确 fallback 级别。

影响：

- Firefox 下边缘折射可能消失，只剩磨砂或普通半透明效果。
- Safari 下可能出现滤镜、裁剪或背景采样不一致。
- 自动化单元测试无法覆盖真实浏览器渲染差异。

建议：

- 建立显式能力检测或分级 class：full / reduced / flat。
- 为 Safari/Firefox 明确降级目标，不追求完全一致。
- 用 Playwright 做至少 Chromium + WebKit 的截图回归。

质量影响：

- 主流 Chromium 体验不应下降。
- 非 Chromium 上主动降级会降低特效强度，但提升稳定性和可读性。

### 3.7 可点击语义不完整

现状：

- 组件接受 `onClick`，但根节点是 `div`。
- 没有内置 `role="button"`、`tabIndex`、键盘事件、disabled、focus ring。
- 当前右键菜单内部使用真实 `button`，没有把玻璃根节点当交互控件。

影响：

- 如果未来直接把 `LiquidGlassSvgFilter` 当按钮，会产生键盘不可达、读屏语义缺失、焦点不可见等问题。
- 也可能让外层点击区域和内部语义按钮冲突。

建议：

- 不把该组件作为按钮 primitive。
- 单独封装 `GlassButton` 时应基于真实 `<button>` 或可访问 primitive。
- `LiquidGlassSvgFilter` 只作为视觉 surface。

质量影响：

- 不影响视觉质量，会提升产品可用性。

### 3.8 参数缺少边界校验

现状：

- `aberrationIntensity` 会影响 SVG stop offset、`feFuncA tableValues` 和 blur。
- `blurAmount` 会进入 CSS blur 计算。
- `displacementScale` 会进入 `feDisplacementMap` scale。

影响：

- 极端值可能产生无效 SVG/CSS。
- 过高 blur 或 displacement 会造成视觉失真、彩边过强、性能下降。
- 动态参数来自外部时风险更高。

建议：

- 对公开参数 clamp。
- 把 KernelOn 推荐值收敛为少量 tone/preset。
- 不让业务模块自由传任意强度，除非是实验页。

质量影响：

- 会限制极端效果，但提升产品一致性和稳定性。

### 3.9 `mode="shader"` 主线程成本高

现状：

- `mode="shader"` 会使用 Canvas 2D 逐像素生成 displacement map data URL。
- 当前右键菜单使用 `mode="standard"`，没有触发。

影响：

- 大尺寸面板或频繁尺寸变化时会阻塞主线程。
- 会产生 data URL 内存开销。
- 不适合高频交互和生产热路径。

建议：

- 生产默认禁止或隐藏 `shader` 模式。
- 如需保留，增加尺寸上限、缓存和异步/延迟生成策略。

质量影响：

- 对当前菜单无影响。
- 禁用生产 `shader` 模式会减少实验能力，但提升稳定性。

### 3.10 测试覆盖不足

现状：

- `packages/ui/tests/liquid-glass-svg-filter.test.ts` 只验证导出。
- Shell 测试覆盖右键菜单 DOM、角色、样式片段和交互状态。
- 没有真实浏览器视觉回归、SSR 边界测试、ResizeObserver 测试或性能测试。

影响：

- SVG filter、backdrop-filter、Safari/WebKit、Firefox 降级问题不会被当前测试发现。
- 后续重构容易破坏视觉但仍通过单元测试。

建议：

- 增加组件级 render 测试，覆盖 filter、clip-path、默认 blur、style contract。
- 增加 Shell 菜单截图回归。
- 对 client-only 边界和参数 clamp 增加测试。

质量影响：

- 不影响运行时质感，但能防止质量倒退。

## 4. 修复优先级

建议优先级：

1. 明确 client-only 边界和 `navigator` 防护。
2. 收窄 `style` API 或文档化定位协议。
3. 加 `ResizeObserver`，确保尺寸层对齐。
4. 对鼠标更新做 rAF 合并。
5. 增加参数 clamp。
6. 建立浏览器降级策略。
7. 增加测试和截图回归。
8. 再考虑单根 host 重构；这个风险最高，需要视觉验证。

## 5. 验收建议

每次修复后至少检查：

- 桌面右键菜单主面板位置不变。
- 二级菜单位置不变。
- `.glass__warp` 仍有 `filter: url(...)` 和 `backdrop-filter`。
- 圆角裁剪仍贴合主面板。
- 菜单 hover 胶囊动画仍正常。
- ESC 和外部点击关闭仍正常。
- Chromium 视觉无明显回退。
- 如果改动涉及 backdrop 或 host 结构，补 WebKit 截图回归。
