# KernelOn API

KernelOn 的独立 Litestar REST API。项目固定使用 Python 3.12，依赖由 `uv` 管理。

## WSL2 开发环境

后端统一在 WSL2 Ubuntu 中开发和验收，Windows 只作为宿主机与编辑环境，不重复运行 Windows Python 验证。

- Conda 默认安装在 `$HOME/miniforge3`。
- 使用 Conda 环境 `v20`，Python 必须为 3.12.x。
- `v20` 中需要 `uv`；WSL2 中需要 Node、pnpm、Docker Engine 与 Compose。
- PostgreSQL 17 由仓库根目录 `compose.yaml` 管理，默认端口为 `5432`。
- 完整验证脚本会将仓库同步到 `/tmp/kernelon-wsl-validation`，并使用 `/tmp/kernelon-api-v20` 作为 Linux Python 环境，避免 `/mnt/c` 性能损耗和跨平台依赖污染。

在 WSL2 的仓库根目录执行完整验证：

```bash
./scripts/api/check-wsl.sh
```

脚本覆盖依赖同步、PostgreSQL 17、迁移、真实数据库集成测试、全仓检查、OCI 构建、非 root 用户和 API readiness。网络不稳定时可覆盖依赖镜像源：

```bash
KERNELON_PNPM_REGISTRY=https://registry.npmmirror.com \
KERNELON_PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple \
./scripts/api/check-wsl.sh
```

## 常用命令

以下命令均从仓库根目录在 WSL2 中执行：

```bash
pnpm dev:api
pnpm lint:api
pnpm typecheck:api
pnpm test:api
pnpm db:upgrade
pnpm db:make-migration
```

数据库迁移和架构规则见 `docs/backend_architecture.md`；日常任务约束见本目录 `AGENTS.md`。
