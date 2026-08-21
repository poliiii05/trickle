package com.trickle;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class TrickleModule extends ReactContextBaseJavaModule {

    public static final String NAME = "TrickleModule";

    public TrickleModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void ping(Promise promise) {
        promise.resolve("pong galing sa Java");
    }

    @ReactMethod
    public void getAndroidVersion(Promise promise) {
        promise.resolve(android.os.Build.VERSION.SDK_INT);
    }
}