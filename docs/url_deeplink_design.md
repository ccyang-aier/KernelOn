# KernelOn URL 与深链设计

## 设计结论

KernelOn 的主体验是 Web OS 桌面。用户在桌面内打开 App、切换窗口、全屏、最小化或调整层级时，浏览器 URL 不应随之变化。

URL 的职责不是描述当前桌面窗口状态，而是表达“从外部进入 KernelOn 时要打开什么”。一句话概括：

```text
URL 表达入口意图；Shell 表达桌面状态。
```

## URL 负责什么

URL 只用于需要可进入、可分享、可刷新恢复的业务目标：

- 从通知、邮件、飞书或外部系统直接进入某个 App。
- 打开某个 App 内的具体业务视图，例如新人档案、导师匹配、培训任务或报表详情。
- 复制业务链接给他人协作。
- 浏览器刷新后恢复到明确的业务目标。
- 在服务端入口完成权限校验、数据预取和不存在/无权限等异常处理。

普通桌面操作不写入 URL。窗口坐标、尺寸、层级、最小化、全屏、焦点、临时展开态等都属于 Shell UI 状态，应进入客户端 store、本地持久化或用户配置。

## 推荐路由模型

- `/workspace`：KernelOn 桌面入口，承载桌面、Dock、启动台、窗口、小组件和 Spotlight。
- `/workspace?open={appId}`：进入桌面后自动打开某个 App。
- `/workspace?open={appId}&view={view}&id={entityId}`：进入桌面后自动打开某个 App 的具体业务视图。
- `/apps/{appId}/...`：可选的语义化业务深链入口，可在服务端完成权限和数据边界处理后转译为桌面打开意图。

无论从哪种深链进入，最终体验都应回到 KernelOn 桌面：Shell 根据入口意图打开对应 App 窗口或 App 内视图，而不是把 App 变成传统独立页面。

## 当前实现映射

当前代码已按上述方案建立入口意图闭环：

- `apps/web/src/app/page.tsx` 与 `apps/web/src/app/workspace/page.tsx` 都装配同一个桌面 Shell。
- `apps/web/src/features/workspace/resolve-workspace-entry.ts` 负责解析 `open`、`view`、`id/entityId` 等 URL 参数，并生成初始 Shell 状态。
- `packages/core/src/app-intents.ts` 定义 `AppOpenIntent`、`AppViewTarget` 与 `WindowOpenIntent`，作为 URL 入口意图和窗口状态之间的纯 TypeScript 契约。
- `packages/core/src/windows.ts` 允许窗口携带 `intent`，用于表达该窗口由 URL、通知、Spotlight 等入口打开了哪个 App 视图。
- `packages/shell/src/shell-store.ts` 负责打开或恢复窗口；Shell 内部窗口操作仍只更新本地 UI 状态，不同步到浏览器 URL。
- `packages/modules/src/runtime.tsx` 继续通过 `loaderKey` 懒加载 App/Widget 运行层，避免 Shell 直接耦合业务组件。

当前实现已经支持 `/workspace?open={appId}` 与 `/workspace?open={appId}&view={view}&id={entityId}`。`/apps/{appId}/...` 仍是可选的语义化深链入口，只有在需要更强的服务端权限校验、数据预取或外部系统对接时再补充。

## 地址栏行为

- 桌面内打开 App：不 `push` 新 URL。
- 桌面内切换、全屏、最小化、拖拽窗口：不 `push` 新 URL。
- 外部深链进入：URL 可以保留，用于刷新恢复当前业务目标。
- 用户关闭深链目标、回到纯桌面或显式退出业务目标：可用 `replace` 归一到 `/workspace`。
- “复制链接”生成业务深链，但不要求改变当前地址栏。

KernelOn 不把浏览器 URL 当作窗口管理状态源，也不持续把 Shell 状态同步到 URL。

## 声明层与性能

桌面需要认识 App，但不应该因为认识 App 就运行 App。为此需要区分声明层和运行层。

声明层只保存轻量、可序列化的信息，例如 App ID、名称、图标、分类、关键词、默认窗口尺寸、权限摘要和 `loaderKey`。它用于桌面图标、Dock、启动台、Spotlight、权限过滤和默认布局。

运行层才是真正的 App 组件、业务逻辑、图表、表格、数据请求和交互状态。运行层只能在用户主动打开 App、桌面小组件被启用或深链需要恢复目标时按需加载。

这套分层保证：

- 桌面可以展示完整 App 清单，但首屏不加载全部业务代码。
- Shell 只依赖 manifest 和 `loaderKey`，不直接耦合具体业务组件。
- App/Widget 可以通过动态 import、Suspense 和运行时注册表懒加载。
- 后续按角色、组织、用户配置裁剪 App 范围时，不需要改 Shell 主体逻辑。

因此，“所有 App 装配在桌面”指的是产品体验和入口组织方式，不等于所有 App 代码、数据和组件树一次性加载。
