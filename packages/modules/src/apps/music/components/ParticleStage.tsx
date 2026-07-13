'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';

import type { MusicTrack, VisualPresetId, VisualSettings } from '../types';

interface ParticleStageProps {
  analyserRef: RefObject<AnalyserNode | null>;
  frequencyDataRef: RefObject<Uint8Array<ArrayBuffer> | null>;
  isPlaying: boolean;
  track: MusicTrack | null;
  visual: VisualSettings;
}

interface Point3D {
  colorMix: number;
  size: number;
  x: number;
  y: number;
  z: number;
}

export function ParticleStage({
  analyserRef,
  frequencyDataRef,
  isPlaying,
  track,
  visual,
}: ParticleStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef({ x: -0.08, y: 0, targetX: -0.08, targetY: 0 });
  const zoomRef = useRef(1);
  const points = useMemo(() => createPoints(visual.preset), [visual.preset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return undefined;

    let frame = 0;
    let width = 0;
    let height = 0;
    let lastTime = performance.now();
    let transition = 0;
    let hidden = document.hidden;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, 2);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (hidden || width <= 0 || height <= 0) return;

      const delta = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      const analyser = analyserRef.current;
      const frequencyData = frequencyDataRef.current;
      if (analyser && frequencyData) analyser.getByteFrequencyData(frequencyData);
      const energy = getFrequencyEnergy(frequencyData);
      const bass = energy.bass;
      const mid = energy.mid;
      const treble = energy.treble;
      const idlePulse = 0.15 + Math.sin(now * 0.0007) * 0.04;
      const pulse = isPlaying ? Math.max(idlePulse, bass * visual.intensity) : idlePulse;
      const rotation = rotationRef.current;

      rotation.targetY +=
        (isPlaying && visual.cinema ? delta * (0.08 + mid * 0.18) : delta * 0.018) * visual.speed;
      rotation.x += (rotation.targetX - rotation.x) * Math.min(1, delta * 5);
      rotation.y += (rotation.targetY - rotation.y) * Math.min(1, delta * 4);
      transition = Math.min(1, transition + delta * 2.8);

      context.clearRect(0, 0, width, height);
      drawAmbientField(context, width, height, now, pulse, visual);

      if (visual.preset !== 3) {
        drawPointCloud({
          bass,
          context,
          height,
          mid,
          now,
          points,
          pulse,
          rotation,
          transition,
          treble,
          visual,
          width,
          zoom: zoomRef.current,
        });
      }
    };

    frame = requestAnimationFrame(render);
    const handleVisibility = () => {
      hidden = document.hidden;
      lastTime = performance.now();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handlePointerMove = (event: PointerEvent) => {
      if (event.buttons !== 1 || reducedMotion) return;
      rotationRef.current.targetY += event.movementX * 0.006;
      rotationRef.current.targetX = clamp(
        rotationRef.current.targetX + event.movementY * 0.004,
        -0.85,
        0.85,
      );
    };
    const handleDoubleClick = () => {
      rotationRef.current.targetX = visual.preset === 6 ? -0.26 : -0.08;
      rotationRef.current.targetY = visual.preset === 5 ? -0.52 : visual.preset === 6 ? 0.18 : 0;
      zoomRef.current = 1;
    };
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomRef.current = clamp(zoomRef.current - event.deltaY * 0.0008, 0.72, 1.45);
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('dblclick', handleDoubleClick);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [analyserRef, frequencyDataRef, isPlaying, points, visual]);

  return (
    <canvas
      aria-label={`${track?.title ?? 'Mineradio'} 粒子视觉舞台`}
      className="music-particle-stage"
      data-preset={visual.preset}
      ref={canvasRef}
      role="img"
    />
  );
}

