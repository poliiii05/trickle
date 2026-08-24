package com.trickle;

import android.content.Context;
import android.os.SystemClock;
import android.util.Log;
import android.util.Log;

public class TrackingEngine {

    private static final String TAG = "TrickleEngine";
    private static TrackingEngine instance;

    private final Context appContext;
    private final LimitStore store;

    private String currentPackage = null;
    private long lastTickElapsed = 0L;

    private TrackingEngine(Context ctx) {
        appContext = ctx.getApplicationContext();
        store = LimitStore.get(appContext);
        lastTickElapsed = SystemClock.elapsedRealtime();
    }

    public static synchronized TrackingEngine get(Context ctx) {
        if (instance == null) instance = new TrackingEngine(ctx);
        return instance;
    }

     /** Called by the AccessibilityService whenever a new app comes to the foreground. */
    public synchronized void onForegroundApp(String packageName) {
        tick();  // flush the previous app's accumulated time
        currentPackage = packageName;
        lastTickElapsed = SystemClock.elapsedRealtime();
    }

    public synchronized void onScreenOff() {
        tick();
        currentPackage = null;
    }

       /** Called every second. */
       public synchronized void tick() {
        long nowElapsed = SystemClock.elapsedRealtime();
        long deltaMs = nowElapsed - lastTickElapsed;
        lastTickElapsed = nowElapsed;

        expireLocks();

        if (!store.isMonitoringEnabled()) return;
        if (currentPackage == null) return;
        if (deltaMs <= 0 || deltaMs > 60_000) return;

        LimitEntry e = store.get(currentPackage);
        if (e == null || !e.isActive) return;

        if (e.isLockedNow()) {
            enforceBlock(e);
            return;
        }
        if (e.remainingSeconds <= 0) return;

        e.remainingSeconds -= (deltaMs / 1000.0);

        maybeWarn(e);

        if (e.remainingSeconds <= 0) {
            e.remainingSeconds = 0;
            e.lockedUntil = System.currentTimeMillis() + (e.lockSeconds * 1000L);
            e.attemptCount = 0;
             Log.d(TAG, "Limit exhausted: " + e.packageName);
            store.persist();
            enforceBlock(e);
            return;
        }

        store.persist();
    }

    private void maybeWarn(LimitEntry e) {
        if (!e.warned5min && e.remainingSeconds <= 300 && e.remainingSeconds > 240) {
            e.warned5min = true;
            NotificationHelper.showWarning(appContext, e.appLabel, 5);
        }
        if (!e.warned1min && e.remainingSeconds <= 60 && e.remainingSeconds > 30) {
            e.warned1min = true;
            NotificationHelper.showWarning(appContext, e.appLabel, 1);
        }
    }

       /** Shows the block screen if it isn't already up. */
    public void enforceBlock(LimitEntry e) {
        if (!store.isMonitoringEnabled()) return;
        if (BlockScreenActivity.isVisible()) return;
        if (Whitelist.isProtected(appContext, e.packageName)) return;

        e.attemptCount++;
        store.persist();
        BlockScreenActivity.launch(appContext, e);
    }

        /** Checks every app to see if its lock has expired. */
    private void expireLocks() {
        long now = System.currentTimeMillis();
        boolean changed = false;

        for (LimitEntry e : store.all()) {
                    if (e.lockedUntil > 0 && now >= e.lockedUntil) {
                e.lockedUntil = 0L;
                e.remainingSeconds = e.allowanceSeconds;
                e.warned5min = false;
                e.warned1min = false;
                changed = true;
                Log.d(TAG, "Lock expired: " + e.packageName);
            }
        }
        if (changed) store.persist();
    }

    public synchronized String getCurrentPackage() {
        return currentPackage;
    }
}