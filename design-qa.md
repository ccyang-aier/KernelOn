**Findings**
- No blocking issues found in the latest visual QA pass.

**Source Visual Truth**
- Original UX reference: `C:\Users\17335\AppData\Local\Temp\codex-clipboard-a2641aa2-5e23-4a82-8570-e0fb02d16f75.png`
- Latest user feedback reference: `C:\Users\17335\AppData\Local\Temp\codex-clipboard-7038d2bd-ad2a-4aae-b2b1-f08487945054.png`
- Interpretation: preserve the two-panel system menu relationship, compact macOS-like desktop menu scale, rounded Liquid Glass shell, submenu affordances, and live item feedback. Per user feedback, the active item must avoid a gray, dark, or heavy selected block.

**Implementation Evidence**
- Latest active-state capture: `C:\AIWorks\26Coding\KernelOn\.tmp\design-qa\kernelon-context-menu-ultra-clear-active.png`
- Viewport target: 1620 x 971
- State target: desktop right-click at x=338, y=168; `新建` submenu open; `新建` parent item active with the updated ultra-clear highlight.

**Required Fidelity Surfaces**
- Fonts and typography: system-menu sizing remains compact, with 16px main items, 15.5px submenu items, 520 font weight, and no negative letter spacing.
- Spacing and layout rhythm: compact 286 x 236 main menu and 236 x 180 submenu geometry remain intact, with 34-36px rows.
- Colors and visual tokens: active rows now use an ultra-clear white Liquid Glass highlight, high backdrop brightness, a restrained white inner rim, and no dark gray/blue selected fill.
- Image quality and asset fidelity: no fake image assets were introduced. The menu is native UI chrome over the existing KernelOn wallpaper and Dock assets.
- Copy and content: menu labels match the requested UX, with the requested `新建` submenu demo: `新人档案`, `导师匹配`, `培训任务`, `资源文档`.

**Patches Made In This Pass**
- Replaced the previous active-state tone token with `ultra-clear-liquid-glass`.
- Reworked hovered and pressed backgrounds toward white translucent glass instead of gray-blue fill.
- Added test coverage that prevents the active style from regressing to the earlier darker cyan/gray value.

**Verification**
- Browser visual capture: passed; latest screenshot saved at `C:\AIWorks\26Coding\KernelOn\.tmp\design-qa\kernelon-context-menu-ultra-clear-active.png`.
- `pnpm --filter @kernelon/shell test`: passed, 6 tests.
- `pnpm --filter @kernelon/shell typecheck`: passed.
- `pnpm --filter @kernelon/web build`: passed.
- `pnpm --filter @kernelon/desktop build`: passed.

**Follow-up Polish**
- P3: wire actual command handlers for each menu item when the corresponding KernelOn settings and creation surfaces exist.

final result: passed
