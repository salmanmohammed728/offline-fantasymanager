
/* =====================================
   OFFLINE FANTASY MANAGER
   Main Application
===================================== */

const DB_NAME = "OfflineFantasyManager";
const DB_VERSION = 1;

let db = null;

/* =====================================
   1. PAGE NAVIGATION
===================================== */

const pageTitles = {
    dashboard: "Dashboard",
    teams: "My Teams",
    players: "Players",
    formation: "Formation",
    transfers: "Transfers",
    matches: "Match Centre",
    history: "History",
    settings: "Settings"
};

function navigateTo(pageName) {
    const target = document.getElementById(pageName);

    if (!target || !pageTitles[pageName]) return;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
    });

    target.classList.add("active");

    const activeLink = document.querySelector(
        `.nav-link[data-page="${pageName}"]`
    );

    if (activeLink) {
        activeLink.classList.add("active");
    }

    document.getElementById("page-title").textContent =
        pageTitles[pageName];

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* Navigation event listener */

document.addEventListener("click", event => {
    const button = event.target.closest("[data-page]");

    if (!button) return;

    navigateTo(button.dataset.page);
});

/* =====================================
   2. INDEXEDDB DATABASE
===================================== */

function openDatabase() {
    return new Promise((resolve, reject) => {

        if (!window.indexedDB) {
            reject(new Error("IndexedDB is not supported."));
            return;
        }

        const request = indexedDB.open(
            DB_NAME,
            DB_VERSION
        );

        request.onupgradeneeded = event => {
            const database = event.target.result;

            if (!database.objectStoreNames.contains("teams")) {
                database.createObjectStore("teams", {
                    keyPath: "id",
                    autoIncrement: true
                });
            }

            if (!database.objectStoreNames.contains("players")) {
                database.createObjectStore("players", {
                    keyPath: "id",
                    autoIncrement: true
                });
            }

            if (!database.objectStoreNames.contains("matches")) {
                database.createObjectStore("matches", {
                    keyPath: "id",
                    autoIncrement: true
                });
            }

            if (!database.objectStoreNames.contains("activities")) {
                database.createObjectStore("activities", {
                    keyPath: "id",
                    autoIncrement: true
                });
            }

            if (!database.objectStoreNames.contains("settings")) {
                database.createObjectStore("settings", {
                    keyPath: "key"
                });
            }
        };

        request.onsuccess = event => {
            db = event.target.result;

            db.onversionchange = () => {
                db.close();
                db = null;
                updateStorageStatus(
                    "Database updated. Please refresh.",
                    false
                );
            };

            resolve(db);
        };

        request.onerror = () => {
            reject(request.error);
        };

        request.onblocked = () => {
            console.warn("Database upgrade is blocked.");
        };
    });
}

/* =====================================
   3. DATABASE HELPERS
===================================== */

