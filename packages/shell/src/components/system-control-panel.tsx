'use client';

import {
  Bell,
  Camera,
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
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { LiquidGlassSvgFilter } from '@kernelon/ui';

import type { ShellCredentialUser } from './shell-lock-screen';

const fallbackAvatar = '/kernelon-assets/avatars/current-user.png';
const fixedGlassPointer = { x: 0, y: 0 };

const statuses = [
  { color: '#34c759', label: '在线', value: 'online' },
  { color: '#ff9f0a', label: '暂离', value: 'away' },
  { color: '#ff453a', label: '忙碌', value: 'busy' },
  { color: '#8e8e93', label: '隐身', value: 'invisible' },
] as const;

interface SystemControlPanelProps {
  open: boolean;
  onClose(): void;
  onOpenSpotlight(): void;
  onUserChange?(user: ShellCredentialUser): void;
  user?: ShellCredentialUser;
}

export function SystemControlPanel({
  open,
  onClose,
  onOpenSpotlight,
  onUserChange,
  user,
}: SystemControlPanelProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [brightness, setBrightness] = useState(72);
  const [volume, setVolume] = useState(46);
  const [status, setStatus] = useState<(typeof statuses)[number]>(
    statuses.find((option) => option.value === user?.presenceStatus) ?? statuses[0],
  );
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [checkedIn, setCheckedIn] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pressedAction, setPressedAction] = useState<string>();
  const [feedback, setFeedback] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

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

  const saveProfile = async (
    nextProfile: Pick<ShellCredentialUser, 'avatarUrl' | 'displayName' | 'presenceStatus'>,
  ) => {
    const response = await fetch('/api/profile', {
      body: JSON.stringify({
        avatarUrl: nextProfile.avatarUrl ?? null,
        displayName: nextProfile.displayName,
        presenceStatus: nextProfile.presenceStatus ?? 'online',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    });
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
      throw new Error(problem?.detail ?? '用户资料保存失败');
    }
    const updated = (await response.json()) as ShellCredentialUser;
    onUserChange?.(updated);
    return updated;
  };

  const selectStatus = async (nextStatus: (typeof statuses)[number]) => {
    const previous = status;
    setStatus(nextStatus);
    setStatusMenuOpen(false);
    try {
      await saveProfile({
        avatarUrl: user?.avatarUrl,
        displayName: user?.displayName || 'KernelOn 用户',
        presenceStatus: nextStatus.value,
      });
      setFeedback(`状态已切换为${nextStatus.label}`);
    } catch (error) {
      setStatus(previous);
      setFeedback(error instanceof Error ? error.message : '在线状态保存失败');
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setProfileSaving(true);
    try {
      const avatarUrl = await resizeAvatar(file);
      await saveProfile({
        avatarUrl,
        displayName: user?.displayName || 'KernelOn 用户',
        presenceStatus: status.value,
      });
      setFeedback('头像已更新');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '头像更新失败');
    } finally {
      setProfileSaving(false);
    }
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
    <>
      <AnimatePresence>
        {open ? (
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
        ) : null}
      </AnimatePresence>

      <LiquidGlassSvgFilter
        aberrationIntensity={0}
        appearanceClassName={`ko-control-panel-liquid-appearance ${
          open ? 'ko-control-panel-is-open' : 'ko-control-panel-is-closed'
        }`}
        blurAmount={0.85}
        className="z-40"
        cornerRadius={26}
        displacementScale={36}
        elasticity={0}
        globalMousePos={fixedGlassPointer}
        mode="standard"
        mouseOffset={fixedGlassPointer}
        padding="17px"
        saturation={145}
        style={{
          position: 'fixed',
          left: 'calc(100vw - 14px - min(184px, (100vw - 20px) / 2))',
          top: '292px',
        }}
      >
        <div
          aria-hidden={!open}
          aria-label="KernelOn 系统控制面板"
          aria-modal="true"
          className="relative flex w-[min(334px,calc(100vw-54px))] select-none flex-col gap-[13px] text-white"
          data-testid="kernelon-system-control-panel"
          inert={!open}
          role="dialog"
        >
          <AnimatePresence>
            {feedback ? (
              <motion.div
                animate={{ opacity: 1 }}
                className="absolute inset-x-0 top-0 z-30 mx-auto w-max whitespace-nowrap rounded-full border border-white/15 bg-[#142d34]/95 px-3 py-1.5 text-[10px] font-medium shadow-xl"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                role="status"
              >
                {feedback}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <section className="flex items-center gap-3 px-1" aria-label="用户信息">
            <button
              aria-label="更换头像"
              className="ko-profile-avatar group relative h-[56px] w-[56px] shrink-0 rounded-full p-[2px]"
              disabled={profileSaving}
              onClick={() => avatarInputRef.current?.click()}
              type="button"
            >
              <img
                alt={`${user?.displayName || '当前用户'}的头像`}
                className="h-full w-full rounded-full object-cover"
                src={user?.avatarUrl || fallbackAvatar}
              />
              <span className="ko-profile-avatar-sheen" />
              <span className="ko-profile-avatar-camera">
                <Camera aria-hidden className="h-4 w-4" />
              </span>
              <span
                className="ko-profile-avatar-status"
                style={{ '--ko-presence-color': status.color } as CSSProperties}
              />
            </button>
            <input
              ref={avatarInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              data-testid="kernelon-avatar-input"
              onChange={(event) => void handleAvatarChange(event)}
              type="file"
            />
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-[14px] font-semibold leading-5">
                {user?.displayName || 'KernelOn 用户'}
              </strong>
              <p className="m-0 truncate font-mono text-[10px] leading-[15px] text-white/48">
                {user?.employeeNo || '工号待分配'}
              </p>
              <p className="m-0 truncate text-[10px] leading-[15px] text-white/72">
                {employmentSummary(user)}
              </p>
              <p className="m-0 truncate text-[10px] leading-[15px] text-white/52">
                导师：{user?.mentorName || '待匹配'}
              </p>
            </div>
            <div className="relative flex shrink-0 flex-col items-end gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-2 py-[3px] text-[9px] font-semibold text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,.12)]">
                {employeeLabel(user?.joinedAt)}
              </span>
              <button
                aria-label={`在线状态：${status.label}`}
                aria-expanded={statusMenuOpen}
                className="ko-glass-button flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-medium"
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
                    animate={{ opacity: 1 }}
                    className="absolute top-[66px] right-0 z-20 w-[108px] overflow-hidden rounded-[14px] border border-white/15 bg-[#24434b]/95 p-1.5 shadow-2xl"
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                  >
                    {statuses.map((option) => (
                      <button
                        aria-pressed={status.value === option.value}
                        className="flex w-full items-center gap-2 rounded-[9px] px-2 py-1.5 text-left text-[10px] transition-colors hover:bg-white/12"
                        key={option.value}
                        onClick={() => void selectStatus(option)}
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

          <div className="h-px bg-white/10" />

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
      </LiquidGlassSvgFilter>
    </>
  );
}

function employmentSummary(user?: ShellCredentialUser): string {
  const department = user?.departmentName || user?.organizationName || '部门待分配';
  if (!user?.joinedAt) return `${department} · 入职时间待完善`;
  const startedAt = new Date(user.joinedAt);
  if (Number.isNaN(startedAt.getTime())) return `${department} · 入职时间待完善`;
  const days = Math.max(1, Math.floor((Date.now() - startedAt.getTime()) / 86_400_000) + 1);
  return `${department} · 入职第 ${days} 天`;
}

function employeeLabel(joinedAt?: string | null): string {
  if (!joinedAt) return '员工';
  const startedAt = new Date(joinedAt);
  if (Number.isNaN(startedAt.getTime())) return '员工';
  return Date.now() - startedAt.getTime() <= 90 * 86_400_000 ? '新员工' : '员工';
}

async function resizeAvatar(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('请选择 JPG、PNG 或 WebP 图片');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('头像文件不能超过 8MB');
  }

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('头像文件读取失败'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onerror = () => reject(new Error('无法解析头像图片'));
    element.onload = () => resolve(element);
    element.src = source;
  });
  const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法处理头像图片');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const result = canvas.toDataURL('image/webp', 0.86);
  if (result.length > 1_500_000) throw new Error('压缩后的头像仍然过大，请选择更简单的图片');
  return result;
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
