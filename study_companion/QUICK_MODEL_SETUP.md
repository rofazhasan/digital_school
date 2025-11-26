# Quick Setup Guide - TinyLlama Model

## Problem
You downloaded TinyLlama but the app still shows "MockAI" because the model isn't in the right location.

## Solution: Manual Setup (For Testing)

### Step 1: Download TinyLlama Model

1. **Go to Hugging Face**:
   ```
   https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/tree/main
   ```

2. **Download this file**:
   ```
   tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf
   ```
   - Size: ~600MB
   - Click the download icon (↓)

3. **Rename the file**:
   ```bash
   mv tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf chat_model.gguf
   ```

4. **Move to project directory**:
   ```bash
   mv chat_model.gguf /Users/md.rofazhasanrafiu/coding/study_companion/
   ```

### Step 2: Push Model to Emulator

**Option A: Using the Script (Easiest)**
```bash
cd /Users/md.rofazhasanrafiu/coding/study_companion
./setup_model.sh
```

**Option B: Manual ADB Commands**
```bash
# 1. Check emulator is running
adb devices

# 2. Create directory on emulator
adb shell "mkdir -p /data/data/com.example.study_companion/files/models"

# 3. Push model file (this takes ~2-5 minutes)
adb push chat_model.gguf /data/data/com.example.study_companion/files/models/chat_model.gguf

# 4. Verify it's there
adb shell "ls -lh /data/data/com.example.study_companion/files/models/"
```

### Step 3: Restart App

1. **Hot restart** the app (press 'R' in terminal)
2. Or **Stop and re-run**:
   ```bash
   # In the terminal where flutter run is running
   Press 'q' to quit
   
   # Then run again
   flutter run -d emulator-5554
   ```

### Step 4: Verify It Works

1. **Check Settings**:
   - Open app
   - Go to Settings
   - Look for "AI Model Status"
   - Should show: "Downloaded Chat Model Active" ✅

2. **Test Analytics**:
   - Complete a focus session
   - Go to Analytics
   - Wait for AI insight
   - Should see real AI response (not MockAI)

---

## Alternative: Use MockAI for Now

If you want to test the app without the model:

**MockAI provides:**
- ✅ Instant responses
- ✅ No download needed
- ✅ Good for UI testing
- ❌ Generic responses (not personalized)

**TinyLlama provides:**
- ✅ Personalized insights
- ✅ Better quality
- ✅ Offline AI
- ❌ Requires download

---

## Troubleshooting

### "Permission denied" when pushing file
```bash
# Try with root
adb root
adb remount
adb push chat_model.gguf /data/data/com.example.study_companion/files/models/chat_model.gguf
```

### "No such file or directory"
The app needs to run at least once to create the directory:
```bash
# 1. Run the app first
flutter run -d emulator-5554

# 2. Wait for it to fully load

# 3. Then push the model
adb push chat_model.gguf /data/data/com.example.study_companion/files/models/chat_model.gguf
```

### Model file not found after push
```bash
# Check if file exists
adb shell "ls -lh /data/data/com.example.study_companion/files/models/"

# If not there, try pushing to a different location
adb push chat_model.gguf /sdcard/Download/chat_model.gguf

# Then move it from within the app
```

### Still showing MockAI
1. Check Settings → AI Model Status
2. If it says "No Chat Model", the file isn't in the right place
3. Try the push command again
4. Restart the app completely

---

## For Production (Later)

For actual users, you'll use the **on-demand download system**:

1. Host model on GitHub Releases
2. Update URL in `model_download_service.dart`
3. Users tap "Download AI Models" in Settings
4. Model downloads automatically

But for testing now, manual push is fastest! 🚀

---

## Quick Commands Summary

```bash
# 1. Download and rename model
# (Do this manually from Hugging Face)

# 2. Push to emulator
cd /Users/md.rofazhasanrafiu/coding/study_companion
./setup_model.sh

# 3. Restart app
# Press 'R' in flutter run terminal

# 4. Test
# Go to Analytics → See AI insight
```

---

## Expected File Locations

**On your Mac:**
```
/Users/md.rofazhasanrafiu/coding/study_companion/chat_model.gguf
```

**On emulator:**
```
/data/data/com.example.study_companion/files/models/chat_model.gguf
```

**Size check:**
```bash
# Should be ~600MB
ls -lh chat_model.gguf
```

---

## Need Help?

If you're stuck, let me know:
1. Where is the model file currently?
2. What error do you see when pushing?
3. What does Settings → AI Model Status show?

I'll help you get it working! 🎯
