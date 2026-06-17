# ===========================================================================
# Build the BrewPos Android APK (offline standalone) in one command.
#   PowerShell:  .\build-apk.ps1
# Output: BrewPos.apk in this folder.
# Requires: Android Studio installed (provides Java/JBR + Android SDK).
# ===========================================================================
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$fe   = Join-Path $root "apps\frontend"
$andr = Join-Path $fe "android"

# --- locate Android Studio's bundled Java (JBR) + the Android SDK ----------
$jbrCandidates = @(
  "$env:ProgramFiles\Android\Android Studio\jbr",
  "$env:LOCALAPPDATA\Programs\Android Studio\jbr"
)
$jbr = $jbrCandidates | Where-Object { Test-Path "$_\bin\java.exe" } | Select-Object -First 1
if (-not $jbr) { throw "Java (Android Studio JBR) not found. Install Android Studio first." }

$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = "$env:LOCALAPPDATA\Android\Sdk" }
if (-not (Test-Path $sdk)) { throw "Android SDK not found at $sdk. Open Android Studio once to install it." }

$env:JAVA_HOME = $jbr
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
Write-Host "JAVA_HOME = $jbr"
Write-Host "ANDROID_HOME = $sdk"

# sdk.dir for Gradle (forward slashes are valid in a .properties file)
"sdk.dir=$($sdk -replace '\\','/')" | Out-File -FilePath (Join-Path $andr "local.properties") -Encoding ascii

# --- 1) build the static, OFFLINE web app (STANDALONE=1 baked in) ----------
Write-Host "`n[1/3] Building web app (offline standalone)..." -ForegroundColor Cyan
Set-Location $fe
cmd /c "yarn build:app"
if ($LASTEXITCODE -ne 0) { throw "web build failed" }

# --- 2) copy the web assets into the Android project -----------------------
Write-Host "`n[2/3] Syncing into Android project..." -ForegroundColor Cyan
cmd /c "npx cap sync android"
if ($LASTEXITCODE -ne 0) { throw "cap sync failed" }

# --- 3) build the APK ------------------------------------------------------
Write-Host "`n[3/3] Building APK with Gradle..." -ForegroundColor Cyan
Set-Location $andr
& "$andr\gradlew.bat" ":app:assembleDebug" "--console=plain"
if ($LASTEXITCODE -ne 0) { throw "gradle build failed" }

# --- copy result to repo root ----------------------------------------------
$apk = Join-Path $andr "app\build\outputs\apk\debug\app-debug.apk"
$dest = Join-Path $root "BrewPos.apk"
Copy-Item $apk $dest -Force
Set-Location $root
$mb = "{0:N1}" -f ((Get-Item $dest).Length / 1MB)
Write-Host "`nDONE  ->  $dest  ($mb MB)" -ForegroundColor Green
Write-Host "Copy it to your tablet and install (allow 'unknown sources')."
