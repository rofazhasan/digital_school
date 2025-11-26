import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import '../providers/subject_provider.dart';
import '../providers/routine_ai_provider.dart';

class AIPlannerDialog extends ConsumerStatefulWidget {
  final DateTime date;

  const AIPlannerDialog({super.key, required this.date});

  @override
  ConsumerState<AIPlannerDialog> createState() => _AIPlannerDialogState();
}

class _AIPlannerDialogState extends ConsumerState<AIPlannerDialog> {
  final _selectedSubjects = <String>{};
  String _mood = 'Energetic';
  double _totalHours = 4;

  final _moods = ['Energetic', 'Normal', 'Tired', 'Stressed', 'Motivated'];

  @override
  Widget build(BuildContext context) {
    final subjectsAsync = ref.watch(subjectsProvider);
    final aiState = ref.watch(routineAIProvider);

    return AlertDialog(
      title: const Row(
        children: [
          Icon(Icons.auto_awesome, color: Colors.purple),
          Gap(8),
          Text('AI Day Planner'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Let AI optimize your schedule based on your goals and energy.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const Gap(16),
            
            // Subjects
            const Text('What do you want to study?', style: TextStyle(fontWeight: FontWeight.bold)),
            const Gap(8),
            subjectsAsync.when(
              data: (subjects) {
                if (subjects.isEmpty) return const Text('No subjects added yet.');
                return Wrap(
                  spacing: 8,
                  children: subjects.map((subject) {
                    final isSelected = _selectedSubjects.contains(subject.name);
                    return FilterChip(
                      label: Text(subject.name),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          if (selected) {
                            _selectedSubjects.add(subject.name);
                          } else {
                            _selectedSubjects.remove(subject.name);
                          }
                        });
                      },
                    );
                  }).toList(),
                );
              },
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const Text('Error loading subjects'),
            ),
            const Gap(16),

            // Mood
            const Text('How are you feeling?', style: TextStyle(fontWeight: FontWeight.bold)),
            const Gap(8),
            DropdownButtonFormField<String>(
              value: _mood,
              decoration: const InputDecoration(border: OutlineInputBorder()),
              items: _moods.map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
              onChanged: (val) => setState(() => _mood = val!),
            ),
            const Gap(16),

            // Time
            Text('Total Study Time: ${_totalHours.round()} hours', style: const TextStyle(fontWeight: FontWeight.bold)),
            Slider(
              value: _totalHours,
              min: 1,
              max: 12,
              divisions: 11,
              label: '${_totalHours.round()}h',
              onChanged: (val) => setState(() => _totalHours = val),
            ),
            
            if (aiState.isLoading)
              const Padding(
                padding: EdgeInsets.only(top: 16),
                child: Column(
                  children: [
                    CircularProgressIndicator(),
                    Gap(8),
                    Text('Generating your perfect schedule...'),
                  ],
                ),
              ),
            
            if (aiState.hasError)
               Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(
                  'Error: ${aiState.error}',
                  style: const TextStyle(color: Colors.red),
                ),
              ),
          ],
        ),
      ),
      actions: [
        if (!aiState.isLoading) ...[
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton.icon(
            onPressed: _selectedSubjects.isEmpty ? null : _generateSchedule,
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Generate'),
          ),
        ],
      ],
    );
  }

  Future<void> _generateSchedule() async {
    await ref.read(routineAIProvider.notifier).generateSchedule(
      subjects: _selectedSubjects.toList(),
      mood: _mood,
      date: widget.date,
      totalHours: _totalHours.round(),
    );
    
    if (mounted && !ref.read(routineAIProvider).hasError) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Schedule generated successfully!')),
      );
    }
  }
}
