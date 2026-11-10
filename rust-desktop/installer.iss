#ifndef SourceExe
  #error Pass /DSourceExe=<release DBMaps.exe>
#endif
#ifndef RuntimeDir
  #error Pass /DRuntimeDir=<Microsoft fixed-version WebView2 x64 folder>
#endif
#if !FileExists(AddBackslash(RuntimeDir) + "msedgewebview2.exe")
  #error RuntimeDir must contain msedgewebview2.exe
#endif

[Setup]
AppId={{BAEC8ECA-BCBF-40A2-912D-BF41E9E327E0}
AppName=DBMaps
AppVersion=1.0.1
VersionInfoVersion=1.0.1.0
DefaultDirName={localappdata}\Programs\DBMaps
DefaultGroupName=DBMaps
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
ChangesAssociations=yes
OutputBaseFilename=DBMaps-Setup-1.0.1-x64
Compression=lzma2/fast
SolidCompression=yes
SetupIconFile=assets\DBMaps.ico
UninstallDisplayIcon={app}\DBMaps.exe

[Files]
Source: "{#SourceExe}"; DestDir: "{app}"; DestName: "DBMaps.exe"; Flags: ignoreversion
; The native MSVC executable needs these before it can configure WebView2.
Source: "{#RuntimeDir}\vcruntime140.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#RuntimeDir}\vcruntime140_1.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#RuntimeDir}\*"; DestDir: "{app}\WebView2Runtime"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "LICENSE-APACHE"; DestDir: "{app}"; Flags: ignoreversion
Source: "NOTICE.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\build\THIRD-PARTY-NOTICES.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{userprograms}\DBMaps"; Filename: "{app}\DBMaps.exe"

[Registry]
Root: HKCU; Subkey: "Software\Classes\.dbml\OpenWithProgids"; ValueType: string; ValueName: "DBMaps.Document"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Classes\DBMaps.Document"; ValueType: string; ValueData: "DBMaps DBML Document"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\DBMaps.Document\DefaultIcon"; ValueType: string; ValueData: """{app}\DBMaps.exe"",0"
Root: HKCU; Subkey: "Software\Classes\DBMaps.Document\shell\open\command"; ValueType: string; ValueData: """{app}\DBMaps.exe"" ""%1"""
Root: HKCU; Subkey: "Software\Classes\Applications\DBMaps.exe"; ValueType: string; ValueName: "FriendlyAppName"; ValueData: "DBMaps"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\Applications\DBMaps.exe\SupportedTypes"; ValueType: string; ValueName: ".dbml"; ValueData: ""
Root: HKCU; Subkey: "Software\Classes\Applications\DBMaps.exe\shell\open\command"; ValueType: string; ValueData: """{app}\DBMaps.exe"" ""%1"""

[Run]
Filename: "{app}\DBMaps.exe"; Description: "Open DBMaps"; Flags: nowait postinstall skipifsilent

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    if not Exec(ExpandConstant('{sys}\icacls.exe'),
      '"' + ExpandConstant('{app}\WebView2Runtime') + '" /grant *S-1-15-2-2:(OI)(CI)(RX) *S-1-15-2-1:(OI)(CI)(RX)',
      '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
      RaiseException('Cannot prepare offline WebView2 permissions.');
    if ResultCode <> 0 then
      RaiseException('Cannot grant offline WebView2 renderer access.');
  end;
end;
