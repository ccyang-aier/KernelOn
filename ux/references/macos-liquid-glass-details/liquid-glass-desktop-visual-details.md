# macOS Liquid Glass 桌面视觉细节补充

> 研究日期：2026-06-28
> 目标：补充 KernelOn 桌面 UX 生成时需要遵守的最新 macOS Liquid Glass 视觉细节。上一版 `macos-desktop-structure-analysis.md` 解决“桌面由哪些层组成”，本文件解决“为什么图像要更清透、更像液态玻璃”。

## 1. 版本与参考口径

- **正式可安装版本**：以 Apple Support 当前列出的 macOS Tahoe 26.5.1 为正式版本口径。
- **最新设计方向**：Apple 官网已经展示 macOS 27 Golden Gate 预览，但标注为 coming this fall，因此只吸收其视觉方向，不把它作为已发布系统事实。
- **核心视觉语言**：Liquid Glass。Apple 对该材质的公开描述强调它会反射和折射周围内容，并通过镜面高光对用户动作产生动态反馈。这意味着它不是普通 `backdrop blur`，也不是白色半透明卡片。

## 2. 新增参考素材

| 文件 | 用途 |
| --- | --- |
| `01-liquid-glass-hero.jpg` | 跨设备 Liquid Glass 总览：Dock、图标、Widget 和系统浮层的统一材质 |
| `02-liquid-glass-home-clear-look.jpg` | clear look：最清透、最贴近用户反馈中“液态玻璃”的方向 |
| `03-liquid-glass-home-dark-tint.jpg` | tinted / dark tint：用于理解材质如何随外观变体改变透明度与对比 |
| `04-liquid-glass-icon-composer.jpg` | 图标多层材质、前景/中景/背景层叠和高光关系 |
| `05-macos-tahoe-hero-desktop.jpg` | Tahoe 桌面 hero：完整桌面、透明菜单栏、Dock、窗口与壁纸关系 |
| `06-macos-tahoe-lock-screen.jpg` | 大尺寸玻璃化时间与背景融合关系 |
| `10-macos-golden-gate-preview-og.png` | Golden Gate 预览口径，用于跟踪最新 macOS 方向 |

沿用上一批参考：

- `ux/references/macos-tahoe-26/04-macos-desktop-menu-bar-structure.png`
- `ux/references/macos-tahoe-26/05-macos-tahoe-control-center.jpg`
- `ux/references/macos-tahoe-26/06-macos-tahoe-window-liquid-glass.jpg`
- `ux/references/macos-tahoe-26/07-macos-dock-structure.png`
- `ux/references/macos-tahoe-26/08-macos-stage-manager.png`
- `ux/references/macos-tahoe-26/09-macos-notification-widgets.png`
- `ux/references/macos-tahoe-26/10-macos-spotlight-apps.png`

主要来源：

- Apple Newsroom: Apple introduces a delightful and elegant new software design
  https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/
- Apple Newsroom: macOS Tahoe 26 makes the Mac more capable, productive, and intelligent
  https://www.apple.com/newsroom/2025/06/macos-tahoe-26-makes-the-mac-more-capable-productive-and-intelligent-than-ever/
- Apple Support: macOS versions
  https://support.apple.com/en-us/109033
- Apple macOS preview
  https://www.apple.com/os/macos/

## 3. Liquid Glass 不是普通毛玻璃

上一版图 1 的问题是：结构正确，但材质更像“柔和半透明面板”，缺少 Liquid Glass 的真实感。新版本生成时必须强化以下细节：

1. **清透度更高**
   玻璃面板应该让壁纸颜色和明暗轮廓穿透进来，而不是变成一块奶白色卡片。特别是 Dock、菜单栏、Widget、Control Center 背板，要看到背景色被柔和折射。

2. **边缘有液态高光**
   圆角边缘要有一圈非常细的高光，局部还应出现类似镜面折射的亮边，而不是统一 1px 白描边。

3. **内部有分层折射**
   同一块面板里，按钮、滑块、搜索框、分隔线是叠在玻璃里的二级材料。它们不是简单白底，而是更小、更亮、更圆润的玻璃子层。

