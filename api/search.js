// api/search.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(200).json({ items: [] });

  const DATA_DIR = path.join(process.cwd(), "data");
  const FILES = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".txt"));

  let results = [];
  for (const file of FILES) {
    const content = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line) continue;
      const [nick, ip] = line.split(":");
      if (nick === q) {
