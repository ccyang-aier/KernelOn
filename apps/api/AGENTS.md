# apps/api 后端开发指引

本文件约束 Litestar API、数据库、迁移和后端工程任务。仓库通用规则见根目录 `AGENTS.md`。

## 必读上下文

- 后端实现前阅读 `docs/backend_architecture.md`。
- 涉及技术选型时同时阅读 `docs/adr/0001-litestar-modular-monolith.md`。
- 只有改变产品能力、业务边界或跨端契约时，才阅读 `docs/product_planning_overview.md`。
- 后端任务不需要读取前端开发哲学、视觉设计或 Liquid Glass 文档。

## 技术与边界

- 固定使用 Python `>=3.12,<3.13`、Litestar 2、SQLAlchemy 2 async、Advanced Alchemy、PostgreSQL 17。
- 模块按 `domain/application/infrastructure/presentation` 组织，依赖方向遵循 `presentation/infrastructure → application → domain`。
- SQLAlchemy 实体不得直接作为 Controller 的公开输入输出；HTTP DTO 使用 Pydantic 2。
- Next.js 不直接访问业务数据库；公开业务接口固定在 `/api/v1`，契约以 OpenAPI 3.1 为准。
- 数据库结构只能通过迁移演进，禁止运行时 `create_all`；事务由应用用例显式控制。

## 唯一验证环境：WSL2

后端任务只要求在 WSL2 Linux 环境验证，不需要也不应重复在 Windows Python 环境执行后端检查。Windows 仅作为宿主机和编辑环境。

标准环境：

- WSL2 发行版：Ubuntu。
- Conda 安装：`$HOME/miniforge3`。
- Conda 环境：`v20`，Python 3.12.x。
- `uv` 位于 `v20` 环境；Node/pnpm 和 Docker Engine + Compose 在 WSL2 内可用。
- PostgreSQL 17 由根目录 `compose.yaml` 启动，默认端口 `5432`。
- Linux 验证在 `/tmp/kernelon-wsl-validation` 原生文件系统副本中运行，Python 虚拟环境默认是 `/tmp/kernelon-api-v20`，避免 `/mnt/c` 性能损耗和 Windows/Linux 依赖污染。

标准完整验证命令从 WSL2 执行：

```bash
./scripts/api/check-wsl.sh
```

脚本会使用 Conda `v20`，完成依赖同步、PostgreSQL 17 启动、迁移、真实数据库集成测试、全仓检查、OCI 构建、非 root 校验和 API readiness。网络不稳定时可显式覆盖镜像源：

```bash
KERNELON_PNPM_REGISTRY=https://registry.npmmirror.com \
KERNELON_PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple \
./scripts/api/check-wsl.sh
```

小范围后端改动可以先在同一 WSL2/`v20` 环境执行 Ruff、mypy 或定向 pytest；交付前按风险决定是否升级为完整脚本。数据库与迁移改动必须运行真实 PostgreSQL 集成验证。
