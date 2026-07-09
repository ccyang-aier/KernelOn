# KernelOn Liquid Glass

本目录是 `@samasante/liquid-glass` 的源码级迁移版本，用作 KernelOn 的液态玻璃组件基座。核心实现文件来自 `open_source/liquid-glass/src`，迁移时保持组件源码逐文件一致；本目录额外补充 `examples/`、`README.md` 和 `LICENSE`，方便项目内使用、理解和后续更新。

## 直接使用

可以直接从 `@kernelon/ui/liquid-glass` 导入：

```tsx
"use client";

import { Glass } from "@kernelon/ui/liquid-glass";

export function SaveButton() {
  return (
    <Glass
      className="rounded-2xl px-4 py-2"
      style={{ background: "rgba(255,255,255,0.24)" }}
    >
      保存
    </Glass>
  );
}
```

也可以从 `@kernelon/ui` 主入口导入：

```tsx
import { Glass } from "@kernelon/ui";
```

注意：`Glass` 内部使用 React hooks、DOM、ResizeObserver、SVG filter、WebGL 等浏览器能力。在 Next.js App Router 中，实际渲染 `Glass` 的文件需要处于 `"use client"` 边界内。Server Component 可以把数据传给客户端叶子组件，但不要直接在 Server Component 中渲染交互式 glass 逻辑。

## 目录结构

```txt
liquid-glass/
  Glass.tsx            # 统一 React primitive，负责 DOM/material/refract/WebGL 模式分发
  GlassMaterial.tsx    # bare wrap material 模式：frost/tint/edge/light/live backdrop bend
  GlassSurface.tsx     # src/draw + lenses WebGL surface 模式
  displacement.ts      # SDF displacement map 与 GlassOptics 参数模型
  glassWebGL.ts        # WebGL renderer
  interaction.tsx      # 交互控件辅助：GlassDiv、useLensWobble、rubberBand
  signal.ts            # 无外部依赖 motion value 工具
  index.ts             # public exports
  examples/            # 上游示例，import 已改为本地 ".."
  LICENSE              # 上游 MIT License
```

## 组件能力

`Glass` 是唯一 primitive，按传参自动进入不同模式：

| 模式 | 触发方式 | 适用场景 | 说明 |
| --- | --- | --- | --- |
| Material | `<Glass>children</Glass>` | 按钮、面板、小浮层、工具控件 | children 保持清晰；所有浏览器有 frost/tint/edge-light；Chrome/Edge 可弯曲 live page backdrop |
| In-place refraction | 提供 `size` / `width` / `height` / `center` 等几何参数 | Hero、卡片、可动 lens | 折射组件自己的 children，跨浏览器通过 SVG filter 生效 |
| Refract copy | `refract={node}` | 通知、菜单、面板浮在背景之上 | 折射传入节点的副本，children 作为清晰交互层覆盖在上方 |
| Media/WebGL | `src` 或 `draw`，可配合 `lenses` | 视频控制器、canvas 动态介质、多 lens surface | 一个 WebGL renderer 采样视频/canvas，并绘制一个或多个 glass lens |

核心原则：`children` 永远是清晰层。玻璃材质、折射、色散、模糊、高光发生在 children 下方或副本层上，不应该让业务文字和控件本身被扭曲到不可读。

## 架构模型

这套实现的关键抽象是把“几何”和“光学”分开：

- 几何：`width`、`height`、`size`、`radius`、`center`、`lenses` 决定 lens 在哪里、多大、什么形状。
- 光学：`optics` 决定折射强度、深度、曲率、色散、frost、brightness、sheen、glow 等材质质感。
- 渲染：DOM/SVG filter 路径用于普通 React UI；WebGL 路径用于视频/canvas 介质。
- 动画：`glassValue` 等 motion value 工具允许几何参数在不触发 React 高频重渲染的情况下更新。

这种结构适合 KernelOn 后续封装 `GlassSurface`、`GlassPanel`、`GlassMenuSurface` 等语义组件：业务只选择场景语义和 preset，底层仍统一由这套 primitive 承载。

