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

## 黑桃局大厅二次精修

### 视觉证据

- 原始 UX：`C:/Users/17335/AppData/Local/Temp/codex-clipboard-0f814b91-f9f4-4760-a393-22aa079bcb10.png`
- 用户反馈前实现：`C:/Users/17335/AppData/Local/Temp/codex-clipboard-16b5741d-e977-452b-8dd7-4f8089f5aa0b.png`
- 最终实现：`output/playwright/poker-lobby-refinement-final.png`
- 全画布并排对照：`output/playwright/poker-lobby-refinement-comparison.jpg`
- 侧栏聚焦对照：`output/playwright/poker-lobby-sidebar-comparison.jpg`
- 对照视口：1536 × 1024；窗口边界沿用 UX 的 x=18、y=19、width=1512、height=954。

### 本轮修正

- P1：宽屏下整体 UI 偏大。新增基于宿主可用宽高比的密度控制，宽屏最多收敛到 0.84，同时反向补偿布局轨道，避免卡片变小后出现空洞。
- P1：侧栏品牌徽章存在方形底色。改用亮度混合与径向遮罩，让徽章与侧栏材质自然融合；同步校准 200px 侧栏、60px 激活项、徽章标题和会员卡位置。
- P1：主区域比例偏离。最终校准为 64px 顶栏，以及 339 / 203 / 238px 的主视觉、快速开局、底部社区三段高度。
- P2：激活态过亮、偏绿。改为更深的猎人绿渐变、金色细边和弱内发光，保留点击压缩、悬浮抬升与键盘焦点反馈。
- P2：会员卡文字换行、徽章偏小。固定单行文案并放大徽章视觉内容，保留紧凑版式。
- P2：窗口级组件过于臃肿。将 800 余行窗口拆为 Chrome、牌桌、社区、反馈层和 Controller Hook，窗口编排层缩减至约 110 行。

### 交互与工程检查

- 搜索筛选、换一批、主桌入座/继续游戏确认、非大厅导航反馈、会员入口、在线人数、通知、钱包、好友邀请和任务领取均有闭环反馈。
- 浏览器实测任务领取后进入禁用已领取状态；导航到尚未实现页面不会错误改变大厅 `aria-current`。
- 浏览器控制台 error/warn：0；临时 `/qa-poker` 验收路由在取证后已删除。
- `pnpm --filter @kernelon/modules typecheck`：通过。
- Poker 定向测试：2 个文件、5 个测试通过。
- `pnpm lint:web`：通过。
- `pnpm test:web`：全部通过（模块 24 文件 / 98 测试，连同 Core、UI、Catalog、Shell、Web、Desktop 全部通过）。
- `pnpm build:web`：通过；Web 与 Desktop 正式构建成功。

final result: passed

---

## 黑桃局侧栏节奏与动效精修

### 视觉证据与状态

- 视觉基准：`C:/Users/17335/AppData/Local/Temp/codex-clipboard-0f814b91-f9f4-4760-a393-22aa079bcb10.png`
- 最终实现：`output/playwright/poker-sidebar-refinement-final.png`
- 全画布并排对照：`output/playwright/poker-sidebar-refinement-comparison.jpg`
- 侧栏聚焦对照：`output/playwright/poker-sidebar-refinement-focus.jpg`
- 视口：1536 × 1024；状态：大厅激活、无悬停、无弹窗。

### 比较历史与修正

- P1（布局节奏）：上一版侧栏 200px，菜单项高 60px 且没有独立间距，形成连续堆叠感。修正为 224px 侧栏、48px 菜单项和 8px 垂直间距；2048 × 1080 宽屏实测仍保持 224 / 48 / 8 的可视几何。
- P1（激活态）：上一版只有单层深绿高亮。修正为猎人绿多层渐变、金色描边、左侧 3px 光轨、顶部细高光、独立图标徽章和低频呼吸状态点，层级更接近高级桌面游戏客户端。
- P2（品牌比例）：侧栏变宽后徽章显得偏小。将品牌区域增至 168px、徽章画布增至 126px，最终对照中品牌区与菜单起始位置重新取得平衡。
- P2（点击反馈）：非当前菜单缺少反馈。新增按压缩放、2px 横向跟手、图标回弹和 560ms 金色扫光；不改变页面或大厅 `aria-current`。
- Post-fix：全图及侧栏聚焦对照未发现剩余 P0 / P1 / P2；较宽侧栏属于本轮用户明确要求，不作为相对原 UX 的偏差处理。

