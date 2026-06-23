# Spaci website

Marketing site, changelog and auto-update feed for [Spaci](https://spaci.kentom.co.ke),
the developer and Mac disk cleaner. Built by [kentom.co.ke](https://kentom.co.ke).

Stack: SvelteKit + TypeScript, Prisma + Neon Postgres (the same database stack as
the stevetom portfolio). Structured like pixen-cloud's landing, with the changelog
driven from data and a generic update feed for the desktop app.

## What is here

- **Landing** (`/`): hero, animated mock app, features, OS-aware download, "what's new".
- **Changelog** (`/changelog`): a timeline rendered from `src/lib/releases.ts`.
- **Download** (`/download`): OS detection with every platform artifact.
- **Update feed** (`/updates/latest-mac.yml`, `/updates/latest.yml`, `/updates/latest-linux.yml`):
  electron-builder shaped YAML generated from the newest release. The desktop app's
  electron-updater points at `https://spaci.kentom.co.ke/updates`.
- **API**: `/api/releases` (list + authenticated publish), `/api/subscribe` (release
  notifications), `/api/track` (download analytics).

## Release data

`src/lib/releases.ts` is the single source of truth. It feeds the changelog, the
download links and the update feed. Neon mirrors it for the dynamic endpoints.

## Local development

```bash
cp .env.example .env        # fill in your Neon DATABASE_URL / DIRECT_URL
npm install
npm run db:push             # create tables on Neon
npm run db:seed             # mirror releases.ts into the database
npm run dev
```

## Cutting a release

1. Build the desktop app (`npm run dist` in the dev-cleaner-electron repo). electron-builder
   produces the installers plus `latest-*.yml` with real sha512 values.
2. Upload the installers and blockmaps to wherever `INSTALLER_BASE` points
   (GitHub Releases or object storage).
3. Fill the new version into `src/lib/releases.ts`. Use `node scripts/sha512.mjs <installer>`
   to get the `bytes` and `sha512` for each file, then bump `version` and prepend the entry.
4. Deploy the site, then `npm run db:seed` (or `npx tsx scripts/notify-release.ts`) to sync Neon.

The desktop app then sees the new version on its next update check (within six hours,
or immediately via "Check for updates" on the About screen).

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection (runtime queries) |
| `DIRECT_URL` | Neon direct connection (prisma migrate / db push) |
| `INSTALLER_BASE` | Where built installers are actually hosted |
| `RELEASE_PUBLISH_SECRET` | Shared secret for `POST /api/releases` |