## `<Glass>` 参数

`GlassProps` 继承 `React.HTMLAttributes<HTMLDivElement>`，因此可传 `className`、`style`、`onClick`、`role`、`aria-*` 等普通 div 属性。核心参数如下：

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `children` | `React.ReactNode` | 无 | 清晰交互层。Material/in-place 模式下也可作为被折射内容。 |
| `refract` | `React.ReactNode` | 无 | 指定要折射的副本内容。children 会清晰覆盖在上方。 |
| `behind` | `string` | 自动推导 | `refract` 副本边缘的实色补边。照片/复杂背景建议显式传入，例如 `"#222"`；传 `"transparent"` 可关闭。 |
| `src` | `string` | 无 | 视频 URL，触发 WebGL media surface 模式。 |
| `draw` | `(ctx, t) => void` | 无 | 每帧 canvas painter，触发 WebGL canvas surface 模式。`t` 是 mount 后毫秒数。 |
| `width` | `GlassValue` | 自动适配元素 | lens 宽度，单位 px。`GlassValue` 可是 number 或 motion value。 |
| `height` | `GlassValue` | 自动适配元素 | lens 高度，单位 px。 |
| `size` | `GlassValue \| [GlassValue, GlassValue]` | 无 | `width`/`height` 简写。number 表示正方形；数组表示 `[w, h]`。显式 `width`/`height` 优先级更高。 |
| `radius` | `GlassValue` | 继承元素圆角 | lens 圆角，单位 px。 |
| `center` | `{ x?: GlassValue; y?: GlassValue }` | `{ x: 0.5, y: 0.5 }` | lens 中心点，按元素宽高的 0..1 比例定位。 |
| `optics` | `Partial<GlassOptics>` | 内置 balanced default | 光学材质参数。详见下方 `GlassOptics`。 |
| `live` | `boolean` | `false` | 对自运动 DOM 内容每帧重新 rasterize。主要用于 Safari 中需要持续更新的折射内容。 |
| `filterResolution` | `number` | `1` | Chromium supersample 倍率，`2` 更清晰；Safari 会强制为 1。 |
| `lenses` | `GlassSurfaceLens[]` | 无 | `src`/`draw` 模式下的多 lens 描述数组。 |
| `videoRef` | `React.Ref<HTMLVideoElement>` | 无 | WebGL video 模式下转发内部 video 元素。 |
| `paused` | `boolean` | 无 | 控制视频暂停状态。 |
| `poster` | `string` | 无 | video poster。 |
| `loop` | `boolean` | 无 | video loop。 |
| `muted` | `boolean` | 无 | video muted。 |
| `autoPlay` | `boolean` | 无 | video autoplay。 |
| `crossOrigin` | `"anonymous" \| "use-credentials"` | 无 | video crossOrigin。 |
| `maxDpr` | `number` | WebGL surface 内部默认 | 限制 WebGL buffer DPR，用于性能和清晰度平衡。 |
| `depth` | `GlassValue` | 来自 `optics.depth` | recipe 级快捷参数，用 motion value 动态驱动深度。 |
| `scale` | `GlassValue` | 来自 `optics.strength` | recipe 级快捷参数，用 motion value 动态驱动折射强度。 |
| `brightnessInFilter` | `boolean` | `false` | 将 brightness veil 合成进 filter，适合较大或较快 lens。 |
| `pixelUnits` | `boolean` | `false` | 使用 `userSpaceOnUse` filter，适合大表面上的小 lens。 |
| `overlay` | `React.ReactNode` | 无 | 稀有逃逸口：在 children 上方再折射/覆盖节点。 |
| `onLensMapChange` | `(url: string \| null) => void` | 无 | lens map URL 变化回调，调试或外部观察用。 |
| `unstable_lens` | object | 无 | recipe 级 lens 外观逃逸口，主要给 switch/slider 等复杂控件使用。 |

## `unstable_lens`

