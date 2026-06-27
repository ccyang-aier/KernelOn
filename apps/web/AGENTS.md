# apps/web 开发指引

本文件只约束 KernelOn Web 应用。根目录 `AGENTS.md` 仍是仓库级规则。

## 前端开发哲学

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
