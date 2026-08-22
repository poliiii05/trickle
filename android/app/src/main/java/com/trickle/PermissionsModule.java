package com.trickle;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.Process;
import android.provider.Settings;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

public class PermissionsModule extends ReactContextBaseJavaModule {

    public static final String NAME = "PermissionsModule";

    public PermissionsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    // ---------- Usage access ----------

    private boolean hasUsageAccess() {
        Context ctx = getReactApplicationContext();
        AppOpsManager appOps = (AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
        if (appOps == null) return false;

        int mode;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            mode = appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    ctx.getPackageName());
        } else {
            mode = appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    ctx.getPackageName());
        }
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    @ReactMethod
    public void hasUsageStatsPermission(Promise promise) {
        promise.resolve(hasUsageAccess());
    }

    @ReactMethod
    public void openUsageAccessSettings() {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
    }

    // ---------- Overlay ----------

    @ReactMethod
    public void canDrawOverlays(Promise promise) {
        promise.resolve(Settings.canDrawOverlays(getReactApplicationContext()));
    }

    @ReactMethod
    public void openOverlaySettings() {
        Context ctx = getReactApplicationContext();
        Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + ctx.getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx.startActivity(intent);
    }

    // ---------- Battery optimization ----------

    @ReactMethod
    public void isIgnoringBatteryOptimizations(Promise promise) {
        Context ctx = getReactApplicationContext();
        PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
        if (pm == null) {
            promise.resolve(false);
            return;
        }
        promise.resolve(pm.isIgnoringBatteryOptimizations(ctx.getPackageName()));
    }

    @ReactMethod
    public void openBatteryOptimizationSettings() {
        Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
    }

    // ---------- Lahat ng status sa isang tawag ----------

    @ReactMethod
    public void getPermissionStatus(Promise promise) {
        Context ctx = getReactApplicationContext();
        PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);

        WritableMap map = Arguments.createMap();
        map.putBoolean("usageStats", hasUsageAccess());
        map.putBoolean("overlay", Settings.canDrawOverlays(ctx));
        map.putBoolean("batteryExempt",
                pm != null && pm.isIgnoringBatteryOptimizations(ctx.getPackageName()));
        promise.resolve(map);
    }
}