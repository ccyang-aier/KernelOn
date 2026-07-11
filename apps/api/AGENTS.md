# apps/api 后端开发指引

本文件约束 Litestar API、数据库、迁移和后端工程任务。仓库通用规则见根目录 `AGENTS.md`。

## 上下文

普通后端任务直接遵循本文件和现有代码。新增或改变模块、持久化、事务、权限、HTTP 契约、外部集成或基础设施边界时，先查阅 `docs/backend_architecture.md`。只有准备重新评估现有技术方向时，才查阅相关 ADR。

## 技术与边界

- 固定使用 Python `>=3.12,<3.13`、Litestar 2、SQLAlchemy 2 async、Advanced Alchemy、PostgreSQL 17。
- 模块按 `domain/application/infrastructure/presentation` 组织，依赖方向遵循 `presentation/infrastructure → application → domain`。
- SQLAlchemy 实体不得直接作为 Controller 的公开输入输出；HTTP DTO 使用 Pydantic 2。
- Next.js 不直接访问业务数据库；公开业务接口固定在 `/api/v1`，契约以 OpenAPI 3.1 为准。
- 数据库结构只能通过迁移演进，禁止运行时 `create_all`；事务由应用用例显式控制。

## 唯一验证环境：WSL2

后端唯一验收环境是 WSL2 Ubuntu 的 Conda `v20`（Python 3.12.x），不在 Windows Python 环境重复验证。

标准完整验证命令从 WSL2 执行：

```bash
./scripts/api/check-wsl.sh
```

小范围后端改动可以先在同一 WSL2/`v20` 环境执行 Ruff、mypy 或定向 pytest；交付前按风险决定是否升级为完整脚本。数据库与迁移改动必须运行真实 PostgreSQL 集成验证。

环境准备、临时目录和镜像源配置见本目录 `README.md`。
