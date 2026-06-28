# KernelOn 系统桌面 UX 参考图

> 生成日期：2026-06-28
> 生成方式：内置 `image_gen` 工具
> 输入参考：`ux/kn.os/system/system-dock.png` 仅作为底部玻璃 Dock 的风格参考；macOS 真实结构参考见 `ux/references/macos-tahoe-26/macos-desktop-structure-analysis.md`。

## 1. 输出文件

| 版本 | 文件 | 定位 |
| --- | --- | --- |
| A | `kernelon-desktop-a-faithful-macos-inspired.png` | 高还原度 / 低创新。适合作为工程落地基线，结构最接近 macOS 桌面：透明菜单栏、桌面小组件、中央业务窗口、右侧控制中心、底部玻璃 Dock。 |
| B | `kernelon-desktop-b-balanced-ai-workspace.png` | 中还原度 / 中创新。推荐作为当前主视觉方向：保留 macOS 的空间秩序，同时突出 AI Spotlight、新员工运作、导师匹配和通知能力。 |
| C | `kernelon-desktop-c-innovative-talent-command.png` | 低还原度 / 高创新。适合作为概念上限：把桌面变成部门新人运行中枢，强化培养轨道、AI 运行建议和管理指标。 |

## 2. 推荐采用策略

当前最建议以 **B 版** 为主方向：

- 桌面系统结构清晰，不会退回传统后台页面。
- AI Spotlight 已经像系统能力，而不是单独聊天入口。
- 新员工运作和导师匹配两个核心 App 能在同一桌面空间内协作。
- 左侧指标 Widget、右侧通知、底部 Dock 的信息密度适合 Web 首期落地。

后续细化时可从 **A 版** 借鉴更稳的菜单栏、控制中心和窗口层级，从 **C 版** 借鉴“培养轨道”和 AI 运行建议的视觉记忆点。

## 3. Prompt Set

### A. 高还原度 / 低创新

```text
Create a premium, bright, macOS Tahoe 26 inspired 16:9 desktop screenshot for KernelOn. Use the provided Dock image only as a reference for a bottom glass tray, icon spacing, soft lighting, and rounded proportions. Show a complete desktop with transparent top menu bar, left widgets, one central "新员工运作" dashboard window, right Control Center popover, and a bottom Dock with custom KernelOn business app icons. Keep it bright, glassy, readable, and management-product oriented. Avoid Apple logo, macOS text, Apple app icons, page numbers, watermarks, dense paragraphs, or explanatory callouts.
```

### B. 中还原度 / 中创新

```text
Create a premium KernelOn desktop UX screenshot with medium macOS influence and medium KernelOn innovation. Show a bright abstract KernelOn wallpaper, transparent system bar, bottom glass Dock, left metrics widgets, two overlapping business windows for "新员工运作" and "导师匹配", right notification stack, and a centered AI Spotlight command palette with the query "为本周新人生成导师匹配建议". Use refined Chinese product UI, clear hierarchy, frosted glass surfaces, custom KernelOn icons, and practical business labels. Avoid Apple marks, copied Apple icons, dark theme, oversized hero text, and clutter.
```

### C. 低还原度 / 高创新

```text
Create an innovative KernelOn desktop UX screenshot with low macOS literal copying and high KernelOn originality. Keep it a real desktop OS with transparent top bar, glass Dock, widgets, windows, and AI command layer, but make the center a "培养计划编排" workspace with an orbit/timeline map of onboarding stages, mentor touchpoints, training checkpoints, and assessment gates. Add a right "AI 运行建议" panel and left metric widgets. Use bright pearlescent white, silver, cyan, mint, and minimal warm risk accents. Avoid Apple marks, copied icons, dense text, dark sci-fi styling, and marketing copy.
```

## 4. 设计注意

- 生成图中的红黄绿窗口控制保留了 macOS 还原感；工程实现阶段可替换为 KernelOn 自有窗口控件。
- Dock 图标语义建议稳定为：启动台、新员工、导师、档案、培训、考核、数据、资源、AI、消息、文件夹、文档、回收站。
- 桌面优先展示“可扫视信息”和“可立即执行动作”，复杂表格和流程进入 App 窗口内部。
- AI Spotlight 的文案应保持任务导向，例如“生成导师匹配建议”“识别延期风险”“汇总本周跟进”，不要做成泛聊天。
