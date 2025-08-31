const input = document.getElementById("searchInput");
const btn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const recentDiv = document.getElementById("recent");
const loadingDiv = document.getElementById("loading");

let recent = [];
const lockedFields = new WeakMap(); // każda karta ma swój lock dla pól
const activeNotifications = []; // wszystkie aktywne powiadomienia

btn.addEventListener("click", async () => {
  const q = input.value.trim();
  if (!q) return;
  await searchNick(q);
});

input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const q = input.value.trim();
    if (!q) return;
    await searchNick(q);
  }
});

async function searchNick(nickInput) {
  // Pokaż loading
  loadingDiv.style.display = "flex";

  try {
    const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(nickInput)}`);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      showPopup("Nie znaleziono gracza!");
      resultsDiv.innerHTML = "";
      return;
    }

    const grouped = groupResults(data.items);
    renderResults(grouped);

    const correctNick = data.items[0].nick;
    recent.unshift(correctNick);
    recent = [...new Set(recent)].slice(0, 5);
    renderRecent();

  } catch (err) {
    showPopup("Błąd połączenia z API!");
    console.error(err);
  } finally {
    loadingDiv.style.display = "none";
  }
}

function groupResults(items) {
  const map = {};
  items.forEach(item => {
    if (!map[item.ip]) map[item.ip] = { ip: item.ip, nicks: [], sources: [] };
    if (!map[item.ip].nicks.includes(item.nick)) map[item.ip].nicks.push(item.nick);
    const sourceName = item.source.replace(".txt", "").toUpperCase();
    if (!map[item.ip].sources.includes(sourceName)) map[item.ip].sources.push(sourceName);
  });
  return Object.values(map);
}

function renderResults(items) {
  resultsDiv.innerHTML = "";
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    lockedFields.set(card, {}); // inicjalizacja locków dla pól w tej karcie

    const fields = [
      { label: "NAZWA", value: item.nicks[0] },
      { label: "IP", value: item.ip },
      { label: "ŹRÓDŁO", value: item.sources.join(", ") }
    ];

    fields.forEach(f => {
      const label = document.createElement("label");
      label.textContent = f.label;
      card.appendChild(label);

      const div = document.createElement("div");
      div.className = "value";

      const button = document.createElement("button");
      button.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M9 2h7v4h4v10h-3v1h4V4.6L17.4 1H8v5h1zm8 0h.31L20 4.69V5h-3zM5 19h7v1H5zm-2 4h13V10.6L12.4 7H3zm9-15h.31L15 10.69V11h-3zM4 8h7v4h4v10H4zm1 5h9v1H5zm4 3h5v1H5v-1z"/><path fill="none" d="M0 0h24v24H0z"/></svg>`;

      button.addEventListener("click", () => {
        copyField(card, f.label, f.value, button, 0.1);
      });

      div.innerHTML = `<span>${f.value}</span>`;
      div.appendChild(button);
      card.appendChild(div);
    });

    resultsDiv.appendChild(card);
  });
}

function copyField(card, fieldName, text, button, whiteDuration = 0.1) {
  const cardLocks = lockedFields.get(card);
  if (cardLocks[fieldName]) return; // jeśli pole aktywne -> ignoruj
  cardLocks[fieldName] = true;

  navigator.clipboard.writeText(text);

  // Kolor svg tylko klikniętego przycisku
  const svg = button.querySelector("svg");
  svg.style.fill = "#fff";
  setTimeout(() => { svg.style.fill = "#7c3aed"; }, whiteDuration * 1000);

  const notif = document.createElement("div");
  notif.className = "copy-notification";
  notif.innerHTML = `<span style="display:block; text-align:center;">Skopiowano pomyślnie!</span><div class='progress'></div>`;
  document.body.appendChild(notif);

  activeNotifications.push({ notif, card, fieldName });
  updateNotificationPositions();
  setTimeout(() => notif.classList.add("show"), 50);

  const duration = 1800;
  setTimeout(() => {
    notif.classList.remove("show");
    setTimeout(() => {
      notif.remove();
      cardLocks[fieldName] = false;
      const index = activeNotifications.findIndex(a => a.notif === notif);
      if (index > -1) activeNotifications.splice(index, 1);
      updateNotificationPositions();
    }, 300);
  }, duration);
}

function updateNotificationPositions() {
  activeNotifications.forEach((item, index) => {
    item.notif.style.top = `${20 + index * 60}px`;
  });
}

function showPopup(msg) {
  const popup = document.createElement("div");
  popup.className = "card";
  popup.style.width = "300px";
  popup.style.textAlign = "center";
  popup.style.background = "rgba(255,0,0,0.2)";
  popup.textContent = msg;
  resultsDiv.innerHTML = "";
  resultsDiv.appendChild(popup);
  setTimeout(() => popup.remove(), 3000);
}

function renderRecent() {
  recentDiv.innerHTML = "";
  recent.forEach(nick => {
    const div = document.createElement("div");
    div.className = "nick clickable";

    const img = document.createElement("img");
    img.className = "avatar";
    img.src = "steve.png";

    fetch(`http://localhost:3000/api/uuid?nick=${encodeURIComponent(nick)}`)
      .then(res => res.json())
      .then(data => {
        if (data.uuid) img.src = `https://crafatar.com/avatars/${data.uuid}?size=32&overlay`;
      }).catch(() => {});

    const span = document.createElement("span");
    span.textContent = nick;

    div.appendChild(img);
    div.appendChild(span);

    div.addEventListener("click", () => {
      input.value = nick;
      searchNick(nick);
    });

    recentDiv.appendChild(div);
  });
}
