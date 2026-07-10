# Liquid Glass 组件接入实战手册

> **Wallpaper 当前决策（2026-07-11）**：四个业务按钮已经全部统一为 `packages/ui/src/components/liquidglass`（Ybouane）WebGL 路线，并采用官方文档的 Frosted Panel 基线。当前验收存档点在此基础上增加由业务 root 独占的单层 1px 浅色外沿，以增强复杂背景下的可辨识度；等待态不再单独绘制 inset ring。Wallpaper 不再导入或实例化 `packages/ui/src/components/liquid-glass`（Samasante）；下文 Samasante 内容仅保留为失败实验与避坑记录，不代表当前实现建议。

本文沉淀 Wallpaper App 顶栏两个 42px 圆形按钮的多轮接入与视觉验收经验，覆盖：

- `packages/ui/src/components/liquid-glass`：`samasante/liquid-glass` 的 React/headless 路线，本文简称 **Samasante**。
- `packages/ui/src/components/liquidglass`：`ybouane/liquidglass` 的 DOM capture + WebGL 路线，本文简称 **Ybouane**。

结论先行：液态玻璃不是在普通按钮上叠一层半透明背景。正确效果取决于“背景像素是否取对、渲染层是否完整、滤镜参数是否适合尺寸、交互 DOM 是否独立”四件事。任何一项不成立，结果都会退化成纯透明、双层边框、白团、模糊或切换闪白。

## 1. 组件的正确职责边界

玻璃渲染层只负责材质，真实控件仍应是原生 DOM：

```tsx
<span className="glass-root">
  <GlassVisual aria-hidden="true" />
  <button type="button" aria-label="Share" onClick={onShare}>
    <ShareIcon aria-hidden="true" />
  </button>
</span>
```

必须遵守：

- 视觉层 `pointer-events: none`，不能拦截点击、hover、focus 或键盘行为。
- 原生 `button` 位于最高层，保留 `onClick`、`disabled`、ARIA、焦点环和键盘激活能力。
- icon 与文字保持清晰 DOM，不要绘进玻璃 canvas。
- 不要让组件库的装饰层和业务按钮各画一套 border、inset ring 或 shadow；“双层边框”通常就是两套轮廓同时存在。

### 1.1 两套组件的模式矩阵

Samasante 的 `Glass` 是统一入口，但会根据 props 分流：

| 模式          | 触发方式                                   | 核心渲染                                                                      | 适用场景                              |
| ------------- | ------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------- |
| Material      | 仅传 `children`，不传媒体或高级 copy props | DOM 材质层；Blink 可使用 live backdrop bend，其他浏览器降级为 frost/tint/edge | 普通按钮、面板、小浮层                |
| In-place      | 传明确几何，让 children 成为折射源         | SVG displacement/filter                                                       | Hero、卡片、可动 lens                 |
| Refract copy  | `refract={node}`                           | SVG displacement/filter；children 或兄弟 DOM 保持清晰                         | 浮在图片上的按钮、菜单、通知          |
| Media surface | `src`、`draw`，可配 `lenses`               | WebGL2                                                                        | 视频、动态 canvas、多 lens 媒体控制器 |

Wallpaper 曾有两个 Samasante 按钮使用 **Refract copy / SVG**：输入是位置匹配、双缓冲提交的局部 canvas，不传 `src` 或 `draw`。该方案已经从 Wallpaper 运行时代码中移除，仅作为历史复盘保留。

Ybouane 不是上述四模式分流结构。它只有一条主要渲染管线：

1. 普通 HTML/CSS 通过 `html-to-image`（内部使用 SVG `foreignObject`）栅格化到 Canvas 2D；图片、canvas、video 直接 `drawImage`。
2. 合成后的局部 scene 统一上传到 WebGL 1 fragment shader。
3. `data-dynamic`、静态缓存、`markChanged()` 是更新策略；`button`、`floating` 是交互行为，不是不同渲染模式。

Wallpaper 当前四个按钮统一使用 **局部 canvas 直接场景 + WebGL 1 shader**，空 glass surface 跳过内容捕获，原生 button 独立覆盖在最上层。

## 2. 第一性原理：玻璃必须折射当前位置的背景

