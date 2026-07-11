# KernelOn API

KernelOn 的独立 Litestar REST API。项目固定使用 Python 3.12，依赖由 `uv` 管理。

```powershell
Copy-Item .env.example .env
uv sync --locked
uv run litestar --app kernelon_api.asgi:create_app run --reload
```

数据库迁移和仓库级命令请参考根目录 `README.md` 与 `docs/backend_architecture.md`。正式后端验证统一在 WSL2 的 Conda `v20` 环境执行：

```bash
./scripts/api/check-wsl.sh
```

不要求在 Windows Python 环境重复验证；完整环境约束见本目录 `AGENTS.md`。
