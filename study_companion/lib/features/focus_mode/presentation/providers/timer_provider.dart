import 'dart:async';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/data/isar_service.dart';
import '../../domain/entities/pomodoro_timer.dart';
import '../../data/datasources/focus_lock_service.dart';
import '../../data/models/study_session.dart';
import '../../../../core/data/isar_service.dart';

import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/services/notification_service.dart';
import '../../../routine/data/repositories/routine_repository.dart';

part 'timer_provider.g.dart';

@riverpod
class TimerNotifier extends _$TimerNotifier {
  Timer? _ticker;

  // Configuration (Could be moved to a settings provider later)
  // Configuration
  int _customFocusDuration = 25 * 60;
  int _customShortBreakDuration = 5 * 60;
  int _customLongBreakDuration = 15 * 60;

  // Saved remaining times for resuming
  int? _savedFocusRemaining;
  int? _savedShortBreakRemaining;
  int? _savedLongBreakRemaining;



  DateTime? _endTime;

  @override
  PomodoroTimer build() {
    // Cleanup timer on dispose
    ref.onDispose(() {
      _ticker?.cancel();
    });
    
    _loadSettings();

    return PomodoroTimer(
      remainingSeconds: _customFocusDuration,
      initialSeconds: _customFocusDuration,
      phase: TimerPhase.focus,
    );
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _customFocusDuration = prefs.getInt('focusDuration') ?? 25 * 60;
    _customShortBreakDuration = prefs.getInt('shortBreakDuration') ?? 5 * 60;
    _customLongBreakDuration = prefs.getInt('longBreakDuration') ?? 15 * 60;
    
    _savedFocusRemaining = prefs.getInt('savedFocusRemaining');
    _savedShortBreakRemaining = prefs.getInt('savedShortBreakRemaining');
    _savedLongBreakRemaining = prefs.getInt('savedLongBreakRemaining');
    
    final savedFocusIntent = prefs.getString('focusIntent');
    final savedBreakIntent = prefs.getString('breakIntent');
    
    // Check for active timer
    final endTimeMillis = prefs.getInt('endTime');
    final savedPhaseIndex = prefs.getInt('phase');
    final savedInitialSeconds = prefs.getInt('initialSeconds');
    final savedRoutineBlockId = prefs.getInt('routineBlockId');
    
    if (endTimeMillis != null && savedPhaseIndex != null && savedInitialSeconds != null) {
      final endTime = DateTime.fromMillisecondsSinceEpoch(endTimeMillis);
      final now = DateTime.now();
      
      if (endTime.isAfter(now)) {
        // Timer still running
        _endTime = endTime;
        final remaining = endTime.difference(now).inSeconds;
        final phase = TimerPhase.values[savedPhaseIndex];
        
        state = state.copyWith(
          initialSeconds: savedInitialSeconds,
          remainingSeconds: remaining,
          phase: phase,
          status: TimerStatus.running,
          focusIntent: savedFocusIntent,
          breakIntent: savedBreakIntent,
          routineBlockId: savedRoutineBlockId,
        );
        
        _startTicker();
        
        // Resume notification
        ref.read(notificationServiceProvider).showTimerNotification(
          title: '${state.phase.name.toUpperCase()} Timer',
          body: 'Time remaining',
          endTime: _endTime,
        );
        return;
      } else {
        // Timer finished while away
        final phase = TimerPhase.values[savedPhaseIndex];
         state = state.copyWith(
          initialSeconds: savedInitialSeconds,
          remainingSeconds: 0,
          phase: phase,
          focusIntent: savedFocusIntent,
          breakIntent: savedBreakIntent,
          routineBlockId: savedRoutineBlockId,
        );
        // Could trigger completion logic here if we want to save the session
        // For now, let's trigger completion to ensure routine block is updated
        _completePhase(); 
        return;
      }
    }

    // Default load
    state = state.copyWith(
        initialSeconds: _customFocusDuration,
        remainingSeconds: _customFocusDuration,
        focusIntent: savedFocusIntent,
        breakIntent: savedBreakIntent,
    );
    
    // If we have a saved remaining time for the current phase (and not running), use it
    if (state.status != TimerStatus.running) {
       int? savedRemaining;
       if (state.phase == TimerPhase.focus) savedRemaining = _savedFocusRemaining;
       else if (state.phase == TimerPhase.shortBreak) savedRemaining = _savedShortBreakRemaining;
       else savedRemaining = _savedLongBreakRemaining;
       
       if (savedRemaining != null) {
         state = state.copyWith(remainingSeconds: savedRemaining);
       }
    }
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('focusDuration', _customFocusDuration);
    await prefs.setInt('shortBreakDuration', _customShortBreakDuration);
    await prefs.setInt('longBreakDuration', _customLongBreakDuration);
    
    if (_savedFocusRemaining != null) await prefs.setInt('savedFocusRemaining', _savedFocusRemaining!);
    else await prefs.remove('savedFocusRemaining');
    
    if (_savedShortBreakRemaining != null) await prefs.setInt('savedShortBreakRemaining', _savedShortBreakRemaining!);
    else await prefs.remove('savedShortBreakRemaining');
    
    if (_savedLongBreakRemaining != null) await prefs.setInt('savedLongBreakRemaining', _savedLongBreakRemaining!);
    else await prefs.remove('savedLongBreakRemaining');

    if (state.focusIntent != null) await prefs.setString('focusIntent', state.focusIntent!);
    if (state.breakIntent != null) await prefs.setString('breakIntent', state.breakIntent!);
  }

