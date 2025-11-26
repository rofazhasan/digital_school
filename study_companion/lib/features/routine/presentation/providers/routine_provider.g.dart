// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'routine_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$dailyRoutineHash() => r'fd8e5e03909864ee2e0afa57538844c799b49f48';

/// See also [dailyRoutine].
@ProviderFor(dailyRoutine)
final dailyRoutineProvider = AutoDisposeFutureProvider<DailyRoutine?>.internal(
  dailyRoutine,
  name: r'dailyRoutineProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$dailyRoutineHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef DailyRoutineRef = AutoDisposeFutureProviderRef<DailyRoutine?>;
String _$selectedDateHash() => r'cdf01013bb0b46773ef9feb5078bc63f33ef3e58';

/// See also [SelectedDate].
@ProviderFor(SelectedDate)
final selectedDateProvider =
    AutoDisposeNotifierProvider<SelectedDate, DateTime>.internal(
  SelectedDate.new,
  name: r'selectedDateProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$selectedDateHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$SelectedDate = AutoDisposeNotifier<DateTime>;
String _$dailyRoutineBlocksHash() =>
    r'684682f13dc6143ccddba07d45eb74e6249ea401';

/// See also [DailyRoutineBlocks].
@ProviderFor(DailyRoutineBlocks)
final dailyRoutineBlocksProvider = AutoDisposeAsyncNotifierProvider<
    DailyRoutineBlocks, List<RoutineBlock>>.internal(
  DailyRoutineBlocks.new,
  name: r'dailyRoutineBlocksProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$dailyRoutineBlocksHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$DailyRoutineBlocks = AutoDisposeAsyncNotifier<List<RoutineBlock>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
