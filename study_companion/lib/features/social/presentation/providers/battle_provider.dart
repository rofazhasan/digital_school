import 'dart:async';
import 'dart:math';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../data/models/battle_match.dart';
import '../../data/datasources/mock_social_service.dart';
import '../../presentation/providers/social_provider.dart';

part 'battle_provider.g.dart';

@riverpod
class BattleNotifier extends _$BattleNotifier {
  Timer? _opponentTimer;
  final _random = Random();

  @override
  BattleMatch? build() {
    return null;
  }

  Future<void> findMatch() async {
    state = BattleMatch(id: '', opponentName: '', status: BattleStatus.searching);
    final match = await mockSocialService.findMatch();
    state = match;
    _startOpponentSimulation();
  }

  void _startOpponentSimulation() {
    _opponentTimer?.cancel();
    _opponentTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (state == null || state!.status != BattleStatus.playing) {
        timer.cancel();
        return;
      }

      // Opponent has 60% chance to answer correctly
      if (_random.nextDouble() > 0.4) {
        state = state!.copyWith(opponentScore: state!.opponentScore + 1);
      }
    });
  }

  void incrementMyScore() {
    if (state != null) {
      state = state!.copyWith(myScore: state!.myScore + 1);
    }
  }

  void endBattle() {
    _opponentTimer?.cancel();
    if (state != null) {
      state = state!.copyWith(status: BattleStatus.finished);
    }
  }
}
