# KernelOn 视觉验收记录

## 桌面右键菜单（既有验收记录）

**Findings**

- No blocking issues found in the latest visual QA pass.

**Source Visual Truth**

- Original UX reference: `C:\Users\17335\AppData\Local\Temp\codex-clipboard-a2641aa2-5e23-4a82-8570-e0fb02d16f75.png`
- Active-state feedback reference: `C:\Users\17335\AppData\Local\Temp\codex-clipboard-480ef021-ba85-438b-a272-177a48a21ca5.png`
- Surface halo feedback reference: `C:\Users\17335\AppData\Local\Temp\codex-clipboard-68f04463-4477-4b37-8ec1-e4e9ec0c054c.png`
- Latest direction: match the bottom Dock material directly, including the green-gray translucent film, shared blur/saturation, border weight, and shadow model. The active menu item should not read as a white highlighted pill.

**Implementation Evidence**

- Latest Dock-matched capture: `C:\Users\17335\AppData\Local\Temp\kernelon-context-menu-dock-material.png`
- Latest icon + capsule capture: `C:\Users\17335\AppData\Local\Temp\kernelon-context-menu-icons-capsule.png`
- Viewport target: 1620 x 971
- State target: desktop right-click at x=338, y=168; `个性化` submenu open; `个性化` parent item active with the Dock-style highlight.

**Required Fidelity Surfaces**

- Surface material: the context menu and submenu now share `dockGlassSurfaceStyle` with the Dock: `linear-gradient(180deg, rgba(255,255,255,0.30), rgba(238,246,231,0.14), rgba(104,147,118,0.16))`, `blur(14px) saturate(174%) contrast(106%)`, and the Dock shadow stack.
- Active state: hovered/pressed menu items now use a shared-layout Motion capsule with a light spring rebound. The shadow is intentionally weak (`0 4px 10px rgba(5,24,9,0.08)`) so the pill reads clean and translucent instead of heavy or gray.
- Edge treatment: the custom LiquidGlassEdgeOverlay was removed from context menus so the menu does not add extra white rims that the Dock does not have.
- Structure: internal menu divider lines remain removed from both the main menu and submenu.
- Geometry: compact 274 x 200 main menu and 236 x 156 submenu geometry remain intact, with an 8px gap between the main menu and submenu.
- Rhythm: the main menu rows use a consistent 36px step with no special spacer between `鏂板缓` and `閫氱煡涓庡緟鍔?`.
- Icons: every first-level and second-level menu item has a Lucide icon, using rounded strokes and consistent 14-15px optical sizing.
- Copy and content: menu labels match the requested UX, with the requested `新建` submenu demo: `新人档案`, `导师匹配`, `培训任务`, `资源文档`.

**Patches Made In This Pass**

- Extracted the Dock material into shared `dockGlassSurfaceStyle`.
- Reused that shared Dock material for right-click menu and submenu surfaces.
- Changed menu borders to `border-white/40` for a thinner, more translucent rim.
- Removed the menu-only Liquid Glass edge overlay.
- Replaced the active row token with `dock-glass` and a Dock-derived green-gray highlight.
- Moved the active state into a Motion `layoutId` capsule with spring physics, keeping the transition transform/layout-based in the spirit of the GSAP guidance without adding a new runtime dependency.
- Added icon affordances for all main and submenu commands using the existing Lucide React dependency.
- Added test coverage that checks menu/submenu surface material, lighter capsule shadow, icon counts, submenu placement, and guards against the old white/cyan active effect.

**Verification**

- Browser visual capture: passed; latest screenshot saved at `C:\Users\17335\AppData\Local\Temp\kernelon-context-menu-dock-material.png`.
- Browser page identity: `http://127.0.0.1:3000/`, title `KernelOn`.
- Browser material check: Dock and menu computed backgrounds match exactly.
- Browser blur check: Dock and menu computed backdrop filters match exactly.
- Browser DOM check: main and submenu `separatorCount` are both 0.
- Browser active check: active item uses `data-highlight-tone="dock-glass"` and a green-gray Dock-style gradient.
- Browser geometry check: main row y positions were 179, 215, 251, 287, and 323; submenu left was 620, confirming the 8px menu gap.
- Browser icon check: 9 menu icons were rendered across the visible main menu and submenu.
- Browser interaction note: browser automation could not force a hover switch through the app browser pointer bridge in this pass; unit coverage verifies hover switching and submenu replacement.
- Browser console health: no errors or warnings captured before interaction. The only framework portal detected was an empty Next dev tools portal, not an error overlay.
- `pnpm --filter @kernelon/shell test`: passed, 6 tests.
- `pnpm --filter @kernelon/shell typecheck`: passed.
- `pnpm --filter @kernelon/web build`: passed.
- `pnpm --filter @kernelon/desktop build`: passed.

