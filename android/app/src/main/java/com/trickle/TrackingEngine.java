package com.trickle;

import android.content.Context;
import android.os.SystemClock;
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

    /** Tinatawag ng AccessibilityService tuwing may bagong foreground app. */
    public synchronized void onForegroundApp(String packageName) {
        tick();                       // i-flush muna ang naipong oras ng luma
        currentPackage = packageName;
        lastTickElapsed = SystemClock.elapsedRealtime();
    }

    public synchronized void onScreenOff() {
        tick();
        currentPackage = null;
    }

    /** Tinatawag kada segundo. */
    public synchronized void tick() {
        long nowElapsed = SystemClock.elapsedRealtime();
        long deltaMs = nowElapsed - lastTickElapsed;
        lastTickElapsed = nowElapsed;

        expireLocks();

        if (!store.isMonitoringEnabled()) return;
        if (currentPackage == null) return;
        if (deltaMs <= 0 || deltaMs > 60_000) return;   // clock jump o mahabang tulog

        LimitEntry e = store.get(currentPackage);
        if (e == null || !e.isActive) return;
        if (e.isLockedNow()) return;
        if (e.remainingSeconds <= 0) return;

        e.remainingSeconds -= (deltaMs / 1000.0);

        if (e.remainingSeconds <= 0) {
            e.remainingSeconds = 0;
            e.lockedUntil = System.currentTimeMillis() + (e.lockSeconds * 1000L);
            Log.d(TAG, "Naubos ang limit: " + e.packageName
                    + " · lock hanggang " + e.lockedUntil);
            // Phase 5: dito ilalabas ang block screen
        }

        store.persist();
    }

    /** Sinusuri lahat ng apps kung tapos na ang lock nila. */
    private void expireLocks() {
        long now = System.currentTimeMillis();
        boolean changed = false;

        for (LimitEntry e : store.all()) {
            if (e.lockedUntil > 0 && now >= e.lockedUntil) {
                e.lockedUntil = 0L;
                e.remainingSeconds = e.allowanceSeconds;
                changed = true;
                Log.d(TAG, "Tapos na ang lock: " + e.packageName);
            }
        }
        if (changed) store.persist();
    }

    public synchronized String getCurrentPackage() {
        return currentPackage;
    }
}