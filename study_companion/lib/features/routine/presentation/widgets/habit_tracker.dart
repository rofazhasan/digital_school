import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import '../../data/models/habit.dart';
import '../providers/habit_provider.dart';
import 'add_habit_dialog.dart';

class HabitTracker extends ConsumerWidget {
  const HabitTracker({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final habitsAsync = ref.watch(habitsProvider);

    return habitsAsync.when(
      data: (habits) {
        if (habits.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle_outline, size: 64, color: Colors.grey),
                const Gap(16),
                Text(
                  'No habits yet',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Gap(8),
                FilledButton.tonal(
                  onPressed: () => _showAddHabitDialog(context),
                  child: const Text('Start a Habit'),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: habits.length + 1, // +1 for Add button at bottom
          itemBuilder: (context, index) {
            if (index == habits.length) {
              return Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Center(
                  child: TextButton.icon(
                    onPressed: () => _showAddHabitDialog(context),
                    icon: const Icon(Icons.add),
                    label: const Text('Add New Habit'),
                  ),
                ),
              );
            }

            final habit = habits[index];
            return _buildHabitCard(context, ref, habit);
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(child: Text('Error: $err')),
    );
  }

  Widget _buildHabitCard(BuildContext context, WidgetRef ref, Habit habit) {
    final isCompleted = habit.isCompletedToday;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      color: isCompleted 
          ? Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3)
          : Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isCompleted 
              ? Theme.of(context).colorScheme.primary.withOpacity(0.5)
              : Colors.transparent,
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: IconButton(
          onPressed: () {
            ref.read(habitsProvider.notifier).toggleCompletion(habit.id);
          },
          icon: Icon(
            isCompleted ? Icons.check_circle : Icons.circle_outlined,
            color: isCompleted 
                ? Theme.of(context).colorScheme.primary 
                : Colors.grey,
            size: 32,
          ),
        ),
        title: Text(
          habit.title,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            decoration: isCompleted ? TextDecoration.lineThrough : null,
            color: isCompleted ? Colors.grey : null,
          ),
        ),
        subtitle: habit.cue != null 
            ? Text('Cue: ${habit.cue}', style: const TextStyle(fontSize: 12)) 
            : null,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (habit.currentStreak > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.local_fire_department, size: 16, color: Colors.orange),
                    const Gap(4),
                    Text(
                      '${habit.currentStreak}',
                      style: const TextStyle(
                        color: Colors.orange,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (value) {
                if (value == 'edit') {
                  _showAddHabitDialog(context, habit: habit);
                } else if (value == 'delete') {
                  ref.read(habitsProvider.notifier).deleteHabit(habit.id);
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'edit', child: Text('Edit')),
                const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: Colors.red))),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showAddHabitDialog(BuildContext context, {Habit? habit}) {
    showDialog(
      context: context,
      builder: (context) => AddHabitDialog(habit: habit),
    );
  }
}
