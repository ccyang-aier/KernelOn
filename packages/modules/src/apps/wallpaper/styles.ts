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

.wallpaper-frosted-surface {
  --wallpaper-frosted-border: rgba(218, 238, 255, 0.3);
  --wallpaper-frosted-fill-top: rgba(255, 255, 255, 0.075);
  --wallpaper-frosted-fill-bottom: rgba(255, 255, 255, 0.012);
  --wallpaper-frosted-base: rgba(255, 255, 255, 0.025);
  --wallpaper-frosted-inset-top: rgba(255, 255, 255, 0.28);
  --wallpaper-frosted-inset-bottom: rgba(255, 255, 255, 0.03);
  --wallpaper-frosted-shadow: 0 6px 14px rgba(0, 0, 0, 0.05);
  --wallpaper-frosted-backdrop: blur(2px) saturate(1.02);
  position: relative;
  isolation: isolate;
  border: 1px solid var(--wallpaper-frosted-border);
  background:
    linear-gradient(180deg, var(--wallpaper-frosted-fill-top), var(--wallpaper-frosted-fill-bottom)),
    var(--wallpaper-frosted-base);
  box-shadow:
    inset 0 1px 0 var(--wallpaper-frosted-inset-top),
    inset 0 -1px 0 var(--wallpaper-frosted-inset-bottom),
    var(--wallpaper-frosted-shadow);
  -webkit-backdrop-filter: var(--wallpaper-frosted-backdrop);
  backdrop-filter: var(--wallpaper-frosted-backdrop);
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

.wallpaper-frosted-button:hover,
.wallpaper-frosted-menu-button:hover,
.wallpaper-home__frosted-button:hover {
  --wallpaper-frosted-border: rgba(231, 246, 255, 0.42);
  --wallpaper-frosted-fill-top: rgba(255, 255, 255, 0.11);
  --wallpaper-frosted-fill-bottom: rgba(255, 255, 255, 0.025);
  --wallpaper-frosted-base: rgba(255, 255, 255, 0.04);
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

.wallpaper-frosted-button--action::before,
.wallpaper-home__frosted-button::before {
  position: absolute;
  inset: 1px 1px auto;
  z-index: -1;
  height: 42%;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  content: '';
  pointer-events: none;
}

.wallpaper-frosted-button--action > svg {
  position: relative;
  z-index: 2;
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
  --wallpaper-frosted-border: rgba(218, 238, 255, 0.34);
  --wallpaper-frosted-fill-top: rgba(255, 255, 255, 0.06);
  --wallpaper-frosted-fill-bottom: rgba(255, 255, 255, 0.01);
  --wallpaper-frosted-base: rgba(255, 255, 255, 0.018);
  width: clamp(232px, 31vw, 392px);
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

.wallpaper-ux--explore {
  background: rgba(7, 14, 18, 0.18);
}

.wallpaper-ux--settings {
  background: rgba(7, 14, 18, 0.18);
}

.wallpaper-ux--explore::before,
.wallpaper-ux--settings::before {
  filter: blur(22px) saturate(1.28) brightness(0.94);
  opacity: 1;
  transform: scale(1.055);
}

.wallpaper-ux--explore::after,
.wallpaper-ux--settings::after {
  background:
    radial-gradient(circle at 18% 8%, rgba(230, 250, 255, 0.18), rgba(230, 250, 255, 0) 34%),
    radial-gradient(circle at 84% 78%, rgba(177, 219, 232, 0.12), rgba(177, 219, 232, 0) 42%),
    linear-gradient(118deg, rgba(14, 28, 34, 0.08), rgba(15, 30, 35, 0.14));
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

.wallpaper-home__frosted-action {
  position: relative;
  display: block;
  height: 42px;
  overflow: visible;
  flex: 0 0 auto;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.wallpaper-home__frosted-action--preview {
  width: 190px;
}

.wallpaper-home__frosted-action--like {
  width: 80px;
}

.wallpaper-home__frosted-button {
  display: inline-flex;
  width: 100%;
  height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: visible;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.94);
  padding: 0 18px;
  font-size: 15px;
  font-weight: 800;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.18);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease,
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.wallpaper-home__frosted-button:active {
  transform: scale(0.985);
}

.wallpaper-home__frosted-button--like {
  padding: 0 15px;
}

.wallpaper-home__frosted-button > svg,
.wallpaper-home__frosted-button > span {
  position: relative;
  z-index: 2;
}

.wallpaper-home__frosted-content {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
}

.wallpaper-home__arrow {
  --wallpaper-frosted-border: rgba(218, 238, 255, 0.32);
  --wallpaper-frosted-fill-top: rgba(255, 255, 255, 0.13);
  --wallpaper-frosted-fill-bottom: rgba(255, 255, 255, 0.035);
  --wallpaper-frosted-base: rgba(7, 12, 17, 0.18);
  --wallpaper-frosted-inset-top: rgba(255, 255, 255, 0.18);
  --wallpaper-frosted-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
  --wallpaper-frosted-backdrop: blur(12px) saturate(1.14);
  position: absolute;
  top: 50%;
  z-index: 4;
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
  transform: translateY(-50%);
  transition:
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease,
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.wallpaper-home__arrow:hover {
  --wallpaper-frosted-border: rgba(231, 246, 255, 0.46);
  --wallpaper-frosted-fill-top: rgba(255, 255, 255, 0.18);
  --wallpaper-frosted-fill-bottom: rgba(255, 255, 255, 0.05);
  --wallpaper-frosted-base: rgba(7, 12, 17, 0.16);
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
  --wallpaper-frosted-backdrop: none;
  position: absolute;
  bottom: 14px;
  left: 50%;
  min-width: 154px;
  max-width: calc(100% - 36px);
  border-radius: 999px;
  padding: 11px 20px;
  color: rgba(255, 255, 255, 0.94);
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
  text-align: center;
  opacity: 0;
  transform: translate(-50%, 8px) scale(0.98);
  transition:
    opacity 210ms ease,
    transform 210ms ease;
}

.wallpaper-carousel-card:hover .wallpaper-card-glass-label,
.wallpaper-carousel-card:focus-visible .wallpaper-card-glass-label {
  --wallpaper-frosted-backdrop: blur(2px) saturate(1.02);
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
  background:
    radial-gradient(circle at 16% 5%, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 31%),
    radial-gradient(circle at 82% 82%, rgba(191, 232, 244, 0.13), rgba(191, 232, 244, 0) 43%),
    linear-gradient(122deg, rgba(240, 251, 255, 0.14), rgba(220, 244, 250, 0.055) 46%, rgba(177, 225, 239, 0.11)),
    rgba(13, 29, 35, 0.23);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 140px rgba(218, 244, 250, 0.08);
  -webkit-backdrop-filter: blur(38px) saturate(1.32) brightness(1.08);
  backdrop-filter: blur(38px) saturate(1.32) brightness(1.08);
}

.wallpaper-page--settings {
  padding: 104px clamp(52px, 5vw, 72px) 90px;
  background:
    radial-gradient(circle at 16% 5%, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 31%),
    radial-gradient(circle at 82% 82%, rgba(191, 232, 244, 0.13), rgba(191, 232, 244, 0) 43%),
    linear-gradient(122deg, rgba(240, 251, 255, 0.14), rgba(220, 244, 250, 0.055) 46%, rgba(177, 225, 239, 0.11)),
    rgba(13, 29, 35, 0.23);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 140px rgba(218, 244, 250, 0.08);
  -webkit-backdrop-filter: blur(38px) saturate(1.32) brightness(1.08);
  backdrop-filter: blur(38px) saturate(1.32) brightness(1.08);
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
  font-weight: 500;
  text-wrap: balance;
}

.wallpaper-page--explore .wallpaper-page__intro p,
.wallpaper-page--explore .wallpaper-page__intro > span {
  font-weight: 400;
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
  font-weight: 400;
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
  font-weight: 400;
}

.wallpaper-popular button,
.wallpaper-categories button {
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  font-weight: 400;
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
  font-weight: 400;
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
  font-weight: 400;
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
  height: clamp(224px, 18vw, 290px);
  min-height: 0;
  grid-template-rows: minmax(0, 1fr) 72px;
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
  inset: 0 0 72px;
  z-index: 1;
  background: linear-gradient(
    112deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0)
  );
  background-position: 100% 0;
  background-size: 300% 100%;
  content: "";
  opacity: 0;
  pointer-events: none;
  transition:
    background-position 700ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 260ms ease,
    visibility 0s linear 700ms;
  visibility: hidden;
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
  background-position: 0 0;
  opacity: 1;
  transition-delay: 0s;
  visibility: visible;
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
  --wallpaper-frosted-backdrop: none;
  position: absolute;
  left: 50%;
  bottom: 88px;
  z-index: 2;
  min-width: 132px;
  max-width: calc(100% - 34px);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.94);
  padding: 10px 18px;
  font-size: 12px;
  font-weight: 660;
  line-height: 1;
  text-align: center;
  opacity: 0;
  transform: translate(-50%, 8px) scale(0.98);
  transition:
    opacity 210ms ease,
    transform 210ms ease;
}

.wallpaper-explore-card:hover .wallpaper-explore-card__view,
.wallpaper-explore-card:focus-visible .wallpaper-explore-card__view {
  --wallpaper-frosted-backdrop: blur(2px) saturate(1.02);
  opacity: 1;
  transform: translate(-50%, 0) scale(1);
}

.wallpaper-explore-card__info {
  position: relative;
  display: flex;
  height: 72px;
  min-height: 0;
  flex-direction: column;
  justify-content: space-between;
  background: rgba(18, 23, 19, 0.86);
  padding: 11px 16px 10px;
}

.wallpaper-explore-card__info h2 {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  font-family: var(--wallpaper-display);
  font-size: 17px;
  font-weight: 500;
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
  font-weight: 400;
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
  font-weight: 500;
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

.wallpaper-settings-board {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 40px;
  height: 100%;
  min-height: 480px;
}

.wallpaper-settings-sidebar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
  background: transparent;
  position: relative;
}

.wallpaper-sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 14px;
}

.wallpaper-sidebar-header span {
  font-size: 10.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.32);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.logo-spark {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: #2dd4bf;
  box-shadow: 0 0 8px #2dd4bf;
}

.wallpaper-sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.52);
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  position: relative;
  transition: all 180ms ease;
}

