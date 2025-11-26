import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import '../../../ai_chat/presentation/providers/chat_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final modelPathAsync = ref.watch(modelPathNotifierProvider);
    final embeddingPathAsync = ref.watch(embeddingPathNotifierProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.dark_mode),
            title: const Text('Dark Mode'),
            trailing: Switch(value: false, onChanged: (v) {}),
          ),
          ListTile(
            leading: const Icon(Icons.notifications),
            title: const Text('Notifications'),
            trailing: Switch(value: true, onChanged: (v) {}),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.info),
            title: const Text('About'),
            subtitle: const Text('Version 0.1.0'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.download),
            title: const Text('Download AI Models'),
            subtitle: const Text('Manage offline AI models'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/download-models'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.psychology),
            title: const Text('AI Model Status'),
            subtitle: const Text('Downloaded models status'),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'The app uses bundled AI models automatically. No configuration needed!',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                modelPathAsync.when(
                  data: (path) => Card(
                    child: ListTile(
                      leading: Icon(
                        path != null ? Icons.check_circle : Icons.info,
                        color: path != null ? Colors.green : Theme.of(context).colorScheme.primary,
                      ),
                      title: Text(
                        path != null 
                            ? (path.contains('chat_model.gguf') 
                                ? 'Bundled Chat Model Active' 
                                : 'Custom Chat Model')
                            : 'No Chat Model',
                      ),
                      subtitle: path != null ? Text(
                        path.split('/').last,
                        style: Theme.of(context).textTheme.bodySmall,
                      ) : const Text('Place chat_model.gguf in assets/models/'),
                    ),
                  ),
                  loading: () => const LinearProgressIndicator(),
                  error: (_, __) => const Text('Error loading model status'),
                ),
                const SizedBox(height: 12),
                embeddingPathAsync.when(
                  data: (path) => Card(
                    child: ListTile(
                      leading: Icon(
                        path != null ? Icons.check_circle : Icons.info,
                        color: path != null ? Colors.green : Theme.of(context).colorScheme.primary,
                      ),
                      title: Text(
                        path != null 
                            ? (path.contains('embedding_model.gguf') 
                                ? 'Bundled Embedding Model Active' 
                                : 'Custom Embedding Model')
                            : 'No Embedding Model',
                      ),
                      subtitle: path != null ? Text(
                        path.split('/').last,
                        style: Theme.of(context).textTheme.bodySmall,
                      ) : const Text('Place embedding_model.gguf in assets/models/'),
                    ),
                  ),
                  loading: () => const LinearProgressIndicator(),
                  error: (_, __) => const Text('Error loading embedding status'),
                ),
              ],
            ),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.info),
            title: const Text('About'),
            subtitle: const Text('Version 0.1.0'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.cloud_sync),
            title: const Text('Cloud Sync (Supabase)'),
            subtitle: const Text('Optional backup & sync'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/settings/sync'),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              'Note: Download Llama models from Hugging Face or other sources. Recommended: Llama-3.2-1B-Instruct for chat, all-MiniLM-L6-v2 for embeddings.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
