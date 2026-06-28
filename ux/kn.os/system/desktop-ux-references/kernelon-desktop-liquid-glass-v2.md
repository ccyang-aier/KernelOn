# KernelOn 系统桌面 UX 参考图 V2：Liquid Glass 高还原

> 生成日期：2026-06-28  
> 生成方式：内置 `image_gen` 工具  
> 方向：延续上一轮图 1 的高还原策略，但重点提升 Liquid Glass 清透度、折射、边缘高光和 Dock/Control Center 的真实材质感。  
> 参考：`ux/references/macos-liquid-glass-details/liquid-glass-desktop-visual-details.md`

## 1. 输出文件

| 版本 | 文件 | 定位 |
| --- | --- | --- |
| V2-A | `kernelon-desktop-v2-a-liquid-clear.png` | 最清透的一版。整体接近 clear look，Dock 与窗口背后能看到明显壁纸折射，桌面空气感最好。 |
| V2-B | `kernelon-desktop-v2-b-liquid-control-center.png` | 推荐主方向。延续图 1 的结构，Control Center 与 Dock 的 Liquid Glass 厚度、边缘高光和嵌套控件最完整。 |
| V2-C | `kernelon-desktop-v2-c-liquid-spotlight.png` | 强化 AI Spotlight 和窗口层级，适合表达 KernelOn 的系统级 AI 命令入口。 |

## 2. 这次相对上一版的修正

- 顶部菜单栏从浅色导航条改为近透明系统层。
- Dock 从“白色半透明托盘”升级为更厚、更清透、有背景折射和底部微反射的 Liquid Glass。
- Widget、Control Center、Spotlight 增加了细边缘高光和内部嵌套玻璃层。
- 主窗口内容区保留足够不透明度，避免为了清透牺牲管理信息可读性。
- 保留 KernelOn 自有业务术语，不出现 Apple logo、macOS 字样或 Apple 官方 App 图标。

## 3. 推荐采用

首选 **V2-B** 作为下一轮 UI 实现/视觉拆解基准：

- 桌面结构仍然高还原，风险最低。
- Control Center、Dock、Widget 的材质最接近最新 Liquid Glass 方向。
- 新员工运作窗口的信息密度适合管理场景，不像纯视觉概念图。

V2-A 可作为“清透度上限”，V2-C 可作为 AI Spotlight 与通知中心的交互表达参考。

## 4. Prompt 摘要

### V2-A Clear Desktop

```text
Regenerate the high-faithfulness macOS-inspired KernelOn desktop, but make the visual material much more transparent, clear, liquid, and premium. Use ultraclear translucency, subtle magnification, thin specular rim highlights, thick rounded glass edges, soft inner glow, and light caustic-like edge distortion. Avoid milky opaque white cards.
```

### V2-B Control Center Detail

```text
Create a high-faithfulness Liquid Glass inspired KernelOn desktop focusing on exceptionally clear Dock and Control Center. Control Center and Dock are the visual heroes: ultraclear translucent glass, rounded thick edges, specular highlights, curved wallpaper refraction, light blue-tinted inner shadows, nested glass controls. KernelOn mark must be an original abstract K/kernel swirl, never Apple-like.
```

### V2-C Window and Spotlight

```text
Create a high-faithfulness Liquid Glass inspired KernelOn desktop focusing on transparent menu bar, glass app window chrome, and AI Spotlight. Spotlight is a compact system overlay with task actions, not a chat window. Main app window keeps readable content while titlebar/sidebar remain glassy.
```
