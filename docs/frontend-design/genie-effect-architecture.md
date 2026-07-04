# KernelOn Genie Effect 实现说明

## 1. 背景与目标

KernelOn 的产品形态是 Web OS 工作台，App 通过窗口在桌面上运行，并通过 Dock 完成打开、恢复和收纳。Genie Effect 的目标不是像素级复制 macOS，而是在 KernelOn 自己的 Shell 语言中提供一种稳定、克制、可复用的系统级窗口过渡效果：

- 打开 App 时，从 Dock 图标位置展开到目标窗口位置。
- 收纳 App 时，从当前窗口位置被吸入 Dock 图标。
- 业务 App 不需要感知动画细节，也不需要为动画编写适配代码。
- 动画失败、快照未准备好或用户开启减少动态效果时，Shell 可以安全回退到普通打开或最小化。

## 2. 架构边界

当前实现遵循项目的前端开发哲学：Shell 负责系统级交互，业务模块只负责窗口内容，目录与职责边界如下。

| 模块 | 位置 | 职责 |
| --- | --- | --- |
| Shell 编排层 | `packages/shell/src/KernelOnShell.tsx` | 监听 Dock 打开、窗口最小化，查找 Dock 目标，读取窗口状态，调度 Genie 播放与窗口状态切换 |
| 动画绘制层 | `packages/shell/src/components/genie-effect-layer.tsx` | 持有全屏 canvas，播放 open/minimize 动画，按 scanline 绘制快照 |
| 几何计算层 | `packages/shell/src/components/genie-effect-geometry.ts` | 纯 TypeScript 计算每条扫描线在某个进度下的位置、宽度和 Dock 目标点 |
| 快照预渲染层 | `packages/shell/src/components/genie-snapshot-stage.tsx` | 离屏渲染 Dock App 的窗口外壳和内容，并用 `html-to-image` 生成 canvas 快照 |
| 快照像素处理层 | `packages/shell/src/components/genie-snapshot-compositor.ts` | 扁平化半透明像素，避免 canvas scanline 拉伸时出现横纹、透明叠色和背景穿透 |
| 隐藏状态工具 | `packages/shell/src/components/genie-hidden-windows.ts` | 管理正在 Genie 过渡中的 live window 隐藏状态，避免 React/Motion 退出阶段回闪 |
| 窗口容器 | `packages/shell/src/components/app-window-container.tsx` | 提供统一窗口外壳、窗口 chrome、拖拽/缩放/fullscreen，暴露 `genieHidden` 与 `constrainToWorkspace` |

这套拆分让 Genie Effect 是 Shell 的系统能力，而不是某个业务 App 的局部特效。业务 App 只通过 `packages/catalog` 中的 manifest 和 `packages/modules` 中的 runtime loader 接入窗口内容。

## 3. 动画原理

Genie Effect 的核心思路是：不要直接变形真实 DOM，而是把窗口渲染成一张快照，再用 canvas 按行重绘这张快照。

真实 DOM 直接做复杂 mesh 变形会遇到很多问题：CSS layout 会重排，子元素、滚动容器、backdrop blur 和透明背景会被浏览器合成层影响，复杂业务内容也难以保持一致。因此当前实现把窗口动画分成两个阶段：

1. Shell 获得窗口或默认窗口的目标矩形。
2. `GenieSnapshotStage` 离屏渲染同一套 `AppWindowContainer` 和业务窗口内容。
3. `html-to-image` 把离屏窗口转换成 `HTMLCanvasElement` 快照。
4. `GenieEffectLayer` 在真正打开或收纳时使用该快照绘制全屏 canvas 动画。
5. 动画完成前后，Shell 再切换真实窗口状态。

### 3.1 Scanline 变形

`createGenieScanlineFrame` 会把窗口快照拆成很多水平扫描线。每一行都有自己的：

- `sourceY`: 该行在原始快照里的纵向位置。
- `sourceHeight`: 从快照中取多少高度。
- `left` 和 `right`: 该行在当前动画帧里的左右边界。
- `y`: 该行在当前动画帧里的垂直位置。

