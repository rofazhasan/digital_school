// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chat_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$aiServiceHash() => r'4bc1ada0b92a4692346ff969ea7ed24501c6e548';

/// See also [aiService].
@ProviderFor(aiService)
final aiServiceProvider = AutoDisposeProvider<AIService>.internal(
  aiService,
  name: r'aiServiceProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$aiServiceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef AiServiceRef = AutoDisposeProviderRef<AIService>;
String _$embeddingServiceHash() => r'd431387fa3668295ed241adcc3c5d033e1315205';

/// See also [embeddingService].
@ProviderFor(embeddingService)
final embeddingServiceProvider = AutoDisposeProvider<EmbeddingService>.internal(
  embeddingService,
  name: r'embeddingServiceProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$embeddingServiceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef EmbeddingServiceRef = AutoDisposeProviderRef<EmbeddingService>;
String _$modelPathNotifierHash() => r'1bf6ce05c13d0d55d2927f45378dae1cfac35730';

/// See also [ModelPathNotifier].
@ProviderFor(ModelPathNotifier)
final modelPathNotifierProvider =
    AutoDisposeAsyncNotifierProvider<ModelPathNotifier, String?>.internal(
  ModelPathNotifier.new,
  name: r'modelPathNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$modelPathNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ModelPathNotifier = AutoDisposeAsyncNotifier<String?>;
String _$embeddingPathNotifierHash() =>
    r'5ba03fd345ab1fba2f64014ed704c14446e108df';

/// See also [EmbeddingPathNotifier].
@ProviderFor(EmbeddingPathNotifier)
final embeddingPathNotifierProvider =
    AutoDisposeAsyncNotifierProvider<EmbeddingPathNotifier, String?>.internal(
  EmbeddingPathNotifier.new,
  name: r'embeddingPathNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$embeddingPathNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$EmbeddingPathNotifier = AutoDisposeAsyncNotifier<String?>;
String _$chatNotifierHash() => r'585ea1b5623674e02ba776906576270b19cac0cf';

/// See also [ChatNotifier].
@ProviderFor(ChatNotifier)
final chatNotifierProvider =
    AutoDisposeAsyncNotifierProvider<ChatNotifier, List<ChatMessage>>.internal(
  ChatNotifier.new,
  name: r'chatNotifierProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$chatNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ChatNotifier = AutoDisposeAsyncNotifier<List<ChatMessage>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
