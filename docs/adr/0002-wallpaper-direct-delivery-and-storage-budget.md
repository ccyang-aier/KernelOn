# ADR 0002：壁纸直链交付与硬配额存储

- 状态：已接受
- 日期：2026-07-14

## 背景

Wallpaper App 需要同时展示静态图片和静音循环视频，并聚合真正面向壁纸使用场景的内容。
“可访问、可播放”不等于“适合作壁纸”或“允许在 KernelOn 中交付”；新闻、会议、科普档案以及
没有逐资源权利证明的社区内容不进入可应用目录。若同步、代理或转码全部搜索结果，会快速消耗服务端磁盘和出口带宽，也会扩大
许可证风险。开发机不能因该功能默认安装 MinIO 或 FFmpeg。

## 决策

外部搜索结果只进入最多 5,000 条、TTL 10 分钟的进程内缓存，不同步到 PostgreSQL，也不保存
媒体文件。收藏或应用外部资源时只保存 provider、external id、许可证和元数据快照；播放前由
Provider 重新解析来源 URL。客户端直接加载外部媒体，KernelOn 不用无磁盘代理规避来源限制。

来源统一采用准入状态：`approved/direct` 可在 KernelOn 中预览和应用；`catalog-only` 只能展示
官方元数据并跳转官方平台；`pending-partnership` 在合作协议、内容分级和逐资源授权字段确认前不可启用。
Wallpaper Engine Workshop 首期为 `catalog-only`，只通过官方 Steam Web API 查询 Anime 目录，
不下载 Workshop 文件、不把预览图当动态壁纸、不提供导入或应用。Sucrose Store 为
`pending-partnership`，不抓取其社区内容。Hero 和推荐位只接受 KernelOn 自有、用户上传或已有明确
分发授权的 `approved/direct` 资源。

只有 KernelOn 系统资源、用户上传和用户明确确认且许可证允许的导入会进入持久媒体存储。
开发环境使用按需创建的 `.kernelon-data/wallpapers`，硬上限 1 GiB，不启动附加服务；生产环境
使用 S3 兼容对象存储，并由环境变量配置 50 GiB 平台硬上限。50 GiB 是拒绝写入的上限，不是
预分配空间。个人默认硬配额为 100 MiB，组织、平台、长期媒体和临时处理空间同时校验。

保存型动态壁纸只保留一个 H.264 MP4 主 rendition，以及 WebP 海报/缩略图。开发 passthrough
模式只接受浏览器可播放的 H.264 MP4；生产 transcode Worker 通过同库 Outbox 工作，成功后删除
原始输入。对象按 `system/`、`uploads/{organization}/{user}/`、`imports/...` 和 `temp/{job}/`
分区，同组织内可按 SHA-256 去重，不跨租户去重。

## 生命周期

- 未完成上传和失败处理输入最多保留 24 小时。
- 被替换 rendition 保留 7 天；用户删除媒体软删除 7 天后物理回收。
- 已完成任务保留 30 天，失败摘要保留 90 天但不保留媒体。
- 外部无引用快照在最后引用解除 30 天后删除。
- 每日核对对象与数据库引用并清理 multipart、旧版本、删除标记和孤儿对象。
- 70%/85%/95% 告警；95% 后停止上传和导入，但不影响已有播放。

## 影响

外部来源失效时必须回退海报，再回退 KernelOn 默认壁纸。搜索结果无法离线使用；需要离线或
稳定交付时必须显式导入并占用配额。视频不经过 BFF，因此来源必须允许浏览器/WebView 播放。
Provider 凭据和域名白名单只在服务端维护，客户端不接受任意 API URL。
