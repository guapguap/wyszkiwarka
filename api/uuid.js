// api/uuid.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const nick = (req.query.nick || "").trim();
  if (!nick) return res.status(200).json({ uuid: null });

  try {
    const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${nick}`);
    if (!response.ok) return res.status(200).json({ uuid: null });

    const data = await response.json();
    res.status(200).json({ uuid: data.id });
  } catch (err) {
    console.error(err);
    res.status(200).json({ uuid: null });
  }
}
