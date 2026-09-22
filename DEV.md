# Dev Reference — Run & Debug

## Run on Physical Android Device

### Prerequisites
- USB cable connected (must support data transfer, not charge-only)
- USB Debugging enabled on phone: Settings → Developer Options → USB Debugging ON
- USB mode set to **File Transfer / MTP** (not Charging)

### 1. Verify device is detected
```bash
adb devices
```
Expected output:
```
List of devices attached
R5CT123ABCD    device
```
If it shows `unauthorized` — tap **Allow** on the phone screen popup.

### 2. Run the app
```bash
cd /Users/sandeep/Projects/ExpenseTracker/ExpenseTrackerFrontend
npx react-native run-android
```
Builds debug APK, installs on phone, and starts Metro bundler. First run takes ~2 min, subsequent runs are faster.

### Troubleshooting
| Problem | Fix |
|---|---|
| `adb devices` shows nothing | Try different USB cable or toggle USB mode to File Transfer |
| `unauthorized` | Tap Allow on phone, or `adb kill-server && adb start-server` |
| Multiple devices | `npx react-native run-android --deviceId <id>` |
| Metro port conflict | `npx react-native start --reset-cache` in separate terminal first |
| Red error screen on phone | Shake phone → Reload, or check Metro terminal for JS errors |

---

## Build Release APK
```bash
cd android && ./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

Install on connected phone:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## Debug

### Open Dev Menu
Shake the phone, or:
```bash
adb shell input keyevent 82
```

### Option 1 — Metro Terminal (simplest)
`console.log` output appears directly in the terminal where you ran `run-android`.

### Option 2 — ADB Logcat
```bash
# Stream all React Native logs
adb logcat | grep "ReactNative\|ReactNativeJS"

# Only JS logs
adb logcat *:S ReactNativeJS:V

# Only errors/crashes
adb logcat *:E
```
For crashes look for `FATAL EXCEPTION` in the output.

### Option 3 — Chrome DevTools
1. Dev Menu → **Open Debugger** (or Debug with Chrome)
2. Chrome opens at `http://localhost:8081/debugger-ui`
3. `Cmd+Option+J` → Console tab shows all logs
4. Set breakpoints in Sources tab

### Option 4 — Flipper (full inspector)
Download: https://fbflipper.com

Connect phone → Flipper auto-detects the app:
- **Logs** — all console output
- **React DevTools** — component tree, props, state
- **Network** — API calls
- **Layout** — visual element inspector

### Option 5 — React Native Debugger (standalone)
```bash
brew install --cask react-native-debugger
open -a "React Native Debugger"
```
Dev Menu → Open Debugger. Combines Redux DevTools + React DevTools + Console in one window.

### Element Inspector
Dev Menu → **Show Element Inspector** → tap any UI element to see its styles and layout.

### Performance Monitor
Dev Menu → **Perf Monitor** → live FPS, JS thread, RAM overlay on the app.

---

## Quick Reference

| What you want | How |
|---|---|
| See console.log | Metro terminal or `adb logcat` |
| Reload JS | Shake → Reload, or press `r` in Metro terminal |
| Inspect component state/props | Flipper → React DevTools |
| See why layout looks wrong | Dev Menu → Show Element Inspector |
| Debug a crash | `adb logcat *:E` — find `FATAL EXCEPTION` |
| Clear all caches | `npx react-native start --reset-cache` |
| TypeScript check | `npx tsc --noEmit` |
| Kotlin compile check | `cd android && ./gradlew :app:compileDebugKotlin` |
