use serde::Serialize;
use serde_json::{Map, Value};
use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex, MutexGuard,
    },
    thread::{self, JoinHandle},
    time::{Duration, Instant},
};
use tauri::{
    utils::config::BackgroundThrottlingPolicy, webview::PageLoadEvent, window::Color, AppHandle,
    Emitter, Manager, Monitor, PhysicalPosition, PhysicalSize, RunEvent, State, WebviewUrl,
    WebviewWindow, WebviewWindowBuilder, WindowEvent,
};

const DESKTOP_LYRICS_LABEL: &str = "mineradio-desktop-lyrics";
const WALLPAPER_LABEL: &str = "mineradio-wallpaper";
const DESKTOP_LYRICS_ASSET: &str = "mineradio-overlays/desktop-lyrics.html";
const WALLPAPER_ASSET: &str = "mineradio-overlays/wallpaper.html";
const DESKTOP_LYRICS_LOCK_EVENT: &str = "mineradio-desktop-lyrics-lock-state";
const DESKTOP_LYRICS_ENABLED_EVENT: &str = "mineradio-desktop-lyrics-enabled-state";
const OVERLAY_BRIDGE_SCRIPT: &str = include_str!("mineradio_overlay_bridge.js");

pub(crate) struct MineradioOverlayState {
    closing: AtomicBool,
    data: Mutex<OverlayData>,
    lyrics_operation: Mutex<()>,
    wallpaper_operation: Mutex<()>,
    pointer_poller: Mutex<Option<PointerPoller>>,
}

impl Default for MineradioOverlayState {
    fn default() -> Self {
        Self {
            closing: AtomicBool::new(false),
            data: Mutex::new(OverlayData::default()),
            lyrics_operation: Mutex::new(()),
            wallpaper_operation: Mutex::new(()),
            pointer_poller: Mutex::new(None),
        }
    }
}

#[derive(Default)]
struct OverlayData {
    lyrics: LyricsData,
    lyrics_lease: u64,
    wallpaper: Map<String, Value>,
    wallpaper_lease: u64,
    monitor_signature: Vec<ScreenRect>,
    monitor_checked_at: Option<Instant>,
}

#[derive(Default)]
struct LyricsData {
    state: Map<String, Value>,
    user_bounds: Option<ScreenRect>,
    programmatic_move_until: Option<Instant>,
    pointer_capture: bool,
    mouse_ignored: Option<bool>,
    hot_bounds: Option<RelativeBounds>,
    last_middle_click: Option<Instant>,
}

struct PointerPoller {
    cancel: Arc<AtomicBool>,
    thread: JoinHandle<()>,
}

#[derive(Clone, Copy)]
enum OverlayKind {
    Lyrics,
    Wallpaper,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
struct ScreenRect {
    x: i32,
    y: i32,
    width: i32,
    height: i32,
}

#[derive(Clone, Copy, Debug, PartialEq)]
struct RelativeBounds {
    left: f64,
    top: f64,
    right: f64,
    bottom: f64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct OverlayOperationResult {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    locked: Option<bool>,
}

#[derive(Clone, Serialize)]
struct LyricsLockState {
    locked: bool,
}

#[derive(Clone, Serialize)]
struct LyricsEnabledState {
    enabled: bool,
}

impl OverlayOperationResult {
    fn success() -> Self {
        Self {
            ok: true,
            error: None,
            locked: None,
        }
    }

    fn success_with_lock(locked: bool) -> Self {
        Self {
            ok: true,
            error: None,
            locked: Some(locked),
        }
    }

