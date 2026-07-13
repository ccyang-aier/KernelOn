'use client';

import {
  Bell,
  Check,
  ChevronDown,
  Download,
  Expand,
  Focus,
  Search,
  Settings,
  Sun,
  Volume2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import type { ShellCredentialUser } from './shell-lock-screen';

const fallbackAvatar = '/kernelon-assets/avatars/current-user.png';

const statuses = [
  { color: '#34c759', label: '在线' },
  { color: '#ff9f0a', label: '暂离' },
  { color: '#ff453a', label: '忙碌' },
  { color: '#8e8e93', label: '隐身' },
] as const;

interface SystemControlPanelProps {
  open: boolean;
  onClose(): void;
  onOpenSpotlight(): void;
  user?: ShellCredentialUser;
}

export function SystemControlPanel({
  open,
  onClose,
  onOpenSpotlight,
  user,
}: SystemControlPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [brightness, setBrightness] = useState(72);
  const [volume, setVolume] = useState(46);
  const [status, setStatus] = useState<(typeof statuses)[number]>(statuses[0]);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [checkedIn, setCheckedIn] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pressedAction, setPressedAction] = useState<string>();
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(''), 2200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    const handleFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const flashAction = (action: string, message: string) => {
    setPressedAction(action);
    setFeedback(message);
    window.setTimeout(
      () => setPressedAction((current) => (current === action ? undefined : current)),
      720,
    );
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setFeedback(document.fullscreenElement ? '已进入全屏' : '已退出全屏');
    } catch {
      setFeedback('当前浏览器暂不支持全屏');
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="关闭 KernelOn 系统控制面板"
            className="fixed inset-0 z-[38] cursor-default border-0 bg-black/[0.025]"
            data-testid="kernelon-control-center-backdrop"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.2 }}
            type="button"
          />
          <motion.div
            ref={panelRef}
            aria-label="KernelOn 系统控制面板"
            aria-modal="true"
            className="fixed top-[48px] right-[14px] z-40 w-[min(368px,calc(100vw-20px))] select-none overflow-visible text-white"
            data-testid="kernelon-system-control-panel"
            exit={{ opacity: 0, scale: 0.965, y: -8 }}
            initial={{ opacity: 0, scale: 0.94, y: -10 }}
            role="dialog"
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{ transformOrigin: 'calc(100% - 44px) -16px' }}
            transition={{ damping: 30, mass: 0.55, stiffness: 440, type: 'spring' }}
          >
            <div className="ko-control-panel relative overflow-hidden rounded-[26px] p-[17px]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_-4%,rgba(255,255,255,0.22),transparent_34%),radial-gradient(circle_at_94%_76%,rgba(110,218,222,0.1),transparent_42%)]"
              />
              <div
                aria-hidden="true"
                className="ko-control-noise pointer-events-none absolute inset-0 opacity-[0.035]"
              />

              <div className="relative z-10 flex flex-col gap-[13px]">
                <section className="flex items-center gap-3 px-1" aria-label="用户信息">
                  <div className="relative h-[52px] w-[52px] shrink-0 rounded-full p-[2px] shadow-[0_8px_18px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.5)] [background:linear-gradient(145deg,rgba(255,255,255,.76),rgba(255,255,255,.12))]">
                    <img
                      alt="陈思源的头像"
                      className="h-full w-full rounded-full object-cover"
                      src={user?.avatarUrl || fallbackAvatar}
                    />
                    <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-[#29444b] bg-[#32d46c] shadow-[0_0_10px_rgba(50,212,108,.75)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="truncate text-[14px] font-semibold leading-5">
                        {user?.displayName || '陈思源'}
                      </strong>
                      <span className="rounded-full border border-white/15 bg-white/10 px-2 py-[3px] text-[9px] font-semibold text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,.12)]">
                        新员工
                      </span>
                    </div>
                    <p className="m-0 font-mono text-[10px] leading-[15px] text-white/48">
                      KO-20260713
                    </p>
                    <p className="m-0 truncate text-[11px] leading-[16px] text-white/72">
                      产品运营部 · 入职第 12 天
                    </p>
                    <p className="m-0 text-[11px] leading-[16px] text-white/52">导师：林澈</p>
                  </div>
                </section>

                <div className="h-px bg-white/10" />

                <section className="flex items-center justify-between px-1" aria-label="在线状态">
                  <span className="text-[11px] font-medium text-white/55">在线状态</span>
                  <div className="relative">
                    <button
                      className="ko-glass-button flex h-8 items-center gap-2 rounded-full px-3 text-[11px] font-medium"
                      onClick={() => setStatusMenuOpen((value) => !value)}
                      type="button"
                    >
                      <span
                        className="ko-status-dot h-2 w-2 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.label}
                      <ChevronDown
                        aria-hidden
                        className={`h-3 w-3 text-white/55 transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {statusMenuOpen ? (
                        <motion.div
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="absolute top-10 right-0 z-20 w-[112px] overflow-hidden rounded-[15px] border border-white/15 bg-[#203b43]/80 p-1.5 shadow-2xl backdrop-blur-2xl"
                          exit={{ opacity: 0, scale: 0.94, y: -4 }}
                          initial={{ opacity: 0, scale: 0.94, y: -4 }}
                        >
                          {statuses.map((option) => (
                            <button
                              className="flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left text-[11px] transition-colors hover:bg-white/12"
                              key={option.label}
                              onClick={() => {
                                setStatus(option);
                                setStatusMenuOpen(false);
                              }}
                              type="button"
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: option.color }}
                              />
                              {option.label}
                            </button>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </section>

                <section className="space-y-2.5" aria-label="显示与声音">
                  <ControlSlider
                    icon={<Sun aria-hidden className="h-[14px] w-[14px]" />}
                    label="桌面亮度"
                    onChange={setBrightness}
                    value={brightness}
                  />
                  <ControlSlider
                    icon={<Volume2 aria-hidden className="h-[15px] w-[15px]" />}
                    label="音量"
                    onChange={setVolume}
                    value={volume}
                  />
                </section>

                <section className="space-y-2" aria-label="快捷操作">
                  <p className="m-0 px-1 text-[10px] font-medium text-white/48">快捷操作</p>
                  <div className="ko-control-action-grid">
                    <RoundActionButton
                      active={fullscreen}
                      activeColor="#007aff"
                      icon={<Expand />}
                      label="全屏"
                      onClick={() => void toggleFullscreen()}
                    />
                    <RoundActionButton
                      active={pressedAction === 'download'}
                      activeColor="#0a84ff"
                      icon={<Download />}
                      label="下载客户端"
                      onClick={() => flashAction('download', '客户端即将开放下载')}
                    />
                    <RoundActionButton
                      active={checkedIn}
                      activeColor="#30b96b"
                      icon={<Check />}
                      label="今日签到"
                      onClick={() => {
                        setCheckedIn(true);
                        setFeedback(checkedIn ? '今日已完成签到' : '签到成功');
                      }}
                      secondaryLabel={checkedIn ? '09:18 已签到' : '点击签到'}
                    />
                    <RoundActionButton
                      active={notificationsEnabled}
                      activeColor="#ff375f"
                      icon={<Bell />}
                      label="通知"
                      onClick={() => {
                        setNotificationsEnabled((value) => !value);
                        setFeedback(notificationsEnabled ? '通知已关闭' : '通知已开启');
                      }}
                    />
                    <RoundActionButton
                      active={pressedAction === 'settings'}
                      activeColor="#636366"
                      icon={<Settings />}
                      label="系统设置"
                      onClick={() => flashAction('settings', '系统设置即将开放')}
                    />
                    <RoundActionButton
                      active={pressedAction === 'spotlight'}
                      activeColor="#af52de"
                      icon={<Search />}
                      label="Spotlight"
                      onClick={() => {
                        setPressedAction('spotlight');
                        onClose();
                        onOpenSpotlight();
                      }}
                    />
                    <RoundActionButton
                      active={focusMode}
                      activeColor="#5856d6"
                      icon={<Focus />}
                      label="专注模式"
                      onClick={() => {
                        setFocusMode((value) => !value);
                        setFeedback(focusMode ? '专注模式已关闭' : '专注模式已开启');
                      }}
                    />
                  </div>
                </section>

                <div className="h-px bg-white/10" />
                <footer className="flex items-end justify-between px-1 text-[9px] font-medium text-white/38">
                  <span className="leading-[14px]">
                    KernelOn Web v0.1.0
                    <br />
                    <span className="font-mono text-white/28">最近同步 00:12</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <button
                      className="transition-colors hover:text-white/75"
                      onClick={() => setFeedback('账号切换即将开放')}
                      type="button"
                    >
                      切换账号
                    </button>
                    <span>·</span>
                    <button
                      className="transition-colors hover:text-red-300"
                      onClick={() => setFeedback('退出登录需要再次确认')}
                      type="button"
                    >
                      退出登录
                    </button>
                  </span>
                </footer>
              </div>
            </div>

            <AnimatePresence>
              {feedback ? (
                <motion.div
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute top-3 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[10px] font-medium shadow-xl backdrop-blur-xl"
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  role="status"
                >
                  {feedback}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ControlSlider({
  icon,
  label,
  onChange,
  value,
}: {
  icon: ReactNode;
  label: string;
  onChange(value: number): void;
  value: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="block px-1 text-[10px] font-medium text-white/48">{label}</span>
      <span className="ko-control-slider relative flex h-8 items-center overflow-hidden rounded-full border border-white/[0.07] bg-black/18 shadow-[inset_0_2px_5px_rgba(0,0,0,.16),inset_0_1px_0_rgba(255,255,255,.06)]">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 rounded-full bg-white/[0.92] shadow-[inset_0_1px_0_white,2px_0_10px_rgba(255,255,255,.16)]"
          style={{ width: `${value}%` }}
        />
        <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-3 text-white [mix-blend-mode:difference]">
          {icon}
          <span className="text-[10px] font-semibold tabular-nums">{value}%</span>
        </span>
        <input
          aria-label={label}
          className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
          max="100"
          min="0"
          onChange={(event) => onChange(Number(event.currentTarget.value))}
          type="range"
          value={value}
        />
      </span>
    </label>
  );
}

function RoundActionButton({
  active = false,
  activeColor,
  icon,
  label,
  onClick,
  secondaryLabel,
}: {
  active?: boolean;
  activeColor: string;
  icon: ReactNode;
  label: string;
  onClick(): void;
  secondaryLabel?: string;
}) {
  return (
    <div className="ko-round-action">
      <motion.button
        aria-label={secondaryLabel ? `${label}，${secondaryLabel}` : label}
        aria-pressed={active}
        className={`ko-round-action-button ${active ? 'is-active' : ''}`}
        onClick={onClick}
        style={{ '--ko-action-color': activeColor } as CSSProperties}
        transition={{ damping: 22, stiffness: 520, type: 'spring' }}
        type="button"
        whileTap={{ scale: 0.86 }}
      >
        <motion.span
          animate={{ rotate: active ? [0, -8, 7, 0] : 0, scale: active ? 1.08 : 1 }}
          className="ko-round-action-icon"
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        >
          {icon}
        </motion.span>
      </motion.button>
      <span className="ko-round-action-label">{label}</span>
      {secondaryLabel ? (
        <span className={`ko-round-action-state ${active ? 'is-active' : ''}`}>
          {secondaryLabel}
        </span>
      ) : null}
    </div>
  );
}
