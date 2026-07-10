# Liquid Glass 前端设计与实现对比分析

> 业务接入、动态背景同步与性能验收请同时阅读 [Liquid Glass 组件接入实战手册](./liquid-glass-integration-playbook.md)。该手册沉淀自 Wallpaper App 顶栏按钮的多轮真实调试。

本文分析范围扩展为仓库内的四个本地项目：

- `open_source/liquid-glass-react`
- `open_source/liquid-glass-studio`
- `open_source/liquidglass`
- `open_source/liquid-glass`

分析重点不是复述 README，而是从视觉模型、渲染原理、工程边界、可复用性、性能风险和 KernelOn 后续设计系统落地角度，判断四者分别适合解决什么问题。

## 0. 2026-07 四仓复评结论

结论先行：KernelOn 不应该保留多套液态玻璃运行时。最终只应该有一个产品级材质基座：以 `open_source/liquid-glass`，也就是 `@samasante/liquid-glass` 为唯一候选底座，收敛成 KernelOn 自有的 `GlassSurface` 组件家族。

这里的“唯一”很重要。`liquid-glass-react`、`liquid-glass-studio`、`ybouane/liquidglass` 都不应该进入 KernelOn 的产品运行时主线。它们最多是一次性研究材料，不能成为 Shell、业务 App、Widget 在不同场景里各自选择的实现分支。真正优雅的架构不是“这里用 A，那里用 B”，而是所有场景都只面对 KernelOn 自己的一个材质契约。

| 项目                  | 定位                                    | 成熟度判断                                                                         | 对 KernelOn 的结论                      |
| --------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- |
| `liquid-glass-react`  | 小型 React 玻璃容器                     | 社区热度最高，但组件假设较重，定位、背景、SVG filter、浏览器支持和鼠标状态耦合明显 | 淘汰出主线；不再扩展新场景              |
| `liquid-glass-studio` | WebGL/WebGPU 材质实验室                 | shader 模型强，但本质是实验应用，不是 DOM 组件库                                   | 不进入运行时；只能作为只读研究样本      |
| `liquidglass`         | 命令式 WebGL + DOM capture 场景折射引擎 | 折射真实感强，但 root/capture/WebGL 生命周期约束过重                               | 不进入通用 UI；不作为 KernelOn 材质基座 |
| `liquid-glass`        | Headless React 液态玻璃 primitive       | 版本新，但组件抽象最正确：DOM 友好、headless、可降级、可封装                       | 唯一保留为产品级基座候选                |

### 0.1 为什么不再把 `liquid-glass-react` 作为主基座

`liquid-glass-react` 的问题不是“不能做出漂亮效果”，而是它的工程模型太像一个带强样式假设的成品组件。它默认围绕小面积浮层、按钮、菜单这类场景组织：内部有固定的 SVG filter/overlay 层、默认居中定位倾向、实例级鼠标状态、`backdrop-filter` 与 `filter: url(...)` 的组合，以及 Safari/Firefox 下不完整的 displacement 表现。

这解释了为什么它能在 KernelOn 右键菜单里成功，但换到其他系统材质场景后容易“失去液态玻璃感”：它依赖的背景采样、遮罩边界、层叠上下文、尺寸、亮度和 filter 生效条件都比较脆弱。一旦放到窗口框架、Dock、桌面小组件、应用壳层、复杂背景或嵌套滚动容器里，视觉链路就可能断掉。

KernelOn 当前已经把它改造成 `packages/ui` 下的 `liquid-glass-svg-filter` 组件，这个方向可以继续保留为轻量 SVG/CSS 近似材质，但不应继续把它扩大成所有液态玻璃场景的统一答案。

### 0.2 为什么 `liquid-glass-studio` 仍然更像研发工具

`liquid-glass-studio` 的价值在于高保真视觉模型。它通过 SDF、法线、折射、色散、Fresnel、glare、多 pass blur、WebGL2/WebGPU 后端，把“玻璃像素”这件事拆得很完整，非常适合帮助 KernelOn 调出自己的材质审美。

但它不是一个面向真实业务控件的组件库。它的输出核心是 canvas，主应用承担渲染循环和大量 shader uniform 同步，README/TODO 里也仍能看到编辑器模式、预设、UI 内容进入玻璃形状、玻璃文字渲染等未完成方向。对于 KernelOn 的业务窗口、表单、列表、菜单、导师匹配操作流来说，DOM 语义、键盘交互、布局和可访问性必须保持一等地位，不能被 canvas 材质系统接管。

因此它更适合成为“材质实验室”和“预设来源”，而不是 `packages/ui` 的日常组件基座。

### 0.3 `ybouane/liquidglass` 的强项与风险

`open_source/liquidglass` 是四者里最像“场景级折射引擎”的实现。它通过 `LiquidGlass.init({ root, glassElements, defaults })` 接管一个 root，把非玻璃子元素捕获成 canvas，再用 WebGL 对玻璃元素做折射、模糊、阴影、色散和分层合成。它还提供 `markChanged()`、`data-dynamic`、视频/图片/canvas 直接绘制、配置变更监听等机制，工程意识比普通 demo 强很多。

它的核心代价也非常清楚：

- glass 元素必须是 root 的直接子元素，嵌套结构受限。
- root 自身背景不会被捕获，背景必须成为 root 的子元素。
- 每个实例都有自己的捕获与 WebGL 生命周期，多 root 之间不能共享折射上下文。
- `html-to-image` / SVG `foreignObject` 捕获会受字体、跨域图片、动态 DOM、视频帧和 CORS 影响。
- `data-dynamic` 每帧捕获成本高，复杂业务界面中很容易变成性能风险。
- 它是命令式生命周期，不天然符合 Next.js/React 19 的组件边界和 KernelOn 的模块按需加载方式。

所以它适合“某个明确场景里需要更真实折射”的增强层，例如登录/启动台/品牌展示/特殊壁纸区域，而不适合作为 Dock、窗口、菜单、Widget、业务 App 面板到处复用的默认材质组件。

### 0.4 为什么 `samasante/liquid-glass` 更适合作为 KernelOn 基座

`open_source/liquid-glass` 的优势是它把液态玻璃拆成了更合理的产品级抽象：一个 headless React primitive `Glass`，再围绕 optics、lens、material、refract、media surface、motion value 组织能力。它不试图替业务 UI 决定按钮长什么样，也不要求整个页面进入一个命令式 root，而是让 KernelOn 可以把“材质”附着在自己的组件语义上。

对 KernelOn 特别重要的点：

