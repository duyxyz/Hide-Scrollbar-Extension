# Hide Scrollbar Extension

Browser extension to hide scrollbars on websites while keeping page scrolling usable.

It supports:
- Chromium-based browsers
- Per-site whitelist
- Popup toggle
- Side panel for editing exceptions
- Import/export of saved settings

## Project Structure

```text
manifest.json

src/
  entries/
    background.js
    content.js
  features/
    popup/
    sidepanel/
    whitelist/
  shared/

assets/
  icons/
  styles/

_locales/
```

## Development Workflow

The extension runs directly out of the project root!

1. Open the project root folder.
2. Edit your source files in `src/`, `assets/`, or `_locales/`.
3. In Chrome/Edge, go to Extensions and click **Load unpacked**.
4. Select the `Hide.Scrollbar.Extension` root folder.
5. You're done! Reload the extension to see your changes.

## Packaging

The GitHub workflow handles building the release `.zip` automatically whenever you push to main/master. It zips the root directory and securely packages the extension.
