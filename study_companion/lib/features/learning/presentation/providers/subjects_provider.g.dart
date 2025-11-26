// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'subjects_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$subjectsNotifierHash() => r'06632f3a092c7529ea9b69348c2d95ceaa1893e0';

/// See also [SubjectsNotifier].
@ProviderFor(SubjectsNotifier)
final subjectsNotifierProvider =
    AutoDisposeAsyncNotifierProvider<SubjectsNotifier, List<Subject>>.internal(
  SubjectsNotifier.new,
  name: r'subjectsNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$subjectsNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$SubjectsNotifier = AutoDisposeAsyncNotifier<List<Subject>>;
String _$chaptersNotifierHash() => r'28a2821bb5f04f8b03fa0180dab2b60cc52fa2a5';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

abstract class _$ChaptersNotifier
    extends BuildlessAutoDisposeAsyncNotifier<List<Chapter>> {
  late final int subjectId;

  FutureOr<List<Chapter>> build(
    int subjectId,
  );
}

/// See also [ChaptersNotifier].
@ProviderFor(ChaptersNotifier)
const chaptersNotifierProvider = ChaptersNotifierFamily();

/// See also [ChaptersNotifier].
class ChaptersNotifierFamily extends Family<AsyncValue<List<Chapter>>> {
  /// See also [ChaptersNotifier].
  const ChaptersNotifierFamily();

  /// See also [ChaptersNotifier].
  ChaptersNotifierProvider call(
    int subjectId,
  ) {
    return ChaptersNotifierProvider(
      subjectId,
    );
  }

  @override
  ChaptersNotifierProvider getProviderOverride(
    covariant ChaptersNotifierProvider provider,
  ) {
    return call(
      provider.subjectId,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'chaptersNotifierProvider';
}

/// See also [ChaptersNotifier].
class ChaptersNotifierProvider extends AutoDisposeAsyncNotifierProviderImpl<
    ChaptersNotifier, List<Chapter>> {
  /// See also [ChaptersNotifier].
  ChaptersNotifierProvider(
    int subjectId,
  ) : this._internal(
          () => ChaptersNotifier()..subjectId = subjectId,
          from: chaptersNotifierProvider,
          name: r'chaptersNotifierProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$chaptersNotifierHash,
          dependencies: ChaptersNotifierFamily._dependencies,
          allTransitiveDependencies:
              ChaptersNotifierFamily._allTransitiveDependencies,
          subjectId: subjectId,
        );

  ChaptersNotifierProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.subjectId,
  }) : super.internal();

  final int subjectId;

  @override
  FutureOr<List<Chapter>> runNotifierBuild(
    covariant ChaptersNotifier notifier,
  ) {
    return notifier.build(
      subjectId,
    );
  }

  @override
  Override overrideWith(ChaptersNotifier Function() create) {
    return ProviderOverride(
      origin: this,
      override: ChaptersNotifierProvider._internal(
        () => create()..subjectId = subjectId,
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        subjectId: subjectId,
      ),
    );
  }

  @override
  AutoDisposeAsyncNotifierProviderElement<ChaptersNotifier, List<Chapter>>
      createElement() {
    return _ChaptersNotifierProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is ChaptersNotifierProvider && other.subjectId == subjectId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, subjectId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin ChaptersNotifierRef
    on AutoDisposeAsyncNotifierProviderRef<List<Chapter>> {
  /// The parameter `subjectId` of this provider.
  int get subjectId;
}

class _ChaptersNotifierProviderElement
    extends AutoDisposeAsyncNotifierProviderElement<ChaptersNotifier,
        List<Chapter>> with ChaptersNotifierRef {
  _ChaptersNotifierProviderElement(super.provider);

  @override
  int get subjectId => (origin as ChaptersNotifierProvider).subjectId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