`unstable_lens` 是高级控件配方用的逃逸口，不建议业务常规使用。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `tintColor` | `string` | lens 跟随层颜色。 |
| `tintOpacity` | `GlassValue` | lens tint 透明度。 |
| `tintBlur` | `GlassValue` | tint blur。 |
| `shadowOpacity` | `GlassValue` | 拖拽/激活态阴影透明度。 |
| `restShadowOpacity` | `GlassValue` | 静止态阴影透明度。 |
| `edgeBias` | `GlassValue` | 边缘偏置，用于控件动效中的边缘状态。 |

## `GlassOptics` 参数

`GlassOptics` 是 `GlassLensParams` 去掉几何字段 `lensW`、`lensH`、`borderRadius` 后的光学参数集合。

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `mapSize` | `number` | `512` | displacement map 分辨率。更大更细，但生成成本更高。 |
| `clipToShape` | `boolean` | `true` | 是否将形状外 displacement 置零。 |
| `softEdge` | `boolean` | `true` | 是否在 lens 边缘使用软衰减。 |
| `strength` | `number` | `0.06` | 折射强度，最大像素偏移占盒子的比例。 |
| `scaleX` | `number` | 无 | X 轴折射强度覆盖值。适合宽 slider/track 等非均匀 lens。 |
| `scaleY` | `number` | 无 | Y 轴折射强度覆盖值。 |
| `depth` | `number` | `0.65` | 折射向内延伸深度，0..1。也会限制 `curvature` 生效范围。 |
| `curvature` | `number` | `0.6` | 凸面 dome 曲率，0..1。越高越像液态放大镜。 |
| `dispersion` | `number` | `0.5` | 色散强度，控制 RGB 边缘分离。 |
| `bend` | `number` | `0` | 边缘 meniscus 折射，液态玻璃边缘“包裹感”的关键参数。 |
| `bendWidth` | `number` | `0.16` | `bend` 边缘带宽，占 `min(width,height)` 的比例。 |
| `frost` | `number` | `0.5` | frosted blur，单位 px。 |
| `saturate` | `number` | `1` | material 模式下 CSS backdrop saturate；copy-based SVG 引擎忽略。 |
| `brightness` | `number` | `0.1` | 玻璃 veil 亮度。正数偏白，负数偏暗。 |
| `specular` | `number` | `1` | 高光总增益。 |
| `sheenAngle` | `number` | `45` | sheen/glow 聚集方向，单位 degree。 |
| `sheenDark` | `boolean` | `false` | DOM `<Glass>` only。将边缘高光反转为暗边。 |
| `sheen` | `number` | `0.3` | 方向性边缘高光强度。 |
| `sheenWidth` | `number` | `3` | sheen 边缘带宽，单位 px。 |
| `sheenFalloff` | `number` | `1.5` | sheen 衰减指数。 |
| `glow` | `number` | `0.12` | 内部柔光强度。 |
| `glowSpread` | `number` | `1` | 内部柔光向内扩散范围。 |
| `glowFalloff` | `number` | `0.5` | 内部柔光衰减指数。 |
| `splay` | `number` | `0` | 角落 splay，越高越向角落外扩 displacement。 |
| `edgeShadow` | `string` | 无 | lens 激活/拖拽态外阴影 CSS。 |
| `edgeInsetShadow` | `string` | 无 | lens 激活/拖拽态内阴影 CSS。 |
| `restEdgeShadow` | `string` | 无 | lens 静止态外阴影 CSS。 |
| `restEdgeInsetShadow` | `string` | 无 | lens 静止态内阴影 CSS。 |

示例：

```tsx
<Glass
  radius={22}
  optics={{
    strength: 0.18,
    depth: 0.55,
    curvature: 0.32,
    dispersion: 0.18,
    bend: 0.5,
    bendWidth: 0.08,
    frost: 3,
    brightness: 0.35,
  }}
>
  <div className="px-4 py-3">液态玻璃面板</div>
</Glass>
```

## `GlassSurfaceLens`

