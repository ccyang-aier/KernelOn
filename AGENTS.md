# AGENTS.md

## 项目背景

- KernelOn 是一个面向新员工运作的 Web OS 式管理平台，覆盖入职、导师匹配、成长档案、培训、考核、数据看板和资源沉淀等场景。
- 产品目标不是传统后台管理系统。实现和设计时要保留 `docs/product_planning_overview.md` 中“桌面外壳 + 核心服务 + 应用”的产品隐喻。
- 首期交付面是 Web 应用。Tauri 桌面端应在 Web 体验验证后再扩展。移动端不在当前阶段范围内。

## 产品与设计原则

- 管理动作要集中、可复用、可度量，同时保持使用体验顺畅。
- 视觉品质是产品价值的一部分，但不能牺牲高频管理操作的清晰度和效率。
- 产品应逐步演进为 App 化工作台，包含桌面、Dock、启动台、窗口、小组件、通知和 AI Spotlight 等系统级模式。
- 不要像素级复制 macOS 或 iOS。可以借鉴其交互质量和系统一致性，但要形成 KernelOn 自己的产品语言。
- 除非任务明确要求其他方向，默认采用精致、明亮、克制的产品界面。
- 复杂 Icon、Logo、品牌标志等高审美图形资产，永远优先使用 `imagegen` 做位图探索与审美筛选；不要用手写 SVG 或简单几何拼装硬做复杂图标。SVG 只用于选中方向后的工程化矢量化、简单基础图形或明确可控的图标实现。

## 技术方向

- 默认主 Web 栈为 Next.js App Router、React 19、TypeScript、Tailwind CSS 4、Zustand 和 Motion。
- Next.js 是主 Web 应用框架；Tauri 桌面端作为独立 `Tauri + Vite` 壳层复用共享包，不要把 Next server runtime 强行塞进桌面端。
- Shell 外壳、应用模块、状态管理和视觉组件要保持清晰边界，让业务 App 可以独立演进。
- 新增生产依赖前，先确认现有技术栈是否已经能覆盖需求。
- 使用 `pnpm` 管理 workspace 依赖。
- `packages/core` 必须保持纯 TypeScript，不依赖 React。可复用 React 组件放在 `packages/ui`，Web OS 客户端壳层放在 `packages/shell`。
- App/Widget 的 manifest 与默认桌面配置放在 `packages/catalog`；可动态加载的业务窗口与小组件实现放在 `packages/modules`。
- Shell 不能静态渲染全部 App/Widget。只能根据用户桌面布局、Dock、启动台、Spotlight 或窗口状态按需渲染和加载对应模块。
- 新增 App/Widget 时必须提供稳定 `loaderKey`，并在运行时注册表中建立映射，避免 Shell 与具体业务组件直接耦合。
- Zustand 只用于本地客户端 UI 状态，例如窗口、Dock、启动台、桌面屏幕和 Spotlight。不要把 Zustand 当作远端数据缓存，服务端数据优先走 Server Components、Server Actions 和 Route Handlers。

## 仓库工作流

- 做产品、UX 或架构决策前，先阅读 `docs/product_planning_overview.md`。
- 改动要聚焦在当前请求或文档更新上。产品骨架阶段不要顺手做无关重构。
- 除非用户要求英文文案，文档中保留中文产品术语。
- 代码改动的首选验证命令是 `pnpm check`。
- 修改 App/Widget 动态加载、桌面布局或共享包边界时，要同步检查 Web 与 Desktop 两个装配面。
- 每次任务执行完成后，将当前工作树内的全部未提交内容暂存并提交到 Git，无论这些内容是否与本次任务直接相关，并推送到远端仓库。
- 编辑 Markdown 后，结束前运行一次差异空白检查：

  ```powershell
  git diff --check
  ```

## Codex 协作

- 持久的仓库级 agent 指令写在本文件中。只有当某个子目录需要不同规则时，才新增嵌套的 `AGENTS.md`。
- 只有需要随仓库分发的 Codex 项目级配置，才放入 `.codex/`。
- 可复用的项目工作流或技能放在 `.agents/skills/`；每个技能单独建目录，并包含自己的 `SKILL.md`。
- 不要把密钥、API Key、个人 token 或机器本地凭据写入 `.codex/`、`.agents/` 或文档。