    fn error(error: impl ToString, fallback: &'static str) -> Self {
        let message = error.to_string();
        Self {
            ok: false,
            error: Some(if message.trim().is_empty() {
                fallback.to_owned()
            } else {
                message
            }),
            locked: None,
        }
    }
}

#[tauri::command]
pub(crate) fn mineradio_set_desktop_lyrics_enabled(
    app: AppHandle,
    state: State<'_, MineradioOverlayState>,
    enabled: bool,
    payload: Option<Value>,
) -> OverlayOperationResult {
    let _operation = lock(&state.lyrics_operation);
    let result = if enabled {
        create_or_update_desktop_lyrics(&app, &state, object_payload(payload)).map(|()| {
            broadcast_lyrics_enabled(&app, true);
        })
    } else {
        close_desktop_lyrics(&app, &state)
    };
    operation_result(result, "DESKTOP_LYRICS_FAILED")
}

#[tauri::command]
pub(crate) fn mineradio_update_desktop_lyrics(
    app: AppHandle,
    state: State<'_, MineradioOverlayState>,
    payload: Option<Value>,
) -> OverlayOperationResult {
    let _operation = lock(&state.lyrics_operation);
    let payload = object_payload(payload);
    let next_enabled = {
        let data = lock(&state.data);
        let mut next = data.lyrics.state.clone();
        merge_state(&mut next, &payload);
        enabled(&next)
    };
    let result = if next_enabled {
        create_or_update_desktop_lyrics(&app, &state, payload)
    } else {
        merge_state(&mut lock(&state.data).lyrics.state, &payload);
        send_desktop_lyrics_state(&app, &state)
    };
    operation_result(result, "DESKTOP_LYRICS_UPDATE_FAILED")
}

#[tauri::command]
pub(crate) fn mineradio_set_wallpaper_enabled(
    app: AppHandle,
    state: State<'_, MineradioOverlayState>,
    enabled: bool,
    payload: Option<Value>,
) -> OverlayOperationResult {
    if let Err(error) = ensure_wallpaper_supported() {
        return OverlayOperationResult::error(error, "WALLPAPER_UNSUPPORTED");
    }
    let _operation = lock(&state.wallpaper_operation);
    let result = if enabled {
        create_or_update_wallpaper(&app, &state, object_payload(payload))
    } else {
        close_wallpaper(&app, &state)
    };
    operation_result(result, "WALLPAPER_FAILED")
}

#[tauri::command]
pub(crate) fn mineradio_update_wallpaper(
    app: AppHandle,
    state: State<'_, MineradioOverlayState>,
    payload: Option<Value>,
) -> OverlayOperationResult {
    if let Err(error) = ensure_wallpaper_supported() {
        return OverlayOperationResult::error(error, "WALLPAPER_UNSUPPORTED");
    }
    let _operation = lock(&state.wallpaper_operation);
    let next_enabled = {
        let mut data = lock(&state.data);
        merge_state(&mut data.wallpaper, &object_payload(payload));
        enabled(&data.wallpaper)
    };
    let result = if next_enabled {
        create_or_update_wallpaper(&app, &state, Map::new())
            .and_then(|()| position_wallpaper(&app))
            .and_then(|()| send_wallpaper_state(&app, &state))
    } else {
        send_wallpaper_state(&app, &state)
    };
    operation_result(result, "WALLPAPER_UPDATE_FAILED")
}

#[tauri::command]
pub(crate) fn mineradio_overlay_set_lyrics_dragging(
    window: WebviewWindow,
    dragging: bool,
) -> OverlayOperationResult {
    let _ = dragging;
    match require_lyrics_window(&window) {
        Ok(()) => OverlayOperationResult::success(),
        Err(error) => OverlayOperationResult::error(error, "DESKTOP_LYRICS_DRAG_FAILED"),
    }
}

#[tauri::command]
pub(crate) fn mineradio_overlay_set_lyrics_pointer_capture(
    window: WebviewWindow,
    state: State<'_, MineradioOverlayState>,
    active: bool,
) -> OverlayOperationResult {
    let _operation = lock(&state.lyrics_operation);
    let result = require_lyrics_window(&window).and_then(|()| {
        lock(&state.data).lyrics.pointer_capture = active;
        apply_desktop_lyrics_mouse_behavior(window.app_handle(), &state)
    });
    operation_result(result, "DESKTOP_LYRICS_POINTER_FAILED")
}

#[tauri::command]
pub(crate) fn mineradio_overlay_set_lyrics_hot_bounds(
    window: WebviewWindow,
    state: State<'_, MineradioOverlayState>,
    bounds: Option<Value>,
) -> OverlayOperationResult {
    let _operation = lock(&state.lyrics_operation);
    let result = require_lyrics_window(&window).map(|()| {
        let bounds = object_payload(bounds);
        let left = clamp_number(bounds.get("left"), -2000.0, 4000.0, 0.0);
        let top = clamp_number(bounds.get("top"), -2000.0, 4000.0, 0.0);
        let right = clamp_number(bounds.get("right"), left + 1.0, 6000.0, left + 1.0);
        let bottom = clamp_number(bounds.get("bottom"), top + 1.0, 6000.0, top + 1.0);
        lock(&state.data).lyrics.hot_bounds = Some(RelativeBounds {
            left,
            top,
            right,
            bottom,
        });
    });
    operation_result(result, "DESKTOP_LYRICS_HOT_BOUNDS_FAILED")
}

#[tauri::command]
pub(crate) fn mineradio_overlay_set_lyrics_lock_state(
    window: WebviewWindow,
    state: State<'_, MineradioOverlayState>,
    locked: bool,
) -> OverlayOperationResult {
    let _operation = lock(&state.lyrics_operation);
    let result = require_lyrics_window(&window).and_then(|()| {
        {
            let mut data = lock(&state.data);
            data.lyrics
                .state
                .insert("clickThrough".to_owned(), Value::Bool(locked));
            if locked {
                data.lyrics.pointer_capture = false;
            }
        }
        apply_desktop_lyrics_mouse_behavior(window.app_handle(), &state)?;
        broadcast_lyrics_lock(window.app_handle(), &state);
        Ok(locked)
    });
    match result {
        Ok(locked) => OverlayOperationResult::success_with_lock(locked),
        Err(error) => OverlayOperationResult::error(error, "DESKTOP_LYRICS_LOCK_FAILED"),
    }
}

#[tauri::command]
pub(crate) fn mineradio_overlay_move_lyrics_by(
    window: WebviewWindow,
    state: State<'_, MineradioOverlayState>,
    dx: f64,
    dy: f64,
) -> OverlayOperationResult {
    let _operation = lock(&state.lyrics_operation);
    let result = require_lyrics_window(&window).and_then(|()| {
        if lyrics_locked(&lock(&state.data).lyrics.state) {
            return Err("DESKTOP_LYRICS_LOCKED".to_owned());
        }
        let bounds = window_bounds(&window)?;
        let next = ScreenRect {
            x: bounds.x + clamp_f64(dx, -160.0, 160.0, 0.0).round() as i32,
            y: bounds.y + clamp_f64(dy, -160.0, 160.0, 0.0).round() as i32,
            ..bounds
        };
        window
            .set_position(PhysicalPosition::new(next.x, next.y))
            .map_err(error_string)?;
        lock(&state.data).lyrics.user_bounds = Some(window_bounds(&window).unwrap_or(next));
        Ok(())
    });
    operation_result(result, "DESKTOP_LYRICS_MOVE_FAILED")
}

fn create_or_update_desktop_lyrics(
    app: &AppHandle,
    state: &MineradioOverlayState,
    payload: Map<String, Value>,
) -> Result<(), String> {
    if state.closing.load(Ordering::Acquire) {
        return Err("DESKTOP_HOST_CLOSING".to_owned());
    }
    let (y_changed, has_user_bounds) = {
        let mut data = lock(&state.data);
        data.lyrics_lease = data.lyrics_lease.wrapping_add(1);
        let previous_state = data.lyrics.state.clone();
        merge_state(&mut data.lyrics.state, &payload);
        data.lyrics
            .state
            .insert("enabled".to_owned(), Value::Bool(true));
        let changed = desktop_lyrics_y_changed(&previous_state, &payload, &data.lyrics.state);
        if changed {
            data.lyrics.user_bounds = None;
        }
        (changed, data.lyrics.user_bounds.is_some())
    };

    if let Some(window) = app.get_webview_window(DESKTOP_LYRICS_LABEL) {
        let result = (|| {
            if y_changed {
                position_desktop_lyrics(app, state, true)?;
            }
            apply_desktop_lyrics_mouse_behavior(app, state)?;
            window.show().map_err(error_string)?;
            start_pointer_poller(app, state);
            send_desktop_lyrics_state(app, state)
        })();
        if result.is_err() {
            set_lyrics_enabled(state, false);
        }
        return result;
    }

    let bounds = desired_desktop_lyrics_bounds(app, state, y_changed || !has_user_bounds)?;
    mark_programmatic_move(state);
    let window = match WebviewWindowBuilder::new(
        app,
        DESKTOP_LYRICS_LABEL,
        WebviewUrl::App(DESKTOP_LYRICS_ASSET.into()),
    )
    .title("Mineradio Desktop Lyrics")
    .inner_size(bounds.width as f64, bounds.height as f64)
    .position(bounds.x as f64, bounds.y as f64)
    .decorations(false)
    .transparent(true)
    .background_color(Color(0, 0, 0, 0))
    .shadow(false)
    .resizable(false)
    .focusable(false)
    .skip_taskbar(true)
    .visible(false)
    .background_throttling(BackgroundThrottlingPolicy::Disabled)
    .initialization_script(overlay_bridge_script())
    .on_page_load(|window, payload| {
        if payload.event() == PageLoadEvent::Finished {
            let app = window.app_handle();
            let state = app.state::<MineradioOverlayState>();
            if !enabled(&lock(&state.data).lyrics.state) {
                return;
            }
            let _ = apply_desktop_lyrics_mouse_behavior(app, &state);
            let _ = window.show();
            let _ = send_desktop_lyrics_state(app, &state);
        }
    })
    .build()
    {
        Ok(window) => window,
        Err(error) => {
            set_lyrics_enabled(state, false);
            return Err(error_string(error));
        }
    };

    let _ = window.set_always_on_top(true);
    let _ = window.set_visible_on_all_workspaces(true);

    if state.closing.load(Ordering::Acquire) {
        set_lyrics_enabled(state, false);
        let _ = window.destroy();
        return Err("DESKTOP_HOST_CLOSING".to_owned());
    }

    if let Err(error) = apply_desktop_lyrics_mouse_behavior(app, state) {
        set_lyrics_enabled(state, false);
        let _ = window.destroy();
        return Err(error);
    }
    start_pointer_poller(app, state);
    Ok(())
}

fn create_or_update_wallpaper(
    app: &AppHandle,
    state: &MineradioOverlayState,
    payload: Map<String, Value>,
) -> Result<(), String> {
    ensure_wallpaper_supported()?;
    if state.closing.load(Ordering::Acquire) {
        return Err("DESKTOP_HOST_CLOSING".to_owned());
    }
    {
        let mut data = lock(&state.data);
        data.wallpaper_lease = data.wallpaper_lease.wrapping_add(1);
        merge_state(&mut data.wallpaper, &payload);
        data.wallpaper
            .insert("enabled".to_owned(), Value::Bool(true));
    }

    if let Some(window) = app.get_webview_window(WALLPAPER_LABEL) {
        let result = position_wallpaper(app)
            .and_then(|()| attach_wallpaper_to_desktop(&window))
            .and_then(|()| window.show().map_err(error_string))
            .and_then(|()| send_wallpaper_state(app, state));
        if result.is_err() {
            set_wallpaper_enabled(state, false);
            let _ = window.destroy();
        }
        return result;
    }

    let bounds = primary_monitor_bounds(app)?;
    let window = match WebviewWindowBuilder::new(
        app,
        WALLPAPER_LABEL,
        WebviewUrl::App(WALLPAPER_ASSET.into()),
    )
    .title("Mineradio Wallpaper")
    .inner_size(bounds.width as f64, bounds.height as f64)
    .position(bounds.x as f64, bounds.y as f64)
    .decorations(false)
    .transparent(false)
    .background_color(Color(5, 6, 8, 255))
    .shadow(false)
    .resizable(false)
    .focusable(false)
    .skip_taskbar(true)
    .visible(false)
    .background_throttling(BackgroundThrottlingPolicy::Disabled)
    .initialization_script(overlay_bridge_script())
    .on_page_load(|window, payload| {
        if payload.event() == PageLoadEvent::Finished {
            let app = window.app_handle();
            let state = app.state::<MineradioOverlayState>();
            if !enabled(&lock(&state.data).wallpaper) {
                return;
            }
            let _ = position_wallpaper(app);
            let _ = window.show();
            let _ = send_wallpaper_state(app, &state);
        }
    })
    .build()
    {
        Ok(window) => window,
        Err(error) => {
            set_wallpaper_enabled(state, false);
            return Err(error_string(error));
        }
    };
    if state.closing.load(Ordering::Acquire) {
        set_wallpaper_enabled(state, false);
        let _ = window.destroy();
        return Err("DESKTOP_HOST_CLOSING".to_owned());
    }
    if let Err(error) = window
        .set_ignore_cursor_events(true)
        .map_err(error_string)
        .and_then(|()| position_wallpaper(app))
        .and_then(|()| attach_wallpaper_to_desktop(&window))
    {
        set_wallpaper_enabled(state, false);
        let _ = window.destroy();
        return Err(error);
    }
    if let Err(error) = window.show().map_err(error_string) {
        set_wallpaper_enabled(state, false);
        let _ = window.destroy();
        return Err(error);
    }
    Ok(())
}

fn close_desktop_lyrics(app: &AppHandle, state: &MineradioOverlayState) -> Result<(), String> {
    let lease = {
        let mut data = lock(&state.data);
        data.lyrics_lease = data.lyrics_lease.wrapping_add(1);
        data.lyrics
            .state
            .insert("enabled".to_owned(), Value::Bool(false));
        data.lyrics.pointer_capture = false;
        data.lyrics.mouse_ignored = None;
        data.lyrics.hot_bounds = None;
        data.lyrics_lease
    };
    stop_pointer_poller(state);
    let _ = send_desktop_lyrics_state(app, state);
    if let Some(window) = app.get_webview_window(DESKTOP_LYRICS_LABEL) {
        window.hide().map_err(error_string)?;
        if state.closing.load(Ordering::Acquire) {
            window.destroy().map_err(error_string)?;
        } else {
            schedule_overlay_destroy(app.clone(), OverlayKind::Lyrics, lease);
        }
    }
    broadcast_lyrics_enabled(app, false);
    Ok(())
}

fn close_wallpaper(app: &AppHandle, state: &MineradioOverlayState) -> Result<(), String> {
    let lease = {
        let mut data = lock(&state.data);
        data.wallpaper_lease = data.wallpaper_lease.wrapping_add(1);
        data.wallpaper
            .insert("enabled".to_owned(), Value::Bool(false));
        data.wallpaper_lease
    };
    let _ = send_wallpaper_state(app, state);
    if let Some(window) = app.get_webview_window(WALLPAPER_LABEL) {
        window.hide().map_err(error_string)?;
        if state.closing.load(Ordering::Acquire) {
            window.destroy().map_err(error_string)?;
        } else {
            schedule_overlay_destroy(app.clone(), OverlayKind::Wallpaper, lease);
        }
    }
    Ok(())
}

fn set_lyrics_enabled(state: &MineradioOverlayState, value: bool) {
    lock(&state.data)
        .lyrics
        .state
        .insert("enabled".to_owned(), Value::Bool(value));
}

fn set_wallpaper_enabled(state: &MineradioOverlayState, value: bool) {
    lock(&state.data)
        .wallpaper
        .insert("enabled".to_owned(), Value::Bool(value));
}

fn schedule_overlay_destroy(app: AppHandle, kind: OverlayKind, lease: u64) {
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(40));
        let state = app.state::<MineradioOverlayState>();
        match kind {
            OverlayKind::Lyrics => {
                let _operation = lock(&state.lyrics_operation);
                let should_destroy = {
                    let data = lock(&state.data);
                    overlay_destroy_eligible(&data, OverlayKind::Lyrics, lease)
                };
                if should_destroy {
                    if let Some(window) = app.get_webview_window(DESKTOP_LYRICS_LABEL) {
                        let _ = window.destroy();
                    }
                }
            }
            OverlayKind::Wallpaper => {
                let _operation = lock(&state.wallpaper_operation);
                let should_destroy = {
                    let data = lock(&state.data);
                    overlay_destroy_eligible(&data, OverlayKind::Wallpaper, lease)
                };
                if should_destroy {
                    if let Some(window) = app.get_webview_window(WALLPAPER_LABEL) {
                        let _ = window.destroy();
                    }
                }
            }
        }
    });
}

