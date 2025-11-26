import 'package:flutter/services.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'focus_lock_service.g.dart';

@Riverpod(keepAlive: true)
FocusLockService focusLockService(FocusLockServiceRef ref) {
  return FocusLockService();
}

class FocusLockService {
  static const platform = MethodChannel('com.example.study_companion/focus_mode');

  Future<void> enableLock() async {
    try {
      await platform.invokeMethod('startFocusLock');
    } on PlatformException catch (e) {
      print("Failed to enable focus lock: '${e.message}'.");
    }
  }

  Future<void> disableLock() async {
    try {
      await platform.invokeMethod('stopFocusLock');
    } on PlatformException catch (e) {
      print("Failed to disable focus lock: '${e.message}'.");
    }
  }
}
