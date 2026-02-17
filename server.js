require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8001;
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

let supabaseAdmin = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const { createClient } = require("@supabase/supabase-js");
    supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  } catch (e) {
    console.warn("Supabase env set but @supabase/supabase-js not available:", e.message);
  }
}

app.use(cors());
// Limit mare pentru avatar + fundal custom (imagini base64 în JSON)
const bodyLimit = "50mb";
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ limit: bodyLimit, extended: true }));
app.use(express.static(__dirname));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readUsers() {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) return { users: [] };
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return { users: [] };
  }
}

function writeUsers(data) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf8");
}

function hashPassword(password) {
  const salt = process.env.PASSWORD_SALT || "taply-salt";
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function slug(str) {
  return (str || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "") || "";
}

// POST /api/register - { email, password, username }
app.post("/api/register", (req, res) => {
  const { email, password, username } = req.body || {};
  const emailTrim = (email || "").trim().toLowerCase();
  const usernameSlug = slug(username || emailTrim.split("@")[0] || "user");
  if (!emailTrim || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const data = readUsers();
  if (data.users.some((u) => u.email.toLowerCase() === emailTrim)) {
    return res.status(400).json({ error: "This email is already in use." });
  }
  if (data.users.some((u) => (u.username || "").toLowerCase() === usernameSlug)) {
    return res.status(400).json({ error: "This username is already taken." });
  }
  const token = createToken();
  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    email: emailTrim,
    passwordHash: hashPassword(password),
    username: usernameSlug,
    token,
    profile: {
      theme: "midnight",
      platforms: [],
      socialLinks: [],
      displayName: "",
      bio: "",
      avatar: null,
      links: [],
      socialUrls: {},
    },
    analytics: { pageViews: 0, linkClicks: {} },
  };
  data.users.push(user);
  writeUsers(data);
  res.json({ token, username: usernameSlug });
});

// POST /api/login - { email, password }
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  const emailTrim = (email || "").trim().toLowerCase();
  if (!emailTrim || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const data = readUsers();
  const user = data.users.find((u) => u.email.toLowerCase() === emailTrim);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  const token = createToken();
  user.token = token;
  writeUsers(data);
  res.json({ token, username: user.username });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return res.status(401).json({ error: "Trebuie să fii autentificat." });
  const data = readUsers();
  const user = data.users.find((u) => u.token === token);
  if (!user) return res.status(401).json({ error: "Sesiune invalidă. Loghează-te din nou." });
  req.user = user;
  next();
}

// GET /api/me - profilul utilizatorului curent
app.get("/api/me", authMiddleware, (req, res) => {
  const u = req.user;
  res.json({
    id: u.id,
    email: u.email,
    username: u.username,
    profile: u.profile || {},
    analytics: u.analytics || { pageViews: 0, linkClicks: {} },
  });
});

// PUT /api/me - actualizează profil
app.put("/api/me", authMiddleware, (req, res) => {
  const data = readUsers();
  const user = data.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(401).json({ error: "Utilizator negăsit." });
  if (req.body.profile) user.profile = { ...user.profile, ...req.body.profile };
  if (req.body.analytics) user.analytics = { ...user.analytics, ...req.body.analytics };
  writeUsers(data);
  res.json({ username: user.username, profile: user.profile });
});

function profileToPublicJson(username, p) {
  const socialLinks = (p.socialLinks && p.socialLinks.length > 0)
    ? p.socialLinks
    : (p.platforms || []).map((key) => ({ platform: key, url: (p.socialUrls || {})[key] || "" }));
  return {
    username,
    displayName: p.displayName || username,
    bio: p.bio || "",
    avatar: p.avatar || null,
    theme: p.theme || "midnight",
    customBackgroundImage: p.customBackgroundImage || null,
    customBackgroundPosition: p.customBackgroundPosition || "center center",
    customBackgroundZoom: typeof p.customBackgroundZoom === "number" ? p.customBackgroundZoom : 100,
    platforms: p.platforms || [],
    socialUrls: p.socialUrls || {},
    socialLinks: socialLinks,
    links: (p.links || []).map((l) => ({ id: l.id, title: l.title, url: l.url, highlight: l.highlight, type: l.type, imageUrl: l.imageUrl, icon: l.icon })),
  };
}

// GET /api/profile/:username - profil public (pentru link)
app.get("/api/profile/:username", (req, res) => {
  const username = (req.params.username || "").toLowerCase();
  res.set("Cache-Control", "no-store");

  if (supabaseAdmin) {
    supabaseAdmin.from("profiles").select("username, profile").eq("username", username).single()
      .then((result) => {
        if (result.error || !result.data) return res.status(404).json({ error: "Profile not found." });
        const p = result.data.profile || {};
        return res.json(profileToPublicJson(result.data.username, p));
      })
      .catch(() => res.status(500).json({ error: "Server error." }));
    return;
  }

  const data = readUsers();
  const user = data.users.find((u) => (u.username || "").toLowerCase() === username);
  if (!user) return res.status(404).json({ error: "Profile not found." });
  const p = user.profile || {};
  res.json(profileToPublicJson(user.username, p));
});

// POST /api/profile/:username/view - înregistrare vizualizare (opțional)
app.post("/api/profile/:username/view", (req, res) => {
  const username = (req.params.username || "").toLowerCase();

  if (supabaseAdmin) {
    supabaseAdmin.from("profiles").select("analytics").eq("username", username).single()
      .then((result) => {
        if (result.error || !result.data) return res.status(404).json({ error: "Profile not found." });
        const analytics = result.data.analytics || { pageViews: 0, linkClicks: {} };
        analytics.pageViews = (analytics.pageViews || 0) + 1;
        return supabaseAdmin.from("profiles").update({ analytics }).eq("username", username);
      })
      .then(() => res.json({ ok: true }))
      .catch(() => res.status(500).json({ error: "Server error." }));
    return;
  }

  const data = readUsers();
  const user = data.users.find((u) => (u.username || "").toLowerCase() === username);
  if (!user) return res.status(404).json({ error: "Profile not found." });
  user.analytics = user.analytics || { pageViews: 0, linkClicks: {} };
  user.analytics.pageViews = (user.analytics.pageViews || 0) + 1;
  writeUsers(data);
  res.json({ ok: true });
});

// POST /api/profile/:username/click - înregistrare click pe link
app.post("/api/profile/:username/click", (req, res) => {
  const { linkId } = req.body || {};
  const username = (req.params.username || "").toLowerCase();

  if (supabaseAdmin) {
    supabaseAdmin.from("profiles").select("analytics").eq("username", username).single()
      .then((result) => {
        if (result.error || !result.data) return res.status(404).json({ error: "Profile not found." });
        const analytics = result.data.analytics || { pageViews: 0, linkClicks: {} };
        analytics.linkClicks = analytics.linkClicks || {};
        analytics.linkClicks[linkId] = (analytics.linkClicks[linkId] || 0) + 1;
        return supabaseAdmin.from("profiles").update({ analytics }).eq("username", username);
      })
      .then(() => res.json({ ok: true }))
      .catch(() => res.status(500).json({ error: "Server error." }));
    return;
  }

  const data = readUsers();
  const user = data.users.find((u) => (u.username || "").toLowerCase() === username);
  if (!user) return res.status(404).json({ error: "Profile not found." });
  user.analytics = user.analytics || { pageViews: 0, linkClicks: {} };
  user.analytics.linkClicks = user.analytics.linkClicks || {};
  user.analytics.linkClicks[linkId] = (user.analytics.linkClicks[linkId] || 0) + 1;
  writeUsers(data);
  res.json({ ok: true });
});

function startServer(port) {
  const server = app.listen(port, () => {
    try {
      fs.writeFileSync(path.join(__dirname, ".taply-port"), String(port), "utf8");
    } catch (e) {}
    console.log("Taply running at http://localhost:" + port);
    console.log("Open in browser: http://localhost:" + port + "/landing.html");
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && port < 8010) {
      console.log("Port " + port + " in use, trying " + (port + 1) + "...");
      server.close(() => startServer(port + 1));
    } else {
      console.error(err);
      process.exit(1);
    }
  });
}
startServer(PORT);
