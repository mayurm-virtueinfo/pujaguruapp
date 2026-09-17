# PujaGuruApp CI/CD Documentation (Fastlane + GitHub Actions)

This document provides complete instructions for executing, maintaining, and managing the CI/CD pipeline for **PujaGuruApp** (Android & iOS) using **Fastlane** and **GitHub Actions**.

---

## 1. Workflows Overview

| Workflow | Platform | Environment | Target Output | Distribution Target | Safety Rule |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Android Development Release APK** | Android | Development | `.apk` | **Firebase App Distribution** | NOT uploaded to Google Play |
| **Android Development Release AAB** | Android | Development | `.aab` | **GitHub Actions Artifact** | **NO Google Play Console upload** |
| **Android Production Release APK** | Android | Production | `.apk` | **Firebase App Distribution** | For QA/testing; NOT published to Play Store |
| **Android Production Release AAB** | Android | Production | `.aab` | **GitHub Actions Artifact** | **NO Google Play Console upload** |
| **iOS TestFlight Build & Upload** | iOS | Production | `.ipa` | **Apple TestFlight** (Internal) | **NO App Store review or release** |

---

## 2. Version Management & Synchronization

All release workflows are manually triggered via `workflow_dispatch` and accept two central parameters:

| Input Parameter | Description | Android Mapping | iOS Mapping | Example |
| :--- | :--- | :--- | :--- | :--- |
| `version_name` | Semantic / Display release version string | `versionName` | `MARKETING_VERSION` | `1.0.8` |
| `version_code` | Monotonically increasing build integer (`> 0`) | `versionCode` | `CURRENT_PROJECT_VERSION` | `17` |

### How Versioning is Injected:
* **Android**: `android/app/build.gradle` dynamically reads project properties `VERSION_CODE` and `VERSION_NAME` passed from Fastlane via Gradle properties (`-PVERSION_CODE` and `-PVERSION_NAME`). If not provided (such as in local builds), it safely falls back to default values.
* **iOS**: Fastlane's `build_app` (`gym`) passes `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` directly via `xcargs` without modifying git-tracked Xcode project files.

---

## 3. How to Run Workflows

### A. Via GitHub Actions (Web UI)
1. Go to your GitHub repository -> **Actions** tab.
2. In the left sidebar, select the desired workflow:
   - `Android Development Release APK`
   - `Android Development Release AAB`
   - `Android Production Release APK`
   - `Android Production Release AAB`
   - `iOS TestFlight Build & Upload`
3. Click **Run workflow**.
4. Enter:
   - **Release Version Name** (e.g. `1.0.8`)
   - **Release Version Code** (e.g. `17`)
5. Click the green **Run workflow** button.

### B. Via Local Fastlane Execution (Dry Run / Testing)

Ensure gems are installed:
```bash
bundle install
```

#### Android Development APK:
```bash
bundle exec fastlane android development_apk version_name:1.0.8 version_code:17
```

#### Android Development AAB:
```bash
bundle exec fastlane android development_aab version_name:1.0.8 version_code:17
```

#### Android Production APK:
```bash
bundle exec fastlane android production_apk version_name:1.0.8 version_code:17
```

#### Android Production AAB:
```bash
bundle exec fastlane android production_aab version_name:1.0.8 version_code:17
```

#### iOS TestFlight:
```bash
bundle exec fastlane ios testflight version_name:1.0.8 version_code:17
```

---

## 4. Required GitHub Secrets (Reference by Name Only)

Configure these secrets in GitHub under **Settings -> Secrets and variables -> Actions**:

### Android Secrets
* `ANDROID_KEYSTORE_BASE64`: Base64-encoded Android release keystore (`.keystore` file).
* `ANDROID_RELEASE_STORE_PASSWORD`: Keystore store password.
* `ANDROID_RELEASE_KEY_ALIAS`: Keystore key alias (e.g. `pujaguru`).
* `ANDROID_RELEASE_KEY_PASSWORD`: Keystore key password.
* `FIREBASE_APP_ID_DEV`: Firebase Android App ID for Development/Staging.
* `FIREBASE_APP_ID_PROD`: Firebase Android App ID for Production.
* `FIREBASE_SERVICE_ACCOUNT_KEY`: Google service account JSON with Firebase App Distribution Admin role.
* `FIREBASE_TOKEN`: (Optional alternative) Firebase CLI authentication token.
* `FIREBASE_TESTER_GROUPS`: (Optional) Comma-separated Firebase tester groups (defaults to `internal-testers`).

### iOS Secrets
* `APP_STORE_CONNECT_KEY_ID`: App Store Connect API Key ID (10 characters).
* `APP_STORE_CONNECT_ISSUER_ID`: App Store Connect Issuer UUID.
* `APP_STORE_CONNECT_API_KEY_KEY`: App Store Connect API Private Key (`.p8` file content or Base64).
* `IOS_CERTIFICATE_BASE64`: Apple Distribution Certificate (`.p12` encoded in Base64).
* `IOS_CERTIFICATE_PASSWORD`: Password for the `.p12` distribution certificate.
* `IOS_PROVISION_PROFILE_BASE64`: App Store / TestFlight Distribution Provisioning Profile (`.mobileprovision` encoded in Base64).
* `KEYCHAIN_PASSWORD`: (Optional) Temporary password for CI keychain creation.

### Environment Secrets
* `ENV_DEVELOPMENT`: Complete content of `.env.development` file (based on `.env.example`).
* `ENV_PRODUCTION`: Complete content of `.env.production` file (based on `.env.example`).

---

## 5. Explicit Safety & Publishing Rules

### 🚫 Google Play Console Safety
* **Zero Google Play Upload**: Fastlane `supply` or `upload_to_play_store` is **NOT configured** anywhere in the repository or workflows.
* **AAB Storage Only**: All AAB workflows only build the `.aab` bundle and save it as a downloadable GitHub Actions Artifact.
* **APK Testing Only**: APK files are uploaded exclusively to Firebase App Distribution for internal testers and are never submitted to Google Play.

### 🚫 App Store Safety
* **TestFlight Only**: The iOS workflow uploads the archive to TestFlight with:
  ```ruby
  skip_submission: true
  skip_waiting_for_build_processing: true
  distribute_external: false
  ```
* **No App Store Submission**: The build is never submitted for App Store review.
* **No Automatic Release**: There is no action or step that promotes or publishes the app to the live App Store.

---

## 6. Security & Credential Hygiene
* Sensitive signing credentials (`.keystore`, `.p12`, `keystore.properties`) and environment files are generated dynamically in runner memory/temp space during workflow execution and **shredded/deleted in post-build cleanup steps**.
* Workflows run with minimal required permissions (`permissions: contents: read`).
* Concurrency groups prevent concurrent race conditions on release branches.