- React 组件边界清晰，适合沉入 `packages/ui` 的客户端叶子组件，不会污染 Server Component 装配层。
- 零运行时依赖，peer dependency 只围绕 React/ReactDOM，接入成本和版本风险比大型视觉工具低。
- 支持 material、`refract={node}`、`src`、`draw`、`lenses` 等不同模式，可以覆盖普通控件、复制背景折射、图片/视频/canvas 等多种场景。
- optics 与几何尺寸分离，利于沉淀 KernelOn 自己的 `subtle`、`panel`、`menu`、`dock`、`control` 等 preset。
- 文档明确说明 Safari/Firefox 降级策略，Chrome/Edge 下可用更强的 URL filter/backdrop 组合，跨浏览器预期比 `liquid-glass-react` 更清楚。
- 示例组件覆盖 Context Menu、Notification、Switch、Slider、Video Controls，而且保留真实 DOM/input/ARIA 结构，说明它的作者在按真实控件思路设计，而不是只做视觉卡片。
- motion value 设计很轻，可与后续动画系统连接，同时避免强绑定 Framer Motion 这类额外依赖。

它的风险也要正视：项目版本还很新，当前 npm 版本只有 `0.1.1`；非常宽的菜单栏、Dock 背板或窗口大面板不应使用一个被横向拉伸的单 lens；大量 SVG filter 实例仍会有 GPU/合成成本；“直接折射页面背后任意内容”的能力在不同浏览器里并不等价。

但这些风险可以通过 KernelOn 自己的封装策略控制：限制可用 preset、由 `GlassSurface` 内部决定降级级别、提供无折射保底、限制实例数量和尺寸、对宽面板拆分为分段/子 lens，而不是把第三方裸组件直接交给业务模块自由传参。

### 0.5 KernelOn 最终架构裁决

KernelOn 的液态玻璃架构应该是一条线，而不是一组备选方案：

1. 产品运行时只保留一个组件家族：`packages/ui` 内的 KernelOn `GlassSurface`。`GlassPanel`、`GlassMenuSurface`、`GlassControlSurface` 只能是它的语义封装，不能各自接不同底层库。
2. 唯一底层候选是 `samasante/liquid-glass`。建议不是让业务直接安装并散用它，而是把它的核心思想和必要源码吸收到 KernelOn 自己的材质层，形成受控 API。
3. `GlassSurface` 对外只暴露场景语义和少量 preset，例如 `system`, `menu`, `popover`, `dock`, `windowChrome`, `control`, `media`。业务侧不接触 displacement、lens map、filter id、WebGL/canvas 等底层参数。
4. 浏览器差异、低性能设备、reduced motion、宽面板折射限制，都由 `GlassSurface` 内部处理。业务代码不应该知道“这个场景用 react 版、那个场景用 WebGL 版”。
5. `liquid-glass-react` 不再扩展新用法；现有右键菜单若继续保留，也应在后续迁移到 KernelOn `GlassSurface`，而不是成为第二条长期路线。
6. `liquid-glass-studio` 和 `ybouane/liquidglass` 不进入运行时。它们可以留在 `open_source` 作为分析证据，但不能成为产品架构里的第二引擎。
7. 如果 `samasante/liquid-glass` 的底层实现最终无法满足某些效果，不应切换到另一个开源组件并制造分叉，而应在同一个 `GlassSurface` 契约下补齐 KernelOn 自己的实现。

这才是“一次性把事情做对”的版本：选一个正确的抽象，锁死业务入口，把复杂性关在材质系统内部，而不是在 Shell、App、Widget 之间扩散。

## 1. 什么是液态玻璃（Liquid Glass）

液态玻璃是一种面向现代操作系统界面的材质语言。它看起来像半透明玻璃，但核心并不只是透明或模糊，而是把“玻璃介质”在屏幕上的几个感知特征组合成一种可交互 UI 材料：

- 透底：界面元素能看到下方背景或内容，形成空间层次。
- 磨砂：背景被模糊、降噪或柔化，保证前景内容可读。
- 折射：玻璃边缘会弯曲下方图像，暗示厚度和介质。
- 色散：强折射边缘出现轻微 RGB 分离，模拟不同波长光线的折射差异。
- 高光：边缘和受光方向有明亮反射，让材料不只是“透明灰片”。
- Fresnel 反射：越接近掠射角、越靠近边缘，反射和亮度越明显。
- 弹性：元素在 hover、press、拖拽或鼠标靠近时产生柔软形变，呈现“液态”而非硬质玻璃。
- 环境响应：玻璃颜色、暗度和边缘光会随着下方明暗背景变化而调整。

因此，Liquid Glass 更准确地说是一套“动态半透明材质系统”，不是单个 CSS 属性。`backdrop-filter: blur()` 只能覆盖其中的磨砂透底，无法自动得到折射、色散、厚度、边缘高光、形变和材质反馈。

对 KernelOn 这类 Web OS 式管理平台来说，液态玻璃的价值主要有三点：

- 它能强化“桌面外壳 + 应用窗口 + 系统级控件”的产品隐喻，让 Dock、菜单栏、Spotlight、浮层、窗口边框等系统部件更像统一工作台的一部分。
- 它能在不引入厚重装饰的情况下增加空间层次，适合精致、明亮、克制的管理工作台。
- 它也有明确风险：过度使用会降低文本可读性、增加 GPU 压力、让高频管理界面显得炫技。液态玻璃应当优先服务层级、聚焦和状态反馈，而不是成为所有卡片的默认装饰。

## 2. 通用设计、实现思路与原理

### 2.1 视觉分层模型

一个完整的液态玻璃效果通常可以拆成七层：

1. 背景采样层：拿到玻璃下方的背景颜色、图片或视频。
2. 形状遮罩层：决定玻璃范围，可以是圆角矩形、胶囊、圆形、Superellipse 或多个形状融合后的 blob。
3. 磨砂模糊层：对背景做 blur、降噪、饱和度调整或亮度压缩。
4. 折射位移层：根据边缘距离、法线方向和折射强度偏移背景采样坐标。
5. 色散层：R、G、B 通道采用略不同的偏移量，让边缘有轻微彩色分离。
6. 反射高光层：用边缘距离、法线角度、光源方向、Fresnel 曲线生成白色或带色高光。
7. 交互动效层：根据鼠标、滚动、拖拽、点击状态改变形状、阴影、亮度、位移或弹性。

低成本实现会合并多层，例如用 CSS 的 `backdrop-filter` 加一层半透明边框。高保真实现会把背景、模糊、折射、高光和最终合成都放到 WebGL/WebGPU shader 里。

### 2.2 常见实现路线

#### CSS 材质路线

核心技术是 `backdrop-filter: blur(...) saturate(...)`、半透明背景、边框、阴影、渐变高光和混合模式。

优点：

- 最容易与 DOM UI 组合。
- 适合 Button、Popover、Dock、MenuBar、WindowFrame 等真实产品控件。
- 代码量少，易于响应式和可访问性建设。

限制：

