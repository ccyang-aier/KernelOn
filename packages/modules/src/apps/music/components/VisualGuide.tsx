import { useCallback, useEffect, useLayoutEffect, useState, type MouseEvent } from 'react';

const guideStorageKey = 'kernelon.music.visual-guide.v1';

const guideSteps = [
  {
    body: '它不是单纯歌单页：搜索或导入一首歌后，封面、歌词、粒子和镜头会跟着音乐一起动。',
    kicker: '01 / Welcome',
    selector: '.music-home',
    title: 'Mineradio 是用来听歌的视觉播放器',
  },
  {
    body: '输入歌名、歌手或关键词即可播放；如果有本地音乐，也可以用导入入口直接放进舞台。',
    kicker: '02 / Play',
    selector: '.music-search-area',
    title: '从搜索或导入开始',
  },
  {
    body: '播放、切歌、进度、队列和歌词都集中在底部，先把它当作一个正常播放器使用就可以。',
    kicker: '03 / Control',
    selector: '.music-player-wrap',
    title: '播放以后看底部控制台',
  },
  {
    body: '左侧资料库会保存队列、最近播放和在线歌单；从首页也可以随时打开。',
    kicker: '04 / Library',
    selector: '.music-home-card:first-child',
    title: '资料库是你的音乐入口',
  },
  {
    body: '首页主卡和下方推荐会使用真实在线数据，点击任意封面即可进入播放舞台。',
    kicker: '05 / Discover',
    selector: '.music-home-recommendations',
    title: '从推荐里挑一首开始',
  },
  {
    body: '粒子、歌词、镜头和歌单架都可以在视觉控制台中调整；先播放一首歌，再慢慢探索。',
    kicker: '06 / Visual',
    selector: '.music-top-actions button:last-child',
    title: '进阶视觉都在控制台里',
  },
] as const;

interface GuideRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

export function useFirstEntryMusicGuide(showHome: boolean) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!showHome) return;
    const frame = requestAnimationFrame(() => {
      try {
        setIsOpen(localStorage.getItem(guideStorageKey) !== '1');
      } catch {
        setIsOpen(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [showHome]);

  const complete = useCallback(() => {
    try {
      localStorage.setItem(guideStorageKey, '1');
    } catch {
      // Storage may be unavailable in privacy-restricted contexts.
    }
    setIsOpen(false);
  }, []);

  return { complete, isOpen };
}

export function VisualGuide({ onComplete }: Readonly<{ onComplete(): void }>) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<GuideRect | null>(null);
  const step = guideSteps[stepIndex]!;

  useLayoutEffect(() => {
    const update = () => {
      const target = document.querySelector<HTMLElement>(step.selector);
      if (!target) {
        setTargetRect(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      const padding = stepIndex === 0 ? 10 : 8;
      const width = Math.max(80, Math.min(window.innerWidth - 24, rect.width + padding * 2));
      const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.left - padding));
      setTargetRect({
        height: Math.max(48, Math.min(window.innerHeight - 24, rect.height + padding * 2)),
        left,
        top: Math.max(12, rect.top - padding),
        width,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [step.selector, stepIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onComplete();
      if (event.key === 'ArrowRight' || event.key === 'Enter') {
        if (stepIndex === guideSteps.length - 1) onComplete();
        else setStepIndex((current) => current + 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onComplete, stepIndex]);

  const next = () => {
    if (stepIndex === guideSteps.length - 1) onComplete();
    else setStepIndex((current) => current + 1);
  };

  const stopPropagation = (event: MouseEvent) => event.stopPropagation();

  return (
    <div
      aria-label="Mineradio 使用引导"
      aria-modal="true"
      className="music-visual-guide"
      onClick={next}
      role="dialog"
    >
      <div aria-hidden="true" className="music-guide-scrim" />
      {targetRect ? (
        <div
          aria-hidden="true"
          className="music-guide-ring"
          style={{
            height: targetRect.height,
            left: targetRect.left,
            top: targetRect.top,
            width: targetRect.width,
          }}
        />
      ) : null}
      <div className="music-guide-card" onClick={stopPropagation}>
        <div className="music-guide-kicker">{step.kicker}</div>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="music-guide-hint">
          {stepIndex === guideSteps.length - 1 ? '点击空白处完成引导' : '点击空白处也可以继续'}
        </div>
        <footer>
          <button onClick={onComplete} type="button">
            跳过
          </button>
          <span>
            {stepIndex + 1} / {guideSteps.length}
          </span>
          <button className="primary" onClick={next} type="button">
            {stepIndex === guideSteps.length - 1 ? '完成' : '下一步'}
          </button>
        </footer>
      </div>
    </div>
  );
}
