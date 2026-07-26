# Bench Coach - iOS

Native iOS app (Capacitor web app in a native shell). All data is stored on-device. No servers, no accounts, no database.

Built & signed on a GitHub-hosted cloud Mac using an App Store Connect API key - no Mac and no certificate files needed. Xcode cloud-managed signing creates what it needs.

- App name: Bench Coach
- Bundle ID: com.charlesburnham.benchcoach
- Team ID: Z3KZY6682M
- Repo: github.com/cburnha7/BenchCoach

## What's in here

| Path | What it is |
|---|---|
| www/index.html | The app (Store Build - no real names, photo scan hidden for v1). |
| capacitor.config.json | Capacitor config (bundle id + app name). |
| build-config/ExportOptions.plist | Xcode export settings (Team ID + automatic signing). |
| .github/workflows/ios-build.yml | Cloud-Mac build -> sign -> TestFlight. |
| resources/ | Bench Coach stopwatch icon + splash (auto-resized on build). |
| privacy/index.html | Privacy policy page - deploy to Vercel, paste URL into App Store Connect. |

## Get a build (all browser-based)

1. Create an App Store Connect API key (App Store Connect > Users and Access > Integrations > App Store Connect API > +). Role: App Manager. Download the .p8 (one time only).
2. Add 3 repo secrets (Settings > Secrets and variables > Actions):
   - APPSTORE_KEY_ID - the Key ID
   - APPSTORE_ISSUER_ID - the Issuer ID
   - APPSTORE_API_PRIVATE_KEY - full contents of the .p8 file
3. Run the build: Actions tab > iOS Build > Run workflow (or push to main).
4. It builds, signs, and uploads to TestFlight. Watch the log in the Actions tab.

## App Store Connect

- App Privacy: Data Not Collected
- Privacy Policy URL: deploy privacy/ to Vercel, paste the link
- Category: Sports; Age rating: 4+
- Screenshots, name, subtitle, keywords, description, pricing
- TestFlight to yourself + assistant coaches, then Submit for Review

## Two things that are intentionally true

- No real kids ship in the app. This build seeds one empty "My Team." Real rosters live only on your own devices (the personal build). Never put real minors' names in this repo.
- Photo roster scan is off in v1 (needs Apple on-device Vision OCR; ships in v1.1). Team photos and manual entry work fully now.
