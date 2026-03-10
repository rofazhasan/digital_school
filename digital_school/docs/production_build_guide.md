# Production Build Guide: Rofaz Academy App

Follow these steps to generate a signed production APK or Android App Bundle (AAB) for `rofazacademy.dev`.

## 🛠️ Step 1: Prepare the Web Assets
The app is a high-performance wrapper around the production web site. Ensure Latest configuration is synced.

```bash
# 1. Update Capacitor to point to production (already done in config)
# 2. Sync changes to the Android native project
npx cap sync android
```

## 🎨 Step 2: Generate Beautiful Assets (Icon & Splash)
To make your app look professional, you need a high-quality icon and splash screen.

1.  **Prepare your source images**:
    *   Place a `1024x1024` icon at `assets/icon.png`.
    *   Place a `2732x2732` splash image at `assets/splash.png`.
2.  **Generate native assets**:
    We recommend using the `@capacitor/assets` tool:
    ```bash
    # Install the tool if not present
    npm install @capacitor/assets --save-dev
    
    # Run the generator
    npx capacitor-assets generate --android
    ```

## 📦 Step 3: Build the Android Production App
We will use Android Studio for the final signing to ensure everything is correct.

1.  **Open Android Studio**:
    ```bash
    npx cap open android
    ```
2.  **Wait for Gradle Sync**: Let Android Studio finish indexing the project.
3.  **Generate Signed APK/Bundle**:
    *   Go to **Build** > **Generate Signed Bundle / APK...**
    *   Select **Android App Bundle** (Recommended for Play Store) or **APK**.
    *   Click **Next**.
4.  **Create/Select Key Store**:
    *   If you don't have one, click **Create new...** to generate your production signing key.
    *   **⚠️ IMPORTANT**: Save this file and password securely! You will need it for all future updates.
5.  **Build Variant**:
    *   Select **release** as the destination folder.
    *   Select **release** as the Build Variant.
6.  **Finish**: Android Studio will build your production app.

## ✅ Step 4: Final Verification
Once the build is complete:
- The file will be in `android/app/release/`.
- Install the APK on a physical device to verify that:
    - The Splash Screen looks great.
    - All features (Exams, Login, Signup) work as expected on the production domain.

---
> [!TIP]
> Always run `npx cap sync android` after making changes to your `capacitor.config.ts`.
