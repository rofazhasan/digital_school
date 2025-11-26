import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import '../providers/quiz_provider.dart';

class QuizSetupScreen extends ConsumerStatefulWidget {
  const QuizSetupScreen({super.key});

  @override
  ConsumerState<QuizSetupScreen> createState() => _QuizSetupScreenState();
}

class _QuizSetupScreenState extends ConsumerState<QuizSetupScreen> {
  final _topicController = TextEditingController();

  @override
  void dispose() {
    _topicController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final quizAsync = ref.watch(quizNotifierProvider);

    // Listen for success to navigate
    ref.listen(quizNotifierProvider, (previous, next) {
      if (next.hasValue && next.value!.isNotEmpty) {
        context.push('/learning/quiz/play');
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('MCQ Generator'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.quiz_outlined, size: 80, color: Colors.blue),
            const Gap(32),
            Text(
              'What do you want to test?',
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const Gap(8),
            const Text(
              'Enter a topic or paste some notes below.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            const Gap(32),
            TextField(
              controller: _topicController,
              maxLines: 5,
              decoration: const InputDecoration(
                hintText: 'e.g., Photosynthesis process, History of Rome, or paste text...',
                border: OutlineInputBorder(),
              ),
            ),
            const Gap(24),
            if (quizAsync.isLoading)
              const Center(child: CircularProgressIndicator())
            else
              FilledButton.icon(
                onPressed: () {
                  if (_topicController.text.isNotEmpty) {
                    ref.read(quizNotifierProvider.notifier).generateQuiz(_topicController.text);
                  }
                },
                icon: const Icon(Icons.auto_awesome),
                label: const Text('Generate Quiz'),
              ),
            if (quizAsync.hasError) ...[
              const Gap(16),
              Text(
                'Error: ${quizAsync.error}',
                style: const TextStyle(color: Colors.red),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
