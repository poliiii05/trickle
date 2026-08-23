package com.trickle;

import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import android.app.usage.UsageEvents;
import java.util.HashMap;
import java.util.Map;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

public class AppsModule extends ReactContextBaseJavaModule {

    public static final String NAME = "AppsModule";
    private static final int ICON_SIZE = 96;

    public AppsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    // ---------- Installed apps (walang icon — mabilis) ----------

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            Context ctx = getReactApplicationContext();
            PackageManager pm = ctx.getPackageManager();

            Intent launcherIntent = new Intent(Intent.ACTION_MAIN, null);
            launcherIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> resolveInfos = pm.queryIntentActivities(launcherIntent, 0);

            WritableArray result = Arguments.createArray();
            String self = ctx.getPackageName();

            for (ResolveInfo info : resolveInfos) {
                String pkg = info.activityInfo.packageName;
                if (pkg.equals(self)) continue;

                WritableMap item = Arguments.createMap();
                item.putString("packageName", pkg);
                item.putString("appLabel", info.loadLabel(pm).toString());
                item.putBoolean("isSystemApp", isSystemApp(pm, pkg));
                result.pushMap(item);
            }
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("APPS_ERROR", e.getMessage(), e);
        }
    }

    // ---------- Icon on demand ----------

    @ReactMethod
    public void getAppIcon(String packageName, Promise promise) {
        try {
            PackageManager pm = getReactApplicationContext().getPackageManager();
            Drawable icon = pm.getApplicationIcon(packageName);
            promise.resolve(drawableToBase64(icon));
        } catch (Exception e) {
            promise.resolve(null);
        }
    }

    // ---------- Usage stats ----------

        @ReactMethod
    public void getUsageStats(double startMs, double endMs, Promise promise) {
        try {
            Context ctx = getReactApplicationContext();
            UsageStatsManager usm =
                    (UsageStatsManager) ctx.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) {
                promise.reject("NO_SERVICE", "Walang UsageStatsManager");
                return;
            }

            long start = (long) startMs;
            long end = (long) endMs;

            Map<String, Long> totals = new HashMap<>();
            Map<String, Long> openSince = new HashMap<>();
            Map<String, Long> lastUsed = new HashMap<>();

            UsageEvents events = usm.queryEvents(start, end);
            UsageEvents.Event event = new UsageEvents.Event();

            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                int type = event.getEventType();
                long ts = event.getTimeStamp();
                String pkg = event.getPackageName();

                if (type == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    openSince.put(pkg, ts);
                    lastUsed.put(pkg, ts);

                } else if (type == UsageEvents.Event.MOVE_TO_BACKGROUND) {
                    closeSession(totals, openSince, pkg, ts);
                    lastUsed.put(pkg, ts);

                } else if (type == UsageEvents.Event.SCREEN_NON_INTERACTIVE
                        || type == UsageEvents.Event.KEYGUARD_SHOWN) {
                    // Na-lock ang screen — isara lahat ng bukas na session
                    for (String open : new HashMap<>(openSince).keySet()) {
                        closeSession(totals, openSince, open, ts);
                    }
                }
            }

            // Mga app na bukas pa hanggang sa dulo ng range
            for (Map.Entry<String, Long> e : new HashMap<>(openSince).entrySet()) {
                closeSession(totals, openSince, e.getKey(), end);
            }

            PackageManager pm = ctx.getPackageManager();
            WritableArray result = Arguments.createArray();
            String self = ctx.getPackageName();

            for (Map.Entry<String, Long> entry : totals.entrySet()) {
                String pkg = entry.getKey();
                long millis = entry.getValue();

                if (millis <= 0) continue;
                if (pkg.equals(self)) continue;
                if (pm.getLaunchIntentForPackage(pkg) == null) continue;

                WritableMap item = Arguments.createMap();
                item.putString("packageName", pkg);
                item.putString("appLabel", resolveLabel(pm, pkg));
                item.putDouble("totalSeconds", millis / 1000.0);
                item.putDouble("lastTimeUsed",
                        lastUsed.containsKey(pkg) ? lastUsed.get(pkg) : 0);
                result.pushMap(item);
            }
            promise.resolve(result);

        } catch (Exception e) {
            promise.reject("USAGE_ERROR", e.getMessage(), e);
        }
    }

    private void closeSession(Map<String, Long> totals,
                              Map<String, Long> openSince,
                              String pkg, long endTs) {
        Long since = openSince.remove(pkg);
        if (since == null || endTs <= since) return;
        long duration = endTs - since;
        totals.put(pkg, totals.containsKey(pkg) ? totals.get(pkg) + duration : duration);
    }

    // ---------- Helpers ----------

    private boolean isSystemApp(PackageManager pm, String pkg) {
        try {
            ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
            return (ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
        } catch (Exception e) {
            return false;
        }
    }

    private String resolveLabel(PackageManager pm, String pkg) {
        try {
            ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
            return pm.getApplicationLabel(ai).toString();
        } catch (Exception e) {
            return pkg;
        }
    }

    private String drawableToBase64(Drawable drawable) {
        Bitmap bitmap;
        if (drawable instanceof BitmapDrawable
                && ((BitmapDrawable) drawable).getBitmap() != null) {
            bitmap = Bitmap.createScaledBitmap(
                    ((BitmapDrawable) drawable).getBitmap(), ICON_SIZE, ICON_SIZE, true);
        } else {
            bitmap = Bitmap.createBitmap(ICON_SIZE, ICON_SIZE, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            drawable.setBounds(0, 0, ICON_SIZE, ICON_SIZE);
            drawable.draw(canvas);
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, out);
        return "data:image/png;base64,"
                + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    }
}