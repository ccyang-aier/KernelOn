# KernelOn App 顶部控制层设计

## 设计结论

KernelOn 的 App 以容器形式运行在桌面 Shell 内。窗口外框、拖拽、缩放、全屏、最小化和 Dock 动效属于 Shell 的系统能力，应继续由容器托管。App 顶部的标题、导航、搜索、视图切换、工具组、业务状态和右侧操作属于 App 语义，但视觉和基础交互需要由容器层统一。

因此 KernelOn 引入 **App Header Layer（App 顶部控制层）**：

```text
Shell 托管窗口系统能力；App Header 托管 App 顶部语义；App 内容区承载业务页面。
```

这层能力的目标不是再做一个固定工具栏，而是提供一套可声明、可组合、可降级的顶部控制模型。后续业务 App 可以只挂载主体内容，并通过 App Header Layer 复用统一的标题、导航、搜索、工具组和状态表达。

## 架构判断与目标骨架

这套架构的长期方向成立：**统一的是窗口与布局契约，保持自由的是每个 App 的视觉、控件与交互。**

它不是要求所有 App 使用同一副工具栏，而是要求所有 App 都在同一套窗口骨架中表达差异。目标骨架如下：

```text
Desktop Shell
└─ App Frame
   ├─ Window Controls       三色按钮、拖拽、缩放、全屏、窗口层级
   ├─ App Chrome            顶部控制层、布局区域、安全区与响应式避让
   └─ App Layout
      ├─ normal             常规内容页
      ├─ sidebar            带侧边栏的内容页
      ├─ split-view         双栏或多栏内容页
      ├─ canvas             画布或编辑器
      └─ content            业务主体
```

任何业务 App 都必须复用 `App Frame`，不得自行实现窗口级外壳。App 可以自由选择 `App Layout` 和 `App Chrome` 的组合；因此，统一骨架不会牺牲壁纸、看板、编辑器或侧边栏应用的个性。

## Shell 是什么

Shell 是 KernelOn 的桌面操作系统外壳，而不是某个业务 App。它只消费 manifest、窗口状态和运行时模块注册表，不理解壁纸搜索、小组件筛选等业务规则。

Shell 负责：

- 桌面、全局状态栏、Dock、启动台与 Spotlight。
- App 生命周期：按需加载、打开、关闭、最小化、聚焦和层级管理。
- 窗口系统：外框、三色按钮、拖拽、缩放、全屏、安全区与动效。
- App Chrome 的区域布局、碰撞避让、窄窗口压缩和与 App Layout 的联动。

App 负责：

- 定义顶部区域中展示的标题、搜索、按钮、筛选器和工具组。
- 定义这些控件的业务行为、数据和视觉风格。
- 声明自身采用的内容布局以及会影响顶部栏几何的布局状态。

## 命名边界

公共 API 使用 `AppHeader` 命名，因为它服务于具体 App 的顶部控制区域。

- 不使用 `Chrome`：避免浏览器语境和过度工程行话。
- 不使用 `Portal`：避免把 React 实现细节暴露给业务 App。
- 不使用 `WindowHeader`：避免与窗口管理、坐标、层级、全屏和最小化等 Shell 能力混淆。

Shell 内部渲染器命名为 `AppContainerHeader`，用于强调它属于 App 容器，而不是业务页面自己随意实现的 header。

## 职责划分

| 能力 | 归属 |
| --- | --- |
| 关闭、最小化、全屏、拖拽、缩放、窗口层级、Dock 联动和 genie 动效 | Shell 容器 |
| App 标题、副标题、编辑状态、返回/前进、搜索、视图切换、筛选、分享、更多操作和二级栏 | App Header Layer |
| 表格、图表、表单、详情页、业务流程和局部交互状态 | App 内容区 |
| 权限、数据读取、业务规则和写入校验 | 服务端边界 |

这个划分保证 Shell 不需要理解业务细节，业务 App 也不需要重复实现窗口级交互。

## 接入模型

App Header 支持三种模式：

- `standard`：由可序列化 descriptor 声明，Shell 统一渲染。适合大多数管理 App。
- `composable`：App 可以通过受控 slot 填充局部自定义内容。适合复杂工具组或特殊操作区。
- `immersive`：用于画布、编辑器、演示等沉浸式 App。Shell 仍保留窗口控制安全区。

### 灵活性的三级模型

灵活性是该契约的首要约束，但应按从标准到完全定制的层级获得，而不是允许业务 App 绕过窗口骨架。

| 层级 | App 可以定义什么 | 适用场景 |
| --- | --- | --- |
| 标准声明 | 标题、导航、按钮、普通搜索、分段控制、命令与状态 | 多数管理类 App |
| 区域定制 | 在 `leading`、`center`、`trailing`、`subbar` 中渲染任意 React 控件及其视觉样式 | 特殊搜索框、复杂筛选器、头像组、专属工具组 |
| 布局定制 | 声明 `sidebar`、`split-view`、`canvas` 或 `immersive` 等布局模式、对齐目标与安全区 | 侧边栏应用、编辑器、画布和沉浸式体验 |