function drawPointCloud({
  bass,
  context,
  height,
  mid,
  now,
  points,
  pulse,
  rotation,
  transition,
  treble,
  visual,
  width,
  zoom,
}: {
  bass: number;
  context: CanvasRenderingContext2D;
  height: number;
  mid: number;
  now: number;
  points: Point3D[];
  pulse: number;
  rotation: { x: number; y: number };
  transition: number;
  treble: number;
  visual: VisualSettings;
  width: number;
  zoom: number;
}) {
  const scale = Math.min(width, height) * 0.245 * zoom;
  const centerX = width * (visual.preset === 6 ? 0.43 : 0.5);
  const centerY = height * (visual.preset === 6 ? 0.48 : 0.47);
  const tint = parseHex(visual.visualTintColor);
  const highlight = parseHex(visual.lyricHighlightColor);
  const projected: Array<Point3D & { depth: number; px: number; py: number }> = [];
  const cosY = Math.cos(rotation.y);
  const sinY = Math.sin(rotation.y);
  const cosX = Math.cos(rotation.x);
  const sinX = Math.sin(rotation.x);

  points.forEach((point, index) => {
    const noise = Math.sin(index * 12.9898 + now * 0.00035 * visual.speed) * visual.scatter;
    const wave = Math.sin(now * 0.0014 * visual.speed + index * 0.052) * (0.012 + mid * 0.026);
    const expand = 1 + pulse * (visual.preset === 4 ? 0.035 : 0.085) + noise;
    let x = point.x * expand;
    let y = point.y * expand + wave;
    let z = point.z * expand;

    if (visual.preset === 1) {
      z += ((now * 0.00042 * visual.speed + index / points.length) % 1) * 0.7 - 0.35;
    } else if (visual.preset === 5) {
      const swirl = now * 0.00008 * visual.speed + point.z * 0.35;
      const swirlCos = Math.cos(swirl);
      const swirlSin = Math.sin(swirl);
      const nextX = x * swirlCos - y * swirlSin;
      y = x * swirlSin + y * swirlCos;
      x = nextX;
    } else if (visual.preset === 6) {
      const jaw = point.y > 0.45 ? Math.sin(now * 0.0018) * bass * 0.14 : 0;
      y += jaw;
    }

    const rotatedX = x * cosY - z * sinY;
    const rotatedZ = x * sinY + z * cosY;
    const rotatedY = y * cosX - rotatedZ * sinX;
    const finalZ = y * sinX + rotatedZ * cosX;
    const perspective = 2.7 / (3.5 + finalZ * visual.depth);
    const intro = 1 - Math.pow(1 - transition, 3);
    projected.push({
      ...point,
      depth: finalZ,
      px: centerX + rotatedX * scale * perspective * intro,
      py: centerY + rotatedY * scale * perspective * intro,
      size: point.size * perspective,
    });
  });

  projected.sort((left, right) => right.depth - left.depth);
  context.globalCompositeOperation = visual.bloom ? 'lighter' : 'source-over';
  projected.forEach((point, index) => {
    const mix = clamp(point.colorMix + treble * 0.34 + Math.sin(index * 0.17) * 0.08, 0, 1);
    const color = mixColor(tint, highlight, mix * 0.48);
    const depthAlpha = clamp(0.3 + (1.2 - point.depth) * 0.34, 0.14, 0.92);
    const size = Math.max(0.6, point.size * visual.pointSize * (1 + bass * 0.8));
    context.fillStyle = `rgba(${color.r},${color.g},${color.b},${depthAlpha})`;
    context.beginPath();
    context.arc(point.px, point.py, size, 0, Math.PI * 2);
    context.fill();
  });
  context.globalCompositeOperation = 'source-over';
}

function drawAmbientField(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  now: number,
  pulse: number,
  visual: VisualSettings,
) {
  const tint = parseHex(visual.visualTintColor);
  const glow = context.createRadialGradient(
    width * 0.5,
    height * 0.48,
    0,
    width * 0.5,
    height * 0.48,
    Math.max(width, height) * 0.58,
  );
  glow.addColorStop(0, `rgba(${tint.r},${tint.g},${tint.b},${0.045 + pulse * 0.05})`);
  glow.addColorStop(0.42, `rgba(${tint.r},${tint.g},${tint.b},0.014)`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  const starCount = Math.min(170, Math.max(70, Math.floor(width / 7)));
  for (let index = 0; index < starCount; index += 1) {
    const x = seeded(index * 17.17) * width;
    const y = seeded(index * 41.31) * height;
    const flicker = 0.2 + Math.sin(now * 0.001 + index) * 0.12;
    context.fillStyle = `rgba(190,220,228,${Math.max(0.03, flicker)})`;
    context.fillRect(x, y, index % 11 === 0 ? 1.4 : 0.7, index % 11 === 0 ? 1.4 : 0.7);
  }
}

function createPoints(preset: VisualPresetId) {
  switch (preset) {
    case 1:
      return createTunnelPoints(1050);
    case 2:
      return createSpherePoints(1100);
    case 3:
      return [];
    case 4:
      return createVinylPoints(1050);
    case 5:
      return createGalaxyPoints(1300);
    case 6:
      return createSkullPoints(1250);
    default:
      return createCoverPoints(1200);
  }
}

function createCoverPoints(count: number) {
  const points: Point3D[] = [];
  const columns = Math.round(Math.sqrt(count * 1.15));
  const rows = Math.ceil(count / columns);
  for (let index = 0; index < count; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const nx = column / Math.max(1, columns - 1) - 0.5;
    const ny = row / Math.max(1, rows - 1) - 0.5;
    points.push({
      colorMix: seeded(index * 6.7),
      size: 0.9 + seeded(index * 2.3) * 1.25,
      x: nx * 3.2,
      y: ny * 3.2,
      z: Math.sin(nx * Math.PI) * Math.cos(ny * Math.PI) * 0.14,
    });
  }
  return points;
}

function createTunnelPoints(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const ring = index % 44;
    const angle = (ring / 44) * Math.PI * 2;
    const depth = Math.floor(index / 44) / Math.ceil(count / 44);
    const radius = 0.55 + depth * 1.15;
    return {
      colorMix: depth,
      size: 0.7 + (1 - depth) * 1.2,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: (depth - 0.5) * 4,
    };
  });
}

