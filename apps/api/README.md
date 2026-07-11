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

## 初始化用户与组织

数据库迁移完成后，通过安全交互命令创建首个组织、预置角色和所有者。密码从隐藏输入读取，不会出现在命令历史中：

```bash
uv run --project apps/api python -m kernelon_api.cli bootstrap-organization \
  --organization-name "示例部门" --code example \
  --email owner@example.com --display-name "平台所有者"
```

全局停用或恢复账号仅开放给运维 CLI；组织管理员通过 API 暂停本组织成员，不能影响该账号在其他组织的身份：

```bash
uv run --project apps/api python -m kernelon_api.cli disable-account --email user@example.com
uv run --project apps/api python -m kernelon_api.cli enable-account --email user@example.com
```

认证接口位于 `/api/v1/auth`。组织管理接口位于 `/api/v1/organizations/{organizationId}`；服务端会根据访问令牌和组织成员关系重新计算有效权限，不信任客户端声明的组织或角色。

数据库迁移和架构规则见 `docs/backend_architecture.md`；日常任务约束见本目录 `AGENTS.md`。
