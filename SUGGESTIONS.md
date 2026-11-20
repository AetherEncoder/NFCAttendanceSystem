# Scope decisions and suggestions

## Owner-excluded scope

- Teacher-operated classroom attendance: the owner clarified on 2026-11-20 that this app is for a college student council to record attendance at events. Do not reintroduce classes, subjects, or teacher workflows as the core product.
- Official student-list importing: the owner ruled this out on 2026-11-20 and required individual student registration. Do not make registration depend on school exports or propose importing existing school card mappings as an alternative to individual registration.
- Replacing Google Sheets with Supabase as the shared store: the owner selected Sheets on 2026-11-20 because it is the council's existing workflow. Design around Sheets and local data with manual batch synchronization.

## Proposed later work, not owner exclusions

- Multiple attendance windows, check-out, late rules, and attendance export await a demonstrated event requirement.
- Starting new sessions with a stale directory or recording attendance against unresolved local registrations remain optional extensions. Local registration and attendance persistence with manual uploads are now core requirements.
- QR scanning is outside the proposed first version; the owner has not explicitly ruled out every future QR use.
