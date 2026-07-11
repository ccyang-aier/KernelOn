# KernelOn 文档导航

本目录按“稳定事实、架构规则、决策记录、专题手册”分层。任务只读取与改动相关的入口，避免把全部产品、前端和后端背景同时装入上下文。

## 任务阅读矩阵

| 任务                         | 首要文档                                 | 按需补充                                              |
| ---------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| 产品规划、业务范围、跨端体验 | `product_planning_overview.md`           | 具体 UX 参考                                          |
| 前端总体架构、包边界         | `frontend_architecture.md`               | `app_frame_architecture.md`、`url_deeplink_design.md` |
| 后端、数据库、API            | `backend_architecture.md`                | `adr/0001-litestar-modular-monolith.md`               |
| App 窗口与统一框架           | `app_frame_architecture.md`              | `frontend-design/` 中对应视觉手册                     |
| URL 与深链                   | `url_deeplink_design.md`                 | 前端架构                                              |
| Liquid Glass 与视觉实现      | `frontend-design/liquid-glass-design.md` | integration playbook、样式专题、问题记录              |

## 文档分层

- `product_planning_overview.md`：产品目标、范围和长期产品隐喻；不是普通工程任务的默认必读材料。
- `frontend_architecture.md`：Web、Desktop 和共享包的稳定工程边界。
- `backend_architecture.md`：Litestar 模块化单体、数据、权限、契约和 WSL2 验证基线。
- `adr/`：已经做出的重要技术决策及其取舍。
- `frontend-design/`：视觉系统、动效和具体实现手册。
- `agents/`：对 agent 有价值的已知问题与排障记录，不是通用架构入口。
- `ux-references/` 与仓库 `ux/`：设计参考和研究材料，不作为代码契约。

## 维护约定

- README 提供导航，架构文档定义稳定规则，ADR 解释为何这样选择，专题文档描述如何实现。
- 同一规则只保留一个事实来源；其他文档通过链接引用，不复制整段内容。
- 新文档应放入上述层级，并在本页登记；临时调查结论若不再有维护价值应删除或归档。