slot 是第二层的受控扩展点：它允许 App 使用任意控件，而不是限定为统一按钮或统一搜索框。slot 只替换**区域内容**，不接管窗口级几何；区域的位置、避让、焦点、拖拽保护和响应式策略继续由 Shell 承担。

当 App 需要极特殊的顶部视觉时，应使用布局定制或 `immersive`，并声明窗口控制安全区、内容对齐目标和窄窗口降级规则。Shell 保留窗口控制权，App 获得其余顶部区域的视觉自由。

声明层只保存轻量可序列化配置，例如标题、控件类型、图标名、命令 ID、搜索占位符和分段选项。运行层才注册命令处理器或填充 slot 内容。这样不会破坏 `packages/catalog`、`packages/modules` 和 `packages/shell` 的懒加载边界。

Header 中出现的 `commandId` 不是临时字符串，而是可以被转换为 `CommandDefinition` 的命令协议。Shell 可以先渲染静态 descriptor，App 运行后再注册对应 handler；Spotlight、菜单或后续快捷键系统也可以复用同一批命令声明。

## 顶部区域结构

App Header 分为五个稳定区域：

| 区域 | 作用 |
| --- | --- |
| `leading` | 返回、前进、面包屑或主导航入口 |
| `identity` | 标题、副标题、编辑/保存/同步状态 |
| `center` | 分段视图、模式切换、核心工具组 |
| `trailing` | 搜索、筛选、分享、更多操作 |
| `subbar` | 二级筛选、标签页、上下文工具 |

区域是稳定的语义区域，不是固定的像素坐标。每个区域都可承载标准控件或自定义 slot；自定义 slot 可以使用不同的搜索框、按钮组和视觉语言。

### 顶部栏与内容布局联动

App Header 的对齐必须明确基于哪个坐标系，至少支持：

- `window`：相对整个 App 窗口居中，适合多数常规窗口。
- `content`：相对主内容区居中，适合带侧边栏或 Inspector 的 App。
- `canvas`：相对画布可视区对齐，适合编辑器与沉浸式内容。

带侧边栏的 App 需要声明侧边栏的展开/收起状态及对应占用空间。Shell 据此计算 Header 的可用区域、标题锚点和控件避让；App 不应使用固定像素或绝对定位去追随侧边栏宽度。

窄窗口下，Shell 按统一规则压缩、截断、折叠或转入更多菜单，避免每个 App 自行处理标题和按钮挤压问题。布局契约需要保证：标题、搜索、窗口控制和自定义工具组不会重叠。

## 视觉规则

- 默认采用明亮、克制、精致的产品界面。
- 不像素级复制 macOS，但保留高质量桌面系统的清晰层次和反馈。
- 控件统一使用浅色半透明 surface、细描边、轻阴影和明确的 hover、focus、pressed、disabled 状态。
- Header 控件点击不能触发窗口拖拽；空白拖拽区仍支持移动窗口，双击仍支持全屏切换。
- 内容区滚动时，Header 可以增强底部分隔或实底，以保证文字和控件始终可读。

## 实现映射

- `packages/core/src/app-header.ts` 定义 `AppHeaderDescriptor`、`AppHeaderItem`、命令声明辅助函数和相关类型，并允许 App manifest 与窗口状态携带 header 配置。
- `packages/shell` 通过 `AppContainerHeader` 渲染容器顶部控制层，并提供 `useAppHeader` 与 `AppHeaderSlot` 给运行时 App 使用。
- `packages/shell` 将整体布局、控件渲染和图标映射拆成内部小模块，避免容器组件承担过多变化原因。
- `packages/ui` 沉淀 `AppHeaderButton`、`AppHeaderGroup`、`AppHeaderSegmentedControl`、`AppHeaderSearchField` 和 `AppHeaderTitleBlock` 等视觉 primitives，并通过 `--ko-app-header-*` token 收敛视觉细节。
- `packages/modules` 中的业务 App 继续通过 `loaderKey` 懒加载，只在运行后注册命令处理器或填充受控 slot。

## 演进约束

- 任何 App 的顶部栏都必须经由 `App Frame` 渲染，不能自行复制三色按钮、窗口拖拽或窗口外框。
- App 不能依赖 Shell 的内部 DOM 层级或测试标识来修改 Header 布局；所需能力应进入公开的 Header/Layout 契约。
- Header 的高度、垂直居中、安全区、区域宽度和响应式折叠属于 Shell 的不变量，不能由业务 App 以像素补丁覆盖。
- App 可以完全自定义区域内容的视觉与交互；“统一”不等于使用相同按钮或相同搜索框。
- 对于静态可声明的 Header，应优先在 manifest 中定义；仅动态状态和复杂运行时控件才通过运行时 API 与 slot 注册。

这套契约让 Shell 继续只消费 manifest、窗口状态和运行时注册表，同时让每个 App 获得足够灵活的顶部控制能力，并保持公共元素的一致性。
