// import 'package:llama_cpp_dart/llama_cpp_dart.dart';

class EmbeddingService {
  // Llama? _llama;
  bool _isLoaded = false;
  
  bool get isLoaded => _isLoaded;

  Future<void> init(String modelPath) async {
    await Future.delayed(const Duration(seconds: 1));
    _isLoaded = true;
    print("Mock EmbeddingService initialized with $modelPath");
  }

  Future<List<double>> getEmbedding(String text) async {
    if (!_isLoaded) {
      throw Exception("Embedding model not loaded");
    }
    // Return a dummy embedding vector of size 384 (common for MiniLM)
    return List.generate(384, (index) => 0.0);
  }

  void dispose() {
    _isLoaded = false;
  }
}
