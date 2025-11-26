import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../data/models/subject.dart';

part 'subject_provider.g.dart';

@riverpod
class Subjects extends _$Subjects {
  @override
  Future<List<Subject>> build() async {
    // Return some default subjects for now since we don't have a full subject management UI yet
    return [
      Subject()..name = 'Math',
      Subject()..name = 'Physics',
      Subject()..name = 'Chemistry',
      Subject()..name = 'Biology',
      Subject()..name = 'History',
      Subject()..name = 'English',
      Subject()..name = 'Computer Science',
    ];
  }
}