按钮位于 `(x, y)`，它的输入纹理就必须是页面在 `(x, y, width, height)` 的像素。仅把当前整张 Hero 图片设为按钮背景是不够的：

- `background-size: cover` 会裁切原图，必须复现原图在 Hero 容器内的 cover 投影。
- 横向轮播改变图片的 `getBoundingClientRect()`；只监听壁纸 URL 变化会产生长时间错位。
- 页面滚动、容器滚动、窗口缩放都会改变按钮与图片的相对坐标。
- 轮播过渡中按钮可能同时跨越两张图片；只选“覆盖按钮中心点”的单张图，会让按钮边缘从该图片范围越界，canvas 越界部分是透明像素。

cover 投影应按以下关系计算：

```ts
const scale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
const renderedWidth = image.naturalWidth * scale;
const renderedHeight = image.naturalHeight * scale;
const renderedLeft = rect.left + (rect.width - renderedWidth) / 2;
const renderedTop = rect.top + (rect.height - renderedHeight) / 2;
```

动态场景下应在 `requestAnimationFrame` 中读取几何，并监听：

- 轮播轨道的 `transitionrun` / `transitionend`；
- 页面和应用容器的 `scroll`（捕获阶段）；
- `ResizeObserver` 与 `window.resize`；
- 每张候选图片的 `load`。

不要启动永久 RAF。只在滚动、尺寸变化或已知过渡窗口内跟随，过渡结束即停止。

## 3. 白边与闪白的根因及双缓冲方案

### 3.1 已验证的根因

白边并不一定来自 CSS border。Wallpaper 场景中的真实根因是：轮播快速切换时，42px 取样区域横跨两张图片，但旧实现只绘制一张图片；超出该图片 DOM 边界的源区域被 canvas 当成透明。SVG/WebGL 的折射、辉光和边缘高光会放大这条透明缝，于是看起来像一闪而过的白边。

另一个风险是对展示中的 canvas 执行：

```ts
context.clearRect(...);
context.drawImage(...);
```

即使两条语句很接近，capture/render loop 仍可能在不合适的帧观察到空内容。玻璃引擎不应该看到“清空但未完成”的中间态。

### 3.2 正确提交协议

使用 staging canvas 与 committed canvas：

1. 在离屏 staging canvas 中清空并合成所有与按钮相交、已完成解码的背景图片。
2. 按页面绘制顺序叠加这些图片，而不是只选中心点命中的一张。
3. 对 staging 像素做完整性检查；任何 alpha 小于验收阈值的像素都表示新帧尚未完成。
4. 新帧不完整时直接退出，committed canvas 保留旧帧。
5. 新帧完整后，以一次 `globalCompositeOperation = "copy"` + `drawImage(staging)` 提交。
6. 只在提交完成后通知 WebGL 引擎 `markChanged(canvas)`。

这个协议同时解决了“新背景没好、旧背景先丢失”和“跨图边界透明缝”两个问题。背景 URL 变化不等于像素已可用；真正的 readiness 条件是本地取样帧完整且不透明。

## 4. Samasante 接入要点

### 4.1 DOM 与输入源

`Glass` 必须收到尺寸、位置和内容都可控的实际背景副本。对于滚动和轮播场景，优先使用已经完成双缓冲提交的局部 canvas；不要直接传一个重新请求图片的 CSS `background-image`，否则 CSS 图片解码与 Hero `<img>` 的生命周期可能不同步。

Wallpaper 的普通按钮必须采用 `refract={positionMatchedCopy}` 进入 DOM/SVG filter 路径。局部 committed canvas 作为位置匹配的折射副本，`Glass` 只负责材质；同尺寸原生 button 作为兄弟节点覆盖在最上层。不要传 `src` 或 `draw`，这两个参数会把组件切换到服务视频/canvas 动态介质的 WebGL surface 模式。

不要用选择器隐藏 `.wallpaper-liquid-glass-lens` 的直接子 `div`。在 SVG 模式中，这些直接子节点正是清晰层、refraction copy 与 filter 容器；为了隐藏 WebGL 错误占位而添加的宽泛规则会让真正的 SVG 折射一起消失，最终只剩业务层的透明背景。

对 42px 圆形按钮：