- 没有真实折射。最多通过渐变、阴影和伪元素暗示厚度。
- 浏览器实现差异明显。
- 多层 `backdrop-filter` 对性能并不便宜，尤其在大面积、动画或大量实例场景中。

#### SVG Filter 路线

核心是 `feImage` 提供位移贴图，`feDisplacementMap` 偏移源图像，`feColorMatrix` 抽取 RGB 通道，`feBlend` 合成色散，`feComposite` 做边缘遮罩。

优点：

- 比纯 CSS 更接近“边缘折射”。
- 仍可包裹 DOM 子内容。
- 可以封装成 React 组件，接入成本低于 WebGL。

限制：

- 位移通常来自预制贴图或简单生成图，不是真实读取当前 UI 几何。
- 对浏览器 filter 支持高度敏感。
- 多实例会生成大量 SVG filter、mask 和合成层，性能不可忽视。

#### Canvas / WebGL / WebGPU Shader 路线

核心是把背景和玻璃形状作为像素渲染问题处理：先渲染背景，再做多 pass 模糊，最后在主 shader 中根据 SDF、法线、折射、色散、Fresnel、高光进行合成。

优点：

- 视觉保真度最高。
- 形状、边缘、折射、色散、眩光和调试步骤都可被精确控制。
- 适合全屏背景、视觉实验室、动态壁纸、品牌展示、复杂系统级动效。

限制：

- DOM 内容无法自然嵌入玻璃内部，除非额外做纹理捕获、DOM-to-canvas 或叠层同步。
- GPU、DPR、纹理尺寸、视频上传和多 pass 都会带来性能成本。
- WebGL/WebGPU 的浏览器、驱动、权限和设备差异更复杂。
- 工程上需要维护 shader、uniform、纹理生命周期和渲染循环。

### 2.3 关键数学与图形原理

液态玻璃要做得像，通常离不开这些模型：

- SDF：Signed Distance Function。用一个函数表达“当前像素距离形状边界多远”。负值在形状内，正值在形状外。SDF 让边缘、法线、圆角、融合和抗锯齿更可控。
- 法线估计：通过对 SDF 在 x/y 方向做差分得到近似法线。折射和高光都依赖法线方向。
- 折射位移：根据边缘厚度和法线方向偏移背景采样坐标。越靠近边缘，位移越强；中心区域更多表现为模糊透底。
- 色散：用不同折射率模拟 R/G/B 通道的偏移差异。强度过高会变成廉价霓虹边。
- Fresnel：边缘或掠射方向更亮。UI 中通常用经验曲线近似，不追求物理严格。
- Gaussian blur：高质量模糊通常用 separable blur，先横向再纵向，避免二维卷积的高成本。
- 合成与混合：用 tint、shadow、overlay、screen、LCH 色彩空间等方式控制玻璃的明暗、色彩和高光。

### 2.4 产品设计原则

在业务系统里引入 Liquid Glass，建议遵循以下原则：

- 只把玻璃用于“系统层”和“临时层”：Dock、菜单栏、Spotlight、窗口工具栏、浮动操作条、弹窗背景、启动台，不要把所有业务表格和表单都玻璃化。
- 保持文字层清晰。玻璃负责空间感，内容层必须保持稳定对比度。
- 保持明亮克制。KernelOn 默认不应走暗色炫技路线，而应把液态玻璃做成轻、薄、干净的系统材质。
- 为低性能设备提供降级。至少要有无折射、低模糊、纯半透明材质三档。
- 把参数沉淀为设计 token。比如 `glass.blur`, `glass.tint`, `glass.edge`, `glass.shadow`, `glass.radius`, `glass.motion`，不要把视觉参数散落在业务组件里。

## 3. `liquid-glass-react` 的实现方式、能力与限制

### 3.1 项目定位

`liquid-glass-react` 是一个轻量 React 组件库，核心导出一个默认组件 `LiquidGlass`。它的目标是让使用者用很少的代码包裹任意 React children，从而得到类似 Apple Liquid Glass 的按钮、卡片或小型容器效果。

它的工程特征非常明确：

- 包名为 `liquid-glass-react`，当前本地 `package.json` 版本为 `1.1.1`。
- peer dependencies 只有 `react >=18` 和 `react-dom >=18`。
- 通过 esbuild 构建 ESM/CJS，通过 TypeScript 输出类型声明。
- 源码主体集中在 `src/index.tsx`，静态位移贴图放在 `src/utils.ts`，CPU 生成位移贴图的逻辑放在 `src/shader-utils.ts`。
- 示例项目是 Next.js Pages Router 应用，用控制面板展示卡片和按钮两类用法。

这不是一个完整设计系统，也不是 shader 实验室。它更像一个“可直接嵌入产品界面的小型玻璃材质组件”。

### 3.2 组件结构

`LiquidGlass` 组件大致由四类节点组成：

- 主玻璃容器 `GlassContainer`：负责放置 children，并通过内部 `.glass__warp` 层承接 backdrop blur 和 SVG filter。
- SVG filter 定义 `GlassFilter`：每个组件实例生成一个唯一 filter id，注入 `feImage`、`feDisplacementMap`、`feColorMatrix`、`feBlend`、`feComposite` 等滤镜节点。
- 边框与高光层：多个绝对定位 `span` 叠在主玻璃之上，用 mask、box-shadow、linear-gradient、mix-blend-mode 生成边缘光。
- 交互反馈层：对 hover、active、overLight 状态额外叠加黑色遮罩、overlay 和 radial-gradient。

这种结构的核心思想是：children 保持清晰，玻璃材质效果发生在 children 背后的 warp 层和外部边缘层。它并不会把 children 本身进行位移，因此文字和图标不会被折射扭曲，这对真实产品按钮很重要。

### 3.3 折射与色散实现

`GlassFilter` 是这个项目的技术核心。它通过 `feImage` 加载位移贴图，然后对 `SourceGraphic` 分别做三次 displacement：

- Red channel 使用一组位移比例。
- Green channel 使用略低位移比例。
- Blue channel 使用更低位移比例。

随后项目用 `feColorMatrix` 分别抽取三个颜色通道，再用 `feBlend` 的 screen 模式合成，从而得到类似 chromatic aberration 的边缘色散。为了避免整个中心区域都被彩边污染，项目还从位移贴图生成 `EDGE_MASK`，把色散限制在边缘区域，再用反向 mask 保留中心原图。

项目支持四种 `mode`：

- `standard`：默认位移贴图。
- `polar`：更偏径向或极坐标感的位移贴图。
- `prominent`：更强、更显眼的位移贴图。
- `shader`：运行时通过 Canvas 2D 根据 `fragmentShaders.liquidGlass` 生成位移贴图 data URL。

