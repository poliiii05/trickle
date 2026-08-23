package com.trickle;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class LimitStore {

    private static final String PREFS = "trickle_limits";
    private static final String KEY_LIMITS = "limits_json";
    private static final String KEY_MONITORING = "monitoring_enabled";

    private static LimitStore instance;

    private final SharedPreferences prefs;
    private final Map<String, LimitEntry> cache = new LinkedHashMap<>();

    private LimitStore(Context ctx) {
        prefs = ctx.getApplicationContext()
                   .getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        loadFromDisk();
    }

    public static synchronized LimitStore get(Context ctx) {
        if (instance == null) instance = new LimitStore(ctx);
        return instance;
    }

    // ---------- Disk ----------

    private synchronized void loadFromDisk() {
        cache.clear();
        String json = prefs.getString(KEY_LIMITS, "[]");
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                LimitEntry e = LimitEntry.fromJson(arr.getJSONObject(i));
                cache.put(e.packageName, e);
            }
        } catch (Exception ignored) {
        }
    }

    public synchronized void persist() {
        JSONArray arr = new JSONArray();
        try {
            for (LimitEntry e : cache.values()) arr.put(e.toJson());
        } catch (Exception ignored) {
        }
        prefs.edit().putString(KEY_LIMITS, arr.toString()).apply();
    }

    // ---------- Access ----------

    public synchronized LimitEntry get(String packageName) {
        return cache.get(packageName);
    }

    public synchronized List<LimitEntry> all() {
        return new ArrayList<>(cache.values());
    }

    public synchronized boolean isTracked(String packageName) {
        LimitEntry e = cache.get(packageName);
        return e != null && e.isActive;
    }

    /**
     * Tinatawag ng JS. Pinapanatili ang runtime state (remaining, lock)
     * maliban kung nagbago ang allowance o kung bago ang app.
     */
    public synchronized void replaceAll(JSONArray incoming) {
        Map<String, LimitEntry> old = new LinkedHashMap<>(cache);
        cache.clear();

        for (int i = 0; i < incoming.length(); i++) {
            try {
                JSONObject o = incoming.getJSONObject(i);
                LimitEntry fresh = LimitEntry.fromJson(o);
                LimitEntry prev = old.get(fresh.packageName);

                if (prev != null && prev.allowanceSeconds == fresh.allowanceSeconds) {
                    fresh.remainingSeconds = prev.remainingSeconds;
                    fresh.lockedUntil = prev.lockedUntil;
                } else {
                    fresh.remainingSeconds = fresh.allowanceSeconds;
                    fresh.lockedUntil = 0L;
                }
                cache.put(fresh.packageName, fresh);
            } catch (Exception ignored) {
            }
        }
        persist();
    }

    public synchronized JSONArray stateAsJson() {
        JSONArray arr = new JSONArray();
        try {
            for (LimitEntry e : cache.values()) arr.put(e.toJson());
        } catch (Exception ignored) {
        }
        return arr;
    }

    // ---------- Monitoring flag ----------

    public boolean isMonitoringEnabled() {
        return prefs.getBoolean(KEY_MONITORING, true);
    }

    public void setMonitoringEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_MONITORING, enabled).apply();
    }
}