- `width`、`height`、`radius` 与外层 root 必须严格一致。
- `clipToShape: true` 与 `softEdge: true` 用于稳定圆形边缘。
- `filterResolution` 过低会锯齿，过高会显著增加 SVG filter 成本；小控件通常从 2–3 验证。
- `mapSize` 影响位移图质量和初始化成本，不应因追求清晰无限提高。

### 4.2 参数调优顺序

不要同时盲调所有参数。建议顺序：

1. 先关闭亮度和大面积 tint，确保看到的确实是位置正确的背景。
2. 用较低 `depth`、`bend` 建立清透的基础折射。
3. 用 `curvature`、`strength` 调整圆形镜片体积。
4. 小量加入 `dispersion`，避免 RGB 彩边喧宾夺主。
5. 最后调 `specular`、`sheen`、`glow`；它们过高会被误判成白边。
6. `frost` 只用于轻微柔化，必须跨明暗、云层、纯色和高频纹理背景验收。

Wallpaper 顶栏按钮最初以 `GlassVideoControls.tsx` 的 `PLAYER_OPTICS` 理解各参数的职责，但最终 SVG preset 必须单独校准，不能宣称与视频 WebGL preset 数值完全对齐。复用设计意图时仍要根据渲染路径、业务尺寸和性能预算调整。

宽胶囊不能机械照搬圆形按钮的各向同性强度。`190 × 42` 的 Hero 主按钮应使用 `scaleX/scaleY` 分轴控制：横向与纵向网格都必须出现可辨弯折。当前增强预设以 `scaleX: 0.09`、`scaleY: 0.2`、`curvature: 0.68`、`frost: 0.12` 为基线，避免通过模糊制造材质。业务场景需要明确描边时，`bend` 设为 `0`，避免 meniscus 再生成一条内环；中心区域折射仍由 `strength/scaleX/scaleY`、`depth` 与 `curvature` 完整承担。

SVG 与 WebGL 即使消费同一套 `GlassOptics`，也不能假设数值对应完全相同的视觉强度。尤其是 `frost`、位移归一化和宽高比：视频 Demo 的 `frost: 3` 在 42px DOM/SVG 按钮上会明显偏磨砂。当前 SVG 圆形按钮使用 `strength: 0.24`、`curvature: 0.7`、`frost: 0.15`；宽胶囊使用 `scaleX: 0.09`、`scaleY: 0.2`、`frost: 0.12`，保持网格纹理清晰；`bend/sheen/glow` 关闭，唯一的结构边框由业务 root 负责。

### 4.3 本轮新增踩坑

- `src` / `draw` 不只是“换一种数据输入”，而是模式路由开关；传入后会直接离开 DOM/SVG 路径。
- 不要因为参数来自 WebGL Demo，就连同 WebGL 模式一起复制。参数参考与渲染介质选择是两件独立的事。
- `refract` 副本不能只包含 lens 内部像素。折射会向周围采样，必须额外捕获邻域；当前增强预设下圆形按钮四周取样 12px，宽胶囊取样 32px。
- 不要通过降低整个 `strength` 来让宽胶囊“清透”，这会让材质退化成透明。应使用 `scaleX/scaleY` 分轴约束宽高比导致的位移放大。
- 试图把业务描边向内偏移并与光学 meniscus “对齐”不可靠：不同缩放和 DPR 下两条线仍会分离。当前 Ybouane Frosted preset 保留官方的低强度光学边缘（`edgeHighlight: 0.05`、`fresnel: 1`），但 CSS 结构边框只能有一个所有者：业务 root 在几何最外沿绘制唯一的 1px 浅色 `::after`；真实 button、canvas 与等待态 fallback 均不再绘制 border 或 inset ring。光学高光属于材质变化，CSS 外沿属于轮廓识别，两者不能再由多个 DOM 层重复实现。
- 首次背景画布提交不等于 SVG 已可见。Samasante 必须同时满足背景副本已提交、lens map 已生成、`live` 刷新尾帧已稳定后才淡入真实玻璃；Ybouane 不能以“发现任意一个非透明像素”作为 ready，至少需要连续两帧达到 55% 的有效 alpha 覆盖，避免白色空面或底部月牙被误判为成品。
- 视觉清透度首先由 `frost` 和位移强度决定，不应通过降低整体 opacity 或删除高光伪造。
- `<canvas>` 像素更新不会产生 DOM mutation。Samasante 的静态 SVG copy 可能继续复用首次空 SourceGraphic；每次 committed canvas 更新后需要短暂开启 `live` 使 filter id 重建。Wallpaper 只保持 2 个尾帧，过渡期间由连续提交自然续期，稳定后立即关闭，禁止永久 RAF。

