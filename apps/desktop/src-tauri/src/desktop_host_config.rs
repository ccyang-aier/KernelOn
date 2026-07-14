use serde::Serialize;
use std::{env, net::IpAddr};
use tauri::{
    utils::config::{Csp, CspDirectiveSources},
    Context, Runtime, State, Url,
};

const API_ORIGIN_ENV: &str = "KERNELON_DESKTOP_API_ORIGIN";
const DEFAULT_API_ORIGIN: &str = "http://127.0.0.1:8000";

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DesktopHostConfig {
    api_origin: String,
    windows_wallpaper_supported: bool,
}

/// Resolves the API origin once in the native host and adds that exact origin
/// to the WebView CSP before any window is created. HTTPS is required for
/// remote endpoints; plaintext HTTP is accepted only for loopback development.
pub(crate) fn configure_context<R: Runtime>(
    context: &mut Context<R>,
) -> Result<DesktopHostConfig, String> {
    let raw = env::var(API_ORIGIN_ENV).unwrap_or_else(|_| DEFAULT_API_ORIGIN.to_owned());
    let api_origin = normalize_api_origin(&raw)?;
    append_api_origin_to_csp(context, &api_origin)?;
    Ok(DesktopHostConfig {
        api_origin,
        windows_wallpaper_supported: cfg!(windows),
    })
}

#[tauri::command]
pub(crate) fn kernelon_desktop_host_config(
    config: State<'_, DesktopHostConfig>,
) -> DesktopHostConfig {
    config.inner().clone()
}

fn normalize_api_origin(raw: &str) -> Result<String, String> {
    let url =
        Url::parse(raw.trim()).map_err(|_| "KERNELON_DESKTOP_API_ORIGIN_INVALID".to_owned())?;
    let host = url
        .host_str()
        .ok_or_else(|| "KERNELON_DESKTOP_API_ORIGIN_HOST_REQUIRED".to_owned())?;
    if !url.username().is_empty()
        || url.password().is_some()
        || !matches!(url.path(), "" | "/")
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err("KERNELON_DESKTOP_API_ORIGIN_MUST_BE_AN_ORIGIN".to_owned());
    }

    match url.scheme() {
        "https" => {}
        "http" if is_loopback_host(host) => {}
        "http" => return Err("KERNELON_DESKTOP_API_ORIGIN_HTTP_REQUIRES_LOOPBACK".to_owned()),
        _ => return Err("KERNELON_DESKTOP_API_ORIGIN_SCHEME_UNSUPPORTED".to_owned()),
    }

    Ok(url.origin().ascii_serialization())
}

fn is_loopback_host(host: &str) -> bool {
    host.eq_ignore_ascii_case("localhost")
        || host
            .trim_start_matches('[')
            .trim_end_matches(']')
            .parse::<IpAddr>()
            .map(|address| address.is_loopback())
            .unwrap_or(false)
}

fn append_api_origin_to_csp<R: Runtime>(
    context: &mut Context<R>,
    api_origin: &str,
) -> Result<(), String> {
    let configured = context
        .config_mut()
        .app
        .security
        .csp
        .take()
        .ok_or_else(|| "KERNELON_DESKTOP_CSP_REQUIRED".to_owned())?;
    let mut directives = match configured {
        Csp::Policy(policy) => Csp::Policy(policy).into(),
        Csp::DirectiveMap(directives) => directives,
    };
    for directive in ["connect-src", "img-src", "media-src"] {
        let sources = directives
            .entry(directive.to_owned())
            .or_insert_with(CspDirectiveSources::default);
        let existing: Vec<String> = sources.clone().into();
        if !existing.iter().any(|source| source == api_origin) {
            sources.push(api_origin);
        }
    }
    context.config_mut().app.security.csp = Some(Csp::DirectiveMap(directives));
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_https_and_loopback_http_as_origins() {
        assert_eq!(
            normalize_api_origin("https://api.kernelon.example:8443/").unwrap(),
            "https://api.kernelon.example:8443"
        );
        assert_eq!(
            normalize_api_origin("http://127.0.0.1:8000").unwrap(),
            "http://127.0.0.1:8000"
        );
        assert_eq!(
            normalize_api_origin("http://[::1]:8000").unwrap(),
            "http://[::1]:8000"
        );
    }

    #[test]
    fn rejects_unsafe_or_ambiguous_api_locations() {
        for raw in [
            "http://api.kernelon.example",
            "https://user:secret@api.kernelon.example",
            "https://api.kernelon.example/v1",
            "https://api.kernelon.example?tenant=x",
            "file:///tmp/kernelon",
        ] {
            assert!(normalize_api_origin(raw).is_err(), "accepted {raw}");
        }
    }
}
