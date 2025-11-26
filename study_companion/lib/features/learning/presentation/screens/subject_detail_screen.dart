import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import '../../data/models/subject.dart';
import '../providers/subjects_provider.dart';

class SubjectDetailScreen extends ConsumerWidget {
  final Subject subject;

  const SubjectDetailScreen({super.key, required this.subject});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chaptersAsync = ref.watch(chaptersNotifierProvider(subject.id));

    return Scaffold(
      appBar: AppBar(
        title: Text(subject.name),
        backgroundColor: Color(subject.colorValue).withOpacity(0.2),
      ),
      body: chaptersAsync.when(
        data: (chapters) {
          if (chapters.isEmpty) {
            return const Center(
              child: Text('No chapters yet. Add one!'),
            );
          }
          return ListView.builder(
            itemCount: chapters.length,
            itemBuilder: (context, index) {
              final chapter = chapters[index];
              return CheckboxListTile(
                title: Text(
                  chapter.name,
                  style: TextStyle(
                    decoration: chapter.isCompleted ? TextDecoration.lineThrough : null,
                    color: chapter.isCompleted ? Colors.grey : null,
                  ),
                ),
                value: chapter.isCompleted,
                onChanged: (val) {
                  if (val != null) {
                    ref.read(chaptersNotifierProvider(subject.id).notifier).toggleChapter(chapter.id, val);
                  }
                },
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddChapterDialog(context, ref),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddChapterDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('New Chapter'),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(labelText: 'Chapter Name'),
          textCapitalization: TextCapitalization.sentences,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (nameController.text.isNotEmpty) {
                ref.read(chaptersNotifierProvider(subject.id).notifier).addChapter(nameController.text);
                Navigator.pop(context);
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}
