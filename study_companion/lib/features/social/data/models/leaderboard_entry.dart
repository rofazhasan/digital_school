class LeaderboardEntry {
  final String userId;
  final String username;
  final String avatarUrl; // Optional, can use Initials
  final int weeklyHours;
  final int streak;
  final int rank;

  LeaderboardEntry({
    required this.userId,
    required this.username,
    this.avatarUrl = '',
    required this.weeklyHours,
    required this.streak,
    required this.rank,
  });
}
