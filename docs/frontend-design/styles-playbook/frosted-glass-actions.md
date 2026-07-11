# 清透磨砂玻璃样式

本文完整沉淀清透磨砂玻璃样式。该方案不模拟光学折射，而是通过极低不透明度的填充、轻量 `backdrop-filter`、单像素边缘高光和克制阴影，形成稳定、低成本、可复用的磨砂玻璃质感。

适用场景：Hero 主操作、图片预览浮层、媒体控制条和背景变化频繁但不需要真实折射的业务按钮。

## 1. 最终视觉构成

材质由四层组成：

1. `rgba(255, 255, 255, 0.025)` 的极淡白色基底，避免按钮变成灰色实体。
2. 自上而下 `0.075 → 0.012` 的白色渐变，提供玻璃表面朝向。
3. `1px / 0.16` 的外轮廓与两条轻微 inset 高光，保持边缘连续。
4. `blur(2px) saturate(1.02)` 的低强度背景模糊，保留图片细节和清透感。

按钮高度固定为 `42px`，圆角使用胶囊形 `999px`。主按钮宽 `190px`，轻操作按钮宽 `80px`。

## 2. 推荐 DOM

```tsx
<span className="hero-frosted-action hero-frosted-action--preview">
  <button className="hero-frosted-button hero-frosted-button--preview" type="button">
    <Play aria-hidden="true" />
    <span>View Wallpaper</span>
  </button>
</span>

<span className="hero-frosted-action hero-frosted-action--like">
  <button
    aria-label="Like wallpaper"
    aria-pressed={liked}
    className="hero-frosted-button hero-frosted-button--like"
    type="button"
  >
    <Heart aria-hidden="true" />
    <span>19</span>
  </button>
</span>
```

外层只负责尺寸和布局，原生 `button` 承载全部交互、ARIA 和焦点行为。不要用 `div` 模拟按钮。

## 3. 完整 CSS 配方

```css
.hero-frosted-action {
  position: relative;
  display: block;
  height: 42px;
  overflow: visible;
  flex: 0 0 auto;
}

.hero-frosted-action--preview {
  width: 190px;
}

.hero-frosted-action--like {
  width: 80px;
}

.hero-frosted-button {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  width: 100%;
  height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: visible;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.012)),
    rgba(255, 255, 255, 0.025);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 rgba(255, 255, 255, 0.03),
    0 6px 14px rgba(0, 0, 0, 0.05);
  color: rgba(255, 255, 255, 0.94);
  padding: 0 18px;
  -webkit-backdrop-filter: blur(2px) saturate(1.02);
  backdrop-filter: blur(2px) saturate(1.02);
  font-size: 15px;
  font-weight: 800;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.18);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease,
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-frosted-button::before {
  position: absolute;
  inset: 1px 1px auto;
  z-index: -1;
  height: 42%;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  content: '';
  pointer-events: none;
}

.hero-frosted-button--like {
  padding: 0 15px;
}

.hero-frosted-button:hover {
  border-color: rgba(255, 255, 255, 0.24);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.025)),
    rgba(255, 255, 255, 0.04);
  color: #fff;
}

.hero-frosted-button:active {
  transform: scale(0.985);
}

.hero-frosted-button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.74);
  outline-offset: 2px;
}

.hero-frosted-button > svg,
.hero-frosted-button > span {
  position: relative;
  z-index: 2;
}
```

## 4. 为什么这套参数有效

- 模糊只有 `2px`：背景仍能被识别，视觉上是清透磨砂而非乳白塑料。
- 填充透明度低于 `0.08`：主要依靠真实背景，而不是用白色模拟玻璃。
- 边缘只有一条 CSS border：不会和多层 inset ring 叠成双边框。
- 阴影透明度仅 `0.05`：提供悬浮层次，但不产生深色胶囊感。
- 顶部高光只覆盖 `42%` 高度：建立表面方向，又不会形成整块白雾。
- hover 只小幅提高填充和边缘亮度；active 使用 `0.985`，反馈清晰但不跳动。

## 5. 使用约束

- 必须放在有真实图像或纹理的背景上；纯色背景会削弱材质层次。
- 不要把 blur 提高到 `12px+` 后仍称为“清透”版本；那会变成传统重磨砂。
- 不要额外叠加第二条 border、outline 或常驻 focus ring。
- 图标与文字不要应用 `backdrop-filter` 或 SVG filter，必须保持清晰。
- 视觉层若被抽成伪元素，必须设置 `pointer-events: none`。
- 低端设备可直接移除 `backdrop-filter`；渐变、边缘和阴影仍能提供可接受降级。

## 6. 验收清单

- 在亮天空、暗建筑、海浪和高频纹理背景上均无大面积白团。
- 背景细节透过按钮可辨认，但文字始终清晰。
- 轮廓只有一层，圆角边缘连续。
- hover、active、Tab/Enter/Space 行为完整。
- 快速轮播时没有 canvas、异步 capture 或首帧 readiness 问题。
- 多实例成本主要是小面积 CSS 合成，适合比真实液态折射更广泛的业务场景。
