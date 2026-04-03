# NFT Massacre Android v0.1.0

## Highlights

- Native Android wrapper around the existing `nftmassacre.github.io` web app
- Local asset packaging under Android `app/src/main/assets/www`
- Fullscreen WebView shell with JavaScript, DOM storage, media playback, and hardware acceleration enabled
- Local site loading through `WebViewAssetLoader`
- File chooser bridge for the hidden world-object import input
- External download handoff through Android downloads or browser fallback

## Artifacts

- Installable debug APK for device testing
- Release AAB built from the same bundled web assets
- Release APK output is also produced locally, but it is unsigned in this initial wrapper setup
