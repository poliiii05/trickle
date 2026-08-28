# Trickle

An Android app usage limiter that actually enforces its limits.

You give an app a time budget — say 20 minutes. When it runs out, the app is blocked for a cooldown you choose, then the budget resets. No extend button. All data stays on the device.

Built with React Native and a custom Java native module. The tracking and blocking engine runs entirely in native code, because JavaScript isn't running when the app is closed — and that's exactly when the limits need to hold.

---

## Why this was harder than it looks

Android has no API for blocking apps. There is no `blockApp(packageName)`. Everything below exists because the platform pushes back at every step.

### The countdown can't live in JavaScript

The obvious approach is to track time in React and call into native only to block. That fails immediately: when you close Trickle and open Instagram, the JS thread is suspended. Nothing counts.

So the native side owns the state:

```
JS layer                          Native layer (Java)
─────────                         ───────────────────
SQLite (op-sqlite)                SharedPreferences
  • limit config                    • working copy of limits
  • usage history                   • remainingSeconds
  • block events                    • lockedUntil
                                    • the countdown itself
        │                                    │
        └────── syncLimits() ────────────────┘
        ◄───── getLimitState() ──────────────┘
```

The same limits are stored twice on purpose. SQLite is the source of truth for the UI; SharedPreferences is what the `AccessibilityService` reads every 500 ms. A service can't wait on a JS bridge round-trip to decide whether to block.

### Two clocks, and mixing them is a bug

`TrackingEngine` uses both, deliberately:

| Clock | Used for | Why |
|---|---|---|
| `SystemClock.elapsedRealtime()` | measuring elapsed time between ticks | Monotonic. Changing the device clock can't grant free minutes. |
| `System.currentTimeMillis()` | the `lockedUntil` timestamp | Wall clock. `elapsedRealtime` resets on reboot — restarting the phone would clear every lock. |

### Window events lie

`TYPE_WINDOW_STATE_CHANGED` fires for keyboards, toasts, popups, and system overlays — not just apps. Early builds burned a user's Facebook budget while they typed, because the IME package became the "foreground app."

Two fixes: only accept packages that have a launcher entry, and reconcile every tick against `UsageStatsManager.queryEvents()` with a 1.5-second window. Accessibility events are fast but unreliable; usage events are reliable but lag. Using both covers the gap.

### The blocking screen was an Activity. Then this showed up in logcat:

```
14:43:52.763  Background activity start for com.trickle allowed
              because SYSTEM_ALERT_WINDOW permission is granted.
14:43:52.859  Force finishing activity com.trickle/.BlockScreenActivity
14:43:52.861  Force finishing activity com.trickle/.MainActivity
14:43:54.796  Volatile state reset (service restarted)
```

The launch was permitted. Ninety-six milliseconds later the OEM's power manager killed the activity, the main activity, and the whole process. No amount of battery-optimization whitelisting stopped it — on the test device the app was being killed roughly every thirty seconds.

The fix was architectural: stop using an Activity. `BlockOverlay` draws directly through `WindowManager` with `TYPE_APPLICATION_OVERLAY`. An overlay has no task and no activity lifecycle, so there is nothing for `Force finishing` to target. It lives and dies with the accessibility service.

This is why most Android blockers use overlays. Not because they're nicer — because activities don't survive aggressive OEMs.

---

## Features

**Limits**
- Per-app screen time budget with a configurable cooldown after it runs out
- Any combination from 1 minute to 24 hours, with presets (daily budget, Pomodoro, short break)
- Settings freeze while an app is locked — you can't raise the limit to escape it
- Pause a limit without deleting it; paused apps keep their config and move to their own section

**Blocking**
- Full-screen overlay with a live countdown and an hourglass whose sand level tracks the remaining lock time
- Warning notifications at 5 minutes and 1 minute remaining
- Hardcoded whitelist — Settings, dialer, launcher, and Trickle itself can never be blocked
- Kill switch in Settings, plus an emergency "clear all locks"

**Stats**
- Screen time bucketed by day, week, month, or quarter depending on the range
- Independent range filters for the time chart and the app chart
- Block counts and reopen attempts per app
- CSV export

**Interface**
- Light and dark themes with a semantic token system
- Guided onboarding for the three permissions Android won't grant through a normal dialog
- Adaptive launcher icon with a monochrome variant for Android 13+ themed icons

---

## Stack

| Layer | Choice |
|---|---|
| Framework | React Native 0.82 (New Architecture), TypeScript |
| Native | Java — accessibility service, foreground service, overlay, custom `View` |
| Database | SQLite via `@op-engineering/op-sqlite` |
| State | Zustand |
| Navigation | React Navigation (bottom tabs + native stack) |
| Charts | `react-native-gifted-charts` + custom components |
| Icons | `lucide-react-native` |