前三种模式本质上是预制 base64 图片贴图，视觉稳定但不随真实形状做复杂变化。`shader` 模式听起来更接近 shader，但实际是在 CPU 上逐像素计算位移图，然后转成 `canvas.toDataURL()` 给 SVG filter 使用。它不是 WebGL shader，也不是每帧 GPU 渲染。

### 3.4 磨砂、暗化和环境适配

玻璃的 frosty 感主要由 `.glass__warp` 层的 CSS 完成：

```ts
backdropFilter: `blur(${(overLight ? 12 : 4) + blurAmount * 32}px) saturate(${saturation}%)`;
```

这说明 `blurAmount` 并不是直接像素值，而是被放大到实际 blur 半径。`overLight` 为 true 时基础 blur 更强，同时还有两层黑色 overlay，帮助玻璃在亮背景上保持边界和内容可读性。

这个设计很实用。液态玻璃最大的问题之一就是亮背景上失去轮廓，`overLight` 相当于给消费方一个手动或自动暗化开关。示例项目也根据滚动区域亮度切换 `overLight`，体现了环境响应思路。

### 3.5 边框、高光与鼠标响应

项目没有只依赖 SVG filter，而是叠了两层边框高光：

- 使用 `padding: 1.5px` 配合 `maskComposite: exclude` 做出只显示边框区域的 mask。
- 使用随 `mouseOffset` 变化的 `linear-gradient`，让边缘光方向跟随鼠标。
- 分别用 `mixBlendMode: screen` 和 `mixBlendMode: overlay` 增加亮边层次。

鼠标响应分为两部分：

- 位移响应：监听 `mousemove`，计算鼠标相对容器中心的偏移，驱动边框渐变角度和亮度。
- 形变响应：根据鼠标距离和方向计算 `scaleX/scaleY` 与 `translate`，在 200px activation zone 内产生靠近、拉伸、压缩的弹性感。

`elasticity` 控制这个液态动效的强度。按钮示例中 `elasticity=0.35`，卡片示例中可以设为 0 以保持稳定。

### 3.6 对外能力

`liquid-glass-react` 提供的能力可以概括为：

- 支持任意 React children，适合按钮、徽标、小卡片、浮动工具条。
- 支持折射强度 `displacementScale`。
- 支持磨砂程度 `blurAmount`。
- 支持饱和度 `saturation`。
- 支持色散强度 `aberrationIntensity`。
- 支持弹性 `elasticity`。
- 支持圆角 `cornerRadius` 和 padding。
- 支持浅色背景暗化 `overLight`。
- 支持 mouse tracking 容器 `mouseContainer`，让组件响应更大区域的鼠标移动。
- 支持外部传入 `globalMousePos` 和 `mouseOffset`，可由宿主统一管理鼠标状态。
- 支持点击状态和 hover/press 反馈。

从产品开发角度，它最有价值的能力是“DOM children 可直接放进去”。这意味着 KernelOn 的真实按钮、Dock item、Spotlight input、Window toolbar 可以保留原生语义和布局，只在外层加材质。

### 3.7 工程优点

这个项目的优点很直接：

- 接入成本低：一个 React 组件即可使用，不需要管理 canvas、shader、render loop。
- 包体和依赖轻：运行时没有 Three.js、WebGL 库或大型图形依赖。
- 与 DOM 组合天然：children 不被 canvas 化，文本、图标、布局、事件都仍然是普通 React。
- 参数模型简单：适合沉淀成设计 token 或主题变体。
- 适合渐进增强：不支持位移的浏览器仍可退回到普通磨砂玻璃。
- 对业务 UI 友好：它把折射集中在边缘，不会破坏内容可读性。

### 3.8 主要限制与风险

#### SSR 与 Next.js App Router 风险

源码在 render 阶段直接访问 `navigator.userAgent`。如果在服务端渲染路径执行，会出现 `navigator is not defined`。在 KernelOn 的 Next.js App Router 中，这类组件必须位于 `"use client"` 边界内，或者通过动态导入禁用 SSR。库本身没有提供 `"use client"` 声明，也没有对 `typeof navigator === "undefined"` 做保护。

#### Tailwind 隐式耦合

库内部使用了大量 Tailwind class，例如 `relative`、`bg-black`、`pointer-events-none`、`mix-blend-overlay`、`transition-all`、`text-white` 等，但包本身没有声明 Tailwind 依赖，也没有发布 CSS 文件。消费方如果没有 Tailwind，或者 Tailwind 没有扫描到包内 class，部分布局、颜色、混合模式和过渡会失效。

对 KernelOn 来说，若采用这个项目，应该把这些 class 收敛为显式 CSS module、Tailwind 组件层或 `packages/ui` 内部样式，而不是直接依赖 node_modules 中的 utility class 被扫描。

#### 鼠标移动会触发 React 重渲染

内部 `mousemove` 每次都会 `setInternalMouseOffset` 和 `setInternalGlobalMousePos`。这会让组件在高频鼠标移动时不断重渲染。少量按钮可以接受，但如果 Dock、窗口、浮层里有许多实例，就会有明显成本。更稳妥的方式是使用 `requestAnimationFrame` 节流、CSS variables、Motion value 或外部统一 pointer store。

#### 每个实例生成 SVG filter 和多层 overlay

每个 `LiquidGlass` 都会生成独立 SVG filter、多个 overlay/span 和边框层。单个实例没问题，多实例列表或大面积卡片墙会造成 DOM 和合成层膨胀。它适合“少量系统控件”，不适合“每个业务表格单元格都玻璃化”。

#### 形状与尺寸监听不完整

组件用 `getBoundingClientRect()` 在 mount 和 window resize 时更新 `glassSize`，没有使用 `ResizeObserver` 监听 children 内容变化。如果内容异步加载、字体变化、容器自适应或状态切换导致尺寸改变，位移贴图、overlay 尺寸和实际视觉可能短暂错位。

#### 位移贴图不是物理模型

`standard`、`polar`、`prominent` 都是预制贴图；`shader` 模式也是 CPU 生成的二维位移图。它没有根据真实背景亮度、真实形状 SDF、材质厚度或光线方向做完整计算。视觉上够像，但本质是艺术化近似。

#### 浏览器兼容性有限

README 明确提示 Safari 和 Firefox 只部分支持效果，位移不可见。源码中特别对 Firefox 关闭了 SVG filter，但 Safari 的行为仍依赖浏览器实现。由于项目高度依赖 `backdrop-filter`、SVG filter、mix-blend-mode 和 mask，跨浏览器一致性需要实际回归。

#### 语义与可访问性需要宿主补齐

组件根节点是 `div`，虽然支持 `onClick`，但没有自动提供 `button` 语义、键盘触发、focus ring、disabled 状态或 ARIA 属性。作为产品控件使用时，KernelOn 应该在上层封装 `GlassButton`、`GlassToolbarButton`、`GlassSurface`，让语义控件包裹材质，而不是把可点击 div 当按钮。

