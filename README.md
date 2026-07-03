# Preelly

Preelly is a React Native mobile app (iOS & Android) for marketplace listings, reels, chat, and seller flows.

---

## Prerequisites

Complete the official environment setup before running the app:

- [React Native — Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment)

**Required tools**

| Tool | Version |
|------|---------|
| Node.js | `>= 22.11.0` |
| npm or Yarn | Latest stable |
| Watchman | Recommended (macOS) |
| Xcode | Latest (macOS only, for iOS) |
| Android Studio | Latest (for Android) |
| CocoaPods | Via Bundler (see iOS steps) |
| JDK | 17 (for Android builds) |

---

## 1. Clone and install dependencies

```sh
git clone <repository-url>
cd Preelly
npm install
```

---

## 2. Environment variables

Copy the example env file and adjust API URLs if needed:

```sh
cp .env.example .env
```

Example variables (see `.env.example`):

```env
PREELLY_API_BASE_URL_DEV=http://117.254.196.100:5002
PREELLY_API_BASE_URL_PROD=http://117.254.196.100:5002
```

After changing `.env`, restart Metro and rebuild the native app.

---

## 3. Start Metro (JavaScript bundler)

Open a terminal in the project root and run:

```sh
npm start
```

Keep this terminal running while developing.

**Optional — clear Metro cache:**

```sh
npm run start:reset
```

---

## Run on Android

### Step 1: Prepare Android Studio

1. Install [Android Studio](https://developer.android.com/studio).
2. Open **SDK Manager** and install:
   - Android SDK Platform (API 34 or higher recommended)
   - Android SDK Build-Tools
   - Android Emulator
3. Create a virtual device: **Device Manager → Create Device** (e.g. Pixel 6).
4. Ensure `ANDROID_HOME` is set (Android Studio usually configures this).

### Step 2: Start an emulator or connect a device

**Emulator:** Launch a device from Android Studio **Device Manager**.

**Physical device:**

1. Enable **Developer options** and **USB debugging** on the phone.
2. Connect via USB and accept the debugging prompt.
3. Verify connection:

```sh
adb devices
```

### Step 3: Install native dependencies (first time only)

Dependencies are installed with `npm install`. No extra Android-specific install is required beyond Android Studio SDK setup.

### Step 4: Run the app

With Metro running (`npm start`), open a **new terminal** in the project root:

```sh
npm run android
```

This builds the debug APK, installs it on the emulator/device, and launches the app.

### Step 5: Reload during development

- Press **R** twice in the terminal where Metro is running, or
- Open the dev menu: **Ctrl + M** (Windows/Linux) or **Cmd + M** (macOS) → **Reload**

---

## Run on iOS

> iOS builds require **macOS** with **Xcode** installed.

### Step 1: Install Xcode

1. Install Xcode from the Mac App Store.
2. Open Xcode once and accept the license.
3. Install command line tools (if prompted):

```sh
xcode-select --install
```

### Step 2: Install Ruby gems (CocoaPods)

From the project root, run **once** after clone (or after updating native dependencies):

```sh
bundle install
```

### Step 3: Install iOS pods

```sh
cd ios
bundle exec pod install
cd ..
```

Run this again whenever you add or update native iOS dependencies.

### Step 4: Start the iOS Simulator (optional)

```sh
open -a Simulator
```

Or pick a simulator from Xcode → **Window → Devices and Simulators**.

### Step 5: Run the app

With Metro running (`npm start`), open a **new terminal** in the project root:

```sh
npm run ios
```

**Run on a specific simulator:**

```sh
npx react-native run-ios --simulator="iPhone 16"
```

**Run on a connected iPhone:**

1. Connect the device and trust the computer.
2. Open `ios/Preelly.xcworkspace` in Xcode.
3. Select your device as the run target and set your **Signing Team**.
4. Run from Xcode, or:

```sh
npm run ios -- --device
```

### Step 6: Reload during development

- Press **R** in the iOS Simulator, or
- **Cmd + D** → **Reload**

---

## Quick reference

| Task | Command |
|------|---------|
| Start Metro | `npm start` |
| Start Metro (reset cache) | `npm run start:reset` |
| Run Android | `npm run android` |
| Run iOS | `npm run ios` |
| Run tests | `npm test` |
| Lint | `npm run lint` |

---

## Troubleshooting

### Metro / bundler issues

```sh
npm run start:reset
```

### Android build fails

```sh
cd android && ./gradlew clean && cd ..
npm run android
```

### iOS pod install fails

```sh
cd ios
bundle exec pod deintegrate
bundle exec pod install
cd ..
```

### `.env` changes not applied

1. Stop Metro.
2. Rebuild the app: `npm run android` or `npm run ios`.

### More help

- [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment)

---

## Learn more

- [React Native documentation](https://reactnative.dev/docs/getting-started)
- [Fast Refresh](https://reactnative.dev/docs/fast-refresh)