function getAllRecords(storeName) {
    return new Promise((resolve, reject) => {

        if (!db) {
            reject(new Error("Database is not ready."));
            return;
        }

        const transaction = db.transaction(
            storeName,
            "readonly"
        );

        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

function saveRecord(storeName, record) {
    return new Promise((resolve, reject) => {

        if (!db) {
            reject(new Error("Database is not ready."));
            return;
        }

        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);
        const request = store.add(record);

        let recordId;

        request.onsuccess = () => {
            recordId = request.result;
        };

        transaction.oncomplete = () => {
            resolve(recordId);
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };

        transaction.onabort = () => {
            reject(transaction.error || new Error("Save cancelled."));
        };
    });
}

function updateRecord(storeName, record) {
    return new Promise((resolve, reject) => {

        if (!db) {
            reject(new Error("Database is not ready."));
            return;
        }

        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store = transaction.objectStore(storeName);
        const request = store.put(record);

        request.onsuccess = () => resolve(request.result);

        request.onerror = () => reject(request.error);
    });
}

function deleteRecord(storeName, id) {
    return new Promise((resolve, reject) => {

        if (!db) {
            reject(new Error("Database is not ready."));
            return;
        }

        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const request = transaction
            .objectStore(storeName)
            .delete(id);

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
    });
}

/* =====================================
   4. STORAGE STATUS
===================================== */

function updateStorageStatus(message, success) {
    const status = document.getElementById(
        "connection-status"
    );

    if (!status) return;

    status.textContent = success
        ? "● " + message
        : "● " + message;

    status.style.color = success
        ? "#22c55e"
        : "#f59e0b";
}

async function checkPersistentStorage() {
    if (!navigator.storage ||
        !navigator.storage.persist) {
        return;
    }

    try {
        const alreadyPersistent =
            await navigator.storage.persisted();

        if (!alreadyPersistent) {
            const granted =
                await navigator.storage.persist();

            console.log(
                "Persistent storage granted:",
                granted
            );
        }
    } catch (error) {
        console.warn(
            "Could not request persistent storage:",
            error
        );
    }
}

/* =====================================
   5. DASHBOARD
===================================== */

async function updateDashboard() {

    if (!db) return;

    try {

        const teams = await getAllRecords("teams");
        const players = await getAllRecords("players");
        const activities = await getAllRecords("activities");

        const totalPoints = teams.reduce(
            (sum, team) =>
                sum + (Number(team.totalPoints) || 0),
            0
        );

        document.getElementById("total-points").textContent =
            totalPoints.toLocaleString();

        document.getElementById("team-count").textContent =
            teams.length;

        document.getElementById("player-count").textContent =
            players.length;

        const totalBudget = teams.reduce(
            (sum, team) =>
                sum + (Number(team.budget) || 0),
            0
        );

        const budget = teams.length
            ? totalBudget
            : 100;

        document.getElementById("total-budget").textContent =
            "£" + budget.toFixed(1) + "m";

        renderMainTeam(teams);
        renderRecentActivity(activities);

    } catch (error) {
        console.error("Dashboard error:", error);
    }
}

/* =====================================
   6. MAIN TEAM DISPLAY
===================================== */

function renderMainTeam(teams) {

    const container = document.getElementById("main-team");

    if (!container) return;

    container.replaceChildren();

    if (!teams.length) {

        const message = document.createElement("div");
        message.className = "empty-state";

        const icon = document.createElement("div");
        icon.textContent = "⚽";

        const heading = document.createElement("h3");
        heading.textContent = "No team created yet";

        const description = document.createElement("p");
        description.textContent =
            "Create your first fantasy team to get started.";

        const button = document.createElement("button");
        button.className = "primary-button";
        button.textContent = "Create My Team";
        button.addEventListener("click", () => {
            navigateTo("teams");
        });

        message.append(
            icon,
            heading,
            description,
            button
        );

        container.appendChild(message);
        return;
    }

    const team = teams[0];

    const heading = document.createElement("h3");
    heading.textContent = team.name || "My Fantasy Team";

    const points = document.createElement("p");
    points.textContent =
        "Total points: " + (team.totalPoints || 0);

    container.append(heading, points);
}

/* =====================================
   7. RECENT ACTIVITY
===================================== */

function renderRecentActivity(activities) {

    const container = document.getElementById(
        "recent-activity"
    );

    if (!container) return;

    container.replaceChildren();

    if (!activities.length) {

        const message = document.createElement("div");
        message.className = "empty-state";

        const icon = document.createElement("div");
        icon.textContent = "📋";

        const description = document.createElement("p");
        description.textContent =
            "Your activities will appear here.";

        message.append(icon, description);
        container.appendChild(message);

        return;
    }

    activities
        .slice()
        .sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        )
        .slice(0, 5)
        .forEach(activity => {

            const item = document.createElement("div");

            item.style.padding = "12px 0";
            item.style.borderBottom = "1px solid #293950";

            const title = document.createElement("strong");
            title.textContent = activity.description || "Activity";

            const date = document.createElement("small");
            date.textContent = activity.date
                ? new Date(activity.date).toLocaleString()
                : "";

            date.style.display = "block";
            date.style.color = "#91a1b7";
            date.style.marginTop = "5px";

            item.append(title, date);
            container.appendChild(item);
        });
}

/* =====================================
   8. APPLICATION INITIALIZATION
===================================== */

async function initializeApp() {

    updateStorageStatus("Connecting to database...", true);

    try {

        await openDatabase();

        await checkPersistentStorage();

        await updateDashboard();

        updateStorageStatus("Local database ready", true);

        console.log(
            "Offline Fantasy Manager initialized successfully."
        );

    } catch (error) {

        console.error(
            "Application initialization failed:",
            error
        );

        updateStorageStatus("Storage unavailable", false);
    }
}

/* =====================================
   9. NETWORK STATUS
===================================== */

window.addEventListener("online", () => {
    console.log("Internet connection restored.");
});

window.addEventListener("offline", () => {
    console.log("Internet connection lost. Local data remains available.");
});

/* START APPLICATION */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);