fn overlay_destroy_eligible(data: &OverlayData, kind: OverlayKind, lease: u64) -> bool {
    match kind {
        OverlayKind::Lyrics => data.lyrics_lease == lease && !enabled(&data.lyrics.state),
        OverlayKind::Wallpaper => data.wallpaper_lease == lease && !enabled(&data.wallpaper),
    }
}

#[cfg(windows)]
fn ensure_wallpaper_supported() -> Result<(), String> {
    Ok(())
}

#[cfg(not(windows))]
fn ensure_wallpaper_supported() -> Result<(), String> {
    Err("WALLPAPER_UNSUPPORTED_ON_THIS_PLATFORM".to_owned())
}

pub(crate) fn close_all(app: &AppHandle) {
    let state = app.state::<MineradioOverlayState>();
    state.closing.store(true, Ordering::Release);
    {
        let _operation = lock(&state.lyrics_operation);
        let _ = close_desktop_lyrics(app, &state);
    }
    {
        let _operation = lock(&state.wallpaper_operation);
        let _ = close_wallpaper(app, &state);
    }
}

pub(crate) fn handle_run_event(app: &AppHandle, event: &RunEvent) {
    match event {
        RunEvent::ExitRequested { .. } => close_all(app),
        RunEvent::MainEventsCleared => refresh_monitor_layout_if_needed(app),
        RunEvent::WindowEvent { label, event, .. } => match (label.as_str(), event) {
            ("main", WindowEvent::Destroyed) => close_all(app),
            ("main", WindowEvent::Focused(true)) => app
                .state::<MineradioOverlayState>()
                .closing
                .store(false, Ordering::Release),
            (DESKTOP_LYRICS_LABEL, WindowEvent::Moved(_)) => remember_desktop_lyrics_bounds(app),
            (DESKTOP_LYRICS_LABEL, WindowEvent::Destroyed) => {
                // A stale close may finish after a newer enable has already
                // created the replacement label. Never let the old Destroyed
                // event revoke that newer lease.
                if app.get_webview_window(DESKTOP_LYRICS_LABEL).is_none() {
                    let state = app.state::<MineradioOverlayState>();
                    set_lyrics_enabled(&state, false);
                    lock(&state.data).lyrics.mouse_ignored = None;
                    stop_pointer_poller(&state);
                    broadcast_lyrics_enabled(app, false);
                }
            }
            (WALLPAPER_LABEL, WindowEvent::Destroyed) => {
                if app.get_webview_window(WALLPAPER_LABEL).is_none() {
                    set_wallpaper_enabled(&app.state::<MineradioOverlayState>(), false);
                }
            }
            (_, WindowEvent::ScaleFactorChanged { .. }) => {
                let _ = reposition_open_overlays(app);
            }
            _ => {}
        },
        _ => {}
    }
}