  Future<void> _saveTimerState() async {
    final prefs = await SharedPreferences.getInstance();
    if (_endTime != null) {
      await prefs.setInt('endTime', _endTime!.millisecondsSinceEpoch);
      await prefs.setInt('phase', state.phase.index);
      await prefs.setInt('initialSeconds', state.initialSeconds);
      if (state.routineBlockId != null) {
        await prefs.setInt('routineBlockId', state.routineBlockId!);
      }
    } else {
      await prefs.remove('endTime');
      await prefs.remove('phase');
      await prefs.remove('initialSeconds');
      await prefs.remove('routineBlockId');
    }
  }

  void setDuration(int seconds) {
    if (state.status == TimerStatus.running) return;
    
    if (state.phase == TimerPhase.focus) {
      _customFocusDuration = seconds;
    } else if (state.phase == TimerPhase.shortBreak) {
      _customShortBreakDuration = seconds;
    } else {
      _customLongBreakDuration = seconds;
    }
    
    // If changing duration, reset saved progress for that phase
    if (state.phase == TimerPhase.focus) _savedFocusRemaining = null;
    else if (state.phase == TimerPhase.shortBreak) _savedShortBreakRemaining = null;
    else _savedLongBreakRemaining = null;

    state = state.copyWith(
      initialSeconds: seconds,
      remainingSeconds: seconds,
    );
    _saveSettings();
  }

  void setFocusIntent(String intent) {
    state = state.copyWith(focusIntent: intent);
    _saveSettings();
  }

  void setBreakIntent(String intent) {
    state = state.copyWith(breakIntent: intent);
    _saveSettings();
  }

  void configureSession({required int durationSeconds, required String intent, int? routineBlockId}) {
    if (state.status == TimerStatus.running) return;
    
    _ticker?.cancel();
    
    // Reset saved progress
    _savedFocusRemaining = null;
    _savedShortBreakRemaining = null;
    _savedLongBreakRemaining = null;
    
    _customFocusDuration = durationSeconds;
    
    state = PomodoroTimer(
      remainingSeconds: durationSeconds,
      initialSeconds: durationSeconds,
      phase: TimerPhase.focus,
      status: TimerStatus.idle,
      focusIntent: intent,
      isDeepFocusEnabled: state.isDeepFocusEnabled,
      routineBlockId: routineBlockId,
    );
    
    _saveSettings();
  }

  void start() {
    if (state.status == TimerStatus.running) return;

    if (state.isDeepFocusEnabled) {
      ref.read(focusLockServiceProvider).enableLock();
    }

    state = state.copyWith(status: TimerStatus.running);
    
    _endTime = DateTime.now().add(Duration(seconds: state.remainingSeconds));
    _saveTimerState();
    
    // Request permissions and show start notification
    ref.read(notificationServiceProvider).requestPermissions().then((_) {
       ref.read(notificationServiceProvider).showTimerNotification(
         title: '${state.phase.name.toUpperCase()} Timer',
         body: 'Time remaining',
         endTime: _endTime,
       );
    });

    _startTicker();
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }

  void _startTicker() {
    _ticker?.cancel();
    _ticker = Timer.periodic(const Duration(seconds: 1), (timer) {
      _tick();
    });
  }

  void pause() {
    _ticker?.cancel();
    if (state.isDeepFocusEnabled) {
      ref.read(focusLockServiceProvider).disableLock();
    }
    state = state.copyWith(status: TimerStatus.paused);
    _endTime = null;
    _saveTimerState();
    ref.read(notificationServiceProvider).cancelNotification();
  }

