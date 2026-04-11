# Hide Scrollbar Extension

| Icon | Official Store |
| :---: | :--- |
| <img src="assets/icons/icon128.png" width="48" height="48"> | [**Add to Chrome**](https://chromewebstore.google.com/detail/gngenlhkmpneoiicndbjghjhpogdcncl?utm_source=item-share-cb) |


A browser extension to hide scrollbars for a cleaner interface, while keeping scrolling functionality intact.

## Features
- **Universal Hiding**: Works on most websites.
- **Toggle Support**: Easily turn the effect on/off via the popup.
- **Whitelist**: Exclude specific sites from being modified.
- **Side Panel**: Dedicated UI to manage exceptions.
- **Offline Sync**: Settings are synced across browser instances.

## Development
This extension runs directly from the project root.

1. Go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this directory.

## Build
The GitHub Action automatically packages the extension into a `.zip` file on every push to `main`/`master`, excluding non-essential files (`demo/`, `test/`, etc.).
