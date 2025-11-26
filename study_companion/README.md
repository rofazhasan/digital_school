# Study Companion OS 📚

**Zero-Cost, Private, Offline-First Student Companion.**

Study Companion OS is a Flutter-based application designed to help students focus, learn, and collaborate without relying on expensive subscriptions or constant internet access.

![Banner](https://via.placeholder.com/1200x600?text=Study+Companion+OS)

## ✨ Features

- **🎯 Focus Mode**: Pomodoro timer with "Deep Focus" app blocking (Android).
- **🧠 AI Tutor**: Offline LLM integration (Llama 3) for Q&A, Summaries, and Quizzes.
- **📝 Note Taking**: Markdown support with Semantic Search (Vector Embeddings).
- **📊 Analytics**: Visualize your study habits and streaks.
- **⚔️ Social**: Study Groups, Leaderboards, and 1v1 Battles.
- **☁️ Cloud Sync**: Optional backup via Supabase.

## 🚀 Getting Started

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for detailed setup instructions and version history.

### Quick Start
1.  `flutter pub get`
2.  `dart run build_runner build`
3.  `flutter run`

## 🏗 Architecture

- **Framework**: Flutter (Material 3)
- **State Management**: Riverpod
- **Database**: Isar (Local NoSQL)
- **AI Engine**: `llama_cpp_dart`
- **Navigation**: GoRouter

## 🔒 Privacy

Your data belongs to you. All notes, sessions, and chat history are stored locally on your device. Cloud sync is strictly opt-in.

---
*Built with ❤️ by Antigravity*
