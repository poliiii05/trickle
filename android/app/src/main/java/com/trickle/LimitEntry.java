package com.trickle;

import org.json.JSONException;
import org.json.JSONObject;

public class LimitEntry {

    public String packageName;
    public String appLabel;
    public int allowanceSeconds;
    public int lockSeconds;
    public double remainingSeconds;
    public long lockedUntil;    // wall-clock millis; 0 = hindi naka-lock
    public boolean isActive;

    // Transient — hindi sinisave sa disk, nirereset kada lock cycle
    public transient boolean warned5min = false;
    public transient boolean warned1min = false;
    public int attemptCount = 0;

    public static LimitEntry fromJson(JSONObject o) throws JSONException {
        LimitEntry e = new LimitEntry();
        e.packageName      = o.getString("packageName");
        e.appLabel         = o.optString("appLabel", o.getString("packageName"));
        e.allowanceSeconds = o.getInt("allowanceSeconds");
        e.lockSeconds      = o.getInt("lockSeconds");
        e.remainingSeconds = o.optDouble("remainingSeconds", o.getInt("allowanceSeconds"));
        e.lockedUntil      = o.optLong("lockedUntil", 0L);
        e.isActive         = o.optBoolean("isActive", true);
        e.attemptCount     = o.optInt("attemptCount", 0);
        return e;
    }

    public JSONObject toJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("packageName", packageName);
        o.put("appLabel", appLabel);
        o.put("allowanceSeconds", allowanceSeconds);
        o.put("lockSeconds", lockSeconds);
        o.put("remainingSeconds", remainingSeconds);
        o.put("lockedUntil", lockedUntil);
        o.put("isActive", isActive);
        o.put("attemptCount", attemptCount);
        return o;
    }

    public boolean isLockedNow() {
        return lockedUntil > 0 && System.currentTimeMillis() < lockedUntil;
    }
}