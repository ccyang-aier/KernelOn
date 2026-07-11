# KernelOn 仓库级开发指引

本文件只保存所有任务都需要遵守的仓库级规则。前端、后端和桌面端的专属约束位于对应目录的 `AGENTS.md`，不要在根文件重复加载领域细节。

## 项目定位

- KernelOn 是面向新员工运作的 Web OS 式管理平台，覆盖入职、导师匹配、成长档案、培训、考核、数据看板和资源沉淀。
- 当前主交付面是 Web；Tauri 桌面端是后续扩展与共享能力验证面；移动端不在当前阶段。
- Next.js 负责 Web 与 BFF 装配，Litestar 是业务事实、权限、事务和持久化的来源，Tauri 作为独立宿主复用共享包。

## 按任务读取文档

先判断任务范围，再读取相应入口；不要为无关任务加载整套文档。

| 任务范围                         | 必读入口                                                  |
| -------------------------------- | --------------------------------------------------------- |
| 产品范围、业务能力或跨端架构决策 | `docs/product_planning_overview.md`、`docs/README.md`     |
| 后端、数据库、API、迁移          | `apps/api/AGENTS.md`、`docs/backend_architecture.md`      |
| Next.js Web 装配                 | `apps/web/AGENTS.md`、`docs/frontend_architecture.md`     |
| 共享 Shell、App/Widget、UI 包    | `packages/AGENTS.md`、`docs/frontend_architecture.md`     |
| Tauri 桌面端                     | `apps/desktop/AGENTS.md`、`docs/frontend_architecture.md` |
| 具体视觉系统或交互专题           | 由 `docs/README.md` 选择对应专题文档                      |

只有在改变产品定位、业务边界、用户旅程或跨端架构时，才必须阅读产品规划。修复局部测试、脚本、数据库迁移或纯工程问题不要求读取整份产品规划。

## 全局工程规则

- 使用简体中文沟通和维护中文产品术语，除非用户明确要求英文。
- 改动聚焦当前请求；保留工作树中已有且不属于本任务的用户改动。
- 新增生产依赖前，先确认现有技术栈能否覆盖需求。
- 使用 `pnpm` 管理 workspace；Python 后端依赖由 `uv` 管理。
- 验证应按改动范围选择最小充分集合。跨端或仓库级变更才运行完整 `pnpm check`。
- 所有任务结束前执行 `git diff --check`。
- 每次任务完成后，将当前工作树全部内容暂存、提交并推送远端仓库。

## 文档维护规则

- `README.md` 只承担项目入口、快速开始和常用命令，不堆放完整设计规范。
- `docs/README.md` 是文档导航和任务阅读矩阵。
- 稳定架构规则放在对应架构文档；具体技术决策放在 `docs/adr/`；视觉研究与实现手册放在 `docs/frontend-design/`。
- 路径级执行约束写入最近的 `AGENTS.md`，不要把仅适用于某个子系统的规则上提到根目录。
- 文档移动或重命名时同步修复仓库内引用，避免复制出多个事实来源。
