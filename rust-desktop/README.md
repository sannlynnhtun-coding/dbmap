# DBMaps Desktop 1.0

Windows x64 desktop host for the existing Vue editor. The installer includes a
Fixed Version WebView2 runtime and embedded editor assets. No server or account
is needed for editing local documents.

## Build and test

Prerequisites: Node.js 22+, installed project dependencies, Rust MSVC toolchain,
Visual Studio C++ Build Tools, Windows SDK, and Inno Setup 6.

From the repository root, with Cargo on PATH:

```powershell
npm test
npm run lint
npm run build
cargo test --locked --manifest-path rust-desktop/Cargo.toml
cargo build --release --locked --manifest-path rust-desktop/Cargo.toml
node rust-desktop/collect-notices.mjs
```

The web build must precede Cargo: Rust embeds `dist/`. Rebuild Rust after changing
web assets. During development, run `cargo run --locked --manifest-path
rust-desktop/Cargo.toml`. An installed WebView2 runtime is needed unless a fixed
runtime is placed in `WebView2Runtime` beside `DBMaps.exe`.

Download and extract Microsoft's original x64 Fixed Version WebView2 package.
Do not use a browser installation or include an existing user profile.
Keep its notices and all runtime files. Package using Inno Setup:
The installer also places its `vcruntime140.dll` and `vcruntime140_1.dll` beside
the native executable so a clean Windows installation does not need a separate
Visual C++ runtime installation.

```powershell
$sourceExe = (Resolve-Path rust-desktop/target/release/DBMaps.exe).Path
$runtimeDir = 'C:\path\to\Microsoft.WebView2.FixedVersionRuntime.VERSION.x64'
& 'C:\path\to\Inno Setup 6\ISCC.exe' "/DSourceExe=$sourceExe" "/DRuntimeDir=$runtimeDir" rust-desktop/installer.iss
Get-FileHash rust-desktop/Output/DBMaps-Setup-1.0.0-x64.exe -Algorithm SHA256
```

The installer grants the runtime renderer read access required on Windows 10.
It installs per user and registers Open with without changing the default app.
It does not delete user documents during uninstall. Fixed Version WebView2 does
not update itself; ship a new installer to update it. See Microsoft's
[runtime distribution instructions](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution#the-fixed-version-runtime-distribution-mode).

## Documents

Use New, Open (Ctrl+O), Save (Ctrl+S), and Save As (Ctrl+Shift+S) in the document
bar. Ctrl+N creates a new file. File association launches each file in a new
window. Native close prompts offer Save, Discard and Cancel for edited projects.
Existing workspace projects created through the sidebar remain available in
that window; save each as a file before closing.

`.dbml` is UTF-8 text: a leading `// dbmaps-layout:` JSON comment stores format
version 1, exact table-name keys and x/y positions, table density and optional
relationship visibility. DBML TableGroup definitions remain in the schema.
Layout-only changes retain schema text and comments. Unambiguous table renames
retain positions. Visual schema edits use the existing DBML generator; inspect
the resulting code if using syntax beyond the editor's supported subset.

Missing layout uses automatic arrangement. Malformed, duplicate or future
metadata opens with a warning and requires Save As to a different filename.
Other DBML tools may remove comments, losing layout. A file changed externally
cannot be silently overwritten: reopen or choose another filename with Save As.
Save uses a temporary file in the destination directory and replaces the target
only after the complete write succeeds.

Browser storage is a different profile. To bring a web project into Desktop,
export its Full Project Backup (`.dbmap.json`), use Import Project Backup in
Desktop, then Save As `.dbml`. The backup format remains unchanged. The `.dbml`
document does not contain workspace folders or version-history snapshots.

## Release gate

Follow `docs/windows-desktop-plan.my.md`. Do not publish stable `v1.0.0` until
automated checks, native file dialogs, external-change/read-only failures,
schema/layout round-trip, and installation/upgrade/uninstall on clean offline
Windows have passed. Include the installer, SHA256SUMS.txt, example.dbml and
accurate release notes. Verify the intended repository and that the tag does
not already exist. Record the exact source commit used for the tested build.
Unsigned builds may trigger Windows warnings; do not describe them as signed.

### Native renderer integration check

Use a disposable copy and a dedicated debugging port. Never point this test at
a user document; it drags a table, renames it, removes a column and saves edits.

```powershell
New-Item -ItemType Directory -Force tmp | Out-Null
Copy-Item docs/example.dbml tmp/desktop-integration.dbml
$testDocument = (Resolve-Path tmp/desktop-integration.dbml).Path
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = '--remote-debugging-port=13378'
Start-Process rust-desktop/target/release/DBMaps.exe -ArgumentList "`"$testDocument`""
Remove-Item Env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS
# After the document loads:
node rust-desktop/test-renderer.mjs
```

For clean offline deployment checks, map the installer output folder to
`C:\DBMapsRelease` in Windows Sandbox with networking disabled. Include
`example.dbml` and `test-offline.ps1` (UTF-8 with BOM for Windows PowerShell 5).
Run the script as the sandbox logon command. It writes `offline-results.json`,
startup diagnostics and install/upgrade logs to that mapped folder. It tests
install, document launch using the bundled runtime, reinstall, uninstall and
preservation of a document outside the install directory.
