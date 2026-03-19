# Hide Scrollbar Extension

Browser extension to hide scrollbars on websites while keeping page scrolling usable.

It supports:
- Chromium-based browsers
- Firefox
- Per-site whitelist
- Popup toggle
- Side panel for editing exceptions
- Import/export of saved settings

## Project Structure

```text
platform/
  chromium/manifest.json
  firefox/manifest.json

src/
  entries/
    background.js
    content.js
  features/
    popup/
      popup.html
      popup.js
    sidepanel/
      sidepanel.html
      sidepanel.js
    whitelist/
      whitelist-service.js
  shared/
    i18n.js

assets/
  icons/
  styles/

_locales/
scripts/
test-builds/
```

## Development Workflow

Source files live in:
- `src/`
- `assets/`
- `platform/`
- `_locales/`

Test-ready extension folders are generated in:
- `test-builds/chromium`
- `test-builds/firefox`

These test folders are ignored by Git and can be recreated at any time.

## VS Code Run Buttons

The workspace includes Run/Task entries for development:

- `Run: Refresh + Validate Test Builds`
- `Run: Refresh Test Builds`
- `Run: Validate Test Builds`

Recommended flow:

1. Edit source files.
2. Run `Refresh + Validate Test Builds`.
3. Load unpacked extension from `test-builds/chromium` or `test-builds/firefox`.

## Scripts

- `scripts/refresh-test-builds.ps1`
  Rebuilds both test folders from the current source.

- `scripts/validate-test-builds.ps1`
  Checks that generated test builds contain the files referenced by each manifest.

- `scripts/refresh-and-validate-test-builds.ps1`
  Runs refresh first, then validation.

## Packaging

Browser-specific manifests are stored in:
- `platform/chromium/manifest.json`
- `platform/firefox/manifest.json`

The GitHub workflow builds release archives from those manifests.