.wallpaper-sidebar-item:hover {
  color: rgba(255, 255, 255, 0.88);
  background: rgba(255, 255, 255, 0.035);
}

.wallpaper-sidebar-item.is-active {
  color: #fff;
  background: rgba(45, 212, 191, 0.13);
  border: 1px solid rgba(94, 234, 212, 0.48);
  border-radius: 10px;
  box-shadow:
    0 0 12px rgba(45, 212, 191, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  animation: sidebarItemActivate 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes sidebarItemActivate {
  from {
    opacity: 0.5;
    transform: scale(0.96);
    box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.2);
  }
  60% {
    box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.14);
  }
  to {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(45, 212, 191, 0);
  }
}

.wallpaper-sidebar-item__icon {
  width: 14px;
  height: 14px;
  stroke-width: 2px;
}

.wallpaper-sidebar-item__badge {
  position: absolute;
  right: 12px;
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  font-family: monospace;
}

.wallpaper-sidebar-item.is-active .wallpaper-sidebar-item__badge {
  background: rgba(45, 212, 191, 0.16);
  color: #2dd4bf;
}

.wallpaper-settings-main-content {
  padding: 12px 0 28px;
  overflow-y: auto;
  height: 100%;
  scrollbar-width: none;
  background: transparent;
}

.wallpaper-settings-panel {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.wallpaper-settings-panel__header h2 {
  font-size: 18px;
  font-weight: 500;
  color: #fff;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}

.wallpaper-settings-panel__header p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.44);
  margin: 0;
}

