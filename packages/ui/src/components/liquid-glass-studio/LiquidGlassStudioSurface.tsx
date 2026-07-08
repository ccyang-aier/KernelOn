'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';

import { cn } from '../../class-names';
import { liquidGlassStudioDefaultControls } from './studio/defaultControls';
import { loadTextureFromURL, MultiPassRenderer } from './studio/rendering/GLUtils';
import {
  FragmentBgHblurShader,
  FragmentBgShader,
  FragmentBgVblurShader,
  FragmentMainShader,
  VertexShader,
} from './studio/shaders/glsl';
import { computeGaussianKernelByRadius } from './studio/utils';

export type LiquidGlassStudioSurfaceTone = 'hero' | 'header' | 'subtle';

export interface LiquidGlassStudioSurfaceProps {
  children: ReactNode;
  width: number;
  height: number;
  radius: number;
  backgroundImage: string;
  backgroundHostRef: RefObject<HTMLElement | null>;
  backgroundScrollRef?: RefObject<HTMLElement | null>;
  tone?: LiquidGlassStudioSurfaceTone;
  interactive?: boolean;
  className?: string;
}

type RenderMode = 'fallback' | 'shader';

export function LiquidGlassStudioSurface({
  backgroundHostRef,
  backgroundImage,
  backgroundScrollRef,
  children,
  className,
  height,
  interactive = false,
  radius,
  tone = 'hero',
  width,
}: LiquidGlassStudioSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>('fallback');
  const rootStyle = useMemo(
    () =>
      ({
        '--ko-studio-glass-radius': `${radius}px`,
        borderRadius: radius,
        display: 'inline-grid',
        flex: '0 0 auto',
        height,
        overflow: 'hidden',
        position: 'relative',
        verticalAlign: 'middle',
        width,
      }) as CSSProperties,
    [height, radius, width],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const surface = surfaceRef.current;

    if (!canvas || !surface || !backgroundImage) {
      setRenderMode('fallback');
      return undefined;
    }

    let disposed = false;
    let renderer: MultiPassRenderer | null = null;
    let texture: WebGLTexture | null = null;
    let textureRatio = 1;
    let frame = 0;

    setRenderMode('fallback');
    clearCanvas(canvas);

    const renderSurface = () => {
      if (disposed || !renderer || !texture) {
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const studioScale = getStudioCoordinateScale(height);
      const pixelWidth = Math.max(1, Math.round(width * dpr * studioScale));
      const pixelHeight = Math.max(1, Math.round(height * dpr * studioScale));
      const gl = canvas.getContext('webgl2');

      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      gl?.viewport(0, 0, pixelWidth, pixelHeight);
      renderer.resize(pixelWidth, pixelHeight);

      const sample = getBackgroundSample(surface, backgroundHostRef.current);
      const blurWeights = computeGaussianKernelByRadius(
        liquidGlassStudioDefaultControls.blurRadius,
      );
      const center: [number, number] = [pixelWidth / 2, pixelHeight / 2];
      const shapeWidth = Math.max(1, width * studioScale);
      const shapeHeight = Math.max(1, height * studioScale);
      const shapeRadius = Math.min(
        radius * studioScale,
        Math.min(shapeWidth, shapeHeight) / 2,
      );

      renderer.setUniforms({
        u_resolution: [pixelWidth, pixelHeight],
        u_dpr: dpr,
        u_blurRadius: liquidGlassStudioDefaultControls.blurRadius,
        u_blurWeights: blurWeights,
        u_mouse: center,
        u_mouseSpring: center,
        u_shapeWidth: shapeWidth,
        u_shapeHeight: shapeHeight,
        u_shapeRadius: shapeRadius,
        u_shapeRoundness: liquidGlassStudioDefaultControls.shapeRoundness,
        u_mergeRate: liquidGlassStudioDefaultControls.mergeRate,
        u_showShape1: 0,
      });

      renderer.render({
        bgPass: {
          u_bgType: 11,
          u_bgTexture: texture,
          u_bgTextureRatio: textureRatio,
          u_bgTextureReady: 1,
          u_bgSampleOffset: sample.offset,
          u_bgSampleScale: sample.scale,
          u_bgHostResolution: sample.hostResolution,
          u_shadowExpand: liquidGlassStudioDefaultControls.shadowExpand,
          u_shadowFactor: liquidGlassStudioDefaultControls.shadowFactor / 100,
          u_shadowPosition: [
            -liquidGlassStudioDefaultControls.shadowPosition.x,
            -liquidGlassStudioDefaultControls.shadowPosition.y,
          ],
        },
        mainPass: {
          u_tint: [
            liquidGlassStudioDefaultControls.tint.r / 255,
            liquidGlassStudioDefaultControls.tint.g / 255,
            liquidGlassStudioDefaultControls.tint.b / 255,
            liquidGlassStudioDefaultControls.tint.a,
          ],
          u_refThickness: liquidGlassStudioDefaultControls.refThickness,
          u_refFactor: liquidGlassStudioDefaultControls.refFactor,
          u_refDispersion: liquidGlassStudioDefaultControls.refDispersion,
          u_refFresnelRange: liquidGlassStudioDefaultControls.refFresnelRange,
          u_refFresnelHardness:
            liquidGlassStudioDefaultControls.refFresnelHardness / 100,
          u_refFresnelFactor:
            liquidGlassStudioDefaultControls.refFresnelFactor / 100,
          u_glareRange: liquidGlassStudioDefaultControls.glareRange,
          u_glareHardness: liquidGlassStudioDefaultControls.glareHardness / 100,
          u_glareConvergence:
            liquidGlassStudioDefaultControls.glareConvergence / 100,
          u_glareOppositeFactor:
            liquidGlassStudioDefaultControls.glareOppositeFactor / 100,
          u_glareFactor: liquidGlassStudioDefaultControls.glareFactor / 100,
          u_glareAngle: (liquidGlassStudioDefaultControls.glareAngle * Math.PI) / 180,
          u_blurEdge: liquidGlassStudioDefaultControls.blurEdge ? 1 : 0,
          STEP: liquidGlassStudioDefaultControls.step,
        },
      });
    };

    const scheduleRender = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(renderSurface);
    };

    try {
      renderer = createRenderer(canvas);
    } catch {
      setRenderMode('fallback');
      return undefined;
    }

    loadTextureFromURL(canvas.getContext('webgl2')!, backgroundImage)
      .then(({ ratio, texture: loadedTexture }) => {
        if (disposed) {
          canvas.getContext('webgl2')?.deleteTexture(loadedTexture);
          return;
        }

        texture = loadedTexture;
        textureRatio = ratio;
        setRenderMode('shader');
        scheduleRender();
      })
      .catch(() => {
        setRenderMode('fallback');
      });

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleRender);
    resizeObserver?.observe(surface);

    const host = backgroundHostRef.current;
    const scrollHost = backgroundScrollRef?.current;

    if (host) {
      resizeObserver?.observe(host);
    }

    window.addEventListener('resize', scheduleRender);
    scrollHost?.addEventListener('scroll', scheduleRender, { passive: true });

    return () => {
      disposed = true;
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('resize', scheduleRender);
      scrollHost?.removeEventListener('scroll', scheduleRender);
      resizeObserver?.disconnect();
      const gl = canvas.getContext('webgl2');
      if (texture) {
        gl?.deleteTexture(texture);
      }
      renderer?.dispose();
    };
  }, [backgroundHostRef, backgroundImage, backgroundScrollRef, height, radius, width]);

  return (
    <div
      className={cn('ko-liquid-glass-studio-surface', className)}
      data-interactive={interactive ? 'true' : undefined}
      data-render-mode={renderMode}
      data-slot="liquid-glass-studio-surface"
      data-tone={tone}
      ref={surfaceRef}
      style={rootStyle}
    >
      <canvas
        aria-hidden="true"
        className="ko-liquid-glass-studio-surface__canvas"
        data-slot="liquid-glass-studio-surface-canvas"
        ref={canvasRef}
        style={{ ...canvasStyle, opacity: renderMode === 'shader' ? 1 : 0 }}
      />
      {renderMode === 'fallback' ? (
        <span
          aria-hidden="true"
          data-slot="liquid-glass-studio-surface-fallback"
          style={fallbackStyle}
        />
      ) : null}
      <span data-slot="liquid-glass-studio-surface-content" style={contentStyle}>
        {children}
      </span>
    </div>
  );
}

