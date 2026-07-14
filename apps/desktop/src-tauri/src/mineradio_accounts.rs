use serde::Serialize;
use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc::{self, Sender},
        Mutex,
    },
    thread,
    time::Duration,
};
use tauri::{
    webview::{Cookie, NewWindowResponse, PageLoadEvent, WebviewWindowBuilder},
    AppHandle, Manager, RunEvent, Url, WebviewUrl, WindowEvent,
};

const NETEASE_LOGIN_LABEL: &str = "mineradio-netease-login";
const NETEASE_CLEAR_LABEL: &str = "mineradio-netease-login-clear";
const NETEASE_LOGIN_URL: &str = "https://music.163.com/#/login";
const QQ_LOGIN_LABEL: &str = "mineradio-qqmusic-login";
const QQ_CLEAR_LABEL: &str = "mineradio-qqmusic-login-clear";
const QQ_LOGIN_URL: &str = "https://y.qq.com/n/ryqq/profile";
const QQ_PLAYER_URL: &str = "https://y.qq.com/n/ryqq/player";
const LOGIN_POLL_INTERVAL: Duration = Duration::from_millis(1_200);

const QQ_LOGIN_COOKIE_PRIORITY: &[&str] = &[
    "uin",
    "qqmusic_uin",
    "wxuin",
    "login_type",
    "qm_keyst",
    "qqmusic_key",
    "p_skey",
    "skey",
    "psrf_qqopenid",
    "psrf_qqunionid",
    "psrf_qqaccess_token",
    "psrf_qqrefresh_token",
    "wxopenid",
    "wxunionid",
    "wxrefresh_token",
    "wxskey",
    "p_uin",
    "ptcz",
    "RK",
];
const NETEASE_LOGIN_COOKIE_PRIORITY: &[&str] = &[
    "MUSIC_U",
    "__csrf",
    "NMTID",
    "MUSIC_A",
    "__remember_me",
    "_ntes_nuid",
    "_ntes_nnid",
    "WEVNSM",
    "WNMCID",
    "JSESSIONID-WYYY",
];

const NETEASE_LOGIN_CLICK_SCRIPT: &str = r#"
setTimeout(() => {
  const docs = [document];
  document.querySelectorAll('iframe').forEach((frame) => {
    try { if (frame.contentDocument) docs.push(frame.contentDocument); } catch (_) {}
  });
  for (const doc of docs) {
    const nodes = Array.from(doc.querySelectorAll('a, button, span, div'));
    const loginNode = nodes.find((node) => {
      const text = (node.textContent || '').trim();
      if (!/登录|立即登录/.test(text)) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (loginNode) { loginNode.click(); return true; }
  }
  return false;
}, 900);
"#;
const QQ_LOGIN_CLICK_SCRIPT: &str = r#"
setTimeout(() => {
  const nodes = Array.from(document.querySelectorAll('a, button, span, div'));
  const loginNode = nodes.find((node) => {
    const text = (node.textContent || '').trim();
    if (!/登录|登陆/.test(text)) return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  if (loginNode) loginNode.click();
}, 700);
"#;

#[derive(Clone, Copy, Eq, PartialEq)]
enum Provider {
    Netease,
    Qq,
}

impl Provider {
    fn clear_label(self) -> &'static str {
        match self {
            Self::Netease => NETEASE_CLEAR_LABEL,
            Self::Qq => QQ_CLEAR_LABEL,
        }
    }

    fn login_label(self) -> &'static str {
        match self {
            Self::Netease => NETEASE_LOGIN_LABEL,
            Self::Qq => QQ_LOGIN_LABEL,
        }
    }

    fn login_url(self) -> &'static str {
        match self {
            Self::Netease => NETEASE_LOGIN_URL,
            Self::Qq => QQ_LOGIN_URL,
        }
    }

    fn profile_name(self) -> &'static str {
        match self {
            Self::Netease => "netease",
            Self::Qq => "qqmusic",
        }
    }

    fn data_store_identifier(self, principal_namespace: &str) -> [u8; 16] {
        stable_profile_identifier(self.profile_name(), principal_namespace)
    }

    fn title(self) -> &'static str {
        match self {
            Self::Netease => "网易云音乐登录",
            Self::Qq => "QQ 音乐登录",
        }
    }
}

