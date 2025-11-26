import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import '../../../../core/data/supabase_sync_service.dart';

class SyncSettingsScreen extends StatefulWidget {
  const SyncSettingsScreen({super.key});

  @override
  State<SyncSettingsScreen> createState() => _SyncSettingsScreenState();
}

class _SyncSettingsScreenState extends State<SyncSettingsScreen> {
  final _urlController = TextEditingController();
  final _keyController = TextEditingController();
  final _syncService = SupabaseSyncService();
  bool _isLoading = false;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    await _syncService.init();
    if (_syncService.isInitialized) {
      setState(() {
        _statusMessage = 'Connected';
      });
    }
  }

  Future<void> _connect() async {
    setState(() {
      _isLoading = true;
      _statusMessage = null;
    });

    try {
      await _syncService.saveCredentials(
        _urlController.text.trim(),
        _keyController.text.trim(),
      );
      
      if (_syncService.isInitialized) {
        setState(() {
          _statusMessage = 'Successfully Connected!';
        });
      } else {
        setState(() {
          _statusMessage = 'Connection Failed. Check credentials.';
        });
      }
    } catch (e) {
      setState(() {
        _statusMessage = 'Error: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _disconnect() async {
    await _syncService.clearCredentials();
    _urlController.clear();
    _keyController.clear();
    setState(() {
      _statusMessage = 'Disconnected';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cloud Sync (Supabase)'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Optional: Connect your own Supabase project to sync data.',
              style: TextStyle(color: Colors.grey),
            ),
            const Gap(24),
            TextField(
              controller: _urlController,
              decoration: const InputDecoration(
                labelText: 'Project URL',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.link),
              ),
            ),
            const Gap(16),
            TextField(
              controller: _keyController,
              decoration: const InputDecoration(
                labelText: 'Anon Key',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.vpn_key),
              ),
              obscureText: true,
            ),
            const Gap(24),
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: _connect,
                      child: const Text('Connect'),
                    ),
                  ),
                  const Gap(16),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _disconnect,
                      child: const Text('Disconnect'),
                    ),
                  ),
                ],
              ),
            const Gap(24),
            if (_statusMessage != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _statusMessage!.contains('Success') || _statusMessage == 'Connected'
                      ? Colors.green.withOpacity(0.1)
                      : Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _statusMessage!,
                  style: TextStyle(
                    color: _statusMessage!.contains('Success') || _statusMessage == 'Connected'
                        ? Colors.green
                        : Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