### 五项保真检查

- 字体与文案：保持现有中文字体栈、15px 半粗菜单层级和原菜单文案，无换行或截断。
- 间距与布局：224px 侧栏、48px 行高、8px 行距；会员卡仍完整落在安全区域。
- 色彩与令牌：延续黑、猎人绿和古金配色；激活态对比度明确但未出现高饱和荧光感。
- 图像质量：继续使用真实徽章资产与 Lucide 图标，未新增占位或代码模拟图像。
- 交互与可访问性：大厅保留 `aria-current="page"`；其它菜单点击后页面 URL 不变；键盘焦点环和 reduced-motion 降级保留。

### 验证

- 浏览器点击“牌桌”后 `data-nav-feedback="pulse"`，大厅仍为 `aria-current="page"`，URL 保持 `/qa-poker`。
- 浏览器控制台 error/warn：0；临时 `/qa-poker` 路由在取证后已删除。
- `pnpm --dir packages/modules exec vitest run tests/poker-lobby-window.test.tsx tests/runtime.test.ts`：2 个文件、5 个测试通过。
- `pnpm --filter @kernelon/modules typecheck`、`pnpm --filter @kernelon/web typecheck`、`pnpm lint:web`：通过。
- `pnpm build:web`：通过；Web 与 Desktop 正式构建成功。

final result: passed

---

## 黑桃局德州扑克大厅

### 验收目标与证据

- 原始 UX：`C:/Users/17335/AppData/Local/Temp/codex-clipboard-0f814b91-f9f4-4760-a393-22aa079bcb10.png`
- 最终实现截图：`output/playwright/poker-lobby-implementation-3.png`
- 同画布并排对比：`output/playwright/poker-lobby-comparison-final.jpg`
- 精确验收入口：验收期间临时使用 `/qa-poker`，截图完成后已删除；正式交付仅保留 KernelOn App 入口。
- 正式 App 入口：KernelOn Dock 的“黑桃局”，manifest id 为 `poker`
- 对比视口：1536 × 1024；窗口边界 x=18、y=19、width=1512、height=954。

### 视觉比对与修正

- P0：未发现阻断问题；大厅完整可见，没有崩溃、空白、遮挡或主要内容缺失。
- P1：首轮 Web OS 顶栏与 Dock 压缩窗口高度；验收阶段使用基于同一 AppWindowContainer 和 PokerLobbyWindow 的临时精确入口，恢复参考图的 1536 × 1024 画布与窗口边界，验收结束后删除临时路由。
- P1：首轮三段主内容按比例填满，导致主视觉、快速开局和底部卡片整体偏高；按参考图收敛为 339 / 203 / 238px 三段高度，并恢复底部留白。
- P1：快速牌桌首轮信息密度不足；补齐玩家头像队列、桌位状态和底池信息，同时保留真实生成的牌桌资产。
- P2：校准侧栏徽章与会员卡位置、主标题字号、主 CTA 底部间距、今日牌局图表和继续牌局卡片高度。
- P2：顶部用户头像改用与参考一致的金色黑桃徽章；QA 窗口圆角收敛为 16px。
- 最终并排检查未发现剩余 P0 / P1 / P2 视觉问题。

### 交互与工程检查

- 搜索框可按牌桌名筛选，浏览器实测“短筹”只保留短筹急速桌，清空后恢复全部牌桌。
- “立即入座”可打开确认弹窗，“稍后再说”可关闭；通知、钱包、换一批、好友邀请、任务领取均有实现或自动化覆盖。
- `pnpm --filter @kernelon/modules typecheck`：通过。
- `pnpm --filter @kernelon/web typecheck`：通过。
- `pnpm --dir packages/modules exec vitest run tests/poker-lobby-window.test.tsx tests/runtime.test.ts`：4 个测试通过。
- `pnpm --dir packages/catalog exec vitest run tests/catalog.test.ts`：13 个测试通过。
- `pnpm lint:web`、`pnpm typecheck:web`、`pnpm test:web`、`pnpm build:web`：通过；Web、Desktop 与共享包构建成功，PokerLobbyWindow 已生成独立桌面端 chunk。
- `pnpm check`：前端检查通过，但 API 阶段被本机 `apps/api/.venv/lib64` 的 Windows 访问拒绝阻断；失败发生在 uv 维护虚拟环境时，与本次前端改动无关。
- `git diff --check`：通过。

