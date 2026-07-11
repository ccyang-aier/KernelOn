# apps/web Web 开发指引

本文件约束 Next.js Web 应用装配。普通页面、组件、测试和样式任务直接遵循本文件。新增 App/Widget，或改变应用装配、Server/Client 边界、远端数据流、共享包职责时，查阅 `docs/frontend_architecture.md`；AppFrame、深链或视觉系统任务只补充对应专题文档。

## 定位与边界

- `src/app` 是装配层，只承担路由、Metadata、布局、Server Component 数据协调、Route Handlers 和组合入口。
- 业务 App/Widget 优先位于 `packages/modules`，manifest 和默认布局位于 `packages/catalog`，Shell 位于 `packages/shell`。
- 默认使用 Server Component；只有浏览器 API、客户端状态、事件或动画需要时才下沉为 Client Component。
- Next.js 通过 Litestar REST API 获取业务事实，不直接访问业务数据库。
- Zustand 只管理窗口、Dock、启动台、Spotlight 和桌面布局等本地 UI 状态，不作为远端数据缓存或安全事实来源。

## 前端开发原则

- UI 的间距、层次、动效、色彩关系、加载和错误反馈均属于交付质量。
- 设计语言收敛到 Tailwind CSS 4 的 `@theme` 和语义化 CSS token，不在 JavaScript 中重复维护主题常量。
- 穿越 server/client 边界的 props 必须可序列化；函数、类实例和服务端闭包不跨边界。
- `useEffect` 只用于外部同步，不在 React 状态之间搬运数据。
- 表单、URL、Route Handler、Server Action 和第三方输入必须在服务端入口做运行时校验。
- Dialog、Popover、Combobox 等优先基于 Radix/shadcn 风格 primitives。
- 复杂品牌图形先做视觉探索，简单且明确可控的图标才直接工程化实现。

## 验证

- 局部低风险改动优先运行相关应用或包的定向 lint、类型检查和测试。
- 涉及共享包边界、数据流、交互或构建时运行 `pnpm check`。
- 需要检查真实渲染或交互时再使用浏览器验证，不把浏览器全量回归作为纯代码或文档改动的默认步骤。
