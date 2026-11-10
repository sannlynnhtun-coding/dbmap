#![cfg_attr(not(test), windows_subsystem = "windows")]
// Window hosting and asset protocol adapted from the local drawio Rust desktop host (Apache-2.0).
use gpui_kit::*;
use serde_json::{Value, json};
use std::{
    borrow::Cow,
    path::PathBuf,
    sync::{Arc, Mutex},
};
use wry::{NewWindowResponse, WebView, WebViewBuilder, WebViewBuilderExtWindows};
mod document;
use document::{Document, Snapshot, Workspace};

const ORIGIN: &str = "https://dbmaps.localhost";
const CSP: &str = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";

#[derive(rust_embed::RustEmbed)]
#[folder = "../dist/"]
struct Assets;

fn error(message: &str) {
    if let Some(local) = std::env::var_os("LOCALAPPDATA") {
        let folder = PathBuf::from(local).join("DBMaps");
        let _ = std::fs::create_dir_all(&folder);
        let _ = std::fs::write(folder.join("last-error.txt"), message);
    }
    rfd::MessageDialog::new()
        .set_title("DBMaps")
        .set_description(message)
        .set_level(rfd::MessageLevel::Error)
        .show();
}

fn save(document: &mut Document, save_as: bool) -> Result<bool, String> {
    let path = if save_as || document.snapshot.force_save_as || document.path.is_none() {
        rfd::FileDialog::new()
            .add_filter("DBML schema", &["dbml"])
            .set_file_name(&document.snapshot.name)
            .save_file()
    } else {
        document.path.clone()
    };
    let Some(mut path) = path else {
        return Ok(false);
    };
    if path.extension().is_none() {
        path.set_extension("dbml");
    }
    if document.snapshot.force_save_as && document.path.as_ref() == Some(&path) {
        return Err(
            "Choose a different filename to preserve the unsupported layout metadata.".into(),
        );
    }
    document.save_to(&path)?;
    Ok(true)
}

fn prepare(document: &mut Document) -> Result<bool, String> {
    if !document.snapshot.dirty {
        return Ok(true);
    }
    let result = rfd::MessageDialog::new()
        .set_title("Unsaved DBMaps document")
        .set_description(format!("Save changes to {}?", document.snapshot.name))
        .set_buttons(rfd::MessageButtons::YesNoCancelCustom(
            "Save".into(),
            "Discard".into(),
            "Cancel".into(),
        ))
        .show();
    match result {
        rfd::MessageDialogResult::Yes => save(document, false),
        rfd::MessageDialogResult::No => Ok(true),
        rfd::MessageDialogResult::Custom(label) if label == "Save" => save(document, false),
        rfd::MessageDialogResult::Custom(label) if label == "Discard" => Ok(true),
        _ => Ok(false),
    }
}

fn command(workspace: &mut Workspace, body: &[u8]) -> Result<Value, String> {
    let request: Value = serde_json::from_slice(body).map_err(|e| e.to_string())?;
    let action = request["action"].as_str().ok_or("Missing action")?;
    let mut current_id = None;
    if let Some(value) = request.get("snapshot") {
        let snapshot: Snapshot =
            serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
        current_id = Some(snapshot.id.clone());
        workspace.update(snapshot);
    }
    match action {
        "launch" => {
            if workspace.pending.is_none() {
                workspace.pending = Some(Document {
                    snapshot: Snapshot {
                        name: "Untitled.dbml".into(),
                        ..Default::default()
                    },
                    ..Default::default()
                });
            }
            let pending = workspace.pending.as_ref().unwrap();
            Ok(json!({"name": pending.snapshot.name, "content": pending.snapshot.content}))
        }
        "adopt" => {
            let id = request["id"].as_str().ok_or("Missing document id")?;
            let mut pending = workspace.pending.take().ok_or("No file selected")?;
            if let Some(previous) = request["replaceId"].as_str() {
                workspace.documents.remove(previous);
            }
            pending.snapshot.id = id.into();
            workspace.documents.insert(id.into(), pending);
            Ok(json!({}))
        }
        "save" | "saveAs" | "new" | "open" => {
            let id = current_id.ok_or("Missing document snapshot")?;
            let document = workspace.documents.get_mut(&id).ok_or("Missing document")?;
            if action == "save" || action == "saveAs" {
                if !save(document, action == "saveAs")? {
                    return Ok(json!({"cancelled": true}));
                }
                return Ok(json!({"name": document.snapshot.name}));
            }
            if !prepare(document)? {
                return Ok(json!({"cancelled": true}));
            }
            let pending = if action == "open" {
                let Some(path) = rfd::FileDialog::new()
                    .add_filter("DBML schema", &["dbml"])
                    .pick_file()
                else {
                    return Ok(json!({"cancelled": true}));
                };
                Document::open(path)?
            } else {
                Document {
                    snapshot: Snapshot {
                        name: "Untitled.dbml".into(),
                        ..Default::default()
                    },
                    ..Default::default()
                }
            };
            let result =
                json!({"name": pending.snapshot.name, "content": pending.snapshot.content});
            workspace.pending = Some(pending);
            Ok(result)
        }
        _ => Err("Unknown file action".into()),
    }
}

