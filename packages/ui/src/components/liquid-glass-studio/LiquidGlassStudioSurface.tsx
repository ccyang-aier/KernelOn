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
  tone?: LiquidGlassStudioSurfaceTone;
  interactive?: boolean;
  className?: string;
}

type RenderMode = 'fallback' | 'shader';

const tonePresets: Record<
  LiquidGlassStudioSurfaceTone,
  {
    blurRadius: number;
    tint: [number, number, number, number];
    refThickness: number;
    refFactor: number;
    refDispersion: number;
    refFresnelRange: number;
    refFresnelHardness: number;
    refFresnelFactor: number;
    glareRange: number;
    glareHardness: number;
    glareConvergence: number;
    glareOppositeFactor: number;
    glareFactor: number;
    glareAngle: number;
    shadowExpand: number;
    shadowFactor: number;
    shadowPosition: [number, number];
    shaderOpacity: number;
    shaderStep: number;
    shapeInset: number;
    shapeRoundness: number;
  }
> = {
  header: {
    blurRadius: 3,
    tint: [1, 1, 1, 0.024],
    refThickness: 8,
    refFactor: 1.12,
    refDispersion: 1.2,
    refFresnelRange: 62,
    refFresnelHardness: 0.04,
    refFresnelFactor: 0.055,
    glareRange: 68,
    glareHardness: 0.045,
    glareConvergence: 0.28,
    glareOppositeFactor: 0.35,
    glareFactor: 0.11,
    glareAngle: -0.82,
    shadowExpand: 18,
    shadowFactor: 0,
    shadowPosition: [0, 0],
    shaderOpacity: 0.52,
    shaderStep: 6,
    shapeInset: 1.5,
    shapeRoundness: 5.2,
  },
  hero: {
    blurRadius: 4,
    tint: [0.96, 1, 1, 0.032],
    refThickness: 9,
    refFactor: 1.14,
    refDispersion: 1.5,
    refFresnelRange: 58,
    refFresnelHardness: 0.045,
    refFresnelFactor: 0.07,
    glareRange: 64,
    glareHardness: 0.05,
    glareConvergence: 0.3,
    glareOppositeFactor: 0.38,
    glareFactor: 0.14,
    glareAngle: -0.74,
    shadowExpand: 20,
    shadowFactor: 0,
    shadowPosition: [0, 0],
    shaderOpacity: 0.56,
    shaderStep: 6,
    shapeInset: 1.5,
    shapeRoundness: 5.4,
  },
  subtle: {
    blurRadius: 2,
    tint: [1, 1, 1, 0.018],
    refThickness: 7,
    refFactor: 1.1,
    refDispersion: 0.8,
    refFresnelRange: 70,
    refFresnelHardness: 0.035,
    refFresnelFactor: 0.04,
    glareRange: 76,
    glareHardness: 0.04,
    glareConvergence: 0.24,
    glareOppositeFactor: 0.3,
    glareFactor: 0.08,
    glareAngle: -0.72,
    shadowExpand: 16,
    shadowFactor: 0,
    shadowPosition: [0, 0],
    shaderOpacity: 0.46,
    shaderStep: 6,
    shapeInset: 1.5,
    shapeRoundness: 5,
  },
};

