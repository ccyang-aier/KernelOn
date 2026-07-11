'use client';

import {
  ArrowRight,
  Check,
  Cloud,
  Database,
  Eye,
  EyeOff,
  Frame,
  Heart,
  Image as ImageIcon,
  Monitor,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useState, useRef, type ReactNode, type FormEvent } from 'react';

import type { CategoryId, WallpaperAsset, WallpaperSource } from '../types';

type SettingsTab = 'personalize' | 'favorites' | 'uploads' | 'sources';

export function SettingsView({
  glassDepth,
  isHeroAutoplayEnabled,
  isHeroDetailsVisible,
  onToggleGlassDepth,
  onToggleHeroAutoplay,
  onToggleHeroDetails,
  onTogglePreviewFit,
  previewFitMode,
  selectedWallpaper,
  allWallpapers,
  customWallpapers,
  likedIds,
  sources,
  onLike,
  onApply,
  onUploadWallpaper,
  onDeleteUploadedWallpaper,
  onToggleSource,
  onAddSource,
  onRemoveSource,
}: Readonly<{
  glassDepth: 'deep' | 'soft';
  isHeroAutoplayEnabled: boolean;
  isHeroDetailsVisible: boolean;
  onToggleGlassDepth(): void;
  onToggleHeroAutoplay(): void;
  onToggleHeroDetails(): void;
  onTogglePreviewFit(): void;
  previewFitMode: 'fill' | 'fit';
  selectedWallpaper: WallpaperAsset;
  allWallpapers: WallpaperAsset[];
  customWallpapers: WallpaperAsset[];
  likedIds: ReadonlySet<string>;
  sources: WallpaperSource[];
  onLike(id: string): void;
  onApply(id: string): void;
  onUploadWallpaper(w: WallpaperAsset): void;
  onDeleteUploadedWallpaper(id: string): void;
  onToggleSource(id: string): void;
  onAddSource(s: WallpaperSource): void;
  onRemoveSource(id: string): void;
}>) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('personalize');

  // 上传相关的状态
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAuthor, setUploadAuthor] = useState('');
  const [uploadCategory, setUploadCategory] = useState<CategoryId>('Other');
  const [uploadResolution, setUploadResolution] = useState('3840x2160');
  const [uploadSize, setUploadSize] = useState('4.2 MB');
  const [isDragOver, setIsDragOver] = useState(false);

  // 添加源相关的状态
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceDesc, setNewSourceDesc] = useState('');

  // 处理上传图片选择
  const handleFileChange = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件！');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setUploadPreviewUrl(previewUrl);

    // 解析图片尺寸及基本参数
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setUploadSize(sizeInMB);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, '')); // 去掉后缀名作为默认标题
    setUploadAuthor('本地用户');

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      setUploadResolution(`${img.naturalWidth}x${img.naturalHeight}`);
    };
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, [handleFileChange]);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleConfirmUpload = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!uploadPreviewUrl || !uploadTitle) {
      return;
    }

    const newWallpaper: WallpaperAsset = {
      id: `custom-${Date.now()}`,
      title: uploadTitle || '未命名本地壁纸',
      category: uploadCategory,
      author: uploadAuthor || '本地用户',
      authorInitial: (uploadAuthor || '本')[0]?.toUpperCase() || 'L',
      image: uploadPreviewUrl, // 实质上在刷新后如果使用 Blob URL 可能会失效，不过在当前 session/演示中可直接工作，若要严格可用也可以使用 base64。但因为演示中 blob 链接即用，所以保留 blob
      device: 'User Upload',
      duration: '0:00',
      durationSeconds: 0,
      resolution: uploadResolution,
      size: uploadSize,
      likes: 0,
      tags: ['Local', uploadCategory],
      uploadedAt: new Date().toISOString(),
      liked: false,
    };

    onUploadWallpaper(newWallpaper);

    // 清空状态
    setUploadPreviewUrl('');
    setUploadTitle('');
    setUploadAuthor('');
    setUploadCategory('Other');
  }, [uploadPreviewUrl, uploadTitle, uploadCategory, uploadAuthor, uploadResolution, uploadSize, onUploadWallpaper]);

  const handleCancelUpload = useCallback(() => {
    setUploadPreviewUrl('');
  }, []);

  // 新增壁纸来源站
  const handleAddSourceSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newSourceUrl) {
      return;
    }

    const newSource: WallpaperSource = {
      id: `source-${Date.now()}`,
      name: newSourceName,
      url: newSourceUrl,
      enabled: true,
      isSystem: false,
      description: newSourceDesc || '用户自定义壁纸源站。',
    };

    onAddSource(newSource);
    setIsAddingSource(false);
    setNewSourceName('');
    setNewSourceUrl('');
    setNewSourceDesc('');
  }, [newSourceName, newSourceUrl, newSourceDesc, onAddSource]);

  // 过滤出我喜欢的壁纸列表
  const favoriteWallpapers = allWallpapers.filter((w) => likedIds.has(w.id));

  return (
    <section aria-label="壁纸设置" className="wallpaper-page wallpaper-page--settings">
      <div className="wallpaper-settings-heading">
        <p>个性化管理</p>
        <h1>高级偏好设置</h1>
        <span>微调壁纸视觉质感、管理收藏壁纸、配置壁纸获取源。</span>
      </div>

      <div className="wallpaper-settings-container">
        {/* 左侧垂直侧边栏菜单 */}
        <aside className="wallpaper-settings-sidebar">
          <button
            aria-current={activeTab === 'personalize' ? 'page' : undefined}
            className={`wallpaper-sidebar-item ${activeTab === 'personalize' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('personalize')}
            type="button"
          >
            <Sparkles className="wallpaper-sidebar-item__icon" />
            <span>个性化微调</span>
          </button>
          <button
            aria-current={activeTab === 'favorites' ? 'page' : undefined}
            className={`wallpaper-sidebar-item ${activeTab === 'favorites' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('favorites')}
            type="button"
          >
            <Heart className="wallpaper-sidebar-item__icon" />
            <span>我的收藏</span>
            {favoriteWallpapers.length > 0 && (
              <span className="wallpaper-sidebar-item__badge">{favoriteWallpapers.length}</span>
            )}
          </button>
          <button
            aria-current={activeTab === 'uploads' ? 'page' : undefined}
            className={`wallpaper-sidebar-item ${activeTab === 'uploads' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('uploads')}
            type="button"
          >
            <Upload className="wallpaper-sidebar-item__icon" />
            <span>壁纸上传管理</span>
            {customWallpapers.length > 0 && (
              <span className="wallpaper-sidebar-item__badge">{customWallpapers.length}</span>
            )}
          </button>
          <button
            aria-current={activeTab === 'sources' ? 'page' : undefined}
            className={`wallpaper-sidebar-item ${activeTab === 'sources' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('sources')}
            type="button"
          >
            <Cloud className="wallpaper-sidebar-item__icon" />
            <span>壁纸源管理</span>
          </button>
        </aside>

        {/* 右侧主面板内容区 */}
        <main className="wallpaper-settings-main-content">
          {/* Tab 1: 个性化微调 */}
          {activeTab === 'personalize' && (
            <div className="wallpaper-settings-panel anime-fade-in">
              <div className="wallpaper-settings-panel__header">
                <h2>个性化微调</h2>
                <p>调整系统外观与动态交互行为。</p>
              </div>

              <div className="wallpaper-settings-layout">
                <div className="wallpaper-settings-card">
                  <div className="wallpaper-settings-card__heading">
                    <div>
                      <span>浏览体验</span>
                      <strong>即时生效</strong>
                    </div>
                    <span className="wallpaper-settings-card__status">4 项偏好</span>
                  </div>

                  <SettingsRow
                    active={isHeroAutoplayEnabled}
                    description="主页打开时自动轮换精选壁纸。"
                    icon={
                      isHeroAutoplayEnabled ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />
                    }
                    label="自动轮换精选壁纸"
                    onClick={onToggleHeroAutoplay}
                    state={isHeroAutoplayEnabled ? '开启' : '关闭'}
                  />
                  <SettingsRow
                    active={isHeroDetailsVisible}
                    description="在主视觉区域显示分辨率、作者、文件大小和时长。"
                    icon={isHeroDetailsVisible ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                    label="壁纸详情"
                    onClick={onToggleHeroDetails}
                    state={isHeroDetailsVisible ? '可见' : '隐藏'}
                  />
                  <SettingsRow
                    active={previewFitMode === 'fill'}
                    description="选择铺满窗口，或保留完整作品。"
                    icon={<Frame aria-hidden="true" />}
                    label="预览画面"
                    onClick={onTogglePreviewFit}
                    state={previewFitMode === 'fill' ? '铺满' : '适配'}
                  />
                  <SettingsRow
                    active={glassDepth === 'deep'}
                    description="控制主页以外磨砂界面的对比度。"
                    icon={<Sparkles aria-hidden="true" />}
                    label="界面玻璃"
                    onClick={onToggleGlassDepth}
                    state={glassDepth === 'deep' ? '深色' : '柔和'}
                  />
                </div>

                <aside className="wallpaper-settings-current" aria-label="当前壁纸">
                  <div className="wallpaper-settings-current__media">
                    <img alt="" draggable={false} src={selectedWallpaper.image} />
                    <div className="wallpaper-settings-current__shade" />
                    <span className="wallpaper-settings-current__badge">当前壁纸</span>
                  </div>
                  <div className="wallpaper-settings-current__content">
                    <span>{selectedWallpaper.category}</span>
                    <h2>{selectedWallpaper.title}</h2>
                    <p>
                      {selectedWallpaper.resolution} · {selectedWallpaper.author}
                    </p>
                    <div className="wallpaper-settings-current__chips" aria-label="当前偏好">
                      <span>{previewFitMode === 'fill' ? '铺满画面' : '完整作品'}</span>
                      <span>{glassDepth === 'deep' ? '深色磨砂' : '柔和磨砂'}</span>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* Tab 2: 我的收藏 */}
          {activeTab === 'favorites' && (
            <div className="wallpaper-settings-panel anime-fade-in">
              <div className="wallpaper-settings-panel__header">
                <h2>我的收藏</h2>
                <p>管理与应用你喜欢的壁纸瞬间。</p>
              </div>

              {favoriteWallpapers.length === 0 ? (
                <div className="wallpaper-settings-empty">
                  <div className="wallpaper-settings-empty__icon">
                    <Heart className="heart-broken" />
                  </div>
                  <h3>暂无收藏的壁纸</h3>
                  <p>在系统主页或探索库中浏览时，点击壁纸右侧的心形按钮即可将其收藏到此。</p>
                </div>
              ) : (
                <div className="wallpaper-settings-grid">
                  {favoriteWallpapers.map((wallpaper) => {
                    const isApplied = selectedWallpaper.id === wallpaper.id;
                    return (
                      <div className="wallpaper-settings-grid-item" key={wallpaper.id}>
                        <div className="wallpaper-settings-grid-item__media">
                          <img alt={wallpaper.title} src={wallpaper.image} />
                          <div className="wallpaper-settings-grid-item__overlay">
                            <button
                              className={`action-btn action-btn--apply ${isApplied ? 'applied' : ''}`}
                              onClick={() => onApply(wallpaper.id)}
                              type="button"
                            >
                              {isApplied ? <Check className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                              <span>{isApplied ? '当前使用中' : '设为壁纸'}</span>
                            </button>
                            <button
                              className="action-btn action-btn--unlike"
                              onClick={() => onLike(wallpaper.id)}
                              title="取消收藏"
                              type="button"
                            >
                              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                              <span>取消收藏</span>
                            </button>
                          </div>
                        </div>
                        <div className="wallpaper-settings-grid-item__info">
                          <h4>{wallpaper.title}</h4>
                          <p>{wallpaper.author} · {wallpaper.resolution}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: 壁纸上传管理 */}
          {activeTab === 'uploads' && (
            <div className="wallpaper-settings-panel anime-fade-in">
              <div className="wallpaper-settings-panel__header">
                <h2>壁纸上传管理</h2>
                <p>将本地的优质图片上传到 KernelOn 壁纸库中，供系统快捷应用。</p>
              </div>

              {/* 上传表单 */}
              {!uploadPreviewUrl ? (
                <div
                  className={`wallpaper-upload-zone ${isDragOver ? 'is-dragover' : ''}`}
                  onClick={triggerFileSelect}
                  onDragLeave={onDragLeave}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                >
                  <input
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                    ref={fileInputRef}
                    type="file"
                  />
                  <div className="wallpaper-upload-zone__content">
                    <Upload className="w-12 h-12 text-slate-400 stroke-1" />
                    <h3>拖拽图片文件到此，或<span>点击选择</span></h3>
                    <p>支持 JPG, PNG, WEBP 高清图片</p>
                  </div>
                </div>
              ) : (
                <form className="wallpaper-upload-form" onSubmit={handleConfirmUpload}>
                  <div className="wallpaper-upload-form__layout">
                    <div className="wallpaper-upload-form__preview">
                      <img alt="预览" src={uploadPreviewUrl} />
                      <span className="info-badge">{uploadResolution}</span>
                    </div>

                    <div className="wallpaper-upload-form__fields">
                      <div className="form-group">
                        <label htmlFor="upload-title">壁纸名称</label>
                        <input
                          id="upload-title"
                          onChange={(e) => setUploadTitle(e.target.value)}
                          required
                          type="text"
                          value={uploadTitle}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="upload-author">创作者 / 来源</label>
                        <input
                          id="upload-author"
                          onChange={(e) => setUploadAuthor(e.target.value)}
                          type="text"
                          value={uploadAuthor}
                        />
                      </div>

                      <div className="form-group-row">
                        <div className="form-group">
                          <label htmlFor="upload-category">分类类型</label>
                          <select
                            id="upload-category"
                            onChange={(e) => setUploadCategory(e.target.value as CategoryId)}
                            value={uploadCategory}
                          >
                            <option value="Nature">自然风景</option>
                            <option value="Anime">二次元</option>
                            <option value="Cars">汽车载具</option>
                            <option value="Games">游戏原画</option>
                            <option value="Minimalist">简约几何</option>
                            <option value="Space">星空探索</option>
                            <option value="Other">其它分类</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="upload-size-info">文件大小</label>
                          <input
                            disabled
                            id="upload-size-info"
                            type="text"
                            value={uploadSize}
                          />
                        </div>
                      </div>

                      <div className="wallpaper-upload-form__actions">
                        <button
                          className="cancel-btn"
                          onClick={handleCancelUpload}
                          type="button"
                        >
                          取消
                        </button>
                        <button className="submit-btn" type="submit">
                          确认导入壁纸库
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* 已上传壁纸展示 */}
              <div className="wallpaper-settings-panel__section mt-8">
                <h3 className="section-title">已上传壁纸 ({customWallpapers.length})</h3>

                {customWallpapers.length === 0 ? (
                  <div className="wallpaper-settings-sub-empty">
                    <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
                    <p>暂无自行上传的壁纸，你可以通过上方卡片上传本地资源。</p>
                  </div>
                ) : (
                  <div className="wallpaper-settings-grid">
                    {customWallpapers.map((wallpaper) => {
                      const isApplied = selectedWallpaper.id === wallpaper.id;
                      return (
                        <div className="wallpaper-settings-grid-item" key={wallpaper.id}>
                          <div className="wallpaper-settings-grid-item__media">
                            <img alt={wallpaper.title} src={wallpaper.image} />
                            <div className="wallpaper-settings-grid-item__overlay">
                              <button
                                className={`action-btn action-btn--apply ${isApplied ? 'applied' : ''}`}
                                onClick={() => onApply(wallpaper.id)}
                                type="button"
                              >
                                {isApplied ? <Check className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                <span>{isApplied ? '当前使用中' : '设为壁纸'}</span>
                              </button>
                              <button
                                className="action-btn action-btn--delete"
                                onClick={() => onDeleteUploadedWallpaper(wallpaper.id)}
                                title="删除此壁纸"
                                type="button"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                                <span>删除</span>
                              </button>
                            </div>
                          </div>
                          <div className="wallpaper-settings-grid-item__info">
                            <h4>{wallpaper.title}</h4>
                            <p>{wallpaper.author} · {wallpaper.resolution}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: 壁纸源管理 */}
          {activeTab === 'sources' && (
            <div className="wallpaper-settings-panel anime-fade-in">
              <div className="wallpaper-settings-panel__header">
                <h2>壁纸源管理</h2>
                <p>启用、停用或添加系统壁纸拉取 API 数据源。</p>
              </div>

              {/* 源列表 */}
              <div className="wallpaper-sources-list">
                {sources.map((source) => (
                  <div
                    className={`wallpaper-source-card ${source.enabled ? 'is-enabled' : 'is-disabled'}`}
                    key={source.id}
                  >
                    <div className="wallpaper-source-card__header">
                      <div className="source-info">
                        <div className="source-icon">
                          {source.id === 'system' ? (
                            <Monitor className="w-5 h-5 text-teal-400" />
                          ) : source.id === 'unsplash' ? (
                            <ImageIcon className="w-5 h-5 text-sky-400" />
                          ) : (
                            <Database className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <h3>
                            {source.name}
                            {source.isSystem && <span className="sys-badge">系统</span>}
                          </h3>
                          <code className="source-url">{source.url}</code>
                        </div>
                      </div>

                      <div className="source-controls">
                        {/* 玻璃开关 Toggle */}
                        <button
                          aria-label={`切换壁纸源: ${source.name}`}
                          className={`glass-switch ${source.enabled ? 'active' : ''}`}
                          onClick={() => onToggleSource(source.id)}
                          type="button"
                        >
                          <span className="glass-switch__handle" />
                        </button>

                        {!source.isSystem && (
                          <button
                            className="source-delete-btn"
                            onClick={() => onRemoveSource(source.id)}
                            title="移除此壁纸源"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="source-description">{source.description}</p>
                  </div>
                ))}
              </div>

              {/* 添加源板块 */}
              <div className="wallpaper-sources-add-section mt-8">
                {!isAddingSource ? (
                  <button
                    className="add-source-trigger"
                    onClick={() => setIsAddingSource(true)}
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                    <span>添加自定义壁纸来源站</span>
                  </button>
                ) : (
                  <form className="add-source-form anime-fade-in" onSubmit={handleAddSourceSubmit}>
                    <div className="add-source-form__header">
                      <h3>新增壁纸数据源</h3>
                      <button
                        className="close-btn"
                        onClick={() => setIsAddingSource(false)}
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="source-name">来源名称</label>
                        <input
                          id="source-name"
                          onChange={(e) => setNewSourceName(e.target.value)}
                          placeholder="例如：My Custom API"
                          required
                          type="text"
                          value={newSourceName}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="source-api-url">API 接口端点 / 地址</label>
                        <input
                          id="source-api-url"
                          onChange={(e) => setNewSourceUrl(e.target.value)}
                          placeholder="https://api.mywallpapers.com/v1"
                          required
                          type="url"
                          value={newSourceUrl}
                        />
                      </div>

                      <div className="form-group col-span-2">
                        <label htmlFor="source-description">来源描述</label>
                        <input
                          id="source-description"
                          onChange={(e) => setNewSourceDesc(e.target.value)}
                          placeholder="微调或填写该接口的相关描述与版权规则..."
                          type="text"
                          value={newSourceDesc}
                        />
                      </div>
                    </div>

                    <div className="add-source-form__actions">
                      <button
                        className="cancel-btn"
                        onClick={() => setIsAddingSource(false)}
                        type="button"
                      >
                        取消
                      </button>
                      <button className="submit-btn" type="submit">
                        配置对接
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}

function SettingsRow({
  active,
  description,
  icon,
  label,
  onClick,
  state,
}: Readonly<{
  active: boolean;
  description: string;
  icon: ReactNode;
  label: string;
  onClick(): void;
  state: string;
}>) {
  return (
    <button
      aria-pressed={active}
      className="wallpaper-settings-row"
      onClick={onClick}
      type="button"
    >
      <span className="wallpaper-settings-row__icon">{icon}</span>
      <span className="wallpaper-settings-row__copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <span className="wallpaper-settings-row__state">{state}</span>
    </button>
  );
}
