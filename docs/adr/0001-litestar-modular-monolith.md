# ADR 0001：采用 Litestar 模块化单体后端

- 状态：已接受
- 日期：2026-07-11

## 背景

KernelOn 同时服务 Next.js Web 和 Tauri 桌面端，业务包括组织、人员、导师、流程、权限、审计和 AI 集成。后端需要独立于具体客户端，并能在内部产品规模下保持快速迭代。

## 决策

使用 Python 3.12、Litestar 2、PostgreSQL、SQLAlchemy 2 和 Advanced Alchemy，构建独立 REST API 模块化单体。跨语言契约以 OpenAPI 3.1 为准。首期单进程、单数据库部署，不提前引入微服务或消息代理。

选择 Litestar 是因为它原生提供 Controller/Router、分层依赖注入、Guard、生命周期、OpenAPI 3.1、RFC 9457、测试客户端和插件机制，同时与 Python AI 生态自然衔接。选择稳定的 Litestar 2.24 系列，暂不采用 3.0 beta。

## 被替代方案

- Next.js 内嵌业务后端：与 Tauri 共享能力和独立演进边界不足。
- FastAPI：成熟可用，但本项目明确选择 Litestar 更完整的框架级模块与插件能力。
- NestJS：与前端同语言，但不具备 Python AI 生态的一致性优势。
- Go：运行特性优秀，但性能不是当前瓶颈，会增加语言和工具链成本。
- 起步微服务：在当前团队与业务规模下增加部署、事务和可观测复杂度，没有对应收益。

## 影响

仓库新增 Python/uv 工具链，前后端不能共享运行时类型，必须维护 OpenAPI 契约纪律。换来的收益是 Web、Tauri 和未来集成共享稳定业务 API，并能在模块边界成熟后按实际需要拆分服务。
