# Project guidance

These instructions apply to all work in NFCAttendanceSystem.

## Context and documentation

- Read README.md and any existing CONTEXT.md and PROGRESS.md before starting work.
- Update PROGRESS.md after meaningful progress with completed work, remaining tasks, and relevant decisions or limitations.
- Keep FEATURES.md current when features are added or changed. Read it when planning feature work or checking behavior.
- Record features the owner explicitly excludes in SUGGESTIONS.md, and check it before proposing or adding features.
- Keep these instructions current as project conventions become established.

## Implementation

- Follow the project's existing structure, tools, and conventions. Check the actual dependencies and versions before choosing APIs or commands.
- Prefer simple solutions and existing utilities. Avoid unnecessary dependencies, abstractions, and unrelated changes.
- Do not add comments in code. Use clear names and straightforward structure; put explanations in project documentation.
- Keep credentials and secrets out of source files and version control.

## Verification and data

- The prototype uses Expo 57, React Native, TypeScript, Expo Router, npm, react-native-nfc-manager, and expo-sqlite. Routes live in src/app, local records in src/data, and NFC integration in src/lib.
- Use npm run typecheck, npm run lint, npm test, and npx expo-doctor for app checks. npm run android builds a standalone ARM64 APK in artifacts; generated android/ios directories are disposable and ignored. Keep authored native configuration in app.json or config plugins.
- Run one native build at a time with the memory-limited build script. Select a verified USB device serial explicitly for installation and device checks. Installation is authorized for this prototype; do not uninstall/clear storage to test updates.

- Run the available checks relevant to the change, such as linting, type checking, builds, or tests. Report what was checked and any checks that could not run.
- Use isolated test data and remove temporary test artifacts after verification.
- Do not modify live data or apply database migrations without the owner's explicit instruction. Prepare migration files locally when needed.

## Git and communication

- Do not run Git operations unless the owner explicitly requests them.
- Summarize the changes, verification results, and any remaining work concisely.
- Include a suggested short commit message when useful, without creating a commit.
