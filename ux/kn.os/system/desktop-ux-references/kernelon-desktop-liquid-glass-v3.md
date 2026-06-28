# KernelOn 系统桌面 UX 参考图 V3：干净桌面与真实 Liquid Glass

> 生成日期：2026-06-28
> 生成方式：内置 `image_gen` 工具
> 输入壁纸：`ux/kn.os/wallpapers/image-1.png`
> 用户参考图：`ux/references/user-liquid-glass-ui/`

## 1. 本轮修正目标

上一轮的问题是把 Liquid Glass 做成了“亮白高光 + 毛玻璃卡片”。本轮改为抓参考图中的真实细节：

- 玻璃应该继承环境色，而不是一味发白。
- 组件边缘像被压出来的厚玻璃，有细 rim、内阴影和轻微凹凸。
- 背景应真实穿透并被轻微折射，不能变成奶白雾面。
- 桌面保持干净，只展示系统级小组件、状态栏、Dock 和控制浮层。
- 不展示 `新员工运作` 或其他业务 App 窗口。

## 2. 输出文件

| 版本 | 文件 | 定位 |
| --- | --- | --- |
| V3-A | `kernelon-desktop-v3-a-clean-widgets.png` | 干净系统桌面基线：天气、日历、时钟、顶部状态栏和 Dock。 |
| V3-B | `kernelon-desktop-v3-b-control-cluster.png` | 推荐重点参考：控制中心组件最接近用户给的绿色 Liquid Glass 控件组。 |
| V3-C | `kernelon-desktop-v3-c-widget-only.png` | 最干净的 Widget-only 桌面：中心保留壁纸，左侧系统小组件构成桌面感。 |
| V3-D | `kernelon-desktop-v3-d-pill-dock.png` | Dock / 导航胶囊方向：参考蓝色 pill nav 和灰色浮雕按钮，底部控件形体更强。 |

## 3. 推荐采用

推荐把 **V3-B + V3-D** 作为下一轮 KernelOn 桌面视觉基准：

- V3-B 用于控制中心、快捷开关、系统浮层。
- V3-D 用于 Dock、AI 搜索胶囊、底部导航形体。
- V3-C 用于桌面默认态布局，因为它最干净，不会抢壁纸主体。

## 4. 参考图细节拆解

- `01-control-cluster-green-glass.png`：控件不是白色玻璃，而是深绿透明实体；圆形与胶囊边缘有压痕和内阴影。
- `02-settings-panel-dark-tinted-glass.png`：大面板可以很透明，但文字区域要用暗色背景保证可读。
- `03-weather-widget-dark-clear-glass.png`：Widget 的关键是大字号、少文字、深色透明底和细边框，不是堆叠很多内容。
- `04-pill-dock-blue-glass.png`：Dock/导航可以是长胶囊，内部图标独立排布，亮边只在轮廓和局部高光上出现。
- `05-raised-gray-glass-buttons.png`：按钮边缘应有真实凹凸和圆润厚度，避免普通 1px 描边。

## 5. Prompt 摘要

```text
Use the supplied flower wallpaper as the full-screen desktop background.
Create a clean KernelOn OS desktop with no business apps and no open application window.
Show only system-level widgets, top status bar, Dock, and optional control cluster.
Liquid Glass should inherit the wallpaper color: dark teal/green transparent glass, low haze, pressed rims, inner shadows, subtle lens distortion, restrained highlights.
Avoid milky white panels, excessive bright strokes, dense text, dashboard content, Apple marks, macOS text, and Apple app icons.
```
