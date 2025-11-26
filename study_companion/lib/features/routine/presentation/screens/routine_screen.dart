import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../../../focus_mode/presentation/providers/timer_provider.dart';
import '../providers/routine_provider.dart';
import '../../data/models/routine_block.dart';
import '../widgets/add_block_dialog.dart';
import '../widgets/habit_tracker.dart';
import '../widgets/mission_card.dart';
import '../widgets/ai_planner_dialog.dart';
import '../widgets/reflection_sheet.dart';

class RoutineScreen extends ConsumerWidget {
  const RoutineScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDate = ref.watch(selectedDateProvider);
    final blocksAsync = ref.watch(dailyRoutineBlocksProvider);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Daily Routine'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Schedule', icon: Icon(Icons.schedule)),
              Tab(text: 'Habits', icon: Icon(Icons.check_circle_outline)),
            ],
          ),
          actions: [
            IconButton(
            icon: const Icon(Icons.auto_awesome, color: Colors.purple),
            tooltip: 'AI Planner',
            onPressed: () => showDialog(
              context: context,
              builder: (context) => AIPlannerDialog(date: selectedDate),
            ),
          ),
            IconButton(
              icon: const Icon(Icons.nightlight_round, color: Colors.indigo),
              tooltip: 'Evening Reflection',
              onPressed: () => showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => const ReflectionSheet(),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.calendar_today),
              onPressed: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: selectedDate,
                  firstDate: DateTime(2024),
                  lastDate: DateTime(2026),
                );
                if (date != null) {
                  ref.read(selectedDateProvider.notifier).setDate(date);
                }
              },
            ),
          ],
        ),
        body: TabBarView(
          children: [
            // Schedule Tab
            Column(
              children: [
                _buildDateHeader(context, selectedDate, ref),
                MissionCard(date: selectedDate),
                Expanded(
                  child: blocksAsync.when(
                    data: (blocks) {
                      if (blocks.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.schedule, size: 64, color: Colors.grey),
                              const Gap(16),
                              Text(
                                'No routine planned for today',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const Gap(8),
                              FilledButton.tonal(
                                onPressed: () => _showAddBlockDialog(context, selectedDate),
                                child: const Text('Create Schedule'),
                              ),
                            ],
                          ),
                        );
                      }
                      return ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: blocks.length,
                        itemBuilder: (context, index) {
                          final block = blocks[index];
                          return _buildBlockCard(context, ref, block);
                        },
                      );
                    },
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, stack) => Center(child: Text('Error: $err')),
                  ),
                ),
              ],
            ),
            
            // Habits Tab
            const HabitTracker(),
          ],
        ),
        floatingActionButton: Builder(
          builder: (context) {
            final tabController = DefaultTabController.of(context);
            // Note: DefaultTabController doesn't easily expose index changes to rebuild FAB.
            // We might need a custom TabController or just show FAB for Schedule only.
            // For simplicity, let's keep the FAB for Schedule and let HabitTracker manage its own add button (which it does).
            // But wait, HabitTracker has a button at the bottom of the list.
            // So we only show this FAB if we are on the first tab?
            // Actually, DefaultTabController doesn't rebuild this.
            // Let's just keep the FAB for adding blocks, and maybe hide it if on habits tab?
            // Or simpler: Just keep it here. If user clicks it, it adds a block.
            // HabitTracker has its own "Add" button in the list.
            return FloatingActionButton.extended(
              onPressed: () => _showAddBlockDialog(context, selectedDate),
              label: const Text('Add Block'),
              icon: const Icon(Icons.add),
            );
          },
        ),
      ),
    );
  }

  Widget _buildDateHeader(BuildContext context, DateTime date, WidgetRef ref) {
    final dailyRoutineAsync = ref.watch(dailyRoutineProvider);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          bottom: BorderSide(
            color: Theme.of(context).colorScheme.outlineVariant,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                DateFormat('EEEE').format(date),
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              Text(
                DateFormat('MMMM d, y').format(date),
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
          // Daily Progress Ring
          dailyRoutineAsync.when(
            data: (routine) {
              final score = routine?.healthScore ?? 0;
              return Column(
                children: [
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      CircularProgressIndicator(
                        value: score / 100,
                        backgroundColor: Colors.grey[200],
                        color: score >= 80 ? Colors.green : (score >= 50 ? Colors.orange : Colors.red),
                      ),
                      Text(
                        '$score',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const Gap(4),
                  const Text('Health', style: TextStyle(fontSize: 10)),
                ],
              );
            },
            loading: () => const SizedBox(width: 36, height: 36, child: CircularProgressIndicator()),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _buildBlockCard(BuildContext context, WidgetRef ref, RoutineBlock block) {
    final color = _getBlockColor(context, block.type);
    final isCompleted = block.isCompleted;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      color: isCompleted ? Colors.grey[100] : color.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: isCompleted ? Colors.grey[300]! : color.withOpacity(0.2)),
      ),
      child: ListTile(
        onTap: () {
          if (block.type == BlockType.study || 
              block.type == BlockType.homework || 
              block.type == BlockType.revision) {
            ref.read(timerNotifierProvider.notifier).configureSession(
              durationSeconds: block.durationMinutes * 60,
              intent: block.title ?? block.type.name,
              routineBlockId: block.id,
            );
            context.go('/focus');
          }
        },
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: InkWell(
          onTap: () => ref.read(dailyRoutineBlocksProvider.notifier).toggleCompletion(block.id),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isCompleted ? Colors.green : color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isCompleted ? Icons.check : _getBlockIcon(block.type), 
              color: isCompleted ? Colors.white : color,
            ),
          ),
        ),
        title: Text(
          block.title ?? block.type.name.toUpperCase(),
          style: TextStyle(
            fontWeight: FontWeight.bold,
            decoration: isCompleted ? TextDecoration.lineThrough : null,
            color: isCompleted ? Colors.grey : null,
          ),
        ),
        subtitle: Text(
          '${DateFormat('h:mm a').format(block.startTime)} - ${DateFormat('h:mm a').format(block.endTime)} • ${block.durationMinutes} min',
          style: TextStyle(
            decoration: isCompleted ? TextDecoration.lineThrough : null,
          ),
        ),
        trailing: PopupMenuButton<String>(
          icon: const Icon(Icons.more_vert),
          onSelected: (value) {
            if (value == 'edit') {
              _showAddBlockDialog(context, ref.read(selectedDateProvider), block: block);
            } else if (value == 'delete') {
              ref.read(dailyRoutineBlocksProvider.notifier).deleteBlock(block.id);
            }
          },
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'edit',
              child: Row(
                children: [
                  Icon(Icons.edit, size: 20),
                  Gap(8),
                  Text('Edit'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'delete',
              child: Row(
                children: [
                  Icon(Icons.delete, size: 20, color: Colors.red),
                  Gap(8),
                  Text('Delete', style: TextStyle(color: Colors.red)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getBlockColor(BuildContext context, BlockType type) {
    switch (type) {
      case BlockType.study:
        return Colors.blue;
      case BlockType.homework:
        return Colors.orange;
      case BlockType.revision:
        return Colors.purple;
      case BlockType.breakTime:
        return Colors.green;
      case BlockType.personal:
        return Colors.pink;
      case BlockType.other:
        return Colors.grey;
    }
  }

  IconData _getBlockIcon(BlockType type) {
    switch (type) {
      case BlockType.study:
        return Icons.school;
      case BlockType.homework:
        return Icons.edit_document;
      case BlockType.revision:
        return Icons.repeat;
      case BlockType.breakTime:
        return Icons.coffee;
      case BlockType.personal:
        return Icons.person;
      case BlockType.other:
        return Icons.circle;
    }
  }

  void _showAddBlockDialog(BuildContext context, DateTime selectedDate, {RoutineBlock? block}) {
    showDialog(
      context: context,
      builder: (context) => AddBlockDialog(selectedDate: selectedDate, block: block),
    );
  }
}
