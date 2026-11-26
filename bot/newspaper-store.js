const fs = require("fs");
const path = require("path");
const { writeFileAtomic } = require("./atomic-file");

const DEFAULT_NEWSPAPER_PATH = path.join(__dirname, "data", "newspaper.json");
const PER_BOT_DIR = path.join(path.dirname(DEFAULT_NEWSPAPER_PATH), "newspaper-per-bot");

const sharedStores = new Map();
const perBotStores = new Map();

function createNewspaperStore(filePath) {
  const resolvedPath = path.resolve(filePath);
  let currentText = null;
  let writeNumber = 0;

  if (fs.existsSync(resolvedPath)) {
    const saved = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
    if (typeof saved.text !== "string" || !saved.text.trim()) {
      throw new Error("Saved newspaper must contain non-empty text.");
    }
    currentText = saved.text;
  }

  return {
    get() {
      return currentText;
    },

    set(text) {
      if (typeof text !== "string" || !text.trim()) {
        throw new Error("Newspaper text cannot be empty.");
      }

      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
      const temporaryPath = `${resolvedPath}.${process.pid}.${++writeNumber}.tmp`;
      try {
        fs.writeFileSync(
          temporaryPath,
          JSON.stringify({ text }, null, 2),
          "utf8",
        );
        fs.renameSync(temporaryPath, resolvedPath);
      } catch (error) {
        try {
          fs.unlinkSync(temporaryPath);
        } catch {}
        throw error;
      }

      currentText = text;
      return currentText;
    },
  };
}

function getSharedNewspaperStore(filePath = DEFAULT_NEWSPAPER_PATH) {
  const resolvedPath = path.resolve(filePath);
  if (!sharedStores.has(resolvedPath)) {
    sharedStores.set(resolvedPath, createNewspaperStore(resolvedPath));
  }
  return sharedStores.get(resolvedPath);
}

// Per-bot override store: text set here is used only by the bot whose ID it
// was saved under; bots without their own file fall back to the shared text.
function getBotNewspaperStore(botID) {
  const key = String(botID || "").trim();
  if (!key || !/^\d+$/.test(key)) return null;
  if (!perBotStores.has(key)) {
    perBotStores.set(
      key,
      createNewspaperStore(path.join(PER_BOT_DIR, `${key}.json`)),
    );
  }
  return perBotStores.get(key);
}

module.exports = {
  createNewspaperStore,
  getSharedNewspaperStore,
  getBotNewspaperStore,
};
