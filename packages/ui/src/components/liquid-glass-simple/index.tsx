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
  saturation?: number;
  tone?: LiquidGlassTone;
  blur?: number | string;
}

const tintClasses: Record<LiquidGlassTone, string> = {
  subtle: 'bg-white/20',
  balanced: 'bg-white/30',
  luminous: 'bg-white/40',
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
  displacementScale = 120,
  filterId,
  interactive = false,
  radius = 28,
  saturation = 150,
  tone = 'balanced',
  blur = 8,
  style,
  ...props
}: LiquidGlassSimpleProps) {
  const reactId = useId();
  const resolvedFilterId = filterId ?? `ko-liquid-glass-simple-${createStableId(reactId)}`;
  const backdropFilter = `blur(var(--ko-liquid-glass-blur)) saturate(var(--ko-liquid-glass-saturation))`;

  const liquidGlassStyle = {
    '--ko-liquid-glass-blur': toCssLength(blur),
    '--ko-liquid-glass-radius': toCssLength(radius),
    '--ko-liquid-glass-saturation': `${saturation}%`,
    ...style,
  } as CSSProperties;

  return (
    <div
      className={cn(
        'relative isolate inline-flex overflow-hidden rounded-[var(--ko-liquid-glass-radius)] border border-white/35 text-[var(--ko-ink)] shadow-[0_18px_55px_rgba(17,24,39,0.12),0_4px_16px_rgba(17,24,39,0.08)] transition-[box-shadow,transform] duration-300 ease-out',
        interactive
          ? 'cursor-pointer hover:-translate-y-px hover:shadow-[0_22px_64px_rgba(17,24,39,0.16),0_6px_18px_rgba(17,24,39,0.1)] active:translate-y-0 active:scale-[0.985]'
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
            baseFrequency="0.012 0.016"
            numOctaves="1"
            seed="5"
            result="turbulence"
          />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
          </feComponentTransfer>
          <feGaussianBlur in="mapped" stdDeviation="2.8" result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale="4"
            specularConstant="0.9"
            specularExponent="90"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-180" y="-180" z="260" />
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
        className={cn(
          'absolute inset-0 z-[1] rounded-[var(--ko-liquid-glass-radius)]',
          tintClasses[tone],
        )}
        data-slot="liquid-glass-simple-tint"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 z-[2] rounded-[var(--ko-liquid-glass-radius)]"
        data-slot="liquid-glass-simple-shine"
        style={{
          boxShadow:
            'inset 1px 1px 1px rgba(255,255,255,0.58), inset -1px -1px 1px rgba(255,255,255,0.42), inset 0 0 18px rgba(255,255,255,0.12)',
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
