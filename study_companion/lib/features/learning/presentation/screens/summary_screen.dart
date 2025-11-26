import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import '../providers/summary_provider.dart';

class SummaryScreen extends ConsumerStatefulWidget {
  const SummaryScreen({super.key});

  @override
  ConsumerState<SummaryScreen> createState() => _SummaryScreenState();
}

class _SummaryScreenState extends ConsumerState<SummaryScreen> {
  final _textController = TextEditingController();
  String _generatedSummary = '';
  bool _isGenerating = false;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _generate() {
    if (_textController.text.isEmpty) return;

    setState(() {
      _generatedSummary = '';
      _isGenerating = true;
    });

    ref.read(summaryNotifierProvider.notifier).generateSummary(_textController.text);
  }

  @override
  Widget build(BuildContext context) {
    final summaryStream = ref.watch(summaryNotifierProvider);

    // Listen to the stream manually to accumulate text
    ref.listen(summaryNotifierProvider, (previous, next) {
      next.whenData((chunk) {
        setState(() {
          _generatedSummary += chunk;
        });
      });
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Summary Generator'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Paste text below to summarize:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const Gap(8),
            TextField(
              controller: _textController,
              maxLines: 6,
              decoration: const InputDecoration(
                hintText: 'Paste long text here...',
                border: OutlineInputBorder(),
              ),
            ),
            const Gap(16),
            FilledButton.icon(
              onPressed: _isGenerating ? null : _generate,
              icon: _isGenerating 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.summarize),
              label: Text(_isGenerating ? 'Generating...' : 'Summarize'),
            ),
            const Gap(24),
            const Text(
              'Summary:',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            const Gap(8),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.withOpacity(0.2)),
                ),
                child: SingleChildScrollView(
                  child: Text(
                    _generatedSummary.isEmpty 
                        ? (_isGenerating ? 'Thinking...' : 'Summary will appear here.') 
                        : _generatedSummary,
                    style: const TextStyle(fontSize: 16, height: 1.5),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
