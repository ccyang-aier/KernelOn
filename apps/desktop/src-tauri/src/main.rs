#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod desktop_host_config;
mod mineradio;
mod mineradio_accounts;
mod mineradio_global_shortcuts;
mod mineradio_overlays;

fn main() {
    let mut context = tauri::generate_context!();
    let host_config = desktop_host_config::configure_context(&mut context)
        .expect("invalid KernelOn desktop host security configuration");
    tauri::Builder::default()
        .manage(host_config)
        .manage(mineradio_global_shortcuts::MineradioGlobalShortcutState::default())
        .manage(mineradio_accounts::MineradioAccountState::default())
        .manage(mineradio_overlays::MineradioOverlayState::default())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            desktop_host_config::kernelon_desktop_host_config,
            mineradio::mineradio_export_json_file,
            mineradio::mineradio_import_json_file,
            mineradio_accounts::mineradio_open_netease_login,
            mineradio_accounts::mineradio_clear_netease_login,
            mineradio_accounts::mineradio_open_qq_login,
            mineradio_accounts::mineradio_clear_qq_login,
            mineradio_global_shortcuts::mineradio_configure_global_hotkeys,
            mineradio_overlays::mineradio_set_desktop_lyrics_enabled,
            mineradio_overlays::mineradio_update_desktop_lyrics,
            mineradio_overlays::mineradio_set_wallpaper_enabled,
            mineradio_overlays::mineradio_update_wallpaper,
            mineradio_overlays::mineradio_overlay_set_lyrics_dragging,
            mineradio_overlays::mineradio_overlay_set_lyrics_pointer_capture,
            mineradio_overlays::mineradio_overlay_set_lyrics_hot_bounds,
            mineradio_overlays::mineradio_overlay_set_lyrics_lock_state,
            mineradio_overlays::mineradio_overlay_move_lyrics_by
        ])
        .build(context)
        .expect("failed to build KernelOn desktop")
        .run(|app, event| {
            mineradio_accounts::handle_run_event(app, &event);
            mineradio_overlays::handle_run_event(app, &event);
        });
}