最小化时，底部扫描线更早向 Dock 收束，顶部扫描线更晚开始移动，形成类似丝绸被吸入的形态。打开时方向相反，从 Dock 中心展开回目标窗口矩形。

当前几何中主要使用两个 stagger：

- `X_STAGGER`: 控制不同高度的扫描线横向收束时间差。
- `Y_STAGGER`: 控制不同高度的扫描线纵向移动时间差。

每一帧中，`GenieEffectLayer` 遍历 scanline rows，并用 `context.drawImage` 从快照取对应行，画到当前变形位置。

### 3.2 Dock 目标点

Dock 图标不是作为一个矩形目标参与收束，而是使用图标中心点：

```ts
resolveGenieDockPoint(dockRect) => {
  x: dockRect.x + dockRect.width / 2,
  y: dockRect.y + dockRect.height / 2,
}
```

这样收纳和打开都围绕 Dock icon 中心，视觉上更像窗口被图标吸入，而不是被压进一个固定小矩形。

### 3.3 快照扁平化

窗口外壳里有半透明背景、玻璃感和 backdrop blur。把这些内容直接按 1px scanline 拉伸时，透明像素会和真实桌面背景重复合成，容易出现横条纹和发灰。

`flattenGenieSnapshotCanvas` 会读取快照像素，对中间透明度的像素做一次 matte 合成，把半透明内部区域转成更稳定的像素。这可以降低 scanline 拉伸时的条纹感，并让动画中的窗口表面更清晰。

### 3.4 首帧接管

最小化时必须避免真实窗口和 canvas 快照同时可见。当前顺序是：

1. 找到 live window DOM。
2. 将 live window 立即设为隐藏状态。
3. 显示全屏 Genie canvas。
4. 绘制 Genie 第 0 帧。
5. 通知 React 状态层将该 window 标记为 `genieHidden`。
6. 动画完成前，调用 `minimizeWindow` 从 Shell 状态中移除可见窗口。

其中 `genieHidden` 的 opacity 过渡为 0ms，避免 Motion/AnimatePresence 在退出阶段把窗口补出一帧。

### 3.5 快照原点

离屏快照窗口必须从自身捕获容器的 `0,0` 开始绘制，不能套用桌面安全区约束。真实桌面窗口需要被限制在状态栏和 Dock 安全区内，但快照本身只是画布素材。如果快照内部带有 `left: 12px` 或 `top: 46px` 这类桌面偏移，Genie 接管时就会看起来先下移一截。

因此 `AppWindowContainer` 提供 `constrainToWorkspace`：

- 真实窗口默认 `constrainToWorkspace = true`。
- `GenieSnapshotStage` 使用 `constrainToWorkspace={false}`。

这保证快照内容与真实窗口矩形对齐，动画首帧不会发生额外位移。

## 4. 打开与收纳流程

### 4.1 从 Dock 打开 App

1. 用户点击 Dock icon。
2. Shell 根据 `appId` 查找已有窗口和 App manifest。
3. 如果已有窗口是 minimized，或尚未打开，则尝试读取该 app 的预生成快照。
4. `GenieEffectLayer.play({ direction: 'open' })` 从 Dock 点展开到目标窗口矩形。
5. 动画结束前，Shell 调用 `openApp(appId)`，真实窗口进入桌面。
6. canvas 清空并隐藏。

如果没有快照、Dock DOM 不存在或用户开启减少动态效果，Shell 直接调用 `openApp`，不阻断功能。

### 4.2 收纳到 Dock

1. 用户点击窗口黄灯按钮。
2. Shell 根据 window id 找到窗口描述、live DOM、Dock icon DOM 和 app 快照。
3. 如果依赖齐全，调用 `GenieEffectLayer.play({ direction: 'minimize' })`。
4. 播放前隐藏 live window，并在 React 层记录 `genieHiddenWindowIds`。
5. canvas 用快照播放收纳动画。
6. 动画结束前调用 `minimizeWindow(windowId)`。
7. canvas 清空并隐藏。

如果无法播放 Genie，Shell 直接最小化，并清理隐藏状态。

## 5. 普适性与 App 接入

