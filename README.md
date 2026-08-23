# Work Record Keeper
Track hours, calculate after-tax earnings, and manage weekly/monthly roster images with an offline-first UI.

## Features
- Monthly calendar with per-day start/end time tracking
- Automatic lunch deduction (per-day minutes input)
- Bi-weekly summaries and progress tracking
- Multi-job support with import/export
- Per-job hourly rate, start date and pay cycle
- Combined all-jobs summary; optionally count every job toward buy-list progress
- Weekly/Monthly roster image upload + viewer
- Mobile-safe roster uploads (client-side resize/compress)
- One-tap check in / check out, with undo
- Stamp a shift from a URL, so a phone automation can do it on arrival
- Light/Dark mode and bilingual UI (EN / zh-tw)

## Getting Started
```sh
npm install
npm start
```

## Build
```sh
npm run build
```

## Test
```sh
npm test
```

## Deploy (GitHub Pages)
```sh
npm run deploy
```

## Check in from your phone's location

The app can stamp a shift straight from a URL:

```
https://lauming1111.github.io/work-to-buy/?action=checkin
https://lauming1111.github.io/work-to-buy/?action=checkout
```

Point a location automation at those and arriving at work checks you in.

**Why a URL and not GPS in the app.** The web cannot geofence on its own. There
is no background geolocation API, a backgrounded tab is frozen within seconds,
and a service worker — the only thing that can wake without the page — has no
access to `navigator.geolocation` at all. The Geofencing API was specced and
then abandoned. So the trigger has to come from the operating system, which does
have real geofencing.

**iOS** — Shortcuts app, Automation tab, `+`, Arrive, choose your workplace, then
add the *Open URLs* action with the check-in URL. Turn on **Run Immediately** so
it does not ask first. Repeat with Leave and the check-out URL.

**Android** — the same with a Routine (Pixel), Bixby Routines, or Tasker, using a
location-enter trigger and an open-URL action.

Both open the app to stamp the time. If you would rather only be reminded, have
the automation post a notification instead and open the app yourself.

The action only ever moves the day forward. Arriving when you are already checked
in reports the time already recorded rather than overwriting it, leaving without
having arrived records nothing, and the parameter is stripped from the URL once
handled so a refresh cannot stamp twice.

## Data Storage
- Front-end only. All data stays in your browser `localStorage`.
- Export/import JSON from the UI
- No cookies, no analytics, no network requests. The app contacts nothing at
  runtime; GitHub Pages logs requests as any host would.
- `public/privacy.html` and `public/terms.html` are plain static pages, linked
  from the footer. They load no scripts and no third-party assets, so they still
  render if the app bundle fails. Keep them that way.

## Project Structure
- `src/App.tsx` main UI and logic
- `src/calc.ts` pay/tax calculations and multi-job aggregation (pure, unit tested)
- `src/tax.ts` year-keyed CRA/Ontario rate tables and the deduction formulas
- `src/storage.ts` `localStorage` layer, per-job keys and legacy fallbacks
- `src/App.css` styles
- `public/` static assets

## Notes
- If you track `public/favicon.ico` with Git LFS, make sure Git LFS is installed on your machine.
- A shift that crosses midnight is not supported: the day's hours are worked out
  from start and end within a single date, so an end time earlier than the start
  records no hours.