/* 我的收藏 / 已上传壁纸网格 */
.wallpaper-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 16px;
}

.wallpaper-settings-grid-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wallpaper-settings-grid-item__media {
  position: relative;
  aspect-ratio: 16/10;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
}

.wallpaper-settings-grid-item__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.wallpaper-settings-grid-item:hover .wallpaper-settings-grid-item__media img {
  transform: scale(1.04);
}

.wallpaper-settings-grid-item__overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 16, 20, 0.1);
  backdrop-filter: blur(0px) brightness(1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  pointer-events: none;
  transition: all 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.wallpaper-settings-grid-item__media:hover .wallpaper-settings-grid-item__overlay {
  opacity: 1;
  pointer-events: auto;
  background: rgba(10, 16, 20, 0.32);
  backdrop-filter: blur(10px) brightness(0.8);
}

/* 圆形气泡按钮 */
.mini-glass-btn {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.88);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.mini-glass-btn:hover {
  background: rgba(255, 255, 255, 0.24);
  border-color: rgba(255, 255, 255, 0.36);
  color: #fff;
  transform: scale(1.08);
}

.mini-glass-btn.applied {
  background: rgba(45, 212, 191, 0.22);
  border-color: rgba(45, 212, 191, 0.45);
  color: #2dd4bf;
}

.mini-glass-btn .tooltip {
  position: absolute;
  bottom: 38px;
  left: 50%;
  transform: translateX(-50%) scale(0.9);
  background: rgba(10, 16, 20, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 180ms ease;
  backdrop-filter: blur(6px);
}

.mini-glass-btn:hover .tooltip {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

.wallpaper-settings-grid-item__info h4 {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wallpaper-settings-grid-item__info p {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.36);
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 收藏空状态 */
.wallpaper-settings-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 20px;
  text-align: center;
}

.wallpaper-settings-empty__icon {
  width: 48px;
  height: 48px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: grid;
  place-items: center;
  margin-bottom: 14px;
}

.heart-broken {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.28);
  animation: heartPulse 2s infinite ease-in-out;
}

@keyframes heartPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); color: rgba(244, 63, 94, 0.4); }
  100% { transform: scale(1); }
}

