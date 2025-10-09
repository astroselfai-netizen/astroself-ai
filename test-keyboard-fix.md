# Keyboard Fix Test Guide

## Changes Made

### 1. Navigation.js
- Removed conflicting KeyboardAvoidingView configuration
- Set proper behavior: `padding` for iOS, `height` for Android
- Set keyboardVerticalOffset to 0 for both platforms
- Added tabBarHideOnKeyboard: true to hide bottom tabs when keyboard is open

### 2. NakshatraScreen.tsx
- Updated KeyboardAvoidingView behavior:
  - iOS: `padding` behavior
  - Android: `height` behavior
- Set keyboardVerticalOffset to 0 for both platforms
- Added proper keyboard handling for modal dropdown TextInput
- Added KeyboardAvoidingView wrapper around modal content

### 3. TextInput Improvements
- Added proper keyboard props:
  - returnKeyType="search"
  - blurOnSubmit={false}
  - keyboardType="default"
  - autoCorrect={false}
  - autoCapitalize="none"

## Expected Behavior

1. **Bottom Tab**: Should hide when keyboard opens (due to tabBarHideOnKeyboard: true)
2. **No Extra Space**: No excessive space above keyboard
3. **Modal Dropdown**: Should adjust properly when keyboard opens
4. **TextInput**: Should work smoothly with proper keyboard handling

## Test Steps

1. Open the app and navigate to Nakshatra/Charts screen
2. Tap on the member dropdown to open the modal
3. Tap on the search TextInput
4. Verify that:
   - Bottom tab hides when keyboard opens
   - No excessive space above keyboard
   - Modal adjusts properly
   - TextInput works smoothly

## Platform-Specific Notes

- **iOS**: Uses `padding` behavior for KeyboardAvoidingView
- **Android**: Uses `height` behavior for KeyboardAvoidingView
- Both platforms now have keyboardVerticalOffset set to 0
