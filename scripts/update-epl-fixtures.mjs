import { mkdir, writeFile } from "node:fs/promises";

const token = process.env.FOOTBALL_DATA_TOKEN;
if (!token) throw new Error("Missing FOOTBALL_DATA_TOKEN repository secret.");

const season = process.env.EPL_SEASON_START || "2026";
const endpoint = `https://api.football-data.org/v4/competitions/PL/matches?season=${encodeURIComponent(season)}`;
const response = await fetch(endpoint, {
  headers: { "X-Auth-Token": token, "User-Agent": "OfflineFantasyManager/1.0" }
});

if (!response.ok) {
  const detail = await response.text();
  throw new Error(`football-data.org returned HTTP ${response.status}: ${detail.slice(0, 500)}`);
}

const payload = await response.json();
if (!Array.isArray(payload.matches)) {
  throw new Error("Unexpected API response: matches array is missing.");
}

const matches = payload.matches.map(match => ({
  id: match.id,
  utcDate: match.utcDate,
  status: match.status,
  matchday: match.matchday ?? null,
  homeTeam: match.homeTeam?.name ?? "Home team",
  awayTeam: match.awayTeam?.name ?? "Away team",
  homeScore: match.score?.fullTime?.home ?? null,
  awayScore: match.score?.fullTime?.away ?? null,
  lastUpdated: match.lastUpdated ?? null
})).sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

await mkdir("data", { recursive: true });
await writeFile("data/epl-fixtures.json", JSON.stringify({
  competition: "Premier League",
  season: `${season}/${Number(season) + 1}`,
  source: "football-data.org",
  lastUpdated: new Date().toISOString(),
  matches
}, null, 2) + "\n");

console.log(`Saved ${matches.length} Premier League fixtures for ${season}/${Number(season) + 1}.`);
