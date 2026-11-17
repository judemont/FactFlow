# App assets

Drop your source images here, then run:

```bash
npm run icon
```

This generates every launcher icon and splash screen size for iOS and
Android with a dark (#0a0a0c) background.

Required files:

- `icon.png` — 1024×1024, no transparency, keep the artwork inside the
  central ~80% (iOS rounds the corners itself).
- `splash.png` — 2732×2732, dark background, logo centered (it will be
  center-cropped on all screens).
