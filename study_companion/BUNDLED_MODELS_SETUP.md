# Bundled Llama Models Setup Guide

## Overview
The app now automatically detects and uses Llama models bundled in the `assets/models/` directory. No user configuration required!

## How It Works

1. **Auto-Detection**: On first launch, the app checks for bundled models
2. **Auto-Copy**: Models are copied from assets to app documents directory
3. **Auto-Load**: AI services automatically initialize with bundled models
4. **Fallback**: If no bundled models, app uses MockAI service

## Setup Instructions

### For Developers (Building the App)

1. **Download Models**:
   ```bash
   # Recommended models:
   # Chat: Llama-3.2-1B-Instruct-Q4_K_M.gguf (~800MB)
   # Embedding: all-MiniLM-L6-v2-Q4_K_M.gguf (~25MB)
   ```

2. **Place in Assets**:
   ```
   study_companion/
   └── assets/
       └── models/
           ├── chat_model.gguf          # Your chat model
           └── embedding_model.gguf     # Your embedding model
   ```

3. **Build App**:
   ```bash
   flutter build apk
   # or
   flutter build ios
   ```

### For End Users

**No setup required!** The app comes with AI models pre-installed.

## File Naming Convention

- **Chat Model**: MUST be named `chat_model.gguf`
- **Embedding Model**: MUST be named `embedding_model.gguf`

These exact names are required for auto-detection to work.

## Verification

Check Settings → AI Model Status to see:
- ✅ "Bundled Chat Model Active" - Chat model loaded
- ✅ "Bundled Embedding Model Active" - Embedding model loaded
- ℹ️ "No Chat Model" - Place model in assets/models/

## Technical Details

### Auto-Detection Logic
```dart
1. Check AssetManifest.json for 'assets/models/chat_model.gguf'
2. If found, copy to app documents directory
3. Return path to LlamaService
4. If not found, fall back to MockAI
```

### First Launch
- Models are copied once on first launch
- Subsequent launches use already-copied models
- No network required, fully offline

### Storage Impact
- Models stored in app documents directory
- ~825MB for recommended models
- One-time copy operation

## Advantages

✅ **Zero Configuration**: Users don't need to download/select models  
✅ **Offline First**: No internet required after installation  
✅ **Privacy**: All AI processing happens on-device  
✅ **Consistent**: Same models for all users  
✅ **Simple**: Just install and use  

## Troubleshooting

### "No Chat Model" in Settings
- Ensure `chat_model.gguf` is in `assets/models/`
- Rebuild the app
- Check file size (should be >100MB)

### AI Not Responding
- Check Settings → AI Model Status
- Verify models are "Active"
- Try restarting the app

### Build Size Too Large
- Use quantized models (Q4_K_M recommended)
- Consider smaller models for mobile
- Llama-3.2-1B is good balance of size/quality
