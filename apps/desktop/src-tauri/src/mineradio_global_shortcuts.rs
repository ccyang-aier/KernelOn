use serde::{Deserialize, Serialize};
use std::{collections::HashSet, sync::Mutex};
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

const GLOBAL_HOTKEY_EVENT: &str = "mineradio-global-hotkey";
const CONFLICT_SOURCE_NAME: &str = "系统 / 其他软件";
const CONFLICT_SOURCE_ICON: &str = "warning";
const CONFLICT_REASON: &str = "该组合键已被占用或被系统保留";

#[derive(Default)]
pub(crate) struct MineradioGlobalShortcutState {
    registered: Mutex<Vec<Shortcut>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct GlobalHotkeyBinding {
    action: String,
    accelerator: String,
}

#[derive(Debug, PartialEq)]
struct NormalizedGlobalHotkeyBinding {
    action: String,
    accelerator: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct GlobalHotkeyConfiguration {
    ok: bool,
    results: Vec<GlobalHotkeyResult>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GlobalHotkeyResult {
    action: String,
    accelerator: String,
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    conflict: Option<GlobalHotkeyConflict>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GlobalHotkeyConflict {
    source_name: &'static str,
    source_icon: &'static str,
    reason: &'static str,
}

#[derive(Clone, Debug, Serialize)]
struct GlobalHotkeyEventPayload {
    action: String,
}

#[tauri::command]
pub(crate) fn mineradio_configure_global_hotkeys(
    app: AppHandle,
    state: State<'_, MineradioGlobalShortcutState>,
    bindings: Vec<GlobalHotkeyBinding>,
) -> GlobalHotkeyConfiguration {
    let bindings = normalize_bindings(bindings);
    let mut registered = state
        .registered
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());

    for shortcut in registered.drain(..) {
        let _ = app.global_shortcut().unregister(shortcut);
    }

    let mut results = Vec::with_capacity(bindings.len());
    for binding in bindings {
        let action = binding.action;
        let accelerator = binding.accelerator;
        let registration = accelerator
            .parse::<Shortcut>()
            .map_err(|_| ())
            .and_then(|shortcut| {
                let event_action = action.clone();
                app.global_shortcut()
                    .on_shortcut(shortcut, move |app, _shortcut, event| {
                        if event.state == ShortcutState::Pressed {
                            let _ = app.emit_to(
                                "main",
                                GLOBAL_HOTKEY_EVENT,
                                GlobalHotkeyEventPayload {
                                    action: event_action.clone(),
                                },
                            );
                        }
                    })
                    .map(|()| shortcut)
                    .map_err(|_| ())
            });

        match registration {
            Ok(shortcut) => {
                registered.push(shortcut);
                results.push(GlobalHotkeyResult::success(action, accelerator));
            }
            Err(()) => results.push(GlobalHotkeyResult::conflict(action, accelerator)),
        }
    }

    GlobalHotkeyConfiguration { ok: true, results }
}

impl GlobalHotkeyResult {
    fn success(action: String, accelerator: String) -> Self {
        Self {
            action,
            accelerator,
            ok: true,
            conflict: None,
        }
    }

    fn conflict(action: String, accelerator: String) -> Self {
        Self {
            action,
            accelerator,
            ok: false,
            conflict: Some(GlobalHotkeyConflict {
                source_name: CONFLICT_SOURCE_NAME,
                source_icon: CONFLICT_SOURCE_ICON,
                reason: CONFLICT_REASON,
            }),
        }
    }
}

fn normalize_bindings(bindings: Vec<GlobalHotkeyBinding>) -> Vec<NormalizedGlobalHotkeyBinding> {
    let mut seen = HashSet::new();
    let mut normalized = Vec::with_capacity(bindings.len());

    for binding in bindings {
        let action = binding.action.trim();
        let accelerator = binding.accelerator.trim();
        if action.is_empty() || accelerator.is_empty() || !seen.insert(accelerator.to_owned()) {
            continue;
        }
        normalized.push(NormalizedGlobalHotkeyBinding {
            action: action.to_owned(),
            accelerator: accelerator.to_owned(),
        });
    }

    normalized
}

#[cfg(test)]
mod tests {
    use super::*;

    fn binding(action: &str, accelerator: &str) -> GlobalHotkeyBinding {
        GlobalHotkeyBinding {
            action: action.to_owned(),
            accelerator: accelerator.to_owned(),
        }
    }

    #[test]
    fn normalization_matches_mineradio_order_trimming_and_duplicate_rules() {
        assert_eq!(
            normalize_bindings(vec![
                binding(" togglePlay ", " Control+Alt+Space "),
                binding("nextTrack", "Control+Alt+Space"),
                binding("", "Control+Alt+Right"),
                binding("prevTrack", "   "),
                binding(" nextTrack ", " Control+Alt+Right "),
            ]),
            vec![
                NormalizedGlobalHotkeyBinding {
                    action: "togglePlay".to_owned(),
                    accelerator: "Control+Alt+Space".to_owned(),
                },
                NormalizedGlobalHotkeyBinding {
                    action: "nextTrack".to_owned(),
                    accelerator: "Control+Alt+Right".to_owned(),
                },
            ]
        );
    }

    #[test]
    fn configuration_and_event_payloads_keep_the_owned_source_wire_contract() {
        let configuration = GlobalHotkeyConfiguration {
            ok: true,
            results: vec![
                GlobalHotkeyResult::success(
                    "togglePlay".to_owned(),
                    "Control+Alt+Space".to_owned(),
                ),
                GlobalHotkeyResult::conflict(
                    "nextTrack".to_owned(),
                    "Control+Alt+Right".to_owned(),
                ),
            ],
        };

        assert_eq!(
            serde_json::to_value(configuration).unwrap(),
            serde_json::json!({
                "ok": true,
                "results": [
                    {
                        "action": "togglePlay",
                        "accelerator": "Control+Alt+Space",
                        "ok": true
                    },
                    {
                        "action": "nextTrack",
                        "accelerator": "Control+Alt+Right",
                        "ok": false,
                        "conflict": {
                            "sourceName": "系统 / 其他软件",
                            "sourceIcon": "warning",
                            "reason": "该组合键已被占用或被系统保留"
                        }
                    }
                ]
            })
        );
        assert_eq!(
            serde_json::to_value(GlobalHotkeyEventPayload {
                action: "togglePlay".to_owned()
            })
            .unwrap(),
            serde_json::json!({ "action": "togglePlay" })
        );
    }

    #[test]
    fn tauri_parser_accepts_every_accelerator_shape_emitted_by_mineradio() {
        for accelerator in [
            "Control+Alt+Space",
            "Control+Alt+Left",
            "Control+Alt+Right",
            "Control+Alt+Up",
            "Control+Alt+Down",
            "Control+Alt+F",
            "Control+Alt+L",
        ] {
            assert!(
                accelerator.parse::<Shortcut>().is_ok(),
                "unsupported Mineradio accelerator: {accelerator}"
            );
        }
    }
}
