import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:gap/gap.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../providers/analytics_provider.dart';
import '../../../focus_mode/data/models/study_session.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  AnalyticsFilter _selectedFilter = AnalyticsFilter.day;
  DateTimeRange? _customRange;

  @override
  void initState() {
    super.initState();
    // Set default filter to "day" (today)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(analyticsNotifierProvider.notifier).setFilter(AnalyticsFilter.day);
      
      final analyticsAsync = ref.read(analyticsNotifierProvider);
      if (analyticsAsync.hasValue) {
        ref.read(aIInsightNotifierProvider.notifier).generateInsight(analyticsAsync.value!);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final analyticsAsync = ref.watch(analyticsNotifierProvider);
    final insightAsync = ref.watch(aIInsightNotifierProvider);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Theme.of(context).colorScheme.surface,
              Theme.of(context).colorScheme.surfaceContainer,
            ],
          ),
        ),
        child: analyticsAsync.when(
          data: (data) {
            if (insightAsync.value == "Analyzing your study habits...") {
               Future.microtask(() => 
                 ref.read(aIInsightNotifierProvider.notifier).generateInsight(data)
               );
            }
            
            return CustomScrollView(
              slivers: [
                SliverAppBar.large(
                  title: const Text('Student Analytics'),
                  centerTitle: false,
                  backgroundColor: Colors.transparent,
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildFilterBar(context),
                        const Gap(24),
                        _buildSummaryCards(context, data),
                        const Gap(24),
                        _buildAIInsightCard(context, insightAsync),
                        const Gap(24),
                        Text(
                          _getChartTitle(data['filter'] as AnalyticsFilter),
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const Gap(16),
                        _buildChart(context, data),
                        const Gap(24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Session Details',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            Row(
                              children: [
                                if (_selectedFilter == AnalyticsFilter.custom && _customRange != null)
                                  Padding(
                                    padding: const EdgeInsets.only(right: 8.0),
                                    child: Text(
                                      '${DateFormat('MMM d').format(_customRange!.start)} - ${DateFormat('MMM d, y').format(_customRange!.end)}',
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: Theme.of(context).colorScheme.primary,
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                  ),
                                IconButton(
                                  icon: const Icon(Icons.picture_as_pdf),
                                  onPressed: () => _exportToPDF(context, data),
                                  tooltip: 'Export to PDF',
                                ),
                                Text(
                                  '${(data['sessions'] as List).length} sessions',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                                      ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const Gap(16),
                        _buildSessionsList(context, data['sessions'] as List<StudySession>),
                        const Gap(80),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      ),
    );
  }

  Widget _buildFilterBar(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: SegmentedButton<AnalyticsFilter>(
            segments: const [
              ButtonSegment(
                value: AnalyticsFilter.day,
                label: Text('Today'),
                icon: Icon(Icons.today, size: 18),
              ),
              ButtonSegment(
                value: AnalyticsFilter.week,
                label: Text('Week'),
                icon: Icon(Icons.calendar_view_week, size: 18),
              ),
              ButtonSegment(
                value: AnalyticsFilter.month,
                label: Text('Month'),
                icon: Icon(Icons.calendar_month, size: 18),
              ),
              ButtonSegment(
                value: AnalyticsFilter.year,
                label: Text('Year'),
                icon: Icon(Icons.calendar_today, size: 18),
              ),
            ],
            selected: {_selectedFilter},
            onSelectionChanged: (Set<AnalyticsFilter> newSelection) {
              setState(() {
                _selectedFilter = newSelection.first;
              });
              ref.read(analyticsNotifierProvider.notifier).setFilter(_selectedFilter);
            },
          ),
        ),
        const Gap(12),
        OutlinedButton.icon(
          onPressed: () async {
            final picked = await showDateRangePicker(
              context: context,
              firstDate: DateTime(2020),
              lastDate: DateTime.now(),
              initialDateRange: _customRange,
              builder: (context, child) {
                return Theme(
                  data: Theme.of(context).copyWith(
                    colorScheme: Theme.of(context).colorScheme.copyWith(
                      primary: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  child: child!,
                );
              },
            );
            
            if (picked != null) {
              setState(() {
                _customRange = picked;
                _selectedFilter = AnalyticsFilter.custom;
              });
              ref.read(analyticsNotifierProvider.notifier).setFilter(
                AnalyticsFilter.custom,
                customRange: picked,
              );
            }
          },
          icon: const Icon(Icons.date_range, size: 18),
          label: Text(_customRange == null 
            ? 'Custom Range' 
            : '${DateFormat('MMM d').format(_customRange!.start)} - ${DateFormat('MMM d').format(_customRange!.end)}'
          ),
          style: OutlinedButton.styleFrom(
            backgroundColor: _selectedFilter == AnalyticsFilter.custom
                ? Theme.of(context).colorScheme.primaryContainer
                : null,
          ),
        ),
      ],
    );
  }

  String _getChartTitle(AnalyticsFilter filter) {
    switch (filter) {
      case AnalyticsFilter.day:
        return 'Today\'s Focus';
      case AnalyticsFilter.week:
        return 'Weekly Focus Trend';
      case AnalyticsFilter.month:
        return 'Monthly Focus Trend';
      case AnalyticsFilter.year:
        return 'Yearly Focus Trend';
      case AnalyticsFilter.custom:
        return 'Custom Range Focus';
    }
  }

  Widget _buildSummaryCards(BuildContext context, Map<String, dynamic> data) {
    final totalToday = data['totalFocusToday'] as int;
    final totalPeriod = data['totalFocusPeriod'] as int;
    final filter = data['filter'] as AnalyticsFilter;

    String periodLabel = 'This Week';
    switch (filter) {
      case AnalyticsFilter.day:
        periodLabel = 'Today';
        break;
      case AnalyticsFilter.week:
        periodLabel = 'This Week';
        break;
      case AnalyticsFilter.month:
        periodLabel = 'This Month';
        break;
      case AnalyticsFilter.year:
        periodLabel = 'This Year';
        break;
      case AnalyticsFilter.custom:
        periodLabel = 'Selected Period';
        break;
    }

    return Row(
      children: [
        Expanded(
          child: _buildMetricCard(
            context,
            'Today',
            _formatDuration(totalToday),
            Icons.today,
            Colors.blueAccent,
          ),
        ),
        const Gap(16),
        Expanded(
          child: _buildMetricCard(
            context,
            periodLabel,
            _formatDuration(totalPeriod),
            Icons.calendar_view_week,
            Colors.orangeAccent,
          ),
        ),
      ],
    );
  }

  Widget _buildMetricCard(BuildContext context, String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Theme.of(context).colorScheme.outlineVariant.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color),
          ),
          const Gap(16),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          Text(
            title,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildAIInsightCard(BuildContext context, AsyncValue<String> insightAsync) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.deepPurple.shade400,
            Colors.deepPurple.shade700,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.deepPurple.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome, color: Colors.white),
              const Gap(8),
              Text(
                'AI Study Coach',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
          const Gap(12),
          insightAsync.when(
            data: (text) => Text(
              text,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.white.withOpacity(0.9),
                    height: 1.5,
                  ),
            ),
            loading: () => const LinearProgressIndicator(
              color: Colors.white,
              backgroundColor: Colors.white24,
            ),
            error: (_, __) => const Text(
              'Could not generate insight. Configure AI model in Settings.',
              style: TextStyle(color: Colors.white70),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChart(BuildContext context, Map<String, dynamic> data) {
    final dailyFocus = data['dailyFocus'] as Map<DateTime, int>;
    final filter = data['filter'] as AnalyticsFilter;

    if (dailyFocus.isEmpty) {
      return Container(
        height: 200,
        alignment: Alignment.center,
        child: Text(
          'No data for this period',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
      );
    }

    // For now, use bar chart for all filters
    return _buildBarChart(context, dailyFocus, filter);
  }

  Widget _buildBarChart(BuildContext context, Map<DateTime, int> dailyFocus, AnalyticsFilter filter) {
    final sortedDates = dailyFocus.keys.toList()..sort();
    final List<BarChartGroupData> barGroups = [];
    double maxHours = 0;

    for (int i = 0; i < sortedDates.length; i++) {
      final date = sortedDates[i];
      final seconds = dailyFocus[date] ?? 0;
      final hours = seconds / 3600;
      if (hours > maxHours) maxHours = hours;

      barGroups.add(
        BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: hours,
              color: Theme.of(context).colorScheme.primary,
              width: 16,
              borderRadius: BorderRadius.circular(4),
              backDrawRodData: BackgroundBarChartRodData(
                show: true,
                toY: (maxHours < 1 ? 1 : maxHours) * 1.2,
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
              ),
            ),
          ],
        ),
      );
    }

    return SizedBox(
      height: 200,
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: (maxHours < 1 ? 1 : maxHours) * 1.2,
          barTouchData: BarTouchData(
            touchTooltipData: BarTouchTooltipData(
              getTooltipColor: (_) => Theme.of(context).colorScheme.inverseSurface,
              getTooltipItem: (group, groupIndex, rod, rodIndex) {
                final date = sortedDates[groupIndex];
                return BarTooltipItem(
                  '${DateFormat('MMM d').format(date)}\n${rod.toY.toStringAsFixed(1)} hrs',
                  TextStyle(color: Theme.of(context).colorScheme.onInverseSurface),
                );
              },
            ),
          ),
          titlesData: FlTitlesData(
            show: true,
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  if (value.toInt() < 0 || value.toInt() >= sortedDates.length) {
                    return const SizedBox();
                  }
                  final date = sortedDates[value.toInt()];
                  String label;
                  if (filter == AnalyticsFilter.year) {
                    label = DateFormat('MMM').format(date);
                  } else {
                    label = DateFormat('d').format(date);
                  }
                  
                  return Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      label,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        fontSize: 10,
                      ),
                    ),
                  );
                },
              ),
            ),
            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          gridData: const FlGridData(show: false),
          borderData: FlBorderData(show: false),
        ),
      ),
    );
  }

  Widget _buildSessionsList(BuildContext context, List<StudySession> sessions) {
    if (sessions.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(48),
        child: Column(
          children: [
            Icon(
              Icons.self_improvement,
              size: 64,
              color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.5),
            ),
            const Gap(16),
            Text(
              'No sessions yet',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const Gap(8),
            Text(
              'Start a focus session to see your progress here',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.7),
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    // Group sessions by date
    final groupedSessions = <DateTime, List<StudySession>>{};
    for (final session in sessions) {
      final date = DateTime(
        session.startTime.year,
        session.startTime.month,
        session.startTime.day,
      );
      groupedSessions.putIfAbsent(date, () => []).add(session);
    }

    final sortedDates = groupedSessions.keys.toList()..sort((a, b) => b.compareTo(a));

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: sortedDates.length,
      separatorBuilder: (context, index) => const Gap(24),
      itemBuilder: (context, index) {
        final date = sortedDates[index];
        final dateSessions = groupedSessions[date]!;
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 12),
              child: Text(
                _formatDateHeader(date),
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            ...dateSessions.map((session) => _buildSessionCard(context, session)),
          ],
        );
      },
    );
  }

  String _formatDateHeader(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    if (date == today) {
      return 'Today';
    } else if (date == yesterday) {
      return 'Yesterday';
    } else {
      return DateFormat('EEEE, MMM d').format(date);
    }
  }

  Widget _buildSessionCard(BuildContext context, StudySession session) {
    final startTime = DateFormat('h:mm a').format(session.startTime);
    final endTime = session.endTime != null 
        ? DateFormat('h:mm a').format(session.endTime!)
        : 'In Progress';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.timer_outlined,
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                  size: 20,
                ),
              ),
              const Gap(12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      session.focusIntent?.isNotEmpty == true 
                          ? session.focusIntent! 
                          : 'Focus Session',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Gap(4),
                    Row(
                      children: [
                        Icon(
                          Icons.play_arrow,
                          size: 14,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                        const Gap(4),
                        Text(
                          startTime,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                        ),
                        const Gap(8),
                        Icon(
                          Icons.stop,
                          size: 14,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                        const Gap(4),
                        Text(
                          endTime,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Gap(12),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        _formatDuration(session.durationSeconds),
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: Theme.of(context).colorScheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      if (session.isDeepFocus)
                        Container(
                          margin: const EdgeInsets.only(top: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.tertiaryContainer,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'DEEP',
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: Theme.of(context).colorScheme.onTertiaryContainer,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ),
                    ],
                  ),
                  PopupMenuButton<String>(
                    icon: Icon(Icons.more_vert, color: Theme.of(context).colorScheme.onSurfaceVariant),
                    onSelected: (value) {
                      if (value == 'edit') _showEditSessionDialog(context, session);
                      if (value == 'delete') _confirmDeleteSession(context, session);
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit, size: 20),
                            Gap(8),
                            Text('Edit'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, size: 20, color: Colors.red),
                            Gap(8),
                            Text('Delete', style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDeleteSession(BuildContext context, StudySession session) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Session'),
        content: const Text('Are you sure you want to delete this study session? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await ref.read(analyticsNotifierProvider.notifier).deleteSession(session.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Session deleted')),
        );
      }
    }
  }

  Future<void> _showEditSessionDialog(BuildContext context, StudySession session) async {
    final intentController = TextEditingController(text: session.focusIntent);
    TimeOfDay startTime = TimeOfDay.fromDateTime(session.startTime);
    TimeOfDay? endTime = session.endTime != null ? TimeOfDay.fromDateTime(session.endTime!) : null;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Edit Session'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: intentController,
                decoration: const InputDecoration(
                  labelText: 'Focus Intent',
                  border: OutlineInputBorder(),
                ),
              ),
              const Gap(16),
              ListTile(
                title: const Text('Start Time'),
                trailing: Text(startTime.format(context)),
                onTap: () async {
                  final picked = await showTimePicker(context: context, initialTime: startTime);
                  if (picked != null) setState(() => startTime = picked);
                },
              ),
              ListTile(
                title: const Text('End Time'),
                trailing: Text(endTime?.format(context) ?? 'In Progress'),
                onTap: () async {
                  final picked = await showTimePicker(
                    context: context, 
                    initialTime: endTime ?? TimeOfDay.now()
                  );
                  if (picked != null) setState(() => endTime = picked);
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );

    if (result == true) {
      final newStart = DateTime(
        session.startTime.year, session.startTime.month, session.startTime.day,
        startTime.hour, startTime.minute
      );
      
      DateTime? newEnd;
      if (endTime != null) {
        newEnd = DateTime(
          session.startTime.year, session.startTime.month, session.startTime.day,
          endTime!.hour, endTime!.minute
        );
        // Handle overnight sessions if needed, but for now assume same day or next day if earlier
        if (newEnd.isBefore(newStart)) {
          newEnd = newEnd.add(const Duration(days: 1));
        }
      }

      final newDuration = newEnd != null 
          ? newEnd.difference(newStart).inSeconds 
          : session.durationSeconds;

      final updatedSession = session.copyWith(
        focusIntent: intentController.text,
        startTime: newStart,
        endTime: newEnd,
        durationSeconds: newDuration,
      );

      await ref.read(analyticsNotifierProvider.notifier).updateSession(updatedSession);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Session updated')),
        );
      }
    }
  }

  String _formatDuration(int seconds) {
    final duration = Duration(seconds: seconds);
    if (duration.inHours > 0) {
      return '${duration.inHours}h ${duration.inMinutes.remainder(60)}m';
    } else {
      return '${duration.inMinutes}m';
    }
  }

  Future<void> _exportToPDF(BuildContext context, Map<String, dynamic> data) async {
    final pdf = pw.Document();
    
    final sessions = data['sessions'] as List<StudySession>;
    final totalToday = data['totalFocusToday'] as int;
    final totalPeriod = data['totalFocusPeriod'] as int;
    final filter = data['filter'] as AnalyticsFilter;
    final start = data['start'] as DateTime;
    final end = data['end'] as DateTime;
    
    // Calculate metrics
    final daysInPeriod = end.difference(start).inDays;
    final effectiveDays = daysInPeriod == 0 ? 1 : daysInPeriod;
    final averageDailySeconds = totalPeriod / effectiveDays;
    final averageDailyFocus = _formatDuration(averageDailySeconds.round());
    
    String periodName = 'Today';
    String dateRange = DateFormat('MMM d, y').format(start);
    
    switch (filter) {
      case AnalyticsFilter.day:
        periodName = 'Today';
        dateRange = DateFormat('MMM d, y').format(start);
        break;
      case AnalyticsFilter.week:
        periodName = 'This Week';
        dateRange = '${DateFormat('MMM d').format(start)} - ${DateFormat('MMM d, y').format(end.subtract(const Duration(days: 1)))}';
        break;
      case AnalyticsFilter.month:
        periodName = 'This Month';
        dateRange = DateFormat('MMMM y').format(start);
        break;
      case AnalyticsFilter.year:
        periodName = 'This Year';
        dateRange = DateFormat('y').format(start);
        break;
      case AnalyticsFilter.custom:
        periodName = 'Custom Range';
        dateRange = '${DateFormat('MMM d, y').format(start)} - ${DateFormat('MMM d, y').format(end)}';
        break;
    }
    
    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return [
            // Header
            pw.Container(
              padding: const pw.EdgeInsets.only(bottom: 20),
              decoration: const pw.BoxDecoration(
                border: pw.Border(bottom: pw.BorderSide(color: PdfColors.grey300, width: 1)),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('Study Analytics Report', style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
                      pw.SizedBox(height: 4),
                      pw.Text(periodName, style: pw.TextStyle(fontSize: 16, color: PdfColors.grey700)),
                      pw.Text(dateRange, style: const pw.TextStyle(fontSize: 14, color: PdfColors.grey600)),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text('Generated', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey500)),
                      pw.Text(DateFormat('MMM d, y h:mm a').format(DateTime.now()), style: const pw.TextStyle(fontSize: 12, color: PdfColors.grey700)),
                    ],
                  ),
                ],
              ),
            ),
            
            pw.SizedBox(height: 20),
            
            // Key Metrics
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                _buildPdfMetricCard('Total Focus Time', _formatDuration(totalPeriod), PdfColors.blue100, PdfColors.blue800),
                _buildPdfMetricCard('Avg. Daily Focus', averageDailyFocus, PdfColors.green100, PdfColors.green800),
                _buildPdfMetricCard('Total Sessions', '${sessions.length}', PdfColors.purple100, PdfColors.purple800),
              ],
            ),
            
            pw.SizedBox(height: 24),
            
            // Session Details
            pw.Text('Session Details', style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold, color: PdfColors.grey800)),
            pw.SizedBox(height: 12),
            
            if (sessions.isEmpty)
              pw.Container(
                padding: const pw.EdgeInsets.all(32),
                alignment: pw.Alignment.center,
                decoration: pw.BoxDecoration(
                  color: PdfColors.grey100,
                  borderRadius: pw.BorderRadius.circular(8),
                ),
                child: pw.Text('No sessions found for this period', style: const pw.TextStyle(fontSize: 14, color: PdfColors.grey600)),
              )
            else
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
                columnWidths: {
                  0: const pw.FlexColumnWidth(2), // Date
                  1: const pw.FlexColumnWidth(2), // Time
                  2: const pw.FlexColumnWidth(1.5), // Duration
                  3: const pw.FlexColumnWidth(3), // Intent
                  4: const pw.FlexColumnWidth(1), // Type
                },
                children: [
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                    children: [
                      _buildPdfTableHeader('Date'),
                      _buildPdfTableHeader('Time'),
                      _buildPdfTableHeader('Duration'),
                      _buildPdfTableHeader('Focus Intent'),
                      _buildPdfTableHeader('Type'),
                    ],
                  ),
                  ...sessions.map((session) => pw.TableRow(
                    children: [
                      _buildPdfTableCell(DateFormat('MMM d').format(session.startTime)),
                      _buildPdfTableCell('${DateFormat('h:mm a').format(session.startTime)} - ${session.endTime != null ? DateFormat('h:mm a').format(session.endTime!) : '?'}'),
                      _buildPdfTableCell(_formatDuration(session.durationSeconds)),
                      _buildPdfTableCell(session.focusIntent ?? '-'),
                      _buildPdfTableCell(session.isDeepFocus ? 'DEEP' : 'Normal', isBold: session.isDeepFocus),
                    ],
                  )).toList(),
                ],
              ),
              
            // Footer
            pw.SizedBox(height: 20),
            pw.Divider(color: PdfColors.grey300),
            pw.Center(
              child: pw.Text(
                'Study Companion OS', 
                style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey500)
              ),
            ),
          ];
        },
      ),
    );
    
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Study_Analytics_${DateFormat('yyyyMMdd').format(DateTime.now())}',
    );
  }

  pw.Widget _buildPdfMetricCard(String label, String value, PdfColor bgColor, PdfColor textColor) {
    return pw.Container(
      width: 150,
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        color: bgColor,
        borderRadius: pw.BorderRadius.circular(8),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(label, style: pw.TextStyle(fontSize: 10, color: textColor.flatten())),
          pw.SizedBox(height: 4),
          pw.Text(value, style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: textColor)),
        ],
      ),
    );
  }

  pw.Widget _buildPdfTableHeader(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(8),
      child: pw.Text(text, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10, color: PdfColors.grey800)),
    );
  }

  pw.Widget _buildPdfTableCell(String text, {bool isBold = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(8),
      child: pw.Text(
        text, 
        style: pw.TextStyle(
          fontSize: 10, 
          color: PdfColors.grey800,
          fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
        )
      ),
    );
  }
}
