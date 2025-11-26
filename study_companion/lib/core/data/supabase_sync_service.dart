import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../features/focus_mode/data/models/study_session.dart';
import '../../features/learning/data/models/note.dart';

class SupabaseSyncService {
  static const String _kUrlKey = 'supabase_url';
  static const String _kAnonKey = 'supabase_anon_key';

  bool _isInitialized = false;
  SupabaseClient? _client;

  bool get isInitialized => _isInitialized;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final url = prefs.getString(_kUrlKey);
    final key = prefs.getString(_kAnonKey);

    if (url != null && key != null && url.isNotEmpty && key.isNotEmpty) {
      try {
        await Supabase.initialize(url: url, anonKey: key);
        _client = Supabase.instance.client;
        _isInitialized = true;
      } catch (e) {
        print('Error initializing Supabase: $e');
        _isInitialized = false;
      }
    }
  }

  Future<void> saveCredentials(String url, String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kUrlKey, url);
    await prefs.setString(_kAnonKey, key);
    await init();
  }

  Future<void> clearCredentials() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kUrlKey);
    await prefs.remove(_kAnonKey);
    _isInitialized = false;
    _client = null;
    // Note: Supabase.dispose() is not available/needed in recent versions usually, 
    // but re-init might require app restart in some cases. 
    // For now we just mark as uninitialized.
  }

  Future<void> syncSessions(List<StudySession> sessions) async {
    if (!_isInitialized || _client == null) return;

    try {
      // This assumes a 'study_sessions' table exists in Supabase
      // For a real app, we'd need to handle upserts and schema matching.
      // This is a simplified example.
      final data = sessions.map((s) => {
        'start_time': s.startTime.toIso8601String(),
        'duration_seconds': s.durationSeconds,
        'phase': s.phase.toString(),
      }).toList();

      await _client!.from('study_sessions').upsert(data);
    } catch (e) {
      print('Error syncing sessions: $e');
      rethrow;
    }
  }

  Future<void> syncNotes(List<Note> notes) async {
    if (!_isInitialized || _client == null) return;

    try {
      final data = notes.map((n) => {
        'title': n.title,
        'content': n.content,
        'created_at': n.createdAt.toIso8601String(),
      }).toList();

      await _client!.from('notes').upsert(data);
    } catch (e) {
      print('Error syncing notes: $e');
      rethrow;
    }
  }
}