  void reset() {
    _ticker?.cancel();
    if (state.isDeepFocusEnabled) {
      ref.read(focusLockServiceProvider).disableLock();
    }
    state = state.copyWith(
      remainingSeconds: state.initialSeconds,
      status: TimerStatus.idle,
      routineBlockId: null, // Clear routine link on reset
    );
    _endTime = null;
    _saveTimerState();
    
    // Clear saved progress
    if (state.phase == TimerPhase.focus) _savedFocusRemaining = null;
    else if (state.phase == TimerPhase.shortBreak) _savedShortBreakRemaining = null;
    else _savedLongBreakRemaining = null;
    _saveSettings();
    
    ref.read(notificationServiceProvider).cancelNotification();
  }

  void toggleDeepFocus() {
    state = state.copyWith(isDeepFocusEnabled: !state.isDeepFocusEnabled);
  }

  void setPhase(TimerPhase phase) {
    if (state.status == TimerStatus.running) return;
    _ticker?.cancel();
    if (state.status == TimerStatus.running) return;
    _ticker?.cancel();
    
    // Save current progress before switching
    if (state.remainingSeconds < state.initialSeconds) {
      if (state.phase == TimerPhase.focus) _savedFocusRemaining = state.remainingSeconds;
      else if (state.phase == TimerPhase.shortBreak) _savedShortBreakRemaining = state.remainingSeconds;
      else _savedLongBreakRemaining = state.remainingSeconds;
    } else {
       // If we are at full duration, ensure no saved progress (e.g. if we reset)
      if (state.phase == TimerPhase.focus) _savedFocusRemaining = null;
      else if (state.phase == TimerPhase.shortBreak) _savedShortBreakRemaining = null;
      else _savedLongBreakRemaining = null;
    }
    _saveSettings();

    int duration;
    int? savedRemaining;
    switch (phase) {
      case TimerPhase.focus:
        duration = _customFocusDuration;
        savedRemaining = _savedFocusRemaining;
        break;
      case TimerPhase.shortBreak:
        duration = _customShortBreakDuration;
        savedRemaining = _savedShortBreakRemaining;
        break;
      case TimerPhase.longBreak:
        duration = _customLongBreakDuration;
        savedRemaining = _savedLongBreakRemaining;
        break;
    }
    state = PomodoroTimer(
      remainingSeconds: savedRemaining ?? duration,
      initialSeconds: duration,
      phase: phase,
      status: TimerStatus.idle,
      focusIntent: state.focusIntent,
      breakIntent: state.breakIntent,
      isDeepFocusEnabled: state.isDeepFocusEnabled,
      routineBlockId: phase == TimerPhase.focus ? state.routineBlockId : null, // Keep routine ID only for focus phase
    );
  }

  void _tick() {
    if (_endTime == null) return;
    
    final now = DateTime.now();
    final remaining = _endTime!.difference(now).inSeconds;
    
    if (remaining > 0) {
      state = state.copyWith(remainingSeconds: remaining);
      
      // Notification handled by native chronometer
      
      
    } else {
      state = state.copyWith(remainingSeconds: 0);
      _completePhase();
    }
  }

  Future<void> _completePhase() async {
    _ticker?.cancel();
    if (state.isDeepFocusEnabled) {
      ref.read(focusLockServiceProvider).disableLock();
    }
    
    // Save Session
    if (state.phase == TimerPhase.focus) {
      final session = StudySession()
        ..startTime = DateTime.now().subtract(Duration(seconds: state.initialSeconds))
        ..durationSeconds = state.initialSeconds
        ..phase = state.phase.name
        ..isCompleted = true
        ..focusIntent = state.focusIntent
        ..breakIntent = state.breakIntent
        ..isDeepFocus = state.isDeepFocusEnabled
        ..targetDuration = state.initialSeconds
        ..endTime = DateTime.now();
      
      await ref.read(isarServiceProvider).saveSession(session);

      // INTEGRATION: Mark Routine Block as Completed
      if (state.routineBlockId != null) {
        try {
          final routineRepo = ref.read(routineRepositoryProvider);
          // Explicitly mark as completed
          await routineRepo.setBlockCompletion(state.routineBlockId!, true);
        } catch (e) {
          print("Error updating routine block: $e");
        }
      }
    }

    // Reset to initial duration
    state = state.copyWith(
      status: TimerStatus.idle,
      remainingSeconds: state.initialSeconds,
      routineBlockId: null, // Clear after completion
    );
    
    // Clear saved progress
    if (state.phase == TimerPhase.focus) _savedFocusRemaining = null;
    else if (state.phase == TimerPhase.shortBreak) _savedShortBreakRemaining = null;
    else _savedLongBreakRemaining = null;
    _saveSettings();
    
    // Trigger notification
    ref.read(notificationServiceProvider).showTimerNotification(
      title: 'Timer Completed!',
      body: 'Your ${state.phase.name} session is done.',
    );
    
    _endTime = null;
    _saveTimerState();
  }
}