Genie Effect 是 Shell 级能力，对后续 App 默认普适。新增业务 App 通常不需要写任何 Genie 适配代码，只需要满足 KernelOn App 化约定：

- 在 `packages/catalog` 提供稳定的 app manifest。
- 提供 `defaultWindow.bounds`，让 Shell 知道默认打开位置和尺寸。
- 提供稳定 `runtime.window.loaderKey`。
- 在 `packages/modules` 注册对应窗口实现。
- 窗口内容渲染在 Shell 提供的 `AppWindowContainer` 内部，不自行再实现一套系统窗口 chrome。

不同 App 的界面内容不同，一般不会破坏 Genie。因为 Genie 操作的是最终窗口快照，而不是依赖 App 内部结构。表格、表单、图表、空白内容、复杂布局都可以被作为 canvas 快照参与变形。

需要注意的例外情况：

- 视频、WebGL、跨域图片、iframe 等内容可能无法被 `html-to-image` 完整捕获。
- 运行中高频变化内容在快照预渲染和真实窗口之间可能有细微状态差。
- 大尺寸或特别复杂的窗口会增加快照生成成本。
- 业务 App 如果自行实现固定定位、portal、独立 modal 层，可能不会被窗口快照捕获到。
- 如果某个 App 的视觉强依赖透明背景或实时 backdrop，可能需要在快照扁平化策略上做局部调优。

这些是快照方案的天然边界，不是每个 App 都要适配。只有出现上述特殊内容时，才需要为该 App 或该内容类型补充快照策略。

## 6. 为什么当前实现符合项目前端开发哲学

### 6.1 Shell 与业务解耦

业务 App 不知道 Dock、Genie、canvas、scanline，也不控制窗口生命周期。Shell 通过 manifest 和 runtime registry 加载业务窗口，并在窗口外层统一处理系统级动效。

### 6.2 组件化但不过度抽象

Genie 被拆为几类真实职责：

- `GenieEffectLayer`: 负责播放。
- `genie-effect-geometry`: 负责纯几何。
- `GenieSnapshotStage`: 负责素材生成。
- `genie-snapshot-compositor`: 负责像素稳定。
- `genie-hidden-windows`: 负责状态集合更新。

这些拆分分别对应不同变化原因，避免把所有逻辑塞在 `KernelOnShell` 或窗口容器里。

### 6.3 状态归属正确

Genie 动画状态属于本地 Shell UI 状态，使用 React state/ref 与 Zustand window store 配合即可。它不是远端数据，也不是业务流程状态，因此没有进入 Server Components、Server Actions 或业务模块。

### 6.4 渲染边界清晰

`apps/web` 仍是装配层。实际窗口系统能力沉淀在 `packages/shell`，业务 App 内容在 `packages/modules`，manifest 在 `packages/catalog`。这与 Web OS 分层一致，也方便后续桌面端复用。

## 7. 测试与回归保障

当前已有测试覆盖关键行为：

- `genie-effect-geometry.test.ts`: 验证打开、收纳和 Dock 点几何。
- `genie-snapshot-compositor.test.ts`: 验证快照像素扁平化。
- `genie-hidden-windows.test.ts`: 验证 hidden window id 集合更新。
- `genie-effect-layer.test.tsx`: 验证最小化首帧绘制前 live source 已隐藏。
- `genie-snapshot-stage.test.tsx`: 验证离屏快照窗口不带桌面安全区偏移。
- `KernelOnShell.test.tsx`: 验证窗口、Dock、最小化和恢复的基础集成行为。

后续如果调整 Genie 曲线、快照生成方式或窗口容器布局，应优先补充这些测试，而不是只靠肉眼验证。

## 8. 后续演进方向

- 支持按 App 类型配置快照策略，例如 video/WebGL fallback。
- 对 snapshot readiness 做显式状态标记，避免第一次点击时快照未准备好而降级。
- 为不同窗口尺寸做曲线微调，让大窗口收纳更像纸张或丝绸被吸入。
- 在性能需要时缓存快照版本，并在窗口内容明显变化时失效。
- 为移动或窄屏形态提供更轻量的 motion fallback。
