// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'daily_routine.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetDailyRoutineCollection on Isar {
  IsarCollection<DailyRoutine> get dailyRoutines => this.collection();
}

const DailyRoutineSchema = CollectionSchema(
  name: r'DailyRoutine',
  id: -3988260656112004407,
  properties: {
    r'aiSummary': PropertySchema(
      id: 0,
      name: r'aiSummary',
      type: IsarType.string,
    ),
    r'date': PropertySchema(
      id: 1,
      name: r'date',
      type: IsarType.dateTime,
    ),
    r'healthScore': PropertySchema(
      id: 2,
      name: r'healthScore',
      type: IsarType.long,
    ),
    r'isDayCompleted': PropertySchema(
      id: 3,
      name: r'isDayCompleted',
      type: IsarType.bool,
    ),
    r'isDayStarted': PropertySchema(
      id: 4,
      name: r'isDayStarted',
      type: IsarType.bool,
    )
  },
  estimateSize: _dailyRoutineEstimateSize,
  serialize: _dailyRoutineSerialize,
  deserialize: _dailyRoutineDeserialize,
  deserializeProp: _dailyRoutineDeserializeProp,
  idName: r'id',
  indexes: {
    r'date': IndexSchema(
      id: -7552997827385218417,
      name: r'date',
      unique: true,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'date',
          type: IndexType.value,
          caseSensitive: false,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _dailyRoutineGetId,
  getLinks: _dailyRoutineGetLinks,
  attach: _dailyRoutineAttach,
  version: '3.1.0+1',
);

int _dailyRoutineEstimateSize(
  DailyRoutine object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  {
    final value = object.aiSummary;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  return bytesCount;
}

void _dailyRoutineSerialize(
  DailyRoutine object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.aiSummary);
  writer.writeDateTime(offsets[1], object.date);
  writer.writeLong(offsets[2], object.healthScore);
  writer.writeBool(offsets[3], object.isDayCompleted);
  writer.writeBool(offsets[4], object.isDayStarted);
}

DailyRoutine _dailyRoutineDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = DailyRoutine();
  object.aiSummary = reader.readStringOrNull(offsets[0]);
  object.date = reader.readDateTime(offsets[1]);
  object.healthScore = reader.readLongOrNull(offsets[2]);
  object.id = id;
  object.isDayCompleted = reader.readBool(offsets[3]);
  object.isDayStarted = reader.readBool(offsets[4]);
  return object;
}

P _dailyRoutineDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readStringOrNull(offset)) as P;
    case 1:
      return (reader.readDateTime(offset)) as P;
    case 2:
      return (reader.readLongOrNull(offset)) as P;
    case 3:
      return (reader.readBool(offset)) as P;
    case 4:
      return (reader.readBool(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _dailyRoutineGetId(DailyRoutine object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _dailyRoutineGetLinks(DailyRoutine object) {
  return [];
}

void _dailyRoutineAttach(
    IsarCollection<dynamic> col, Id id, DailyRoutine object) {
  object.id = id;
}

extension DailyRoutineByIndex on IsarCollection<DailyRoutine> {
  Future<DailyRoutine?> getByDate(DateTime date) {
    return getByIndex(r'date', [date]);
  }

  DailyRoutine? getByDateSync(DateTime date) {
    return getByIndexSync(r'date', [date]);
  }

  Future<bool> deleteByDate(DateTime date) {
    return deleteByIndex(r'date', [date]);
  }

  bool deleteByDateSync(DateTime date) {
    return deleteByIndexSync(r'date', [date]);
  }

  Future<List<DailyRoutine?>> getAllByDate(List<DateTime> dateValues) {
    final values = dateValues.map((e) => [e]).toList();
    return getAllByIndex(r'date', values);
  }

  List<DailyRoutine?> getAllByDateSync(List<DateTime> dateValues) {
    final values = dateValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'date', values);
  }

  Future<int> deleteAllByDate(List<DateTime> dateValues) {
    final values = dateValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'date', values);
  }

  int deleteAllByDateSync(List<DateTime> dateValues) {
    final values = dateValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'date', values);
  }

  Future<Id> putByDate(DailyRoutine object) {
    return putByIndex(r'date', object);
  }

  Id putByDateSync(DailyRoutine object, {bool saveLinks = true}) {
    return putByIndexSync(r'date', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDate(List<DailyRoutine> objects) {
    return putAllByIndex(r'date', objects);
  }

  List<Id> putAllByDateSync(List<DailyRoutine> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'date', objects, saveLinks: saveLinks);
  }
}

extension DailyRoutineQueryWhereSort
    on QueryBuilder<DailyRoutine, DailyRoutine, QWhere> {
  QueryBuilder<DailyRoutine, DailyRoutine, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterWhere> anyDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        const IndexWhereClause.any(indexName: r'date'),
      );
    });
  }
}

