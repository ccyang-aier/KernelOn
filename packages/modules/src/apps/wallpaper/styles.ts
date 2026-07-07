export const wallpaperStyles = `
section[data-app-id="wallpaper"] {
  background: rgba(7, 9, 12, 0.86) !important;
  border-color: rgba(255, 255, 255, 0.13) !important;
}

section[data-app-id="wallpaper"][data-window-layer="top"] {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    inset 0 -1px 0 rgba(255, 255, 255, 0.06),
    0 34px 92px rgba(0, 0, 0, 0.42) !important;
}

section[data-app-id="wallpaper"] > header {
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

section[data-app-id="wallpaper"] > header + div {
  height: 100%;
  flex: 1 1 auto;
  background: rgba(7, 9, 12, 0.64) !important;
}

section[data-app-id="wallpaper"] > header + div > div {
  height: 100%;
  overflow: hidden !important;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-window-traffic-lights-"] {
  left: 24px;
  top: 31px;
  gap: 10px;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-window-traffic-lights-"] button {
  width: 13px;
  height: 13px;
}

section[data-app-id="wallpaper"] > header > div:nth-of-type(2) {
  min-height: 68px;
  gap: 10px;
  padding: 0 24px 0 86px;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-identity-"] {
  display: none;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-leading-"] {
  flex: 1 1 0;
  justify-content: flex-end;
  padding-right: 0;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-center-"] {
  flex: 0 0 auto;
}

section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-trailing-"] {
  flex: 1 1 0;
  gap: 10px;
  justify-content: flex-end;
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-liquid-button="true"] {
  position: relative;
  width: 42px;
  height: 42px;
  overflow: visible;
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-liquid-button="true"] .glass,
section[data-app-id="wallpaper"] > header [data-kernelon-app-header-liquid-segment="true"] .glass {
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.035) 46%, rgba(255, 255, 255, 0.08)),
    rgba(18, 20, 23, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(255, 255, 255, 0.08),
    0 13px 28px rgba(0, 0, 0, 0.23) !important;
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-liquid-button="true"]:hover .glass,
section[data-app-id="wallpaper"] > header [data-kernelon-app-header-liquid-segment="true"]:hover .glass {
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.20), rgba(255, 255, 255, 0.055) 44%, rgba(137, 219, 255, 0.13)),
    rgba(22, 24, 28, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.34),
    inset 0 -1px 0 rgba(255, 255, 255, 0.11),
    0 18px 38px rgba(0, 0, 0, 0.30),
    0 0 0 1px rgba(255, 255, 255, 0.05) !important;
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-liquid-button="true"] button {
  width: 42px;
  min-width: 42px;
  height: 42px;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  color: rgba(255, 255, 255, 0.92) !important;
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-liquid-button="true"] svg {
  position: relative;
  z-index: 1;
  width: 21px;
  height: 21px;
  stroke-width: 2.25;
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-liquid-segment="true"] {
  position: relative;
  height: 42px;
  overflow: visible;
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-segment-group="true"] {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  height: 42px;
  gap: 0;
  padding: 4px;
  border: 0 !important;
  border-radius: 999px;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-segment-indicator="true"] {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 0;
  z-index: 0;
  width: 94px;
  border-radius: 999px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.18) 42%, rgba(125, 211, 252, 0.16)),
    rgba(255, 255, 255, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.44),
    inset 0 -10px 24px rgba(255, 255, 255, 0.08),
    0 8px 22px rgba(0, 0, 0, 0.24),
    0 0 18px rgba(255, 255, 255, 0.08);
  opacity: 0;
  pointer-events: none;
  will-change: transform, width, filter;
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-segment-button="true"] {
  position: relative;
  z-index: 1;
  overflow: hidden;
  display: inline-flex;
  height: 34px;
  min-width: 94px;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  border: 0 !important;
  border-radius: 999px;
  background: transparent !important;
  color: rgba(255, 255, 255, 0.76) !important;
  box-shadow: none !important;
  font-size: 14px;
  font-weight: 700;
  transition:
    transform 200ms ease,
    color 200ms ease;
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-segment-button="true"][aria-pressed="true"] {
  background: transparent !important;
  color: #fff !important;
  box-shadow: none !important;
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.36);
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-segment-button="true"]:not([aria-pressed="true"]):hover {
  background: transparent !important;
  color: #fff !important;
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-segment-button="true"]:active {
  transform: scale(0.98);
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-segment-pulse="true"] {
  position: absolute;
  inset: -8px;
  z-index: 10;
  border-radius: 999px;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.16) 42%, rgba(125, 211, 252, 0) 70%);
  opacity: 0;
  mix-blend-mode: screen;
  pointer-events: none;
}

section[data-app-id="wallpaper"] > header [data-kernelon-app-header-segment-button="true"] > span:last-child {
  position: relative;
  z-index: 20;
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
.wallpaper-ux--home::after {
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
  background: #0b0d10;
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
}

.wallpaper-home__track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 560ms cubic-bezier(0.22, 1, 0.36, 1);
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
    linear-gradient(90deg, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.08) 48%, rgba(0, 0, 0, 0.38) 100%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.18) 50%, rgba(11, 5, 8, 0.86) 82%, rgba(7, 6, 8, 1) 100%);
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
  gap: 10px;
  margin-top: 16px;
}

.wallpaper-home__glass-action {
  position: relative;
  display: block;
  height: 42px;
  overflow: visible;
  flex: 0 0 auto;
}

.wallpaper-home__glass-action--preview {
  width: 190px;
}

.wallpaper-home__glass-action--like {
  width: 80px;
}

.wallpaper-home__glass-action .glass {
  width: 100%;
  height: 42px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.04) 48%, rgba(255, 255, 255, 0.09)),
    rgba(12, 14, 16, 0.20);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(255, 255, 255, 0.08),
    0 16px 30px rgba(0, 0, 0, 0.28) !important;
}

.wallpaper-home__glass-action .glass > div {
  width: 100%;
}

.wallpaper-home__glass-action:hover .glass {
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.065) 44%, rgba(137, 219, 255, 0.13)),
    rgba(16, 18, 21, 0.24);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.36),
    inset 0 -1px 0 rgba(255, 255, 255, 0.10),
    0 20px 38px rgba(0, 0, 0, 0.34),
    0 0 0 1px rgba(255, 255, 255, 0.06) !important;
}

.wallpaper-home__glass-button {
  display: inline-flex;
  width: 100%;
  height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.94);
  padding: 0 20px;
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.50);
  cursor: pointer;
  transition:
    transform 180ms ease,
    color 180ms ease,
    text-shadow 180ms ease;
}

.wallpaper-home__glass-button--like {
  padding: 0 16px;
}

.wallpaper-home__glass-button:hover {
  color: #fff;
  text-shadow: 0 0 13px rgba(255, 255, 255, 0.42), 0 2px 12px rgba(0, 0, 0, 0.48);
}

.wallpaper-home__glass-button:active {
  transform: scale(0.97);
}

.wallpaper-home__arrow {
  position: absolute;
  top: 42%;
  z-index: 4;
  display: grid;
  width: 42px;
  height: 64px;
  place-items: center;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
}

.wallpaper-home__arrow svg {
  width: 39px;
  height: 39px;
  stroke-width: 2.8;
  filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.5));
}

.wallpaper-home__arrow--prev {
  left: 20px;
}

.wallpaper-home__arrow--next {
  right: 20px;
}

.wallpaper-home__pagination {
  position: absolute;
  left: 50%;
  bottom: clamp(98px, 15vh, 144px);
  z-index: 4;
  display: flex;
  transform: translateX(-50%);
  gap: 8px;
}

.wallpaper-home__pagination button {
  width: 7px;
  height: 7px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.33);
  padding: 0;
  cursor: pointer;
}

.wallpaper-home__pagination button.is-active {
  width: 9px;
  height: 9px;
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.96);
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
  bottom: 16px;
  left: 30px;
  min-width: 226px;
  max-width: calc(100% - 52px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(56, 34, 52, 0.48);
  padding: 12px 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 16px 34px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(22px);
  opacity: 0;
  transform: translateY(8px) scale(0.98);
  transition:
    opacity 210ms ease,
    transform 210ms ease;
}

.wallpaper-carousel-card.has-overlay .wallpaper-card-glass-label,
.wallpaper-carousel-card.is-selected .wallpaper-card-glass-label,
.wallpaper-carousel-card:hover .wallpaper-card-glass-label,
.wallpaper-carousel-card:focus-visible .wallpaper-card-glass-label {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.wallpaper-card-glass-label strong {
  display: block;
  font-family: var(--wallpaper-display);
  font-size: 15px;
  line-height: 1;
}

.wallpaper-card-glass-label span {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 10px;
  font-weight: 900;
}

.wallpaper-card-glass-label i {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 99px;
  background: #21e66a;
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
  padding: 136px clamp(56px, 6.5vw, 90px) 140px;
}

.wallpaper-page--settings {
  padding: 112px clamp(52px, 5vw, 72px) 126px;
  background:
    radial-gradient(circle at 48% 12%, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0) 34%),
    linear-gradient(112deg, rgba(20, 82, 93, 0.24), rgba(16, 21, 24, 0.24), rgba(130, 18, 54, 0.20));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 0 120px rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px) saturate(1.28);
}

.wallpaper-page__intro p {
  margin: 0 0 16px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 20px;
  font-weight: 800;
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

.wallpaper-page__intro > span {
  display: block;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 20px;
  font-weight: 700;
}

.wallpaper-search {
  display: flex;
  width: min(560px, 100%);
  height: 48px;
  align-items: center;
  gap: 14px;
  margin-top: 36px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(17, 19, 22, 0.36);
  padding: 0 22px;
  color: rgba(255, 255, 255, 0.56);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
}

.wallpaper-search svg {
  width: 21px;
  height: 21px;
}

.wallpaper-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #fff;
  font-size: 19px;
  font-weight: 700;
}

.wallpaper-search input::placeholder {
  color: rgba(255, 255, 255, 0.54);
}

.wallpaper-popular {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
}

.wallpaper-popular > span {
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
  font-weight: 900;
}

.wallpaper-popular button,
.wallpaper-categories button {
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.72);
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
}

.wallpaper-popular button {
  height: 37px;
  padding: 0 17px;
}

.wallpaper-popular button.is-selected {
  background: rgba(255, 255, 255, 0.20);
  color: rgba(255, 255, 255, 0.95);
}

.wallpaper-categories {
  display: flex;
  max-width: 1120px;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 42px;
}

.wallpaper-categories button {
  display: flex;
  height: 42px;
  align-items: center;
  gap: 8px;
  padding: 0 16px 0 5px;
  background: rgba(255, 255, 255, 0.12);
}

.wallpaper-categories button.is-active {
  background: rgba(255, 255, 255, 0.98);
  color: #171717;
}

.wallpaper-categories img,
.wallpaper-categories i {
  width: 31px;
  height: 31px;
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
  margin-top: 34px;
}

.wallpaper-results-bar strong {
  color: rgba(255, 255, 255, 0.55);
  font-size: 18px;
  font-weight: 900;
}

.wallpaper-results-bar button {
  display: flex;
  height: 39px;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.13);
  color: rgba(255, 255, 255, 0.75);
  padding: 0 16px;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
}

.wallpaper-results-bar svg {
  width: 18px;
  height: 18px;
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;
  margin-top: 18px;
}

.wallpaper-explore-card {
  position: relative;
  min-height: 315px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 18px;
  background: rgba(12, 14, 13, 0.4);
  box-shadow: 0 20px 36px rgba(0, 0, 0, 0.18);
  cursor: pointer;
}

.wallpaper-explore-card.is-selected {
  border-color: rgba(255, 255, 255, 0.34);
  box-shadow: 0 22px 42px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.wallpaper-explore-card > img,
.wallpaper-explore-placeholder {
  width: 100%;
  height: 73%;
  object-fit: cover;
}

.wallpaper-explore-placeholder {
  display: block;
  background:
    radial-gradient(circle at 56% 45%, rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0) 18%),
    #ff696e;
}

.wallpaper-explore-card__info {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  min-height: 88px;
  background: rgba(21, 25, 20, 0.88);
  padding: 20px 19px 16px;
}

.wallpaper-explore-card__info h2 {
  margin: 0 0 12px;
  font-family: var(--wallpaper-display);
  font-size: 20px;
  line-height: 1;
}

.wallpaper-explore-card__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  font-weight: 900;
}

.wallpaper-author {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.wallpaper-author i {
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  color: rgba(255, 255, 255, 0.82);
  font-size: 11px;
  font-style: normal;
}

.wallpaper-tag,
.wallpaper-stats em {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  padding: 3px 8px;
  color: rgba(255, 255, 255, 0.48);
  font-style: normal;
}

.wallpaper-stats {
  display: flex;
  margin-left: auto;
  align-items: center;
  gap: 13px;
}

.wallpaper-like-button {
  display: flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  color: #ff4f70;
  padding: 0;
  font-weight: 900;
  cursor: pointer;
}

.wallpaper-like-button svg,
.wallpaper-stats svg {
  width: 15px;
  height: 15px;
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
  margin: 0 0 14px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 18px;
  font-weight: 900;
}

.wallpaper-settings-heading h1 {
  font-size: clamp(42px, 4vw, 60px);
}

.wallpaper-settings-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 42px;
}

.wallpaper-settings-tile {
  display: grid;
  min-height: 178px;
  align-content: space-between;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  background:
    radial-gradient(circle at 20% 10%, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0) 42%),
    rgba(255, 255, 255, 0.08);
  color: #fff;
  padding: 22px;
  text-align: left;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 22px 44px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(22px) saturate(1.24);
  cursor: pointer;
}

.wallpaper-settings-tile__icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.92);
}

.wallpaper-settings-tile__icon svg {
  width: 24px;
  height: 24px;
}

.wallpaper-settings-tile > span:not(.wallpaper-settings-tile__icon) {
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
  font-weight: 900;
}

.wallpaper-settings-tile strong {
  font-family: var(--wallpaper-display);
  font-size: 28px;
  line-height: 1;
}

.wallpaper-settings-tile[data-wallpaper-settings-tone="cyan"] {
  background:
    radial-gradient(circle at 24% 16%, rgba(84, 205, 225, 0.24), rgba(84, 205, 225, 0) 44%),
    rgba(255, 255, 255, 0.08);
}

.wallpaper-settings-tile[data-wallpaper-settings-tone="green"] {
  background:
    radial-gradient(circle at 24% 16%, rgba(33, 230, 106, 0.20), rgba(33, 230, 106, 0) 44%),
    rgba(255, 255, 255, 0.08);
}

.wallpaper-settings-tile[data-wallpaper-settings-tone="amber"] {
  background:
    radial-gradient(circle at 24% 16%, rgba(255, 182, 70, 0.22), rgba(255, 182, 70, 0) 44%),
    rgba(255, 255, 255, 0.08);
}

.wallpaper-settings-panel {
  display: flex;
  min-height: 96px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.08);
  padding: 24px 28px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 24px 54px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(24px) saturate(1.24);
}

.wallpaper-settings-panel div {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.70);
  font-size: 14px;
  font-weight: 900;
}

.wallpaper-settings-panel svg {
  width: 22px;
  height: 22px;
}

.wallpaper-settings-panel strong {
  color: #fff;
  font-size: 18px;
}

.wallpaper-toast {
  position: absolute;
  right: 28px;
  bottom: 28px;
  z-index: 150;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: rgba(18, 19, 22, 0.62);
  color: rgba(255, 255, 255, 0.92);
  padding: 11px 16px;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(22px);
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
}

@media (max-width: 760px) {
  section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-leading-"],
  section[data-app-id="wallpaper"] > header [data-testid^="kernelon-app-header-trailing-"] {
    display: none;
  }

  section[data-app-id="wallpaper"] > header > div:nth-of-type(2) {
    justify-content: center;
    padding: 0 12px 0 80px;
  }

  .wallpaper-home__hero {
    height: 560px;
  }

  .wallpaper-home__content {
    bottom: 162px;
    width: calc(100% - 96px);
  }

  .wallpaper-home__pagination {
    bottom: 92px;
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
}
`;
