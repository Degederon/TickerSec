; TickerSec installer additions (one-click, no prompts).
;
; Upgrade flow: close any running copy silently -> electron-builder runs the
; old version's uninstaller silently -> new version installed -> app starts.
; Settings in %APPDATA%\TickerSec are kept.

; Replace the default "TickerSec is running, click OK to close it" prompt
; with a silent close. Runs in both the installer and the uninstaller, so the
; old version's uninstaller finds nothing running and asks nothing either.
!macro customCheckAppRunning
  ; Close every running TickerSec (and pre-rename Breaking News) by name, then
  ; wait until they are really gone so no file is locked during the upgrade.
  StrCpy $R8 0
  ${Do}
    nsExec::Exec `"$SYSDIR\taskkill.exe" /F /IM "${APP_EXECUTABLE_FILENAME}"`
    Pop $0
    nsExec::Exec `"$SYSDIR\taskkill.exe" /F /IM "Breaking News.exe"`
    Pop $0
    nsExec::Exec `"$SYSDIR\cmd.exe" /c ""$SYSDIR\tasklist.exe" /FI "IMAGENAME eq ${APP_EXECUTABLE_FILENAME}" /NH | "$SYSDIR\find.exe" /I "${APP_EXECUTABLE_FILENAME}" >nul"`
    Pop $0
    ${If} $0 != 0
      ${Break}
    ${EndIf}
    IntOp $R8 $R8 + 1
    ${If} $R8 > 20
      ${Break}
    ${EndIf}
    Sleep 500
  ${Loop}
  Sleep 500
  !ifndef BUILD_UNINSTALLER
    ; Remove any older version ourselves instead of running its uninstaller
    ; (an old uninstaller that misbehaves can't block the upgrade). Settings in
    ; %APPDATA%\TickerSec are not touched. With the old entry gone, setup
    ; does a clean, fresh install.
    ${If} ${FileExists} "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    ${AndIf} "$INSTDIR" != ""
      DetailPrint `Removing the previous version from $INSTDIR`
      RMDir /r "$INSTDIR"
    ${EndIf}
    DeleteRegKey SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}"
    !ifdef UNINSTALL_REGISTRY_KEY_2
      DeleteRegKey SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY_2}"
    !endif
  !endif
!macroend

; If the OLD version's uninstaller fails during an upgrade, don't stop with
; "Failed to uninstall old application files" — just install over it.
!macro customUnInstallCheck
  ${If} $R0 != 0
    DetailPrint `Old version's uninstaller returned $R0 — installing over it.`
  ${EndIf}
  ClearErrors
!macroend
!macro customUnInstallCheckCurrentUser
  ${If} $R0 != 0
    DetailPrint `Old version's uninstaller returned $R0 — installing over it.`
  ${EndIf}
  ClearErrors
!macroend

; ── Uninstall: keep settings or remove everything ──────────────────────────
; Windows Settings → Apps → Uninstall already asks "are you sure", so Windows
; starts our uninstaller quietly with --ask and TickerSec asks ONE question:
;   Yes = uninstall, keep settings · No = uninstall, remove everything · Cancel = stop
; Upgrades run the old uninstaller with --updated: never asked, settings kept.
; A plain silent uninstall (/S without --ask) keeps settings and asks nothing.

!macro customInstall
  ${if} $installMode == "all"
    WriteRegStr SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" UninstallString '"$INSTDIR\${UNINSTALL_FILENAME}" /allusers /S --ask'
  ${else}
    WriteRegStr SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" UninstallString '"$INSTDIR\${UNINSTALL_FILENAME}" /currentuser /S --ask'
  ${endif}
!macroend

!ifdef BUILD_UNINSTALLER
!include "StrFunc.nsh"
${UnStrStr}
Var /GLOBAL bnRemoveAll

!macro customUnInit
  StrCpy $bnRemoveAll "0"
  ${ifNot} ${isUpdated}
    ${GetParameters} $R0
    ClearErrors
    ${GetOptions} $R0 "--ask" $R1
    ${ifNot} ${Errors}
      StrCpy $R2 "ask"
    ${else}
      ClearErrors
      ${GetOptions} $R0 "/S" $R1
      ${if} ${Errors}
        StrCpy $R2 "ask"      ; uninstaller opened directly (not silent)
      ${else}
        StrCpy $R2 "quiet"    ; scripted silent uninstall: keep settings
      ${endif}
    ${endif}
    ${if} $R2 == "ask"
      MessageBox MB_YESNOCANCEL|MB_ICONQUESTION "Uninstall TickerSec$\r$\n$\r$\nDo you want to keep your settings?$\r$\n$\r$\nYes  -  keep your news services, alerts and other settings, in case you install TickerSec again.$\r$\n$\r$\nNo  -  remove everything, as if TickerSec was never installed.$\r$\n$\r$\nCancel  -  don't uninstall." IDYES bn_ui_keep IDNO bn_ui_remove
      ; Cancel: TickerSec was closed to uninstall it, so start it again.
      ${if} ${FileExists} "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
        Exec '"$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
      ${endif}
      Quit
      bn_ui_remove:
      StrCpy $bnRemoveAll "1"
      bn_ui_keep:
    ${endif}
  ${endif}
!macroend

!macro customUnInstall
  ${ifNot} ${isUpdated}
    ; The program is gone either way, so its "Start with Windows" entry goes too
    ; (the app re-creates it on start-up if a kept setting asks for it).
    StrCpy $R5 0
    bn_run_loop:
      EnumRegValue $R6 HKCU "Software\Microsoft\Windows\CurrentVersion\Run" $R5
      StrCmp $R6 "" bn_run_done
      ReadRegStr $R7 HKCU "Software\Microsoft\Windows\CurrentVersion\Run" $R6
      ${UnStrStr} $R8 $R7 "TickerSec.exe"
      StrCmp $R8 "" 0 bn_run_del
      ${UnStrStr} $R8 $R7 "Breaking News.exe"
      StrCmp $R8 "" bn_run_next
      bn_run_del:
        DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" $R6
        DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" $R6
        Goto bn_run_loop
      bn_run_next:
      IntOp $R5 $R5 + 1
      Goto bn_run_loop
    bn_run_done:
  ${endif}

  ${if} $bnRemoveAll == "1"
    ; Clean removal: settings, saved sign-ins, caches, leftover update downloads.
    SetShellVarContext current
    RMDir /r "$APPDATA\TickerSec"
    RMDir /r "$APPDATA\tickersec"
    RMDir /r "$LOCALAPPDATA\tickersec-updater"
    Delete "$TEMP\TickerSec Setup*.exe"
    Delete "$LOCALAPPDATA\Temp\TickerSec Setup*.exe"
    ; leftovers from before the rename
    RMDir /r "$APPDATA\Breaking News"
    RMDir /r "$APPDATA\breaking-news"
    Delete "$TEMP\Breaking News Setup*.exe"
    Delete "$LOCALAPPDATA\Temp\Breaking News Setup*.exe"
  ${endif}
!macroend
!endif
