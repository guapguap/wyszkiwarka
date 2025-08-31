import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const API_KEY = "ErJBcG9eh8wnBR5";

function getFileMtime(file) {
  return fs.statSync(path.join(DATA_DIR, file)).mtime.getTime();
}

export default function handler(req, res) {
  const key = req.headers["x-api-key"] || req.query.key;
  if (key !== API_KEY) {
    return res.status(401).json({ error: "Nieautoryzowany dostęp" });
  }

  const q = (req.query.q || "").trim().toLowerCase();
  if (!q) return res.status(200).json({ items: [] });

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".txt"));
  const matches = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line) continue;
      const [nick, ip] = line.split(":");
      if (nick.toLowerCase() === q) {
        matches.push({ nick, ip, source: file, mtime: getFileMtime(file) });
      }
    }
  }

  if (matches.length === 0) return res.status(200).json({ items: [] });

  const newestMtime = Math.max(...matches.map(m => m.mtime));
  const newestMatches = matches.filter(m => m.mtime === newestMtime)
                               .map(({ nick, ip, source }) => ({ nick, ip, source }));

  res.status(200).json({ items: newestMatches });
}
