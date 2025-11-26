import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'core/data/isar_service.dart';
import 'core/services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final isarService = IsarService();
  await isarService.init();

  final notificationService = NotificationService();
  await notificationService.init();
  
  runApp(
    ProviderScope(
      overrides: [
        isarServiceProvider.overrideWithValue(isarService),
        notificationServiceProvider.overrideWithValue(notificationService),
      ],
      child: const StudyCompanionApp(),
    ),
  );
}
