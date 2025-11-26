import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/chat_provider.dart';

class ModelSettingsDialog extends ConsumerStatefulWidget {
  const ModelSettingsDialog({super.key});

  @override
  ConsumerState<ModelSettingsDialog> createState() => _ModelSettingsDialogState();
}

class _ModelSettingsDialogState extends ConsumerState<ModelSettingsDialog> {
  String? _chatModelPath;
  String? _embeddingModelPath;

  @override
  void initState() {
    super.initState();
    _loadPaths();
  }

  Future<void> _loadPaths() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _chatModelPath = prefs.getString('model_path');
      _embeddingModelPath = prefs.getString('embedding_model_path');
    });
  }

  Future<void> _pickChatModel() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(type: FileType.any);
    if (result != null && result.files.single.path != null) {
      final path = result.files.single.path!;
      if (path.endsWith('.gguf') || path.endsWith('.bin')) {
        await ref.read(modelPathNotifierProvider.notifier).setPath(path);
        setState(() => _chatModelPath = path);
      }
    }
  }

  Future<void> _pickEmbeddingModel() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(type: FileType.any);
    if (result != null && result.files.single.path != null) {
      final path = result.files.single.path!;
      if (path.endsWith('.gguf') || path.endsWith('.bin')) {
        await ref.read(embeddingPathNotifierProvider.notifier).setPath(path);
        setState(() => _embeddingModelPath = path);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('AI Model Settings'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Chat Model (LLM)',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const Gap(8),
          if (_chatModelPath != null)
            _buildPathDisplay(context, _chatModelPath!)
          else
            const Text('No model selected. Using Mock AI.', style: TextStyle(color: Colors.orange)),
          const Gap(8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _pickChatModel,
              icon: const Icon(Icons.chat_bubble),
              label: const Text('Select Chat Model'),
            ),
          ),
          const Gap(24),
          const Text(
            'Embedding Model (Semantic Search)',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const Gap(8),
          if (_embeddingModelPath != null)
            _buildPathDisplay(context, _embeddingModelPath!)
          else
            const Text('No model selected. Search will be text-only.', style: TextStyle(color: Colors.orange)),
          const Gap(8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _pickEmbeddingModel,
              icon: const Icon(Icons.search),
              label: const Text('Select Embedding Model'),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
      ],
    );
  }

  Widget _buildPathDisplay(BuildContext context, String path) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 20),
          const Gap(8),
          Expanded(
            child: Text(
              path.split('/').last,
              style: const TextStyle(fontWeight: FontWeight.bold),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
