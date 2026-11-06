/* Offline Fantasy Manager — local-first application */
const DB_NAME="OfflineFantasyManager", DB_VERSION=1;
let db=null;
const pageTitles={teams:"My Club",players:"Player Market",formation:"Tactics & XI",transfers:"Transfers",matches:"Fixtures",history:"Season Log",settings:"Settings"};
function navigateTo(name){if(!pageTitles[name]||!document.getElementById(name))return;document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===name));document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===name));document.getElementById("page-title").textContent=pageTitles[name];window.scrollTo({top:0,behavior:"smooth"});}
document.addEventListener("click",e=>{const nav=e.target.closest("[data-page]");if(nav)navigateTo(nav.dataset.page);});
function openDatabase(){return new Promise((resolve,reject)=>{if(!indexedDB)return reject(Error("IndexedDB is unavailable"));const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=e=>{const d=e.target.result;for(const s of ["teams","players","matches","activities"])if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:"id",autoIncrement:true});if(!d.objectStoreNames.contains("settings"))d.createObjectStore("settings",{keyPath:"key"});};req.onsuccess=e=>{db=e.target.result;db.onversionchange=()=>db.close();resolve(db);};req.onerror=()=>reject(req.error);});}
function all(store){return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function save(store,item){return new Promise((resolve,reject)=>{const tx=db.transaction(store,"readwrite"),r=tx.objectStore(store).add(item);r.onsuccess=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);});}
function update(store,item){return new Promise((resolve,reject)=>{const tx=db.transaction(store,"readwrite");tx.objectStore(store).put(item);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function remove(store,id){return new Promise((resolve,reject)=>{const tx=db.transaction(store,"readwrite");tx.objectStore(store).delete(Number(id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function status(message,ok=true){const e=document.getElementById("connection-status");if(e){e.textContent="● "+message;e.style.color=ok?"#22c55e":"#f59e0b";}}
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function empty(container,message){container.replaceChildren(node("p","empty-copy",message));}
function card(title,subtitle,store,itemId){const c=node("article","record-card"),info=node("div"),actions=node("div","record-actions");info.append(node("strong","",title),node("p","",subtitle));const edit=node("button","","Edit");edit.type="button";edit.addEventListener("click",()=>editRecord(store,itemId));const del=node("button","danger","Delete");del.type="button";del.addEventListener("click",()=>deleteRecord(store,itemId));actions.append(edit,del);c.append(info,actions);return c;}
async function renderTeams(){const list=document.getElementById("teams-list"),items=await all("teams"),players=await all("players");list.className="record-list";if(!items.length)return empty(list,"No teams yet. Create your first team above.");list.replaceChildren(...items.map(t=>{const squad=players.filter(p=>String(p.teamId)===String(t.id));const spent=squad.reduce((sum,p)=>sum+Number(p.price||0),0);return card(t.name,"Budget remaining: £"+Math.max(0,Number(t.budget)-spent).toFixed(1)+"m · Squad: "+squad.length+"/15 · Points: "+(t.totalPoints||0),"teams",t.id);}));}
let officialPlayerPool=[];let selectedMarketTeamId="";
function positionName(code){return ({GK:"Goalkeeper",DEF:"Defender",MID:"Midfielder",FWD:"Forward"})[code]||code;}
async function renderPlayers(){
 const list=document.getElementById("players-list");if(!list)return;
 const teams=await all("teams"),owned=await all("players"),teamSelect=document.getElementById("market-team");
 if(teamSelect){const prev=selectedMarketTeamId||teamSelect.value;teamSelect.replaceChildren(...teams.map(t=>{const o=node("option","",t.name);o.value=String(t.id);return o;}));selectedMarketTeamId=teams.some(t=>String(t.id)===String(prev))?String(prev):(teams[0]?String(teams[0].id):"");teamSelect.value=selectedMarketTeamId;}
 const search=(document.getElementById("market-search")?.value||"").trim().toLowerCase(),position=document.getElementById("market-position")?.value||"ALL",clubSelect=document.getElementById("market-club"),currentClub=clubSelect?.value||"ALL";
 if(clubSelect){const clubs=[...new Map(officialPlayerPool.map(p=>[p.clubId,p.club])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));clubSelect.replaceChildren();const allOpt=node("option","","All clubs");allOpt.value="ALL";clubSelect.append(allOpt);clubs.forEach(([id,name])=>{const o=node("option","",name);o.value=String(id);clubSelect.append(o);});clubSelect.value=clubs.some(([id])=>String(id)===currentClub)?currentClub:"ALL";}
 list.className="record-list";if(!officialPlayerPool.length){empty(list,"The official player list has not loaded yet. It refreshes automatically.");return;}if(!teams.length){empty(list,"Create your fantasy team first. Then choose players from the Premier League player pool.");return;}
 const club=clubSelect?.value||"ALL",filtered=officialPlayerPool.filter(p=>(position==="ALL"||p.position===position)&&(club==="ALL"||String(p.clubId)===club)&&(!search||(p.name+" "+p.club+" "+p.firstName+" "+p.secondName).toLowerCase().includes(search)));
 const count=document.getElementById("market-result-count");if(count)count.textContent=filtered.length+" players";if(!filtered.length){empty(list,"No players match those filters.");return;}
 const team=teams.find(t=>String(t.id)===String(selectedMarketTeamId));
 list.replaceChildren(...filtered.map(p=>{const existing=owned.find(x=>Number(x.fplId)===Number(p.id)),assigned=existing&&String(existing.teamId)===String(team.id);const cardEl=node("article","record-card market-player-card"),info=node("div","market-player-info"),actions=node("div","record-actions");info.append(node("strong","",p.name),node("p","",positionName(p.position)+" · "+p.club+" · £"+Number(p.price).toFixed(1)+"m"),node("small","",Number(p.totalPoints||0)+" pts · "+Number(p.goals||0)+" goals · "+Number(p.assists||0)+" assists"));const add=node("button",assigned?"secondary-button":"primary-button",assigned?"In your squad":"＋ Add to squad");add.type="button";add.disabled=!!existing;add.dataset.poolPlayerId=p.id;if(existing&&!assigned)add.textContent="Already selected";actions.append(add);cardEl.append(info,actions);return cardEl;}));
}
async function loadOfficialPlayers(){const label=document.getElementById("market-update-status");if(label)label.textContent="Loading official player data…";try{const response=await fetch("data/epl-players.json?v=1",{cache:"no-store"});if(!response.ok)throw Error("Official player data is not published yet");const data=await response.json();if(!Array.isArray(data.players)||data.players.length<300)throw Error("Player database is incomplete");officialPlayerPool=data.players;if(label)label.textContent="Official FPL player pool · Updated "+new Date(data.lastUpdated).toLocaleString();await renderPlayers();}catch(err){officialPlayerPool=[];if(label)label.textContent="Player database is waiting for its first update";await renderPlayers();console.warn("Premier League player pool unavailable:",err);}}
async function addOfficialPlayer(id){const player=officialPlayerPool.find(p=>Number(p.id)===Number(id)),teams=await all("teams"),team=teams.find(t=>String(t.id)===String(selectedMarketTeamId));if(!player||!team)return;const current=await all("players"),existing=current.find(p=>Number(p.fplId)===Number(player.id));if(existing){status("This player is already selected",false);return;}const squad=current.filter(p=>String(p.teamId)===String(team.id)),limits={GK:2,DEF:5,MID:5,FWD:3};if(squad.length>=15){status("Your squad already has 15 players",false);return;}if(squad.filter(p=>p.position===player.position).length>=limits[player.position]){status("Maximum "+limits[player.position]+" "+positionName(player.position).toLowerCase()+"s reached",false);return;}if(squad.filter(p=>String(p.clubId)===String(player.clubId)).length>=3){status("Maximum 3 players from one club",false);return;}const spent=squad.reduce((sum,p)=>sum+Number(p.price||0),0);if(spent+Number(player.price)>Number(team.budget)){status("Not enough budget for this player",false);return;}await save("players",{fplId:player.id,name:player.name,position:player.position,club:player.club,clubId:player.clubId,price:player.price,totalPoints:player.totalPoints,goals:player.goals,assists:player.assists,teamId:team.id,createdAt:new Date().toISOString()});await logActivity("Selected "+player.name+" ("+player.club+")");await refresh();status(player.name+" added to your squad");}
document.addEventListener("input",e=>{if(e.target.id==="market-search")renderPlayers().catch(console.error);});
document.addEventListener("change",e=>{if(["market-position","market-club","market-team"].includes(e.target.id)){if(e.target.id==="market-team")selectedMarketTeamId=e.target.value;renderPlayers().catch(console.error);}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-pool-player-id]");if(b&&!b.disabled)addOfficialPlayer(b.dataset.poolPlayerId).catch(err=>{console.error(err);status("Could not add player",false);});});

async function refresh(){
 const activities=await all("activities");
 const recent=document.getElementById("recent-activity");
 if(recent){
  recent.replaceChildren();
  activities.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,12).forEach(a=>recent.append(node("p","",a.description+" · "+new Date(a.date).toLocaleString())));
  if(!activities.length)empty(recent,"No club activity recorded yet. Your team decisions will appear here.");
 }
 const settingsStatus=document.getElementById("settings-storage-status");
 if(settingsStatus)settingsStatus.textContent="Local database ready · saved on this device";
 await Promise.all([renderTeams(),renderPlayers(),renderFormation()]);
}
async function logActivity(description){await save("activities",{description:description,date:new Date().toISOString()});}
function setupForms(){document.getElementById("show-team-form").addEventListener("click",()=>document.getElementById("team-form").hidden=false);document.getElementById("cancel-team-form").addEventListener("click",()=>{const f=document.getElementById("team-form");f.reset();f.hidden=true;});document.getElementById("team-form").addEventListener("submit",async e=>{e.preventDefault();const name=document.getElementById("team-name").value.trim();if(!name)return;await save("teams",{name,budget:100,totalPoints:0,createdAt:new Date().toISOString()});await logActivity("Created fantasy team: "+name);e.target.reset();e.target.hidden=true;await refresh();status("Fantasy team created with £100m budget");});}
async function editRecord(store,id){const items=await all(store),item=items.find(x=>x.id===id);if(!item)return;if(store==="teams"){const name=prompt("Team name:",item.name);if(name===null)return;const budget=prompt("Budget (£m):",item.budget);if(budget===null)return;const value=Number(budget);if(!name.trim()||!Number.isFinite(value)||value<0)return alert("Enter a valid name and budget.");await update(store,{...item,name:name.trim(),budget:value});await logActivity("Updated team: "+name.trim());}else{const name=prompt("Player name:",item.name);if(name===null)return;const club=prompt("Club:",item.club||"");if(club===null)return;const price=prompt("Price (£m):",item.price);if(price===null)return;const value=Number(price);if(!name.trim()||!Number.isFinite(value)||value<0)return alert("Enter a valid name and price.");await update(store,{...item,name:name.trim(),club:club.trim(),price:value});await logActivity("Updated player: "+name.trim());}await refresh();status("Changes saved locally");}
async function deleteRecord(store,id){if(!confirm("Delete this record? This cannot be undone."))return;const items=await all(store),item=items.find(x=>x.id===id);await remove(store,id);if(item)await logActivity("Deleted "+(store==="teams"?"team":"player")+": "+item.name);await refresh();status("Record deleted");}

/* SQUAD AND FORMATION MANAGEMENT — Stage 4 */
let selectedFormationTeamId = "";
const FORMATIONS = {
  "4-4-2": ["GK","DEF","DEF","DEF","DEF","MID","MID","MID","MID","FWD","FWD"],
  "4-3-3": ["GK","DEF","DEF","DEF","DEF","MID","MID","MID","FWD","FWD","FWD"],
  "3-5-2": ["GK","DEF","DEF","DEF","MID","MID","MID","MID","MID","FWD","FWD"],
  "4-2-3-1": ["GK","DEF","DEF","DEF","DEF","MID","MID","MID","MID","MID","FWD"]
};
function makeSelect(options, value, label) {
  const s=node("select","formation-select");
  s.setAttribute("aria-label",label);
  options.forEach(o=>{const op=node("option","",o.label);op.value=String(o.value);if(String(o.value)===String(value))op.selected=true;s.append(op);});
  return s;
}
async function renderFormation() {
  const root=document.getElementById("formation-content");
  if(!root)return;
  const teams=await all("teams"), players=await all("players");
  root.replaceChildren();
  if(!teams.length){root.append(node("p","empty-copy","Create a team first, then return here to build its squad."));return;}
  if(!teams.some(t=>String(t.id)===String(selectedFormationTeamId)))selectedFormationTeamId=String(teams[0].id);
  const team=teams.find(t=>String(t.id)===String(selectedFormationTeamId));
  const teamPicker=makeSelect(teams.map(t=>({value:t.id,label:t.name})),team.id,"Choose team");
  teamPicker.dataset.formationControl="team";
  const formationPicker=makeSelect(Object.keys(FORMATIONS).map(x=>({value:x,label:x})),team.formation||"4-4-2","Choose formation");
  formationPicker.dataset.formationControl="formation";
  const controls=node("div","formation-controls");
  const teamLabel=node("label","formation-label","Team");teamLabel.append(teamPicker);
  const formationLabel=node("label","formation-label","Formation");formationLabel.append(formationPicker);
  controls.append(teamLabel,formationLabel);
  root.append(controls);
  const squad=players.filter(p=>String(p.teamId)===String(team.id));
  const available=players.filter(p=>!p.teamId||String(p.teamId)===String(team.id));
  const addRow=node("div","squad-add-row");
  const addPicker=makeSelect([{value:"",label:"Select a player"},...available.map(p=>({value:p.id,label:p.name+" · "+p.position}))],"","Add player to squad");
  addPicker.id="squad-player-picker";
  const addButton=node("button","primary-button","Add to Squad");addButton.type="button";addButton.dataset.formationAction="add-player";
  addRow.append(addPicker,addButton);
  root.append(node("h4","formation-subheading","Squad"),addRow);
  const squadList=node("div","squad-list");
  if(!squad.length)squadList.append(node("p","empty-copy","No players assigned yet. Add players from your player list."));
  squad.forEach(p=>{
    const item=node("div","squad-player");
    item.append(node("span","",p.name+" · "+p.position+" · £"+Number(p.price).toFixed(1)+"m"));
    const removeButton=node("button","secondary-button","Remove");removeButton.type="button";removeButton.dataset.formationAction="remove-player";removeButton.dataset.playerId=p.id;
    item.append(removeButton);squadList.append(item);
  });
  root.append(squadList,node("h4","formation-subheading","Starting XI"));
  const slots=node("div","lineup-grid");
  const counts={GK:0,DEF:0,MID:0,FWD:0};
  FORMATIONS[team.formation||"4-4-2"].forEach((position,index)=>{
    counts[position]++;
    const key=position+"_"+counts[position];
    const label=node("label","lineup-slot",position+" "+counts[position]);
    const eligible=squad.filter(p=>p.position===position);
    const options=[{value:"",label:"— Empty —"},...eligible.map(p=>({value:p.id,label:p.name}))];
    const picker=makeSelect(options,(team.lineup||{})[key]||"","Select "+position+" "+counts[position]);
    picker.dataset.lineupSlot=key;
    label.append(picker);slots.append(label);
  });
  root.append(slots);
  const captainControls=node("div","captain-controls");
  const starters=squad.filter(p=>Object.values(team.lineup||{}).some(id=>Number(id)===Number(p.id)));
  const captainOptions=[{value:"",label:"Choose captain"},...starters.map(p=>({value:p.id,label:p.name}))];
  const captainLabel=node("label","formation-label","Captain"),captainPicker=makeSelect(captainOptions,team.captainId||"","Choose captain");captainPicker.dataset.captainRole="captain";captainLabel.append(captainPicker);
  const viceOptions=[{value:"",label:"Choose vice-captain"},...starters.map(p=>({value:p.id,label:p.name}))];
  const viceLabel=node("label","formation-label","Vice-captain"),vicePicker=makeSelect(viceOptions,team.viceCaptainId||"","Choose vice-captain");vicePicker.dataset.captainRole="viceCaptain";viceLabel.append(vicePicker);
  captainControls.append(captainLabel,viceLabel);root.append(captainControls);
  const count=node("p","lineup-count",Object.values(team.lineup||{}).filter(Boolean).length+" / 11 starting players selected");
  root.append(count,node("p","formation-note","Build your 15-player squad, select your starting XI, captain and vice-captain."));
}
async function handleFormationChange(target) {
  const teams=await all("teams");
  if(target.dataset.formationControl==="team"){selectedFormationTeamId=target.value;await renderFormation();return;}
  const team=teams.find(t=>String(t.id)===String(selectedFormationTeamId));if(!team)return;
  if(target.dataset.captainRole){const field=target.dataset.captainRole,value=target.value?Number(target.value):null,other=field==="captain"?team.viceCaptainId:team.captainId;if(value&&Number(value)===Number(other)){status("Captain and vice-captain must be different players",false);await renderFormation();return;}await update("teams",{...team,[field==="captain"?"captainId":"viceCaptainId"]:value});await renderFormation();status(field==="captain"?"Captain saved":"Vice-captain saved");return;}
  if(target.dataset.formationControl==="formation"){
    await update("teams",{...team,formation:target.value,lineup:{}});
    await logActivity("Changed formation to "+target.value+" for "+team.name);
    await renderFormation();status("Formation saved locally");return;
  }
  if(target.dataset.lineupSlot){
    const lineup={...(team.lineup||{})};
    if(target.value)lineup[target.dataset.lineupSlot]=Number(target.value);else delete lineup[target.dataset.lineupSlot];
    const starters=Object.values(lineup).map(Number);
    const nextTeam={...team,lineup};
    if(team.captainId&&!starters.includes(Number(team.captainId)))nextTeam.captainId=null;
    if(team.viceCaptainId&&!starters.includes(Number(team.viceCaptainId)))nextTeam.viceCaptainId=null;
    await update("teams",nextTeam);
    await renderFormation();status("Starting XI saved locally");
  }
}
async function handleFormationAction(button) {
  const teams=await all("teams"),team=teams.find(t=>String(t.id)===String(selectedFormationTeamId));if(!team)return;
  if(button.dataset.formationAction==="add-player"){
    const picker=document.getElementById("squad-player-picker"),id=Number(picker.value);if(!id)return;
    const players=await all("players"),player=players.find(p=>p.id===id);if(!player)return;
    await update("players",{...player,teamId:team.id});
    await logActivity("Added "+player.name+" to "+team.name);
    await refresh();status("Player added to squad");return;
  }
  if(button.dataset.formationAction==="remove-player"){
    const id=Number(button.dataset.playerId),players=await all("players"),player=players.find(p=>p.id===id);if(!player)return;
    const lineup={...(team.lineup||{})};
    Object.keys(lineup).forEach(k=>{if(Number(lineup[k])===id)delete lineup[k];});
    await update("players",{...player,teamId:null});
    await update("teams",{...team,lineup});
    await logActivity("Removed "+player.name+" from "+team.name);
    await refresh();status("Player removed from squad");
  }
}
document.addEventListener("change",e=>{if(e.target.matches("[data-formation-control], [data-lineup-slot], [data-captain-role]"))handleFormationChange(e.target).catch(err=>{console.error(err);status("Could not save formation",false);});});
document.addEventListener("click",e=>{const b=e.target.closest("[data-formation-action]");if(b)handleFormationAction(b).catch(err=>{console.error(err);status("Could not update squad",false);});});


/* PREMIER LEAGUE FIXTURE SYNC */
let fixtureCache=[];
function fixtureStatusLabel(status){
 const map={SCHEDULED:"Upcoming",TIMED:"Upcoming",IN_PLAY:"Live",PAUSED:"Half-time",FINISHED:"Full-time",POSTPONED:"Postponed",SUSPENDED:"Suspended",CANCELLED:"Cancelled"};
 return map[status]||String(status||"Scheduled").replaceAll("_"," ");
}
function fixtureDate(value){
 const d=new Date(value);
 if(Number.isNaN(d.getTime()))return "Date TBC";
 return new Intl.DateTimeFormat(undefined,{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}).format(d);
}
function renderFixtures(){
 const root=document.getElementById("fixtures-list"),filter=document.getElementById("fixture-filter");
 if(!root)return;
 const mode=filter?.value||"upcoming",now=Date.now();
 let rows=fixtureCache.filter(m=>{
  const status=String(m.status||"").toUpperCase(),time=new Date(m.utcDate).getTime();
  if(mode==="live")return ["IN_PLAY","PAUSED"].includes(status);
  if(mode==="finished")return status==="FINISHED";
  if(mode==="upcoming")return time>=now&&!["FINISHED","CANCELLED"].includes(status);
  return true;
 });
 rows.sort((a,b)=>new Date(a.utcDate)-new Date(b.utcDate));
 root.replaceChildren();
 if(!rows.length){root.append(node("p","empty-copy",fixtureCache.length?"No fixtures match this filter.":"No fixture data has been published yet. Add the repository API secret to enable automatic updates."));return;}
 rows.forEach(match=>{
  const cardEl=node("article","fixture-card"),top=node("div","fixture-card-top");
  const matchday=match.matchday?("Matchweek "+match.matchday):"Premier League";
  top.append(node("span","fixture-matchday",matchday));
  const state=node("span","fixture-status fixture-status-"+String(match.status||"scheduled").toLowerCase(),fixtureStatusLabel(match.status));
  top.append(state);
  const teams=node("div","fixture-teams");
  const home=node("div","fixture-team fixture-home"),away=node("div","fixture-team fixture-away");
  home.append(node("strong","",match.homeTeam||"Home team"));
  away.append(node("strong","",match.awayTeam||"Away team"));
  const score=node("div","fixture-score");
  if(match.homeScore!==null&&match.homeScore!==undefined&&match.awayScore!==null&&match.awayScore!==undefined)score.textContent=match.homeScore+" – "+match.awayScore;
  else score.textContent="vs";
  teams.append(home,score,away);
  cardEl.append(top,teams,node("div","fixture-kickoff",fixtureDate(match.utcDate)));
  root.append(cardEl);
 });
}
async function loadPremierLeagueFixtures(force=false){
 const root=document.getElementById("fixtures-list"),label=document.getElementById("fixture-update-status");
 if(!root)return;
 if(label)label.textContent="Loading schedule…";
 try{
  const url="data/epl-fixtures.json"+(force?"?refresh="+Date.now():"?v=1");
  const response=await fetch(url,{cache:force?"no-store":"default"});
  if(!response.ok)throw Error("Fixture data is not published yet");
  const data=await response.json();
  fixtureCache=Array.isArray(data.matches)?data.matches:[];
  renderFixtures();
  const updated=data.lastUpdated?new Date(data.lastUpdated).toLocaleString():"not recorded";
  if(label)label.textContent="Last updated: "+updated;
 }catch(err){
  fixtureCache=[];renderFixtures();
  if(label)label.textContent="Schedule updater not configured";
  console.warn("Premier League fixtures unavailable:",err);
 }
}
document.addEventListener("change",e=>{if(e.target.id==="fixture-filter")renderFixtures();});
document.addEventListener("click",e=>{if(e.target.closest("#refresh-fixtures"))loadPremierLeagueFixtures(true);});

async function init(){try{status("Opening local database");await openDatabase();if(navigator.storage&&navigator.storage.persist)try{await navigator.storage.persist();}catch(_){}setupForms();await refresh();await Promise.all([loadOfficialPlayers(),loadPremierLeagueFixtures()]);status("Local database ready");}catch(err){console.error(err);status("Local storage unavailable",false);}}
window.addEventListener("online",()=>status("Online · local data available"));window.addEventListener("offline",()=>status("Offline · local data available"));document.addEventListener("DOMContentLoaded",init);
