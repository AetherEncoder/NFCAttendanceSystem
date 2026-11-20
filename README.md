# NFC Attendance System

An Android attendance app for a college student council. Students tap a compatible student ID on an NFC-capable phone to record attendance at council events. NFC tapping is the core attendance method, replacing the QR-scanning workflow in the owner's idea.

Council members register students individually and save registrations locally, then explicitly upload them to Google Sheets after reconciliation. Before an event session, the phone downloads the latest student/card list. Scanning and attendance saves happen locally; attendance is uploaded in a batch after the session, with duplicate/conflict checks against the latest shared records. Official student-list importing is excluded. The actual cards' readability and identifier stability still need verification.

The repository now includes a local Android prototype: scan an NFC card, enter a student's details, save on the phone, and scan again to display the saved name. Student number and course/section are optional. All registration data is kept in SQLite on that phone, including across app restarts. No attendance or cloud synchronization is implemented yet.

## Run the prototype

Requires Node.js 22.13+ (Node 26 is used for the checks here), npm, JDK 21, the Android SDK, and an NFC-capable Android phone with USB debugging enabled. Expo Go cannot load the NFC module.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npx expo-doctor
npm run android
adb devices -l
adb -s <phone-serial> install -r artifacts/nfc-attendance-prototype.apk
adb -s <phone-serial> shell am start -n com.nfccouncil.attendance/.MainActivity
```

`npm run android` creates a standalone ARM64 release-mode prototype APK with bundled JavaScript; it works without Metro or the USB cable. The prototype uses the generated Android template's debug signing key and is not a production-signed release. Generated native files and APKs are ignored. The build script finds `~/Android/Sdk` and `~/Android/jdk` when the standard environment variables are unset, limits Gradle workers and CMake compile/link concurrency, and limits memory with systemd when available. Set `ANDROID_HOME` and `JAVA_HOME` for other installations. The build targets Android 7+ ARM64 phones.

For JavaScript development, use `npx expo run:android --device` to install a debug build, then `adb -s <phone-serial> reverse tcp:8081 tcp:8081` and `npm start`. The standalone prototype does not use the development server.

## Try it on a real card

1. Enable NFC, unlock the phone, and open **NFC Attendance**.
2. Hold the student ID against the phone's NFC antenna, usually near the upper back. The app displays the UID and detected NFC technologies.
3. For an unknown card, enter the full name and optional details, then tap **Save student on phone**. Scanning pauses during entry so another card cannot replace the form's UID.
4. Remove and tap the card again to see the saved student. Known-card lookup stays ready for the next card.
5. Close and reopen the app and tap again to confirm persistence. Repeat with another card and several removal/re-tap cycles to check whether the actual IDs stay stable.

The app reads the identifier without writing to the card. A UID identifies the registered card, not its holder. Some IDs use unsupported technology or changing identifiers; actual card compatibility remains a physical test. Data stays in app-private phone storage, Android backup is disabled, and there is no upload feature. Uninstalling or clearing app storage erases registrations. This prototype supports registration and lookup only; editing, deletion, card replacement, event attendance, and sync are not implemented.

## Project documentation

- [Context and confirmed requirements](CONTEXT.md)
- [Implementation plan and research](IMPLEMENTATION_PLAN.md)
- [Feature scope and implementation status](FEATURES.md)
- [Excluded scope and future suggestions](SUGGESTIONS.md)
- [Progress](PROGRESS.md)
- [Project guidance](AGENTS.md)

The app follows the neighboring mobile projects' Expo, React Native, TypeScript, and Expo Router approach, with SQLite for durable local data. Google Sheets remains the selected future shared store; an authenticated Apps Script batch sync service is proposed. The current prototype is entirely local. Package versions are locked in package-lock.json.
