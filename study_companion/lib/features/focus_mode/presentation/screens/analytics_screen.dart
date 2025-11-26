import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import '../providers/analytics_provider.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analyticsAsync = ref.watch(analyticsNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Study Analytics'),
      ),
      body: analyticsAsync.when(
        data: (state) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildStatCard(
              context,
              title: 'Total Focus Time',
              value: _formatDuration(state.totalFocusTime),
              icon: Icons.timer,
              color: Colors.blue,
            ),
            const Gap(16),
            _buildStatCard(
              context,
              title: "Today's Focus",
              value: _formatDuration(state.todayFocusTime),
              icon: Icons.today,
              color: Colors.green,
            ),
            const Gap(16),
            _buildStatCard(
              context,
              title: 'Sessions Completed',
              value: state.sessionCount.toString(),
              icon: Icons.check_circle,
              color: Colors.orange,
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 32),
            ),
            const Gap(24),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.secondary,
                      ),
                ),
                const Gap(4),
                Text(
                  value,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDuration(int seconds) {
    if (seconds < 60) return '$seconds sec';
    final minutes = (seconds / 60).floor();
    if (minutes < 60) return '$minutes min';
    final hours = (minutes / 60).toStringAsFixed(1);
    return '$hours hrs';
  }
}
