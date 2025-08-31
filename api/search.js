import fs from "fs";
import path from "path";
import express from "express";

const app = express();
const PORT = 3000;

const API_KEY = "ErJBcG9eh8wnBR5";

const DATA_DIR = path.join(process.cwd(), "data");
const FILES = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".txt"));

app.get("/api/search", (req, res) => {
  const key = req.headers["x-api-key"] || req.query.key;
  if (key !== API_KEY) {
    return res.status(401).json({ error: "Nieautoryzowany dostęp" });
  }

  const q = (req.query.q || "").trim();
  if (!q) return res.json({ items: [] });

  const results = [];
  for (const file of FILES) {
    const content = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line) continue;
      const [nick, ip] = line.split(":");
      if (nick === q) {
        results.push({ nick, ip, source: file });
      }
    }
  }

  res.json({ items: results });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