fn operation_result(result: Result<(), String>, fallback: &'static str) -> OverlayOperationResult {
    match result {
        Ok(()) => OverlayOperationResult::success(),
        Err(error) => OverlayOperationResult::error(error, fallback),
    }
}

fn overlay_bridge_script() -> String {
    format!(
        "window.__kernelonMineradioWindowOpacitySupported = {};\n{OVERLAY_BRIDGE_SCRIPT}",
        cfg!(any(target_os = "windows", target_os = "macos"))
    )
}

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn object_payload(payload: Option<Value>) -> Map<String, Value> {
    match payload {
        Some(Value::Object(object)) => object,
        _ => Map::new(),
    }
}

fn merge_state(target: &mut Map<String, Value>, payload: &Map<String, Value>) {
    for (key, value) in payload {
        target.insert(key.clone(), value.clone());
    }
}

fn enabled(state: &Map<String, Value>) -> bool {
    state.get("enabled").and_then(Value::as_bool) == Some(true)
}

fn lyrics_locked(state: &Map<String, Value>) -> bool {
    state.get("clickThrough").and_then(Value::as_bool) != Some(false)
}

fn desktop_lyrics_y_changed(
    previous: &Map<String, Value>,
    payload: &Map<String, Value>,
    next: &Map<String, Value>,
) -> bool {
    if !payload.contains_key("y") {
        return false;
    }
    let Some(previous_y) = finite_number(previous.get("y")) else {
        return false;
    };
    let next_y = clamp_number(next.get("y"), 0.08, 0.92, 0.76);
    (next_y - clamp_f64(previous_y, 0.08, 0.92, 0.76)).abs() > 0.001
}