extension DailyRoutineQueryWhere
    on QueryBuilder<DailyRoutine, DailyRoutine, QWhereClause> {
  QueryBuilder<DailyRoutine, DailyRoutine, QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterWhereClause> idNotEqualTo(
      Id id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterWhereClause> idGreaterThan(
      Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterWhereClause> idLessThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterWhereClause> idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerId,
        includeLower: includeLower,
        upper: upperId,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterWhereClause> dateEqualTo(
      DateTime date) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'date',
        value: [date],
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterWhereClause> dateNotEqualTo(
      DateTime date) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'date',
              lower: [],
              upper: [date],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'date',
              lower: [date],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'date',
              lower: [date],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'date',
              lower: [],
              upper: [date],
              includeUpper: false,
            ));
      }
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterWhereClause> dateGreaterThan(
    DateTime date, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'date',
        lower: [date],
        includeLower: include,
        upper: [],
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterWhereClause> dateLessThan(
    DateTime date, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'date',
        lower: [],
        upper: [date],
        includeUpper: include,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterWhereClause> dateBetween(
    DateTime lowerDate,
    DateTime upperDate, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'date',
        lower: [lowerDate],
        includeLower: includeLower,
        upper: [upperDate],
        includeUpper: includeUpper,
      ));
    });
  }
}

extension DailyRoutineQueryFilter
    on QueryBuilder<DailyRoutine, DailyRoutine, QFilterCondition> {
  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      aiSummaryIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'aiSummary',
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      aiSummaryIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'aiSummary',
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      aiSummaryEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'aiSummary',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      aiSummaryGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'aiSummary',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      aiSummaryLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'aiSummary',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      aiSummaryBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'aiSummary',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      aiSummaryStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'aiSummary',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      aiSummaryEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'aiSummary',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      aiSummaryContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'aiSummary',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      aiSummaryMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'aiSummary',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      aiSummaryIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'aiSummary',
        value: '',
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      aiSummaryIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'aiSummary',
        value: '',
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition> dateEqualTo(
      DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'date',
        value: value,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      dateGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'date',
        value: value,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition> dateLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'date',
        value: value,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition> dateBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'date',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      healthScoreIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'healthScore',
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      healthScoreIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'healthScore',
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      healthScoreEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'healthScore',
        value: value,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      healthScoreGreaterThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'healthScore',
        value: value,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      healthScoreLessThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'healthScore',
        value: value,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      healthScoreBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'healthScore',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition> idEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition> idGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition> idLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition> idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      isDayCompletedEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isDayCompleted',
        value: value,
      ));
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterFilterCondition>
      isDayStartedEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isDayStarted',
        value: value,
      ));
    });
  }
}

extension DailyRoutineQueryObject
    on QueryBuilder<DailyRoutine, DailyRoutine, QFilterCondition> {}

extension DailyRoutineQueryLinks
    on QueryBuilder<DailyRoutine, DailyRoutine, QFilterCondition> {}

extension DailyRoutineQuerySortBy
    on QueryBuilder<DailyRoutine, DailyRoutine, QSortBy> {
  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> sortByAiSummary() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'aiSummary', Sort.asc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> sortByAiSummaryDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'aiSummary', Sort.desc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> sortByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.asc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> sortByDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.desc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> sortByHealthScore() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'healthScore', Sort.asc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy>
      sortByHealthScoreDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'healthScore', Sort.desc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy>
      sortByIsDayCompleted() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isDayCompleted', Sort.asc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy>
      sortByIsDayCompletedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isDayCompleted', Sort.desc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> sortByIsDayStarted() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isDayStarted', Sort.asc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy>
      sortByIsDayStartedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isDayStarted', Sort.desc);
    });
  }
}

extension DailyRoutineQuerySortThenBy
    on QueryBuilder<DailyRoutine, DailyRoutine, QSortThenBy> {
  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> thenByAiSummary() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'aiSummary', Sort.asc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> thenByAiSummaryDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'aiSummary', Sort.desc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> thenByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.asc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> thenByDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.desc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> thenByHealthScore() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'healthScore', Sort.asc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy>
      thenByHealthScoreDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'healthScore', Sort.desc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy>
      thenByIsDayCompleted() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isDayCompleted', Sort.asc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy>
      thenByIsDayCompletedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isDayCompleted', Sort.desc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy> thenByIsDayStarted() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isDayStarted', Sort.asc);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QAfterSortBy>
      thenByIsDayStartedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isDayStarted', Sort.desc);
    });
  }
}

extension DailyRoutineQueryWhereDistinct
    on QueryBuilder<DailyRoutine, DailyRoutine, QDistinct> {
  QueryBuilder<DailyRoutine, DailyRoutine, QDistinct> distinctByAiSummary(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'aiSummary', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QDistinct> distinctByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'date');
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QDistinct> distinctByHealthScore() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'healthScore');
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QDistinct>
      distinctByIsDayCompleted() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isDayCompleted');
    });
  }

  QueryBuilder<DailyRoutine, DailyRoutine, QDistinct> distinctByIsDayStarted() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isDayStarted');
    });
  }
}

extension DailyRoutineQueryProperty
    on QueryBuilder<DailyRoutine, DailyRoutine, QQueryProperty> {
  QueryBuilder<DailyRoutine, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<DailyRoutine, String?, QQueryOperations> aiSummaryProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'aiSummary');
    });
  }

  QueryBuilder<DailyRoutine, DateTime, QQueryOperations> dateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'date');
    });
  }

  QueryBuilder<DailyRoutine, int?, QQueryOperations> healthScoreProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'healthScore');
    });
  }

  QueryBuilder<DailyRoutine, bool, QQueryOperations> isDayCompletedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isDayCompleted');
    });
  }

  QueryBuilder<DailyRoutine, bool, QQueryOperations> isDayStartedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isDayStarted');
    });
  }
}
