import { type CSSProperties, type HTMLAttributes, type ReactNode, useId } from 'react';

import { cn } from '../../class-names';

type LiquidGlassTone = 'subtle' | 'balanced' | 'luminous';

export interface LiquidGlassSimpleProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  contentClassName?: string;
  displacementScale?: number;
  filterId?: string;
  interactive?: boolean;
  radius?: number | string;
  shine?: boolean;
  saturation?: number;
  tone?: LiquidGlassTone;
  blur?: number | string;
}

const tintOpacityByTone: Record<LiquidGlassTone, number> = {
  subtle: 0.2,
  balanced: 0.25,
  luminous: 0.34,
};

function toCssLength(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

function createStableId(id: string): string {
  return id.replace(/:/g, '');
}

export function LiquidGlassSimple({
  children,
  className,
  contentClassName,
  displacementScale = 150,
  filterId,
  interactive = false,
  radius = 28,
  shine = true,
  saturation = 100,
  tone = 'balanced',
  blur = 3,
  style,
  ...props
}: LiquidGlassSimpleProps) {
  const reactId = useId();
  const resolvedFilterId = filterId ?? `ko-liquid-glass-simple-${createStableId(reactId)}`;
  const backdropFilter = `blur(var(--ko-liquid-glass-blur)) saturate(var(--ko-liquid-glass-saturation))`;
  const shineBoxShadow = shine
    ? 'inset 2px 2px 1px 0 rgba(255,255,255,0.5), inset -1px -1px 1px 1px rgba(255,255,255,0.5)'
    : 'none';

  const liquidGlassStyle = {
    '--ko-liquid-glass-blur': toCssLength(blur),
    '--ko-liquid-glass-radius': toCssLength(radius),
    '--ko-liquid-glass-saturation': `${saturation}%`,
    '--ko-liquid-glass-tint-opacity': tintOpacityByTone[tone],
    ...style,
  } as CSSProperties;

  return (
    <div
      className={cn(
        'relative isolate inline-flex overflow-hidden rounded-[var(--ko-liquid-glass-radius)] text-[var(--ko-ink)] shadow-[0_6px_6px_rgba(0,0,0,0.2),0_0_20px_rgba(0,0,0,0.1)] transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,2.2)]',
        interactive
          ? 'cursor-pointer hover:-translate-y-px active:translate-y-0 active:scale-[0.985]'
          : null,
        className,
      )}
      data-slot="liquid-glass-simple"
      style={liquidGlassStyle}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
        focusable="false"
      >
        <filter
          id={resolvedFilterId}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.01"
            numOctaves="1"
            seed="5"
            result="turbulence"
          />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
          </feComponentTransfer>
          <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale="5"
            specularConstant="1"
            specularExponent="100"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>
          <feComposite
            in="specLight"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
            result="litImage"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale={displacementScale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <span
        aria-hidden="true"
        className="absolute inset-0 z-0 overflow-hidden rounded-[var(--ko-liquid-glass-radius)]"
        data-slot="liquid-glass-simple-effect"
        style={{
          backdropFilter,
          filter: `url(#${resolvedFilterId})`,
          WebkitBackdropFilter: backdropFilter,
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 z-[1] rounded-[var(--ko-liquid-glass-radius)]"
        data-slot="liquid-glass-simple-tint"
        style={{
          background: 'rgba(255, 255, 255, var(--ko-liquid-glass-tint-opacity))',
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 z-[2] rounded-[var(--ko-liquid-glass-radius)]"
        data-slot="liquid-glass-simple-shine"
        style={{
          boxShadow: shineBoxShadow,
        }}
      />
      <span
        className={cn('relative z-[3] flex min-w-0 items-center', contentClassName)}
        data-slot="liquid-glass-simple-content"
      >
        {children}
      </span>
    </div>
  );
}

export default LiquidGlassSimple;
