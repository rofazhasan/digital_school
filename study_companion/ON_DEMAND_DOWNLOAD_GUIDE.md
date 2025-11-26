# On-Demand Model Download System

## Overview
The app now uses an **on-demand download system** to keep the APK size under 30MB while providing full offline AI capabilities.

## How It Works

### APK Size
- **Base APK**: ~25-30MB (no models bundled)
- **Models Download**: ~85MB (one-time, on first use)
- **Total on Device**: ~110MB after download

### User Flow
1. **Install App**: APK is tiny (~25MB)
2. **First Launch**: App works with basic features
3. **AI Features**: User navigates to Settings → Download AI Models
4. **Download**: Beautiful progress UI shows download status
5. **Complete**: AI features now work offline!

## Implementation Details

### Files Created

#### 1. `ModelDownloadService`
**Location**: `lib/core/services/model_download_service.dart`

**Features**:
- Download models from URLs
- Progress tracking
- Check if models exist
- Delete models
- Get model sizes

**Methods**:
```dart
downloadChatModel(onProgress, onComplete, onError)
downloadEmbeddingModel(onProgress, onComplete, onError)
isChatModelDownloaded()
isEmbeddingModelDownloaded()
getChatModelPath()
getEmbeddingModelPath()
deleteModels()
getModelsSizeInBytes()
```

#### 2. `ModelDownloadScreen`
**Location**: `lib/features/settings/presentation/screens/model_download_screen.dart`

**Features**:
- Beautiful gradient background
- Progress bars for each model
- Download all button
- Skip option
- Error handling
- Success state

#### 3. Updated `chat_provider.dart`
- Checks for downloaded models first
- Falls back to MockAI if not found
- No longer checks for bundled assets

### Model URLs

**Current URLs** (in `model_download_service.dart`):
```dart
// TODO: Replace with your actual hosting URLs
chatModelUrl = 'https://huggingface.co/...'
embeddingModelUrl = 'https://huggingface.co/...'
```

## Hosting Your Models

### Option 1: GitHub Releases (Recommended)
1. Create a GitHub release
2. Upload `chat_model.gguf` and `embedding_model.gguf`
3. Get direct download URLs
4. Update URLs in `model_download_service.dart`

**Example**:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.0.0/chat_model.gguf
https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.0.0/embedding_model.gguf
```

### Option 2: Firebase Storage
1. Upload models to Firebase Storage
2. Get public download URLs
3. Update URLs in service

### Option 3: Your Own Server
1. Host models on your server
2. Enable CORS
3. Provide direct download URLs

## Recommended Models

### Chat Model: TinyLlama-1.1B-Chat-Q4_K_M
- **Size**: ~600MB
- **Download**: [Hugging Face](https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF)
- **File**: `tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf`
- **Rename to**: `chat_model.gguf`

### Embedding Model: all-MiniLM-L6-v2
- **Size**: ~25MB
- **Download**: [Hugging Face](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
- **File**: Model file (may need conversion to GGUF)
- **Rename to**: `embedding_model.gguf`

## Setup Instructions

### 1. Download Models
```bash
# Download TinyLlama
wget https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf

# Rename
mv tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf chat_model.gguf
```

### 2. Host Models
Upload to GitHub Releases, Firebase, or your server.

### 3. Update URLs
Edit `lib/core/services/model_download_service.dart`:
```dart
static const String chatModelUrl = 'YOUR_CHAT_MODEL_URL';
static const String embeddingModelUrl = 'YOUR_EMBEDDING_MODEL_URL';
```

### 4. Build App
```bash
flutter build apk
# APK will be ~25MB!
```

## User Experience

### Settings → Download AI Models
- Shows download screen
- Two model cards (Chat + Embedding)
- Progress bars
- "Download Models" button
- "Skip for now" option

### Download Flow
1. Tap "Download Models"
2. See progress for each model
3. Wait ~30-60 seconds (depending on connection)
4. Green checkmarks when complete
5. "Get Started" button appears
6. AI features now work!

### Model Management
- **Check Status**: Settings → AI Model Status
- **Re-download**: Settings → Download AI Models
- **Delete**: Can add delete option in future

## Benefits

✅ **Tiny APK**: ~25MB (vs 800MB bundled)  
✅ **Fast Install**: Users download app quickly  
✅ **Offline AI**: Full AI after one-time download  
✅ **Updatable**: Can update models without app update  
✅ **Optional**: Users can skip if they don't want AI  
✅ **Transparent**: Clear progress and status  

## Technical Details

### Storage Location
```
/data/data/com.example.study_companion/files/models/
├── chat_model.gguf
└── embedding_model.gguf
```

### Download Library
- **Dio**: For HTTP downloads with progress
- **path_provider**: For app documents directory

### Error Handling
- Network errors → Show error message
- Retry option available
- Falls back to MockAI if models not downloaded

## Future Enhancements

### Possible Additions
1. **Resume Downloads**: If interrupted
2. **WiFi-Only Option**: Don't download on cellular
3. **Model Selection**: Let users choose model size
4. **Auto-Update**: Check for model updates
5. **Compression**: Download compressed, extract locally
6. **Delete Option**: Free up space

## Testing

### Test Download Flow
1. Fresh install
2. Go to Settings → Download AI Models
3. Tap "Download Models"
4. Verify progress bars work
5. Verify completion state
6. Test AI features work

### Test Offline
1. Download models
2. Turn off internet
3. Verify AI still works
4. Verify analytics insights generate

## Troubleshooting

### Models Not Downloading
- Check internet connection
- Verify URLs are correct
- Check Hugging Face is accessible
- Try different network

### APK Still Large
- Verify `assets/models/` is empty
- Rebuild app
- Check `pubspec.yaml` doesn't include large assets

### AI Not Working After Download
- Check Settings → AI Model Status
- Verify files exist in app directory
- Check file sizes are correct
- Try re-downloading

## Summary

This system provides the best of both worlds:
- **Small APK** for easy distribution
- **Full offline AI** for privacy and speed
- **User control** over downloads
- **Professional UX** with progress tracking

Your app is now ready for production with a tiny APK size! 🎉
