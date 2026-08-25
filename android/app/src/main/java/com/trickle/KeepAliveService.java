package com.trickle;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class KeepAliveService extends android.app.Service {

    private static final String CHANNEL_ID = "trickle_status";
    private static final int NOTIF_ID = 1001;

    public static void start(Context ctx) {
        Intent intent = new Intent(ctx, KeepAliveService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(intent);
        } else {
            ctx.startService(intent);
        }
    }

    public static void stop(Context ctx) {
        ctx.stopService(new Intent(ctx, KeepAliveService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        startForeground(NOTIF_ID, buildNotification());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

                NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Trickle status", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Shows whether tracking is active");
        channel.setShowBadge(false);

        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) nm.createNotificationChannel(channel);
    }

    private Notification buildNotification() {
        Intent open = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(
                this, 0, open,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Trickle is active")
                .setContentText("Tracking your app usage")
                .setSmallIcon(R.drawable.ic_notification)
                .setColor(getColor(R.color.trickle_notification))
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .setContentIntent(pi)
                .build();
    }
}