package com.trickle;

import android.content.Context;
import android.os.SystemClock;
import android.util.Log;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;

public class TrackingEngine {

    private static final String TAG = "TrickleEngine";
    private static TrackingEngine instance;
    private final Context appContext;
    private final LimitStore store;
    private Set<String> launchable = null;
    private long launchableLoadedAt = 0L;
    private String currentPackage = null;
    private long lastTickElapsed = 0L;
    private String suppressPackage = null;
    private long suppressUntil = 0L;
    private TrackingEngine(Context ctx) {
        appContext = ctx.getApplicationContext();
        store = LimitStore.get(appContext);
        lastTickElapsed = SystemClock.elapsedRealtime();
    }

    /** Briefly ignore blocks for a package right after the user dismissed the block screen. */
    public synchronized void suppressBlockFor(String packageName, long millis) {
        suppressPackage = packageName;
        suppressUntil = System.currentTimeMillis() + millis;
    }

    public static synchronized TrackingEngine get(Context ctx) {
        if (instance == null) instance = new TrackingEngine(ctx);
        return instance;
    }
        /**
     * Ask the system what is actually in the foreground right now.
     * Only trusts events from the last 1.5 seconds — anything older is stale
     * and will keep reporting an app the user already left.
     */
    private String queryForegroundPackage() {
        try {
            UsageStatsManager usm = (UsageStatsManager)
                    appContext.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return null;

            long now = System.currentTimeMillis();
            UsageEvents events = usm.queryEvents(now - 1_500L, now);
            UsageEvents.Event event = new UsageEvents.Event();

            String latest = null;
            long latestTs = 0L;

            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                int type = event.getEventType();
                if (type == UsageEvents.Event.MOVE_TO_FOREGROUND
                        || type == UsageEvents.Event.ACTIVITY_RESUMED) {
                    if (event.getTimeStamp() >= latestTs) {
                        latestTs = event.getTimeStamp();
                        latest = event.getPackageName();
                    }
                }
            }
            return latest;
        } catch (Throwable t) {
            return null;
        }
    }

     /** Called by the AccessibilityService whenever a new app comes to the foreground. */
        public synchronized void onForegroundApp(String packageName) {
        if (packageName == null) return;
        if (packageName.equals(currentPackage)) return;   // same app, nothing changed
        if (!isRealApp(packageName)) return;              // keyboard, popup, overlay

        tick();                       // flush the previous app's accumulated time
        currentPackage = packageName;
        lastTickElapsed = SystemClock.elapsedRealtime();
        Log.d(TAG, "Foreground: " + packageName);
    }

    /** Called when the accessibility service restarts. Disk state survives; memory doesn't. */
    public synchronized void resetVolatileState() {
        currentPackage = null;
        suppressPackage = null;
        suppressUntil = 0L;
        lastTickElapsed = SystemClock.elapsedRealtime();
        Log.d(TAG, "Volatile state reset (service restarted)");
    }

        /**
     * Window-state events fire for keyboards, toasts, popups and system
     * overlays too. Only packages with a launcher entry are real apps the
     * user is actually looking at.
     */
    private synchronized boolean isRealApp(String packageName) {
        long now = SystemClock.elapsedRealtime();
        if (launchable == null || now - launchableLoadedAt > 300_000L) {
            Set<String> set = new HashSet<>();
            try {
                PackageManager pm = appContext.getPackageManager();
                Intent launcher = new Intent(Intent.ACTION_MAIN, null);
                launcher.addCategory(Intent.CATEGORY_LAUNCHER);
                List<ResolveInfo> infos = pm.queryIntentActivities(launcher, 0);
                for (ResolveInfo info : infos) {
                    set.add(info.activityInfo.packageName);
                }
            } catch (Exception ignored) {
            }
            launchable = set;
            launchableLoadedAt = now;
        }
        return launchable.contains(packageName);
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
               // Reconcile with the system — events can miss a cold start
        String real = queryForegroundPackage();
        if (real != null && isRealApp(real) && !real.equals(currentPackage)) {
            currentPackage = real;
            lastTickElapsed = SystemClock.elapsedRealtime();
        }

        BlockOverlay overlay = BlockOverlay.get(appContext);
        String shown = overlay.getBlockedPackage();

        if (overlay.isShowing()) {
            // The overlay must only stay up while its own app is in front
            boolean stillThere = shown != null && shown.equals(currentPackage);
            LimitEntry shownEntry = shown != null ? store.get(shown) : null;
            boolean stillLocked = shownEntry != null && shownEntry.isLockedNow();

            if (!stillThere || !stillLocked) {
                overlay.hide();
            }
        } else if (currentPackage != null) {
            LimitEntry locked = store.get(currentPackage);
            if (locked != null && locked.isActive && locked.isLockedNow()) {
                enforceBlock(locked);
            }
        }

        if (!store.isMonitoringEnabled()) return;
        if (currentPackage == null) return;
        if (deltaMs <= 0 || deltaMs > 60_000) return;
        
        LimitEntry e = store.get(currentPackage);
        if (e == null || !e.isActive) return;

        if (e.isLockedNow()) {
            return;
        }
        if (e.remainingSeconds <= 0) return;

        e.remainingSeconds -= (deltaMs / 1000.0);

        if (((int) e.remainingSeconds) % 15 == 0 && deltaMs >= 400) {
            Log.d(TAG, e.packageName + " remaining=" + (int) e.remainingSeconds
                    + "s delta=" + deltaMs + "ms");
        }

        maybeWarn(e);

                if (e.remainingSeconds <= 0) {
            e.remainingSeconds = 0;
            e.lockedUntil = System.currentTimeMillis() + (e.lockSeconds * 1000L);
            e.attemptCount = 0;
            Log.d(TAG, "Limit exhausted: " + e.packageName);
            store.persist();
            BlockLog.record(appContext, e);
            enforceBlock(e);
            return;
        }

        store.persist();
    }

        private void maybeWarn(LimitEntry e) {
        try {
            if (!e.warned5min && e.remainingSeconds <= 300 && e.remainingSeconds > 240) {
                e.warned5min = true;
                NotificationHelper.showWarning(appContext, e.appLabel, 5);
            }
            if (!e.warned1min && e.remainingSeconds <= 60 && e.remainingSeconds > 30) {
                e.warned1min = true;
                NotificationHelper.showWarning(appContext, e.appLabel, 1);
            }
        } catch (Throwable t) {
            Log.e(TAG, "maybeWarn FAILED", t);
        }
    }

           public void enforceBlock(LimitEntry e) {
        try {
            if (!store.isMonitoringEnabled()) return;
            if (Whitelist.isProtected(appContext, e.packageName)) return;

            if (e.packageName.equals(suppressPackage)
                    && System.currentTimeMillis() < suppressUntil) {
                return;
            }

            BlockOverlay overlay = BlockOverlay.get(appContext);
            if (overlay.isShowing()
                    && e.packageName.equals(overlay.getBlockedPackage())) {
                return;
            }

            e.attemptCount++;
            store.persist();
            Log.d(TAG, "Showing overlay for " + e.packageName);
            overlay.show(e);

        } catch (Throwable t) {
            Log.e(TAG, "enforceBlock FAILED for " + e.packageName, t);
        }
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