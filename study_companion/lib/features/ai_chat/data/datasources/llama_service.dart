import 'dart:async';
import 'package:llama_cpp_dart/llama_cpp_dart.dart';
import 'ai_service.dart';

class LlamaService implements AIService {
  Llama? _llama;
  bool _isLoaded = false;
  
  bool get isLoaded => _isLoaded;

  bool _useMock = false;

  Future<void> init(String modelPath) async {
    dispose();
    try {
      _llama = Llama(
        modelPath,
        ModelParams(),
        ContextParams()..nCtx = 2048..nBatch = 512,
      );
      _isLoaded = true;
      _useMock = false;
      print("LlamaService initialized with $modelPath");
    } catch (e) {
      print("Error initializing Llama: $e");
      _isLoaded = false;
      _useMock = true; // Fallback to mock if real AI fails (e.g. on Emulator)
    }
  }

  @override
  Stream<String> generateResponse(String prompt) async* {
    if (_useMock) {
      await Future.delayed(const Duration(milliseconds: 500));
      yield "This is a mock response (Emulator Mode). Real AI requires a physical device (ARM64). ";
      await Future.delayed(const Duration(milliseconds: 200));
      yield "Your stats are being tracked correctly, but local AI inference is disabled here.";
      return;
    }

    if (!_isLoaded || _llama == null) {
      throw Exception("AI Model not loaded");
    }

    try {
      // TinyLlama chat format
      final formattedPrompt = "<|system|>\nYou are a helpful study assistant.</s>\n<|user|>\n$prompt</s>\n<|assistant|>\n";
      
      _llama!.setPrompt(formattedPrompt);
      
      while (true) {
        final (text, isDone) = _llama!.getNext();
        yield text;
        if (isDone) break;
        await Future.delayed(Duration.zero);
      }
    } catch (e) {
      yield "Error generating response: $e";
    }
  }

  void dispose() {
    if (_llama != null) {
      _llama!.dispose();
      _llama = null;
    }
    _isLoaded = false;
  }
}
