package com.example.study_companion

import io.flutter.embedding.android.FlutterActivity

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import androidx.annotation.NonNull

import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.example.study_companion/focus_mode"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "startFocusLock") {
                startLockTask()
                result.success(true)
            } else if (call.method == "stopFocusLock") {
                try {
                    stopLockTask()
                    result.success(true)
                } catch (e: Exception) {
                    result.success(false)
                }
            } else {
                result.notImplemented()
            }
        }
    }
}