4. **阴影更轻但更准确**
   Tahoe 的浮层并不靠厚重阴影制造高级感，更多靠透明材质与背景关系制造层次。阴影应柔、低密度、贴边扩散。

5. **背景必须服务材质**
   如果壁纸太平或太灰，玻璃看不出清透；如果壁纸太碎，内容读不清。KernelOn 应使用蓝、青、银白、薄荷的流动抽象壁纸，让玻璃能折射出漂亮色彩，但业务内容仍可读。

## 4. 桌面各层视觉细节

### 4.1 Wallpaper

- 使用明亮、流动、柔和高光的抽象壁纸。
- 背景需要有大面积蓝白色带和少量清晰边界，方便玻璃材料表现折射。
- 避免大面积深蓝、紫色、黑色科技风。

### 4.2 Menu Bar

- 顶部菜单栏应接近完全透明，只保留轻微模糊和极薄高光。
- 左侧 `KernelOn`、当前 App 菜单、右侧状态 icon 和时间悬浮在壁纸之上。
- 不要做成传统导航条，也不要加大面积白色背景。

### 4.3 Dock

- Dock 是底部最重要的 Liquid Glass 物体：长圆角托盘、厚玻璃边缘、底部微反射、背景折射、图标投影。
- 图标本身也应有多层材质：前景符号、半透明高光、柔和体积阴影。
- 分隔线应像嵌在玻璃里的细竖线，不应像普通 UI 边框。

### 4.4 Widgets

- Widget 应更像贴在桌面上的透明玻璃贴片，而不是实体卡片。
- Widget 内容必须少：数字、趋势、小图、状态，不承载完整表格。
- 文字对比要足够高，必要时在文字底层有很轻的局部亮度罩层。

### 4.5 Windows

- 主窗口可以比 Widget 更不透明，但标题栏、侧边栏、工具栏应保留 Liquid Glass 感。
- 内容区保持清晰，避免整个业务窗口都高度透明导致阅读困难。
- 窗口控制点可保留还原感，但工程实现阶段要替换成 KernelOn 自有控件。

### 4.6 Control Center

- Control Center 是 Liquid Glass 密度最高的参考：多个圆形按钮、长条滑块、音乐/状态模块都在一个主玻璃面板内。
- 每个子控件要有独立小玻璃层，亮度比背板高。
- 滑块轨道要有半透明胶囊形底和清晰蓝色进度。

### 4.7 Spotlight

- Spotlight 应是更轻、更清透的浮层，居中或顶部居中，像系统级命令入口。
- KernelOn 文案应任务化：`生成导师匹配建议`、`查看培养进度`、`汇总本周风险`。
- 不要把 Spotlight 做成大聊天窗口。

### 4.8 Notifications / Stage Manager

- 通知卡片应该从右侧轻轻浮出，半透明但文字清楚。
- Stage Manager 的窗口堆叠启发可转译为 KernelOn 的“桌面空间/工作批次切换”，但本轮高还原图不需要复杂展示。

## 5. KernelOn 新一轮图像生成硬约束

本轮继续采用高还原策略，但必须比上一版图 1 更清透：

- 画面依旧是完整桌面截图，不要设备外壳，不要落地页。
- 顶部菜单栏要接近透明，不能像普通白色导航条。
- Dock 要有真实 Liquid Glass 厚度、折射、边缘高光和底部微反射。
- Widget、Control Center、Spotlight 的玻璃不能发灰、发雾、发白块。
- 主窗口内容区可以更实体，保证业务信息可读。
- 使用 KernelOn 自有业务 App 图标和中文业务术语，不能出现 Apple logo、macOS 字样或 Apple 官方 App 图标。
- 最好生成 3 个高还原分支：
  - **V2-A Clear Desktop**：最清透，桌面元素少，突出液态玻璃材质。
  - **V2-B Control Center Detail**：保留图 1 结构，但右侧控制中心与 Dock 材质显著增强。
  - **V2-C Window + Spotlight**：强调窗口标题栏、侧边栏、Spotlight 的玻璃层级。
