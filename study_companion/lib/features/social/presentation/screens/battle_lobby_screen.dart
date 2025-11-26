import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gap/gap.dart';
import '../providers/battle_provider.dart';
import '../../data/models/battle_match.dart';

class BattleLobbyScreen extends ConsumerStatefulWidget {
  const BattleLobbyScreen({super.key});

  @override
  ConsumerState<BattleLobbyScreen> createState() => _BattleLobbyScreenState();
}

class _BattleLobbyScreenState extends ConsumerState<BattleLobbyScreen> {
  @override
  void initState() {
    super.initState();
    // Start searching immediately
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(battleNotifierProvider.notifier).findMatch();
    });
  }

  @override
  Widget build(BuildContext context) {
    final match = ref.watch(battleNotifierProvider);

    // Listen for match found
    ref.listen(battleNotifierProvider, (previous, next) {
      if (next != null && next.status == BattleStatus.playing) {
        context.pushReplacement('/social/battle/play');
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Finding Opponent...')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const Gap(24),
            Text(
              'Searching for a worthy opponent...',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const Gap(48),
            OutlinedButton(
              onPressed: () => context.pop(),
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
    );
  }
}
