import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILES = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".txt"));
const API_KEY = "ErJBcG9eh8wnBR5";

export default function handler(req, res) {
  const key = req.headers["x-api-key"] || req.query.key;
  if (key !== API_KEY) {
    return res.status(401).json({ error: "Nieautoryzowany dostęp" });
  }

  const q = (req.query.q || "").trim().toLowerCase();
  if (!q) return res.status(200).json({ items: [] });

  const results = [];
  for (const file of FILES) {
    const content = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line) continue;
      const [nick, ip] = line.split(":");
      if (nick.toLowerCase() === q) {
        results.push({ nick, ip, source: file });
      }
    }
  }

  res.status(200).json({ items: results });
}