fn asset(path: &str) -> Option<(&'static str, Cow<'static, [u8]>)> {
    let decoded = percent_encoding::percent_decode_str(path)
        .decode_utf8()
        .ok()?;
    let relative = decoded.strip_prefix('/')?;
    let relative = if relative.is_empty() || relative == "app" {
        "index.html"
    } else {
        relative
    };
    if relative.split('/').any(|part| {
        part.is_empty() || part == "." || part == ".." || part.contains(['\\', ':', '\0'])
    }) {
        return None;
    }
    Some((
        mime_guess::from_path(relative)
            .first_raw()
            .unwrap_or("application/octet-stream"),
        Assets::get(relative)?.data,
    ))
}

struct Desktop {
    _web: WebView,
}
impl Render for Desktop {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        div().size_full()
    }
}

fn main() {
    let mut workspace = Workspace::default();
    if let Some(path) = std::env::args_os().nth(1) {
        match Document::open(PathBuf::from(path)) {
            Ok(document) => workspace.pending = Some(document),
            Err(message) => {
                error(&message);
                return;
            }
        }
    }
    let workspace = Arc::new(Mutex::new(workspace));
    unsafe {
        std::env::set_var("GPUI_DISABLE_DIRECT_COMPOSITION", "1");
    }
    if let Some(runtime) = std::env::current_exe()
        .ok()
        .map(|exe| exe.with_file_name("WebView2Runtime"))
        .filter(|dir| dir.join("msedgewebview2.exe").is_file())
    {
        unsafe {
            std::env::set_var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER", runtime);
        }
    }
    gpui_kit::application().run(move |cx| {
        gpui_kit::init(cx);
        cx.on_window_closed(|cx, _| {
            if cx.windows().is_empty() {
                cx.quit();
            }
        })
        .detach();
        let bounds = Bounds::centered(None, size(px(1280.), px(850.)), cx);
        gpui_kit::open_window(
            WindowOptions {
                window_bounds: Some(WindowBounds::Maximized(bounds)),
                titlebar: Some(TitlebarOptions {
                    title: Some("DBMaps".into()),
                    ..Default::default()
                }),
                ..Default::default()
            },
            cx,
            move |window, cx| {
                use windows::Win32::UI::WindowsAndMessaging::*;
                use wry::raw_window_handle::{HasWindowHandle, RawWindowHandle};
                if let RawWindowHandle::Win32(handle) =
                    HasWindowHandle::window_handle(window).unwrap().as_raw()
                {
                    let hwnd = windows::Win32::Foundation::HWND(handle.hwnd.get() as *mut _);
                    unsafe {
                        let style = GetWindowLongPtrW(hwnd, GWL_STYLE);
                        SetWindowLongPtrW(hwnd, GWL_STYLE, style | WS_CLIPCHILDREN.0 as isize);
                        let _ = SetWindowPos(
                            hwnd,
                            None,
                            0,
                            0,
                            0,
                            0,
                            SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED,
                        );
                    }
                }
                let protocol_workspace = workspace.clone();
                let ipc_workspace = workspace.clone();
                let web = WebViewBuilder::new()
                    .with_https_scheme(true)
                    .with_incognito(true)
                    .with_initialization_script(
                        "Object.defineProperty(window, '__DBMAPS_DESKTOP__', {value:true});",
                    )
                    .with_custom_protocol("dbmaps".into(), move |_, request| {
                        let builder = wry::http::Response::builder()
                            .header("Content-Security-Policy", CSP)
                            .header("Cache-Control", "no-store");
                        if request.uri().path() == "/__native" {
                            if request.method() != "POST"
                                || request
                                    .headers()
                                    .get("Origin")
                                    .is_some_and(|origin| origin != ORIGIN)
                            {
                                return builder
                                    .status(403)
                                    .body(Cow::Borrowed(b"Forbidden".as_slice()))
                                    .unwrap();
                            }
                            let value =
                                command(&mut protocol_workspace.lock().unwrap(), request.body())
                                    .unwrap_or_else(|message| json!({"error": message}));
                            return builder
                                .header("Content-Type", "application/json")
                                .body(Cow::Owned(serde_json::to_vec(&value).unwrap()))
                                .unwrap();
                        }
                        match asset(request.uri().path()) {
                            Some((mime, content)) => {
                                builder.header("Content-Type", mime).body(content).unwrap()
                            }
                            None => builder
                                .status(404)
                                .body(Cow::Borrowed([].as_slice()))
                                .unwrap(),
                        }
                    })
                    .with_ipc_handler(move |request| {
                        if request.uri().host() != Some("dbmaps.localhost") {
                            return;
                        }
                        if let Ok(snapshot) = serde_json::from_str::<Snapshot>(request.body()) {
                            if let Ok(mut workspace) = ipc_workspace.try_lock() {
                                workspace.update(snapshot);
                            }
                        }
                    })
                    .with_navigation_handler(|url| url.starts_with(&format!("{ORIGIN}/")))
                    .with_new_window_req_handler(|_, _| NewWindowResponse::Deny)
                    .with_download_started_handler(|url, destination| {
                        if !url.starts_with(&format!("blob:{ORIGIN}/")) && !url.starts_with("data:")
                        {
                            return false;
                        }
                        let Some(path) = rfd::FileDialog::new()
                            .set_file_name(
                                destination
                                    .file_name()
                                    .unwrap_or_default()
                                    .to_string_lossy(),
                            )
                            .save_file()
                        else {
                            return false;
                        };
                        *destination = path;
                        true
                    })
                    .with_url("dbmaps://localhost/app")
                    .build(window)
                    .unwrap_or_else(|message| {
                        error(&format!("Cannot start editor: {message}"));
                        std::process::exit(1);
                    });
                window.on_window_should_close(cx, move |_, _| {
                    for document in workspace.lock().unwrap().documents.values_mut() {
                        match prepare(document) {
                            Ok(true) => {}
                            Ok(false) => return false,
                            Err(message) => {
                                error(&message);
                                return false;
                            }
                        }
                    }
                    true
                });
                cx.new(|_| Desktop { _web: web })
            },
        )
        .expect("Cannot open DBMaps window");
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    #[::core::prelude::v1::test]
    fn assets_reject_traversal() {
        assert!(asset("/app").is_some());
        assert!(asset("/%2e%2e/package.json").is_none());
        assert!(asset("/assets%5csecret").is_none());
    }
    #[::core::prelude::v1::test]
    fn adoption_requires_selected_document() {
        let mut workspace = Workspace::default();
        assert!(command(&mut workspace, br#"{"action":"adopt","id":"x"}"#).is_err());
        let result = command(&mut workspace, br#"{"action":"launch"}"#).unwrap();
        assert_eq!(result["name"], "Untitled.dbml");
        command(&mut workspace, br#"{"action":"adopt","id":"x"}"#).unwrap();
        assert!(workspace.documents.contains_key("x"));
    }
}