.wallpaper-settings-empty h3 {
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.78);
  margin: 0 0 6px;
}

.wallpaper-settings-empty p {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.38);
  max-width: 320px;
  line-height: 1.6;
  margin: 0;
}

/* 壁纸上传区 */
.wallpaper-upload-zone {
  border: 1px dashed rgba(255, 255, 255, 0.16);
  background: rgba(0, 0, 0, 0.22);
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 220ms ease;
}

.wallpaper-upload-zone:hover,
.wallpaper-upload-zone.is-dragover {
  border-color: rgba(45, 212, 191, 0.52);
  background: rgba(45, 212, 191, 0.04);
}

.wallpaper-upload-zone__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.wallpaper-upload-zone__content h3 {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
}

.wallpaper-upload-zone__content h3 span {
  color: #2dd4bf;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.wallpaper-upload-zone__content p {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
}

/* 壁纸上传表单 */
.wallpaper-upload-form {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(18, 24, 30, 0.62);
  backdrop-filter: blur(24px);
  padding: 24px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.3);
}

.wallpaper-upload-form__layout {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 1.6fr;
  gap: 24px;
}

.wallpaper-upload-form__preview {
  position: relative;
  aspect-ratio: 16/10;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.25);
  height: fit-content;
}

.wallpaper-upload-form__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wallpaper-upload-form__preview .info-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 3px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.85);
  font-size: 9px;
  font-family: monospace;
}

.wallpaper-upload-form__fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.38);
  letter-spacing: 0.02em;
}

.form-group input,
.form-group select {
  padding: 10px 4px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0;
  color: #fff;
  font-size: 12.5px;
  outline: none;
  transition: all 220ms ease;
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.22);
}

.form-group input:focus,
.form-group select:focus {
  border-bottom-color: #2dd4bf;
  box-shadow: none;
}

.form-group select option {
  background: #10161a;
  color: #fff;
}

.wallpaper-upload-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.cancel-btn,
.submit-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 180ms ease;
}

.cancel-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.7);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.submit-btn {
  background: linear-gradient(135deg, #0d9488, #0f766e);
  border: 0;
  color: #fff;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.2);
}

.submit-btn:hover {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.3);
}

.section-title {
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
  margin: 0 0 12px;
}

.wallpaper-settings-sub-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px;
  text-align: center;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px dashed rgba(255, 255, 255, 0.12);
}

.wallpaper-settings-sub-empty svg {
  color: rgba(255, 255, 255, 0.22);
}

.wallpaper-settings-sub-empty p {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
}

/* 壁纸源卡片 */
.wallpaper-sources-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
}

.wallpaper-source-card {
  padding: 20px 24px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(18, 24, 30, 0.62);
  backdrop-filter: blur(24px);
  transition: all 260ms cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
}

.wallpaper-source-card.is-enabled {
  border-color: rgba(45, 212, 191, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 12px 36px rgba(0, 0, 0, 0.3);
}

.wallpaper-source-card.is-disabled {
  opacity: 0.44;
  border-color: rgba(255, 255, 255, 0.02);
  background: rgba(18, 24, 30, 0.35);
}

.wallpaper-source-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.source-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: grid;
  place-items: center;
  flex: 0 0 32px;
}

.source-icon svg {
  width: 15px;
  height: 15px;
}

