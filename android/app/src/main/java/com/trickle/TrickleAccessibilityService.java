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
    private static final long TICK_MS = 1000L;

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
    protected void onServiceConnected() {
        super.onServiceConnected();
        running = true;

        engine = TrackingEngine.get(this);
        handler = new Handler(Looper.getMainLooper());
        handler.post(tickRunnable);

        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.notificationTimeout = 100;
        setServiceInfo(info);

        screenReceiver = new ScreenReceiver();
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        filter.addAction(Intent.ACTION_SCREEN_ON);
        registerReceiver(screenReceiver, filter);

        KeepAliveService.start(this);
        Log.d(TAG, "Nakakonekta ang accessibility service");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;
        if (event.getPackageName() == null) return;

        String pkg = event.getPackageName().toString();

        // Balewalain ang system UI at ang sarili nating app
        if (pkg.equals(getPackageName())) return;
        if (pkg.equals("com.android.systemui")) return;

        engine.onForegroundApp(pkg);
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
        Log.d(TAG, "Nadiskonekta ang accessibility service");
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