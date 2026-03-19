param()

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$testRoot = Join-Path $root 'test-builds'
$targets = @('chromium', 'firefox')
$errors = New-Object System.Collections.Generic.List[string]

function Test-PathOrError {
  param(
    [string]$BasePath,
    [string]$RelativePath,
    [string]$Label
  )

  $fullPath = Join-Path $BasePath $RelativePath
  if (-not (Test-Path $fullPath)) {
    $script:errors.Add("$Label missing: $RelativePath")
  }
}

foreach ($target in $targets) {
  $buildRoot = Join-Path $testRoot $target
  $manifestPath = Join-Path $buildRoot 'manifest.json'

  if (-not (Test-Path $manifestPath)) {
    $errors.Add("Manifest missing for $target")
    continue
  }

  $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

  if ($manifest.default_locale) {
    Test-PathOrError -BasePath $buildRoot -RelativePath "_locales\$($manifest.default_locale)\messages.json" -Label "$target locale"
  }

  if ($manifest.icons) {
    $manifest.icons.PSObject.Properties | ForEach-Object {
      Test-PathOrError -BasePath $buildRoot -RelativePath $_.Value -Label "$target icon"
    }
  }

  if ($manifest.action.default_popup) {
    Test-PathOrError -BasePath $buildRoot -RelativePath $manifest.action.default_popup -Label "$target popup"
  }

  if ($manifest.action.default_icon) {
    $manifest.action.default_icon.PSObject.Properties | ForEach-Object {
      Test-PathOrError -BasePath $buildRoot -RelativePath $_.Value -Label "$target action icon"
    }
  }

  if ($manifest.side_panel.default_path) {
    Test-PathOrError -BasePath $buildRoot -RelativePath $manifest.side_panel.default_path -Label "$target side panel"
  }

  if ($manifest.sidebar_action.default_panel) {
    Test-PathOrError -BasePath $buildRoot -RelativePath $manifest.sidebar_action.default_panel -Label "$target sidebar panel"
  }

  if ($manifest.background.service_worker) {
    Test-PathOrError -BasePath $buildRoot -RelativePath $manifest.background.service_worker -Label "$target service worker"
  }

  if ($manifest.background.scripts) {
    foreach ($scriptPath in $manifest.background.scripts) {
      Test-PathOrError -BasePath $buildRoot -RelativePath $scriptPath -Label "$target background script"
    }
  }

  if ($manifest.content_scripts) {
    foreach ($contentScript in $manifest.content_scripts) {
      foreach ($jsPath in $contentScript.js) {
        Test-PathOrError -BasePath $buildRoot -RelativePath $jsPath -Label "$target content script"
      }
    }
  }
}

if ($errors.Count -gt 0) {
  Write-Host 'Test build validation failed:' -ForegroundColor Red
  $errors | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Write-Host 'Test build validation passed:' -ForegroundColor Green
$targets | ForEach-Object { Write-Host " - test-builds/$_" -ForegroundColor Green }
