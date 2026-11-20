# NFC Attendance System

An Android attendance app for a college student council. Students tap a compatible student ID on an NFC-capable phone to record attendance at council events. NFC tapping is the core attendance method, replacing the QR-scanning workflow in the owner's idea.

Council members register students individually and save registrations locally, then explicitly upload them to Google Sheets after reconciliation. Before an event session, the phone downloads the latest student/card list. Scanning and attendance saves happen locally; attendance is uploaded in a batch after the session, with duplicate/conflict checks against the latest shared records. Official student-list importing is excluded. The actual cards' readability and identifier stability still need verification.

The repository currently contains planning and project guidance only. No Android application or backend has been implemented.

- [Context and confirmed requirements](CONTEXT.md)
- [Implementation plan and research](IMPLEMENTATION_PLAN.md)
- [Feature scope and implementation status](FEATURES.md)
- [Excluded scope and future suggestions](SUGGESTIONS.md)
- [Progress](PROGRESS.md)
- [Project guidance](AGENTS.md)

The app follows the neighboring mobile projects' Expo, React Native, TypeScript, and Expo Router approach, with SQLite for durable local data. Google Sheets is the selected shared store; an authenticated Apps Script batch sync service is proposed. The first implementation step is a physical phone/card compatibility prototype.
