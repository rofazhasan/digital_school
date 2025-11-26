# Release Notes - v0.1.0-beta

**Study Companion OS** is now in Beta! This release brings a comprehensive suite of offline-first study tools, social features, and optional cloud sync.

## 🚀 Key Features

### 1. Focus Mode
- **Pomodoro Timer**: Customizable timer with Focus, Short Break, and Long Break phases.
- **Deep Focus Lock**: (Android Only) Blocks other apps during study sessions to prevent distractions.
- **Analytics**: Track your daily study time and session history.

### 2. AI Learning Tools (Offline-First)
- **AI Tutor**: Chat with a local LLM (Llama 3 via GGUF) for instant answers without internet.
- **Quiz Generator**: Create multiple-choice quizzes from any topic or text.
- **Summary Generator**: Summarize long notes into concise bullet points.
- **Exam Generator**: Simulate timed exams for your subjects.
- **Smart Review**: Spaced Repetition System (SRS) for flashcards using the SM-2 algorithm.

### 3. Study Management
- **Subject Tracker**: Organize chapters and track completion progress.
- **Notes & Flashcards**: Rich text notes and flashcards with semantic search.
- **Daily Routines**: Schedule your study habits.

### 4. Social Features
- **Study Groups**: Create or join groups to chat with peers (Mock/P2P).
- **Leaderboards**: Compete for the highest study streak and weekly hours.
- **Battle Mode**: 1v1 real-time quiz battles against opponents.

### 5. Cloud Sync (Optional)
- **Supabase Integration**: Backup your data to your own Supabase project.
- **Privacy First**: Data remains local-only unless you explicitly enable sync.

## 🛠 Setup & Installation

### Prerequisites
- Flutter SDK (3.0+)
- Android Studio / Xcode
- A GGUF Model file (e.g., `Llama-3-8B-Instruct-Q4_K_M.gguf`)

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/study_companion.git
    ```
2.  **Install dependencies**:
    ```bash
    flutter pub get
    ```
3.  **Generate code**:
    ```bash
    dart run build_runner build --delete-conflicting-outputs
    ```
4.  **Run the app**:
    ```bash
    flutter run
    ```

### AI Model Setup
1.  Download a GGUF model (recommended: Llama 3 8B Quantized).
2.  Go to **Learning** -> **AI Tutor** -> **Settings**.
3.  Select the downloaded `.gguf` file.

## 🐛 Known Issues
- **Deep Focus**: Only works on Android. Requires "Device Owner" or "App Pinning" permissions.
- **Social Features**: Currently running on a Mock Service for demonstration. Connects to Supabase for Sync only.
- **Performance**: AI inference speed depends on device hardware.

## 🤝 Contributing
Feedback is welcome! Please report bugs or suggest features in the issues tab.