.source-info h3 {
  font-size: 12.5px;
  font-weight: 500;
  color: #fff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sys-badge {
  font-size: 8.5px;
  padding: 1px 4px;
  background: rgba(45, 212, 191, 0.12);
  color: #2dd4bf;
  border-radius: 4px;
  border: 1px solid rgba(45, 212, 191, 0.2);
  font-weight: 500;
}

.source-url {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.32);
  font-family: monospace;
  word-break: break-all;
  display: block;
  margin-top: 2px;
}

.source-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
}

.source-delete-btn {
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.32);
  transition: all 180ms ease;
  display: grid;
  place-items: center;
}

.source-delete-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
}

.source-description {
  margin: 8px 0 0 44px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.36);
  line-height: 1.5;
}

/* Glass Switch */
.glass-switch {
  position: relative;
  width: 32px;
  height: 16px;
  border-radius: 99px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  padding: 0;
  transition: all 260ms cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
}

.glass-switch__handle {
  position: absolute;
  top: 1.5px;
  left: 2px;
  width: 11px;
  height: 11px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  transition: all 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-switch.active {
  background: rgba(45, 212, 191, 0.24);
  border-color: rgba(45, 212, 191, 0.35);
}

.glass-switch.active .glass-switch__handle {
  transform: translateX(15px);
  background: #2dd4bf;
  box-shadow: 0 1px 6px rgba(45, 212, 191, 0.5);
}

/* 添加源板块 */
.wallpaper-sources-add-section {
  margin-top: 20px;
  max-width: 800px;
}

.add-source-trigger {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.015);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.54);
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 200ms ease;
}

.add-source-trigger:hover {
  background: rgba(255, 255, 255, 0.035);
  border-color: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.add-source-form {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(18, 24, 30, 0.62);
  backdrop-filter: blur(24px);
  padding: 24px;
  margin-top: 14px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.3);
}

.add-source-form__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-source-form__header h3 {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  margin: 0;
}

.add-source-form__header .close-btn {
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.32);
  display: grid;
  place-items: center;
}

.add-source-form__header .close-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

/* 新增来源表单 - 字段网格 */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.col-span-2 {
  /* 单列布局中无需 span，保留类名兼容性 */
}

/* 表单操作按钮行 */
.add-source-form__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 24px;
  margin-top: 24px;
}

.add-source-form__actions .cancel-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.68);
  transition: all 180ms ease;
}

.add-source-form__actions .cancel-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.22);
}