fn finite_number(value: Option<&Value>) -> Option<f64> {
    match value {
        Some(Value::Number(number)) => number.as_f64().filter(|number| number.is_finite()),
        Some(Value::String(number)) => number
            .trim()
            .parse::<f64>()
            .ok()
            .filter(|number| number.is_finite()),
        Some(Value::Bool(value)) => Some(if *value { 1.0 } else { 0.0 }),
        _ => None,
    }
}

fn clamp_number(value: Option<&Value>, min: f64, max: f64, fallback: f64) -> f64 {
    clamp_f64(finite_number(value).unwrap_or(fallback), min, max, fallback)
}

fn clamp_f64(value: f64, min: f64, max: f64, fallback: f64) -> f64 {
    if value.is_finite() {
        value.max(min).min(max)
    } else {
        fallback
    }
}

fn error_string(error: impl ToString) -> String {
    error.to_string()
}

fn require_lyrics_window(window: &WebviewWindow) -> Result<(), String> {
    if window.label() == DESKTOP_LYRICS_LABEL {
        Ok(())
    } else {
        Err("INVALID_DESKTOP_LYRICS_WINDOW".to_owned())
    }
}

fn window_bounds(window: &WebviewWindow) -> Result<ScreenRect, String> {
    let position = window.outer_position().map_err(error_string)?;
    let size = window.outer_size().map_err(error_string)?;
    Ok(ScreenRect {
        x: position.x,
        y: position.y,
        width: size.width as i32,
        height: size.height as i32,
    })
}

fn monitor_bounds(monitor: &Monitor) -> ScreenRect {
    ScreenRect {
        x: monitor.position().x,
        y: monitor.position().y,
        width: monitor.size().width as i32,
        height: monitor.size().height as i32,
    }
}

fn primary_monitor_bounds(app: &AppHandle) -> Result<ScreenRect, String> {
    app.primary_monitor()
        .map_err(error_string)?
        .as_ref()
        .map(monitor_bounds)
        .ok_or_else(|| "NO_PRIMARY_DISPLAY".to_owned())
}

fn matching_monitor_bounds(app: &AppHandle, bounds: ScreenRect) -> Result<ScreenRect, String> {
    let monitors = app
        .available_monitors()
        .map_err(error_string)?
        .iter()
        .map(monitor_bounds)
        .collect::<Vec<_>>();
    if let Some(monitor) = monitor_with_largest_intersection(bounds, &monitors) {
        return Ok(monitor);
    }
    let center_x = bounds.x as f64 + bounds.width as f64 / 2.0;
    let center_y = bounds.y as f64 + bounds.height as f64 / 2.0;
    Ok(app
        .monitor_from_point(center_x, center_y)
        .map_err(error_string)?
        .as_ref()
        .map(monitor_bounds)
        .unwrap_or(primary_monitor_bounds(app)?))
}

fn monitor_with_largest_intersection(
    bounds: ScreenRect,
    monitors: &[ScreenRect],
) -> Option<ScreenRect> {
    monitors
        .iter()
        .copied()
        .map(|monitor| {
            let width =
                (bounds.x + bounds.width).min(monitor.x + monitor.width) - bounds.x.max(monitor.x);
            let height = (bounds.y + bounds.height).min(monitor.y + monitor.height)
                - bounds.y.max(monitor.y);
            (monitor, width.max(0) as i64 * height.max(0) as i64)
        })
        .filter(|(_, area)| *area > 0)
        .max_by_key(|(_, area)| *area)
        .map(|(monitor, _)| monitor)
}

fn default_desktop_lyrics_bounds(monitor: ScreenRect, state: &Map<String, Value>) -> ScreenRect {
    let y_ratio = clamp_number(state.get("y"), 0.08, 0.92, 0.76);
    let width = (880.0_f64.max(monitor.width as f64 * 0.72))
        .min((monitor.width - 96) as f64)
        .round() as i32;
    let height = (340.0_f64.max(monitor.height as f64 * 0.38))
        .min(560.0)
        .min((monitor.height - 96) as f64)
        .round() as i32;
    ScreenRect {
        x: monitor.x + ((monitor.width - width) as f64 / 2.0).round() as i32,
        y: monitor.y + (monitor.height as f64 * y_ratio - height as f64 / 2.0).round() as i32,
        width,
        height,
    }
}

fn constrain_desktop_lyrics_bounds(bounds: ScreenRect, monitor: ScreenRect) -> ScreenRect {
    let width = bounds.width.max(320).min(monitor.width);
    let height = bounds.height.max(180).min(monitor.height);
    let max_x = monitor.x + (monitor.width - width).max(0);
    let max_y = monitor.y + (monitor.height - height).max(0);
    ScreenRect {
        x: bounds.x.max(monitor.x).min(max_x),
        y: bounds.y.max(monitor.y).min(max_y),
        width,
        height,
    }
}

fn desired_desktop_lyrics_bounds(
    app: &AppHandle,
    state: &MineradioOverlayState,
    force: bool,
) -> Result<ScreenRect, String> {
    let (manual, lyrics_state) = {
        let data = lock(&state.data);
        (data.lyrics.user_bounds, data.lyrics.state.clone())
    };
    let desired = if !force {
        manual.unwrap_or_else(|| ScreenRect::default())
    } else {
        ScreenRect::default()
    };
    if !force && manual.is_some() {
        let monitor = matching_monitor_bounds(app, desired)?;
        Ok(constrain_desktop_lyrics_bounds(desired, monitor))
    } else {
        let monitor = manual
            .map(|bounds| matching_monitor_bounds(app, bounds))
            .transpose()?
            .unwrap_or(primary_monitor_bounds(app)?);
        Ok(constrain_desktop_lyrics_bounds(
            default_desktop_lyrics_bounds(monitor, &lyrics_state),
            monitor,
        ))
    }
}

fn mark_programmatic_move(state: &MineradioOverlayState) {
    lock(&state.data).lyrics.programmatic_move_until =
        Some(Instant::now() + Duration::from_millis(120));
}

