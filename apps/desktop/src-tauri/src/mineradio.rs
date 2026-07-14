use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::Path;

const DEFAULT_EXPORT_NAME: &str = "mineradio-export.json";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct JsonExportRequest {
    data: Option<Value>,
    default_name: Option<String>,
    text: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct JsonFileResult {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    canceled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    file_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    text: Option<String>,
}

impl JsonFileResult {
    fn canceled() -> Self {
        Self {
            ok: false,
            canceled: Some(true),
            error: None,
            file_path: None,
            text: None,
        }
    }

    fn error(error: impl ToString) -> Self {
        Self {
            ok: false,
            canceled: None,
            error: Some(error.to_string()),
            file_path: None,
            text: None,
        }
    }

    fn success(path: &Path, text: Option<String>) -> Self {
        Self {
            ok: true,
            canceled: None,
            error: None,
            file_path: Some(path.to_string_lossy().into_owned()),
            text,
        }
    }
}

#[tauri::command]
pub(crate) async fn mineradio_export_json_file(payload: JsonExportRequest) -> JsonFileResult {
    match tauri::async_runtime::spawn_blocking(move || export_json_file(payload)).await {
        Ok(result) => result,
        Err(error) => JsonFileResult::error(error),
    }
}

#[tauri::command]
pub(crate) async fn mineradio_import_json_file() -> JsonFileResult {
    match tauri::async_runtime::spawn_blocking(import_json_file).await {
        Ok(result) => result,
        Err(error) => JsonFileResult::error(error),
    }
}

fn export_json_file(payload: JsonExportRequest) -> JsonFileResult {
    let default_name = sanitize_json_file_name(payload.default_name.as_deref());
    let Some(path) = rfd::FileDialog::new()
        .set_title("导出 Mineradio 存档")
        .set_file_name(&default_name)
        .add_filter("JSON", &["json"])
        .save_file()
    else {
        return JsonFileResult::canceled();
    };

    let text = match export_text(&payload) {
        Ok(text) => text,
        Err(error) => return JsonFileResult::error(error),
    };
    match std::fs::write(&path, text) {
        Ok(()) => JsonFileResult::success(&path, None),
        Err(error) => JsonFileResult::error(error),
    }
}

fn import_json_file() -> JsonFileResult {
    let Some(path) = rfd::FileDialog::new()
        .set_title("导入 Mineradio 存档")
        .add_filter("JSON", &["json"])
        .pick_file()
    else {
        return JsonFileResult::canceled();
    };

    match std::fs::read_to_string(&path) {
        Ok(text) => JsonFileResult::success(&path, Some(text)),
        Err(error) => JsonFileResult::error(error),
    }
}

fn export_text(payload: &JsonExportRequest) -> Result<String, serde_json::Error> {
    match &payload.text {
        Some(text) => Ok(text.clone()),
        None => serde_json::to_string_pretty(
            payload
                .data
                .as_ref()
                .unwrap_or(&Value::Object(serde_json::Map::new())),
        ),
    }
}

fn sanitize_json_file_name(value: Option<&str>) -> String {
    let source = value
        .filter(|name| !name.is_empty())
        .unwrap_or(DEFAULT_EXPORT_NAME);
    let mut base = String::with_capacity(source.len());
    let mut replacing_invalid_run = false;
    for character in source.chars() {
        let invalid = matches!(
            character,
            '\\' | '/' | ':' | '*' | '?' | '"' | '<' | '>' | '|'
        );
        if invalid {
            if !replacing_invalid_run {
                base.push('-');
            }
        } else {
            base.push(character);
        }
        replacing_invalid_run = invalid;
    }

    if base.to_ascii_lowercase().ends_with(".json") {
        base
    } else {
        format!("{base}.json")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitizes_export_names_and_keeps_json_extension() {
        let fixtures = [
            (None, "mineradio-export.json"),
            (Some(""), "mineradio-export.json"),
            (Some("archive"), "archive.json"),
            (Some("ARCHIVE.JSON"), "ARCHIVE.JSON"),
            (Some("my::music///archive"), "my-music-archive.json"),
            (Some("   "), "   .json"),
        ];
        for (input, expected) in fixtures {
            assert_eq!(sanitize_json_file_name(input), expected);
        }
    }

    #[test]
    fn explicit_text_wins_over_structured_data() {
        let payload = JsonExportRequest {
            data: Some(serde_json::json!({ "volume": 80 })),
            default_name: None,
            text: Some("already serialized".to_owned()),
        };

        assert_eq!(export_text(&payload).unwrap(), "already serialized");
    }

    #[test]
    fn structured_data_is_pretty_printed() {
        let payload = JsonExportRequest {
            data: Some(serde_json::json!({ "volume": 80 })),
            default_name: None,
            text: None,
        };

        assert_eq!(export_text(&payload).unwrap(), "{\n  \"volume\": 80\n}");
    }
}
