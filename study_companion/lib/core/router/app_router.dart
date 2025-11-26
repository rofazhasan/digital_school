import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../features/focus_mode/presentation/screens/focus_screen.dart';
import '../../features/focus_mode/presentation/screens/focus_screen.dart';
import '../../features/routine/presentation/screens/routine_screen.dart';
import '../../features/analytics/presentation/screens/analytics_screen.dart';
import '../../features/learning/presentation/screens/learning_screen.dart';
import '../../features/learning/presentation/screens/notes_list_screen.dart';
import '../../features/ai_chat/presentation/screens/chat_screen.dart';
import '../../features/learning/presentation/screens/quiz_setup_screen.dart';
import '../../features/learning/presentation/screens/quiz_screen.dart';
import '../../features/learning/presentation/screens/summary_screen.dart';
import '../../features/learning/presentation/screens/subjects_screen.dart';
import '../../features/learning/presentation/screens/subject_detail_screen.dart';
import '../../features/learning/presentation/screens/exam_setup_screen.dart';
import '../../features/learning/presentation/screens/exam_screen.dart';
import '../../features/learning/presentation/screens/flashcard_review_screen.dart';
import '../../features/learning/data/models/subject.dart';
import '../../features/learning/data/models/quiz_question.dart';
import '../../features/social/presentation/screens/social_screen.dart';
import '../../features/social/presentation/screens/group_chat_screen.dart';
import '../../features/social/presentation/screens/leaderboard_screen.dart';
import '../../features/social/presentation/screens/battle_lobby_screen.dart';
import '../../features/social/presentation/screens/battle_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../features/settings/presentation/screens/sync_settings_screen.dart';
import '../../features/settings/presentation/screens/model_download_screen.dart';
import '../widgets/scaffold_with_nav_bar.dart';

part 'app_router.g.dart';

@riverpod
GoRouter router(RouterRef ref) {
  final rootNavigatorKey = GlobalKey<NavigatorState>();
  final focusNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'focus');
  final routineNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'routine');
  final learningNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'learning');
  final socialNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'social');
  final settingsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'settings');

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/focus',
    routes: [
      // Model Download Screen (outside nav bar)
      GoRoute(
        path: '/download-models',
        builder: (context, state) => const ModelDownloadScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          // Focus Branch
          StatefulShellBranch(
            navigatorKey: focusNavigatorKey,
            routes: [
              GoRoute(
                path: '/focus',
                builder: (context, state) => const FocusScreen(),
                routes: [

                  GoRoute(
                    path: 'analytics',
                    builder: (context, state) => const AnalyticsScreen(),
                  ),
                ],
              ),
            ],
          ),
          // Routine Branch
          StatefulShellBranch(
            navigatorKey: routineNavigatorKey,
            routes: [
              GoRoute(
                path: '/routine',
                builder: (context, state) => const RoutineScreen(),
              ),
            ],
          ),
          // Learning Branch
          StatefulShellBranch(
            navigatorKey: learningNavigatorKey,
            routes: [
              GoRoute(
                path: '/learning',
                builder: (context, state) => const LearningScreen(),
                routes: [
                  GoRoute(
                    path: 'notes',
                    builder: (context, state) => const NotesListScreen(),
                  ),
                  GoRoute(
                    path: 'chat',
                    builder: (context, state) => const ChatScreen(),
                  ),
                  GoRoute(
                    path: 'quiz/setup',
                    builder: (context, state) => const QuizSetupScreen(),
                  ),
                  GoRoute(
                    path: 'quiz/play',
                    builder: (context, state) => const QuizScreen(),
                  ),
                  GoRoute(
                    path: 'summary',
                    builder: (context, state) => const SummaryScreen(),
                  ),
                  GoRoute(
                    path: 'subjects',
                    builder: (context, state) => const SubjectsScreen(),
                    routes: [
                      GoRoute(
                        path: ':id',
                        builder: (context, state) {
                          final subject = state.extra as Subject;
                          return SubjectDetailScreen(subject: subject);
                        },
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'exam/setup',
                    builder: (context, state) => const ExamSetupScreen(),
                  ),
                  GoRoute(
                    path: 'exam/play',
                    builder: (context, state) {
                      final extra = state.extra as Map<String, dynamic>;
                      return ExamScreen(
                        subjectName: extra['subject'] as String,
                        questions: extra['questions'] as List<QuizQuestion>,
                      );
                    },
                  ),
                  GoRoute(
                    path: 'flashcards/review',
                    builder: (context, state) => const FlashcardReviewScreen(),
                  ),
                ],
              ),
            ],
          ),
          // Social Branch
          StatefulShellBranch(
            navigatorKey: socialNavigatorKey,
            routes: [
              GoRoute(
                path: '/social',
                builder: (context, state) => const SocialScreen(),
              ),
            ],
          ),
          // Settings Branch
          StatefulShellBranch(
            navigatorKey: settingsNavigatorKey,
            routes: [
              GoRoute(
                path: '/settings',
                builder: (context, state) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
