# Android Google Login — Package change (`com.astroself.ai` → `com.astrodha.ai`)

## Pehle kya chal raha tha

`google-servicesself.json` → Firebase project **`astroself-b6835`** (`1061722426474`), package **`com.astroself.ai`**

## Ab kya hai

Package change: **`com.astrodha.ai`** — Google ko naya package + SHA-1 Firebase mein register karna **zaroori** hai.

**Rule:** `google-services.json`, `webClientId`, and SHA-1 must be from the **same** Firebase project (`astroself-b6835`).

---

## Your SHA-1 fingerprints (from `./gradlew signingReport`)

| Build | SHA-1 |
|-------|--------|
| **Debug** | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` |
| **Release** | `DA:BC:D0:CA:91:29:DF:16:DB:8E:3A:CB:36:BD:33:AF:2D:C7:8B:EE` |

Package name: **`com.astrodha.ai`**

---

## Step 1 — Firebase Console (purana working project)

1. Open: https://console.firebase.google.com/project/astroself-b6835/settings/general
2. Scroll to **Your apps**
3. **Add app** → Android → package name: **`com.astrodha.ai`** → Register  
   (Purana `com.astroself.ai` app rehne do — naya app alag add karo)

## Step 2 — Add SHA-1 fingerprints

1. On the same app card → **Add fingerprint**
2. Paste **Debug** SHA-1 → Save
3. **Add fingerprint** again → paste **Release** SHA-1 → Save

You must see **2 fingerprints** listed.

## Step 3 — Enable Google Sign-In

1. **Authentication** → **Sign-in method**
2. **Google** → **Enable** → support email → **Save**

## Step 4 — Download `google-services.json`

1. Project settings → Android `com.astrodha.ai`
2. Click **google-services.json** download
3. Replace file:

   `android/app/google-services.json`

4. Open the file — **`package_name": "com.astrodha.ai"`** wala client block use hoga
5. **`oauth_client` empty nahi hona chahiye** (Android `client_type: 1` + Web `client_type: 3`)

## Step 5 — `webClientId` (already set in code)

Purane working project ka Web client:

```
1061722426474-3aivdpu11tr8i1h52a54ovkrv8ls021p.apps.googleusercontent.com
```

Downloaded json mein `client_type: 3` alag ho to `googleAuthService.ts` update karo.

## Step 6 — OAuth consent screen (if first time)

1. https://console.cloud.google.com/apis/credentials?project=astroself-b6835
2. **OAuth consent screen** → fill app name, emails
3. Add your Gmail under **Test users** if app is in Testing mode

## Step 7 — Clean install on device

```bash
# Uninstall old app (clears cached Google config)
adb uninstall com.astrodha.ai

cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Step 8 — Test

1. Open app → **Login with Google**
2. Pick Google account
3. Should not show `DEVELOPER_ERROR`

---

## Checklist before testing

- [ ] Firebase project: `astroself-b6835` (same as `google-servicesself.json`)
- [ ] Package: `com.astrodha.ai`
- [ ] Debug SHA-1 added
- [ ] Release SHA-1 added
- [ ] Google provider enabled in Authentication
- [ ] `google-services.json` downloaded **after** adding SHA-1
- [ ] `oauth_client` has `client_type: 1` (Android) entries
- [ ] `webClientId` starts with `1061722426474-` (matches `project_number`)
- [ ] App uninstalled and rebuilt

---

## Still failing?

1. Wait 5–10 minutes after adding SHA-1 (Google caches credentials)
2. Confirm you are testing **debug** build (uses debug keystore SHA-1)
3. Send the downloaded `google-services.json` `oauth_client` section (remove API keys if sharing publicly)

---

## Wrong client type note

The file `client_secret_128164235380-....json` is type **"installed"** (Desktop).  
For React Native you need **Web application** OAuth client from the **same** project as Firebase (`279160023240-...`).
