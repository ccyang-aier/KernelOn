# KernelOn

KernelOn 是一个面向新员工运作的 Web OS 式管理平台。它把入职、导师匹配、成长档案、培训、考核、数据看板和资源沉淀组织为一组可演进的应用，并通过桌面、Dock、窗口、小组件和 AI Spotlight 等系统级隐喻提供统一体验。

本仓库当前处于工程骨架阶段：优先建立清晰、可扩展、可验证的前端架构，不提前锁死完整视觉稿或完整 MVP 交互。

## 技术栈

- 包管理与工作区：`pnpm` workspace
- Web 应用：Next.js 16 App Router + React 19 + TypeScript
- 桌面端预留：Tauri 2 + Vite + React，共享 Web OS 运行时包
- 样式方案：Tailwind CSS 4，通过 `@tailwindcss/postcss` 接入，并用 `@theme` 管理设计 token
- UI primitives：shadcn/ui 思路 + Radix Primitives，当前以轻量自有组件起步
- 客户端状态：Zustand，仅用于窗口、Dock、桌面布局、启动台、Spotlight 等客户端 Shell 状态
- 动效：Motion，后续仅在明确需要时再引入 GSAP 或 Three.js
- 测试：Vitest + Testing Library

## 目录结构

```text
KernelOn/
  apps/
    desktop/          # Tauri + Vite 桌面端壳层骨架
    web/              # Next.js App Router Web 应用
  packages/
    catalog/          # App/Widget manifest 与默认桌面配置
    core/             # 纯 TypeScript 核心模型与纯函数
    modules/          # 可动态加载的 App 窗口与 Widget 模块
    shell/            # 可复用 Web OS 客户端壳层
    ui/               # React UI primitives 与设计系统组件
  docs/
    architecture/     # 架构与技术决策记录
    product_planning_overview.md
  .agents/            # 仓库本地 agent skills
  .codex/             # 项目级 Codex 配置
  AGENTS.md           # 仓库级 Codex 指引
```

## 开发命令

```powershell
pnpm install
pnpm dev:web
pnpm dev:desktop
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm check
```

`pnpm dev` 与 `pnpm dev:web` 都会启动 `apps/web` 的 Next.js dev server。`pnpm check` 会串行执行 lint、typecheck、test 和 build。
`pnpm dev:desktop` 启动桌面端 Vite 壳层，用于提前验证共享 Shell、App 模块与 Widget 模块在桌面容器中的复用情况；真正的 Tauri 打包命令保留在 `apps/desktop` 内。

## 架构原则

- `packages/core` 不依赖 React，承载 App manifest、窗口模型、桌面布局、命令模型等核心类型和纯函数。
- `packages/catalog` 只描述“有哪些 App/Widget”以及“默认桌面放哪些入口”，不直接引用 React 组件。
- `packages/modules` 承载可懒加载的 App 窗口与 Widget 实现，通过 `loaderKey` 被 Shell 运行时按需解析。
- `packages/ui` 只放可复用 UI primitives，不承载业务流程和客户端 store。
- `packages/shell` 负责桌面外壳，包括 MenuBar、Dock、桌面画布、窗口层、启动台、Spotlight 和本地 Shell store。Shell 只消费 manifest、桌面布局与运行时注册表，不静态绑定所有业务 App。
- `apps/web/src/app` 是 Next.js 路由、布局、Route Handlers 与 Server Component 装配层。
- `apps/web/src/runtime` 是 Web 端把共享模块运行时接入 Next Client Component 的桥接层。
- `apps/desktop` 是桌面端壳层骨架，优先复用 `packages/catalog`、`packages/modules`、`packages/shell` 与 `packages/ui`；只有原生能力才进入 Tauri/Rust 边界。
- 服务端数据读取与写入优先走 Server Components、Server Actions 和 Route Handlers；后端数据缓存后续优先评估 TanStack Query。
- “OS” 是产品隐喻，不强制写进每个技术命名。代码命名优先保持简洁清晰。
- App/Widget 必须支持低耦合、按需加载：未被用户放到桌面、Dock 或主动打开的模块不应被 Shell 主动渲染。

## 当前状态

- Web 端是首期交付目标。
- Tauri 桌面端已有基础目录骨架，当前只作为共享架构验证面，完整桌面产品开发后置。
- 移动端不在本期范围内。
