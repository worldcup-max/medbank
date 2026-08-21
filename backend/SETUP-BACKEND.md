# ⚠️ DEPRECATED — do not use

This described a *separate, anonymous* telemetry backend. It's superseded: MedBank already
has accounts + cloud sync (`config.js`, `auth-ui.js`, `sync.js`), and every logged-in student's
data already syncs to `profile_state`. Use the admin path instead:

- **ADMIN-SETUP.md** — how to grant yourself admin read + open the dashboard
- **admin-access.sql** — admin read-policies on your existing tables
- **admin-dashboard.html** — see student names + their data (admin login)
