import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import '../providers/social_provider.dart';
import '../../data/models/leaderboard_entry.dart';

class LeaderboardScreen extends ConsumerWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaderboardAsync = ref.watch(leaderboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Leaderboard'),
      ),
      body: leaderboardAsync.when(
        data: (entries) {
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: entries.length,
            itemBuilder: (context, index) {
              final entry = entries[index];
              final isMe = entry.userId == 'me';
              
              return Card(
                elevation: isMe ? 4 : 1,
                color: isMe ? Theme.of(context).colorScheme.primaryContainer : null,
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: _buildRankBadge(context, entry.rank),
                  title: Text(
                    entry.username,
                    style: TextStyle(
                      fontWeight: isMe ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  subtitle: Text('Streak: ${entry.streak} days'),
                  trailing: Text(
                    '${entry.weeklyHours}h',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
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
    );
  }

  Widget _buildRankBadge(BuildContext context, int rank) {
    Color? color;
    IconData? icon;

    if (rank == 1) {
      color = Colors.amber;
      icon = Icons.emoji_events;
    } else if (rank == 2) {
      color = Colors.grey.shade400;
      icon = Icons.emoji_events;
    } else if (rank == 3) {
      color = Colors.brown.shade300;
      icon = Icons.emoji_events;
    }

    if (icon != null) {
      return CircleAvatar(
        backgroundColor: color,
        child: Icon(icon, color: Colors.white),
      );
    }

    return CircleAvatar(
      backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Text(
        '#$rank',
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}
