# KernelOn 后端架构

## 1. 定位

KernelOn 后端是部署在 `apps/api` 的 Litestar 2 模块化单体。Next.js 负责 Web 装配，Tauri 负责桌面宿主；两者都通过 REST/OpenAPI 契约访问业务能力。首期不拆微服务，所有模块共享一个 PostgreSQL 实例，但必须保持代码所有权和事务边界清晰。

## 2. 依赖规则

每个业务能力按 `domain → application ← infrastructure/presentation` 组织：

- `domain` 只包含标准库 dataclass、值对象、规则和领域事件。
- `application` 编排用例并声明仓储、时钟、通知或 AI 等端口。
- `infrastructure` 实现 SQLAlchemy 映射、仓储和外部适配器。
- `presentation` 使用 Litestar Controller、Pydantic DTO 与 Guard 转换 HTTP 协议。
- `bootstrap` 是唯一可以同时装配框架、应用端口和基础设施的组合根。

不建立跨领域万能 CRUD 层。模块不得直接读取其他模块的数据表；同步协作调用应用端口，解耦副作用使用领域事件。只有出现独立扩缩容、故障隔离或团队所有权要求时才拆服务。

## 3. 数据与事务

- SQLAlchemy ORM 仅属于 infrastructure，不能作为公开 API DTO。
- Advanced Alchemy `SQLAlchemyInitPlugin` 只管理 Engine、Session 与 CLI，不启用 ORM 自动序列化。
- 请求结束不自动提交；应用用例显式控制事务成功、回滚和并发检查。
- 禁止启动时 `create_all`，数据库结构只通过版本化迁移演进。
- 首个可靠异步任务出现时，引入与业务事务同库写入的 Outbox，再由独立 Worker 投递；当前不预装队列。

## 4. 多组织与权限

租户数据必须携带 `organization_id`，唯一约束和高频索引纳入组织维度。后续身份模型采用用户、组织成员、角色三层结构；RBAC 负责能力授权，本人、导师关系、负责人等规则在应用用例内做资源级校验。

Litestar Guard 只处理认证和粗粒度进入权限。组织上下文和 Principal 通过显式依赖注入传给用例，Repository 查询必须接收组织作用域，客户端提供的组织 ID 不能直接成为可信安全事实。

## 5. HTTP 契约与错误

- 业务路由固定使用 `/api/v1` 前缀。
- OpenAPI 3.1 operation ID 必须稳定，未来由它生成 TypeScript 客户端。
- 错误统一返回 RFC 9457 `application/problem+json`，附带稳定 `errorCode` 与 `requestId`。
- `/health/live` 只检查进程；`/health/ready` 检查数据库但不泄漏连接信息。
- 生产环境默认关闭交互式 Schema UI，CORS 与 Allowed Hosts 必须显式配置。

本地 Compose 使用 PostgreSQL 17，宿主机和容器网络默认端口均为 5432，并允许通过环境变量覆盖宿主端口。迁移和集成测试必须验证 `alembic_versions` 已处于唯一 Head。

## 6. 后端验证环境

后端以 Linux 作为唯一交付验证基线。所有后端任务只需在 WSL2 Ubuntu 中验证，不要求在 Windows Python 环境重复执行；Windows 只作为编辑与 WSL2 宿主环境。

- 使用 `$HOME/miniforge3` 中的 Conda `v20` 环境，Python 必须为 3.12.x。
- `uv` 安装在 `v20`；Docker Engine、Compose、Node 与 pnpm 在 WSL2 内执行。
- PostgreSQL 17 由根目录 Compose 管理，真实数据库检查必须覆盖迁移 Head 和 readiness。
- 完整验证复制到 `/tmp/kernelon-wsl-validation`，并使用 `/tmp/kernelon-api-v20` 虚拟环境，避免 `/mnt/c` 文件系统性能损耗及跨平台依赖污染。
- 标准入口为 `./scripts/api/check-wsl.sh`；镜像源覆盖和定向验证规则见 `apps/api/AGENTS.md`。

## 7. 未来模块

Identity、Organizations、Onboarding、Mentorship、Growth、Training、Assessment、Notifications、Audit、Integrations 和 AI 仅在出现首个真实用例时创建。AI provider 位于 infrastructure，通过 application port 被调用，不能进入核心领域模型。