#[derive(Default)]
struct ProviderSession {
    active: bool,
    close_check_started: bool,
    principal_namespace: Option<String>,
    waiters: Vec<Sender<MineradioLoginResult>>,
}

fn attach_login_waiter(
    session: &mut ProviderSession,
    sender: Sender<MineradioLoginResult>,
    principal_namespace: &str,
) -> Result<bool, &'static str> {
    if session.active && session.principal_namespace.as_deref() != Some(principal_namespace) {
        return Err("MINERADIO_LOGIN_PRINCIPAL_CHANGED");
    }
    session.waiters.push(sender);
    if session.active {
        Ok(false)
    } else {
        session.active = true;
        session.close_check_started = false;
        session.principal_namespace = Some(principal_namespace.to_owned());
        Ok(true)
    }
}

fn begin_close_check(session: &mut ProviderSession) -> (bool, bool) {
    if !session.active {
        (false, false)
    } else if session.close_check_started {
        (true, false)
    } else {
        session.close_check_started = true;
        (true, true)
    }
}

fn settle_session(session: &mut ProviderSession) -> Option<Vec<Sender<MineradioLoginResult>>> {
    if !session.active {
        return None;
    }
    session.active = false;
    session.close_check_started = false;
    session.principal_namespace = None;
    Some(std::mem::take(&mut session.waiters))
}

#[derive(Default)]
pub(crate) struct MineradioAccountState {
    netease: Mutex<ProviderSession>,
    netease_clear: Mutex<()>,
    qq: Mutex<ProviderSession>,
    qq_clear: Mutex<()>,
    shutting_down: AtomicBool,
}

impl MineradioAccountState {
    fn session(&self, provider: Provider) -> &Mutex<ProviderSession> {
        match provider {
            Provider::Netease => &self.netease,
            Provider::Qq => &self.qq,
        }
    }

