import 'package:equatable/equatable.dart';

enum TimerStatus { idle, running, paused }
enum TimerPhase { focus, shortBreak, longBreak }

class PomodoroTimer extends Equatable {
  final int remainingSeconds;
  final int initialSeconds;
  final TimerStatus status;
  final TimerPhase phase;
  final bool isDeepFocusEnabled;

  final String? focusIntent;
  final String? breakIntent;

  const PomodoroTimer({
    required this.remainingSeconds,
    required this.initialSeconds,
    this.status = TimerStatus.idle,
    required this.phase,
    this.isDeepFocusEnabled = false,
    this.focusIntent,
    this.breakIntent,
    this.routineBlockId,
  });

  @override
  List<Object?> get props => [remainingSeconds, initialSeconds, status, phase, isDeepFocusEnabled, focusIntent, breakIntent, routineBlockId];

  PomodoroTimer copyWith({
    int? remainingSeconds,
    int? initialSeconds,
    TimerStatus? status,
    TimerPhase? phase,
    bool? isDeepFocusEnabled,
    String? focusIntent,
    String? breakIntent,
    int? routineBlockId,
  }) {
    return PomodoroTimer(
      remainingSeconds: remainingSeconds ?? this.remainingSeconds,
      initialSeconds: initialSeconds ?? this.initialSeconds,
      status: status ?? this.status,
      phase: phase ?? this.phase,
      isDeepFocusEnabled: isDeepFocusEnabled ?? this.isDeepFocusEnabled,
      focusIntent: focusIntent ?? this.focusIntent,
      breakIntent: breakIntent ?? this.breakIntent,
      routineBlockId: routineBlockId ?? this.routineBlockId,
    );
  }

  double get progress => remainingSeconds / initialSeconds;
}