fn set_window_bounds(
    window: &WebviewWindow,
    state: &MineradioOverlayState,
    bounds: ScreenRect,
) -> Result<(), String> {
    if window_bounds(window).ok() == Some(bounds) {
        return Ok(());
    }
    mark_programmatic_move(state);
    window
        .set_size(PhysicalSize::new(bounds.width as u32, bounds.height as u32))
        .map_err(error_string)?;
    window
        .set_position(PhysicalPosition::new(bounds.x, bounds.y))
        .map_err(error_string)
}

fn position_desktop_lyrics(
    app: &AppHandle,
    state: &MineradioOverlayState,
    force: bool,
) -> Result<(), String> {
    let Some(window) = app.get_webview_window(DESKTOP_LYRICS_LABEL) else {
        return Ok(());
    };
    let bounds = desired_desktop_lyrics_bounds(app, state, force)?;
    set_window_bounds(&window, state, bounds)
}

fn position_wallpaper(app: &AppHandle) -> Result<(), String> {
    let Some(window) = app.get_webview_window(WALLPAPER_LABEL) else {
        return Ok(());
    };
    let bounds = primary_monitor_bounds(app)?;
    window
        .set_size(PhysicalSize::new(bounds.width as u32, bounds.height as u32))
        .map_err(error_string)?;
    window
        .set_position(PhysicalPosition::new(bounds.x, bounds.y))
        .map_err(error_string)
}

fn remember_desktop_lyrics_bounds(app: &AppHandle) {
    let state = app.state::<MineradioOverlayState>();
    let programmatic = lock(&state.data)
        .lyrics
        .programmatic_move_until
        .map(|until| Instant::now() <= until)
        .unwrap_or(false);
    if programmatic {
        return;
    }
    if let Some(window) = app.get_webview_window(DESKTOP_LYRICS_LABEL) {
        if let Ok(bounds) = window_bounds(&window) {
            lock(&state.data).lyrics.user_bounds = Some(bounds);
        }
    }
}

fn apply_desktop_lyrics_mouse_behavior(
    app: &AppHandle,
    state: &MineradioOverlayState,
) -> Result<(), String> {
    let Some(window) = app.get_webview_window(DESKTOP_LYRICS_LABEL) else {
        return Ok(());
    };
    let should_ignore = {
        let mut data = lock(&state.data);
        let should_ignore = lyrics_locked(&data.lyrics.state) || !data.lyrics.pointer_capture;
        if data.lyrics.mouse_ignored == Some(should_ignore) {
            return Ok(());
        }
        data.lyrics.mouse_ignored = Some(should_ignore);
        should_ignore
    };
    window
        .set_ignore_cursor_events(should_ignore)
        .map_err(error_string)
}

fn send_overlay_state(
    app: &AppHandle,
    label: &'static str,
    channel: &'static str,
    payload: Map<String, Value>,
) -> Result<(), String> {
    let Some(window) = app.get_webview_window(label) else {
        return Ok(());
    };
    let json = serde_json::to_string(&Value::Object(payload)).map_err(error_string)?;
    window
        .eval(&format!(
            "window.__kernelonMineradioOverlayDispatch && window.__kernelonMineradioOverlayDispatch('{channel}', {json});"
        ))
        .map_err(error_string)
}

fn send_desktop_lyrics_state(app: &AppHandle, state: &MineradioOverlayState) -> Result<(), String> {
    let payload = lock(&state.data).lyrics.state.clone();
    send_overlay_state(app, DESKTOP_LYRICS_LABEL, "lyrics", payload)
}

fn send_wallpaper_state(app: &AppHandle, state: &MineradioOverlayState) -> Result<(), String> {
    let payload = lock(&state.data).wallpaper.clone();
    send_overlay_state(app, WALLPAPER_LABEL, "wallpaper", payload)
}

fn broadcast_lyrics_lock(app: &AppHandle, state: &MineradioOverlayState) {
    let locked = lyrics_locked(&lock(&state.data).lyrics.state);
    let _ = app.emit_to(
        "main",
        DESKTOP_LYRICS_LOCK_EVENT,
        LyricsLockState { locked },
    );
    let _ = send_desktop_lyrics_state(app, state);
}

fn broadcast_lyrics_enabled(app: &AppHandle, enabled: bool) {
    let _ = app.emit_to(
        "main",
        DESKTOP_LYRICS_ENABLED_EVENT,
        LyricsEnabledState { enabled },
    );
}

fn start_pointer_poller(app: &AppHandle, state: &MineradioOverlayState) {
    let mut poller = lock(&state.pointer_poller);
    if poller.is_some() {
        return;
    }
    let cancel = Arc::new(AtomicBool::new(false));
    let thread_cancel = cancel.clone();
    let app = app.clone();
    let thread = thread::spawn(move || {
        let mut last_forwarded_position: Option<(i32, i32, i32, i32)> = None;
        let mut forwarded_inside = false;
        #[cfg(windows)]
        let mut middle_was_down = false;

        while !thread_cancel.load(Ordering::Acquire) {
            let Some(window) = app.get_webview_window(DESKTOP_LYRICS_LABEL) else {
                break;
            };
            let cursor = window.cursor_position().ok();
            let bounds = window_bounds(&window).ok();
            let ignored = {
                let state = app.state::<MineradioOverlayState>();
                let ignored = lock(&state.data).lyrics.mouse_ignored.unwrap_or(true);
                ignored
            };

            if let (Some(cursor), Some(bounds)) = (cursor, bounds) {
                let screen_x = cursor.x.round() as i32;
                let screen_y = cursor.y.round() as i32;
                let client_x = screen_x - bounds.x;
                let client_y = screen_y - bounds.y;
                let inside = client_x >= 0
                    && client_x <= bounds.width
                    && client_y >= 0
                    && client_y <= bounds.height;

                if ignored {
                    if inside {
                        let position = (screen_x, screen_y, bounds.x, bounds.y);
                        if last_forwarded_position != Some(position) {
                            let _ = window.eval(&format!(
                                "window.dispatchEvent(new MouseEvent('mousemove',{{clientX:{client_x},clientY:{client_y},screenX:{screen_x},screenY:{screen_y},bubbles:true}}));"
                            ));
                            last_forwarded_position = Some(position);
                        }
                        forwarded_inside = true;
                    } else if forwarded_inside {
                        let _ = window.eval("window.dispatchEvent(new MouseEvent('mouseleave')); ");
                        last_forwarded_position = None;
                        forwarded_inside = false;
                    }
                } else {
                    last_forwarded_position = None;
                    forwarded_inside = false;
                }

                #[cfg(windows)]
                {
                    let middle_down = unsafe {
                        windows_sys::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState(4)
                            & i16::MIN
                            != 0
                    };
                    if middle_down && !middle_was_down {
                        handle_global_middle_click(&app, screen_x, screen_y);
                    }
                    middle_was_down = middle_down;
                }
            }
            thread::sleep(Duration::from_millis(24));
        }
    });
    *poller = Some(PointerPoller { cancel, thread });
}

