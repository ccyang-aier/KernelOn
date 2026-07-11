# packages 共享前端包开发指引

包内局部修改直接遵循本文件和现有代码。改变包职责、跨包依赖、`loaderKey` 或 runtime registry 时，查阅 `docs/frontend_architecture.md`。修改 Liquid Glass 时，从 `docs/README.md` 按任务选择设计、接入、样式或排障文档，不默认读取整套资料。

## 包边界

- `core` 保持纯 TypeScript，不依赖 React，承载稳定类型、模型和纯函数。
- `catalog` 只保存可序列化的 App/Widget manifest、分类、默认布局与稳定 `loaderKey`。
- `modules` 承载可动态加载的业务 App 和 Widget。
- `shell` 承载 Web OS 客户端壳层与本地 UI 状态，只通过 manifest、布局和 runtime registry 发现模块。
- `ui` 只放可复用视觉与交互 primitives，不承载业务流程或客户端 store。
- App/Widget 必须提供稳定 `loaderKey` 并在运行时注册表建立映射；Shell 不得静态导入和渲染全部模块。

## 共享前端原则

- 组件、类型、hooks、测试和局部常量优先物理就近；只有真实复用和稳定契约出现时才抽象。
- 文件拆分依据职责和变化原因，而不是机械行数。
- 远端数据、复杂表单流、审批状态机和协同状态不进入 Zustand。
- 视觉、可访问性、加载态和异常态属于组件契约的一部分。

## 验证

- 优先运行受影响包的 `typecheck`、`test` 和必要的 build。
- 修改公共契约、runtime registry 或跨包依赖时运行完整 `pnpm check`。