    fn clear_lock(&self, provider: Provider) -> &Mutex<()> {
        match provider {
            Provider::Netease => &self.netease_clear,
            Provider::Qq => &self.qq_clear,
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct MineradioLoginResult {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    canceled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    cookie: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    partial: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    reused: Option<bool>,
}

impl MineradioLoginResult {
    fn canceled(message: impl Into<String>) -> Self {
        Self {
            ok: false,
            canceled: Some(true),
            cookie: None,
            error: None,
            message: Some(message.into()),
            partial: None,
            reused: None,
        }
    }

    fn error(error: impl ToString) -> Self {
        Self {
            ok: false,
            canceled: None,
            cookie: None,
            error: Some(error.to_string()),
            message: None,
            partial: None,
            reused: None,
        }
    }

    fn success(cookie: String, partial: Option<bool>, reused: bool) -> Self {
        Self {
            ok: true,
            canceled: None,
            cookie: Some(cookie),
            error: None,
            message: None,
            partial,
            reused: reused.then_some(true),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct MineradioAccountOperationResult {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

impl MineradioAccountOperationResult {
    fn success() -> Self {
        Self {
            ok: true,
            error: None,
        }
    }

    fn error(error: impl ToString) -> Self {
        Self {
            ok: false,
            error: Some(error.to_string()),
        }
    }
}

#[tauri::command]
pub(crate) async fn mineradio_open_netease_login(
    app: AppHandle,
    principal: String,
) -> MineradioLoginResult {
    open_login(app, Provider::Netease, principal).await
}

#[tauri::command]
pub(crate) async fn mineradio_open_qq_login(
    app: AppHandle,
    principal: String,
) -> MineradioLoginResult {
    open_login(app, Provider::Qq, principal).await
}

#[tauri::command]
pub(crate) async fn mineradio_clear_netease_login(
    app: AppHandle,
    principal: String,
) -> MineradioAccountOperationResult {
    clear_login(app, Provider::Netease, principal).await
}

#[tauri::command]
pub(crate) async fn mineradio_clear_qq_login(
    app: AppHandle,
    principal: String,
) -> MineradioAccountOperationResult {
    clear_login(app, Provider::Qq, principal).await
}

async fn open_login(app: AppHandle, provider: Provider, principal: String) -> MineradioLoginResult {
    if let Err(error) = ensure_persistent_profile_isolation_supported() {
        return MineradioLoginResult::error(error);
    }
    let principal_namespace = principal_profile_namespace(&principal);
    let (sender, receiver) = mpsc::channel();
    let create_window = {
        let state = app.state::<MineradioAccountState>();
        if state.shutting_down.load(Ordering::Acquire) {
            return MineradioLoginResult::error("KernelOn 主窗口正在退出");
        }
        let mut session = state
            .session(provider)
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        match attach_login_waiter(&mut session, sender, &principal_namespace) {
            Ok(create_window) => create_window,
            Err(error) => return MineradioLoginResult::error(error),
        }
    };

    if create_window {
        if let Err(error) = create_login_window(&app, provider, &principal_namespace) {
            finish_login(&app, provider, MineradioLoginResult::error(error), false);
        }
    } else if let Some(window) = app.get_webview_window(provider.login_label()) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }

    match tauri::async_runtime::spawn_blocking(move || receiver.recv()).await {
        Ok(Ok(result)) => result,
        Ok(Err(_)) => MineradioLoginResult::error("登录窗口结果通道已关闭"),
        Err(error) => MineradioLoginResult::error(error),
    }
}

fn create_login_window(
    app: &AppHandle,
    provider: Provider,
    principal_namespace: &str,
) -> tauri::Result<()> {
    let url = "about:blank"
        .parse::<Url>()
        .expect("about:blank must be a valid WebView URL");
    let profile = provider_profile_directory(app, provider, principal_namespace)?;
    let app_for_new_window = app.clone();

    let mut builder =
        WebviewWindowBuilder::new(app, provider.login_label(), WebviewUrl::External(url))
            .title(provider.title())
            .inner_size(
                if provider == Provider::Netease {
                    940.0
                } else {
                    900.0
                },
                if provider == Provider::Netease {
                    760.0
                } else {
                    720.0
                },
            )
            .min_inner_size(
                if provider == Provider::Netease {
                    780.0
                } else {
                    760.0
                },
                if provider == Provider::Netease {
                    580.0
                } else {
                    560.0
                },
            )
            .background_color(tauri::window::Color(17, 17, 17, 255))
            .data_directory(profile)
            .data_store_identifier(provider.data_store_identifier(principal_namespace))
            .visible(false)
            .on_navigation(move |target| is_allowed_navigation(provider, target))
            .on_new_window(move |target, _features| {
                if is_allowed_navigation(provider, &target) {
                    if let Some(window) =
                        app_for_new_window.get_webview_window(provider.login_label())
                    {
                        let _ = window.navigate(target);
                    }
                }
                NewWindowResponse::Deny
            })
            .on_page_load(move |window, payload| {
                if payload.event() != PageLoadEvent::Finished || payload.url().scheme() == "about" {
                    return;
                }
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.eval(match provider {
                    Provider::Netease => NETEASE_LOGIN_CLICK_SCRIPT,
                    Provider::Qq => QQ_LOGIN_CLICK_SCRIPT,
                });
                // The poller owns cookie reads; page-load preserves source timing and
                // never extracts credentials through page script.
            });

    if let Some(owner) = app.get_webview_window("main") {
        builder = builder.parent(&owner)?;
    }
    if let Some(icon) = app.default_window_icon().cloned() {
        builder = builder.icon(icon)?;
    }

    let window = builder.build()?;
    let close_app = app.clone();
    let destroyed_app = app.clone();
    window.on_window_event(move |event| match event {
        WindowEvent::CloseRequested { api, .. } => {
            let state = close_app.state::<MineradioAccountState>();
            let (active, should_check) = {
                let mut session = state
                    .session(provider)
                    .lock()
                    .unwrap_or_else(|poisoned| poisoned.into_inner());
                begin_close_check(&mut session)
            };
            if active {
                api.prevent_close();
            }
            if should_check {
                spawn_close_cookie_check(close_app.clone(), provider);
            }
        }
        WindowEvent::Destroyed => {
            finish_login(
                &destroyed_app,
                provider,
                MineradioLoginResult::canceled(close_message(provider)),
                false,
            );
        }
        _ => {}
    });
    spawn_cookie_poller(app.clone(), provider);
    Ok(())
}

fn spawn_cookie_poller(app: AppHandle, provider: Provider) {
    thread::spawn(move || {
        let mut first_check = true;
        let mut warmup_started = false;
        loop {
            if !provider_is_active(&app, provider) {
                return;
            }
            let Some(window) = app.get_webview_window(provider.login_label()) else {
                finish_login(
                    &app,
                    provider,
                    MineradioLoginResult::canceled(close_message(provider)),
                    false,
                );
                return;
            };

            match read_login_cookie_header(&window, provider) {
                Ok(cookie) if login_is_complete(provider, &cookie) => {
                    finish_login(
                        &app,
                        provider,
                        MineradioLoginResult::success(cookie, None, first_check),
                        true,
                    );
                    return;
                }
                Ok(_) if first_check => {
                    if let Ok(url) = provider.login_url().parse::<Url>() {
                        let _ = window.navigate(url);
                    }
                }
                Ok(cookie)
                    if provider == Provider::Qq
                        && qq_cookie_has_login(&cookie)
                        && !warmup_started =>
                {
                    warmup_started = true;
                    thread::sleep(Duration::from_millis(900));
                    if provider_is_active(&app, provider) {
                        if let Some(window) = app.get_webview_window(provider.login_label()) {
                            if let Ok(url) = QQ_PLAYER_URL.parse::<Url>() {
                                let _ = window.navigate(url);
                            }
                        }
                    }
                }
                Ok(_) => {}
                Err(_) if first_check => {
                    if let Ok(url) = provider.login_url().parse::<Url>() {
                        let _ = window.navigate(url);
                    }
                }
                Err(_) => {
                    // Source keeps the official window usable and retries on the
                    // next 1200ms tick. Credential-bearing errors are never logged.
                }
            }
            first_check = false;
            thread::sleep(LOGIN_POLL_INTERVAL);
        }
    });
}

fn spawn_close_cookie_check(app: AppHandle, provider: Provider) {
    thread::spawn(move || {
        let result = app
            .get_webview_window(provider.login_label())
            .ok_or_else(|| "登录窗口已关闭".to_owned())
            .and_then(|window| {
                read_login_cookie_header(&window, provider).map_err(|error| error.to_string())
            });
        let login_result = match result {
            Ok(cookie) if close_login_is_acceptable(provider, &cookie) => {
                let partial =
                    (provider == Provider::Netease).then(|| !qq_cookie_has_playback_login(&cookie));
                MineradioLoginResult::success(cookie, partial, false)
            }
            Ok(_) => MineradioLoginResult::canceled(close_message(provider)),
            Err(error) => MineradioLoginResult::error(error),
        };
        finish_login(&app, provider, login_result, true);
    });
}

fn finish_login(
    app: &AppHandle,
    provider: Provider,
    result: MineradioLoginResult,
    destroy_window: bool,
) {
    let waiters = {
        let state = app.state::<MineradioAccountState>();
        let mut session = state
            .session(provider)
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        let Some(waiters) = settle_session(&mut session) else {
            return;
        };
        waiters
    };
    for waiter in waiters {
        let _ = waiter.send(result.clone());
    }
    if destroy_window {
        if let Some(window) = app.get_webview_window(provider.login_label()) {
            let _ = window.destroy();
        }
    }
}

async fn clear_login(
    app: AppHandle,
    provider: Provider,
    principal: String,
) -> MineradioAccountOperationResult {
    if let Err(error) = ensure_persistent_profile_isolation_supported() {
        return MineradioAccountOperationResult::error(error);
    }
    let principal_namespace = principal_profile_namespace(&principal);
    let result = tauri::async_runtime::spawn_blocking(move || {
        clear_login_blocking(app, provider, &principal_namespace)
    })
    .await;
    match result {
        Ok(Ok(())) => MineradioAccountOperationResult::success(),
        Ok(Err(error)) => MineradioAccountOperationResult::error(error),
        Err(error) => MineradioAccountOperationResult::error(error),
    }
}

fn clear_login_blocking(
    app: AppHandle,
    provider: Provider,
    principal_namespace: &str,
) -> Result<(), String> {
    let state = app.state::<MineradioAccountState>();
    let _clear_guard = state
        .clear_lock(provider)
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    let (window, destroy_after_clear) =
        if let Some(window) = app.get_webview_window(provider.login_label()) {
            (window, false)
        } else {
            let profile = provider_profile_directory(&app, provider, principal_namespace)
                .map_err(|error| error.to_string())?;
            let blank = "about:blank"
                .parse::<Url>()
                .map_err(|error| error.to_string())?;
            let window = if let Some(existing) = app.get_webview_window(provider.clear_label()) {
                existing
            } else {
                WebviewWindowBuilder::new(&app, provider.clear_label(), WebviewUrl::External(blank))
                    .data_directory(profile)
                    .data_store_identifier(provider.data_store_identifier(principal_namespace))
                    .visible(false)
                    .build()
                    .map_err(|error| error.to_string())?
            };
            (window, true)
        };
    let result = clear_window_browsing_data(&window);
    // Wry's public Windows API schedules WebView2 ClearBrowsingDataAll and
    // returns immediately. Keep the profile alive until its cookie store is
    // observably empty (or the bounded grace period expires).
    for _ in 0..20 {
        thread::sleep(Duration::from_millis(100));
        match window.cookies() {
            Ok(cookies) if cookies.is_empty() => break,
            Ok(_) | Err(_) => {}
        }
    }
    if destroy_after_clear {
        let _ = window.destroy();
    }
    result
}

fn clear_window_browsing_data(window: &tauri::WebviewWindow) -> Result<(), String> {
    window
        .clear_all_browsing_data()
        .map_err(|error| error.to_string())
}

fn provider_profile_directory(
    app: &AppHandle,
    provider: Provider,
    principal_namespace: &str,
) -> tauri::Result<std::path::PathBuf> {
    Ok(app
        .path()
        .app_data_dir()?
        .join("mineradio")
        .join("login-profiles")
        .join(principal_namespace)
        .join(provider.profile_name()))
}

fn principal_profile_namespace(principal: &str) -> String {
    let normalized = principal.trim();
    if normalized.is_empty() || normalized == "guest" {
        return "guest".to_owned();
    }
    let first = stable_hash64(normalized.as_bytes(), 0xcbf29ce484222325);
    let second = stable_hash64(normalized.as_bytes(), 0x84222325cbf29ce4);
    format!("principal-{first:016x}{second:016x}")
}

fn stable_profile_identifier(provider: &str, principal_namespace: &str) -> [u8; 16] {
    let input = format!("kernelon:mineradio:{provider}:{principal_namespace}");
    let first = stable_hash64(input.as_bytes(), 0xcbf29ce484222325);
    let second = stable_hash64(input.as_bytes(), 0x84222325cbf29ce4);
    let mut output = [0u8; 16];
    output[..8].copy_from_slice(&first.to_be_bytes());
    output[8..].copy_from_slice(&second.to_be_bytes());
    output
}

fn stable_hash64(input: &[u8], seed: u64) -> u64 {
    input.iter().fold(seed, |hash, byte| {
        (hash ^ u64::from(*byte)).wrapping_mul(0x100000001b3)
    })
}

#[cfg(target_os = "macos")]
fn ensure_persistent_profile_isolation_supported() -> Result<(), String> {
    let output = std::process::Command::new("/usr/bin/sw_vers")
        .arg("-productVersion")
        .output()
        .map_err(|_| "无法确认 macOS WebView 数据隔离能力".to_owned())?;
    let version = String::from_utf8_lossy(&output.stdout);
    let major = version
        .trim()
        .split('.')
        .next()
        .and_then(|value| value.parse::<u32>().ok())
        .ok_or_else(|| "无法确认 macOS WebView 数据隔离能力".to_owned())?;
    if output.status.success() && major >= 14 {
        Ok(())
    } else {
        Err("官方网页登录需要 macOS 14 或更高版本，以保证网易云与 QQ Cookie 完全隔离".to_owned())
    }
}

#[cfg(not(target_os = "macos"))]
fn ensure_persistent_profile_isolation_supported() -> Result<(), String> {
    Ok(())
}

fn provider_is_active(app: &AppHandle, provider: Provider) -> bool {
    let state = app.state::<MineradioAccountState>();
    let active = state
        .session(provider)
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .active;
    active
}

fn read_login_cookie_header(
    window: &tauri::WebviewWindow,
    provider: Provider,
) -> tauri::Result<String> {
    let cookies = window.cookies()?;
    Ok(build_cookie_header(provider, &cookies))
}

fn build_cookie_header(provider: Provider, cookies: &[Cookie<'_>]) -> String {
    let mut picked: Vec<(String, String)> = Vec::new();
    for cookie in cookies {
        let domain = cookie.domain().unwrap_or_default();
        if !is_allowed_cookie_domain(provider, domain) || cookie.name().is_empty() {
            continue;
        }
        if let Some((_, value)) = picked.iter_mut().find(|(name, _)| name == cookie.name()) {
            *value = cookie.value().to_owned();
        } else {
            picked.push((cookie.name().to_owned(), cookie.value().to_owned()));
        }
    }

    let priority = match provider {
        Provider::Netease => NETEASE_LOGIN_COOKIE_PRIORITY,
        Provider::Qq => QQ_LOGIN_COOKIE_PRIORITY,
    };
    let mut ordered = Vec::with_capacity(picked.len());
    for preferred in priority {
        if let Some(index) = picked.iter().position(|(name, _)| name == preferred) {
            ordered.push(picked.remove(index));
        }
    }
    ordered.extend(picked);
    ordered
        .into_iter()
        .filter(|(name, value)| !name.is_empty() && !value.is_empty())
        .map(|(name, value)| format!("{name}={value}"))
        .collect::<Vec<_>>()
        .join("; ")
}

fn parse_cookie_header(cookie_text: &str) -> Vec<(&str, &str)> {
    cookie_text
        .split(';')
        .filter_map(|raw| {
            let (name, value) = raw.split_once('=')?;
            Some((name.trim(), value.trim()))
        })
        .collect()
}

fn cookie_value<'a>(cookies: &[(&'a str, &'a str)], name: &str) -> &'a str {
    cookies
        .iter()
        .find_map(|(cookie_name, value)| (*cookie_name == name).then_some(*value))
        .unwrap_or_default()
}

fn qq_cookie_has_login(cookie_text: &str) -> bool {
    let cookies = parse_cookie_header(cookie_text);
    let login_type_is_wechat =
        cookie_value(&cookies, "login_type").parse::<f64>().ok() == Some(2.0);
    let uin_names: &[&str] = if login_type_is_wechat {
        &["wxuin", "uin", "p_uin"]
    } else {
        &["uin", "qqmusic_uin", "wxuin", "p_uin"]
    };
    let has_uin = uin_names.iter().any(|name| {
        cookie_value(&cookies, name)
            .chars()
            .any(|character| character.is_ascii_digit())
    });
    let key_names = [
        "qm_keyst",
        "qqmusic_key",
        "music_key",
        "p_skey",
        "skey",
        "psrf_qqaccess_token",
        "psrf_qqrefresh_token",
        "wxrefresh_token",
        "wxskey",
    ];
    has_uin
        && key_names
            .iter()
            .any(|name| !cookie_value(&cookies, name).is_empty())
}

fn qq_cookie_has_playback_login(cookie_text: &str) -> bool {
    let cookies = parse_cookie_header(cookie_text);
    let login_type_is_wechat =
        cookie_value(&cookies, "login_type").parse::<f64>().ok() == Some(2.0);
    let uin_names: &[&str] = if login_type_is_wechat {
        &["wxuin", "uin", "p_uin"]
    } else {
        &["uin", "qqmusic_uin", "wxuin", "p_uin"]
    };
    let has_uin = uin_names.iter().any(|name| {
        cookie_value(&cookies, name)
            .chars()
            .any(|character| character.is_ascii_digit())
    });
    has_uin
        && ["qm_keyst", "qqmusic_key", "music_key", "wxskey"]
            .iter()
            .any(|name| !cookie_value(&cookies, name).is_empty())
}

fn netease_cookie_has_login(cookie_text: &str) -> bool {
    !cookie_value(&parse_cookie_header(cookie_text), "MUSIC_U").is_empty()
}

fn login_is_complete(provider: Provider, cookie: &str) -> bool {
    match provider {
        Provider::Netease => netease_cookie_has_login(cookie),
        Provider::Qq => qq_cookie_has_playback_login(cookie),
    }
}

fn close_login_is_acceptable(provider: Provider, cookie: &str) -> bool {
    match provider {
        Provider::Netease => netease_cookie_has_login(cookie),
        Provider::Qq => qq_cookie_has_login(cookie),
    }
}

fn is_allowed_cookie_domain(provider: Provider, domain: &str) -> bool {
    let normalized = domain.trim_start_matches('.').to_ascii_lowercase();
    match provider {
        Provider::Netease => {
            normalized == "163.com"
                || normalized.ends_with(".163.com")
                || normalized == "music.163.com"
                || normalized.ends_with(".music.163.com")
                || normalized == "netease.com"
                || normalized.ends_with(".netease.com")
        }
        Provider::Qq => {
            normalized == "qq.com"
                || normalized.ends_with(".qq.com")
                || normalized.ends_with("qqmusic.qq.com")
        }
    }
}

fn is_allowed_navigation(provider: Provider, url: &Url) -> bool {
    if url.as_str() == "about:blank" {
        return true;
    }
    if url.scheme() != "https" {
        return false;
    }
    let host = url.host_str().unwrap_or_default().to_ascii_lowercase();
    is_allowed_cookie_domain(provider, &host)
        || (provider == Provider::Qq
            && (host == "weixin.qq.com" || host.ends_with(".weixin.qq.com")))
}

fn close_message(provider: Provider) -> &'static str {
    match provider {
        Provider::Netease => "网易云登录窗口已关闭",
        Provider::Qq => "QQ 登录窗口已关闭",
    }
}

pub(crate) fn handle_run_event(app: &AppHandle, event: &RunEvent) {
    let should_shutdown = matches!(event, RunEvent::Exit | RunEvent::ExitRequested { .. })
        || matches!(
            event,
            RunEvent::WindowEvent {
                label,
                event: WindowEvent::Destroyed,
                ..
            } if label == "main"
        );
    if !should_shutdown {
        return;
    }
    let state = app.state::<MineradioAccountState>();
    if state.shutting_down.swap(true, Ordering::AcqRel) {
        return;
    }
    finish_login(
        app,
        Provider::Netease,
        MineradioLoginResult::error("KernelOn 主窗口已退出"),
        true,
    );
    finish_login(
        app,
        Provider::Qq,
        MineradioLoginResult::error("KernelOn 主窗口已退出"),
        true,
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cookie(name: &str, value: &str, domain: &str) -> Cookie<'static> {
        Cookie::build((name.to_owned(), value.to_owned()))
            .domain(domain.to_owned())
            .build()
    }

    #[test]
    fn source_contract_constants_and_profiles_are_provider_specific() {
        assert_eq!(NETEASE_LOGIN_URL, "https://music.163.com/#/login");
        assert_eq!(QQ_LOGIN_URL, "https://y.qq.com/n/ryqq/profile");
        assert_eq!(QQ_PLAYER_URL, "https://y.qq.com/n/ryqq/player");
        assert_eq!(LOGIN_POLL_INTERVAL, Duration::from_millis(1_200));
        assert_ne!(
            Provider::Netease.profile_name(),
            Provider::Qq.profile_name()
        );
        assert_ne!(
            Provider::Netease.data_store_identifier("guest"),
            Provider::Qq.data_store_identifier("guest")
        );
        assert_ne!(
            Provider::Netease.data_store_identifier("guest"),
            Provider::Netease.data_store_identifier("principal-a")
        );
        assert_ne!(Provider::Netease.login_label(), Provider::Qq.login_label());
    }

    #[test]
    fn golden_cookie_headers_match_source_priority_domain_filter_and_overwrite_rules() {
        let qq = vec![
            cookie("misc", "tail", ".y.qq.com"),
            cookie("qm_keyst", "first", ".qq.com"),
            cookie("uin", "o0123", ".qq.com"),
            cookie("qm_keyst", "latest", ".y.qq.com"),
            cookie("MUSIC_U", "must-not-leak", ".music.163.com"),
        ];
        assert_eq!(
            build_cookie_header(Provider::Qq, &qq),
            "uin=o0123; qm_keyst=latest; misc=tail"
        );

        let netease = vec![
            cookie("NMTID", "nmt", ".163.com"),
            cookie("custom", "tail", ".music.163.com"),
            cookie("MUSIC_U", "music", ".music.163.com"),
            cookie("uin", "must-not-leak", ".qq.com"),
        ];
        assert_eq!(
            build_cookie_header(Provider::Netease, &netease),
            "MUSIC_U=music; NMTID=nmt; custom=tail"
        );
    }

    #[test]
    fn source_login_predicates_keep_qq_account_and_playback_readiness_distinct() {
        assert!(netease_cookie_has_login("__csrf=x; MUSIC_U=token"));
        assert!(!netease_cookie_has_login("MUSIC_A=anonymous"));

        let partial = "uin=o00123; p_skey=account-only";
        assert!(qq_cookie_has_login(partial));
        assert!(!qq_cookie_has_playback_login(partial));
        assert!(!login_is_complete(Provider::Qq, partial));
        assert!(close_login_is_acceptable(Provider::Qq, partial));

        let playback = "login_type=2; wxuin=wx-456; wxskey=playback";
        assert!(qq_cookie_has_login(playback));
        assert!(qq_cookie_has_playback_login(playback));
        assert!(login_is_complete(Provider::Qq, playback));
    }

    #[test]
    fn navigation_stays_inside_each_official_identity_surface() {
        let allowed = [
            (Provider::Netease, "https://music.163.com/#/login"),
            (Provider::Netease, "https://reg.163.com/login"),
            (Provider::Qq, "https://xui.ptlogin2.qq.com/cgi-bin/xlogin"),
            (Provider::Qq, "https://open.weixin.qq.com/connect/qrconnect"),
        ];
        for (provider, url) in allowed {
            assert!(is_allowed_navigation(provider, &url.parse().unwrap()));
        }
        assert!(!is_allowed_navigation(
            Provider::Netease,
            &"http://music.163.com/#/login".parse().unwrap()
        ));
        assert!(!is_allowed_navigation(
            Provider::Netease,
            &"https://example.com/phishing".parse().unwrap()
        ));
        assert!(!is_allowed_navigation(
            Provider::Qq,
            &"javascript:alert(1)".parse().unwrap()
        ));
    }

    #[test]
    fn repeated_open_close_and_completion_races_have_one_owned_window_and_one_result() {
        let mut session = ProviderSession::default();
        let (first_sender, first_receiver) = mpsc::channel();
        let (second_sender, second_receiver) = mpsc::channel();

        assert!(attach_login_waiter(&mut session, first_sender, "guest").unwrap());
        assert!(!attach_login_waiter(&mut session, second_sender, "guest").unwrap());
        assert_eq!(session.waiters.len(), 2);
        assert_eq!(begin_close_check(&mut session), (true, true));
        assert_eq!(begin_close_check(&mut session), (true, false));

        let result = MineradioLoginResult::canceled("closed");
        for waiter in settle_session(&mut session).unwrap() {
            waiter.send(result.clone()).unwrap();
        }
        assert!(settle_session(&mut session).is_none());
        assert!(first_receiver.recv().unwrap().canceled.unwrap());
        assert!(second_receiver.recv().unwrap().canceled.unwrap());
    }

    #[test]
    fn principal_namespaces_are_stable_private_and_never_share_active_sessions() {
        assert_eq!(principal_profile_namespace(""), "guest");
        assert_eq!(principal_profile_namespace(" guest "), "guest");
        let alice = principal_profile_namespace("user/alice@example.com");
        assert_eq!(
            alice,
            principal_profile_namespace(" user/alice@example.com ")
        );
        assert!(alice.starts_with("principal-"));
        assert!(!alice.contains("alice"));
        assert_ne!(alice, principal_profile_namespace("user/bob@example.com"));

        let mut session = ProviderSession::default();
        let (alice_sender, _alice_receiver) = mpsc::channel();
        let (bob_sender, _bob_receiver) = mpsc::channel();
        assert!(attach_login_waiter(&mut session, alice_sender, &alice).unwrap());
        assert_eq!(
            attach_login_waiter(
                &mut session,
                bob_sender,
                &principal_profile_namespace("user/bob@example.com")
            ),
            Err("MINERADIO_LOGIN_PRINCIPAL_CHANGED")
        );
    }
}
