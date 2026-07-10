# KernelOn App 骨架架构设计

## 设计结论

KernelOn 的所有 App 应复用同一套骨架契约，但不应被限制为相同的页面结构或顶部栏视觉。

统一骨架的目标是稳定公共能力、保持业务自由：

```text
Platform Host 适配 Web 与桌面端平台能力；
Desktop Shell 管桌面运行环境；
AppWindowContainer 管单个窗口的系统能力；
AppFrame 管单个 App 内部布局；
App 管业务组合、视觉与交互。
```

当前代码已经具备统一窗口容器、运行时注册表和动态加载等正确基础，但现有 App Header 的运行时 slot 注入仍是过渡实现。本文件描述长期目标契约，同时明确当前实现需要收敛的边界。

## 设计目标

- 所有 App 共享一致的窗口行为、控制按钮、安全区和基础可访问性。
- 常规管理 App 可以低成本使用标准骨架，不重复实现标题栏、侧边栏和内容布局。
- 壁纸、编辑器、看板、画布等特殊 App 可以自由定制顶部区域和内容结构。
- 新增布局形态时不要求 Desktop Shell 理解具体业务 App。
- App/Widget 继续通过稳定 `loaderKey` 按需加载，不破坏现有包边界。

## 整体骨架

```text
Platform Host
├─ Web Host：Next.js / Browser
└─ Desktop Host：Tauri + Vite
   └─ Desktop Shell
      └─ AppWindowContainer
         ├─ Window Controls
         └─ AppFrame
            ├─ AppHeader
            ├─ AppSidebar / AppInspector（可选）
            ├─ AppMain
            ├─ AppSubbar / AppFooter（可选）
            └─ AppOverlay（可选）
```

### Platform Host

Platform Host 是 Web 与桌面端的适配边界。KernelOn 当前优先交付 Web，但整体骨架必须能够被未来的 Tauri 桌面端复用。

- Web Host 由 `apps/web` 承载，负责 Next.js 路由、服务端边界和浏览器运行环境。
- Desktop Host 由 `apps/desktop` 承载，负责 Tauri 原生窗口、系统能力桥接和 Vite 装配。
- 两种 Host 复用相同的 `packages/core`、`packages/catalog`、`packages/modules`、`packages/ui` 与 `packages/shell`。
- Platform Host 只适配平台差异，不复制 Desktop Shell、AppWindowContainer 或业务 App。

### Desktop Shell

Desktop Shell 是 KernelOn 的桌面运行环境，不是某个业务 App 的容器布局。

它负责：

- 桌面、全局状态栏、Dock、启动台、Spotlight 和桌面小组件。
- App 的发现、按需加载、打开、关闭、聚焦、最小化和层级管理。
- 多窗口、桌面屏幕和全局交互状态。

Desktop Shell 不理解 App 是否包含侧边栏、搜索框、Inspector 或画布，也不根据具体 App ID 选择布局。

### AppWindowContainer

AppWindowContainer 是所有 App 共享的单窗口容器。它是 Desktop Shell 管理的窗口实例，不再使用 `WindowShell` 命名，避免与 Desktop Shell 混淆，也避免被误解为微软 Windows 平台能力。

它负责：

- 窗口边界、圆角、阴影和层级。
- 三色控制按钮、拖拽、缩放、最小化、全屏和 Dock 动效。
- 窗口控制安全区、可拖拽区域和窗口级可访问性。
- 向内部 AppFrame 暴露稳定的窗口能力与安全区 token。

AppWindowContainer 不负责 App 的侧边栏宽度、标题对齐目标、内容分栏或业务工具组。

### AppFrame

AppFrame 是所有 App 共用的内部布局契约，由共享包提供，但由业务 App 组合使用。

它负责：

- 组织 AppHeader、Sidebar、Inspector、Main、Subbar、Footer 和 Overlay 等区域。
- 保证 Header 与侧边栏、主内容区、Inspector 在同一布局树内自然联动。
- 处理区域尺寸、滚动边界、容器查询、窄窗口折叠和控件避让。
- 消费 AppWindowContainer 提供的安全区，但不把 App 布局状态反向交给 Desktop Shell 计算。

AppFrame 应以可组合布局原语为核心。`normal`、`sidebar`、`split-view`、`canvas` 等可以作为便捷预设，但不能成为限制未来布局形态的封闭枚举。

### App

业务 App 负责：

- 选择或组合合适的 AppFrame 区域。
- 定义标题、搜索、导航、筛选器、按钮和工具组的内容、样式与行为。
- 管理侧边栏展开状态、Inspector 状态和业务页面状态。
- 定义 AppMain 内的业务流程、数据展示和交互。

## AppHeader 的统一与灵活性

AppHeader 是 AppFrame 的一个区域，而不是 Desktop Shell 中独立运行的业务工具栏。

它需要提供三级灵活性：

| 层级     | 能力                                                                    | 适用场景                                   |
| -------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| 标准声明 | 标题、导航、普通搜索、按钮、分段控制、状态和命令                        | 多数管理类 App                             |
| 区域定制 | 在 leading、center、trailing、subbar 中传入任意 React 组件              | 特殊搜索框、复杂筛选器、头像组和专属工具组 |
| 完全组合 | App 自行组合 Header 区域和视觉，AppWindowContainer 只保留窗口控制安全区 | 壁纸、画布、编辑器和沉浸式 App             |

统一契约不要求所有 App 使用相同的搜索框或按钮样式。App 可以传入完全自定义的控件；共享骨架只负责安全区、布局边界、拖拽保护、碰撞避让和响应式基础规则。

## Header 与 App 布局联动