.add-source-form__actions .submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  background: linear-gradient(135deg, #0d9488, #0f766e);
  border: 0;
  color: #fff;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.28);
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.add-source-form__actions .submit-btn:hover {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  box-shadow: 0 4px 20px rgba(13, 148, 136, 0.38);
  transform: translateY(-1px);
}

.add-source-form__actions .submit-btn:active {
  transform: translateY(0);
}

/* 动效 */
.anime-fade-in {
  animation: settingsPanelFadeIn 340ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes settingsPanelFadeIn {
  from {
    opacity: 0;
    transform: translate3d(0, 4px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
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

/* 当前壁纸驱动的锁屏设置与预览 */
.wallpaper-lock-screen {
  position: absolute;
  z-index: 9999;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #5f8789;
  color: #fff;
  animation: wallpaperLockScreenIn 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.wallpaper-lock-screen__background,
.wallpaper-lock-screen__shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.wallpaper-lock-screen__background {
  object-fit: cover;
  transform: scale(1.025);
  animation: wallpaperLockBackgroundIn 1s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.wallpaper-lock-screen__shade {
  background:
    linear-gradient(180deg, rgba(5, 12, 16, 0.2), rgba(5, 12, 16, 0.03) 40%, rgba(5, 12, 16, 0.48)),
    radial-gradient(circle at center, transparent 18%, rgba(3, 9, 12, 0.22) 100%);
  backdrop-filter: blur(3px) saturate(0.9);
}

.wallpaper-lock-screen__close {
  position: absolute;
  z-index: 4;
  top: 70px;
  right: 24px;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 99px;
  background: rgba(12, 22, 27, 0.24);
  color: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px) saturate(1.2);
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease;
}

.wallpaper-lock-screen__close:hover {
  transform: scale(1.06);
  background: rgba(255, 255, 255, 0.16);
}

.wallpaper-lock-screen__close svg {
  width: 17px;
  height: 17px;
}

.wallpaper-lock-screen__clock {
  position: absolute;
  z-index: 2;
  top: clamp(76px, 10vh, 96px);
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
  text-shadow: 0 3px 24px rgba(0, 0, 0, 0.34);
}

.wallpaper-lock-screen__clock span {
  font-size: 14px;
  font-weight: 620;
  letter-spacing: 0.02em;
}

.wallpaper-lock-screen__clock strong {
  margin-top: -4px;
  font-size: clamp(72px, 10vw, 124px);
  font-weight: 680;
  line-height: 1;
  letter-spacing: -0.07em;
}

.wallpaper-lock-screen__clock small {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 11px;
  font-weight: 560;
}

.wallpaper-lock-setup,
.wallpaper-lock-unlock {
  position: relative;
  z-index: 3;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(145deg, rgba(13, 25, 30, 0.72), rgba(9, 18, 23, 0.52));
  box-shadow: 0 26px 80px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(30px) saturate(1.22);
  animation: wallpaperLockPanelIn 620ms 80ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.wallpaper-lock-setup {
  width: min(430px, calc(100% - 40px));
  margin-top: clamp(130px, 22vh, 210px);
  padding: 26px;
  border-radius: 24px;
}

.wallpaper-lock-setup__icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(94, 234, 212, 0.32);
  border-radius: 14px;
  background: rgba(45, 212, 191, 0.14);
  color: #99f6e4;
  box-shadow: 0 10px 28px rgba(13, 148, 136, 0.2);
}

.wallpaper-lock-setup__avatar {
  display: block;
  width: 58px;
  height: 58px;
  margin: 0 auto 10px;
  border: 2px solid rgba(255, 255, 255, 0.68);
  border-radius: 99px;
  object-fit: cover;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
}

.wallpaper-lock-setup__icon svg {
  width: 21px;
  height: 21px;
}

.wallpaper-lock-setup__heading {
  margin: 16px 0 20px;
}

.wallpaper-lock-setup__heading > span {
  color: #99f6e4;
  font-size: 10px;
  font-weight: 720;
  letter-spacing: 0.12em;
}

.wallpaper-lock-setup__heading h2 {
  margin: 5px 0 7px;
  font-size: 22px;
  font-weight: 680;
  letter-spacing: -0.025em;
}

.wallpaper-lock-setup__heading p {
  margin: 0;
  color: rgba(255, 255, 255, 0.56);
  font-size: 11.5px;
  line-height: 1.55;
}

.wallpaper-lock-field {
  display: block;
  margin-top: 13px;
}

.wallpaper-lock-field > span {
  display: block;
  margin: 0 0 6px 2px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 10.5px;
  font-weight: 580;
}

.wallpaper-lock-field > div,
.wallpaper-lock-unlock__field {
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(3, 10, 13, 0.34);
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.wallpaper-lock-field > div {
  height: 40px;
  padding: 0 11px;
  border-radius: 11px;
}

.wallpaper-lock-field > div:focus-within,
.wallpaper-lock-unlock__field:focus-within {
  border-color: rgba(255, 255, 255, 0.54);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 8px 24px rgba(0, 0, 0, 0.12);
}

.wallpaper-lock-field input,
.wallpaper-lock-unlock__field input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #fff;
  font-size: 12px;
}

.wallpaper-lock-field input::placeholder,
.wallpaper-lock-unlock__field input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.wallpaper-lock-field--idle input {
  padding-inline: 16px;
  text-align: center;
}

.wallpaper-lock-field button {
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.48);
  cursor: pointer;
}

.wallpaper-lock-field svg {
  width: 15px;
  height: 15px;
  color: #5eead4;
}

.wallpaper-lock-setup__hint {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 13px;
  color: rgba(255, 255, 255, 0.44);
  font-size: 9.5px;
}

.wallpaper-lock-setup__hint svg {
  width: 14px;
  height: 14px;
  color: #5eead4;
}

.wallpaper-lock-error {
  margin: 10px 0 0;
  color: #fecaca;
  font-size: 10.5px;
}

.wallpaper-lock-setup__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.wallpaper-lock-button {
  height: 38px;
  padding: 0 15px;
  border-radius: 11px;
  font-size: 10px;
  font-weight: 650;
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.wallpaper-lock-button:hover {
  transform: translateY(-1px);
}

.wallpaper-lock-button--secondary {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.74);
}

.wallpaper-lock-button--primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(153, 246, 228, 0.38);
  background: linear-gradient(135deg, #14b8a6, #0f766e);
  color: #fff;
  box-shadow: 0 8px 22px rgba(13, 148, 136, 0.28);
}

.wallpaper-lock-button--primary svg {
  width: 14px;
  height: 14px;
}

.wallpaper-lock-unlock {
  align-self: end;
  width: min(310px, calc(100% - 40px));
  margin-bottom: clamp(32px, 7vh, 72px);
  padding: 22px;
  border-radius: 22px;
  text-align: center;
}

.wallpaper-lock-unlock__avatar {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  margin: 0 auto 10px;
  border: 2px solid rgba(255, 255, 255, 0.58);
  border-radius: 99px;
  background: linear-gradient(145deg, rgba(94, 234, 212, 0.88), rgba(15, 118, 110, 0.92));
  color: #07201f;
  font-size: 15px;
  font-weight: 800;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.24);
}

.wallpaper-lock-unlock > strong,
.wallpaper-lock-unlock > span {
  display: block;
}

.wallpaper-lock-unlock > strong {
  font-size: 13px;
}

.wallpaper-lock-unlock > span {
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.52);
  font-size: 10px;
}

.wallpaper-lock-unlock__field {
  height: 38px;
  margin-top: 13px;
  padding-left: 11px;
  border-radius: 99px;
  text-align: left;
}

.wallpaper-lock-unlock__field > svg {
  width: 13px;
  height: 13px;
  margin-right: 7px;
  color: rgba(255, 255, 255, 0.5);
}

.wallpaper-lock-unlock__field button {
  width: 32px;
  height: 32px;
  margin-right: 2px;
  border: 0;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  cursor: pointer;
}

.wallpaper-lock-unlock__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 13px;
}

.wallpaper-lock-unlock__actions span {
  width: 2px;
  height: 2px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.3);
}

.wallpaper-lock-unlock__actions button {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.52);
  font-size: 9.5px;
  cursor: pointer;
}