### 3.9 在 KernelOn 中的适配判断

`liquid-glass-react` 更适合作为 KernelOn 第一阶段玻璃材质的参考或改造基底，但不建议原样引入后到处使用。合理路径是：

- 抽取视觉参数，转为 Tailwind CSS 4 `@theme` 和语义 token。
- 修复 SSR 防护和 `"use client"` 边界。
- 用 ResizeObserver 更新尺寸。
- 用 CSS variables 或 Motion value 降低鼠标移动重渲染。
- 提供无位移、低模糊、高对比三种降级。
- 只用于 Dock、Spotlight、浮动工具条、窗口顶部栏、轻量 Popover 等系统级部件。

它的优势是能快速形成产品可用材质；它的上限是无法承担高保真的全屏液态玻璃渲染系统。

## 4. `liquid-glass-studio` 的实现方式、能力与限制

### 4.1 项目定位

`liquid-glass-studio` 是一个基于 Vite + React 19 的交互式图形实验室。它不是 npm 组件库，而是一个完整应用，用 WebGL2 和 WebGPU 双后端复现高保真 Liquid Glass 效果，并提供 Leva 参数面板让使用者实时调参、切换背景、导入导出预设。

它的定位可以概括为：用 GPU shader 直接渲染液态玻璃材质，而不是用 CSS/SVG 在 DOM 上做近似。

项目特征：

- React 19 + Vite 6。
- 样式使用 SCSS module 和全局 SCSS。
- 参数面板使用 Leva，并定制了若干 Leva 控件。
- 动效使用 `@react-spring/web` 的 `Controller`。
- 图形后端包括 WebGL2 GLSL 和 WebGPU WGSL。
- 背景支持程序图案、图片、视频和自定义上传。
- 预设支持 JSON 导入导出。
- OpenSpec 文档记录了 glass rendering、shape、background、parameter controls、preset 等需求。

### 4.2 应用层架构

`src/App.tsx` 是项目中枢，承担了较多职责：

- 初始化 canvas 尺寸、DPR 和居中窗口。
- 检测 WebGPU 支持。
- 维护 WebGL/WebGPU 当前后端。
- 创建 active renderer。
- 处理后端切换时的 canvas remount。
- 管理背景纹理 URL、类型、加载状态和视频元素。
- 维护鼠标位置、spring 动画和速度。
- 每帧更新 uniforms 并调用 renderer。
- 渲染头部、参数面板、预设按钮和可缩放 canvas 窗口。

项目使用 `stateRef` 保存 render loop 所需的大量可变状态，避免每帧进入 React state 更新。这是图形应用常见做法：React 负责 UI 控制面板和 canvas 容器，真正的渲染循环走 imperative ref。

架构上，`studio` 已经把 renderer 抽象为 `IMultiPassRenderer`：

```ts
resize(width, height);
setUniform(name, value);
setUniforms(uniforms);
clearUniform(name);
clearAllUniforms();
render(passUniforms);
dispose();
```

WebGL2 的 `MultiPassRenderer` 和 WebGPU 的 `GPUMultiPassRenderer` 都实现这个接口，使 `App.tsx` 的渲染循环可以基本后端无关。

### 4.3 四阶段多 pass 渲染管线

`studio` 的玻璃效果通过四个 pass 完成：

1. `bgPass`：渲染背景，并把玻璃形状的阴影烘在背景上。
2. `vBlurPass`：对背景 pass 输出做纵向 Gaussian blur。
3. `hBlurPass`：对纵向模糊结果做横向 Gaussian blur。
4. `mainPass`：读取原始背景和模糊背景，根据玻璃形状、法线、折射、色散、Fresnel、高光、tint 生成最终画面。

这种管线比 `liquid-glass-react` 更接近真实材质，因为它拥有完整的背景纹理输入，并且能在 shader 中按像素决定“此处采样模糊背景还是原始背景”“此处采样坐标偏移多少”“RGB 三通道偏移是否不同”。

Gaussian blur 使用 separable blur，分成横纵两个一维 pass。控制面板的 `blurRadius` 范围到 200，shader 中也定义 `MAX_BLUR_RADIUS = 200`。这能获得很强的磨砂效果，但 radius、canvas 尺寸和 DPR 都会直接推高采样成本。

### 4.4 背景系统

背景系统支持四类来源：

- 程序图案：棋盘格、方向条纹、半屏明暗分割。
- 内置图片：Tahoe light、buildings、text、Tim Cook、UI mockup 等。
- 内置视频：fish、traffic、flower 等。
- 用户上传：通过 file input 上传图片或视频，并使用 object URL。

`fragment-bg.glsl` 根据 `u_bgType` 选择不同背景。图片和视频会被加载为 GPU texture，并通过 cover-fit UV 逻辑适配 canvas 宽高比。视频背景会在每帧上传当前视频帧到 GPU。

背景 pass 还负责阴影。它根据玻璃形状 SDF 计算：

```glsl
shadow = exp(-1.0 / u_shadowExpand * abs(merged) * resolution) * 0.6 * u_shadowFactor
```

再从背景色中减去阴影。这让玻璃不只是浮在背景上，而是有轻微压暗的空间关系。

### 4.5 形状系统：SDF、Superellipse 与 blob 融合

`studio` 的形状由 `src/shaders/lib/sdf.glsl` 定义。

主形状是可配置的圆角矩形，但角部不是普通 CSS border-radius，而是通过 superellipse corner SDF 计算。控制项包括：

- `shapeWidth`
- `shapeHeight`
- `shapeRadius`
- `shapeRoundness`

此外项目还有一个可选的 secondary circle shape，默认在 canvas 中心。主形状跟随鼠标 spring 位置移动，secondary circle 可以通过 `showShape1` 开关显示。两者通过 smooth minimum 函数 `smin` 融合，`mergeRate` 控制融合程度，从而得到 blob 式形状粘连。

这套形状系统比 `liquid-glass-react` 的圆角参数强很多，因为它不是 CSS 圆角，而是 shader 中可微、可求法线、可融合的几何场。折射、高光、阴影都能从同一个 SDF 派生。

### 4.6 折射、色散与 Fresnel

`fragment-main.glsl` 是核心 glass shader。它先计算当前像素相对玻璃形状的 SDF 值 `merged`，如果像素在玻璃内部或边缘附近，就进入玻璃合成逻辑。

折射的关键步骤是：

1. 计算 `nmerged`，即像素到边缘的内部距离。
2. 根据 `u_refThickness` 判断是否处于折射边缘厚度范围内。
3. 通过近似 Snell 定律的角度计算得到 `edgeFactor`。
4. 通过 SDF 差分得到法线 `normal`。
5. 用 `normal * edgeFactor` 偏移背景采样坐标。

色散通过 `getTextureDispersion` 完成。项目定义了三个通道折射系数：

