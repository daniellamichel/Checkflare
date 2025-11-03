// server.js
const express = require("express");
const fetch = require("node-fetch"); // npm i node-fetch@2
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static (this file + index.html live in same folder)
app.use(express.static(path.join(__dirname, "public")));

// POST endpoint to verify Turnstile token using secret key from env
app.post("/verify", async (req, res) => {
  const token = req.body["cf-turnstile-response"] || req.body.token;
  if (!token) return res.status(400).json({ success: false, reason: "missing_token" });

  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return res.status(500).json({ success: false, reason: "no_secret_configured" });

  try {
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: params,
    });
    const data = await r.json();
    // Cloudflare returns { success: true/false, ... }
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, reason: "fetch_error" });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
