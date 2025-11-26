import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../data/models/study_group.dart';
import '../../data/models/leaderboard_entry.dart';
import '../../data/datasources/mock_social_service.dart';

part 'social_provider.g.dart';

final mockSocialService = MockSocialService();

@riverpod
class SocialNotifier extends _$SocialNotifier {
  @override
  Future<List<StudyGroup>> build() async {
    return mockSocialService.getGroups();
  }

  Future<void> createGroup(String name, String topic) async {
    state = const AsyncValue.loading();
    await mockSocialService.createGroup(name, topic);
    state = await AsyncValue.guard(() => mockSocialService.getGroups());
  }

  Future<void> joinGroup(String code) async {
    state = const AsyncValue.loading();
    await mockSocialService.joinGroup(code);
    state = await AsyncValue.guard(() => mockSocialService.getGroups());
  }
}

@riverpod
Stream<List<GroupMessage>> groupChat(GroupChatRef ref, String groupId) {
  return mockSocialService.getMessages(groupId);
}

@riverpod
Future<List<LeaderboardEntry>> leaderboard(LeaderboardRef ref) {
  return mockSocialService.getLeaderboard();
}