**Follow-up Polish**

- P3: wire actual command handlers for each menu item when the corresponding KernelOn settings and creation surfaces exist.

final result: passed

---

## Mineradio 首页与首次引导

## 验收目标与来源

- 原版运行对照：`http://127.0.0.1:3100/`
- 正式实现：`http://127.0.0.1:3000/workspace` 中的 Mineradio 窗口
- 源码参照：`open_source/Mineradio/public/index.html`
- 用户参考图：
  - `C:/Users/17335/AppData/Local/Temp/codex-clipboard-5b5d0017-7d43-4bdd-89e3-8a352f3a9062.png`
  - `C:/Users/17335/AppData/Local/Temp/codex-clipboard-5ef8d327-bf69-4d06-98dd-394e95ae71ff.png`
  - `C:/Users/17335/AppData/Local/Temp/codex-clipboard-411274f4-715c-49bb-987b-2204edf7aa5f.png`
- 本轮证据：
  - `artifacts/design-qa/mineradio-original-1600x900.png`
  - `artifacts/design-qa/kernelon-mineradio-home-1600x900.png`
  - `artifacts/design-qa/kernelon-mineradio-guide.png`

验收期间使用过仅供无登录截图的 `/qa-music` 临时路由；完成截图后已删除，正式交付不包含该路由。

## 视口与状态

- 主对比视口：1600 × 900，桌面全屏音乐窗口，在线推荐加载完成，尚未播放。
- 首次进入状态：六步引导第 1 步，背景首页已加载。
- 辅助响应式检查：1280 × 720，全屏与普通窗口。
- 已确认首页状态下播放器隐藏；播放后由现有播放流程恢复舞台与播放器。

## 全视图对比

| 项目 | 原版 | 当前实现 | 结论 |
| --- | --- | --- | --- |
| 首页层级 | 左侧施工占位，右侧 2×3 主卡和推荐横轨 | 按产品要求删除施工占位，2×3 主卡和推荐横轨居中扩展 | 通过，属于明确的产品差异 |
| 搜索 | 顶部居中，来源标签不抢占首屏 | 顶部居中；来源标签默认收起、聚焦后显示 | 通过 |
| 主卡 | 深色玻璃、两列三行、大封面、清晰标题层级 | 尺寸、圆角、边框、封面和文案层级一致 | 通过 |
| 推荐横轨 | 5 张真实封面卡 | 5 张在线推荐封面卡 | 通过 |
| 背景 | 黑色星粒背景，内容层位于粒子之上 | 粒子亮度受控，卡片保持清晰对比 | 通过 |
| 空场控制台 | 未播放时不占首页底部空间 | 首页隐藏，播放后恢复 | 通过 |

## 聚焦对比与迭代历史

1. 初始实现是通用 3×2 小卡网格，缺少推荐横轨和首次引导；判定不通过。
2. 第一轮恢复 2×3 + 横轨后，底部播放器持续占位导致三行主卡被压缩为约 64px 高横条；判定不通过。
3. 第二轮按原版空场行为隐藏播放器，全屏主卡恢复为约 108–117px，高度和封面层级清晰；判定通过。
4. 搜索来源标签曾覆盖第一行卡片；改为默认隐藏、搜索聚焦后出现，复验通过。
5. 在线封面出现 HTTP 源导致代理拒绝；对白名单媒体域安全升级为 HTTPS，并增加图片加载失败回退，复验所有可见封面均完成加载。

## 交互、状态与无障碍

- 六步引导：下一步、跳过、点击空白继续、Enter/右方向键继续、Escape 跳过均已实现；进度和完成文案正确。
- 搜索：输入框可聚焦，聚焦后来源标签透明度由 0 变为 1。
- 视觉控制台：入口可打开，`data-open=true` 已验证。
- 首页卡和推荐卡均使用语义化 `button`；搜索、快捷操作和引导使用可访问名称。
- 1280 × 720 下保持两列主卡和完整推荐横轨；窄屏切换单列主卡和双列推荐。
- 浏览器控制台 error/warn：0。

## 工程验证

- `pnpm --filter @kernelon/modules test -- music-home.test.tsx`
- `pnpm --filter @kernelon/modules typecheck`
- `pnpm --filter @kernelon/web build`
- `git diff --check`

final result: passed
