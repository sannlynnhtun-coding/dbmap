# Run inside Windows Sandbox with C:\DBMapsRelease mapped to the release test folder.
$ErrorActionPreference = 'Stop'
$resultPath = 'C:\DBMapsRelease\offline-results.json'
$steps = [System.Collections.Generic.List[string]]::new()
function Check($Condition, $Message) {
    if (-not $Condition) { throw $Message }
    $steps.Add($Message)
}
try {
    @{ status = 'running' } | ConvertTo-Json | Set-Content $resultPath
    $installDir = Join-Path $env:LOCALAPPDATA 'Programs\DBMaps'
    $installer = 'C:\DBMapsRelease\DBMaps-Setup-1.0.1-x64.exe'
    $install = Start-Process $installer -ArgumentList '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /LOG=C:\DBMapsRelease\install.log' -PassThru -Wait
    Check ($install.ExitCode -eq 0) 'Offline install succeeded'
    Check (Test-Path "$installDir\WebView2Runtime\msedgewebview2.exe") 'Fixed runtime is bundled'
    Check ((Test-Path "$installDir\vcruntime140.dll") -and (Test-Path "$installDir\vcruntime140_1.dll")) 'Native Visual C++ runtime is bundled'
    Check ((Get-Item 'HKCU:\Software\Classes\DBMaps.Document\shell\open\command').GetValue('') -like '*DBMaps.exe*"%1"*') 'File association quotes the document path'
    $documentPath = Join-Path $env:USERPROFILE 'Desktop\မြန်မာ sample.dbml'
    Copy-Item 'C:\DBMapsRelease\example.dbml' $documentPath
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = "$installDir\DBMaps.exe"
    $startInfo.Arguments = "`"$documentPath`""
    $startInfo.UseShellExecute = $false
    $startInfo.EnvironmentVariables['WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS'] = '--remote-debugging-port=13377'
    $app = [System.Diagnostics.Process]::Start($startInfo)
    $deadline = (Get-Date).AddSeconds(60)
    $pages = @()
    do {
        Start-Sleep -Milliseconds 500
        $renderers = @(Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'" | Where-Object { $_.ExecutablePath -like "$installDir\WebView2Runtime\*" })
        try {
            $response = Invoke-WebRequest 'http://127.0.0.1:13377/json' -UseBasicParsing -TimeoutSec 1
            $pages = ConvertFrom-Json -InputObject ([Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray()))
        } catch { }
        $app.Refresh()
    } while ((-not ($pages | Where-Object title -Like '*.dbml*DBMaps')) -and -not $app.HasExited -and (Get-Date) -lt $deadline)
    Check (-not $app.HasExited) 'Desktop app launched offline'
    @{ pages = $pages; processes = @(Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'" | Select-Object Name, ExecutablePath, CommandLine) } | ConvertTo-Json -Depth 4 | Set-Content 'C:\DBMapsRelease\launch-diagnostics.json'
    $errorLog = Join-Path $env:LOCALAPPDATA 'DBMaps\last-error.txt'
    if (Test-Path $errorLog) { Copy-Item $errorLog 'C:\DBMapsRelease\startup-error.txt' }
    Check ($renderers.Count -gt 0) 'App launched the bundled runtime'
    Check (@($pages | Where-Object title -Like '*.dbml*DBMaps').Count -gt 0) 'Editor loaded the DBML document offline'
    Stop-Process -Id $app.Id
    $upgrade = Start-Process $installer -ArgumentList '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /LOG=C:\DBMapsRelease\upgrade.log' -PassThru -Wait
    Check ($upgrade.ExitCode -eq 0) 'Reinstall succeeded'
    $uninstall = Start-Process "$installDir\unins000.exe" -ArgumentList '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART' -PassThru -Wait
    Check ($uninstall.ExitCode -eq 0) 'Uninstall succeeded'
    Check (Test-Path $documentPath) 'User document survived uninstall'
    Check (-not (Test-Path 'HKCU:\Software\Classes\DBMaps.Document')) 'Uninstall removed application file registration'
    @{ status = 'passed'; steps = @($steps); os = [Environment]::OSVersion.VersionString } | ConvertTo-Json -Depth 4 | Set-Content $resultPath
} catch {
    @{ status = 'failed'; steps = @($steps); error = $_.Exception.Message } | ConvertTo-Json -Depth 4 | Set-Content $resultPath
    exit 1
}
