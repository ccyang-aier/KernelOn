'use client';

import { LiquidGlass, liquidGlassAppleButtonDefaults, type LiquidGlassProps } from './LiquidGlass';

export type LiquidGlassButtonProps = LiquidGlassProps;

export function LiquidGlassButton({
  displacementScale = liquidGlassAppleButtonDefaults.displacementScale,
  blurAmount = liquidGlassAppleButtonDefaults.blurAmount,
  saturation = liquidGlassAppleButtonDefaults.saturation,
  aberrationIntensity = liquidGlassAppleButtonDefaults.aberrationIntensity,
  elasticity = liquidGlassAppleButtonDefaults.elasticity,
  cornerRadius = liquidGlassAppleButtonDefaults.cornerRadius,
  padding = liquidGlassAppleButtonDefaults.padding,
  overLight = liquidGlassAppleButtonDefaults.overLight,
  mode = liquidGlassAppleButtonDefaults.mode,
  ...props
}: LiquidGlassButtonProps) {
  return (
    <LiquidGlass
      aberrationIntensity={aberrationIntensity}
      blurAmount={blurAmount}
      cornerRadius={cornerRadius}
      displacementScale={displacementScale}
      elasticity={elasticity}
      mode={mode}
      overLight={overLight}
      padding={padding}
      saturation={saturation}
      {...props}
    />
  );
}
