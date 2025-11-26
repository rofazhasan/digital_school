#!/bin/bash

echo "🤖 TinyLlama Model Setup for Study Companion"
echo "=============================================="
echo ""

# Set paths
ADB="/Users/md.rofazhasanrafiu/Library/Android/sdk/platform-tools/adb"
MODEL_URL="https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
MODEL_FILE="chat_model.gguf"
TEMP_DIR="/tmp/study_companion_models"

# Create temp directory
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# Check if model already downloaded
if [ -f "$MODEL_FILE" ]; then
    echo "✅ Model file found: $MODEL_FILE"
else
    echo "📥 Downloading TinyLlama model..."
    echo "This will take 5-10 minutes (~600MB)"
    echo ""
    
    # Download with curl (shows progress)
    curl -L -o "$MODEL_FILE" "$MODEL_URL"
    
    if [ $? -ne 0 ]; then
        echo "❌ Download failed!"
        echo ""
        echo "Please download manually:"
        echo "1. Go to: https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF"
        echo "2. Download: tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
        echo "3. Save to: $TEMP_DIR/chat_model.gguf"
        echo "4. Run this script again"
        exit 1
    fi
    
    echo ""
    echo "✅ Download complete!"
fi

echo ""
echo "📱 Pushing model to emulator..."
echo "This will take 2-5 minutes..."
echo ""

# Push to emulator's accessible location first
$ADB push "$MODEL_FILE" /sdcard/Download/chat_model.gguf

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Model uploaded to emulator!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Hot restart the app (press 'r' in flutter terminal)"
    echo "2. The app will automatically detect the model in /sdcard/Download/"
    echo "3. Go to Settings → AI Model Status to verify"
    echo ""
    echo "🎉 Done!"
else
    echo ""
    echo "❌ Upload failed"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure emulator is running"
    echo "2. Run: $ADB devices"
    echo "3. Should show: emulator-5554"
fi
