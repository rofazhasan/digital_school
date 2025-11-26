import 'dart:math';
import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

class SmartBreakTip extends StatelessWidget {
  const SmartBreakTip({super.key});

  static const _tips = [
    "Drink a glass of water to stay hydrated.",
    "Look at something 20 feet away for 20 seconds.",
    "Do a quick stretch: reach for the sky!",
    "Take 5 deep breaths.",
    "Walk around the room for a minute.",
    "Rest your eyes: close them for 30 seconds.",
    "Do a few neck rolls to release tension.",
  ];

  @override
  Widget build(BuildContext context) {
    final tip = _tips[Random().nextInt(_tips.length)];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.green.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.spa, color: Colors.green),
          const Gap(16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Smart Break Tip',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                ),
                const Gap(4),
                Text(tip),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