- `N_R = 0.98`
- `N_G = 1.0`
- `N_B = 1.02`

采样时 R/G/B 分别使用不同偏移比例，再合成一个像素。这比 `liquid-glass-react` 的 SVG 三通道 displacement 更可控，因为它直接发生在当前背景纹理采样阶段。

Fresnel 使用经验曲线近似。它根据边缘距离、`u_refFresnelRange`、`u_refFresnelHardness` 和 `u_refFresnelFactor` 计算反射强度，再混合到更亮的 tint 或白色。项目还使用 LCH 色彩空间处理 Fresnel 和 glare tint，让亮度提升更接近感知均匀，而不是直接在 sRGB 中粗暴加白。

### 4.7 眩光与高光

眩光由法线方向和 `u_glareAngle` 决定。shader 把 normal 转成角度，结合 glare range、hardness、convergence、opposite factor 和 glare factor 计算高光强度。

这套模型的优势是方向明确，能模拟光源方向变化。与 `liquid-glass-react` 的鼠标渐变高光相比，`studio` 的高光更接近材质表面的 specular response。它可以用于高保真展示，但参数也更敏感：强度稍高就会显得过曝或游戏化。

### 4.8 动画与鼠标交互

鼠标位置通过 canvas pointer move 更新，`@react-spring/web` 的 `Controller` 生成平滑的 `mouseSpring`。项目还记录 spring 的速度，并用速度影响形状尺寸：

- x 方向速度影响 `shapeWidth`。
- y 方向速度影响 `shapeHeight`。
- `springSizeFactor` 控制形变幅度。

这使主玻璃形状在快速移动时会被拉伸，形成液态跟随感。与 `liquid-glass-react` 对 DOM 元素做 scale/translate 不同，`studio` 是直接在 SDF 几何层改变形状，视觉连续性更强。

### 4.9 WebGL2 后端

WebGL2 后端由 `src/utils/GLUtils.ts` 实现，包括：

- `ShaderProgram`：编译、链接 shader，检测 attributes 和 uniforms。
- `FrameBuffer`：创建 RGBA16F color texture 和 depth texture。
- `RenderPass`：封装单个 pass 的 shader、FBO、VAO 和 render。
- `MultiPassRenderer`：按顺序执行多个 pass，合并 global uniforms、per-pass uniforms 和前序 pass 输出纹理。

WebGL2 后端需要 `EXT_color_buffer_float` 扩展，因为中间 framebuffer 使用 `RGBA16F`。这让中间结果有更高动态范围和更平滑的颜色，但也意味着一些设备或浏览器可能无法运行。

### 4.10 WebGPU 后端

WebGPU 后端由 `src/utils/GPUUtils.ts`、`src/utils/gpuDetect.ts` 和 `src/shaders-wgsl/` 实现。它不是简单换 API，而是完整复制了一套现代 GPU pipeline：

- 启动时通过 `navigator.gpu.requestAdapter()` 和 `adapter.requestDevice()` 检测能力。
- `GPUMultiPassRenderer` 实现与 WebGL2 相同的 public interface。
- 每个 pass 创建 `GPURenderPipeline`、bind group layout 和 fullscreen quad vertex buffer。
- 中间 framebuffer 使用 `rgba16float` GPUTexture。
- uniforms 被打包到 160 bytes 的 uniform buffer，blur weights 使用 storage buffer。
- 图片通过 `Image` + `createImageBitmap` + `copyExternalImageToTexture` 上传。
- 视频帧通过 `createImageBitmap(video)` 后复制到 GPU texture。
- WebGL 和 WebGPU context 不能共用一个 canvas，因此后端切换时通过 React `key` 强制 remount canvas。

WebGPU 版本体现了较强工程深度，尤其是处理了坐标系、texture origin、WGSL strictness、uniform buffer alignment、`asin` 越界、`normalize(0)` 等常见坑。

但需要注意：OpenSpec 的 WebGPU 变更明确说明，WGSL 主 pass 只实现了 `STEP==9` 的最终合成，不支持 WebGL shader 中 `STEP 0-8` 的调试可视化。这是一个合理取舍，但意味着 WebGPU 后端并非完整功能等价。

### 4.11 参数控制与预设

`src/Controls.tsx` 使用 Leva 定义参数面板，参数覆盖：

- renderer：WebGL / WebGPU。
- language：英文、简体中文、乌兹别克语。
- refraction：厚度、折射率、色散。
- Fresnel：范围、硬度、强度。
- glare：范围、硬度、收敛、反侧强度、整体强度、角度。
- blur：半径、edge blur 开关。
- tint：RGBA。
- shadow：扩散、强度、位置。
- background：背景类型选择和自定义上传。
- shape：宽、高、半径、roundness、mergeRate、secondary shape。
- animation：spring size factor。
- debug：STEP 0-9。

`presetUtils.ts` 提供参数 JSON 导入导出，包含 `version`、`timestamp` 和完整 controls。这个能力让它更像一个材质调参工作台，可以帮助设计师和工程师共同找到一组材质参数。

### 4.12 工程优点

`studio` 的优点主要在高保真和可探索性：

- 材质保真度高：折射、色散、Fresnel、glare、shadow、blur 都在 shader 中统一合成。
- 参数覆盖全面：可以精细探索液态玻璃的视觉边界。
- 背景覆盖真实：支持图片、视频、明暗图案，便于评估不同背景下的可读性。
- 渲染管线清晰：四 pass 管线符合高质量实时材质的常见架构。
- SDF 形状强大：支持 Superellipse、圆形、smooth merge 和速度形变。
- 调试能力好：WebGL 下 STEP 0-9 能观察 SDF、normal、edge factor、blur、refraction、Fresnel、glare 等阶段。
- WebGPU 探索价值高：已经搭建了与 WebGL 并行的抽象层和 WGSL port。
- 预设导入导出适合设计资产沉淀。

### 4.13 主要限制与风险

#### 它不是可直接复用的 UI 组件库

`studio` 的产物是一个 canvas 应用，不是 `GlassSurface` 或 `GlassButton` 组件。它没有把材质封装为可在业务 DOM 中任意组合的 React primitive。要在 KernelOn 中使用，需要先抽取 renderer、shader、参数 schema、React wrapper 和降级策略。

#### DOM 内容无法自然进入玻璃形状内部

当前 TODO 中仍有“UI Content inside of shape”“Glass Text Rendering”等未完成项。也就是说，玻璃形状内部主要是像素效果，不是可访问、可选择、可布局的真实 DOM。对于管理平台里的表单、按钮、表格和菜单，这是一条很硬的边界。

#### 代码组织仍偏实验室

`App.tsx` 集中了渲染循环、纹理生命周期、后端切换、背景选择、spring 动画和 UI 装配。对实验项目可接受，但如果进入 KernelOn 主仓库，需要拆成：

