import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:gap/gap.dart';

class LearningScreen extends StatelessWidget {
  const LearningScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Learning Tools'),
      ),
      body: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverGrid.count(
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              children: [
                _LearningCard(
                  title: 'Subjects',
                  icon: Icons.library_books,
                  color: Colors.blue,
                  onTap: () => context.go('/learning/subjects'),
                ),
                _LearningCard(
                  title: 'Notes',
                  icon: Icons.edit_note,
                  color: Colors.amber,
                  onTap: () => context.go('/learning/notes'),
                ),
                _LearningCard(
                  title: 'Flashcards',
                  icon: Icons.style,
                  color: Colors.green,
                  onTap: () => context.go('/learning/flashcards'),
                ),
                _LearningCard(
                  title: 'Quiz Gen',
                  icon: Icons.quiz,
                  color: Colors.purple,
                  onTap: () => context.go('/learning/quiz'),
                ),
                _LearningCard(
                  title: 'Summarizer',
                  icon: Icons.summarize,
                  color: Colors.orange,
                  onTap: () => context.go('/learning/summary'),
                ),
                _LearningCard(
                  title: 'Exams',
                  icon: Icons.timer,
                  color: Colors.red,
                  onTap: () => context.go('/learning/exam'),
                ),
                _LearningCard(
                  title: 'Smart Review',
                  icon: Icons.psychology,
                  color: Colors.teal,
                  onTap: () => context.go('/learning/review'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LearningCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _LearningCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                color.withOpacity(0.1),
                color.withOpacity(0.05),
              ],
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 32, color: color),
              ),
              const Gap(16),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

