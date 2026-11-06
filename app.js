/* Offline Fantasy Manager — local-first application */
const DB_NAME="OfflineFantasyManager", DB_VERSION=1;
let db=null;
const pageTitles={dashboard:"Dashboard",teams:"My Teams",players:"Players",formation:"Formation",transfers:"Transfers",matches:"Match Centre",history:"History",settings:"Settings"};
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
async function renderTeams(){const list=document.getElementById("teams-list"),items=await all("teams");list.className="record-list";if(!items.length)return empty(list,"No teams yet. Create your first team above.");list.replaceChildren(...items.map(t=>card(t.name,"Budget: £"+Number(t.budget).toFixed(1)+"m · Points: "+(t.totalPoints||0),"teams",t.id)));}
async function renderPlayers(){const list=document.getElementById("players-list"),items=await all("players");list.className="record-list";if(!items.length)return empty(list,"No players yet. Add your first player above.");list.replaceChildren(...items.map(p=>card(p.name,p.position+" · "+(p.club||"No club")+" · £"+Number(p.price).toFixed(1)+"m","players",p.id)));}
async function refresh(){const teams=await all("teams"),players=await all("players"),activities=await all("activities");document.getElementById("team-count").textContent=teams.length;document.getElementById("player-count").textContent=players.length;document.getElementById("total-points").textContent=teams.reduce((s,t)=>s+(Number(t.totalPoints)||0),0).toLocaleString();document.getElementById("total-budget").textContent="£"+(teams.length?teams.reduce((s,t)=>s+(Number(t.budget)||0),0):100).toFixed(1)+"m";const main=document.getElementById("main-team");main.replaceChildren();if(!teams.length){const box=node("div","empty-state");box.append(node("div","","⚽"),node("h3","","No team created yet"),node("p","","Create your first fantasy team to get started."));const b=node("button","primary-button","Create My Team");b.addEventListener("click",()=>navigateTo("teams"));box.append(b);main.append(box);}else main.append(node("h3","",teams[0].name),node("p","","Total points: "+(teams[0].totalPoints||0)));const recent=document.getElementById("recent-activity");recent.replaceChildren();activities.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5).forEach(a=>recent.append(node("p","",a.description+" · "+new Date(a.date).toLocaleString())));if(!activities.length)empty(recent,"Your activities will appear here.");await Promise.all([renderTeams(),renderPlayers(),renderFormation()]);}
async function logActivity(description){await save("activities",{description:description,date:new Date().toISOString()});}
function setupForms(){[["show-team-form","cancel-team-form","team-form"],["show-player-form","cancel-player-form","player-form"]].forEach(x=>{document.getElementById(x[0]).addEventListener("click",()=>document.getElementById(x[2]).hidden=false);document.getElementById(x[1]).addEventListener("click",()=>{const f=document.getElementById(x[2]);f.reset();f.hidden=true;});});document.getElementById("team-form").addEventListener("submit",async e=>{e.preventDefault();const name=document.getElementById("team-name").value.trim(),budget=Number(document.getElementById("team-budget").value);if(!name||!Number.isFinite(budget)||budget<0)return;await save("teams",{name,budget,totalPoints:0,createdAt:new Date().toISOString()});await logActivity("Created team: "+name);e.target.reset();e.target.hidden=true;await refresh();status("Team saved locally");});document.getElementById("player-form").addEventListener("submit",async e=>{e.preventDefault();const name=document.getElementById("player-name").value.trim(),position=document.getElementById("player-position").value,club=document.getElementById("player-club").value.trim(),price=Number(document.getElementById("player-price").value);if(!name||!Number.isFinite(price)||price<0)return;await save("players",{name,position,club,price,createdAt:new Date().toISOString()});await logActivity("Added player: "+name);e.target.reset();e.target.hidden=true;await refresh();status("Player saved locally");});}
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
  const count=node("p","lineup-count",Object.values(team.lineup||{}).filter(Boolean).length+" / 11 starting players selected");
  root.append(count,node("p","formation-note","Players must match the position of each slot. Your squad and lineup are saved on this device."));
}
async function handleFormationChange(target) {
  const teams=await all("teams");
  if(target.dataset.formationControl==="team"){selectedFormationTeamId=target.value;await renderFormation();return;}
  const team=teams.find(t=>String(t.id)===String(selectedFormationTeamId));if(!team)return;
  if(target.dataset.formationControl==="formation"){
    await update("teams",{...team,formation:target.value,lineup:{}});
    await logActivity("Changed formation to "+target.value+" for "+team.name);
    await renderFormation();status("Formation saved locally");return;
  }
  if(target.dataset.lineupSlot){
    const lineup={...(team.lineup||{})};
    if(target.value)lineup[target.dataset.lineupSlot]=Number(target.value);else delete lineup[target.dataset.lineupSlot];
    await update("teams",{...team,lineup});
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
document.addEventListener("change",e=>{if(e.target.matches("[data-formation-control], [data-lineup-slot]"))handleFormationChange(e.target).catch(err=>{console.error(err);status("Could not save formation",false);});});
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

async function init(){try{status("Opening local database");await openDatabase();if(navigator.storage&&navigator.storage.persist)try{await navigator.storage.persist();}catch(_){}setupForms();await refresh();await loadPremierLeagueFixtures();status("Local database ready");}catch(err){console.error(err);status("Local storage unavailable",false);}}
window.addEventListener("online",()=>status("Online · local data available"));window.addEventListener("offline",()=>status("Offline · local data available"));document.addEventListener("DOMContentLoaded",init);