## 5. Ybouane 接入要点

### 5.1 严格的 root 结构

Ybouane 会捕获 root 的直接子元素并生成 WebGL 输出，DOM 结构会直接影响捕获结果。推荐结构：

1. 位置匹配、双缓冲提交完成的背景 canvas；
2. 带 `data-config` 的玻璃 surface；
3. 最高层、`pointer-events` 正常的原生 button。

不要让视觉 fallback、icon 或交互按钮意外进入背景捕获集合，否则容易出现递归捕获、白团和模糊杂质。

### 5.2 生命周期与性能

- 一个 42px 按钮只初始化一个实例，并在卸载时 `destroy()`。
- icon-only 场景传 `prefetchFonts: false`，避免无意义的字体扫描和预取。
- 如果玻璃 surface 本身为空、交互内容全部由独立的清晰 DOM 覆盖层承载，使用 `data-liquid-glass-skip-content` 跳过无意义的 `html-to-image` 内容预捕获，避免初始化 Promise 卡在空 surface 的首帧瀑布上。
- 如果清晰交互层位于最后一个 glass surface 之后、不会成为任何玻璃的背景贡献者，使用 `data-liquid-glass-skip-capture` 跳过静态预热；不要为永远不会进入 scene 的按钮支付一次 `html-to-image` 成本。
- 背景变化后先提交 canvas，再调用 `markChanged(canvas)`；不要空跑永久渲染循环。
- 初始化后不要只靠固定延时判断 ready，应检查输出 canvas 确实已有非透明像素。
- renderer 抛错后必须停止本轮循环，不能每帧重复抛错并拖垮浏览器。
- 复用的 scene canvas 一旦被跨域媒体污染，`clearRect` 不能恢复 origin-clean；小型局部画布应在新一帧合成前重设 bitmap 尺寸，避免一次瞬时 taint 永久污染后续 WebGL 上传。
- DPR 应设置上限。42px 控件用 2x 通常已足够；3x、4x 会按平方增加像素成本。

### 5.3 参数白团排查

Wallpaper 的 Frosted preset 以官方站点和随组件移植的 README 为准：官方 Frosted Panel 示例核心覆盖为 `blurAmount: 0.25`，顶部对比 Demo 的强化磨砂版本为 `0.5`。小型业务按钮采用标准 `0.25`，不使用 `0.5`，避免文字和图标周围过糊；其余参数显式对齐官方默认语义：

```ts
{
  blurAmount: 0.25,
  refraction: 0.69,
  chromAberration: 0.05,
  edgeHighlight: 0.05,
  specular: 0,
  fresnel: 1,
  distortion: 0,
  opacity: 1,
  saturation: 0,
  brightness: 0,
  shadowOpacity: 0.3,
  shadowSpread: 10,
  button: true,
  bevelMode: 0,
}
```

`cornerRadius` 与 `zRadius` 均取按钮高度的一半，使 42px 圆形按钮与胶囊按钮使用一致的 biconvex 横截面。`button: true` 必须保留，以获得官方实现的 hover/press shader 反馈。背景 canvas 属于一次性或事件驱动更新，应继续调用 `instance.markChanged(canvas)`；不要改成永久 `data-dynamic`，否则会绕过空闲帧短路优化。

输出 ready 不能按整个注入 canvas 的 alpha 占比判断，因为 `shadowSpread` 会让 canvas 比玻璃本体大：42px 圆形玻璃在带 halo 的 canvas 中面积占比可能只有约 36%，固定要求全画布 55% 会把正常输出永久判成 fallback。Wallpaper 检查画布中央 50% 核心区，要求连续两帧至少 80% 像素有效；这样既排除只渲染出底部月牙的残缺首帧，也适配圆形、短胶囊和宽胶囊。

如果背景正确但玻璃内部出现局部白团，优先调参数而不是改 renderer：

