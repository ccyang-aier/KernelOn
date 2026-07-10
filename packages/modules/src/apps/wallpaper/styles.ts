export const wallpaperStyles = `
section[data-app-id="wallpaper"] {
  background: transparent !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
}

section[data-app-id="wallpaper"][data-window-layer="top"] {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 30px 84px rgba(0, 0, 0, 0.24) !important;
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header {
  position: absolute;
  inset: 0 0 auto;
  z-index: 120;
  min-height: 68px !important;
  height: 68px;
  overflow: visible;
  border-bottom: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header + [data-app-frame-content] {
  height: 100%;
  flex: 1 1 auto;
  background: transparent !important;
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > [data-app-frame-content] > [data-app-frame-scroll] {
  height: 100%;
  overflow: hidden !important;
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header [data-app-window-controls] {
  left: 24px;
  top: 31px;
  gap: 10px;
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header [data-app-window-controls] button {
  width: 13px;
  height: 13px;
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header > [data-app-header-row="primary"] {
  min-height: 68px;
  gap: 10px;
  padding: 0 24px;
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header [data-app-header-region="identity"] {
  display: none;
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header [data-app-header-region="leading"] {
  flex: 1 1 0;
  justify-content: flex-end;
  padding-right: 0;
  transition:
    opacity 260ms ease,
    transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header [data-app-header-region="center"] {
  flex: 0 0 auto;
  transition:
    opacity 260ms ease,
    transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header [data-app-header-region="trailing"] {
  flex: 1 1 0;
  gap: 10px;
  justify-content: flex-end;
  transition:
    opacity 260ms ease,
    transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header[data-app-header-preset="browser"] [data-app-header-region="leading"] {
  position: absolute;
  left: 112px;
  top: 13px;
  flex: none;
  justify-content: flex-start;
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header[data-app-header-preset="browser"] [data-app-header-region="center"] {
  position: absolute;
  left: 50%;
  top: 13px;
  flex: none;
  transform: translateX(-50%);
}

section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header[data-app-header-preset="browser"] [data-app-header-region="trailing"] {
  position: absolute;
  right: 24px;
  top: 13px;
  flex: none;
  gap: 10px;
}

.wallpaper-frosted-button,
.wallpaper-frosted-menu-button,
.wallpaper-frosted-search,
.wallpaper-frosted-segment,
.wallpaper-home__frosted-button {
  position: relative;
  isolation: isolate;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.012)),
    rgba(255, 255, 255, 0.025);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -1px 0 rgba(255, 255, 255, 0.03),
    0 6px 14px rgba(0, 0, 0, 0.05);
  -webkit-backdrop-filter: blur(2px) saturate(1.02);
  backdrop-filter: blur(2px) saturate(1.02);
}

.wallpaper-frosted-button {
  position: relative;
  display: inline-grid;
  width: 42px;
  height: 42px;
  place-items: center;
  overflow: hidden;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.92);
  padding: 0;
  cursor: pointer;
  animation: wallpaperHeaderControlIn 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease,
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.wallpaper-frosted-button:hover {
  border-color: rgba(255, 255, 255, 0.24);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.025)),
    rgba(255, 255, 255, 0.04);
  color: #fff;
}

.wallpaper-frosted-button:active {
  transform: scale(0.98);
}

.wallpaper-frosted-button:focus-visible,
.wallpaper-frosted-menu-button:focus-visible,
.wallpaper-frosted-search__button:focus-visible,
.wallpaper-frosted-segment__button:focus-visible,
.wallpaper-home__frosted-button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.74);
  outline-offset: 2px;
}

.wallpaper-frosted-button svg {
  width: 21px;
  height: 21px;
  stroke-width: 2.25;
}

.wallpaper-frosted-button--icon {
  flex: 0 0 42px;
}

.wallpaper-liquid-glass-root {
  position: relative;
  isolation: isolate;
  display: block;
  overflow: visible;
  border-radius: 999px;
  background: transparent;
}

.wallpaper-header-glass-root {
  display: inline-block;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  animation: wallpaperHeaderControlIn 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.wallpaper-header-glass-root--samasante:has(.wallpaper-header-glass-button:hover) {
  transform: translate3d(0, -1px, 0);
}

.wallpaper-header-glass-root--samasante:has(.wallpaper-header-glass-button:active) {
  transform: scale(0.97);
}

.wallpaper-liquid-glass-lens {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  overflow: visible;
  border-radius: inherit;
  background: transparent;
  pointer-events: none;
}

.wallpaper-liquid-glass-lens--samasante > div {
  display: none !important;
}

.wallpaper-liquid-glass-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
}

.wallpaper-liquid-glass-ybouane-surface {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  transition: opacity 100ms ease;
}

.wallpaper-liquid-glass-button {
  position: absolute;
  inset: 0;
  z-index: 4;
  width: 100%;
  height: 100%;
  overflow: visible;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.94);
  padding: 0;
  cursor: pointer;
  outline: none;
}

.wallpaper-liquid-glass-button::before {
  position: absolute;
  inset: 0;
  z-index: -2;
  border-radius: inherit;
  background:
    radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.14), transparent 38%),
    rgba(255, 255, 255, 0.018);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.46),
    inset 0 -4px 10px rgba(255, 255, 255, 0.025),
    0 6px 14px rgba(3, 8, 12, 0.12);
  content: '';
  opacity: 1;
  -webkit-backdrop-filter: blur(0.4px) saturate(1.08) contrast(1.02);
  backdrop-filter: blur(0.4px) saturate(1.08) contrast(1.02);
  transition: opacity 120ms ease;
}

.wallpaper-liquid-glass-root--samasante[data-wallpaper-glass-ready="true"]
  .wallpaper-liquid-glass-button::before,
.wallpaper-liquid-glass-root--ybouane[data-wallpaper-glass-ready="true"]
  .wallpaper-liquid-glass-button::before {
  opacity: 0;
}

.wallpaper-liquid-glass-root--ybouane[data-wallpaper-glass-ready="true"]
  .wallpaper-liquid-glass-ybouane-surface {
  opacity: 1;
}

.wallpaper-liquid-glass-root--ybouane[data-wallpaper-glass-ready="true"]
  .wallpaper-liquid-glass-backdrop {
  opacity: 0;
}

.wallpaper-liquid-glass-root--ybouane[data-wallpaper-glass-ready="true"]::after {
  position: absolute;
  inset: 0;
  z-index: 3;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.38);
  content: '';
  pointer-events: none;
}

.wallpaper-header-glass-button {
  display: grid;
  place-items: center;
}

.wallpaper-header-glass-button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.88);
  outline-offset: 3px;
}

.wallpaper-header-glass-icon {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
  filter: drop-shadow(0 1px 5px rgba(0, 0, 0, 0.28));
  pointer-events: none;
}

.wallpaper-header-glass-icon svg {
  width: 19px;
  height: 19px;
  stroke-width: 2.15;
}

.wallpaper-header-action-notice {
  position: absolute;
  top: 18px;
  right: 26px;
  z-index: 40;
  max-width: min(420px, calc(100% - 52px));
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.94);
  background: rgba(12, 18, 24, 0.74);
  box-shadow: 0 12px 32px rgba(2, 6, 10, 0.26);
  backdrop-filter: blur(18px) saturate(1.18);
  font-size: 13px;
  line-height: 1.45;
  animation: wallpaperHeaderControlIn 220ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.wallpaper-frosted-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transform-origin: center;
  transition: gap 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.wallpaper-frosted-primary[data-wallpaper-search-open="true"] {
  gap: 12px;
}

.wallpaper-frosted-search {
  display: inline-grid;
  width: 42px;
  height: 42px;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  overflow: hidden;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.92);
  transform-origin: left center;
  -webkit-backdrop-filter: blur(1.2px) saturate(1.02);
  backdrop-filter: blur(1.2px) saturate(1.02);
  transition:
    width 520ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.wallpaper-frosted-search[data-wallpaper-search-open="true"] {
  width: clamp(232px, 31vw, 392px);
  border-color: rgba(255, 255, 255, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.01)),
    rgba(255, 255, 255, 0.018);
}

.wallpaper-frosted-primary[data-wallpaper-search-open="true"] .wallpaper-frosted-search {
  width: clamp(250px, 30vw, 380px);
}

.wallpaper-frosted-search__button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
  cursor: pointer;
}

.wallpaper-frosted-search__button svg {
  width: 21px;
  height: 21px;
  stroke-width: 2.25;
}

.wallpaper-frosted-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.95);
  padding: 0 16px 0 2px;
  font-size: 14px;
  font-weight: 720;
  outline: none;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 180ms ease 90ms,
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateX(-8px);
}

.wallpaper-frosted-search[data-wallpaper-search-open="true"] input {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
}

.wallpaper-frosted-search input::placeholder {
  color: rgba(255, 255, 255, 0.56);
}

.wallpaper-frosted-header-center {
  grid-area: 1 / 1;
  min-width: 0;
  opacity: 1;
  transform: scaleX(1);
  transform-origin: center;
  transition:
    opacity 280ms ease 120ms,
    transform 560ms cubic-bezier(0.22, 1, 0.36, 1);
}

.wallpaper-frosted-navigation {
  position: relative;
  display: grid;
  width: 304px;
  height: 42px;
  flex: 0 0 auto;
  transition: width 620ms cubic-bezier(0.22, 1, 0.36, 1);
}

.wallpaper-frosted-navigation[data-wallpaper-search-open="true"] {
  width: 104px;
}

.wallpaper-frosted-navigation[data-wallpaper-search-open="true"] .wallpaper-frosted-header-center {
  opacity: 0;
  pointer-events: none;
  transform: scaleX(0.58);
  transition:
    opacity 180ms ease,
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

.wallpaper-frosted-menu-button {
  grid-area: 1 / 1;
  display: inline-flex;
  width: 100%;
  height: 42px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.94);
  padding: 0 18px;
  font-size: 14px;
  font-weight: 780;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transform: translate3d(-6px, 0, 0) scale(0.98);
  transition:
    opacity 240ms ease,
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease,
    transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
}

.wallpaper-frosted-navigation[data-wallpaper-search-open="true"] .wallpaper-frosted-menu-button {
  opacity: 1;
  pointer-events: auto;
  transform: translate3d(0, 0, 0) scale(1);
  transition:
    opacity 260ms ease 130ms,
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease,
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1) 100ms;
}

.wallpaper-frosted-menu-button:hover {
  border-color: rgba(255, 255, 255, 0.24);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.025)),
    rgba(255, 255, 255, 0.04);
  color: #fff;
}

.wallpaper-frosted-menu-button:active {
  transform: scale(0.985);
}

.wallpaper-frosted-menu-button > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallpaper-frosted-segment {
  position: relative;
  display: grid;
  width: 100%;
  height: 42px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  overflow: hidden;
  border-radius: 999px;
  padding: 4px;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.wallpaper-frosted-segment__indicator {
  position: absolute;
  left: 4px;
  top: 4px;
  z-index: 0;
  width: calc((100% - 8px) / 3);
  height: calc(100% - 8px);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.02)),
    rgba(255, 255, 255, 0.035);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 4px 10px rgba(0, 0, 0, 0.04);
  pointer-events: none;
  transition: transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.wallpaper-frosted-segment[data-wallpaper-view="home"] .wallpaper-frosted-segment__indicator {
  transform: translateX(0);
}

.wallpaper-frosted-segment[data-wallpaper-view="explore"] .wallpaper-frosted-segment__indicator {
  transform: translateX(100%);
}

.wallpaper-frosted-segment[data-wallpaper-view="settings"] .wallpaper-frosted-segment__indicator {
  transform: translateX(200%);
}

.wallpaper-frosted-segment__button {
  position: relative;
  z-index: 1;
  min-width: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  padding: 0 16px;
  font-size: 14px;
  font-weight: 760;
  cursor: pointer;
  transition:
    background 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease;
}

.wallpaper-frosted-segment__button:hover {
  color: rgba(255, 255, 255, 0.94);
}

.wallpaper-frosted-segment__button[aria-pressed="true"] {
  background: transparent;
  color: #fff;
  box-shadow: none;
}

.wallpaper-frosted-segment__button > span {
  position: relative;
  z-index: 1;
}

.wallpaper-ux {
  --wallpaper-display: Georgia, "Times New Roman", serif;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 620px;
  overflow: hidden;
  color: #fff;
  background: rgba(7, 9, 12, 0.72);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.wallpaper-ux::before,
.wallpaper-ux::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.wallpaper-ux::before {
  z-index: 0;
  background-image: var(--wallpaper-desktop-bg);
  background-size: cover;
  background-position: center;
  filter: blur(34px) saturate(1.08) brightness(0.74);
  opacity: 0.92;
  transform: scale(1.08);
  transition: opacity 260ms ease, filter 260ms ease;
}

.wallpaper-ux::after {
  z-index: 0;
  background:
    radial-gradient(circle at 24% 20%, rgba(210, 224, 232, 0.18), rgba(210, 224, 232, 0) 34%),
    radial-gradient(circle at 79% 28%, rgba(183, 173, 150, 0.23), rgba(183, 173, 150, 0) 36%),
    linear-gradient(115deg, rgba(24, 30, 35, 0.58), rgba(21, 29, 25, 0.64));
  transition: background 260ms ease, opacity 260ms ease;
}

.wallpaper-ux--home::before,
.wallpaper-ux--home::after,
.wallpaper-ux--preview::before,
.wallpaper-ux--preview::after {
  opacity: 0;
}

.wallpaper-ux--settings::after {
  background:
    radial-gradient(circle at 76% 18%, rgba(112, 196, 218, 0.26), rgba(112, 196, 218, 0) 38%),
    radial-gradient(circle at 18% 68%, rgba(194, 69, 104, 0.28), rgba(194, 69, 104, 0) 46%),
    radial-gradient(circle at 50% 28%, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0) 31%),
    linear-gradient(112deg, rgba(18, 42, 48, 0.62), rgba(24, 27, 30, 0.68), rgba(80, 24, 42, 0.48));
}

.wallpaper-ux--settings::before {
  filter: blur(42px) saturate(1.22) brightness(0.66);
  opacity: 0.98;
}

.wallpaper-ux[data-wallpaper-glass-depth="soft"]:not(.wallpaper-ux--home)::before {
  filter: blur(32px) saturate(1.04) brightness(0.70);
  opacity: 0.80;
}

.wallpaper-ux[data-wallpaper-glass-depth="soft"]:not(.wallpaper-ux--home)::after {
  opacity: 0.82;
}

.wallpaper-ux button {
  font: inherit;
}

.wallpaper-icon {
  width: 17px;
  height: 17px;
  stroke-width: 2.4;
}

.wallpaper-icon--fill {
  fill: currentColor;
}

.wallpaper-home {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: transparent;
  scrollbar-width: none;
}

.wallpaper-home::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.wallpaper-home::-webkit-scrollbar-track {
  background: transparent;
}

.wallpaper-home::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.24);
}

.wallpaper-home:focus {
  outline: none;
}

.wallpaper-home__hero {
  position: relative;
  height: clamp(520px, 68vh, 690px);
  min-height: 520px;
  overflow: hidden;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
}

.wallpaper-home__hero[data-wallpaper-hero-dragging="true"] {
  cursor: grabbing;
}

.wallpaper-home__track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 560ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.wallpaper-home__hero[data-wallpaper-hero-dragging="true"] .wallpaper-home__track {
  transition: none;
}

.wallpaper-home__slide {
  position: relative;
  min-width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
}

.wallpaper-home__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  transform: scale(1.01);
  user-select: none;
}

.wallpaper-ux[data-wallpaper-preview-fit="fit"] .wallpaper-home__image {
  object-fit: contain;
  background: #05070a;
}

.wallpaper-home__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.06) 48%, rgba(0, 0, 0, 0.26) 100%),
    linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.08) 48%, rgba(12, 8, 11, 0.34) 84%, rgba(13, 9, 12, 0.48) 100%);
}

.wallpaper-home__content {
  position: absolute;
  left: clamp(52px, 6vw, 92px);
  bottom: clamp(168px, 24vh, 224px);
  z-index: 3;
  width: min(520px, 56vw);
  text-shadow: 0 3px 18px rgba(0, 0, 0, 0.65);
}

.wallpaper-home__category {
  display: block;
  margin-bottom: 5px;
  color: rgba(255, 255, 255, 0.66);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.wallpaper-home h1 {
  margin: 0;
  color: #fff;
  font-family: var(--wallpaper-display);
  font-size: clamp(29px, 3vw, 43px);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: 0;
}

.wallpaper-home__meta {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
  font-weight: 700;
}

.wallpaper-home__badge {
  display: inline-flex;
  height: 14px;
  align-items: center;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.25);
  padding: 0 4px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 8px;
  font-weight: 900;
}

.wallpaper-home__actions {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 16px;
}

.wallpaper-home__liquid-action {
  position: relative;
  display: block;
  height: 42px;
  overflow: visible;
  flex: 0 0 auto;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.wallpaper-home__liquid-action--preview {
  width: 190px;
}

.wallpaper-home__liquid-action--like {
  width: 80px;
}

.wallpaper-home__liquid-button {
  display: inline-flex;
  width: 100%;
  height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.94);
  padding: 0 18px;
  font-size: 15px;
  font-weight: 800;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.18);
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 180ms ease,
    filter 180ms ease;
}

.wallpaper-home__liquid-action:has(.wallpaper-home__liquid-button:hover) {
  transform: translate3d(0, -1px, 0);
}

.wallpaper-home__liquid-action:has(.wallpaper-home__liquid-button:active) {
  transform: scale(0.985);
}

.wallpaper-home__liquid-button:hover {
  color: #fff;
  filter: brightness(1.05);
}

.wallpaper-home__liquid-button--like {
  padding: 0 15px;
}

.wallpaper-home__liquid-button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.82);
  outline-offset: 3px;
}

.wallpaper-home__liquid-button > svg,
.wallpaper-home__liquid-button > span {
  position: relative;
  z-index: 2;
}

.wallpaper-home__liquid-content {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
}

.wallpaper-home__arrow {
  position: absolute;
  top: 50%;
  z-index: 4;
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.17);
  border-radius: 999px;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.035)),
    rgba(7, 12, 17, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 10px 24px rgba(0, 0, 0, 0.16);
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
  transform: translateY(-50%);
  backdrop-filter: blur(12px) saturate(1.14);
  transition:
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease,
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.wallpaper-home__arrow:hover {
  border-color: rgba(255, 255, 255, 0.28);
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.05)),
    rgba(7, 12, 17, 0.16);
  color: #fff;
  transform: translateY(-50%) scale(1.04);
}

.wallpaper-home__arrow:active {
  transform: translateY(-50%) scale(0.96);
}

.wallpaper-home__arrow:focus-visible,
.wallpaper-home__pagination button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.82);
  outline-offset: 3px;
}

.wallpaper-home__arrow svg {
  width: 24px;
  height: 24px;
  stroke-width: 2.5;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.34));
}

.wallpaper-home__arrow--prev {
  left: 18px;
}

.wallpaper-home__arrow--next {
  right: 18px;
}

.wallpaper-home__pagination {
  position: absolute;
  left: 50%;
  bottom: clamp(30px, 5vh, 56px);
  z-index: 4;
  display: flex;
  transform: translateX(-50%);
  gap: 8px;
}

.wallpaper-home__pagination button {
  position: relative;
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.wallpaper-home__pagination button::before {
  width: 6px;
  height: 6px;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.38);
  content: "";
  transition:
    background 180ms ease,
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1),
    width 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.wallpaper-home__pagination button:hover::before {
  background: rgba(255, 255, 255, 0.68);
  transform: scale(1.22);
}

.wallpaper-home__pagination button.is-active::before {
  width: 15px;
  background: rgba(255, 255, 255, 0.96);
}

.wallpaper-preview {
  position: relative;
  z-index: 1;
  height: 100%;
  min-height: 620px;
  overflow: hidden;
  background: #07090b;
  animation: wallpaperPreviewShellIn 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.wallpaper-preview__image,
.wallpaper-preview__placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.01);
  user-select: none;
  animation: wallpaperPreviewImageIn 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
  will-change: filter, opacity, transform;
}

.wallpaper-preview__placeholder {
  display: block;
  background:
    radial-gradient(circle at 56% 45%, rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0) 18%),
    #ff696e;
}

.wallpaper-preview__shade {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 46%, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 28%),
    linear-gradient(180deg, rgba(7, 9, 12, 0.28) 0%, rgba(7, 9, 12, 0.18) 42%, rgba(7, 9, 12, 0.72) 100%),
    linear-gradient(90deg, rgba(7, 9, 12, 0.34), rgba(7, 9, 12, 0.03) 44%, rgba(7, 9, 12, 0.32));
  animation: wallpaperPreviewShadeIn 620ms ease both;
}

.wallpaper-preview__content {
  position: absolute;
  left: 50%;
  bottom: clamp(66px, 11vh, 112px);
  z-index: 3;
  width: min(760px, calc(100% - 72px));
  transform: translateX(-50%);
  color: #fff;
  text-align: center;
  text-shadow: 0 3px 18px rgba(0, 0, 0, 0.62);
  animation: wallpaperPreviewContentIn 640ms 90ms cubic-bezier(0.16, 1, 0.3, 1) both;
  will-change: opacity, transform;
}

.wallpaper-preview__content h1 {
  margin: 0;
  font-family: var(--wallpaper-display);
  font-size: clamp(46px, 5.4vw, 76px);
  font-weight: 700;
  line-height: 0.98;
  letter-spacing: 0;
}

.wallpaper-preview__content p {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.74);
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.wallpaper-preview__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 9px;
  margin-top: 24px;
}

.wallpaper-preview__meta span {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 5px;
  background: rgba(18, 22, 26, 0.58);
  color: rgba(255, 255, 255, 0.86);
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
}

.wallpaper-preview__actions {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  margin-top: 34px;
}

.wallpaper-preview__actions::before,
.wallpaper-preview__actions::after {
  content: "";
  display: block;
  width: min(220px, 24vw);
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.25));
}

.wallpaper-preview__actions::after {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0));
}

.wallpaper-preview__icon-button,
.wallpaper-preview__apply-button {
  display: inline-flex;
  height: 48px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(14, 18, 22, 0.50);
  color: rgba(255, 255, 255, 0.94);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 16px 34px rgba(0, 0, 0, 0.30);
  backdrop-filter: blur(20px) saturate(1.24);
  cursor: pointer;
}

.wallpaper-preview__icon-button {
  width: 48px;
  flex: 0 0 48px;
  padding: 0;
}

.wallpaper-preview__icon-button svg,
.wallpaper-preview__apply-button svg {
  width: 19px;
  height: 19px;
  stroke-width: 2.35;
}

.wallpaper-preview__apply-button {
  gap: 10px;
  min-width: 230px;
  padding: 0 22px;
  font-size: 15px;
  font-weight: 900;
  white-space: nowrap;
}

.wallpaper-recommendations {
  position: relative;
  z-index: 3;
  min-height: 920px;
  padding: 34px clamp(48px, 5.8vw, 86px) 124px;
  background:
    radial-gradient(circle at 22% 8%, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, rgba(20, 10, 13, 0.91), rgba(9, 7, 8, 0.99));
  box-shadow: 0 -42px 76px rgba(10, 5, 7, 0.50);
}

.wallpaper-recommendation-row + .wallpaper-recommendation-row {
  margin-top: 38px;
}

.wallpaper-recommendations__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 0 18px;
}

.wallpaper-recommendations h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-family: var(--wallpaper-display);
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
}

.wallpaper-recommendations h2 svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.5);
}

.wallpaper-rail-controls {
  display: none;
  gap: 8px;
}

.wallpaper-rail-controls button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  backdrop-filter: blur(14px);
}

.wallpaper-carousel {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
  overflow: visible;
  padding-bottom: 0;
}

.wallpaper-carousel-card {
  position: relative;
  min-width: 0;
  height: 152px;
  overflow: hidden;
  border: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  padding: 0;
  color: #fff;
  text-align: left;
  cursor: pointer;
  transition:
    transform 240ms ease,
    box-shadow 240ms ease,
    outline-color 240ms ease;
}

.wallpaper-carousel-card:hover,
.wallpaper-carousel-card.is-selected {
  transform: translateY(-4px);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28);
}

.wallpaper-carousel-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wallpaper-card-glass-label {
  position: absolute;
  bottom: 14px;
  left: 50%;
  min-width: 154px;
  max-width: calc(100% - 36px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.012)),
    rgba(255, 255, 255, 0.025);
  padding: 11px 20px;
  color: rgba(255, 255, 255, 0.94);
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
  text-align: center;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -1px 0 rgba(255, 255, 255, 0.03),
    0 6px 14px rgba(0, 0, 0, 0.05);
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  opacity: 0;
  transform: translate(-50%, 8px) scale(0.98);
  transition:
    opacity 210ms ease,
    transform 210ms ease;
}

.wallpaper-carousel-card:hover .wallpaper-card-glass-label,
.wallpaper-carousel-card:focus-visible .wallpaper-card-glass-label {
  -webkit-backdrop-filter: blur(2px) saturate(1.02);
  backdrop-filter: blur(2px) saturate(1.02);
  opacity: 1;
  transform: translate(-50%, 0) scale(1);
}

.wallpaper-page {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow: auto;
  scrollbar-width: none;
}

.wallpaper-page::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.wallpaper-page--explore {
  padding: 126px clamp(46px, 5.5vw, 76px) 130px;
}

.wallpaper-page--settings {
  padding: 104px clamp(52px, 5vw, 72px) 90px;
  background:
    radial-gradient(circle at 48% 10%, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 32%),
    linear-gradient(112deg, rgba(20, 64, 72, 0.18), rgba(16, 21, 24, 0.18), rgba(92, 28, 48, 0.16));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 120px rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px) saturate(1.28);
}

.wallpaper-page__intro p {
  margin: 0 0 13px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 16px;
  font-weight: 600;
}

.wallpaper-page__intro h1,
.wallpaper-settings-heading h1 {
  margin: 0;
  color: #fff;
  font-family: var(--wallpaper-display);
  font-size: clamp(42px, 4.2vw, 62px);
  font-weight: 700;
  line-height: 0.98;
  letter-spacing: 0;
}

.wallpaper-page--explore .wallpaper-page__intro h1 {
  font-size: clamp(34px, 3.4vw, 50px);
  text-wrap: balance;
}

.wallpaper-page__intro > span {
  display: block;
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 16px;
  font-weight: 520;
}

.wallpaper-search {
  display: flex;
  width: min(448px, 100%);
  height: 40px;
  align-items: center;
  gap: 11px;
  margin-top: 28px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(17, 19, 22, 0.36);
  padding: 0 18px;
  color: rgba(255, 255, 255, 0.56);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
}

.wallpaper-search svg {
  width: 17px;
  height: 17px;
}

.wallpaper-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #fff;
  font-size: 15px;
  font-weight: 520;
}

.wallpaper-search input::placeholder {
  color: rgba(255, 255, 255, 0.54);
}

.wallpaper-popular {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  margin-top: 22px;
}

.wallpaper-popular > span {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-weight: 600;
}

.wallpaper-popular button,
.wallpaper-categories button {
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.wallpaper-popular button {
  height: 30px;
  padding: 0 13px;
}

.wallpaper-popular button.is-selected {
  background: rgba(255, 255, 255, 0.20);
  color: rgba(255, 255, 255, 0.95);
}

.wallpaper-categories {
  display: flex;
  max-width: 980px;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 30px;
}

.wallpaper-categories button {
  display: flex;
  height: 34px;
  align-items: center;
  gap: 6px;
  padding: 0 12px 0 4px;
  background: rgba(255, 255, 255, 0.12);
}

.wallpaper-categories button.is-active {
  background: rgba(255, 255, 255, 0.98);
  color: #171717;
}

.wallpaper-categories img,
.wallpaper-categories i {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  object-fit: cover;
}

.wallpaper-categories i {
  background: linear-gradient(135deg, #dfe7ec, #506673);
}

.wallpaper-results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 26px;
}

.wallpaper-results-bar strong {
  color: rgba(255, 255, 255, 0.55);
  font-size: 15px;
  font-weight: 620;
}

.wallpaper-results-bar button {
  display: flex;
  height: 34px;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.13);
  color: rgba(255, 255, 255, 0.75);
  padding: 0 13px;
  font-size: 14px;
  font-weight: 620;
  cursor: pointer;
}

.wallpaper-results-bar svg {
  width: 16px;
  height: 16px;
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 14px;
}

.wallpaper-explore-card {
  position: relative;
  display: grid;
  height: clamp(248px, 21vw, 330px);
  min-height: 0;
  grid-template-rows: minmax(0, 1fr) 78px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 16px;
  background: rgba(12, 14, 13, 0.4);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.16);
  cursor: pointer;
  transition:
    border-color 220ms ease,
    box-shadow 260ms ease,
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.wallpaper-explore-card::before {
  position: absolute;
  top: 0;
  bottom: 78px;
  left: -46%;
  z-index: 1;
  width: 42%;
  background: linear-gradient(
    105deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.18),
    rgba(255, 255, 255, 0)
  );
  content: "";
  opacity: 0;
  pointer-events: none;
  transform: translateX(-120%) skewX(-14deg);
  transition:
    opacity 260ms ease,
    transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
}

.wallpaper-explore-card.is-selected {
  border-color: rgba(255, 255, 255, 0.34);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.10);
}

.wallpaper-explore-card:hover,
.wallpaper-explore-card:focus-visible {
  border-color: rgba(255, 255, 255, 0.24);
  box-shadow: 0 22px 38px rgba(0, 0, 0, 0.22);
  transform: translateY(-3px);
}

.wallpaper-explore-card:hover::before,
.wallpaper-explore-card:focus-visible::before {
  opacity: 1;
  transform: translateX(360%) skewX(-14deg);
}

.wallpaper-explore-card > img,
.wallpaper-explore-placeholder {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  transition:
    filter 420ms ease,
    transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
}

.wallpaper-explore-card:hover > img,
.wallpaper-explore-card:focus-visible > img,
.wallpaper-explore-card:hover .wallpaper-explore-placeholder,
.wallpaper-explore-card:focus-visible .wallpaper-explore-placeholder {
  filter: saturate(1.12) contrast(1.04) brightness(1.06);
  transform: scale(1.055);
  will-change: filter, transform;
}

.wallpaper-explore-placeholder {
  display: block;
  background:
    radial-gradient(circle at 56% 45%, rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0) 18%),
    #ff696e;
}

.wallpaper-explore-card__view {
  position: absolute;
  left: 50%;
  bottom: 94px;
  z-index: 2;
  min-width: 132px;
  max-width: calc(100% - 34px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.012)),
    rgba(255, 255, 255, 0.025);
  color: rgba(255, 255, 255, 0.94);
  padding: 10px 18px;
  font-size: 12px;
  font-weight: 660;
  line-height: 1;
  text-align: center;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -1px 0 rgba(255, 255, 255, 0.03),
    0 6px 14px rgba(0, 0, 0, 0.05);
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  opacity: 0;
  transform: translate(-50%, 8px) scale(0.98);
  transition:
    opacity 210ms ease,
    transform 210ms ease;
}

.wallpaper-explore-card:hover .wallpaper-explore-card__view,
.wallpaper-explore-card:focus-visible .wallpaper-explore-card__view {
  -webkit-backdrop-filter: blur(2px) saturate(1.02);
  backdrop-filter: blur(2px) saturate(1.02);
  opacity: 1;
  transform: translate(-50%, 0) scale(1);
}

.wallpaper-explore-card__info {
  position: relative;
  display: flex;
  height: 78px;
  min-height: 0;
  flex-direction: column;
  justify-content: space-between;
  background: rgba(18, 23, 19, 0.86);
  padding: 13px 16px 12px;
}

.wallpaper-explore-card__info h2 {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  font-family: var(--wallpaper-display);
  font-size: 17px;
  font-weight: 650;
  line-height: 1.08;
}

.wallpaper-explore-card__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  font-weight: 600;
}

.wallpaper-tag {
  flex: 0 0 auto;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  padding: 3px 9px;
  color: rgba(255, 255, 255, 0.58);
  font-style: normal;
}

.wallpaper-like-button {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  color: #ff4f70;
  padding: 0;
  font-weight: 680;
  cursor: pointer;
  transition:
    color 180ms ease,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.wallpaper-like-button:hover {
  color: #ff7892;
  transform: translateY(-1px);
}

.wallpaper-like-button svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.wallpaper-empty-state {
  grid-column: 1 / -1;
  min-height: 180px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.68);
  font-weight: 800;
  backdrop-filter: blur(18px);
}

.wallpaper-settings-heading p {
  margin: 0 0 12px;
  color: rgba(216, 243, 240, 0.72);
  font-size: 13px;
  font-weight: 760;
  letter-spacing: 0.08em;
}

.wallpaper-settings-heading h1 {
  max-width: 760px;
  font-size: clamp(40px, 3.8vw, 58px);
  line-height: 0.96;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.wallpaper-settings-heading > span {
  display: block;
  max-width: 600px;
  margin-top: 14px;
  color: rgba(255, 255, 255, 0.56);
  font-size: 14px;
  font-weight: 520;
  line-height: 1.55;
  text-wrap: pretty;
}

.wallpaper-settings-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.32fr) minmax(290px, 0.68fr);
  align-items: stretch;
  gap: 22px;
  margin-top: 30px;
}

.wallpaper-settings-card,
.wallpaper-settings-current {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 24px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.105), rgba(255, 255, 255, 0.035)),
    rgba(10, 17, 22, 0.20);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 28px 62px rgba(3, 8, 12, 0.19);
  backdrop-filter: blur(24px) saturate(1.18);
}

.wallpaper-settings-card {
  min-height: 358px;
  padding: 12px;
}

.wallpaper-settings-card__heading {
  display: flex;
  min-height: 62px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 7px 12px 12px;
}

.wallpaper-settings-card__heading > div {
  display: grid;
  gap: 3px;
}

.wallpaper-settings-card__heading > div > span {
  color: #fff;
  font-size: 14px;
  font-weight: 720;
}

.wallpaper-settings-card__heading > div > strong {
  color: rgba(255, 255, 255, 0.42);
  font-size: 11px;
  font-weight: 560;
}

.wallpaper-settings-card__status {
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.055);
  color: rgba(255, 255, 255, 0.56);
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 680;
}

.wallpaper-settings-row {
  display: grid;
  width: 100%;
  min-height: 70px;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 13px;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.075);
  background: transparent;
  color: #fff;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  transition: background 180ms ease, transform 180ms ease;
}

.wallpaper-settings-row:hover {
  background: rgba(255, 255, 255, 0.055);
}

.wallpaper-settings-row:active {
  transform: scale(0.993);
}

.wallpaper-settings-row:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid rgba(211, 248, 242, 0.74);
  outline-offset: -2px;
  border-radius: 14px;
}

.wallpaper-settings-row__icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.065);
  color: rgba(255, 255, 255, 0.66);
  transition: background 180ms ease, color 180ms ease;
}

.wallpaper-settings-row[aria-pressed="true"] .wallpaper-settings-row__icon {
  background: rgba(171, 226, 216, 0.14);
  color: rgba(220, 255, 249, 0.92);
}

.wallpaper-settings-row__icon svg {
  width: 18px;
  height: 18px;
  stroke-width: 2.15;
}

.wallpaper-settings-row__copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.wallpaper-settings-row__copy strong {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.88);
  font-size: 12.5px;
  font-weight: 690;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallpaper-settings-row__copy small {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.42);
  font-size: 10.5px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallpaper-settings-row__state {
  min-width: 58px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.055);
  color: rgba(255, 255, 255, 0.62);
  padding: 7px 10px;
  font-size: 10px;
  font-weight: 720;
  text-align: center;
  transition: background 180ms ease, color 180ms ease;
}

.wallpaper-settings-row[aria-pressed="true"] .wallpaper-settings-row__state {
  border-color: rgba(186, 236, 226, 0.18);
  background: rgba(171, 226, 216, 0.12);
  color: rgba(225, 255, 249, 0.88);
}

.wallpaper-settings-current {
  display: grid;
  min-height: 358px;
  grid-template-rows: minmax(168px, 1.2fr) minmax(150px, 0.8fr);
}

.wallpaper-settings-current__media {
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.wallpaper-settings-current__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.015);
}

.wallpaper-settings-current__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(5, 9, 12, 0.05), rgba(5, 9, 12, 0.44)),
    radial-gradient(circle at 20% 10%, rgba(255, 255, 255, 0.14), transparent 42%);
}

.wallpaper-settings-current__badge {
  position: absolute;
  left: 14px;
  top: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: rgba(8, 14, 18, 0.24);
  color: rgba(255, 255, 255, 0.78);
  padding: 6px 9px;
  font-size: 9px;
  font-weight: 690;
  backdrop-filter: blur(12px) saturate(1.12);
}

.wallpaper-settings-current__content {
  min-width: 0;
  padding: 18px 20px 20px;
}

.wallpaper-settings-current__content > span {
  color: rgba(204, 242, 235, 0.58);
  font-size: 9px;
  font-weight: 760;
  letter-spacing: 0.09em;
}

.wallpaper-settings-current__content h2 {
  overflow: hidden;
  margin: 5px 0 0;
  color: #fff;
  font-family: var(--wallpaper-display);
  font-size: clamp(23px, 2.2vw, 31px);
  line-height: 1.05;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallpaper-settings-current__content p {
  overflow: hidden;
  margin: 7px 0 0;
  color: rgba(255, 255, 255, 0.46);
  font-size: 10.5px;
  font-weight: 520;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallpaper-settings-current__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 14px;
}

.wallpaper-settings-current__chips span {
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.045);
  color: rgba(255, 255, 255, 0.56);
  padding: 6px 8px;
  font-size: 9px;
  font-weight: 650;
}

@keyframes wallpaperHeaderControlIn {
  from {
    opacity: 0;
    transform: translate3d(0, -8px, 0) scale(0.94);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes wallpaperPreviewShellIn {
  from {
    opacity: 0.72;
  }

  to {
    opacity: 1;
  }
}

@keyframes wallpaperPreviewImageIn {
  from {
    filter: blur(10px) saturate(0.9) brightness(0.78);
    opacity: 0.62;
    transform: scale(1.075);
  }

  to {
    filter: blur(0) saturate(1) brightness(1);
    opacity: 1;
    transform: scale(1.01);
  }
}

@keyframes wallpaperPreviewShadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes wallpaperPreviewContentIn {
  from {
    opacity: 0;
    transform: translate3d(-50%, 24px, 0) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translate3d(-50%, 0, 0) scale(1);
  }
}

@media (max-width: 1080px) {
  .wallpaper-page--explore,
  .wallpaper-page--settings {
    padding-left: 34px;
    padding-right: 34px;
  }

  .wallpaper-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wallpaper-carousel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wallpaper-settings-layout {
    grid-template-columns: 1fr;
  }

  .wallpaper-settings-current {
    min-height: 260px;
    grid-template-columns: minmax(240px, 0.85fr) minmax(0, 1.15fr);
    grid-template-rows: 1fr;
  }
}

@media (max-width: 760px) {
  section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header [data-app-header-region="leading"],
  section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header [data-app-header-region="trailing"] {
    display: none;
  }

  section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header[data-app-header-preset="browser"] [data-app-header-region="leading"],
  section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header[data-app-header-preset="browser"] [data-app-header-region="trailing"] {
    display: flex;
  }

  section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header > [data-app-header-row="primary"] {
    justify-content: center;
    padding: 0 12px 0 80px;
  }

  section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header[data-app-header-preset="browser"] [data-app-header-region="leading"] {
    left: 78px;
  }

  section[data-app-id="wallpaper"] > [data-kernelon-app-frame] > header[data-app-header-preset="browser"] [data-app-header-region="trailing"] {
    display: none;
  }

  .wallpaper-home__hero {
    height: 560px;
  }

  .wallpaper-home__content {
    bottom: 162px;
    width: calc(100% - 96px);
  }

  .wallpaper-home__pagination {
    bottom: 46px;
  }

  .wallpaper-recommendations {
    padding-left: 28px;
    padding-right: 28px;
  }

  .wallpaper-carousel {
    grid-template-columns: 1fr;
  }

  .wallpaper-grid {
    grid-template-columns: 1fr;
  }

  .wallpaper-page--settings {
    padding-top: 96px;
  }

  .wallpaper-settings-heading h1 {
    font-size: clamp(36px, 10vw, 48px);
  }

  .wallpaper-settings-card__status,
  .wallpaper-settings-row__copy small {
    display: none;
  }

  .wallpaper-settings-current {
    min-height: 358px;
    grid-template-columns: 1fr;
    grid-template-rows: minmax(180px, 1.15fr) minmax(150px, 0.85fr);
  }
}
`;
