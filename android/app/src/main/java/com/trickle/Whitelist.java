package com.trickle;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Build;
import android.telecom.TelecomManager;

import java.util.HashSet;
import java.util.Set;

public class Whitelist {

    private static final Set<String> HARD_BLOCKED = new HashSet<>();

    static {
        HARD_BLOCKED.add("com.android.settings");
        HARD_BLOCKED.add("com.android.systemui");
        HARD_BLOCKED.add("com.android.emergency");
        HARD_BLOCKED.add("com.android.dialer");
        HARD_BLOCKED.add("com.google.android.dialer");
        HARD_BLOCKED.add("com.android.phone");
        HARD_BLOCKED.add("com.android.server.telecom");
        HARD_BLOCKED.add("com.android.contacts");
        HARD_BLOCKED.add("com.google.android.contacts");
        HARD_BLOCKED.add("com.android.mms");
        HARD_BLOCKED.add("com.google.android.apps.messaging");
        HARD_BLOCKED.add("com.miui.securitycenter");
        HARD_BLOCKED.add("com.coloros.safecenter");
        HARD_BLOCKED.add("com.samsung.android.lool");
    }

    private static Set<String> runtimeCache = null;

       /** True if this package must never be blocked. */
    public static boolean isProtected(Context ctx, String packageName) {
        if (packageName == null) return true;
        if (packageName.equals(ctx.getPackageName())) return true;
        if (HARD_BLOCKED.contains(packageName)) return true;
        return runtimeProtected(ctx).contains(packageName);
    }

    private static synchronized Set<String> runtimeProtected(Context ctx) {
        if (runtimeCache != null) return runtimeCache;

        Set<String> set = new HashSet<>();
        PackageManager pm = ctx.getPackageManager();

        // Default launcher
        try {
            Intent home = new Intent(Intent.ACTION_MAIN);
            home.addCategory(Intent.CATEGORY_HOME);
            ResolveInfo info = pm.resolveActivity(home, PackageManager.MATCH_DEFAULT_ONLY);
            if (info != null && info.activityInfo != null) {
                set.add(info.activityInfo.packageName);
            }
        } catch (Exception ignored) {
        }

        // Default dialer
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                TelecomManager tm =
                        (TelecomManager) ctx.getSystemService(Context.TELECOM_SERVICE);
                if (tm != null && tm.getDefaultDialerPackage() != null) {
                    set.add(tm.getDefaultDialerPackage());
                }
            }
        } catch (Exception ignored) {
        }

        runtimeCache = set;
        return runtimeCache;
    }
}