- 降低 `edgeHighlight`、`specular` 与 `fresnel`；
- 降低 `blurAmount` 与 `distortion`，避免云层等亮区聚集；
- 降低 `chromAberration`，保持边缘干净；
- 保持 `tintStrength` 接近 0，避免亮背景被染成乳白；
- `opacity` 不等于材质强度，纯粹提高 opacity 往往只会让按钮变灰或发白。

每套参数必须在暗色、亮色、天空云层、高频纹理和轮播边界五类背景下验收。

## 6. 已踩过的典型坑

| 现象                 | 根因                                              | 修复原则                                             |
| -------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| 两层边框             | 库内高光/轮廓与业务 CSS border、伪元素同时存在    | 只保留一套材质轮廓，focus ring 仅在键盘聚焦时出现    |
| 像纯透明按钮         | 背景副本位置错误，或玻璃参数只剩透明度            | 先验证局部背景坐标，再调折射参数                     |
| 折射的是整张 Hero    | 使用图片 URL，却没有复现 cover 裁切和按钮局部坐标 | 按真实 DOM rect 计算局部取样                         |
| 滚动后不更新         | 只依赖壁纸 URL / React props                      | 监听 scroll、resize、transition，并限时 RAF 跟随     |
| 切换后很久才出现     | 图片解码、capture 与 WebGL ready 被串行等待       | 旧帧保留；新帧局部合成好后再 markChanged             |
| 快速切换闪白         | 清空当前 canvas，或单图取样越界为透明             | staging/committed 双缓冲 + 多图合成 + alpha 验证     |
| 右侧白团、很糊       | Fresnel、specular、blur、distortion 组合过强      | 只换参数集，先降低聚光和模糊项                       |
| 页面严重卡顿甚至崩溃 | 永久 RAF、重复 capture、过高 DPR/分辨率、错误循环 | 事件驱动更新、限时跟随、DPR 上限、异常熔断           |
| 玻璃好看但不能点     | canvas 覆盖交互层，或根本没有真实 button          | 视觉层禁用 pointer events，DOM button 置顶并透传事件 |
| 图标也被模糊         | icon 被捕获进玻璃输入或放在滤镜层内               | icon 独立为最上层清晰 DOM                            |

## 7. 交付验收清单

### 视觉

- 圆形边缘连续、丝滑，没有常驻双边框。
- 快速连续切换时没有白边、白底或空 canvas 闪现。
- 过渡中按钮能同时正确反映两张相邻背景，不出现透明缝。
- 上下滚动时，按钮折射内容随当前位置实时变化。
- 明亮云层背景下没有明显白团，暗背景下仍有可辨认的玻璃体积。

### 交互

- 鼠标点击、Enter、Space 均可触发真实业务回调。
- `aria-label` 正确，Tab 可聚焦，focus-visible 清晰。
- 玻璃 canvas/surface 不拦截 pointer events。
- 点击后的成功或失败状态有可感知反馈。

### 性能与稳定性

- 切换与滚动期间无持续长任务，过渡结束后 RAF 停止。
- 不重复初始化 renderer；卸载后实例、observer 与事件监听全部释放。
- 画布只覆盖控件局部区域，并限制 DPR。
- 控制台无 WebGL、CORS、canvas taint、字体抓取或无限重试错误。
- 在连续快速切换、滚动、窗口缩放后仍可交互，浏览器内存不持续增长。

## 8. 当前选型建议

Wallpaper 的实际多轮验收结果优先于抽象层面的推测：Samasante 虽然 DOM 契约较轻，但在局部动态背景、首帧 SourceGraphic、SVG cache、边缘 meniscus 与业务描边组合上出错率过高，反复消耗调试时间且仍未达到稳定视觉预期。因此 Wallpaper 暂停使用 Samasante，不再保留 A/B 双引擎分支；四个按钮统一采用 Ybouane `liquidglass` 的 Frosted preset。

这不是对 KernelOn 全局材质基座的永久定论。若未来重新评估 Samasante，必须先在隔离 Demo 中通过动态背景同步、首帧、边框、滚动、性能五项验收，再允许进入业务页面；不能直接在 Wallpaper 中继续试错。

业务代码最终应只消费 KernelOn 自己的语义组件和少量 preset，不应在每个页面重新选择引擎、复制取样管线或独立维护一套参数。
