package com.trickle;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public class NotificationHelper {

    public static final String CHANNEL_WARNING = "trickle_warnings";

    public static void ensureChannels(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;

        NotificationChannel warning = new NotificationChannel(
                CHANNEL_WARNING, "Limit warnings",
                NotificationManager.IMPORTANCE_DEFAULT);
        warning.setDescription("Reminders before your allowance runs out");
        nm.createNotificationChannel(warning);
    }

    public static void showWarning(Context ctx, String appLabel, int minutesLeft) {
        ensureChannels(ctx);

        String text = minutesLeft == 1
                ? "1 minute left on " + appLabel + "."
                : minutesLeft + " minutes left on " + appLabel + ".";

        Notification n = new NotificationCompat.Builder(ctx, CHANNEL_WARNING)
                .setContentTitle("Running low")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_menu_recent_history)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .build();

        try {
            NotificationManagerCompat.from(ctx)
                    .notify(appLabel.hashCode() + minutesLeft, n);
        } catch (SecurityException ignored) {
            // User denied POST_NOTIFICATIONS
        }
    }
}