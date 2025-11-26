import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import '../../domain/entities/pomodoro_timer.dart';
import '../providers/timer_provider.dart';
import '../widgets/smart_break_tip.dart';

class FocusScreen extends ConsumerStatefulWidget {
  const FocusScreen({super.key});

  @override
  ConsumerState<FocusScreen> createState() => _FocusScreenState();
}

class _FocusScreenState extends ConsumerState<FocusScreen> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final timerState = ref.read(timerNotifierProvider);
    if (timerState.isDeepFocusEnabled && 
        timerState.status == TimerStatus.running && 
        state == AppLifecycleState.paused) {
      // User left the app during Deep Focus!
      // In a real app, we might send a local notification here.
      // For now, we'll just log it or maybe pause the timer as a penalty?
      // Let's just print for now, as we can't easily show UI in background.
      print("User left app during Deep Focus!");
    }
  }

  String _formatTime(int seconds) {
    final minutes = (seconds / 60).floor().toString().padLeft(2, '0');
    final remainingSeconds = (seconds % 60).toString().padLeft(2, '0');
    return '$minutes:$remainingSeconds';
  }

  @override
  Widget build(BuildContext context) {
    final timerState = ref.watch(timerNotifierProvider);
    final timerNotifier = ref.read(timerNotifierProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Focus Mode'),
        centerTitle: true,
        leading: IconButton(
          onPressed: () => context.go('/focus/analytics'),
          icon: const Icon(Icons.bar_chart),
          tooltip: 'Analytics',
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              // Phase Selector
              SegmentedButton<TimerPhase>(
                segments: const [
                  ButtonSegment(
                    value: TimerPhase.focus,
                    label: Text('Focus'),
                    icon: Icon(Icons.timer),
                  ),
                  ButtonSegment(
                    value: TimerPhase.shortBreak,
                    label: Text('Short Break'),
                    icon: Icon(Icons.coffee),
                  ),
                  ButtonSegment(
                    value: TimerPhase.longBreak,
                    label: Text('Long Break'),
                    icon: Icon(Icons.weekend),
                  ),
                ],
                selected: {timerState.phase},
                onSelectionChanged: (Set<TimerPhase> newSelection) {
                  timerNotifier.setPhase(newSelection.first);
                },
              ),
              const Gap(24),

              // Duration Slider
              if (timerState.status != TimerStatus.running)
                Column(
                  children: [
                    Text(
                      'Duration: ${(timerState.initialSeconds / 60).round()} min',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    Slider(
                      value: timerState.initialSeconds.toDouble(),
                      min: 60,
                      max: timerState.phase == TimerPhase.focus ? 120 * 60 : 30 * 60,
                      divisions: timerState.phase == TimerPhase.focus ? 119 : 29,
                      label: '${(timerState.initialSeconds / 60).round()} min',
                      onChanged: (value) {
                        timerNotifier.setDuration(value.toInt());
                      },
                    ),
                  ],
                ),
              
              // Intent Input
              if (timerState.status != TimerStatus.running)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: TextField(
                    decoration: InputDecoration(
                      labelText: timerState.phase == TimerPhase.focus
                          ? 'What do you want to focus on?'
                          : 'How will you spend your break?',
                      border: const OutlineInputBorder(),
                      prefixIcon: Icon(
                        timerState.phase == TimerPhase.focus
                            ? Icons.track_changes
                            : Icons.spa,
                      ),
                    ),
                    onChanged: (value) {
                      if (timerState.phase == TimerPhase.focus) {
                        timerNotifier.setFocusIntent(value);
                      } else {
                        timerNotifier.setBreakIntent(value);
                      }
                    },
                  ),
                ),
              
              // Intent Display (When Running)
              if (timerState.status == TimerStatus.running && 
                  ((timerState.phase == TimerPhase.focus && timerState.focusIntent != null) ||
                   (timerState.phase != TimerPhase.focus && timerState.breakIntent != null)))
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Column(
                    children: [
                      Text(
                        timerState.phase == TimerPhase.focus ? 'Focusing on:' : 'Break Activity:',
                        style: Theme.of(context).textTheme.labelMedium,
                      ),
                      const Gap(8),
                      Text(
                        timerState.phase == TimerPhase.focus 
                            ? timerState.focusIntent! 
                            : timerState.breakIntent!,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),

              // Smart Break Tip
              if (timerState.phase != TimerPhase.focus)
                const SmartBreakTip(),

              const Gap(48),
              
              // Timer Display
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 280,
                    height: 280,
                    child: CircularProgressIndicator(
                      value: timerState.progress,
                      strokeWidth: 12,
                      backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        timerState.phase == TimerPhase.focus
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).colorScheme.tertiary,
                      ),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _formatTime(timerState.remainingSeconds),
                        style: Theme.of(context).textTheme.displayLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              fontFeatures: [const FontFeature.tabularFigures()],
                            ),
                      ),
                      const Gap(8),
                      Text(
                        timerState.phase.name.toUpperCase(),
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                              letterSpacing: 1.5,
                              color: Theme.of(context).colorScheme.outline,
                            ),
                      ),
                    ],
                  ),
                ],
              ),
              const Gap(48),

              // Controls
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton.filledTonal(
                    onPressed: (timerState.isDeepFocusEnabled &&
                            timerState.status == TimerStatus.running)
                        ? null
                        : timerNotifier.reset,
                    icon: const Icon(Icons.refresh),
                    iconSize: 32,
                  ),
                  const Gap(24),
                  FloatingActionButton.large(
                    onPressed: (timerState.isDeepFocusEnabled &&
                            timerState.status == TimerStatus.running)
                        ? null // Disable stop/pause in Deep Focus
                        : (timerState.status == TimerStatus.running
                            ? timerNotifier.pause
                            : timerNotifier.start),
                    child: Icon(
                      timerState.status == TimerStatus.running
                          ? (timerState.isDeepFocusEnabled
                              ? Icons.lock
                              : Icons.pause)
                          : Icons.play_arrow,
                    ),
                  ),
                  const Gap(24),
                  IconButton.filledTonal(
                    onPressed: () {
                      // TODO: Implement settings or skip
                    },
                    icon: const Icon(Icons.skip_next),
                    iconSize: 32,
                  ),
                ],
              ),
              const Gap(24),
              
              // Deep Focus Toggle
              SwitchListTile(
                title: const Text('Deep Focus Mode'),
                subtitle: const Text('Locks app while focusing (Android only)'),
                value: timerState.isDeepFocusEnabled,
                onChanged: timerState.status == TimerStatus.running
                    ? null // Disable toggle while running
                    : (value) => timerNotifier.toggleDeepFocus(),
                secondary: const Icon(Icons.lock_outline),
              ),
              const Gap(24),
            ],
          ),
        ),
      ),
    );
  }
}

