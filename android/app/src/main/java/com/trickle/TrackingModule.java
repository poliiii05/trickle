package com.trickle;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;

import org.json.JSONArray;
import org.json.JSONObject;

public class TrackingModule extends ReactContextBaseJavaModule {

    public static final String NAME = "TrackingModule";

    public TrackingModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    // ---------- Accessibility permission ----------

    @ReactMethod
    public void isAccessibilityEnabled(Promise promise) {
        Context ctx = getReactApplicationContext();
        ComponentName target =
                new ComponentName(ctx, TrickleAccessibilityService.class);

        String enabled = Settings.Secure.getString(
                ctx.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);

        if (TextUtils.isEmpty(enabled)) {
            promise.resolve(false);
            return;
        }

        TextUtils.SimpleStringSplitter splitter =
                new TextUtils.SimpleStringSplitter(':');
        splitter.setString(enabled);

        while (splitter.hasNext()) {
            ComponentName parsed = ComponentName.unflattenFromString(splitter.next());
            if (parsed != null && parsed.equals(target)) {
                promise.resolve(true);
                return;
            }
        }
        promise.resolve(false);
    }

    @ReactMethod
    public void openAccessibilitySettings() {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
    }

    @ReactMethod
    public void isServiceRunning(Promise promise) {
        promise.resolve(TrickleAccessibilityService.isRunning());
    }

    // ---------- Limits sync ----------

    @ReactMethod
    public void syncLimits(ReadableArray limits, Promise promise) {
        try {
            JSONArray arr = new JSONArray();
            for (int i = 0; i < limits.size(); i++) {
                com.facebook.react.bridge.ReadableMap m = limits.getMap(i);
                JSONObject o = new JSONObject();
                o.put("packageName", m.getString("packageName"));
                o.put("appLabel", m.getString("appLabel"));
                o.put("allowanceSeconds", m.getInt("allowanceSeconds"));
                o.put("lockSeconds", m.getInt("lockSeconds"));
                o.put("isActive", m.getBoolean("isActive"));
                arr.put(o);
            }
            LimitStore.get(getReactApplicationContext()).replaceAll(arr);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("SYNC_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getLimitState(Promise promise) {
        try {
            JSONArray arr =
                    LimitStore.get(getReactApplicationContext()).stateAsJson();
            promise.resolve(arr.toString());
        } catch (Exception e) {
            promise.reject("STATE_ERROR", e.getMessage(), e);
        }
    }

    // ---------- Monitoring toggle (kill switch) ----------

    @ReactMethod
    public void setMonitoringEnabled(boolean enabled, Promise promise) {
        Context ctx = getReactApplicationContext();
        LimitStore.get(ctx).setMonitoringEnabled(enabled);
        if (enabled) {
            KeepAliveService.start(ctx);
        } else {
            KeepAliveService.stop(ctx);
        }
        promise.resolve(null);
    }

    @ReactMethod
    public void isMonitoringEnabled(Promise promise) {
        promise.resolve(
                LimitStore.get(getReactApplicationContext()).isMonitoringEnabled());
    }

    @ReactMethod
    public void getCurrentForegroundApp(Promise promise) {
        promise.resolve(
                TrackingEngine.get(getReactApplicationContext()).getCurrentPackage());
    }

    @ReactMethod
    public void clearAllLocks(Promise promise) {
        LimitStore store = LimitStore.get(getReactApplicationContext());
        for (LimitEntry e : store.all()) {
            e.lockedUntil = 0L;
            e.remainingSeconds = e.allowanceSeconds;
        }
        store.persist();
        promise.resolve(null);
    }

    @ReactMethod
    public void drainBlockEvents(Promise promise) {
        promise.resolve(BlockLog.drain(getReactApplicationContext()));
    }
}