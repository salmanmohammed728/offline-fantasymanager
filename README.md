# Offline Fantasy Manager

A local-first, browser-based football fantasy management application.

## Current foundation
- Responsive HTML/CSS/JavaScript interface
- IndexedDB local database
- Dashboard with team/player counts, points and budget summary
- Create, list, edit and delete workflows for teams and players
- Recent activity log

## Run
Open \`index.html\` through a static web host such as GitHub Pages. For reliable browser storage and service-worker features, use HTTPS or localhost. No package installation is required.

## Persistence and offline behavior
Team and player records are stored in IndexedDB in the current browser profile. This persists across normal page reloads, but browser-local storage does not automatically sync between devices. Full offline asset caching requires the service worker, which is still planned.

## Planned features
- Squad assignment and starting XI formation editor (4-4-2, 4-3-3, 3-5-2 and 4-2-3-1)
- Transfer and budget rules
- Fixtures, results and fantasy scoring
- Match history and statistics
- Backup and restore
- Service worker and installable web-app support
- Optional secure cloud sync for cross-device use

## Project files
- \`index.html\` — interface structure
- \`styles.css\` — responsive styling
- \`app.js\` — application logic and IndexedDB workflows
- \`AGENTS.md\` — development instructions
- \`INTERNAL_HANDOVER.md\` — project status and next steps

## Development rules
Preserve existing data, do not expose private credentials, test changes before calling them complete, and update the handover after each stage.
