// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'social_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$groupChatHash() => r'f611d71a6c32828d97cb961d102f4e1af9948dac';

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

/// See also [groupChat].
@ProviderFor(groupChat)
const groupChatProvider = GroupChatFamily();

/// See also [groupChat].
class GroupChatFamily extends Family<AsyncValue<List<GroupMessage>>> {
  /// See also [groupChat].
  const GroupChatFamily();

  /// See also [groupChat].
  GroupChatProvider call(
    String groupId,
  ) {
    return GroupChatProvider(
      groupId,
    );
  }

  @override
  GroupChatProvider getProviderOverride(
    covariant GroupChatProvider provider,
  ) {
    return call(
      provider.groupId,
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
  String? get name => r'groupChatProvider';
}

/// See also [groupChat].
class GroupChatProvider extends AutoDisposeStreamProvider<List<GroupMessage>> {
  /// See also [groupChat].
  GroupChatProvider(
    String groupId,
  ) : this._internal(
          (ref) => groupChat(
            ref as GroupChatRef,
            groupId,
          ),
          from: groupChatProvider,
          name: r'groupChatProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$groupChatHash,
          dependencies: GroupChatFamily._dependencies,
          allTransitiveDependencies: GroupChatFamily._allTransitiveDependencies,
          groupId: groupId,
        );

  GroupChatProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.groupId,
  }) : super.internal();

  final String groupId;

  @override
  Override overrideWith(
    Stream<List<GroupMessage>> Function(GroupChatRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: GroupChatProvider._internal(
        (ref) => create(ref as GroupChatRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        groupId: groupId,
      ),
    );
  }

  @override
  AutoDisposeStreamProviderElement<List<GroupMessage>> createElement() {
    return _GroupChatProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is GroupChatProvider && other.groupId == groupId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, groupId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin GroupChatRef on AutoDisposeStreamProviderRef<List<GroupMessage>> {
  /// The parameter `groupId` of this provider.
  String get groupId;
}

class _GroupChatProviderElement
    extends AutoDisposeStreamProviderElement<List<GroupMessage>>
    with GroupChatRef {
  _GroupChatProviderElement(super.provider);

  @override
  String get groupId => (origin as GroupChatProvider).groupId;
}

String _$leaderboardHash() => r'ddf817cea852b5f2da71751170c8b2cf6cded40f';

/// See also [leaderboard].
@ProviderFor(leaderboard)
final leaderboardProvider =
    AutoDisposeFutureProvider<List<LeaderboardEntry>>.internal(
  leaderboard,
  name: r'leaderboardProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$leaderboardHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef LeaderboardRef = AutoDisposeFutureProviderRef<List<LeaderboardEntry>>;
String _$socialNotifierHash() => r'dd4aae5c8cbb53cd730e7607b7d94f35727861ad';

/// See also [SocialNotifier].
@ProviderFor(SocialNotifier)
final socialNotifierProvider =
    AutoDisposeAsyncNotifierProvider<SocialNotifier, List<StudyGroup>>.internal(
  SocialNotifier.new,
  name: r'socialNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$socialNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$SocialNotifier = AutoDisposeAsyncNotifier<List<StudyGroup>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
