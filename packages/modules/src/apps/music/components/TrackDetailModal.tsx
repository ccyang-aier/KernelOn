import { ImagePlus, RotateCcw, Save, TextCursorInput, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';

import type { MusicTrack } from '../types';
import { Cover } from './SearchPanel';

interface TrackDetailModalProps {
  onClearCover(): void;
  onClearLyrics(): void;
  onClose(): void;
  onSaveCover(dataUrl: string): void;
  onSaveLyrics(source: string): void;
  track: MusicTrack;
}

export function TrackDetailModal({
  onClearCover,
  onClearLyrics,
  onClose,
  onSaveCover,
  onSaveLyrics,
  track,
}: TrackDetailModalProps) {
  const [lyricsSource, setLyricsSource] = useState(() => lyricsToSource(track));
  const [cropSource, setCropSource] = useState('');
  const [cropZoom, setCropZoom] = useState(1);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const importCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        setCropSource(reader.result);
        setCropZoom(1);
      }
    });
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="music-modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        aria-label="歌曲详情"
        aria-modal="true"
        className="music-track-detail"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header>
          <div>
            <small>TRACK DETAIL</small>
            <strong>歌曲详情</strong>
          </div>
          <button aria-label="关闭歌曲详情" onClick={onClose} type="button">
            <X />
          </button>
        </header>
        <div className="music-track-detail-head">
          <Cover artwork={track.coverUrl} title={track.title} />
          <div>
            <strong>{track.title}</strong>
            <span>
              {track.artist} · {track.album}
            </span>
            <small>{track.kind === 'podcast' ? 'PODCAST' : track.provider.toUpperCase()}</small>
          </div>
        </div>
        <div className="music-track-detail-section">
          <div>
            <ImagePlus />
            <strong>自定义专辑封面</strong>
            <span>用于底栏、粒子封面和歌单架</span>
          </div>
          <div className="music-track-detail-actions">
            <button onClick={() => coverInputRef.current?.click()} type="button">
              <ImagePlus />
              选择图片
            </button>
            <button onClick={onClearCover} type="button">
              <RotateCcw />
              恢复在线封面
            </button>
          </div>
          <input accept="image/*" hidden onChange={importCover} ref={coverInputRef} type="file" />
          {cropSource ? (
            <div className="music-cover-crop">
              <div>
                <img
                  alt="封面裁剪预览"
                  src={cropSource}
                  style={{ transform: `scale(${cropZoom})` }}
                />
              </div>
              <label>
                <span>裁剪缩放</span>
                <input
                  max={2.5}
                  min={1}
                  onChange={(event) => setCropZoom(Number(event.target.value))}
                  step={0.01}
                  type="range"
                  value={cropZoom}
                />
              </label>
              <div className="music-track-detail-actions">
                <button
                  className="primary"
                  onClick={() => {
                    void cropSquareCover(cropSource, cropZoom).then((dataUrl) => {
                      onSaveCover(dataUrl);
                      setCropSource('');
                    });
                  }}
                  type="button"
                >
                  <Save />
                  应用裁剪
                </button>
                <button onClick={() => setCropSource('')} type="button">
                  <X />
                  取消
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="music-track-detail-section lyrics">
          <div>
            <TextCursorInput />
            <strong>自定义歌词</strong>
            <span>支持 LRC 时间戳；纯文本会按行均匀铺开</span>
          </div>
          <textarea
            aria-label="自定义歌词"
            onChange={(event) => setLyricsSource(event.target.value)}
            placeholder="[00:12.30] 第一行歌词"
            spellCheck={false}
            value={lyricsSource}
          />
          <div className="music-track-detail-actions">
            <button className="primary" onClick={() => onSaveLyrics(lyricsSource)} type="button">
              <Save />
              应用歌词
            </button>
            <button
              onClick={() => {
                setLyricsSource('');
                onClearLyrics();
              }}
              type="button"
            >
              <RotateCcw />
              恢复在线歌词
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function lyricsToSource(track: MusicTrack) {
  return (track.lyrics ?? [])
    .map((line) => {
      const minutes = Math.floor(line.time / 60);
      const seconds = (line.time % 60).toFixed(2).padStart(5, '0');
      return `[${String(minutes).padStart(2, '0')}:${seconds}] ${line.text}`;
    })
    .join('\n');
}

async function cropSquareCover(source: string, zoom: number) {
  const image = await loadImage(source);
  const side = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
  const sourceX = (image.naturalWidth - side) / 2;
  const sourceY = (image.naturalHeight - side) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 720;
  canvas.getContext('2d')?.drawImage(image, sourceX, sourceY, side, side, 0, 0, 720, 720);
  return canvas.toDataURL('image/jpeg', 0.9);
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', () => reject(new Error('封面图片读取失败')), { once: true });
    image.src = source;
  });
}
