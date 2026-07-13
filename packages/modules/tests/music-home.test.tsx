// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { demoPlaylists, demoTracks } from '../src/apps/music/data';
import { HomeView } from '../src/apps/music/components/HomeView';
import { VisualGuide } from '../src/apps/music/components/VisualGuide';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
  };
});

afterEach(cleanup);

describe('Mineradio home', () => {
  it('renders the original six-card hierarchy and recommendation rail', () => {
    render(
      <HomeView
        history={[]}
        isLoading={false}
        onImport={vi.fn()}
        onOpenLibrary={vi.fn()}
        onOpenVisuals={vi.fn()}
        onPlay={vi.fn()}
        onPlayPlaylist={vi.fn()}
        onPlayWeather={vi.fn()}
        onSearch={vi.fn()}
        playlists={demoPlaylists}
        songs={demoTracks}
        weather={null}
      />,
    );

    expect(screen.getByRole('region', { name: 'Mineradio home' })).toBeInTheDocument();
    expect(document.querySelectorAll('.music-home-card')).toHaveLength(6);
    expect(screen.getByRole('region', { name: '你的歌单与推荐' })).toBeInTheDocument();
    expect(document.querySelectorAll('.music-home-tile')).toHaveLength(3);
    expect(screen.queryByText('此处施工，敬请期待')).not.toBeInTheDocument();
  });

  it('advances through the six-step first-entry guide', () => {
    const onComplete = vi.fn();
    render(
      <>
        <div className="music-home" />
        <div className="music-search-area" />
        <div className="music-player-wrap" />
        <div className="music-home-card" />
        <div className="music-home-recommendations" />
        <div className="music-top-actions"><button type="button">视觉</button></div>
        <VisualGuide onComplete={onComplete} />
      </>,
    );

    expect(screen.getByText('1 / 6')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(screen.getByText('2 / 6')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '跳过' }));
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
