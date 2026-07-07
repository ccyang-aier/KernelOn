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
    shapeRoundness: number;
  }
> = {
  header: {
    blurRadius: 7,
    tint: [0.98, 1, 1, 0.1],
    refThickness: 18,
    refFactor: 1.36,
    refDispersion: 8,
    refFresnelRange: 34,
    refFresnelHardness: 0.18,
    refFresnelFactor: 0.28,
    glareRange: 34,
    glareHardness: 0.2,
    glareConvergence: 0.48,
    glareOppositeFactor: 0.74,
    glareFactor: 0.78,
    glareAngle: -0.82,
    shadowExpand: 26,
    shadowFactor: 0.13,
    shadowPosition: [0, -6],
    shapeRoundness: 5.2,
  },
  hero: {
    blurRadius: 9,
    tint: [0.88, 0.98, 1, 0.13],
    refThickness: 22,
    refFactor: 1.42,
    refDispersion: 10,
    refFresnelRange: 30,
    refFresnelHardness: 0.16,
    refFresnelFactor: 0.34,
    glareRange: 36,
    glareHardness: 0.18,
    glareConvergence: 0.52,
    glareOppositeFactor: 0.8,
    glareFactor: 0.84,
    glareAngle: -0.74,
    shadowExpand: 30,
    shadowFactor: 0.15,
    shadowPosition: [0, -7],
    shapeRoundness: 5.4,
  },
  subtle: {
    blurRadius: 5,
    tint: [1, 1, 1, 0.07],
    refThickness: 14,
    refFactor: 1.28,
    refDispersion: 5,
    refFresnelRange: 42,
    refFresnelHardness: 0.2,
    refFresnelFactor: 0.2,
    glareRange: 42,
    glareHardness: 0.24,
    glareConvergence: 0.42,
    glareOppositeFactor: 0.64,
    glareFactor: 0.58,
    glareAngle: -0.72,
    shadowExpand: 22,
    shadowFactor: 0.09,
    shadowPosition: [0, -4],
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

      renderer.setUniforms({
        u_resolution: [pixelWidth, pixelHeight],
        u_dpr: dpr,
        u_blurRadius: preset.blurRadius,
        u_blurWeights: blurWeights,
        u_mouse: center,
        u_mouseSpring: center,
        u_shapeWidth: width,
        u_shapeHeight: height,
        u_shapeRadius: Math.min(radius, Math.min(width, height) / 2),
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
          STEP: 9,
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
      ref={surfaceRef}
      style={rootStyle}
    >
      <canvas
        aria-hidden="true"
        className="ko-liquid-glass-studio-surface__canvas"
        data-slot="liquid-glass-studio-surface-canvas"
        ref={canvasRef}
        style={canvasStyle}
      />
      <span
        aria-hidden="true"
        data-slot="liquid-glass-studio-surface-fallback"
        style={fallbackStyle}
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
  opacity: 0.9,
  pointerEvents: 'none',
  position: 'absolute',
  width: '100%',
  zIndex: 1,
};

const fallbackStyle: CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.07) 54%, rgba(255,255,255,0.14))',
  backdropFilter: 'blur(18px) saturate(1.22)',
  borderRadius: 'var(--ko-studio-glass-radius)',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -1px 0 rgba(255,255,255,0.16), inset 0 0 22px rgba(255,255,255,0.08)',
  inset: 0,
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 0,
};

const rimStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.22)',
  borderRadius: 'var(--ko-studio-glass-radius)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)',
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
