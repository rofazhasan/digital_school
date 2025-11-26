import 'dart:async';
import 'package:uuid/uuid.dart';
import '../models/study_group.dart';
import '../models/leaderboard_entry.dart';
import '../models/battle_match.dart';

class MockSocialService {
  final _uuid = const Uuid();
  
  // In-memory storage
  final List<StudyGroup> _groups = [
    StudyGroup(
      id: '1',
      name: 'Physics 101',
      topic: 'Mechanics',
      memberCount: 12,
      createdAt: DateTime.now().subtract(const Duration(days: 5)),
    ),
    StudyGroup(
      id: '2',
      name: 'Calculus Club',
      topic: 'Integration',
      memberCount: 8,
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
  ];

  final Map<String, List<GroupMessage>> _messages = {
    '1': [
      GroupMessage(id: 'm1', senderName: 'Alice', content: 'Has anyone solved Q5?', timestamp: DateTime.now().subtract(const Duration(minutes: 10)), isMe: false),
      GroupMessage(id: 'm2', senderName: 'Bob', content: 'Yes, use Newton\'s second law.', timestamp: DateTime.now().subtract(const Duration(minutes: 8)), isMe: false),
    ],
    '2': [],
  };

  final _messageControllers = <String, StreamController<List<GroupMessage>>>{};

  Future<List<StudyGroup>> getGroups() async {
    await Future.delayed(const Duration(milliseconds: 500)); // Simulate network
    return _groups;
  }

  Future<void> createGroup(String name, String topic) async {
    await Future.delayed(const Duration(seconds: 1));
    final newGroup = StudyGroup(
      id: _uuid.v4(),
      name: name,
      topic: topic,
      memberCount: 1,
      createdAt: DateTime.now(),
    );
    _groups.add(newGroup);
    _messages[newGroup.id] = [];
  }

  Future<void> joinGroup(String code) async {
    await Future.delayed(const Duration(seconds: 1));
    // Mock joining logic (just adds a dummy group if code is valid-ish)
    if (code.isNotEmpty) {
      final newGroup = StudyGroup(
        id: _uuid.v4(),
        name: 'Joined Group $code',
        topic: 'General',
        memberCount: 5,
        createdAt: DateTime.now(),
      );
      _groups.add(newGroup);
      _messages[newGroup.id] = [];
    }
  }

  Stream<List<GroupMessage>> getMessages(String groupId) {
    if (!_messageControllers.containsKey(groupId)) {
      _messageControllers[groupId] = StreamController<List<GroupMessage>>.broadcast();
      // Push initial messages
      _messageControllers[groupId]!.add(_messages[groupId] ?? []);
    }
    return _messageControllers[groupId]!.stream;
  }

  Future<void> sendMessage(String groupId, String content) async {
    final msg = GroupMessage(
      id: _uuid.v4(),
      senderName: 'Me',
      content: content,
      timestamp: DateTime.now(),
      isMe: true,
    );
    
    _messages[groupId]?.add(msg);
    _messageControllers[groupId]?.add(_messages[groupId]!);

    // Simulate reply
    Future.delayed(const Duration(seconds: 2), () {
      final reply = GroupMessage(
        id: _uuid.v4(),
        senderName: 'Bot',
        content: 'Interesting point!',
        timestamp: DateTime.now(),
        isMe: false,
      );
      _messages[groupId]?.add(reply);
      _messageControllers[groupId]?.add(_messages[groupId]!);
    });
  }

  Future<List<LeaderboardEntry>> getLeaderboard() async {
    await Future.delayed(const Duration(milliseconds: 800));
    return [
      LeaderboardEntry(userId: 'u1', username: 'Alice', weeklyHours: 42, streak: 15, rank: 1),
      LeaderboardEntry(userId: 'u2', username: 'Bob', weeklyHours: 38, streak: 12, rank: 2),
      LeaderboardEntry(userId: 'u3', username: 'Charlie', weeklyHours: 35, streak: 8, rank: 3),
      LeaderboardEntry(userId: 'me', username: 'You', weeklyHours: 20, streak: 5, rank: 12),
      LeaderboardEntry(userId: 'u4', username: 'Dave', weeklyHours: 15, streak: 2, rank: 25),
    ];
  }

  // Battle Mode
  Future<BattleMatch> findMatch() async {
    await Future.delayed(const Duration(seconds: 3)); // Simulate searching
    return BattleMatch(
      id: _uuid.v4(),
      opponentName: 'Opponent_${_uuid.v4().substring(0, 4)}',
      status: BattleStatus.playing,
    );
  }
}
