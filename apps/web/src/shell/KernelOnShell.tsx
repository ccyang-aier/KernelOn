import { AppWindow, Command, Grid3X3, Search, Wifi } from 'lucide-react';

import { Button, IconButton, Surface, WindowFrame } from '@kernelon/ui';

import { useShellStore } from '../state/shell-store';
import { resolveAppIcon } from './app-icons';

export function KernelOnShell() {
  const apps = useShellStore((state) => state.apps);
  const dockAppIds = useShellStore((state) => state.dockAppIds);
  const windows = useShellStore((state) => state.windows);
  const launcherOpen = useShellStore((state) => state.launcherOpen);
  const spotlightOpen = useShellStore((state) => state.spotlightOpen);
  const openApp = useShellStore((state) => state.openApp);
  const focusWindow = useShellStore((state) => state.focusWindow);
  const closeWindow = useShellStore((state) => state.closeWindow);
  const toggleLauncher = useShellStore((state) => state.toggleLauncher);
  const toggleSpotlight = useShellStore((state) => state.toggleSpotlight);
  const dockApps = apps.filter((app) => dockAppIds.includes(app.id));

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--ko-bg)] text-[var(--ko-ink)]">
      <div className="flex min-h-screen flex-col">
        <header className="flex h-14 items-center justify-between border-b border-[var(--ko-border)] bg-white/78 px-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md bg-[var(--ko-ink)] text-sm font-semibold text-white">
              KO
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none">KernelOn</h1>
              <p className="mt-1 text-xs text-[var(--ko-muted)]">Desktop Shell</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button size="sm" variant="ghost" onClick={toggleSpotlight}>
              <Search className="mr-2 size-4" />
              AI Spotlight
            </Button>
            <div className="flex items-center gap-2 rounded-md border border-[var(--ko-border)] bg-white/70 px-3 py-1.5 text-xs text-[var(--ko-muted)]">
              <Wifi className="size-3.5 text-[var(--ko-accent)]" />
              Web first
            </div>
          </div>
        </header>

        <section className="relative flex flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(20,31,48,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(20,31,48,0.045)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="relative z-10 grid flex-1 grid-rows-[1fr_auto] p-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <Surface className="rounded-lg p-5" tone="glass">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--ko-muted)]">
                      Workspace
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.01em]">
                      新员工运作工作台
                    </h2>
                  </div>
                  <Button variant="primary" onClick={toggleLauncher}>
                    <Grid3X3 className="mr-2 size-4" />
                    启动台
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {apps.map((app) => {
                    const Icon = resolveAppIcon(app.icon);

                    return (
                      <button
                        className="group flex min-h-28 flex-col items-start rounded-lg border border-[var(--ko-border)] bg-white/78 p-4 text-left shadow-[0_12px_32px_rgba(17,24,39,0.06)] transition hover:-translate-y-0.5 hover:border-[var(--ko-accent)] hover:bg-white"
                        key={app.id}
                        type="button"
                        onClick={() => openApp(app.id)}
                      >
                        <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-[var(--ko-accent-soft)] text-[var(--ko-accent)]">
                          <Icon className="size-5" />
                        </div>
                        <div className="text-sm font-semibold text-[var(--ko-ink)]">{app.name}</div>
                        <p className="mt-1 text-xs leading-5 text-[var(--ko-muted)]">
                          {app.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </Surface>

              <Surface className="rounded-lg p-5" tone="glass">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-md bg-[var(--ko-warning-soft)] text-[var(--ko-warning)]">
                    <Command className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">Core Services</h2>
                    <p className="mt-1 text-xs text-[var(--ko-muted)]">
                      Window Manager / State DB / AI Engine
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    ['窗口状态', `${windows.length} active model item(s)`],
                    ['桌面栅格', 'Magnetic Grid placeholder'],
                    ['命令中心', spotlightOpen ? 'Spotlight open' : 'Spotlight idle'],
                  ].map(([label, value]) => (
                    <div
                      className="rounded-md border border-[var(--ko-border)] bg-white/70 px-4 py-3"
                      key={label}
                    >
                      <div className="text-xs text-[var(--ko-muted)]">{label}</div>
                      <div className="mt-1 text-sm font-medium text-[var(--ko-ink)]">{value}</div>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>

            <nav className="mx-auto mt-5 flex max-w-full items-center gap-2 rounded-lg border border-[var(--ko-border)] bg-white/82 p-2 shadow-[0_20px_60px_rgba(17,24,39,0.08)] backdrop-blur-xl">
              <IconButton aria-label="打开启动台" selected={launcherOpen} onClick={toggleLauncher}>
                <Grid3X3 className="size-5" />
              </IconButton>
              {dockApps.map((app) => {
                const Icon = resolveAppIcon(app.icon);

                return (
                  <IconButton
                    aria-label={`打开${app.name}`}
                    key={app.id}
                    onClick={() => openApp(app.id)}
                  >
                    <Icon className="size-5" />
                  </IconButton>
                );
              })}
            </nav>
          </div>

          {launcherOpen ? (
            <Surface
              className="absolute bottom-24 left-1/2 z-30 grid w-[min(720px,calc(100vw-32px))] -translate-x-1/2 gap-3 rounded-lg p-4 sm:grid-cols-2 md:grid-cols-3"
              tone="glass"
            >
              {apps.map((app) => (
                <Button className="justify-start" key={app.id} onClick={() => openApp(app.id)}>
                  {app.name}
                </Button>
              ))}
            </Surface>
          ) : null}

          {spotlightOpen ? (
            <Surface
              className="absolute left-1/2 top-20 z-30 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 rounded-lg p-4"
              tone="glass"
            >
              <div className="flex items-center gap-3 rounded-md border border-[var(--ko-border)] bg-white px-4 py-3">
                <Search className="size-5 text-[var(--ko-muted)]" />
                <span className="text-sm text-[var(--ko-muted)]">
                  搜索 App，或输入“匹配导师张三和新人李四”
                </span>
              </div>
            </Surface>
          ) : null}

          {windows.map((window) => {
            const app = apps.find((item) => item.id === window.appId);

            return (
              <div
                className="absolute z-20 w-[min(520px,calc(100vw-40px))]"
                key={window.id}
                style={{
                  left: Math.min(window.bounds.x, 280),
                  top: Math.min(window.bounds.y, 160),
                  zIndex: window.zIndex + 20,
                }}
                onMouseDown={() => focusWindow(window.id)}
              >
                <WindowFrame
                  actions={
                    <Button size="sm" variant="ghost" onClick={() => closeWindow(window.id)}>
                      关闭
                    </Button>
                  }
                  title={window.title}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--ko-accent-soft)] text-[var(--ko-accent)]">
                      <AppWindow className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--ko-ink)]">
                        {app?.description ?? 'KernelOn app shell'}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[var(--ko-muted)]">
                        这里保留业务 App 的窗口边界，后续可在不改动 Shell 的前提下逐步接入真实功能。
                      </p>
                    </div>
                  </div>
                </WindowFrame>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
