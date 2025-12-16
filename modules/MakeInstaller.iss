#define MyAppName "Guboril"
#define MyAppVersion "1.1.1"
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

Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes
LZMANumBlockThreads=32

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
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall runascurrentuser skipifsilent
