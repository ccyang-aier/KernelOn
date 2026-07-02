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

## 前端开发哲学

所有前端代码开发应当主动遵循以下开发哲学。

### 一、视觉表现

- UI 是产品的第一张脸，精致是不可妥协的标准。界面质量不能只靠功能完整来定义，间距、层次、动效、色彩关系和反馈细节都属于交付范围。
- 设计语言应收敛到 Tailwind CSS 4 的 `@theme` 与语义化 CSS token。不要在 JavaScript 中维护与 CSS 重复的主题常量。

### 二、架构与组织

- `src/app` 是装配层，只承担路由入口、Metadata、布局、Server Component 数据协调、Route Handlers 和组合入口。
- 业务逻辑、领域状态与交互实现沉淀在 `src/features` 或共享包中。不要把业务流程堆进 `page.tsx` / `layout.tsx`。
- Web 端业务 App/Widget 优先沉淀到 `packages/modules`，manifest 与默认桌面配置优先进入 `packages/catalog`。`apps/web` 只保留 Next 装配、服务端边界和 Web 特有 runtime bridge。
- 物理就近，抽象按需偿付。组件、类型、hooks、测试和局部常量优先靠近使用处；只有真实复用、稳定契约或职责分裂明确时才抽象。
- 文件拆分信号不是行数，而是一个文件是否承担了多于一个变化原因。

### 三、渲染与交互边界

- 默认按 Server Component 思考。只有需要浏览器 API、客户端状态、事件处理或动画时才声明 `"use client"`，且边界尽量下沉到交互叶子。
- 穿越 server 到 client 边界的 props 必须可序列化。函数、类实例、服务端闭包不跨边界传递。
- Server Component 传给 Shell 的只能是可序列化的 manifest、layout 和初始状态；App/Widget 组件实现通过客户端 runtime registry 按需加载。
- 读操作优先放在服务端路径；写操作后续优先用 Server Actions 或 Route Handlers 形成提交、校验、变更与 UI 更新闭环。
- 权限、鉴权、敏感数据访问和关键业务规则优先归属服务端。客户端状态只能改善体验，不能成为安全事实来源。

### 四、状态与异步

- UI 是状态的函数。能计算的不存，能局部的不全局，能由服务端确定的不交给客户端猜。
- 可分享、可刷新、可回放的状态优先属于 URL，例如筛选、分页、排序和搜索词。
- `useEffect` 是外部同步原语，不用于在 React 内部状态之间搬运数据。关联计算优先在 render、事件处理器或 Server Actions 中完成。
- 加载与异常是一等 UI。使用 `loading.tsx`、`error.tsx`、`Suspense` 与错误边界承接非 happy-path。

### 五、契约与演进

- Dialog、Popover、Combobox 等高可访问性组件优先基于 shadcn/ui / Radix Primitives 封装。
- TypeScript 保障静态契约，但不能替代运行时边界校验。表单、URL、Server Actions、Route Handlers、第三方接口输入都要在服务端入口解析与收窄。
- Zustand 只放客户端 Shell/UI 状态，如窗口栈、Dock、启动台、Spotlight、桌面屏幕和小组件布局。远端数据缓存、复杂表单流、审批流状态机和协同状态不要放进 Zustand。
- 重构由职责信号触发。当一个模块开始承担多个变化原因时，按业务高内聚原则拆分。

## 仓库工作流

- 做产品、UX 或架构决策前，先阅读 `docs/product_planning_overview.md`。
- 改动要聚焦在当前请求或文档更新上。产品骨架阶段不要顺手做无关重构。
- 除非用户要求英文文案，文档中保留中文产品术语。
- 代码改动的首选验证命令是 `pnpm check`。
- 对低风险、小范围、纯样式或像素级微调（例如只改 1-2 个 Tailwind class、间距、尺寸、颜色 token，且不触及状态、数据、动态加载、共享包边界或交互逻辑），不要默认跑全量 `pnpm check` 或浏览器全量回归；优先执行相关包的定向测试、类型检查或差异空白检查。只有改动跨模块、影响业务/交互/数据流、用户明确要求全量验证，或定向检查暴露风险时，再升级为 `pnpm check` 和完整渲染验证。
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
