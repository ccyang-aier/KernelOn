# KernelOn 文档导航

本目录按“稳定事实、架构规则、决策记录、专题手册”分层。任务只读取与改动相关的入口，避免把全部产品、前端和后端背景同时装入上下文。

## 查阅触发条件

普通局部任务通常只需路径级 `AGENTS.md`、相关代码和测试。发生下列变化时再查阅专题资料：

| 变更类型                                                | 查阅文档                            |
| ------------------------------------------------------- | ----------------------------------- |
| 产品范围、业务能力、用户旅程或跨端产品边界              | `product_planning_overview.md`      |
| 新员工培养、导师带教、沟通记录或转正流程的 MVP 需求     | `new_employee_lifecycle_mvp_prd.md` |
| 前端分层、共享包职责、渲染/数据边界或跨端复用           | `frontend_architecture.md`          |
| 后端模块、事务、权限、数据策略、HTTP 契约或基础设施边界 | `backend_architecture.md`           |
| 重新评估已经确定的技术方向                              | `adr/` 中对应记录                   |
| App 窗口结构                                            | `app_frame_architecture.md`         |
| URL 与深链                                              | `url_deeplink_design.md`            |

Liquid Glass 资料按用途选择：设计原则查看 `frontend-design/liquid-glass-design.md`，新页面接入查看 `frontend-design/liquid-glass-integration-playbook.md`，具体样式查看 `frontend-design/styles-playbook/`，排查已知问题查看 `agents/` 与 `liquid-glass/`。不要求顺序读取整套资料。

## 文档分层

- `product_planning_overview.md`：产品目标、范围和长期产品隐喻；不是普通工程任务的默认必读材料。
- `new_employee_lifecycle_mvp_prd.md`：新员工培养与转正闭环的 MVP 范围、角色、状态、业务规则和验收基线。
- `frontend_architecture.md`：Web、Desktop 和共享包的稳定工程边界。
- `backend_architecture.md`：Litestar 模块化单体、数据、权限、契约和 WSL2 验证基线。
- `adr/`：已经做出的重要技术决策及其取舍，仅在重新评估相关方向时作为依据，不是普通开发任务的前置材料。
  - `0002-wallpaper-direct-delivery-and-storage-budget.md`：Wallpaper 外部直链、硬配额和媒体生命周期。
- `frontend-design/`：视觉系统、动效和具体实现手册。
- `agents/`：对 agent 有价值的已知问题与排障记录，不是通用架构入口。
- `ux-references/` 与仓库 `ux/`：设计参考和研究材料，不作为代码契约。

## 维护约定

- README 提供导航，架构文档定义稳定规则，ADR 解释为何这样选择，专题文档描述如何实现。
- 同一规则只保留一个事实来源；其他文档通过链接引用，不复制整段内容。
- 新文档应放入上述层级，并在本页登记；临时调查结论若不再有维护价值应删除或归档。
