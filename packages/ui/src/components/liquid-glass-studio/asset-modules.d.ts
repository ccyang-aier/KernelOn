declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.scss';

declare module '*.glsl' {
  const source: string;
  export default source;
}

declare module '*.wgsl' {
  const source: string;
  export default source;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.mp4' {
  const src: string;
  export default src;
}
