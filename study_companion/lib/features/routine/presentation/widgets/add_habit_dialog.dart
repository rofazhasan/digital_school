import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import '../../data/models/habit.dart';
import '../providers/habit_provider.dart';

class AddHabitDialog extends ConsumerStatefulWidget {
  final Habit? habit;

  const AddHabitDialog({super.key, this.habit});

  @override
  ConsumerState<AddHabitDialog> createState() => _AddHabitDialogState();
}

class _AddHabitDialogState extends ConsumerState<AddHabitDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _cueController;
  late TextEditingController _routineController;
  late TextEditingController _rewardController;
  late HabitFrequency _frequency;

  @override
  void initState() {
    super.initState();
    final habit = widget.habit;
    _titleController = TextEditingController(text: habit?.title);
    _cueController = TextEditingController(text: habit?.cue);
    _routineController = TextEditingController(text: habit?.routine);
    _rewardController = TextEditingController(text: habit?.reward);
    _frequency = habit?.frequency ?? HabitFrequency.daily;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _cueController.dispose();
    _routineController.dispose();
    _rewardController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.habit == null ? 'New Habit' : 'Edit Habit'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Habit Title',
                  hintText: 'e.g., Read 10 pages',
                  border: OutlineInputBorder(),
                ),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Please enter a title' : null,
              ),
              const Gap(16),
              // Atomic Habit Structure
              Text(
                'Atomic Habit Loop (Optional)',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const Gap(8),
              TextFormField(
                controller: _cueController,
                decoration: const InputDecoration(
                  labelText: 'Cue (Trigger)',
                  hintText: 'e.g., After I brush my teeth',
                  border: OutlineInputBorder(),
                ),
              ),
              const Gap(8),
              TextFormField(
                controller: _routineController,
                decoration: const InputDecoration(
                  labelText: 'Routine (Action)',
                  hintText: 'e.g., I will read',
                  border: OutlineInputBorder(),
                ),
              ),
              const Gap(8),
              TextFormField(
                controller: _rewardController,
                decoration: const InputDecoration(
                  labelText: 'Reward',
                  hintText: 'e.g., Check social media',
                  border: OutlineInputBorder(),
                ),
              ),
              const Gap(16),
              DropdownButtonFormField<HabitFrequency>(
                value: _frequency,
                decoration: const InputDecoration(
                  labelText: 'Frequency',
                  border: OutlineInputBorder(),
                ),
                items: HabitFrequency.values.map((freq) {
                  return DropdownMenuItem(
                    value: freq,
                    child: Text(freq.name.toUpperCase()),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) setState(() => _frequency = value);
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _saveHabit,
          child: Text(widget.habit == null ? 'Create' : 'Save'),
        ),
      ],
    );
  }

  void _saveHabit() {
    if (_formKey.currentState!.validate()) {
      if (widget.habit != null) {
        final updatedHabit = widget.habit!
          ..title = _titleController.text
          ..cue = _cueController.text.isEmpty ? null : _cueController.text
          ..routine = _routineController.text.isEmpty ? null : _routineController.text
          ..reward = _rewardController.text.isEmpty ? null : _rewardController.text
          ..frequency = _frequency;
        
        ref.read(habitsProvider.notifier).updateHabit(updatedHabit);
      } else {
        final habit = Habit()
          ..title = _titleController.text
          ..cue = _cueController.text.isEmpty ? null : _cueController.text
          ..routine = _routineController.text.isEmpty ? null : _routineController.text
          ..reward = _rewardController.text.isEmpty ? null : _rewardController.text
          ..frequency = _frequency;
        
        ref.read(habitsProvider.notifier).addHabit(habit);
      }
      Navigator.pop(context);
    }
  }
}
