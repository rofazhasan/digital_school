import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:intl/intl.dart';
import '../../data/models/routine_block.dart';
import '../providers/routine_provider.dart';

class AddBlockDialog extends ConsumerStatefulWidget {
  final DateTime selectedDate;
  final RoutineBlock? block;

  const AddBlockDialog({
    super.key, 
    required this.selectedDate,
    this.block,
  });

  @override
  ConsumerState<AddBlockDialog> createState() => _AddBlockDialogState();
}

class _AddBlockDialogState extends ConsumerState<AddBlockDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late BlockType _selectedType;
  late TimeOfDay _startTime;
  late int _durationMinutes;
  late TaskDifficulty _difficulty;

  @override
  void initState() {
    super.initState();
    final block = widget.block;
    _titleController = TextEditingController(text: block?.title);
    _selectedType = block?.type ?? BlockType.study;
    _startTime = block != null 
        ? TimeOfDay.fromDateTime(block.startTime) 
        : TimeOfDay.now();
    _durationMinutes = block?.durationMinutes ?? 60;
    _difficulty = block?.difficulty ?? TaskDifficulty.medium;
  }

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.block == null ? 'Add Routine Block' : 'Edit Routine Block'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title (Optional)',
                  hintText: 'e.g., Math Study',
                  border: OutlineInputBorder(),
                ),
              ),
              const Gap(16),
              DropdownButtonFormField<BlockType>(
                value: _selectedType,
                decoration: const InputDecoration(
                  labelText: 'Type',
                  border: OutlineInputBorder(),
                ),
                items: BlockType.values.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(type.name.toUpperCase()),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) setState(() => _selectedType = value);
                },
              ),
              const Gap(16),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () async {
                        final time = await showTimePicker(
                          context: context,
                          initialTime: _startTime,
                        );
                        if (time != null) setState(() => _startTime = time);
                      },
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Start Time',
                          border: OutlineInputBorder(),
                        ),
                        child: Text(_startTime.format(context)),
                      ),
                    ),
                  ),
                  const Gap(16),
                  Expanded(
                    child: TextFormField(
                      initialValue: _durationMinutes.toString(),
                      decoration: const InputDecoration(
                        labelText: 'Duration (min)',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      onChanged: (value) {
                        _durationMinutes = int.tryParse(value) ?? 60;
                      },
                    ),
                  ),
                ],
              ),
              const Gap(16),
              DropdownButtonFormField<TaskDifficulty>(
                value: _difficulty,
                decoration: const InputDecoration(
                  labelText: 'Difficulty',
                  border: OutlineInputBorder(),
                ),
                items: TaskDifficulty.values.map((diff) {
                  return DropdownMenuItem(
                    value: diff,
                    child: Text(diff.name.toUpperCase()),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) setState(() => _difficulty = value);
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
          onPressed: _saveBlock,
          child: Text(widget.block == null ? 'Add' : 'Save'),
        ),
      ],
    );
  }

  void _saveBlock() {
    if (_formKey.currentState!.validate()) {
      final now = widget.selectedDate;
      final startDateTime = DateTime(
        now.year,
        now.month,
        now.day,
        _startTime.hour,
        _startTime.minute,
      );

      if (widget.block != null) {
        // Update existing block
        final updatedBlock = widget.block!
          ..startTime = startDateTime
          ..durationMinutes = _durationMinutes
          ..title = _titleController.text.isEmpty ? null : _titleController.text
          ..type = _selectedType
          ..difficulty = _difficulty;
          
        ref.read(dailyRoutineBlocksProvider.notifier).updateBlock(updatedBlock);
      } else {
        // Create new block
        final block = RoutineBlock()
          ..date = DateTime(now.year, now.month, now.day)
          ..startTime = startDateTime
          ..durationMinutes = _durationMinutes
          ..title = _titleController.text.isEmpty ? null : _titleController.text
          ..type = _selectedType
          ..difficulty = _difficulty;

        ref.read(dailyRoutineBlocksProvider.notifier).addBlock(block);
      }
      Navigator.pop(context);
    }
  }
}