### 后续范围

- P3：牌桌、赛事、俱乐部、复盘、收藏和我的独立界面不属于本轮“图 1 大厅”实现范围，当前导航提供明确反馈，后续可逐屏延展。

final result: passed

---

## Weekly Show 侧栏接缝与激活态

### 验收目标与证据

- 用户问题截图：`C:/Users/17335/AppData/Local/Temp/codex-clipboard-329f896a-995d-48fb-b1c2-f4dd7071f5b4.png`
- 修复后截图：`C:/Users/17335/AppData/Local/Temp/kernelon-weekly-show-seam-fixed.png`
- 验收页面：`http://127.0.0.1:3000/qa-weekly-show`（仅验收期间使用，交付前删除）
- 浏览器视口：1280 × 720，DPR 1.5，全屏 Weekly Show。

### 根因与修复

- 主内容面板原先使用 `margin-left: -24px` 并带更高层级，实际覆盖侧栏 24px，导致激活菜单胶囊右半部分被遮挡。
- 侧栏、装饰光斑和主面板在接缝顶部同时进行玻璃模糊与层叠，造成顶部连接区域发糊。
- 删除主面板负边距，让 286px 侧栏与主内容建立明确相邻边界；同步校准顶部导航和标题的横向位置。
- 移除侧栏整面 `backdrop-filter` 与接缝附近的模糊装饰光斑，保留清晰的浅蓝材质与主面板边界阴影。
- 激活菜单改为不依赖背景模糊的半透明白色胶囊，并提升自身层级，保证完整轮廓。

### 浏览器检查

- 侧栏右边界：286.67px；主面板左边界：286.67px；两者无重叠。
- 激活胶囊宽度：254px；右侧距侧栏边界：16px；完整可见。
- 侧栏计算样式 `backdrop-filter: none`；主面板无覆盖层级；激活项 `z-index: 10`。
- 点击“我的投稿”后，`aria-current="page"` 正确切换，胶囊宽度仍为 254px，右侧仍保留 16px。
- 修复前后截图已在同一视觉比较输入中并排检查；接缝清晰，激活态无裁切。

### 工程检查

- `pnpm --filter @kernelon/modules test -- weekly-show-window.test.tsx`：通过，2 个测试。
- `pnpm --filter @kernelon/web build`：通过。
- `pnpm --filter @kernelon/modules typecheck`：被工作树中另一处 `ParticleStage.tsx` 未完成改动阻断，缺少 `createHomeStarfieldPoints` 与 `drawHomeStarfield`；与本次 Weekly Show 改动无关。

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

| 项目       | 原版                                     | 当前实现                                           | 结论                     |
| ---------- | ---------------------------------------- | -------------------------------------------------- | ------------------------ |
| 首页层级   | 左侧施工占位，右侧 2×3 主卡和推荐横轨    | 按产品要求删除施工占位，2×3 主卡和推荐横轨居中扩展 | 通过，属于明确的产品差异 |
| 搜索       | 顶部居中，来源标签不抢占首屏             | 顶部居中；来源标签默认收起、聚焦后显示             | 通过                     |
| 主卡       | 深色玻璃、两列三行、大封面、清晰标题层级 | 尺寸、圆角、边框、封面和文案层级一致               | 通过                     |
| 推荐横轨   | 5 张真实封面卡                           | 5 张在线推荐封面卡                                 | 通过                     |
| 背景       | 黑色星粒背景，内容层位于粒子之上         | 粒子亮度受控，卡片保持清晰对比                     | 通过                     |
| 空场控制台 | 未播放时不占首页底部空间                 | 首页隐藏，播放后恢复                               | 通过                     |

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

---

## 黑桃局实战牌桌

**Design QA — Poker 实战牌桌**