Everything is local. There is no backend, no account, and no network permission for user data. Usage patterns are personal, and this app is a single-device tool — an account layer would add liability without adding capability.

---

## Structure

```
src/
├── native/          TypeScript wrappers for the Java modules
├── db/              SQLite client, schema migrations, repositories
├── store/           Zustand state
├── theme/           Palette, tokens, ThemeProvider
├── components/      Card, ProgressBar, ConfirmModal, Toast, charts
├── screens/
│   ├── home/        Today — usage list with limit indicators
│   ├── apps/        Limits list, app picker, limit editor
│   ├── records/     Stats — usage and blocks
│   ├── settings/    Permissions, theme, kill switch
│   └── onboarding/  Permission walkthrough
├── hooks/           useLiveLimits — polls native state
└── utils/           Time formatting, range bucketing, chart scaling

android/app/src/main/java/com/trickle/
├── TrickleAccessibilityService.java   Foreground app detection, tick loop
├── TrackingEngine.java                Countdown, lock lifecycle, enforcement
├── BlockOverlay.java                  WindowManager overlay
├── HourglassView.java                 Custom View — sand level from lock progress
├── LimitStore.java                    SharedPreferences, native source of truth
├── Whitelist.java                     Packages that can never be blocked
├── KeepAliveService.java              Foreground service
├── BootReceiver.java                  Restores locks after reboot
├── AppsModule.java                    Installed apps, usage stats
├── PermissionsModule.java             Permission checks and settings intents
├── TrackingModule.java                Bridge for limits and monitoring
└── NotificationHelper.java            Limit warnings
```

---

## Running it

Requirements: Node 22+, JDK 17, Android Studio with the SDK, and a physical device. An emulator won't work — there are no real apps on it to track.

```bash
git clone https://github.com/poliiii05/trickle.git
cd trickle
npm install
npm run android
```

Three permissions have to be granted manually. The onboarding screen walks through each one, or:

| Permission | Where | Required |
|---|---|---|
| Usage access | Settings → Apps → Special app access → Usage access | Yes |
| Accessibility service | Settings → Accessibility → Trickle | Yes |
| Display over other apps | Settings → Apps → Special app access | Yes |
| Ignore battery optimization | Settings → Battery | Recommended |

The accessibility service reads only the package name of the foreground window. `canRetrieveWindowContent` is set to `false` in the service config — it cannot read screen content, and the manifest declares that.

### On Honor, Xiaomi, Oppo, Vivo, and Realme

These skins kill background services aggressively. Without this, tracking silently stops:

1. Open Recents, drag the Trickle card down until a padlock appears
2. Settings → Battery → App launch → Trickle → turn off "Manage automatically", enable all three toggles
3. Settings → Apps → Trickle → Battery → Unrestricted

---

## Known limitations

These are platform boundaries, not bugs. Documenting them is part of the design.

**Cloned and dual apps can't be limited.** Blocking works by package name. A cloned app has a different package name, and clones running in a separate Android user profile aren't visible to `UsageStatsManager` at all. There is no way around this from inside a normal app.

**There is a sub-second gap when opening a locked app.** The overlay can only appear after Android reports the app is in the foreground. Every blocker on the platform has this; it's most noticeable on a cold start.

**It is not tamper-proof.** You can disable the accessibility service in Settings and the blocking stops. This is friction, not prevention — and friction is the actual product. Thirty seconds of inconvenience is usually enough to reconsider.

**OEM power management can still win.** The mitigations above help, but some skins will eventually kill the service. Settings shows a live health indicator when that happens.

---

## Roadmap

- **App groups** — a shared budget across apps in a category, so blocking Instagram doesn't just push you to TikTok
- Schedule-based limits (bedtime mode)
- Strict mode: PIN or a delay before settings can be changed
- Backup and restore
- Home screen widget

---

## Development history

Built in eight phases, each tagged:

| Tag | What landed |
|---|---|
| `v0.1.0` | Java native module bridge |
| `v0.2.0` | Usage stats reading and permission flow |
| `v0.3.0` | SQLite storage and limit configuration |
| `v0.4.0` | Native tracking engine with boot recovery |
| `v0.5.0` | App blocking, whitelist, kill switch |
| `v0.6.0` | Usage history, block insights, CSV export |
| `v0.7.0` | Design system, dark mode, icon, onboarding |
| `v0.8.0` | Overlay-based blocking after OEM process kills |
| `v0.10.0` | Merged stats tab with bucketed ranges |

---

## License

MIT