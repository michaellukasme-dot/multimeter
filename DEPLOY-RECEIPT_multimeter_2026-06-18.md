# Amp Academy — Mastering the Electric Multimeter · deploy bundle · 2026-06-18
The scrubbed player template + multimeter content, assembled into a drop-in, installable, offline course.
First Amp Academy course product. Built under claude_gaude_as_jarvis_2026-06-18_0142pm. Owner deploys.

## What this is
The hardened AA-PLAYER-TEMPLATE (no key-in-client, honest completion, glyph-clean, Amp Academy brand) with
the multimeter content, laid out in the nested structure the pages expect, plus the **course home that was
missing** from the original package.

## Structure (deploy the whole folder to the repo root)
```
index.html               course home / dashboard (NEW — built today; the package had none)
manifest.webmanifest     web-app manifest (PWA)
sw.js                    service worker (offline; cache aa-mm-v1)
icons/icon.svg
css/   course.css  tutor.css
js/    course.js          (location-aware: works from root home AND nested lessons)
lessons/  lesson-01..08 · lab-01..03 · quiz-final · certificate
```

## Verified
- Home inline scripts + course.js `node --check` OK. manifest valid.
- Every referenced local file exists; lessons resolve `../css/ ../js/ ../index.html`; home resolves `css/ js/ lessons/`.
- Offline: only external dependency is Google Fonts (Syne/Space Mono/Inter) — the service worker caches them
  on first visit, so it runs offline after. No key-in-client, no robot glyph, no "The Weight".
- Honest completion: lessons earn on reaching the end; **certificate gated on the Final Assessment pass** (5/6).
- Mobile drawer; install affordance.

## Deploy (owner — pick the repo per the naming standard, e.g. amp-academy or a multimeter repo)
Push the whole `multimeter_deploy/` folder to the repo root (it's already the correct structure). Serve over
https (SW needs non-file://). Relaunch the installed PWA once after deploy.

## Deferred (optional)
- PNG icons (192/512) for broadest install (currently SVG).
- Self-host fonts (currently SW-cached) if you want zero external calls.
- Live AI tutor via a server relay — **WIRED 2026-06-18** (SW bumped aa-mm-v1 → v2). All 14 pages load
  `js/aa-tutor-config.js` + `js/aa-tutor-relay.js` after `course.js`. Tutor stays OFFLINE until the owner
  deploys the relay (`amp_academy/02_Development/tutor_relay/`) and replaces the `<acct>` placeholder in
  `js/aa-tutor-config.js` with the real Worker URL. No behavior change until then. Redeploy this folder.