.wallpaper-lock-unlock__actions button:hover {
  color: #fff;
}

@keyframes wallpaperLockScreenIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes wallpaperLockBackgroundIn {
  from { filter: blur(16px); transform: scale(1.12); }
  to { filter: blur(0); transform: scale(1.025); }
}

@keyframes wallpaperLockPanelIn {
  from { opacity: 0; transform: translateY(28px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .wallpaper-lock-screen,
  .wallpaper-lock-screen__background,
  .wallpaper-lock-setup,
  .wallpaper-lock-unlock,
  .wallpaper-sidebar-item.is-active,
  .anime-fade-in {
    animation: none;
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

/* 锁屏保持参考图的纯净全屏构图：仅保留返回键与底部轻量控制 */
section[data-app-id="wallpaper"]:has(.wallpaper-lock-screen)
  > [data-kernelon-app-frame]
  > header {
  z-index: 10000;
}

section[data-app-id="wallpaper"]:has(.wallpaper-lock-screen)
  > [data-kernelon-app-frame]
  > header
  [data-app-window-controls] {
  display: none;
}

section[data-app-id="wallpaper"]:has(.wallpaper-lock-screen)
  > [data-kernelon-app-frame]
  > header[data-app-header-preset="browser"]
  [data-app-header-region="leading"] {
  left: 24px;
}

.wallpaper-ux:has(> .wallpaper-lock-screen) > .wallpaper-home,
.wallpaper-ux:has(> .wallpaper-lock-screen) > .wallpaper-page,
.wallpaper-ux:has(> .wallpaper-lock-screen) > .wallpaper-preview {
  visibility: hidden;
}

.wallpaper-lock-back-control {
  width: 42px;
  height: 42px;
  border-color: rgba(255, 255, 255, 0.34);
  background: rgba(231, 246, 248, 0.14);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.26);
  backdrop-filter: blur(10px) saturate(1.08);
}

.wallpaper-lock-screen__shade {
  background:
    linear-gradient(180deg, rgba(5, 12, 16, 0.12), rgba(5, 12, 16, 0.01) 45%, rgba(4, 12, 16, 0.28)),
    radial-gradient(circle at 50% 36%, transparent 28%, rgba(3, 9, 12, 0.12) 100%);
  backdrop-filter: blur(1.5px) saturate(0.96);
}

.wallpaper-lock-screen__clock {
  top: clamp(82px, 11vh, 108px);
}

.wallpaper-lock-screen__clock span {
  font-size: 16px;
  font-weight: 650;
}

.wallpaper-lock-screen__clock strong {
  margin-top: -2px;
  font-size: clamp(88px, 12vw, 148px);
  font-weight: 650;
}

.wallpaper-lock-screen__clock small {
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 12px;
}

.wallpaper-lock-setup,
.wallpaper-lock-unlock {
  position: absolute;
  z-index: 3;
  right: auto;
  bottom: clamp(30px, 5vh, 54px);
  left: 50%;
  margin: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  transform: translateX(-50%);
  animation: wallpaperLockControlsIn 620ms 80ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.wallpaper-lock-setup {
  width: min(520px, calc(100% - 48px));
  padding: 0;
  border-radius: 0;
  text-align: center;
}

.wallpaper-lock-setup__icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 10px;
  border-color: rgba(255, 255, 255, 0.3);
  border-radius: 99px;
  background: rgba(231, 246, 248, 0.18);
  color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(12px) saturate(1.08);
}

.wallpaper-lock-setup__heading {
  margin: 0 0 14px;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.3);
}

.wallpaper-lock-setup__heading > span {
  color: #fff;
  font-size: 13px;
  font-weight: 680;
  letter-spacing: 0.01em;
}

.wallpaper-lock-setup__heading p {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 10.5px;
}

.wallpaper-lock-field {
  width: min(340px, 100%);
  margin: 9px auto 0;
  text-align: left;
}

.wallpaper-lock-field > span {
  margin-left: 12px;
  color: rgba(255, 255, 255, 0.78);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
}

.wallpaper-lock-field > div,
.wallpaper-lock-unlock__field {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(232, 246, 248, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 8px 24px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(14px) saturate(1.08);
}

.wallpaper-lock-field > div {
  height: 38px;
  border-radius: 99px;
}

.wallpaper-lock-field input,
.wallpaper-lock-unlock__field input {
  color: #fff;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}

.wallpaper-lock-field input::placeholder,
.wallpaper-lock-unlock__field input::placeholder {
  color: rgba(255, 255, 255, 0.58);
}

.wallpaper-lock-setup__hint {
  justify-content: center;
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.68);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.28);
}

.wallpaper-lock-setup__hint svg,
.wallpaper-lock-field svg {
  color: rgba(255, 255, 255, 0.9);
}

.wallpaper-lock-error {
  color: #fff;
  text-shadow: 0 1px 8px rgba(102, 18, 18, 0.8);
}

.wallpaper-lock-setup__actions {
  justify-content: center;
  gap: 10px;
  margin-top: 13px;
}

.wallpaper-lock-button {
  height: 38px;
  border-radius: 99px;
  backdrop-filter: blur(14px) saturate(1.08);
}

.wallpaper-lock-button--secondary {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(232, 246, 248, 0.14);
  color: rgba(255, 255, 255, 0.88);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.wallpaper-lock-button--primary {
  border-color: rgba(255, 255, 255, 0.42);
  background: rgba(238, 250, 250, 0.26);
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 10px 28px rgba(0, 0, 0, 0.14);
}

.wallpaper-lock-button--primary:hover {
  background: rgba(238, 250, 250, 0.34);
}

.wallpaper-lock-unlock {
  width: min(330px, calc(100% - 48px));
  padding: 0;
  border-radius: 0;
}

.wallpaper-lock-unlock__avatar {
  width: 58px;
  height: 58px;
  margin-bottom: 9px;
  border-color: rgba(255, 255, 255, 0.72);
  background: rgba(231, 246, 248, 0.22);
  color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(12px) saturate(1.08);
}

.wallpaper-lock-unlock > strong {
  color: #fff;
  font-size: 13px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.34);
}

.wallpaper-lock-unlock > span {
  color: rgba(255, 255, 255, 0.72);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.28);
}

.wallpaper-lock-unlock__field {
  height: 38px;
  margin-top: 11px;
}

.wallpaper-lock-unlock__field button {
  background: rgba(255, 255, 255, 0.2);
}

.wallpaper-lock-unlock__actions button {
  color: rgba(255, 255, 255, 0.72);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
}

@keyframes wallpaperLockControlsIn {
  from {
    opacity: 0;
    transform: translate3d(-50%, 22px, 0) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translate3d(-50%, 0, 0) scale(1);
  }
}
`;
