# 🚀 Host AI Models on GitHub Releases (5 Minutes)

## Why GitHub Releases?
- ✅ **Free** - No cost
- ✅ **Fast** - Good download speeds
- ✅ **Reliable** - 99.9% uptime
- ✅ **Easy** - Just drag and drop
- ✅ **No limits** - Files up to 2GB each

---

## 📋 Step-by-Step Guide

### Step 1: Download the Models (One Time)

**TinyLlama Chat Model (~600MB):**
```bash
# Open this URL in your browser:
https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/blob/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf

# Click the download button (↓)
# Save to Downloads folder
# Rename to: chat_model.gguf
```

**Embedding Model (~25MB):**
```bash
# For now, you can skip this or use a placeholder
# The chat model is the important one for AI insights
```

---

### Step 2: Create GitHub Release

**Option A: Using GitHub Website (Easiest)**

1. **Go to your repository:**
   ```
   https://github.com/YOUR_USERNAME/study_companion
   ```
   (Or create a new repo if you don't have one)

2. **Click "Releases"** (right sidebar)

3. **Click "Create a new release"**

4. **Fill in details:**
   - Tag: `v1.0.0`
   - Title: `AI Models v1.0`
   - Description: `TinyLlama and embedding models for Study Companion`

5. **Upload files:**
   - Drag `chat_model.gguf` to the upload area
   - Wait for upload to complete (~5 minutes)

6. **Click "Publish release"**

7. **Get download URL:**
   - Right-click on `chat_model.gguf`
   - Copy link address
   - Should look like:
     ```
     https://github.com/YOUR_USERNAME/study_companion/releases/download/v1.0.0/chat_model.gguf
     ```

---

### Step 3: Update App with URLs

**Edit this file:**
```
lib/core/services/model_download_service.dart
```

**Replace these lines:**
```dart
// OLD (lines 13-14):
static const String chatModelUrl = 'https://huggingface.co/...';
static const String embeddingModelUrl = 'https://huggingface.co/...';

// NEW:
static const String chatModelUrl = 'https://github.com/YOUR_USERNAME/study_companion/releases/download/v1.0.0/chat_model.gguf';
static const String embeddingModelUrl = ''; // Leave empty for now
```

---

### Step 4: Test It!

```bash
# 1. Rebuild app
flutter run -d emulator-5554

# 2. In app: Settings → Download AI Models
# 3. Tap "Download Models"
# 4. Watch progress bar!
# 5. After download: AI works everywhere!
```

---

## 🎯 Alternative: Use Hugging Face Direct Links

**Even Easier (No Upload Needed):**

Just use Hugging Face's direct download links:

```dart
// In model_download_service.dart:
static const String chatModelUrl = 
  'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

static const String embeddingModelUrl = ''; // Skip for now
```

**Pros:**
- ✅ No upload needed
- ✅ Works immediately
- ✅ Hugging Face is reliable

**Cons:**
- ⚠️ Slower download (Hugging Face can be slow)
- ⚠️ May require authentication in future

---

## 📝 Quick Setup Script

I'll create a script that updates the URLs for you:

```bash
# Run this after you get your GitHub release URL:
./update_model_urls.sh "YOUR_GITHUB_URL_HERE"
```

---

## 🎯 Recommended Approach

**For Testing (Right Now):**
Use Hugging Face direct link - works immediately!

**For Production (Later):**
Upload to GitHub Releases - faster downloads for users

---

## 💡 Pro Tips

### If You Don't Have a GitHub Repo:
1. Go to https://github.com/new
2. Name: `study-companion-models`
3. Public repository
4. Create
5. Go to Releases
6. Upload models

### File Size Limits:
- GitHub: 2GB per file ✅
- TinyLlama: 600MB ✅
- Embedding: 25MB ✅
- **Both fit easily!**

### Download Speed:
- GitHub: ~5-10 MB/s
- Hugging Face: ~1-3 MB/s
- **GitHub is faster!**

---

## 🚀 Fastest Way (30 Seconds)

**Just use Hugging Face direct link:**

1. Open `lib/core/services/model_download_service.dart`
2. Replace line 13 with:
   ```dart
   static const String chatModelUrl = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
   ```
3. Save
4. Hot restart app
5. Test download!

**That's it!** 🎉

---

## 📊 What Users Will See

1. **Settings → Download AI Models**
2. **Beautiful screen with:**
   - "Chat Model - TinyLlama 1.1B (~60MB)" card
   - "Download Models" button
3. **Tap button**
4. **Progress bar fills up (1-5 minutes)**
5. **Green checkmark ✅**
6. **"AI Models Ready!"**
7. **AI works in Analytics!**

---

## 🎉 Summary

**Easiest Option (30 seconds):**
- Use Hugging Face direct link
- Update one line of code
- Works immediately

**Best Option (5 minutes):**
- Create GitHub Release
- Upload model file
- Update URL in code
- Faster downloads for users

**Both work perfectly!** Choose based on your time. 🚀

---

## Need Help?

If you want me to:
1. Create the update script
2. Show exact code changes
3. Test the download

Just let me know! I'm here to help! 😊
