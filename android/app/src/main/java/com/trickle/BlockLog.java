package com.trickle;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

public class BlockLog {

    private static final String PREFS = "trickle_blocklog";
    private static final String KEY_PENDING = "pending";
    private static final int MAX_PENDING = 500;

    public static synchronized void record(Context ctx, LimitEntry e) {
        SharedPreferences prefs = ctx.getApplicationContext()
                .getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        try {
            JSONArray arr = new JSONArray(prefs.getString(KEY_PENDING, "[]"));

            JSONObject o = new JSONObject();
            o.put("packageName", e.packageName);
            o.put("appLabel", e.appLabel);
            o.put("blockedAt", System.currentTimeMillis());
            o.put("unlockAt", e.lockedUntil);
            o.put("attemptCount", e.attemptCount);
            arr.put(o);

            // Huwag hayaang lumaki nang walang hanggan kung hindi bumubukas ang app
            while (arr.length() > MAX_PENDING) arr.remove(0);

            prefs.edit().putString(KEY_PENDING, arr.toString()).apply();
        } catch (Exception ignored) {
        }
    }

    public static synchronized String drain(Context ctx) {
        SharedPreferences prefs = ctx.getApplicationContext()
                .getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_PENDING, "[]");
        prefs.edit().putString(KEY_PENDING, "[]").apply();
        return json;
    }
}