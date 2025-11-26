import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/data/isar_service.dart';
import '../../data/datasources/ai_service.dart';
import '../../data/datasources/mock_ai_service.dart';
import '../../data/datasources/llama_service.dart';
import '../../data/datasources/embedding_service.dart';
import '../../data/models/chat_message.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../../../../core/services/model_download_service.dart';

part 'chat_provider.g.dart';

@riverpod
class ModelPathNotifier extends _$ModelPathNotifier {
  @override
  Future<String?> build() async {
    // Check for downloaded model
    final downloadedPath = await _getDownloadedModelPath('chat_model.gguf');
    if (downloadedPath != null) {
      return downloadedPath;
    }
    
    // Fall back to user-selected path (legacy)
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('model_path');
  }
  
  Future<String?> _getDownloadedModelPath(String filename) async {
    // Check 1: App's models directory
    try {
      final appDir = await getApplicationDocumentsDirectory();
      final modelPath = '${appDir.path}/models/$filename';
      final file = File(modelPath);
      
      if (await file.exists()) {
        return modelPath;
      }
    } catch (e) {
      // Continue to next location
    }
    
    // Check 2: Emulator's Download folder (for manual downloads)
    try {
      final downloadPath = '/sdcard/Download/$filename';
      final file = File(downloadPath);
      
      if (await file.exists()) {
        return downloadPath;
      }
    } catch (e) {
      // Continue to next location
    }
    
    // Check 3: External storage
    try {
      final externalPath = '/storage/emulated/0/Download/$filename';
      final file = File(externalPath);
      
      if (await file.exists()) {
        return externalPath;
      }
    } catch (e) {
      // Model not found in any location
    }
    
    return null;
  }

  Future<void> setPath(String path) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('model_path', path);
    state = AsyncValue.data(path);
  }
}

@riverpod
class EmbeddingPathNotifier extends _$EmbeddingPathNotifier {
  @override
  Future<String?> build() async {
    // Check for downloaded embedding model
    final downloadedPath = await _getDownloadedModelPath('embedding_model.gguf');
    if (downloadedPath != null) {
      return downloadedPath;
    }
    
    // Fall back to user-selected path (legacy)
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('embedding_model_path');
  }
  
  Future<String?> _getDownloadedModelPath(String filename) async {
    // Check 1: App's models directory
    try {
      final appDir = await getApplicationDocumentsDirectory();
      final modelPath = '${appDir.path}/models/$filename';
      final file = File(modelPath);
      
      if (await file.exists()) {
        return modelPath;
      }
    } catch (e) {
      // Continue to next location
    }
    
    // Check 2: Emulator's Download folder
    try {
      final downloadPath = '/sdcard/Download/$filename';
      final file = File(downloadPath);
      
      if (await file.exists()) {
        return downloadPath;
      }
    } catch (e) {
      // Continue to next location
    }
    
    // Check 3: External storage
    try {
      final externalPath = '/storage/emulated/0/Download/$filename';
      final file = File(externalPath);
      
      if (await file.exists()) {
        return externalPath;
      }
    } catch (e) {
      // Model not found
    }
    
    return null;
  }

  Future<void> setPath(String path) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('embedding_model_path', path);
    state = AsyncValue.data(path);
  }
}

final llamaServiceSingleton = LlamaService();
final embeddingServiceSingleton = EmbeddingService();

@riverpod
AIService aiService(AiServiceRef ref) {
  final modelPathAsync = ref.watch(modelPathNotifierProvider);
  
  return modelPathAsync.when(
    data: (path) {
      if (path != null && path.isNotEmpty) {
        llamaServiceSingleton.init(path);
        return llamaServiceSingleton;
      }
      return MockAIService();
    },
    loading: () => MockAIService(),
    error: (_, __) => MockAIService(),
  );
}

@riverpod
EmbeddingService embeddingService(EmbeddingServiceRef ref) {
  final pathAsync = ref.watch(embeddingPathNotifierProvider);
  
  return pathAsync.when(
    data: (path) {
      if (path != null && path.isNotEmpty) {
        // Initialize if not already loaded or path changed
        // For simplicity, we just call init (it handles disposal)
        embeddingServiceSingleton.init(path); 
      }
      return embeddingServiceSingleton;
    },
    loading: () => embeddingServiceSingleton,
    error: (_, __) => embeddingServiceSingleton,
  );
}

@riverpod
class ChatNotifier extends _$ChatNotifier {
  @override
  Future<List<ChatMessage>> build() async {
    return ref.read(isarServiceProvider).getMessages();
  }

  Future<void> sendMessage(String content) async {
    final isar = ref.read(isarServiceProvider);
    
    // 1. Save User Message
    final userMsg = ChatMessage()
      ..role = 'user'
      ..content = content
      ..timestamp = DateTime.now();
    await isar.saveMessage(userMsg);
    
    // Optimistic update
    state = AsyncValue.data([...state.value ?? [], userMsg]);

    // 2. Generate AI Response
    final aiService = ref.read(aiServiceProvider);
    final aiMsg = ChatMessage()
      ..role = 'ai'
      ..content = '' // Start empty
      ..timestamp = DateTime.now();
    
    // Add placeholder AI message to UI
    final List<ChatMessage> currentMessages = [...state.value ?? [], aiMsg];
    state = AsyncValue.data(currentMessages);

    final stream = aiService.generateResponse(content);
    
    await for (final chunk in stream) {
      aiMsg.content += chunk;
      // Force UI update
      state = AsyncValue.data([...currentMessages]); 
    }

    // 3. Save AI Message
    await isar.saveMessage(aiMsg);
  }

  Future<void> clearChat() async {
    await ref.read(isarServiceProvider).clearChat();
    state = const AsyncValue.data([]);
  }
}
