# Release Keystore से SHA-1 निकालने के लिए Instructions

## 📋 Keystore Information
- **File**: `android/releaes.jks`
- **Alias**: `key0`
- **Type**: PKCS12

## 🔑 SHA-1 Extract करने के लिए

### Method 1: Interactive (Password prompt)
```bash
cd android
keytool -list -v -keystore releaes.jks -alias key0
```
Password enter करें जब prompt हो।

### Method 2: Direct (Password के साथ)
```bash
cd android
keytool -list -v -keystore releaes.jks -alias key0 -storepass <YOUR_PASSWORD>
```

### Method 3: Only SHA-1 निकालने के लिए
```bash
cd android
keytool -list -v -keystore releaes.jks -alias key0 -storepass <YOUR_PASSWORD> | grep SHA1
```

## 📝 Output Format
आपको इस तरह का output मिलेगा:
```
SHA1: AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD
```

## ✅ Next Steps
1. SHA-1 fingerprint copy करें (format: `AA:BB:CC:DD:...`)
2. Firebase Console में add करें (package: `com.astroself.ai`)
3. Google Cloud Console में add करें (OAuth Client)
4. Updated `google-services.json` download करें

## ⚠️ Important Notes
- यह SHA-1 आपके **local keystore** का है
- **Play Store AAB** के लिए आपको **Play Store certificate** का SHA-1 चाहिए
- Play Store certificate का SHA-1 Play Console से मिलेगा (App signing section)

## 🔄 Play Store vs Local Keystore
- **Local APK**: इस `releaes.jks` का SHA-1 use होगा ✅
- **Play Store AAB**: Play Store certificate का SHA-1 चाहिए ⚠️

दोनों SHA-1 add करें ताकि दोनों cases में काम करे!

