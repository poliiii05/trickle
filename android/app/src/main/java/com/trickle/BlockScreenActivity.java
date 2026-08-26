package com.trickle;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.widget.TextView;

public class BlockScreenActivity extends Activity {

    public static final String EXTRA_PACKAGE = "extra_package";
    public static final String EXTRA_LABEL = "extra_label";
    public static final String EXTRA_UNLOCK_AT = "extra_unlock_at";
    public static final String EXTRA_LOCK_SECONDS = "extra_lock_seconds";
    private static volatile boolean visible = false;
    private static volatile long launchedAt = 0L;
    private HourglassView hourglass;
    private android.widget.ImageView brandMark;
    private long lockMillis;
    private TextView countdownView;
    private Handler handler;
    private long unlockAt;
    private String blockedPackage;

      private final Runnable ticker = new Runnable() {
        @Override
        public void run() {
            long remaining = unlockAt - System.currentTimeMillis();
            if (remaining <= 0) {
                finish();
                return;
            }
            countdownView.setText(format(remaining));

            if (lockMillis > 0) {
                float progress = 1f - ((float) remaining / (float) lockMillis);
                hourglass.setProgress(progress);
            }

            handler.postDelayed(this, 1000);
        }
    };

        private final Runnable flipper = new Runnable() {
        @Override
        public void run() {
            if (brandMark != null) {
                brandMark.animate()
                        .rotationBy(180f)
                        .setDuration(700)
                        .start();
            }
            handler.postDelayed(this, 2000);
        }
    };

        /** True if the block screen is showing, or was launched moments ago. */
    public static boolean isVisible() {
        return visible || (System.currentTimeMillis() - launchedAt) < 1500L;
    }

    public static void launch(Context ctx, LimitEntry entry) {
        launchedAt = System.currentTimeMillis();
        Intent intent = new Intent(ctx, BlockScreenActivity.class);
        intent.putExtra(EXTRA_PACKAGE, entry.packageName);
        intent.putExtra(EXTRA_LABEL, entry.appLabel);
        intent.putExtra(EXTRA_UNLOCK_AT, entry.lockedUntil);
        intent.putExtra(EXTRA_LOCK_SECONDS, entry.lockSeconds);
        intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TASK
                | Intent.FLAG_ACTIVITY_NO_ANIMATION
                | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
        ctx.startActivity(intent);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setTheme(R.style.BlockScreenTheme);
        setContentView(R.layout.activity_block_screen);
        hourglass = findViewById(R.id.hourglass);
        brandMark = findViewById(R.id.brand_mark);
        handler.postDelayed(flipper, 2000);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED);

        handler = new Handler(Looper.getMainLooper());
        bind(getIntent());

        findViewById(R.id.btn_ok).setOnClickListener(v -> goHome());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        bind(intent);
    }

    private void bind(Intent intent) {
        blockedPackage = intent.getStringExtra(EXTRA_PACKAGE);
        String label = intent.getStringExtra(EXTRA_LABEL);
        unlockAt = intent.getLongExtra(EXTRA_UNLOCK_AT, 0L);
        lockMillis = intent.getIntExtra(EXTRA_LOCK_SECONDS, 0) * 1000L;

        ((TextView) findViewById(R.id.app_label)).setText(label == null ? "" : label);
        countdownView = findViewById(R.id.countdown);

        handler.removeCallbacks(ticker);
        handler.post(ticker);
    }

    @Override
    protected void onResume() {
        super.onResume();
        visible = true;
    }

    @Override
    protected void onPause() {
        super.onPause();
        visible = false;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        visible = false;
        if (handler != null) handler.removeCallbacks(flipper);
    }

    @Override
    public void onBackPressed() {
        goHome();
    }

    private void goHome() {
        if (blockedPackage != null) {
            TrackingEngine.get(this).suppressBlockFor(blockedPackage, 2000);
        }
        Intent home = new Intent(Intent.ACTION_MAIN);
        home.addCategory(Intent.CATEGORY_HOME);
        home.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(home);
        finish();
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