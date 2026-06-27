# KernelOn 技术栈最终选型

## 结论

KernelOn 主 Web 应用采用 **Next.js App Router + React 19 + TypeScript + Tailwind CSS 4**。这不是为了追逐框架热度，而是因为产品定位本质上是长期平台：它需要权限、数据、AI、通知、任务、工作流、管理看板和高质量 Web OS Shell，而不只是一个纯前端演示。

最终架构是：

- `apps/web`：Next.js App Router 主 Web 应用。
- `apps/desktop`：Tauri + Vite 桌面端壳层骨架。
- `packages/catalog`：App/Widget manifest、默认桌面屏与模块加载键。
- `packages/core`：纯 TypeScript 核心模型与纯函数。
- `packages/modules`：按需加载的业务 App 窗口与 Widget 实现。
- `packages/ui`：设计系统 primitives。
- `packages/shell`：可复用客户端 Web OS Shell。

这意味着 KernelOn 的 Shell 不直接 import 全部业务 App。Shell 只知道 manifest、桌面布局与 `loaderKey`，具体窗口和小组件由 Web 或 Desktop 的运行时注册表按需解析。

## 关键评估

### Next.js

Next.js App Router 是主 Web 应用的最终选择。它提供 Server Components、Server Actions、Route Handlers、嵌套路由、布局、缓存与服务端权限边界，适合 KernelOn 这种最终会接入真实组织数据和 AI 能力的平台型产品。

Web OS 的桌面、Dock、窗口、启动台和 Spotlight 仍然可以作为 Client Components 存在。Next 的价值在于把“平台边界”提前放对，而不是限制 Shell 的交互表现。

### Vite

Vite 仍然优秀，但更适合纯前端应用、组件 playground、工具型应用或 Tauri 桌面壳。对于 KernelOn 主 Web 平台，Vite 不提供服务端数据边界、权限边界和应用级约束，需要后续自行拼装太多关键架构。

因此 Vite 从主 Web 框架退到未来桌面端和必要工具链场景。

### TanStack Start

TanStack Start 的方向先进，类型体验和数据层思路优秀，但当前更适合作为重点观察对象，不作为 KernelOn 主 Web 应用的一次性正确选择。原因是 KernelOn 更需要生态成熟度、团队可接手性和长期稳定边界。

TanStack Query、TanStack Table、TanStack Virtual 仍然保留为后续局部能力候选，而不是用 TanStack Start 替代主框架。

### Tauri

Tauri 是桌面端的正确路线，但不应该倒逼主 Web 应用放弃 Next。官方实践中 Next 进入 Tauri 通常需要静态导出，容易牺牲 Next 的服务端价值。

更优雅的长期路径是：Web 主应用使用 Next，桌面端单独用 Tauri + Vite，二者复用 `packages/core`、`packages/ui`、`packages/shell`。

### App/Widget 动态运行时

KernelOn 的 OS 隐喻要求用户可以自由添加、移除和排列 App 与小组件。架构上必须避免“所有 App 一起渲染”的后台管理式实现。

最终边界是：

- `packages/catalog` 描述 App/Widget 存在、分类、默认桌面摆放和 `loaderKey`。
- `packages/modules` 提供具体 App 窗口与 Widget 组件。
- `packages/shell` 根据桌面布局、Dock、启动台、Spotlight 和窗口状态决定当前需要哪些模块。
- Web 与 Desktop 分别提供运行时注册表，把 `loaderKey` 映射到动态 import。

这个设计把“应用注册”“桌面布局”“模块实现”“运行时加载”拆开，使未来按用户、角色、组织、插件包或权限裁剪 App 集合时不需要重写 Shell。

## 运行时边界

- Server Components：默认读取服务端数据和装配页面。
- Server Actions / Route Handlers：承载写操作、服务端校验、AI 调用、Webhook 与集成入口。
- Client Components：只承载必要交互，如 Web OS Shell、本地 UI 状态、动画、浏览器 API。
- Zustand：只管理客户端 UI 状态，不管理远端事实。
- PostgreSQL + Drizzle：后续承载结构化业务数据和迁移。
- AI SDK / provider adapter：后续承载 AI Spotlight、智能匹配、摘要和 Agent 能力，所有 provider key 只在服务端使用。

## 依赖引入原则

- Motion 作为默认动效库，服务窗口、启动台、Dock、Spotlight 等明确提升体验的交互。
- GSAP 只在需要复杂时间线动画时引入。
- Three.js 只在需要真实 3D 场景时引入。
- TanStack Query 只在出现复杂客户端缓存、乐观更新或实时数据协同时引入。
- Auth.js、Drizzle migrations、AI streaming endpoint 在对应业务阶段再落地，不在骨架阶段堆空依赖。
