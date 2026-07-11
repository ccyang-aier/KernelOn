# KernelOn API

KernelOn 的独立 Litestar REST API。项目固定使用 Python 3.12，依赖由 `uv` 管理。

```powershell
Copy-Item .env.example .env
uv sync --locked
uv run litestar --app kernelon_api.asgi:create_app run --reload
```

数据库迁移和仓库级命令请参考根目录 `README.md` 与 `docs/backend_architecture.md`。
