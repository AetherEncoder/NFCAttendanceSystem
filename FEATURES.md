# Features

Status: planning only. None of the features below is implemented.

## Owner-requested behavior

- Android application for attendance.
- Tap a compatible student ID on the phone using NFC to record attendance.

## Proposed first version

- Staff sign-in and access limited to their assigned classes.
- Student records, class rosters, and enrollment of a compatible card identifier against a student.
- Card replacement/revocation with no change to past attendance.
- Open and close dated attendance sessions.
- Continuous scanning while the attendance screen is active, with clear saved, duplicate, unknown-card, and failure feedback.
- At most one attendance record per student per session, including when requests are retried or two phones scan the same card.
- Attendance list, present/absent counts against the session roster, and history.
- Staff corrections with an audit record and reason for students who cannot tap a usable card.
- Clear handling of disabled/unsupported NFC, cards outside the roster, expired sign-in, network failures, and closed sessions.

## Later candidates

- Durable offline attendance queue and reconciliation.
- CSV roster import and attendance export.
- Late classification once the owner defines the rule.

These are proposals, not confirmed requirements or owner exclusions. See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for delivery order and acceptance checks.
