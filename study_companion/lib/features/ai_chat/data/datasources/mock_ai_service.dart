import 'dart:async';
import 'ai_service.dart';

class MockAIService implements AIService {
  @override
  Stream<String> generateResponse(String prompt) async* {
    await Future.delayed(const Duration(milliseconds: 500));
    yield "I am a mock AI. ";
    await Future.delayed(const Duration(milliseconds: 200));
    yield "I received your message: ";
    await Future.delayed(const Duration(milliseconds: 200));
    yield "\"$prompt\"";
    await Future.delayed(const Duration(milliseconds: 200));
    yield "\n\nI am running offline (simulated).";
  }
}
