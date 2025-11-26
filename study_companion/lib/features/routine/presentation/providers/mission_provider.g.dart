// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'mission_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$dailyMissionControllerHash() =>
    r'c52cfb36a32df3944e3deaad6fe4fde6eb1b6265';

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

abstract class _$DailyMissionController
    extends BuildlessAutoDisposeAsyncNotifier<DailyMission?> {
  late final DateTime date;

  FutureOr<DailyMission?> build(
    DateTime date,
  );
}

/// See also [DailyMissionController].
@ProviderFor(DailyMissionController)
const dailyMissionControllerProvider = DailyMissionControllerFamily();

/// See also [DailyMissionController].
class DailyMissionControllerFamily extends Family<AsyncValue<DailyMission?>> {
  /// See also [DailyMissionController].
  const DailyMissionControllerFamily();

  /// See also [DailyMissionController].
  DailyMissionControllerProvider call(
    DateTime date,
  ) {
    return DailyMissionControllerProvider(
      date,
    );
  }

  @override
  DailyMissionControllerProvider getProviderOverride(
    covariant DailyMissionControllerProvider provider,
  ) {
    return call(
      provider.date,
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
  String? get name => r'dailyMissionControllerProvider';
}

/// See also [DailyMissionController].
class DailyMissionControllerProvider
    extends AutoDisposeAsyncNotifierProviderImpl<DailyMissionController,
        DailyMission?> {
  /// See also [DailyMissionController].
  DailyMissionControllerProvider(
    DateTime date,
  ) : this._internal(
          () => DailyMissionController()..date = date,
          from: dailyMissionControllerProvider,
          name: r'dailyMissionControllerProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$dailyMissionControllerHash,
          dependencies: DailyMissionControllerFamily._dependencies,
          allTransitiveDependencies:
              DailyMissionControllerFamily._allTransitiveDependencies,
          date: date,
        );

  DailyMissionControllerProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.date,
  }) : super.internal();

  final DateTime date;

  @override
  FutureOr<DailyMission?> runNotifierBuild(
    covariant DailyMissionController notifier,
  ) {
    return notifier.build(
      date,
    );
  }

  @override
  Override overrideWith(DailyMissionController Function() create) {
    return ProviderOverride(
      origin: this,
      override: DailyMissionControllerProvider._internal(
        () => create()..date = date,
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        date: date,
      ),
    );
  }

  @override
  AutoDisposeAsyncNotifierProviderElement<DailyMissionController, DailyMission?>
      createElement() {
    return _DailyMissionControllerProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is DailyMissionControllerProvider && other.date == date;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, date.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin DailyMissionControllerRef
    on AutoDisposeAsyncNotifierProviderRef<DailyMission?> {
  /// The parameter `date` of this provider.
  DateTime get date;
}

class _DailyMissionControllerProviderElement
    extends AutoDisposeAsyncNotifierProviderElement<DailyMissionController,
        DailyMission?> with DailyMissionControllerRef {
  _DailyMissionControllerProviderElement(super.provider);

  @override
  DateTime get date => (origin as DailyMissionControllerProvider).date;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
