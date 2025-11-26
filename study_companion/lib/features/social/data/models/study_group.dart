class StudyGroup {
  final String id;
  final String name;
  final String topic;
  final int memberCount;
  final DateTime createdAt;

  StudyGroup({
    required this.id,
    required this.name,
    required this.topic,
    required this.memberCount,
    required this.createdAt,
  });
}

class GroupMessage {
  final String id;
  final String senderName;
  final String content;
  final DateTime timestamp;
  final bool isMe;

  GroupMessage({
    required this.id,
    required this.senderName,
    required this.content,
    required this.timestamp,
    required this.isMe,
  });
}
