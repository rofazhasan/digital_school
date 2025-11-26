import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import '../providers/mission_provider.dart';

class MissionCard extends ConsumerWidget {
  final DateTime date;

  const MissionCard({super.key, required this.date});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final missionAsync = ref.watch(dailyMissionControllerProvider(date));

    return missionAsync.when(
      data: (mission) {
        if (mission == null) return const SizedBox.shrink();

        final completionPercent = mission.completionPercentage;
        final isAllCompleted = mission.isAllCompleted;

        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          elevation: 4,
          shadowColor: Colors.black26,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                colors: isAllCompleted
                    ? [Colors.green.shade700, Colors.green.shade400]
                    : [const Color(0xFF1A237E), const Color(0xFF3949AB)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isAllCompleted ? 'MISSION ACCOMPLISHED!' : 'DAILY MISSIONS',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const Gap(4),
                          Text(
                            'Level Up Your Day',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isAllCompleted ? Icons.emoji_events : Icons.rocket_launch,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ],
                  ),
                  const Gap(16),
                  LinearProgressIndicator(
                    value: completionPercent / 100,
                    backgroundColor: Colors.white24,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.amberAccent),
                    minHeight: 8,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  const Gap(8),
                  Text(
                    '$completionPercent% Completed',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  const Gap(16),
                  ...mission.items.asMap().entries.map((entry) {
                    final index = entry.key;
                    final item = entry.value;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: InkWell(
                        onTap: () {
                          ref.read(dailyMissionControllerProvider(date).notifier).toggleItem(index);
                        },
                        child: Row(
                          children: [
                            Icon(
                              item.isCompleted ? Icons.check_box : Icons.check_box_outline_blank,
                              color: item.isCompleted ? Colors.amberAccent : Colors.white54,
                            ),
                            const Gap(12),
                            Expanded(
                              child: Text(
                                item.title,
                                style: TextStyle(
                                  color: Colors.white,
                                  decoration: item.isCompleted ? TextDecoration.lineThrough : null,
                                  decorationColor: Colors.white54,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.black26,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '+${item.xpReward} XP',
                                style: const TextStyle(color: Colors.amberAccent, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
        );
      },
      loading: () => const SizedBox(height: 100, child: Center(child: CircularProgressIndicator())),
      error: (err, stack) => const SizedBox.shrink(),
    );
  }
}
