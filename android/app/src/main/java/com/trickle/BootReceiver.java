package com.trickle;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {

            // Binubuhay ang store para ma-load ang locks mula sa disk
            LimitStore.get(context);

            if (TrickleAccessibilityService.isRunning()) {
                KeepAliveService.start(context);
            }
        }
    }
}