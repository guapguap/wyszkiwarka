import express from "express";
import fs from "fs/promises";
import path from "path";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(process.cwd(), ".")));

const DATA_DIR = path.join(process.cwd(), "data");
const FILES = (await fs.readdir(DATA_DIR)).filter(f => f.endsWith(".txt"));
const RECENT_FILE = path.join(DATA_DIR, "recent.json");

// Statystyki
let totalSearches = 0;
let onlineUsers = 0;
let recentSearches = [];

// Wczytanie ostatnich wyszukiwań z pliku
try {
  const data = await fs.readFile(RECENT_FILE, "utf8");
  recentSearches = JSON.parse(data);
} catch {
  recentSearches = [];
}

// Middleware do liczenia online users
app.use((req, res, next) => {
  onlineUsers++;
  res.on("finish", () => onlineUsers--);
  next();
});

// API statystyk
app.get("/api/stats", (req, res) => {
  res.json({ totalSearches, onlineUsers, recentSearches });
});

// API wyszukiwania
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  if (!q) return res.json({ items: [] });

  totalSearches++;
  const newSearch = { nick: q, timestamp: Date.now() };
  recentSearches.unshift(newSearch);
  if (recentSearches.length > 20) recentSearches.pop();

  // zapis do pliku
  fs.writeFile(RECENT_FILE, JSON.stringify(recentSearches, null, 2)).catch(console.error);

  let results = [];
  for (const file of FILES) {
    try {
      const content = await fs.readFile(path.join(DATA_DIR, file), "utf8");
      for (const line of content.split(/\r?\n/)) {
        if (!line) continue;
        const parts = line.split(":");
        if (parts.length < 2) continue;
        const [nick, ip] = parts;
        if (nick.toLowerCase() === q) results.push({ nick, ip, source: file });
      }
    } catch (err) {
      console.error(`Błąd przy czytaniu pliku ${file}:`, err);
    }
  }

  res.json({ items: results });
});

// API UUID
app.get("/api/uuid", async (req, res) => {
  const nick = (req.query.nick || "").trim();
  if (!nick) return res.json({ uuid: null });

  try {
    const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${nick}`);
    if (!response.ok) return res.json({ uuid: null });
    const data = await response.json();
    res.json({ uuid: data.id });
  } catch {
    res.json({ uuid: null });
  }
});

app.listen(PORT, () => console.log(`Serwer działa na http://localhost:${PORT}`));
