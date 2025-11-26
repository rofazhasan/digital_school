import 'package:isar/isar.dart';

part 'chat_message.g.dart';

@collection
class ChatMessage {
  Id id = Isar.autoIncrement;

  @Enumerated(EnumType.name)
  late String role; // 'user', 'ai'

  late String content;

  late DateTime timestamp;
}