- 渲染核心包。
- shader asset 与编译策略。
- React canvas wrapper。
- 参数 schema 和 token 映射。
- preset/调试工具。
- 业务可用的受控组件 API。

#### 性能成本高且需要预算

四 pass 渲染、DPR 画布、RGBA16F framebuffer、大半径 blur、视频纹理逐帧上传、WebGPU uniform/storage buffer 每帧创建，都会产生真实成本。它适合少量大视觉场景，不适合在普通业务页面中开多个实例。

KernelOn 若采用这种路线，比较适合：

- 全屏动态壁纸。
- 登录页或品牌展示页。
- AI Spotlight 背景特效。
- 设计调参工具。
- 少量沉浸式演示模块。

不适合：

- 多窗口同时开多个 canvas glass renderer。
- 每个业务卡片独立 WebGL pass。
- 表格、表单、审批流等高频信息密度区域。

#### 浏览器和设备差异更复杂

WebGL2 依赖 `EXT_color_buffer_float`。WebGPU 依赖浏览器 API、adapter、device、驱动和安全上下文。虽然项目提供了检测和禁用逻辑，但生产产品必须有明确 fallback，否则用户可能看到空白 canvas 或低质量材质。

#### WebGPU 与 WebGL 功能未完全对齐

WebGPU 主 pass 当前只追求最终合成等价，不支持 STEP 0-8 调试。GLSL 和 WGSL 也存在重复实现，长期维护时容易出现参数、公式或 bug fix 一边更新另一边遗漏。

#### 可访问性与语义缺失

Canvas 渲染的是像素，不是语义 UI。屏幕阅读器、键盘导航、焦点态、文本选择、原生交互都需要额外 DOM 层实现。对于 KernelOn 这类管理平台，canvas glass 只能做视觉层，不能替代真实控件层。

### 4.14 在 KernelOn 中的适配判断

`liquid-glass-studio` 不适合直接作为 KernelOn UI 组件引入。它只适合作为一次性源码研究样本，帮助我们判断什么不应该进入运行时：

- 它证明高保真 Liquid Glass 需要控制 SDF、折射、色散、Fresnel、glare 等参数。
- 它也证明这些能力如果以 canvas 应用形态进入 UI，会破坏 DOM 语义和组件边界。
- KernelOn 可以吸收它的视觉判断，但不继承它的运行时架构。
- 不直接移植它的 Leva、debug step、WebGL/WebGPU renderer。
- 如果未来需要调参工具，也应围绕 KernelOn `GlassSurface` 自己建设，而不是把 `studio` 变成第二套运行时。

如果未来要产品化，建议先抽离为独立 experimental package，不要直接塞进 `packages/ui` 或业务模块。

## 5. 纵向、深入、全面的对比

### 5.1 核心差异总览

| 维度                     | `liquid-glass-react`                           | `liquid-glass-studio`                        |
| ------------------------ | ---------------------------------------------- | -------------------------------------------- |
| 项目定位                 | React 玻璃容器组件                             | WebGL/WebGPU 液态玻璃实验室                  |
| 主要目标                 | 快速给 DOM UI 加玻璃质感                       | 高保真复现 Liquid Glass 材质                 |
| 渲染路线                 | CSS backdrop-filter + SVG filter + DOM overlay | 多 pass GPU shader 渲染                      |
| 背景来源                 | 浏览器 backdrop 自动采样 DOM 背景              | 显式渲染背景纹理，再在 shader 采样           |
| 折射方式                 | SVG displacement map 近似边缘折射              | SDF 法线 + 折射厚度 + UV 偏移                |
| 色散方式                 | RGB 三次 `feDisplacementMap` 后合成            | RGB 通道按不同折射率采样背景                 |
| Fresnel                  | 没有严格 Fresnel 模型，主要靠边缘高光近似      | shader 中显式计算 Fresnel factor             |
| 眩光                     | 鼠标驱动的渐变边框和 overlay                   | 法线角度 + glare angle + LCH 高光            |
| 形状能力                 | CSS 圆角和预制位移贴图                         | SDF 圆角矩形、圆形、smooth merge、速度形变   |
| DOM children             | 原生支持                                       | 当前不支持真实 DOM 嵌入                      |
| 可访问性基础             | 可通过宿主封装语义控件补齐                     | 需要额外 DOM 层承载语义                      |
| 接入成本                 | 低                                             | 高                                           |
| 运行成本                 | 中低，随实例数量升高                           | 中高，随 canvas 尺寸、DPR、blur、视频升高    |
| 浏览器风险               | SVG filter/backdrop-filter 兼容差异            | WebGL2 extension/WebGPU/驱动差异             |
| 参数探索                 | 基础参数                                       | 非常全面                                     |
| 调试能力                 | 主要靠示例和视觉调参                           | WebGL STEP 0-9 中间结果可视化                |
| 适用位置                 | Dock、按钮、浮层、小卡片、工具条               | 全屏特效、材质实验、品牌展示、Spotlight 背景 |
| 对 KernelOn 的直接可用性 | 中等，需封装和修复                             | 低，需工程化抽取                             |

### 5.2 视觉保真度对比

`liquid-glass-react` 的视觉保真度来自“多个廉价技巧叠加”：backdrop blur 提供磨砂，SVG displacement 提供边缘扭曲，RGB 通道分离提供色散，边框渐变和 overlay 提供高光。它适合在真实 UI 中营造“够像、够轻、够可用”的材质。

`liquid-glass-studio` 的视觉保真度来自“统一的像素级材质模型”：背景是纹理，玻璃是 SDF，边缘有法线，折射按厚度计算，色散按通道采样，Fresnel 和 glare 按几何关系合成。它更像一个真正的玻璃渲染器。

如果目标是“管理平台可长期使用”，`react` 的保真度已经足够用于系统控件。如果目标是“展示 KernelOn 的前沿 Web OS 质感”，`studio` 的上限更高。

### 5.3 DOM 组合能力对比

这是两者最关键的产品差异。

`liquid-glass-react` 直接包裹 children，因此它适合真实业务 UI。按钮仍然可以是按钮，图标仍然是 SVG 或 icon font，文字仍然是 DOM 文本，Popover 仍然能做键盘导航。

`liquid-glass-studio` 的核心输出是 canvas 像素。它可以画出非常真实的玻璃，但玻璃内部不是 DOM 布局上下文。要在其中放文本或按钮，要么把 DOM 叠在 canvas 上并同步形状位置，要么把内容绘制进纹理，要么做复杂的 DOM capture。这些方案都比普通 UI 组件重得多。

所以，KernelOn 的业务应用窗口、表单、列表、资料库、导师匹配操作等，不应该依赖 `studio` 式 canvas glass 承载主要内容。它最多作为背景层或特殊系统动效层。

