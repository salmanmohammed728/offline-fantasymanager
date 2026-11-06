# Offline Fantasy Manager

A local-first, browser-based football fantasy management application.

## Current foundation
- Responsive HTML/CSS/JavaScript football interface
- My Club is the default opening page
- Navigation includes My Club, Player Market, Tactics & XI, Transfers, Fixtures, Season Log and Settings
- IndexedDB local database
- Create, list, edit and delete workflows for fantasy teams
- Official Fantasy Premier League player market with search and club/position filters
- FPL squad rules: 15 players, 2 GK / 5 DEF / 5 MID / 3 FWD, £100m starting budget and maximum 3 players per club
- Captain and vice-captain selection
- Recent activity log

## Run
Open `index.html` through a static web host such as GitHub Pages. For reliable browser storage and service-worker features, use HTTPS or localhost. No package installation is required.

## Persistence and offline behavior
Team and player records are stored in IndexedDB in the current browser profile. This persists across normal page reloads, but browser-local storage does not automatically sync between devices. Full offline asset caching requires the service worker, which is still planned.

## Planned features
- Squad assignment and starting XI formation editor (4-4-2, 4-3-3, 3-5-2 and 4-2-3-1)
- Transfer and budget rules
- Premier League fixture centre (fixture data supplied by a scheduled GitHub Actions updater)
- Fixtures, results and fantasy scoring
- Match history and statistics
- Backup and restore
- Service worker and installable web-app support
- Optional secure cloud sync for cross-device use

## Premier League fixture synchronization
The Matches page reads `data/epl-fixtures.json`. The Player Market reads `data/epl-players.json`, generated from the public Fantasy Premier League API. GitHub Actions refreshes both datasets three times per day and can also be started manually. The FPL player feed does not require an API key. Fixture updates use football-data.org and keep the API token out of browser code.

To activate live fixture updates:
1. Register for an API token at [football-data.org](https://www.football-data.org/).
2. In this repository, open Settings → Secrets and variables → Actions → New repository secret.
3. Name the secret `FOOTBALL_DATA_TOKEN` and paste your API token as its value.
4. Open Actions → Update Premier League fixtures → Run workflow.
5. Confirm the workflow completes and `data/epl-fixtures.json` and `data/epl-players.json` are updated. The Matches page and Player Market will then show the imported data.

The current implementation targets the 2026/27 season. API access and competition coverage depend on the provider's current plan. Until the secret is configured and the first update succeeds, the Matches page displays an activation message rather than invented fixtures. The fixture feed is separate from personal IndexedDB data.

## Project files
- `index.html` — interface structure
- `styles.css` — responsive styling
- `app.js` — application logic and IndexedDB workflows
- `AGENTS.md` — development instructions
- `INTERNAL_HANDOVER.md` — project status and next steps

## Development rules
Preserve existing data, do not expose private credentials, test changes before calling them complete, and update the handover after each stage.
