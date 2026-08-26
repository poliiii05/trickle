package com.trickle;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.util.AttributeSet;
import android.view.View;

import androidx.annotation.Nullable;

public class HourglassView extends View {

    private final Paint sandPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint glassPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint framePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path path = new Path();

    /** 0 = lock just started (full sand on top), 1 = lock finished. */
    private float progress = 0f;

    public HourglassView(Context context) {
        this(context, null);
    }

    public HourglassView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        sandPaint.setStyle(Paint.Style.FILL);
        sandPaint.setColor(getContext().getColor(R.color.block_primary));

        glassPaint.setStyle(Paint.Style.STROKE);
        glassPaint.setStrokeWidth(dp(2.5f));
        glassPaint.setStrokeCap(Paint.Cap.ROUND);
        glassPaint.setStrokeJoin(Paint.Join.ROUND);
        glassPaint.setColor(getContext().getColor(R.color.block_text_muted));

        framePaint.setStyle(Paint.Style.FILL);
        framePaint.setColor(getContext().getColor(R.color.block_text_muted));
    }

    public void setProgress(float value) {
        float clamped = Math.max(0f, Math.min(1f, value));
        if (Math.abs(clamped - progress) < 0.0005f) return;
        progress = clamped;
        invalidate();
    }

    private float dp(float value) {
        return value * getResources().getDisplayMetrics().density;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        final float w = getWidth();
        final float h = getHeight();
        if (w <= 0 || h <= 0) return;

        final float cx = w / 2f;
        final float cy = h / 2f;

        final float capH = h * 0.045f;
        final float glassTop = capH;
        final float glassBottom = h - capH;
        final float halfW = Math.min(w, h) * 0.30f;
        final float left = cx - halfW;
        final float right = cx + halfW;

        // --- Frame caps ---
        canvas.drawRect(left - dp(4), 0, right + dp(4), capH, framePaint);
        canvas.drawRect(left - dp(4), h - capH, right + dp(4), h, framePaint);

        // --- Upper sand: triangle shrinking toward the neck ---
        // Volume scales with the square of the linear dimension, so use sqrt
        // to keep the visible level honest.
        float remaining = 1f - progress;
        if (remaining > 0.001f) {
            float scale = (float) Math.sqrt(remaining);
            float sandTop = cy - (cy - glassTop) * scale;
            float sandHalfW = halfW * scale;

            path.reset();
            path.moveTo(cx - sandHalfW, sandTop);
            path.lineTo(cx + sandHalfW, sandTop);
            path.lineTo(cx, cy);
            path.close();
            canvas.drawPath(path, sandPaint);
        }

        // --- Lower sand: mound growing from the base ---
        if (progress > 0.001f) {
            float scale = (float) Math.sqrt(progress);
            float moundH = (glassBottom - cy) * scale;
            float moundTop = glassBottom - moundH;
            float moundHalfW = halfW * scale;

            path.reset();
            path.moveTo(cx - moundHalfW, glassBottom);
            path.lineTo(cx + moundHalfW, glassBottom);
            path.lineTo(cx, moundTop);
            path.close();
            canvas.drawPath(path, sandPaint);
        }

        // --- Glass outline, drawn last so it sits above the sand ---
        path.reset();
        path.moveTo(left, glassTop);
        path.lineTo(cx, cy);
        path.lineTo(left, glassBottom);
        canvas.drawPath(path, glassPaint);

        path.reset();
        path.moveTo(right, glassTop);
        path.lineTo(cx, cy);
        path.lineTo(right, glassBottom);
        canvas.drawPath(path, glassPaint);
    }
}