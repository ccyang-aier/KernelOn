# KernelOn 前端资产设计指南

## 目标

资产体系服务于 KernelOn 的桌面外壳、Dock、窗口、状态栏和业务 App。所有资产要集中管理、跨 Web/Desktop 复用，并保持精致、明亮、克制的产品语言。

## 当前结构

- `packages/shell/src/visual-assets.ts`：Shell 资产注册表，供 React/TypeScript 组件引用图片、图标和 cursor 路径。
- `packages/shell/src/styles/kernelon-assets.css`：Shell 级 CSS 资产 token，供 cursor 等样式层资产统一消费。
- `apps/web/public/kernelon-assets`：Web 端运行时静态资产根目录。
- `apps/desktop/public/kernelon-assets`：Desktop 端运行时静态资产根目录。
- `docs/ux-references`：设计参考与过程素材，只作参考，不作为运行时资产入口。

## 使用原则

1. 组件不直接散落硬编码资产路径；优先通过 `visual-assets.ts` 或共享 CSS token 调用。
2. Web 与 Desktop 的 `kernelon-assets` 目录保持同构路径，确保同一注册表可复用。
3. 运行时路径统一使用 `/kernelon-assets/<category>/<asset-name>.<ext>`。
4. 文件命名使用小写 kebab-case；分类目录按用途命名，如 `brand`、`dock-icons`、`status`、`wallpapers`、`cursors`。
5. 简单 SVG 可工程化维护；复杂 Icon、Logo、品牌图形优先用 imagegen 探索，再筛选落地。
6. 业务 App/Widget 资产跟随 manifest 与 `loaderKey` 边界组织，避免 Shell 静态耦合具体业务实现。

## 新增资产流程

1. 放入 Web/Desktop 两端相同的 `kernelon-assets` 相对路径。
2. React 组件使用的资产，补充到 `packages/shell/src/visual-assets.ts`。
3. CSS 使用的资产，补充到 `packages/shell/src/styles/kernelon-assets.css`。
4. 更新或新增必要测试，至少覆盖路径、渲染入口或关键交互。
5. 修改跨装配面资产时，同步验证 Web 与 Desktop 构建。

## 视觉准则

- 保持高质感但不过度装饰，优先清晰、轻盈、可扫描。
- 借鉴 macOS 的反馈节奏与系统一致性，不做像素级复制。
- 资产与动效应服务高频管理操作，不能遮挡窗口、Dock、菜单和主要内容。
- 桌面层动效应轻量、短时、可自动消散；不进入全局状态或业务状态。