### 5.4 性能曲线对比

`liquid-glass-react` 的性能瓶颈在 DOM 合成：

- 多个 `backdrop-filter` 区域会增加浏览器合成压力。
- SVG filter 和 mask 在多实例时成本明显。
- 每个实例监听鼠标并 setState，会增加 React 重渲染。
- 多层 overlay 会增加 paint/composite 工作。

它的优化方向是减少实例数、统一鼠标状态、用 CSS variables 驱动视觉、控制模糊半径、做组件级降级。

`liquid-glass-studio` 的性能瓶颈在 GPU pass：

- canvas 越大，四个 pass 的像素处理越多。
- DPR 越高，实际渲染像素呈平方级增长。
- blur radius 越大，采样次数越高。
- 视频背景每帧上传纹理。
- WebGPU 后端每帧创建 uniform/storage buffer，有进一步优化空间。

它的优化方向是限制 canvas 面积、控制 DPR、降低 blur radius、缓存 buffer、减少纹理上传、只在可见/交互时渲染。

简单说：`react` 适合少量 DOM 材质实例，`studio` 适合少量大画布材质场景。两者都不适合无限制铺满业务界面。

### 5.5 兼容性对比

`liquid-glass-react` 的兼容问题主要来自 CSS/SVG：

- `backdrop-filter` 的质量和性能依赖浏览器。
- SVG displacement 在 Safari/Firefox 上支持不完整。
- mix-blend-mode、mask-composite 在不同浏览器上可能有差异。
- SSR 需要显式 client boundary。

`liquid-glass-studio` 的兼容问题主要来自图形 API：

- WebGL2 必须存在。
- `EXT_color_buffer_float` 必须存在。
- WebGPU 需要安全上下文、浏览器支持、GPU adapter 和 device。
- 移动端、远程桌面、低端显卡或企业锁定浏览器都有潜在问题。

对 KernelOn 首期 Web 应用而言，CSS/SVG 的兼容降级更容易控制；WebGPU/WebGL 路线要作为增强层，不能成为关键业务功能依赖。

### 5.6 工程化成熟度对比

`liquid-glass-react` 工程规模小，但要进入生产仍需打磨：

- 需要 SSR 防护。
- 需要去 Tailwind 隐式依赖。
- 需要补可访问性封装。
- 需要优化鼠标状态更新。
- 需要建立视觉 token 和 fallback。

`liquid-glass-studio` 工程规模大，图形能力强，但更像研发原型：

- `App.tsx` 职责过多。
- shader 双后端维护复杂。
- 缺少自动化测试和视觉回归。
- WebGPU 手动验证项未全部完成。
- 没有可复用组件 API。

一个轻，一个深。`react` 缺的是产品级硬化，`studio` 缺的是组件化和平台化。

### 5.7 参数模型对比

`liquid-glass-react` 的参数适合直接转为 UI token：

- `blurAmount`
- `saturation`
- `displacementScale`
- `aberrationIntensity`
- `elasticity`
- `cornerRadius`
- `overLight`
- `mode`

这些参数足够定义 KernelOn 的日常玻璃材质变体，例如：

- `glass.subtle`
- `glass.panel`
- `glass.dock`
- `glass.spotlight`
- `glass.overLight`

`liquid-glass-studio` 的参数更适合视觉研发和高保真场景：

- refraction thickness/factor/dispersion
- Fresnel range/hardness/factor
- glare range/hardness/convergence/opposite/factor/angle
- shape width/height/radius/roundness/merge
- shadow expand/factor/position
- blur radius/edge
- tint

这些参数不应全部暴露给业务开发者。更适合由设计和前端共同调出少量 preset，再沉淀为 token。

### 5.8 对 KernelOn 的推荐取舍

如果 KernelOn 要引入 Liquid Glass，不建议再采用多层多引擎策略。那会把视觉能力拆成几套并行系统，短期看灵活，长期看会变成每个场景都在重新选择技术路线。

更正确的取舍是单一运行时策略：

1. 只建设一个产品级材质入口：KernelOn `GlassSurface`。
2. 只选择一个底层开源基座：`samasante/liquid-glass`。
3. 只允许一种业务消费方式：通过 `packages/ui` 的语义组件和 preset 使用。
4. 不为特殊场景额外引入第二套 glass runtime。特殊场景如果有更高要求，也必须回到同一个 `GlassSurface` 契约里增强。

明确淘汰的路径：

- 不建议继续扩展 `liquid-glass-react`。它已经暴露出跨场景不稳定问题，继续围绕它补丁化会把材质系统做窄。
- 不建议把 `liquid-glass-studio` 工程化进 Shell。它是 shader 实验室，不是 UI 材质库。
- 不建议把 `ybouane/liquidglass` 作为隐藏的高级模式。它的 DOM capture/root 约束会把 Shell 结构反过来绑死。
- 不建议在业务组件里暴露“选择哪种 glass 引擎”的能力。业务只应该选择语义和强度，不应该选择渲染路线。
- 不建议把 Liquid Glass 做成“Apple 仿制主题”。KernelOn 应该吸收其交互质量和材质层次，但形成自己的明亮、克制、工作台化语言。

## 6. 小结

四仓复评后，KernelOn 的推荐路径不应该是分层并存，而应该是单一裁决：产品运行时只保留一个液态玻璃基座。

`liquid-glass-react` 不适合作为全局材质基座。用户已经在右键菜单之外遇到“材质丢失”的问题，这与它强依赖特定层叠、背景、filter、定位和小型浮层场景的实现方式一致。它的问题不是热度不够，而是抽象不够强。

`liquid-glass-studio` 不适合进入业务 UI 组件体系。它可以证明什么样的玻璃更真实，但不能承载 KernelOn 的菜单、Dock、窗口、Widget 和业务 App 语义。

`ybouane/liquidglass` 也不适合作为通用 UI 基座。它的场景级 DOM capture + WebGL 折射很强，但 root 结构、直接子元素约束、捕获成本、CORS/字体/动态内容风险和命令式生命周期，都会让 Shell 反过来迁就材质引擎。

`samasante/liquid-glass` 是四个项目里唯一值得进入 KernelOn 产品级材质系统的底座。它把玻璃做成 headless React primitive，保留真实 DOM、ARIA、input 和布局能力，同时提供 material、refract、src、draw、lenses、motion value 和跨浏览器降级。它虽然年轻，但架构方向是对的。

因此最终建议是：KernelOn 最多只保留一个液态玻璃运行时，即基于 `samasante/liquid-glass` 思路收敛出的自有 `GlassSurface`。其他三个项目不进入产品运行时，不作为 fallback，不作为特殊模式，不作为第二引擎。这样架构才干净：一个材质契约，一个组件入口，一套 preset，一处处理浏览器差异和性能降级。
