#define MyAppName "Guboril"
#define MyAppVersion %version%
#define MyAppPublisher "EnderYeekkay"
#define MyAppURL "https://github.com/EnderYeekkay/Guboril"
#define MyAppExeName "Guboril.exe"

[Setup]
AppId={{227563F5-9406-4547-8F3E-D22B9CAB3F5A}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

OutputDir=D:\JavaScript\zapret-gui\dist\Output
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes

SetupIconFile="D:\JavaScript\zapret-gui\public\icon.ico"

PrivilegesRequired=admin

%compression:dev%

OutputBaseFilename=GuborilInstaller

WizardStyle=classic
WizardImageFile="D:\JavaScript\zapret-gui\dist\Output\guboril_finish.bmp"
WizardSmallImageFile="D:\JavaScript\zapret-gui\public\icon.bmp"

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "D:\JavaScript\zapret-gui\dist\Guboril-win32-x64\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "D:\JavaScript\zapret-gui\dist\Guboril-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; \
    Parameters: "-ai"; \
    Flags: waituntilterminated; \
    StatusMsg: "Creating CLI tool... It may take a few seconds"

Filename: "{app}\{#MyAppExeName}"; \
    Description: "Launch {#MyAppName}"; \
    Flags: nowait postinstall runascurrentuser skipifsilent

[UninstallRun]
Filename: "{app}\{#MyAppExeName}"; \
    Parameters: "-bu"; \
    Flags: runhidden waituntilterminated

Filename: "{sys}\taskkill.exe"; \
    Parameters: "/IM Guboril.exe /F /T"; \
    Flags: runhidden waituntilterminated; \
    RunOnceId: "KillGuborilProcess"
Filename: "{sys}\taskkill.exe"; \
    Parameters: "/IM winws /F /T"; \
    Flags: runhidden waituntilterminated; \
    RunOnceId: "KillWinwsProcess"

Filename: "{sys}\sc.exe"; \
    Parameters: "stop WinDivert"; \
    Flags: runhidden waituntilterminated; \
    RunOnceId: "StopWinDivert"
Filename: "{sys}\sc.exe"; \
    Parameters: "delete WinDivert"; \
    Flags: runhidden waituntilterminated; \
    RunOnceId: "DeleteWinDivert"

Filename: "{sys}\sc.exe"; \
    Parameters: "stop zapret"; \
    Flags: runhidden waituntilterminated; \
    RunOnceId: "StopZapret"
Filename: "{sys}\sc.exe"; \
    Parameters: "delete zapret"; \
    Flags: runhidden waituntilterminated; \
    RunOnceId: "DeleteZapret"

[UninstallDelete]
Type: filesandordirs; Name: "{userappdata}\guboril"
Type: filesandordirs; Name: "{localappdata}\guboril"