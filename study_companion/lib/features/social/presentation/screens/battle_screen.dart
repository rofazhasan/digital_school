import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import '../providers/battle_provider.dart';
import '../../data/models/battle_match.dart';

class BattleScreen extends ConsumerStatefulWidget {
  const BattleScreen({super.key});

  @override
  ConsumerState<BattleScreen> createState() => _BattleScreenState();
}

class _BattleScreenState extends ConsumerState<BattleScreen> {
  // Mock Questions
  final List<Map<String, dynamic>> _questions = [
    {
      'q': 'What is the speed of light?',
      'options': ['3x10^8 m/s', '3x10^6 m/s', '300 km/h', 'Infinite'],
      'a': 0
    },
    {
      'q': 'Integral of x dx?',
      'options': ['x^2', 'x^2/2', '2x', 'ln(x)'],
      'a': 1
    },
    {
      'q': 'Capital of France?',
      'options': ['London', 'Berlin', 'Madrid', 'Paris'],
      'a': 3
    },
    {
      'q': 'Powerhouse of the cell?',
      'options': ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi'],
      'a': 1
    },
    {
      'q': 'F = ma is which law?',
      'options': ['1st', '2nd', '3rd', '4th'],
      'a': 1
    },
  ];

  int _currentQuestionIndex = 0;
  bool _answered = false;

  void _answer(int index) {
    if (_answered) return;
    
    setState(() {
      _answered = true;
    });

    if (index == _questions[_currentQuestionIndex]['a']) {
      ref.read(battleNotifierProvider.notifier).incrementMyScore();
    }

    Future.delayed(const Duration(seconds: 1), () {
      if (_currentQuestionIndex < _questions.length - 1) {
        setState(() {
          _currentQuestionIndex++;
          _answered = false;
        });
      } else {
        _finishBattle();
      }
    });
  }

  void _finishBattle() {
    ref.read(battleNotifierProvider.notifier).endBattle();
    final match = ref.read(battleNotifierProvider);
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text(match!.myScore > match.opponentScore
            ? 'You Won! 🏆'
            : match.myScore < match.opponentScore
                ? 'You Lost! 😢'
                : 'Draw! 🤝'),
        content: Text('Score: ${match.myScore} - ${match.opponentScore}'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.pop(); // Back to social
            },
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final match = ref.watch(battleNotifierProvider);
    if (match == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final question = _questions[_currentQuestionIndex];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Battle Mode'),
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Scoreboard
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _ScoreCard(name: 'You', score: match.myScore, color: Colors.blue),
                const Text('VS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24)),
                _ScoreCard(name: match.opponentName, score: match.opponentScore, color: Colors.red),
              ],
            ),
            const Gap(32),
            // Question
            Text(
              'Question ${_currentQuestionIndex + 1}/${_questions.length}',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const Gap(16),
            Text(
              question['q'],
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const Gap(32),
            // Options
            ...List.generate(4, (index) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => _answer(index),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                      backgroundColor: _answered && index == question['a']
                          ? Colors.green.withOpacity(0.2)
                          : null,
                    ),
                    child: Text(question['options'][index]),
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _ScoreCard extends StatelessWidget {
  final String name;
  final int score;
  final Color color;

  const _ScoreCard({required this.name, required this.score, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(name, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
        const Gap(8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color),
          ),
          child: Text(
            score.toString(),
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: color),
          ),
        ),
      ],
    );
  }
}
