# apps/desktop 开发指引

本文件只约束 KernelOn 桌面端壳层。根目录 `AGENTS.md` 仍是仓库级规则。

## 定位

- 桌面端当前是架构预留与复用验证面，不是首期主交付面。
- 桌面端采用 `Tauri + Vite + React`，复用 `packages/core`、`packages/catalog`、`packages/modules`、`packages/ui` 和 `packages/shell`。
- 不要把 Next.js server runtime 搬进 Tauri。需要服务端能力时，桌面端应调用远端 Web/API 服务或通过明确的本地原生桥接实现。

## 边界

- React 侧只做桌面壳层装配、共享 Shell 渲染和桌面端 runtime bridge。
- Tauri/Rust 侧只放文件系统、系统通知、托盘、窗口控制、本地安全存储等原生能力。
- 业务 App、Widget、视觉 primitives 和 Shell 状态不要在 `apps/desktop` 重写。
- 新增原生命令时必须把输入输出设计成清晰、可序列化、可测试的边界。

## 验证

- 桌面端普通前端验证优先运行 `pnpm --filter @kernelon/desktop build`。
- Tauri 打包验证在真正进入桌面端开发阶段再作为必选项；骨架阶段不要求每次运行 `tauri build`。
