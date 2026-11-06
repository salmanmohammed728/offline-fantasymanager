# Internal Project Handover

## Project
Offline Fantasy Manager (`offline-fantasymanager`)

## Current Stage
Stage 6 — Official Fantasy Premier League player market and standard squad selection rules added; first player-data workflow run and live browser testing remain.

## Repository
https://github.com/salmanmohammed728/offline-fantasymanager

## Technology
- HTML, CSS and vanilla JavaScript
- IndexedDB for browser-local persistence
- GitHub Pages intended for static hosting
- Service worker and optional cloud synchronization are future work

## Completed / Present
- [x] Dashboard page and navigation item are absent; My Club is the default opening page.
- [x] Main navigation retains My Club, Player Market, Tactics & XI, Transfers, Fixtures, Season Log and Settings.
- [x] Matches page displays a Premier League fixture feed from `data/epl-fixtures.json`, with date, status, score and filters.
- [x] GitHub Actions scheduled updater added for the 2026/27 Premier League season; API token is read from repository secret, never frontend code.
- [ ] Run the updated GitHub Actions workflow and verify that `data/epl-players.json` is generated with the current FPL player pool.
- [ ] Add `FOOTBALL_DATA_TOKEN` repository secret, run the updater, and verify fixture provider access and GitHub Pages publication.
- [x] Modern football-focused responsive interface with dark navigation and compact match and squad panels.
- [x] GitHub repository and project documentation exist.
- [x] IndexedDB stores for teams, players, matches, activities and settings exist.
- [x] Fantasy team creation uses the standard £100m starting budget.
- [x] Player Market uses the official FPL player pool instead of manual player entry.
- [x] Player search plus position and club filters.
- [x] Squad validation: 15 total players, 2 GK / 5 DEF / 5 MID / 3 FWD, maximum 3 per club and budget validation.
- [x] Captain and vice-captain selection.
- [x] Team create, list, edit and delete workflows remain available.
- [x] Recent activity refreshes from local records.
- [ ] Verify team/player and squad/formation workflows in a live browser before marking tested.

## Not Yet Implemented
- [x] Squad assignment and team-player relationships
- [x] Formation selection and starting-eleven slots (4-4-2, 4-3-3, 3-5-2, 4-2-3-1)
- [ ] Transfers, free transfers and price-change rules
- [ ] Live FPL points, gameweek deadlines and automatic scoring
- [ ] Match fixtures linked to fantasy scoring and user squad player points
- [ ] Match history and advanced statistics
- [ ] Export/import backup and restore
- [ ] Service worker, app manifest and offline asset caching
- [ ] Cross-device synchronization (IndexedDB alone is per browser/device)
- [ ] Full accessibility and mobile-browser testing

## Data Safety
- Existing IndexedDB database name/version retained to avoid unnecessary migration.
- Existing records are not intentionally cleared.
- Delete actions require confirmation.
- Never expose Supabase service-role credentials in browser code.

## Next Step
Run the updated GitHub Actions workflow manually, confirm `data/epl-players.json` is committed, then open the website and test player search, squad limits, budget, captain and vice-captain.
