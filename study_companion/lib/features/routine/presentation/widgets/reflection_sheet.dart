import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import '../../../ai_chat/presentation/providers/chat_provider.dart';
import '../../../ai_chat/data/models/chat_message.dart';

class ReflectionSheet extends ConsumerStatefulWidget {
  const ReflectionSheet({super.key});

  @override
  ConsumerState<ReflectionSheet> createState() => _ReflectionSheetState();
}

class _ReflectionSheetState extends ConsumerState<ReflectionSheet> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  bool _isTyping = false;
  List<ChatMessage> _localMessages = []; // Temporary session messages

  @override
  void initState() {
    super.initState();
    _startReflection();
  }

  Future<void> _startReflection() async {
    setState(() => _isTyping = true);
    
    // Simulate AI thinking
    await Future.delayed(const Duration(seconds: 1));
    
    final initialMsg = ChatMessage()
      ..role = 'ai'
      ..content = "Good evening! 🌙\n\nI see you've wrapped up your day. How did your study sessions go? Did you accomplish your goals?"
      ..timestamp = DateTime.now();
      
    setState(() {
      _localMessages.add(initialMsg);
      _isTyping = false;
    });
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    final userMsg = ChatMessage()
      ..role = 'user'
      ..content = text
      ..timestamp = DateTime.now();

    setState(() {
      _localMessages.add(userMsg);
      _controller.clear();
      _isTyping = true;
    });
    
    // Scroll to bottom
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });

    try {
      final aiService = ref.read(aiServiceProvider);
      
      // Context for reflection
      final prompt = '''
<|system|>
You are a supportive study coach conducting an evening reflection.
The student just finished their day.
Goal: Help them reflect on wins, learn from challenges, and plan for tomorrow.
Be concise, encouraging, and ask one follow-up question at a time.
</s>
<|user|>
$text
</s>
<|assistant|>
''';

      final aiMsg = ChatMessage()
        ..role = 'ai'
        ..content = ''
        ..timestamp = DateTime.now();
        
      setState(() => _localMessages.add(aiMsg));

      final stream = aiService.generateResponse(prompt);
      
      await for (final chunk in stream) {
        setState(() {
          aiMsg.content += chunk;
        });
      }
    } catch (e) {
      setState(() {
        _localMessages.add(ChatMessage()..role = 'ai'..content = "I'm having trouble connecting right now. But great job today!");
      });
    } finally {
      setState(() => _isTyping = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                const Icon(Icons.nightlight_round, color: Colors.indigo),
                const Gap(8),
                Text(
                  'Evening Reflection',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          
          // Chat Area
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _localMessages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _localMessages.length) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: Colors.indigo,
                          child: Icon(Icons.auto_awesome, size: 16, color: Colors.white),
                        ),
                        Gap(8),
                        Text('Thinking...', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  );
                }
                
                final msg = _localMessages[index];
                final isUser = msg.role == 'user';
                
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                    decoration: BoxDecoration(
                      color: isUser ? Colors.indigo : Colors.grey[100],
                      borderRadius: BorderRadius.circular(16).copyWith(
                        bottomRight: isUser ? Radius.zero : null,
                        bottomLeft: !isUser ? Radius.zero : null,
                      ),
                    ),
                    child: Text(
                      msg.content,
                      style: TextStyle(color: isUser ? Colors.white : Colors.black87),
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Input Area
          Padding(
            padding: EdgeInsets.only(
              left: 16, 
              right: 16, 
              bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              top: 8,
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: 'Type your reflection...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Colors.grey[200],
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const Gap(8),
                IconButton.filled(
                  onPressed: _sendMessage,
                  icon: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
