# KernelOn 前端架构

## 1. 总体定位

KernelOn 前端由 Next.js Web 主应用、Tauri + Vite 桌面宿主和共享 packages 组成。Web 是当前主交付面；桌面端复用共享 Shell 与业务模块，不承载 Next.js server runtime。业务事实统一来自 Litestar API。

## 2. 分层与所有权

- `apps/web`：Next.js 路由、布局、SSR、Web 特有 BFF 与 runtime bridge。
- `apps/desktop`：Tauri/Vite 宿主、原生能力桥接和共享模块装配。
- `packages/core`：不依赖 React 的纯 TypeScript 模型与纯函数。
- `packages/catalog`：可序列化 manifest、默认布局、分类和 `loaderKey`。
- `packages/modules`：可动态加载的 App 窗口与 Widget。
- `packages/shell`：桌面、窗口、Dock、启动台、Spotlight 和本地 UI 状态。
- `packages/ui`：可复用 React primitives 与设计系统组件。

`apps/*` 是装配层，共享能力优先沉淀到职责明确的 package。Shell 只消费 manifest、布局和 runtime registry，不直接绑定具体业务模块。

## 3. 渲染、状态与数据

- Next.js 默认按 Server Component 设计，交互边界下沉到客户端叶子。
- Server Component 传给客户端 Shell 的数据必须可序列化；模块实现由 runtime registry 按 `loaderKey` 懒加载。
- Zustand 仅管理本地客户端 UI 状态。可刷新和分享的状态优先进入 URL，业务远端状态由服务端 API 和适当的数据获取边界管理。
- 权限、鉴权、敏感数据和业务规则由 Litestar 后端负责；客户端状态不构成安全事实。
- Next.js Route Handler/Server Action 可以承担 Web 特有 BFF，但不得绕过 API 直接操作业务数据库。

## 4. 组件与设计系统

- Tailwind CSS 4 `@theme` 与语义化 CSS token 是主题事实来源。
- `packages/ui` 提供稳定 primitives；业务组合留在 `packages/modules` 或具体 feature 附近。
- 可访问性、键盘操作、加载、空状态和异常状态属于组件交付范围。
- 视觉专题和 Liquid Glass 实现细节见 `frontend-design/`，不要把具体滤镜参数写入通用架构规则。

## 5. 专题入口

- App 窗口结构：`app_frame_architecture.md`
- URL 与深链：`url_deeplink_design.md`
- Liquid Glass：`frontend-design/liquid-glass-design.md`
- 资产设计：`frontend-design/asset-design-guidelines.md`
- Genie 动效：`frontend-design/genie-effect-architecture.md`
