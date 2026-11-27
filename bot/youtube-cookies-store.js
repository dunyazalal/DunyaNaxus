const fs = require("fs");
const path = require("path");
const { writeFileAtomic } = require("./atomic-file");

const DEFAULT_COOKIES_PATH = path.join(__dirname, "data", "youtube-cookies.json");

// YouTube cookies come from a browser extension export (array of cookie
// objects) and are written to a Netscape cookies.txt file for yt-dlp.
function toNetscape(cookies) {
  const lines = ["# Netscape HTTP Cookie File"];
  for (const c of cookies) {
    if (!c || !c.name || c.value === undefined || !c.domain) continue;
    const domain = c.domain.startsWith(".") ? c.domain : c.domain;
    const expiry = Number.isFinite(c.expirationDate)
      ? Math.floor(c.expirationDate)
      : 0;
    const secure = c.secure ? "TRUE" : "FALSE";
    const httpOnly = c.httpOnly ? "TRUE" : "FALSE";
    lines.push(
      [domain, "TRUE", c.path || "/", secure, expiry, c.name, String(c.value)].join("\t"),
    );
  }
  return lines.join("\n") + "\n";
}

function validateCookies(input) {
  if (!Array.isArray(input)) return { ok: false, error: "invalid_format" };
  const valid = input.filter((c) => c && c.name && c.value !== undefined && c.domain);
  const hasSID = valid.some((c) => /SID$/i.test(c.name) || c.name === "SID");
  if (!valid.length || !hasSID) return { ok: false, error: "missing_login_cookies" };
  return { ok: true, cookies: valid };
}

function createYoutubeCookiesStore(filePath = DEFAULT_COOKIES_PATH) {
  const resolved = path.resolve(filePath);

  function read() {
    try {
      return JSON.parse(fs.readFileSync(resolved, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("[يوت] تعذر قراءة كوكيز يوتيوب:", error.message);
      }
      return null;
    }
  }

  return {
    isSet() {
      const saved = read();
      return Array.isArray(saved) && saved.length > 0;
    },

    set(input) {
      const check = validateCookies(input);
      if (!check.ok) return check;
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      writeFileAtomic(resolved, JSON.stringify(check.cookies, null, 2));
      try {
        fs.chmodSync(resolved, 0o600);
      } catch {}
      return { ok: true, count: check.cookies.length };
    },

    clear() {
      try {
        fs.unlinkSync(resolved);
      } catch (error) {
        if (error.code !== "ENOENT") return { ok: false, error: error.message };
      }
      return { ok: true };
    },

    // Returns a ready cookies.txt file path for yt-dlp, or null.
    toNetscapeFile(targetPath) {
      const saved = read();
      if (!Array.isArray(saved) || !saved.length) return null;
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, toNetscape(saved), { mode: 0o600 });
      return targetPath;
    },
  };
}

module.exports = { createYoutubeCookiesStore, toNetscape, validateCookies };