fn stop_pointer_poller(state: &MineradioOverlayState) {
    let Some(poller) = lock(&state.pointer_poller).take() else {
        return;
    };
    poller.cancel.store(true, Ordering::Release);
    if poller.thread.is_finished() {
        let _ = poller.thread.join();
    } else {
        thread::spawn(move || {
            let _ = poller.thread.join();
        });
    }
}

#[cfg(windows)]
fn handle_global_middle_click(app: &AppHandle, screen_x: i32, screen_y: i32) {
    let Some(window) = app.get_webview_window(DESKTOP_LYRICS_LABEL) else {
        return;
    };
    let Ok(window_bounds) = window_bounds(&window) else {
        return;
    };
    let state = app.state::<MineradioOverlayState>();
    let changed = {
        let _operation = lock(&state.lyrics_operation);
        let mut data = lock(&state.data);
        if !enabled(&data.lyrics.state) {
            return;
        }
        let now = Instant::now();
        if data
            .lyrics
            .last_middle_click
            .map(|last| now.duration_since(last) < Duration::from_millis(260))
            .unwrap_or(false)
        {
            return;
        }
        let hot = data
            .lyrics
            .hot_bounds
            .map(|relative| ScreenRect {
                x: window_bounds.x + relative.left.round() as i32,
                y: window_bounds.y + relative.top.round() as i32,
                width: (relative.right - relative.left).max(1.0).round() as i32,
                height: (relative.bottom - relative.top).max(1.0).round() as i32,
            })
            .unwrap_or(window_bounds);
        if !point_in_bounds(screen_x, screen_y, hot) {
            return;
        }
        data.lyrics.last_middle_click = Some(now);
        let next_locked = !lyrics_locked(&data.lyrics.state);
        data.lyrics
            .state
            .insert("clickThrough".to_owned(), Value::Bool(next_locked));
        data.lyrics.pointer_capture = !next_locked;
        true
    };
    if changed {
        let _ = apply_desktop_lyrics_mouse_behavior(app, &state);
        broadcast_lyrics_lock(app, &state);
    }
}

fn point_in_bounds(x: i32, y: i32, bounds: ScreenRect) -> bool {
    x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height
}

fn monitor_signature(app: &AppHandle) -> Result<Vec<ScreenRect>, String> {
    let mut monitors = app
        .available_monitors()
        .map_err(error_string)?
        .iter()
        .map(monitor_bounds)
        .collect::<Vec<_>>();
    monitors.sort_by_key(|bounds| (bounds.x, bounds.y, bounds.width, bounds.height));
    Ok(monitors)
}

fn refresh_monitor_layout_if_needed(app: &AppHandle) {
    let state = app.state::<MineradioOverlayState>();
    {
        let mut data = lock(&state.data);
        let now = Instant::now();
        if data
            .monitor_checked_at
            .map(|last| now.duration_since(last) < Duration::from_millis(500))
            .unwrap_or(false)
        {
            return;
        }
        data.monitor_checked_at = Some(now);
    }
    let Ok(signature) = monitor_signature(app) else {
        return;
    };
    let changed = {
        let mut data = lock(&state.data);
        if data.monitor_signature == signature {
            false
        } else {
            data.monitor_signature = signature;
            true
        }
    };
    if changed {
        let _ = reposition_open_overlays(app);
    }
}

fn reposition_open_overlays(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<MineradioOverlayState>();
    position_desktop_lyrics(app, &state, false)?;
    position_wallpaper(app)
}

#[cfg(windows)]
fn attach_wallpaper_to_desktop(window: &WebviewWindow) -> Result<(), String> {
    use std::{ffi::c_void, ptr};
    use windows_sys::core::BOOL;
    use windows_sys::Win32::{
        Foundation::{GetLastError, SetLastError, HWND, LPARAM},
        UI::WindowsAndMessaging::{
            EnumWindows, FindWindowExW, FindWindowW, SendMessageTimeoutW, SetParent, SetWindowPos,
        },
    };

    unsafe extern "system" fn find_worker(top: HWND, parameter: LPARAM) -> BOOL {
        const SHELL_VIEW: &[u16] = &[
            b'S' as u16,
            b'H' as u16,
            b'E' as u16,
            b'L' as u16,
            b'L' as u16,
            b'D' as u16,
            b'L' as u16,
            b'L' as u16,
            b'_' as u16,
            b'D' as u16,
            b'e' as u16,
            b'f' as u16,
            b'V' as u16,
            b'i' as u16,
            b'e' as u16,
            b'w' as u16,
            0,
        ];
        const WORKER_W: &[u16] = &[
            b'W' as u16,
            b'o' as u16,
            b'r' as u16,
            b'k' as u16,
            b'e' as u16,
            b'r' as u16,
            b'W' as u16,
            0,
        ];
        if !FindWindowExW(top, ptr::null_mut(), SHELL_VIEW.as_ptr(), ptr::null()).is_null() {
            let worker = FindWindowExW(ptr::null_mut(), top, WORKER_W.as_ptr(), ptr::null());
            if !worker.is_null() {
                *(parameter as *mut HWND) = worker;
            }
        }
        1
    }

    const PROGMAN: &[u16] = &[
        b'P' as u16,
        b'r' as u16,
        b'o' as u16,
        b'g' as u16,
        b'm' as u16,
        b'a' as u16,
        b'n' as u16,
        0,
    ];
    let target = window.hwnd().map_err(error_string)?.0 as *mut c_void;
    let progman = unsafe { FindWindowW(PROGMAN.as_ptr(), ptr::null()) };
    if progman.is_null() {
        return Err("WINDOWS_PROGMAN_NOT_FOUND".to_owned());
    }
    let mut message_result = 0usize;
    unsafe {
        SendMessageTimeoutW(progman, 0x052c, 0, 0, 0, 1000, &mut message_result);
    }
    let mut worker: HWND = ptr::null_mut();
    unsafe {
        EnumWindows(Some(find_worker), &mut worker as *mut HWND as LPARAM);
    }
    if worker.is_null() {
        worker = progman;
    }
    unsafe {
        SetLastError(0);
        let previous_parent = SetParent(target, worker);
        let parent_error = GetLastError();
        if previous_parent.is_null() && parent_error != 0 {
            return Err(format!("WINDOWS_SET_PARENT_FAILED:{parent_error}"));
        }
        if SetWindowPos(target, ptr::null_mut(), 0, 0, 0, 0, 0x0013) == 0 {
            return Err(format!("WINDOWS_SET_WINDOW_POS_FAILED:{}", GetLastError()));
        }
    }
    Ok(())
}

