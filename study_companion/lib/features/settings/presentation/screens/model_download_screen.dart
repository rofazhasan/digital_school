import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:study_companion/core/services/model_download_service.dart';
import 'package:study_companion/features/ai_chat/presentation/providers/chat_provider.dart';

class ModelDownloadScreen extends ConsumerStatefulWidget {
  const ModelDownloadScreen({super.key});

  @override
  ConsumerState<ModelDownloadScreen> createState() => _ModelDownloadScreenState();
}

class _ModelDownloadScreenState extends ConsumerState<ModelDownloadScreen> {
  double _chatModelProgress = 0.0;
  double _embeddingModelProgress = 0.0;
  bool _isDownloadingChat = false;
  bool _isDownloadingEmbedding = false;
  bool _chatComplete = false;
  bool _embeddingComplete = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _checkExistingModels();
  }

  Future<void> _checkExistingModels() async {
    final service = ref.read(modelDownloadServiceProvider);
    final chatExists = await service.isChatModelDownloaded();
    final embeddingExists = await service.isEmbeddingModelDownloaded();
    
    setState(() {
      _chatComplete = chatExists;
      _embeddingComplete = embeddingExists;
      if (chatExists) _chatModelProgress = 1.0;
      if (embeddingExists) _embeddingModelProgress = 1.0;
    });
  }

  Future<void> _downloadChatModel() async {
    setState(() {
      _isDownloadingChat = true;
      _error = null;
    });

    final service = ref.read(modelDownloadServiceProvider);
    
    await service.downloadChatModel(
      onProgress: (progress) {
        setState(() {
          _chatModelProgress = progress;
        });
      },
      onComplete: (path) {
        setState(() {
          _isDownloadingChat = false;
          _chatComplete = true;
          _chatModelProgress = 1.0;
        });
        ref.invalidate(modelPathNotifierProvider);
      },
      onError: (error) {
        setState(() {
          _isDownloadingChat = false;
          _error = 'Failed to download chat model: $error';
        });
      },
    );
  }

  Future<void> _downloadEmbeddingModel() async {
    setState(() {
      _isDownloadingEmbedding = true;
      _error = null;
    });

    final service = ref.read(modelDownloadServiceProvider);
    
    await service.downloadEmbeddingModel(
      onProgress: (progress) {
        setState(() {
          _embeddingModelProgress = progress;
        });
      },
      onComplete: (path) {
        setState(() {
          _isDownloadingEmbedding = false;
          _embeddingComplete = true;
          _embeddingModelProgress = 1.0;
        });
        ref.invalidate(embeddingPathNotifierProvider);
      },
      onError: (error) {
        setState(() {
          _isDownloadingEmbedding = false;
          _error = 'Failed to download embedding model: $error';
        });
      },
    );
  }

  Future<void> _downloadAll() async {
    if (!_chatComplete) {
      await _downloadChatModel();
    }
    if (!_embeddingComplete && _error == null) {
      await _downloadEmbeddingModel();
    }
  }

  @override
  Widget build(BuildContext context) {
    final allComplete = _chatComplete && _embeddingComplete;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Theme.of(context).colorScheme.primaryContainer,
              Theme.of(context).colorScheme.secondaryContainer,
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  allComplete ? Icons.check_circle : Icons.cloud_download,
                  size: 80,
                  color: allComplete 
                      ? Colors.green 
                      : Theme.of(context).colorScheme.primary,
                ),
                const Gap(24),
                Text(
                  allComplete ? 'AI Models Ready!' : 'Download AI Models',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                  textAlign: TextAlign.center,
                ),
                const Gap(16),
                Text(
                  allComplete
                      ? 'Your AI assistant is ready to help you study!'
                      : 'Download lightweight AI models for offline use.\nThis is a one-time download (~85MB).',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                  textAlign: TextAlign.center,
                ),
                const Gap(48),
                
                // Chat Model Card
                _buildModelCard(
                  context,
                  title: 'Chat Model',
                  subtitle: 'TinyLlama 1.1B (~60MB)',
                  progress: _chatModelProgress,
                  isDownloading: _isDownloadingChat,
                  isComplete: _chatComplete,
                  icon: Icons.chat_bubble_outline,
                ),
                const Gap(16),
                
                // Embedding Model Card
                _buildModelCard(
                  context,
                  title: 'Embedding Model',
                  subtitle: 'MiniLM (~25MB)',
                  progress: _embeddingModelProgress,
                  isDownloading: _isDownloadingEmbedding,
                  isComplete: _embeddingComplete,
                  icon: Icons.search,
                ),
                
                if (_error != null) ...[
                  const Gap(24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.error_outline,
                          color: Theme.of(context).colorScheme.error,
                        ),
                        const Gap(12),
                        Expanded(
                          child: Text(
                            _error!,
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.onErrorContainer,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                
                const Gap(48),
                
                if (!allComplete)
                  FilledButton.icon(
                    onPressed: (_isDownloadingChat || _isDownloadingEmbedding)
                        ? null
                        : _downloadAll,
                    icon: const Icon(Icons.download),
                    label: Text(
                      (_isDownloadingChat || _isDownloadingEmbedding)
                          ? 'Downloading...'
                          : 'Download Models',
                    ),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 16,
                      ),
                    ),
                  )
                else
                  FilledButton.icon(
                    onPressed: () => context.go('/focus'),
                    icon: const Icon(Icons.check),
                    label: const Text('Get Started'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 16,
                      ),
                    ),
                  ),
                
                const Gap(16),
                
                TextButton(
                  onPressed: () => context.go('/focus'),
                  child: const Text('Skip for now (Use basic features)'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildModelCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required double progress,
    required bool isDownloading,
    required bool isComplete,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
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
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isComplete
                      ? Colors.green.withOpacity(0.1)
                      : Theme.of(context).colorScheme.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isComplete ? Icons.check : icon,
                  color: isComplete
                      ? Colors.green
                      : Theme.of(context).colorScheme.primary,
                ),
              ),
              const Gap(16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                  ],
                ),
              ),
              if (isComplete)
                Icon(
                  Icons.check_circle,
                  color: Colors.green,
                  size: 32,
                ),
            ],
          ),
          if (isDownloading || (!isComplete && progress > 0)) ...[
            const Gap(16),
            LinearProgressIndicator(
              value: progress,
              backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
              minHeight: 8,
              borderRadius: BorderRadius.circular(4),
            ),
            const Gap(8),
            Text(
              '${(progress * 100).toStringAsFixed(0)}%',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ],
      ),
    );
  }
}
