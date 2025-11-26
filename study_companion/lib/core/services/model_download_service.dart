import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'model_download_service.g.dart';

@Riverpod(keepAlive: true)
ModelDownloadService modelDownloadService(ModelDownloadServiceRef ref) {
  return ModelDownloadService();
}

class ModelDownloadService {
  final Dio _dio = Dio();
  
  // TODO: Replace with your actual model hosting URLs
  // You can use GitHub Releases, Firebase Storage, or your own server
  static const String chatModelUrl = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
  static const String embeddingModelUrl = 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx';
  
  Future<String> getModelsDirectory() async {
    final appDir = await getApplicationDocumentsDirectory();
    final modelsDir = Directory('${appDir.path}/models');
    if (!await modelsDir.exists()) {
      await modelsDir.create(recursive: true);
    }
    return modelsDir.path;
  }
  
  Future<bool> isChatModelDownloaded() async {
    final modelsDir = await getModelsDirectory();
    final file = File('$modelsDir/chat_model.gguf');
    return await file.exists();
  }
  
  Future<bool> isEmbeddingModelDownloaded() async {
    final modelsDir = await getModelsDirectory();
    final file = File('$modelsDir/embedding_model.gguf');
    return await file.exists();
  }
  
  Future<String?> getChatModelPath() async {
    if (await isChatModelDownloaded()) {
      final modelsDir = await getModelsDirectory();
      return '$modelsDir/chat_model.gguf';
    }
    return null;
  }
  
  Future<String?> getEmbeddingModelPath() async {
    if (await isEmbeddingModelDownloaded()) {
      final modelsDir = await getModelsDirectory();
      return '$modelsDir/embedding_model.gguf';
    }
    return null;
  }
  
  Future<void> downloadChatModel({
    required Function(double) onProgress,
    required Function(String) onComplete,
    required Function(String) onError,
  }) async {
    try {
      final modelsDir = await getModelsDirectory();
      final savePath = '$modelsDir/chat_model.gguf';
      
      await _dio.download(
        chatModelUrl,
        savePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            final progress = received / total;
            onProgress(progress);
          }
        },
      );
      
      onComplete(savePath);
    } catch (e) {
      onError(e.toString());
    }
  }
  
  Future<void> downloadEmbeddingModel({
    required Function(double) onProgress,
    required Function(String) onComplete,
    required Function(String) onError,
  }) async {
    try {
      final modelsDir = await getModelsDirectory();
      final savePath = '$modelsDir/embedding_model.gguf';
      
      await _dio.download(
        embeddingModelUrl,
        savePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            final progress = received / total;
            onProgress(progress);
          }
        },
      );
      
      onComplete(savePath);
    } catch (e) {
      onError(e.toString());
    }
  }
  
  Future<void> deleteModels() async {
    final modelsDir = await getModelsDirectory();
    final chatModel = File('$modelsDir/chat_model.gguf');
    final embeddingModel = File('$modelsDir/embedding_model.gguf');
    
    if (await chatModel.exists()) {
      await chatModel.delete();
    }
    if (await embeddingModel.exists()) {
      await embeddingModel.delete();
    }
  }
  
  Future<int> getModelsSizeInBytes() async {
    int totalSize = 0;
    final modelsDir = await getModelsDirectory();
    
    final chatModel = File('$modelsDir/chat_model.gguf');
    final embeddingModel = File('$modelsDir/embedding_model.gguf');
    
    if (await chatModel.exists()) {
      totalSize += await chatModel.length();
    }
    if (await embeddingModel.exists()) {
      totalSize += await embeddingModel.length();
    }
    
    return totalSize;
  }
  
  String formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }
}
