import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import '../providers/subjects_provider.dart';
import '../providers/exam_provider.dart';

class ExamSetupScreen extends ConsumerStatefulWidget {
  const ExamSetupScreen({super.key});

  @override
  ConsumerState<ExamSetupScreen> createState() => _ExamSetupScreenState();
}

class _ExamSetupScreenState extends ConsumerState<ExamSetupScreen> {
  int? _selectedSubjectId;
  String? _selectedSubjectName;
  double _questionCount = 5;

  @override
  Widget build(BuildContext context) {
    final subjectsAsync = ref.watch(subjectsNotifierProvider);
    final examAsync = ref.watch(examNotifierProvider);

    // Listen for success
    ref.listen(examNotifierProvider, (previous, next) {
      if (next.hasValue && next.value!.isNotEmpty) {
        context.push('/learning/exam/play', extra: {
          'subject': _selectedSubjectName,
          'questions': next.value,
        });
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Exam Generator'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.timer_outlined, size: 80, color: Colors.redAccent),
            const Gap(32),
            Text(
              'Configure Exam',
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const Gap(32),
            subjectsAsync.when(
              data: (subjects) {
                if (subjects.isEmpty) {
                  return const Text('No subjects found. Please add subjects first.');
                }
                return DropdownButtonFormField<int>(
                  decoration: const InputDecoration(
                    labelText: 'Select Subject',
                    border: OutlineInputBorder(),
                  ),
                  value: _selectedSubjectId,
                  items: subjects.map((s) {
                    return DropdownMenuItem(
                      value: s.id,
                      child: Text(s.name),
                    );
                  }).toList(),
                  onChanged: (val) {
                    setState(() {
                      _selectedSubjectId = val;
                      _selectedSubjectName = subjects.firstWhere((s) => s.id == val).name;
                    });
                  },
                );
              },
              loading: () => const CircularProgressIndicator(),
              error: (err, stack) => Text('Error: $err'),
            ),
            const Gap(24),
            Text('Number of Questions: ${_questionCount.toInt()}'),
            Slider(
              value: _questionCount,
              min: 5,
              max: 20,
              divisions: 3,
              label: _questionCount.toInt().toString(),
              onChanged: (val) => setState(() => _questionCount = val),
            ),
            const Spacer(),
            if (examAsync.isLoading)
              const Center(child: CircularProgressIndicator())
            else
              FilledButton.icon(
                onPressed: _selectedSubjectId == null
                    ? null
                    : () {
                        ref.read(examNotifierProvider.notifier).generateExam(
                              _selectedSubjectName!,
                              _questionCount.toInt(),
                            );
                      },
                icon: const Icon(Icons.play_arrow),
                label: const Text('Start Exam'),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.all(16),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
