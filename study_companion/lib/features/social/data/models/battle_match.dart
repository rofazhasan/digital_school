class BattleMatch {
  final String id;
  final String opponentName;
  final int myScore;
  final int opponentScore;
  final BattleStatus status;

  BattleMatch({
    required this.id,
    required this.opponentName,
    this.myScore = 0,
    this.opponentScore = 0,
    this.status = BattleStatus.searching,
  });

  BattleMatch copyWith({
    String? id,
    String? opponentName,
    int? myScore,
    int? opponentScore,
    BattleStatus? status,
  }) {
    return BattleMatch(
      id: id ?? this.id,
      opponentName: opponentName ?? this.opponentName,
      myScore: myScore ?? this.myScore,
      opponentScore: opponentScore ?? this.opponentScore,
      status: status ?? this.status,
    );
  }
}

enum BattleStatus {
  searching,
  playing,
  finished,
}
