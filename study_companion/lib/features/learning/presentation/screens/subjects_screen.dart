import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import '../providers/subjects_provider.dart';

class SubjectsScreen extends ConsumerWidget {
  const SubjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjectsAsync = ref.watch(subjectsNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Subjects & Progress'),
      ),
      body: subjectsAsync.when(
        data: (subjects) {
          if (subjects.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.class_outlined, size: 64, color: Colors.grey),
                  Gap(16),
                  Text('No subjects yet. Add one!'),
                ],
              ),
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.2,
            ),
            itemCount: subjects.length,
            itemBuilder: (context, index) {
              final subject = subjects[index];
              return Card(
                color: Color(subject.colorValue).withOpacity(0.2),
                child: InkWell(
                  onTap: () {
                    context.push('/learning/subjects/${subject.id}', extra: subject);
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          IconData(subject.iconCode, fontFamily: 'MaterialIcons'),
                          size: 48,
                          color: Color(subject.colorValue),
                        ),
                        const Gap(16),
                        Text(
                          subject.name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddSubjectDialog(context, ref),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddSubjectDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    int selectedColor = Colors.blue.value;
    int selectedIcon = Icons.book.codePoint;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('New Subject'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Subject Name'),
                textCapitalization: TextCapitalization.words,
              ),
              const Gap(16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _ColorPicker(
                    selectedColor: selectedColor,
                    onColorSelected: (color) => setState(() => selectedColor = color),
                  ),
                  _IconPicker(
                    selectedIcon: selectedIcon,
                    onIconSelected: (icon) => setState(() => selectedIcon = icon),
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
                  ref.read(subjectsNotifierProvider.notifier).addSubject(
                        nameController.text,
                        selectedColor,
                        selectedIcon,
                      );
                  Navigator.pop(context);
                }
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ColorPicker extends StatelessWidget {
  final int selectedColor;
  final ValueChanged<int> onColorSelected;

  const _ColorPicker({required this.selectedColor, required this.onColorSelected});

  final colors = const [
    Colors.blue,
    Colors.red,
    Colors.green,
    Colors.orange,
    Colors.purple,
    Colors.teal,
  ];

  @override
  Widget build(BuildContext context) {
    return DropdownButton<int>(
      value: colors.any((c) => c.value == selectedColor) ? selectedColor : colors.first.value,
      items: colors.map((c) {
        return DropdownMenuItem(
          value: c.value,
          child: Container(width: 24, height: 24, color: c),
        );
      }).toList(),
      onChanged: (v) {
        if (v != null) onColorSelected(v);
      },
    );
  }
}

class _IconPicker extends StatelessWidget {
  final int selectedIcon;
  final ValueChanged<int> onIconSelected;

  const _IconPicker({required this.selectedIcon, required this.onIconSelected});

  final icons = const [
    Icons.book,
    Icons.calculate,
    Icons.science,
    Icons.history_edu,
    Icons.language,
    Icons.computer,
  ];

  @override
  Widget build(BuildContext context) {
    return DropdownButton<int>(
      value: icons.any((i) => i.codePoint == selectedIcon) ? selectedIcon : icons.first.codePoint,
      items: icons.map((i) {
        return DropdownMenuItem(
          value: i.codePoint,
          child: Icon(i),
        );
      }).toList(),
      onChanged: (v) {
        if (v != null) onIconSelected(v);
      },
    );
  }
}
