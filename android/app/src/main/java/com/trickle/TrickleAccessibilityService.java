package com.trickle;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;

public class TrickleAccessibilityService extends AccessibilityService {

    private static final String TAG = "TrickleA11y";
    private static final long TICK_MS = 500L;

    private static volatile boolean running = false;

    private TrackingEngine engine;
    private Handler handler;
    private ScreenReceiver screenReceiver;

    private final Runnable tickRunnable = new Runnable() {
        @Override
        public void run() {
            if (engine != null) engine.tick();
            handler.postDelayed(this, TICK_MS);
        }
    };

    public static boolean isRunning() {
        return running;
    }

     @Override
    public void onCreate() {
        super.onCreate();
        // Restarted by the system — clear any stale in-memory tracking state
        TrackingEngine.get(this).resetVolatileState();
    }
    
    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        running = true;

        engine = TrackingEngine.get(this);
        handler = new Handler(Looper.getMainLooper());
        handler.post(tickRunnable);

        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
                | AccessibilityEvent.TYPE_WINDOWS_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.notificationTimeout = 0;
        setServiceInfo(info);

        screenReceiver = new ScreenReceiver();
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        filter.addAction(Intent.ACTION_SCREEN_ON);
        registerReceiver(screenReceiver, filter);

        KeepAliveService.start(this);
        Log.d(TAG, "Accessibility service connected");
    }

           @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        int type = event.getEventType();
        if (type != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
                && type != AccessibilityEvent.TYPE_WINDOWS_CHANGED) {
            return;
        }
        if (event.getPackageName() == null) return;

        String pkg = event.getPackageName().toString();
        if (pkg.equals(getPackageName())) return;
        if (pkg.equals("com.android.systemui")) return;

        engine.onForegroundApp(pkg);

        // Immediate block check — don't wait for the next tick
        LimitStore store = LimitStore.get(this);
        LimitEntry entry = store.get(pkg);
        if (entry != null && entry.isActive && entry.isLockedNow()) {
            engine.enforceBlock(entry);
        }
    }

    @Override
    public void onInterrupt() {
    }

    @Override
    public boolean onUnbind(Intent intent) {
        running = false;
        if (handler != null) handler.removeCallbacks(tickRunnable);
        if (screenReceiver != null) {
            try {
                unregisterReceiver(screenReceiver);
            } catch (Exception ignored) {
            }
        }
        Log.d(TAG, "Accessibility service disconnected");
        return super.onUnbind(intent);
    }

    private class ScreenReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (Intent.ACTION_SCREEN_OFF.equals(intent.getAction())) {
                engine.onScreenOff();
            }
        }
    }
}