function createRenderer(canvas: HTMLCanvasElement) {
  return new MultiPassRenderer(canvas, [
    { name: 'bgPass', shader: { fragment: FragmentBgShader, vertex: VertexShader } },
    {
      inputs: { u_prevPassTexture: 'bgPass' },
      name: 'vBlurPass',
      shader: { fragment: FragmentBgVblurShader, vertex: VertexShader },
    },
    {
      inputs: { u_prevPassTexture: 'vBlurPass' },
      name: 'hBlurPass',
      shader: { fragment: FragmentBgHblurShader, vertex: VertexShader },
    },
    {
      inputs: { u_bg: 'bgPass', u_blurredBg: 'hBlurPass' },
      name: 'mainPass',
      outputToScreen: true,
      shader: { fragment: FragmentMainShader, vertex: VertexShader },
    },
  ]);
}

function getBackgroundSample(surface: HTMLElement, host: HTMLElement | null) {
  const surfaceRect = surface.getBoundingClientRect();
  const hostRect = host?.getBoundingClientRect() ?? surfaceRect;

  return computeLiquidGlassStudioBackgroundSample(surfaceRect, hostRect);
}

export function computeLiquidGlassStudioBackgroundSample(
  surfaceRect: Pick<DOMRectReadOnly, 'bottom' | 'height' | 'left' | 'width'>,
  hostRect: Pick<DOMRectReadOnly, 'bottom' | 'height' | 'left' | 'width'>,
) {
  const hostWidth = Math.max(hostRect.width, surfaceRect.width, 1);
  const hostHeight = Math.max(hostRect.height, surfaceRect.height, 1);
  const left = clamp01((surfaceRect.left - hostRect.left) / hostWidth);
  const bottom = clamp01((hostRect.bottom - surfaceRect.bottom) / hostHeight);
  const width = clamp01(surfaceRect.width / hostWidth);
  const height = clamp01(surfaceRect.height / hostHeight);

  return {
    hostResolution: [hostWidth, hostHeight] as [number, number],
    offset: [left, bottom] as [number, number],
    scale: [width, height] as [number, number],
  };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function getStudioCoordinateScale(height: number) {
  return Math.max(1, liquidGlassStudioDefaultControls.shapeHeight / Math.max(height, 1));
}

function clearCanvas(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2');

  if (!gl) {
    return;
  }

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

const canvasStyle: CSSProperties = {
  height: '100%',
  inset: 0,
  pointerEvents: 'none',
  position: 'absolute',
  width: '100%',
  zIndex: 1,
};

const fallbackStyle: CSSProperties = {
  background: 'transparent',
  inset: 0,
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 0,
};

const contentStyle: CSSProperties = {
  display: 'grid',
  inset: 0,
  placeItems: 'stretch',
  position: 'absolute',
  zIndex: 4,
};