Header、Sidebar 和 Main 必须处于同一个 AppFrame 布局树中。这样侧边栏展开、收起或调整宽度时，Header 可以通过 CSS Grid、布局 token 和容器查询自然响应，而不需要 Desktop Shell 读取业务状态。

标题或核心工具组至少应支持以下对齐目标：

- `window`：相对整个窗口可用区对齐。
- `main`：相对主内容区对齐，适合带 Sidebar 或 Inspector 的 App。
- `canvas`：相对画布视口对齐，适合编辑器和沉浸式 App。

对齐目标属于 AppFrame 的内部布局配置。App 可以选择目标，AppFrame 负责落地几何；Desktop Shell 不参与计算。

## 组合契约

推荐的长期使用方式是让 App 在同一次 React 渲染中声明完整骨架：

```tsx
<AppFrame>
  <AppHeader>
    <AppHeader.Leading>{/* 任意控件 */}</AppHeader.Leading>
    <AppHeader.Center>{/* 任意控件 */}</AppHeader.Center>
    <AppHeader.Trailing>{/* 任意控件 */}</AppHeader.Trailing>
  </AppHeader>
  <AppSidebar>{/* 可选 */}</AppSidebar>
  <AppMain>{/* 业务主体 */}</AppMain>
</AppFrame>
```

上述代码仅表达目标 API 形态，不代表必须采用完全相同的组件命名。核心要求是：Header 和内容布局保持同树组合，避免业务 App 通过 Effect 把 ReactNode 反向注册到父级窗口。

静态、可序列化的信息仍应保存在 manifest 中，例如默认窗口尺寸、能力声明、标题、布局预设和 `loaderKey`。动态 React 组件、事件处理器和业务状态只存在于运行时 App 模块。

## 灵活性边界

必须统一的内容：

- AppWindowContainer 的窗口行为、三色按钮和安全区。
- AppFrame 区域的基础语义、滚动边界和可访问性。
- Header 控件不能误触窗口拖拽，窄窗口下不能与窗口控制重叠。

允许 App 自由决定的内容：

- Header 是否透明、悬浮、带背景或与内容融合。
- 搜索框、按钮、分段控制和工具组的具体视觉。
- Sidebar、Inspector、Main 和 Header 的组合方式。
- 标题相对 window、main 或 canvas 对齐。
- 特殊 App 的沉浸式布局和动画。

灵活性的最终逃生口是“完全组合”，而不是绕过 AppWindowContainer 或操作其内部 DOM。

## 包职责映射

- `packages/core`：纯 TypeScript 契约，包括 manifest、窗口能力、AppFrame 可序列化配置和命令定义。
- `packages/catalog`：App/Widget manifest、默认布局、能力声明和稳定 `loaderKey`。
- `packages/shell`：跨 Web/Tauri 复用的 Desktop Shell、AppWindowContainer、窗口运行时和与窗口能力紧密相关的 AppFrame 基础设施。
- `packages/ui`：可跨场景复用的 Header、Sidebar、Surface 和交互 primitives。
- `packages/modules`：具体 App 的 AppFrame 组合、业务交互和 Widget 实现。
- `apps/web`：Next.js 装配、服务端边界和 Web runtime bridge。
- `apps/desktop`：Tauri + Vite 装配、原生能力桥接和桌面 Host runtime。

如果 AppFrame 的某个布局原语不依赖窗口运行时，应优先沉淀到 `packages/ui`；只有需要窗口安全区、拖拽或 Shell 状态的部分才进入 `packages/shell`。

## 当前实现评估

当前实现中以下部分可以保留：

- `AppWindowContainer` 统一承载窗口外框和窗口行为。
- `AppFrame` 已支持 App 在同一次渲染中直接组合 Header slot 与业务内容。
- manifest、窗口状态和运行时模块通过 `loaderKey` 解耦。
- `frameOwner` 与 `layer` 已作为 manifest capability 声明，Desktop Shell 不再根据具体 App ID 判断特殊窗口。
- 壁纸 App 与小组件 App 已使用 App 自有 AppFrame；其 Header 不再通过 Effect 反向注册。
- AppHeader descriptor、命令协议和 UI primitives 的基本方向。

以下部分属于过渡实现，需要后续演进：

- `AppHeaderSlot` 仍作为未迁移 App 的兼容 API 保留，后续应在所有真实 App 迁移完成后收敛。
- 当前 AppFrame 先覆盖 Header + Content 组合；Sidebar、Inspector、Main 对齐目标和容器查询仍需逐步沉淀为共享原语。
- 已实现 App 的局部几何仍包含应用级样式规则，后续只能通过公开 AppFrame/Header 区域契约演进，不能重新依赖 Shell 内部 DOM 或测试标识。
- `standard`、`composable`、`immersive` 只有声明差异，尚未形成完整布局能力。

## 演进约束

- 不允许业务 App 自行复制 AppWindowContainer、三色按钮或窗口交互。
- 不允许 Desktop Shell 根据具体 App ID 决定窗口或布局能力；特殊能力必须由 manifest/capability 声明。
- 不允许 App 依赖 Shell 内部 DOM 层级或测试标识修改布局。
- 不把业务侧边栏宽度和展开状态提升为 Desktop Shell 状态；它们应留在 AppFrame/App 内。
- 不把布局预设设计成封闭模板；预设必须能由底层组合原语表达和扩展。
- 优先使用单次声明式组合，避免通过 Effect 在 App 与外层窗口之间搬运 ReactNode。

最终目标是：**Web 与 Tauri Host 共享同一个 Desktop Shell；所有 App 共享同一个 AppWindowContainer 和 AppFrame 契约，但任何 App 都能在契约内自由组合自己的 Header、Sidebar、内容结构和视觉语言。**
