import { mkdir, writeFile } from "node:fs/promises";

const endpoint = "https://fantasy.premierleague.com/api/bootstrap-static/";
const response = await fetch(endpoint, {
  headers: { "User-Agent": "Touchline-Fantasy-Manager/1.0", "Accept": "application/json" }
});
if (!response.ok) {
  const detail = await response.text();
  throw new Error(`Fantasy Premier League API returned HTTP ${response.status}: ${detail.slice(0, 400)}`);
}
const payload = await response.json();
if (!Array.isArray(payload.elements) || !Array.isArray(payload.teams) || !Array.isArray(payload.element_types)) {
  throw new Error("Unexpected Fantasy Premier League API response.");
}
const teams = new Map(payload.teams.map(team => [team.id, team]));
const positions = new Map(payload.element_types.map(type => [type.id, type.singular_name_short]));
const players = payload.elements.map(player => {
  const team = teams.get(player.team);
  return {
    id: player.id,
    code: player.code,
    name: player.web_name,
    firstName: player.first_name,
    secondName: player.second_name,
    club: team?.name ?? "Unknown club",
    clubShort: team?.short_name ?? "",
    clubId: player.team,
    position: positions.get(player.element_type) ?? "MID",
    price: Number((player.now_cost / 10).toFixed(1)),
    totalPoints: player.total_points,
    pointsPerGame: player.points_per_game,
    goals: player.goals_scored,
    assists: player.assists,
    cleanSheets: player.clean_sheets,
    minutes: player.minutes,
    selectedByPercent: player.selected_by_percent,
    status: player.status,
    chanceOfPlayingNextRound: player.chance_of_playing_next_round,
    news: player.news ?? ""
  };
}).sort((a, b) => a.name.localeCompare(b.name));
if (players.length < 300) throw new Error(`Only ${players.length} players returned; refusing to publish an incomplete player pool.`);
await mkdir("data", { recursive: true });
await writeFile("data/epl-players.json", JSON.stringify({
  competition: "Premier League",
  source: "Fantasy Premier League public API",
  lastUpdated: new Date().toISOString(),
  playerCount: players.length,
  clubs: payload.teams.map(team => ({ id: team.id, name: team.name, shortName: team.short_name })),
  players
}, null, 2) + "\n");
console.log(`Saved ${players.length} Premier League players across ${payload.teams.length} clubs.`);
