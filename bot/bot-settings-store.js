const fs = require("fs");
const path = require("path");
const { writeFileAtomic } = require("./atomic-file");

const DEFAULT_SETTINGS = {
  admins: ["100078389536244"],
  botNickname: "⋯⌁⟖ 𝒁𝑬𝑫 𝑯𝑬𝑳𝑳𝑲𝑰𝑵𝑮 𝑩𝑶𝑻 ⃞⃟ ❞ ⟕⌁⋯",
};

function normalizeAdminID(value) {
  const id = String(value || "")
    .replace(/(?:fb)?id[:.]/iu, "")
    .replace(/\D/g, "")
    .trim();
  return id || null;
}

function createBotSettingsStore(filePath) {
  let data = { admins: [...DEFAULT_SETTINGS.admins], botNickname: DEFAULT_SETTINGS.botNickname };

  function load() {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.admins)) {
        const ids = parsed.admins.map(normalizeAdminID).filter(Boolean);
        data.admins = ids.length ? [...new Set(ids)] : [...DEFAULT_SETTINGS.admins];
      }
      if (typeof parsed.botNickname === "string" && parsed.botNickname.trim()) {
        data.botNickname = parsed.botNickname;
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("[settings] تعذر قراءة ملف الإعدادات:", error.message);
      }
    }
  }

  function persist() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileAtomic(filePath, JSON.stringify(data, null, 2));
  }

  load();

  return {
    getAdmins() {
      return [...data.admins];
    },

    setAdmins(ids) {
      const cleaned = [...new Set(ids.map(normalizeAdminID).filter(Boolean))];
      if (!cleaned.length) return { ok: false, error: "invalid_admins" };
      data.admins = cleaned;
      persist();
      return { ok: true, admins: [...data.admins] };
    },

    getNickname() {
      return data.botNickname;
    },

    setNickname(text) {
      const clean = String(text || "").trim();
      if (!clean) return { ok: false, error: "invalid_nickname" };
      data.botNickname = clean.slice(0, 200);
      persist();
      return { ok: true, botNickname: data.botNickname };
    },
  };
}

module.exports = { createBotSettingsStore, DEFAULT_SETTINGS };
