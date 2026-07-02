# LiquidGlassSvgFilter

`LiquidGlassSvgFilter` 是基于上游 `liquid-glass-react` 的 `src` 源码迁移到 KernelOn 全局组件库的源码级实现。组件后缀 `svg-filter` 表示该版本以 SVG filter、displacement map 和 CSS `backdrop-filter` 为核心实现方式，用于和后续其它 Liquid Glass 实现区分。

## 实现方式

- `index.tsx` 提供 React 组件本体，使用 SVG filter、`backdrop-filter`、多层边框/高光覆盖层和鼠标位置驱动的弹性 transform 生成 Liquid Glass 效果。
- `utils.ts` 内置 `standard`、`polar`、`prominent` 三组 base64 displacement map。
- `shader-utils.ts` 在 `mode="shader"` 时通过 Canvas 生成 displacement map data URL。
- 该组件不引入新的样式系统或 KernelOn 视觉 token，保留源项目的内联样式和 Tailwind class 结构。

## 使用

```tsx
import { LiquidGlassSvgFilter } from '@kernelon/ui';

export function Example() {
  return (
    <LiquidGlassSvgFilter padding="12px 20px" mode="standard">
      <span>KernelOn</span>
    </LiquidGlassSvgFilter>
  );
}
```

## 可配置参数

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `children` | `React.ReactNode` | - | 渲染在玻璃容器内的内容。 |
| `displacementScale` | `number` | `70` | 折射位移强度；数值越大边缘弯曲越明显。 |
| `blurAmount` | `number` | `0.0625` | 毛玻璃模糊基数，会参与 `backdrop-filter` 的 blur 计算。 |
| `saturation` | `number` | `140` | 玻璃层的颜色饱和度百分比。 |
| `aberrationIntensity` | `number` | `2` | 色差强度，用于边缘 RGB 通道位移与高光过渡。 |
| `elasticity` | `number` | `0.15` | 鼠标靠近时的液态弹性系数；`0` 接近刚性，越大越明显。 |
| `cornerRadius` | `number` | `999` | 圆角半径，单位为 px。 |
| `globalMousePos` | `{ x: number; y: number }` | - | 外部传入的全局鼠标坐标；传入后可接管内部鼠标追踪。 |
| `mouseOffset` | `{ x: number; y: number }` | - | 外部传入的鼠标偏移量，用于调节边框高光方向。 |
| `mouseContainer` | `React.RefObject<HTMLElement \| null> \| null` | `null` | 鼠标追踪容器；未传入时使用组件自身。 |
| `className` | `string` | `""` | 追加到外层容器的 class。 |
| `padding` | `string` | `"24px 32px"` | 玻璃容器内边距，使用 CSS padding 写法。 |
| `style` | `React.CSSProperties` | `{}` | 追加到外层容器的内联样式。 |
| `overLight` | `boolean` | `false` | 是否位于浅色背景上；开启后会调整阴影、遮罩和位移强度。 |
| `mode` | `"standard" \| "polar" \| "prominent" \| "shader"` | `"standard"` | 折射模式；前三种使用内置 displacement map，`shader` 使用 Canvas 生成位移图。 |
| `onClick` | `() => void` | - | 点击回调；传入后启用可点击态、hover 高光和按下缩放。 |

> Safari 和 Firefox 对该效果只提供部分支持；源码在 Firefox 下会关闭 SVG filter 位移层。