function createSpherePoints(count: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (index / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = golden * index;
    return {
      colorMix: (y + 1) / 2,
      size: 0.75 + seeded(index * 4.2) * 0.9,
      x: Math.cos(angle) * radius * 1.62,
      y: y * 1.62,
      z: Math.sin(angle) * radius * 1.62,
    };
  });
}

function createVinylPoints(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const radius = Math.sqrt(index / count) * 1.72;
    const angle = index * 0.39;
    return {
      colorMix: radius / 1.72,
      size: 0.72 + seeded(index * 9.8) * 0.9,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: Math.sin(radius * 28) * 0.045,
    };
  });
}

function createGalaxyPoints(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const arm = index % 4;
    const radius = Math.pow(index / count, 0.58) * 2.4;
    const angle = arm * (Math.PI / 2) + radius * 2.15 + seeded(index * 3.7) * 0.48;
    return {
      colorMix: radius / 2.4,
      size: 0.55 + seeded(index * 8.2) * 1.18,
      x: Math.cos(angle) * radius,
      y: (seeded(index * 5.3) - 0.5) * 0.32 * (1 + radius * 0.2),
      z: Math.sin(angle) * radius,
    };
  });
}

function createSkullPoints(count: number) {
  const points: Point3D[] = [];
  let cursor = 0;
  while (points.length < count && cursor < count * 20) {
    const x = seeded(cursor * 2.13) * 2 - 1;
    const y = seeded(cursor * 7.17) * 2.45 - 1.28;
    const z = seeded(cursor * 11.9) * 2 - 1;
    const head = (x * x) / 0.82 + ((y + 0.25) * (y + 0.25)) / 1.05 + (z * z) / 0.72 < 1;
    const jaw = Math.abs(x) < 0.52 && y > 0.28 && y < 1.05 && Math.abs(z) < 0.38;
    const leftEye = (x + 0.34) ** 2 / 0.12 + (y + 0.28) ** 2 / 0.09 < 1 && z < -0.05;
    const rightEye = (x - 0.34) ** 2 / 0.12 + (y + 0.28) ** 2 / 0.09 < 1 && z < -0.05;
    const nose = Math.abs(x) < 0.13 && y > -0.18 && y < 0.18 && z < -0.22;
    if ((head || jaw) && !leftEye && !rightEye && !nose) {
      const shell = 0.78 + seeded(cursor * 19.2) * 0.25;
      points.push({
        colorMix: (y + 1.28) / 2.45,
        size: 0.58 + seeded(cursor * 5.4) * 0.9,
        x: x * shell * 1.48,
        y: y * shell * 1.48,
        z: z * shell * 1.15,
      });
    }
    cursor += 1;
  }
  return points;
}

function getFrequencyEnergy(data: Uint8Array<ArrayBuffer> | null) {
  if (!data?.length) return { bass: 0.12, mid: 0.08, treble: 0.05 };
  const bassEnd = Math.max(1, Math.floor(data.length * 0.16));
  const midEnd = Math.max(bassEnd + 1, Math.floor(data.length * 0.5));
  return {
    bass: average(data, 0, bassEnd) / 255,
    mid: average(data, bassEnd, midEnd) / 255,
    treble: average(data, midEnd, data.length) / 255,
  };
}

function average(data: Uint8Array<ArrayBuffer>, start: number, end: number) {
  let total = 0;
  for (let index = start; index < end; index += 1) total += data[index] ?? 0;
  return total / Math.max(1, end - start);
}

function parseHex(value: string) {
  const normalized = value.replace('#', '').padEnd(6, '0').slice(0, 6);
  return {
    b: Number.parseInt(normalized.slice(4, 6), 16) || 0,
    g: Number.parseInt(normalized.slice(2, 4), 16) || 0,
    r: Number.parseInt(normalized.slice(0, 2), 16) || 0,
  };
}

function mixColor(
  left: ReturnType<typeof parseHex>,
  right: ReturnType<typeof parseHex>,
  amount: number,
) {
  return {
    b: Math.round(left.b + (right.b - left.b) * amount),
    g: Math.round(left.g + (right.g - left.g) * amount),
    r: Math.round(left.r + (right.r - left.r) * amount),
  };
}

function seeded(seed: number) {
  return (((Math.sin(seed * 91.13) * 43_758.5453) % 1) + 1) % 1;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
