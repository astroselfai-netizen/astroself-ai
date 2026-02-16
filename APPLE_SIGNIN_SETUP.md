# Apple Sign In Setup Guide

This guide will help you set up "Sign in with Apple" authentication for your React Native app to comply with App Store Guideline 4.8.

## 📋 Prerequisites

- Xcode 11.0 or later
- iOS 13.0 or later
- Apple Developer Account
- React Native app with iOS project configured

## 🔧 Step 1: Install Package

```bash
npm install @invertase/react-native-apple-authentication
# or
yarn add @invertase/react-native-apple-authentication
```

## 📱 Step 2: iOS Pod Installation

Navigate to the `ios` directory and install pods:

```bash
cd ios
pod install
cd ..
```

## 🍎 Step 3: Configure Xcode Project

### 3.1 Open Xcode Project

1. Open `ios/Astroself.xcworkspace` (NOT `.xcodeproj`) in Xcode
2. Select your project in the Project Navigator
3. Select your app target

### 3.2 Add Sign In with Apple Capability

1. Go to **Signing & Capabilities** tab
2. Click the **+ Capability** button
3. Search for and add **"Sign In with Apple"**
4. This will automatically add the required entitlements

### 3.3 Verify Entitlements

1. Open `ios/Astroself/Astroself.entitlements` file
2. Ensure it contains:

```xml
<key>com.apple.developer.applesignin</key>
<array>
    <string>Default</string>
</array>
```

### 3.4 Configure Bundle Identifier

1. Ensure your Bundle Identifier matches your Apple Developer account
2. Go to **Signing & Capabilities** tab
3. Select your **Team** (Apple Developer account)
4. Xcode will automatically manage provisioning profiles

## 🔐 Step 4: Apple Developer Portal Configuration

### 4.1 Enable Sign In with Apple

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Select **Identifiers** → Your App ID
4. Enable **"Sign In with Apple"** capability
5. Click **Save**

### 4.2 Configure App ID (if needed)

1. In **Identifiers**, select your App ID
2. Under **Capabilities**, ensure **Sign In with Apple** is checked
3. Click **Configure** next to Sign In with Apple
4. Select **Enable as a primary App ID**
5. Click **Save**

## 📝 Step 5: Update Info.plist (if needed)

The package should handle this automatically, but verify:

1. Open `ios/Astroself/Info.plist`
2. Ensure minimum iOS version is 13.0:

```xml
<key>MinimumOSVersion</key>
<string>13.0</string>
```

## 🧪 Step 6: Testing

### 6.1 Test on Physical Device

**Important**: Sign in with Apple **only works on physical iOS devices**, not on the iOS Simulator.

1. Connect your iPhone/iPad (iOS 13+)
2. Build and run the app:
   ```bash
   npm run ios
   # or
   react-native run-ios --device
   ```

### 6.2 Test Scenarios

1. **First Time Sign In**:
   - Tap "Sign in with Apple" button
   - Apple Sign In sheet appears
   - Grant permission for name and email
   - Verify user is created in your backend

2. **Subsequent Sign In**:
   - Tap "Sign in with Apple" button
   - Apple Sign In sheet appears
   - Email may be hidden (Apple privacy feature)
   - Verify user can login with existing account

3. **Cancel Flow**:
   - Tap "Sign in with Apple" button
   - Cancel the Apple Sign In sheet
   - Verify error handling works correctly

## 🚨 Troubleshooting

### Issue: "Sign in with Apple is not available"

**Solution**:
- Ensure you're testing on a physical device (not simulator)
- Verify iOS version is 13.0 or later
- Check that capability is added in Xcode
- Verify App ID has Sign In with Apple enabled in Developer Portal

### Issue: "Invalid client" error

**Solution**:
- Verify Bundle Identifier matches Apple Developer account
- Check that Sign In with Apple is enabled for your App ID
- Ensure provisioning profile includes the capability

### Issue: Button doesn't appear

**Solution**:
- The button only shows on iOS devices (iOS 13+)
- Check `AppleLoginButton` component availability check
- Verify `appleAuth.isSupported()` returns true

### Issue: Email is null on second login

**This is expected behavior!** Apple only provides email on the first sign-in. On subsequent logins, you should use the stored `appleId` to identify the user.

## 📚 Code Structure

### Files Created/Modified:

1. **`src/services/appleAuthService.ts`**
   - Handles Apple authentication logic
   - Integrates with backend API
   - Manages user registration/login flow

2. **`src/components/AppleLoginButton/index.tsx`**
   - Reusable Apple Sign In button component
   - Only renders on iOS devices
   - Uses native Apple button styling

3. **`src/screen/login/index.tsx`**
   - Added Apple login button below Google button
   - Integrated `handleAppleLogin` function

4. **`src/screen/Register/index.tsx`**
   - Added Apple signup button below Google button
   - Integrated `handleAppleSignup` function

5. **`src/services/serviceFactory.ts`**
   - Registered `AppleAuthService` in service factory

## 🔒 Security Considerations

1. **Identity Token Validation**:
   - The `identityToken` is validated before sending to backend
   - Backend should verify the token with Apple's servers

2. **Token Storage**:
   - Identity tokens are NOT stored in local storage
   - Only access tokens from your backend are stored

3. **User Privacy**:
   - Email may be null on subsequent logins (Apple privacy feature)
   - Use `appleId` as the primary identifier
   - Store user email on first login

## 📊 Backend Integration

The service sends the following data to your backend:

```typescript
{
  appleId: string,        // Apple unique user ID
  email: string | null,   // Email (may be null on subsequent logins)
  firstName: string,      // First name (from first login)
  lastName: string,       // Last name (from first login)
  identityToken: string   // JWT token from Apple (for verification)
}
```

### Backend API Endpoints Used:

1. **Login**: `POST /mobile/login`
   - Tries to login existing user first
   - Uses email and generated password

2. **Register**: `POST /users/mobile/register`
   - Creates new user if login fails
   - Uses Apple user data

## ✅ App Store Compliance

This implementation complies with **App Store Guideline 4.8**:
- ✅ Sign in with Apple is available as an option
- ✅ Placed alongside other social login options (Google)
- ✅ Only shown on iOS devices (iOS 13+)
- ✅ Proper error handling
- ✅ Privacy-compliant (handles null email)

## 🎯 Next Steps

1. **Install the package** (if not done):
   ```bash
   npm install @invertase/react-native-apple-authentication
   cd ios && pod install && cd ..
   ```

2. **Configure Xcode**:
   - Add Sign In with Apple capability
   - Verify entitlements

3. **Configure Apple Developer Portal**:
   - Enable Sign In with Apple for your App ID

4. **Test on Physical Device**:
   - Build and run on iPhone/iPad
   - Test first login and subsequent logins

5. **Backend Verification** (if needed):
   - Verify identity tokens on your backend
   - Handle null email cases
   - Store appleId for user identification

## 📖 Additional Resources

- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [React Native Apple Authentication](https://github.com/invertase/react-native-apple-authentication)
- [App Store Review Guidelines 4.8](https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple)

---

**Note**: Remember to test on a physical iOS device. The iOS Simulator does not support Sign in with Apple.