#[cfg(not(windows))]
fn attach_wallpaper_to_desktop(_window: &WebviewWindow) -> Result<(), String> {
    Err("WALLPAPER_UNSUPPORTED_ON_THIS_PLATFORM".to_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn desktop_lyrics_bounds_match_owned_source_defaults_and_constraints() {
        let monitor = ScreenRect {
            x: -1920,
            y: 0,
            width: 1920,
            height: 1080,
        };
        let mut state = Map::new();
        state.insert("y".to_owned(), Value::from(0.76));
        assert_eq!(
            default_desktop_lyrics_bounds(monitor, &state),
            ScreenRect {
                x: -1651,
                y: 616,
                width: 1382,
                height: 410,
            }
        );
        assert_eq!(
            monitor_with_largest_intersection(
                ScreenRect {
                    x: -200,
                    y: 100,
                    width: 800,
                    height: 500,
                },
                &[
                    ScreenRect {
                        x: -1920,
                        y: 0,
                        width: 1920,
                        height: 1080,
                    },
                    ScreenRect {
                        x: 0,
                        y: 0,
                        width: 1920,
                        height: 1080,
                    },
                ],
            ),
            Some(ScreenRect {
                x: 0,
                y: 0,
                width: 1920,
                height: 1080,
            })
        );
        assert_eq!(
            constrain_desktop_lyrics_bounds(
                ScreenRect {
                    x: -3000,
                    y: 1200,
                    width: 200,
                    height: 100,
                },
                monitor,
            ),
            ScreenRect {
                x: -1920,
                y: 900,
                width: 320,
                height: 180,
            }
        );
    }

    #[test]
    fn state_merge_and_lock_defaults_match_javascript_semantics() {
        let mut state = Map::new();
        assert!(lyrics_locked(&state));
        merge_state(
            &mut state,
            &serde_json::from_value(serde_json::json!({
                "enabled": true,
                "clickThrough": false,
                "colors": { "primary": "#fff" }
            }))
            .unwrap(),
        );
        assert!(enabled(&state));
        assert!(!lyrics_locked(&state));
        merge_state(
            &mut state,
            &serde_json::from_value(serde_json::json!({
                "colors": { "primary": "#000" }
            }))
            .unwrap(),
        );
        assert_eq!(state["colors"]["primary"], "#000");

        let previous = serde_json::from_value(serde_json::json!({ "y": 0.76 })).unwrap();
        let payload = serde_json::from_value(serde_json::json!({ "y": 0.4 })).unwrap();
        let next = serde_json::from_value(serde_json::json!({ "y": 0.4 })).unwrap();
        assert!(desktop_lyrics_y_changed(&previous, &payload, &next));
        assert!(!desktop_lyrics_y_changed(&Map::new(), &payload, &next));
    }

    #[test]
    fn hot_bounds_and_move_clamps_keep_source_limits() {
        assert_eq!(clamp_f64(800.0, -160.0, 160.0, 0.0), 160.0);
        assert_eq!(clamp_f64(-800.0, -160.0, 160.0, 0.0), -160.0);
        assert!(point_in_bounds(
            150,
            130,
            ScreenRect {
                x: 100,
                y: 100,
                width: 100,
                height: 60,
            }
        ));
    }

    #[test]
    fn operation_and_event_payloads_preserve_wire_contracts() {
        assert_eq!(
            serde_json::to_value(OverlayOperationResult::success_with_lock(false)).unwrap(),
            serde_json::json!({ "ok": true, "locked": false })
        );
        assert_eq!(
            serde_json::to_value(LyricsLockState { locked: true }).unwrap(),
            serde_json::json!({ "locked": true })
        );
        assert_eq!(
            serde_json::to_value(LyricsEnabledState { enabled: false }).unwrap(),
            serde_json::json!({ "enabled": false })
        );
    }

    #[test]
    fn stale_close_leases_cannot_destroy_immediately_reenabled_overlays() {
        let mut data = OverlayData::default();
        data.lyrics_lease = 7;
        data.lyrics
            .state
            .insert("enabled".to_owned(), Value::Bool(false));
        assert!(overlay_destroy_eligible(&data, OverlayKind::Lyrics, 7));

        data.lyrics_lease = 8;
        data.lyrics
            .state
            .insert("enabled".to_owned(), Value::Bool(true));
        assert!(!overlay_destroy_eligible(&data, OverlayKind::Lyrics, 7));
        assert!(!overlay_destroy_eligible(&data, OverlayKind::Lyrics, 8));

        data.wallpaper_lease = 12;
        data.wallpaper
            .insert("enabled".to_owned(), Value::Bool(false));
        assert!(overlay_destroy_eligible(&data, OverlayKind::Wallpaper, 12));
        data.wallpaper_lease = 13;
        data.wallpaper
            .insert("enabled".to_owned(), Value::Bool(true));
        assert!(!overlay_destroy_eligible(&data, OverlayKind::Wallpaper, 12));
    }

    #[test]
    fn overlay_bridge_exposes_every_owned_preload_method() {
        for method in [
            "onLyricsState",
            "onWallpaperState",
            "setLyricsDrag",
            "setLyricsPointerCapture",
            "setLyricsHotBounds",
            "setLyricsLockState",
            "moveLyricsBy",
            "closeLyrics",
        ] {
            assert!(OVERLAY_BRIDGE_SCRIPT.contains(method), "missing {method}");
        }
    }
}