export function LiquidGlassStudioSurface({
  backgroundHostRef,
  backgroundImage,
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
  const preset = tonePresets[tone];
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

    const renderSurface = () => {
      if (disposed || !renderer || !texture) {
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.max(1, Math.round(width * dpr));
      const pixelHeight = Math.max(1, Math.round(height * dpr));
      const gl = canvas.getContext('webgl2');

      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      gl?.viewport(0, 0, pixelWidth, pixelHeight);
      renderer.resize(pixelWidth, pixelHeight);

      const sample = getBackgroundSample(surface, backgroundHostRef.current);
      const blurWeights = computeGaussianKernelByRadius(preset.blurRadius);
      const center: [number, number] = [pixelWidth / 2, pixelHeight / 2];
      const shapeWidth = Math.max(1, width - preset.shapeInset * 2);
      const shapeHeight = Math.max(1, height - preset.shapeInset * 2);

      renderer.setUniforms({
        u_resolution: [pixelWidth, pixelHeight],
        u_dpr: dpr,
        u_blurRadius: preset.blurRadius,
        u_blurWeights: blurWeights,
        u_mouse: center,
        u_mouseSpring: center,
        u_shapeWidth: shapeWidth,
        u_shapeHeight: shapeHeight,
        u_shapeRadius: Math.min(radius, Math.min(shapeWidth, shapeHeight) / 2),
        u_shapeRoundness: preset.shapeRoundness,
        u_mergeRate: 0,
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
          u_shadowExpand: preset.shadowExpand,
          u_shadowFactor: preset.shadowFactor,
          u_shadowPosition: preset.shadowPosition,
        },
        mainPass: {
          u_tint: preset.tint,
          u_refThickness: preset.refThickness,
          u_refFactor: preset.refFactor,
          u_refDispersion: preset.refDispersion,
          u_refFresnelRange: preset.refFresnelRange,
          u_refFresnelHardness: preset.refFresnelHardness,
          u_refFresnelFactor: preset.refFresnelFactor,
          u_glareRange: preset.glareRange,
          u_glareHardness: preset.glareHardness,
          u_glareConvergence: preset.glareConvergence,
          u_glareOppositeFactor: preset.glareOppositeFactor,
          u_glareFactor: preset.glareFactor,
          u_glareAngle: preset.glareAngle,
          u_blurEdge: 1,
          STEP: preset.shaderStep,
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

    if (backgroundHostRef.current) {
      resizeObserver?.observe(backgroundHostRef.current);
    }

    window.addEventListener('resize', scheduleRender);

    return () => {
      disposed = true;
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('resize', scheduleRender);
      resizeObserver?.disconnect();
      const gl = canvas.getContext('webgl2');
      if (texture) {
        gl?.deleteTexture(texture);
      }
      renderer?.dispose();
    };
  }, [backgroundHostRef, backgroundImage, height, preset, radius, width]);

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
        style={{ ...canvasStyle, opacity: renderMode === 'shader' ? preset.shaderOpacity : 0 }}
      />
      <span
        aria-hidden="true"
        data-slot="liquid-glass-studio-surface-fallback"
        style={renderMode === 'shader' ? shaderBaseStyle : fallbackStyle}
      />
      <span
        aria-hidden="true"
        data-slot="liquid-glass-studio-surface-rim"
        style={rimStyle}
      />
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

const canvasStyle: CSSProperties = {
  height: '100%',
  inset: 0,
  pointerEvents: 'none',
  position: 'absolute',
  width: '100%',
  zIndex: 1,
};

const shaderBaseStyle: CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.045) 56%, rgba(255,255,255,0.105))',
  backdropFilter: 'blur(10px) saturate(1.08)',
  borderRadius: 'var(--ko-studio-glass-radius)',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.38), inset 0 -1px 0 rgba(255,255,255,0.12), inset 0 0 16px rgba(255,255,255,0.055), 0 7px 16px rgba(0,0,0,0.12)',
  inset: 0,
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 0,
};

const fallbackStyle: CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06) 54%, rgba(255,255,255,0.12))',
  backdropFilter: 'blur(16px) saturate(1.14)',
  borderRadius: 'var(--ko-studio-glass-radius)',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -1px 0 rgba(255,255,255,0.12), inset 0 0 18px rgba(255,255,255,0.06), 0 7px 16px rgba(0,0,0,0.12)',
  inset: 0,
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 0,
};

const rimStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.28)',
  borderRadius: 'var(--ko-studio-glass-radius)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
  inset: 0,
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 3,
};

const contentStyle: CSSProperties = {
  display: 'grid',
  inset: 0,
  placeItems: 'stretch',
  position: 'absolute',
  zIndex: 4,
};
