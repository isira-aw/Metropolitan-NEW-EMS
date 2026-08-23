# EMS Android Wrapper

A thin Capacitor WebView shell that loads the already-deployed EMS frontend
(`front-e`) as a native Android app. No frontend code is bundled here — this
project only opens the production URL.

## One-time setup (on your PC)

1. Install prerequisites: Node.js, [Android Studio](https://developer.android.com/studio) (includes the Android SDK).
2. Edit `capacitor.config.ts` and replace `REPLACE-WITH-YOUR-PRODUCTION-URL`
   with your deployed EMS URL (e.g. the Railway production URL).
3. From this folder:
   ```bash
   npm install
   npx cap add android
   npx cap sync android
   ```
   This generates the native project under `android/`.

## Building the APK

1. Open the generated project in Android Studio:
   ```bash
   npx cap open android
   ```
2. In Android Studio: **Build > Generate Signed Bundle / APK... > APK**,
   create/select a signing key, and build a release APK.
3. The signed APK will be under `android/app/release/`.

## Publishing a new version (manual, no CI)

1. Bump the version in `android/app/build.gradle` (`versionCode` / `versionName`)
   and rebuild the signed APK.
2. Create a new GitHub Release in this repo (e.g. tag `v1.0.1`).
3. Upload the APK as a release asset named exactly `ems-app.apk` — this keeps
   the "latest release" link stable:
   ```
   https://github.com/<org>/<repo>/releases/latest/download/ems-app.apk
   ```
4. Set `NEXT_PUBLIC_APK_DOWNLOAD_URL` (in `front-e`'s environment config) to
   that URL. The sidebar "Get Android App" link only needs updating if you
   change the asset filename or repo — otherwise it stays correct across releases.

## Notes

- The sidebar download link (in `front-e`) only shows for Android browser
  visitors, and hides itself automatically when opened from inside this
  wrapped app (it checks for `window.Capacitor`).
- Rebuilding after a `front-e` change is never required — the app always
  loads the live production URL, so this wrapper needs updates only when
  you change the app icon/name/signing, not on every frontend deploy.
