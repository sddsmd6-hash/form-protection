const express = require("express");
const fetch = require("node-fetch");
const app = express();
app.use(express.json());

const FORMSPARK_URL = "https://submit-form.com/fgVjZdPpw";
const MIN_HUMAN_TIME_MS = 800;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const ipMap = new Map();

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return req.ip || "unknown";
}

app.post("/api/submit", async (req, res) => {
  try {
    const ip = getClientIp(req);
    const { phone, hp_field, tsStart } = req.body;

    if (hp_field) return res.status(400).send("Bot detected");
    const timeTaken = Date.now() - Number(tsStart || 0);
    if (timeTaken < MIN_HUMAN_TIME_MS) return res.status(400).send("Too fast");

    const now = Date.now();
    const record = ipMap.get(ip) || { count: 0, start: now };
    if (now - record.start > WINDOW_MS) {
      record.count = 1;
      record.start = now;
    } else {
      record.count++;
      if (record.count > MAX_PER_WINDOW) return res.status(429).send("Too many requests");
    }
    ipMap.set(ip, record);

    await fetch(FORMSPARK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    res.status(200).send("OK ✅");
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));