- source visual truth path: `C:\Users\17335\AppData\Local\Temp\codex-clipboard-c32dbc87-d514-44af-ad4d-5c4a52515081.png`
- implementation screenshot path: `C:\Users\17335\AppData\Local\Temp\poker-table-implementation-final.png`
- viewport: `1588 × 992`（源图实际像素高度为 990，比较时按顶部对齐补齐 2px）
- state: 王冠深筹 10/20，翻牌后行动阶段，动态 Tab 激活，默认加注额 720
- local preview: `http://127.0.0.1:3000/poker-preview`（仅 QA 临时入口，交付前移除）

**Full-view Comparison Evidence**

- `C:\Users\17335\AppData\Local\Temp\poker-table-comparison-final.jpg`
- 整体窗口、58px 顶栏、72.3% / 27.7% 主区域分栏、206px 底部操作区、桌面主体和玩家座位层级均与源图保持一致。

**Focused Region Comparison Evidence**

- 牌桌与玩家：`C:\Users\17335\AppData\Local\Temp\poker-table-stage-comparison-final.jpg`
- 右侧牌局分析：`C:\Users\17335\AppData\Local\Temp\poker-table-rail-comparison-final.jpg`
- 底部下注操作：`C:\Users\17335\AppData\Local\Temp\poker-table-actions-comparison-final.jpg`

**Findings**

- 无遗留 P0/P1/P2 问题。
- [P3] 角色头像与源图动物个体存在细微差异，但已使用同一写实黑金艺术方向生成完整资产，圆形裁切、对比度和清晰度一致，不影响层级与识别。
- [P3] 系统中文字体在不同 Windows/macOS 字体回退下会有轻微字面宽度差异；字号、字重、行高和字距已按当前渲染环境校准。

**Required Fidelity Surfaces**

- Fonts and typography: 标题、筹码数字、正文和微型表格信息形成与源图一致的四级层级；无异常换行、截断或拥挤。
- Spacing and layout rhythm: 顶栏、主舞台、右侧栏、底部操作区与六个座位锚点已按同视口校准；持久操作无溢出和遮挡。
- Colors and visual tokens: 深黑、墨绿、香槟金、行动红与成功绿均映射到统一牌桌令牌；边框、渐变和阴影层级与源图一致。
- Image quality and asset fidelity: 牌桌、豹、鹰、鹿、熊和红色牌背均为高分辨率 WebP 实体资产；无占位图、内联 SVG 插画或低清拉伸。
- Copy and content: 牌局、赔率、胜率、玩家位置、筹码、时间与按钮文案完整且与参考语境一致。
- Icons and accessibility: 使用同一 Lucide 图标族；关键按钮均有可访问名称、键盘焦点和 reduced-motion 支持。

**Comparison History**

1. 首轮发现 P2：主玩家被底部操作栏截断；右侧动态栏提前 38px 结束；牌桌纵向体量不足。修复：上移英雄座位、延长右栏到按钮上沿、按参考比例拉伸并下移桌体。复查后持久区域边界与源图对齐。
2. 第二轮发现 P2：上方与左右座位头像、手牌和下注筹码锚点存在 20–50px 漂移。修复：逐座位校准百分比坐标，并将手牌/筹码从信息流抽为独立绝对锚点。复查后六个座位与公共牌关系对齐。
3. 第三轮：对完整画面、牌桌、右栏和操作区分别做同视口并排比较，未发现可操作的 P0/P1/P2 差异。

**Primary Interactions Tested**

- 大厅“牌桌”入口进入实战牌桌，返回大厅闭环。
- 底池预设、滑杆、跟注、加注反馈。
- 动态/聊天/牌谱 Tab 切换，观战反应计数。
- 聊天输入与发送反馈。
- 声音切换、牌桌设置面板。
- Browser console warnings/errors: `0`。

**Implementation Checklist**

- [x] 同视口主界面视觉还原
- [x] 六席位与桌面游戏信息
- [x] 右侧牌局分析与 Tabs
- [x] 底部完整下注操作闭环
- [x] 键盘、标签、焦点与减弱动效
- [x] 组件化、状态逻辑和交互测试

**Follow-up Polish**

- 如后续接入真实牌局状态，可复用现有座位、行动日志与下注控制器，仅替换数据源。

final result: passed
