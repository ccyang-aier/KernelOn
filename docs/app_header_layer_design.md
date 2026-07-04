# KernelOn App 顶部控制层设计

## 设计结论

KernelOn 的 App 以容器形式运行在桌面 Shell 内。窗口外框、拖拽、缩放、全屏、最小化和 Dock 动效属于 Shell 的系统能力，应继续由容器托管。App 顶部的标题、导航、搜索、视图切换、工具组、业务状态和右侧操作属于 App 语义，但视觉和基础交互需要由容器层统一。

因此 KernelOn 引入 **App Header Layer（App 顶部控制层）**：

```text
Shell 托管窗口系统能力；App Header 托管 App 顶部语义；App 内容区承载业务页面。
```

这层能力的目标不是再做一个固定工具栏，而是提供一套可声明、可组合、可降级的顶部控制模型。后续业务 App 可以只挂载主体内容，并通过 App Header Layer 复用统一的标题、导航、搜索、工具组和状态表达。

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

窄窗口下，区域按统一规则压缩和折叠，避免每个 App 自行处理标题和按钮挤压问题。

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

这套实现让 Shell 继续只消费 manifest、窗口状态和运行时注册表，同时让每个 App 获得足够灵活的顶部控制能力。
