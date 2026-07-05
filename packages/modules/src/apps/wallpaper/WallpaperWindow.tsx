'use client';

import {
  ArrowUpToLine,
  BatteryFull,
  Check,
  ChevronRight,
  Compass,
  FolderSearch,
  Heart,
  ImagePlus,
  Monitor,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Wifi,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { useAppHeader, type AppHeaderCommandPayload } from '@kernelon/shell';

type WallpaperKind = 'dynamic' | 'live' | 'static';
type SidebarSection = 'all' | 'premium' | 'trending' | 'my-uploads' | 'favorites';
type WallpaperCategory = 'all' | 'premium' | 'trending' | 'my-uploads';

interface WallpaperAsset {
  id: number;
  name: string;
  author: string;
  type: WallpaperKind;
  category: WallpaperCategory;
  isFav: boolean;
  tags: string[];
  image: string;
  desc: string;
}

const initialWallpapers: WallpaperAsset[] = [
  {
    id: 1,
    name: '流光之翼 (Aura Wing)',
    author: 'Aura Creative Studio',
    type: 'dynamic',
    category: 'premium',
    isFav: false,
    tags: ['抽象美学', '暖色调'],
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    desc: '专为 8K Retina 深度调色的动态抽象艺术，随着一天的流逝从柔和的香槟金慢慢演化为迷幻的靛蓝色。',
  },
  {
    id: 2,
    name: '索诺玛 (Sonoma)',
    author: 'Apple macOS Sonoma',
    type: 'dynamic',
    category: 'all',
    isFav: true,
    tags: ['自然风光', '极简线条'],
    image:
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80',
    desc: 'macOS 经典的标志性明亮与低调交错，在光影流转间平滑过渡到深邃宁静的加州索诺玛夜空色。',
  },
  {
    id: 3,
    name: '冬日极光 (Arctic Aurora)',
    author: 'Michael Sterling',
    type: 'live',
    category: 'premium',
    isFav: false,
    tags: ['自然风光', '深邃暗色'],
    image:
      'https://images.unsplash.com/photo-1483168527879-c66136b56105?auto=format&fit=crop&w=800&q=80',
    desc: '格陵兰群岛拍摄的超高清 Live 实景。在桌面上实现微小且舒适的呼吸律动，极光波形轻拂夜空。',
  },
  {
    id: 4,
    name: '数字绿洲 (Digital Oasis)',
    author: 'Render Labs',
    type: 'static',
    category: 'trending',
    isFav: false,
    tags: ['抽象美学', '暖色调'],
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    desc: '结合了沙丘美学与 3D 雕刻风格的现代静态艺术品。暖色调呈现极致舒缓的现代空间哲学。',
  },
  {
    id: 5,
    name: '深海奇遇 (Deep Abyssal)',
    author: 'Hale Woods',
    type: 'static',
    category: 'all',
    isFav: false,
    tags: ['深邃暗色', '极简线条'],
    image:
      'https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&w=800&q=80',
    desc: '探索水下世界深处的幽邃之美，纯正的静音深蓝能极大减轻双眼因长时间文字办公所累积的疲劳。',
  },
  {
    id: 6,
    name: '优山美地 (Yosemite Light)',
    author: 'National Parks',
    type: 'dynamic',
    category: 'trending',
    isFav: false,
    tags: ['自然风光', '城市建筑'],
    image:
      'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80',
    desc: '优胜美地国家公园的宏伟动态演绎，从日照金山的辉煌日落到星垂平野阔的清冽寂寥，光影细节分毫毕现。',
  },
];

const allTags = ['全部标签', '抽象美学', '自然风光', '深邃暗色', '暖色调', '极简线条', '城市建筑'];

const typeTabs: Array<{ label: string; value: WallpaperKind | 'all' }> = [
  { label: '全部', value: 'all' },
  { label: '动态壁纸', value: 'dynamic' },
  { label: 'Live 壁纸', value: 'live' },
  { label: '精美静态', value: 'static' },
];

const sectionMeta: Record<SidebarSection, { title: string; desc: string }> = {
  all: {
    title: '探索所有壁纸',
    desc: '选择你心仪的桌面艺术进行实时预览与应用',
  },
  premium: {
    title: '精品艺术推荐',
    desc: '苹果原生大师级别的精选色彩与高级抽象构图',
  },
  trending: {
    title: '最受欢迎潮流壁纸',
    desc: 'Aura 社区最高点赞下载并应用的创意代表作',
  },
  'my-uploads': {
    title: '我上传的创意画作',
    desc: '安全地保存在您本地及云端同步的个性空间内',
  },
  favorites: {
    title: '我的美学收藏夹',
    desc: '一键收藏灵感，支持无极循环播放或定时自动应用',
  },
};

const sidebarPrimaryItems = [
  { id: 'all' as const, label: '发现壁纸', Icon: Compass, tone: 'text-[#0a84ff]' },
  { id: 'premium' as const, label: '精品推荐', Icon: Sparkles, tone: 'text-orange-500' },
  { id: 'trending' as const, label: '最受欢迎', Icon: TrendingUp, tone: 'text-green-500' },
];

const kindLabels: Record<WallpaperKind, string> = {
  dynamic: 'DYNAMIC',
  live: 'LIVE',
  static: 'STATIC',
};

export default function WallpaperWindow() {
  const header = useAppHeader();
  const uploadNameRef = useRef<HTMLInputElement | null>(null);
  const [wallpapers, setWallpapers] = useState(initialWallpapers);
  const [section, setSection] = useState<SidebarSection>('all');
  const [typeFilter, setTypeFilter] = useState<WallpaperKind | 'all'>('all');
  const [tagFilter, setTagFilter] = useState('全部标签');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(2);
  const [activeId, setActiveId] = useState(2);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadAuthor, setUploadAuthor] = useState('');
  const [uploadKind, setUploadKind] = useState<WallpaperKind>('static');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [toast, setToast] = useState('');
  const selectedWallpaper =
    wallpapers.find((wallpaper) => wallpaper.id === selectedId) ?? wallpapers[0];
  const activeWallpaper =
    wallpapers.find((wallpaper) => wallpaper.id === activeId) ?? selectedWallpaper;
  const uploadCount = wallpapers.filter((wallpaper) => wallpaper.category === 'my-uploads').length;
  const favoriteCount = wallpapers.filter((wallpaper) => wallpaper.isFav).length;
  const activeSectionMeta = sectionMeta[section];

  const applyWallpaper = useCallback(() => {
    const target = wallpapers.find((wallpaper) => wallpaper.id === selectedId);

    if (!target) {
      return;
    }

    setActiveId(target.id);
    setToast(`《${target.name}》已经完美契合到您的桌面环境。`);
  }, [selectedId, wallpapers]);

  const openUploadModal = useCallback(() => {
    setUploadName('');
    setUploadAuthor('');
    setUploadPreview(null);
    setUploadError('');
    setIsUploadOpen(true);
    window.setTimeout(() => uploadNameRef.current?.focus(), 80);
  }, []);

  useEffect(() => {
    const unregisterSearch = header.registerCommand(
      'wallpaper.search',
      (payload: AppHeaderCommandPayload) => setSearchQuery(payload.value ?? ''),
    );
    const unregisterUpload = header.registerCommand('wallpaper.upload', openUploadModal);
    const unregisterApply = header.registerCommand('wallpaper.apply', applyWallpaper);

    return () => {
      unregisterSearch();
      unregisterUpload();
      unregisterApply();
    };
  }, [applyWallpaper, header, openUploadModal]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleWallpapers = useMemo(
    () =>
      wallpapers.filter((wallpaper) => {
        const useDiscoverFilters = section === 'all';
        const matchesType = typeFilter === 'all' || wallpaper.type === typeFilter;
        const matchesTag = tagFilter === '全部标签' || wallpaper.tags.includes(tagFilter);
        const matchesCategory =
          section === 'all' ||
          (section === 'premium' && wallpaper.category === 'premium') ||
          (section === 'trending' && wallpaper.category === 'trending') ||
          (section === 'my-uploads' && wallpaper.category === 'my-uploads') ||
          (section === 'favorites' && wallpaper.isFav);
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !normalizedQuery ||
          `${wallpaper.name} ${wallpaper.author} ${wallpaper.tags.join(' ')}`
            .toLowerCase()
            .includes(normalizedQuery);

        return (
          (useDiscoverFilters ? matchesType && matchesTag : true) &&
          matchesCategory &&
          matchesSearch
        );
      }),
    [searchQuery, section, tagFilter, typeFilter, wallpapers],
  );

  function toggleFavorite(id: number) {
    setWallpapers((currentWallpapers) =>
      currentWallpapers.map((wallpaper) =>
        wallpaper.id === id ? { ...wallpaper, isFav: !wallpaper.isFav } : wallpaper,
      ),
    );
  }

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    setUploadError('');

    if (!file) {
      setUploadPreview(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = uploadName.trim();
    const cleanAuthor = uploadAuthor.trim();

    if (!cleanName) {
      setUploadError('请输入您导入的壁纸艺术名称。');
      return;
    }

    if (!uploadPreview) {
      setUploadError('请点击下方卡片上传并关联本地高清壁纸。');
      return;
    }

    const nextWallpaper: WallpaperAsset = {
      id: Date.now(),
      name: cleanName,
      author: cleanAuthor || '匿名创意家',
      type: uploadKind,
      category: 'my-uploads',
      isFav: false,
      tags: ['自定义'],
      image: uploadPreview,
      desc: `用户于 ${new Date().toLocaleDateString()} 自定义导入的本地高级摄影艺术作品。`,
    };

    setWallpapers((currentWallpapers) => [nextWallpaper, ...currentWallpapers]);
    setSelectedId(nextWallpaper.id);
    setSection('my-uploads');
    setIsUploadOpen(false);
    setToast(`《${nextWallpaper.name}》已加入我的上传。`);
  }

  return (
    <div
      className="relative h-full min-h-[640px] overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]"
      data-wallpaper-app="true"
    >
      <main className="flex h-full min-h-0 overflow-hidden">
        <aside className="hidden w-60 shrink-0 select-none flex-col justify-between border-r border-black/[0.07] bg-[rgba(246,246,248,0.85)] p-4 backdrop-blur-[30px] lg:flex">
          <div className="space-y-6">
            <SidebarGroup title="壁纸探索">
              {sidebarPrimaryItems.map((item) => (
                <SidebarButton
                  active={section === item.id}
                  count={undefined}
                  key={item.id}
                  label={item.label}
                  onClick={() => setSection(item.id)}
                >
                  <item.Icon aria-hidden="true" className={`size-4 ${item.tone}`} />
                </SidebarButton>
              ))}
            </SidebarGroup>

            <SidebarGroup title="我的空间">
              <SidebarButton
                active={section === 'my-uploads'}
                count={uploadCount}
                label="我的上传"
                onClick={() => setSection('my-uploads')}
              >
                <ArrowUpToLine aria-hidden="true" className="size-4 text-indigo-500" />
              </SidebarButton>
              <SidebarButton
                active={section === 'favorites'}
                count={favoriteCount}
                label="我的收藏"
                onClick={() => setSection('favorites')}
              >
                <Heart aria-hidden="true" className="size-4 text-red-500" />
              </SidebarButton>
            </SidebarGroup>
          </div>

          <button
            className="group flex w-full items-center gap-3 overflow-hidden rounded-xl border border-dashed border-black/[0.07] bg-black/[0.02] px-3 py-3 text-left transition-all duration-200 hover:border-[#0a84ff]/60 hover:bg-[#0a84ff]/[0.06]"
            onClick={openUploadModal}
            type="button"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0a84ff]/10 transition-colors group-hover:bg-[#0a84ff]/15">
              <ImagePlus aria-hidden="true" className="size-4 text-[#0a84ff]" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-[#1d1d1f]">上传本地壁纸</span>
              <span className="mt-0.5 block truncate text-[10px] text-[#86868b]">
                支持 JPG / PNG · 拖拽或点击
              </span>
            </span>
          </button>
        </aside>

        <section
          className="min-w-0 flex-1 overflow-y-auto bg-white/50 p-6"
          id="wallpaper-grid-section"
        >
          {section === 'all' ? <HeroBanner onSelect={() => setSelectedId(1)} /> : null}

          <div className={section === 'all' ? 'mt-0' : ''}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-[#1d1d1f]">
                  {activeSectionMeta.title}
                </h2>
                <p className="mt-0.5 text-[11px] text-[#86868b]">{activeSectionMeta.desc}</p>
              </div>
              <div className="rounded-md bg-black/[0.05] px-2.5 py-1 text-[11px] font-medium text-[#86868b]">
                共计 <span className="font-bold text-[#1d1d1f]">{visibleWallpapers.length}</span> 款
              </div>
            </div>

            {section === 'all' ? (
              <div className="mb-5 space-y-2.5">
                <div className="flex w-fit items-center space-x-1 rounded-lg border border-black/[0.05] bg-black/[0.04] p-0.5">
                  {typeTabs.map((tab) => (
                    <button
                      aria-pressed={typeFilter === tab.value}
                      className={
                        typeFilter === tab.value
                          ? 'rounded-md bg-white px-3.5 py-1 text-xs font-medium text-[#1d1d1f] shadow-sm transition-all duration-200'
                          : 'rounded-md px-3.5 py-1 text-xs font-medium text-[#86868b] transition-all duration-200 hover:text-[#1d1d1f]'
                      }
                      key={tab.value}
                      onClick={() => setTypeFilter(tab.value)}
                      type="button"
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {allTags.map((tag) => (
                    <button
                      aria-pressed={tagFilter === tag}
                      className={
                        tagFilter === tag
                          ? 'shrink-0 rounded-full border border-[#0a84ff] bg-[#0a84ff] px-3 py-1 text-[11px] font-medium text-white shadow-sm transition-all duration-150'
                          : 'shrink-0 rounded-full border border-black/[0.07] bg-transparent px-3 py-1 text-[11px] font-medium text-[#86868b] transition-all duration-150 hover:border-[#0a84ff]/50 hover:text-[#1d1d1f]'
                      }
                      key={tag}
                      onClick={() => setTagFilter(tag)}
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {visibleWallpapers.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                {visibleWallpapers.map((wallpaper) => (
                  <WallpaperCard
                    active={wallpaper.id === activeId}
                    key={wallpaper.id}
                    onFavorite={toggleFavorite}
                    onSelect={setSelectedId}
                    selected={wallpaper.id === selectedId}
                    wallpaper={wallpaper}
                  />
                ))}
              </div>
            ) : (
              <div className="col-span-full flex min-h-[220px] flex-col items-center justify-center space-y-3 py-12 text-center text-[#86868b]">
                <FolderSearch aria-hidden="true" className="size-12 opacity-50" strokeWidth={1} />
                <p className="text-xs">未找到匹配的壁纸</p>
              </div>
            )}
          </div>
        </section>

        <WallpaperPreview
          activeWallpaper={activeWallpaper}
          onApply={applyWallpaper}
          onFavorite={() => toggleFavorite(selectedWallpaper.id)}
          selectedWallpaper={selectedWallpaper}
        />
      </main>

      {isUploadOpen ? (
        <UploadModal
          author={uploadAuthor}
          error={uploadError}
          kind={uploadKind}
          name={uploadName}
          nameRef={uploadNameRef}
          onAuthorChange={setUploadAuthor}
          onClose={() => setIsUploadOpen(false)}
          onFileChange={handleFileSelect}
          onKindChange={setUploadKind}
          onNameChange={setUploadName}
          onSubmit={submitUpload}
          preview={uploadPreview}
        />
      ) : null}

      <div
        className={
          toast
            ? 'absolute left-1/2 top-5 z-30 flex -translate-x-1/2 translate-y-0 items-center gap-3 rounded-2xl border border-black/[0.07] bg-white/90 px-4 py-3 opacity-100 shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-[30px] transition-all'
            : 'pointer-events-none absolute left-1/2 top-5 z-30 flex -translate-x-1/2 -translate-y-10 items-center gap-3 rounded-2xl border border-black/[0.07] bg-white/90 px-4 py-3 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-[30px] transition-all'
        }
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#0a84ff]/10 text-[#0a84ff]">
          <Check aria-hidden="true" className="size-4" />
        </span>
        <span>
          <span className="block text-xs font-bold text-[#1d1d1f]">桌面壁纸设置成功</span>
          <span className="mt-0.5 block text-[10px] text-[#86868b]">{toast}</span>
        </span>
      </div>
    </div>
  );
}

function SidebarGroup({ children, title }: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <div>
      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
        {title}
      </span>
      <div className="mt-2 space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarButton({
  active,
  children,
  count,
  label,
  onClick,
}: Readonly<{
  active: boolean;
  children: React.ReactNode;
  count?: number;
  label: string;
  onClick(): void;
}>) {
  return (
    <button
      aria-pressed={active}
      className={
        active
          ? 'flex w-full items-center gap-2.5 rounded-lg bg-black/[0.05] px-2.5 py-1.5 text-xs font-medium text-[#1d1d1f] transition-all'
          : 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#1d1d1f] transition-all hover:bg-black/[0.05]'
      }
      onClick={onClick}
      type="button"
    >
      {children}
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {typeof count === 'number' ? (
        <span className="rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[10px] text-[#6e7681]">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function HeroBanner({ onSelect }: Readonly<{ onSelect(): void }>) {
  return (
    <section className="group relative mb-6 h-40 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-violet-900 to-indigo-950 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_28px_-12px_rgba(0,0,0,0.10)]">
      <img
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover opacity-60 mix-blend-overlay transition-transform duration-[1200ms] group-hover:scale-105"
        draggable={false}
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
      <div className="absolute bottom-4 left-5 text-white">
        <span className="rounded-full border border-white/10 bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider backdrop-blur-md">
          今日推荐
        </span>
        <h1 className="mt-1.5 text-xl font-bold tracking-tight">抽象美学：流光之翼</h1>
        <p className="mt-0.5 text-[11px] text-zinc-300/90">
          专为 Retina 视网膜屏优化的 8K 物理色彩渲染壁纸
        </p>
      </div>
      <button
        className="absolute bottom-4 right-5 rounded-lg bg-white/95 px-4 py-1.5 text-xs font-semibold text-zinc-900 shadow-md transition-all hover:bg-white active:scale-95"
        onClick={onSelect}
        type="button"
      >
        立即体验
      </button>
    </section>
  );
}

function WallpaperCard({
  active,
  onFavorite,
  onSelect,
  selected,
  wallpaper,
}: Readonly<{
  active: boolean;
  onFavorite(id: number): void;
  onSelect(id: number): void;
  selected: boolean;
  wallpaper: WallpaperAsset;
}>) {
  return (
    <article
      className={
        selected
          ? 'group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-transparent bg-white shadow-[0_0_0_2px_#0a84ff,0_2px_8px_rgba(0,0,0,0.06),0_12px_28px_-12px_rgba(0,0,0,0.10)] transition-all duration-300'
          : 'group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_28px_-12px_rgba(0,0,0,0.10)]'
      }
      onClick={() => onSelect(wallpaper.id)}
    >
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-zinc-200">
        <img
          alt={wallpaper.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          draggable={false}
          src={wallpaper.image}
        />
        <div className="absolute left-2 top-2 flex items-center gap-1">
          <span className="rounded bg-black/40 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white backdrop-blur-sm">
            {kindLabels[wallpaper.type]}
          </span>
          {active ? (
            <span className="rounded bg-[#0a84ff] px-1.5 py-0.5 text-[8px] font-bold text-white shadow-md">
              应用中
            </span>
          ) : null}
        </div>
        <button
          aria-label={`${wallpaper.isFav ? '取消收藏' : '收藏'} ${wallpaper.name}`}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white/80 text-red-500 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            onFavorite(wallpaper.id);
          }}
          type="button"
        >
          <Heart
            aria-hidden="true"
            className={wallpaper.isFav ? 'size-3.5 fill-current' : 'size-3.5'}
          />
        </button>
      </div>
      <div className="flex min-w-0 items-center justify-between p-3">
        <div className="min-w-0 truncate">
          <h3 className="truncate text-xs font-bold text-[#1d1d1f]">{wallpaper.name}</h3>
          <p className="mt-0.5 truncate text-[10px] text-[#86868b]">by {wallpaper.author}</p>
        </div>
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-[#86868b] transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </article>
  );
}

function WallpaperPreview({
  activeWallpaper,
  onApply,
  onFavorite,
  selectedWallpaper,
}: Readonly<{
  activeWallpaper: WallpaperAsset;
  onApply(): void;
  onFavorite(): void;
  selectedWallpaper: WallpaperAsset;
}>) {
  return (
    <aside className="hidden w-80 shrink-0 select-none flex-col justify-between border-l border-black/[0.07] bg-[rgba(246,246,248,0.85)] p-5 backdrop-blur-[30px] xl:flex">
      <div className="space-y-5">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
          桌面预览效果
        </span>

        <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-black/20 bg-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_28px_-12px_rgba(0,0,0,0.10)]">
          <div className="absolute inset-x-0 top-0 z-10 flex h-4 items-center justify-between bg-black/15 px-2 text-[8px] text-white backdrop-blur-[2px]">
            <div className="flex items-center gap-2">
              <Monitor aria-hidden="true" className="size-2.5" />
              <span className="font-bold">KernelOn</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi aria-hidden="true" className="size-2" />
              <BatteryFull aria-hidden="true" className="size-2.5" />
              <span className="font-semibold">10:28</span>
            </div>
          </div>
          <img
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover transition-all duration-500"
            draggable={false}
            src={selectedWallpaper.image}
          />
          <div className="absolute inset-x-0 bottom-1 z-10 flex justify-center">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/20 px-2 py-1 shadow-md backdrop-blur-md">
              {['#f8fbff', '#0a84ff', '#27c840', '#ff4f67', '#293447'].map((color) => (
                <span
                  aria-hidden="true"
                  className="size-4 rounded-md shadow-inner"
                  key={color}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate text-sm font-bold text-[#1d1d1f]">{selectedWallpaper.name}</h3>
            <span className="scale-90 rounded bg-[#0a84ff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              {kindLabels[selectedWallpaper.type]}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-[#86868b]">
            由 {selectedWallpaper.author} 设计提供
          </p>
          <p className="mt-2.5 text-xs leading-relaxed text-[#86868b]">{selectedWallpaper.desc}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {selectedWallpaper.tags.map((tag) => (
              <span
                className="rounded-full border border-black/[0.07] bg-black/[0.05] px-2 py-0.5 text-[10px] text-[#86868b]"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-black/[0.07] pt-4">
        <p className="text-[11px] text-[#86868b]">
          当前桌面：<span className="font-bold text-[#1d1d1f]">{activeWallpaper.name}</span>
        </p>
        <div className="grid grid-cols-5 gap-2">
          <button
            aria-label="收藏当前预览壁纸"
            className="col-span-1 flex h-10 items-center justify-center rounded-xl border border-black/[0.07] bg-white/75 text-red-500 transition-all hover:bg-black/[0.05] active:scale-95"
            onClick={onFavorite}
            type="button"
          >
            <Heart
              aria-hidden="true"
              className={selectedWallpaper.isFav ? 'size-[18px] fill-current' : 'size-[18px]'}
            />
          </button>
          <button
            className="col-span-4 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#0a84ff] text-xs font-semibold text-white shadow-[0_4px_12px_rgba(10,132,255,0.30)] transition-all hover:bg-[#0077ed] active:scale-[0.98]"
            onClick={onApply}
            type="button"
          >
            <Check aria-hidden="true" className="size-4" />
            应用此桌面壁纸
          </button>
        </div>
      </div>
    </aside>
  );
}

function UploadModal({
  author,
  error,
  kind,
  name,
  nameRef,
  onAuthorChange,
  onClose,
  onFileChange,
  onKindChange,
  onNameChange,
  onSubmit,
  preview,
}: Readonly<{
  author: string;
  error: string;
  kind: WallpaperKind;
  name: string;
  nameRef: React.RefObject<HTMLInputElement | null>;
  onAuthorChange(value: string): void;
  onClose(): void;
  onFileChange(event: ChangeEvent<HTMLInputElement>): void;
  onKindChange(value: WallpaperKind): void;
  onNameChange(value: string): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
  preview: string | null;
}>) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/20 p-6 opacity-100 backdrop-blur-sm transition-opacity">
      <form
        className="w-full max-w-md scale-100 rounded-2xl border border-black/[0.07] bg-white/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] transition-transform"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#1d1d1f]">上传本地壁纸</h2>
            <p className="mt-1 text-[11px] text-[#86868b]">添加个人桌面资产，并保存在我的空间。</p>
          </div>
          <button
            className="rounded-lg px-2 py-1 text-xs font-semibold text-[#6e7681] transition hover:bg-black/[0.05]"
            onClick={onClose}
            type="button"
          >
            关闭
          </button>
        </div>

        <label className="mt-4 block">
          <span className="text-[11px] font-semibold text-[#4d596b]">壁纸名称</span>
          <input
            className="mt-2 h-9 w-full rounded-lg border border-black/[0.07] bg-white px-3 text-xs text-[#1d1d1f] outline-none transition focus:border-[#0a84ff]/50 focus:ring-2 focus:ring-[#0a84ff]/15"
            onChange={(event) => onNameChange(event.currentTarget.value)}
            ref={nameRef}
            value={name}
          />
        </label>

        <label className="mt-3 block">
          <span className="text-[11px] font-semibold text-[#4d596b]">作者</span>
          <input
            className="mt-2 h-9 w-full rounded-lg border border-black/[0.07] bg-white px-3 text-xs text-[#1d1d1f] outline-none transition focus:border-[#0a84ff]/50 focus:ring-2 focus:ring-[#0a84ff]/15"
            onChange={(event) => onAuthorChange(event.currentTarget.value)}
            placeholder="可选"
            value={author}
          />
        </label>

        <div className="mt-3">
          <span className="text-[11px] font-semibold text-[#4d596b]">类型</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {typeTabs.slice(1).map((tab) => (
              <button
                aria-pressed={kind === tab.value}
                className={
                  kind === tab.value
                    ? 'h-9 rounded-lg bg-[#0a84ff] text-xs font-semibold text-white'
                    : 'h-9 rounded-lg border border-black/[0.07] bg-white text-xs font-semibold text-[#6e7681] transition hover:bg-black/[0.04]'
                }
                key={tab.value}
                onClick={() => onKindChange(tab.value as WallpaperKind)}
                type="button"
              >
                {tab.label.replace('壁纸', '')}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-4 grid min-h-[150px] cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-black/[0.16] bg-black/[0.02] text-center transition hover:border-[#0a84ff]/60 hover:bg-[#0a84ff]/[0.05]">
          {preview ? (
            <img
              alt="上传壁纸预览"
              className="h-full max-h-[210px] w-full object-cover"
              src={preview}
            />
          ) : (
            <span>
              <UploadCloud aria-hidden="true" className="mx-auto size-8 text-[#0a84ff]" />
              <span className="mt-2 block text-xs font-semibold text-[#1d1d1f]">选择本地文件</span>
              <span className="mt-1 block text-[10px] text-[#86868b]">JPG / PNG / WebP / MP4</span>
            </span>
          )}
          <input
            accept="image/jpeg,image/png,image/webp,video/mp4"
            className="sr-only"
            onChange={onFileChange}
            type="file"
          />
        </label>

        {error ? <p className="mt-3 text-[11px] font-semibold text-red-500">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="h-9 rounded-lg border border-black/[0.07] bg-white px-4 text-xs font-semibold text-[#6e7681] transition hover:bg-black/[0.04]"
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className="h-9 rounded-lg bg-[#0a84ff] px-4 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(10,132,255,0.22)] transition hover:bg-[#0077ed]"
            type="submit"
          >
            加入壁纸库
          </button>
        </div>
      </form>
    </div>
  );
}
