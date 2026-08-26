package com.trickle;

import android.content.Context;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.TextView;

public class BlockOverlay {

    private static final String TAG = "TrickleOverlay";
    private static BlockOverlay instance;

    private final Context appContext;
    private final WindowManager windowManager;
    private final Handler handler = new Handler(Looper.getMainLooper());

    private View root;
    private TextView countdownView;
    private HourglassView hourglass;
    private ImageView brandMark;

    private String blockedPackage;
    private long unlockAt;
    private long lockMillis;

    private final Runnable ticker = new Runnable() {
        @Override
        public void run() {
            long remaining = unlockAt - System.currentTimeMillis();
            if (remaining <= 0) {
                hide();
                return;
            }
            if (countdownView != null) countdownView.setText(format(remaining));
            if (hourglass != null && lockMillis > 0) {
                hourglass.setProgress(1f - ((float) remaining / (float) lockMillis));
            }
            handler.postDelayed(this, 1000);
        }
    };

    private final Runnable flipper = new Runnable() {
        @Override
        public void run() {
            if (brandMark != null) {
                brandMark.animate().rotationBy(180f).setDuration(700).start();
            }
            handler.postDelayed(this, 2000);
        }
    };

    private BlockOverlay(Context ctx) {
        appContext = ctx.getApplicationContext();
        windowManager = (WindowManager) appContext.getSystemService(Context.WINDOW_SERVICE);
    }

    public static synchronized BlockOverlay get(Context ctx) {
        if (instance == null) instance = new BlockOverlay(ctx);
        return instance;
    }

    public boolean isShowing() {
        return root != null;
    }

    public String getBlockedPackage() {
        return blockedPackage;
    }

    public static boolean canDraw(Context ctx) {
        return Settings.canDrawOverlays(ctx);
    }

    public void show(final LimitEntry entry) {
        handler.post(() -> showInternal(entry));
    }

    private void showInternal(LimitEntry entry) {
        try {
            if (!canDraw(appContext)) {
                Log.e(TAG, "Overlay permission not granted");
                return;
            }

            // Already showing for this app — just refresh the numbers
            if (root != null && entry.packageName.equals(blockedPackage)) {
                unlockAt = entry.lockedUntil;
                lockMillis = entry.lockSeconds * 1000L;
                return;
            }

            if (root != null) hideInternal();

            blockedPackage = entry.packageName;
            unlockAt = entry.lockedUntil;
            lockMillis = entry.lockSeconds * 1000L;

            // Use a themed context so values-night resolves correctly
            Context themed = new android.view.ContextThemeWrapper(
                    appContext, R.style.BlockScreenTheme);
            root = LayoutInflater.from(themed)
                    .inflate(R.layout.activity_block_screen, null);

            countdownView = root.findViewById(R.id.countdown);
            hourglass = root.findViewById(R.id.hourglass);
            brandMark = root.findViewById(R.id.brand_mark);

            TextView label = root.findViewById(R.id.app_label);
            if (label != null) label.setText(entry.appLabel);

            View ok = root.findViewById(R.id.btn_ok);
            if (ok != null) ok.setOnClickListener(v -> dismiss());

            int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    : WindowManager.LayoutParams.TYPE_PHONE;

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT,
                    type,
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                            | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                            | WindowManager.LayoutParams.FLAG_LAYOUT_INSET_DECOR,
                    PixelFormat.TRANSLUCENT);
            params.gravity = Gravity.CENTER;

            windowManager.addView(root, params);

            handler.removeCallbacks(ticker);
            handler.post(ticker);
            handler.removeCallbacks(flipper);
            handler.postDelayed(flipper, 2000);

            Log.d(TAG, "Overlay shown for " + blockedPackage);

        } catch (Throwable t) {
            Log.e(TAG, "showInternal failed", t);
            root = null;
        }
    }

    /** User tapped Ok — suppress briefly and go home. */
    private void dismiss() {
        if (blockedPackage != null) {
            TrackingEngine.get(appContext).suppressBlockFor(blockedPackage, 2000);
        }
        hideInternal();
        goHome();
    }

    public void hide() {
        handler.post(this::hideInternal);
    }

    private void hideInternal() {
        try {
            handler.removeCallbacks(ticker);
            handler.removeCallbacks(flipper);
            if (root != null && windowManager != null) {
                windowManager.removeView(root);
            }
        } catch (Throwable ignored) {
        } finally {
            root = null;
            countdownView = null;
            hourglass = null;
            brandMark = null;
            blockedPackage = null;
        }
    }

    private void goHome() {
        try {
            android.content.Intent home = new android.content.Intent(
                    android.content.Intent.ACTION_MAIN);
            home.addCategory(android.content.Intent.CATEGORY_HOME);
            home.setFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            appContext.startActivity(home);
        } catch (Throwable t) {
            Log.e(TAG, "goHome failed", t);
        }
    }

    private static String format(long ms) {
        long total = ms / 1000;
        long h = total / 3600;
        long m = (total % 3600) / 60;
        long s = total % 60;
        if (h > 0) return String.format("%d:%02d:%02d", h, m, s);
        return String.format("%d:%02d", m, s);
    }
}