`GlassSurfaceLens` 用在 `src` / `draw` 模式中，用一个 WebGL surface 承载多个 lens。

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `w` | `number` | 必填 | lens 宽度，单位 px。 |
| `h` | `number` | 必填 | lens 高度，单位 px。 |
| `radius` | `number` | `min(w,h)/2` | lens 圆角，单位 px。 |
| `x` | `number` | 必填 | lens 中心点 X，按 surface 宽度 0..1 定位。 |
| `y` | `number` | 必填 | lens 中心点 Y，按 surface 高度 0..1 定位。 |
| `scale` | `number` | `1` | lens enter/exit 动效缩放。 |
| `opacity` | `number` | `1` | lens enter/exit 动效透明度。 |
| `optics` | `Partial<GlassOptics>` | 无 | 单个 lens 的 runtime optics 覆盖。map 形状仍共享，运行时强度、色散、高光等可单独调整。 |

## Motion 工具

`signal.ts` 和 `interaction.tsx` 导出以下可选工具：

- `glassValue(initial)`：创建可订阅 motion value。
- `deriveGlass(fn, deps)`：从多个 motion value 派生新值。
- `animateGlassValue(value, to, options)`：动画更新 motion value。
- `glassEase`、`cubicBezier`：缓动函数。
- `useLensWobble(...)`：速度驱动的 squash/stretch wobble。
- `rubberBand(...)`：拖拽越界橡皮筋函数。
- `GlassDiv`：transform-only div，用于复杂控件内部减少 React 重渲染。

普通面板、按钮、菜单不需要这些工具。它们主要服务于 `examples/GlassSwitch.tsx` 和 `examples/GlassSlider.tsx` 这类自定义控件。

## Examples

`examples/` 来自上游项目，已将 import 源改为本地 `..`：

- `GlassContextMenu.tsx`：右键菜单/菜单面板。
- `GlassNotification.tsx`：通知卡片/浮层面板。
- `GlassSwitch.tsx`：可访问 switch 控件。
- `GlassSlider.tsx`：可访问 range slider。
- `GlassVideoControls.tsx`：视频控制器，多 lens WebGL surface。

这些示例不是 `@kernelon/ui` 的 public export，建议复制到具体业务或 Story/Playground 中试验，再逐步沉淀 KernelOn 自有语义组件。

## 浏览器与降级

- Chrome/Edge：material 模式可使用更强的 live backdrop bend。
- Safari/Firefox：material 模式仍有 frost/tint/edge-light，但不能直接弯曲任意 live page backdrop；如需跨浏览器真实折射，需要使用 in-place geometry 或 `refract={node}` 副本模式。
- 视频/canvas：使用 `src` / `draw` WebGL 路径。它绕过 SVG filter 对 live media 的限制。
- 大面积/大量 lens：需要控制实例数量、尺寸、`mapSize`、`filterResolution`、`maxDpr`。宽面板不要依赖一个被无限拉伸的单 lens，应拆成合理的局部 lens 或由上层组件做视觉降级。

## 维护规则

1. `Glass.tsx`、`GlassMaterial.tsx`、`GlassSurface.tsx`、`displacement.ts`、`glassWebGL.ts`、`index.ts`、`interaction.tsx`、`signal.ts` 是上游源码迁移文件。更新时优先从 `open_source/liquid-glass/src` 重新复制，而不是手写补丁。
2. `examples/` 允许为了本仓库导入路径做最小调整；不要把 examples 当作 KernelOn 产品组件直接导出。
3. `eslint.config.js` 已忽略本目录源码的 React Hooks lint。原因是本目录保持上游源码形态，避免为了适配本仓库 lint 规则而改写实现逻辑。TypeScript 仍会覆盖该目录。
4. 如需建立 KernelOn 自有 API，应在本目录外封装，例如未来的 `GlassSurface` / `GlassPanel` / `GlassMenuSurface` 语义层，而不是修改 vendored 源码。

## License

上游项目使用 MIT License，完整文本见本目录 `LICENSE`。
