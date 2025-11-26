import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import '../providers/routine_provider.dart';

class RoutineScreen extends ConsumerWidget {
  const RoutineScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final routinesAsync = ref.watch(routineNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Daily Routines'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddRoutineDialog(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('New Routine'),
      ),
      body: routinesAsync.when(
        data: (routines) {
          if (routines.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.schedule, size: 64, color: Colors.grey),
                  Gap(16),
                  Text('No routines set. Build your habit!'),
                ],
              ),
            );
          }
          return ListView.builder(
            itemCount: routines.length,
            itemBuilder: (context, index) {
              final routine = routines[index];
              return SwitchListTile(
                title: Text(routine.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(
                  '${_formatTime(routine.startTimeHour, routine.startTimeMinute)} • ${routine.durationMinutes} min',
                ),
                value: routine.isEnabled,
                onChanged: (value) {
                  ref.read(routineNotifierProvider.notifier).toggleRoutine(routine);
                },
                secondary: const Icon(Icons.alarm),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  String _formatTime(int hour, int minute) {
    final time = TimeOfDay(hour: hour, minute: minute);
    // Simple formatting, could use localization
    final hourStr = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final minuteStr = time.minute.toString().padLeft(2, '0');
    final period = time.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hourStr:$minuteStr $period';
  }

  void _showAddRoutineDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final durationController = TextEditingController(text: '30');
    TimeOfDay selectedTime = const TimeOfDay(hour: 9, minute: 0);

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('New Routine'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Routine Name'),
                textCapitalization: TextCapitalization.sentences,
              ),
              const Gap(16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        final time = await showTimePicker(
                          context: context,
                          initialTime: selectedTime,
                        );
                        if (time != null) {
                          setState(() => selectedTime = time);
                        }
                      },
                      child: Text(_formatTime(selectedTime.hour, selectedTime.minute)),
                    ),
                  ),
                  const Gap(16),
                  Expanded(
                    child: TextField(
                      controller: durationController,
                      decoration: const InputDecoration(labelText: 'Minutes'),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                if (nameController.text.isNotEmpty) {
                  ref.read(routineNotifierProvider.notifier).addRoutine(
                        name: nameController.text,
                        startTimeHour: selectedTime.hour,
                        startTimeMinute: selectedTime.minute,
                        durationMinutes: int.tryParse(durationController.text) ?? 30,
                        daysOfWeek: [1, 2, 3, 4, 5], // Default Mon-Fri
                      );
                  Navigator.pop(context);
                }
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}
