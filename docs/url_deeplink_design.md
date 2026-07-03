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

## 入口意图模型

深链进入 KernelOn 时，URL 不直接成为桌面状态，而是先被解释为一次入口意图。

入口意图只回答四个问题：

- 打开哪个 App。
- 打开 App 的哪个业务视图。
- 该视图关联哪个业务对象。
- 这次打开来自 URL、通知、Spotlight 还是其他系统入口。

入口意图被 Shell 消费后，转化为一个活动窗口；窗口可以携带业务视图目标，但窗口坐标、尺寸、层级、最小化和全屏仍由 Shell 自己管理。

## 状态归属

为避免 URL、Shell 和 App 状态互相污染，状态归属按以下边界划分：

| 状态类型 | 归属 |
| --- | --- |
| 可分享、可刷新恢复的业务目标 | URL |
| 入口来源、目标 App、目标视图、业务对象 ID | 入口意图 |
| 窗口打开、聚焦、层级、坐标、尺寸、全屏、最小化 | Shell store |
| App 内部 tab、表单草稿、临时筛选和局部交互 | App 自身 |
| 权限、数据读取、业务规则和写入校验 | 服务端边界 |

这个划分保证：URL 可以把用户带到正确业务位置，但不会接管桌面窗口管理。

## 深链生命周期

一次深链进入的生命周期如下：

1. 用户访问 `/workspace?open={appId}&view={view}&id={entityId}`。
2. Web 入口解析 URL，生成入口意图。
3. Shell 初始状态根据入口意图创建一个活动窗口。
4. 窗口根据 App manifest 的 `loaderKey` 按需加载对应 App。
5. App 根据窗口携带的视图目标渲染业务内容。
6. 用户进入桌面后，打开、切换、全屏、最小化窗口都不再更新 URL。
7. 用户需要分享时，由业务视图显式生成深链，而不是依赖当前地址栏。

## 设计边界

- URL 是进入 KernelOn 的外部协议，不是桌面的实时状态源。
- Shell 可以消费入口意图，但不反向持续写 URL。
- App 可以理解自己的业务视图目标，但不应该直接管理浏览器路由。
- 业务深链应尽量稳定，不暴露窗口坐标、布局细节或临时 UI 状态。
- `/apps/{appId}/...` 仅在需要独立服务端入口时使用，不应演变为另一套传统 App 页面体系。

## 实现映射

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
