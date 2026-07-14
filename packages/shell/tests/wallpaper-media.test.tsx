import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WallpaperMedia, type DesktopWallpaperDescriptor } from '../src';

const videoWallpaper: DesktopWallpaperDescriptor = {
  id: 'nasa:demo',
  mediaType: 'video',
  posterUrl: 'https://example.test/poster.jpg',
  sources: [{ url: 'https://example.test/demo.mp4', mimeType: 'video/mp4' }],
};

describe('WallpaperMedia', () => {
  it('renders a muted looping inline video for a dynamic descriptor', () => {
    render(<WallpaperMedia testId="wallpaper" wallpaper={videoWallpaper} />);
    const video = screen.getByTestId('wallpaper');
    expect(video.tagName).toBe('VIDEO');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('poster', videoWallpaper.posterUrl);
  });

  it('falls back to the poster when reduced motion is enabled', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    render(<WallpaperMedia testId="wallpaper-reduced" wallpaper={videoWallpaper} />);
    expect(screen.getByTestId('wallpaper-reduced').tagName).toBe('IMG');
    expect(screen.getByTestId('wallpaper-reduced')).toHaveAttribute('src', videoWallpaper.posterUrl);
  });
});
